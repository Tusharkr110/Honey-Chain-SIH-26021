/**
 * Bharat Bee HoneyChain - shared ledger API (Vercel serverless function)
 *
 * GET  /api/state  -> { chains, batches }
 * POST /api/state  -> merge a snapshot into the shared ledger
 *
 * Storage: Upstash Redis (connect it from the Vercel "Storage" tab).
 *
 * Safety rules enforced on the SERVER (so a judge's phone can't corrupt the ledger):
 *   1. Every block's SHA-256 hash is recomputed and every previousHash link is checked.
 *   2. Ledger is append-only: a stored chain can only be extended, never rewritten.
 *   3. Anything containing < or > is rejected (stops script injection into the QR pages).
 */
const crypto = require('crypto');

const KEY = 'honeychain:state';
const GENESIS = '0'.repeat(64);
const MAX_BYTES = 400 * 1024;
const MAX_BLOCKS = 60;
const ID_RE = /^BATCH-[A-Z0-9-]{3,40}$/;

const REDIS_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

async function redis(cmd) {
  if (!REDIS_URL || !REDIS_TOKEN) throw new Error('STORAGE_NOT_CONFIGURED');
  const r = await fetch(REDIS_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${REDIS_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(cmd),
  });
  if (!r.ok) throw new Error('REDIS_ERROR_' + r.status);
  return (await r.json()).result;
}

async function loadState() {
  const raw = await redis(['GET', KEY]);
  if (!raw) return { chains: {}, batches: {} };
  try {
    const s = JSON.parse(raw);
    return { chains: s.chains || {}, batches: s.batches || {} };
  } catch { return { chains: {}, batches: {} }; }
}

const sha256 = (s) => crypto.createHash('sha256').update(s, 'utf8').digest('hex');

// Must match computeBlockHash() in app.js exactly (same keys, same order)
function blockHash(b) {
  return sha256(JSON.stringify({
    index: b.index, timestamp: b.timestamp, role: b.role, action: b.action,
    batchId: b.batchId, data: b.data, previousHash: b.previousHash,
  }));
}

function hasMarkup(v) {
  if (typeof v === 'string') return /[<>]/.test(v);
  if (Array.isArray(v)) return v.some(hasMarkup);
  if (v && typeof v === 'object') return Object.entries(v).some(([k, x]) => /[<>]/.test(k) || hasMarkup(x));
  return false;
}

function chainIsValid(id, chain) {
  if (!Array.isArray(chain) || chain.length === 0 || chain.length > MAX_BLOCKS) return false;
  let prev = GENESIS;
  for (let i = 0; i < chain.length; i++) {
    const b = chain[i];
    if (!b || typeof b !== 'object') return false;
    if (b.index !== i || b.batchId !== id || b.previousHash !== prev) return false;
    if (typeof b.hash !== 'string' || blockHash(b) !== b.hash) return false;
    prev = b.hash;
  }
  return true;
}

function isExtensionOf(newer, older) {
  if (newer.length < older.length) return false;
  return older.every((b, i) => newer[i] && newer[i].hash === b.hash);
}

function merge(stored, incoming) {
  let accepted = 0, rejected = 0;
  for (const [id, chain] of Object.entries((incoming && incoming.chains) || {})) {
    if (!ID_RE.test(id) || !chainIsValid(id, chain) || hasMarkup(chain)) { rejected++; continue; }
    const meta = incoming.batches && incoming.batches[id];
    if (meta && (typeof meta !== 'object' || hasMarkup(meta))) { rejected++; continue; }
    const cur = stored.chains[id];
    if (!cur) {
      stored.chains[id] = chain; if (meta) stored.batches[id] = meta; accepted++;
    } else if (chain.length > cur.length && isExtensionOf(chain, cur)) {
      stored.chains[id] = chain; if (meta) stored.batches[id] = meta; accepted++;
    } else if (chain.length === cur.length && chain[chain.length - 1].hash === cur[cur.length - 1].hash && meta && !stored.batches[id]) {
      stored.batches[id] = meta; // fill in missing metadata only
    } else if (chain.length < cur.length || !isExtensionOf(chain, cur)) {
      rejected++;
    }
  }
  return { accepted, rejected };
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  try {
    if (req.method === 'GET') {
      return res.status(200).json(await loadState());
    }

    if (req.method === 'POST') {
      let body = req.body;
      if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = null; } }
      if (!body || typeof body !== 'object') return res.status(400).json({ error: 'Invalid JSON' });
      if (JSON.stringify(body).length > MAX_BYTES) return res.status(413).json({ error: 'Payload too large' });

      const stored = await loadState();
      const result = merge(stored, body);
      if (result.accepted > 0) await redis(['SET', KEY, JSON.stringify(stored)]);
      return res.status(200).json({ ok: true, ...result, ...stored });
    }

    // Optional: DELETE /api/state?key=<RESET_KEY> wipes the ledger (set RESET_KEY in Vercel env vars)
    if (req.method === 'DELETE') {
      const rk = process.env.RESET_KEY;
      if (!rk || req.query.key !== rk) return res.status(403).json({ error: 'Forbidden' });
      await redis(['DEL', KEY]);
      return res.status(200).json({ ok: true, reset: true });
    }

    res.setHeader('Allow', 'GET, POST, DELETE');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    const msg = e && e.message === 'STORAGE_NOT_CONFIGURED'
      ? 'Storage not configured: connect an Upstash Redis database in the Vercel Storage tab, then redeploy.'
      : 'Server error';
    return res.status(500).json({ error: msg });
  }
};
