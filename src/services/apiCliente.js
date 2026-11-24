const API_URL = import.meta.env.VITE_API_URL;

const CATEGORIAS = [
  'milanesas',
  'lomitos',
  'hamburguesas',
  'pizzas',
  'papas',
  'platos',
  'empanadas',
  'bebidas'
];

const CATEGORIAS_SIN_PERSONALIZAR = new Set(['pizzas', 'papas', 'platos', 'bebidas']);
const CATEGORIAS_SANDWICH = new Set(['hamburguesas', 'lomitos', 'milanesas']);

const INGREDIENTES_SANDWICH_COMUN = ['ají', 'mayonesa', 'mostaza', 'tomate', 'lechuga'];
const INGREDIENTES_SANDWICH_ESPECIAL = [
  ...INGREDIENTES_SANDWICH_COMUN,
  'huevo',
  'jamón',
  'queso'
];

const ADICIONALES_BASE = [
  { id: 'def-1', atributo: 'CHEDDAR', valor: 0 },
  { id: 'def-2', atributo: 'BACON', valor: 0 },
  { id: 'def-3', atributo: 'HUEVO', valor: 0 },
  { id: 'def-4', atributo: 'JAMÓN', valor: 0 },
  { id: 'def-5', atributo: 'QUESO', valor: 0 },
  { id: 'def-6', atributo: 'PAPAS', valor: 0 }
];

const fetchConTimeout = async (url, options = {}, ms = 3500) => {
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

export const apiCliente = {
  esPersonalizable(clase) {
    return !CATEGORIAS_SIN_PERSONALIZAR.has(String(clase || '').toLowerCase());
  },

  obtenerIngredientesSugeridos(clase, nombreProducto = '') {
    const categoria = String(clase || '').toLowerCase();
    if (!this.esPersonalizable(categoria)) return [];

    if (CATEGORIAS_SANDWICH.has(categoria)) {
      const texto = String(nombreProducto || '').toLowerCase();
      const esEspecial =
        texto.includes('especial') ||
        texto.includes('completa') ||
        texto.includes('completo');
      return esEspecial ? INGREDIENTES_SANDWICH_ESPECIAL : INGREDIENTES_SANDWICH_COMUN;
    }

    if (categoria === 'empanadas') {
      return ['cebolla', 'aceituna', 'huevo'];
    }

    return INGREDIENTES_SANDWICH_COMUN;
  },

  obtenerAdicionalesPorCategoria(clase, adicionalesDB = []) {
    const categoria = String(clase || '').toLowerCase();
    if (categoria === 'platos') return [];

    if (categoria === 'papas') {
      return adicionalesDB.filter((ad) => {
        const attr = String(ad.atributo || '').toUpperCase();
        return !attr.includes('PAPA');
      });
    }

    return adicionalesDB;
  },

  async obtenerAdicionales() {
    try {
      const baseUrl = exigirApiUrl();
      const res = await fetchConTimeout(`${baseUrl}/configuracion`, {}, 3500);
      if (!res.ok) return ADICIONALES_BASE;
      const rows = await res.json();
      if (!Array.isArray(rows) || rows.length === 0) return ADICIONALES_BASE;

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
      return ADICIONALES_BASE;
    }
  },

  async obtenerMenuCompleto() {
    const baseUrl = exigirApiUrl();

    const resultados = await Promise.allSettled(
      CATEGORIAS.map(async (clase) => {
        const res = await fetchConTimeout(`${baseUrl}/${clase}`, {}, 3500);
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
          precio: Number(item.precio) || 0,
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

  async crearPedido({ cliente, telefono, tipoEntrega, direccion, carrito }) {
    const baseUrl = exigirApiUrl();
    const cantidadTotal = carrito.reduce((acc, item) => acc + item.cantidad, 0);
    const importeTotal = carrito.reduce(
      (acc, item) => acc + (Number(item.precioUnitario ?? item.precio) || 0) * item.cantidad,
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
        hidden_nombre: etiquetaConNotas,
        precio: subtotal,
        hidden_precio: subtotal,
        precioUnitario: precioUnit,
        cantidad: item.cantidad,
        clase: item.clase,
        hidden_clase: item.clase,
        notas
      };
    });

    const detalleTicket = itemsFormateados
      .map((i) => `${i.cantidad}x ${i.nombre}`)
      .join(', ');

    const sufijoEntrega =
      tipoEntrega === 'ENVIO' ? `ENVÍO: ${direccion}` : 'RETIRO LOCAL';

    const etiquetaCliente = `[WEB] ${cliente.trim()} · ${telefono.trim()} · ${sufijoEntrega}`;

    const payload = {
      cantidad: cantidadTotal,
      cliente: etiquetaCliente,
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
      6000
    );

    if (!res.ok) {
      throw new Error('No se pudo registrar el pedido');
    }

    return res.json();
  }
};