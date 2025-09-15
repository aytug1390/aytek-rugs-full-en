import { Router } from "express";
// Node 18+ has global fetch; this project currently depends on node-fetch but either is fine.
import fetch from "node-fetch";

const r = Router();

r.get("/img", async (req, res) => {
  try {
    const id = String(req.query.id || "");
    const sz = Number(req.query.sz || 1600);
    if (!id) return res.status(400).send("missing id");

    const url = `https://drive.usercontent.google.com/download?id=${encodeURIComponent(id)}&export=view`;
    const up = await fetch(url, { redirect: "follow" });

    if (!up.ok) return res.sendStatus(up.status === 404 ? 404 : 502);

    // Default content-type and cache
    const ct = up.headers.get("content-type") || "image/jpeg";
    res.set({
      "content-type": ct,
      "cache-control": "public, max-age=31536000, immutable",
      "x-content-type-options": "nosniff",
    });

    // If HEAD, end without piping body to avoid connection issues on some clients
    if (req.method === "HEAD") return res.end();

    // Pass-through the body for GET
    // @ts-ignore
    up.body.pipe(res);
  } catch (e) {
    // Network/timeout etc. -> 502
    res.sendStatus(502);
  }
});

// Ensure HEAD route exists — the GET handler above already handles req.method==='HEAD'
r.head("/img", (req, res, next) => {
  next();
});

export default r;
