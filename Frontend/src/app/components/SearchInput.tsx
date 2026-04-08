import React from 'react';
import { Search } from 'lucide-react';
import { cn } from './ui/utils';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchInput({ value, onChange, placeholder, className }: SearchInputProps) {
  return (
    <div className={cn('relative', className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? 'Search…'}
        className="w-full pl-9 pr-3 py-2 text-sm bg-background border border-border rounded-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus:outline-none"
      />
    </div>
  );
}
