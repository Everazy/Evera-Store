import express from 'express';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

const PORT = process.env.PORT || 3000;
const SAKURUPIAH_API_ID = process.env.SAKURUPIAH_API_ID || '';
const SAKURUPIAH_API_KEY = process.env.SAKURUPIAH_API_KEY || '';
const SAKURUPIAH_BASE_URL = process.env.SAKURUPIAH_BASE_URL || 'https://sakurupiah.id/api-sanbox/';
const SAKURUPIAH_CALLBACK_URL = process.env.SAKURUPIAH_CALLBACK_URL || '';
const SAKURUPIAH_RETURN_URL = process.env.SAKURUPIAH_RETURN_URL || '';
const SAKURUPIAH_EXPIRED_HOURS = Number(process.env.SAKURUPIAH_EXPIRED_HOURS || 24);
const SAKURUPIAH_MERCHANT_FEE = Number(process.env.SAKURUPIAH_MERCHANT_FEE || 1);

function requiredEnv(name, value) {
  if (!value) {
    throw new Error(`ENV ${name} belum diisi`);
  }
}

function normalizePhone(phone) {
  const cleaned = String(phone || '').replace(/[^0-9]/g, '');
  if (cleaned.startsWith('08')) return `62${cleaned.slice(1)}`;
  if (cleaned.startsWith('8')) return `62${cleaned}`;
  return cleaned;
}

function generateSignature(method, merchantRef, amount) {
  const plain = `${SAKURUPIAH_API_ID}${method}${merchantRef}${amount}`;
  return crypto.createHmac('sha256', SAKURUPIAH_API_KEY).update(plain).digest('hex');
}

function appendArray(form, key, values) {
  for (const value of values) form.append(key, String(value ?? ''));
}

function extractCheckoutUrl(data) {
  const firstData = Array.isArray(data?.data) ? data.data[0] : data?.data;
  return data?.checkout_url
    || data?.payment_url
    || data?.url
    || firstData?.checkout_url
    || firstData?.checkoutURL
    || firstData?.CheckoutURL
    || firstData?.payment_url
    || firstData?.url
    || null;
}

function safeEqual(a, b) {
  const left = Buffer.from(String(a || ''));
  const right = Buffer.from(String(b || ''));
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function passwordMatches(inputPassword) {
  const plainPassword = process.env.ADMIN_PASSWORD || '';
  const passwordHash = process.env.ADMIN_PASSWORD_SHA256 || '';

  if (passwordHash) {
    const inputHash = crypto.createHash('sha256').update(String(inputPassword || '')).digest('hex');
    return safeEqual(inputHash, passwordHash);
  }

  return plainPassword ? safeEqual(inputPassword, plainPassword) : false;
}

app.post('/api/admin/login', (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const configuredEmail = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();

  if (!configuredEmail || (!process.env.ADMIN_PASSWORD && !process.env.ADMIN_PASSWORD_SHA256)) {
    return res.status(500).json({ ok: false, message: 'ADMIN_EMAIL dan ADMIN_PASSWORD/ADMIN_PASSWORD_SHA256 belum diatur di .env' });
  }

  if (safeEqual(email, configuredEmail) && passwordMatches(req.body?.password)) {
    return res.json({ ok: true });
  }

  return res.status(401).json({ ok: false, message: 'Email atau password admin salah' });
});

app.post('/api/payments/create', async (req, res) => {
  try {
    requiredEnv('SAKURUPIAH_API_ID', SAKURUPIAH_API_ID);
    requiredEnv('SAKURUPIAH_API_KEY', SAKURUPIAH_API_KEY);
    requiredEnv('SAKURUPIAH_CALLBACK_URL', SAKURUPIAH_CALLBACK_URL);
    requiredEnv('SAKURUPIAH_RETURN_URL', SAKURUPIAH_RETURN_URL);

    const customer = req.body?.customer || {};
    const order = req.body?.order || {};
    const method = String(req.body?.method || customer.method || 'QRIS').trim().toUpperCase();
    const amount = Math.round(Number(order.amount || 0));
    const phone = normalizePhone(customer.phone);
    const merchantRef = `EVA-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    if (!method) return res.status(400).json({ ok: false, message: 'Metode pembayaran wajib diisi' });
    if (!phone || phone.length < 10) return res.status(400).json({ ok: false, message: 'Nomor WhatsApp pembeli tidak valid' });
    if (!amount || amount <= 0) return res.status(400).json({ ok: false, message: 'Nominal pembayaran tidak valid' });

    const productName = String(order.productName || 'Everastore Order').slice(0, 100);
    const detail = String(order.detail || '').slice(0, 100);
    const qty = Math.max(1, Number(order.qty || 1));
    const note = String(order.note || order.whatsappMessage || '').slice(0, 500);

    const form = new URLSearchParams();
    form.set('api_id', SAKURUPIAH_API_ID);
    form.set('method', method);
    form.set('phone', phone);
    form.set('amount', String(amount));
    form.set('merchant_fee', String(SAKURUPIAH_MERCHANT_FEE));
    form.set('merchant_ref', merchantRef);
    form.set('callback_url', SAKURUPIAH_CALLBACK_URL);
    form.set('return_url', SAKURUPIAH_RETURN_URL);
    form.set('signature', generateSignature(method, merchantRef, amount));
    form.set('expired', String(SAKURUPIAH_EXPIRED_HOURS));

    if (customer.name) form.set('name', String(customer.name).slice(0, 100));
    if (customer.email) form.set('email', String(customer.email).slice(0, 120));

    appendArray(form, 'produk[]', [`${productName} - ${detail}`]);
    appendArray(form, 'qty[]', [qty]);
    appendArray(form, 'harga[]', [amount]);
    appendArray(form, 'note[]', [note]);

    const apiUrl = new URL('create.php', SAKURUPIAH_BASE_URL).toString();
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form
    });

    const raw = await response.text();

console.log("SAKURUPIAH STATUS:", response.status);
console.log("SAKURUPIAH RAW RESPONSE:", raw);

    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      data = { raw };
    }

    if (!response.ok) {
      return res.status(response.status).json({ ok: false, message: 'Sakurupiah menolak request', data });
    }

    return res.json({
      ok: true,
      merchant_ref: merchantRef,
      checkout_url: extractCheckoutUrl(data),
      data
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ ok: false, message: error.message || 'Server error' });
  }
});

app.post('/api/payments/callback', (req, res) => {
  // Sakurupiah callback masuk ke sini. Simpan status order ke database produksi kamu di bagian ini.
  console.log('Sakurupiah callback:', req.body);
  return res.json({ ok: true });
});

app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'everastore_sakurupiah.html'));
});

app.listen(PORT, () => {
  console.log(`Everastore Sakurupiah server running on http://localhost:${PORT}`);
});
