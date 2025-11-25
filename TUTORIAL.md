# 🔐 Zama ACL Protocol - Complete Tutorial & Walkthrough

## What is Zama ACL?

The **Access Control List (ACL)** is the core permission system in Zama's Fully Homomorphic Encryption Virtual Machine (FHEVM). It controls **who can use and decrypt each encrypted value** on-chain.

### The Problem It Solves

In blockchain, all data is public. But Zama uses **FHE (Fully Homomorphic Encryption)** to keep data encrypted even while computing on it. The challenge: how do we ensure only authorized people can decrypt the results?

**Answer: ACL** — Before anyone can decrypt a ciphertext (encrypted value), Zama's KMS checks: "Does this person have permission?"

---

## 📚 Key Concepts

### 1. **Ciphertext**
A ciphertext is an **encrypted value**. In the demo, we create one with encrypted balance data.

**Example in Solidity:**
```solidity
euint64 encryptedBalance = FHE.asEuint64(1000); // encrypted "1000"
```

You can't read the plaintext (1000) by looking at the ciphertext — only the owner or authorized parties can decrypt it.

### 2. **Permanent ACL - FHE.allow()**
Grants **long-term permission** to decrypt a ciphertext. The permission is recorded on-chain in the ACL contract and persists forever (or until revoked).

**Syntax:**
```solidity
FHE.allow(ciphertext, address); // Grant to specific address
FHE.allowThis(ciphertext);       // Grant to current contract
ciphertext.allow(addr1).allow(addr2); // Chain multiple addresses
```

**In the demo:** Click the respective buttons to grant permanent access.

### 3. **Transient ACL - FHE.allowTransient()**
Grants **temporary permission** for the current transaction only. Uses **EIP-1153 transient storage** (ultra gas-efficient). Once the transaction ends, the permission expires.

**Perfect for:** Callbacks, external calls, temporary data sharing without permanent on-chain footprint.

**Syntax:**
```solidity
FHE.allowTransient(ciphertext, address); // Temporary access this tx
```

**In the demo:** This is the **"Grant Temporary Access"** button.

### 4. **Public ACL - FHE.makePubliclyDecryptable()**
Makes a ciphertext **publicly readable**. Any user can request to decrypt it off-chain, and the KMS will allow it.

**Use case:** Publishing results (e.g., "winner's address" after a private auction) to all users.

**Syntax:**
```solidity
FHE.makePubliclyDecryptable(ciphertext); // Anyone can decrypt
```

**In the demo:** This is the **"Allow Everyone"** button.

### 5. **Permission Checks - FHE.isSenderAllowed()**
Before acting on a ciphertext (e.g., transferring it), the contract must verify the sender has permission.

**Why?** Prevents "inference attacks" — a malicious user sending someone else's ciphertext to learn information.

**Syntax:**
```solidity
require(FHE.isSenderAllowed(ciphertext), "Unauthorized access");
// Safe to proceed if this passes
```

**In the demo:** When you click **"Request Decryption"**, the system checks if the selected role is allowed.

---

## 🎮 Step-by-Step Demo Walkthrough

### **Step 1: Enter the Demo**
Click **"Enter Demo"** on the landing page. You'll see:
- **Left panel:** Ciphertext Manager with 4 sections
- **Right panel:** ACL Events Log (shows all operations)
- **Tutorial guide:** Explains each step (you can close it with ✕)

### **Step 2: Create a Ciphertext**
1. Click **"+ Create Ciphertext"** (green button)
2. **What happens:**
   - A new encrypted value is created: `ct_xxxxxxx`
   - The system automatically grants permission to:
     - **Owner** (`0x1234...Alice`) — the person who created it
     - **Contract** (`0x5678...Contract`) — via `FHE.allowThis()`
   - Two events appear in the log:
     - "Ciphertext created"
     - "Granted to Alice & Contract"

**What to notice:** The ciphertext now appears in the **"2. Select & Manage Ciphertext"** list.

### **Step 3: Select a Ciphertext**
1. Click on the ciphertext ID in the list (e.g., `ct_abc123`)
2. **What appears below:**
   - **Ciphertext Details** panel shows:
     - ID, Data, Owner
     - **Permanent ACL:** Who has long-term access (Alice, Contract)
     - **Transient ACL:** Who has temporary access (initially empty)
     - **Public?:** Whether everyone can decrypt (initially No)

