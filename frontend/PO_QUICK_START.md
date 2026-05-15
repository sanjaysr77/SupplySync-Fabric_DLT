# PO Quick Start - 5 Minutes

## Where to Start

**Go to:** `/purchase-orders` in the frontend

## What You See

A table with all Purchase Orders showing:
- PO ID
- Buyer Organization
- Seller Organization
- Total Amount
- Status (PENDING, APPROVED, REJECTED, DISPATCHED, COMPLETED)
- Action buttons

## How to Raise a PO

### **Step 1: Click "Create PO" Button**
Top right of the page

### **Step 2: Fill in the Form**

```
PO ID:                    PO-001
Product:                  [Select from dropdown]
Quantity:                 100
Requested Delivery Date:  2024-12-31
Notes:                    [Optional]
```

### **Step 3: Add Items (Optional)**
- Click "Add Item" to add multiple products
- Each item: SKU, Description, Quantity, Unit Price
- Total amount calculates automatically

### **Step 4: Click "Create PO"**
- PO submitted to blockchain
- Success message appears
- PO appears in list with PENDING status

---

## The Flow

```
YOU (Retailer)
    ↓ Create PO
DISTRIBUTOR
    ↓ Receives & Creates Linked PO
PRODUCER
    ↓ Approves/Rejects
DISTRIBUTOR
    ↓ Marks Dispatch
YOU (Retailer)
    ↓ Receives Shipment
COMPLETED ✓
```

---

## Your Role Determines What You Can Do

### **If You're a Retailer:**
- ✅ Create POs
- ✅ View your POs
- ✅ See status updates
- ❌ Cannot approve/reject

### **If You're a Distributor:**
- ✅ View Retailer POs
- ✅ Create linked POs to Producer
- ✅ Mark dispatch
- ❌ Cannot approve/reject

### **If You're a Producer:**
- ✅ View Distributor POs
- ✅ Approve POs
- ✅ Reject POs
- ❌ Cannot create POs

---

## Status Meanings

| Status | Meaning | Next Action |
|--------|---------|-------------|
| **PENDING** | Waiting for next party | Distributor/Producer acts |
| **APPROVED** | Producer approved | Prepare shipment |
| **REJECTED** | Producer rejected | Create new PO |
| **DISPATCHED** | Shipped from Distributor | Track shipment |
| **COMPLETED** | Delivered to Retailer | Done ✓ |

---

## Required Information

**Must Fill:**
- PO ID (unique identifier)
- Product (select from list)
- Quantity (number of units)
- Requested Delivery Date (YYYY-MM-DD format)

**Optional:**
- Notes (special instructions)
- Unit Price (for tracking)

---

## Date Format

Always use: **YYYY-MM-DD**

Examples:
- 2024-12-31 (December 31, 2024)
- 2024-01-15 (January 15, 2024)
- 2025-06-30 (June 30, 2025)

---

## What Happens After You Create PO

1. **Blockchain Records It**
   - Immutable record created
   - Timestamp recorded
   - All parties can see it

2. **Distributor Sees It**
   - Receives notification
   - Can view in their PO list
   - Creates linked PO to Producer

3. **Producer Sees It**
   - Receives Distributor's linked PO
   - Can approve or reject
   - Records decision on blockchain

4. **You Get Updates**
   - Status changes in real-time
   - Can see approval/rejection
   - Can track shipment

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "PO Creation Failed" | Check all fields filled, date format correct |
| "Cannot see PO" | Refresh page, check status filter |
| "Cannot approve/reject" | Only Producer can do this |
| "Cannot mark dispatch" | Only Distributor can do this |

---

## Next Steps

After creating PO:

1. **Monitor Status**
   - Go to `/purchase-orders`
   - Check status updates
   - Wait for approvals

2. **Create Shipment** (when approved)
   - Go to `/shipments`
   - Link to PO
   - Add items
   - Track delivery

3. **View Analytics**
   - Go to `/analytics`
   - See PO statistics
   - Export reports

---

## Key Points

✅ **All POs are on blockchain** - Immutable, auditable, transparent

✅ **Real-time updates** - See status changes immediately

✅ **Role-based access** - Different permissions for different organizations

✅ **Complete audit trail** - Every action recorded with timestamp

✅ **Multi-tier support** - Retailer → Distributor → Producer flow

---

## Example PO

```
PO ID:                    RETAIL-2024-001
Product:                  Widget A (SKU: WID-001)
Quantity:                 500 units
Unit Price:               $10.00
Total Amount:             $5,000.00
Requested Delivery Date:  2024-12-31
Status:                   PENDING
Created By:               John Doe (Retailer)
Created At:               2024-12-01 10:30 AM
```

---

## That's It!

You now know how to:
1. Navigate to PO page
2. Create a PO
3. Fill in required information
4. Submit to blockchain
5. Monitor status
6. Track through the supply chain

**Start here:** Go to `/purchase-orders` and click "Create PO"

Questions? Check `PO_FLOW_GUIDE.md` for detailed information.
