-- ============================================================
-- LANGKAH 1: Migrasi Tabel (Tambah Kolom Pagu Anggaran)
-- Jalankan ini terlebih dahulu jika kolom belum ada
-- ============================================================

ALTER TABLE paket_pekerjaan 
ADD COLUMN IF NOT EXISTS pagu_anggaran NUMERIC(16,2) NOT NULL DEFAULT 0;

ALTER TABLE paket_pekerjaan 
ALTER COLUMN nilai_kontrak SET DEFAULT 0;


-- ============================================================
-- LANGKAH 2: Insert Data Dummy (Jika Tabel Masih Kosong)
-- Lewati bagian ini jika data dummy sudah pernah dimasukkan
-- ============================================================

INSERT INTO paket_pekerjaan (
    kode_paket, 
    nama_paket, 
    sumber_dana, 
    lokasi, 
    kontraktor, 
    pagu_anggaran,
    nilai_kontrak, 
    nilai_terbayar, 
    catatan
) VALUES 
-- 1. Paket Lunas (Selesai 100%)
(
    'RTLH-2026-001', 
    'Rehabilitasi RTLH Kelurahan Selong', 
    'Reguler', 
    'Kec. Selong, Kel. Selong', 
    'CV. Bangun Sentosa', 
    22000000.00,
    20000000.00, 
    20000000.00, 
    'Pekerjaan selesai tepat waktu tanpa kendala.'
),
-- 2. Paket Lunas (Selesai 100%)
(
    'RTLH-2026-002', 
    'Peningkatan Kualitas Rumah Desa Sukamulia', 
    'Aspirasi', 
    'Kec. Sukamulia', 
    'PT. Lombok Konstruksi', 
    55000000.00,
    50000000.00, 
    50000000.00, 
    'Pencairan termin terakhir berhasil.'
),
-- 3. Paket Sebagian (Sedang Berjalan)
(
    'RTLH-2026-003', 
    'Bantuan RTLH Desa Masbagik', 
    'Reguler', 
    'Kec. Masbagik', 
    'CV. Harapan Baru', 
    50000000.00,
    45000000.00, 
    15000000.00, 
    'Baru cair uang muka (DP) tahap 1.'
),
-- 4. Paket Sebagian (Hampir Selesai)
(
    'RTLH-2026-004', 
    'Perbaikan Rumah Warga Kurang Mampu', 
    'Reguler', 
    'Kec. Pringgabaya', 
    'Kelompok Swadaya Masyarakat (KSM)', 
    32000000.00,
    30000000.00, 
    25000000.00, 
    'Menunggu serah terima kunci untuk pembayaran sisa 5 juta.'
),
-- 5. Paket Belum Berkontrak (Proyek Baru)
(
    'RTLH-2026-005', 
    'Pembangunan RTLH Aspirasi Pokir', 
    'Aspirasi', 
    'Kec. Keruak', 
    NULL,
    25000000.00,
    0.00, 
    0.00, 
    'Dokumen kontrak baru saja ditandatangani, dalam proses pengajuan SP2D.'
);


-- ============================================================
-- LANGKAH 3: Update Pagu Anggaran (Jika Data Dummy Sudah Ada)
-- Jalankan ini jika data dummy sebelumnya SUDAH dimasukkan
-- tanpa kolom pagu_anggaran
-- ============================================================

UPDATE paket_pekerjaan SET pagu_anggaran = 22000000
WHERE kode_paket = 'RTLH-2026-001';

UPDATE paket_pekerjaan SET pagu_anggaran = 55000000
WHERE kode_paket = 'RTLH-2026-002';

UPDATE paket_pekerjaan SET pagu_anggaran = 50000000
WHERE kode_paket = 'RTLH-2026-003';

UPDATE paket_pekerjaan SET pagu_anggaran = 32000000
WHERE kode_paket = 'RTLH-2026-004';

UPDATE paket_pekerjaan SET pagu_anggaran = 25000000
WHERE kode_paket = 'RTLH-2026-005';
