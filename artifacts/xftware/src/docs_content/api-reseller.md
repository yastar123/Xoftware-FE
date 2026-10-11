# Dokumentasi API - Reseller (H2H Star Seller)
**Versi:** 1.0.0  
**Status:** Produksi  
**Penyusun:** Xoftware Developer Team

Dokumentasi API Reseller (Host-to-Host) digunakan untuk integrasi transaksi produk digital secara otomatis langsung dari jaringan **Star Seller (Marketplace Xoftware)**.

---

## 1. Informasi Dasar

### Base Path
Semua akses endpoint API Reseller menggunakan prefix path:
`/v1/reseller-api/`

### Autentikasi
API ini menggunakan autentikasi **`x-api-key`** yang dapat diperoleh melalui menu **Pengaturan -> Manajemen API**. Header ini wajib disertakan pada setiap request.

| Header | Wajib | Keterangan |
| :--- | :--- | :--- |
| `x-api-key` | Ya | API Key bot |
| `Content-Type` | Ya (untuk POST) | `application/json` |

> **Ketentuan Jaringan:** IP server pemanggil wajib terdaftar pada daftar Whitelist IP di dashboard pengaturan bot.

---

## 2. Alur Saldo & Settlement
- Pembelian memotong **`reseller_saldo`** (Saldo Deposit Reseller pada bot).
- Setiap transaksi berhasil akan langsung memproses settlement ke Star Seller penyedia produk.
- Akun/stok produk dikirimkan secara realtime pada response transaksi tanpa memerlukan webhook.
- Rekap transaksi otomatis tercatat pada menu **Produk -> Transaksi Reseller**.

---

## 3. Daftar Endpoint

### 3.1 Pengecekan Saldo Reseller
Mengecek sisa saldo deposit reseller (`reseller_saldo`) yang tersedia.

* **Path:** `/balance`
* **Method:** `GET` / `POST`

#### Contoh Response
```json
{
  "code": 200,
  "message": "OK",
  "data": {
    "bot_id": 12,
    "bot_name": "Toko Utama Store",
    "reseller_saldo": 2500000
  }
}
```

---

### 3.2 Daftar Produk Koleksi
Mengambil daftar produk Star Seller yang telah dikoleksi pada bot.

* **Path:** `/product`
* **Method:** `GET`

#### Deskripsi Response (Data)
| Field | Tipe | Deskripsi |
| :--- | :--- | :--- |
| `id` | `number` | ID produk Star Seller |
| `code` | `string` | Kode produk / SKU |
| `title` | `string` | Nama produk |
| `thumbnail` | `string` | URL gambar thumbnail produk |
| `price` | `number` | Harga produk per unit (khusus produk non-variasi, termasuk markup jika diatur) |
| `stock` | `number` | Jumlah stok akun yang tersedia (khusus produk non-variasi) |
| `desc` | `string` | Deskripsi produk |
| `snk` | `string` | Syarat dan ketentuan / garansi produk |
| `is_variation`| `boolean` | Menandakan apakah produk memiliki variasi |
| `variations` | `array` | Daftar objek variasi produk (khusus jika `is_variation: true`). Detail kolom lihat tabel variasi di bawah. |
| `provider_name` | `string` | Nama Star Seller penyedia stok |

#### Deskripsi Objek `variations` (Khusus Produk dengan `is_variation: true`)
| Field | Tipe | Deskripsi |
| :--- | :--- | :--- |
| `id` | `number` | ID variasi produk |
| `code` | `string` | Kode / SKU spesifik variasi |
| `title` | `string` | Nama / judul variasi (misal: "1 Bulan", "1 Tahun", "Private") |
| `price` | `number` | Harga variasi per unit (termasuk markup jika diatur) |
| `stock` | `number` | Jumlah stok akun yang tersedia untuk variasi ini |
| `desc` | `string` | Deskripsi / catatan khusus variasi |
| `snk` | `string` | Syarat & ketentuan / garansi khusus variasi |

