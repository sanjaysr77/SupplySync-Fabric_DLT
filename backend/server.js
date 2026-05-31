'use strict';

require('dotenv').config();

// Register Mongoose models (side-effect: loads schema definitions at startup)
require('./models');

// Dev only: Fabric test network often uses self-signed TLS (peer/orderer). Do not use in production.
if (process.env.NODE_ENV !== 'production') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

const dns = require('dns');
const mongoose = require('mongoose');
const app = require('./app');

dns.setServers(['8.8.8.8', '8.8.4.4']);

const PORT = Number(process.env.PORT) || 5000;
const HOST = process.env.HOST || '0.0.0.0';
const MONGO_URI =
  process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hyperledger-fabric-trial';

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, HOST, () => {
      console.log(`Backend running at http://${HOST}:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
