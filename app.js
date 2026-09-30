/* ================================================================
   BHARAT BEE — HONEYCHAIN  |  app.js
   Real SHA-256 Blockchain + QR Verification
   Smart India Hackathon 2026 | Team BHARAT BEE | SIH26021
   ================================================================ */

"use strict";

// ================================================================
// 1. CONFIGURATION
// ================================================================
const CFG = {
  // After deploying, put your production URL here (e.g. 'https://bharat-bee.vercel.app').
  // QR codes will ALWAYS point to it, no matter which address you open the admin panel from.
  PUBLIC_URL: "https://honey-chain-sih-26021-jade.vercel.app",
  GENESIS_HASH: "0".repeat(64),
  SEED_IDS: ["BATCH-2024-HRV-001", "BATCH-2024-HRV-002", "BATCH-2024-HRV-003"],
  ROLES: {
    BEEKEEPER: { label: "Beekeeper", icon: "🐝" },
    LAB: { label: "Lab Analyst", icon: "🧪" },
    PROCESSOR: { label: "Processor", icon: "🏭" },
    DISTRIBUTOR: { label: "Distributor", icon: "🚚" },
    RETAILER: { label: "Retailer", icon: "🏪" },
    SYSTEM: { label: "System", icon: "⛓️" },
  },
  STATUS: {
    PENDING: { label: "Pending", badge: "badge-pending", icon: "⏳" },
    MINTED: { label: "Harvested", badge: "badge-minted", icon: "🌱" },
    TESTED: { label: "Lab Tested", badge: "badge-tested", icon: "🧪" },
    PROCESSED: { label: "Processed", badge: "badge-processed", icon: "🏭" },
    IN_TRANSIT: { label: "In Transit", badge: "badge-transit", icon: "🚚" },
    AT_RETAIL: { label: "At Retail", badge: "badge-retail", icon: "🏪" },
    RETIRED: { label: "Sold ✓", badge: "badge-retired", icon: "🔥" },
  },
  STEPS: [
    {
      id: "beekeeper",
      role: "BEEKEEPER",
      icon: "🐝",
      label: "Register Harvest",
      action: "HARVEST_REGISTERED",
      nextStatus: "MINTED",
    },
    {
      id: "lab",
      role: "LAB",
      icon: "🧪",
      label: "Lab Testing",
      action: "LAB_TEST_COMPLETED",
      nextStatus: "TESTED",
    },
    {
      id: "processor",
      role: "PROCESSOR",
      icon: "🏭",
      label: "Processing",
      action: "BATCH_PROCESSED",
      nextStatus: "PROCESSED",
    },
    {
      id: "distributor",
      role: "DISTRIBUTOR",
      icon: "🚚",
      label: "Distribution",
      action: "BATCH_DISPATCHED",
      nextStatus: "IN_TRANSIT",
    },
    {
      id: "retailer",
      role: "RETAILER",
      icon: "🏪",
      label: "Retail & Sale",
      action: "INVENTORY_RECEIVED",
      nextStatus: "RETIRED",
    },
  ],
};

// ================================================================
// 2. REAL SHA-256 CRYPTOGRAPHY  (Web Crypto API — no libraries)
// ================================================================
// Standalone pure JS SHA-256 fallback for non-secure HTTP IP mobile contexts
// Standalone pure JS SHA-256 fallback for non-secure HTTP IP mobile contexts (Unicode & Emoji safe)
function jsSha256(str) {
  const utf8 = unescape(encodeURIComponent(str));
  const bytes = new Uint8Array(utf8.length);
  for (let i = 0; i < utf8.length; i++) bytes[i] = utf8.charCodeAt(i);

  const K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1,
    0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
    0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786,
    0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147,
    0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
    0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b,
    0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a,
    0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
    0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ];

  let H = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c,
    0x1f83d9ab, 0x5be0cd19,
  ];

  const len = bytes.length;
  const bitLen = len * 8;
  const newLen = Math.ceil((len + 9) / 64) * 64;
  const padded = new Uint8Array(newLen);
  padded.set(bytes);
  padded[len] = 0x80;

  const view = new DataView(padded.buffer);
  view.setUint32(newLen - 4, Math.floor(bitLen / 0x100000000), false);
  view.setUint32(newLen - 4, bitLen & 0xffffffff, false);

  const W = new Uint32Array(64);

  for (let offset = 0; offset < newLen; offset += 64) {
    for (let i = 0; i < 16; i++) {
      W[i] = view.getUint32(offset + i * 4, false);
    }
    for (let i = 16; i < 64; i++) {
      const s0 =
        ((W[i - 15] >>> 7) | (W[i - 15] << 25)) ^
        ((W[i - 15] >>> 18) | (W[i - 15] << 14)) ^
        (W[i - 15] >>> 3);
      const s1 =
        ((W[i - 2] >>> 17) | (W[i - 2] << 15)) ^
        ((W[i - 2] >>> 19) | (W[i - 2] << 13)) ^
        (W[i - 2] >>> 10);
      W[i] = (W[i - 16] + s0 + W[i - 7] + s1) | 0;
    }

    let a = H[0],
      b = H[1],
      c = H[2],
      d = H[3],
      e = H[4],
      f = H[5],
      g = H[6],
      h = H[7];

    for (let i = 0; i < 64; i++) {
      const S1 =
        ((e >>> 6) | (e << 26)) ^
        ((e >>> 11) | (e << 21)) ^
        ((e >>> 25) | (e << 7));
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + S1 + ch + K[i] + W[i]) | 0;
      const S0 =
        ((a >>> 2) | (a << 30)) ^
        ((a >>> 13) | (a << 19)) ^
        ((a >>> 22) | (a << 10));
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) | 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) | 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) | 0;
    }

    H[0] = (H[0] + a) | 0;
    H[1] = (H[1] + b) | 0;
    H[2] = (H[2] + c) | 0;
    H[3] = (H[3] + d) | 0;
    H[4] = (H[4] + e) | 0;
    H[5] = (H[5] + f) | 0;
    H[6] = (H[6] + g) | 0;
    H[7] = (H[7] + h) | 0;
  }

  return H.map((x) => (x >>> 0).toString(16).padStart(8, "0")).join("");
}

async function sha256(str) {
  try {
    if (window.crypto && window.crypto.subtle && window.crypto.subtle.digest) {
      const encoded = new TextEncoder().encode(str);
      const buf = await crypto.subtle.digest("SHA-256", encoded);
      return Array.from(new Uint8Array(buf))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    }
  } catch (e) {}
  return jsSha256(str);
}

async function computeBlockHash(b) {
  const payload = JSON.stringify({
    index: b.index,
    timestamp: b.timestamp,
    role: b.role,
    action: b.action,
    batchId: b.batchId,
    data: b.data,
    previousHash: b.previousHash,
  });
  return sha256(payload);
}

async function createBlock({
  index,
  role,
  action,
  batchId,
  data,
  previousHash,
  timestamp,
}) {
  const ts = timestamp || new Date().toISOString();
  const block = {
    index,
    timestamp: ts,
    role,
    action,
    batchId,
    data,
    previousHash,
  };
  block.hash = await computeBlockHash(block);
  return block;
}

async function validateChain(blocks) {
  if (!blocks || blocks.length === 0) return { valid: true, issues: [] };
  const issues = [];
  for (let i = 0; i < blocks.length; i++) {
    const computed = await computeBlockHash(blocks[i]);
    if (computed !== blocks[i].hash)
      issues.push(
        `Block #${blocks[i].index}: hash mismatch — data may be tampered`,
      );
    if (i > 0 && blocks[i].previousHash !== blocks[i - 1].hash)
      issues.push(
        `Block #${blocks[i].index}: previous hash broken — chain integrity lost`,
      );
  }
  return { valid: issues.length === 0, issues };
}

// ================================================================
// 3. STATE MANAGEMENT
// ================================================================
const STATE = {
  loggedIn: false,
  page: "landing",
  activeBatchId: null,
  chains: {}, // batchId → Block[]
  batches: {}, // batchId → BatchMeta
  blockchainFilter: "ALL",
  customHost: localStorage.getItem("hc_custom_host") || "",
};

function saveState() {
  try {
    localStorage.setItem(
      "hc_state",
      JSON.stringify({ chains: STATE.chains, batches: STATE.batches }),
    );
    sessionStorage.setItem("hc_auth", STATE.loggedIn ? "1" : "0");
  } catch (e) {}
  // Share with the server so other devices (e.g. a judge's phone scanning a QR) see the same data
  try {
    fetch("/api/state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chains: STATE.chains, batches: STATE.batches }),
    })
      .then(async (r) => {
        if (r.ok) return;
        if (r.status === 404 || r.status === 405) return; // static hosting without an API
        let msg = "Cloud sync failed";
        try {
          msg = (await r.json()).error || msg;
        } catch (e) {}
        if (!STATE._syncWarned) {
          STATE._syncWarned = true;
          toast("⚠️ " + msg, "warning", 7000);
        }
      })
      .catch(() => {});
  } catch (e) {}
}

// Merge a saved snapshot into STATE (the longer chain wins)
function mergeSnapshot(p) {
  if (!p || typeof p !== "object") return;
  for (const [id, chain] of Object.entries(p.chains || {})) {
    if (
      Array.isArray(chain) &&
      (!STATE.chains[id] || chain.length > (STATE.chains[id]?.length || 0))
    ) {
      STATE.chains[id] = chain;
      if (p.batches && p.batches[id]) STATE.batches[id] = p.batches[id];
    }
  }
}