#### Contoh Response
```json
{
  "code": 200,
  "message": "OK",
  "data": [
    {
      "id": 105,
      "code": "NFLX-1M",
      "title": "Netflix Premium 1 Bulan Private",
      "thumbnail": "https://...",
      "price": 28000,
      "stock": 42,
      "desc": "Garansi 30 hari",
      "snk": "Dilarang mengubah email dan password akun. Garansi berlaku selama masa aktif.",
      "is_variation": false,
      "provider_name": "Digital Star Supplier"
    },
    {
      "id": 108,
      "code": "CANVA-PRO",
      "title": "Canva Pro Subscription",
      "thumbnail": "https://...",
      "snk": "Garansi replace jika fitur Pro lepas sebelum masa aktif selesai.",
      "is_variation": true,
      "provider_name": "Design Supply Center",
      "variations": [
        {
          "id": 201,
          "code": "CANVA-1M",
          "title": "1 Bulan",
          "price": 5000,
          "stock": 100,
          "desc": "Aktivasi 1 bulan via invite team",
          "snk": "Garansi 30 hari"
        },
        {
          "id": 202,
          "code": "CANVA-1Y",
          "title": "1 Tahun",
          "price": 25000,
          "stock": 18,
          "desc": "Aktivasi 1 tahun via invite team",
          "snk": "Garansi 365 hari"
        }
      ]
    }
  ]
}
```

---

### 3.3 Pemesanan Produk (Order Instan)
Melakukan pembelian produk Star Seller. Sistem memproses pesanan melalui antrean sekuensial guna menjamin konsistensi stok dan saldo.

* **Path:** `/order`
* **Method:** `POST`

#### Parameter Body (JSON)
| Field | Tipe | Wajib | Deskripsi |
| :--- | :--- | :--- | :--- |
| `stock_id` | `number` | Ya | ID produk yang dibeli |
| `variation_id` | `number` | Kondisional | ID variasi (wajib jika produk bertipe variasi) |
| `quantity` | `number` | Ya | Jumlah item yang dipesan (minimal 1) |

#### Contoh Request
```bash
curl -X POST {BASE_URL}/v1/reseller-api/order \
  -H "x-api-key: YOUR_BOT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "stock_id": 105,
    "quantity": 1
  }'
```

#### Contoh Response Sukses
```json
{
  "code": 200,
  "message": "Order Berhasil",
  "data": {
    "id": 4821,
    "reff_id": "RAPI-M982KL-A9B2",
    "product_title": "Netflix Premium 1 Bulan Private",
    "quantity": 1,
    "price_per_unit": 28000,
    "total_price": 28000,
    "saldo_before": 2500000,
    "saldo_after": 2472000,
    "accounts": [
      {
        "email": "user@netflix.com",
        "password": "pass1234Secure",
        "pin": "1234",
        "profile": "Profile 1"
      }
    ]
  }
}
```

---

### 3.4 Riwayat Transaksi
Mengambil data riwayat transaksi yang diproses melalui API Reseller.

* **Path:** `/order`
* **Method:** `GET`
* **Query Parameters:**
  - `page` (default: 1): Nomor halaman data
  - `limit` (default: 20, max: 100): Jumlah data per halaman

#### Contoh Response
```json
{
  "code": 200,
  "message": "OK",
  "data": {
    "total": 1,
    "page": 1,
    "limit": 20,
    "total_pages": 1,
    "orders": [
      {
        "id": 4821,
        "reff_id": "RAPI-M982KL-A9B2",
        "title": "Netflix Premium 1 Bulan Private",
        "quantity": 1,
        "price_seller": 28000,
        "price_reseller": 28000,
        "status": "success",
        "before_saldo": 2500000,
        "after_saldo": 2472000,
        "createdAt": "2026-09-20T03:00:00.000Z"
      }
    ]
  }
}
```

---

### 3.5 Status Detail Transaksi
Mengecek status spesifik transaksi berdasarkan referensi ID serta mengambil payload akun produk.

* **Path:** `/order/status`
* **Method:** `GET`
* **Query Parameters:**
  - `reff_id` (wajib): Referensi unik transaksi (contoh: `RAPI-M982KL-A9B2`)

#### Contoh Response
```json
{
  "code": 200,
  "message": "OK",
  "data": {
    "id": 4821,
    "reff_id": "RAPI-M982KL-A9B2",
    "title": "Netflix Premium 1 Bulan Private",
    "status": "success",
    "quantity": 1,
    "price_reseller": 28000,
    "accounts": [
      {
        "email": "user@netflix.com",
        "password": "pass1234Secure",
        "pin": "1234"
      }
    ],
    "createdAt": "2026-09-20T03:00:00.000Z"
  }
}
```
