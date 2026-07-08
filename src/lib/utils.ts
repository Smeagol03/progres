import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { StatusPembayaran } from '../types';

/**
 * Utility to merge Tailwind classes safely
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format number to Indonesian Rupiah (IDR)
 */
export function formatRupiah(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Calculate payment status based on contract value and paid value
 */
export function hitungStatusPembayaran(
  nilai_kontrak: number,
  nilai_terbayar: number
): StatusPembayaran {
  if (nilai_terbayar <= 0) return 'belum_bayar';
  if (nilai_kontrak > 0 && nilai_terbayar >= nilai_kontrak) return 'lunas';
  return 'sebagian';
}
