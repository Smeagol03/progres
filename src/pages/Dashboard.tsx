import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useReadOnly } from "../contexts/ReadOnlyContext";
import type { PaketPekerjaan, CapaianProgram, StatusPembayaran } from "../types";
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
} from "lucide-react";
import { Link } from "react-router-dom";

function useWindowWidth() {
  const [width, setWidth] = useState(window.innerWidth);
  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  return width;
}

const defaultData: CapaianProgram = {
  total_paket: 0,
  paket_lunas: 0,
  paket_sebagian: 0,
  paket_belum_bayar: 0,
  paket_belum_kontrak: 0,
  total_pagu_anggaran: 0,
  total_nilai_kontrak: 0,
  total_nilai_terbayar: 0,
  capaian_keuangan_persen: 0,
};

export default function Dashboard() {
  const { isReadOnly, token } = useReadOnly();
  const [data, setData] = useState<CapaianProgram>(defaultData);
  const [topUnpaid, setTopUnpaid] = useState<PaketPekerjaan[]>([]);
  const [loading, setLoading] = useState(true);
  const windowWidth = useWindowWidth();
  const radialSize = windowWidth < 480 ? 170 : windowWidth < 768 ? 220 : 260;

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

        let paket_lunas = 0;
        let paket_sebagian = 0;
        let paket_belum_bayar = 0;
        let paket_belum_kontrak = 0;

        for (const p of paketList) {
          const status = hitungStatusPembayaran(
            Number(p.nilai_kontrak),
            Number(p.nilai_terbayar),
          );
          if (status === "lunas") paket_lunas++;
          else if (status === "sebagian") paket_sebagian++;
          else if (status === "belum_bayar") paket_belum_bayar++;
          else paket_belum_kontrak++;
        }

        const total_pagu_anggaran = paketList.reduce(
          (sum, p) => sum + Number(p.pagu_anggaran || 0),
          0,
        );
        const total_nilai_kontrak = paketList.reduce(
          (sum, p) => sum + Number(p.nilai_kontrak || 0),
          0,
        );
        const total_nilai_terbayar = paketList.reduce(
          (sum, p) => sum + Number(p.nilai_terbayar || 0),
          0,
        );

        const capaian_keuangan_persen =
          total_pagu_anggaran > 0
            ? (total_nilai_terbayar / total_pagu_anggaran) * 100
            : 0;

        setData({
          total_paket,
          paket_lunas,
          paket_sebagian,
          paket_belum_bayar,
          paket_belum_kontrak,
          total_pagu_anggaran,
          total_nilai_kontrak,
          total_nilai_terbayar,
          capaian_keuangan_persen,
        });

        const unpaidList = paketList
          .filter(
            (p) =>
              Number(p.nilai_kontrak) > 0 &&
              Number(p.nilai_terbayar) < Number(p.nilai_kontrak),
          )
          .sort(
            (a, b) =>
              Number(b.nilai_kontrak) -
              Number(b.nilai_terbayar) -
              (Number(a.nilai_kontrak) - Number(a.nilai_terbayar)),
          )
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

  const stackData: { label: string; count: number; status: StatusPembayaran; color: string; bgColor: string }[] = [
    { label: "Selesai (Lunas)", count: data.paket_lunas, status: "lunas" as const, color: "bg-gold", bgColor: "bg-gold/10" },
    { label: "Proses Bayar", count: data.paket_sebagian, status: "sebagian" as const, color: "bg-orange-400", bgColor: "bg-orange-50" },
    { label: "Belum Bayar", count: data.paket_belum_bayar, status: "belum_bayar" as const, color: "bg-red-400", bgColor: "bg-red-50" },
    { label: "Belum Kontrak", count: data.paket_belum_kontrak, status: "belum_kontrak" as const, color: "bg-gray-300", bgColor: "bg-gray-50" },
  ];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 overflow-hidden">
      {/* ─── Header ─── */}
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
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
        <div className="flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-navy/5 rounded-xl shrink-0">
          <BadgeCheck className="w-3.5 h-3.5 md:w-4 md:h-4 text-gold shrink-0" />
          <span className="text-[10px] md:text-xs font-semibold text-navy whitespace-nowrap">
            {data.total_paket} Paket Pekerjaan
          </span>
        </div>
      </div>

      {/* ─── Radial Progress ─── */}
      <div className="bg-white rounded-3xl p-6 md:p-10 mb-8 border border-gray-100 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-gold/5 rounded-full -translate-y-1/3 translate-x-1/3 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-navy/5 rounded-full translate-y-1/3 -translate-x-1/3 blur-3xl" />

        <div className="relative z-10 flex flex-col lg:flex-row items-center gap-8 lg:gap-16">
          <div className="flex flex-col items-center text-center shrink-0">
            <ProgressRadial
              progress={data.capaian_keuangan_persen}
              label="Capaian Keuangan"
              colorClass="text-gold"
              size={radialSize}
            />
          </div>

          <div className="flex-1 w-full max-w-lg space-y-4 md:space-y-6 min-w-0">
            <div className="grid grid-cols-2 gap-3 md:gap-4">
              <div className="bg-navy/5 rounded-xl p-3 md:p-4 min-w-0">
                <p className="text-[10px] md:text-xs text-gray-500 mb-1">Total Pagu</p>
                <p className="font-mono font-bold text-navy text-sm md:text-lg truncate">
                  {formatRupiah(data.total_pagu_anggaran)}
                </p>
              </div>
              <div className="bg-navy/5 rounded-xl p-3 md:p-4 min-w-0">
                <p className="text-[10px] md:text-xs text-gray-500 mb-1">Terkontrak</p>
                <p className="font-mono font-bold text-navy text-sm md:text-lg truncate">
                  {formatRupiah(data.total_nilai_kontrak)}
                </p>
              </div>
              <div className="bg-gold/10 rounded-xl p-3 md:p-4 col-span-2 min-w-0">
                <p className="text-[10px] md:text-xs text-gray-500 mb-1">Total Dana Terbayar</p>
                <p className="font-mono font-bold text-gold text-base md:text-xl truncate">
                  {formatRupiah(data.total_nilai_terbayar)}
                </p>
                <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gold rounded-full transition-all duration-1000"
                    style={{ width: `${Math.min(data.capaian_keuangan_persen, 100)}%` }}
                  />
                </div>
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
            data.total_pagu_anggaran > 0
              ? `${Math.round(data.capaian_keuangan_persen)}% dari pagu`
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
              const sisaTagihan =
                Number(paket.nilai_kontrak) - Number(paket.nilai_terbayar);
              const progressBayar =
                (Number(paket.nilai_terbayar) / Number(paket.nilai_kontrak)) *
                  100 || 0;

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
                      <h3 className="font-semibold text-navy group-hover:text-gold transition-colors text-sm md:text-base truncate">
                        {paket.nama_paket}
                      </h3>
                      <p className="text-xs text-gray-400 truncate">
                        {paket.lokasi || "Lokasi belum diset"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 sm:gap-8 shrink-0 ml-0">
                    <div className="text-right min-w-0">
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider">
                        Sisa
                      </p>
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
