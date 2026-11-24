import React from 'react';
import { Clock, PauseCircle, RefreshCw } from 'lucide-react';

const HORARIO_ATENCION = '20:30 a 00:30 hs';

const EstadoSinSistema = ({
  tipo = 'sin_conexion', // 'sin_conexion' | 'cerrado'
  mensaje,
  reintentando = false,
  onReintentar
}) => {
  const esCerradoConServidor = tipo === 'cerrado';

  const titulo = esCerradoConServidor
    ? 'Pedidos Web Pausados Temporalmente'
    : 'Local Cerrado';

  const descripcion = esCerradoConServidor
    ? mensaje ||
      'Por el momento no estamos tomando pedidos desde la web. Volvé a intentar en unos minutos.'
    : 'El local se encuentra cerrado en este momento. Por favor, volvé a consultar durante el horario habitual de atención.';

  return (
    <section className="max-w-lg mx-auto my-8 bg-gradient-to-b from-[#14171f] to-[#0e1015] border border-white/10 rounded-3xl p-6 text-center space-y-4 shadow-2xl">
      <div
        className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center border ${
          esCerradoConServidor
            ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
            : 'bg-red-500/15 text-red-400 border-red-500/30'
        }`}
      >
        {esCerradoConServidor ? <PauseCircle size={26} /> : <Clock size={26} />}
      </div>

      <div className="space-y-2">
        <h2 className="text-base sm:text-lg font-black uppercase tracking-tight text-white">
          {titulo}
        </h2>
        <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
          {descripcion}
        </p>
      </div>

      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs font-bold text-orange-300">
        <Clock size={14} className="text-orange-400 shrink-0" />
        <span>Horario habitual: {HORARIO_ATENCION}</span>
      </div>

      {onReintentar && (
        <div className="pt-1">
          <button
            type="button"
            disabled={reintentando}
            onClick={onReintentar}
            className="bg-orange-600 hover:bg-orange-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider inline-flex items-center justify-center gap-2 transition-all cursor-pointer disabled:cursor-not-allowed"
          >
            <RefreshCw size={14} className={reintentando ? 'animate-spin' : ''} />
            <span>{reintentando ? 'Consultando...' : 'Actualizar'}</span>
          </button>
        </div>
      )}
    </section>
  );
};

export default EstadoSinSistema;