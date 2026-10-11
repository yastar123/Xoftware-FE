# Dokumentasi API - Manajemen Produk
**Versi:** 1.0.0  
**Status:** Produksi  
**Penyusun:** Xoftware Developer Team

API Manajemen Produk digunakan oleh pemilik bot (store owner) untuk mengelola katalog produk digital, variasi, dan persediaan stok akun secara otomatis melalui integrasi Host-to-Host (H2H).

---

## 1. Informasi Dasar

### Base Path
Semua endpoint manajemen produk menggunakan prefix:
`/v1/products`

### Autentikasi & Header
API ini menggunakan autentikasi header **`x-api-key`** yang diperoleh dari menu **Pengaturan -> Manajemen API** di dashboard bot Anda.

| Header | Wajib | Tipe | Keterangan |
| :--- | :--- | :--- | :--- |
| `x-api-key` | Ya | `string` | Kunci API resmi bot Anda |
| `Content-Type` | Ya (untuk POST/PUT) | `string` | `application/json` |

> [!NOTE]
> **Keamanan IP Whitelist:** Jika Anda mengaktifkan daftar IP Whitelist pada pengaturan bot, pastikan IP server pemanggil telah didaftarkan.

---

## 2. Batasan Teknis & Regulasi Input

Untuk menjaga stabilitas performa sistem, aturan berikut berlaku dan mohon menjadi perhatian:

1. **Limitasi Stok per Request:** Endpoint penambahan stok akun (`POST /v1/products/stocks`) dibatasi maksimal **100 akun** per request. Jika memiliki stok lebih dari 100, lakukan pengiriman bertahap (batching).
2. **Limitasi Variasi Produk:** Satu produk induk dibatasi maksimal memiliki **30 item variasi**.
3. **Limitasi Pagination Produk:** Pengambilan daftar produk (`GET /v1/products`) dibatasi maksimal **20 produk per halaman** (default: 20).
4. **Standar Kode (SKU):** Kode produk maupun variasi (`code`) wajib berupa kombinasi huruf, angka, atau dash (`-`) dengan panjang **3 hingga 50 karakter**.
5. **Format Stok Akun:** Menggunakan format JSON array string `["nilai1|nilai2"]` yang dipisahkan oleh tanda pipe (`|`) sesuai urutan field pada template form produk.

---

## 3. Template Form Stok (Forms Reference)

Sebelum membuat produk atau menambahkan stok akun, Anda dapat mengecek format isian form stok yang tersedia di sistem.

### 3.1 Mengambil Daftar Template Form
* **Path:** `/v1/products/forms`
* **Method:** `GET`

#### Contoh Response
```json
{
  "code": 200,
  "message": "OK",
  "data": [
    {
      "id": 1,
      "name": "default",
      "fields": ["Akun"],
      "required_fields": ["Akun"]
    },
    {
      "id": 2,
      "name": "Email | Password",
      "fields": ["Email", "Password"],
      "required_fields": ["Email", "Password"]
    },
    {
      "id": 3,
      "name": "Email | Password | 2FA Key",
      "fields": ["Email", "Password", "2FA Key"],
      "required_fields": ["Email", "Password"]
    }
  ]
}
```

---

## 4. Manajemen Produk Utama

### 4.1 Mengambil Daftar Produk
Mengambil daftar produk digital milik bot dengan pagination dan filter pencarian.

* **Path:** `/v1/products/`
* **Method:** `GET`
* **Query Parameters:**
  * `page` (opsional, default: `1`): Nomor halaman.
  * `limit` (opsional, default: `20`, maks: `20`): Jumlah data per halaman (maksimal 20 data).
  * `search` (opsional): Kata kunci judul atau kode produk.
  * `is_variation` (opsional): Filter `true` untuk produk variasi atau `false` untuk produk tunggal.

#### Contoh Response
```json
{
  "code": 200,
  "message": "OK",
  "data": {
    "products": [
      {
        "id": 105,
        "code": "NETFLIX-1B",
        "title": "Netflix Premium 1 Bulan",
        "price": 35000,
        "profit": 5000,
        "desc": "Akun private resmi 4K UHD",
        "snk": "Garansi 30 hari replace",
        "form": 2,
        "is_variation": false,
        "is_show": true,
        "bulk_count": 0,
        "wholesale_tiers": null,
        "sold": 42,
        "stock_count": 15,
        "createdAt": "2026-09-18T10:00:00.000Z",
        "updatedAt": "2026-09-20T08:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "total_pages": 1
    }
  }
}
```

---

### 4.2 Mengambil Detail Produk
* **Path:** `/v1/products/:id`
* **Method:** `GET`

