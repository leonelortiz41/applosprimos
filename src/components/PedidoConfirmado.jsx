import React from 'react';
import { CheckCircle2, RotateCcw, MessageCircle } from 'lucide-react';

const PedidoConfirmado = ({ pedido, onNuevoPedido }) => {
  if (!pedido) return null;

  return (
    <div className="min-h-screen bg-[#090a0d] text-white flex items-center justify-center p-4">
      <div className="anim-fade-up bg-[#111318] border border-green-500/30 rounded-3xl max-w-md w-full p-6 text-center space-y-4 shadow-2xl">
        <div className="w-14 h-14 rounded-2xl bg-green-500/15 text-green-400 flex items-center justify-center mx-auto">
          <CheckCircle2 size={32} />
        </div>

        <h1 className="text-xl font-black uppercase">¡Pedido Enviado!</h1>

        <p className="text-sm text-gray-300">
          Gracias <strong className="text-white">{pedido.cliente}</strong>, ya recibimos tu
          pedido en <strong className="text-orange-400">Bar Los Primos</strong>.
        </p>

        <div className="bg-emerald-500/10 border border-emerald-500/25 rounded-2xl p-3 text-xs text-emerald-200 flex items-center justify-center gap-2">
          <MessageCircle size={16} className="text-emerald-400 shrink-0" />
          <span>El cajero te confirmará tu pedido por WhatsApp brevemente.</span>
        </div>

        <div className="bg-black/50 border border-white/10 rounded-2xl p-4 text-xs text-left space-y-1.5 text-gray-300">
          <div>
            <strong className="text-white">Modalidad:</strong>{' '}
            {pedido.tipoEntrega === 'ENVIO' ? 'Envío a domicilio' : 'Retiro en local'}
          </div>
          {pedido.tipoEntrega === 'ENVIO' && (
            <div>
              <strong className="text-white">Dirección:</strong> {pedido.direccion}
            </div>
          )}
          <div>
            <strong className="text-white">Teléfono:</strong> {pedido.telefono}
          </div>
          <div>
            <strong className="text-white">Total:</strong>{' '}
            <span className="text-orange-400 font-black">
              ${pedido.total.toLocaleString('es-AR')}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onNuevoPedido}
          className="w-full bg-orange-600 hover:bg-orange-500 text-white py-3 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-transform active:scale-95 cursor-pointer"
        >
          <RotateCcw size={15} /> Hacer otro pedido
        </button>
      </div>
    </div>
  );
};

export default PedidoConfirmado;