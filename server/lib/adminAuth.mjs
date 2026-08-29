import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "acm-admin";
const ADMIN_SECRET = process.env.ADMIN_SECRET || `acm-admin-secret:${ADMIN_PASSWORD}`;
const TOKEN_TTL_MS = 12 * 60 * 60 * 1000;

function safeEqual(left, right) {
    const a = Buffer.from(String(left));
    const b = Buffer.from(String(right));
    if (a.length !== b.length) {
        crypto.timingSafeEqual(a, a);
        return false;
    }
    return crypto.timingSafeEqual(a, b);
}

export function passwordMatches(password) {
    return safeEqual(password, ADMIN_PASSWORD);
}

export function issueAdminToken() {
    const payload = Buffer.from(
        JSON.stringify({ role: "admin", exp: Date.now() + TOKEN_TTL_MS })
    ).toString("base64url");
    const signature = crypto.createHmac("sha256", ADMIN_SECRET).update(payload).digest("base64url");
    return `${payload}.${signature}`;
}

export function verifyAdminToken(token) {
    if (!token || !token.includes(".")) return null;
    const [payload, signature] = token.split(".");
    const expected = crypto.createHmac("sha256", ADMIN_SECRET).update(payload).digest("base64url");
    if (!safeEqual(signature, expected)) return null;

    try {
        const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
        if (data.role !== "admin" || typeof data.exp !== "number" || data.exp < Date.now()) {
            return null;
        }
        return data;
    } catch {
        return null;
    }
}

export function requireAdmin(req, res, next) {
    const header = String(req.headers.authorization || "");
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";
    const session = verifyAdminToken(token);
    if (!session) {
        return res.status(401).json({ message: "Admin sign-in required" });
    }
    req.admin = session;
    next();
}
