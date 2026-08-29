import express from "express";
import fs from "fs/promises";
import path from "path";
import multer from "multer";
import { randomUUID } from "crypto";
import {
    readStore,
    writeStore,
    getTemplatesDir,
    seedIfEmpty,
    defaultOverlay,
} from "../data/store.mjs";
import { requireAdmin } from "../lib/adminAuth.mjs";

const router = express.Router();
const ALLOWED_TYPES = new Set([
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/webp",
    "image/svg+xml",
]);

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, getTemplatesDir()),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase() || ".png";
        cb(null, `${req.params.id}-${Date.now()}${ext}`);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 20 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        if (ALLOWED_TYPES.has(file.mimetype)) cb(null, true);
        else cb(new Error("Template must be a PNG, JPG, WEBP, or SVG image"));
    },
});

function normalizeAcmId(id) {
    return String(id || "")
        .trim()
        .replace(/\s+/g, "")
        .toUpperCase();
}

function parseAttendance(text) {
    const lines = String(text || "")
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

    return lines
        .map((line, index) => {
            const parts = line.split(/[,|\t]/).map((part) => part.trim()).filter(Boolean);
            const acmId = normalizeAcmId(parts[0]);
            if (index === 0 && /^acmid$|^acm.?id$|^id$/i.test(parts[0] || "")) return null;
            if (!acmId) return null;
            const name = parts.slice(1).join(" ").trim() || acmId;
            return { acmId, name };
        })
        .filter(Boolean);
}

function toPublicEvent(event) {
    return {
        id: event.id,
        title: event.title,
        date: event.date,
        description: event.description,
        templateUrl: event.templateFile ? `/uploads/templates/${event.templateFile}` : null,
        overlay: event.overlay || defaultOverlay,
        attendeeCount: Array.isArray(event.attendees) ? event.attendees.length : 0,
        createdAt: event.createdAt,
    };
}

function toAdminEvent(event) {
    return {
        ...toPublicEvent(event),
        attendees: event.attendees || [],
    };
}

async function findEvent(eventId) {
    const store = await readStore();
    const event = store.events.find((item) => item.id === eventId);
    return { store, event };
}

router.get("/events", async (_req, res) => {
    try {
        await seedIfEmpty();
        const store = await readStore();
        res.json(store.events.map(toPublicEvent));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get("/admin/events", requireAdmin, async (_req, res) => {
    try {
        await seedIfEmpty();
        const store = await readStore();
        res.json(store.events.map(toAdminEvent));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get("/events/:id", async (req, res) => {
    try {
        const { event } = await findEvent(req.params.id);
        if (!event) return res.status(404).json({ message: "Event not found" });
        res.json(toPublicEvent(event));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post("/events", requireAdmin, async (req, res) => {
    try {
        const title = String(req.body.title || "").trim();
        if (!title) return res.status(400).json({ message: "Event title is required" });

        const store = await readStore();
        const event = {
            id: randomUUID(),
            title,
            date: String(req.body.date || "").trim(),
            description: String(req.body.description || "").trim(),
            templateFile: null,
            overlay: { ...defaultOverlay, ...(req.body.overlay || {}) },
            attendees: parseAttendance(req.body.attendance || ""),
            createdAt: new Date().toISOString(),
        };
        store.events.unshift(event);
        await writeStore(store);
        res.status(201).json(toAdminEvent(event));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.put("/events/:id", requireAdmin, async (req, res) => {
    try {
        const { store, event } = await findEvent(req.params.id);
        if (!event) return res.status(404).json({ message: "Event not found" });

        if (req.body.title !== undefined) event.title = String(req.body.title).trim();
        if (req.body.date !== undefined) event.date = String(req.body.date).trim();
        if (req.body.description !== undefined) event.description = String(req.body.description).trim();
        if (req.body.overlay && typeof req.body.overlay === "object") {
            event.overlay = { ...defaultOverlay, ...event.overlay, ...req.body.overlay };
        }
        if (req.body.attendance !== undefined) {
            event.attendees = parseAttendance(req.body.attendance);
        }
        if (Array.isArray(req.body.attendees)) {
            event.attendees = req.body.attendees
                .map((row) => ({
                    acmId: normalizeAcmId(row.acmId),
                    name: String(row.name || "").trim() || normalizeAcmId(row.acmId),
                }))
                .filter((row) => row.acmId);
        }

        await writeStore(store);
        res.json(toAdminEvent(event));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post("/events/:id/template", requireAdmin, (req, res) => {
    upload.single("template")(req, res, async (err) => {
        if (err) return res.status(400).json({ message: err.message });
        if (!req.file) return res.status(400).json({ message: "No template file uploaded" });

        try {
            const { store, event } = await findEvent(req.params.id);
            if (!event) {
                await fs.unlink(req.file.path).catch(() => {});
                return res.status(404).json({ message: "Event not found" });
            }

            if (event.templateFile && event.templateFile !== req.file.filename) {
                await fs
                    .unlink(path.join(getTemplatesDir(), event.templateFile))
                    .catch(() => {});
            }

            event.templateFile = req.file.filename;
            await writeStore(store);
            res.json(toAdminEvent(event));
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    });
});

router.post("/events/:id/attendance", requireAdmin, async (req, res) => {
    try {
        const { store, event } = await findEvent(req.params.id);
        if (!event) return res.status(404).json({ message: "Event not found" });

        const incoming = req.body.attendance
            ? parseAttendance(req.body.attendance)
            : Array.isArray(req.body.attendees)
              ? req.body.attendees.map((row) => ({
                    acmId: normalizeAcmId(row.acmId),
                    name: String(row.name || "").trim() || normalizeAcmId(row.acmId),
                }))
              : [];

        const merge = Boolean(req.body.merge);
        if (merge) {
            const byId = new Map((event.attendees || []).map((row) => [row.acmId, row]));
            for (const row of incoming) {
                if (row.acmId) byId.set(row.acmId, row);
            }
            event.attendees = [...byId.values()];
        } else {
            event.attendees = incoming.filter((row) => row.acmId);
        }

        await writeStore(store);
        res.json(toAdminEvent(event));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.delete("/events/:id", requireAdmin, async (req, res) => {
    try {
        const { store, event } = await findEvent(req.params.id);
        if (!event) return res.status(404).json({ message: "Event not found" });

        if (event.templateFile) {
            await fs.unlink(path.join(getTemplatesDir(), event.templateFile)).catch(() => {});
        }

        store.events = store.events.filter((item) => item.id !== req.params.id);
        await writeStore(store);
        res.json({ ok: true });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post("/generate", async (req, res) => {
    try {
        const eventId = String(req.body.eventId || "").trim();
        const acmId = normalizeAcmId(req.body.acmId);
        if (!eventId || !acmId) {
            return res.status(400).json({ message: "eventId and acmId are required" });
        }

        const { event } = await findEvent(eventId);
        if (!event) return res.status(404).json({ message: "Event not found" });
        if (!event.templateFile) {
            return res.status(400).json({ message: "This event does not have a certificate template yet" });
        }

        const attendee = (event.attendees || []).find((row) => row.acmId === acmId);
        if (!attendee) {
            return res.status(403).json({
                eligible: false,
                message: "This ACM ID is not on the attendance list for this event",
            });
        }

        res.json({
            eligible: true,
            acmId: attendee.acmId,
            name: attendee.name,
            event: toPublicEvent(event),
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

export default router;
