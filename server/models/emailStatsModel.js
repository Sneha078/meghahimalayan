import mongoose from "mongoose";

/*
 * Tracks how many marketing emails were sent per day.
 *
 * Free Gmail accounts cap at ~500 emails/day. This single-document
 * counter persists that number in MongoDB so the cap is respected
 * even across server restarts and multiple cron runs.
 *
 * `date` is the calendar day in Asia/Kathmandu (YYYY-MM-DD).
 */
const emailStatsSchema = new mongoose.Schema({
  key: {
    type: String,
    default: "global",
    unique: true,
  },

  date: {
    type: String,
    required: true,
  },

  sent: {
    type: Number,
    default: 0,
  },
});

const EmailStat = mongoose.model("EmailStat", emailStatsSchema);

export default EmailStat;