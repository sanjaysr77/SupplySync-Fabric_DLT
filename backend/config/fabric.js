'use strict';

/**
 * hyperledger-fabric-trial — connection to the repo `network/` stack
 * (configtx ThreeOrgsChannel, channel scripts, docker-compose peers/orderer).
 */

const path = require('path');
const fs = require('fs').promises;
const { Gateway, Wallets } = require('fabric-network');

/** Parent of `backend/` (repo root), then `network/` — i.e. `../network` relative to `backend/`. */
const BACKEND_ROOT = path.resolve(__dirname, '..');
const NETWORK_ROOT = path.resolve(BACKEND_ROOT, '..', 'network');

const ORDERER_MSP_ID = 'OrdererMSP';

/** Orderer gRPC (configtx Orderer.Addresses). */
const ORDERER_ENDPOINT = {
  host: 'orderer.example.com',
  port: 7050,
};

const CHANNEL = {
  id: process.env.FABRIC_CHANNEL_ID || 'mychannel',
};

const CHAINCODE = {
  names: ['purchaseorder', 'shipment', 'dppcontract'],
  version: '1.0',
  sequence: 1,
  endorsementPolicy: "OR('RetailerMSP.peer','DistributorMSP.peer','ProducerMSP.peer')",
};

/**
 * Three application orgs. `peerAddress` is hostname:port as used in CORE_PEER_ADDRESS (Docker network).
 * Resolve these hostnames from your app host (e.g. /etc/hosts → 127.0.0.1) when not running on fabric_network.
 */
const PEER_ORGS = [
  {
    ccpOrgKey: 'Retailer',
    slug: 'retailer',
    mspId: 'RetailerMSP',
    peerId: 'peer0.retailer.example.com',
    peerAddress: 'peer0.retailer.example.com:7051',
  },
  {
    ccpOrgKey: 'Distributor',
    slug: 'distributor',
    mspId: 'DistributorMSP',
    peerId: 'peer0.distributor.example.com',
    peerAddress: 'peer0.distributor.example.com:8051',
  },
  {
    ccpOrgKey: 'Producer',
    slug: 'producer',
    mspId: 'ProducerMSP',
    peerId: 'peer0.producer.example.com',
    peerAddress: 'peer0.producer.example.com:9051',
  },
];

function peerDomain(slug) {
  return `${slug}.example.com`;
}

/**
 * Certificate paths under NETWORK_ROOT.
 * Org MSP (configtx MSPDir): organizations/peerOrganizations/<domain>/msp
 */
function orgCertificatePaths(slug) {
  const domain = peerDomain(slug);
  const peerOrgBase = path.join(NETWORK_ROOT, 'organizations', 'peerOrganizations', domain);
  return {
    orgMspDir: path.join(peerOrgBase, 'msp'),
    adminMspDir: path.join(peerOrgBase, 'users', `Admin@${domain}`, 'msp'),
    peerHomeDir: path.join(peerOrgBase, 'peers', `peer0.${domain}`),
    peerTlsCaCert: path.join(peerOrgBase, 'peers', `peer0.${domain}`, 'tls', 'ca.crt'),
  };
}

const ORDERER_TLS_CA_CERT = path.join(
  NETWORK_ROOT,
  'organizations',
  'ordererOrganizations',
  'example.com',
  'orderers',
  'orderer.example.com',
  'msp',
  'tlscacerts',
  'tlsca.example.com-cert.pem'
);

function getOrdererGrpcUrl() {
  return `grpcs://${ORDERER_ENDPOINT.host}:${ORDERER_ENDPOINT.port}`;
}

function peerGrpcUrl(peerAddress) {
  return `grpcs://${peerAddress}`;
}

/**
 * Common Connection Profile for fabric-network Gateway (peers, orderer, channel).
 * @param {object} [opts]
 * @param {string} [opts.clientOrganization] — CCP org key (default Retailer)
 */
