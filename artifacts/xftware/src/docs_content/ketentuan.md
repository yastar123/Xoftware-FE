# Syarat & Ketentuan Penggunaan API Xoftware

Untuk menjaga kestabilan dan keamanan sistem, seluruh integrasi pihak ketiga wajib mematuhi batasan-batasan berikut:

## 1. Batasan Nilai Deposit
Transaksi pengisian saldo (deposit) memiliki rentang nilai nominal yang diizinkan.
*   **Minimal:** Rp 1.000
*   **Maksimal:** Rp 1.000.000 per transaksi.

## 2. Produk Reseller (BARU)
Pembelian produk yang berasal dari **Supplier/Reseller Provider** saat ini **TELAH DIDUKUNG** melalui API. Sistem akan otomatis melakukan pengecekan stok ke provider secara real-time. Pastikan saldo bot Anda mencukupi untuk melakukan transaksi bot-to-bot.

## 3. Batasan Kuota Manajemen Produk
Untuk menjaga performa database dan kelancaran pemrosesan katalog digital:
*   **Penambahan Stok:** Maksimal **100 akun per request** pengiriman stok.
*   **Variasi Produk:** Maksimal **30 variasi** per satu produk induk.
*   **Pagination Produk:** Maksimal **20 produk per halaman** pada endpoint daftar produk.
*   **Panjang Konten:** Judul maksimal 100 karakter, deskripsi dan syarat & ketentuan maksimal 5.000 karakter, kode produk (SKU) 3 - 50 karakter alfanumerik.

## 4. Keamanan IP (IP Whitelisting)
Sangat disarankan untuk mendaftarkan IP Server Anda di dashboard owner. Jika daftar IP Whitelist tidak kosong, sistem hanya akan menerima request dari alamat IP yang terdaftar.

## 5. Kode Status HTTP

| Kode | Arti | Deskripsi |
| :--- | :--- | :--- |
| `200` | OK | Permintaan berhasil diproses. |
| `400` | Bad Request | Parameter tidak valid, saldo tidak cukup, atau stok habis. |
| `401` | Unauthorized | API Key salah atau tidak disertakan. |
| `403` | Forbidden | Akses dilarang (Akun disuspensi atau IP tidak terdaftar). |
| `404` | Not Found | Route atau data tidak ditemukan. |
| `409` | Conflict | Terjadi konflik data (misal: pendaftaran dengan nomor yang sudah ada). |
| `429` | Too Many Requests | Terkena limitasi rate limit (Registrasi). |
| `500` | Internal Error | Terjadi kegagalan pada sisi server. |

---

> [!CAUTION]
> **Peringatan Keamanan**
> Jangan pernah membagikan API Key Anda kepada pihak manapun. Kebocoran API Key dapat menyebabkan penyalahgunaan saldo dan data akun Anda. Xoftware tidak pernah meminta API Key melalui chat atau email.

---
