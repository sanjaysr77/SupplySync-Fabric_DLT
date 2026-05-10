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

type DPPContractChaincode struct{}

type DPPRecord struct {
	DocType            string   `json:"docType"`
	DPPID              string   `json:"dppId"`
	BatchID            string   `json:"batchId"`
	ProductID          string   `json:"productId"`
	ProducerOrg        string   `json:"producerOrg"`
	OriginCountry      string   `json:"originCountry"`
	ManufactureDate    string   `json:"manufactureDate"`
	ExpiryDate         string   `json:"expiryDate"`
	CertificationRef   string   `json:"certificationRef"`
	ComplianceStandard string   `json:"complianceStandard"`
	MetadataJSON       string   `json:"metadataJson,omitempty"`
	CurrentHolderOrg   string   `json:"currentHolderOrg"`
	VisibilityTrail    []string `json:"visibilityTrail"`
	ComplianceStatus   string   `json:"complianceStatus"`
	ComplianceIssues   []string `json:"complianceIssues,omitempty"`
	CreatedAtTxID      string   `json:"createdAtTxId"`
	LastUpdatedAtTxID  string   `json:"lastUpdatedTxId"`
}

func main() {
	if err := shim.Start(new(DPPContractChaincode)); err != nil {
		fmt.Printf("Error starting DPP contract chaincode: %s", err)
	}
}

func (d *DPPContractChaincode) Init(stub shim.ChaincodeStubInterface) peer.Response {
	return shim.Success([]byte("DPPContractChaincode initialized"))
}

