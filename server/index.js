import http from "node:http";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createStore } from "./store.js";

// Routes
//   GET  /api/health          -> { ok, rows }
//   POST /api/responses       -> body: one record or an array; upserts into the CSV
//   GET  /api/responses       -> all rows as JSON
//   GET  /api/responses.csv   -> the CSV file (download)
// Env: PORT (3001), DATA_FILE (server/data/responses.csv), CORS_ORIGIN ("*"),
//      API_KEY (if set, GET routes require header x-api-key).

const MAX_BODY = 1024 * 1024;
const here = path.dirname(fileURLToPath(import.meta.url));

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on("data", (c) => {
      size += c.length;
      if (size > MAX_BODY) {
        // Stop buffering; the 413 is sent first and the socket closed afterwards (see handler).
        if (size - c.length <= MAX_BODY) reject(Object.assign(new Error("payload too large"), { status: 413 }));
      } else chunks.push(c);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

export async function createApp({ file, apiKey, corsOrigin = "*" } = {}) {
  const store = await createStore(file);

  const handler = async (req, res) => {
    const send = (status, body, type = "application/json; charset=utf-8", extra = {}) => {
      res.writeHead(status, {
        "Content-Type": type,
        "Access-Control-Allow-Origin": corsOrigin,
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, x-api-key",
        ...extra,
      });
      res.end(typeof body === "string" ? body : JSON.stringify(body));
    };

    try {
      const { pathname } = new URL(req.url, "http://localhost");
      if (req.method === "OPTIONS") return send(204, "");

      if (pathname === "/api/health" && req.method === "GET") return send(200, { ok: true, rows: store.size() });

      if (pathname === "/api/responses" && req.method === "POST") {
        let data;
        try {
          data = JSON.parse(await readBody(req));
        } catch (e) {
          if (e.status) throw e;
          return send(400, { error: "body must be valid JSON" });
        }
        const records = Array.isArray(data) ? data : [data];
        if (records.length === 0) return send(400, { error: "no records" });
        const result = await store.upsert(records);
        return send(result.saved ? 200 : 400, result);
      }

      const isRead = req.method === "GET" && (pathname === "/api/responses" || pathname === "/api/responses.csv");
      if (isRead) {
        if (apiKey && req.headers["x-api-key"] !== apiKey) return send(401, { error: "invalid or missing x-api-key" });
        if (pathname === "/api/responses") return send(200, store.all());
        return send(200, "﻿" + store.csv(), "text/csv; charset=utf-8", {
          "Content-Disposition": 'attachment; filename="mentamorph-responses.csv"',
        });
      }

      return send(404, { error: "not found" });
    } catch (e) {
      if (e.status) {
        send(e.status, { error: e.message }, undefined, { Connection: "close" });
        return res.on("finish", () => req.destroy());
      }
      console.error(e);
      return send(500, { error: "internal error" });
    }
  };

  return { server: http.createServer(handler), store };
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const port = Number(process.env.PORT) || 3001;
  const file = process.env.DATA_FILE || path.join(here, "data", "responses.csv");
  const { server, store } = await createApp({
    file, apiKey: process.env.API_KEY, corsOrigin: process.env.CORS_ORIGIN || "*",
  });
  server.listen(port, () => console.log(`MentaMorph API on http://localhost:${port} -> ${file} (${store.size()} rows)`));
}
