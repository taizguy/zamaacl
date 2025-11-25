# 📖 COMPREHENSIVE THREAD: Everything About Zama ACL

## Executive Summary

**Zama ACL** is a smart-contract-based **permission system** that controls who can encrypt, compute on, and decrypt data in blockchain applications using **Fully Homomorphic Encryption (FHE)**.

---

## 🎯 The Problem

### Blockchain Transparency Problem
- All transactions are public
- Anyone can see the data
- Privacy is impossible

### But What If We Encrypt Everything?
- Use FHE to encrypt data
- Compute directly on ciphertexts
- No one (not even validators) can see plaintext

### New Problem: Who Can Decrypt?
- If we encrypt everything, how do we prevent unauthorized decryption?
- How do we ensure only the owner, contract, or authorized parties can decrypt?

### Solution: Access Control List (ACL)
- Before decrypting, the KMS checks: "Is this person authorized?"
- Only approved addresses can access encrypted data
- Permissions are **granular** (per-ciphertext, per-address)

---

## 🔐 How ACL Works (High Level)

```
User writes encrypted balance to blockchain
    ↓
Contract updates encrypted balance (via FHE)
    ↓
Contract calls FHE.allow(balance, alice)  ← Grants Alice permission
    ↓
Event emitted → Coprocessor relays to KMS Gateway
    ↓
KMS adds Alice to balance's ACL
    ↓
Later: Alice requests decryption of balance
    ↓
KMS checks: Is Alice in the ACL? ✓ YES
    ↓
KMS decrypts balance, returns plaintext to Alice ✓
    ↓
Hacker requests decryption of balance
    ↓
KMS checks: Is Hacker in the ACL? ✗ NO
    ↓
KMS denies request ✗
```

---

## 🔑 Four Core ACL Functions

### 1. **FHE.allow(ciphertext, address)**
- **Grants:** Permanent access
- **Duration:** Indefinite (on-chain)
- **Cost:** Higher gas (stored in permanent state)
- **Use case:** Balances, stakes, any long-term data

```solidity
FHE.allow(myBalance, alice);      // Alice can always decrypt myBalance
```

**In demo:** Happens automatically when creating ciphertext.

---

### 2. **FHE.allowTransient(ciphertext, address)**
- **Grants:** Temporary access (current transaction only)
- **Duration:** Ends when tx ends
- **Cost:** Ultra-low (EIP-1153 transient storage)
- **Use case:** Helper contracts, callbacks, temporary sharing

```solidity
FHE.allowTransient(data, gateway);  // Gateway can decrypt THIS tx, then access expires
```

**In demo:** Click "Temporary Access" button.

**Why so cool?** Transient storage costs ~10x less gas than permanent!

---

### 3. **FHE.makePubliclyDecryptable(ciphertext)**
- **Grants:** Public access
- **Duration:** Indefinite
- **Cost:** Moderate (one-time on-chain call)
- **Use case:** Public results, broadcasts

```solidity
FHE.makePubliclyDecryptable(winner);  // Everyone learns who won
```

**In demo:** Click "Public Access" button. Now **Public? = ✓ Yes**.

---

### 4. **FHE.isSenderAllowed(ciphertext)**
- **Function:** Checks permission
- **Returns:** true if sender is authorized, false otherwise
- **Critical for:** Security (prevents inference attacks)

```solidity
require(FHE.isSenderAllowed(encryptedAmount), "You're not authorized");
// Safe to proceed with encrypted arithmetic
```

**In demo:** Used internally when you click "Request Decryption".

---

## 🏗️ ACL Architecture (Simplified)

```
┌─────────────────────────────────────────────────────────────┐
│                    Smart Contract                           │
│                                                             │
│  euint64 balance = ...                                      │
│  FHE.allow(balance, alice)  ← Contract calls ACL function  │
│  FHE.allowThis(balance)                                     │
└──────────────────────┬──────────────────────────────────────┘
                       │ Event: "Allow(balance, alice)"
                       ↓
┌──────────────────────────────────────────────────────────────┐
│           On-Chain ACL Smart Contract                        │
│                                                              │
│  mapping(bytes => address[]) acl;  ← Permissions stored     │
│  acl[balance] = [alice, contract, gateway, ...]             │
└──────────────────────┬──────────────────────────────────────┘
                       │ Coprocessor watches events
                       ↓
┌──────────────────────────────────────────────────────────────┐
│           Off-Chain KMS / Gateway                           │
│                                                              │
│  global_acl[balance] = [alice, contract, gateway, ...]      │
│                                                              │
│  decrypt_request(balance, alice) → Check global_acl         │
│  alice in global_acl? ✓ YES → Decrypt                       │
│                                                              │
│  decrypt_request(balance, hacker) → Check global_acl        │
│  hacker in global_acl? ✗ NO → Reject                        │
└──────────────────────────────────────────────────────────────┘
```

