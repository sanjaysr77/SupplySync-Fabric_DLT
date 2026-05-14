'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const User = require('../models/User');

async function main() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('Missing MONGO_URI in backend/.env');
    process.exit(1);
  }
  await mongoose.connect(uri);
  await User.deleteMany({ email: 'admin@local.test' });
  await User.create({
    name: 'Bootstrap Admin',
    email: 'admin@local.test',
    password: 'ChangeMe123!',
    role: 'admin',
    status: 'active',
  });
  console.log('OK: login in Postman as admin@local.test / ChangeMe123!');
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
