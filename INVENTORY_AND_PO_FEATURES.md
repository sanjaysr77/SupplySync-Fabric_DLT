# Inventory Management & Purchase Order Features

## Overview

This document describes the new inventory tracking system and enhanced Purchase Order (PO) UI implemented for the supply chain management system.

## Features Implemented

### 1. Inventory Management System

#### Backend Models

**Inventory Model** (`backend/models/Inventory.js`)
- Tracks stock levels for each product per organization
- Fields:
  - `product`: Reference to Product
  - `organization`: Reference to Organization (Retailer/Distributor/Producer)
  - `quantity`: Total stock quantity
  - `reserved`: Quantity reserved for pending POs
  - `available`: Calculated field (quantity - reserved)
  - `reorderLevel`: Threshold for low stock alerts
  - `warehouseLocation`: Physical storage location
  - `lastRestocked`: Timestamp of last stock addition
- Unique constraint on product-organization combination

**InventoryTransaction Model** (`backend/models/InventoryTransaction.js`)
- Audit trail for all inventory changes
- Fields:
  - `product`: Reference to Product
  - `organization`: Reference to Organization
  - `type`: Transaction type (inbound, outbound, adjustment, reservation, release)
  - `quantity`: Amount changed
  - `reference`: PO ID or Shipment ID
  - `referenceType`: Type of reference (PO, Shipment, Manual)
  - `notes`: Additional details
  - `createdBy`: User who made the change
- Enables complete audit trail and compliance tracking

#### Backend API Endpoints

All endpoints require authentication and blockchain access context.

**GET `/api/inventory/org/:organizationId`**
- Fetch all inventory for an organization
- Returns inventory list with summary statistics
- Summary includes: totalItems, totalQuantity, totalReserved, totalAvailable, lowStockItems

**GET `/api/inventory/product/:productId/org/:organizationId`**
- Get inventory for specific product in organization
- Returns detailed inventory record

**POST `/api/inventory/add`**
- Add stock to inventory
- Request body:
  ```json
  {
    "productId": "ObjectId",
    "organizationId": "ObjectId",
    "quantity": 100,
    "warehouseLocation": "Main Warehouse",
    "notes": "Received shipment"
  }
  ```
- Creates inventory record if doesn't exist
- Updates lastRestocked timestamp
- Logs inbound transaction

**POST `/api/inventory/reserve`**
- Reserve stock for a PO
- Request body:
  ```json
  {
    "productId": "ObjectId",
    "organizationId": "ObjectId",
    "quantity": 50,
    "reference": "PO-001",
    "notes": "Reserved for PO"
  }
  ```
- Validates available stock
- Increments reserved quantity
- Logs reservation transaction

**POST `/api/inventory/release`**
- Release reserved stock (e.g., when PO is cancelled)
- Request body:
  ```json
  {
    "productId": "ObjectId",
    "organizationId": "ObjectId",
    "quantity": 50,
    "reference": "PO-001",
    "notes": "Released from PO"
  }
  ```
- Decrements reserved quantity
- Logs release transaction

**POST `/api/inventory/adjust`**
- Manual stock adjustment (inventory count, damage, etc.)
- Request body:
  ```json
  {
    "productId": "ObjectId",
    "organizationId": "ObjectId",
    "quantity": -5,
    "notes": "Damaged items removed"
  }
  ```
- Adjusts total quantity
- Logs adjustment transaction

**POST `/api/inventory/reorder-level`**
- Set reorder level for a product
- Request body:
  ```json
  {
    "productId": "ObjectId",
    "organizationId": "ObjectId",
    "reorderLevel": 20
  }
  ```

**GET `/api/inventory/transactions/:organizationId`**
- Fetch transaction history
- Query parameters:
  - `productId`: Filter by product (optional)
  - `type`: Filter by transaction type (optional)
  - `limit`: Results per page (default: 50)
  - `skip`: Pagination offset (default: 0)
- Returns paginated transaction list with user and product details

#### Frontend Inventory Page

**Route**: `/inventory`

**Features**:
- Real-time inventory dashboard with summary cards
  - Total Items: Count of unique products in inventory
  - Total Quantity: Sum of all stock
  - Available: Total quantity minus reserved
  - Reserved: Stock allocated to pending POs
  - Low Stock: Count of items below reorder level

- Add Stock Form
  - Select product from dropdown
  - Enter quantity to add
  - Specify warehouse location
  - Add optional notes
  - Automatically creates inventory record if new

- Search & Filter
  - Search by product name or SKU
  - Filter to show only low stock items
  - Real-time filtering

- Inventory Table
  - SKU and product name
  - Total quantity, reserved, and available
  - Reorder level
  - Stock status badge (In Stock, Low Stock, Out of Stock)
  - Warehouse location
  - Color-coded status indicators

**Stock Status Logic**:
- Out of Stock: available <= 0 (red)
- Low Stock: available <= reorderLevel (yellow)
- In Stock: available > reorderLevel (green)

### 2. Enhanced Purchase Order UI

#### New PO Detail Page

**Route**: `/purchase-orders/:poId`

**Features**:

**Status Display**
- Current PO status with color-coded badge
- Status colors:
  - PENDING_PRODUCER_RESPONSE: Yellow
  - ACCEPTED/APPROVED: Green
  - REJECTED: Red
  - DISPATCHED: Blue
  - COMPLETED: Green

**Order Information Section**
- PO ID (unique identifier)
- Quantity ordered
- Requested delivery date
- Linked retailer PO (if distributor)

**Product Information Section**
- Product name
- SKU
- Unit price
- Category
- Fetched from product database

**Notes Section**
- Display any additional notes on the PO

