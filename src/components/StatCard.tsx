import type { ReactNode } from 'react';
import { cn } from '../lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  description?: string;
  className?: string;
}

export function StatCard({ title, value, icon, description, className }: StatCardProps) {
  return (
    <div className={cn(
      "bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 group overflow-hidden relative",
      className
    )}>
      {/* Decorative background blur */}
      <div className="absolute -right-8 -top-8 w-24 h-24 bg-navy/5 rounded-full blur-2xl group-hover:bg-gold/10 transition-colors duration-500"></div>
      
      <div className="flex items-center justify-between mb-2 md:mb-4 relative">
        <div className="p-2 md:p-3 bg-gray-50 rounded-xl text-navy group-hover:bg-navy group-hover:text-gold transition-colors duration-300">
          {icon}
        </div>
      </div>
      
      <div className="relative min-w-0">
        <h3 className="text-xs md:text-sm font-medium text-gray-500 mb-1 truncate">{title}</h3>
        <p className="text-lg md:text-2xl font-mono font-bold text-navy truncate">{value}</p>
        {description && (
          <p className="text-[10px] md:text-xs text-gray-400 mt-1 md:mt-2 truncate">{description}</p>
        )}
      </div>
    </div>
  );
}