// Pull shared data + LAN address from server.py (silently skipped on plain static hosting)
async function loadRemoteState() {
  try {
    const [st, host] = await Promise.all([
      fetch("/api/state", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
      ["localhost", "127.0.0.1"].includes(window.location.hostname)
        ? fetch("/api/host", { cache: "no-store" })
            .then((r) => (r.ok ? r.json() : null))
            .catch(() => null)
        : Promise.resolve(null),
    ]);
    if (host && host.ip) {
      STATE.lanIp = host.ip;
      STATE.lanPort = host.port;
    }
    if (st) mergeSnapshot(st);
  } catch (e) {}
}

function loadPersistedState() {
  try {
    STATE.loggedIn = sessionStorage.getItem("hc_auth") === "1";
    const raw = localStorage.getItem("hc_state");
    if (raw) {
      const p = JSON.parse(raw);
      if (p && typeof p === "object") {
        for (const [id, chain] of Object.entries(p.chains || {})) {
          if (
            Array.isArray(chain) &&
            (!STATE.chains[id] ||
              chain.length > (STATE.chains[id]?.length || 0))
          ) {
            STATE.chains[id] = chain;
            if (p.batches && p.batches[id]) STATE.batches[id] = p.batches[id];
          }
        }
      }
    }
  } catch (e) {}
}

function getNextBatchId() {
  const nums = Object.keys(STATE.batches)
    .map((id) => parseInt(id.split("-").pop()))
    .filter((n) => !isNaN(n));
  const next = nums.length ? Math.max(...nums) + 1 : 4;
  return `BATCH-2024-HRV-${String(next).padStart(3, "0")}`;
}

function getBatchCurrentStep(batchId) {
  const s = STATE.batches[batchId]?.status;
  const m = {
    MINTED: 1,
    TESTED: 2,
    PROCESSED: 3,
    IN_TRANSIT: 4,
    AT_RETAIL: 4,
    RETIRED: 5,
  };
  return m[s] ?? 0;
}

// ================================================================
// 4. SEED DATA  (Pre-seeded chains with real SHA-256 hashes)
// ================================================================
async function buildChain(rawBlocks) {
  const chain = [];
  let prevHash = CFG.GENESIS_HASH;
  for (const raw of rawBlocks) {
    const block = await createBlock({ ...raw, previousHash: prevHash });
    chain.push(block);
    prevHash = block.hash;
  }
  return chain;
}

async function initSeedData() {
  // Only seed if not already in STATE (localStorage may have updated versions)
  if (!STATE.chains["BATCH-2024-HRV-001"]) {
    STATE.chains["BATCH-2024-HRV-001"] = await buildChain([
      {
        index: 0,
        role: "BEEKEEPER",
        action: "HARVEST_REGISTERED",
        batchId: "BATCH-2024-HRV-001",
        timestamp: "2024-09-01T08:30:00.000Z",
        data: {
          beekeeperName: "Rajan Kumar",
          hiveId: "HV-042",
          location: "Coorg, Karnataka",
          honeyType: "Wildflower",
          harvestDate: "2024-09-01",
          quantityKg: "12.5",
          hiveWeightBefore: "35.2 kg",
          hiveWeightAfter: "22.7 kg",
          temperature: "28.4°C",
          humidity: "65%",
          notes:
            "Excellent harvest — healthy hive activity, strong bee population",
        },
      },
      {
        index: 1,
        role: "LAB",
        action: "LAB_TEST_COMPLETED",
        batchId: "BATCH-2024-HRV-001",
        timestamp: "2024-09-05T11:15:00.000Z",
        data: {
          labName: "FSSAI Accredited Lab Chennai",
          fssaiLicense: "FSS-LAB-TN-0042",
          testDate: "2024-09-05",
          moisture: "17.2%",
          hmf: "8.3 mg/kg",
          sucrose: "2.1%",
          reducingSugars: "74.8%",
          diastase: "12.4 DN",
          result: "PASS",
          certificateNo: "LAB-2024-CHN-8821",
        },
      },
      {
        index: 2,
        role: "PROCESSOR",
        action: "BATCH_PROCESSED",
        batchId: "BATCH-2024-HRV-001",
        timestamp: "2024-09-10T09:00:00.000Z",
        data: {
          companyName: "SunGold Honey Pvt Ltd",
          fssaiLicense: "FSS-PRO-KA-1189",
          processingDate: "2024-09-10",
          bottleCount: "48",
          bottleSize: "500ml",
          batchSealNo: "SG-2024-B001",
          notes: "Cold extracted, minimal processing applied",
        },
      },
      {
        index: 3,
        role: "DISTRIBUTOR",
        action: "BATCH_DISPATCHED",
        batchId: "BATCH-2024-HRV-001",
        timestamp: "2024-09-12T06:30:00.000Z",
        data: {
          companyName: "AgroTransit Logistics",
          vehicleNo: "KA-01-AB-1234",
          dispatchDate: "2024-09-12",
          destination: "New Delhi",
          expectedDelivery: "2024-09-16",
          route: "Bengaluru → Pune → Mumbai → Delhi",
        },
      },
      {
        index: 4,
        role: "RETAILER",
        action: "INVENTORY_RECEIVED",
        batchId: "BATCH-2024-HRV-001",
        timestamp: "2024-09-18T14:00:00.000Z",
        data: {
          storeName: "Nature's Basket",
          fssaiLicense: "FSS-RET-DL-5521",
          storeLocation: "Connaught Place, New Delhi",
          receiptDate: "2024-09-18",
          invoiceNo: "NB-INV-2024-4412",
          bottlesReceived: "48",
        },
      },
      {
        index: 5,
        role: "RETAILER",
        action: "TOKEN_RETIRED",
        batchId: "BATCH-2024-HRV-001",
        timestamp: "2024-09-25T16:45:00.000Z",
        data: {
          event: "BATCH_SOLD_AND_RETIRED",
          storeName: "Nature's Basket",
          storeLocation: "Connaught Place, New Delhi",
          saleDate: "2024-09-25",
          invoiceRef: "NB-SALE-2024-7891",
          bottlesSold: "48",
          note: "Full batch sold. Token permanently retired. Chain sealed.",
        },
      },
    ]);
    STATE.batches["BATCH-2024-HRV-001"] = {
      id: "BATCH-2024-HRV-001",
      name: "Coorg Wildflower Honey",
      status: "RETIRED",
      beekeeperName: "Rajan Kumar",
      location: "Coorg, Karnataka",
      honeyType: "Wildflower",
      quantityKg: 12.5,
      bottles: 48,
      createdAt: "2024-09-01T08:30:00.000Z",
      retiredAt: "2024-09-25T16:45:00.000Z",
      retailer: "Nature's Basket, Connaught Place, New Delhi",
    };
  }

  if (!STATE.chains["BATCH-2024-HRV-002"]) {
    STATE.chains["BATCH-2024-HRV-002"] = await buildChain([
      {
        index: 0,
        role: "BEEKEEPER",
        action: "HARVEST_REGISTERED",
        batchId: "BATCH-2024-HRV-002",
        timestamp: "2024-09-05T07:00:00.000Z",
        data: {
          beekeeperName: "Sunita Devi",
          hiveId: "HV-018",
          location: "Sundarbans, West Bengal",
          honeyType: "Mangrove",
          harvestDate: "2024-09-05",
          quantityKg: "8.3",
          hiveWeightBefore: "28.1 kg",
          hiveWeightAfter: "19.8 kg",
          temperature: "31.2°C",
          humidity: "78%",
          notes: "Rare Sundarbans mangrove honey harvest",
        },
      },
      {
        index: 1,
        role: "LAB",
        action: "LAB_TEST_COMPLETED",
        batchId: "BATCH-2024-HRV-002",
        timestamp: "2024-09-10T10:00:00.000Z",
        data: {
          labName: "AgriTest Labs Kolkata",
          fssaiLicense: "FSS-LAB-WB-0087",
          testDate: "2024-09-10",
          moisture: "18.1%",
          hmf: "12.1 mg/kg",
          sucrose: "1.8%",
          reducingSugars: "76.2%",
          diastase: "10.8 DN",
          result: "PASS",
          certificateNo: "LAB-2024-KOL-3312",
        },
      },
      {
        index: 2,
        role: "PROCESSOR",
        action: "BATCH_PROCESSED",
        batchId: "BATCH-2024-HRV-002",
        timestamp: "2024-09-15T11:00:00.000Z",
        data: {
          companyName: "BengalBee Processing Co.",
          fssaiLicense: "FSS-PRO-WB-0221",
          processingDate: "2024-09-15",
          bottleCount: "32",
          bottleSize: "500ml",
          batchSealNo: "BB-2024-B002",
          notes: "Filtered and sealed per FSSAI standards",
        },
      },
      {
        index: 3,
        role: "DISTRIBUTOR",
        action: "BATCH_DISPATCHED",
        batchId: "BATCH-2024-HRV-002",
        timestamp: "2024-09-17T05:30:00.000Z",
        data: {
          companyName: "FastMove Freight Pvt Ltd",
          vehicleNo: "WB-02-CD-5678",
          dispatchDate: "2024-09-17",
          destination: "Mumbai",
          expectedDelivery: "2024-09-21",
          route: "Kolkata → Bhubaneswar → Mumbai",
        },
      },
      {
        index: 4,
        role: "RETAILER",
        action: "INVENTORY_RECEIVED",
        batchId: "BATCH-2024-HRV-002",
        timestamp: "2024-09-22T12:00:00.000Z",
        data: {
          storeName: "Organic India Store",
          fssaiLicense: "FSS-RET-MH-3341",
          storeLocation: "Bandra West, Mumbai",
          receiptDate: "2024-09-22",
          invoiceNo: "OI-INV-2024-9921",
          bottlesReceived: "32",
        },
      },
    ]);
    STATE.batches["BATCH-2024-HRV-002"] = {
      id: "BATCH-2024-HRV-002",
      name: "Sundarbans Mangrove Honey",
      status: "AT_RETAIL",
      beekeeperName: "Sunita Devi",
      location: "Sundarbans, West Bengal",
      honeyType: "Mangrove",
      quantityKg: 8.3,
      bottles: 32,
      createdAt: "2024-09-05T07:00:00.000Z",
      retailer: "Organic India Store, Bandra West, Mumbai",
    };
  }

  if (!STATE.chains["BATCH-2024-HRV-003"]) {
    STATE.chains["BATCH-2024-HRV-003"] = await buildChain([
      {
        index: 0,
        role: "BEEKEEPER",
        action: "HARVEST_REGISTERED",
        batchId: "BATCH-2024-HRV-003",
        timestamp: "2024-09-15T06:00:00.000Z",
        data: {
          beekeeperName: "Mohan Lal Sharma",
          hiveId: "HV-031",
          location: "Manali, Himachal Pradesh",
          honeyType: "Himalayan Wildflower",
          harvestDate: "2024-09-15",
          quantityKg: "6.8",
          hiveWeightBefore: "24.5 kg",
          hiveWeightAfter: "17.7 kg",
          temperature: "18.2°C",
          humidity: "55%",
          notes: "High-altitude harvest — premium quality expected",
        },
      },
      {
        index: 1,
        role: "LAB",
        action: "LAB_TEST_COMPLETED",
        batchId: "BATCH-2024-HRV-003",
        timestamp: "2024-09-22T09:30:00.000Z",
        data: {
          labName: "NABL Accredited Lab Chandigarh",
          fssaiLicense: "FSS-LAB-HP-0031",
          testDate: "2024-09-22",
          moisture: "16.8%",
          hmf: "6.2 mg/kg",
          sucrose: "1.5%",
          reducingSugars: "78.1%",
          diastase: "15.2 DN",
          result: "PASS",
          certificateNo: "LAB-2024-CHD-1102",
        },
      },
    ]);
    STATE.batches["BATCH-2024-HRV-003"] = {
      id: "BATCH-2024-HRV-003",
      name: "Himalayan Wildflower Honey",
      status: "TESTED",
      beekeeperName: "Mohan Lal Sharma",
      location: "Manali, Himachal Pradesh",
      honeyType: "Himalayan Wildflower",
      quantityKg: 6.8,
      bottles: null,
      createdAt: "2024-09-15T06:00:00.000Z",
    };
  }
}

// ================================================================
// 5. UTILITIES
// ================================================================
const SVG_LOGO = `<img src="logo.jpg" alt="Bharat Bee Logo" style="height:36px;width:auto;vertical-align:middle;object-fit:contain;border-radius:6px;box-shadow:0 2px 8px rgba(245,166,35,0.3)">`;

function shortHash(h) {
  return h ? h.slice(0, 8) + "…" + h.slice(-6) : "—";
}
function fmtDate(iso) {
  try {
    return new Date(iso).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso || "—";
  }
}
function progressPct(status) {
  return (
    {
      MINTED: 16,
      TESTED: 33,
      PROCESSED: 50,
      IN_TRANSIT: 66,
      AT_RETAIL: 83,
      RETIRED: 100,
    }[status] || 0
  );
}
function roleColor(role) {
  return (
    {
      BEEKEEPER: "#22C55E",
      LAB: "#3B82F6",
      PROCESSOR: "#A855F7",
      DISTRIBUTOR: "#F5A623",
      RETAILER: "#EC4899",
      SYSTEM: "#8B99B5",
    }[role] || "#8B99B5"
  );
}
function roleBg(role) {
  return (
    {
      BEEKEEPER: "rgba(34,197,94,0.15)",
      LAB: "rgba(59,130,246,0.15)",
      PROCESSOR: "rgba(168,85,247,0.15)",
      DISTRIBUTOR: "rgba(245,166,35,0.15)",
      RETAILER: "rgba(236,72,153,0.15)",
      SYSTEM: "rgba(139,153,181,0.1)",
    }[role] || "rgba(139,153,181,0.1)"
  );
}
function fmtDataObj(obj) {
  return Object.entries(obj)
    .filter(([k]) => !["event", "note", "retired"].includes(k))
    .map(
      ([k, v]) =>
        `<span style="color:var(--text-muted)">${camelToLabel(k)}:</span> <b>${v}</b>`,
    )
    .join(" &nbsp;·&nbsp; ");
}
function camelToLabel(s) {
  return s.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
}
function verifyBaseUrl() {
  if (STATE.customHost) {
    let h = STATE.customHost.trim();
    if (!h.startsWith("http://") && !h.startsWith("https://"))
      h = "http://" + h;
    const path =
      window.location.pathname === "/" ? "" : window.location.pathname;
    return h + path;
  }
  if (CFG.PUBLIC_URL) return CFG.PUBLIC_URL.replace(/\/+$/, "");
  // localhost is unreachable from a phone, so use this computer's real Wi-Fi/LAN address
  // (detected automatically by server.py via /api/host)
  if (
    (window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1") &&
    STATE.lanIp
  ) {
    const path =
      window.location.pathname === "/" ? "" : window.location.pathname;
    return (
      "http://" +
      STATE.lanIp +
      ":" +
      (STATE.lanPort || window.location.port || 80) +
      path
    );
  }
  return window.location.origin + window.location.pathname;
}

// ================================================================
// 6. TOAST NOTIFICATIONS
// ================================================================
function toast(msg, type = "success", dur = 3500) {
  const icons = { success: "✅", error: "❌", warning: "⚠️", info: "ℹ️" };
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  el.innerHTML = `<span>${icons[type] || "•"}</span><span>${msg}</span>`;
  document.getElementById("toast-container").appendChild(el);
  setTimeout(() => {
    el.style.cssText +=
      "opacity:0;transform:translateX(40px);transition:all 0.3s";
    setTimeout(() => el.remove(), 300);
  }, dur);
}

// ================================================================
// 7. ROUTER
// ================================================================
function navigate(page, params = {}) {
  STATE.page = page;
  if (params.batchId !== undefined) STATE.activeBatchId = params.batchId;
  renderApp();
}

function renderApp() {
  const app = document.getElementById("app");
  if (!app) return;

  // Check for ?verify= param — QR scan landing
  const urlParams = new URLSearchParams(window.location.search);
  const verifyId = urlParams.get("verify");
  const bottleId = urlParams.get("bottle") || "B001";
  if (verifyId) {
    document.body.innerHTML = pageVerify(verifyId, bottleId);
    setTimeout(() => runVerifyChain(verifyId), 600);
    return;
  }

  // Redirect to login if trying to access protected pages
  const protectedPages = ["dashboard", "workflow", "blockchain", "qr-admin"];
  if (!STATE.loggedIn && protectedPages.includes(STATE.page))
    STATE.page = "login";

  const pageMap = {
    landing: pageLanding,
    login: pageLogin,
    dashboard: pageDashboard,
    workflow: pageWorkflow,
    blockchain: pageBlockchain,
    "qr-admin": pageQRAdmin,
  };

  if (STATE.page === "landing" || STATE.page === "login") {
    app.innerHTML = (pageMap[STATE.page] || pageLanding)();
  } else {
    app.innerHTML =
      shellNavbar() +
      `
      <div class="app-layout">
        ${shellSidebar()}
        <div class="main-content" id="main-content">
          ${(pageMap[STATE.page] || pageDashboard)()}
        </div>
      </div>`;
  }

  afterRender();
}

function afterRender() {
  // Attach form handlers
  const wfForm = document.getElementById("workflow-form");
  if (wfForm) wfForm.addEventListener("submit", handleWorkflowSubmit);
  const loginForm = document.getElementById("login-form");
  if (loginForm) loginForm.addEventListener("submit", handleLogin);

  // Initialize QR codes across all pages
  initAllQRCodes();

  // Run chain validation on blockchain page
  if (STATE.page === "blockchain") runBlockchainValidation();
}

// ================================================================
// 8. SHARED SHELL — NAVBAR + SIDEBAR
// ================================================================
function shellNavbar() {
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: "⊞" },
    { id: "workflow", label: "Workflow", icon: "↗" },
    { id: "blockchain", label: "Blockchain", icon: "⛓" },
    { id: "qr-admin", label: "QR Codes", icon: "▣" },
  ];
  return `
  <nav class="navbar">
    <div class="nav-logo">
      ${SVG_LOGO}
      <span>Bharat <span class="brand-accent">Bee</span></span>
      <span style="color:var(--text-muted);font-weight:400;font-size:0.85rem;margin-left:4px">HoneyChain</span>
    </div>
    <div class="nav-links">
      ${navItems
        .map(
          (n) => `
        <button class="nav-link ${STATE.page === n.id ? "active" : ""}" onclick="navigate('${n.id}')">
          ${n.icon} ${n.label}
        </button>`,
        )
        .join("")}
    </div>
    <div class="nav-actions">
      <div class="badge-chain">Chain Active</div>
      <button class="btn btn-ghost btn-sm" onclick="doLogout()">↩ Logout</button>
    </div>
  </nav>`;
}

