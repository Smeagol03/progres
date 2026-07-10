-- Tambahkan kolom pagu_anggaran ke tabel yang sudah ada
-- Jalankan query ini jika tabel sudah terlanjur dibuat sebelumnya

ALTER TABLE paket_pekerjaan 
ADD COLUMN IF NOT EXISTS pagu_anggaran NUMERIC(16,2) NOT NULL DEFAULT 0;

-- Ubah nilai_kontrak agar tidak wajib (bisa 0 jika belum berkontrak)
ALTER TABLE paket_pekerjaan 
ALTER COLUMN nilai_kontrak SET DEFAULT 0;
