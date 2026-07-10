import { jsPDF } from 'jspdf'
import { autoTable } from 'jspdf-autotable'
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

function rp(n: number): string {
  return `Rp${fmt(n)}`
}

export function exportDashboardPDF(data: CapaianProgram, paketList: PaketPekerjaan[]) {
  const doc = new jsPDF()
  const pw = doc.internal.pageSize.getWidth()

  // ── Page header/footer helper ──
  let pageNum = 1
  const footerHook = () => {
    doc.setFontSize(7)
    doc.setTextColor(180, 180, 180)
    doc.text('Progres RTLH — Laporan Capaian Program', ml, doc.internal.pageSize.getHeight() - 8)
    doc.text(`Halaman ${pageNum}`, pw - mr, doc.internal.pageSize.getHeight() - 8, { align: 'right' })
    pageNum++
  }

  const ml = 14
  const mr = 14

  // ════════════════════════════════════════════════════════
  //  HEADER / TITLE
  // ════════════════════════════════════════════════════════
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(30, 58, 95)
  doc.text('Laporan Capaian Program RTLH', pw / 2, 22, { align: 'center' })

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(130, 130, 130)
  const now = new Date()
  const dateStr = now.toLocaleDateString('id-ID', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
  doc.text(`Kabupaten Lombok Timur — ${dateStr}`, pw / 2, 29, { align: 'center' })

  // separator line
  doc.setDrawColor(212, 175, 55)
  doc.setLineWidth(0.6)
  doc.line(ml, 33, pw - mr, 33)

  // ════════════════════════════════════════════════════════
  //  RINGKASAN UMUM
  // ════════════════════════════════════════════════════════
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(30, 58, 95)
  doc.text('Ringkasan Umum', ml, 42)

  autoTable(doc, {
    startY: 46,
    head: [['Indikator', 'Nilai']],
    body: [
      ['Total Paket', String(data.total_paket)],
      ['Paket Lunas', `${data.paket_lunas} (${data.total_paket > 0 ? Math.round((data.paket_lunas / data.total_paket) * 100) : 0}%)`],
      ['Paket Proses / Sebagian', String(data.paket_sebagian)],
      ['Total Pagu Anggaran', rp(data.total_pagu_anggaran)],
      ['Nilai Kontrak', rp(data.total_nilai_kontrak)],
      ['Sudah Terbayar', rp(data.total_nilai_terbayar)],
      ['Capaian Keuangan', `${Math.round(data.capaian_keuangan_persen)}%`],
    ],
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [212, 175, 55], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 65 },
      1: { halign: 'right', cellWidth: 45 },
    },
    margin: { left: ml, right: mr },
    tableLineColor: [220, 220, 220],
    tableLineWidth: 0.2,
    didDrawPage: footerHook,
  })

  // ════════════════════════════════════════════════════════
  //  PERBANDINGAN SUMBER DANA
  // ════════════════════════════════════════════════════════
  const y1 = (doc as any).lastAutoTable.finalY + 12

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(30, 58, 95)
  doc.text('Perbandingan Reguler vs Aspirasi', ml, y1)

  autoTable(doc, {
    startY: y1 + 4,
    head: [['Sumber Dana', 'Paket', 'Terkontrak', 'Pagu', 'Kontrak', 'Terbayar', 'Capaian']],
    body: [
      [
        'Reguler',
        String(data.reguler.total_paket),
        String(data.reguler.total_paket - data.reguler.paket_belum_kontrak),
        rp(data.reguler.total_pagu),
        rp(data.reguler.total_kontrak),
        rp(data.reguler.total_terbayar),
        `${Math.round(data.reguler.capaian_persen)}%`,
      ],
      [
        'Aspirasi',
        String(data.aspirasi.total_paket),
        String(data.aspirasi.total_paket - data.aspirasi.paket_belum_kontrak),
        rp(data.aspirasi.total_pagu),
        rp(data.aspirasi.total_kontrak),
        rp(data.aspirasi.total_terbayar),
        `${Math.round(data.aspirasi.capaian_persen)}%`,
      ],
    ],
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [212, 175, 55], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 28 },
      1: { halign: 'center', cellWidth: 16 },
      2: { halign: 'center', cellWidth: 22 },
      3: { halign: 'right', cellWidth: 32 },
      4: { halign: 'right', cellWidth: 32 },
      5: { halign: 'right', cellWidth: 32 },
      6: { halign: 'center', cellWidth: 20 },
    },
    margin: { left: ml, right: mr },
    tableLineColor: [220, 220, 220],
    tableLineWidth: 0.2,
    didDrawPage: footerHook,
  })

  // ════════════════════════════════════════════════════════
  //  DAFTAR SELURUH PAKET
  // ════════════════════════════════════════════════════════
  const y2 = (doc as any).lastAutoTable.finalY + 12

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(30, 58, 95)
  doc.text('Daftar Seluruh Paket Pekerjaan', ml, y2)

  const statusColors: Record<string, [number, number, number]> = {
    'Belum Kontrak': [156, 163, 175],
    'Belum Bayar': [239, 68, 68],
    'Proses Bayar': [251, 146, 60],
    'Lunas': [212, 175, 55],
  }

  const paketBody = paketList.map((p, i) => [
    String(i + 1),
    p.nama_paket,
    p.sumber_dana || '-',
    p.lokasi || '-',
    rp(p.pagu_anggaran || 0),
    rp(p.nilai_kontrak || 0),
    rp(p.nilai_terbayar || 0),
    getStatusLabel(p),
  ])

  autoTable(doc, {
    startY: y2 + 4,
    head: [['No', 'Nama Paket Pekerjaan', 'Dana', 'Lokasi', 'Pagu', 'Kontrak', 'Terbayar', 'Status']],
    body: paketBody,
    theme: 'grid',
    styles: { fontSize: 7.5, cellPadding: 2.5, overflow: 'linebreak' },
    headStyles: { fillColor: [30, 58, 95], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center', fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 12, halign: 'center' },
      3: { cellWidth: 26 },
      4: { cellWidth: 23, halign: 'right' },
      5: { cellWidth: 23, halign: 'right' },
      6: { cellWidth: 23, halign: 'right' },
      7: { cellWidth: 18, halign: 'center' },
    },
    margin: { left: ml, right: mr },
    tableLineColor: [210, 210, 210],
    tableLineWidth: 0.2,
    didDrawPage: footerHook,
    didParseCell(hData) {
      if (hData.section === 'body' && hData.column.index === 7) {
        const status = (hData.cell.text[0] || '') as string
        const color = statusColors[status]
        if (color) {
          hData.cell.styles.textColor = color
          hData.cell.styles.fontStyle = 'bold'
        }
      }
    },
  })

  doc.save('laporan-rtlh.pdf')
}
