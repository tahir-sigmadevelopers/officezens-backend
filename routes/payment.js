import express from "express";
import isAuthenticated from "../middlewares/auth.js";
import { processPayment, sendStripeApiKey } from "../controllers/payment.js";

const router = express.Router();


router.post("/process", processPayment);
router.get("/stripeapikey", sendStripeApiKey);



export default router;