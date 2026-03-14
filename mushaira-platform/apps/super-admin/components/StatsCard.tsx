import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  color?: 'navy' | 'gold' | 'green' | 'red' | 'blue' | 'gray';
  subtext?: string;
}

const colorMap = {
  navy:  { bg: 'bg-navy/8',   icon: 'bg-navy text-white',          value: 'text-navy'         },
  gold:  { bg: 'bg-amber-50', icon: 'bg-gold text-gold-foreground', value: 'text-amber-700'    },
  green: { bg: 'bg-green-50', icon: 'bg-green-600 text-white',      value: 'text-green-700'    },
  red:   { bg: 'bg-red-50',   icon: 'bg-red-500 text-white',        value: 'text-red-700'      },
  blue:  { bg: 'bg-blue-50',  icon: 'bg-blue-600 text-white',       value: 'text-blue-700'     },
  gray:  { bg: 'bg-gray-50',  icon: 'bg-gray-400 text-white',       value: 'text-gray-700'     },
};

export function StatsCard({ label, value, icon: Icon, color = 'navy', subtext }: StatsCardProps) {
  const c = colorMap[color];
  return (
    <div className={cn('rounded-2xl p-5 border border-gray-100', c.bg)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className={cn('text-3xl font-bold mt-1 font-heading', c.value)}>{value}</p>
          {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
        </div>
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', c.icon)}>
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
}
