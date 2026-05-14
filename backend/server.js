'use strict';

require('dotenv').config();

const mongoose = require('mongoose');
const app = require('./app');

const PORT = Number(process.env.PORT) || 5000;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('Missing MONGO_URI in environment');
  process.exit(1);
}

async function start() {
  await mongoose.connect(MONGO_URI);
  console.log('MongoDB connected');

  app.listen(PORT, () => {
    console.log(`HTTP server listening on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
