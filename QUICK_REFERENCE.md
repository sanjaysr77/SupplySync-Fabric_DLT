# Quick Reference Guide

## New Features at a Glance

### Inventory Management
- **Page**: `/inventory`
- **Features**: Track stock, reserve for POs, set reorder levels, view audit trail
- **Users**: All (Retailer, Distributor, Producer, Admin)

### PO Detail View
- **Page**: `/purchase-orders/:poId`
- **Features**: View complete PO info, approve/reject, mark dispatch
- **Users**: All (Retailer, Distributor, Producer, Admin)

## API Quick Reference

### Add Stock
```bash
POST /api/inventory/add
{
  "productId": "...",
  "organizationId": "...",
  "quantity": 100,
  "warehouseLocation": "Main Warehouse",
  "notes": "Received shipment"
}
```

### Reserve Stock
```bash
POST /api/inventory/reserve
{
  "productId": "...",
  "organizationId": "...",
  "quantity": 50,
  "reference": "PO-001"
}
```

### Get Inventory
```bash
GET /api/inventory/org/:organizationId
```

### Get Transactions
```bash
GET /api/inventory/transactions/:organizationId?limit=50&skip=0
```

## File Locations

### Backend
- Models: `backend/models/Inventory.js`, `InventoryTransaction.js`
- Controller: `backend/controllers/inventoryController.js`
- Routes: `backend/routes/inventory.js`

### Frontend
- Pages: `frontend/src/pages/Inventory.jsx`, `PODetail.jsx`
- Updated: `App.jsx`, `Sidebar.jsx`, `PurchaseOrders.jsx`

## Database Collections

### Inventory
```javascript
{
  product: ObjectId,
  organization: ObjectId,
  quantity: Number,
  reserved: Number,
  available: Number,
  reorderLevel: Number,
  warehouseLocation: String,
  lastRestocked: Date
}
```

### InventoryTransaction
```javascript
{
  product: ObjectId,
  organization: ObjectId,
  type: String, // inbound, outbound, adjustment, reservation, release
  quantity: Number,
  reference: String,
  referenceType: String,
  notes: String,
  createdBy: ObjectId
}
```

## Status Colors

| Status | Color | Badge |
|--------|-------|-------|
| PENDING | Yellow | bg-yellow-100 text-yellow-800 |
| APPROVED | Green | bg-green-100 text-green-800 |
| REJECTED | Red | bg-red-100 text-red-800 |
| DISPATCHED | Blue | bg-blue-100 text-blue-800 |
| COMPLETED | Green | bg-green-100 text-green-800 |

## Stock Status

| Status | Condition | Color |
|--------|-----------|-------|
| In Stock | available > reorderLevel | Green |
| Low Stock | available ≤ reorderLevel | Yellow |
| Out of Stock | available ≤ 0 | Red |

## Common Tasks

### Add Stock
1. Go to `/inventory`
2. Click "Add Stock"
3. Select product
4. Enter quantity
5. Click "Add Stock"

### View PO Details
1. Go to `/purchase-orders`
2. Click on PO row or "View Details"
3. See full PO information
4. Perform actions if available

### Reserve Stock
```bash
curl -X POST http://localhost:5000/api/inventory/reserve \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "<id>",
    "organizationId": "<id>",
    "quantity": 50,
    "reference": "PO-001"
  }'
```

### Check Low Stock
1. Go to `/inventory`
2. Check "Show Low Stock Only"
3. See items below reorder level

### Approve PO
1. Go to `/purchase-orders`
2. Click on PO
3. Click "Approve PO"
4. Status changes to APPROVED

### Mark Dispatch
1. Go to `/purchase-orders`
2. Click on PO
3. Click "Mark Dispatch"
4. Enter dispatch date
5. Click "Confirm Dispatch"

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Inventory not showing | Verify organization assigned to user |
| Cannot reserve stock | Check available quantity > requested |
| PO detail blank | Verify PO ID correct, user has access |
| Low stock not showing | Check reorder level set correctly |
| Cannot approve PO | Verify user is producer, PO is pending |

## Environment Variables

