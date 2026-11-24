import React from 'react';
import { ShoppingBag, ChevronUp } from 'lucide-react';

const BarraCarritoFlotante = ({
  cantidadTotal,
  totalCarrito,
  tiendaAbierta,
  onAbrirCarrito,
  onAbrirCheckout,
  enviando = false
}) => {
  if (!tiendaAbierta || cantidadTotal <= 0) return null;

  const totalFormateado = `$${(Number(totalCarrito) || 0).toLocaleString('es-AR')}`;

  return (
    <div className="anim-fade-up fixed bottom-0 inset-x-0 z-40 bg-[#111318]/95 backdrop-blur-md border-t border-white/15 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-10px_30px_rgba(0,0,0,0.65)]">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onAbrirCarrito}
          aria-label={`Ver carrito con ${cantidadTotal} productos, total ${totalFormateado}`}
          className="group flex items-center gap-3 text-left min-w-0 cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-orange-600 group-hover:bg-orange-500 text-white flex items-center justify-center font-black text-sm shrink-0 transition-colors">
            {cantidadTotal}
          </div>

          <div className="min-w-0">
            <div className="text-[11px] font-bold uppercase tracking-wide text-gray-400 group-hover:text-white flex items-center gap-1 transition-colors">
              <span>Ver detalle</span>
              <ChevronUp size={13} className="text-orange-400 shrink-0" />
            </div>
            <div className="text-base sm:text-lg font-black text-white leading-tight truncate">
              {totalFormateado}
            </div>
          </div>
        </button>

        <button
          type="button"
          disabled={enviando}
          onClick={onAbrirCheckout}
          className="bg-orange-600 hover:bg-orange-500 disabled:bg-gray-700 disabled:text-gray-400 text-white px-4 sm:px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shrink-0 transition-transform active:scale-95 cursor-pointer disabled:cursor-not-allowed shadow-lg shadow-orange-950/40"
        >
          <ShoppingBag size={16} className="shrink-0" />
          <span>{enviando ? 'Enviando...' : 'Pedir ahora'}</span>
        </button>
      </div>
    </div>
  );
};

export default BarraCarritoFlotante;