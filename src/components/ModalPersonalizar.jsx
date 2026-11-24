import React, { useState, useEffect, useMemo } from 'react';
import { X, Check, Plus, Minus, SlidersHorizontal } from 'lucide-react';
import { apiCliente } from '../services/apiCliente';

const ModalPersonalizar = ({
  producto,
  adicionalesDB = [],
  onCerrar,
  onConfirmarPersonalizado
}) => {
  const [ingredientesEstado, setIngredientesEstado] = useState({});
  const [agregados, setAgregados] = useState({});

  useEffect(() => {
    if (!producto) return;
    const sugeridos = apiCliente.obtenerIngredientesSugeridos(
      producto.clase,
      producto.nombre
    );
    const inicial = {};
    sugeridos.forEach((ing) => {
      inicial[ing] = true;
    });
    setIngredientesEstado(inicial);
    setAgregados({});
  }, [producto]);

  const adicionalesDisponibles = useMemo(() => {
    if (!producto) return [];
    return apiCliente.obtenerAdicionalesPorCategoria(producto.clase, adicionalesDB);
  }, [producto, adicionalesDB]);

  const totalAdicionales = useMemo(() => {
    return Object.entries(agregados).reduce((acc, [nombreExtra, cant]) => {
      const info = adicionalesDisponibles.find(
        (a) => String(a.atributo).toUpperCase() === String(nombreExtra).toUpperCase()
      );
      const precioUnit = info ? Number(info.valor) || 0 : 0;
      return acc + precioUnit * cant;
    }, 0);
  }, [agregados, adicionalesDisponibles]);

  if (!producto) return null;

  const toggleIngrediente = (ing) => {
    setIngredientesEstado((prev) => ({
      ...prev,
      [ing]: !prev[ing]
    }));
  };

  const modificarAdicional = (atributo, delta) => {
    setAgregados((prev) => {
      const actual = prev[atributo] || 0;
      const siguiente = actual + delta;
      if (siguiente <= 0) {
        const copia = { ...prev };
        delete copia[atributo];
        return copia;
      }
      return { ...prev, [atributo]: siguiente };
    });
  };

  const precioBase = Number(producto.precio) || 0;
  const precioUnitarioFinal = precioBase + totalAdicionales;

  const handleConfirmar = () => {
    const sinIngredientes = Object.entries(ingredientesEstado)
      .filter(([, activo]) => !activo)
      .map(([ing]) => `SIN ${ing.toUpperCase()}`);

    const extrasAplicados = Object.entries(agregados).map(([nombreExtra, cant]) =>
      cant > 1 ? `+${cant} ${nombreExtra.toUpperCase()}` : `+${nombreExtra.toUpperCase()}`
    );

    const notas = [...sinIngredientes, ...extrasAplicados];

    onConfirmarPersonalizado({
      producto,
      precioUnitario: precioUnitarioFinal,
      notas
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="anim-modal-sheet bg-[#111318] border border-orange-500/60 w-full max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl">
        {/* Cabecera */}
        <div className="px-5 py-4 border-b border-white/10 bg-white/[0.02] flex items-center justify-between">
          <div className="min-w-0">
            <span className="text-[10px] font-black uppercase tracking-wider text-orange-400 flex items-center gap-1">
              <SlidersHorizontal size={11} /> Personalizar ítem
            </span>
            <h3 className="text-sm font-black text-white uppercase truncate mt-0.5">
              {producto.nombre}
            </h3>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Base ${precioBase.toLocaleString('es-AR')}
              {totalAdicionales > 0 && (
                <span className="text-orange-400 font-bold">
                  {' '}· Extras +${totalAdicionales.toLocaleString('es-AR')}
                </span>
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
            aria-label="Cerrar personalizador"
          >
            <X size={18} />
          </button>
        </div>

        {/* Cuerpo */}
        <div className="p-5 space-y-5 max-h-[75vh] overflow-y-auto">
          {Object.keys(ingredientesEstado).length > 0 && (
            <div>
              <p className="text-[11px] font-black uppercase text-gray-400 mb-2.5">
                Tocar para quitar de la receta
              </p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(ingredientesEstado).map(([ing, incluido]) => (
                  <button
                    key={ing}
                    type="button"
                    onClick={() => toggleIngrediente(ing)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-black uppercase transition-transform active:scale-95 cursor-pointer ${
                      incluido
                        ? 'bg-black/50 border-white/15 text-gray-300 hover:border-white/30'
                        : 'bg-red-500/20 border-red-500/60 text-red-300'
                    }`}
                  >
                    {incluido ? (
                      <Check size={12} className="text-emerald-400" />
                    ) : (
                      <X size={12} className="text-red-400" />
                    )}
                    {incluido ? ing : `SIN ${ing}`}
                  </button>
                ))}
              </div>
            </div>
          )}

          {adicionalesDisponibles.length > 0 && (
            <div>
              <p className="text-[11px] font-black uppercase text-gray-400 mb-2.5">
                Extras disponibles
              </p>
              <div className="space-y-2">
                {adicionalesDisponibles.map((ad) => {
                  const cant = agregados[ad.atributo] || 0;
                  const precioExtra = Number(ad.valor) || 0;
                  return (
                    <div
                      key={ad.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-black/50 border border-white/10"
                    >
                      <div>
                        <div className="text-xs font-black uppercase text-white">
                          {ad.atributo}
                        </div>
                        <div className="text-[11px] font-bold text-orange-400">
                          {precioExtra > 0
                            ? `+$${precioExtra.toLocaleString('es-AR')}`
                            : 'Consultar / sin cargo'}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 bg-[#111318] border border-white/15 rounded-xl p-1">
                        <button
                          type="button"
                          onClick={() => modificarAdicional(ad.atributo, -1)}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-white cursor-pointer"
                          aria-label={`Quitar ${ad.atributo}`}
                        >
                          <Minus size={13} />
                        </button>
                        <span className="text-xs font-black text-white w-5 text-center">
                          {cant}
                        </span>
                        <button
                          type="button"
                          onClick={() => modificarAdicional(ad.atributo, 1)}
                          className="p-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white cursor-pointer"
                          aria-label={`Agregar ${ad.atributo}`}
                        >
                          <Plus size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-black/40">
          <button
            type="button"
            onClick={handleConfirmar}
            className="w-full bg-orange-600 hover:bg-orange-500 text-white py-3.5 px-5 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-between transition-transform active:scale-[0.99] cursor-pointer"
          >
            <span>Agregar al pedido</span>
            <span className="text-base font-black">
              ${precioUnitarioFinal.toLocaleString('es-AR')}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalPersonalizar;