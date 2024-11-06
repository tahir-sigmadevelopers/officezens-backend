import app from "./app.js";
import { connectDB } from "./database/db.js";
import { config } from "dotenv";
import cloudinary from 'cloudinary'
// Handling Uncaught Exception
process.on("uncaughtException", (err) => {
  console.log(`Error : ${err.message}`);
  console.log("Shutting Down Due to unHandled Promise Rejection");
  process.exit(1);
});

config({ path: "./config.env" });
connectDB();

cloudinary.config({ 
  cloud_name: process.env.cloud_name, 
  api_key: process.env.api_key, 
  api_secret: process.env.api_secret 
});


const server = app.listen(process.env.PORT, () => {
 
  console.log(`Server is Running on PORT : ${process.env.PORT}`);
});



// unhandledRejection Prmise Rejection
process.on("unhandledRejection", (err) => {
  console.log(`Error : ${err.message}`);
  console.log("Shutting Down Due to unHandled Promise Rejection");

  server.close(() => {
    process.exit(1);
  });
});