### **Step 4: Grant Temporary Access (FHE.allowTransient)**
1. Click **"FHE.allowTransient() — Temporary Access"** (blue button)
2. **What happens:**
   - Gateway (`0x9999...Gateway`) gets temporary permission
   - Permission expires at end of this transaction
   - Event appears: "Granted transient access to Gateway"
   - **Ciphertext Details** updates: Transient ACL now shows Gateway

### **Step 5: Make it Publicly Decryptable**
1. Click **"FHE.makePubliclyDecryptable() — Public Access"** (purple button)
2. **What happens:**
   - Ciphertext is now marked as public
   - Any user anywhere can request decryption off-chain
   - Event appears: "Ciphertext is now publicly decryptable off-chain"
   - **Ciphertext Details** updates: Public? = ✓ Yes

### **Step 6: Test Decryption Authorization**
1. From the **"4. Test Decryption Authorization"** dropdown, select a role:
   - **User** — Generic, likely has no permission
   - **0x1234...Alice** — Owner, has permanent permission
   - **0x5678...Contract** — Has permission via allowThis()
   - **0x9999...Gateway** — Has transient permission
   - **Unauthorized** — Has NO permission

2. Click **"Request Decryption"** (yellow button)
3. **What happens:**
   - System performs `FHE.isSenderAllowed(ciphertext, role)` check
   - If role is in Permanent ACL, Transient ACL, or Public → **✓ SUCCESS** (green event)
   - If role is NOT authorized → **✗ DENIED** (red event)
   - Event appears showing result

---

## 🔄 Full Example Scenario

Let's walk through a **Private Token Transfer** to see ACL in action:

### Scenario: Alice sends 100 tokens to Bob (encrypted)

1. **Create Ciphertext** for Alice's encrypted balance
   - Permanent ACL: [Alice, Contract]
   - Transient ACL: []
   - Public: No

2. **Grant Bob temporary access** to see the new balance
   - Select the ciphertext
   - Click "Temporary Access"
   - Transient ACL now includes: Bob (or Gateway on his behalf)

