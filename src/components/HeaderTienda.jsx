import React from 'react';
import { Search, X } from 'lucide-react';

const HeaderTienda = ({
  tiendaAbierta,
  sinSistema = false,
  subtituloModalidad,
  busqueda,
  onChangeBusqueda,
  tabsVisibles = [],
  categoriaActiva,
  onSeleccionarCategoria
}) => {
  const estaDisponible = Boolean(tiendaAbierta) && !sinSistema;

  return (
    <header className="sticky top-0 z-30 bg-[#090a0d]/95 backdrop-blur-md border-b border-white/10 shadow-lg shadow-black/40">
      <div className="max-w-4xl mx-auto px-4 py-3.5 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-black uppercase tracking-tight text-white truncate leading-tight">
              Bar Los Primos
            </h1>
            {estaDisponible && subtituloModalidad && (
              <p className="text-[11px] font-medium text-gray-400 truncate mt-0.5">
                {subtituloModalidad}
              </p>
            )}
          </div>

          {estaDisponible ? (
            <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Abierto
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/30 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
              Cerrado
            </span>
          )}
        </div>

        {estaDisponible && (
          <>
            <div className="relative flex items-center">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
              />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => onChangeBusqueda(e.target.value)}
                placeholder="Buscar hamburguesa, milanesa, pizza, bebida..."
                className="w-full bg-[#12151d] border border-white/10 rounded-xl pl-10 pr-9 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all"
              />
              {busqueda && (
                <button
                  type="button"
                  onClick={() => onChangeBusqueda('')}
                  aria-label="Limpiar búsqueda"
                  className="absolute right-2.5 p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {tabsVisibles.map((cat) => {
                const activa = categoriaActiva === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => onSeleccionarCategoria(cat.id)}
                    className={`px-3.5 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer ${
                      activa
                        ? 'bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-md shadow-orange-600/25'
                        : 'bg-[#12151d] text-gray-400 hover:text-white hover:bg-[#171a24] border border-white/10 hover:border-white/20'
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </header>
  );
};

export default HeaderTienda;