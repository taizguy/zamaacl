# 🎯 COMPLETE WALKTHROUGH: How Zama ACL Works & How to Use the Demo

## Table of Contents
1. [What is Zama ACL?](#what-is-zama-acl)
2. [The Four ACL Functions](#the-four-acl-functions)
3. [Step-by-Step Demo Guide](#step-by-step-demo-guide)
4. [Real-World Example](#real-world-example)
5. [Button Reference](#button-reference)
6. [FAQ](#faq)

---

## 🔐 What is Zama ACL?

### The Big Picture

Imagine you have encrypted data on a blockchain:

```
Your encrypted balance: ct_abc123 (encrypted "1000")
```

The problem: **Only the owner AND authorized people should see "1000"**. How do we prevent hackers or random people from decrypting it?

**Answer: Access Control List (ACL)** — Before anyone can decrypt, the system checks: "Are you on the approved list?"

### Why This Matters

**Blockchain is public** — everyone can see transactions. But Zama uses **FHE (Fully Homomorphic Encryption)** to keep your data encrypted while computing on it.

The ACL ensures:
- ✅ Only YOU can see your balance
- ✅ Only the CONTRACT can do math on your balance
- ✅ Only AUTHORIZED people can decrypt results
- ❌ Hackers can see the encrypted data but CAN'T decrypt it

---

## 🔑 The Four ACL Functions

### 1. **FHE.allow()** — Permanent Access

**What it does:** Grants **long-term permission** to decrypt. Recorded on-chain forever.

**When to use:**
- Owner accessing their balance
- Contract managing encrypted state
- Recipient of a transfer

**Example:**
```solidity
FHE.allow(balance, alice);     // Alice can decrypt forever
FHE.allowThis(balance);         // This contract can access forever
```

**In the demo:** This happens automatically when you create a ciphertext (owner + contract get permanent access).

---

### 2. **FHE.allowTransient()** — Temporary Access

**What it does:** Grants **temporary permission** for the current transaction ONLY. Uses **EIP-1153** (ultra gas-efficient).

**When to use:**
- Sharing data with a helper contract in same transaction
- Callback functions
- Passing encrypted data through external calls

**Example:**
```solidity
FHE.allowTransient(balance, gateway); // Gateway can decrypt THIS tx only
```

**In the demo:** Click **"FHE.allowTransient() — Temporary Access"** button. Permission expires when transaction ends.

**Gas benefit:** Transient storage is ~10x cheaper than permanent storage!

---

### 3. **FHE.makePubliclyDecryptable()** — Public Access

**What it does:** Marks ciphertext as **publicly readable**. Anyone can request to decrypt off-chain.

**When to use:**
- Publishing results (winner's address after auction)
- Broadcasting to all users
- Public announcements

**Example:**
```solidity
FHE.makePubliclyDecryptable(winnerAddress); // Everyone can learn who won
```

**In the demo:** Click **"FHE.makePubliclyDecryptable() — Public Access"** button. Now "Public?" = ✓ Yes.

---

### 4. **FHE.isSenderAllowed()** — Check Permission

**What it does:** Verifies the **sender has permission** before proceeding.

**Critical for security!** Prevents inference attacks where hackers send someone else's ciphertext.

**Example:**
```solidity
require(FHE.isSenderAllowed(encryptedAmount), "Unauthorized access");
// Only proceed if sender is approved
```

**In the demo:** When you click **"Request Decryption"**, the system checks if the selected role is in the ACL.

---

## 🎮 Step-by-Step Demo Guide

### Step 1: Enter the Demo

**Click "Enter Demo"** on the landing page.

**What you see:**
- Left: **Ciphertext Manager** with 4 sections
- Right: **ACL Events Log** (shows all operations)
- Top: **Tutorial guide** (can close with ✕)

---

### Step 2: Create Your First Ciphertext

**Click "➕ Create Ciphertext"** (green button in section 1)

**What happens:**
1. New encrypted value created: `ct_xxxxxxx`
2. System automatically grants:
   - **Owner** (`0x1234...Alice`) — permanent access via `FHE.allow()`
   - **Contract** (`0x5678...Contract`) — permanent access via `FHE.allowThis()`
3. Two events appear in the log

**What to notice:**
- The ciphertext appears in section 2's list
- Details panel shows permanent ACL includes both addresses

**Solidity equivalent:**
```solidity
euint64 encryptedBalance = FHE.asEuint64(1000);
FHE.allow(encryptedBalance, alice);      // Owner permission
FHE.allowThis(encryptedBalance);         // Contract permission
```

---

### Step 3: Select & Examine a Ciphertext

**Click on the ciphertext ID** in the "2. Select & Manage" list

**What appears below:**
- **Ciphertext Details** panel shows:
  - `ID:` The encrypted value's ID
  - `Data:` The plaintext (normally hidden, but we show it for demo)
  - `Owner:` Who created it
  - **Permanent ACL:** Addresses with long-term permission
  - **Transient ACL:** Addresses with temporary permission (initially empty)
  - **Public?:** Whether anyone can decrypt (initially No)

**Why this matters:** This is the **ACL** — the permission matrix for this ciphertext.

---

### Step 4: Grant Temporary Access

**Click "FHE.allowTransient() — Temporary Access"** (blue button in section 3)

**What happens:**
1. **Gateway** (`0x9999...Gateway`) gets temporary permission
2. Permission expires at end of this transaction
3. Event appears: "Granted transient access to Gateway (EIP-1153 transient storage)"
4. **Ciphertext Details** updates: **Transient ACL** now shows Gateway

**Why this is cool:** Gateway can see the ciphertext THIS transaction, but loses access afterward. Gas-efficient!

**Solidity equivalent:**
```solidity
FHE.allowTransient(ciphertext, gateway);  // Temporary access this tx
```

---

### Step 5: Make it Publicly Decryptable

**Click "FHE.makePubliclyDecryptable() — Public Access"** (purple button in section 3)

**What happens:**
1. Ciphertext is now marked as **Public**
2. Any user anywhere can request to decrypt off-chain
3. Event appears: "Ciphertext is now publicly decryptable off-chain"
4. **Ciphertext Details** updates: **Public?** = ✓ Yes

**Use case:** After a private auction, you want everyone to know the winner's address (but not their bid).

**Solidity equivalent:**
```solidity
FHE.makePubliclyDecryptable(winnerAddress);
```

---

### Step 6: Test Decryption Authorization

**Select a role** from the dropdown (section 4):
- `User` — Generic, likely no permission
- `0x1234...Alice` — Owner, has permanent permission
- `0x5678...Contract` — Has permission via allowThis()
- `0x9999...Gateway` — Has transient permission (if you granted it)
- `Unauthorized` — Definitely has NO permission

**Click "Request Decryption"** (yellow button)

**What happens:**
1. System checks: Is this role in the ACL?
2. **If YES (ACL check passes):** ✓ Event shows "ACL check passed. Decryption authorized. Result: balance: 1000"
3. **If NO (ACL check fails):** ✗ Event shows "ACL check failed. [Role] not authorized."

**This simulates:**
```solidity
if (FHE.isSenderAllowed(ciphertext)) {
    // Decrypt and use the value
    uint64 plaintext = FHE.asUint64(ciphertext);
} else {
    revert("Unauthorized access");
}
```

---

## 📊 Full Example: Private Token Transfer

Let's trace through a **complete scenario**:

### Setup: Alice wants to transfer tokens to Bob

1. **Create ciphertext for Alice's balance**
   - Click "Create Ciphertext"
   - Permanent ACL: [Alice, Contract]
   - Transient ACL: []
   - Public: No

2. **Grant Bob temporary access to see new balance**
   - Select the ciphertext
   - Click "Temporary Access"
   - Now Transient ACL includes: Gateway (representing Bob's decryption request)

3. **Bob requests decryption to see his new balance**
   - Select role: "Gateway"
   - Click "Request Decryption"
   - Result: ✓ SUCCESS (Gateway has transient ACL)

4. **After transaction ends**
   - Bob's transient permission expires
   - If Bob tries to decrypt again → ACL check fails
   - He'd need permanent permission to keep accessing

**Real Solidity code:**
```solidity
function transfer(address to, euint64 encryptedAmount) public {
    require(FHE.isSenderAllowed(encryptedAmount), "Unauthorized");
    
    // Perform encrypted arithmetic
    balances[msg.sender] = FHE.sub(balances[msg.sender], encryptedAmount);
    balances[to] = FHE.add(balances[to], encryptedAmount);
    
    // Grant permissions to new ciphertexts
    FHE.allowThis(balances[to]);
    FHE.allow(balances[to], to);  // Recipient can see new balance
}
```

---

## 🎛️ Button Reference

| Button | Section | What It Does | When to Use |
|--------|---------|-------------|-----------|
| **➕ Create Ciphertext** | 1 | Create new encrypted value | Start of demo |
| **[Ciphertext ID]** | 2 | Select ciphertext | Before granting permissions |
| **FHE.allowTransient()** | 3 | Grant temporary access | Test transient permissions |
| **FHE.makePubliclyDecryptable()** | 3 | Allow public decryption | Test public permissions |
| **Request Decryption** | 4 | Test if role can decrypt | Verify ACL checks |
| **Back to Landing** | Footer | Return to start | Reset demo |

---

## ❓ FAQ

**Q: What does "Ciphertext Handle" mean?**
A: It's the ID (like `ct_abc123`). You can see the handle but not the actual encrypted value. It's like knowing someone's bank account number but not the balance.

**Q: Can I revoke permanent access?**
A: In real Zama contracts, yes. There's a `FHE.revoke()` function. In this demo, we don't implement revocation, but it works the same way.

**Q: Why use Transient instead of Permanent?**
A: Transient permissions:
- Expire automatically (no cleanup needed)
- Use ultra-cheap EIP-1153 storage
- Perfect for temporary data passing
- Permanent would waste gas if only needed once

**Q: What if someone tries to decrypt without permission?**
A: The KMS checks the ACL, sees they're not authorized, and rejects the decryption. They get a ✗ DENIED event.

**Q: Can I have multiple ciphertexts with different ACLs?**
A: Yes! Each time you click "Create Ciphertext", you get a new one. Each has its own separate ACL.

**Q: Is this real Zama code?**
A: The demo **simulates the ACL logic** to teach you. Real Zama uses the TFHE Solidity library and threshold FHE for actual decryption. This focuses on **ACL permissions** clearly.

**Q: How does KMS know which ciphertext I'm decrypting?**
A: You pass the ciphertext ID to the KMS. The KMS looks up that ID, checks the on-chain ACL contract, and only decrypts if you're authorized.

---

## 🔒 Security Takeaway

### Attack Prevented By ACL

**Scenario without ACL:**
```
Hacker sees encrypted balance ciphertext: ct_123
Hacker sends ct_123 to the contract
Contract decrypts → hacker learns the balance
```

**Scenario with ACL:**
```
Hacker finds encrypted balance ciphertext: ct_123
Hacker sends ct_123 to contract
Contract checks: FHE.isSenderAllowed(ct_123)?
Hacker not in ACL → transaction REJECTED
Hacker never learns the balance ✓
```

---

## 🎓 Learning Path

1. **Read this guide** (you're here!) ✓
2. **Try the demo:**
   - Create 3 ciphertexts
   - Grant different permissions to each
   - Test decryption with different roles
3. **Read [TUTORIAL.md](./TUTORIAL.md)** for deeper dive
4. **Explore real Zama code** on [docs.zama.org](https://docs.zama.org/)

---

## 🚀 Now Go Explore!

Close this guide and **enter the demo**. Try it hands-on — you'll learn faster by doing!

**Tip:** Create multiple ciphertexts and experiment with different permission combinations. See what passes ACL checks and what doesn't.

---

**Questions? Ideas?** Check the [Zama Docs](https://docs.zama.org/) or open an issue! 🔐
