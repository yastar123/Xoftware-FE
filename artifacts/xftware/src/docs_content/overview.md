# Xoftware Official Documentation

Selamat datang di pusat dokumentasi teknis Xoftware. Di sini tersedia panduan lengkap integrasi API, referensi endpoint teknis, dan petunjuk penggunaan sistem.

## Fitur & Layanan API
* 📦 [**API Produk**](/docs/api-product): Panduan integrasi manajemen katalog produk toko, variasi, dan pengelolaan persediaan stok akun.
* 🔄 [**API Reseller**](/docs/api-reseller): Integrasi transaksi produk otomatis langsung ke Star Seller.
* ⚖️ [**Ketentuan Layanan**](/docs/ketentuan): Syarat, ketentuan penggunaan layanan, dan kebijakan teknis.

---

## Informasi Server & Autentikasi

### Base URL
Request API diarahkan ke base URL berikut:
```text
https://backend-s2.xoftware.id
```

### Autentikasi API Key
Setiap request wajib menyertakan API Key pada Header HTTP:
```bash
x-api-key: YOUR_API_KEY
Content-Type: application/json
```
API Key dapat diperoleh melalui dashboard bot pada menu **Pengaturan -> Manajemen API**.

---
> [!TIP]
> Gunakan menu navigasi di sebelah kiri untuk melihat referensi endpoint spesifik beserta parameter request dan contoh response.
