import ExcelJS from 'exceljs'
import type { PaketPekerjaan, CapaianProgram } from '../types'

function getStatusLabel(p: PaketPekerjaan): string {
  if (!p.nilai_kontrak || p.nilai_kontrak <= 0) return 'Belum Kontrak'
  if (!p.nilai_terbayar || p.nilai_terbayar <= 0) return 'Belum Bayar'
  if (p.nilai_terbayar >= p.nilai_kontrak) return 'Lunas'
  return 'Proses Bayar'
}

function fmt(n: number): string {
  return new Intl.NumberFormat('id-ID').format(n)
}

function hitungPersen(bagian: number, total: number): string {
  if (total <= 0) return '0%'
  return `${Math.round((bagian / total) * 100)}%`
}

export async function exportDashboardExcel(
  data: CapaianProgram,
  paketList: PaketPekerjaan[]
) {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'Progres RTLH'
  wb.created = new Date()

  // ─── Color constants ───
  const GOLD = 'FFD4AF37'
  const NAVY = 'FF1E3A5F'
  const WHITE = 'FFFFFFFF'
  const GRAY_LIGHT = 'FFF3F4F6'

  // ──────────────────────────
  // Sheet 1: Ringkasan
  // ──────────────────────────
  const ws = wb.addWorksheet('Ringkasan', {
    views: [{ state: 'frozen', ySplit: 2 }],
    pageSetup: { paperSize: 9, orientation: 'portrait' },
  })

  ws.columns = [
    { header: 'Indikator', key: 'indikator', width: 28 },
    { header: 'Nilai', key: 'nilai', width: 22 },
    { header: 'Keterangan', key: 'keterangan', width: 32 },
  ]

  const headRow = ws.getRow(1)
  headRow.font = { bold: true, color: { argb: WHITE }, size: 11 }
  headRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GOLD } }
  headRow.alignment = { horizontal: 'center', vertical: 'middle' }

  const ringkasanRows = [
    ['TOTAL PAKET', String(data.total_paket), ''],
    ['Paket Lunas', String(data.paket_lunas), `${hitungPersen(data.paket_lunas, data.total_paket)} dari total paket`],
    ['Paket Sebagian', String(data.paket_sebagian), `${hitungPersen(data.paket_sebagian, data.total_paket)} dari total paket`],
    ['Paket Belum Bayar', String(data.paket_belum_bayar), `${hitungPersen(data.paket_belum_bayar, data.total_paket)} dari total paket`],
    ['Paket Belum Kontrak', String(data.paket_belum_kontrak), `${hitungPersen(data.paket_belum_kontrak, data.total_paket)} dari total paket`],
    [],
    ['TOTAL PAGU', `Rp${fmt(data.total_pagu_anggaran)}`, ''],
    ['NILAI KONTRAK', `Rp${fmt(data.total_nilai_kontrak)}`, ''],
    ['SUDAH TERBAYAR', `Rp${fmt(data.total_nilai_terbayar)}`, ''],
    ['CAPAIAN KEUANGAN', `${Math.round(data.capaian_keuangan_persen)}%`, 'terbayar / kontrak'],
    [],
    ['Sumber Dana', 'Paket', 'Terkontrak', 'Pagu', 'Kontrak', 'Terbayar', 'Capaian'],
    [
      'REGULER',
      String(data.reguler.total_paket),
      String(data.reguler.total_paket - data.reguler.paket_belum_kontrak),
      `Rp${fmt(data.reguler.total_pagu)}`,
      `Rp${fmt(data.reguler.total_kontrak)}`,
      `Rp${fmt(data.reguler.total_terbayar)}`,
      `${Math.round(data.reguler.capaian_persen)}%`,
    ],
    [
      'ASPIRASI',
      String(data.aspirasi.total_paket),
      String(data.aspirasi.total_paket - data.aspirasi.paket_belum_kontrak),
      `Rp${fmt(data.aspirasi.total_pagu)}`,
      `Rp${fmt(data.aspirasi.total_kontrak)}`,
      `Rp${fmt(data.aspirasi.total_terbayar)}`,
      `${Math.round(data.aspirasi.capaian_persen)}%`,
    ],
  ]

  ringkasanRows.forEach((row, i) => {
    const r = ws.getRow(i + 2)
    row.forEach((val, j) => {
      r.getCell(j + 1).value = val
    })
    if (i % 2 === 0 && i < ringkasanRows.length - 1) {
      r.eachCell(cell => { cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: GRAY_LIGHT } } })
    }
  })

  // Bold key labels
  ws.getRow(2).font = { bold: true }
  ws.getRow(7).font = { bold: true }
  ws.getRow(13).font = { bold: true, color: { argb: NAVY } }
  ws.getRow(14).font = { bold: true, color: { argb: NAVY } }

  // ──────────────────────────
  // Sheet 2: Data Paket
  // ──────────────────────────
  const dp = wb.addWorksheet('Data Paket', {
    views: [{ state: 'frozen', ySplit: 1 }],
    pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1 },
  })

  dp.columns = [
    { header: 'No', key: 'no', width: 5 },
    { header: 'Nama Paket', key: 'nama_paket', width: 45 },
    { header: 'Sumber Dana', key: 'sumber_dana', width: 13 },
    { header: 'Lokasi', key: 'lokasi', width: 25 },
    { header: 'Pagu', key: 'pagu', width: 18 },
    { header: 'Nilai Kontrak', key: 'kontrak', width: 18 },
    { header: 'Nilai Terbayar', key: 'terbayar', width: 18 },
    { header: 'Status', key: 'status', width: 15 },
  ]

  const dpHead = dp.getRow(1)
  dpHead.font = { bold: true, color: { argb: WHITE }, size: 10 }
  dpHead.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } }
  dpHead.alignment = { horizontal: 'center', vertical: 'middle' }

  const statusColors: Record<string, string> = {
    'Belum Kontrak': 'FF9CA3AF',
    'Belum Bayar': 'FFEF4444',
    'Proses Bayar': 'FFFB923C',
    'Lunas': 'FFD4AF37',
  }

  paketList.forEach((p, i) => {
    const status = getStatusLabel(p)
    const row = dp.getRow(i + 2)
    row.values = [
      i + 1,
      p.nama_paket,
      p.sumber_dana || '-',
      p.lokasi || '-',
      p.pagu_anggaran || 0,
      p.nilai_kontrak || 0,
      p.nilai_terbayar || 0,
      status,
    ]

    row.eachCell((cell, colNum) => {
      cell.font = { size: 9 }
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
      }

      if (colNum >= 5 && colNum <= 7) {
        cell.numFmt = '#,##0'
        cell.alignment = { horizontal: 'right' }
      }
      if (colNum === 1) cell.alignment = { horizontal: 'center' }
      if (colNum === 8) {
        cell.alignment = { horizontal: 'center' }
        cell.font = { size: 9, bold: true, color: { argb: statusColors[status] || 'FF000000' } }
      }
    })

    if (i % 2 === 1) {
      row.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } }
      })
    }
  })

  const buffer = await wb.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'data-rtlh.xlsx'
  a.click()
  window.URL.revokeObjectURL(url)
}