func (d *DPPContractChaincode) Invoke(stub shim.ChaincodeStubInterface) peer.Response {
	function, args := stub.GetFunctionAndParameters()
	switch function {
	case "CreateDPP":
		return d.CreateDPP(stub, args)
	case "TransferDPP":
		return d.TransferDPP(stub, args)
	case "ValidateForEU":
		return d.ValidateForEU(stub, args)
	case "GetDPP":
		return d.GetDPP(stub, args)
	case "GetAllDPP":
		return d.GetAllDPP(stub)
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

func isISODate(v string) bool {
	_, err := time.Parse("2006-01-02", v)
	return err == nil
}

func dppKey(id string) string {
	return "DPP_" + id
}

func (d *DPPContractChaincode) CreateDPP(stub shim.ChaincodeStubInterface, args []string) peer.Response {
	// dppId, batchId, productId, originCountry, manufactureDate, expiryDate, certificationRef, complianceStandard, metadataJson
	if len(args) < 8 {
		return shim.Error("Expecting at least 8 args: dppId, batchId, productId, originCountry, manufactureDate, expiryDate, certificationRef, complianceStandard, [metadataJson]")
	}
	mspID, err := getMSPID(stub)
	if err != nil {
		return shim.Error(err.Error())
	}
	if mspID != "ProducerMSP" {
		return shim.Error("only ProducerMSP can create DPP records")
	}
	if !isISODate(args[4]) || !isISODate(args[5]) {
		return shim.Error("manufactureDate and expiryDate must be YYYY-MM-DD")
	}
	mfg, _ := time.Parse("2006-01-02", args[4])
	exp, _ := time.Parse("2006-01-02", args[5])
	if !exp.After(mfg) {
		return shim.Error("expiryDate must be after manufactureDate")
	}
	key := dppKey(args[0])
	existing, err := stub.GetState(key)
	if err != nil {
		return shim.Error(err.Error())
	}
	if existing != nil {
		return shim.Error("DPP record already exists: " + args[0])
	}
	rec := DPPRecord{
		DocType:            "dppRecord",
		DPPID:              args[0],
		BatchID:            args[1],
		ProductID:          args[2],
		ProducerOrg:        "ProducerMSP",
		OriginCountry:      strings.ToUpper(args[3]),
		ManufactureDate:    args[4],
		ExpiryDate:         args[5],
		CertificationRef:   args[6],
		ComplianceStandard: args[7],
		CurrentHolderOrg:   "ProducerMSP",
		VisibilityTrail:    []string{"ProducerMSP"},
		CreatedAtTxID:      stub.GetTxID(),
		LastUpdatedAtTxID:  stub.GetTxID(),
	}
	if len(args) > 8 {
		rec.MetadataJSON = args[8]
	}
	d.applyComplianceCheck(&rec)
	b, _ := json.Marshal(rec)
	if err := stub.PutState(key, b); err != nil {
		return shim.Error(err.Error())
	}
	return shim.Success(b)
}

func (d *DPPContractChaincode) TransferDPP(stub shim.ChaincodeStubInterface, args []string) peer.Response {
	// dppId, toOrgMSP
	if len(args) != 2 {
		return shim.Error("Expecting 2 args: dppId, toOrgMSP")
	}
	mspID, err := getMSPID(stub)
	if err != nil {
		return shim.Error(err.Error())
	}
	key := dppKey(args[0])
	b, err := stub.GetState(key)
	if err != nil {
		return shim.Error(err.Error())
	}
	if b == nil {
		return shim.Error("DPP record not found: " + args[0])
	}
	var rec DPPRecord
	if err := json.Unmarshal(b, &rec); err != nil {
		return shim.Error(err.Error())
	}
	if rec.CurrentHolderOrg != mspID {
		return shim.Error("only current holder can transfer DPP")
	}
	toOrg := args[1]
	if toOrg != "DistributorMSP" && toOrg != "RetailerMSP" {
		return shim.Error("toOrgMSP must be DistributorMSP or RetailerMSP")
	}
	rec.CurrentHolderOrg = toOrg
	if !contains(rec.VisibilityTrail, toOrg) {
		rec.VisibilityTrail = append(rec.VisibilityTrail, toOrg)
	}
	rec.LastUpdatedAtTxID = stub.GetTxID()
	d.applyComplianceCheck(&rec)
	updated, _ := json.Marshal(rec)
	if err := stub.PutState(key, updated); err != nil {
		return shim.Error(err.Error())
	}
	return shim.Success(updated)
}

func (d *DPPContractChaincode) ValidateForEU(stub shim.ChaincodeStubInterface, args []string) peer.Response {
	if len(args) != 1 {
		return shim.Error("Expecting 1 arg: dppId")
	}
	key := dppKey(args[0])
	b, err := stub.GetState(key)
	if err != nil {
		return shim.Error(err.Error())
	}
	if b == nil {
		return shim.Error("DPP record not found: " + args[0])
	}
	var rec DPPRecord
	if err := json.Unmarshal(b, &rec); err != nil {
		return shim.Error(err.Error())
	}
	d.applyComplianceCheck(&rec)
	rec.LastUpdatedAtTxID = stub.GetTxID()
	updated, _ := json.Marshal(rec)
	if err := stub.PutState(key, updated); err != nil {
		return shim.Error(err.Error())
	}
	return shim.Success(updated)
}

func (d *DPPContractChaincode) GetDPP(stub shim.ChaincodeStubInterface, args []string) peer.Response {
	if len(args) != 1 {
		return shim.Error("Expecting 1 arg: dppId")
	}
	b, err := stub.GetState(dppKey(args[0]))
	if err != nil {
		return shim.Error(err.Error())
	}
	if b == nil {
		return shim.Error("DPP record not found: " + args[0])
	}
	return shim.Success(b)
}

func (d *DPPContractChaincode) GetAllDPP(stub shim.ChaincodeStubInterface) peer.Response {
	iter, err := stub.GetStateByRange("DPP_", "DPP_~")
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

func (d *DPPContractChaincode) applyComplianceCheck(rec *DPPRecord) {
	var issues []string
	if rec.OriginCountry == "" {
		issues = append(issues, "originCountry missing")
	}
	if rec.ManufactureDate == "" {
		issues = append(issues, "manufactureDate missing")
	}
	if rec.ExpiryDate == "" {
		issues = append(issues, "expiryDate missing")
	}
	if rec.BatchID == "" {
		issues = append(issues, "batchId missing")
	}
	if rec.CertificationRef == "" {
		issues = append(issues, "certificationRef missing")
	}
	if rec.ComplianceStandard == "" || !strings.Contains(strings.ToUpper(rec.ComplianceStandard), "EU") {
		issues = append(issues, "complianceStandard must reference EU")
	}

	if len(issues) == 0 {
		rec.ComplianceStatus = "EU_COMPLIANT"
		rec.ComplianceIssues = nil
	} else {
		rec.ComplianceStatus = "EU_NON_COMPLIANT"
		rec.ComplianceIssues = issues
	}
}

func contains(items []string, v string) bool {
	for _, item := range items {
		if item == v {
			return true
		}
	}
	return false
}
