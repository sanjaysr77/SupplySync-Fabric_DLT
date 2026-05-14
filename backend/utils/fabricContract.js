'use strict';

const { connectGatewayForOrg, CHANNEL } = require('../config/fabric');

/**
 * @param {'retailer'|'distributor'|'producer'} orgSlug
 * @param {string} chaincodeId
 * @param {(contract: import('fabric-network').Contract) => Promise<unknown>} callback
 */
async function withChaincodeContract(orgSlug, chaincodeId, callback) {
  const gateway = await connectGatewayForOrg(orgSlug);
  try {
    const network = await gateway.getNetwork(CHANNEL.id);
    const contract = network.getContract(chaincodeId);
    return await callback(contract);
  } finally {
    gateway.disconnect();
  }
}

async function withPurchaseOrderContract(orgSlug, callback) {
  return withChaincodeContract(orgSlug, 'purchaseorder', callback);
}

module.exports = {
  withChaincodeContract,
  withPurchaseOrderContract,
};
