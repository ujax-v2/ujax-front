import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PageNavProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function PageNav({ page, totalPages, onPageChange }: PageNavProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => onPageChange(Math.max(0, page - 1))}
        disabled={page === 0}
        className="p-2 text-text-muted hover:text-text-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      {Array.from({ length: totalPages }, (_, i) => (
        <button
          key={i}
          onClick={() => onPageChange(i)}
          className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${
            page === i
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
              : 'text-text-faint hover:bg-surface-subtle hover:text-text-secondary'
          }`}
        >
          {i + 1}
        </button>
      ))}
      <button
        onClick={() => onPageChange(Math.min(totalPages - 1, page + 1))}
        disabled={page >= totalPages - 1}
        className="p-2 text-text-muted hover:text-text-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
