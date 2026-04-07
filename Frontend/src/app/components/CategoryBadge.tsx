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
      className: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800',
    },
    security: {
      label: 'Security',
      icon: Shield,
      className: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800',
    },
    maintenance: {
      label: 'Maintenance',
      icon: Wrench,
      className: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800',
    },
    electricity: {
      label: 'Electricity',
      icon: Zap,
      className: 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-800',
    },
    community: {
      label: 'Community',
      icon: Users,
      className: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800',
    },
    infrastructure: {
      label: 'Infrastructure',
      icon: Building2,
      className: 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-950 dark:text-gray-300 dark:border-gray-800',
    },
    garden: {
      label: 'Garden',
      icon: Leaf,
      className: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800',
    },
    parking: {
      label: 'Parking',
      icon: Car,
      className: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-800',
    },
    noise: {
      label: 'Noise',
      icon: Volume2,
      className: 'bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-950 dark:text-pink-300 dark:border-pink-800',
    },
    cleanliness: {
      label: 'Cleanliness',
      icon: Sparkles,
      className: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950 dark:text-teal-300 dark:border-teal-800',
    },
    other: {
      label: 'Other',
      icon: MoreHorizontal,
      className: 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-950 dark:text-gray-300 dark:border-gray-800',
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
