import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useReadOnly } from "../contexts/ReadOnlyContext";
import type { PaketPekerjaan, CapaianProgram, SumberDanaInfo } from "../types";
import { formatRupiah, hitungStatusPembayaran } from "../lib/utils";
import { ProgressRadial } from "../components/ProgressRadial";
import { StatCard } from "../components/StatCard";
import StatusStackedBar from "../components/StatusStackedBar";
import {
  Briefcase,
  Wallet,
  Banknote,
  AlertCircle,
  TrendingUp,
  BadgeCheck,
  ArrowUpRight,
  FileText,
  FileSpreadsheet,
} from "lucide-react";
import { Link } from "react-router-dom";
import { exportDashboardPDF } from "../utils/exportPdf";
import { exportDashboardExcel } from "../utils/exportExcel";

function useWindowWidth() {
  const [width, setWidth] = useState(window.innerWidth);
  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  return width;
}

function hitungSumberDana(paketList: PaketPekerjaan[], sumber: string): SumberDanaInfo {
  const filtered = paketList.filter(p => (p.sumber_dana || '').toLowerCase() === sumber.toLowerCase());
  const total_paket = filtered.length;

  let paket_lunas = 0, paket_sebagian = 0, paket_belum_bayar = 0, paket_belum_kontrak = 0;
  for (const p of filtered) {
    const status = hitungStatusPembayaran(Number(p.nilai_kontrak), Number(p.nilai_terbayar));
    if (status === "lunas") paket_lunas++;
    else if (status === "sebagian") paket_sebagian++;
    else if (status === "belum_bayar") paket_belum_bayar++;
    else paket_belum_kontrak++;
  }

  const total_pagu = filtered.reduce((s, p) => s + Number(p.pagu_anggaran || 0), 0);
  const total_kontrak = filtered.reduce((s, p) => s + Number(p.nilai_kontrak || 0), 0);
  const total_terbayar = filtered.reduce((s, p) => s + Number(p.nilai_terbayar || 0), 0);
  const capaian_persen = total_kontrak > 0 ? (total_terbayar / total_kontrak) * 100 : 0;

  return { total_paket, total_pagu, total_kontrak, total_terbayar, capaian_persen, paket_lunas, paket_sebagian, paket_belum_bayar, paket_belum_kontrak };
}

const emptySumber: SumberDanaInfo = {
  total_paket: 0, total_pagu: 0, total_kontrak: 0, total_terbayar: 0, capaian_persen: 0,
  paket_lunas: 0, paket_sebagian: 0, paket_belum_bayar: 0, paket_belum_kontrak: 0,
};

const defaultData: CapaianProgram = {
  total_paket: 0, paket_lunas: 0, paket_sebagian: 0, paket_belum_bayar: 0, paket_belum_kontrak: 0,
  total_pagu_anggaran: 0, total_nilai_kontrak: 0, total_nilai_terbayar: 0, capaian_keuangan_persen: 0,
  reguler: emptySumber, aspirasi: emptySumber,
};

