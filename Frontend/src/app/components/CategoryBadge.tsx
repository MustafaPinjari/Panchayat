import React from 'react';
import { cn } from './ui/utils';
import { Droplet, Shield, Wrench, Zap, Users, Building2, Leaf, Car, Volume2, Sparkles, MoreHorizontal } from 'lucide-react';

type Category =
  | 'water'
  | 'security'
  | 'maintenance'
  | 'electricity'
  | 'community'
  | 'infrastructure'
  | 'garden'
  | 'parking'
  | 'noise'
  | 'cleanliness'
  | 'other';

interface CategoryBadgeProps {
  category: Category | string;
  className?: string;
}

export function CategoryBadge({ category, className }: CategoryBadgeProps) {
  const categoryConfig: Record<string, { label: string; icon: React.ElementType; className: string }> = {
    water: {
      label: 'Water',
      icon: Droplet,
      className: 'bg-category-water/10 text-category-water border-category-water/20',
    },
    security: {
      label: 'Security',
      icon: Shield,
      className: 'bg-category-security/10 text-category-security border-category-security/20',
    },
    maintenance: {
      label: 'Maintenance',
      icon: Wrench,
      className: 'bg-category-maintenance/10 text-category-maintenance border-category-maintenance/20',
    },
    electricity: {
      label: 'Electricity',
      icon: Zap,
      className: 'bg-category-electricity/10 text-category-electricity border-category-electricity/20',
    },
    community: {
      label: 'Community',
      icon: Users,
      className: 'bg-category-community/10 text-category-community border-category-community/20',
    },
    infrastructure: {
      label: 'Infrastructure',
      icon: Building2,
      className: 'bg-category-infrastructure/10 text-category-infrastructure border-category-infrastructure/20',
    },
    garden: {
      label: 'Garden',
      icon: Leaf,
      className: 'bg-category-garden/10 text-category-garden border-category-garden/20',
    },
    parking: {
      label: 'Parking',
      icon: Car,
      className: 'bg-category-parking/10 text-category-parking border-category-parking/20',
    },
    noise: {
      label: 'Noise',
      icon: Volume2,
      className: 'bg-category-noise/10 text-category-noise border-category-noise/20',
    },
    cleanliness: {
      label: 'Cleanliness',
      icon: Sparkles,
      className: 'bg-category-cleanliness/10 text-category-cleanliness border-category-cleanliness/20',
    },
    other: {
      label: 'Other',
      icon: MoreHorizontal,
      className: 'bg-category-other/10 text-category-other border-category-other/20',
    },
  };

  const config = categoryConfig[category] ?? categoryConfig['other'];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border',
        config.className,
        className
      )}
    >
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
}
