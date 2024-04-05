import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const connectionString = `mongodb+srv://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASS}@acm-backend.jbgki1q.mongodb.net/?retryWrites=true&w=majority&appName=acm-backend`;
const client = new MongoClient(connectionString);

let conn;

try {
    conn = await client.connect();
} catch (e) {
    console.error(e);
}

let db = conn.db("acm-backend");

export default db;