import React from 'react';
import { Plus, SlidersHorizontal } from 'lucide-react';
import { apiCliente } from '../services/apiCliente';

const CardProducto = ({
  producto,
  sinStock = false,
  cantidadEnCarrito = 0,
  onAgregarRapido,
  onAbrirPersonalizar
}) => {
  const permitePersonalizar = apiCliente.esPersonalizable(producto.clase);

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
      className={`group relative bg-gradient-to-b from-[#14171f] to-[#0e1015] border rounded-2xl p-3.5 sm:p-4 flex items-center justify-between gap-3 transition-all duration-200 shadow-md ${
        permitePersonalizar
          ? 'border-amber-500/25 hover:border-amber-400/60 hover:shadow-amber-950/20'
          : 'border-white/10 hover:border-orange-500/50 hover:shadow-orange-950/20'
      }`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-orange-500/10 text-orange-400 border border-orange-500/20">
            {producto.clase}
          </span>
          {cantidadEnCarrito > 0 && (
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 tabular-nums">
              {cantidadEnCarrito} en carrito
            </span>
          )}
        </div>

        <h3 className="text-sm font-black text-white uppercase tracking-tight truncate mt-2 group-hover:text-orange-100 transition-colors">
          {producto.nombre}
        </h3>

        <p className="text-base sm:text-[17px] font-black text-orange-400 tabular-nums mt-1">
          ${(Number(producto.precio) || 0).toLocaleString('es-AR')}
        </p>
      </div>

      <div className="shrink-0">
        <button
          type="button"
          disabled={sinStock}
          onClick={handleAccionPrincipal}
          className={`${
            permitePersonalizar
              ? 'bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-lg shadow-amber-500/15'
              : 'bg-orange-600 hover:bg-orange-500 text-white shadow-lg shadow-orange-600/20'
          } disabled:bg-zinc-800 disabled:text-zinc-500 disabled:shadow-none px-3.5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer disabled:cursor-not-allowed`}
        >
          {permitePersonalizar ? (
            <>
              <SlidersHorizontal size={14} strokeWidth={2.5} />
              <span>Personalizar</span>
            </>
          ) : (
            <>
              <Plus size={15} strokeWidth={2.5} />
              <span>Agregar</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default CardProducto;