```bash
# Backend
JWT_SECRET=your_secret
MONGODB_URI=mongodb://...
CORS_ORIGIN=http://localhost:5173,http://localhost:3000

# Frontend
VITE_API_URL=http://localhost:5000/api
```

## Routes

| Path | Component | Purpose |
|------|-----------|---------|
| `/inventory` | Inventory.jsx | Inventory dashboard |
| `/purchase-orders` | PurchaseOrders.jsx | PO list |
| `/purchase-orders/:poId` | PODetail.jsx | PO details |

## Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/inventory/org/:id` | Get inventory |
| GET | `/api/inventory/product/:id/org/:id` | Get product inventory |
| POST | `/api/inventory/add` | Add stock |
| POST | `/api/inventory/reserve` | Reserve stock |
| POST | `/api/inventory/release` | Release stock |
| POST | `/api/inventory/adjust` | Adjust stock |
| POST | `/api/inventory/reorder-level` | Set reorder level |
| GET | `/api/inventory/transactions/:id` | Get transactions |

## User Permissions

| Action | Retailer | Distributor | Producer | Admin |
|--------|----------|-------------|----------|-------|
| View Inventory | ✅ | ✅ | ✅ | ✅ |
| Add Stock | ✅ | ✅ | ✅ | ✅ |
| Reserve Stock | ✅ | ✅ | ✅ | ✅ |
| Create PO | ✅ | ✅ | ❌ | ✅ |
| Approve PO | ❌ | ❌ | ✅ | ✅ |
| Mark Dispatch | ❌ | ✅ | ❌ | ✅ |
| View Transactions | ✅ | ✅ | ✅ | ✅ |

## Summary Cards

| Card | Shows | Color |
|------|-------|-------|
| Total Items | Count of products | Blue |
| Total Quantity | Sum of all stock | Green |
| Available | Total - Reserved | Purple |
| Reserved | Stock for pending POs | Orange |
| Low Stock | Items below reorder level | Red |

## Transaction Types

| Type | Meaning |
|------|---------|
| inbound | Stock received |
| outbound | Stock shipped |
| adjustment | Manual adjustment |
| reservation | Stock reserved for PO |
| release | Reservation cancelled |

## Key Metrics

- **Total Items**: Number of unique products in inventory
- **Total Quantity**: Sum of all stock quantities
- **Available**: Quantity not reserved (total - reserved)
- **Reserved**: Quantity allocated to pending POs
- **Low Stock Items**: Count of items below reorder level

## Workflow Summary

```
Retailer Creates PO
    ↓
Distributor Receives & Creates Linked PO
    ↓
Producer Approves/Rejects
    ↓
If Approved:
  - Stock Reserved
  - Goods Produced
  - Distributor Marks Dispatch
  - Retailer Receives
  - PO Completed
    ↓
If Rejected:
  - Distributor Creates New PO
  - Process Repeats
```

## Documentation Files

| File | Purpose |
|------|---------|
| INVENTORY_AND_PO_FEATURES.md | Detailed feature documentation |
| SETUP_INVENTORY.md | Setup and testing guide |
| IMPLEMENTATION_SUMMARY.md | Technical overview |
| FEATURE_WALKTHROUGH.md | Visual guide and examples |
| DEPLOYMENT_CHECKLIST.md | Deployment verification |
| QUICK_REFERENCE.md | This file |

## Support Resources

- **API Docs**: INVENTORY_AND_PO_FEATURES.md
- **Setup Help**: SETUP_INVENTORY.md
- **Visual Guide**: FEATURE_WALKTHROUGH.md
- **Deployment**: DEPLOYMENT_CHECKLIST.md
- **Technical**: IMPLEMENTATION_SUMMARY.md

## Version Info

- **Version**: 1.0.0
- **Release Date**: December 2024
- **Status**: Production Ready
- **Compatibility**: Backward compatible

## Quick Links

- Inventory Page: `http://localhost:5173/inventory`
- PO List: `http://localhost:5173/purchase-orders`
- API Base: `http://localhost:5000/api`
- Health Check: `http://localhost:5000/api/health`

## Notes

- All endpoints require authentication
- Organization context is validated
- All changes are logged
- No breaking changes to existing features
- Fully responsive design
- Production ready

---

**Last Updated**: December 2024
**Status**: ✅ Ready for Production
