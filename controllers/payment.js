import Stripe from "stripe";
import ErrorHandler from "../middlewares/Error.js";

// Initialize the Stripe client with your API key
// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const stripe = new Stripe("sk_test_51NUfEASJnWbzaYvUILrpsUnV77HIInzvub6hGeP9l1aVOp9kUVuTcyEvGd7QVHKc7i2FfZRvhFbCfwFweFAr533l00OUBPGRTn");


export const processPayment = async (req, res, next) => {
  try {
    const { amount } = req.body;
    console.log(amount);


    const paymentIntent = await stripe.paymentIntents.create({
      amount: Number(amount), // Amount in smallest currency unit
      currency: "inr",
      // confirm: true, // Automatically confirm the payment
    });

    console.log("Generated Payment Intent:", paymentIntent.client_secret);

    if (!paymentIntent) {
      console.error("Failed to create paymentIntent");
      return res.status(500).json({ success: false, message: "Payment initialization failed" });
    }


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
