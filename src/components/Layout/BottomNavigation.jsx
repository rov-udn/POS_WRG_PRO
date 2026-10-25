import React from 'react';

export default function BottomNavigation({ daftarMenu, menuAktif, onPilihMenu }) {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t z-20 flex justify-around items-center px-1 py-1.5 shadow-lg">
      {daftarMenu.map((menu) => {
        const isAktif = menuAktif === menu.id;
        return (
          <button
            key={menu.id}
            onClick={() => onPilihMenu(menu.id)}
            className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-lg transition-colors ${
              isAktif ? 'text-blue-600' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <span className="text-xl leading-none">{menu.ikon}</span>
            <span className={`text-[10px] mt-1 ${isAktif ? 'font-bold' : 'font-normal'}`}>
              {menu.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}