export default function Dashboard() {
  const { isReadOnly, token } = useReadOnly();
  const [data, setData] = useState<CapaianProgram>(defaultData);
  const [topUnpaid, setTopUnpaid] = useState<PaketPekerjaan[]>([]);
  const [paketList, setPaketList] = useState<PaketPekerjaan[]>([]);
  const [exporting, setExporting] = useState<'pdf' | 'excel' | null>(null);
  const [loading, setLoading] = useState(true);
  const windowWidth = useWindowWidth();
  const radialSize = windowWidth < 480 ? 170 : windowWidth < 768 ? 200 : 240;

  useEffect(() => {
    async function fetchDashboardData() {
      let paketList: PaketPekerjaan[] | null = null;
      let error: any = null;

      if (isReadOnly) {
        const result = await supabase.rpc("get_paket_pekerjaan_readonly", {
          token_text: token,
        });
        paketList = result.data as PaketPekerjaan[] | null;
        error = result.error;
      } else {
        const result = await supabase.from("paket_pekerjaan").select("*");
        paketList = result.data;
        error = result.error;
      }

      if (!error && paketList) {
        const total_paket = paketList.length;

        let paket_lunas = 0, paket_sebagian = 0, paket_belum_bayar = 0, paket_belum_kontrak = 0;
        for (const p of paketList) {
          const status = hitungStatusPembayaran(Number(p.nilai_kontrak), Number(p.nilai_terbayar));
          if (status === "lunas") paket_lunas++;
          else if (status === "sebagian") paket_sebagian++;
          else if (status === "belum_bayar") paket_belum_bayar++;
          else paket_belum_kontrak++;
        }

        const total_pagu_anggaran = paketList.reduce((s, p) => s + Number(p.pagu_anggaran || 0), 0);
        const total_nilai_kontrak = paketList.reduce((s, p) => s + Number(p.nilai_kontrak || 0), 0);
        const total_nilai_terbayar = paketList.reduce((s, p) => s + Number(p.nilai_terbayar || 0), 0);
        const capaian_keuangan_persen = total_nilai_kontrak > 0 ? (total_nilai_terbayar / total_nilai_kontrak) * 100 : 0;

        const reguler = hitungSumberDana(paketList, 'reguler');
        const aspirasi = hitungSumberDana(paketList, 'aspirasi');

        setData({
          total_paket, paket_lunas, paket_sebagian, paket_belum_bayar, paket_belum_kontrak,
          total_pagu_anggaran, total_nilai_kontrak, total_nilai_terbayar, capaian_keuangan_persen,
          reguler, aspirasi,
        });
        setPaketList(paketList);

        const unpaidList = paketList
          .filter(p => Number(p.nilai_kontrak) > 0 && Number(p.nilai_terbayar) < Number(p.nilai_kontrak))
          .sort((a, b) => (Number(b.nilai_kontrak) - Number(b.nilai_terbayar)) - (Number(a.nilai_kontrak) - Number(a.nilai_terbayar)))
          .slice(0, 5);

        setTopUnpaid(unpaidList);
      }
      setLoading(false);
    }

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy"></div>
      </div>
    );
  }

  const stackData = [
    { label: "Selesai (Lunas)", count: data.paket_lunas, status: "lunas" as const, color: "bg-gold", bgColor: "bg-gold/10" },
    { label: "Proses Bayar", count: data.paket_sebagian, status: "sebagian" as const, color: "bg-orange-400", bgColor: "bg-orange-50" },
    { label: "Belum Bayar", count: data.paket_belum_bayar, status: "belum_bayar" as const, color: "bg-red-400", bgColor: "bg-red-50" },
    { label: "Belum Kontrak", count: data.paket_belum_kontrak, status: "belum_kontrak" as const, color: "bg-gray-300", bgColor: "bg-gray-50" },
  ];

  function SourceCard({ title, src, color }: { title: string; src: SumberDanaInfo; color: string }) {
    const terkontrak = src.total_paket - src.paket_belum_kontrak;
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className={`w-1 h-5 md:h-6 ${color} rounded-full shrink-0`} />
          <h3 className="font-display font-bold text-navy text-sm md:text-base">{title}</h3>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-gray-50 rounded-xl p-3 min-w-0">
            <p className="text-[10px] text-gray-500 mb-0.5">Total Paket</p>
            <p className="font-mono font-bold text-navy text-base md:text-lg">{src.total_paket}</p>
          </div>
          <div className="bg-blue-50 rounded-xl p-3 min-w-0">
            <p className="text-[10px] text-gray-500 mb-0.5">Sudah Terkontrak</p>
            <p className="font-mono font-bold text-blue-700 text-base md:text-lg">
              {terkontrak}
              <span className="text-blue-400 text-xs ml-1">
                {src.total_paket > 0 ? `dari ${src.total_paket}` : ''}
              </span>
            </p>
            {src.paket_belum_kontrak > 0 && (
              <p className="text-[10px] text-gray-400">
                {src.paket_belum_kontrak} paket belum berkontrak
              </p>
            )}
          </div>

          {/* Status row - only show if some are contracted */}
          {terkontrak > 0 && (
            <div className="col-span-2 flex gap-2">
              <div className="flex-1 bg-gold/10 rounded-lg p-2 text-center min-w-0">
                <p className="text-[10px] text-gray-500">Lunas</p>
                <p className="font-mono font-bold text-gold text-sm">{src.paket_lunas}</p>
              </div>
              <div className="flex-1 bg-orange-50 rounded-lg p-2 text-center min-w-0">
                <p className="text-[10px] text-gray-500">Proses</p>
                <p className="font-mono font-bold text-orange-600 text-sm">{src.paket_sebagian}</p>
              </div>
              <div className="flex-1 bg-red-50 rounded-lg p-2 text-center min-w-0">
                <p className="text-[10px] text-gray-500">Belum Bayar</p>
                <p className="font-mono font-bold text-red-600 text-sm">{src.paket_belum_bayar}</p>
              </div>
            </div>
          )}

          <div className="bg-gray-50 rounded-xl p-3 min-w-0 col-span-2">
            <p className="text-[10px] text-gray-500 mb-0.5">Total Pagu</p>
            <p className="font-mono font-bold text-navy text-sm md:text-base truncate">{formatRupiah(src.total_pagu)}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 min-w-0">
            <p className="text-[10px] text-gray-500 mb-0.5">Nilai Kontrak</p>
            <p className="font-mono font-bold text-navy text-sm md:text-base truncate">{formatRupiah(src.total_kontrak)}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 min-w-0">
            <p className="text-[10px] text-gray-500 mb-0.5">Sudah Terbayar</p>
            <p className="font-mono font-bold text-navy text-sm md:text-base truncate">{formatRupiah(src.total_terbayar)}</p>
          </div>
        </div>

        <div className="bg-gray-50/80 rounded-xl p-3">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] text-gray-500">Capaian Pembayaran</p>
            <p className={`font-mono font-bold text-sm ${src.capaian_persen > 0 ? 'text-gold' : 'text-gray-400'}`}>
              {Math.round(src.capaian_persen)}%
            </p>
          </div>
          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${src.capaian_persen > 0 ? 'bg-gold' : 'bg-gray-200'}`}
              style={{ width: `${Math.min(src.capaian_persen, 100)}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 overflow-hidden">
      {/* ─── Header ─── */}
      <div className="mb-6 md:mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-gold shrink-0" />
            <h1 className="text-xl md:text-3xl font-bold text-navy font-display truncate">
              Dashboard Capaian
            </h1>
          </div>
          <p className="text-gray-500 text-xs md:text-base">
            Ringkasan progres program RTLH Kab. Lombok Timur
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <div className="flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-navy/5 rounded-xl">
            <BadgeCheck className="w-3.5 h-3.5 md:w-4 md:h-4 text-gold shrink-0" />
            <span className="text-[10px] md:text-xs font-semibold text-navy whitespace-nowrap">
              {data.total_paket} Paket Pekerjaan
            </span>
          </div>
          <button
            onClick={async () => {
              setExporting('pdf')
              try { exportDashboardPDF(data, paketList) }
              finally { setExporting(null) }
            }}
            disabled={exporting !== null}
            className="flex items-center gap-1.5 px-3 md:px-4 py-1.5 md:py-2 bg-gold/10 hover:bg-gold/20 disabled:opacity-50 rounded-xl transition-colors shrink-0"
          >
            <FileText className="w-3.5 h-3.5 md:w-4 md:h-4 text-gold shrink-0" />
            <span className="text-[10px] md:text-xs font-semibold text-gold whitespace-nowrap">
              {exporting === 'pdf' ? 'Memproses...' : 'Export PDF'}
            </span>
          </button>
          <button
            onClick={async () => {
              setExporting('excel')
              try { await exportDashboardExcel(data, paketList) }
              finally { setExporting(null) }
            }}
            disabled={exporting !== null}
            className="flex items-center gap-1.5 px-3 md:px-4 py-1.5 md:py-2 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-50 rounded-xl transition-colors shrink-0"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 md:w-4 md:h-4 text-emerald-600 shrink-0" />
            <span className="text-[10px] md:text-xs font-semibold text-emerald-600 whitespace-nowrap">
              {exporting === 'excel' ? 'Memproses...' : 'Export Excel'}
            </span>
          </button>
        </div>
      </div>

      {/* ─── Ringkasan Reguler vs Aspirasi ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-8">
        <SourceCard title="Reguler" src={data.reguler} color="bg-navy" />
        <SourceCard title="Aspirasi" src={data.aspirasi} color="bg-gold" />
      </div>

      {/* ─── Radial Progress (Keseluruhan) ─── */}
      <div className="bg-white rounded-3xl p-6 md:p-8 mb-8 border border-gray-100 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-gold/5 rounded-full -translate-y-1/3 translate-x-1/3 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-navy/5 rounded-full translate-y-1/3 -translate-x-1/3 blur-3xl" />

        <div className="relative z-10 flex flex-col lg:flex-row items-center gap-6 lg:gap-12">
          <div className="flex flex-col items-center text-center shrink-0">
            <ProgressRadial
              progress={data.capaian_keuangan_persen}
              label="Capaian Keseluruhan"
              colorClass="text-gold"
              size={radialSize}
            />
          </div>

          <div className="flex-1 w-full min-w-0 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-navy/5 rounded-xl p-3 md:p-4 min-w-0">
                <p className="text-[10px] md:text-xs text-gray-500 mb-1">Total Pagu</p>
                <p className="font-mono font-bold text-navy text-sm md:text-lg truncate">
                  {formatRupiah(data.total_pagu_anggaran)}
                </p>
              </div>
              <div className="bg-emerald-50 rounded-xl p-3 md:p-4 min-w-0">
                <p className="text-[10px] md:text-xs text-gray-500 mb-1">Sisa Pagu</p>
                <p className="font-mono font-bold text-emerald-600 text-sm md:text-lg truncate">
                  {formatRupiah(data.total_pagu_anggaran - data.total_nilai_kontrak)}
                </p>
              </div>
              <div className="bg-navy/5 rounded-xl p-3 md:p-4 min-w-0">
                <p className="text-[10px] md:text-xs text-gray-500 mb-1">Nilai Kontrak</p>
                <p className="font-mono font-bold text-navy text-sm md:text-lg truncate">
                  {formatRupiah(data.total_nilai_kontrak)}
                </p>
              </div>
              <div className="bg-navy/5 rounded-xl p-3 md:p-4 min-w-0">
                <p className="text-[10px] md:text-xs text-gray-500 mb-1">Sudah Terbayar</p>
                <p className="font-mono font-bold text-navy text-sm md:text-lg truncate">
                  {formatRupiah(data.total_nilai_terbayar)}
                </p>
              </div>
            </div>

            <div className="bg-gold/10 rounded-xl p-3 md:p-4 min-w-0">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[10px] md:text-xs text-gray-500">Realisasi Pembayaran dari Nilai Kontrak</p>
                <p className="font-mono font-bold text-gold text-sm md:text-base">
                  {Math.round(data.capaian_keuangan_persen)}%
                </p>
              </div>
              <div className="h-3 md:h-4 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gold rounded-full transition-all duration-1000"
                  style={{ width: `${Math.min(data.capaian_keuangan_persen, 100)}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-navy/[0.04] rounded-xl p-3 md:p-4 min-w-0">
                <p className="text-[10px] text-gray-500 mb-0.5">Reguler</p>
                <p className="font-mono font-bold text-navy text-sm truncate">{formatRupiah(data.reguler.total_terbayar)}</p>
                <p className="text-[10px] text-gray-400">
                  dari kontrak {formatRupiah(data.reguler.total_kontrak)}
                </p>
              </div>
              <div className="bg-gold/[0.06] rounded-xl p-3 md:p-4 min-w-0">
                <p className="text-[10px] text-gray-500 mb-0.5">Aspirasi</p>
                <p className="font-mono font-bold text-gold text-sm truncate">{formatRupiah(data.aspirasi.total_terbayar)}</p>
                <p className="text-[10px] text-gray-400">
                  dari kontrak {formatRupiah(data.aspirasi.total_kontrak)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Stat Cards ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
        <StatCard
          title="Total Paket"
          value={data.total_paket}
          icon={<Briefcase className="w-5 h-5" />}
        />
        <StatCard
          title="Selesai (Lunas)"
          value={data.paket_lunas}
          icon={<Wallet className="w-5 h-5" />}
          description={
            data.total_paket > 0
              ? `${Math.round((data.paket_lunas / data.total_paket) * 100)}% dari total`
              : undefined
          }
        />
        <StatCard
          title="Total Pagu"
          value={formatRupiah(data.total_pagu_anggaran)}
          icon={<Banknote className="w-5 h-5" />}
        />
        <StatCard
          title="Total Terbayar"
          value={formatRupiah(data.total_nilai_terbayar)}
          icon={<ArrowUpRight className="w-5 h-5" />}
          description={
            data.total_nilai_kontrak > 0
              ? `${Math.round(data.capaian_keuangan_persen)}% dari kontrak`
              : undefined
          }
        />
      </div>

      {/* ─── Status Distribution ─── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-6 mb-8">
        <div className="flex items-center gap-2 mb-4 md:mb-5">
          <div className="w-1 h-5 md:h-6 bg-gold rounded-full shrink-0" />
          <h2 className="text-base md:text-lg font-display font-bold text-navy">
            Distribusi Status Paket
          </h2>
        </div>
        <StatusStackedBar data={stackData} total={data.total_paket} />
      </div>

      {/* ─── Priority List ─── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 md:p-6 border-b border-gray-100 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 md:gap-2 min-w-0">
            <AlertCircle className="w-4 h-4 md:w-5 md:h-5 text-red-500 shrink-0" />
            <h2 className="text-sm md:text-lg font-display font-bold text-navy truncate">
              Perhatian: Sisa Tagihan Terbesar
            </h2>
          </div>
          {topUnpaid.length > 0 && (
            <Link
              to="/paket"
              className="text-[10px] md:text-xs font-medium text-navy hover:text-gold transition-colors shrink-0"
            >
              Lihat semua →
            </Link>
          )}
        </div>

        {topUnpaid.length === 0 ? (
          <div className="p-6 md:p-10 text-center">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
              <BadgeCheck className="w-6 h-6 md:w-8 md:h-8 text-green-500" />
            </div>
            <p className="font-semibold text-navy text-sm md:text-base mb-1">
              {data.total_paket === 0
                ? "Belum ada data paket pekerjaan."
                : "Luar biasa! Semua paket pekerjaan sudah lunas."}
            </p>
            <p className="text-xs md:text-sm text-gray-400">
              {data.total_paket === 0
                ? "Mulai dengan menambahkan paket pertama."
                : "Tidak ada tagihan yang perlu ditindaklanjuti."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {topUnpaid.map((paket, idx) => {
              const sisaTagihan = Number(paket.nilai_kontrak) - Number(paket.nilai_terbayar);
              const progressBayar = (Number(paket.nilai_terbayar) / Number(paket.nilai_kontrak)) * 100 || 0;

              return (
                <div
                  key={paket.id}
                  className="p-4 md:p-5 hover:bg-gray-50/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <span className="w-7 h-7 rounded-full bg-navy/5 text-navy font-mono text-xs font-bold flex items-center justify-center shrink-0 group-hover:bg-gold/20 group-hover:text-gold transition-colors">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-navy group-hover:text-gold transition-colors text-sm md:text-base truncate">
                          {paket.nama_paket}
                        </h3>
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0 ${
                          paket.sumber_dana === 'Aspirasi'
                            ? 'bg-gold/10 text-gold'
                            : 'bg-navy/10 text-navy'
                        }`}>
                          {paket.sumber_dana}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 truncate">
                        {paket.lokasi || "Lokasi belum diset"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 sm:gap-8 shrink-0 ml-0">
                    <div className="text-right min-w-0">
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider">Sisa</p>
                      <p className="font-mono text-xs md:text-sm font-bold text-red-600 truncate max-w-[120px] md:max-w-none">
                        {formatRupiah(sisaTagihan)}
                      </p>
                    </div>
                    <div className="w-16 md:w-28 shrink-0">
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gold rounded-full transition-all"
                          style={{ width: `${progressBayar}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-gray-400 mt-0.5 text-right font-mono">
                        {Math.round(progressBayar)}%
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
