# Everastore - Invoice Log Fixed

Perubahan:
- Payment gateway dihapus.
- WhatsApp dimulai dari `.buy`.
- Invoice ID berada tepat di atas Produk.
- ID Produk dihapus.
- Log Invoice hanya mulai dibaca saat admin login/membuka dashboard, supaya tidak gagal jika rules Firestore membatasi read untuk admin.

## Sistem Log Invoice
Saat user klik Konfirmasi WhatsApp:
1. Website membuat invoice random, contoh `INV-250131-ABCDE`.
2. Data invoice disimpan ke Firestore:
   `artifacts/everast-27aec-main/public/data/invoiceLogs`
3. Pesan WhatsApp dibuka dengan format `.buy ...`.
4. Admin Dashboard membaca invoiceLogs dan menampilkan riwayat.

Jika log tidak muncul:
- cek Console browser untuk error `Invoice Logs Error` atau `Gagal simpan invoice log`
- cek Firestore Rules, pastikan user boleh create invoice log dan admin boleh read invoice log.