function shellSidebar() {
  const batches = Object.values(STATE.batches);
  const totalBlocks = Object.values(STATE.chains).reduce(
    (s, c) => s + c.length,
    0,
  );
  return `
  <aside class="sidebar">
    <div class="sidebar-section">
      <div class="sidebar-label">System</div>
      <button class="sidebar-item ${STATE.page === "dashboard" ? "active" : ""}" onclick="navigate('dashboard')">
        <span class="icon">⊞</span> Overview
      </button>
      <button class="sidebar-item ${STATE.page === "blockchain" ? "active" : ""}" onclick="navigate('blockchain')">
        <span class="icon">⛓</span> Blockchain
        <span class="count">${totalBlocks}</span>
      </button>
      <button class="sidebar-item ${STATE.page === "qr-admin" ? "active" : ""}" onclick="navigate('qr-admin')">
        <span class="icon">▣</span> QR Codes
      </button>
    </div>
    <div class="sidebar-section">
      <div class="sidebar-label">Batches</div>
      ${batches
        .map((b) => {
          const sc = CFG.STATUS[b.status] || {};
          const active =
            STATE.activeBatchId === b.id && STATE.page === "workflow";
          return `
        <button class="sidebar-item ${active ? "active" : ""}" onclick="navigate('workflow',{batchId:'${b.id}'})">
          <span class="icon">${sc.icon || "📦"}</span>
          <span style="font-size:0.78rem;flex:1;text-align:left;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${b.name.split(" ").slice(0, 3).join(" ")}</span>
        </button>`;
        })
        .join("")}
      <button class="sidebar-item" onclick="startNewBatch()"
        style="color:var(--amber);border:1px dashed var(--border-amber);margin-top:8px">
        <span class="icon">+</span> New Harvest
      </button>
    </div>
  </aside>`;
}

// ================================================================
// 9. PAGE — LANDING (public)
// ================================================================
function pageLanding() {
  const batches = Object.values(STATE.batches);
  const sold = batches.filter((b) => b.status === "RETIRED").length;
  const totalBottles = batches.reduce((s, b) => s + (b.bottles || 0), 0);
  const totalBlocks = Object.values(STATE.chains).reduce(
    (s, c) => s + c.length,
    0,
  );

  return `
  <nav class="navbar">
    <div class="nav-logo">
      ${SVG_LOGO}
      <span>Bharat <span class="brand-accent">Bee</span></span>
      <span style="color:var(--text-muted);font-weight:400;font-size:0.85rem;margin-left:4px">HoneyChain</span>
    </div>
    <div class="nav-actions">
      <div class="badge-chain">Live Chain</div>
      <button class="btn btn-ghost btn-sm" onclick="navigate('login')">Admin Login →</button>
    </div>
  </nav>

  <section class="hero">
    <div class="hero-eyebrow">🏆 Smart India Hackathon 2026 &nbsp;·&nbsp; Problem ID: SIH26021</div>
    <h1 class="hero-title">
      Honey Traceability<br>from <span class="gradient-text">Hive to Bottle</span>
    </h1>
    <p class="hero-desc">
      A blockchain-based platform that cryptographically records every step of honey's journey — 
      from the beekeeper's hive to the consumer's table — using real SHA-256 hashing, 
      IoT sensor data, AI anomaly detection, and QR verification.
    </p>
    <div class="hero-actions">
      <button class="btn btn-primary btn-lg" onclick="navigate('login')">🔐 Admin Dashboard</button>
      <button class="btn btn-ghost btn-lg" onclick="document.getElementById('demo-section').scrollIntoView({behavior:'smooth'})">📦 View Live Batches ↓</button>
    </div>

    <div class="stats-bar" style="width:100%;max-width:720px">
      <div class="stats-bar-item">
        <div class="stats-bar-num">${batches.length}</div>
        <div class="stats-bar-label">Batches Tracked</div>
      </div>
      <div class="stats-bar-item">
        <div class="stats-bar-num">${sold}</div>
        <div class="stats-bar-label">Sold &amp; Retired</div>
      </div>
      <div class="stats-bar-item">
        <div class="stats-bar-num">${totalBottles}</div>
        <div class="stats-bar-label">Bottles Traced</div>
      </div>
      <div class="stats-bar-item">
        <div class="stats-bar-num">${totalBlocks}</div>
        <div class="stats-bar-label">Blockchain Blocks</div>
      </div>
    </div>
  </section>

  <section class="container" style="padding-bottom:80px">
    <div class="section-header" style="text-align:center">
      <div class="section-tag">✨ Technology</div>
      <h2 class="section-title">Multi-Layer Verification</h2>
    </div>
    <div class="feature-grid">
      <div class="feature-card">
        <div class="feature-icon">⛓️</div>
        <div class="feature-title">Real SHA-256 Blockchain</div>
        <div class="feature-desc">Every record is cryptographically hashed and chained using the browser's native Web Crypto API. Open DevTools → verify the hashes yourself.</div>
      </div>
      <div class="feature-card">
        <div class="feature-icon">📡</div>
        <div class="feature-title">IoT Hive Monitoring</div>
        <div class="feature-desc">Temperature, humidity, weight and acoustic data from hive sensors is embedded directly into harvest records on-chain.</div>
      </div>
      <div class="feature-card">
        <div class="feature-icon">🤖</div>
        <div class="feature-title">AI Anomaly Detection</div>
        <div class="feature-desc">Unusual sensor readings, inconsistent yields and lab mismatches are flagged automatically by the AI plausibility layer.</div>
      </div>
      <div class="feature-card">
        <div class="feature-icon">🧪</div>
        <div class="feature-title">Lab-Bound Certificate</div>
        <div class="feature-desc">Lab sample codes are bound to the batch before testing, preventing report reattachment and certificate fraud.</div>
      </div>
      <div class="feature-card">
        <div class="feature-icon">📲</div>
        <div class="feature-title">QR + Token Retirement</div>
        <div class="feature-desc">Each bottle's QR links to its provenance. At sale, the retailer retires the token — permanently sealing the chain. Unsold bottles show a clear warning.</div>
      </div>
      <div class="feature-card">
        <div class="feature-icon">🔐</div>
        <div class="feature-title">Role-Based Workflow</div>
        <div class="feature-desc">Sequential, locked workflow: Beekeeper → Lab → Processor → Distributor → Retailer. Each stage unlocks only after the previous is verified.</div>
      </div>
    </div>

    <div id="demo-section" class="section-header" style="text-align:center;margin-top:60px">
      <div class="section-tag">📦 Live Demo</div>
      <h2 class="section-title">Currently Tracked Batches</h2>
      <p class="section-desc">Click a batch card to verify — or <button class="btn btn-ghost btn-sm" style="display:inline-flex" onclick="navigate('login')">log in as Admin</button> to walk through the workflow</p>
    </div>
    <div class="batch-grid">
      ${Object.values(STATE.batches)
        .map((b) => landingBatchCard(b))
        .join("")}
    </div>
  </section>

  <footer style="text-align:center;padding:40px 24px;color:var(--text-muted);font-size:0.85rem;border-top:1px solid var(--border)">
    <div>${SVG_LOGO}</div>
    <div style="margin-top:8px;font-weight:600">Bharat Bee — HoneyChain &nbsp;·&nbsp; SIH 2026 &nbsp;·&nbsp; SIH26021</div>
    <div style="margin-top:4px;opacity:0.7">Real SHA-256 · Web Crypto API · Permissioned Blockchain · IoT + AI + QR</div>
  </footer>`;
}

function landingBatchCard(b) {
  const pct = progressPct(b.status);
  const sc = CFG.STATUS[b.status] || {};
  const chain = STATE.chains[b.id] || [];
  return `
  <div class="batch-preview-card" onclick="navigate('login')" style="cursor:pointer">
    <div class="flex-between mb-8">
      <div class="batch-id">${b.id}</div>
      <span class="badge ${sc.badge}">${sc.icon} ${sc.label}</span>
    </div>
    <div class="batch-name">${b.name}</div>
    <div class="batch-meta mt-8">📍 ${b.location} &nbsp;·&nbsp; 🐝 ${b.beekeeperName}</div>
    ${b.bottles ? `<div class="batch-meta">🍯 ${b.bottles} bottles · ⚖️ ${b.quantityKg} kg</div>` : `<div class="batch-meta">⚖️ ${b.quantityKg} kg harvested</div>`}
    <div class="batch-progress mt-16">
      <div class="flex-between mb-8" style="font-size:0.75rem">
        <span class="text-muted">Supply Chain Progress</span>
        <span class="text-amber fw-600">${pct}%</span>
      </div>
      <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
    </div>
    <div style="margin-top:10px;font-size:0.72rem;color:var(--text-muted);font-family:'JetBrains Mono',monospace">
      ${chain.length} blocks · last: ${shortHash(chain.slice(-1)[0]?.hash || "")}
    </div>
  </div>`;
}

