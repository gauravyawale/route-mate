import Razorpay from "razorpay";
import { config } from "../../config";

// Single Razorpay instance shared across the app
// Razorpay SDK handles its own connection pooling internally

export const razorpay = new Razorpay({
  key_id: config.RAZORPAY_KEY_ID,
  key_secret: config.RAZORPAY_KEY_SECRET,
});
