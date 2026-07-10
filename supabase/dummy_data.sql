INSERT INTO paket_pekerjaan (
    kode_paket, 
    nama_paket, 
    sumber_dana, 
    lokasi, 
    kontraktor, 
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
    30000000.00, 
    25000000.00, 
    'Menunggu serah terima kunci untuk pembayaran sisa 5 juta.'
),

-- 5. Paket Belum Bayar (Proyek Baru)
(
    'RTLH-2026-005', 
    'Pembangunan RTLH Aspirasi Pokir', 
    'Aspirasi', 
    'Kec. Keruak', 
    'CV. Karya Mandiri', 
    25000000.00, 
    0.00, 
    'Dokumen kontrak baru saja ditandatangani, dalam proses pengajuan SP2D.'
);
