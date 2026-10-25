import React from 'react';
import { cva } from 'class-variance-authority';

// 1. Variasi Styling Backdrop
const backdropVariants = cva(
  'fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm transition-all duration-200',
  {
    variants: {
      variant: {
        default: 'bg-black/50',
        dark: 'bg-black/75',
        light: 'bg-white/50',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

// 2. Variasi Styling Modal Box/Container (Gunakan CVA untuk Ukuran Modal)
const modalVariants = cva(
  'w-full bg-white rounded-xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden transition-all transform scale-100 opacity-100',
  {
    variants: {
      size: {
        sm: 'max-w-md',     // Cocok untuk Modal Restock / Update Harga Cepat
        md: 'max-w-xl',     // Cocok untuk Form Sedang
        lg: 'max-w-3xl',    // Cocok untuk Form Tambah / Edit Lengkap Multi-Satuan
        full: 'max-w-5xl',  // Cocok untuk Tabel / Laporan Detail
      },
    },
    defaultVariants: {
      size: 'sm',
    },
  }
);

/**
 * Komponen Reusable BaseModal dengan CVA
 */
export default function BaseModal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  size,
  backdropVariant,
}) {
  if (!isOpen) return null;

  return (
    <div
      className={backdropVariants({ variant: backdropVariant })}
      onClick={onClose}
    >
      {/* Mencegah modal tertutup saat area dalam modal diklik */}
      <div
        className={modalVariants({ size })}
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER MODAL */}
        <div className="flex items-start justify-between p-5 border-b border-gray-100 bg-gray-50/50">
          <div>
            <h3 className="text-lg font-bold text-gray-900">{title}</h3>
            {subtitle && (
              <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 p-1.5 rounded-lg transition-colors text-sm font-bold"
            aria-label="Tutup Modal"
          >
            ✕
          </button>
        </div>

        {/* BODY MODAL */}
        <div className="p-5 overflow-y-auto max-h-[80vh]">{children}</div>
      </div>
    </div>
  );
}