**Actions Section**
- Approve PO (for producers on pending POs)
- Reject PO with reason (for producers on pending POs)
- Mark Dispatch (for distributors on approved POs)
  - Date picker for dispatch date
  - Confirmation workflow

**Timeline Section**
- PO creation timestamp
- Last update timestamp
- Visual timeline indicators

**Navigation**
- Back button to PO list
- Click on PO row to view details

#### Improved PO List Page

**Route**: `/purchase-orders`

**Enhancements**:
- Click on any PO row to view full details
- "View Details" button for quick access
- Improved status badges with better colors
- Better visual hierarchy
- Responsive table design

### 3. Integration with Supply Chain Workflow

#### Inventory Reservation Flow

1. **Retailer creates PO**
   - PO created with PENDING status
   - Inventory not yet reserved

2. **Distributor receives PO**
   - Can view retailer's PO
   - Creates linked PO to producer
   - Optionally reserves stock from inventory

3. **Producer receives PO**
   - Reviews PO details
   - Approves or rejects
   - If approved, can reserve stock

4. **Stock Fulfillment**
   - When PO approved: Stock can be reserved
   - When PO dispatched: Reserved stock allocated
   - When PO completed: Reserved stock converted to outbound

#### Audit Trail

Every inventory change is logged with:
- Transaction type (inbound, outbound, adjustment, reservation, release)
- Product and organization
- Quantity changed
- Reference (PO ID, Shipment ID)
- User who made the change
- Timestamp

This enables:
- Complete compliance tracking
- Inventory reconciliation
- Fraud detection
- Historical analysis

## Database Schema

### Inventory Collection
```javascript
{
  _id: ObjectId,
  product: ObjectId (ref: Product),
  organization: ObjectId (ref: Organization),
  quantity: Number,
  reserved: Number,
  available: Number (calculated),
  reorderLevel: Number,
  warehouseLocation: String,
  lastRestocked: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### InventoryTransaction Collection
```javascript
{
  _id: ObjectId,
  product: ObjectId (ref: Product),
  organization: ObjectId (ref: Organization),
  type: String (enum: inbound, outbound, adjustment, reservation, release),
  quantity: Number,
  reference: String,
  referenceType: String (enum: PO, Shipment, Manual),
  notes: String,
  createdBy: ObjectId (ref: User),
  createdAt: Date,
  updatedAt: Date
}
```

## Usage Examples

### Adding Stock

```bash
curl -X POST http://localhost:5000/api/inventory/add \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "507f1f77bcf86cd799439011",
    "organizationId": "507f1f77bcf86cd799439012",
    "quantity": 100,
    "warehouseLocation": "Main Warehouse",
    "notes": "Received from supplier"
  }'
```

### Reserving Stock for PO

```bash
curl -X POST http://localhost:5000/api/inventory/reserve \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "507f1f77bcf86cd799439011",
    "organizationId": "507f1f77bcf86cd799439012",
    "quantity": 50,
    "reference": "PO-001",
    "notes": "Reserved for PO-001"
  }'
```

### Getting Inventory Summary

```bash
curl -X GET http://localhost:5000/api/inventory/org/507f1f77bcf86cd799439012 \
  -H "Authorization: Bearer <token>"
```

Response:
```json
{
  "success": true,
  "inventory": [
    {
      "_id": "...",
      "product": {
        "_id": "...",
        "sku": "PROD-001",
        "name": "Widget A",
        "price": 99.99,
        "category": "Electronics"
      },
      "quantity": 100,
      "reserved": 50,
      "available": 50,
      "reorderLevel": 20,
      "warehouseLocation": "Main Warehouse",
      "lastRestocked": "2024-12-01T10:00:00Z"
    }
  ],
  "summary": {
    "totalItems": 5,
    "totalQuantity": 500,
    "totalReserved": 150,
    "totalAvailable": 350,
    "lowStockItems": 2
  }
}
```

## Navigation Updates

The sidebar now includes:
- Dashboard
- Products
- **Inventory** (NEW)
- Purchase Orders
- Shipments
- DPP Records
- Analytics
- Users (admin only)
- Organizations (admin only)

## Future Enhancements

1. **Automated Reordering**
   - Automatic PO creation when stock falls below reorder level
   - Supplier integration for auto-ordering

2. **Inventory Forecasting**
   - Predict stock needs based on historical PO patterns
   - Seasonal demand analysis

3. **Multi-Warehouse Support**
   - Transfer stock between warehouses
   - Warehouse-specific reorder levels

4. **Real-time Notifications**
   - Low stock alerts
   - PO status updates
   - Delivery confirmations

5. **Advanced Reporting**
   - Inventory turnover analysis
   - Stock aging reports
   - Supplier performance metrics

6. **Barcode/QR Code Integration**
   - Scan products for quick stock updates
   - Mobile inventory management

## Security Considerations

- All inventory operations require authentication
- Blockchain access context determines organization scope
- Users can only see inventory for their organization
- All changes are audited with user attribution
- Sensitive operations (large adjustments) may require approval

## Performance Optimization

- Inventory summary calculated on-the-fly
- Indexes on product-organization combination
- Pagination for transaction history
- Lazy loading of product details in PO view

## Troubleshooting

**Issue**: "Insufficient stock" error when reserving
- Solution: Check available quantity (total - reserved)
- Ensure stock has been added before reserving

**Issue**: Inventory not showing in list
- Solution: Verify organization is assigned to user
- Check that inventory records exist for products

**Issue**: PO detail page not loading
- Solution: Verify PO ID is correct
- Check that user has access to PO's organization

## Support

For issues or questions about inventory management:
1. Check the audit trail in transaction history
2. Verify organization assignments
3. Review PO status workflow
4. Contact system administrator
