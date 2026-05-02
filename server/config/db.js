const mongoose = require("mongoose");
const env = require("./env");

// Connection event handlers for visibility
mongoose.connection.on("connected", () =>
  console.log("✅ MongoDB connected")
);
mongoose.connection.on("disconnected", () =>
  console.warn("⚠️  MongoDB disconnected — will auto-reconnect")
);
mongoose.connection.on("error", (err) =>
  console.error("❌ MongoDB error:", err.message)
);

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(env.MONGO_URI, {
      serverSelectionTimeoutMS: 15000,
      // Disable TLS for local Docker development
      tls: env.NODE_ENV === "production",
    });
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);

    // Apply critical indexes
    mongoose.connection.once("open", async () => {
      try {
        const db = mongoose.connection.db;
        // These are defined in the models themselves via schema index()
        console.log("📦 Database indexes applied via Mongoose schemas");
      } catch (err) {
        console.error("Index creation error:", err.message);
      }
    });
  } catch (err) {
    console.error(`❌ MongoDB connection error: ${err.message}`);
    console.warn("Continuing without database connection; retrying in background");
    // Do not exit the process here. Allow the server to start and let
    // mongoose handle reconnection attempts according to its internal logic.
    return;
  }
};

module.exports = connectDB;
