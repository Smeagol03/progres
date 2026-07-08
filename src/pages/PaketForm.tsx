import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { PaketPekerjaan, StatusFisik } from '../types';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { cn, hitungStatusPembayaran } from '../lib/utils';

export default function PaketForm() {
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditing);
  
  const [formData, setFormData] = useState<Partial<PaketPekerjaan>>({
    nama_paket: '',
    kode_paket: '',
    lokasi: '',
    kontraktor: '',
    nilai_kontrak: 0,
    nilai_terbayar: 0,
    status_fisik: 'belum_mulai',
    progres_fisik: 0,
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
      <div className="mb-8 flex items-center">
        <Link 
          to="/paket" 
          className="mr-4 p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-500 hover:text-navy"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-navy font-display mb-1">
            {isEditing ? 'Ubah Paket Pekerjaan' : 'Tambah Paket Baru'}
          </h1>
          <p className="text-gray-500">
            {isEditing ? 'Perbarui informasi data paket yang sudah ada.' : 'Masukkan detail paket pekerjaan RTLH baru.'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-8 space-y-8">
          
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
                <label className="text-sm font-medium text-gray-700">Sumber Dana / DPA</label>
                <input
                  type="text"
                  name="sumber_dana"
                  value={formData.sumber_dana || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-navy focus:border-navy transition-all outline-none"
                  placeholder="Contoh: Reguler, Aspirasi"
                />
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
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Nilai Kontrak (Rp) <span className="text-red-500">*</span></label>
                <div className="relative">
                  <span className="absolute left-4 top-2 text-gray-500 font-mono">Rp</span>
                  <input
                    type="text"
                    name="nilai_kontrak"
                    required
                    value={formData.nilai_kontrak ? formData.nilai_kontrak.toLocaleString('id-ID') : ''}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setFormData(prev => ({ ...prev, nilai_kontrak: Number(val) }));
                    }}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-navy focus:border-navy transition-all outline-none font-mono"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Nilai Terbayar (Rp) <span className="text-red-500">*</span></label>
                <div className="relative">
                  <span className="absolute left-4 top-2 text-gray-500 font-mono">Rp</span>
                  <input
                    type="text"
                    name="nilai_terbayar"
                    required
                    value={formData.nilai_terbayar ? formData.nilai_terbayar.toLocaleString('id-ID') : ''}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setFormData(prev => ({ ...prev, nilai_terbayar: Number(val) }));
                    }}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-navy focus:border-navy transition-all outline-none font-mono"
                  />
                </div>
              </div>

              <div className="md:col-span-2 pt-2 flex items-center justify-between text-sm">
                <span className="text-gray-500">Status Pembayaran Otomatis:</span>
                <span className={cn(
                  "font-bold px-3 py-1 rounded-md",
                  statusPembayaran === 'lunas' ? "bg-gold/20 text-gold" :
                  statusPembayaran === 'sebagian' ? "bg-orange-100 text-orange-700" :
                  "bg-red-100 text-red-700"
                )}>
                  {statusPembayaran.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* Section: Progres Lapangan */}
          <div>
            <h3 className="text-lg font-medium text-navy border-b border-gray-100 pb-2 mb-4">Status & Progres Lapangan</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Status Fisik <span className="text-red-500">*</span></label>
                <select
                  name="status_fisik"
                  value={formData.status_fisik}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-navy focus:border-navy transition-all outline-none bg-white"
                >
                  <option value="belum_mulai">Belum Mulai</option>
                  <option value="proses">Dalam Proses</option>
                  <option value="selesai">Selesai 100%</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Persentase Fisik (%)</label>
                <input
                  type="number"
                  name="progres_fisik"
                  min="0"
                  max="100"
                  value={formData.progres_fisik || 0}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-navy focus:border-navy transition-all outline-none font-mono"
                  disabled={formData.status_fisik === 'selesai'}
                />
                <p className="text-xs text-gray-500">Abaikan jika status sudah Selesai (Otomatis 100%)</p>
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

        <div className="bg-gray-50 px-8 py-5 border-t border-gray-100 flex justify-end space-x-4">
          <Link 
            to="/paket"
            className="px-6 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-200 transition-colors"
          >
            Batal
          </Link>
          <button
            type="submit"
            disabled={loading}
            className={cn(
              "flex items-center px-6 py-2.5 rounded-lg text-sm font-medium text-white bg-navy hover:bg-navy-light transition-colors shadow-sm",
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
