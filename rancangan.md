# PRD — Monitor RTLH: Aplikasi Progres Paket Pekerjaan

**Versi:** 1.0
**Pemilik:** Alpian Tabrani — Dinas Perumahan dan Kawasan Permukiman, Kabupaten Lombok Timur
**Status:** Draft awal, siap dikembangkan
**Target pengguna:** 1 admin (staf teknis/administrasi Dinas)

---

## 1. Ringkasan & Latar Belakang

Aplikasi internal untuk memonitor progres **paket pekerjaan program RTLH (Rumah Tidak Layak Huni)** di Kabupaten Lombok Timur. Setiap paket pekerjaan memiliki nilai kontrak, status fisik pelaksanaan, dan status pembayaran. Aplikasi menampilkan capaian program secara keseluruhan — baik dari sisi fisik (jumlah rumah/paket yang selesai dikerjakan) maupun dari sisi keuangan (berapa persen nilai kontrak yang sudah terbayarkan) — sehingga capaian mencapai **100% hanya jika seluruh paket sudah selesai dan seluruh nilainya sudah terbayar lunas**.

### Masalah yang diselesaikan

- Saat ini tidak ada cara cepat untuk melihat total capaian program RTLH tanpa merekap manual dari dokumen/Excel terpisah.
- Sulit mengetahui paket mana saja yang statusnya belum lunas atau belum selesai tanpa membuka banyak file.

### Tujuan

- Input dan kelola data paket pekerjaan dengan mudah (CRUD).
- Lihat capaian keseluruhan program secara instan (persentase fisik & keuangan).
- Identifikasi cepat paket-paket yang perlu tindak lanjut (belum lunas/belum selesai).

### Non-tujuan (di luar cakupan versi ini)

- Tidak ada alur approval berjenjang (cukup 1 admin, tanpa role lain).
- Tidak menangani termin pembayaran bertahap secara rinci (hanya total nilai terbayar per paket).
- Tidak ada integrasi langsung ke sistem keuangan Pemda (SIPD/SIMDA).

---

## 2. Target Pengguna & Konteks Penggunaan

- **Pengguna:** 1 admin tunggal (staf Dinas Perkim), bukan aplikasi multi-role.
- **Konteks:** Digunakan di laptop/PC kantor, sesekali dicek lewat HP. Tidak perlu dioptimalkan untuk banyak pengguna simultan.
- **Data sensitif:** Data ini terkait anggaran pemerintah — akses harus dibatasi hanya untuk pengguna yang sudah login (tidak ada halaman publik).

---

## 3. Tech Stack

| Layer             | Teknologi                                          |
| ----------------- | -------------------------------------------------- |
| Build tool        | Vite                                               |
| Framework         | React 18 + TypeScript                              |
| Styling           | Tailwind CSS                                       |
| Routing           | React Router v6                                    |
| Backend/DB        | Supabase (Postgres)                                |
| Auth              | Supabase Auth (email/password, 1 akun admin)       |
| Hosting (rencana) | Vercel / Netlify (static hosting untuk build Vite) |

**Alasan pemilihan:** Stack ringan, tanpa server terpisah untuk maintenance, cocok untuk aplikasi internal skala kecil dengan 1 pengguna. Supabase menyediakan Postgres + Auth + RLS tanpa perlu membangun backend custom.

---

## 4. Model Data

### Tabel: `paket_pekerjaan`

| Kolom             | Tipe          | Wajib | Keterangan                                       |
| ----------------- | ------------- | ----- | ------------------------------------------------ |
| `id`              | uuid (PK)     | ✓     | default `gen_random_uuid()`                      |
| `kode_paket`      | text          | –     | kode/nomor paket internal, opsional              |
| `nama_paket`      | text          | ✓     | nama paket pekerjaan                             |
| `lokasi`          | text          | –     | desa/kecamatan lokasi pekerjaan                  |
| `kontraktor`      | text          | –     | nama pelaksana/kontraktor                        |
| `nilai_kontrak`   | numeric(16,2) | ✓     | nilai kontrak dalam Rupiah                       |
| `nilai_terbayar`  | numeric(16,2) | ✓     | akumulasi nilai yang sudah dibayarkan, default 0 |
| `status_fisik`    | text (enum)   | ✓     | `belum_mulai` \| `proses` \| `selesai`           |
| `progres_fisik`   | numeric(5,2)  | –     | persentase progres di lapangan, 0–100            |
| `tanggal_mulai`   | date          | –     |                                                  |
| `tanggal_selesai` | date          | –     |                                                  |
| `catatan`         | text          | –     | catatan bebas                                    |
| `created_at`      | timestamptz   | ✓     | default `now()`                                  |
| `updated_at`      | timestamptz   | ✓     | auto-update via trigger                          |

