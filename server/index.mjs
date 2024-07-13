import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import students from "./routes/students.mjs";
import auth from "./routes/auth.mjs";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Define routes
app.use("/api/students", students);
app.use("/api/auth", auth);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack); // Log the error stack trace for debugging
    res.status(500).send("Uh oh! An unexpected error occurred.");
});

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
