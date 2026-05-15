# Purchase Order (PO) Flow Guide

## Overview

The Purchase Order system is built on Hyperledger Fabric blockchain and involves multiple organizations in a supply chain. The flow depends on your organization type.

## Organization Types & Roles

### 1. **Retailer**
- Creates POs for products
- Sends POs to Distributor
- Receives shipments from Distributor
- Can view all their POs

### 2. **Distributor**
- Receives POs from Retailer
- Creates POs to Producer (linked to Retailer PO)
- Marks dispatch when shipping to Retailer
- Can view all their POs

### 3. **Producer**
- Receives POs from Distributor
- Approves or Rejects POs
- Fulfills approved POs
- Ships to Distributor

---

## Complete PO Flow

### **Step 1: Retailer Creates PO**

**Where to Start:**
1. Go to `/purchase-orders` in the frontend
2. Click "Create PO" button

**What You Need:**
- **PO ID**: Unique identifier (e.g., "PO-001", "RETAIL-2024-001")
- **Product ID**: Select from available products
- **Quantity**: How many units
- **Requested Delivery Date**: When you need it (YYYY-MM-DD format)
- **Notes**: Optional additional information

**Form Fields:**
```
PO ID: PO-001
Product: Select from dropdown
Quantity: 100
Requested Delivery Date: 2024-12-31
Notes: Urgent order
```

**What Happens:**
- PO is created on Hyperledger Fabric blockchain
- Status: **PENDING** (waiting for Distributor action)
- Immutable record created on blockchain
- Visible to all parties in the network

---

### **Step 2: Distributor Receives & Processes PO**

**Distributor's View:**
1. Go to `/purchase-orders`
2. See all POs from Retailers
3. Filter by status to find new POs

**Distributor's Actions:**

#### Option A: Create Distributor PO to Producer
1. Click "Create PO" button
2. Fill in form with:
   - **PO ID**: New distributor PO ID (e.g., "DIST-001")
   - **Product ID**: Same as Retailer PO
   - **Quantity**: Same or adjusted quantity
   - **Requested Delivery Date**: When Producer should deliver
   - **Linked Retailer PO ID**: Reference to original Retailer PO
   - **Notes**: Any special instructions

**What Happens:**
- New PO created on blockchain
- Linked to original Retailer PO
- Sent to Producer for approval
- Status: **PENDING** (waiting for Producer)

#### Option B: Mark Dispatch (After receiving from Producer)
1. Find the Retailer PO in the list
2. Click "Mark Dispatch" button
3. Enter dispatch date (YYYY-MM-DD)
4. Confirm

**What Happens:**
- Dispatch date recorded on blockchain
- PO status updates to **DISPATCHED**
- Shipment tracking begins

---

### **Step 3: Producer Approves/Rejects PO**

**Producer's View:**
1. Go to `/purchase-orders`
2. See all POs from Distributors
3. Filter by status to find pending POs

**Producer's Actions:**

#### Option A: Approve PO
1. Find the Distributor PO
2. Click "Approve" button
3. Optional: Add approval note
4. Confirm

**What Happens:**
- PO status changes to **APPROVED**
- Blockchain records approval
- Distributor notified
- Production/fulfillment begins

#### Option B: Reject PO
1. Find the Distributor PO
2. Click "Reject" button
3. Enter rejection reason
4. Confirm

**What Happens:**
- PO status changes to **REJECTED**
- Blockchain records rejection with reason
- Distributor notified
- Distributor must create new PO or negotiate

---

### **Step 4: Shipment & Delivery**

**After PO is Approved:**

1. **Producer Ships to Distributor**
   - Prepares goods
   - Creates shipment record
   - Sends to Distributor

2. **Distributor Receives & Ships to Retailer**
   - Receives shipment from Producer
   - Marks dispatch in PO system
   - Creates shipment to Retailer
   - Sends to Retailer

3. **Retailer Receives**
   - Receives shipment from Distributor
   - Confirms delivery
   - PO marked as **COMPLETED**

---

## PO Status Lifecycle

```
PENDING (Created)
    ↓
APPROVED (Producer approved) OR REJECTED (Producer rejected)
    ↓
DISPATCHED (Distributor marked dispatch)
    ↓
COMPLETED (Delivered to Retailer)
```

---

## How to Raise a PO - Step by Step

### **For Retailer:**

1. **Navigate to PO Page**
   - Click "Purchase Orders" in sidebar
   - Or go to `/purchase-orders`

2. **Click "Create PO" Button**
   - Top right of the page

3. **Fill in PO Details**
   ```
   PO ID: PO-2024-001
   Product: Select from dropdown
   Quantity: 50
   Requested Delivery Date: 2024-12-15
   Notes: Standard order
   ```

