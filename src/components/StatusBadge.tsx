import { cn } from '../lib/utils';
import type { StatusPembayaran } from '../types';
import { 
  Check, 
  AlertCircle,
  Banknote,
  FileMinus
} from 'lucide-react';

interface StatusBadgeProps {
  status: StatusPembayaran;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
      status === 'lunas' && "bg-gold/10 text-gold border-gold/20",
      status === 'sebagian' && "bg-orange-50 text-orange-700 border-orange-200",
      status === 'belum_bayar' && "bg-red-50 text-red-700 border-red-200",
      status === 'belum_kontrak' && "bg-gray-100 text-gray-600 border-gray-200"
    )}>
      {status === 'lunas' && <Check className="w-3.5 h-3.5 mr-1" />}
      {status === 'sebagian' && <Banknote className="w-3.5 h-3.5 mr-1" />}
      {status === 'belum_bayar' && <AlertCircle className="w-3.5 h-3.5 mr-1" />}
      {status === 'belum_kontrak' && <FileMinus className="w-3.5 h-3.5 mr-1" />}
      
      {status === 'lunas' ? 'Selesai (Lunas)' : 
       status === 'sebagian' ? 'Proses Bayar' : 
       status === 'belum_bayar' ? 'Belum Bayar' : 'Belum Berkontrak'}
    </span>
  );
}
