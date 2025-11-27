// App.tsx — Zama ACL Interactive Demo

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import './App.css';

// ============================================================================
// Zama ACL Simulation
// ============================================================================

interface Ciphertext {
  id: string;
  data: string;
  owner: string;
  permanentACL: string[];
  transientACL: string[];
  isPublic: boolean;
}

interface ACLEvent {
  timestamp: string;
  type: "allow" | "allowTransient" | "makePublic" | "decrypt_attempt" | "decrypt_success" | "decrypt_denied";
  ciphertext: string;
  actor: string;
  details: string;
}

// Simulate Zama FHE library ACL functions
const FHELibrary = {
  allow: (cipher: Ciphertext, addr: string): Ciphertext => ({
    ...cipher,
    permanentACL: [...new Set([...cipher.permanentACL, addr])],
  }),

  allowTransient: (cipher: Ciphertext, addr: string): Ciphertext => ({
    ...cipher,
    transientACL: [...new Set([...cipher.transientACL, addr])],
  }),

  allowThis: (cipher: Ciphertext, contractAddr: string): Ciphertext =>
    FHELibrary.allow(cipher, contractAddr),

  makePubliclyDecryptable: (cipher: Ciphertext): Ciphertext => ({
    ...cipher,
    isPublic: true,
  }),

  isSenderAllowed: (cipher: Ciphertext, sender: string): boolean =>
    cipher.permanentACL.includes(sender) || cipher.transientACL.includes(sender),

  isAllowed: (cipher: Ciphertext, addr: string): boolean =>
    cipher.permanentACL.includes(addr) || cipher.transientACL.includes(addr),
};

// ============================================================================
// Main App Component
// ============================================================================

