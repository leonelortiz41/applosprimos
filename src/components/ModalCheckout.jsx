import React, { useState, useEffect } from 'react';
import {
  X,
  Store,
  Bike,
  UtensilsCrossed,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  BellRing
} from 'lucide-react';

const SECUENCIAS_PROHIBIDAS = [
  '1234567890',
  '0123456789',
  '9876543210',
  '1122334455',
  '0987654321',
  '123456789',
  '12345678'
];

const normalizarTelefonoAR = (tel = '') => {
  let limpio = String(tel).replace(/\D/g, '');
  if (limpio.startsWith('549')) limpio = limpio.slice(3);
  else if (limpio.startsWith('54')) limpio = limpio.slice(2);
  if (limpio.startsWith('0')) limpio = limpio.slice(1);
  if (limpio.length === 12 && limpio.slice(3, 5) === '15') {
    limpio = limpio.slice(0, 3) + limpio.slice(5);
  }
  return limpio;
};

const esTelefonoValido = (tel = '') => {
  const limpio = String(tel).replace(/\D/g, '');
  const normalizado = normalizarTelefonoAR(limpio);

  if (normalizado.length < 10 || normalizado.length > 13) return false;
  if (/^(.)\1+$/.test(limpio) || /^(.)\1+$/.test(normalizado)) return false;
  if (
    SECUENCIAS_PROHIBIDAS.some(
      (seq) => limpio.includes(seq) || normalizado.includes(seq)
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
  mesa = null,
  envioActivo = true,
  retiroActivo = true,
  onConfirmarPedido,
  enviando = false
}) => {
  const esMesa = Boolean(mesa);
  const [tipoEntrega, setTipoEntrega] = useState(
    esMesa ? 'MESA' : envioActivo ? 'ENVIO' : 'RETIRO'
  );
  const [cliente, setCliente] = useState('');
  const [telefono, setTelefono] = useState('');
  const [numeroConfirmado, setNumeroConfirmado] = useState(false);
  const [direccion, setDireccion] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setNumeroConfirmado(false);
  }, [telefono]);

  // Sincronizar modalidad válida al abrir o si cambia la config desde el POS
  useEffect(() => {
    if (esMesa) {
      setTipoEntrega('MESA');
      return;
    }
    if (!envioActivo && retiroActivo) {
      setTipoEntrega('RETIRO');
    } else if (envioActivo && !retiroActivo) {
      setTipoEntrega('ENVIO');
    } else if (envioActivo && abierto) {
      setTipoEntrega((prev) => (prev === 'MESA' || !prev ? 'ENVIO' : prev));
    }
  }, [esMesa, envioActivo, retiroActivo, abierto]);

  if (!abierto) return null;

  const sinModalidadDisponible = !esMesa && !envioActivo && !retiroActivo;

  const totalPedido = carrito.reduce(
    (acc, item) => acc + (Number(item.precioUnitario ?? item.precio) || 0) * item.cantidad,
    0
  );

  const telefonoLimpio = telefono.trim();
  const telefonoNormalizado = normalizarTelefonoAR(telefonoLimpio);
  const telefonoFormatoOk = esTelefonoValido(telefonoLimpio);

  const handleSeleccionarEntrega = (modalidad) => {
    if (esMesa) return;
    if (modalidad === 'ENVIO' && !envioActivo) return;
    if (modalidad === 'RETIRO' && !retiroActivo) return;
    setTipoEntrega(modalidad);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (sinModalidadDisponible) {
      setError('Por el momento no hay modalidades de entrega disponibles.');
      return;
    }

    if (!esMesa) {
      if (tipoEntrega === 'ENVIO' && !envioActivo) {
        setError('El envío a domicilio se encuentra deshabilitado en este momento.');
        return;
      }

      if (tipoEntrega === 'RETIRO' && !retiroActivo) {
        setError('El retiro en local se encuentra deshabilitado en este momento.');
        return;
      }
    }

    if (!cliente.trim() || cliente.trim().length < 2) {
      setError('Ingresá tu nombre para identificar el pedido.');
      return;
    }

    if (!esMesa) {
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
    }

    await onConfirmarPedido({
      cliente: cliente.trim(),
      telefono: esMesa ? undefined : telefonoNormalizado,
      tipoEntrega: esMesa ? 'MESA' : tipoEntrega,
      origen: esMesa ? 'MESA_QR' : 'WEB',
      mesa: esMesa ? Number(mesa) : null,
      direccion: !esMesa && tipoEntrega === 'ENVIO' ? direccion.trim() : '',
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
              {esMesa ? ` · Mesa #${mesa}` : ''}
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

          {/* Modalidad: Mesa fija o Selector Envío vs Retiro */}
          {esMesa ? (
            <div className="p-3.5 rounded-2xl bg-amber-500/12 border border-amber-400/35 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center shrink-0">
                <UtensilsCrossed size={18} className="text-amber-300" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-black uppercase tracking-wider text-amber-300">
                  Consumo en Mesa #{mesa}
                </div>
                <p className="text-[11px] text-gray-300 leading-snug mt-0.5">
                  Tu pedido se enviará directo a caja identificado con tu mesa.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={!envioActivo}
                  onClick={() => handleSeleccionarEntrega('ENVIO')}
                  className={`p-3 rounded-2xl border text-left transition-colors flex items-center gap-2.5 ${
                    !envioActivo
                      ? 'bg-black/25 border-white/5 text-gray-600 opacity-55 cursor-not-allowed'
                      : tipoEntrega === 'ENVIO'
                      ? 'bg-orange-600/20 border-orange-500 text-white cursor-pointer'
                      : 'bg-black/40 border-white/10 text-gray-400 hover:text-white cursor-pointer'
                  }`}
                >
                  <Bike
                    size={18}
                    className={envioActivo && tipoEntrega === 'ENVIO' ? 'text-orange-400' : ''}
                  />
                  <div className="min-w-0">
                    <div className="text-xs font-black uppercase">Envío</div>
                    <div className="text-[10px] opacity-75 truncate">
                      {envioActivo ? 'A domicilio' : 'No disponible'}
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  disabled={!retiroActivo}
                  onClick={() => handleSeleccionarEntrega('RETIRO')}
                  className={`p-3 rounded-2xl border text-left transition-colors flex items-center gap-2.5 ${
                    !retiroActivo
                      ? 'bg-black/25 border-white/5 text-gray-600 opacity-55 cursor-not-allowed'
                      : tipoEntrega === 'RETIRO'
                      ? 'bg-orange-600/20 border-orange-500 text-white cursor-pointer'
                      : 'bg-black/40 border-white/10 text-gray-400 hover:text-white cursor-pointer'
                  }`}
                >
                  <Store
                    size={18}
                    className={retiroActivo && tipoEntrega === 'RETIRO' ? 'text-orange-400' : ''}
                  />
                  <div className="min-w-0">
                    <div className="text-xs font-black uppercase">Retiro</div>
                    <div className="text-[10px] opacity-75 truncate">
                      {retiroActivo ? 'En el local' : 'No disponible'}
                    </div>
                  </div>
                </button>
              </div>

              {!envioActivo && retiroActivo && (
                <p className="text-[11px] text-amber-300/90 bg-amber-500/10 border border-amber-500/25 rounded-xl px-3 py-2 flex items-center gap-2">
                  <AlertCircle size={14} className="shrink-0 text-amber-400" />
                  <span>
                    El envío a domicilio está deshabilitado por el momento. Solo disponible para{' '}
                    <strong className="font-black">retiro en el local</strong>.
                  </span>
                </p>
              )}

              {envioActivo && !retiroActivo && (
                <p className="text-[11px] text-amber-300/90 bg-amber-500/10 border border-amber-500/25 rounded-xl px-3 py-2 flex items-center gap-2">
                  <AlertCircle size={14} className="shrink-0 text-amber-400" />
                  <span>
                    El retiro en local está deshabilitado por el momento. Solo disponible con{' '}
                    <strong className="font-black">envío a domicilio</strong>.
                  </span>
                </p>
              )}

              {sinModalidadDisponible && (
                <p className="text-[11px] text-red-300 bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2 flex items-center gap-2">
                  <AlertCircle size={14} className="shrink-0 text-red-400" />
                  <span>
                    No hay modalidades de entrega activas en este momento.
                  </span>
                </p>
              )}
            </div>
          )}

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
                placeholder="Ej. Juan Pérez"
                maxLength={60}
                className="w-full bg-black/60 border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-orange-500"
              />
            </div>

            {!esMesa && (
              <>
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
                      telefonoLimpio && !telefonoFormatoOk
                        ? 'border-red-500/70 focus:border-red-500'
                        : 'border-white/15 focus:border-orange-500'
                    }`}
                  />
                  {telefonoLimpio && !telefonoFormatoOk && (
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
                          <ShieldCheck size={13} /> Verifiqué mi número ({telefonoNormalizado})
                        </span>
                        <span className="block text-gray-400">
                          Si el número es incorrecto o falso, el pedido no se tomará.
                        </span>
                      </span>
                    </label>
                  )}
                </div>

                {tipoEntrega === 'ENVIO' && envioActivo && (
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-gray-400 mb-1">
                      Dirección de entrega *
                    </label>
                    <input
                      type="text"
                      value={direccion}
                      onChange={(e) => setDireccion(e.target.value)}
                      placeholder="Barrio, calle, número"
                      maxLength={120}
                      className="w-full bg-black/60 border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-orange-500"
                    />
                  </div>
                )}
              </>
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

          {/* Recordatorio visible antes de confirmar */}
          <div className="rounded-2xl bg-amber-500/12 border border-amber-400/35 px-3.5 py-2.5 flex items-start gap-2.5">
            <BellRing size={16} className="text-amber-300 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-snug text-amber-100">
              <p className="font-black uppercase tracking-wide text-amber-300">
                Recordatorio antes de confirmar
              </p>
              <p className="mt-0.5 text-gray-200">
                {esMesa
                  ? 'Revisá bien los ítems y observaciones de tu pedido. Una vez enviado pasa directo a cocina y caja.'
                  : 'Verificá que tu teléfono sea correcto: nos comunicamos por WhatsApp o llamada para confirmar tu pedido antes de prepararlo.'}
              </p>
            </div>
          </div>

          {error && (
            <p className="text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={enviando || sinModalidadDisponible}
            className="w-full bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-transform active:scale-[0.99] cursor-pointer"
          >
            <CheckCircle2 size={16} />
            {enviando
              ? 'Enviando pedido...'
              : esMesa
              ? `Enviar a Caja · Mesa #${mesa} · $${totalPedido.toLocaleString('es-AR')}`
              : `Enviar Pedido · $${totalPedido.toLocaleString('es-AR')}`}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ModalCheckout;