// ================================================================
// 10. PAGE — LOGIN
// ================================================================
function pageLogin() {
  return `
  <div class="login-page">
    <div class="login-card" style="animation:fade-up 0.4s ease;max-width:380px;padding:32px 28px;text-align:center">
      <div class="login-logo" style="margin-bottom:20px">
        <img src="logo.jpg" alt="Bharat Bee" style="height:64px;width:auto;object-fit:contain;margin-bottom:12px;border-radius:10px;box-shadow:0 4px 20px rgba(245,166,35,0.3)">
        <div class="login-title" style="font-size:1.35rem;font-weight:700;color:var(--text-primary)">System Admin Login</div>
        <div class="login-sub" style="font-size:0.78rem;color:var(--text-muted);margin-top:2px">Bharat Bee Traceability Network</div>
      </div>

      <form id="login-form" style="text-align:left">
        <div class="form-group mb-16">
          <label class="form-label">Username</label>
          <input class="form-input" id="login-user" value="admin" placeholder="admin">
        </div>
        <div class="form-group mb-20">
          <label class="form-label">Password</label>
          <input class="form-input" id="login-pass" type="password" value="honeychain2026" placeholder="••••••••••">
        </div>
        <button type="submit" class="btn btn-primary btn-full btn-lg">🔐 Login to Dashboard</button>
      </form>

      <div style="text-align:center;margin-top:14px">
        <button class="btn btn-ghost btn-sm" onclick="navigate('landing')">← Back to Home</button>
      </div>

      <div style="margin-top:16px;padding:10px 12px;background:var(--amber-glow-sm);border:1px solid var(--border-amber);border-radius:var(--radius);font-size:0.75rem;color:var(--text-secondary);text-align:center">
        🔑 <b style="color:var(--amber)">Demo Credentials:</b> admin / honeychain2026
      </div>
    </div>
  </div>`;
}

function selectRole(roleId, el) {
  document
    .querySelectorAll(".role-btn")
    .forEach((b) => b.classList.remove("selected"));
  el.classList.add("selected");
}

function handleLogin(e) {
  e.preventDefault();
  const user = document.getElementById("login-user").value.trim();
  const pass = document.getElementById("login-pass").value;
  if (user === "admin" && pass === "honeychain2026") {
    STATE.loggedIn = true;
    saveState();
    toast("Welcome back, System Admin! 🐝", "success");
    navigate("dashboard");
  } else {
    toast("Invalid credentials. Try admin / honeychain2026", "error");
    document.getElementById("login-pass").value = "";
  }
}

function doLogout() {
  STATE.loggedIn = false;
  saveState();
  navigate("landing");
  toast("Logged out successfully", "info");
}

// ================================================================
// 11. PAGE — DASHBOARD
// ================================================================
function pageDashboard() {
  const batches = Object.values(STATE.batches);
  const sold = batches.filter((b) => b.status === "RETIRED").length;
  const active = batches.filter(
    (b) => b.status !== "RETIRED" && b.status !== "PENDING",
  ).length;
  const totalBottles = batches.reduce((s, b) => s + (b.bottles || 0), 0);
  const totalBlocks = Object.values(STATE.chains).reduce(
    (s, c) => s + c.length,
    0,
  );

  const recentBlocks = Object.values(STATE.chains)
    .flatMap((c) => c)
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, 6);

  return `
  <div style="animation:fade-up 0.35s ease">
    <div class="section-header">
      <div class="section-tag">⊞ Dashboard</div>
      <h2 class="section-title">System Overview</h2>
      <p class="section-desc">Real-time status of the HoneyChain traceability network</p>
    </div>

    <div class="grid-4 mb-24">
      ${[
        {
          icon: "📦",
          label: "Total Batches",
          value: batches.length,
          sub: "All registered",
        },
        { icon: "✅", label: "Fully Sold", value: sold, sub: "Tokens retired" },
        {
          icon: "🔄",
          label: "In Pipeline",
          value: active,
          sub: "Being traced",
        },
        {
          icon: "⛓",
          label: "Total Blocks",
          value: totalBlocks,
          sub: "Immutable records",
        },
      ]
        .map(
          (s) => `
        <div class="stat-card">
          <div class="stat-icon">${s.icon}</div>
          <div class="stat-label">${s.label}</div>
          <div class="stat-value">${s.value}</div>
          <div class="stat-sub">${s.sub}</div>
        </div>`,
        )
        .join("")}
    </div>

    <div class="flex-between mb-16">
      <h3 style="font-size:1.1rem;font-weight:700">Active Batches</h3>
      <button class="btn btn-primary btn-sm" onclick="startNewBatch()">+ Register New Harvest</button>
    </div>

    <div class="table-wrap mb-32">
      <table>
        <thead>
          <tr>
            <th>Batch ID</th><th>Product</th><th>Beekeeper</th><th>Location</th>
            <th>Bottles</th><th>Status</th><th>Progress</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${batches
            .map((b) => {
              const pct = progressPct(b.status);
              const sc = CFG.STATUS[b.status] || {};
              return `
            <tr>
              <td><span style="font-family:'JetBrains Mono',monospace;font-size:0.78rem;color:var(--amber)">${b.id}</span></td>
              <td><b>${b.name}</b></td>
              <td>${b.beekeeperName}</td>
              <td style="font-size:0.82rem;color:var(--text-secondary)">${b.location}</td>
              <td>${b.bottles || "—"}</td>
              <td><span class="badge ${sc.badge}">${sc.icon || ""} ${sc.label}</span></td>
              <td>
                <div style="display:flex;align-items:center;gap:8px;min-width:100px">
                  <div class="progress-bar" style="flex:1"><div class="progress-fill" style="width:${pct}%"></div></div>
                  <span style="font-size:0.72rem;color:var(--amber);font-weight:600">${pct}%</span>
                </div>
              </td>
              <td>
                <div style="display:flex;gap:6px;flex-wrap:wrap">
                  <button class="btn btn-ghost btn-sm" style="border-color:rgba(245,166,35,0.3);color:var(--amber)" onclick="simulateScan('${b.id}')">📱 QR Code</button>
                  ${b.status !== "RETIRED" ? `<button class="btn btn-primary btn-sm" onclick="navigate('workflow',{batchId:'${b.id}'})">Continue →</button>` : ""}
                  <button class="btn btn-ghost btn-sm" onclick="navigate('workflow',{batchId:'${b.id}'})">
                    ${b.status === "RETIRED" ? "View Chain" : "Details"}
                  </button>
                </div>
              </td>
            </tr>`;
            })
            .join("")}
        </tbody>
      </table>
    </div>

    <h3 style="font-size:1.1rem;font-weight:700;margin-bottom:16px">⛓ Recent Blockchain Activity</h3>
    <div style="display:flex;flex-direction:column;gap:8px">
      ${recentBlocks
        .map((block) => {
          const rc = CFG.ROLES[block.role] || {};
          return `
        <div class="card" style="padding:12px 16px">
          <div class="flex-between">
            <div class="flex-gap">
              <span style="font-size:1.1rem">${rc.icon || "📦"}</span>
              <div>
                <div style="font-size:0.875rem;font-weight:600">${block.action.replace(/_/g, " ")}</div>
                <div style="font-size:0.75rem;color:var(--text-muted)">${block.batchId} · ${fmtDate(block.timestamp)}</div>
              </div>
            </div>
            <div style="font-family:'JetBrains Mono',monospace;font-size:0.7rem;color:var(--amber)">${shortHash(block.hash)}</div>
          </div>
        </div>`;
        })
        .join("")}
    </div>
  </div>`;
}

async function startNewBatch() {
  const batchId = getNextBatchId();
  STATE.chains[batchId] = [];
  STATE.batches[batchId] = {
    id: batchId,
    name: "New Harvest (pending)",
    status: "PENDING",
    beekeeperName: "—",
    location: "—",
    honeyType: "—",
    quantityKg: 0,
    bottles: null,
    createdAt: new Date().toISOString(),
  };
  toast(`New batch ${batchId} created`, "success");
  navigate("workflow", { batchId });
}

// ================================================================
// 12. PAGE — WORKFLOW STEPPER  (Sequential, Locked)
// ================================================================
function pageWorkflow() {
  const batchId = STATE.activeBatchId;
  if (!batchId || !STATE.batches[batchId]) {
    return `
    <div class="empty-state">
      <div class="empty-icon">📦</div>
      <div class="empty-title">No Batch Selected</div>
      <div class="empty-desc">Select a batch from the sidebar or register a new harvest</div>
      <button class="btn btn-primary mt-16" onclick="startNewBatch()">+ Register New Harvest</button>
    </div>`;
  }

  const batch = STATE.batches[batchId];
  const chain = STATE.chains[batchId] || [];
  const currentStep = getBatchCurrentStep(batchId);
  const isRetired = batch.status === "RETIRED";
  const isAtRetail = batch.status === "AT_RETAIL";
  const sc = CFG.STATUS[batch.status] || {};

  return `
  <div style="animation:fade-up 0.35s ease">
    <!-- Header -->
    <div class="card mb-24" style="padding:20px">
      <div class="flex-between" style="align-items:center">
        <div>
          <div class="section-tag mb-8">⚙️ Supply Chain Workflow</div>
          <h2 class="section-title">${batch.name}</h2>
          <div style="font-family:'JetBrains Mono',monospace;font-size:0.85rem;color:var(--amber);margin-top:4px">${batchId}</div>
          <div style="margin-top:12px;display:flex;gap:12px;align-items:center">
            <span class="badge ${sc.badge}" style="font-size:0.85rem;padding:6px 14px">${sc.icon} ${sc.label}</span>
            <span style="font-size:0.78rem;color:var(--text-muted)">${chain.length} cryptographic blocks in chain</span>
          </div>
        </div>
        <div style="text-align:center;background:rgba(255,255,255,0.03);padding:12px;border-radius:12px;border:1px solid var(--border)">
          <div style="background:#fff;padding:6px;border-radius:8px;display:inline-block">
            <div data-qr="${batchId}" data-qr-size="110" style="width:110px;height:110px;display:flex;align-items:center;justify-content:center">
              <div class="loader"></div>
            </div>
          </div>
          <div style="margin-top:8px">
            <button class="btn btn-ghost btn-sm" style="font-size:0.75rem;padding:4px 10px" onclick="simulateScan('${batchId}')">📱 Simulate Scan</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Stepper -->
    <div class="stepper">
      ${CFG.STEPS.map((step, i) => {
        let cls = "locked";
        if (i < currentStep) cls = "completed";
        else if (i === currentStep && !isRetired) cls = "active";
        return `
        <div class="step-item ${cls}">
          <div class="step-circle">${cls === "completed" ? "✓" : step.icon}</div>
          <div class="step-label">${step.label}</div>
          <div class="step-role">${step.role}</div>
        </div>`;
      }).join("")}
    </div>

    <!-- Step Panel or Retired Banner -->
    ${
      isRetired
        ? retiredBanner(batch, chain)
        : workflowStepPanel(currentStep, batchId, batch, isAtRetail)
    }

    <!-- Chain so far -->
    ${
      chain.length > 0
        ? `
    <div class="divider"></div>
    <h3 style="font-size:1rem;font-weight:700;margin-bottom:16px">⛓ Chain Records — ${batchId}</h3>
    <div class="chain-container">
      ${chain
        .map(
          (block, i) =>
            blockCard(block, i === 0) +
            (i < chain.length - 1 ? '<div class="block-connector"></div>' : ""),
        )
        .join("")}
    </div>`
        : ""
    }
  </div>`;
}

function retiredBanner(batch, chain) {
  const rb = chain.find((b) => b.action === "TOKEN_RETIRED");
  return `
  <div style="text-align:center;padding:48px 32px;background:rgba(34,197,94,0.05);border:1px solid rgba(34,197,94,0.2);border-radius:var(--radius-xl);animation:fade-up 0.4s ease">
    <div style="font-size:4rem;margin-bottom:16px">🔥</div>
    <h2 style="font-size:1.6rem;font-weight:800;color:var(--green);margin-bottom:8px">Token Retired — Chain Sealed</h2>
    <p style="color:var(--text-secondary);max-width:500px;margin:0 auto 28px;line-height:1.7">
      This honey batch has been confirmed sold. Its blockchain token is permanently retired 
      and no further modifications can be made to this chain.
    </p>
    ${
      rb
        ? `
    <div style="display:inline-grid;grid-template-columns:1fr 1fr;gap:16px;text-align:left;background:var(--bg-card);padding:20px 24px;border-radius:var(--radius-lg);border:1px solid rgba(34,197,94,0.25);margin-bottom:24px">
      <div><div style="font-size:0.72rem;color:var(--text-muted);margin-bottom:2px">SOLD AT</div><div style="font-weight:700">${rb.data.storeName || "—"}</div></div>
      <div><div style="font-size:0.72rem;color:var(--text-muted);margin-bottom:2px">LOCATION</div><div style="font-weight:700">${rb.data.storeLocation || "—"}</div></div>
      <div><div style="font-size:0.72rem;color:var(--text-muted);margin-bottom:2px">SALE DATE</div><div style="font-weight:600">${rb.data.saleDate || fmtDate(rb.timestamp)}</div></div>
      <div><div style="font-size:0.72rem;color:var(--text-muted);margin-bottom:2px">RETIRE BLOCK HASH</div>
        <div style="font-family:'JetBrains Mono',monospace;font-size:0.72rem;color:var(--amber)">${shortHash(rb.hash)}</div>
      </div>
    </div>`
        : ""
    }
    <button class="btn btn-primary" onclick="navigate('qr-admin')">▣ View QR Code</button>
    <button class="btn btn-ghost" style="margin-left:8px" onclick="navigate('blockchain')">⛓ Full Chain</button>
  </div>`;
}

