// Local and Render entry point: listens on PORT.
// Vercel does not use this file; it imports the app from /index.ts.
import app from "./app.js";

const PORT = Number(process.env.PORT ?? 4000);

app.listen(PORT, () => {
  console.log(`BazaarBD API listening on :${PORT}`);
});
