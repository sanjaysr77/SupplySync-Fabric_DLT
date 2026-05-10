package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/golang/protobuf/proto"
	"github.com/hyperledger/fabric-chaincode-go/shim"
	"github.com/hyperledger/fabric-protos-go/msp"
	"github.com/hyperledger/fabric-protos-go/peer"
)

type PurchaseOrderChaincode struct{}

type PurchaseOrder struct {
	DocType             string `json:"docType"`
	POID                string `json:"poId"`
	POType              string `json:"poType"`
	FromOrg             string `json:"fromOrg"`
	ToOrg               string `json:"toOrg"`
	ProductID           string `json:"productId"`
	Quantity            string `json:"quantity"`
	RequestedDelivery   string `json:"requestedDeliveryDate"`
	LinkedRetailerPOID  string `json:"linkedRetailerPOId,omitempty"`
	Status              string `json:"status"`
	DecisionNote        string `json:"decisionNote,omitempty"`
	DistributorDispatch string `json:"distributorDispatchDate,omitempty"`
	CreatedAtTxID       string `json:"createdAtTxId"`
	LastUpdatedTxID     string `json:"lastUpdatedTxId"`
}

func main() {
	if err := shim.Start(new(PurchaseOrderChaincode)); err != nil {
		fmt.Printf("Error starting purchase order chaincode: %s", err)
	}
}

func (p *PurchaseOrderChaincode) Init(stub shim.ChaincodeStubInterface) peer.Response {
	return shim.Success([]byte("PurchaseOrderChaincode initialized"))
}

func (p *PurchaseOrderChaincode) Invoke(stub shim.ChaincodeStubInterface) peer.Response {
	function, args := stub.GetFunctionAndParameters()
	switch function {
	case "CreateRetailerPO":
		return p.CreateRetailerPO(stub, args)
	case "CreateDistributorPO":
		return p.CreateDistributorPO(stub, args)
	case "RespondToDistributorPO":
		return p.RespondToDistributorPO(stub, args)
	case "MarkDistributorDispatch":
		return p.MarkDistributorDispatch(stub, args)
	case "GetPO":
		return p.GetPO(stub, args)
	case "GetAllPOs":
		return p.GetAllPOs(stub)
	default:
		return shim.Error("Invalid function name: " + function)
	}
}

func getMSPID(stub shim.ChaincodeStubInterface) (string, error) {
	creator, err := stub.GetCreator()
	if err != nil {
		return "", fmt.Errorf("failed to get creator: %v", err)
	}
	sid := &msp.SerializedIdentity{}
	if err := proto.Unmarshal(creator, sid); err != nil {
		return "", fmt.Errorf("failed to unmarshal creator: %v", err)
	}
	return sid.Mspid, nil
}

func requireMSP(stub shim.ChaincodeStubInterface, expected string) error {
	mspID, err := getMSPID(stub)
	if err != nil {
		return err
	}
	if mspID != expected {
		return fmt.Errorf("access denied: required %s, got %s", expected, mspID)
	}
	return nil
}

func isISODate(v string) bool {
	_, err := time.Parse("2006-01-02", v)
	return err == nil
}

func poKey(poID string) string {
	return "PO_" + poID
}

func (p *PurchaseOrderChaincode) CreateRetailerPO(stub shim.ChaincodeStubInterface, args []string) peer.Response {
	// poId, productId, quantity, requestedDeliveryDate, notes
	if len(args) < 4 {
		return shim.Error("Expecting at least 4 args: poId, productId, quantity, requestedDeliveryDate, [notes]")
	}
	if err := requireMSP(stub, "RetailerMSP"); err != nil {
		return shim.Error(err.Error())
	}
	if !isISODate(args[3]) {
		return shim.Error("requestedDeliveryDate must be YYYY-MM-DD")
	}
	key := poKey(args[0])
	existing, err := stub.GetState(key)
	if err != nil {
		return shim.Error(err.Error())
	}
	if existing != nil {
		return shim.Error("PO already exists: " + args[0])
	}

	po := PurchaseOrder{
		DocType:           "purchaseOrder",
		POID:              args[0],
		POType:            "RETAILER_TO_DISTRIBUTOR",
		FromOrg:           "RetailerMSP",
		ToOrg:             "DistributorMSP",
		ProductID:         args[1],
		Quantity:          args[2],
		RequestedDelivery: args[3],
		Status:            "OPEN",
		CreatedAtTxID:     stub.GetTxID(),
		LastUpdatedTxID:   stub.GetTxID(),
	}
	if len(args) > 4 {
		po.DecisionNote = args[4]
	}
	b, _ := json.Marshal(po)
	if err := stub.PutState(key, b); err != nil {
		return shim.Error(err.Error())
	}
	return shim.Success(b)
}

