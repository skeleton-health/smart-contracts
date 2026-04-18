// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SkeletonRegistry {

    struct Patient {
        address walletAddress;
        string did;
        bytes publicKey;
        uint256 createdAt;
        bool active;
    }

    struct HealthRecord {
        address patient;
        string recordType;
        string ipfsHash;
        uint256 timestamp;
    }

    struct AccessGrant {
        address grantedTo;
        uint256 expiresAt;
        bool revoked;
    }

    mapping(address => Patient) public patients;
    mapping(address => HealthRecord[]) public patientRecords;
    mapping(address => mapping(address => AccessGrant)) public grants;
    mapping(address => bytes32[]) public auditLogs;

    event PatientRegistered(address indexed patient, string did);
    event RecordAdded(address indexed patient, string ipfsHash, uint256 timestamp);
    event AccessGranted(address indexed patient, address indexed provider, uint256 expiresAt);
    event AccessRevoked(address indexed patient, address indexed provider);
    event Accessed(address indexed actor, address indexed subject, string action, uint256 timestamp);

    function registerPatient(string memory _did, bytes memory _publicKey) public {
        require(patients[msg.sender].createdAt == 0, "Already registered");
        patients[msg.sender] = Patient({
            walletAddress: msg.sender,
            did: _did,
            publicKey: _publicKey,
            createdAt: block.timestamp,
            active: true
        });
        emit PatientRegistered(msg.sender, _did);
    }

    function addHealthRecord(string memory _recordType, string memory _ipfsHash) public {
        require(patients[msg.sender].active, "Patient not registered");
        patientRecords[msg.sender].push(HealthRecord({
            patient: msg.sender,
            recordType: _recordType,
            ipfsHash: _ipfsHash,
            timestamp: block.timestamp
        }));
        bytes32 logEntry = keccak256(abi.encodePacked(msg.sender, "WRITE", block.timestamp));
        auditLogs[msg.sender].push(logEntry);
        emit RecordAdded(msg.sender, _ipfsHash, block.timestamp);
    }

    function grantAccess(address _provider, uint256 _durationDays) public {
        require(patients[msg.sender].active, "Patient not registered");
        require(_durationDays > 0, "Duration must be positive");
        uint256 expiresAt = block.timestamp + (_durationDays * 1 days);
        grants[msg.sender][_provider] = AccessGrant({
            grantedTo: _provider,
            expiresAt: expiresAt,
            revoked: false
        });
        emit AccessGranted(msg.sender, _provider, expiresAt);
    }

    function revokeAccess(address _provider) public {
        require(grants[msg.sender][_provider].grantedTo != address(0), "No grant found");
        grants[msg.sender][_provider].revoked = true;
        emit AccessRevoked(msg.sender, _provider);
    }

    function hasAccess(address _patient, address _provider) public view returns (bool) {
        AccessGrant memory grant = grants[_patient][_provider];
        if (grant.grantedTo == address(0) || grant.revoked) return false;
        if (block.timestamp > grant.expiresAt) return false;
        return true;
    }

    function getPatientRecords(address _patient) public view returns (HealthRecord[] memory) {
        return patientRecords[_patient];
    }

    function recordAccess(address _subject, string memory _action) public {
        require(hasAccess(_subject, msg.sender) || msg.sender == _subject, "Not authorized");
        bytes32 logEntry = keccak256(abi.encodePacked(msg.sender, _action, block.timestamp));
        auditLogs[_subject].push(logEntry);
        emit Accessed(msg.sender, _subject, _action, block.timestamp);
    }

    function getAuditLogs(address _patient) public view returns (bytes32[] memory) {
        return auditLogs[_patient];
    }
}
