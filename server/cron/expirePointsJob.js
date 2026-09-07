import cron from "node-cron"; // npm install node-cron
import { expirePoints } from "../services/pointsService.js";

// Runs every day at 2:00 AM server time
function startExpiryJob() {
  cron.schedule("0 2 * * *", async () => {
    try {
      const count = await expirePoints();
      if (count > 0) console.log(`[points] Expired ${count} point batches`);
    } catch (err) {
      console.error("[points] Expiry job failed:", err);
    }
  });
}

export default startExpiryJob;

// In your server.js/index.js, after connectDB() succeeds:
//   import startExpiryJob from "./cron/expirePointsJob.js";
//   startExpiryJob();