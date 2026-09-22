import cron from "node-cron";
import Product from "../models/productModel.js";
import User from "../models/userModel.js";
import EmailStat from "../models/emailStatsModel.js";
import { sendNewArrivalsEmail } from "../services/emailService.js";

/*
 * New Arrivals marketing campaign.
 *
 * Every 6 hours (configurable) this job:
 *   1. Finds products flagged isNewArrival but never emailed yet.
 *   2. Picks the latest few (NEW_ARRIVALS_MAX_PRODUCTS).
 *   3. Recipients = active, non-deleted customers who opted in.
 *   4. Sends one email per recipient in small batches:
 *        NEW_ARRIVAL_BATCH_SIZE (default 25) emails together,
 *        a short pause, then the next batch — never all at once.
 *   5. Respects the free-Gmail daily quota
 *      (NEW_ARRIVAL_DAILY_LIMIT, default 250).
 *   6. Only after every eligible recipient has been emailed are the
 *      products marked `newArrivalNotified = true`, so the next cron
 *      run never re-sends the same products to the same users.
 *
 * If the daily quota is exhausted mid-campaign, the products stay
 * un-notified and the remaining recipients get the email on the next run.
 */

const MAX_PRODUCTS_PER_EMAIL =
  Number(process.env.NEW_ARRIVALS_MAX_PRODUCTS) || 4;

const DAILY_EMAIL_LIMIT =
  Number(process.env.NEW_ARRIVAL_DAILY_LIMIT) || 250;

const BATCH_SIZE =
  Number(process.env.NEW_ARRIVAL_BATCH_SIZE) || 25;

const BATCH_DELAY_MS =
  Number(process.env.NEW_ARRIVAL_BATCH_DELAY_MS) || 3000;

const sleep = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

const kathmanduDay = () => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kathmandu",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  return parts.replace(/\//g, "-"); // YYYY-MM-DD
};

const getSentToday = async () => {
  const doc = await EmailStat.findOne({
    key: "global",
    date: kathmanduDay(),
  });

  return doc?.sent || 0;
};

const addSentToday = async (count) => {
  // Upsert by `key` only (unique index is on `key`). If today is a new
  // day than the stored one, reset the baseline to just this run's count.
  const today = kathmanduDay();

  const doc = await EmailStat.findOneAndUpdate(
    { key: "global" },
    {
      $inc: { sent: count },
      $setOnInsert: { date: today },
    },
    { upsert: true, new: true }
  );

  if (doc.date !== today) {
    doc.sent = count;
    doc.date = today;
    await doc.save();
  }

  return doc.sent;
};

export const runNewArrivalsJob = async () => {
  try {
    const products = await Product.find({
      isNewArrival: true,
      newArrivalNotified: false,
      isOutOfStock: { $ne: true },
    })
      .sort("-createdAt")
      .limit(MAX_PRODUCTS_PER_EMAIL)
      .lean();

    if (products.length === 0) {
      return { sent: 0, reason: "no un-notified new arrivals" };
    }

    const users = await User.find({
      role: "user",
      isActive: true,
      isDeleted: { $ne: true },
      marketingOptIn: true,
    })
      .select("name email")
      .lean();

    if (users.length === 0) {
      return { sent: 0, reason: "no opted-in recipients" };
    }

    const sentToday = await getSentToday();
    const remaining = Math.max(
      0,
      DAILY_EMAIL_LIMIT - sentToday
    );

    if (remaining <= 0) {
      console.warn(
        `[newArrivals] Daily email quota reached (${sentToday}/${DAILY_EMAIL_LIMIT}). Rerunning later.`
      );
      return { sent: 0, reason: "daily quota reached" };
    }

    // If there are more users than today's remaining quota, only email
    // the first slice now; the rest wait for the next run.
    const recipients = users.slice(0, remaining);
    const truncatedByQuota =
      recipients.length < users.length;

    let attempted = 0;
    let failed = 0;

    // Send recipients in small batches: send a batch together, take a
    // short break, then send the next batch. Prevents a sudden burst of
    // SMTP traffic to Gmail.
    for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
      const batch = recipients.slice(i, i + BATCH_SIZE);

      const results = await Promise.allSettled(
        batch.map((user) =>
          sendNewArrivalsEmail(user, products)
        )
      );

      results.forEach((result, index) => {
        if (result.status === "rejected") {
          failed++;
          console.error(
            `[newArrivals] Email failed for ${batch[index].email}:`,
            result.reason?.message || result.reason
          );
        } else {
          attempted++;
        }
      });

      if (i + BATCH_SIZE < recipients.length) {
        await sleep(BATCH_DELAY_MS);
      }
    }

    await addSentToday(attempted);

    // Full campaign completed → these products never email again.
    if (!truncatedByQuota) {
      await Product.updateMany(
        { _id: { $in: products.map((p) => p._id) } },
        { $set: { newArrivalNotified: true } }
      );
    }

    return {
      sent: attempted,
      failed,
      products: products.length,
      notified: !truncatedByQuota,
    };
  } catch (err) {
    console.error("[newArrivals] Job failed:", err?.message || err);
    return { sent: 0, error: err?.message || String(err) };
  }
};

export const startNewArrivalsJob = () => {
  const schedule =
    process.env.NEW_ARRIVALS_CRON || "0 */6 * * *";

  cron.schedule(schedule, async () => {
    const result = await runNewArrivalsJob();

    console.log("[newArrivals] Job ran:", result);
  });

  // Also catch up immediately on server start — safe because
  // newArrivalNotified prevents any double-send.
  runNewArrivalsJob().then((result) => {
    console.log("[newArrivals] Catch-up run:", result);
  });
};