function getConnectionProfile(opts = {}) {
  const clientOrganization = opts.clientOrganization || 'Retailer';

  const peers = {};
  for (const o of PEER_ORGS) {
    const { peerTlsCaCert } = orgCertificatePaths(o.slug);
    peers[o.peerId] = {
      url: peerGrpcUrl(o.peerAddress),
      grpcOptions: {
        'ssl-target-name-override': o.peerId,
        hostnameOverride: o.peerId,
      },
      tlsCACerts: { path: peerTlsCaCert },
    };
  }

  const organizations = {};
  for (const o of PEER_ORGS) {
    organizations[o.ccpOrgKey] = {
      mspid: o.mspId,
      peers: [o.peerId],
    };
  }

  return {
    name: 'hyperledger-fabric-trial',
    version: '1.0.0',
    client: {
      organization: clientOrganization,
    },
    organizations,
    orderers: {
      [ORDERER_ENDPOINT.host]: {
        url: getOrdererGrpcUrl(),
        mspid: ORDERER_MSP_ID,
        grpcOptions: {
          'ssl-target-name-override': ORDERER_ENDPOINT.host,
          hostnameOverride: ORDERER_ENDPOINT.host,
        },
        tlsCACerts: { path: ORDERER_TLS_CA_CERT },
      },
    },
    peers,
    channels: {
      [CHANNEL.id]: {
        orderers: [ORDERER_ENDPOINT.host],
        peers: PEER_ORGS.reduce((acc, o) => {
          acc[o.peerId] = {
            endorsingPeer: true,
            chaincodeQuery: true,
            ledgerQuery: true,
            eventSource: true,
          };
          return acc;
        }, {}),
      },
    },
  };
}

async function readPrivateKeyPem(adminMspDir) {
  const keystore = path.join(adminMspDir, 'keystore');
  const files = await fs.readdir(keystore);
  const sk = files.find((f) => f.endsWith('_sk'));
  if (!sk) {
    throw new Error(`No private key (*_sk) in ${keystore}`);
  }
  return (await fs.readFile(path.join(keystore, sk), 'utf8'));
}

async function readAdminCertificatePem(adminMspDir) {
  const signcerts = path.join(adminMspDir, 'signcerts');
  const files = await fs.readdir(signcerts);
  if (!files.length) {
    throw new Error(`No certificate in ${signcerts}`);
  }
  return (await fs.readFile(path.join(signcerts, files[0]), 'utf8'));
}

/**
 * In-memory wallet with Admin@<org>.example.com for the given slug.
 * @param {'retailer'|'distributor'|'producer'} slug
 * @param {string} [label]
 */
async function buildOrgAdminWallet(slug, label = 'admin') {
  const org = PEER_ORGS.find((o) => o.slug === slug);
  if (!org) {
    throw new Error(`Unknown org slug: ${slug}`);
  }
  const { adminMspDir } = orgCertificatePaths(slug);
  const certificate = await readAdminCertificatePem(adminMspDir);
  const privateKey = await readPrivateKeyPem(adminMspDir);
  const wallet = await Wallets.newInMemoryWallet();
  await wallet.put(label, {
    credentials: { certificate, privateKey },
    mspId: org.mspId,
    type: 'X.509',
  });
  return wallet;
}

/**
 * @param {'retailer'|'distributor'|'producer'} slug
 * @param {import('fabric-network').GatewayOptions} [gatewayOpts]
 */
async function connectGatewayForOrg(slug, gatewayOpts = {}) {
  const org = PEER_ORGS.find((o) => o.slug === slug);
  if (!org) {
    throw new Error(`Unknown org slug: ${slug}`);
  }
  const wallet = await buildOrgAdminWallet(slug, 'admin');
  const gateway = new Gateway();
  await gateway.connect(getConnectionProfile({ clientOrganization: org.ccpOrgKey }), {
    wallet,
    identity: 'admin',
    discovery: { enabled: true, asLocalhost: false },
    ...gatewayOpts,
  });
  return gateway;
}

module.exports = {
  NETWORK_ROOT,
  ORDERER_MSP_ID,
  ORDERER_ENDPOINT,
  ORDERER_TLS_CA_CERT,
  CHANNEL,
  CHAINCODE,
  PEER_ORGS,
  peerDomain,
  orgCertificatePaths,
  getConnectionProfile,
  buildOrgAdminWallet,
  connectGatewayForOrg,
};
