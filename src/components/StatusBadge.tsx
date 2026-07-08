import { cn } from '../lib/utils';
import type { StatusFisik, StatusPembayaran } from '../types';
import { 
  CheckCircle2, 
  Clock, 
  MinusCircle, 
  Check, 
  AlertCircle,
  Banknote
} from 'lucide-react';

interface StatusBadgeProps {
  type: 'fisik' | 'pembayaran';
  status: StatusFisik | StatusPembayaran;
}

export function StatusBadge({ type, status }: StatusBadgeProps) {
  if (type === 'fisik') {
    const fisikStatus = status as StatusFisik;
    return (
      <span className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
        fisikStatus === 'selesai' && "bg-emerald-50 text-emerald-700 border-emerald-200",
        fisikStatus === 'proses' && "bg-blue-50 text-blue-700 border-blue-200",
        fisikStatus === 'belum_mulai' && "bg-gray-50 text-gray-700 border-gray-200"
      )}>
        {fisikStatus === 'selesai' && <CheckCircle2 className="w-3.5 h-3.5 mr-1" />}
        {fisikStatus === 'proses' && <Clock className="w-3.5 h-3.5 mr-1" />}
        {fisikStatus === 'belum_mulai' && <MinusCircle className="w-3.5 h-3.5 mr-1" />}
        
        {fisikStatus === 'selesai' ? 'Selesai' : 
         fisikStatus === 'proses' ? 'Proses' : 'Belum Mulai'}
      </span>
    );
  }

  // Pembayaran
  const pembayaranStatus = status as StatusPembayaran;
  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
      pembayaranStatus === 'lunas' && "bg-gold/10 text-gold border-gold/20",
      pembayaranStatus === 'sebagian' && "bg-orange-50 text-orange-700 border-orange-200",
      pembayaranStatus === 'belum_bayar' && "bg-red-50 text-red-700 border-red-200"
    )}>
      {pembayaranStatus === 'lunas' && <Check className="w-3.5 h-3.5 mr-1" />}
      {pembayaranStatus === 'sebagian' && <Banknote className="w-3.5 h-3.5 mr-1" />}
      {pembayaranStatus === 'belum_bayar' && <AlertCircle className="w-3.5 h-3.5 mr-1" />}
      
      {pembayaranStatus === 'lunas' ? 'Lunas' : 
       pembayaranStatus === 'sebagian' ? 'Sebagian' : 'Belum Bayar'}
    </span>
  );
}
