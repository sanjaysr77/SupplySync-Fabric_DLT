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

type user struct {
	ObjectType string `json:"docType"`
	Name       string `json:"name"`
	Email      string `json:"email"`
	Phone      string `json:"phone"`
	Status     string `json:"status"`
	Role       string `json:"role"`
	Password   string `json:"password"`
}

type adminuser struct {
	ObjectType string `json:"docType"`
	Name       string `json:"name"`
	Email      string `json:"email"`
	Phone      string `json:"phone"`
	Status     string `json:"status"`
	UID        string `json:"uid"`
	Password   string `json:"password"`
}

type organization struct {
	ObjectType string `json:"docType"`
	Name       string `json:"name"`
	Type       string `json:"type"`
	GLN        string `json:"gln"`
	Address    string `json:"address"`
	City       string `json:"city"`
	State      string `json:"state"`
	Country    string `json:"country"`
	ZIP        string `json:"zip"`
	Email      string `json:"email"`
	Fax        string `json:"fax"`
	Website    string `json:"website"`
	Phone      string `json:"phone"`
}

// Main function
func main() {
	err := shim.Start(new(SimpleChaincode))
	if err != nil {
		fmt.Printf("Error starting chaincode: %s", err)
	}
}

// Init initializes chaincode
func (t *SimpleChaincode) Init(stub shim.ChaincodeStubInterface) peer.Response {
	fmt.Println("User Chaincode initialized successfully")
	return shim.Success([]byte("Success"))
}

// Invoke is the entry point for invocations
func (t *SimpleChaincode) Invoke(stub shim.ChaincodeStubInterface) peer.Response {
	function, args := stub.GetFunctionAndParameters()
	
	switch function {
	case "initUser":
		return t.initUser(stub, args)
	case "initAdmin":
		return t.initAdmin(stub, args)
	case "initOrg":
		return t.initOrg(stub, args)
	case "readall":
		return t.readall(stub, args)
	case "readUser":
		return t.readUser(stub, args)
	case "deleteUser":
		return t.deleteUser(stub, args)
	default:
		return shim.Error("Invalid function name: " + function)
	}
}

// Helper function to get MSP ID from creator identity
func getMSPID(stub shim.ChaincodeStubInterface) (string, error) {
	creator, err := stub.GetCreator()
	if err != nil {
		return "", fmt.Errorf("Failed to get creator: %v", err)
	}
	
	sid := &msp.SerializedIdentity{}
	err = proto.Unmarshal(creator, sid)
	if err != nil {
		return "", fmt.Errorf("Failed to unmarshal creator: %v", err)
	}
	
	return sid.Mspid, nil
}

// Get collection name based on MSP ID
func getCollectionName(stub shim.ChaincodeStubInterface) (string, error) {
	mspid, err := getMSPID(stub)
	if err != nil {
		return "", fmt.Errorf("Failed to get mspid")
	}
	
	switch mspid {
	case "SuperAdminMSP":
		return "superAdminPrivateDetails", nil
	case "ManufacturerMSP":
		return "manUserPrivateDetails", nil
	case "DistributorMSP":
		return "distUserPrivateDetails", nil
	case "Wholesaler1MSP":
		return "whol1UserPrivateDetails", nil
	case "Wholesaler2MSP":
		return "whol2UserPrivateDetails", nil
	case "Retailer1MSP":
		return "ret1UserPrivateDetails", nil
	case "Retailer2MSP":
		return "ret2UserPrivateDetails", nil
	case "Retailer3MSP":
		return "ret3UserPrivateDetails", nil
	case "Logistics1MSP":
		return "log1UserPrivateDetails", nil
	case "Logistics2MSP":
		return "log2UserPrivateDetails", nil
	default:
		return "", fmt.Errorf("Unknown MSP ID: %s", mspid)
	}
}

// Create user
func (t *SimpleChaincode) initUser(stub shim.ChaincodeStubInterface, args []string) peer.Response {
	if len(args) < 6 {
		return shim.Error("Incorrect number of arguments")
	}
	
	Name := args[0]
	Email := args[1]
	Phone := args[2]
	Status := args[3]
	Role := args[4]
	Password := args[5]
	
	collection, err := getCollectionName(stub)
	if err != nil {
		return shim.Error(err.Error())
	}
	
	objectType := "user"
	user := user{objectType, Name, Email, Phone, Status, Role, Password}
	userJSONasBytes, err := json.Marshal(user)
	if err != nil {
		return shim.Error(err.Error())
	}
	
	err = stub.PutPrivateData(collection, Name, userJSONasBytes)
	if err != nil {
		return shim.Error(err.Error())
	}
	
	return shim.Success([]byte("Success"))
}

