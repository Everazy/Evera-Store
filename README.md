# Everastore - Invoice Log No Payment Gateway

Versi ini:
- Payment gateway sudah dihapus.
- Checkout kembali langsung ke WhatsApp.
- Setiap pesanan membuat ID invoice random.
- ID invoice ikut terkirim ke WhatsApp.
- Log invoice tersimpan di Firebase Firestore.
- Log invoice hanya tampil di Admin Dashboard.

## File
Upload `index.html` ke root GitHub repo kamu.

## Catatan
Log invoice tersimpan di path Firestore:
`artifacts/everast-27aec-main/public/data/invoiceLogs`

Jika rules Firestore kamu membatasi write, pastikan anonymous user boleh menulis ke path tersebut, atau sesuaikan rules Firebase kamu.
