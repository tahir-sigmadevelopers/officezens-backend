import Stripe from "stripe";
import ErrorHandler from "../middlewares/Error.js";

// Initialize the Stripe client with your API key
// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const stripe = new Stripe("sk_test_51NUfEASJnWbzaYvUILrpsUnV77HIInzvub6hGeP9l1aVOp9kUVuTcyEvGd7QVHKc7i2FfZRvhFbCfwFweFAr533l00OUBPGRTn");


export const processPayment = async (req, res, next) => {
  try {
    const { amount } = req.body;

    // Create a payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "inr",
      description: "Payment for order on ECOMMERCE-MERN",
      metadata: {
        company: "ECOMMERCE-MERN",
      },
    });
    res
      .status(200)
      .json({ success: true, client_secret: paymentIntent.client_secret });
  } catch (error) {
    return next(new ErrorHandler(error, 500));
  }
};


export const sendStripeApiKey = async (req, res, next) => {
  try {
    res
      .status(200)
      .json({ success: true, stripeApiKey: process.env.STRIPE_API_KEY });
  } catch (error) {
    return next(new ErrorHandler(error, 500));
  }
};
