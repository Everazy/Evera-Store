# Everastore + Sakurupiah Payment Gateway

## Fitur yang ditambahkan

- Checkout bisa langsung lewat Payment Gateway Sakurupiah.
- Checkout juga bisa dipaksa order lewat WhatsApp dulu untuk produk/varian/layanan tertentu.
- Admin bisa mengatur alur checkout dari dashboard:
  - **Payment Gateway Sakurupiah** untuk produk yang bisa langsung dibayar otomatis.
  - **Order WhatsApp Dulu** untuk produk yang perlu dicek manual admin.
  - Varian, album, dan layanan sosmed bisa memilih **Ikuti Produk**, **Gateway**, atau **WhatsApp**.
- Login admin memakai email + password dari `.env` melalui backend `/api/admin/login`.
- API ID/API KEY Sakurupiah tidak ditaruh di HTML.

## Cara pakai

1. Rename atau copy `.env.example` menjadi `.env`.
2. Isi `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `SAKURUPIAH_API_ID`, `SAKURUPIAH_API_KEY`, `SAKURUPIAH_CALLBACK_URL`, dan `SAKURUPIAH_RETURN_URL`.
3. Jalankan:

```bash
npm install
npm start
```

4. Buka:

```bash
http://localhost:3000
```

## Cara mengatur produk yang Gateway atau WhatsApp

1. Login admin.
2. Tambah atau edit produk.
3. Pada bagian **Alur Checkout Default Produk**, pilih:
   - **Payment Gateway Sakurupiah** kalau produk bisa langsung dibayar.
   - **Order WhatsApp Dulu** kalau produk harus dikonfirmasi admin dulu.
4. Untuk produk non-sosmed, setiap album dan varian punya opsi bayar masing-masing.
5. Untuk produk sosmed, setiap layanan punya opsi bayar masing-masing.

Urutan prioritas:

```text
Varian/Layanan > Album > Default Produk
```

Contoh:

- Default produk = Gateway, tetapi varian tertentu = WhatsApp → varian itu order lewat WhatsApp dulu.
- Default produk = WhatsApp, tetapi layanan tertentu = Gateway → layanan itu langsung payment gateway.

## Catatan keamanan

- Jangan upload file `.env` ke GitHub atau hosting publik.
- API ID/API KEY Sakurupiah dipakai hanya di backend `server.js`, bukan di HTML.
- Admin login dicek lewat `/api/admin/login`, sehingga email/password tidak tertanam di frontend.
- Jika backend belum tersedia, HTML masih punya fallback login Firebase Auth lama.

## Endpoint Sakurupiah yang dipakai

Backend membuat invoice ke `create.php` dengan form data:
`api_id`, `method`, `phone`, `amount`, `merchant_fee`, `merchant_ref`, `callback_url`, `return_url`, `signature`, `expired`, dan detail produk.

Signature mengikuti pola:

```text
HMAC-SHA256(api_id + method + merchant_ref + amount, api_key)
```
