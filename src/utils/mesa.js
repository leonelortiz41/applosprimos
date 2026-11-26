const CLAVE_MESA_SESSION = 'los_primos_mesa_activa';
const TIEMPO_EXPIRACION_MESA_MS = 4 * 60 * 60 * 1000; // 4 horas

const limpiarParametrosUrl = () => {
  if (typeof window === 'undefined' || !window.history?.replaceState) return;
  const url = new URL(window.location.href);
  let modificada = false;

  for (const clave of ['mesa', 'token', 'modo']) {
    if (url.searchParams.has(clave)) {
      url.searchParams.delete(clave);
      modificada = true;
    }
  }

  if (modificada) {
    window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
  }
};

const leerRegistroStorage = () => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(CLAVE_MESA_SESSION);
    if (!raw) return null;

    // Compatibilidad si antes se guardó solo el número como string
    const numeroSimple = Number.parseInt(raw, 10);
    if (/^\d+$/.test(raw.trim()) && Number.isInteger(numeroSimple) && numeroSimple > 0) {
      return { numero: numeroSimple, token: '', guardadoEn: Date.now() };
    }

    const parsed = JSON.parse(raw);
    const numero = Number.parseInt(parsed?.numero, 10);
    const guardadoEn = Number(parsed?.guardadoEn) || 0;
    const token = String(parsed?.token || '').trim();

    if (!Number.isInteger(numero) || numero <= 0 || numero > 200) {
      sessionStorage.removeItem(CLAVE_MESA_SESSION);
      return null;
    }

    if (Date.now() - guardadoEn > TIEMPO_EXPIRACION_MESA_MS) {
      sessionStorage.removeItem(CLAVE_MESA_SESSION);
      return null;
    }

    return { numero, token, guardadoEn };
  } catch {
    return null;
  }
};

const guardarRegistroStorage = ({ numero, token = '', guardadoEn = Date.now() }) => {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(
      CLAVE_MESA_SESSION,
      JSON.stringify({
        numero: Number(numero),
        token: String(token || '').trim(),
        guardadoEn
      })
    );
  } catch {
    // Ignorar si sessionStorage no está disponible
  }
};

export const obtenerSesionMesaActual = () => {
  if (typeof window === 'undefined') return { mesa: null, token: '' };

  const params = new URLSearchParams(window.location.search);
  const rawMesa = params.get('mesa');
  const rawToken = String(params.get('token') || '').trim();
  const forzarWeb = params.get('modo') === 'web';

  limpiarParametrosUrl();

  if (forzarWeb) {
    limpiarMesaActual();
    return { mesa: null, token: '' };
  }

  const previo = leerRegistroStorage();

  if (rawMesa !== null) {
    const limpia = String(rawMesa).trim().replace(/^#/, '');
    const numero = Number.parseInt(limpia, 10);
    if (Number.isInteger(numero) && numero > 0 && numero <= 200) {
      const tokenFinal =
        rawToken || (previo && previo.numero === numero ? previo.token : '');
      guardarRegistroStorage({
        numero,
        token: tokenFinal,
        guardadoEn: Date.now()
      });
      return { mesa: numero, token: tokenFinal };
    }
  }

  if (previo) {
    return { mesa: previo.numero, token: previo.token };
  }

  return { mesa: null, token: '' };
};

export const guardarTokenMesaActual = (token = '') => {
  const previo = leerRegistroStorage();
  if (!previo) return;
  const tokenLimpio = String(token || '').trim();
  if (!tokenLimpio || tokenLimpio === previo.token) return;
  guardarRegistroStorage({
    numero: previo.numero,
    token: tokenLimpio,
    guardadoEn: previo.guardadoEn || Date.now()
  });
};

export const obtenerMesaActual = () => obtenerSesionMesaActual().mesa;

export const limpiarMesaActual = () => {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(CLAVE_MESA_SESSION);
  } catch {
    // Ignorar si sessionStorage no está disponible
  }
};