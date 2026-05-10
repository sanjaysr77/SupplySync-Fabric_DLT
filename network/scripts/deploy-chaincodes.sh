#!/bin/bash

# ============================================================================
# CHAINCODE DEPLOYMENT SCRIPT
# Deploys purchaseorder, shipment, and dppcontract chaincodes
# ============================================================================

set -e

echo "============================================================================"
echo "🚀 Deploying Domain Chaincodes"
echo "============================================================================"

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

error_exit() {
    echo -e "${RED}ERROR: $1${NC}" >&2
    exit 1
}

export PATH=${PWD}/../bin:${PATH}
export FABRIC_CFG_PATH=${PWD}/config
export CORE_PEER_TLS_ENABLED=true

ORDERER_CA=${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem
CHANNEL="mychannel"
CC_VERSION="1.0"
CC_SEQUENCE=1
CC_POLICY="OR('RetailerMSP.peer','DistributorMSP.peer','ProducerMSP.peer')"

setPeerEnv() {
    local ORG=$1
    local MSP=$2
    local PORT=$3

    export CORE_PEER_LOCALMSPID="${MSP}"
    export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/${ORG}.example.com/peers/peer0.${ORG}.example.com/tls/ca.crt
    export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/${ORG}.example.com/users/Admin@${ORG}.example.com/msp
    export CORE_PEER_ADDRESS=localhost:${PORT}
}

deployOneChaincode() {
    local CC_NAME=$1
    local CC_SRC_PATH="./chaincode/${CC_NAME}"
    local CC_LABEL="${CC_NAME}_${CC_VERSION}"

    echo ""
    echo -e "${BLUE}Deploying ${CC_NAME}...${NC}"

    peer lifecycle chaincode package ${CC_LABEL}.tar.gz \
        --path ${CC_SRC_PATH} \
        --lang golang \
        --label ${CC_LABEL} || error_exit "Failed to package ${CC_NAME}"

    echo -e "${YELLOW}Installing ${CC_NAME} on retailer...${NC}"
    setPeerEnv "retailer" "RetailerMSP" "7051"
    peer lifecycle chaincode install ${CC_LABEL}.tar.gz 2>&1 | grep -v "already successfully installed" || true

    echo -e "${YELLOW}Installing ${CC_NAME} on distributor...${NC}"
    setPeerEnv "distributor" "DistributorMSP" "8051"
    peer lifecycle chaincode install ${CC_LABEL}.tar.gz 2>&1 | grep -v "already successfully installed" || true

    echo -e "${YELLOW}Installing ${CC_NAME} on producer...${NC}"
    setPeerEnv "producer" "ProducerMSP" "9051"
    peer lifecycle chaincode install ${CC_LABEL}.tar.gz 2>&1 | grep -v "already successfully installed" || true

    setPeerEnv "retailer" "RetailerMSP" "7051"
    PACKAGE_ID=$(peer lifecycle chaincode queryinstalled 2>&1 | grep "${CC_LABEL}" | awk -F 'Package ID: ' '{print $2}' | awk -F ', Label' '{print $1}')
    if [ -z "$PACKAGE_ID" ]; then
        error_exit "Could not find package ID for ${CC_LABEL}"
    fi

    for ORG in retailer distributor producer; do
        if [ "$ORG" = "retailer" ]; then
            setPeerEnv "retailer" "RetailerMSP" "7051"
        elif [ "$ORG" = "distributor" ]; then
            setPeerEnv "distributor" "DistributorMSP" "8051"
        else
            setPeerEnv "producer" "ProducerMSP" "9051"
        fi

        peer lifecycle chaincode approveformyorg \
            -o localhost:7050 \
            --ordererTLSHostnameOverride orderer.example.com \
            --channelID $CHANNEL \
            --name $CC_NAME \
            --version $CC_VERSION \
            --package-id $PACKAGE_ID \
            --sequence $CC_SEQUENCE \
            --signature-policy "$CC_POLICY" \
            --tls \
            --cafile $ORDERER_CA || error_exit "Failed to approve ${CC_NAME} for $ORG"
    done

    setPeerEnv "retailer" "RetailerMSP" "7051"
    peer lifecycle chaincode commit \
        -o localhost:7050 \
        --ordererTLSHostnameOverride orderer.example.com \
        --channelID $CHANNEL \
        --name $CC_NAME \
        --version $CC_VERSION \
        --sequence $CC_SEQUENCE \
        --signature-policy "$CC_POLICY" \
        --tls \
        --cafile $ORDERER_CA \
        --peerAddresses localhost:7051 \
        --tlsRootCertFiles ${PWD}/organizations/peerOrganizations/retailer.example.com/peers/peer0.retailer.example.com/tls/ca.crt \
        --peerAddresses localhost:8051 \
        --tlsRootCertFiles ${PWD}/organizations/peerOrganizations/distributor.example.com/peers/peer0.distributor.example.com/tls/ca.crt \
        --peerAddresses localhost:9051 \
        --tlsRootCertFiles ${PWD}/organizations/peerOrganizations/producer.example.com/peers/peer0.producer.example.com/tls/ca.crt \
        || error_exit "Failed to commit ${CC_NAME}"

    echo -e "${GREEN}✅ ${CC_NAME} deployed on ${CHANNEL}${NC}"
}

deployOneChaincode "purchaseorder"
deployOneChaincode "shipment"
deployOneChaincode "dppcontract"

echo ""
echo -e "${GREEN}============================================================================${NC}"
echo -e "${GREEN}✅ All domain chaincodes deployed successfully on mychannel${NC}"
echo -e "${GREEN}============================================================================${NC}"