/**
 * Ekspor daftar paket (hasil filter) ke file Excel (.xlsx)
 * @param paketList  - array paket yang sudah difilter dari tampilan
 * @param filterInfo - info filter aktif untuk nama file & judul sheet
 */
export async function exportPaketListExcel(
  paketList: PaketPekerjaan[],
  filterInfo?: { status?: string; sumberDana?: string }
) {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'Progres RTLH'
  wb.created = new Date()

  // ─── Color constants ───
  const GOLD   = 'FFD4AF37'
  const NAVY   = 'FF1E3A5F'
  const WHITE  = 'FFFFFFFF'
  const LIGHT  = 'FFF9FAFB'

  const statusColors: Record<string, string> = {
    'Belum Kontrak': 'FF9CA3AF',
    'Belum Bayar':   'FFEF4444',
    'Proses Bayar':  'FFFB923C',
    'Lunas':         'FFD4AF37',
  }

  // ── Judul sheet berdasarkan filter ──
  const sheetTitle = (() => {
    const parts: string[] = []
    if (filterInfo?.status && filterInfo.status !== 'all') parts.push(filterInfo.status)
    if (filterInfo?.sumberDana && filterInfo.sumberDana !== 'all') parts.push(filterInfo.sumberDana)
    return parts.length ? `Paket - ${parts.join(', ')}` : 'Daftar Paket'
  })()

  const ws = wb.addWorksheet(sheetTitle, {
    views: [{ state: 'frozen', ySplit: 2 }],
    pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1 },
  })

  // ── Baris 1: judul dokumen ──
  ws.mergeCells('A1:J1')
  const titleCell = ws.getCell('A1')
  titleCell.value = `Daftar Paket Pekerjaan RTLH — ${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}`
  titleCell.font   = { bold: true, size: 12, color: { argb: WHITE } }
  titleCell.fill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } }
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
  ws.getRow(1).height = 24

  // ── Baris 2: header kolom ──
  ws.columns = [
    { key: 'no',         width: 5  },
    { key: 'kode',       width: 16 },
    { key: 'nama_paket', width: 44 },
    { key: 'sumber_dana',width: 13 },
    { key: 'lokasi',     width: 24 },
    { key: 'kontraktor', width: 28 },
    { key: 'pagu',       width: 19 },
    { key: 'kontrak',    width: 19 },
    { key: 'terbayar',   width: 19 },
    { key: 'status',     width: 15 },
  ]

  const headers = ['No', 'Kode Paket', 'Nama Paket', 'Sumber Dana', 'Lokasi', 'Kontraktor',
                   'Pagu Anggaran', 'Nilai Kontrak', 'Nilai Terbayar', 'Status']
  const hRow = ws.getRow(2)
  headers.forEach((h, i) => {
    const cell = hRow.getCell(i + 1)
    cell.value = h
    cell.font      = { bold: true, color: { argb: WHITE }, size: 10 }
    cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: GOLD } }
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
    cell.border    = { bottom: { style: 'thin', color: { argb: NAVY } } }
  })
  hRow.height = 20

  // ── Baris data ──
  paketList.forEach((p, i) => {
    const status = getStatusLabel(p)
    const row    = ws.getRow(i + 3)

    row.values = [
      i + 1,
      p.kode_paket  || '-',
      p.nama_paket,
      p.sumber_dana || '-',
      p.lokasi      || '-',
      p.kontraktor  || '-',
      p.pagu_anggaran  || 0,
      p.nilai_kontrak  || 0,
      p.nilai_terbayar || 0,
      status,
    ]

    row.eachCell((cell, colNum) => {
      cell.font   = { size: 9 }
      cell.border = {
        top:    { style: 'thin', color: { argb: 'FFE5E7EB' } },
        bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
      }

      // Angka → format ribuan + rata kanan
      if (colNum >= 7 && colNum <= 9) {
        cell.numFmt    = '#,##0'
        cell.alignment = { horizontal: 'right' }
      }
      if (colNum === 1)  cell.alignment = { horizontal: 'center' }
      if (colNum === 10) {
        cell.alignment = { horizontal: 'center' }
        cell.font      = { size: 9, bold: true, color: { argb: statusColors[status] || 'FF000000' } }
      }
    })

    // Selang-seling warna baris
    if (i % 2 === 1) {
      row.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: LIGHT } }
      })
    }
  })

  // ── Baris ringkasan total ──
  const totalRow = ws.getRow(paketList.length + 3)
  const totalPagu     = paketList.reduce((s, p) => s + (Number(p.pagu_anggaran)  || 0), 0)
  const totalKontrak  = paketList.reduce((s, p) => s + (Number(p.nilai_kontrak)  || 0), 0)
  const totalTerbayar = paketList.reduce((s, p) => s + (Number(p.nilai_terbayar) || 0), 0)

  ws.mergeCells(`A${paketList.length + 3}:F${paketList.length + 3}`)
  const labelCell = totalRow.getCell(1)
  labelCell.value     = `TOTAL  (${paketList.length} paket)`
  labelCell.font      = { bold: true, size: 10, color: { argb: WHITE } }
  labelCell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } }
  labelCell.alignment = { horizontal: 'right', vertical: 'middle' }

  ;[
    { col: 7, val: totalPagu },
    { col: 8, val: totalKontrak },
    { col: 9, val: totalTerbayar },
  ].forEach(({ col, val }) => {
    const cell = totalRow.getCell(col)
    cell.value     = val
    cell.numFmt    = '#,##0'
    cell.font      = { bold: true, size: 10, color: { argb: WHITE } }
    cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } }
    cell.alignment = { horizontal: 'right', vertical: 'middle' }
  })

  // Capaian % di kolom 10
  const capaianCell = totalRow.getCell(10)
  const capaianPct  = totalKontrak > 0 ? Math.round((totalTerbayar / totalKontrak) * 100) : 0
  capaianCell.value     = `${capaianPct}%`
  capaianCell.font      = { bold: true, size: 10, color: { argb: GOLD } }
  capaianCell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } }
  capaianCell.alignment = { horizontal: 'center', vertical: 'middle' }
  totalRow.height = 22

  // ── Download ──
  const tanggal  = new Date().toISOString().slice(0, 10)
  const suffix   = sheetTitle.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()
  const filename = `paket-rtlh-${suffix}-${tanggal}.xlsx`

  const buffer = await wb.xlsx.writeBuffer()
  const blob   = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = window.URL.createObjectURL(blob)
  const a   = document.createElement('a')
  a.href     = url
  a.download = filename
  a.click()
  window.URL.revokeObjectURL(url)
}
