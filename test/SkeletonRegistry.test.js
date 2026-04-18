const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SkeletonRegistry", function () {
  let skeleton;
  let owner, patient1, patient2, provider1;

  before(async function () {
    [owner, patient1, patient2, provider1] = await ethers.getSigners();
    const SkeletonRegistry = await ethers.getContractFactory("SkeletonRegistry");
    skeleton = await SkeletonRegistry.deploy();
    await skeleton.waitForDeployment();
  });

  describe("Patient Registration", function () {
    it("Should register a new patient", async function () {
      const tx = await skeleton.connect(patient1).registerPatient(
        "did:skeleton:patient1",
        ethers.toUtf8Bytes("public-key-patient1")
      );
      await expect(tx).to.emit(skeleton, "PatientRegistered").withArgs(patient1.address, "did:skeleton:patient1");
    });

    it("Should reject duplicate registration", async function () {
      await expect(
        skeleton.connect(patient1).registerPatient("did:skeleton:patient1-v2", ethers.toUtf8Bytes("pk2"))
      ).to.be.revertedWith("Already registered");
    });

    it("Should store patient data correctly", async function () {
      const patient = await skeleton.patients(patient1.address);
      expect(patient.walletAddress).to.equal(patient1.address);
      expect(patient.did).to.equal("did:skeleton:patient1");
      expect(patient.active).to.be.true;
    });
  });

  describe("Health Records", function () {
    it("Should add a health record", async function () {
      const tx = await skeleton.connect(patient1).addHealthRecord("lab-result", "QmHash123");
      await expect(tx).to.emit(skeleton, "RecordAdded");
    });

    it("Should reject records from unregistered patients", async function () {
      await expect(
        skeleton.connect(patient2).addHealthRecord("lab-result", "QmHash456")
      ).to.be.revertedWith("Patient not registered");
    });

    it("Should return patient records", async function () {
      const records = await skeleton.getPatientRecords(patient1.address);
      expect(records.length).to.equal(1);
      expect(records[0].recordType).to.equal("lab-result");
      expect(records[0].ipfsHash).to.equal("QmHash123");
    });
  });

  describe("Access Control", function () {
    it("Should grant access to a provider", async function () {
      const tx = await skeleton.connect(patient1).grantAccess(provider1.address, 7);
      await expect(tx).to.emit(skeleton, "AccessGranted");
    });

    it("Should verify active access", async function () {
      expect(await skeleton.hasAccess(patient1.address, provider1.address)).to.be.true;
    });

    it("Should deny access for unauthorized providers", async function () {
      expect(await skeleton.hasAccess(patient1.address, patient2.address)).to.be.false;
    });

    it("Should reject zero duration", async function () {
      await expect(
        skeleton.connect(patient1).grantAccess(provider1.address, 0)
      ).to.be.revertedWith("Duration must be positive");
    });

    it("Should revoke access", async function () {
      const tx = await skeleton.connect(patient1).revokeAccess(provider1.address);
      await expect(tx).to.emit(skeleton, "AccessRevoked");
      expect(await skeleton.hasAccess(patient1.address, provider1.address)).to.be.false;
    });

    it("Should reject revoke for non-existent grant", async function () {
      await expect(
        skeleton.connect(patient1).revokeAccess(patient2.address)
      ).to.be.revertedWith("No grant found");
    });
  });

  describe("Audit Logs", function () {
    it("Should create audit log entries", async function () {
      const logs = await skeleton.getAuditLogs(patient1.address);
      expect(logs.length).to.be.greaterThan(0);
    });
  });
});
