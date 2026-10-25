import React from 'react';

export default function Sidebar({ daftarMenu, menuAktif, onPilihMenu }) {
  return (
    <aside className="hidden md:flex flex-col w-64 bg-white border-r min-h-screen p-4 space-y-6">
      <div className="px-2">
        <h2 className="text-xl font-bold text-blue-600">POS Warung</h2>
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
              <span>{menu.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}