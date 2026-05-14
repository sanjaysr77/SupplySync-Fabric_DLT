# hyperledger-fabric-trial Backend - What Needs to Be Done

## Current State vs. Required State

### Current hyperledger-fabric-trial/backend
- ✅ Basic structure: app.js, server.js, package.json
- ✅ Minimal routes: health.routes.js, user.routes.js, index.js
- ✅ Minimal middleware: auth.js (basic)
- ✅ Config: fabric.js (already configured for 3-org network)
- ❌ **Missing: controllers/** (all business logic)
- ❌ **Missing: models/** (MongoDB schemas)
- ❌ **Missing: utils/** (helpers, email, file hashing)
- ❌ **Missing: scripts/** (admin setup)
- ❌ **Missing: uploads/** (file storage)
- ❌ **Missing: Most routes** (only health and user exist)

### What trustflowupgrade/backend Has (Reference)
- ✅ 9 controllers: auth, user, admin, po, sb, tt, iot, inventory, product
- ✅ 7 models: User, Organization, Role, Product, POEvent, ShipmentBill, OrgType
- ✅ 12 routes: auth, user, admin, role, orgtype, product, po, sb, tt, iot, inventory, shipper
- ✅ Utils: emailService.js, fileHash.js
- ✅ Scripts: createSuperAdmin.js
- ✅ Full middleware: auth.js with protect, requireRole, requireBlockchainAccess
- ✅ Full app.js with morgan logging, uploads serving, all routes
- ✅ Full server.js with DNS workaround, TLS bypass for dev

---

## Step-by-Step Implementation Plan

### PHASE 1: Foundation (Dependencies & Configuration)

#### 1.1 Update package.json
**Current:** Missing dependencies
**Required:** Add morgan, multer, nodemailer, @hyperledger/fabric-gateway

```json
{
  "dependencies": {
    "@grpc/grpc-js": "^1.9.0",
    "@hyperledger/fabric-gateway": "^1.4.0",
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "express": "^4.18.2",
    "jsonwebtoken": "^9.0.2",
    "mongodb": "^7.1.1",
    "mongoose": "^7.5.0",
    "morgan": "^1.10.0",
    "multer": "^1.4.5-lts.1",
    "nodemailer": "^8.0.4"
  }
}
```

#### 1.2 Update .env.example
**Current:** Minimal
**Required:** Add all environment variables

```env
PORT=4000
MONGO_URI=mongodb://localhost:27017/hyperledger-fabric-trial
JWT_SECRET=your_jwt_secret_here
FABRIC_PEER_HOST=localhost
CRYPTO_PATH=../network/organizations
ORDERER_CRYPTO_PATH=../network/organizations/ordererOrganizations
CORS_ORIGIN=http://localhost:3000
EMAIL=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

#### 1.3 Update server.js
**Current:** Basic MongoDB connection
**Required:** Add DNS workaround, TLS bypass for dev, better error handling

```javascript
require('dotenv').config();
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const mongoose = require('mongoose');
const dns = require('dns');
const app = require('./app');

dns.setServers(['8.8.8.8', '8.8.4.4']);

const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/hyperledger-fabric-trial';

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(PORT, () => {
      console.log(`Backend running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
```

#### 1.4 Update app.js
**Current:** Minimal routes
**Required:** Add morgan, uploads serving, all routes, error handling

```javascript
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

const app = express();

const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin '${origin}' not allowed`));
  },
  credentials: true,
}));

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/user', require('./routes/user'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/org', require('./routes/admin'));
app.use('/api/role', require('./routes/role'));
app.use('/api/product', require('./routes/product'));
app.use('/api/po', require('./routes/po'));
app.use('/api/shipment', require('./routes/shipment'));
app.use('/api/dpp', require('./routes/dpp'));
app.use('/api/health', require('./routes/health'));

// 404
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

module.exports = app;
```

---

### PHASE 2: Database Models

#### 2.1 Create backend/models/User.js
- Fields: name, email, phone, password, role, organization, status, registrationToken, registrationTokenExpiry
- Methods: comparePassword (bcrypt)
- Pre-save hook: hash password

#### 2.2 Create backend/models/Organization.js
- Fields: name, mspId, domain, status
- For hyperledger-fabric-trial: Retailer, Distributor, Producer

#### 2.3 Create backend/models/Role.js
- Fields: name, permissions, organization
- Roles: admin, user, approver

#### 2.4 Create backend/models/Product.js
- Fields: sku, name, description, price, category, manufacturer

#### 2.5 Create backend/models/PurchaseOrder.js
- Fields: poId, buyer, seller, items, totalAmount, status, createdBy, createdAt, updatedAt
- Status: draft, submitted, approved, rejected, completed

#### 2.6 Create backend/models/Shipment.js
- Fields: shipmentId, poId, shipper, receiver, items, status, trackingNumber, createdAt, updatedAt
- Status: pending, in-transit, delivered

#### 2.7 Create backend/models/DPPData.js
- Fields: productId, productName, manufacturerId, manufacturerName, certifications, metadata, createdAt

---

### PHASE 3: Middleware & Authentication

#### 3.1 Update backend/middleware/auth.js
**Current:** Basic authenticate function
**Required:** Full implementation with:
- `protect`: Verify JWT, attach req.user
- `requireRole`: Check user role
- `requireBlockchainAccess`: Set req.org for Fabric calls
- Error handling for inactive accounts

```javascript
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }
    if (req.user.status === 'inactive') {
      return res.status(403).json({ success: false, message: 'Account inactive' });
    }
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Token invalid or expired' });
  }
};

const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: `Access denied. Required role(s): ${roles.join(', ')}`,
    });
  }
  next();
};

const requireBlockchainAccess = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }
  req.org = req.user.organization || 'retailer';
  next();
};

module.exports = { protect, requireRole, requireBlockchainAccess };
```

---

### PHASE 4: Controllers

#### 4.1 Create backend/controllers/authController.js
**Functions:**
- `login(email, password)` → JWT token
- `register(name, email, password, role, organization)` → Create user
- `getMe()` → Current user
- `changePassword(currentPassword, newPassword)` → Update password
- `completeRegistration(token, name, password, phone)` → Finish registration

#### 4.2 Create backend/controllers/userController.js
**Functions:**
- `getProfile()` → Current user details
- `updateProfile(updates)` → Update user info
- `listUsers(organization)` → List org users (admin)
- `getUserById(userId)` → Get specific user
- `deleteUser(userId)` → Soft delete (admin)

#### 4.3 Create backend/controllers/adminController.js
**Functions:**
- `createOrganization(name, mspId, domain)` → Create org
- `listOrganizations()` → List all orgs
- `createRole(name, permissions, organization)` → Create role
- `assignRole(userId, roleId)` → Assign role
- `getSystemStats()` → System statistics

#### 4.4 Create backend/controllers/poController.js
**Functions:**
- `createPO(buyer, seller, items, totalAmount)` → Create PO, invoke purchaseorder chaincode
- `approvePO(poId)` → Approve PO
- `rejectPO(poId, reason)` → Reject PO
- `listPOs(organization)` → List POs for org
- `getPOById(poId)` → Get PO details from blockchain
- `updatePOStatus(poId, newStatus)` → Update status

**Key:** Integrate with Fabric SDK to invoke `purchaseorder` chaincode

#### 4.5 Create backend/controllers/shipmentController.js
**Functions:**
- `createShipment(poId, shipper, receiver, items)` → Create shipment, invoke shipment chaincode
- `updateShipmentStatus(shipmentId, newStatus)` → Update status
- `listShipments(organization)` → List shipments for org
- `getShipmentById(shipmentId)` → Get shipment details
- `trackShipment(shipmentId)` → Get tracking history

**Key:** Integrate with Fabric SDK to invoke `shipment` chaincode

#### 4.6 Create backend/controllers/dppController.js
**Functions:**
- `createDPP(productId, productName, manufacturerId, certifications, metadata)` → Create DPP, invoke dppcontract chaincode
- `getDPP(productId)` → Get DPP from blockchain
- `updateDPP(productId, updates)` → Update DPP
- `listDPPs(manufacturerId)` → List DPPs for manufacturer
- `verifyDPP(productId)` → Verify authenticity

**Key:** Integrate with Fabric SDK to invoke `dppcontract` chaincode

#### 4.7 Create backend/controllers/productController.js
**Functions:**
- `createProduct(sku, name, description, price, category)` → Create product
- `listProducts()` → List all products
- `getProductById(productId)` → Get product
- `updateProduct(productId, updates)` → Update product
- `deleteProduct(productId)` → Delete product

---

### PHASE 5: Routes

#### 5.1 Create backend/routes/auth.js
```javascript
const express = require('express');
const router = express.Router();
const { login, register, getMe, changePassword, completeRegistration } = require('../controllers/authController');
const { protect, requireRole } = require('../middleware/auth');

router.post('/login', login);
router.post('/register', protect, requireRole('admin'), register);
router.get('/me', protect, getMe);
router.put('/password', protect, changePassword);
router.post('/complete-registration', completeRegistration);

module.exports = router;
```

#### 5.2 Create backend/routes/user.js
```javascript
const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, listUsers, getUserById, deleteUser } = require('../controllers/userController');
const { protect, requireRole } = require('../middleware/auth');

router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.get('/list', protect, requireRole('admin'), listUsers);
router.get('/:id', protect, getUserById);
router.delete('/:id', protect, requireRole('admin'), deleteUser);

module.exports = router;
```

#### 5.3 Create backend/routes/admin.js
```javascript
const express = require('express');
const router = express.Router();
const { createOrganization, listOrganizations, createRole, assignRole, getSystemStats } = require('../controllers/adminController');
const { protect, requireRole } = require('../middleware/auth');

router.post('/organizations', protect, requireRole('admin'), createOrganization);
router.get('/organizations', protect, requireRole('admin'), listOrganizations);
router.post('/roles', protect, requireRole('admin'), createRole);
router.post('/assign-role', protect, requireRole('admin'), assignRole);
router.get('/stats', protect, requireRole('admin'), getSystemStats);

module.exports = router;
```

#### 5.4 Create backend/routes/po.js
```javascript
const express = require('express');
const router = express.Router();
const { createPO, approvePO, rejectPO, listPOs, getPOById, updatePOStatus } = require('../controllers/poController');
const { protect, requireBlockchainAccess } = require('../middleware/auth');

router.post('/create', protect, requireBlockchainAccess, createPO);
router.get('/list', protect, requireBlockchainAccess, listPOs);
router.get('/:id', protect, requireBlockchainAccess, getPOById);
router.put('/:id/approve', protect, requireBlockchainAccess, approvePO);
router.put('/:id/reject', protect, requireBlockchainAccess, rejectPO);
router.put('/:id/status', protect, requireBlockchainAccess, updatePOStatus);

module.exports = router;
```

#### 5.5 Create backend/routes/shipment.js
```javascript
const express = require('express');
const router = express.Router();
const { createShipment, updateShipmentStatus, listShipments, getShipmentById, trackShipment } = require('../controllers/shipmentController');
const { protect, requireBlockchainAccess } = require('../middleware/auth');

router.post('/create', protect, requireBlockchainAccess, createShipment);
router.get('/list', protect, requireBlockchainAccess, listShipments);
router.get('/:id', protect, requireBlockchainAccess, getShipmentById);
router.put('/:id/status', protect, requireBlockchainAccess, updateShipmentStatus);
router.get('/:id/track', protect, requireBlockchainAccess, trackShipment);

module.exports = router;
```

#### 5.6 Create backend/routes/dpp.js
```javascript
const express = require('express');
const router = express.Router();
const { createDPP, getDPP, updateDPP, listDPPs, verifyDPP } = require('../controllers/dppController');
const { protect, requireBlockchainAccess } = require('../middleware/auth');

router.post('/create', protect, requireBlockchainAccess, createDPP);
router.get('/:id', protect, requireBlockchainAccess, getDPP);
router.put('/:id', protect, requireBlockchainAccess, updateDPP);
router.get('/list/:manufacturerId', protect, requireBlockchainAccess, listDPPs);
router.get('/:id/verify', protect, requireBlockchainAccess, verifyDPP);

module.exports = router;
```

#### 5.7 Create backend/routes/product.js
```javascript
const express = require('express');
const router = express.Router();
const { createProduct, listProducts, getProductById, updateProduct, deleteProduct } = require('../controllers/productController');
const { protect, requireRole } = require('../middleware/auth');

router.post('/create', protect, requireRole('admin'), createProduct);
router.get('/list', protect, listProducts);
router.get('/:id', protect, getProductById);
router.put('/:id', protect, requireRole('admin'), updateProduct);
router.delete('/:id', protect, requireRole('admin'), deleteProduct);

module.exports = router;
```

#### 5.8 Create backend/routes/role.js
```javascript
const express = require('express');
const router = express.Router();
const { createRole, listRoles, updateRole, deleteRole } = require('../controllers/roleController');
const { protect, requireRole } = require('../middleware/auth');

router.post('/create', protect, requireRole('admin'), createRole);
router.get('/list', protect, listRoles);
router.put('/:id', protect, requireRole('admin'), updateRole);
router.delete('/:id', protect, requireRole('admin'), deleteRole);

module.exports = router;
```

#### 5.9 Update backend/routes/health.js
```javascript
const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ success: true, message: 'Backend API running' });
});

module.exports = router;
```

---

### PHASE 6: Utilities

#### 6.1 Create backend/utils/emailService.js
**Functions:**
- `sendVerificationEmail(email, token)` → Send registration link
- `sendPONotification(email, poId, status)` → PO status update
- `sendShipmentNotification(email, shipmentId, status)` → Shipment status update

#### 6.2 Create backend/utils/fileHash.js
**Functions:**
- `hashFile(filePath)` → Generate SHA-256 hash
- `fileFilter(req, file, cb)` → Multer file filter

#### 6.3 Create backend/utils/fabricHelper.js
**Functions:**
- `submitTransaction(org, channel, chaincode, func, ...args)` → Invoke chaincode
- `evaluateTransaction(org, channel, chaincode, func, ...args)` → Query chaincode
- `getChannelForOrgs(org1, org2)` → Determine channel (for hyperledger-fabric-trial: always mychannel)

---

### PHASE 7: Scripts

#### 7.1 Create backend/scripts/createSuperAdmin.js
**Purpose:** Initialize system with admin user and default roles
**Actions:**
- Create admin user: admin@example.com
- Create default roles: admin, user, approver
- Create organizations: Retailer, Distributor, Producer
- Run once on first startup

---

### PHASE 8: Directory Structure

Create missing directories:
```
backend/
├── controllers/          ← NEW
│   ├── authController.js
│   ├── userController.js
│   ├── adminController.js
│   ├── poController.js
│   ├── shipmentController.js
│   ├── dppController.js
│   ├── productController.js
│   └── roleController.js
├── models/              ← NEW
│   ├── User.js
│   ├── Organization.js
│   ├── Role.js
│   ├── Product.js
│   ├── PurchaseOrder.js
│   ├── Shipment.js
│   └── DPPData.js
├── utils/               ← NEW
│   ├── emailService.js
│   ├── fileHash.js
│   └── fabricHelper.js
├── scripts/             ← NEW
│   └── createSuperAdmin.js
├── uploads/             ← NEW (empty, for file uploads)
├── routes/              ← EXPAND
│   ├── index.js         (update to include all routes)
│   ├── auth.js          ← NEW
│   ├── user.js          (update)
│   ├── admin.js         ← NEW
│   ├── po.js            ← NEW
│   ├── shipment.js      ← NEW
│   ├── dpp.js           ← NEW
│   ├── product.js       ← NEW
│   ├── role.js          ← NEW
│   ├── health.js        (update)
│   └── health.routes.js (delete, consolidate to health.js)
├── middleware/          ← UPDATE
│   └── auth.js          (full implementation)
├── config/              ← KEEP
│   └── fabric.js        (already correct for 3-org network)
├── app.js               ← UPDATE (add morgan, uploads, all routes)
├── server.js            ← UPDATE (add DNS workaround, TLS bypass)
├── package.json         ← UPDATE (add dependencies)
├── .env.example         ← UPDATE (add all env vars)
└── .env                 ← CREATE (from .env.example)
```

---

## Key Differences: hyperledger-fabric-trial vs. TrustFlow

| Aspect | TrustFlow | hyperledger-fabric-trial |
|--------|-----------|-------------------------|
| **Organizations** | 8 orgs | 3 orgs (Retailer, Distributor, Producer) |
| **Channels** | Multiple (channelmd, channeldw1, etc.) | Single (mychannel) |
| **Chaincodes** | 5 (user, po, sb, tt, iot) | 3 (purchaseorder, shipment, dppcontract) |
| **Controllers** | 9 | 7 (no iot, inventory, shipper) |
| **Models** | 7 | 7 (same structure, different org names) |
| **Routes** | 12 | 9 (no iot, inventory, shipper) |
| **Org Mapping** | Complex multi-channel logic | Simple: all on mychannel |

---

## Implementation Order

1. **Update package.json** → npm install
2. **Update .env.example & create .env**
3. **Update server.js** (DNS, TLS)
4. **Update app.js** (morgan, uploads, routes)
5. **Create models/** (7 files)
6. **Update middleware/auth.js** (full implementation)
7. **Create controllers/** (7 files)
8. **Create routes/** (9 files)
9. **Create utils/** (3 files)
10. **Create scripts/** (1 file)
11. **Create uploads/** (empty directory)
12. **Test:** npm start → verify MongoDB & Fabric connection

---

## Testing Checklist

- [ ] npm install succeeds
- [ ] npm start connects to MongoDB
- [ ] npm start connects to Fabric network (check logs)
- [ ] POST /api/auth/login works
- [ ] POST /api/auth/register works (admin only)
- [ ] GET /api/user/profile works (with JWT)
- [ ] POST /api/po/create works (invokes purchaseorder chaincode)
- [ ] GET /api/po/list works (queries blockchain)
- [ ] POST /api/shipment/create works (invokes shipment chaincode)
- [ ] POST /api/dpp/create works (invokes dppcontract chaincode)
- [ ] GET /api/health returns success

---

## Notes

- **Fabric Config:** fabric.js is already correct for 3-org network (Retailer, Distributor, Producer on mychannel)
- **Org Mapping:** All transactions go to `mychannel` (no complex channel selection logic needed)
- **Endorsement:** All chaincodes require endorsement from all 3 orgs
- **Database:** MongoDB stores user/org/role/product data; blockchain stores PO/Shipment/DPP data
- **Authentication:** JWT-based; users belong to one organization
- **File Uploads:** Multer for document uploads (optional for POs)
