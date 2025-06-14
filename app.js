import express, { urlencoded } from "express";
import userRoutes from "./routes/user.js";
import productRoutes from "./routes/product.js";
import orderRoutes from "./routes/order.js";
import { ErrorMiddlerware } from "./middlewares/Error.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import fileUpload from "express-fileupload";
import crypto from "crypto";
const app = express();

// using Middlewares
app.use(cookieParser());
// Increase JSON payload limit
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(fileUpload());
// using Middlewares
app.use(
  cors({
    credentials: true,
    origin: ["https://www.relaxchair.pk", "https://ecommercewithmern.netlify.app", "http://localhost:5173", "https://officezens.vercel.app", "http://relaxchair.pk"],
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);

app.use("/api/v1/user", userRoutes);
app.use("/api/v1/product", productRoutes);
app.use("/api/v1/order", orderRoutes);

app.post("/api/jazzcash-payment", async (req, res) => {
  try {
    // Your JazzCash payment logic here
    res.status(200).json({
      pp_ResponseCode: "000",
      pp_ResponseMessage: "Payment Successful",
    });
  } catch (error) {
    res.status(500).json({
      pp_ResponseCode: "999",
      pp_ResponseMessage: "Payment Failed",
    });
  }
});

// api Routes -- Home Page
app.get("/", (req, res) => {
  res.send("API is running...");
});

// using ErrorMiddlerware
app.use(ErrorMiddlerware);

export default app;
