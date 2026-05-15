# Setup Guide: Creating a Retailer User and Raising a PO

## Problem
When trying to create a Purchase Order (PO) as a retailer, you get an error: "Access denied. Required role(s): admin"

## Root Cause
The retailer user needs to be assigned to an organization with the correct domain (`retailer.example.com`) so the system can identify which blockchain organization context to use.

## Solution: Step-by-Step Setup

### Step 1: Create Organizations (Admin Only)
1. Log in as admin (email: `admin@local.test`, password: `ChangeMe123!`)
2. Go to **Organization Management** page
3. Click **Add Organization** and create three organizations:

#### Organization 1: Retailer
- **Organization Name**: Retailer
- **MSP ID**: RetailerMSP
- **Domain**: retailer.example.com

#### Organization 2: Distributor
- **Organization Name**: Distributor
- **MSP ID**: DistributorMSP
- **Domain**: distributor.example.com

#### Organization 3: Producer
- **Organization Name**: Producer
- **MSP ID**: ProducerMSP
- **Domain**: producer.example.com

### Step 2: Create a Retailer User
1. Go to **User Management** page
2. Click **Add User** and create a new user:
   - **Name**: Retailer User (or any name)
   - **Email**: retailer@local.test
   - **Role**: user

The user will be created with temporary password: `TempPassword123!`

### Step 3: Assign Organization to User
1. In the **User Management** page, find the retailer user you just created
2. Click **Assign Org** button next to the user
3. Select **Retailer** from the dropdown
4. Click **Assign**

### Step 4: Log in as Retailer and Create a PO
1. Log out from admin account
2. Log in with the retailer user credentials:
   - **Email**: retailer@local.test
   - **Password**: TempPassword123!
3. Go to **Purchase Orders** page
4. Click **Create PO** and fill in the form:
   - **PO ID**: PO-001 (or any unique ID)
   - **Product ID**: (select from dropdown or enter product ID)
   - **Quantity**: 100
   - **Requested Delivery Date**: 2026-06-15
   - **Notes**: (optional)
5. Click **Create** - the PO should now be created successfully!

## What Changed in the Backend

A new endpoint was added to assign organizations to users:
- **Endpoint**: `POST /api/user/assign-organization`
- **Required Fields**: `userId`, `organizationId`
- **Authentication**: Admin only

## How It Works

1. When a user logs in, their organization is populated from the database
2. The `requireBlockchainAccess` middleware extracts the organization domain
3. It converts the domain (e.g., `retailer.example.com`) to an org slug (`retailer`)
4. The PO controller uses this slug to determine which blockchain organization context to use
5. The retailer can now create POs using the retailer blockchain context

## Troubleshooting

**Getting "Invalid credentials" error when logging in?**

This means either the user doesn't exist or the password is wrong. Try these steps:

1. **Verify the user exists and email is correct:**
   - Log in as admin
   - Go to User Management
   - Look for the user with email `retailer@local.test` (not `retailer.user@local.test`)
   - If not found, create the user again with the correct email

2. **Verify the password:**
   - The temporary password is exactly: `TempPassword123!` (case-sensitive)
   - Make sure you're typing it correctly
   - If you're still getting an error, delete and recreate the user

3. **Delete and recreate the user:**
   - Go to User Management
   - Click "Delete" next to the user
   - Click "Add User" and create the user again with email `retailer@local.test`
   - Use the temporary password: `TempPassword123!`

**Still getting "Access denied" error when creating a PO?**
- Make sure the organization domain is exactly: `retailer.example.com` (case-sensitive)
- Make sure the user is assigned to the organization (check the Organization column in User Management)
- Try logging out and logging back in

**Can't see the "Assign Org" button?**
- Make sure you're logged in as admin
- The button appears in the User Management page next to each user

**Organization not showing in dropdown?**
- Make sure you created the organization first in Organization Management
- Refresh the page if needed
