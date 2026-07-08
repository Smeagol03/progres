import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { PaketPekerjaan } from '../types';
import { formatRupiah, hitungStatusPembayaran, cn } from '../lib/utils';
import { StatusBadge } from '../components/StatusBadge';
import { Plus, Edit2, Trash2, Search, Loader2 } from 'lucide-react';

export default function PaketList() {
  const [paketList, setPaketList] = useState<PaketPekerjaan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const fetchPaket = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('paket_pekerjaan')
      .select('*')
      .order('created_at', { ascending: false });
      
    if (data && !error) {
      setPaketList(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPaket();
  }, []);

  const handleDelete = async (id: string, nama: string) => {
    if (window.confirm(`Yakin ingin menghapus paket "${nama}"? Data yang dihapus tidak bisa dikembalikan.`)) {
      const { error } = await supabase.from('paket_pekerjaan').delete().eq('id', id);
      if (!error) {
        fetchPaket();
      } else {
        alert('Gagal menghapus data.');
      }
    }
  };

  const filteredPaket = paketList.filter(p => 
    p.nama_paket.toLowerCase().includes(search.toLowerCase()) || 
    p.lokasi?.toLowerCase().includes(search.toLowerCase()) ||
    p.kontraktor?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-navy font-display mb-2">Daftar Paket Pekerjaan</h1>
          <p className="text-gray-500">Kelola semua paket pekerjaan RTLH yang sedang berjalan</p>
        </div>
        <Link 
          to="/paket/baru"
          className="bg-navy hover:bg-navy-light text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center shrink-0"
        >
          <Plus className="w-4 h-4 mr-2" />
          Tambah Paket
        </Link>
      </div>
      
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          <div className="relative max-w-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-navy focus:border-navy text-sm outline-none bg-white transition-all"
              placeholder="Cari nama paket, lokasi, atau kontraktor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Table Container */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50/80 border-b border-gray-100">
              <tr>
                <th scope="col" className="px-6 py-4 font-semibold">Informasi Paket</th>
                <th scope="col" className="px-6 py-4 font-semibold">Pelaksana & Lokasi</th>
                <th scope="col" className="px-6 py-4 font-semibold text-right">Nilai Kontrak</th>
                <th scope="col" className="px-6 py-4 font-semibold text-center">Status</th>
                <th scope="col" className="px-6 py-4 font-semibold text-right">Progres Bayar</th>
                <th scope="col" className="px-6 py-4 font-semibold text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-navy mx-auto mb-2" />
                    <p className="text-gray-500">Memuat data...</p>
                  </td>
                </tr>
              ) : filteredPaket.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    Belum ada data paket pekerjaan yang ditemukan.
                  </td>
                </tr>
              ) : (
                filteredPaket.map((paket) => {
                  const statusBayar = hitungStatusPembayaran(Number(paket.nilai_kontrak), Number(paket.nilai_terbayar));
                  const persentaseBayar = Number(paket.nilai_kontrak) > 0 
                    ? (Number(paket.nilai_terbayar) / Number(paket.nilai_kontrak)) * 100 
                    : 0;

                  return (
                    <tr key={paket.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-navy group-hover:text-gold transition-colors">{paket.nama_paket}</div>
                        <div className="flex items-center gap-2 mt-1">
                          {paket.sumber_dana && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600">
                              {paket.sumber_dana}
                            </span>
                          )}
                          {paket.kode_paket && (
                            <span className="text-xs text-gray-400 font-mono">{paket.kode_paket}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-700">{paket.kontraktor || '-'}</div>
                        <div className="text-xs text-gray-500 mt-1">{paket.lokasi || '-'}</div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="font-mono font-medium text-navy">
                          {formatRupiah(Number(paket.nilai_kontrak))}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center space-y-2">
                        <div className="flex flex-col items-center gap-1.5">
                          <StatusBadge type="fisik" status={paket.status_fisik} />
                          <StatusBadge type="pembayaran" status={statusBayar} />
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col items-end">
                          <span className="font-mono text-xs font-semibold mb-1">
                            {formatRupiah(Number(paket.nilai_terbayar))}
                          </span>
                          <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className={cn(
                                "h-full rounded-full transition-all",
                                statusBayar === 'lunas' ? "bg-gold" : 
                                statusBayar === 'sebagian' ? "bg-orange-400" : "bg-red-400"
                              )} 
                              style={{ width: `${Math.min(persentaseBayar, 100)}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-gray-400 mt-1">{Math.round(persentaseBayar)}% terbayar</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center space-x-2">
                          <Link 
                            to={`/paket/${paket.id}`}
                            className="p-2 text-gray-400 hover:text-navy hover:bg-navy/5 rounded-lg transition-colors"
                            title="Ubah"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Link>
                          <button 
                            onClick={() => handleDelete(paket.id, paket.nama_paket)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Hapus"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