function workflowStepPanel(stepIdx, batchId, batch, isAtRetail) {
  if (stepIdx > 4) return "";
  const step = CFG.STEPS[stepIdx];
  const btnLabel =
    stepIdx === 4 && isAtRetail
      ? "🔥 Confirm Sale &amp; Retire Token"
      : "⛓ Submit to Blockchain";

  return `
  <div class="card card-glow" style="animation:fade-up 0.35s ease">
    <div class="flex-between mb-24">
      <div class="flex-gap">
        <span style="font-size:1.6rem">${step.icon}</span>
        <div>
          <h3 style="font-size:1.1rem;font-weight:700">Step ${stepIdx + 1} of 5: ${step.label}</h3>
          <div style="font-size:0.8rem;color:var(--text-muted)">Role: ${CFG.ROLES[step.role]?.label}</div>
        </div>
      </div>
      <div class="badge badge-valid">🔓 Unlocked</div>
    </div>

    <div id="mining-indicator" style="display:none" class="mining-indicator">
      <span>⛏ Computing SHA-256 hash and sealing block to chain</span>
      <span class="mining-dots"><span></span><span></span><span></span></span>
    </div>
    <div id="hash-reveal" style="display:none;margin-bottom:16px"></div>

    <form id="workflow-form" data-step="${stepIdx}" data-batch="${batchId}" data-atretail="${isAtRetail}">
      ${buildStepForm(stepIdx, batch, isAtRetail)}
      <div style="margin-top:24px;display:flex;gap:12px;align-items:center">
        <button type="submit" class="btn btn-primary btn-lg" id="wf-submit-btn">${btnLabel}</button>
        <button type="button" class="btn btn-ghost btn-lg" id="wf-autofill-btn" onclick="autofillForm()" title="Fill this step with realistic demo data">✨ Autofill Demo Data</button>
        ${stepIdx === 4 && isAtRetail ? `<span style="font-size:0.78rem;color:var(--red);opacity:0.8">⚠️ This action is irreversible</span>` : ""}
      </div>
    </form>

    ${
      stepIdx === 4 && !isAtRetail
        ? `
    <div class="alert alert-info mt-16">
      <span>ℹ️</span>
      <div>After confirming receipt, you will be able to confirm the sale and retire the token in the next action.</div>
    </div>`
        : ""
    }
  </div>`;
}

function buildStepForm(stepIdx, batch, isAtRetail) {
  const forms = [
    // 0: Beekeeper
    `<div class="form-row">
      <div class="form-group"><label class="form-label">Beekeeper Name *</label>
        <input class="form-input" name="beekeeperName" required placeholder="e.g. Rajan Kumar"></div>
      <div class="form-group"><label class="form-label">Hive ID *</label>
        <input class="form-input" name="hiveId" required placeholder="e.g. HV-042"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Location (District, State) *</label>
        <input class="form-input" name="location" required placeholder="e.g. Coorg, Karnataka"></div>
      <div class="form-group"><label class="form-label">Honey Type *</label>
        <select class="form-select" name="honeyType" required>
          <option value="">Select type...</option>
          <option>Wildflower</option><option>Litchi</option><option>Mustard</option>
          <option>Mangrove</option><option>Himalayan Wildflower</option><option>Jamun</option>
          <option>Acacia</option><option>Multiflora</option>
        </select></div>
    </div>
    <div class="form-row-3">
      <div class="form-group"><label class="form-label">Harvest Date *</label>
        <input class="form-input" type="date" name="harvestDate" required></div>
      <div class="form-group"><label class="form-label">Quantity Harvested (kg) *</label>
        <input class="form-input" type="number" step="0.1" name="quantityKg" required placeholder="e.g. 12.5"></div>
      <div class="form-group"><label class="form-label">Hive Wt Before/After — IoT</label>
        <input class="form-input" name="hiveWeight" placeholder="e.g. 35.2 kg / 22.7 kg"></div>
    </div>
    <div class="form-row-3">
      <div class="form-group"><label class="form-label">Temperature (°C) — IoT Sensor</label>
        <input class="form-input" type="number" step="0.1" name="temperature" placeholder="e.g. 28.4"></div>
      <div class="form-group"><label class="form-label">Humidity (%) — IoT Sensor</label>
        <input class="form-input" type="number" step="0.1" name="humidity" placeholder="e.g. 65"></div>
      <div class="form-group"><label class="form-label">Acoustic/Vibration Notes</label>
        <input class="form-input" name="sensorNotes" placeholder="Hive acoustics summary"></div>
    </div>
    <div class="form-group"><label class="form-label">Observations</label>
      <textarea class="form-textarea" name="notes" placeholder="Hive health, bee population, environmental conditions..."></textarea></div>`,

    // 1: Lab
    `<div class="form-row">
      <div class="form-group"><label class="form-label">Lab Name *</label>
        <input class="form-input" name="labName" required placeholder="e.g. FSSAI Accredited Lab Chennai"></div>
      <div class="form-group"><label class="form-label">FSSAI License No *</label>
        <input class="form-input" name="fssaiLicense" required placeholder="FSS-LAB-XX-0000"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Test Date *</label>
        <input class="form-input" type="date" name="testDate" required></div>
      <div class="form-group"><label class="form-label">Certificate No *</label>
        <input class="form-input" name="certificateNo" required placeholder="LAB-2024-XXX-0000"></div>
    </div>
    <div class="form-row-3">
      <div class="form-group"><label class="form-label">Moisture Content (%) *</label>
        <input class="form-input" type="number" step="0.1" name="moisture" required placeholder="target &lt; 20%"></div>
      <div class="form-group"><label class="form-label">HMF (mg/kg) *</label>
        <input class="form-input" type="number" step="0.1" name="hmf" required placeholder="target &lt; 80"></div>
      <div class="form-group"><label class="form-label">Diastase Activity (DN)</label>
        <input class="form-input" type="number" step="0.1" name="diastase" placeholder="target &gt; 8 DN"></div>
    </div>
    <div class="form-row-3">
      <div class="form-group"><label class="form-label">Sucrose (%)</label>
        <input class="form-input" type="number" step="0.1" name="sucrose" placeholder="target &lt; 5%"></div>
      <div class="form-group"><label class="form-label">Reducing Sugars (%)</label>
        <input class="form-input" type="number" step="0.1" name="reducingSugars" placeholder="target &gt; 65%"></div>
      <div class="form-group"><label class="form-label">Overall Result *</label>
        <select class="form-select" name="result" required>
          <option value="">Select result...</option>
          <option value="PASS">✅ PASS — Meets FSSAI standards</option>
          <option value="FAIL">❌ FAIL — Does not meet standards</option>
        </select></div>
    </div>`,

    // 2: Processor
    `<div class="form-row">
      <div class="form-group"><label class="form-label">Company Name *</label>
        <input class="form-input" name="companyName" required placeholder="e.g. SunGold Honey Pvt Ltd"></div>
      <div class="form-group"><label class="form-label">FSSAI License No *</label>
        <input class="form-input" name="fssaiLicense" required placeholder="FSS-PRO-XX-0000"></div>
    </div>
    <div class="form-row-3">
      <div class="form-group"><label class="form-label">Processing Date *</label>
        <input class="form-input" type="date" name="processingDate" required></div>
      <div class="form-group"><label class="form-label">Number of Bottles *</label>
        <input class="form-input" type="number" name="bottleCount" required placeholder="e.g. 48"></div>
      <div class="form-group"><label class="form-label">Bottle Size *</label>
        <select class="form-select" name="bottleSize" required>
          <option value="">Select size...</option>
          <option>250ml</option><option>500ml</option><option>1000ml</option>
        </select></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Batch Seal Number *</label>
        <input class="form-input" name="batchSealNo" required placeholder="e.g. SG-2024-B001"></div>
      <div class="form-group"><label class="form-label">Processing Notes</label>
        <input class="form-input" name="notes" placeholder="e.g. Cold extracted, minimal processing"></div>
    </div>`,

    // 3: Distributor
    `<div class="form-row">
      <div class="form-group"><label class="form-label">Company Name *</label>
        <input class="form-input" name="companyName" required placeholder="e.g. AgroTransit Logistics"></div>
      <div class="form-group"><label class="form-label">Vehicle Number *</label>
        <input class="form-input" name="vehicleNo" required placeholder="e.g. KA-01-AB-1234"></div>
    </div>
    <div class="form-row-3">
      <div class="form-group"><label class="form-label">Dispatch Date *</label>
        <input class="form-input" type="date" name="dispatchDate" required></div>
      <div class="form-group"><label class="form-label">Destination *</label>
        <input class="form-input" name="destination" required placeholder="e.g. New Delhi"></div>
      <div class="form-group"><label class="form-label">Expected Delivery</label>
        <input class="form-input" type="date" name="expectedDelivery"></div>
    </div>
    <div class="form-group"><label class="form-label">Route</label>
      <input class="form-input" name="route" placeholder="e.g. Bengaluru → Pune → Delhi"></div>`,

    // 4: Retailer — two sub-phases
    isAtRetail
      ? `
    <div class="alert alert-warning">
      <span>🏪</span>
      <div>Inventory has been received at <b>${batch.retailer || "the store"}</b>. 
        Confirm the actual sale to retire this token permanently and seal the chain.</div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Store Name *</label>
        <input class="form-input" name="storeName" required value="${(batch.retailer || "").split(",")[0] || ""}" placeholder="Store name"></div>
      <div class="form-group"><label class="form-label">Store Location *</label>
        <input class="form-input" name="storeLocation" required value="${(batch.retailer || "").split(",").slice(1).join(",").trim() || ""}" placeholder="Area, City, State"></div>
    </div>
    <div class="form-group mb-16">
      <label class="form-label">Scan/Type Bottle Serials to Retire (Multiple non-sequential bottles allowed) *</label>
      <input class="form-input" name="bottleSerialsInput" id="bottle-serials-input" required placeholder="e.g. B007, B014, B025" value="B007, B014">
      <div style="margin-top:6px;font-size:0.72rem;color:var(--text-muted)">
        💡 Click bottle chips below or type/scan any bottle numbers to retire multiple non-sequential bottles in one POS checkout transaction:
      </div>
      <div style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap;max-height:110px;overflow-y:auto;padding:8px;background:rgba(255,255,255,0.02);border-radius:8px;border:1px solid var(--border)">
        ${Array.from({ length: Math.min(batch.bottles || 32, 48) }, (_, i) => {
          const numStr = `B${String(i + 1).padStart(3, "0")}`;
          const isRet = (batch.retiredBottles || []).includes(numStr);
          return `<button type="button" class="btn btn-ghost btn-sm ${isRet ? "disabled" : ""}" style="font-size:0.7rem;padding:3px 8px;border-color:${isRet ? "rgba(239,68,68,0.4)" : "rgba(255,255,255,0.1)"};color:${isRet ? "#FCA5A5" : "var(--text-primary)"}" onclick="toggleBottleChip('${numStr}')">
            ${isRet ? "🔥 SOLD " : ""}${numStr}
          </button>`;
        }).join("")}
      </div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Invoice / Sale Ref No *</label>
        <input class="form-input" name="invoiceRef" required placeholder="e.g. NB-SALE-2024-0001"></div>
      <div class="form-group"><label class="form-label">Sale Date *</label>
        <input class="form-input" type="date" name="saleDate" required></div>
    </div>
    <div class="alert alert-error" style="margin-top:16px">
      <span>🔥</span>
      <div><b>Multi-Bottle On-Chain Retirement:</b> Confirming sale will permanently retire QR tokens for all specified bottles in a single blockchain block. Remaining bottles stay active on store shelves.</div>
    </div>`
      : `
    <div class="form-row">
      <div class="form-group"><label class="form-label">Store Name *</label>
        <input class="form-input" name="storeName" required placeholder="e.g. Nature's Basket"></div>
      <div class="form-group"><label class="form-label">FSSAI License No *</label>
        <input class="form-input" name="fssaiLicense" required placeholder="FSS-RET-XX-0000"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Store Location *</label>
        <input class="form-input" name="storeLocation" required placeholder="Area, City, State"></div>
      <div class="form-group"><label class="form-label">Receipt Date *</label>
        <input class="form-input" type="date" name="receiptDate" required></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Invoice No *</label>
        <input class="form-input" name="invoiceNo" required placeholder="e.g. NB-INV-2024-0001"></div>
      <div class="form-group"><label class="form-label">Bottles Received</label>
        <input class="form-input" type="number" name="bottlesReceived" placeholder="${batch.bottles || ""}"></div>
    </div>`,
  ];
  return forms[stepIdx] || "";
}

