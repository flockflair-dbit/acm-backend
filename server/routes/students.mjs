import express from "express";
import { getDb } from "../db/conn.mjs";
import { ObjectId } from "mongodb";

const router = express.Router();

// Get a list of 50 posts
router.get("/", async (req, res) => {
    try {
        const db = getDb();
        const collection = db.collection("posts");
        const results = await collection.find({}).limit(50).toArray();
        res.status(200).send(results);
    } catch (err) {
        res.status(500).send("An error occurred");
    }
});

// Fetch the latest posts
router.get("/latest", async (req, res) => {
    try {
        const db = getDb();
        const collection = db.collection("posts");
        const results = await collection.aggregate([
            { "$project": { "author": 1, "title": 1, "tags": 1, "date": 1 } },
            { "$sort": { "date": -1 } },
            { "$limit": 3 }
        ]).toArray();
        res.status(200).send(results);
    } catch (err) {
        res.status(500).send("An error occurred");
    }
});

// Get a single post
router.get("/:id", async (req, res) => {
    try {
        const db = getDb();
        const collection = db.collection("posts");
        const query = { _id: ObjectId(req.params.id) };
        const result = await collection.findOne(query);
        if (!result) {
            res.status(404).send("Not found");
        } else {
            res.status(200).send(result);
        }
    } catch (err) {
        res.status(500).send("An error occurred");
    }
});

// Add a post
router.post("/", async (req, res) => {
    try {
        const db = getDb();
        const collection = db.collection("posts");
        const newDocument = req.body;
        newDocument.date = new Date();
        const result = await collection.insertOne(newDocument);
        res.status(201).send(result);
    } catch (err) {
        res.status(500).send("An error occurred");
    }
});

// Update the post with a new comment
router.patch("/comment/:id", async (req, res) => {
    try {
        const db = getDb();
        const query = { _id: ObjectId(req.params.id) };
        const updates = { $push: { comments: req.body } };
        const collection = db.collection("posts");
        const result = await collection.updateOne(query, updates);
        res.status(200).send(result);
    } catch (err) {
        res.status(500).send("An error occurred");
    }
});

// Delete an entry
router.delete("/:id", async (req, res) => {
    try {
        const db = getDb();
        const query = { _id: ObjectId(req.params.id) };
        const collection = db.collection("posts");
        const result = await collection.deleteOne(query);
        res.status(200).send(result);
    } catch (err) {
        res.status(500).send("An error occurred");
    }
});

export default router;
