import React from 'react';
import { Plus } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from './ui/utils';

interface FABProps {
  onClick?: () => void;
  icon?: React.ReactNode;
  label?: string;
  className?: string;
}

export function FAB({ onClick, icon, label, className }: FABProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={cn(
        'fixed bottom-6 right-6 z-50',
        'flex items-center gap-2 px-6 py-4 rounded-full',
        'bg-primary text-primary-foreground shadow-lg shadow-primary/30',
        'hover:shadow-xl hover:shadow-primary/40 transition-all',
        'md:bottom-8 md:right-8',
        className
      )}
    >
      {icon || <Plus className="w-5 h-5" />}
      {label && <span className="font-medium">{label}</span>}
    </motion.button>
  );
}
