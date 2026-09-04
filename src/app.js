// src/app.js
import express from 'express';

const app = express();
app.use(express.json({ limit: '10kb' })); // small body limit — basic DoS protection

app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

export default app;
