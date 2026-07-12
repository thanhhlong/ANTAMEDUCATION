// Local-only entrypoint: runs the same Express app Vercel serves in production,
// listening on a plain port so `vite dev` can proxy /api requests to it.
import app from '../api/index.js';

const port = Number(process.env.API_PORT) || 3001;
app.listen(port, () => {
  console.log(`API dev server listening on http://localhost:${port}`);
});
