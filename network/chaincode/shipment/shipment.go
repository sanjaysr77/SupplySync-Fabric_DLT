package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"time"

	"github.com/golang/protobuf/proto"
	"github.com/hyperledger/fabric-chaincode-go/shim"
	"github.com/hyperledger/fabric-protos-go/msp"
	"github.com/hyperledger/fabric-protos-go/peer"
)

type ShipmentChaincode struct{}

type Shipment struct {
	DocType                  string `json:"docType"`
	ShipmentID               string `json:"shipmentId"`
	RetailerPOID             string `json:"retailerPoId"`
	DistributorPOID          string `json:"distributorPoId"`
	ProductID                string `json:"productId"`
	Quantity                 string `json:"quantity"`
	PromisedRetailerDelivery string `json:"promisedRetailerDeliveryDate"`
	DistributorDispatchDate  string `json:"distributorDispatchDate"`
	ExpectedRetailerDelivery string `json:"expectedRetailerDeliveryDate"`
	ActualRetailerDelivery   string `json:"actualRetailerDeliveryDate,omitempty"`
	Status                   string `json:"status"`
	DeliveryPerformance      string `json:"deliveryPerformance"`
	DeliveryProof            string `json:"deliveryProof,omitempty"`
	CreatedAtTxID            string `json:"createdAtTxId"`
	LastUpdatedAtTxID        string `json:"lastUpdatedTxId"`
}

func main() {
	if err := shim.Start(new(ShipmentChaincode)); err != nil {
		fmt.Printf("Error starting shipment chaincode: %s", err)
	}
}

func (s *ShipmentChaincode) Init(stub shim.ChaincodeStubInterface) peer.Response {
	return shim.Success([]byte("ShipmentChaincode initialized"))
}

func (s *ShipmentChaincode) Invoke(stub shim.ChaincodeStubInterface) peer.Response {
	function, args := stub.GetFunctionAndParameters()
	switch function {
	case "CreateShipment":
		return s.CreateShipment(stub, args)
	case "MarkDeliveredByRetailer":
		return s.MarkDeliveredByRetailer(stub, args)
	case "GetShipment":
		return s.GetShipment(stub, args)
	case "GetAllShipments":
		return s.GetAllShipments(stub)
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

func requireMSPOneOf(stub shim.ChaincodeStubInterface, allowed ...string) error {
	mspID, err := getMSPID(stub)
	if err != nil {
		return err
	}
	for _, exp := range allowed {
		if mspID == exp {
			return nil
		}
	}
	allowedStr := ""
	for i, a := range allowed {
		if i > 0 {
			allowedStr += ", "
		}
		allowedStr += a
	}
	return fmt.Errorf("access denied: required one of [%s], got %s", allowedStr, mspID)
}

func isISODate(v string) bool {
	_, err := time.Parse("2006-01-02", v)
	return err == nil
}

func shipmentKey(id string) string {
	return "SHIP_" + id
}

func (s *ShipmentChaincode) CreateShipment(stub shim.ChaincodeStubInterface, args []string) peer.Response {
	// shipmentId, retailerPoId, distributorPoId, productId, quantity, promisedRetailerDeliveryDate, dispatchDate, expectedRetailerDeliveryDate
	if len(args) != 8 {
		return shim.Error("Expecting 8 args: shipmentId, retailerPoId, distributorPoId, productId, quantity, promisedRetailerDeliveryDate, dispatchDate, expectedRetailerDeliveryDate")
	}
	if err := requireMSPOneOf(stub, "DistributorMSP", "ProducerMSP"); err != nil {
		return shim.Error(err.Error())
	}
	for _, idx := range []int{5, 6, 7} {
		if !isISODate(args[idx]) {
			return shim.Error("date fields must be YYYY-MM-DD")
		}
	}
	key := shipmentKey(args[0])
	existing, err := stub.GetState(key)
	if err != nil {
		return shim.Error(err.Error())
	}
	if existing != nil {
		return shim.Error("shipment already exists: " + args[0])
	}
	rec := Shipment{
		DocType:                  "shipment",
		ShipmentID:               args[0],
		RetailerPOID:             args[1],
		DistributorPOID:          args[2],
		ProductID:                args[3],
		Quantity:                 args[4],
		PromisedRetailerDelivery: args[5],
		DistributorDispatchDate:  args[6],
		ExpectedRetailerDelivery: args[7],
		Status:                   "IN_TRANSIT",
		DeliveryPerformance:      "PENDING",
		CreatedAtTxID:            stub.GetTxID(),
		LastUpdatedAtTxID:        stub.GetTxID(),
	}
	b, _ := json.Marshal(rec)
	if err := stub.PutState(key, b); err != nil {
		return shim.Error(err.Error())
	}
	return shim.Success(b)
}

func (s *ShipmentChaincode) MarkDeliveredByRetailer(stub shim.ChaincodeStubInterface, args []string) peer.Response {
	// shipmentId, actualDeliveryDate, deliveryProof
	if len(args) < 2 {
		return shim.Error("Expecting at least 2 args: shipmentId, actualDeliveryDate, [deliveryProof]")
	}
	if err := requireMSPOneOf(stub, "RetailerMSP"); err != nil {
		return shim.Error(err.Error())
	}
	if !isISODate(args[1]) {
		return shim.Error("actualDeliveryDate must be YYYY-MM-DD")
	}
	key := shipmentKey(args[0])
	b, err := stub.GetState(key)
	if err != nil {
		return shim.Error(err.Error())
	}
	if b == nil {
		return shim.Error("shipment not found: " + args[0])
	}
	var rec Shipment
	if err := json.Unmarshal(b, &rec); err != nil {
		return shim.Error(err.Error())
	}
	rec.ActualRetailerDelivery = args[1]
	if len(args) > 2 {
		rec.DeliveryProof = args[2]
	}
	promised, _ := time.Parse("2006-01-02", rec.PromisedRetailerDelivery)
	actual, _ := time.Parse("2006-01-02", rec.ActualRetailerDelivery)
	if actual.After(promised) {
		rec.DeliveryPerformance = "LATE_DELIVERY"
		rec.Status = "DELIVERED_LATE"
	} else {
		rec.DeliveryPerformance = "ON_TIME"
		rec.Status = "DELIVERED_ON_TIME"
	}
	rec.LastUpdatedAtTxID = stub.GetTxID()
	updated, _ := json.Marshal(rec)
	if err := stub.PutState(key, updated); err != nil {
		return shim.Error(err.Error())
	}
	return shim.Success(updated)
}

func (s *ShipmentChaincode) GetShipment(stub shim.ChaincodeStubInterface, args []string) peer.Response {
	if len(args) != 1 {
		return shim.Error("Expecting 1 arg: shipmentId")
	}
	b, err := stub.GetState(shipmentKey(args[0]))
	if err != nil {
		return shim.Error(err.Error())
	}
	if b == nil {
		return shim.Error("shipment not found: " + args[0])
	}
	return shim.Success(b)
}

func (s *ShipmentChaincode) GetAllShipments(stub shim.ChaincodeStubInterface) peer.Response {
	iter, err := stub.GetStateByRange("SHIP_", "SHIP_~")
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
