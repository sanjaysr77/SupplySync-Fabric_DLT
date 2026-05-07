# Simple Fabric Network

A beginner-friendly Hyperledger Fabric 2.5.x blockchain network with 2 organizations, 1 channel, and 1 chaincode.

## Network Overview

| Component     | Details                        |
|---------------|--------------------------------|
| Orgs          | Buyer, Seller                  |
| Orderer       | orderer.example.com            |
| Channel       | mychannel                      |
| Chaincode     | asset (Go)                     |
| World State   | CouchDB                        |
| Gateway       | Node.js (port 3000)            |
| Domain        | example.com                    |

## Project Structure

```
trustflow_network_v2/
├── chaincode/
│   └── asset/                  # Go chaincode
│       ├── asset.go
│       ├── collections_config.json
│       ├── go.mod
│       └── go.sum
├── config/                     # core.yaml, configtx support
├── configtx/
│   └── configtx.yaml           # Channel & org definitions
├── docker/
│   ├── docker-compose-ca.yaml      # 3 CAs (orderer, buyer, seller)
│   ├── docker-compose-couch.yaml   # 2 CouchDB instances
│   └── docker-compose-network.yaml # 1 orderer + 2 peers
├── gateway-app/                # Node.js gateway
│   ├── config/
│   │   └── networkTopology.js  # Single source of truth for org/port/channel
│   ├── controllers/
│   │   ├── assetController.js
│   │   ├── authController.js
│   │   └── userController.js
│   ├── routes/
│   │   ├── asset.js
│   │   ├── auth.js
│   │   └── user.js
│   ├── utils/
│   │   ├── gateway.js          # Fabric gateway connection
│   │   └── iotEventListener.js # Chaincode event listener
│   ├── .env.example
│   ├── package.json
│   └── server.js
├── scripts/
│   ├── ca-functions.sh         # CA enrollment helpers
│   ├── deploy-channels.sh      # Create & join mychannel
│   └── deploy-chaincodes.sh    # Package, install, approve, commit
├── deploy-all-chaincodes.sh    # One-shot chaincode deployment
├── network.sh                  # Main network management script
└── set-anchor-peers.sh         # Set anchor peers for gossip
```

## Prerequisites

- Docker & Docker Compose
- Hyperledger Fabric 2.5.x binaries (`peer`, `orderer`, `configtxgen`, etc.) on your `PATH`
- Node.js 18+
- Go 1.21+

## Quick Start

### 1. Start the network

```bash
./network.sh up
```

This will:
- Start the CAs (orderer, buyer, seller)
- Generate crypto material
- Start the orderer and peers with CouchDB
- Create `mychannel` and join all peers

### 2. Deploy the chaincode

```bash
./deploy-all-chaincodes.sh
```

### 3. Set anchor peers

```bash
./set-anchor-peers.sh
```

### 4. Start the gateway

```bash
cd gateway-app
cp .env.example .env   # edit MONGO_URI and JWT_SECRET
npm install
node server.js
```

Gateway runs at `http://localhost:3000`

## Network Commands

```bash
./network.sh up            # Start everything
./network.sh down          # Stop and remove containers
./network.sh createchannel # Create mychannel only
./network.sh deploycc      # Deploy asset chaincode only
./network.sh restart       # Restart containers
./network.sh cleanall      # Remove all containers, volumes, crypto material
```

## API Endpoints

| Method | Endpoint                        | Description         |
|--------|---------------------------------|---------------------|
| POST   | /api/auth/login                 | Login               |
| GET    | /api/asset                      | Get all assets      |
| POST   | /api/asset                      | Create asset        |
| GET    | /api/asset/:assetId             | Get asset by ID     |
| PUT    | /api/asset/:assetId             | Update asset        |
| DELETE | /api/asset/:assetId             | Delete asset        |
| GET    | /api/asset/:assetId/history     | Get asset history   |

## Chaincode Functions

| Function        | Description                              |
|-----------------|------------------------------------------|
| CreateAsset     | Create a new asset in private collection |
| ReadAsset       | Read asset from private collection       |
| UpdateAsset     | Update existing asset                    |
| DeleteAsset     | Delete asset from private collection     |
| GetAllAssets    | Query all assets in private collection   |
| GetAssetHistory | Get full history of an asset             |

## Private Data Collections

Each org has its own private collection:
- `buyerPrivateDetails` — only Buyer peers can read
- `sellerPrivateDetails` — only Seller peers can read

## Ports

| Service          | Port  |
|------------------|-------|
| Buyer peer       | 7051  |
| Seller peer      | 8051  |
| Orderer          | 7050  |
| Buyer CA         | 7054  |
| Seller CA        | 8054  |
| Orderer CA       | 9054  |
| Buyer CouchDB    | 7984  |
| Seller CouchDB   | 8984  |
| Gateway API      | 3000  |