// Create admin user
func (t *SimpleChaincode) initAdmin(stub shim.ChaincodeStubInterface, args []string) peer.Response {
	if len(args) < 6 {
		return shim.Error("Incorrect number of arguments")
	}
	
	Name := args[0]
	Email := args[1]
	Phone := args[2]
	Status := args[3]
	UID := args[4]
	Password := args[5]
	
	collection, err := getCollectionName(stub)
	if err != nil {
		return shim.Error(err.Error())
	}
	
	objectType := "adminuser"
	user := adminuser{objectType, Name, Email, Phone, Status, UID, Password}
	userJSONasBytes, err := json.Marshal(user)
	if err != nil {
		return shim.Error(err.Error())
	}
	
	err = stub.PutPrivateData(collection, Name, userJSONasBytes)
	if err != nil {
		return shim.Error(err.Error())
	}
	
	return shim.Success([]byte("Success"))
}

// Create organization
func (t *SimpleChaincode) initOrg(stub shim.ChaincodeStubInterface, args []string) peer.Response {
	if len(args) < 12 {
		return shim.Error("Incorrect number of arguments")
	}
	
	Name := args[0]
	Type := args[1]
	GLN := args[2]
	Address := args[3]
	City := args[4]
	State := args[5]
	Country := args[6]
	ZIP := args[7]
	Email := args[8]
	Fax := args[9]
	Website := args[10]
	Phone := args[11]
	
	collection, err := getCollectionName(stub)
	if err != nil {
		return shim.Error(err.Error())
	}
	
	objectType := "organization"
	org := organization{objectType, Name, Type, GLN, Address, City, State, Country, ZIP, Email, Fax, Website, Phone}
	orgJSONasBytes, err := json.Marshal(org)
	if err != nil {
		return shim.Error(err.Error())
	}
	
	err = stub.PutPrivateData(collection, Name, orgJSONasBytes)
	if err != nil {
		return shim.Error(err.Error())
	}
	
	return shim.Success([]byte("Success"))
}

// Read user
func (t *SimpleChaincode) readUser(stub shim.ChaincodeStubInterface, args []string) peer.Response {
	if len(args) != 1 {
		return shim.Error("Incorrect number of arguments")
	}
	
	userName := args[0]
	collection, err := getCollectionName(stub)
	if err != nil {
		return shim.Error(err.Error())
	}
	
	valAsbytes, err := stub.GetPrivateData(collection, userName)
	if err != nil {
		return shim.Error("Failed to get state for " + userName)
	} else if valAsbytes == nil {
		return shim.Error("User does not exist: " + userName)
	}
	
	return shim.Success(valAsbytes)
}

// Read all users/organizations
func (t *SimpleChaincode) readall(stub shim.ChaincodeStubInterface, args []string) peer.Response {
	if len(args) < 1 {
		return shim.Error("Incorrect number of arguments")
	}
	
	queryString := fmt.Sprintf("{\"selector\":{\"docType\":\"%s\"}}", args[0])
	
	collection, err := getCollectionName(stub)
	if err != nil {
		return shim.Error(err.Error())
	}
	
	queryResults, err := getQueryResultForQueryString(stub, queryString, collection)
	if err != nil {
		return shim.Error(err.Error())
	}
	
	return shim.Success(queryResults)
}

// Delete user
func (t *SimpleChaincode) deleteUser(stub shim.ChaincodeStubInterface, args []string) peer.Response {
	if len(args) != 1 {
		return shim.Error("Incorrect number of arguments")
	}
	
	userName := args[0]
	collection, err := getCollectionName(stub)
	if err != nil {
		return shim.Error(err.Error())
	}
	
	err = stub.DelPrivateData(collection, userName)
	if err != nil {
		return shim.Error(fmt.Sprintf("Failed to delete user: %s", userName))
	}
	
	return shim.Success(nil)
}

// Helper function for querying
func getQueryResultForQueryString(stub shim.ChaincodeStubInterface, queryString string, collection string) ([]byte, error) {
	resultsIterator, err := stub.GetPrivateDataQueryResult(collection, queryString)
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()
	
	var buffer bytes.Buffer
	buffer.WriteString("[")
	
	bArrayMemberAlreadyWritten := false
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}
		
		if bArrayMemberAlreadyWritten == true {
			buffer.WriteString(",")
		}
		buffer.WriteString("{\"Key\":\"")
		buffer.WriteString(queryResponse.Key)
		buffer.WriteString("\", \"Record\":")
		buffer.WriteString(string(queryResponse.Value))
		buffer.WriteString("}")
		bArrayMemberAlreadyWritten = true
	}
	buffer.WriteString("]")
	
	return buffer.Bytes(), nil
}
