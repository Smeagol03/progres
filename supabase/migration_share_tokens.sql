-- 1. Tabel untuk menyimpan token akses read-only
CREATE TABLE share_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token TEXT NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
    label TEXT DEFAULT '',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_accessed_at TIMESTAMPTZ
);

ALTER TABLE share_tokens ENABLE ROW LEVEL SECURITY;

-- Policy: authenticated user bisa full akses (CRUD)
CREATE POLICY "Authenticated can manage share_tokens"
    ON share_tokens
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Policy: anon/public hanya bisa SELECT token yang aktif
CREATE POLICY "Anon can read active tokens"
    ON share_tokens
    FOR SELECT
    TO anon
    USING (is_active = true);

-- 2. Function untuk mengambil data paket_pekerjaan dengan token valid
CREATE OR REPLACE FUNCTION get_paket_pekerjaan_readonly(token_text TEXT)
RETURNS SETOF paket_pekerjaan
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM share_tokens WHERE token = token_text AND is_active = true) THEN
    -- Update last_accessed_at
    UPDATE share_tokens SET last_accessed_at = now() WHERE token = token_text;
    RETURN QUERY SELECT * FROM paket_pekerjaan ORDER BY created_at DESC;
  END IF;
END;
$$;

-- Grant execute to anon (public)
GRANT EXECUTE ON FUNCTION get_paket_pekerjaan_readonly TO anon;
GRANT EXECUTE ON FUNCTION get_paket_pekerjaan_readonly TO authenticated;
