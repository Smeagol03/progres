import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link, Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useReadOnly } from '../contexts/ReadOnlyContext';
import type { PaketPekerjaan } from '../types';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { cn, hitungStatusPembayaran } from '../lib/utils';

export default function PaketForm() {
  const { isReadOnly } = useReadOnly();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const navigate = useNavigate();

  if (isReadOnly) {
    return <Navigate to="/paket" replace />;
  }

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditing);
  
  const [formData, setFormData] = useState<Partial<PaketPekerjaan>>({
    nama_paket: '',
    kode_paket: '',
    sumber_dana: 'Reguler',
    lokasi: '',
    kontraktor: '',
    pagu_anggaran: 0,
    nilai_kontrak: 0,
    nilai_terbayar: 0,
    catatan: '',
  });

  useEffect(() => {
    async function fetchPaket() {
      if (!id) return;
      const { data, error } = await supabase
        .from('paket_pekerjaan')
        .select('*')
        .eq('id', id)
        .single();

      if (data && !error) {
        setFormData(data);
      } else {
        alert('Gagal mengambil data paket atau paket tidak ditemukan.');
        navigate('/paket');
      }
      setInitialLoading(false);
    }
    fetchPaket();
  }, [id, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isEditing) {
        const { error } = await supabase
          .from('paket_pekerjaan')
          .update(formData)
          .eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('paket_pekerjaan')
          .insert([formData]);
        if (error) throw error;
      }
      
      navigate('/paket');
    } catch (err: any) {
      alert(`Gagal menyimpan data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="w-8 h-8 text-navy animate-spin" />
      </div>
    );
  }

  // Calculate realtime status for preview
  const statusPembayaran = hitungStatusPembayaran(
    Number(formData.nilai_kontrak) || 0, 
    Number(formData.nilai_terbayar) || 0
  );

  return (
    <div className="animate-in fade-in duration-500 max-w-3xl mx-auto">
      <div className="mb-6 md:mb-8 flex items-start">
        <Link 
          to="/paket" 
          className="mr-3 md:mr-4 p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-500 hover:text-navy shrink-0 mt-1"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="min-w-0">
          <h1 className="text-2xl md:text-3xl font-bold text-navy font-display mb-1">
            {isEditing ? 'Ubah Paket Pekerjaan' : 'Tambah Paket Baru'}
          </h1>
          <p className="text-sm md:text-base text-gray-500">
            {isEditing ? 'Perbarui informasi data paket yang sudah ada.' : 'Masukkan detail paket pekerjaan RTLH baru.'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 md:p-8 space-y-6 md:space-y-8">
          
          {/* Section: Informasi Dasar */}
          <div>
            <h3 className="text-lg font-medium text-navy border-b border-gray-100 pb-2 mb-4">Informasi Utama</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-gray-700">Nama Paket <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="nama_paket"
                  required
                  value={formData.nama_paket || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-navy focus:border-navy transition-all outline-none"
                  placeholder="Contoh: Pembangunan RTLH Desa ABC"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Kode Paket (Opsional)</label>
                <input
                  type="text"
                  name="kode_paket"
                  value={formData.kode_paket || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-navy focus:border-navy transition-all outline-none"
                  placeholder="Contoh: PKT-2026-01"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Sumber Dana / DPA <span className="text-red-500">*</span></label>
                <select
                  name="sumber_dana"
                  value={formData.sumber_dana || 'Reguler'}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-navy focus:border-navy transition-all outline-none bg-white"
                >
                  <option value="Reguler">Reguler</option>
                  <option value="Aspirasi">Aspirasi</option>
                </select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-gray-700">Lokasi / Desa</label>
                <input
                  type="text"
                  name="lokasi"
                  value={formData.lokasi || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-navy focus:border-navy transition-all outline-none"
                  placeholder="Kecamatan / Desa"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-gray-700">Pelaksana / Kontraktor</label>
                <input
                  type="text"
                  name="kontraktor"
                  value={formData.kontraktor || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-navy focus:border-navy transition-all outline-none"
                  placeholder="Nama CV / PT Pelaksana"
                />
              </div>
            </div>
          </div>

          {/* Section: Keuangan */}
          <div>
            <h3 className="text-lg font-medium text-navy border-b border-gray-100 pb-2 mb-4">Informasi Keuangan</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50/50 p-6 rounded-xl border border-gray-100">

              {/* Pagu Anggaran - full width */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-gray-700">
                  Pagu Anggaran (Rp) <span className="text-red-500">*</span>
                  <span className="ml-2 text-xs text-gray-400 font-normal">— Total anggaran di DPA sebelum kontrak</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-2 text-gray-500 font-mono">Rp</span>
                  <input
                    type="text"
                    name="pagu_anggaran"
                    required
                    value={formData.pagu_anggaran ? formData.pagu_anggaran.toLocaleString('id-ID') : ''}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setFormData(prev => ({ ...prev, pagu_anggaran: Number(val) }));
                    }}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-navy focus:border-navy transition-all outline-none font-mono text-lg font-semibold"
                    placeholder="Contoh: 140.000.000"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Nilai Kontrak (Rp)
                  <span className="ml-2 text-xs text-gray-400 font-normal">— Kosongkan jika belum berkontrak</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-2 text-gray-500 font-mono">Rp</span>
                  <input
                    type="text"
                    name="nilai_kontrak"
                    value={formData.nilai_kontrak ? formData.nilai_kontrak.toLocaleString('id-ID') : ''}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setFormData(prev => ({ ...prev, nilai_kontrak: Number(val) }));
                    }}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-navy focus:border-navy transition-all outline-none font-mono"
                    placeholder="0 jika belum berkontrak"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Nilai Terbayar (Rp)
                  <span className="ml-2 text-xs text-gray-400 font-normal">— Total uang yang sudah cair</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-2 text-gray-500 font-mono">Rp</span>
                  <input
                    type="text"
                    name="nilai_terbayar"
                    value={formData.nilai_terbayar ? formData.nilai_terbayar.toLocaleString('id-ID') : ''}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setFormData(prev => ({ ...prev, nilai_terbayar: Number(val) }));
                    }}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-navy focus:border-navy transition-all outline-none font-mono"
                    placeholder="0 jika belum ada pembayaran"
                  />
                </div>
              </div>

              {/* Status & Efisiensi Preview */}
              <div className="md:col-span-2 border-t border-gray-200 pt-4 mt-2 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                <div className="flex items-center justify-between sm:justify-start gap-2">
                  <span className="text-xs sm:text-sm text-gray-500">Status:</span>
                  <span className={cn(
                    "font-bold text-xs px-3 py-1 rounded-full border shrink-0",
                    statusPembayaran === 'lunas' ? "bg-gold/10 text-gold border-gold/20" :
                    statusPembayaran === 'sebagian' ? "bg-orange-50 text-orange-700 border-orange-200" :
                    statusPembayaran === 'belum_bayar' ? "bg-red-50 text-red-700 border-red-200" :
                    "bg-gray-100 text-gray-600 border-gray-200"
                  )}>
                    {statusPembayaran === 'lunas' ? 'Selesai (Lunas)' :
                     statusPembayaran === 'sebagian' ? 'Proses Bayar' :
                     statusPembayaran === 'belum_bayar' ? 'Belum Bayar' : 'Belum Berkontrak'}
                  </span>
                </div>
                <div className="flex items-center justify-between sm:justify-start gap-2">
                  <span className="text-xs sm:text-sm text-gray-500">Efisiensi:</span>
                  <span className="font-mono font-semibold text-xs sm:text-sm text-emerald-600">
                    {formData.pagu_anggaran && formData.nilai_kontrak
                      ? `Rp ${(Number(formData.pagu_anggaran) - Number(formData.nilai_kontrak)).toLocaleString('id-ID')}`
                      : '-'}
                  </span>
                </div>
              </div>

            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Catatan Tambahan</label>
            <textarea
              name="catatan"
              rows={3}
              value={formData.catatan || ''}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-navy focus:border-navy transition-all outline-none resize-none"
              placeholder="Catatan kendala lapangan, dll..."
            />
          </div>
        </div>

        <div className="bg-gray-50 px-4 md:px-8 py-4 md:py-5 border-t border-gray-100 flex flex-col-reverse sm:flex-row justify-end gap-3 sm:gap-4">
          <Link 
            to="/paket"
            className="px-6 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-200 transition-colors text-center"
          >
            Batal
          </Link>
          <button
            type="submit"
            disabled={loading}
            className={cn(
              "flex items-center justify-center px-6 py-2.5 rounded-lg text-sm font-medium text-white bg-navy hover:bg-navy-light transition-colors shadow-sm",
              loading && "opacity-70 cursor-not-allowed"
            )}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Simpan Data
          </button>
        </div>
      </form>
    </div>
  );
}
