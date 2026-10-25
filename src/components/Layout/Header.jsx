import React from 'react';

export default function Header({ judulHalaman }) {
  return (
    <header className="bg-white border-b sticky top-0 z-10 px-4 py-3 flex justify-between items-center shadow-sm">
      <div className="flex items-center gap-2">
        <h1 className="text-lg font-bold text-gray-800">{judulHalaman}</h1>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs px-2.5 py-1 rounded-full bg-green-100 text-green-700 font-medium">
          Offline Ready
        </span>
      </div>
    </header>
  );
}