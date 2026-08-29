import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const uri = process.env.MONGODB_URI;
const username = process.env.MONGODB_USERNAME;
const password = process.env.MONGODB_PASS;

let db = null;

if (uri || (username && password)) {
    const connectionString =
        uri ||
        `mongodb+srv://${username}:${password}@acm-backend.jbgki1q.mongodb.net/?retryWrites=true&w=majority&appName=acm-backend`;
    const client = new MongoClient(connectionString);

    try {
        const conn = await client.connect();
        db = conn.db("acm-backend");
        console.log("Connected to MongoDB");
    } catch (e) {
        console.error("MongoDB connection failed:", e.message);
        console.warn("Certificate generation still works with the local store.");
    }
} else {
    console.warn(
        "MongoDB env not set (MONGODB_URI or MONGODB_USERNAME + MONGODB_PASS). Skipping DB connection. Certificate generation still works locally."
    );
}

export default db;
