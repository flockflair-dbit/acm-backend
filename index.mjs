import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import students from "./routes/students.mjs";
import auth from "./routes/auth.mjs";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/students", students);
app.use("/api/auth", auth);

app.use((err, _req, res, next) => {
    res.status(500).send("Uh oh! An unexpected error occured.")
})

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

