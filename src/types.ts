export type StatusPembayaran = 'belum_kontrak' | 'belum_bayar' | 'sebagian' | 'lunas';

export interface PaketPekerjaan {
  id: string;
  kode_paket?: string | null;
  sumber_dana?: string | null;
  nama_paket: string;
  lokasi?: string | null;
  kontraktor?: string | null;
  pagu_anggaran: number;
  nilai_kontrak: number;
  nilai_terbayar: number;
  tanggal_mulai?: string | null;
  tanggal_selesai?: string | null;
  catatan?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CapaianProgram {
  total_paket: number;
  paket_lunas: number;
  paket_sebagian: number;
  paket_belum_bayar: number;
  paket_belum_kontrak: number;
  total_pagu_anggaran: number;
  total_nilai_kontrak: number;
  total_nilai_terbayar: number;
  capaian_keuangan_persen: number;
}
