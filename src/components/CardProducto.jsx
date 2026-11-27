import React, { useState, useEffect } from 'react';
import {
  Plus,
  SlidersHorizontal,
  UtensilsCrossed,
  Flame,
  Pizza,
  CupSoda,
  Utensils
} from 'lucide-react';
import { apiCliente } from '../services/apiCliente';

const API_URL = String(import.meta.env.VITE_API_URL || '').trim().replace(/\/+$/, '');

const resolverSrcImagen = (ruta) => {
  if (!ruta || typeof ruta !== 'string') return '';
  if (typeof apiCliente.resolverImagenUrl === 'function') {
    return apiCliente.resolverImagenUrl(ruta);
  }
  const limpia = ruta.trim();
  if (!limpia) return '';
  if (/^(https?:\/\/|data:image\/)/i.test(limpia)) return limpia;
  const normalizada = limpia.startsWith('/') ? limpia : `/${limpia}`;
  return API_URL ? `${API_URL}${normalizada}` : normalizada;
};

const obtenerIconoCategoria = (clase) => {
  const cat = String(clase || '').trim().toLowerCase();
  if (cat === 'bebidas') return CupSoda;
  if (cat === 'pizzas') return Pizza;
  if (cat === 'papas' || cat === 'empanadas') return Flame;
  if (cat === 'platos') return Utensils;
  return UtensilsCrossed;
};

const formatearContiene = (texto) => {
  const limpio = String(texto || '').trim();
  if (!limpio) return '';
  if (/^contiene\b/i.test(limpio)) return limpio;
  return `Contiene: ${limpio}`;
};

const ESTILO_BOTON_AMBAR =
  'px-3.5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 bg-gradient-to-b from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-zinc-950 border border-amber-200/50 shadow-md shadow-amber-500/20 hover:shadow-lg hover:shadow-amber-400/30 transition-all duration-200 cursor-pointer select-none hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.97] disabled:translate-y-0 disabled:scale-100 disabled:bg-zinc-800/90 disabled:from-zinc-800 disabled:to-zinc-800 disabled:text-zinc-500 disabled:border-white/5 disabled:shadow-none disabled:cursor-not-allowed';

const CardProducto = ({
  producto,
  sinStock = false,
  cantidadEnCarrito = 0,
  onAgregarRapido,
  onAbrirPersonalizar
}) => {
  const [errorImagen, setErrorImagen] = useState(false);
  const permitePersonalizar = apiCliente.esPersonalizable(producto.clase);
  const srcImagen = !errorImagen ? resolverSrcImagen(producto.imagen) : '';
  const IconoCategoria = obtenerIconoCategoria(producto.clase);
  const textoContiene = formatearContiene(producto?.descripcion);

  useEffect(() => {
    setErrorImagen(false);
  }, [producto?.imagen, producto?.id]);

  const handleAccionPrincipal = () => {
    if (sinStock) return;
    if (permitePersonalizar) {
      onAbrirPersonalizar(producto);
      return;
    }
    onAgregarRapido(producto);
  };

  return (
    <div
      className={`group relative min-h-[210px] sm:min-h-[225px] bg-gradient-to-br from-[#161a24] via-[#11141c] to-[#0c0e14] border rounded-2xl overflow-hidden flex flex-col justify-between transition-all duration-200 shadow-lg ${
        permitePersonalizar
          ? 'border-amber-500/25 hover:border-amber-400/60 hover:shadow-amber-950/25'
          : 'border-white/10 hover:border-orange-500/50 hover:shadow-orange-950/25'
      }`}
    >
      {/* FOTO SUPERIOR O RESPALDO VISUAL SIN FOTO */}
      {srcImagen ? (
        <div className="relative h-32 sm:h-36 w-full shrink-0 overflow-hidden">
          <img
            src={srcImagen}
            alt={producto.nombre || 'Producto'}
            loading="lazy"
            onError={() => setErrorImagen(true)}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-[#0c0e14]/45 to-[#0c0e14]" />
        </div>
      ) : (
        <div className="relative h-32 sm:h-36 w-full shrink-0 overflow-hidden bg-gradient-to-br from-orange-500/10 via-amber-500/5 to-transparent flex flex-col items-center justify-center gap-1.5 border-b border-white/5">
          <div className="w-11 h-11 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-orange-400/75 group-hover:scale-105 group-hover:text-orange-300 transition-all duration-300">
            <IconoCategoria size={22} strokeWidth={2} />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
            {errorImagen ? 'Foto no disponible' : 'Sin foto'}
          </span>
          <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-b from-transparent to-[#0c0e14]" />
        </div>
      )}

      {/* CONTENIDO INFERIOR SOBRE EL DESVANECIDO */}
      <div className="relative z-10 flex-1 flex flex-col justify-between p-3.5 sm:p-4 -mt-8 pt-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-orange-500/20 text-orange-300 border border-orange-500/30 backdrop-blur-sm">
              {producto.clase}
            </span>
            {cantidadEnCarrito > 0 && (
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 backdrop-blur-sm tabular-nums">
                {cantidadEnCarrito} en carrito
              </span>
            )}
          </div>

          <h3 className="text-sm sm:text-[15px] font-black text-white uppercase tracking-tight leading-snug break-words mt-2 drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)] group-hover:text-orange-100 transition-colors">
            {producto.nombre}
          </h3>

          {textoContiene && (
            <p className="text-[11px] text-amber-200/90 font-medium leading-snug mt-1 line-clamp-2">
              {textoContiene}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 pt-3 mt-3 border-t border-white/10">
          <p className="text-base sm:text-lg font-black text-orange-400 tabular-nums tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
            ${(Number(producto.precio) || 0).toLocaleString('es-AR')}
          </p>

          <button
            type="button"
            disabled={sinStock}
            onClick={handleAccionPrincipal}
            className={`${ESTILO_BOTON_AMBAR} shrink-0`}
          >
            {permitePersonalizar ? (
              <>
                <SlidersHorizontal size={14} strokeWidth={2.5} className="shrink-0" />
                <span>Personalizar</span>
              </>
            ) : (
              <>
                <Plus size={15} strokeWidth={2.5} className="shrink-0" />
                <span>Agregar</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CardProducto;