async function handleWorkflowSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const stepIdx = parseInt(form.dataset.step);
  const batchId = form.dataset.batch;
  const isAtRetail = form.dataset.atretail === "true";
  const batch = STATE.batches[batchId];

  const formData = {};
  // Strip < and > : the server rejects them (blocks script injection), so remove them up front
  // instead of letting a batch silently fail to sync.
  new FormData(form).forEach((v, k) => {
    const clean = String(v).replace(/[<>]/g, "");
    if (clean) formData[k] = clean;
  });

  // Show mining animation
  const mineEl = document.getElementById("mining-indicator");
  const submitBtn = document.getElementById("wf-submit-btn");
  if (mineEl) mineEl.style.display = "flex";
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = "⛏ Hashing…";
  }

  // Determine action
  const ACTIONS = [
    "HARVEST_REGISTERED",
    "LAB_TEST_COMPLETED",
    "BATCH_PROCESSED",
    "BATCH_DISPATCHED",
    "INVENTORY_RECEIVED",
  ];
  const action =
    stepIdx === 4 && isAtRetail ? "TOKEN_RETIRED" : ACTIONS[stepIdx];

  if (stepIdx === 4 && isAtRetail) {
    const rawInput =
      formData.bottleSerialsInput || formData.bottleSerial || "B001";
    const parsedBottles = rawInput
      .split(",")
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean);
    formData.retiredBottleList = parsedBottles;
    formData.event = "BOTTLES_SOLD_AND_RETIRED";
    formData.note = `${parsedBottles.length} bottle QR token(s) (${parsedBottles.join(", ")}) sold & retired on-chain.`;
  }

  const chain = STATE.chains[batchId] || [];
  const prevHash =
    chain.length > 0 ? chain[chain.length - 1].hash : CFG.GENESIS_HASH;

  // Simulate realistic hashing delay for visual effect
  await new Promise((r) => setTimeout(r, 900));

  const block = await createBlock({
    index: chain.length,
    role: CFG.STEPS[stepIdx].role,
    action,
    batchId,
    data: formData,
    previousHash: prevHash,
  });

  STATE.chains[batchId] = [...chain, block];

  // Reveal hash
  const hashReveal = document.getElementById("hash-reveal");
  if (hashReveal) {
    hashReveal.style.display = "block";
    hashReveal.innerHTML = `
      <div style="padding:10px 14px;background:var(--amber-glow-sm);border:1px solid var(--border-amber);border-radius:var(--radius);font-size:0.78rem">
        ✅ Block #${block.index} sealed &nbsp;·&nbsp;
        <span style="font-family:'JetBrains Mono',monospace;color:var(--amber)">${block.hash}</span>
      </div>`;
  }

  // Update batch state
  if (stepIdx === 4 && isAtRetail) {
    const newlyRetired = formData.retiredBottleList || ["B001"];
    const prevRetired = batch.retiredBottles || [];
    const allRetired = Array.from(new Set([...prevRetired, ...newlyRetired]));
    const totalBottles = batch.bottles || 32;
    const isAllSold = allRetired.length >= totalBottles;

    STATE.batches[batchId] = {
      ...batch,
      status: isAllSold ? "RETIRED" : "AT_RETAIL",
      retiredAt: isAllSold ? block.timestamp : batch.retiredAt || null,
      retiredBottles: allRetired,
      retailer:
        `${formData.storeName || ""}, ${formData.storeLocation || ""}`.replace(
          /^,\s*/,
          "",
        ),
    };
    toast(
      `🔥 Retired ${newlyRetired.length} bottle QR token(s): ${newlyRetired.join(", ")}`,
      "success",
      5000,
    );
  } else if (stepIdx === 4) {
    STATE.batches[batchId] = {
      ...batch,
      status: "AT_RETAIL",
      retailer:
        `${formData.storeName || ""}, ${formData.storeLocation || ""}`.replace(
          /^,\s*/,
          "",
        ),
    };
    toast("🏪 Inventory received at retail. Ready to confirm sale.", "success");
  } else {
    const nextStatus = CFG.STEPS[stepIdx].nextStatus;
    const updates = { status: nextStatus };
    if (stepIdx === 0) {
      updates.name = `${formData.honeyType || "Unknown"} Honey`;
      updates.beekeeperName = formData.beekeeperName || "—";
      updates.location = formData.location || "—";
      updates.honeyType = formData.honeyType || "—";
      updates.quantityKg = parseFloat(formData.quantityKg) || 0;
    }
    if (stepIdx === 2) updates.bottles = parseInt(formData.bottleCount) || null;
    STATE.batches[batchId] = { ...batch, ...updates };
    toast(`✅ Block #${block.index} added to blockchain`, "success");
  }

  saveState();
  await new Promise((r) => setTimeout(r, 500));
  renderApp();
}

// ================================================================
// 13. PAGE — BLOCKCHAIN VIEWER
// ================================================================
function pageBlockchain() {
  const filter = STATE.blockchainFilter || "ALL";
  const batchIds = Object.keys(STATE.chains);
  const allBlocks = Object.entries(STATE.chains)
    .flatMap(([, chain]) => chain)
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  const displayed = filter === "ALL" ? allBlocks : STATE.chains[filter] || [];

  return `
  <div style="animation:fade-up 0.35s ease">
    <div class="section-header">
      <div class="section-tag">⛓ Blockchain</div>
      <h2 class="section-title">Immutable Ledger</h2>
      <p class="section-desc">All records are SHA-256 hashed and cryptographically chained. Chain integrity is verified on every page load using the Web Crypto API.</p>
    </div>

    <div id="chain-validity-banner" style="margin-bottom:20px">
      <div class="chain-valid-banner" style="opacity:0.5">🔄 Verifying chain integrity…</div>
    </div>

    <!-- Filter tabs -->
    <div style="display:flex;gap:8px;margin-bottom:20px;flex-wrap:wrap">
      <button class="btn ${filter === "ALL" ? "btn-primary" : "btn-ghost"} btn-sm" onclick="filterChain('ALL')">All Batches</button>
      ${batchIds
        .map(
          (id) => `
        <button class="btn ${filter === id ? "btn-primary" : "btn-ghost"} btn-sm" onclick="filterChain('${id}')">
          ${id.split("-").pop()}
        </button>`,
        )
        .join("")}
    </div>

    <div style="margin-bottom:16px;font-size:0.875rem;color:var(--text-secondary)">
      Showing <b>${displayed.length}</b> blocks
      ${filter !== "ALL" ? `for <b style="color:var(--amber)">${filter}</b>` : "across all batches"}
    </div>

    <div class="chain-container">
      ${
        displayed.length === 0
          ? `<div class="empty-state"><div class="empty-icon">⛓</div><div class="empty-title">No blocks yet</div></div>`
          : displayed
              .map(
                (block, i) =>
                  blockCard(block, block.index === 0) +
                  (filter !== "ALL" && i < displayed.length - 1
                    ? '<div class="block-connector"></div>'
                    : ""),
              )
              .join("")
      }
    </div>
  </div>`;
}

function blockCard(block, isGenesis = false) {
  const rc = CFG.ROLES[block.role] || {};
  const isRetire = block.action === "TOKEN_RETIRED";
  return `
  <div class="block-card ${isGenesis ? "genesis" : ""} ${isRetire ? "retired" : ""}">
    <div class="block-header">
      <span style="font-family:'JetBrains Mono',monospace;font-size:0.78rem;color:var(--text-muted)">#${block.index}</span>
      <span style="padding:2px 8px;border-radius:4px;font-size:0.72rem;font-weight:700;background:${roleBg(block.role)};color:${roleColor(block.role)}">
        ${rc.icon} ${rc.label || block.role}
      </span>
      <span class="badge ${isRetire ? "badge-retired" : "badge-valid"}" style="font-size:0.7rem">
        ${isRetire ? "🔥 RETIRED" : "✅ VALID"}
      </span>
      <span style="margin-left:auto;font-size:0.72rem;color:var(--text-muted)">${fmtDate(block.timestamp)}</span>
    </div>
    <div style="font-size:0.875rem;font-weight:600;margin-bottom:8px">
      ${block.action.replace(/_/g, " ")}
      <span style="font-family:'JetBrains Mono',monospace;font-size:0.72rem;color:var(--text-muted);font-weight:400"> — ${block.batchId}</span>
    </div>
    <div style="display:flex;gap:6px;margin-bottom:4px;align-items:flex-start">
      <span style="font-size:0.67rem;color:var(--text-muted);flex-shrink:0;padding-top:1px">HASH</span>
      <div class="block-hash">${block.hash}</div>
    </div>
    <div style="display:flex;gap:6px;margin-bottom:8px;align-items:flex-start">
      <span style="font-size:0.67rem;color:var(--text-muted);flex-shrink:0;padding-top:1px">PREV</span>
      <div class="block-prev-hash">${block.previousHash}</div>
    </div>
    <div style="padding:8px 12px;background:rgba(255,255,255,0.02);border-radius:6px;border:1px solid var(--border);font-size:0.78rem;line-height:1.9;color:var(--text-secondary)">
      ${fmtDataObj(block.data)}
    </div>
  </div>`;
}

function filterChain(batchId) {
  STATE.blockchainFilter = batchId;
  renderApp();
}

async function runBlockchainValidation() {
  const el = document.getElementById("chain-validity-banner");
  if (!el) return;
  let allValid = true;
  let totalBlocks = 0;
  const issues = [];
  for (const [batchId, chain] of Object.entries(STATE.chains)) {
    const res = await validateChain(chain);
    totalBlocks += chain.length;
    if (!res.valid) {
      allValid = false;
      issues.push(...res.issues);
    }
  }
  el.innerHTML = allValid
    ? `<div class="chain-valid-banner">✅ All ${totalBlocks} blocks across ${Object.keys(STATE.chains).length} chains verified valid. SHA-256 integrity confirmed.</div>`
    : `<div class="chain-invalid-banner">❌ Chain integrity issue: ${issues[0] || "Unknown error"}</div>`;
}

