package main

import (
	"bytes"
	"encoding/json"
	"fmt"

	"github.com/hyperledger/fabric-chaincode-go/shim"
	"github.com/hyperledger/fabric-protos-go/peer"
	"github.com/hyperledger/fabric-protos-go/msp"
	"github.com/golang/protobuf/proto"
)

// SimpleChaincode implements the chaincode interface
type SimpleChaincode struct {
}

type asset struct {
	ObjectType  string `json:"docType"`
	AssetID     string `json:"assetId"`
	Name        string `json:"name"`
	Description string `json:"description"`
	Owner       string `json:"owner"`
	Status      string `json:"status"`
	Value       string `json:"value"`
}

func main() {
	err := shim.Start(new(SimpleChaincode))
	if err != nil {
		fmt.Printf("Error starting chaincode: %s", err)
	}
}

func (t *SimpleChaincode) Init(stub shim.ChaincodeStubInterface) peer.Response {
	fmt.Println("Asset Chaincode initialized successfully")
	return shim.Success([]byte("Success"))
}

func (t *SimpleChaincode) Invoke(stub shim.ChaincodeStubInterface) peer.Response {
	function, args := stub.GetFunctionAndParameters()

	switch function {
	case "CreateAsset":
		return t.CreateAsset(stub, args)
	case "ReadAsset":
		return t.ReadAsset(stub, args)
	case "UpdateAsset":
		return t.UpdateAsset(stub, args)
	case "DeleteAsset":
		return t.DeleteAsset(stub, args)
	case "GetAllAssets":
		return t.GetAllAssets(stub, args)
	case "GetAssetHistory":
		return t.GetAssetHistory(stub, args)
	default:
		return shim.Error("Invalid function name: " + function)
	}
}

// Helper: get MSP ID from creator identity
func getMSPID(stub shim.ChaincodeStubInterface) (string, error) {
	creator, err := stub.GetCreator()
	if err != nil {
		return "", fmt.Errorf("failed to get creator: %v", err)
	}

	sid := &msp.SerializedIdentity{}
	err = proto.Unmarshal(creator, sid)
	if err != nil {
		return "", fmt.Errorf("failed to unmarshal creator: %v", err)
	}

	return sid.Mspid, nil
}

// Helper: get private collection name based on MSP ID
func getCollectionName(stub shim.ChaincodeStubInterface) (string, error) {
	mspid, err := getMSPID(stub)
	if err != nil {
		return "", fmt.Errorf("failed to get mspid")
	}

	switch mspid {
	case "BuyerMSP":
		return "buyerPrivateDetails", nil
	case "SellerMSP":
		return "sellerPrivateDetails", nil
	default:
		return "", fmt.Errorf("unknown MSP ID: %s", mspid)
	}
}

// CreateAsset stores a new asset in the private collection of the caller's org
func (t *SimpleChaincode) CreateAsset(stub shim.ChaincodeStubInterface, args []string) peer.Response {
	if len(args) < 6 {
		return shim.Error("Incorrect number of arguments. Expecting 6: assetId, name, description, owner, status, value")
	}

	assetID     := args[0]
	name        := args[1]
	description := args[2]
	owner       := args[3]
	status      := args[4]
	value       := args[5]

	collection, err := getCollectionName(stub)
	if err != nil {
		return shim.Error(err.Error())
	}

	// Check if asset already exists
	existing, err := stub.GetPrivateData(collection, assetID)
	if err != nil {
		return shim.Error("Failed to check existing asset: " + err.Error())
	}
	if existing != nil {
		return shim.Error("Asset already exists: " + assetID)
	}

	a := asset{"asset", assetID, name, description, owner, status, value}
	assetBytes, err := json.Marshal(a)
	if err != nil {
		return shim.Error(err.Error())
	}

	err = stub.PutPrivateData(collection, assetID, assetBytes)
	if err != nil {
		return shim.Error(err.Error())
	}

	return shim.Success([]byte("Asset created successfully"))
}

// ReadAsset retrieves an asset from the caller's org private collection
func (t *SimpleChaincode) ReadAsset(stub shim.ChaincodeStubInterface, args []string) peer.Response {
	if len(args) != 1 {
		return shim.Error("Incorrect number of arguments. Expecting 1: assetId")
	}

	assetID := args[0]
	collection, err := getCollectionName(stub)
	if err != nil {
		return shim.Error(err.Error())
	}

	assetBytes, err := stub.GetPrivateData(collection, assetID)
	if err != nil {
		return shim.Error("Failed to get asset: " + assetID)
	}
	if assetBytes == nil {
		return shim.Error("Asset does not exist: " + assetID)
	}

	return shim.Success(assetBytes)
}

