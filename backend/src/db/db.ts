import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.DATABASE_URL}`
    );
    console.log(
      "DB connected successfully" + connectionInstance.connection.host
    );
  } catch (error) {
    console.log(error);
    throw error;
  }
};