#### Contoh Response
```json
{
  "code": 200,
  "message": "OK",
  "data": {
    "id": 105,
    "code": "NETFLIX-1B",
    "title": "Netflix Premium 1 Bulan",
    "price": 35000,
    "profit": 5000,
    "desc": "Akun private resmi 4K UHD",
    "snk": "Garansi 30 hari replace",
    "form": 2,
    "is_variation": false,
    "is_show": true,
    "bulk_count": 0,
    "wholesale_tiers": null,
    "required_seller_note": false,
    "sold": 42,
    "stock_count": 15,
    "createdAt": "2026-09-18T10:00:00.000Z",
    "updatedAt": "2026-09-20T08:30:00.000Z"
  }
}
```

---

### 4.3 Membuat Produk Baru
* **Path:** `/v1/products/`
* **Method:** `POST`

#### Payload (Produk Tunggal)
```json
{
  "code": "SPOTIFY-IND",
  "title": "Spotify Individual 1 Bulan",
  "price": 18000,
  "profit": 3000,
  "desc": "Akun fresh anti on-hold",
  "snk": "Garansi full 30 hari",
  "form": 2,
  "is_variation": false,
  "stocks": [
    "user1@gmail.com|pass123",
    "user2@gmail.com|pass456"
  ]
}
```

#### Payload (Produk Bertipe Variasi)
```json
{
  "title": "Canva Pro Edu & Lifetime",
  "desc": "Pilih durasi aktivasi Canva",
  "is_variation": true
}
```

#### Deskripsi Field
| Field | Wajib | Tipe | Deskripsi |
| :--- | :--- | :--- | :--- |
| `title` | Ya | `string` | Judul produk (maks 100 karakter) |
| `code` | Ya (jika non-variasi) | `string` | Kode SKU alfanumerik & dash (3 - 50 karakter) |
| `price` | Ya (jika non-variasi) | `number` | Harga jual produk dalam Rupiah |
| `profit` | Tidak | `number` | Nilai profit untuk laporan bot |
| `desc` | Tidak | `string` | Deskripsi produk (maks 5.000 karakter) |
| `snk` | Tidak | `string` | Syarat & ketentuan produk (maks 5.000 karakter) |
| `form` | Tidak | `number` | ID template form stok (default: form default sistem) |
| `is_variation` | Tidak | `boolean` | `true` jika produk memiliki banyak pilihan variasi |
| `wholesale_tiers` | Tidak | `array` | Tier harga grosir: `[{"min_qty": 5, "price": 15000, "profit": 2000}]` |
| `stocks` | Tidak | `array<string>` | Injeksi stok awal (maksimal 100 akun) |

#### Contoh Response
```json
{
  "code": 201,
  "message": "Produk berhasil dibuat",
  "data": {
    "product_id": 108,
    "code": "SPOTIFY-IND",
    "title": "Spotify Individual 1 Bulan",
    "is_variation": false
  }
}
```

---

### 4.4 Memperbarui Data Produk
* **Path:** `/v1/products/:id`
* **Method:** `PUT`

#### Payload
```json
{
  "title": "Spotify Individual 1 Bulan (Update)",
  "price": 19000,
  "profit": 3500,
  "desc": "Stok fresh akun legal",
  "is_show": true
}
```

#### Contoh Response
```json
{
  "code": 200,
  "message": "Produk berhasil diperbarui",
  "data": {
    "product_id": 108
  }
}
```

---

### 4.5 Menghapus Produk
Menghapus produk induk beserta seluruh variasi dan sisa persediaan stok akunnya.

* **Path:** `/v1/products/:id`
* **Method:** `DELETE`

#### Contoh Response
```json
{
  "code": 200,
  "message": "Produk berhasil dihapus",
  "data": null
}
```

---

## 5. Manajemen Variasi Produk

### 5.1 Menambahkan Variasi
Menambahkan variasi baru ke dalam produk induk. Maksimal 30 variasi per produk induk.

* **Path:** `/v1/products/:id/variations` (di mana `:id` adalah ID produk induk)
* **Method:** `POST`

#### Payload
```json
{
  "code": "CANVA-1TH",
  "title": "Canva Pro 1 Tahun",
  "price": 25000,
  "profit": 5000,
  "desc": "Invited via team link resmi",
  "form": 1,
  "stocks": [
    "https://canva.com/brand/join?token=abc123xyz"
  ]
}
```

#### Contoh Response
```json
{
  "code": 201,
  "message": "Variasi berhasil ditambahkan",
  "data": {
    "variation_id": 45,
    "code": "CANVA-1TH",
    "title": "Canva Pro 1 Tahun"
  }
}
```

