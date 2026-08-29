import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import students from "./routes/students.mjs";
import auth from "./routes/auth.mjs";
import certificates from "./routes/certificates.mjs";
import { seedIfEmpty } from "./data/store.mjs";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(cors({
    origin: true,
    allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express.json({ limit: "5mb" }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/students", students);
app.use("/api/auth", auth);
app.use("/api/certificates", certificates);

app.get("/api/health", (_req, res) => {
    res.json({ ok: true, service: "acm-backend" });
});

app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ message: err.message || "Uh oh! An unexpected error occured." });
});

const port = process.env.PORT || 3000;
app.listen(port, async () => {
    await seedIfEmpty();
    console.log(`Server is running on port ${port}`);
});