3. **Bob requests decryption** to see his new balance
   - Change role to "Gateway" (representing Bob's KMS request)
   - Click "Request Decryption"
   - **Result:** ✓ SUCCESS — Gateway has transient ACL, so Bob can see his balance!

4. **After transaction ends:**
   - Bob's transient permission expires
   - He can't decrypt again unless granted permanent access

---

## 🧠 Real Zama Contract Example (Solidity)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "fhevm/lib/TFHE.sol";

contract PrivateToken {
    mapping(address => euint64) public balances;

    function transfer(address to, euint64 encryptedAmount) public {
        // Step 1: Check sender is authorized to access encryptedAmount
        require(FHE.isSenderAllowed(encryptedAmount), "Unauthorized");

        // Step 2: Decrypt and verify (off-chain, then submitted with proof)
        euint64 amount = TFHE.asEuint64(encryptedAmount);

        // Step 3: Update balances (encrypted arithmetic)
        balances[msg.sender] = TFHE.sub(balances[msg.sender], amount);
        balances[to] = TFHE.add(balances[to], amount);

        // Step 4: Grant permissions to new ciphertexts
        FHE.allowThis(balances[to]);      // Contract can see it
        FHE.allow(balances[to], to);      // Recipient can see it
        FHE.allowThis(balances[msg.sender]);
        FHE.allow(balances[msg.sender], msg.sender);
    }

    function getBalance() public view returns (euint64) {
        // Contract can access (allowThis was called)
        return balances[msg.sender];
    }
}
```

**ACL Flow:**
1. User calls `transfer()` with encrypted amount
2. Contract checks `isSenderAllowed()` — sender authorized? ✓
3. Contract performs encrypted math on balances
4. Contract calls `FHE.allow()` to grant recipient & sender access to new balances
5. Only authorized parties can later decrypt the new balances

---

## 📊 ACL Permission Matrix

| Permission Type | Duration | Storage | Gas Cost | Use Case |
|---|---|---|---|---|
| **Permanent (FHE.allow)** | Indefinite | Permanent storage | Higher | Long-term access (balances, stakes) |
| **Transient (FHE.allowTransient)** | Current tx only | EIP-1153 transient | Very Low | Callbacks, external calls |
| **Public (FHE.makePubliclyDecryptable)** | Indefinite | On-chain ACL | Moderate | Public results, broadcasts |

---

## 🔐 Security Insights

### Why ACL Matters

1. **Prevents Unauthorized Decryption**
   - Even if a malicious actor has the ciphertext handle, they can't decrypt without ACL permission
   - KMS checks ACL before performing decryption

2. **Prevents Inference Attacks**
   - If anyone could decrypt, they could learn private data
   - `isSenderAllowed()` check prevents someone from sending another's ciphertext to the contract

3. **Enables Privacy-Preserving dApps**
   - Users can have private balances, voting, auctions, etc.
   - Only authorized parties (self, contract, or designated) see the data

### Example Attack (Prevented by ACL)

**Without ACL:**
```
Hacker sees Alice's encrypted balance ciphertext ct_123
Hacker sends ct_123 to contract.transfer()
Contract performs math, hacker learns the balance value
```

**With ACL:**
```
Hacker tries to send ct_123 to contract.transfer()
Contract checks: require(isSenderAllowed(ct_123))
Hacker never had permission → **REJECTED**
Hacker learns nothing
```

---

## 🎯 What Each Demo Button Does

| Button | Action | Result |
|---|---|---|
| **+ Create Ciphertext** | Create new encrypted value | New ciphertext added with default ACL |
| **FHE.allowTransient()** | Grant temporary access | Adds to Transient ACL (expires after tx) |
| **FHE.makePubliclyDecryptable()** | Mark as public | Sets Public = Yes, anyone can decrypt |
| **Request Decryption** | Test if role can decrypt | Checks ACL, shows ✓ or ✗ result |
| **Back to Landing** | Return to start | Resets the demo |

---

## 🚀 Real-World Applications

### 1. **Private DeFi**
- Balances encrypted, only owner & contract can see
- Swaps happen on-chain without revealing amounts

### 2. **Confidential Voting**
- Votes encrypted, counted encrypted
- Only final result made public

### 3. **Private Auction**
- Bids encrypted until deadline
- Winner address revealed publicly, amounts private

### 4. **Healthcare Contracts**
- Patient records encrypted
- Doctor has ACL permission to view
- Patient can revoke access anytime

---

## 💡 Summary: The ACL Philosophy

> **"Confidentiality is fully programmable."**

With Zama ACL, you decide:
- **Who** can see which data
- **When** they can see it (permanent vs. transient)
- **What** happens if they try to access it unauthorized

The on-chain ACL rules directly control off-chain decryption, making privacy:
- **Granular** — Per-ciphertext, per-address
- **Cryptographically enforced** — Backed by FHE & threshold KMS
- **Programmable** — Encoded in your smart contract logic

---

## ❓ FAQ

**Q: What happens if I try to decrypt without permission?**
A: The KMS checks the ACL, sees you're not authorized, and rejects the decryption request. You see a ✗ DENIED event.

**Q: Can I revoke permanent access?**
A: Yes (in real contracts). You'd call a `FHE.revoke()` function to remove an address from the ACL.

**Q: Why use Transient instead of Permanent?**
A: Transient permissions expire automatically at transaction end. Great for temporary sharing (like passing data to a callback) without polluting permanent state.

**Q: Is the demo real Zama code?**
A: No, it's a simulation. Real Zama uses TFHE library and threshold FHE decryption. This demo shows the **ACL logic** clearly.

**Q: Can I have multiple ciphertexts?**
A: Yes! Click "Create Ciphertext" multiple times. Each has its own ACL. Select different ones and grant different permissions to learn the system.

---

## 🔗 Further Reading

- [Zama ACL Solidity Guide](https://docs.zama.org/)
- [FHEVM Documentation](https://docs.zama.org/)
- [EIP-1153: Transient Storage](https://eips.ethereum.org/EIPS/eip-1153)
- [Threshold Cryptography Basics](https://en.wikipedia.org/wiki/Threshold_cryptography)

---

**Happy exploring! 🎉 Now go back to the demo and test it out!**
