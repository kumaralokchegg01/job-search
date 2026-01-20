import mongoose from "mongoose";
import Debug from "debug";

const log = Debug("jobintel:db");

let inMemoryServer: any = null;

export async function connectDB(mongoUri?: string) {
  // PRIORITY: Use MongoDB Atlas if URI is provided
  if (mongoUri) {
    try {
      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });
      log("✅ Connected to MongoDB Atlas");
      console.log("✅ Using MongoDB Atlas for data persistence");
      return;
    } catch (err: any) {
      log("❌ Failed to connect to MongoDB Atlas:", err?.message || err);
      console.error("❌ Failed to connect to MongoDB Atlas:", err?.message);
      // Only try in-memory if explicitly allowed
      const allowFallback = process.env.USE_INMEM === "true";
      if (!allowFallback) {
        throw new Error(`Cannot connect to MongoDB Atlas: ${err?.message || err}`);
      }
      log("⚠️ Falling back to in-memory MongoDB because USE_INMEM=true");
    }
  } else {
    // No URI provided
    if (process.env.NODE_ENV === "production") {
      throw new Error("MONGODB_URI is required in production environment");
    }
    // In development without URI, use in-memory only if not prohibited
    if (process.env.USE_INMEM === "false") {
      throw new Error("MONGODB_URI must be provided (USE_INMEM cannot be disabled without a URI)");
    }
  }

  // FALLBACK: Use in-memory MongoDB only if allowed
  if (process.env.USE_INMEM === "false") {
    throw new Error("Refusing to start in-memory MongoDB (USE_INMEM=false)");
  }

  try {
    // lazy import so package is optional
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { MongoMemoryServer } = require("mongodb-memory-server");
    inMemoryServer = await MongoMemoryServer.create();
    const uri = inMemoryServer.getUri();
    await mongoose.connect(uri);
    log("⚠️ Connected to in-memory MongoDB (fallback mode)");
    console.warn("⚠️ Using in-memory MongoDB - data will NOT persist after restart!");
  } catch (err) {
    log("Failed to start in-memory MongoDB:", err);
    throw err;
  }
}

export async function stopInMemory() {
  if (mongoose.connection.readyState) await mongoose.disconnect();
  if (inMemoryServer) await inMemoryServer.stop();
}
