import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const connectionString = `mongodb+srv://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASS}@acm-backend.jbgki1q.mongodb.net`;
const client = new MongoClient(connectionString);

let db;

client.connect()
    .then(() => {
        db = client.db("acm-backend");
        console.log("Connected to MongoDB");
    })
    .catch((e) => {
        console.error("Failed to connect to MongoDB", e);
    });

export const getDb = () => {
    if (!db) {
        throw new Error("Database not initialized");
    }
    return db;
};
