import React from 'react';
import { Plus } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from './ui/utils';

interface FABProps {
  onClick?: () => void;
  icon?: React.ReactNode;
  label?: string;
  ariaLabel?: string;
  className?: string;
}

export function FAB({ onClick, icon, label, ariaLabel, className }: FABProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      aria-label={ariaLabel ?? label ?? 'Floating action button'}
      className={cn(
        'fixed bottom-24 right-6 z-50',
        'flex items-center gap-2 px-6 py-4 rounded-full',
        'text-white font-semibold',
        'transition-all duration-200',
        'md:bottom-8 md:right-8',
        className
      )}
      style={{
        background: 'linear-gradient(135deg, #2DE2E6, #1D3557)',
        boxShadow: '0 8px 32px rgba(45,226,230,0.35), 0 4px 12px rgba(0,0,0,0.2)',
      }}
    >
      {icon || <Plus className="w-5 h-5" />}
      {label && <span className="font-medium">{label}</span>}
    </motion.button>
  );
}
