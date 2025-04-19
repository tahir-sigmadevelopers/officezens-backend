import express, { urlencoded } from "express";
import userRoutes from "./routes/user.js";
import productRoutes from "./routes/product.js";
import orderRoutes from "./routes/order.js";
import paymentRoutes from "./routes/payment.js";
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
    // credentials: true,
    origin: ["https://www.relaxchair.pk", "https://ecommercewithmern.netlify.app", "http://localhost:5173", "https://officezens.vercel.app", "http://relaxchair.pk"],
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);

app.use("/api/v1/user", userRoutes);
app.use("/api/v1/product", productRoutes);
app.use("/api/v1/order", orderRoutes);
app.use("/api/v1/payment", paymentRoutes);




app.post("/api/jazzcash-payment", async (req, res) => {
  const { amount, orderId } = req.body;

  const merchantID = "MC148473";
  const integritySalt = "zc8b061ufa";

  const formattedDate = new Date()
    .toISOString()
    .replace(/[-:.TZ]/g, "")
    .slice(0, 14);

  const transactionData = {
    pp_Version: "1.1",
    pp_TxnType: "MWALLET",
    pp_Password: "0dx3y92gez",
    pp_Language: "EN",
    pp_MerchantID: merchantID,
    pp_TxnRefNo: `T${formattedDate}`,
    pp_Amount: amount * 100, // Convert to paisa
    pp_TxnCurrency: "PKR",
    pp_TxnDateTime: formattedDate,
    pp_BillReference: "bill123",
    pp_Description: "Test Payment",
    pp_ReturnURL: "https://officezens.vercel.app",
    ppmpf_1: orderId || "Order123", // Ensure this field is included
    ppmpf_2: "N/A", // Optional
    ppmpf_3: "N/A", // Optional
    ppmpf_4: "N/A", // Optional
    ppmpf_5: "N/A", // Optional
  };

  // Generate Secure Hash
  let stringToHash = Object.entries(transactionData)
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  stringToHash += `&${integritySalt}`;

  const secureHash = crypto.createHash("sha256").update(stringToHash).digest("hex").toUpperCase();

  transactionData.pp_SecureHash = secureHash;

  try {
    const response = await fetch("https://sandbox.jazzcash.com.pk/ApplicationAPI/API/Payment/DoTransaction", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(transactionData),
    });

    const data = await response.json();
    console.log("JazzCash Response:", data);

    res.json(data);
  } catch (error) {
    console.error("Error while sending data to JazzCash:", error);
    res.status(500).json({ error: "Payment failed", details: error.message });
  }
});


// api Routes -- Home Page
app.get("/", (req, res) => {
  res.send("<h1>Hello World, Server is Working😀😎😍.<h1/>");
});

// using ErrorMiddlerware
app.use(ErrorMiddlerware);

export default app;