// ================================================================
// 14. PAGE — QR ADMIN
// ================================================================
function pageQRAdmin() {
  const batches = Object.values(STATE.batches);
  const base = verifyBaseUrl();
  return `
  <div style="animation:fade-up 0.35s ease">
    <div class="section-header">
      <div class="section-tag">▣ QR Codes</div>
      <h2 class="section-title">Batch Verification QR Codes</h2>
      <p class="section-desc">
        Each QR encodes a real verification URL. Scanning shows <b style="color:var(--amber)">⚠️ NOT YET SOLD</b> 
        or <b style="color:var(--green)">✅ AUTHENTICALLY SOLD</b> based on live blockchain state.
        <br><span style="font-size:0.8rem;color:var(--text-muted)">Base URL: <code style="color:var(--amber)">${base}</code></span>
      </p>
    </div>

    <div class="card mb-24" style="padding:16px;background:rgba(245,166,35,0.05);border:1px solid rgba(245,166,35,0.25)">
      <div class="flex-between" style="align-items:center;flex-wrap:wrap;gap:12px">
        <div>
          <div style="font-weight:700;color:var(--amber);font-size:0.9rem">📱 Mobile QR Target Host Address</div>
          <div style="font-size:0.78rem;color:var(--text-secondary);margin-top:2px">
            Currently encoding in QR: <code style="color:var(--amber);font-weight:600">${base}</code>
          </div>
        </div>
        <div style="display:flex;gap:8px;align-items:center">
          <input class="form-input" id="custom-host-input" style="width:220px;font-size:0.8rem;padding:6px 10px" placeholder="e.g. 10.231.193.56:8000" value="${STATE.customHost || ""}">
          <button class="btn btn-primary btn-sm" onclick="setCustomHost()">Set Host</button>
          ${STATE.customHost ? `<button class="btn btn-ghost btn-sm" onclick="setCustomHost('')">Reset</button>` : ""}
        </div>
      </div>
    </div>

    <div class="alert alert-info mb-24">
      <span>ℹ️</span>
      <div>
        <b>To scan on a real phone:</b> Enter your computer's Wi-Fi IP (e.g. <code>10.231.193.56:8000</code>) in the Target Host box above and click "Set Host". All generated QR codes will update to encode your Wi-Fi IP directly.<br>
        <div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap">
          ${batches.map((b) => `<button class="btn btn-ghost btn-sm" onclick="simulateScan('${b.id}')">▶ Simulate Scan ${b.id.split("-").pop()}</button>`).join("")}
        </div>
      </div>
    </div>

    <div class="grid-3">
      ${batches.map((b) => qrCard(b)).join("")}
    </div>
  </div>`;
}

function setCustomHost(val) {
  const input = document.getElementById("custom-host-input");
  const v = val !== undefined ? val : input ? input.value.trim() : "";
  STATE.customHost = v;
  if (v) localStorage.setItem("hc_custom_host", v);
  else localStorage.removeItem("hc_custom_host");
  toast(
    v ? `QR target address updated to ${v}` : "Reset to default host",
    "info",
  );
  renderApp();
}
window.setCustomHost = setCustomHost;

function qrCard(batch) {
  const sc = CFG.STATUS[batch.status] || {};
  const isRetired = batch.status === "RETIRED";
  const isAtRetail = batch.status === "AT_RETAIL";
  const verifyUrl = verifyBaseUrl() + "?verify=" + batch.id;

  const statusColor = isRetired ? "var(--green)" : "var(--amber)";
  const statusBg = isRetired ? "rgba(34,197,94,0.08)" : "rgba(245,166,35,0.08)";
  const statusBorder = isRetired
    ? "rgba(34,197,94,0.3)"
    : "rgba(245,166,35,0.25)";

  return `
  <div class="card" style="text-align:center">
    <div class="flex-between mb-12">
      <div style="font-family:'JetBrains Mono',monospace;font-size:0.78rem;color:var(--amber)">${batch.id}</div>
      <span class="badge ${sc.badge}">${sc.icon} ${sc.label}</span>
    </div>
    <div style="font-weight:700;margin-bottom:4px">${batch.name}</div>
    <div style="font-size:0.8rem;color:var(--text-secondary);margin-bottom:16px">🐝 ${batch.beekeeperName}</div>

    <!-- QR Code Container -->
    <div style="display:flex;justify-content:center;margin-bottom:16px">
      <div style="background:#fff;padding:10px;border-radius:10px;border:2px solid ${statusBorder}">
        <div data-qr="${batch.id}" style="width:180px;height:180px;display:flex;align-items:center;justify-content:center">
          <div class="loader"></div>
        </div>
      </div>
    </div>

    <!-- Status Badge -->
    <div style="padding:12px 16px;border-radius:10px;margin-bottom:12px;background:${statusBg};border:1px solid ${statusBorder}">
      <div style="font-size:1.4rem;margin-bottom:6px">${isRetired ? "✅" : isAtRetail ? "⚠️" : "⏳"}</div>
      <div style="font-weight:700;font-size:0.875rem;color:${statusColor}">
        ${isRetired ? "SOLD — Scan shows VERIFIED SALE" : isAtRetail ? "AT RETAIL — Scan shows NOT YET SOLD" : "IN PIPELINE — Scan shows current status"}
      </div>
      ${isRetired && batch.retailer ? `<div style="font-size:0.75rem;color:var(--text-secondary);margin-top:4px">${batch.retailer}</div>` : ""}
      ${!isRetired ? `<div style="font-size:0.72rem;color:var(--text-muted);margin-top:4px">⚠️ Will warn consumer: batch not yet confirmed sold</div>` : ""}
    </div>

    <div style="font-size:0.68rem;color:var(--text-muted);word-break:break-all;margin-bottom:12px;font-family:'JetBrains Mono',monospace">${verifyUrl}</div>

    <div style="display:flex;gap:6px;margin-bottom:8px;flex-wrap:wrap">
      <button class="btn btn-ghost btn-sm" style="flex:1;font-size:0.75rem" onclick="simulateScan('${batch.id}', 'B001')">📱 Scan Bottle #1 (B001)</button>
      <button class="btn btn-ghost btn-sm" style="flex:1;font-size:0.75rem" onclick="simulateScan('${batch.id}', 'B002')">📱 Scan Bottle #2 (B002)</button>
    </div>
    ${!isRetired ? `<button class="btn btn-primary btn-sm" style="width:100%" onclick="navigate('workflow',{batchId:'${batch.id}'})">Retail Checkout Workflow →</button>` : ""}
  </div>`;
}

function initAllQRCodes() {
  document.querySelectorAll("[data-qr]").forEach((el) => {
    const batchId = el.dataset.qr;
    if (!batchId) return;
    const url = verifyBaseUrl() + "?verify=" + batchId;
    const sz = parseInt(el.dataset.qrSize) || 180;
    el.innerHTML = "";
    try {
      if (typeof QRCode !== "undefined") {
        new QRCode(el, {
          text: url,
          width: sz,
          height: sz,
          colorDark: "#000000",
          colorLight: "#FFFFFF",
          correctLevel: QRCode.CorrectLevel.H,
        });
      } else {
        throw new Error("QRCode library pending");
      }
    } catch (err) {
      el.innerHTML = `<div style="padding:6px;font-size:0.68rem;color:#D97706;background:#FEF3C7;border-radius:6px;word-break:break-all;text-align:center">🔗 ${url}</div>`;
    }
  });
}

function simulateScan(batchId, bottleId = "B001") {
  const url = verifyBaseUrl() + "?verify=" + batchId + "&bottle=" + bottleId;
  window.open(url, "_blank", "width=420,height=760,menubar=no,toolbar=no");
}

