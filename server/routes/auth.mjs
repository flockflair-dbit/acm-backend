import express from "express";
import bcrypt from "bcrypt";
import { getDb } from "../db/conn.mjs"; // Adjust path as needed

const saltRounds = 10;
const router = express.Router();

// Helper function to validate password
async function validatePassword(password, hash) {
    try {
        const match = await bcrypt.compare(password, hash);
        return match;
    } catch (err) {
        console.error(err.message);
        return false;
    }
}

// Sign-In Route
router.post('/signin', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Ensure MongoDB connection is established
        const db = getDb();
        const collection = db.collection('users');

        // Check if email exists in DB
        const user = await collection.findOne({ email });
        if (!user) {
            return res.status(400).send('User not found');
        }

        // Validate password
        const isValidPassword = await validatePassword(password, user.password);
        if (!isValidPassword) {
            return res.status(400).send('Invalid password');
        }

        res.status(200).send('Sign in successful');
    } catch (err) {
        console.error(err);
        res.status(500).send('An error occurred');
    }
});

// Sign-Out Route
router.post('/signout', (req, res) => {
    res.status(200).send('Sign out successful');
});

// Sign-Up Route
router.post('/signup', async (req, res) => {
    const {
        fullName, email, phone, branch,
        currYear, yearOfJoining, password,
        acmMemberId
    } = req.body;

    // Check if any required fields are missing
    const errors = {};
    if (!fullName) errors.fullName = "Full Name is required";
    if (!email) errors.email = "Email is required";
    if (!phone) errors.phone = "Phone number is required";
    if (!branch) errors.branch = "Branch is required";
    if (!currYear) errors.currYear = "Current year is required";
    if (!yearOfJoining) errors.yearOfJoining = "Year of joining is required";
    if (!password) errors.password = "Password is required";
    if (!acmMemberId) errors.acmMemberId = "ACM Member ID is required";

    // If there are errors, return them
    if (Object.keys(errors).length > 0) {
        return res.status(400).json(errors);
    }

    // If all required fields are present, continue with processing
    try {
        // Ensure MongoDB connection is established
        const db = getDb();
        const collection = db.collection('users');
        const existingUser = await collection.findOne({ email });
        if (existingUser) {
            return res.status(400).send('User already exists');
        }
        // Hash password
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Insert new user into DB
        const result = await collection.insertOne({
            fullName, email, phone, branch,
            currYear, yearOfJoining, password: hashedPassword,
            acmMemberId, points: 0
        });

        res.status(201).send('User created successfully');
    } catch (err) {
        console.error(err);
        res.status(500).send('An error occurred');
    }
});

export default router;
