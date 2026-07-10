import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { PaketPekerjaan, CapaianProgram } from "../types";
import { formatRupiah } from "../lib/utils";
import { ProgressRadial } from "../components/ProgressRadial";
import { StatCard } from "../components/StatCard";
import { Briefcase, Wallet, Banknote, AlertCircle } from "lucide-react";
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

export default function Dashboard() {
  const [data, setData] = useState<CapaianProgram>({
    total_paket: 0,
    paket_lunas: 0,
    total_pagu_anggaran: 0,
    total_nilai_kontrak: 0,
    total_nilai_terbayar: 0,
    capaian_keuangan_persen: 0,
  });
  const [topUnpaid, setTopUnpaid] = useState<PaketPekerjaan[]>([]);
  const [loading, setLoading] = useState(true);
  const windowWidth = useWindowWidth();
  const radialSize = windowWidth < 480 ? 160 : windowWidth < 768 ? 200 : 220;

  useEffect(() => {
    async function fetchDashboardData() {
      const { data: paketList, error } = await supabase
        .from("paket_pekerjaan")
        .select("*");

      if (!error && paketList) {
        const total_paket = paketList.length;
        const paket_lunas = paketList.filter(
          (p) => p.nilai_kontrak > 0 && p.nilai_terbayar >= p.nilai_kontrak,
        ).length;

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

        // Capaian dihitung dari Pagu Anggaran agar lebih akurat
        const capaian_keuangan_persen =
          total_pagu_anggaran > 0
            ? (total_nilai_terbayar / total_pagu_anggaran) * 100
            : 0;

        setData({
          total_paket,
          paket_lunas,
          total_pagu_anggaran,
          total_nilai_kontrak,
          total_nilai_terbayar,
          capaian_keuangan_persen,
        });

        // Prioritas: paket yang sudah berkontrak tapi belum lunas
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

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-navy font-display mb-2">
            Dashboard Capaian
          </h1>
          <p className="text-gray-500 text-sm md:text-base">
            Ringkasan progres pembayaran program RTLH
          </p>
        </div>
        {data.total_paket === 0 && (
          <Link
            to="/paket"
            className="bg-navy hover:bg-navy-light text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm hover:shadow-md shrink-0"
          >
            + Tambah Paket Pertama
          </Link>
        )}
      </div>

      {/* Radial Progress Section */}
      <div className="bg-white rounded-3xl p-8 mb-8 border border-gray-100 shadow-sm relative overflow-hidden flex flex-col items-center justify-center">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gold/5 rounded-full -translate-y-1/2 translate-x-1/4 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-navy/5 rounded-full translate-y-1/2 -translate-x-1/4 blur-3xl"></div>

        <div className="relative z-10 flex flex-col items-center text-center">
          <ProgressRadial
            progress={data.capaian_keuangan_persen}
            label="Progres Keseluruhan (Berdasarkan Pembayaran)"
            colorClass="text-gold"
            size={radialSize}
          />
          <p className="text-sm text-gray-500 mt-2 text-center max-w-md">
            Total Dana Terbayar: {formatRupiah(data.total_nilai_terbayar)}{" "}
            <br />
            (dari total kontrak {formatRupiah(data.total_nilai_kontrak)})
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Paket Pekerjaan"
          value={data.total_paket}
          icon={<Briefcase className="w-5 h-5" />}
        />
        <StatCard
          title="Selesai (Lunas)"
          value={data.paket_lunas}
          icon={<Wallet className="w-5 h-5" />}
        />
        <StatCard
          title="Total Pagu Anggaran"
          value={formatRupiah(data.total_pagu_anggaran)}
          icon={<Banknote className="w-5 h-5" />}
        />
        <StatCard
          title="Total Terkontrak"
          value={formatRupiah(data.total_nilai_kontrak)}
          icon={<Banknote className="w-5 h-5" />}
        />
      </div>

      {/* Priority Section */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-gold mr-2" />
            <h2 className="text-lg font-display font-bold text-navy">
              Perhatian: Sisa Tagihan Terbesar
            </h2>
          </div>
        </div>

        {topUnpaid.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {data.total_paket === 0
              ? "Belum ada data paket pekerjaan."
              : "Luar biasa! Semua paket pekerjaan sudah lunas."}
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {topUnpaid.map((paket) => {
              const sisaTagihan =
                Number(paket.nilai_kontrak) - Number(paket.nilai_terbayar);
              const progressBayar =
                (Number(paket.nilai_terbayar) / Number(paket.nilai_kontrak)) *
                  100 || 0;

              return (
                <div
                  key={paket.id}
                  className="p-4 md:p-6 hover:bg-gray-50/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                >
                  <div className="min-w-0">
                    <h3 className="font-semibold text-navy mb-1 group-hover:text-gold transition-colors text-sm md:text-base truncate">
                      {paket.nama_paket}
                    </h3>
                    <p className="text-xs md:text-sm text-gray-500 truncate">
                      {paket.lokasi || "Lokasi belum diset"}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-mono text-xs md:text-sm text-gray-500 mb-1">
                      Sisa:{" "}
                      <span className="font-bold text-red-600">
                        {formatRupiah(sisaTagihan)}
                      </span>
                    </p>
                    <div className="w-24 md:w-32 h-2 bg-gray-100 rounded-full overflow-hidden inline-block">
                      <div
                        className="h-full bg-gold rounded-full"
                        style={{ width: `${progressBayar}%` }}
                      ></div>
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
