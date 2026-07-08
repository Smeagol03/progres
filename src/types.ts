export type StatusFisik = 'belum_mulai' | 'proses' | 'selesai';
export type StatusPembayaran = 'belum_bayar' | 'sebagian' | 'lunas';

export interface PaketPekerjaan {
  id: string;
  kode_paket?: string | null;
  nama_paket: string;
  lokasi?: string | null;
  kontraktor?: string | null;
  nilai_kontrak: number;
  nilai_terbayar: number;
  status_fisik: StatusFisik;
  progres_fisik?: number | null;
  tanggal_mulai?: string | null;
  tanggal_selesai?: string | null;
  catatan?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CapaianProgram {
  total_paket: number;
  paket_selesai: number;
  paket_lunas: number;
  total_nilai_kontrak: number;
  total_nilai_terbayar: number;
  capaian_fisik_persen: number;
  capaian_keuangan_persen: number;
}
