import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useReadOnly } from "../contexts/ReadOnlyContext";
import type { PaketPekerjaan } from "../types";
import { formatRupiah, hitungStatusPembayaran, cn } from "../lib/utils";
import { StatusBadge } from "../components/StatusBadge";
import { Plus, Edit2, Trash2, Search, Loader2 } from "lucide-react";

export default function PaketList() {
  const { isReadOnly, token } = useReadOnly();
  const [paketList, setPaketList] = useState<PaketPekerjaan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sumberDanaFilter, setSumberDanaFilter] = useState<string>("all");

  const fetchPaket = useCallback(async () => {
    setLoading(true);

    let data: PaketPekerjaan[] | null = null;
    let error: any = null;

    if (isReadOnly) {
      const result = await supabase.rpc("get_paket_pekerjaan_readonly", { token_text: token });
      data = result.data as PaketPekerjaan[] | null;
      error = result.error;
    } else {
      const result = await supabase
        .from("paket_pekerjaan")
        .select("*")
        .order("created_at", { ascending: false });
      data = result.data;
      error = result.error;
    }

    if (data && !error) {
      setPaketList(data);
    }
    setLoading(false);
  }, [isReadOnly, token]);

  useEffect(() => {
    fetchPaket();
  }, [fetchPaket]);

  const handleDelete = async (id: string, nama: string) => {
    if (
      window.confirm(
        `Yakin ingin menghapus paket "${nama}"? Data yang dihapus tidak bisa dikembalikan.`,
      )
    ) {
      const { error } = await supabase
        .from("paket_pekerjaan")
        .delete()
        .eq("id", id);
      if (!error) {
        fetchPaket();
      } else {
        alert("Gagal menghapus data.");
      }
    }
  };

  const uniqueSumberDana = Array.from(
    new Set(paketList.map((p) => p.sumber_dana).filter(Boolean)),
  ) as string[];

  const filteredPaket = paketList.filter((p) => {
    const matchesSearch =
      p.nama_paket.toLowerCase().includes(search.toLowerCase()) ||
      p.lokasi?.toLowerCase().includes(search.toLowerCase()) ||
      p.kontraktor?.toLowerCase().includes(search.toLowerCase());

    const statusBayar = hitungStatusPembayaran(
      Number(p.nilai_kontrak),
      Number(p.nilai_terbayar),
    );
    const matchesStatus =
      statusFilter === "all" || statusBayar === statusFilter;
    const matchesSumberDana =
      sumberDanaFilter === "all" || p.sumber_dana === sumberDanaFilter;

    return matchesSearch && matchesStatus && matchesSumberDana;
  });

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-hidden">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-6 md:mb-8 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-navy font-display mb-2">
            Daftar Paket Pekerjaan
          </h1>
          <p className="text-sm md:text-base text-gray-500">
            Kelola semua paket pekerjaan RTLH yang sedang berjalan
          </p>
        </div>
        {!isReadOnly && (
          <Link
            to="/paket/baru"
            className="bg-navy hover:bg-navy-light text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center shrink-0"
          >
            <Plus className="w-4 h-4 mr-2" />
            Tambah Paket
          </Link>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row gap-3 min-w-0">
          <div className="relative flex-1 min-w-0">
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

          <div className="flex gap-2 flex-wrap min-w-0">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-navy outline-none text-gray-700 max-w-[45vw] truncate"
            >
              <option value="all">Semua Status</option>
              <option value="lunas">Selesai (Lunas)</option>
              <option value="sebagian">Proses Bayar</option>
              <option value="belum_bayar">Belum Bayar</option>
              <option value="belum_kontrak">Belum Berkontrak</option>
            </select>

            <select
              value={sumberDanaFilter}
              onChange={(e) => setSumberDanaFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-navy outline-none text-gray-700 max-w-[45vw] truncate"
            >
              <option value="all">Semua Sumber Dana</option>
              {uniqueSumberDana.map((sd) => (
                <option key={sd} value={sd}>
                  {sd}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-navy mx-auto" />
          </div>
        )}

        {/* Empty state */}
        {!loading && filteredPaket.length === 0 && (
          <div className="py-12 text-center text-gray-500">
            Belum ada data paket pekerjaan yang ditemukan.
          </div>
        )}

        {/* Desktop Table (hidden on small screens) */}
        {!loading && filteredPaket.length > 0 && (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="text-xs text-gray-500 uppercase bg-gray-50/80 border-b border-gray-100">
                  <tr>
                    <th scope="col" className="px-6 py-4 font-semibold">
                      Informasi Paket
                    </th>
                    <th scope="col" className="px-6 py-4 font-semibold">
                      Pelaksana & Lokasi
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-4 font-semibold text-right"
                    >
                      Nilai Kontrak
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-4 font-semibold text-center"
                    >
                      Status
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-4 font-semibold text-right"
                    >
                      Progres Pembayaran
                    </th>
                    {!isReadOnly && (
                      <th
                        scope="col"
                        className="px-6 py-4 font-semibold text-center"
                      >
                        Aksi
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredPaket.map((paket) => {
                    const statusBayar = hitungStatusPembayaran(
                      Number(paket.nilai_kontrak),
                      Number(paket.nilai_terbayar),
                    );
                    const persentaseBayar =
                      Number(paket.nilai_kontrak) > 0
                        ? (Number(paket.nilai_terbayar) /
                            Number(paket.nilai_kontrak)) *
                          100
                        : 0;

                    return (
                      <tr
                        key={paket.id}
                        className="hover:bg-gray-50/50 transition-colors group"
                      >
                        <td className="px-6 py-4">
                          <div className="font-semibold text-navy group-hover:text-gold transition-colors">
                            {paket.nama_paket}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            {paket.sumber_dana && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600">
                                {paket.sumber_dana}
                              </span>
                            )}
                            {paket.kode_paket && (
                              <span className="text-xs text-gray-400 font-mono">
                                {paket.kode_paket}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-700">
                            {paket.kontraktor || "-"}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {paket.lokasi || "-"}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="font-mono font-medium text-navy">
                            {formatRupiah(Number(paket.nilai_kontrak))}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <StatusBadge status={statusBayar} />
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
                                  statusBayar === "lunas"
                                    ? "bg-gold"
                                    : statusBayar === "sebagian"
                                      ? "bg-orange-400"
                                      : "bg-red-400",
                                )}
                                style={{
                                  width: `${Math.min(persentaseBayar, 100)}%`,
                                }}
                              />
                            </div>
                            <span className="text-[10px] text-gray-400 mt-1">
                              {Math.round(persentaseBayar)}% selesai
                            </span>
                          </div>
                        </td>
                        {!isReadOnly && (
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
                                onClick={() =>
                                  handleDelete(paket.id, paket.nama_paket)
                                }
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Hapus"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards (shown on small screens) */}
            <div className="md:hidden divide-y divide-gray-100">
              {filteredPaket.map((paket) => {
                const statusBayar = hitungStatusPembayaran(
                  Number(paket.nilai_kontrak),
                  Number(paket.nilai_terbayar),
                );
                const persentaseBayar =
                  Number(paket.nilai_kontrak) > 0
                    ? (Number(paket.nilai_terbayar) /
                        Number(paket.nilai_kontrak)) *
                      100
                    : 0;

                return (
                  <div
                    key={paket.id}
                    className="p-4 hover:bg-gray-50/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="min-w-0 flex-1 mr-2">
                        <h3 className="font-semibold text-navy text-sm truncate">
                          {paket.nama_paket}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          {paket.sumber_dana && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600">
                              {paket.sumber_dana}
                            </span>
                          )}
                          {paket.lokasi && (
                            <span className="text-xs text-gray-400 truncate">
                              {paket.lokasi}
                            </span>
                          )}
                        </div>
                      </div>
                      <StatusBadge status={statusBayar} />
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                      <div>
                        <span className="text-gray-400">Kontraktor:</span>
                        <span className="ml-1 text-gray-700 font-medium">
                          {paket.kontraktor || "-"}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-gray-400">Kontrak:</span>
                        <span className="ml-1 font-mono font-medium text-navy">
                          {formatRupiah(Number(paket.nilai_kontrak))}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            statusBayar === "lunas"
                              ? "bg-gold"
                              : statusBayar === "sebagian"
                                ? "bg-orange-400"
                                : "bg-red-400",
                          )}
                          style={{
                            width: `${Math.min(persentaseBayar, 100)}%`,
                          }}
                        />
                      </div>
                      <span className="font-mono text-xs text-gray-500">
                        {Math.round(persentaseBayar)}%
                      </span>
                    </div>

                    {!isReadOnly && (
                      <div className="flex items-center justify-end gap-3">
                        <Link
                          to={`/paket/${paket.id}`}
                          className="inline-flex items-center text-xs font-medium text-navy hover:text-gold transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5 mr-1" />
                          Ubah
                        </Link>
                        <button
                          onClick={() => handleDelete(paket.id, paket.nama_paket)}
                          className="inline-flex items-center text-xs font-medium text-red-500 hover:text-red-700 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-1" />
                          Hapus
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
