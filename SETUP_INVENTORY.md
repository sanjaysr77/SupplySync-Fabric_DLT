# Inventory Management Setup Guide

## Quick Start

### Backend Setup

1. **Models are already created**
   - `backend/models/Inventory.js` - Tracks stock levels
   - `backend/models/InventoryTransaction.js` - Audit trail

2. **API routes are ready**
   - `backend/routes/inventory.js` - All inventory endpoints
   - Already registered in `backend/app.js`

3. **No additional dependencies needed**
   - Uses existing MongoDB, Express, and authentication

### Frontend Setup

1. **New pages created**
   - `frontend/src/pages/Inventory.jsx` - Inventory dashboard
   - `frontend/src/pages/PODetail.jsx` - PO detail view

2. **Navigation updated**
   - Sidebar now includes "Inventory" link
   - Routes configured in `App.jsx`

3. **No additional dependencies needed**
   - Uses existing React, Tailwind CSS, and API client

## Testing the Features

### 1. Add Initial Stock

```bash
# Login as a user from any organization (retailer/distributor/producer)
# Navigate to /inventory
# Click "Add Stock"
# Select a product and enter quantity
# Click "Add Stock"
```

### 2. View Inventory Dashboard

```bash
# Navigate to /inventory
# See summary cards with:
#   - Total Items
#   - Total Quantity
#   - Available Stock
#   - Reserved Stock
#   - Low Stock Items
```

### 3. Create and View PO

```bash
# Navigate to /purchase-orders
# Click "Create PO" or click on existing PO row
# View detailed PO information
# See product details, dates, and status
# Perform actions (Approve, Reject, Mark Dispatch)
```

### 4. Reserve Stock for PO

```bash
# Via API:
curl -X POST http://localhost:5000/api/inventory/reserve \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "<product_id>",
    "organizationId": "<org_id>",
    "quantity": 50,
    "reference": "PO-001"
  }'
```

## API Endpoints Reference

### Inventory Management

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/inventory/org/:organizationId` | Get all inventory for org |
| GET | `/api/inventory/product/:productId/org/:organizationId` | Get specific product inventory |
| POST | `/api/inventory/add` | Add stock |
| POST | `/api/inventory/reserve` | Reserve stock for PO |
| POST | `/api/inventory/release` | Release reserved stock |
| POST | `/api/inventory/adjust` | Adjust stock (manual) |
| POST | `/api/inventory/reorder-level` | Set reorder level |
| GET | `/api/inventory/transactions/:organizationId` | Get transaction history |

### Purchase Orders

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/po/list` | List all POs |
| GET | `/api/po/:id` | Get PO details |
| POST | `/api/po/create` | Create new PO |
| PUT | `/api/po/:id/approve` | Approve PO (producer) |
| PUT | `/api/po/:id/reject` | Reject PO (producer) |
| PUT | `/api/po/:id/status` | Mark dispatch (distributor) |

## Database Initialization

### Create Sample Inventory

```javascript
// Run in MongoDB shell or via API
db.inventories.insertOne({
  product: ObjectId("..."),
  organization: ObjectId("..."),
  quantity: 100,
  reserved: 0,
  available: 100,
  reorderLevel: 20,
  warehouseLocation: "Main Warehouse",
  lastRestocked: new Date()
});
```

## User Roles & Permissions

### Retailer
- Create POs
- View own inventory
- Add stock
- View PO details

### Distributor
- Create linked POs
- View own inventory
- Reserve stock
- Mark dispatch
- View PO details

### Producer
- Approve/reject POs
- View own inventory
- Add stock
- View PO details

### Admin
- Full access to all features
- Manage users and organizations
- View all inventory and POs

## Troubleshooting

### Issue: "Organization not assigned" error

**Solution**: 
1. Login as admin
2. Go to Users page
3. Assign organization to user
4. User must logout and login again

### Issue: Inventory not showing

**Solution**:
1. Verify user has organization assigned
2. Check that products exist
3. Add stock via API or UI
4. Refresh page

### Issue: Cannot reserve stock

**Solution**:
1. Verify stock is available (not reserved)
2. Check available quantity > requested quantity
3. Ensure product exists in inventory
4. Try adding stock first

### Issue: PO detail page blank

**Solution**:
1. Verify PO ID is correct
2. Check user has access to PO's organization
3. Ensure PO exists in blockchain
4. Check browser console for errors

## Performance Tips

1. **Pagination**: Use limit/skip for large transaction histories
2. **Caching**: Frontend caches inventory for 5 minutes
3. **Indexes**: Database has indexes on product-organization
4. **Batch Operations**: Use API for bulk stock adjustments

## Security Notes

- All endpoints require authentication
- Organization context determined by user's assigned org
- Blockchain access validates user permissions
- All changes logged with user attribution
- Sensitive operations may require approval (future)

## Next Steps

1. **Test with sample data**
   - Create products
   - Add inventory
   - Create POs
   - Reserve stock

2. **Integrate with existing workflows**
   - Link inventory to shipments
   - Auto-reserve on PO creation
   - Update on delivery

3. **Monitor and optimize**
   - Check transaction logs
   - Review low stock alerts
   - Analyze inventory turnover

## Support

For issues:
1. Check INVENTORY_AND_PO_FEATURES.md for detailed documentation
2. Review API response messages
3. Check browser console for errors
4. Review server logs for backend issues