**Derived value (dihitung di aplikasi, bukan disimpan):**

- `status_pembayaran`: `belum_bayar` jika `nilai_terbayar <= 0`; `lunas` jika `nilai_terbayar >= nilai_kontrak` (dan `nilai_kontrak > 0`); selain itu `sebagian`.

### Keamanan (Row Level Security)

- RLS aktif di tabel `paket_pekerjaan`.
- Policy: hanya role `authenticated` (pengguna yang sudah login lewat Supabase Auth) yang boleh `select`, `insert`, `update`, `delete`. Tidak ada akses anon/publik.

---

## 5. Logika Bisnis Utama

### Capaian Keuangan (Financial Progress)

```
capaian_keuangan (%) = (Σ nilai_terbayar semua paket) / (Σ nilai_kontrak semua paket) × 100
```

Otomatis mencapai 100% ketika **seluruh** paket sudah terbayar penuh sesuai nilai kontraknya masing-masing. Ini adalah metrik utama yang diminta: _"persentasenya 100% jika semua paket dan nilai uangnya sudah semua terbayarkan."_

### Capaian Fisik (Physical Progress)

```
capaian_fisik (%) = (jumlah paket dengan status_fisik = 'selesai') / (total jumlah paket) × 100
```

### Status Pembayaran per Paket

Dihitung otomatis dari `nilai_kontrak` vs `nilai_terbayar` (lihat tabel di atas) — tidak diinput manual, untuk menghindari data tidak konsisten.

### Validasi Data

- `nilai_kontrak` dan `nilai_terbayar` tidak boleh negatif.
- `progres_fisik` dibatasi 0–100 (constraint di database).
- Idealnya `nilai_terbayar` tidak melebihi `nilai_kontrak` (validasi di form, bukan hard constraint DB, untuk fleksibilitas jika ada penyesuaian kontrak).

---

## 6. Fitur & User Stories

### 6.1 Autentikasi

- **Sebagai admin**, saya bisa login dengan email & password agar hanya saya yang bisa mengubah data.
- Tidak ada halaman registrasi mandiri — akun admin dibuat langsung dari Supabase Dashboard.
- Redirect otomatis ke `/login` jika belum login dan mencoba akses halaman terproteksi.

### 6.2 Dashboard (`/`)

- **Sebagai admin**, saya ingin melihat capaian keuangan dan capaian fisik keseluruhan dalam bentuk visual (gauge/radial) begitu membuka aplikasi.
- Menampilkan ringkasan: total paket, jumlah paket selesai, jumlah paket lunas, total nilai kontrak.
- Menampilkan daftar 5 paket dengan sisa tagihan terbesar ("Perlu Perhatian") agar admin tahu prioritas tindak lanjut.
- Kondisi kosong (belum ada data): tampilkan ajakan untuk menambah paket pertama.

### 6.3 Daftar Paket (`/paket`)

- **Sebagai admin**, saya ingin melihat semua paket dalam tabel dengan progres bayar per baris.
- Bisa mencari (nama paket/lokasi/kontraktor) dan memfilter berdasarkan status fisik dan status pembayaran.
- Aksi per baris: Ubah, Hapus (dengan konfirmasi).
- Tombol "+ Tambah Paket" mengarah ke form tambah.

### 6.4 Form Tambah/Ubah Paket (`/paket/baru`, `/paket/:id`)

- Input semua field pada tabel `paket_pekerjaan`.
- Field wajib: nama paket, nilai kontrak.
- Setelah simpan, kembali ke `/paket`.

---

## 7. Struktur Routing

| Path          | Halaman           | Proteksi    |
| ------------- | ----------------- | ----------- |
| `/login`      | Login             | Publik      |
| `/`           | Dashboard         | Butuh login |
| `/paket`      | Daftar Paket      | Butuh login |
| `/paket/baru` | Form Tambah Paket | Butuh login |
| `/paket/:id`  | Form Ubah Paket   | Butuh login |
| `*`           | Redirect ke `/`   | –           |

