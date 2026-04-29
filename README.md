# Everastore GitHub Ready + Payment Gateway

Folder ini sudah siap dipindahkan ke GitHub dan di-deploy ke Vercel.

## Isi File

```text
everastore-github-ready-payment/
├── index.html
├── package.json
├── vercel.json
├── .env.example
└── api/
    ├── create-payment.js
    ├── midtrans-notification.js
    └── payment-status/
        └── [orderId].js
```

## Cara Pakai di GitHub

1. Extract ZIP ini.
2. Upload semua isi folder ke repository GitHub kamu.
3. Pastikan `index.html`, `package.json`, `vercel.json`, dan folder `api` berada di root repo.

Contoh struktur yang benar:

```text
repo-kamu/
├── index.html
├── package.json
├── vercel.json
└── api/
```

## Setup Vercel

1. Buka Vercel.
2. Import repo GitHub kamu.
3. Deploy project.
4. Buka Vercel Project > Settings > Environment Variables.
5. Tambahkan:

```env
MIDTRANS_IS_PRODUCTION=false
MIDTRANS_SERVER_KEY=ISI_SERVER_KEY_MIDTRANS_KAMU
MIDTRANS_CLIENT_KEY=ISI_CLIENT_KEY_MIDTRANS_KAMU
```

6. Redeploy project setelah env diisi.

## Setup Client Key di index.html

Di `index.html`, cari:

```html
data-client-key="ISI_CLIENT_KEY_MIDTRANS_KAMU"
```

Ganti dengan Client Key Midtrans kamu.

## Midtrans Sandbox vs Production

Untuk sandbox, script di `index.html` sudah benar:

```html
https://app.sandbox.midtrans.com/snap/snap.js
```

Untuk production, ganti menjadi:

```html
https://app.midtrans.com/snap/snap.js
```

Lalu ubah Environment Variable:

```env
MIDTRANS_IS_PRODUCTION=true
```

## Webhook Midtrans

Masukkan URL ini ke dashboard Midtrans:

```text
https://domain-vercel-kamu.vercel.app/api/midtrans-notification
```

Contoh:

```text
https://everastore.vercel.app/api/midtrans-notification
```

## Catatan Penting

- Jangan taruh `MIDTRANS_SERVER_KEY` di `index.html`.
- Server key hanya boleh ditaruh di Vercel Environment Variables.
- File ini sudah memakai endpoint `/api/create-payment`, jadi tidak perlu backend terpisah.
- Kalau tombol pembayaran error, cek Console browser dan log Function di Vercel.