4. **Add Items (if needed)**
   - Click "Add Item" to add multiple products
   - Each item needs: SKU, Description, Quantity, Unit Price

5. **Review Total Amount**
   - Automatically calculated
   - Quantity × Unit Price

6. **Click "Create PO"**
   - PO submitted to blockchain
   - Success message appears
   - PO appears in list with PENDING status

7. **Wait for Distributor**
   - Distributor will create linked PO to Producer
   - You can see status updates in real-time

---

## Key Information

### **Required Fields for PO Creation:**
- ✅ PO ID (unique)
- ✅ Product ID
- ✅ Quantity
- ✅ Requested Delivery Date (YYYY-MM-DD)
- ✅ At least one item

### **Optional Fields:**
- Notes/Comments
- Unit Price (for tracking)

### **Date Format:**
- Always use: **YYYY-MM-DD**
- Example: 2024-12-31 (December 31, 2024)

### **Blockchain Recording:**
- Every PO action is recorded on Hyperledger Fabric
- Immutable audit trail
- All parties can verify history
- Timestamps recorded automatically

---

## Common Scenarios

### **Scenario 1: Retailer to Producer (Direct)**
```
Retailer creates PO → Producer approves → Shipment created → Delivered
```

### **Scenario 2: Retailer → Distributor → Producer (Multi-tier)**
```
Retailer creates PO 
    ↓
Distributor receives & creates linked PO to Producer
    ↓
Producer approves Distributor PO
    ↓
Producer ships to Distributor
    ↓
Distributor marks dispatch & ships to Retailer
    ↓
Retailer receives → PO COMPLETED
```

### **Scenario 3: PO Rejection**
```
Retailer creates PO
    ↓
Distributor creates linked PO to Producer
    ↓
Producer REJECTS (insufficient stock, quality issues, etc.)
    ↓
Distributor notified
    ↓
Distributor creates new PO with adjusted terms
    ↓
Producer approves new PO
    ↓
Process continues...
```

---

## Viewing PO Details

### **In the PO List:**
- **PO ID**: Unique identifier
- **Buyer**: Organization that created PO
- **Seller**: Organization receiving PO
- **Total Amount**: Sum of all items
- **Status**: Current state (PENDING, APPROVED, REJECTED, DISPATCHED, COMPLETED)
- **Actions**: Approve, Reject, Edit, Delete (based on your role)

### **Filtering POs:**
- Click status dropdown
- Select: All, Draft, Submitted, Approved, Rejected, Completed
- List updates automatically

---

## Tips & Best Practices

1. **Use Clear PO IDs**
   - Include organization prefix: RETAIL-001, DIST-001
   - Include date: PO-2024-12-001
   - Makes tracking easier

2. **Set Realistic Delivery Dates**
   - Consider production time
   - Consider shipping time
   - Add buffer for delays

3. **Add Detailed Notes**
   - Special handling requirements
   - Quality specifications
   - Delivery instructions

4. **Monitor PO Status**
   - Check `/purchase-orders` regularly
   - Filter by status to find pending actions
   - Respond promptly to approvals/rejections

5. **Keep Records**
   - All POs are on blockchain
   - Immutable audit trail
   - Can be used for compliance/audits

---

## Troubleshooting

### **"PO Creation Failed"**
- Check all required fields are filled
- Verify date format (YYYY-MM-DD)
- Ensure PO ID is unique
- Check network connection

### **"Cannot Approve/Reject"**
- Only Producer can approve/reject
- Check your organization role
- Verify PO status is PENDING

### **"Cannot Mark Dispatch"**
- Only Distributor can mark dispatch
- PO must be APPROVED first
- Check your organization role

### **"PO Not Visible"**
- Refresh the page
- Check status filter
- Verify you have correct organization role
- Check blockchain network status

---

## Next Steps After PO

1. **Create Shipment**
   - Go to `/shipments`
   - Link to PO
   - Add items
   - Track delivery

2. **View Analytics**
   - Go to `/analytics`
   - See PO statistics
   - Track approval rates
   - Monitor delivery performance

3. **Export Reports**
   - Go to `/analytics`
   - Click "Export Report"
   - Choose CSV or PDF
   - Download for records

---

## Summary

**Quick Start:**
1. Go to `/purchase-orders`
2. Click "Create PO"
3. Fill in details
4. Click "Create PO"
5. Wait for Distributor/Producer actions
6. Monitor status in list
7. Create shipment when approved

**Remember:**
- Different roles have different permissions
- All actions recorded on blockchain
- Status updates in real-time
- Use clear IDs and dates
- Monitor regularly for updates
