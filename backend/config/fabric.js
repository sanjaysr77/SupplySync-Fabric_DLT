'use strict';

/**
 * Hyperledger Fabric connection settings aligned with:
 * - network/configtx/configtx.yaml — profile ThreeOrgsChannel (Application orgs: Retailer, Distributor, Producer; OrdererMSP; orderer.example.com:7050)
 * - network/docker/docker-compose-network.yaml — peer listen ports on host
 * - network/scripts/deploy-channels.sh — channel mychannel, configtxgen -profile ThreeOrgsChannel
 * - network/scripts/deploy-chaincodes.sh — chaincode names, version, endorsement policy
 */

const path = require('path');
const fs = require('fs').promises;
const { Gateway, Wallets } = require('fabric-network');

/** Absolute path to the `network/` directory (contains organizations/, channel-artifacts/, scripts). */
const NETWORK_ROOT = path.resolve(__dirname, '../../network');

/**
 * configtx.yaml → Profiles → ThreeOrgsChannel (channel creation uses this profile).
 * Application organization order matches the YAML list: Retailer, Distributor, Producer.
 */
const CONFIGTX_PROFILE = 'ThreeOrgsChannel';

const ORDERER_MSP_ID = 'OrdererMSP';

/** configtx.yaml Orderer → OrdererDefaults → Addresses */
const ORDERER_ENDPOINT = {
  host: 'orderer.example.com',
  port: 7050,
};

const CHANNEL = {
  /** Channel ID (scripts/deploy-channels.sh, deploy-chaincodes.sh) */
  id: 'mychannel',
  configtxProfile: CONFIGTX_PROFILE,
};

/**
 * Chaincode lifecycle as deployed by network/scripts/deploy-chaincodes.sh
 * (network.sh deploycc).
 */
const CHAINCODE = {
  names: ['purchaseorder', 'shipment', 'dppcontract'],
  version: '1.0',
  sequence: 1,
  endorsementPolicy: "OR('RetailerMSP.peer','DistributorMSP.peer','ProducerMSP.peer')",
};

/**
 * Peer org definitions: MSP Name / ID from configtx.yaml (&Retailer, &Distributor, &Producer).
 * Host ports from docker-compose-network.yaml published ports.
 * gRPC TLS server name from CORE_PEER_ADDRESS in compose (must match ssl-target-name-override when using localhost).
 */
const PEER_ORGS = [
  {
    ccpOrgKey: 'Retailer',
    slug: 'retailer',
    mspId: 'RetailerMSP',
    peerId: 'peer0.retailer.example.com',
    hostPort: 7051,
  },
  {
    ccpOrgKey: 'Distributor',
    slug: 'distributor',
    mspId: 'DistributorMSP',
    peerId: 'peer0.distributor.example.com',
    hostPort: 8051,
  },
  {
    ccpOrgKey: 'Producer',
    slug: 'producer',
    mspId: 'ProducerMSP',
    peerId: 'peer0.producer.example.com',
    hostPort: 9051,
  },
];

function peerDomain(slug) {
  return `${slug}.example.com`;
}

/**
 * Certificate paths under NETWORK_ROOT (generated crypto layout).
 * MSPDir in configtx for each peer org: organizations/peerOrganizations/<domain>/msp
 */
function orgCertificatePaths(slug) {
  const domain = peerDomain(slug);
  const peerOrgBase = path.join(NETWORK_ROOT, 'organizations', 'peerOrganizations', domain);
  return {
    /** configtx MSPDir equivalent (org MSP) */
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

/** Same host mapping as network/scripts/deploy-channels.sh and deploy-chaincodes.sh (localhost). */
function getOrdererGrpcUrl() {
  return `grpcs://localhost:${ORDERER_ENDPOINT.port}`;
}

function getPeerGrpcUrl(hostPort) {
  return `grpcs://localhost:${hostPort}`;
}

/**
 * fabric-network / fabric-common connection profile (Common Connection Profile style).
 * @param {object} [opts]
 * @param {string} [opts.clientOrganization] — CCP organizations key (default Retailer)
 */
function getConnectionProfile(opts = {}) {
  const clientOrganization = opts.clientOrganization || 'Retailer';

  const peers = {};
  for (const o of PEER_ORGS) {
    const { peerTlsCaCert } = orgCertificatePaths(o.slug);
    peers[o.peerId] = {
      url: getPeerGrpcUrl(o.hostPort),
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
 * In-memory wallet with one identity: Admin@<org>.example.com for the given slug.
 * @param {'retailer'|'distributor'|'producer'} slug
 * @param {string} [label] — wallet label (default: admin)
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
 * Connect Gateway using this repo's CCP and an org Admin identity.
 * @param {'retailer'|'distributor'|'producer'} slug
 * @param {import('fabric-network').GatewayOptions} [gatewayOpts] — overrides (e.g. discovery)
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
    discovery: { enabled: true, asLocalhost: true },
    ...gatewayOpts,
  });
  return gateway;
}

module.exports = {
  NETWORK_ROOT,
  CONFIGTX_PROFILE,
  ORDERER_MSP_ID,
  ORDERER_ENDPOINT,
  ORDERER_TLS_CA_CERT,
  CHANNEL,
  CHAINCODE,
  /** Ordered as in configtx ThreeOrgsChannel Application Organizations */
  PEER_ORGS,
  peerDomain,
  orgCertificatePaths,
  getConnectionProfile,
  buildOrgAdminWallet,
  connectGatewayForOrg,
};
