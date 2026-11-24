import React, { useState, useEffect } from 'react';
import { X, Store, Bike, CheckCircle2, ShieldCheck } from 'lucide-react';

const SECUENCIAS_PROHIBIDAS = [
  '1234567890',
  '0123456789',
  '9876543210',
  '1122334455',
  '0987654321',
  '123456789',
  '12345678'
];

const esTelefonoValido = (tel = '') => {
  const limpio = String(tel).replace(/\D/g, '');
  if (limpio.length < 10 || limpio.length > 13) return false;
  if (/^(.)\1+$/.test(limpio)) return false;

  const sinCodigoPais = limpio.startsWith('549')
    ? limpio.slice(3)
    : limpio.startsWith('54')
    ? limpio.slice(2)
    : limpio;

  if (sinCodigoPais.length < 10) return false;
  if (/^(.)\1+$/.test(sinCodigoPais)) return false;
  if (
    SECUENCIAS_PROHIBIDAS.some(
      (seq) => limpio.includes(seq) || sinCodigoPais.includes(seq)
    )
  ) {
    return false;
  }

  return true;
};

const ModalCheckout = ({
  abierto,
  onCerrar,
  carrito = [],
  onConfirmarPedido,
  enviando = false
}) => {
  const [tipoEntrega, setTipoEntrega] = useState('ENVIO'); // 'ENVIO' | 'RETIRO'
  const [cliente, setCliente] = useState('');
  const [telefono, setTelefono] = useState('');
  const [numeroConfirmado, setNumeroConfirmado] = useState(false);
  const [direccion, setDireccion] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setNumeroConfirmado(false);
  }, [telefono]);

  if (!abierto) return null;

  const totalPedido = carrito.reduce(
    (acc, item) => acc + (Number(item.precioUnitario ?? item.precio) || 0) * item.cantidad,
    0
  );

  const telefonoFormatoOk = esTelefonoValido(telefono);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!cliente.trim() || cliente.trim().length < 2) {
      setError('Ingresá tu nombre para identificar el pedido.');
      return;
    }

    if (!telefonoFormatoOk) {
      setError('Ingresá un número de teléfono real con código de área (ej. 381 555 1234).');
      return;
    }

    if (!numeroConfirmado) {
      setError('Confirmá que el número ingresado es correcto para poder tomar el pedido.');
      return;
    }

    if (tipoEntrega === 'ENVIO' && (!direccion.trim() || direccion.trim().length < 4)) {
      setError('Ingresá la dirección de entrega para el envío a domicilio.');
      return;
    }

    await onConfirmarPedido({
      cliente: cliente.trim(),
      telefono: telefono.trim(),
      tipoEntrega,
      direccion: tipoEntrega === 'ENVIO' ? direccion.trim() : '',
      honeypot
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="anim-modal-sheet bg-[#111318] border border-white/15 w-full max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl">
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-black uppercase tracking-wider text-white">
              Confirmar Pedido
            </h2>
            <p className="text-[11px] text-gray-400">
              Bar Los Primos · {carrito.reduce((a, b) => a + b.cantidad, 0)} ítems
            </p>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            disabled={enviando}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[82vh] overflow-y-auto">
          {/* Campo oculto anti-bots */}
          <input
            type="text"
            name="website"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            className="hidden"
          />

          {/* Selector Envío (por defecto) vs Retiro */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setTipoEntrega('ENVIO')}
              className={`p-3 rounded-2xl border text-left transition-colors flex items-center gap-2.5 cursor-pointer ${
                tipoEntrega === 'ENVIO'
                  ? 'bg-orange-600/20 border-orange-500 text-white'
                  : 'bg-black/40 border-white/10 text-gray-400 hover:text-white'
              }`}
            >
              <Bike size={18} className={tipoEntrega === 'ENVIO' ? 'text-orange-400' : ''} />
              <div>
                <div className="text-xs font-black uppercase">Envío</div>
                <div className="text-[10px] opacity-75">A domicilio</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setTipoEntrega('RETIRO')}
              className={`p-3 rounded-2xl border text-left transition-colors flex items-center gap-2.5 cursor-pointer ${
                tipoEntrega === 'RETIRO'
                  ? 'bg-orange-600/20 border-orange-500 text-white'
                  : 'bg-black/40 border-white/10 text-gray-400 hover:text-white'
              }`}
            >
              <Store size={18} className={tipoEntrega === 'RETIRO' ? 'text-orange-400' : ''} />
              <div>
                <div className="text-xs font-black uppercase">Retiro</div>
                <div className="text-[10px] opacity-75">En el local</div>
              </div>
            </button>
          </div>

          {/* Datos del cliente */}
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold uppercase text-gray-400 mb-1">
                Tu nombre *
              </label>
              <input
                type="text"
                value={cliente}
                onChange={(e) => setCliente(e.target.value)}
                placeholder="Ej. Lucas Gómez"
                maxLength={60}
                className="w-full bg-black/60 border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-gray-400 mb-1">
                Teléfono / WhatsApp *
              </label>
              <input
                type="tel"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="Ej. 381 555 1234"
                maxLength={20}
                className={`w-full bg-black/60 border rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-gray-600 outline-none transition-colors ${
                  telefono && !telefonoFormatoOk
                    ? 'border-red-500/70 focus:border-red-500'
                    : 'border-white/15 focus:border-orange-500'
                }`}
              />
              {telefono && !telefonoFormatoOk && (
                <p className="text-[11px] text-red-400 mt-1">
                  Revisá el número: debe tener código de área y no ser una secuencia o número ficticio.
                </p>
              )}

              {telefonoFormatoOk && (
                <label className="mt-2 p-2.5 rounded-xl bg-white/[0.04] border border-white/10 flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={numeroConfirmado}
                    onChange={(e) => setNumeroConfirmado(e.target.checked)}
                    className="mt-0.5 accent-orange-500 w-4 h-4 cursor-pointer"
                  />
                  <span className="text-[11px] text-gray-200 leading-snug">
                    <span className="inline-flex items-center gap-1 font-bold text-orange-300">
                      <ShieldCheck size={13} /> Verifiqué mi número ({telefono.trim()})
                    </span>
                    <span className="block text-gray-400">
                      Si el número es incorrecto o falso, el pedido no se tomará.
                    </span>
                  </span>
                </label>
              )}
            </div>

            {tipoEntrega === 'ENVIO' && (
              <div>
                <label className="block text-[11px] font-bold uppercase text-gray-400 mb-1">
                  Dirección de entrega *
                </label>
                <input
                  type="text"
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  placeholder="Calle, número, barrio o piso/depto"
                  maxLength={120}
                  className="w-full bg-black/60 border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-orange-500"
                />
              </div>
            )}
          </div>

          {/* Resumen */}
          <div className="bg-black/50 border border-white/10 rounded-2xl p-3.5 space-y-2">
            {carrito.map((item) => {
              const precioUnit = Number(item.precioUnitario ?? item.precio) || 0;
              const subtotal = precioUnit * item.cantidad;
              const keyReact = item.claveItem || `${item.clase}-${item.id}`;
              const notas = Array.isArray(item.notas) ? item.notas : [];

              return (
                <div key={keyReact} className="text-xs text-gray-300">
                  <div className="flex justify-between">
                    <span className="truncate pr-2">
                      <strong className="text-white">{item.cantidad}x</strong> {item.nombre}
                    </span>
                    <span className="font-bold text-white shrink-0">
                      ${subtotal.toLocaleString('es-AR')}
                    </span>
                  </div>
                  {notas.length > 0 && (
                    <p className="text-[10px] font-bold text-orange-300 pl-4 mt-0.5 break-words">
                      {notas.join(' · ')}
                    </p>
                  )}
                </div>
              );
            })}
            <div className="border-t border-white/10 pt-2 mt-2 flex justify-between items-center">
              <span className="text-xs font-black uppercase text-gray-400">Total</span>
              <span className="text-lg font-black text-orange-500">
                ${totalPedido.toLocaleString('es-AR')}
              </span>
            </div>
          </div>

          {error && (
            <p className="text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={enviando}
            className="w-full bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-transform active:scale-[0.99] cursor-pointer"
          >
            <CheckCircle2 size={16} />
            {enviando ? 'Enviando pedido...' : `Enviar Pedido · $${totalPedido.toLocaleString('es-AR')}`}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ModalCheckout;