---

## 📊 Real-World Example: Private DeFi Token

### Scenario: PrivateToken Contract

```solidity
pragma solidity ^0.8.19;
import "fhevm/lib/TFHE.sol";

contract PrivateToken {
    mapping(address => euint64) balances;  // Encrypted balances
    
    function transfer(address to, euint64 encryptedAmount) public {
        // Step 1: Check sender is authorized to access encryptedAmount
        require(FHE.isSenderAllowed(encryptedAmount), "Unauthorized");
        
        // Step 2: Perform encrypted arithmetic
        euint64 senderBal = balances[msg.sender];
        euint64 recipientBal = balances[to];
        
        balances[msg.sender] = FHE.sub(senderBal, encryptedAmount);
        balances[to] = FHE.add(recipientBal, encryptedAmount);
        
        // Step 3: Grant permissions to NEW ciphertexts
        FHE.allowThis(balances[msg.sender]);      // Contract can read new balance
        FHE.allow(balances[msg.sender], msg.sender);  // Sender can see new balance
        
        FHE.allowThis(balances[to]);              // Contract can read new balance
        FHE.allow(balances[to], to);              // Recipient can see new balance
    }
    
    function getBalance() public view returns (euint64) {
        // Caller is msg.sender, which is authorized
        return balances[msg.sender];
    }
}
```

### ACL Flow for a Transfer

1. **Alice sends 100 tokens to Bob**
   - Alice calls: `transfer(bob, encryptedAmount)`
   - Contract checks: `isSenderAllowed(encryptedAmount)` → ✓ Alice created it
   - Contract performs encrypted math
   - Contract calls: `FHE.allow(balances[alice], alice)`
   - Contract calls: `FHE.allow(balances[bob], bob)`

2. **ACL Event Emitted:**
   - Event: `Allow(balances[alice], alice)`
   - Coprocessor relays to KMS Gateway
   - KMS adds: Alice → ACL[balances[alice]]
   - KMS adds: Bob → ACL[balances[bob]]

3. **Alice later requests decryption of her balance**
   - Alice: "Decrypt balances[alice] for me"
   - KMS: "Is Alice in ACL[balances[alice]]?" → ✓ YES
   - KMS: Decrypts → returns her new balance

4. **Bob requests decryption of his balance**
   - Bob: "Decrypt balances[bob] for me"
   - KMS: "Is Bob in ACL[balances[bob]]?" → ✓ YES
   - KMS: Decrypts → returns his new balance

5. **Hacker tries to decrypt Alice's balance**
   - Hacker: "Decrypt balances[alice]"
   - KMS: "Is Hacker in ACL[balances[alice]]?" → ✗ NO
   - KMS: Denies request → Hacker learns nothing

---

## 🎮 Using the Interactive Demo

### Starting Point
1. Go to `http://localhost:5173`
2. Click **"Enter Demo"**
3. Read tutorial or close it

### Four Steps

**Step 1: Create Ciphertext**
- Click: **"➕ Create Ciphertext"**
- Result: New encrypted value with Owner + Contract in Permanent ACL

**Step 2: Grant Temporary Access**
- Select the ciphertext from list
- Click: **"FHE.allowTransient() — Temporary Access"**
- Result: Gateway added to Transient ACL

**Step 3: Make Public**
- Click: **"FHE.makePubliclyDecryptable() — Public Access"**
- Result: Public? = ✓ Yes

**Step 4: Test Decryption**
- Select role from dropdown (Alice, Contract, Gateway, Unauthorized)
- Click: **"Request Decryption"**
- Result: ✓ SUCCESS if authorized, ✗ DENIED if not

### What to Observe
- **Event Log (right panel):** Every operation shows as colored event
- **Ciphertext Details:** Updates show ACL changes in real-time
- **Color coding:** Green = success, Red = denied, Blue = transient, Purple = public, Yellow = creation

---

## 🔒 Why ACL Matters: Security

### Attack: Inference

**Without ACL:**
```
Hacker finds ciphertext ct_123 on-chain
Hacker doesn't know what's encrypted, but sends it to contract
Contract processes it, hacker watches the result
Hacker learns information about encrypted data
```

**With ACL:**
```
Hacker finds ciphertext ct_123 on-chain
Hacker sends to contract: contract.process(ct_123)
Contract checks: FHE.isSenderAllowed(ct_123)?
Hacker NOT in ACL → Transaction REVERTS
Hacker learns NOTHING
```

### Defense: Zero-Knowledge Proof

Even better, Zama requires **signatures** on decryption results:
```solidity
FHE.checkSignatures(ciphertext, plaintext, proof)
```

