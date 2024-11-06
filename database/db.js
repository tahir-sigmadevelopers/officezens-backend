import mongoose from "mongoose";

export const connectDB = () => {
  mongoose    .connect(process.env.MONGO_URL,{
    useUnifiedTopology: true,
    useNewUrlParser: true
  })
    .then(() => {
      console.log("DB Connected");
    })
    .catch((err) => {
      console.log("DB Not Connected" + " " + err);
    });
};