// UpdateAsset updates an existing asset in the caller's org private collection
func (t *SimpleChaincode) UpdateAsset(stub shim.ChaincodeStubInterface, args []string) peer.Response {
	if len(args) < 6 {
		return shim.Error("Incorrect number of arguments. Expecting 6: assetId, name, description, owner, status, value")
	}

	assetID     := args[0]
	name        := args[1]
	description := args[2]
	owner       := args[3]
	status      := args[4]
	value       := args[5]

	collection, err := getCollectionName(stub)
	if err != nil {
		return shim.Error(err.Error())
	}

	existing, err := stub.GetPrivateData(collection, assetID)
	if err != nil {
		return shim.Error("Failed to get asset: " + err.Error())
	}
	if existing == nil {
		return shim.Error("Asset does not exist: " + assetID)
	}

	a := asset{"asset", assetID, name, description, owner, status, value}
	assetBytes, err := json.Marshal(a)
	if err != nil {
		return shim.Error(err.Error())
	}

	err = stub.PutPrivateData(collection, assetID, assetBytes)
	if err != nil {
		return shim.Error(err.Error())
	}

	return shim.Success([]byte("Asset updated successfully"))
}

// DeleteAsset removes an asset from the caller's org private collection
func (t *SimpleChaincode) DeleteAsset(stub shim.ChaincodeStubInterface, args []string) peer.Response {
	if len(args) != 1 {
		return shim.Error("Incorrect number of arguments. Expecting 1: assetId")
	}

	assetID := args[0]
	collection, err := getCollectionName(stub)
	if err != nil {
		return shim.Error(err.Error())
	}

	err = stub.DelPrivateData(collection, assetID)
	if err != nil {
		return shim.Error(fmt.Sprintf("Failed to delete asset: %s", assetID))
	}

	return shim.Success([]byte("Asset deleted successfully"))
}

// GetAllAssets returns all assets in the caller's org private collection
func (t *SimpleChaincode) GetAllAssets(stub shim.ChaincodeStubInterface, args []string) peer.Response {
	queryString := `{"selector":{"docType":"asset"}}`

	collection, err := getCollectionName(stub)
	if err != nil {
		return shim.Error(err.Error())
	}

	resultsIterator, err := stub.GetPrivateDataQueryResult(collection, queryString)
	if err != nil {
		return shim.Error(err.Error())
	}
	defer resultsIterator.Close()

	var buffer bytes.Buffer
	buffer.WriteString("[")

	written := false
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return shim.Error(err.Error())
		}

		if written {
			buffer.WriteString(",")
		}
		buffer.WriteString(`{"Key":"`)
		buffer.WriteString(queryResponse.Key)
		buffer.WriteString(`", "Record":`)
		buffer.WriteString(string(queryResponse.Value))
		buffer.WriteString("}")
		written = true
	}
	buffer.WriteString("]")

	return shim.Success(buffer.Bytes())
}

// GetAssetHistory returns the history of an asset from the public ledger
func (t *SimpleChaincode) GetAssetHistory(stub shim.ChaincodeStubInterface, args []string) peer.Response {
	if len(args) != 1 {
		return shim.Error("Incorrect number of arguments. Expecting 1: assetId")
	}

	assetID := args[0]

	resultsIterator, err := stub.GetHistoryForKey(assetID)
	if err != nil {
		return shim.Error(err.Error())
	}
	defer resultsIterator.Close()

	var buffer bytes.Buffer
	buffer.WriteString("[")

	written := false
	for resultsIterator.HasNext() {
		response, err := resultsIterator.Next()
		if err != nil {
			return shim.Error(err.Error())
		}

		if written {
			buffer.WriteString(",")
		}
		buffer.WriteString(`{"TxId":"`)
		buffer.WriteString(response.TxId)
		buffer.WriteString(`", "Value":`)
		if response.IsDelete {
			buffer.WriteString("null")
		} else {
			buffer.WriteString(string(response.Value))
		}
		buffer.WriteString(`,"IsDelete":"`)
		buffer.WriteString(fmt.Sprintf("%v", response.IsDelete))
		buffer.WriteString(`"}`)
		written = true
	}
	buffer.WriteString("]")

	return shim.Success(buffer.Bytes())
}