---

## 8. Desain / UI

- **Palet warna:** Navy `#0D1B2A` (utama, header/navigasi) dan Gold `#C9A84C` (aksen, progress bar, elemen aktif) — konsisten dengan dokumen-dokumen resmi RTLH lain yang sudah dibuat.
- **Tipografi:** `Fraunces` (display/heading), `Plus Jakarta Sans` (body/UI), `IBM Plex Mono` (angka/nilai uang, agar mudah dibaca dan sejajar/tabular).
- **Elemen signature:** Dua gauge radial (lingkaran) di dashboard untuk capaian keuangan dan capaian fisik — elemen paling dilihat pertama kali oleh admin.
- **Komponen reusable:** `StatusFisikBadge`, `StatusPembayaranBadge`, `ProgressBar` (linear, untuk baris tabel), `ProgressRadial` (untuk dashboard).
- Responsif dasar (bisa dibuka dari HP), fokus utama tetap desktop/laptop kantor.

---

## 9. Konvensi Kode (untuk AI coding agent)

- **Bahasa UI & penamaan domain:** Bahasa Indonesia (nama variabel domain seperti `nama_paket`, `nilai_kontrak` tetap dalam Bahasa Indonesia agar selaras dengan istilah pemerintahan; nama teknis/generic seperti `loading`, `error`, `handleSubmit` dalam Bahasa Inggris).
- **Struktur folder:**
  ```
  src/
    components/   -> komponen UI reusable, tidak fetch data sendiri
    pages/         -> 1 file per halaman/route, boleh fetch data
    contexts/      -> AuthContext, dsb.
    lib/           -> supabase client, helper murni
    types.ts       -> semua tipe & util perhitungan domain (mis. hitungStatusPembayaran)
  ```
- **State management:** cukup `useState`/`useEffect` bawaan React — jangan tambahkan Redux/Zustand untuk aplikasi sekecil ini kecuali kompleksitas bertambah signifikan.
- **Supabase client:** satu instance di `src/lib/supabase.ts`, di-import di mana pun perlu — jangan buat instance baru di tiap file.
- **Perhitungan status pembayaran** harus selalu lewat fungsi util (`hitungStatusPembayaran`), **jangan** duplikasi logika if/else di banyak komponen.
- **Format mata uang:** selalu pakai `Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' })` — jangan format manual dengan string replace.
- **Tidak menggunakan** library UI berat (mis. Flux, MUI) — cukup Tailwind utility classes agar ringan dan mudah di-maintain sendiri.
- **Environment variables:** wajib lewat `.env` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`), tidak pernah hardcode credential di kode.

---

## 10. Keamanan

- RLS Postgres aktif — akses data hanya untuk role `authenticated`.
- Tidak ada anon key yang memberi akses tulis ke tabel manapun.
- `.env` tidak boleh masuk ke version control (`.gitignore` sudah menangani ini).

---

## 11. Roadmap Pengembangan

**Fase 1 — MVP (selesai/sudah di-scaffold):**

- CRUD paket pekerjaan
- Dashboard capaian keuangan & fisik
- Login single-admin

**Fase 2 — Pelaporan:**

- Export daftar paket ke Excel/PDF untuk laporan ke pimpinan
- Filter & grafik capaian per kecamatan

**Fase 3 — Dokumentasi Lapangan:**

- Upload foto progres per paket (Supabase Storage)
- Riwayat termin pembayaran (bukan hanya total nilai terbayar)

**Fase 4 — Peningkatan Akses (jika dibutuhkan):**

- Multi-user dengan role (staf input vs pimpinan lihat-saja)
- Log aktivitas perubahan data (audit trail)

---

## 12. Kriteria Selesai (Definition of Done) — MVP

- [ ] Admin bisa login dan logout
- [ ] Admin bisa tambah, lihat, ubah, hapus paket pekerjaan
- [ ] Dashboard menampilkan capaian keuangan & fisik yang akurat dan real-time dari data di database
- [ ] Status pembayaran per paket dihitung otomatis, tidak bisa diinput manual yang bertentangan dengan nilai
- [ ] Data tidak bisa diakses tanpa login (RLS teruji)