export default function App() {
  const [stage, setStage] = useState("landing");
  const [role, setRole] = useState("User");
  const [ciphertexts, setCiphertexts] = useState<Ciphertext[]>([]);
  const [events, setEvents] = useState<ACLEvent[]>([]);
  const [selectedCipher, setSelectedCipher] = useState<string | null>(null);
  const [showTutorial, setShowTutorial] = useState(true);
  const addEvent = (event: ACLEvent) => {
    setEvents((prev) => [event, ...prev.slice(0, 19)]);
  };

  const createCiphertext = () => {
    const newCipher: Ciphertext = {
      id: `ct_${Math.random().toString(36).substring(7)}`,
      data: "balance: 1000",
      owner: "0x1234...Alice",
      permanentACL: [],
      transientACL: [],
      isPublic: false,
    };

    setCiphertexts((prev) => [...prev, newCipher]);
    addEvent({
      timestamp: new Date().toLocaleTimeString(),
      type: "allow",
      ciphertext: newCipher.id,
      actor: "Contract",
      details: `Ciphertext created: ${newCipher.id}`,
    });

    const withPermissions = FHELibrary.allow(
      FHELibrary.allowThis(newCipher, "0x5678...Contract"),
      "0x1234...Alice"
    );

    setCiphertexts((prev) =>
      prev.map((c) => (c.id === newCipher.id ? withPermissions : c))
    );

    addEvent({
      timestamp: new Date().toLocaleTimeString(),
      type: "allow",
      ciphertext: newCipher.id,
      actor: "FHE.allow()",
      details: `Granted to Alice (owner) & Contract (allowThis)`,
    });
  };

  const grantTransientAccess = (cipherId: string) => {
    setCiphertexts((prev) =>
      prev.map((c) => {
        if (c.id === cipherId) {
          const updated = FHELibrary.allowTransient(c, "0x9999...Gateway");
          addEvent({
            timestamp: new Date().toLocaleTimeString(),
            type: "allowTransient",
            ciphertext: cipherId,
            actor: "FHE.allowTransient()",
            details: `Granted transient access to Gateway (EIP-1153 transient storage)`,
          });
          return updated;
        }
        return c;
      })
    );
  };

  const makePublic = (cipherId: string) => {
    setCiphertexts((prev) =>
      prev.map((c) => {
        if (c.id === cipherId) {
          const updated = FHELibrary.makePubliclyDecryptable(c);
          addEvent({
            timestamp: new Date().toLocaleTimeString(),
            type: "makePublic",
            ciphertext: cipherId,
            actor: "FHE.makePubliclyDecryptable()",
            details: `Ciphertext is now publicly decryptable off-chain`,
          });
          return updated;
        }
        return c;
      })
    );
  };

  const attemptDecryption = (cipherId: string) => {
    const cipher = ciphertexts.find((c) => c.id === cipherId);
    if (!cipher) return;

    const isAllowed = FHELibrary.isAllowed(cipher, role) || cipher.isPublic;

    addEvent({
      timestamp: new Date().toLocaleTimeString(),
      type: "decrypt_attempt",
      ciphertext: cipherId,
      actor: role,
      details: `Decryption request by ${role}`,
    });

    if (isAllowed) {
      addEvent({
        timestamp: new Date().toLocaleTimeString(),
        type: "decrypt_success",
        ciphertext: cipherId,
        actor: "KMS/Coprocessor",
        details: `✓ ACL check passed. Decryption authorized. Result: ${cipher.data}`,
      });
    } else {
      addEvent({
        timestamp: new Date().toLocaleTimeString(),
        type: "decrypt_denied",
        ciphertext: cipherId,
        actor: "KMS/Gateway",
        details: `✗ ACL check failed. ${role} not authorized.`,
      });
    }
  };

  const selectedCipherData = ciphertexts.find((c) => c.id === selectedCipher);

  return (
    <div className="">
      <AnimatePresence mode="wait">
        {stage === "landing" ? (
          <motion.div key="landing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
           <div className="flex items-center justify-center min-h-screen">
            <div className="flex items-center justify-center">
              <motion.div 
                className="max-w-2xl bg-gradient-to-br from-yellow-400 via-amber-300 to-yellow-500 p-12 rounded-2xl shadow-2xl text-slate-950"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              >
                <motion.h1 
                  className="text-6xl font-bold mb-6"
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                >
                  Zama ACL
                </motion.h1>
                <motion.p 
                  className="text-lg mb-8 text-slate-800"
                  initial={{ y: -15, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                >
                  Interactive demo of Access Control Lists in Zama's Fully Homomorphic Encryption Virtual Machine (FHEVM)
                </motion.p>
                <motion.p 
                  className="text-sm mb-8 text-slate-700"
                  initial={{ y: -15, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.6, duration: 0.5 }}
                >
                  Learn how ACL governs who can compute on and decrypt encrypted values
                </motion.p>
                <motion.button
                  onClick={() => setStage("demo")}
                  className="px-8 py-4 bg-slate-950 hover:bg-black text-yellow-400 font-bold text-lg rounded-lg transition shadow-lg"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.8, duration: 0.5 }}
                >
                  Enter Demo
                </motion.button>
              </motion.div>
            </div>
            </div>
          </motion.div>
        ) : (
          <motion.div key="demo" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div>
              <motion.header 
                className="mb-8"
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                  <h1 className="text-4xl font-bold">
                  Zama ACL Protocol
                  </h1>
                
                <p className="">
                  (Interactive ciphertext & permission management)
                </p>
                </div>
              </motion.header>

              {/* Tutorial Guide */}
              {showTutorial && (
                <motion.div 
                  className="mb-8 p-6 border-2 border-yellow-400/50 rounded-lg"
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-xl font-bold text-red-400">📖 How to Use This Demo</h3>
                    <motion.button
                      onClick={() => setShowTutorial(false)}
                      className="text-yellow-400 hover:text-red-300 font-bold"
                      whileHover={{ scale: 1.2 }}
                    >
                      ✕
                    </motion.button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    {/* Step 1 */}
                    <motion.div 
                      className="p-4 bg-black rounded border-l-4 border-green-500"
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-xs font-bold text-slate-900">1</div>
                        <h4 className="font-semibold text-green-400">Create Ciphertext</h4>
                      </div>
                      <p className="text-slate-300 text-xs">
                        Click <span className="text-green-400 font-semibold">"+ Create Ciphertext"</span> to generate an encrypted value. 
                        This simulates creating an encrypted balance in Solidity using FHE.
                      </p>
                    </motion.div>

                    {/* Step 2 */}
                    <motion.div 
                      className="p-4 bg-black rounded border-l-4 border-blue-500"
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-xs font-bold text-slate-900">2</div>
                        <h4 className="font-semibold text-blue-400">Select Ciphertext</h4>
                      </div>
                      <p className="text-slate-300 text-xs">
                        Click on a ciphertext in the list. Its details appear below showing who has permission to access it.
                      </p>
                    </motion.div>

                    {/* Step 3 */}
                    <motion.div 
                      className="p-4 bg-black rounded border-l-4 border-cyan-500"
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.4 }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 bg-cyan-500 rounded-full flex items-center justify-center text-xs font-bold text-slate-900">3</div>
                        <h4 className="font-semibold text-cyan-400">Grant ACL Permissions</h4>
                      </div>
                      <p className="text-slate-300 text-xs">
                        Use two buttons to add permissions:
                        <br/><span className="text-blue-300">• Transient:</span> Temporary access (expires this transaction)
                        <br/><span className="text-purple-300">• Public:</span> Anyone can decrypt off-chain
                      </p>
                    </motion.div>

                    {/* Step 4 */}
                    <motion.div 
                      className="p-4 bg-black rounded border-l-4 border-yellow-500"
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.5 }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center text-xs font-bold text-slate-900">4</div>
                        <h4 className="font-semibold text-yellow-400">Test Decryption</h4>
                      </div>
                      <p className="text-slate-300 text-xs">
                        Select a role from the dropdown (Alice, Contract, Gateway, or Unauthorized). Click <span className="text-yellow-400 font-semibold">"Request Decryption"</span> to test if that role can decrypt.
                        The KMS checks ACL permissions!
                      </p>
                    </motion.div>
                  </div>

                  {/* Key Concepts */}
                  <motion.div 
                    className="mt-4 p-4 bg-black rounded border-l-4 border-purple-500"
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.6 }}
                  >
                    <h4 className="font-semibold text-purple-400 mb-2">🔐 Key Zama Concepts:</h4>
                    <ul className="text-xs text-slate-300 space-y-1">
                      <li><span className="text-yellow-400">FHE.allow():</span> Grants permanent access to an address</li>
                      <li><span className="text-blue-400">FHE.allowTransient():</span> Grants temporary access (EIP-1153, gas efficient)</li>
                      <li><span className="text-green-400">FHE.makePubliclyDecryptable():</span> Makes result publicly readable off-chain</li>
                      <li><span className="text-cyan-400">FHE.isSenderAllowed():</span> Checks if sender has permission before allowing operation</li>
                      <li><span className="text-pink-400">Ciphertext Handle:</span> An encrypted value that can only be decrypted if ACL permits</li>
                    </ul>
                  </motion.div>
                </motion.div>
              )}

              <div className="grid grid-cols-3 gap-6">
                {/* Main Controls Panel */}
                <motion.div 
                  className="col-span-2"
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                  <motion.div 
                    className="bg-slate-900 border-2 border-yellow-500/50 p-6 rounded-lg mb-6 hover:border-yellow-400/80 transition"
                    whileHover={{ boxShadow: "0 0 20px rgba(250, 204, 21, 0.3)" }}
                  >
                    <h2 className="text-2xl font-bold mb-4 text-yellow-400">Ciphertext Manager</h2>

                    {/* Create Ciphertext */}
                    <motion.div 
                      className="mb-6 p-4 bg-slate-800 rounded border border-yellow-500/30"
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      <h3 className="font-semibold mb-3 text-yellow-300">1. Create Encrypted Value</h3>
                      <motion.button
                        onClick={createCiphertext}
                        className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 rounded font-semibold transition"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        + Create Ciphertext
                      </motion.button>
                      <p className="text-xs text-yellow-200/60 mt-2">
                        Creates a new encrypted value with default ACL (owner + contract)
                      </p>
                    </motion.div>

                    {/* Ciphertext List */}
                    {ciphertexts.length > 0 && (
                      <motion.div 
                        className="mb-6 p-4 bg-slate-800 rounded border border-yellow-500/30"
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                      >
                        <h3 className="font-semibold mb-3 text-yellow-300">2. Select & Manage Ciphertext</h3>
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {ciphertexts.map((ct, idx) => (
                            <motion.button
                              key={ct.id}
                              onClick={() => setSelectedCipher(ct.id)}
                              className={`w-full text-left px-3 py-2 rounded text-sm transition ${
                                selectedCipher === ct.id
                                  ? "bg-yellow-500/30 border border-yellow-400"
                                  : "bg-slate-700 hover:bg-slate-600 border border-slate-600"
                              }`}
                              initial={{ x: -20, opacity: 0 }}
                              animate={{ x: 0, opacity: 1 }}
                              transition={{ delay: 0.3 + idx * 0.05 }}
                              whileHover={{ x: 5 }}
                            >
                              <span className="font-mono text-yellow-300">{ct.id}</span>
                              <span className="text-xs ml-2 text-slate-300">
                                {ct.isPublic ? "🌐 Public" : ""} ACL: {ct.permanentACL.length + ct.transientACL.length}
                              </span>
                            </motion.button>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {/* ACL Controls */}
                    {selectedCipherData && (
                      <motion.div 
                        className="mb-6 p-4 bg-slate-800 rounded border border-yellow-500/30"
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                      >
                        <h3 className="font-semibold mb-3 text-yellow-300">3. Grant ACL Permissions</h3>
                        <div className="space-y-2">
                          <motion.button
                            onClick={() => grantTransientAccess(selectedCipherData.id)}
                            className="w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 rounded font-semibold text-sm transition"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            FHE.allowTransient() — Temporary Access
                          </motion.button>
                          <motion.button
                            onClick={() => makePublic(selectedCipherData.id)}
                            className="w-full px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 rounded font-semibold text-sm transition"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            FHE.makePubliclyDecryptable() — Public Access
                          </motion.button>
                        </div>
                        <p className="text-xs text-yellow-200/60 mt-2">
                          Transient = EIP-1153 (gas efficient). Public = off-chain decryption.
                        </p>
                      </motion.div>
                    )}

                    {/* Decryption Test */}
                    <motion.div 
                      className="p-4 bg-slate-800 rounded border border-yellow-500/30"
                      initial={{ y: 10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.5 }}
                    >
                      <h3 className="font-semibold mb-3 text-yellow-300">4. Test Decryption Authorization</h3>
                      <div className="mb-3">
                        <label className="text-sm text-yellow-200">Select Role:</label>
                        <motion.select
                          value={role}
                          onChange={(e) => setRole(e.target.value)}
                          className="w-full mt-1 px-3 py-2 bg-slate-700 border border-yellow-500/30 rounded text-white focus:outline-none focus:border-yellow-400"
                          whileFocus={{ boxShadow: "0 0 10px rgba(250, 204, 21, 0.5)" }}
                        >
                          <option>User</option>
                          <option>0x1234...Alice</option>
                          <option>0x5678...Contract</option>
                          <option>0x9999...Gateway</option>
                          <option>Unauthorized</option>
                        </motion.select>
                      </div>
                      <motion.button
                        onClick={() => selectedCipherData && attemptDecryption(selectedCipherData.id)}
                        disabled={!selectedCipherData}
                        className="w-full px-4 py-2 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 disabled:from-slate-600 disabled:to-slate-600 rounded font-semibold transition text-slate-900"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        Request Decryption
                      </motion.button>
                      <p className="text-xs text-yellow-200/60 mt-2">
                        KMS checks: FHE.isSenderAllowed() or isPublic
                      </p>
                    </motion.div>
                  </motion.div>

                  {/* Ciphertext Details */}
                  {selectedCipherData && (
                    <motion.div 
                      className="bg-slate-900 border-2 border-yellow-500/50 p-6 rounded-lg hover:border-yellow-400/80 transition"
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.6 }}
                      whileHover={{ boxShadow: "0 0 20px rgba(250, 204, 21, 0.3)" }}
                    >
                      <h2 className="text-xl font-bold mb-4 text-yellow-400">Ciphertext Details</h2>
                      <div className="space-y-3 text-sm font-mono">
                        <motion.div initial={{ x: -10 }} animate={{ x: 0 }}>
                          <span className="text-slate-400">ID:</span> <span className="text-yellow-300">{selectedCipherData.id}</span>
                        </motion.div>
                        <motion.div initial={{ x: -10 }} animate={{ x: 0 }} transition={{ delay: 0.1 }}>
                          <span className="text-slate-400">Data:</span> <span className="text-yellow-300">{selectedCipherData.data}</span>
                        </motion.div>
                        <motion.div initial={{ x: -10 }} animate={{ x: 0 }} transition={{ delay: 0.2 }}>
                          <span className="text-slate-400">Owner:</span> <span className="text-yellow-300">{selectedCipherData.owner}</span>
                        </motion.div>
                        <motion.div initial={{ x: -10 }} animate={{ x: 0 }} transition={{ delay: 0.3 }}>
                          <span className="text-slate-400">Permanent ACL:</span>
                          <div className="ml-4 text-cyan-300">
                            {selectedCipherData.permanentACL.length === 0 ? (
                              <span className="text-slate-500">None</span>
                            ) : (
                              selectedCipherData.permanentACL.map((addr, i) => (
                                <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.1 }}>
                                  {addr}
                                </motion.div>
                              ))
                            )}
                          </div>
                        </motion.div>
                        <motion.div initial={{ x: -10 }} animate={{ x: 0 }} transition={{ delay: 0.4 }}>
                          <span className="text-slate-400">Transient ACL:</span>
                          <div className="ml-4 text-blue-300">
                            {selectedCipherData.transientACL.length === 0 ? (
                              <span className="text-slate-500">None</span>
                            ) : (
                              selectedCipherData.transientACL.map((addr, i) => (
                                <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.1 }}>
                                  {addr}
                                </motion.div>
                              ))
                            )}
                          </div>
                        </motion.div>
                        <motion.div initial={{ x: -10 }} animate={{ x: 0 }} transition={{ delay: 0.5 }}>
                          <span className="text-slate-400">Public?:</span>
                          <span className={selectedCipherData.isPublic ? "text-green-400" : "text-slate-500"}>
                            {selectedCipherData.isPublic ? " ✓ Yes" : " ✗ No"}
                          </span>
                        </motion.div>
                      </div>
                    </motion.div>
                  )}
                </motion.div>

                {/* Events Panel */}
                <motion.div 
                  className="col-span-1"
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <div className="bg-slate-900 border-2 border-yellow-500/50 p-6 rounded-lg h-[600px] flex flex-col hover:border-yellow-400/80 transition"
                    style={{
                      boxShadow: "0 0 15px rgba(250, 204, 21, 0.1)"
                    }}
                  >
                    <h2 className="text-xl font-bold mb-4 text-yellow-400">ACL Events Log</h2>
                    <div className="flex-1 overflow-auto space-y-2 scrollbar-thin scrollbar-thumb-yellow-500/30 scrollbar-track-slate-800">
                      {events.length === 0 ? (
                        <motion.div 
                          className="text-slate-500 text-sm"
                          animate={{ opacity: [0.5, 1, 0.5] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          Waiting for events...
                        </motion.div>
                      ) : (
                        events.map((event, i) => (
                          <motion.div
                            key={i}
                            className={`text-xs p-3 rounded border-l-4 ${
                              event.type === "decrypt_success"
                                ? "bg-green-900/30 border-l-green-400 text-green-100"
                                : event.type === "decrypt_denied"
                                ? "bg-red-900/30 border-l-red-400 text-red-100"
                                : event.type === "makePublic"
                                ? "bg-purple-900/30 border-l-purple-400 text-purple-100"
                                : event.type === "allowTransient"
                                ? "bg-blue-900/30 border-l-blue-400 text-blue-100"
                                : "bg-yellow-900/20 border-l-yellow-400 text-yellow-100"
                            }`}
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ duration: 0.3 }}
                            whileHover={{ x: 5, boxShadow: "0 0 10px rgba(0,0,0,0.3)" }}
                          >
                            <div className="font-semibold">[{event.timestamp}]</div>
                            <div className="text-xs opacity-80">{event.actor}</div>
                            <motion.div 
                              className="mt-1"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 0.1 }}
                            >
                              {event.details}
                            </motion.div>
                          </motion.div>
                        ))
                      )}
                    </div>
                  </div>
                </motion.div>
              </div>

              <motion.footer 
                className="mt-8 text-center"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.7 }}
              >
                <motion.button
                  onClick={() => setStage("landing")}
                  className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 rounded font-semibold text-slate-900 transition"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Back to Landing
                </motion.button>
              </motion.footer>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
