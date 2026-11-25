import React from 'react';
import { Search, X } from 'lucide-react';
import logo from '../assets/logo1.png';

const ESTILO_TAB_ACTIVA =
  'bg-gradient-to-b from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-zinc-950 border border-amber-200/50 shadow-md shadow-amber-500/20 hover:shadow-lg hover:shadow-amber-400/30 -translate-y-0.5 active:translate-y-0 active:scale-[0.97]';

const ESTILO_TAB_INACTIVA =
  'bg-[#12151d] text-gray-400 hover:text-white hover:bg-[#171a24] border border-white/10 hover:border-amber-400/35 active:scale-[0.98]';

const HeaderTienda = ({
  tiendaAbierta,
  sinSistema = false,
  envioActivo = true,
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
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-[#12151d] border border-orange-500/25 p-1 flex items-center justify-center shrink-0 shadow-inner">
              <img
                src={logo}
                alt="Logo Bar Los Primos"
                className="w-full h-full object-contain"
              />
            </div>

            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-black uppercase tracking-tight text-white truncate leading-tight">
                Bar Los Primos
              </h1>
              {estaDisponible && (
                <p
                  className={`text-[11px] font-semibold truncate mt-0.5 ${
                    envioActivo ? 'text-gray-400' : 'text-amber-400'
                  }`}
                >
                  {envioActivo
                    ? 'Envío a domicilio habilitado'
                    : 'Envío a domicilio deshabilitado'}
                </p>
              )}
            </div>
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

            <div className="flex gap-2 overflow-x-auto py-1.5 px-0.5 no-scrollbar">
              {tabsVisibles.map((cat) => {
                const activa = categoriaActiva === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => onSeleccionarCategoria(cat.id)}
                    className={`my-0.5 px-3.5 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider whitespace-nowrap transition-all duration-200 select-none cursor-pointer ${
                      activa ? ESTILO_TAB_ACTIVA : ESTILO_TAB_INACTIVA
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