This ensures: "This plaintext truly came from authorized decryption" (proof from KMS).

---

## 📈 Permission Matrix Example

**For a ciphertext: `balance`**

| Entity | Permanent | Transient | Public | Can Decrypt? |
|---|---|---|---|---|
| Alice (owner) | ✓ | ✗ | ✗ | ✓ YES (permanent) |
| Contract | ✓ | ✗ | ✗ | ✓ YES (permanent) |
| Gateway | ✗ | ✓ | ✗ | ✓ YES (this tx only) |
| Bob (friend) | ✗ | ✗ | ✗ | ✗ NO |
| Hacker | ✗ | ✗ | ✗ | ✗ NO |
| Everyone | ✗ | ✗ | ✓ | ✓ YES (public) |

---

## 🌍 Real-World Applications

### 1. Private DeFi
- Balances encrypted, only owner sees amounts
- Swaps execute without revealing liquidity pools
- Gas fees stay on-chain, amounts private

### 2. Confidential Voting
- Votes encrypted until deadline
- Contract tallies encrypted votes
- Final result decrypted and published

### 3. Private Auction
- Bids encrypted
- Winner decrypted publicly, amounts stay private
- Prevents information leakage during bidding

### 4. Healthcare
- Patient records encrypted with patient ACL
- Doctor has temporary transient access to records
- Patient can revoke access instantly

### 5. Enterprise Finance
- Salaries encrypted with employee ACL
- Company financials encrypted with shareholder ACL
- Auditors granted temporary access

---

## 💡 Key Insights

### 1. **ACL is Programmable**
Not fixed permissions. You code:
- Who gets access
- When they get access
- How long access lasts
- What they can do with the data

### 2. **ACL Bridges On-Chain and Off-Chain**
- Smart contract calls FHE.allow() → on-chain event
- Coprocessor relays to KMS → updates off-chain ACL
- User requests decryption → KMS checks both ACLs

### 3. **Transient = Gas Efficient**
- EIP-1153 transient storage is ~10x cheaper
- Perfect for temporary data passing in same tx
- Automatic expiration (no cleanup)

### 4. **Granular Control**
- Per-ciphertext (not global "encrypted" vs "not encrypted")
- Per-address (Alice different from Bob)
- Multi-dimensional: permanent + transient + public

### 5. **Privacy Meets Programmability**
> "Confidentiality is fully programmable"

You decide:
- What data is encrypted
- Who sees what
- How permissions change over time
- What happens if access is misused

---

## 🚀 Next Steps

1. **Try the demo:** Click through all buttons, create multiple ciphertexts
2. **Read [HOW_IT_WORKS.md](./HOW_IT_WORKS.md):** Step-by-step guide
3. **Read [TUTORIAL.md](./TUTORIAL.md):** Deep dive
4. **Study Solidity examples:** In README.md
5. **Read Zama docs:** [docs.zama.org](https://docs.zama.org/)

---

## 🎓 Quick Reference

| Concept | Means | Example |
|---|---|---|
| **Ciphertext** | Encrypted value | `ct_abc123` |
| **ACL** | Permissions for ciphertext | "Alice, Contract, Gateway" |
| **Permanent** | Lasts forever (on-chain) | Balance ownership |
| **Transient** | Lasts this tx (EIP-1153) | Helper contract access |
| **Public** | Anyone can decrypt | Winner of auction |
| **isSenderAllowed** | Check if authorized | Security check in contract |
| **KMS** | Off-chain decryption service | Performs actual decryption |
| **FHE** | Fully Homomorphic Encryption | Compute on ciphertexts |

---

## ❓ Common Questions

**Q: Doesn't KMS need access to decrypt?**
A: Yes, but KMS is **threshold-distributed** across ~13 nodes. No single party holds full key.

**Q: Can I change ACL after creating ciphertext?**
A: Yes, you can revoke with `FHE.revoke()` and add new permissions with `FHE.allow()`.

**Q: What if I forget to grant permissions?**
A: Contract can't decrypt or operate on ciphertext. You get an error.

**Q: Is this quantum-resistant?**
A: Yes, FHE uses lattice-based cryptography which is post-quantum secure.

**Q: Can I see who has permission?**
A: Yes, the on-chain ACL contract is public. Anyone can read who's authorized.

---

## 🎯 Conclusion

**Zama ACL** is the cornerstone of **programmable privacy** on blockchain:
- ✅ Encrypted data by default
- ✅ Granular, granular permissions
- ✅ Cryptographically enforced
- ✅ Fully deterministic (code-based, not subjective)
- ✅ Efficient (transient storage for temporary access)

It makes **real privacy on-chain possible** — not by hiding from everyone, but by carefully controlling who can see what.

---

**Ready to explore? Open the demo and start clicking! 🚀**
