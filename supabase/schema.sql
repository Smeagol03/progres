-- 1. Buat tabel paket_pekerjaan
CREATE TABLE paket_pekerjaan (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kode_paket TEXT,
    nama_paket TEXT NOT NULL,
    sumber_dana TEXT, -- e.g. Reguler, Aspirasi, dll
    lokasi TEXT,
    kontraktor TEXT,
    pagu_anggaran NUMERIC(16,2) NOT NULL DEFAULT 0,
    nilai_kontrak NUMERIC(16,2) NOT NULL DEFAULT 0,
    nilai_terbayar NUMERIC(16,2) NOT NULL DEFAULT 0,
    tanggal_mulai DATE,
    tanggal_selesai DATE,
    catatan TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Buat fungsi untuk auto-update kolom 'updated_at'
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Pasang trigger ke tabel
CREATE TRIGGER set_paket_pekerjaan_updated_at
BEFORE UPDATE ON paket_pekerjaan
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- 4. Aktifkan Row Level Security (RLS)
ALTER TABLE paket_pekerjaan ENABLE ROW LEVEL SECURITY;

-- 5. Buat kebijakan (policy): Hanya admin (user yang login) yang bisa akses & ubah data
CREATE POLICY "Allow authenticated full access" 
ON paket_pekerjaan 
FOR ALL 
TO authenticated 
USING (true)
WITH CHECK (true);
