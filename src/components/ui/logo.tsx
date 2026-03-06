
import React from 'react';
import { cn } from '@/lib/utils';

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center", className)}>
      <span className="text-2xl font-black uppercase tracking-tighter text-primary">
        MOCHI<span className="text-accent">BAZAAR</span>.COM
      </span>
    </div>
  );
}
