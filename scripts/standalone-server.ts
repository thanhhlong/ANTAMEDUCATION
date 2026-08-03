// Self-hosted entrypoint: serves the built frontend (dist/) and the same
// Express API app Vercel runs, from a single always-on Node process. Use this
// to run the site on your own computer/server instead of Vercel — Vercel splits
// static hosting and the API into separate pieces internally, but a self-hosted
// box needs one process doing both.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import 'dotenv/config';
import app from '../api/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, '..', 'dist');

app.use(express.static(distDir));

// SPA fallback: any route that isn't /api/... and isn't a real static file
// serves index.html, so client-side routes (e.g. /students) work on refresh.
app.get(/^(?!\/api\/).*/, (_req, res) => {
  res.sendFile(path.join(distDir, 'index.html'));
});

const port = Number(process.env.PORT) || 8080;
app.listen(port, () => {
  console.log(`AN TÂM EDUCATION đang chạy tại http://localhost:${port}`);
});
