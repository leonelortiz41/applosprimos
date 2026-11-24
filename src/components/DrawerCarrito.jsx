import React from 'react';
import { X, Plus, Minus, Trash2, ArrowRight } from 'lucide-react';

const DrawerCarrito = ({
  abierto,
  onCerrar,
  carrito = [],
  onCambiarCantidad,
  onVaciarCarrito,
  onIrACheckout
}) => {
  if (!abierto) return null;

  const totalPedido = carrito.reduce(
    (acc, item) => acc + (Number(item.precioUnitario ?? item.precio) || 0) * item.cantidad,
    0
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex justify-end">
      <div className="bg-[#111318] border-l border-white/15 w-full max-w-md h-full flex flex-col justify-between shadow-2xl">
        {/* Cabecera */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-black uppercase tracking-wider text-white">
              Tu Pedido
            </h2>
            <p className="text-[11px] text-gray-400">
              {carrito.reduce((acc, item) => acc + item.cantidad, 0)} unidades seleccionadas
            </p>
          </div>
          <div className="flex items-center gap-2">
            {carrito.length > 0 && (
              <button
                type="button"
                onClick={onVaciarCarrito}
                className="px-2.5 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[11px] font-bold uppercase flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Trash2 size={13} /> Vaciar
              </button>
            )}
            <button
              type="button"
              onClick={onCerrar}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
              aria-label="Cerrar carrito"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Lista de ítems */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {carrito.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-12 text-gray-500">
              <p className="text-sm font-black uppercase">Tu carrito está vacío</p>
              <p className="text-xs mt-1">Agregá productos desde el menú para armar tu pedido.</p>
            </div>
          ) : (
            carrito.map((item) => {
              const precioUnit = Number(item.precioUnitario ?? item.precio) || 0;
              const subtotal = precioUnit * item.cantidad;
              const keyReact = item.claveItem || `${item.clase}-${item.id}`;
              const notas = Array.isArray(item.notas) ? item.notas : [];

              return (
                <div
                  key={keyReact}
                  className="bg-black/50 border border-white/10 rounded-2xl p-3.5 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-black uppercase text-orange-400/80">
                      {item.clase}
                    </span>
                    <h4 className="text-xs font-black text-white uppercase truncate">
                      {item.nombre}
                    </h4>
                    {notas.length > 0 && (
                      <p className="text-[10px] font-bold text-orange-300 mt-0.5 break-words">
                        {notas.join(' · ')}
                      </p>
                    )}
                    <p className="text-xs font-bold text-gray-400 mt-0.5">
                      ${subtotal.toLocaleString('es-AR')}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 bg-[#111318] border border-white/15 rounded-xl p-1 shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        onCambiarCantidad(item.id, item.clase, item.cantidad - 1, item)
                      }
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-white transition-colors cursor-pointer"
                      aria-label="Restar unidad"
                    >
                      <Minus size={13} />
                    </button>
                    <span className="text-xs font-black text-white w-5 text-center">
                      {item.cantidad}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        onCambiarCantidad(item.id, item.clase, item.cantidad + 1, item)
                      }
                      className="p-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white transition-colors cursor-pointer"
                      aria-label="Sumar unidad"
                    >
                      <Plus size={13} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pie */}
        {carrito.length > 0 && (
          <div className="p-5 border-t border-white/10 bg-black/40 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-gray-400">Subtotal</span>
              <span className="text-xl font-black text-orange-500">
                ${totalPedido.toLocaleString('es-AR')}
              </span>
            </div>
            <button
              type="button"
              onClick={onIrACheckout}
              className="w-full bg-orange-600 hover:bg-orange-500 text-white py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-[0.99] cursor-pointer"
            >
              Continuar con el pedido <ArrowRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DrawerCarrito;