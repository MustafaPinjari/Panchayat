import React from 'react';
import { cn } from './ui/utils';

interface FilterTabsProps {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}

export function FilterTabs({ options, value, onChange }: FilterTabsProps) {
  return (
    <div className="flex gap-1 flex-wrap">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            'px-3 py-2 text-xs font-medium rounded-lg border transition-colors',
            value === opt.value
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-background border-border hover:bg-muted'
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
