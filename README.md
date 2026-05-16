# SupplySync Hyperledger Fabric Project

A compact supply-chain demo that demonstrates purchase-order and shipment lifecycle on Hyperledger Fabric with a React frontend and an Express backend.

Core ideas:
- On-chain: purchase orders and shipments (chaincode in `network/chaincode`).
- Off-chain: inventory, products, and users handled by the Express backend (`backend/`) and MongoDB.
- Frontend: React + Vite UI (`frontend/`) for creating POs, tracking shipments, and marking deliveries.

Top-level folders: `backend`, `frontend`, `network`.

Quick start (development):

1. Start the Fabric network and deploy chaincode (see `network/` scripts).
2. Run the backend: `cd backend && npm install && npm start`.
3. Run the frontend: `cd frontend && npm install && npm run dev`.

