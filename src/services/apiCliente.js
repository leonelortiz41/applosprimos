const API_URL = String(import.meta.env.VITE_API_URL || '').trim();

const CATEGORIAS = [
  'platos',
  'milanesas',
  'lomitos',
  'hamburguesas',
  'pizzas',
  'empanadas',
  'papas',
  'bebidas'
];

const CATEGORIAS_SIN_PERSONALIZAR = new Set([
  'pizzas',
  'papas',
  'platos',
  'empanadas',
  'bebidas'
]);

const CATEGORIAS_SANDWICH = new Set(['hamburguesas', 'lomitos', 'milanesas']);
const INGREDIENTES_SANDWICH_BASE = ['ají', 'mayonesa', 'mostaza', 'tomate', 'lechuga'];

const fetchConTimeout = async (url, options = {}, ms = 8000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal
    });
  } finally {
    clearTimeout(timeoutId);
  }
};

const exigirApiUrl = () => {
  if (!API_URL) {
    throw new Error('VITE_API_URL no está configurada');
  }
  return API_URL.replace(/\/+$/, '');
};

const resolverUrlImagen = (imagen, baseUrl) => {
  if (!imagen || typeof imagen !== 'string') return null;
  const limpia = imagen.trim();
  if (!limpia) return null;
  if (/^(https?:\/\/|data:image\/)/i.test(limpia)) return limpia;
  return limpia.startsWith('/') ? `${baseUrl}${limpia}` : `${baseUrl}/${limpia}`;
};

export const apiCliente = {
  resolverImagenUrl(imagen) {
    if (!API_URL) return '';
    return resolverUrlImagen(imagen, API_URL.replace(/\/+$/, '')) || '';
  },

  esPersonalizable(clase) {
    return !CATEGORIAS_SIN_PERSONALIZAR.has(
      String(clase || '').trim().toLowerCase()
    );
  },

  obtenerIngredientesSugeridos(clase) {
    const categoria = String(clase || '').trim().toLowerCase();
    if (!this.esPersonalizable(categoria)) return [];
    return CATEGORIAS_SANDWICH.has(categoria) ? INGREDIENTES_SANDWICH_BASE : [];
  },

  obtenerAdicionalesPorCategoria(clase, adicionalesDB = []) {
    const categoria = String(clase || '').trim().toLowerCase();
    if (categoria === 'platos') return [];

    if (categoria === 'papas') {
      return adicionalesDB.filter(
        (ad) => !String(ad.atributo || '').toUpperCase().includes('PAPA')
      );
    }

    return adicionalesDB;
  },

  async obtenerAdicionales() {
    try {
      const baseUrl = exigirApiUrl();
      const res = await fetchConTimeout(`${baseUrl}/configuracion`, {}, 8000);
      if (!res.ok) return [];
      const rows = await res.json();
      if (!Array.isArray(rows) || rows.length === 0) return [];

      const filtrados = rows.filter((item) => {
        const tipo = String(item.tipo || '').toLowerCase();
        return tipo.includes('adic') || tipo.includes('extra') || tipo === '';
      });

      const fuente = filtrados.length > 0 ? filtrados : rows;
      return fuente.map((item, idx) => ({
        id: item.id ?? `cfg-${idx}`,
        atributo: String(item.atributo || '').toUpperCase(),
        valor: Number(item.valor) || 0
      }));
    } catch (err) {
      console.warn('No se pudieron cargar adicionales desde /configuracion:', err);
      return [];
    }
  },

  async obtenerMenuCompleto() {
    const baseUrl = exigirApiUrl();

    const resultados = await Promise.allSettled(
      CATEGORIAS.map(async (clase) => {
        const res = await fetchConTimeout(`${baseUrl}/${clase}`, {}, 8000);
        if (!res.ok) {
          console.warn(`Categoría "${clase}" no disponible (${res.status})`);
          return [];
        }
        const data = await res.json();
        const items = Array.isArray(data) ? data : data?.data || [];
        return items.map((item) => ({
          ...item,
          id: item.id,
          nombre: item.nombre,
          descripcion: String(item.descripcion || '').trim(),
          precio: Number(item.precio) || 0,
          imagen: resolverUrlImagen(item.imagen, baseUrl),
          clase
        }));
      })
    );

    const productos = resultados
      .filter((r) => r.status === 'fulfilled')
      .flatMap((r) => r.value);

    if (productos.length === 0) {
      throw new Error('No se encontraron productos disponibles en el menú');
    }

    return productos;
  },

  async crearPedido({
    cliente,
    telefono,
    tipoEntrega,
    direccion,
    mesa,
    token,
    origen,
    carrito
  }) {
    const baseUrl = exigirApiUrl();
    const cantidadTotal = carrito.reduce((acc, item) => acc + item.cantidad, 0);
    const importeTotal = carrito.reduce(
      (acc, item) =>
        acc + (Number(item.precioUnitario ?? item.precio) || 0) * item.cantidad,
      0
    );

    const itemsFormateados = carrito.map((item) => {
      const precioUnit = Number(item.precioUnitario ?? item.precio) || 0;
      const subtotal = precioUnit * item.cantidad;
      const notas = Array.isArray(item.notas) ? item.notas : [];
      const etiquetaConNotas =
        notas.length > 0 ? `${item.nombre} (${notas.join(', ')})` : item.nombre;

      return {
        id: item.id,
        nombre: etiquetaConNotas,
        precio: subtotal,
        precioUnitario: precioUnit,
        cantidad: item.cantidad,
        clase: item.clase,
        notas
      };
    });

    const detalleTicket = itemsFormateados
      .map((i) => `${i.cantidad}x ${i.nombre}`)
      .join(', ');

    const esMesa = tipoEntrega === 'MESA' || Boolean(mesa);
    const nombreLimpio = (cliente || '').trim() || (esMesa ? 'CLIENTE EN MESA' : '');
    const telLimpio = (telefono || '').trim();
    const tokenLimpio = String(token || '').trim();

    const sufijoEntrega = esMesa
      ? `MESA #${mesa}`
      : tipoEntrega === 'ENVIO'
      ? `ENVÍO: ${direccion}`
      : 'RETIRO LOCAL';

    const prefijoCanal = esMesa ? '[MESA]' : '[WEB]';
    const etiquetaCliente = [
      prefijoCanal,
      nombreLimpio,
      telLimpio || null,
      sufijoEntrega
    ]
      .filter(Boolean)
      .join(' · ');

    const payload = {
      cantidad: cantidadTotal,
      cliente: etiquetaCliente,
      telefono: esMesa ? undefined : telLimpio,
      mesa: esMesa ? Number(mesa) : null,
      token: esMesa ? tokenLimpio : null,
      origen: origen || (esMesa ? 'MESA_QR' : 'WEB'),
      tipoEntrega: esMesa ? 'MESA' : tipoEntrega,
      pedido: itemsFormateados,
      detalle: detalleTicket,
      detalleTicket,
      importe: importeTotal,
      statu: '0',
      pagado: 0,
      pj: 0
    };

    const res = await fetchConTimeout(
      `${baseUrl}/pedidos`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      },
      10000
    );

    if (!res.ok) {
      let mensajeError = 'No se pudo registrar el pedido';
      try {
        const errData = await res.json();
        mensajeError = errData?.error || errData?.message || mensajeError;
      } catch {
        // Mantener mensaje por defecto si no hay JSON de error
      }
      throw new Error(mensajeError);
    }

    return res.json();
  }
};