func (p *PurchaseOrderChaincode) CreateDistributorPO(stub shim.ChaincodeStubInterface, args []string) peer.Response {
	// poId, productId, quantity, requestedDeliveryDate, linkedRetailerPOId, notes
	if len(args) < 5 {
		return shim.Error("Expecting at least 5 args: poId, productId, quantity, requestedDeliveryDate, linkedRetailerPOId, [notes]")
	}
	if err := requireMSP(stub, "DistributorMSP"); err != nil {
		return shim.Error(err.Error())
	}
	if !isISODate(args[3]) {
		return shim.Error("requestedDeliveryDate must be YYYY-MM-DD")
	}
	if args[4] != "" {
		retailerPO, err := stub.GetState(poKey(args[4]))
		if err != nil {
			return shim.Error(err.Error())
		}
		if retailerPO == nil {
			return shim.Error("linked retailer PO not found: " + args[4])
		}
	}
	key := poKey(args[0])
	existing, err := stub.GetState(key)
	if err != nil {
		return shim.Error(err.Error())
	}
	if existing != nil {
		return shim.Error("PO already exists: " + args[0])
	}

	po := PurchaseOrder{
		DocType:            "purchaseOrder",
		POID:               args[0],
		POType:             "DISTRIBUTOR_TO_PRODUCER",
		FromOrg:            "DistributorMSP",
		ToOrg:              "ProducerMSP",
		ProductID:          args[1],
		Quantity:           args[2],
		RequestedDelivery:  args[3],
		LinkedRetailerPOID: args[4],
		Status:             "PENDING_PRODUCER_RESPONSE",
		CreatedAtTxID:      stub.GetTxID(),
		LastUpdatedTxID:    stub.GetTxID(),
	}
	if len(args) > 5 {
		po.DecisionNote = args[5]
	}
	b, _ := json.Marshal(po)
	if err := stub.PutState(key, b); err != nil {
		return shim.Error(err.Error())
	}
	return shim.Success(b)
}

func (p *PurchaseOrderChaincode) RespondToDistributorPO(stub shim.ChaincodeStubInterface, args []string) peer.Response {
	// poId, decision(ACCEPT|REJECT), note
	if len(args) < 2 {
		return shim.Error("Expecting at least 2 args: poId, decision, [note]")
	}
	if err := requireMSP(stub, "ProducerMSP"); err != nil {
		return shim.Error(err.Error())
	}
	key := poKey(args[0])
	poBytes, err := stub.GetState(key)
	if err != nil {
		return shim.Error(err.Error())
	}
	if poBytes == nil {
		return shim.Error("PO not found: " + args[0])
	}
	var po PurchaseOrder
	if err := json.Unmarshal(poBytes, &po); err != nil {
		return shim.Error(err.Error())
	}
	if po.POType != "DISTRIBUTOR_TO_PRODUCER" {
		return shim.Error("only DISTRIBUTOR_TO_PRODUCER PO can be responded by producer")
	}
	switch strings.ToUpper(args[1]) {
	case "ACCEPT":
		po.Status = "PRODUCER_ACCEPTED"
	case "REJECT":
		po.Status = "PRODUCER_REJECTED"
	default:
		return shim.Error("decision must be ACCEPT or REJECT")
	}
	if len(args) > 2 {
		po.DecisionNote = args[2]
	}
	po.LastUpdatedTxID = stub.GetTxID()
	updated, _ := json.Marshal(po)
	if err := stub.PutState(key, updated); err != nil {
		return shim.Error(err.Error())
	}
	return shim.Success(updated)
}

func (p *PurchaseOrderChaincode) MarkDistributorDispatch(stub shim.ChaincodeStubInterface, args []string) peer.Response {
	// poId, dispatchDate
	if len(args) != 2 {
		return shim.Error("Expecting 2 args: poId, dispatchDate")
	}
	if err := requireMSP(stub, "DistributorMSP"); err != nil {
		return shim.Error(err.Error())
	}
	if !isISODate(args[1]) {
		return shim.Error("dispatchDate must be YYYY-MM-DD")
	}
	key := poKey(args[0])
	poBytes, err := stub.GetState(key)
	if err != nil {
		return shim.Error(err.Error())
	}
	if poBytes == nil {
		return shim.Error("PO not found: " + args[0])
	}
	var po PurchaseOrder
	if err := json.Unmarshal(poBytes, &po); err != nil {
		return shim.Error(err.Error())
	}
	if po.POType != "RETAILER_TO_DISTRIBUTOR" {
		return shim.Error("dispatch marking is only valid for retailer->distributor PO")
	}
	po.DistributorDispatch = args[1]
	po.Status = "DISPATCHED_TO_RETAILER"
	po.LastUpdatedTxID = stub.GetTxID()
	updated, _ := json.Marshal(po)
	if err := stub.PutState(key, updated); err != nil {
		return shim.Error(err.Error())
	}
	return shim.Success(updated)
}

func (p *PurchaseOrderChaincode) GetPO(stub shim.ChaincodeStubInterface, args []string) peer.Response {
	if len(args) != 1 {
		return shim.Error("Expecting 1 arg: poId")
	}
	b, err := stub.GetState(poKey(args[0]))
	if err != nil {
		return shim.Error(err.Error())
	}
	if b == nil {
		return shim.Error("PO not found: " + args[0])
	}
	return shim.Success(b)
}

func (p *PurchaseOrderChaincode) GetAllPOs(stub shim.ChaincodeStubInterface) peer.Response {
	iter, err := stub.GetStateByRange("PO_", "PO_~")
	if err != nil {
		return shim.Error(err.Error())
	}
	defer iter.Close()
	var buf bytes.Buffer
	buf.WriteString("[")
	written := false
	for iter.HasNext() {
		kv, err := iter.Next()
		if err != nil {
			return shim.Error(err.Error())
		}
		if written {
			buf.WriteString(",")
		}
		buf.Write(kv.Value)
		written = true
	}
	buf.WriteString("]")
	return shim.Success(buf.Bytes())
}