---

### 5.2 Mengambil Detail Variasi
* **Path:** `/v1/products/variations/:id` (di mana `:id` adalah ID variasi)
* **Method:** `GET`

#### Contoh Response
```json
{
  "code": 200,
  "message": "OK",
  "data": {
    "id": 45,
    "stock_id": 108,
    "code": "CANVA-1TH",
    "title": "Canva Pro 1 Tahun",
    "price": 25000,
    "profit": 5000,
    "desc": "Invited via team link resmi",
    "snk": "",
    "form": 1,
    "stock_count": 8,
    "createdAt": "2026-09-20T09:00:00.000Z"
  }
}
```

---

### 5.3 Memperbarui Variasi
* **Path:** `/v1/products/variations/:id`
* **Method:** `PUT`

#### Payload
```json
{
  "title": "Canva Pro 1 Tahun (Full Garansi)",
  "price": 27000,
  "profit": 6000
}
```

#### Contoh Response
```json
{
  "code": 200,
  "message": "Variasi berhasil diperbarui",
  "data": {
    "variation_id": 45
  }
}
```

---

### 5.4 Menghapus Variasi
* **Path:** `/v1/products/variations/:id`
* **Method:** `DELETE`

#### Contoh Response
```json
{
  "code": 200,
  "message": "Variasi berhasil dihapus",
  "data": null
}
```

---

## 6. Manajemen Stok Akun (Stock Accounts)

### 6.1 Injeksi Stok Akun
Menambahkan data persediaan akun siap jual ke produk atau variasi.

* **Path:** `/v1/products/stocks`
* **Method:** `POST`

> [!IMPORTANT]
> **Batasan Kuota:** Maksimal **100 akun** per request pengiriman.

#### Payload (Produk Tunggal)
```json
{
  "product_id": 105,
  "accounts": [
    "user1@gmail.com|pass123",
    "user2@gmail.com|pass456"
  ]
}
```

#### Payload (Produk Bertipe Variasi)
```json
{
  "product_id": 108,
  "variation_id": 45,
  "accounts": [
    "https://canva.com/brand/join?token=link1",
    "https://canva.com/brand/join?token=link2"
  ]
}
```

#### Contoh Response
```json
{
  "code": 201,
  "message": "Berhasil menambahkan 2 akun stok",
  "data": {
    "total_added": 2,
    "product_id": 105,
    "variation_id": null
  }
}
```

---

### 6.2 Mengambil Sisa Stok Akun Aktif
Melihat daftar data akun yang belum terjual pada suatu produk.

* **Path:** `/v1/products/:id/stocks` (di mana `:id` adalah ID produk)
* **Method:** `GET`
* **Query Parameters:**
  * `variation_id` (opsional): Filter akun untuk ID variasi tertentu.
  * `page` (opsional, default: `1`): Nomor halaman.
  * `limit` (opsional, default: `50`, maks: `100`): Jumlah data per halaman.

#### Contoh Response
```json
{
  "code": 200,
  "message": "OK",
  "data": {
    "stocks": [
      {
        "id": 8901,
        "stock_id": 105,
        "variation_id": null,
        "value": {
          "Email": "user1@gmail.com",
          "Password": "pass123"
        },
        "createdAt": "2026-09-20T09:15:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 1,
      "total_pages": 1
    }
  }
}
```

---

### 6.3 Menghapus 1 Stok Akun
Menghapus data akun stok spesifik yang belum terjual berdasarkan ID akunnya.

* **Path:** `/v1/products/stocks/:id` (di mana `:id` adalah ID akun stok)
* **Method:** `DELETE`

#### Contoh Response
```json
{
  "code": 200,
  "message": "Data akun stok berhasil dihapus",
  "data": null
}
```

---

## 7. Penanganan Kesalahan (Error Handling)

Format response error mengikuti standar Xoftware:
```json
{
  "code": 400,
  "message": "Maksimal penambahan stok adalah 100 akun per request",
  "data": null
}
```

| Kode HTTP | Penjelasan |
| :--- | :--- |
| `200` | Permintaan berhasil diproses. |
| `201` | Sumber daya baru (produk/variasi/stok) berhasil dibuat. |
| `400` | Validasi input gagal, kuota akun > 100, variasi > 30, atau kode SKU duplikat. |
| `401` | API Key tidak ditemukan atau tidak valid. |
| `403` | Akses IP diblokir (tidak masuk whitelist IP bot). |
| `404` | Produk, variasi, form, atau akun stok tidak ditemukan. |
| `500` | Terjadi kesalahan internal pada server. |

---