// ================================================================
// 15. PAGE — VERIFY RESULT  (Public, Mobile-Optimized — QR scan landing)
// ================================================================
function pageVerify(batchId, bottleId = "B001") {
  const batch = STATE.batches[batchId];
  const chain = STATE.chains[batchId] || [];

  if (!batch) {
    return `
    <style>body{background:#080C14;font-family:Inter,sans-serif;margin:0}</style>
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px">
      <div style="text-align:center;max-width:400px">
        ${SVG_LOGO.replace('width="32" height="32"', 'width="56" height="56"')}
        <h2 style="color:#F0F4FF;margin:16px 0 8px;font-family:Outfit,sans-serif;font-size:1.3rem">Batch Not Found</h2>
        <p style="color:#8B99B5;font-size:0.875rem">
          The batch <b style="color:#F5A623">${batchId}</b> was not found in the blockchain.
          This may be a counterfeit or invalid QR code.
        </p>
        <div style="margin-top:16px;padding:12px;background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.3);border-radius:10px;color:#FCA5A5;font-size:0.875rem">
          ❌ INVALID — This QR code cannot be verified
        </div>
        <a href="${window.location.pathname}" style="display:inline-block;margin-top:20px;padding:10px 20px;background:#F5A623;color:#000;border-radius:8px;font-weight:600;text-decoration:none;font-family:Outfit,sans-serif">← Go Home</a>
      </div>
    </div>`;
  }

  // Check if a retirement block exists for this specific bottle or the entire batch
  const retireBlock = chain.find((b) => {
    if (b.action !== "TOKEN_RETIRED") return false;
    const d = b.data || {};
    if (Array.isArray(d.retiredBottleList) && d.retiredBottleList.length) {
      return d.retiredBottleList
        .map((x) => String(x).toUpperCase())
        .includes(String(bottleId).toUpperCase());
    }
    // older records without a bottle list: single serial or whole batch
    return (
      !d.bottleSerial || d.bottleSerial === "ALL" || d.bottleSerial === bottleId
    );
  });

  const isBottleRetired = !!retireBlock;
  const isAtRetail = batch.status === "AT_RETAIL";
  const sc = CFG.STATUS[batch.status] || {};
  const labBlock = chain.find((b) => b.action === "LAB_TEST_COMPLETED");

  const headerBg = isBottleRetired
    ? "rgba(34,197,94,0.08)"
    : "rgba(245,166,35,0.06)";
  const headerBorder = isBottleRetired
    ? "rgba(34,197,94,0.3)"
    : "rgba(245,166,35,0.3)";
  const statusColor = isBottleRetired ? "#22C55E" : "#F5A623";

  return `
  <div class="bg-glow"></div>
  <style>
    .v-shell{max-width:520px;margin:0 auto;padding:20px 16px 48px;font-family:Inter,sans-serif}
    .v-card{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:16px;margin-bottom:12px}
    .v-row{display:flex;justify-content:space-between;align-items:flex-start;padding:7px 0;border-bottom:1px solid rgba(255,255,255,0.05)}
    .v-row:last-child{border-bottom:none}
    .v-label{font-size:0.75rem;color:#8B99B5;flex-shrink:0;padding-right:12px}
    .v-val{font-size:0.875rem;color:#F0F4FF;font-weight:500;text-align:right;max-width:65%}
    .tl{display:flex;gap:12px;padding-bottom:18px;position:relative}
    .tl:not(:last-child)::before{content:'';position:absolute;left:15px;top:34px;width:2px;height:calc(100% - 14px);background:rgba(255,255,255,0.08)}
    .tl-dot{width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:0.85rem;flex-shrink:0;border:2px solid #F5A623;background:rgba(245,166,35,0.1)}
    .tl-dot.ret{border-color:#22C55E;background:rgba(34,197,94,0.1)}
    .h-sm{font-family:'JetBrains Mono',monospace;font-size:0.65rem;color:#F5A623;opacity:0.75;word-break:break-all;margin-top:2px}
  </style>

  <div class="v-shell">
    <!-- Nav -->
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;padding-bottom:16px;border-bottom:1px solid rgba(255,255,255,0.08)">
      <div style="display:flex;align-items:center;gap:8px">
        ${SVG_LOGO}
        <span style="font-family:Outfit,sans-serif;font-weight:700;font-size:0.95rem;color:#F0F4FF">Bharat Bee</span>
      </div>
      <span style="font-size:0.72rem;color:#8B99B5;background:rgba(255,255,255,0.05);padding:4px 10px;border-radius:20px;border:1px solid rgba(255,255,255,0.08)">Bottle Token Verification</span>
    </div>

    <!-- Status Header -->
    <div style="text-align:center;padding:28px 20px;border-radius:16px;margin-bottom:16px;background:${headerBg};border:1px solid ${headerBorder}">
      <div style="font-size:3.5rem;margin-bottom:10px">${isBottleRetired ? "✅" : isAtRetail ? "⚠️" : sc.icon}</div>
      <div style="font-size:1.4rem;font-weight:800;color:${statusColor};font-family:Outfit,sans-serif;margin-bottom:6px">
        ${isBottleRetired ? `BOTTLE #${bottleId} — AUTHENTICALLY SOLD` : `BOTTLE #${bottleId} — NOT YET SOLD`}
      </div>
      <div style="font-size:0.85rem;color:#8B99B5;line-height:1.6;margin-bottom:10px">
        ${
          isBottleRetired
            ? `Individual bottle token <b>${batchId}-${bottleId}</b> was retired on-chain upon retailer checkout. The record is permanently sealed.`
            : `Individual bottle token <b>${batchId}-${bottleId}</b> is currently <b>active at retail</b> and has <b>not yet been retired</b> by a retailer.`
        }
      </div>
      <div style="font-family:'JetBrains Mono',monospace;font-size:0.75rem;color:#F5A623;background:rgba(245,166,35,0.1);display:inline-block;padding:4px 12px;border-radius:20px;border:1px solid rgba(245,166,35,0.25)">Token ID: ${batchId}-${bottleId}</div>
    </div>

    ${
      !isBottleRetired
        ? `
    <div style="padding:14px 16px;background:rgba(245,166,35,0.08);border:1px solid rgba(245,166,35,0.3);border-radius:12px;margin-bottom:14px">
      <div style="font-weight:700;color:#F5A623;margin-bottom:6px;font-size:0.9rem">⚠️ Consumer Notice</div>
      <div style="font-size:0.82rem;color:#D4AC50;line-height:1.6">
        If you are about to purchase this product, ask the retailer to confirm the sale on HoneyChain. 
        An unconfirmed batch may indicate an unauthorized or counterfeit product.
      </div>
    </div>`
        : ""
    }

    ${
      isBottleRetired && retireBlock
        ? `
    <div class="v-card" style="border-color:rgba(34,197,94,0.3);background:rgba(34,197,94,0.05)">
      <div style="font-weight:700;color:#22C55E;margin-bottom:12px;font-family:Outfit,sans-serif;font-size:0.95rem">🔥 Confirmed Sale Details</div>
      <div class="v-row"><span class="v-label">Sold At</span><span class="v-val">${retireBlock.data.storeName || "—"}</span></div>
      <div class="v-row"><span class="v-label">Location</span><span class="v-val">${retireBlock.data.storeLocation || "—"}</span></div>
      <div class="v-row"><span class="v-label">Sale Date</span><span class="v-val">${retireBlock.data.saleDate || fmtDate(retireBlock.timestamp)}</span></div>
      <div class="v-row"><span class="v-label">Invoice Ref</span><span class="v-val">${retireBlock.data.invoiceRef || "—"}</span></div>
      <div class="v-row"><span class="v-label">Bottles Sold</span><span class="v-val">${retireBlock.data.bottlesSold || (retireBlock.data.retiredBottleList ? retireBlock.data.retiredBottleList.length + " (" + retireBlock.data.retiredBottleList.join(", ") + ")" : "") || batch.bottles || "—"}</span></div>
      <div class="v-row"><span class="v-label">Retire Block Hash</span><span class="v-val h-sm">${retireBlock.hash}</span></div>
    </div>`
        : ""
    }

    <!-- Product Info -->
    <div class="v-card">
      <div style="font-weight:700;color:#F0F4FF;margin-bottom:12px;font-family:Outfit,sans-serif;font-size:0.95rem">🍯 Product Information</div>
      <div class="v-row"><span class="v-label">Product</span><span class="v-val">${batch.name}</span></div>
      <div class="v-row"><span class="v-label">Honey Type</span><span class="v-val">${batch.honeyType}</span></div>
      <div class="v-row"><span class="v-label">Origin</span><span class="v-val">${batch.location}</span></div>
      <div class="v-row"><span class="v-label">Beekeeper</span><span class="v-val">${batch.beekeeperName}</span></div>
      <div class="v-row"><span class="v-label">Harvest Date</span><span class="v-val">${fmtDate(batch.createdAt)}</span></div>
      ${batch.bottles ? `<div class="v-row"><span class="v-label">Bottles</span><span class="v-val">${batch.bottles} bottles</span></div>` : ""}
    </div>

    ${
      labBlock
        ? `
    <div class="v-card">
      <div style="font-weight:700;color:#F0F4FF;margin-bottom:12px;font-family:Outfit,sans-serif;font-size:0.95rem">🧪 Lab Test Results</div>
      <div class="v-row"><span class="v-label">Laboratory</span><span class="v-val">${labBlock.data.labName}</span></div>
      <div class="v-row"><span class="v-label">Certificate</span><span class="v-val">${labBlock.data.certificateNo}</span></div>
      <div class="v-row"><span class="v-label">Moisture</span><span class="v-val">${labBlock.data.moisture}</span></div>
      <div class="v-row"><span class="v-label">HMF</span><span class="v-val">${labBlock.data.hmf}</span></div>
      ${labBlock.data.diastase ? `<div class="v-row"><span class="v-label">Diastase</span><span class="v-val">${labBlock.data.diastase}</span></div>` : ""}
      <div class="v-row"><span class="v-label">Result</span>
        <span class="v-val" style="color:${labBlock.data.result === "PASS" ? "#22C55E" : "#EF4444"};font-weight:700">
          ${labBlock.data.result === "PASS" ? "✅ PASS" : "❌ FAIL"}
        </span>
      </div>
    </div>`
        : ""
    }

    <!-- Provenance Timeline -->
    <div style="font-weight:700;color:#F0F4FF;margin:20px 0 14px;font-family:Outfit,sans-serif;font-size:0.95rem">⛓ Full Provenance Chain</div>
    <div>
      ${chain
        .map((block) => {
          const rc = CFG.ROLES[block.role] || {};
          const isRet = block.action === "TOKEN_RETIRED";
          return `
        <div class="tl">
          <div class="tl-dot ${isRet ? "ret" : ""}">${rc.icon || "📦"}</div>
          <div style="flex:1;padding-top:4px">
            <div style="font-size:0.875rem;font-weight:600;color:#F0F4FF">${block.action.replace(/_/g, " ")}</div>
            <div style="font-size:0.78rem;color:#8B99B5">${rc.label || block.role} · ${fmtDate(block.timestamp)}</div>
            <div class="h-sm">Block #${block.index} · ${block.hash}</div>
          </div>
        </div>`;
        })
        .join("")}
    </div>

    <!-- Chain Integrity Check -->
    <div id="chain-verify-result" style="margin-top:20px;padding:12px 16px;border-radius:10px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);font-size:0.8rem;color:#8B99B5">
      🔄 Verifying SHA-256 chain integrity…
    </div>

    <!-- Footer -->
    <div style="text-align:center;margin-top:24px;padding-top:20px;border-top:1px solid rgba(255,255,255,0.08)">
      <div style="font-size:0.75rem;color:#8B99B5;font-weight:600">Bharat Bee — HoneyChain Quality Verification</div>
      <div style="font-size:0.68rem;color:#4A5568;margin-top:4px">Smart India Hackathon 2026 · SIH26021 · Real SHA-256 On-Chain Audit</div>
    </div>
  </div>`;
}

async function runVerifyChain(batchId) {
  const chain = STATE.chains[batchId];
  const el = document.getElementById("chain-verify-result");
  if (!chain || !el) return;
  const result = await validateChain(chain);
  const count = chain.length;
  if (result.valid) {
    el.innerHTML = `✅ Chain Integrity Verified — All ${count} block${count !== 1 ? "s" : ""} have valid SHA-256 hashes and are properly linked`;
    el.style.cssText +=
      "background:rgba(34,197,94,0.08);border-color:rgba(34,197,94,0.3);color:#86EFAC";
  } else {
    el.innerHTML = `❌ Chain Integrity Issue — ${result.issues[0]}`;
    el.style.cssText +=
      "background:rgba(239,68,68,0.08);border-color:rgba(239,68,68,0.3);color:#FCA5A5";
  }
}

// ================================================================
// 16. INITIALIZATION
// ================================================================
async function init() {
  try {
    // 1. Compute real SHA-256 seed chains
    await initSeedData();

    // 2a. Shared data from the server (so phones see the same batches)
    await loadRemoteState();

    // 2b. Overlay any user-created/updated chains from localStorage
    loadPersistedState();

    // 3. Render the app
    renderApp();
  } catch (err) {
    console.error("HoneyChain init error:", err);
    document.getElementById("app").innerHTML = `
      <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;text-align:center">
        <div>
          <div style="font-size:2rem;margin-bottom:12px">⚠️</div>
          <div style="color:#F0F4FF;font-family:Outfit,sans-serif;font-size:1.1rem;margin-bottom:8px">Initialization Error</div>
          <div style="color:#8B99B5;font-size:0.875rem">${err.message}</div>
          <button onclick="localStorage.removeItem('hc_state');location.reload()" style="margin-top:16px;padding:10px 20px;background:#F5A623;color:#000;border:none;border-radius:8px;cursor:pointer;font-weight:600">Reset & Retry</button>
        </div>
      </div>`;
  }
}

// ================================================================
// AUTOFILL (demo helper) — fills the current workflow step
// ================================================================
function autofillForm() {
  const form = document.getElementById("workflow-form");
  if (!form) return;
  const today = new Date().toISOString().slice(0, 10);
  const inDays = (n) =>
    new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);
  const rnd = (a, b, d = 1) => (Math.random() * (b - a) + a).toFixed(d);
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const yr = new Date().getFullYear();
  const n4 = () => String(Math.floor(Math.random() * 9000) + 1000);
  const qty = rnd(8, 25);

  const DATA = {
    // Step 1 — Beekeeper
    beekeeperName: pick([
      "Rajan Kumar",
      "Sunita Devi",
      "Mohan Lal",
      "Anita Munda",
    ]),
    hiveId: "HV-0" + Math.floor(Math.random() * 90 + 10),
    location: pick([
      "Coorg, Karnataka",
      "Ranchi, Jharkhand",
      "Darjeeling, West Bengal",
      "Muzaffarpur, Bihar",
    ]),
    honeyType: pick(["Wildflower", "Litchi", "Mustard", "Jamun", "Acacia"]),
    harvestDate: today,
    quantityKg: qty,
    hiveWeight: `${rnd(32, 40)} kg / ${rnd(20, 28)} kg`,
    temperature: rnd(26, 32),
    humidity: rnd(55, 72, 0),
    sensorNotes: "Stable acoustics, no swarming signals",
    // Step 2 — Lab
    labName: "FSSAI Accredited Lab Chennai",
    fssaiLicense: pick([
      "FSS-LAB-TN-0042",
      "FSS-PRO-KA-1189",
      "FSS-RET-DL-5521",
    ]),
    testDate: today,
    certificateNo: `LAB-${yr}-CHN-${n4()}`,
    moisture: rnd(16.5, 18.5),
    hmf: rnd(5, 20),
    diastase: rnd(10, 16),
    sucrose: rnd(1, 4),
    reducingSugars: rnd(68, 76),
    result: "PASS",
    // Step 3 — Processor
    companyName: pick(["SunGold Honey Pvt Ltd", "AgroTransit Logistics"]),
    processingDate: today,
    bottleCount: "48",
    bottleSize: "500ml",
    batchSealNo: `SG-${yr}-B${n4().slice(1)}`,
    notes: "Cold extracted, minimal processing applied",
    // Step 4 — Distributor
    vehicleNo: `KA-01-AB-${n4()}`,
    dispatchDate: today,
    destination: pick(["New Delhi", "Mumbai", "Kolkata"]),
    expectedDelivery: inDays(4),
    route: "Bengaluru → Pune → Mumbai → Delhi",
    // Step 5 — Retailer (receive + sale)
    storeName: "Nature's Basket",
    storeLocation: "Saket, New Delhi, Delhi",
    receiptDate: today,
    invoiceNo: `NB-INV-${yr}-${n4()}`,
    bottlesReceived: "48",
    invoiceRef: `NB-SALE-${yr}-${n4()}`,
    saleDate: today,
  };

  let filled = 0;
  form
    .querySelectorAll("input[name], select[name], textarea[name]")
    .forEach((el) => {
      const v = DATA[el.name];
      if (v === undefined) return;
      // keep values the app already pre-filled (e.g. bottle serials, store name)
      if (
        el.tagName === "INPUT" &&
        el.value &&
        ["bottleSerialsInput", "storeName", "storeLocation"].includes(el.name)
      )
        return;
      if (el.tagName === "SELECT") {
        const opt = Array.from(el.options).find(
          (o) => (o.value || o.text) === v || o.text === v,
        );
        if (opt) el.value = opt.value || opt.text;
        else if (el.options.length > 1) el.selectedIndex = 1;
      } else {
        el.value = v;
      }
      el.dispatchEvent(new Event("input", { bubbles: true }));
      filled++;
    });
  if (typeof toast === "function")
    toast(`✨ Autofilled ${filled} fields`, "success");
}

function toggleBottleChip(bId) {
  const inp = document.getElementById("bottle-serials-input");
  if (!inp) return;
  let arr = inp.value
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);
  if (arr.includes(bId)) {
    arr = arr.filter((x) => x !== bId);
  } else {
    arr.push(bId);
  }
  inp.value = arr.join(", ");
}

// Make handlers globally accessible for inline onclick attributes
window.navigate = navigate;
window.doLogout = doLogout;
window.selectRole = selectRole;
window.startNewBatch = startNewBatch;
window.filterChain = filterChain;
window.simulateScan = simulateScan;
window.toggleBottleChip = toggleBottleChip;
window.autofillForm = autofillForm;
window.handleWorkflowSubmit = handleWorkflowSubmit;

// Boot the application
init();
