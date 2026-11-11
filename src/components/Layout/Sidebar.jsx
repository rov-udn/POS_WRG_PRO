import React from 'react';
import MenuBadge from '../ui/MenuBadge';

export default function Sidebar({
  daftarMenu,
  menuAktif,
  onPilihMenu,
  namaToko,
  namaPengguna,
  labelRole,
  onKeluar,
  onTutupShift,
  isKasir
}) {
  return (
    <aside className="hidden md:flex flex-col w-64 bg-white border-r min-h-screen p-4 space-y-6">
      <div className="px-2">
        <h2 className="truncate text-xl font-bold text-blue-600" title={namaToko}>
          {namaToko}
        </h2>
        <p className="text-xs text-gray-500">Sistem Kasir & Stok</p>
      </div>

      <nav className="flex-1 space-y-1">
        {daftarMenu.map((menu) => {
          const isAktif = menuAktif === menu.id;
          return (
            <button
              key={menu.id}
              onClick={() => onPilihMenu(menu.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                isAktif
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <span className="text-lg">{menu.ikon}</span>
              <span className="flex-1">{menu.label}</span>
              <span className="relative h-6 w-6 shrink-0">
                <MenuBadge
                  count={menu.badgeCount}
                  dot={menu.badgeDot}
                  label={menu.badgeLabel}
                />
              </span>
            </button>
          );
        })}
      </nav>
      <div className="space-y-3 border-t border-gray-200 pt-4">
        <div className="min-w-0 px-2">
          <p className="truncate text-sm font-semibold text-gray-800">{namaPengguna}</p>
          <span className="mt-1 inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
            {labelRole}
          </span>
        </div>
        {isKasir && (
          <button
            type="button"
            onClick={onTutupShift}
            className="w-full rounded-lg bg-red-50 px-3 py-2 text-left text-sm font-semibold text-red-700 transition hover:bg-red-100"
          >
            ⏹️ Tutup Shift
          </button>
        )}
        <button
          type="button"
          onClick={onKeluar}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-left text-sm font-medium text-gray-700 transition hover:bg-gray-100"
        >
          Keluar
        </button>
      </div>
    </aside>
  );
}