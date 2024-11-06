import express, { urlencoded } from "express";
import userRoutes from "./routes/user.js";
import productRoutes from "./routes/product.js";
import orderRoutes from "./routes/order.js";
import paymentRoutes from "./routes/payment.js";
import { ErrorMiddlerware } from "./middlewares/Error.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import fileUpload from "express-fileupload";
const app = express();

// using Middlewares
app.use(cookieParser());
app.use(express.json());
app.use(urlencoded({ extended: true }));
app.use(fileUpload());
// using Middlewares
app.use(
  cors({
    // credentials: true,
    origin: ["https://ecommercewithmern.netlify.app", "http://localhost:5173", "https://officezens.vercel.app"],
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);

app.use("/api/v1/user", userRoutes);
app.use("/api/v1/product", productRoutes);
app.use("/api/v1/order", orderRoutes);
app.use("/api/v1/payment", paymentRoutes);
// api Routes -- Home Page
app.get("/", (req, res) => {
  res.send("<h1>Hello World, Server is Working😀😎😍.<h1/>");
});

// using ErrorMiddlerware
app.use(ErrorMiddlerware);

export default app;
