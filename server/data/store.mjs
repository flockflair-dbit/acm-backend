import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataFile = path.join(__dirname, "events.json");
const templatesDir = path.join(__dirname, "..", "uploads", "templates");
const sampleTemplate = path.join(__dirname, "..", "assets", "sample-certificate.svg");

export const DEMO_EVENT_ID = "demo-workshop";
export const SAMPLE_TEMPLATE_FILE = "demo-workshop.svg";

const defaultOverlay = {
    xPercent: 50,
    yPercent: 46.5,
    fontSizePercent: 4.4,
    color: "#1b365d",
    fontFamily: "Georgia, 'Times New Roman', serif",
    fontWeight: "700",
};

async function ensureDirs() {
    await fs.mkdir(path.dirname(dataFile), { recursive: true });
    await fs.mkdir(templatesDir, { recursive: true });
}

export async function readStore() {
    await ensureDirs();
    try {
        const raw = await fs.readFile(dataFile, "utf8");
        const parsed = JSON.parse(raw);
        if (!parsed.events) parsed.events = [];
        return parsed;
    } catch {
        return { events: [] };
    }
}

export async function writeStore(data) {
    await ensureDirs();
    const tmp = `${dataFile}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(data, null, 2), "utf8");
    await fs.rename(tmp, dataFile);
}

export function getTemplatesDir() {
    return templatesDir;
}

export async function seedIfEmpty() {
    const store = await readStore();
    if (store.events.length > 0) return store;

    try {
        await fs.copyFile(sampleTemplate, path.join(templatesDir, SAMPLE_TEMPLATE_FILE));
    } catch (err) {
        console.warn("Could not copy sample certificate template:", err.message);
    }

    store.events.push({
        id: DEMO_EVENT_ID,
        title: "Intro to Web Development Workshop",
        date: "2026-03-15",
        description:
            "Hands-on workshop covering HTML, CSS, and JavaScript basics. Demo event — use ACM001 to test certificate generation.",
        templateFile: SAMPLE_TEMPLATE_FILE,
        overlay: { ...defaultOverlay },
        attendees: [
            { acmId: "ACM001", name: "Test Member" },
            { acmId: "ACM002", name: "Demo Student" },
        ],
        createdAt: new Date().toISOString(),
    });

    await writeStore(store);
    console.log("Seeded demo certificate event. Test with ACM ID ACM001.");
    return store;
}

export { defaultOverlay };
