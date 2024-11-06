// proxyServer.js

import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";

const app = express();

// Proxy requests to Vercel backend
app.use(
  "/api",
  createProxyMiddleware({
    target: "https://ecommerce-mern-beryl.vercel.app", // Replace with your actual backend URL on Vercel
    changeOrigin: true,
    onProxyReq: (proxyReq, req, res) => {
      proxyReq.setHeader("origin", "http://localhost:3000"); // Set the 'origin' header to the frontend's URL
    },
    onError: (err, req, res) => {
      // Handle proxy errors, if needed
      console.error("Proxy Error:", err);
      res.status(500).send("Proxy Error");
    },
  })
);

const PORT = 3000; // You can choose any available port for the proxy server
app.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`);
});
