const mongoose = require("mongoose");

// Connects to MongoDB using the URI supplied in the .env file.
// The process exits if the connection fails, since the API is useless without a DB.
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (err) {
    console.error(`MongoDB connection error: ${err.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
