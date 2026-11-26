import React, { useState, useEffect, useMemo } from 'react';
import { Search, X, Download, Share, UtensilsCrossed } from 'lucide-react';
import logo from '../assets/logo1.png';
import { useInstalarPWA } from '../hooks/useInstalarPWA';

const ESTILO_TAB_ACTIVA =
  'bg-gradient-to-b from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-zinc-950 border border-amber-200/50 shadow-md shadow-amber-500/20 hover:shadow-lg hover:shadow-amber-400/30 -translate-y-0.5 active:translate-y-0 active:scale-[0.97]';

const ESTILO_TAB_INACTIVA =
  'bg-[#12151d] text-gray-400 hover:text-white hover:bg-[#171a24] border border-white/10 hover:border-amber-400/35 active:scale-[0.98]';

const ORDEN_CATEGORIAS = [
  'platos',
  'milanesas',
  'lomitos',
  'hamburguesas',
  'pizzas',
  'empanadas',
  'papas',
  'bebidas'
];

const esTabGeneral = (cat) => {
  const id = String(cat.id || '').trim().toLowerCase();
  const label = String(cat.label || '').trim().toLowerCase();
  return (
    ['todos', 'todas', 'todo', 'all'].includes(id) ||
    ['todos', 'todas'].includes(label)
  );
};

const normalizarMesaVisible = (mesa) => {
  const num = Number(mesa);
  return Number.isInteger(num) && num > 0 ? num : null;
};

const HeaderTienda = ({
  tiendaAbierta,
  sinSistema = false,
  envioActivo = true,
  subtitulo,
  mesa = null,
  onSalirMesa = null,
  busqueda,
  onChangeBusqueda,
  tabsVisibles = [],
  categoriaActiva,
  onSeleccionarCategoria
}) => {
  const mesaActiva = normalizarMesaVisible(mesa);
  const estaDisponible = Boolean(tiendaAbierta) && !sinSistema;
  const { mostrarBoton, esIOS, instalarApp } = useInstalarPWA();
  const [mostrarGuiaIOS, setMostrarGuiaIOS] = useState(false);
  const [instalando, setInstalando] = useState(false);

  const tabsOrdenadas = useMemo(() => {
    return [...tabsVisibles].sort((a, b) => {
      if (esTabGeneral(a)) return -1;
      if (esTabGeneral(b)) return 1;

      const idA = String(a.id || '').trim().toLowerCase();
      const idB = String(b.id || '').trim().toLowerCase();
      const idxA = ORDEN_CATEGORIAS.indexOf(idA);
      const idxB = ORDEN_CATEGORIAS.indexOf(idB);
      const posA = idxA === -1 ? 999 : idxA;
      const posB = idxB === -1 ? 999 : idxB;
      return posA - posB;
    });
  }, [tabsVisibles]);

  useEffect(() => {
    if (!mostrarGuiaIOS) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setMostrarGuiaIOS(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mostrarGuiaIOS]);

  const handleClickInstalar = async () => {
    if (instalando) return;
    if (esIOS) {
      setMostrarGuiaIOS(true);
      return;
    }
    setInstalando(true);
    try {
      await instalarApp();
    } finally {
      setInstalando(false);
    }
  };

  const textoSubtitulo =
    subtitulo ||
    (mesaActiva
      ? `Consumo en el local · Mesa #${mesaActiva}`
      : envioActivo
        ? 'Envío a domicilio habilitado'
        : 'Envío a domicilio deshabilitado');

  return (
    <>
      <header className="sticky top-0 z-30 bg-[#090a0d]/95 backdrop-blur-md border-b border-white/10 shadow-lg shadow-black/40">
        <div className="max-w-4xl mx-auto px-4 py-4 sm:py-4.5 space-y-3.5">
          {/* Fila 1: Logo, título, mesa y estado */}
          <div className="flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-12 h-12 rounded-xl bg-[#12151d] border border-orange-500/25 p-1 flex items-center justify-center shrink-0 shadow-inner">
                <img
                  src={logo}
                  alt="Logo Bar Los Primos"
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="min-w-0 flex-1">
                <h1 className="text-base sm:text-lg font-black uppercase tracking-tight text-white truncate leading-tight">
                  Bar Los Primos
                </h1>
                {estaDisponible && (
                  <p
                    className={`text-[11px] font-semibold truncate mt-0.5 ${
                      mesaActiva || !envioActivo ? 'text-amber-400' : 'text-gray-400'
                    }`}
                  >
                    {textoSubtitulo}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {mesaActiva && estaDisponible && (
                <div className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-400/35 pl-2.5 pr-1 py-1">
                  <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-amber-300 tabular-nums">
                    <UtensilsCrossed size={11} strokeWidth={2.5} />
                    Mesa #{mesaActiva}
                  </span>
                  {typeof onSalirMesa === 'function' && (
                    <button
                      type="button"
                      onClick={onSalirMesa}
                      title="Cambiar a envío o retiro"
                      className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-black/40 hover:bg-black/70 text-amber-200 hover:text-white transition-colors cursor-pointer"
                    >
                      Salir
                    </button>
                  )}
                </div>
              )}

              {estaDisponible ? (
                <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Abierto
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                  Cerrado
                </span>
              )}
            </div>
          </div>

          {/* Fila 2: Barra de acceso directo PWA */}
          {mostrarBoton && (
            <div className="flex items-center justify-between gap-3 px-3.5 py-2 rounded-xl bg-[#12151d]/90 border border-amber-500/20">
              <span className="text-[11px] font-semibold text-gray-300 truncate">
                Pedí más rápido desde tu inicio
              </span>
              <button
                type="button"
                disabled={instalando}
                onClick={handleClickInstalar}
                className="my-0.5 inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider px-3.5 py-1.5 rounded-xl bg-gradient-to-b from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 disabled:opacity-60 text-zinc-950 border border-amber-200/50 shadow-md shadow-amber-500/20 active:scale-95 transition-all cursor-pointer disabled:cursor-not-allowed shrink-0"
              >
                <Download size={12} strokeWidth={2.8} />
                <span>{instalando ? 'Instalando...' : 'Instalar App'}</span>
              </button>
            </div>
          )}

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
                {tabsOrdenadas.map((cat) => {
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

      {mostrarGuiaIOS && (
        <div
          onClick={() => setMostrarGuiaIOS(false)}
          className="fixed inset-0 z-50 bg-black/80 flex items-end sm:items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#111318] border border-amber-500/40 rounded-2xl p-5 max-w-sm w-full space-y-3 text-white shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-amber-400">
                Instalar en iPhone
              </span>
              <button
                type="button"
                onClick={() => setMostrarGuiaIOS(false)}
                aria-label="Cerrar guía de instalación"
                className="p-1.5 rounded-lg bg-white/5 text-gray-400 hover:text-white cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">
1. Tocá el ícono{' '}
              <strong className="text-white inline-flex items-center gap-1">
                <Share size={13} /> Compartir
              </strong>{' '}
              en la barra inferior de Safari.
            </p>
            <p className="text-xs text-gray-300 leading-relaxed">
2. Elegí{' '}
              <strong className="text-amber-400">&quot;Agregar a inicio&quot;</strong>{' '}
              para tener el acceso directo con el logo del bar.
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default HeaderTienda;