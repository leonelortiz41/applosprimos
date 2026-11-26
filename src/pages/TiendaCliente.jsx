import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { apiCliente } from '../services/apiCliente';
import HeaderTienda from '../components/HeaderTienda';
import CardProducto from '../components/CardProducto';
import DrawerCarrito from '../components/DrawerCarrito';
import ModalCheckout from '../components/ModalCheckout';
import ModalPersonalizar from '../components/ModalPersonalizar';
import BarraCarritoFlotante from '../components/BarraCarritoFlotante';
import PedidoConfirmado from '../components/PedidoConfirmado';
import EstadoSinSistema from '../components/EstadoSinSistema';

const API_URL = import.meta.env.VITE_API_URL;
const CONFIG_STORAGE_KEY = 'bar_los_primos_config_web_v1';
const MESA_SESSION_KEY = 'bar_los_primos_mesa_activa';
const TIEMPO_EXPIRACION_MESA_MS = 4 * 60 * 60 * 1000;

const CATEGORIAS_TABS = [
  { id: 'todas', label: 'Todas' },
  { id: 'platos', label: 'Platos' },
  { id: 'hamburguesas', label: 'Hamburguesas' },
  { id: 'milanesas', label: 'Milanesas' },
  { id: 'lomitos', label: 'Lomitos' },
  { id: 'pizzas', label: 'Pizzas' },
  { id: 'empanadas', label: 'Empanadas' },
  { id: 'papas', label: 'Papas' },
  { id: 'bebidas', label: 'Bebidas' }
];

const limpiarParametrosMesaEnUrl = () => {
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
    const nuevaUrl = `${url.pathname}${url.search}${url.hash}`;
    window.history.replaceState({}, '', nuevaUrl);
  }
};

const borrarSesionMesa = () => {
  try {
    sessionStorage.removeItem(MESA_SESSION_KEY);
  } catch {
    // Ignorar si no hay acceso a sessionStorage
  }
};

const guardarSesionMesa = (numero, token = '') => {
  try {
    sessionStorage.setItem(
      MESA_SESSION_KEY,
      JSON.stringify({
        numero,
        token: String(token || '').trim(),
        guardadoEn: Date.now()
      })
    );
  } catch {
    // Ignorar si no hay acceso a sessionStorage
  }
};

const leerSesionMesaInicial = () => {
  if (typeof window === 'undefined') return { mesa: null, token: '' };

  const params = new URLSearchParams(window.location.search);
  const rawMesa = params.get('mesa');
  const rawTokenUrl = String(params.get('token') || '').trim();
  const forzarWeb = params.get('modo') === 'web';

  limpiarParametrosMesaEnUrl();

  if (forzarWeb) {
    borrarSesionMesa();
    return { mesa: null, token: '' };
  }

  let sesionPrevia = null;
  try {
    const rawGuardada = sessionStorage.getItem(MESA_SESSION_KEY);
    if (rawGuardada) {
      const parsed = JSON.parse(rawGuardada);
      const numeroGuardado = Number.parseInt(parsed?.numero, 10);
      const guardadoEn = Number(parsed?.guardadoEn) || 0;
      const tokenGuardado = String(parsed?.token || '').trim();

      if (Date.now() - guardadoEn > TIEMPO_EXPIRACION_MESA_MS) {
        borrarSesionMesa();
      } else if (
        Number.isInteger(numeroGuardado) &&
        numeroGuardado > 0 &&
        numeroGuardado <= 200 &&
        tokenGuardado
      ) {
        sesionPrevia = {
          mesa: numeroGuardado,
          token: tokenGuardado
        };
      } else {
        borrarSesionMesa();
      }
    }
  } catch {
    // Ignorar si no hay acceso a sessionStorage
  }

  if (rawMesa !== null) {
    const limpia = String(rawMesa).trim().replace(/^#/, '');
    const numero = Number.parseInt(limpia, 10);
    if (Number.isInteger(numero) && numero > 0 && numero <= 200) {
      if (!rawTokenUrl) {
        borrarSesionMesa();
        return { mesa: null, token: '' };
      }
      guardarSesionMesa(numero, rawTokenUrl);
      return { mesa: numero, token: rawTokenUrl };
    }
    borrarSesionMesa();
    return { mesa: null, token: '' };
  }

  if (sesionPrevia) {
    return sesionPrevia;
  }

  return { mesa: null, token: '' };
};

const extraerTokenMesaDesdeConfig = (data = {}, numeroMesa = null) => {
  if (!numeroMesa || !data || typeof data !== 'object') return '';
  const mapaTokens = data.tokensMesa || data.tokens_mesa;
  if (mapaTokens && typeof mapaTokens === 'object') {
    const porMesa = mapaTokens[String(numeroMesa)] ?? mapaTokens[numeroMesa];
    if (porMesa != null && String(porMesa).trim()) {
      return String(porMesa).trim();
    }
  }
  const tokenGeneral = data.tokenMesa ?? data.token_mesa ?? data.tokenTurno ?? '';
  return String(tokenGeneral).trim();
};

const construirClaveItem = (id, clase, notas = []) => {
  const base = `${clase}-${id}`;
  if (!notas || notas.length === 0) return base;
  return `${base}::${notas.join('|')}`;
};

const leerConfigCache = () => {
  try {
    const raw = localStorage.getItem(CONFIG_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const normalizarConfigWeb = (data = {}, baseActual = {}) => ({
  tiendaAbierta:
    typeof data.tiendaAbierta === 'boolean'
      ? data.tiendaAbierta
      : typeof baseActual.tiendaAbierta === 'boolean'
        ? baseActual.tiendaAbierta
        : true,
  envioActivo:
    typeof data.envioActivo === 'boolean'
      ? data.envioActivo
      : typeof baseActual.envioActivo === 'boolean'
        ? baseActual.envioActivo
        : true,
  retiroActivo:
    typeof data.retiroActivo === 'boolean'
      ? data.retiroActivo
      : typeof baseActual.retiroActivo === 'boolean'
        ? baseActual.retiroActivo
        : true,
  mensajeCierre:
    data.mensajeCierre ||
    baseActual.mensajeCierre ||
    'Estamos cerrados por el momento. Volvé a intentar más tarde.',
  idsPausadosWeb: Array.isArray(data.idsPausadosWeb)
    ? data.idsPausadosWeb
    : Array.isArray(baseActual.idsPausadosWeb)
      ? baseActual.idsPausadosWeb
      : []
});

const TiendaCliente = () => {
  const cacheInicial = leerConfigCache();
  const sesionInicial = leerSesionMesaInicial();

  const [mesa, setMesa] = useState(sesionInicial.mesa);
  const [tokenMesa, setTokenMesa] = useState(sesionInicial.token);

  const [productos, setProductos] = useState([]);
  const [adicionalesDB, setAdicionalesDB] = useState([]);
  const [configWeb, setConfigWeb] = useState(() =>
    normalizarConfigWeb(cacheInicial || {})
  );

  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState(false);
  const [categoriaActiva, setCategoriaActiva] = useState('todas');
  const [busqueda, setBusqueda] = useState('');
  const [carrito, setCarrito] = useState([]);
  const [productoPersonalizando, setProductoPersonalizando] = useState(null);
  const [carritoAbierto, setCarritoAbierto] = useState(false);
  const [checkoutAbierto, setCheckoutAbierto] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [pedidoConfirmado, setPedidoConfirmado] = useState(null);

  const handleSalirMesa = useCallback(() => {
    borrarSesionMesa();
    setMesa(null);
    setTokenMesa('');
  }, []);

  const cargarConfigWeb = useCallback(async () => {
    if (!API_URL) return null;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    try {
      const res = await fetch(`${API_URL}/configuracion-web`, {
        signal: controller.signal,
        cache: 'no-store'
      });
      if (!res.ok) return null;
      const data = await res.json();

      if (mesa) {
        const tokenVigente = extraerTokenMesaDesdeConfig(data, mesa);
        if (tokenVigente) {
          setTokenMesa(tokenVigente);
          guardarSesionMesa(mesa, tokenVigente);
        }
      }

      let actualizada = null;
      setConfigWeb((prev) => {
        actualizada = normalizarConfigWeb(data, prev);
        return actualizada;
      });
      if (actualizada) {
        try {
          localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(actualizada));
        } catch {
          // Ignorar si no hay acceso a localStorage
        }
      }
      return actualizada;
    } catch {
      return null;
    } finally {
      clearTimeout(timeoutId);
    }
  }, [mesa]);

  const cargarMenu = useCallback(async () => {
    setCargando(true);
    setErrorCarga(false);
    try {
      const [lista, extras] = await Promise.all([
        apiCliente.obtenerMenuCompleto(),
        apiCliente.obtenerAdicionales()
      ]);
      setProductos(lista);
      setAdicionalesDB(extras);
      await cargarConfigWeb();
    } catch (err) {
      console.error(err);
      setErrorCarga(true);
    } finally {
      setCargando(false);
    }
  }, [cargarConfigWeb]);

  useEffect(() => {
    cargarMenu();
  }, [cargarMenu]);

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === CONFIG_STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setConfigWeb((prev) => normalizarConfigWeb(parsed, prev));
        } catch {
          // Ignorar JSON inválido
        }
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const setPausados = useMemo(
    () => new Set(configWeb.idsPausadosWeb || []),
    [configWeb.idsPausadosWeb]
  );

  const esProductoSinStock = useCallback(
    (prod) => setPausados.has(`${prod.clase}-${prod.id}`),
    [setPausados]
  );

  useEffect(() => {
    if (setPausados.size === 0) return;
    setCarrito((prev) =>
      prev.filter((item) => !setPausados.has(`${item.clase}-${item.id}`))
    );
  }, [setPausados]);

  const tabsVisibles = useMemo(() => {
    const clasesConItems = new Set(productos.map((p) => p.clase));
    return CATEGORIAS_TABS.filter(
      (tab) => tab.id === 'todas' || clasesConItems.has(tab.id)
    );
  }, [productos]);

  useEffect(() => {
    const sigueVisible = tabsVisibles.some((tab) => tab.id === categoriaActiva);
    if (!sigueVisible) {
      setCategoriaActiva('todas');
    }
  }, [tabsVisibles, categoriaActiva]);

  const agregarItemAlCarrito = (producto, precioUnitario, notas = []) => {
    if (!configWeb.tiendaAbierta || esProductoSinStock(producto)) return;
    const precioUnit = Number(precioUnitario ?? producto.precio) || 0;
    const claveItem = construirClaveItem(producto.id, producto.clase, notas);

    setCarrito((prev) => {
      const idx = prev.findIndex((item) => item.claveItem === claveItem);
      if (idx > -1) {
        const copia = [...prev];
        copia[idx] = { ...copia[idx], cantidad: copia[idx].cantidad + 1 };
        return copia;
      }
      return [
        ...prev,
        {
          ...producto,
          claveItem,
          precio: precioUnit,
          precioUnitario: precioUnit,
          notas,
          cantidad: 1
        }
      ];
    });
  };

  const cambiarCantidadPorClave = (claveItem, nuevaCantidad) => {
    setCarrito((prev) => {
      if (nuevaCantidad <= 0) {
        return prev.filter((item) => item.claveItem !== claveItem);
      }
      return prev.map((item) =>
        item.claveItem === claveItem ? { ...item, cantidad: nuevaCantidad } : item
      );
    });
  };

  const vaciarCarrito = () => {
    setCarrito([]);
    setCarritoAbierto(false);
  };

  const obtenerCantidadBase = (producto) => {
    const claveBase = construirClaveItem(producto.id, producto.clase, []);
    const encontrado = carrito.find((item) => item.claveItem === claveBase);
    return encontrado ? encontrado.cantidad : 0;
  };

  const productosFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return productos.filter((p) => {
      const coincideCategoria =
        categoriaActiva === 'todas' || p.clase === categoriaActiva;
      const coincideBusqueda =
        !q || String(p.nombre || '').toLowerCase().includes(q);
      return coincideCategoria && coincideBusqueda;
    });
  }, [productos, categoriaActiva, busqueda]);

  const cantidadTotal = useMemo(
    () => carrito.reduce((acc, item) => acc + item.cantidad, 0),
    [carrito]
  );

  const totalCarrito = useMemo(
    () =>
      carrito.reduce(
        (acc, item) =>
          acc + (Number(item.precioUnitario ?? item.precio) || 0) * item.cantidad,
        0
      ),
    [carrito]
  );

  const handleAbrirCheckout = async () => {
    const configFresca = await cargarConfigWeb();
    const abierta = configFresca?.tiendaAbierta ?? configWeb.tiendaAbierta;
    if (!abierta || cantidadTotal === 0) return;
    setCheckoutAbierto(true);
  };

  const handleConfirmarPedido = async (datosCliente) => {
    const configFresca = await cargarConfigWeb();
    const abierta = configFresca?.tiendaAbierta ?? configWeb.tiendaAbierta;
    const mensajeCierre = configFresca?.mensajeCierre || configWeb.mensajeCierre;

    if (!abierta) {
      alert(mensajeCierre || 'La tienda web se encuentra cerrada.');
      return;
    }

    const esMesa = Boolean(mesa);
    const tipoEntregaFinal = esMesa ? 'MESA' : datosCliente.tipoEntrega;
    const tokenActivo = esMesa
      ? (configFresca ? extraerTokenMesaDesdeConfig(configFresca, mesa) : '') || tokenMesa
      : null;

    if (esMesa && !tokenActivo) {
      alert(
        'No se pudo validar el código de la mesa. Escaneá el QR de la mesa o pedí como envío/retiro.'
      );
      return;
    }

    setEnviando(true);
    try {
      await apiCliente.crearPedido({
        ...datosCliente,
        tipoEntrega: tipoEntregaFinal,
        mesa: esMesa ? mesa : null,
        token: esMesa ? tokenActivo : null,
        origen: esMesa ? 'MESA_QR' : 'WEB',
        carrito
      });
      setPedidoConfirmado({
        ...datosCliente,
        tipoEntrega: tipoEntregaFinal,
        mesa: esMesa ? mesa : null,
        total: totalCarrito,
        cantidad: cantidadTotal
      });
      setCarrito([]);
      setCheckoutAbierto(false);
      setCarritoAbierto(false);
    } catch (err) {
      console.error(err);
      const mensajeError =
        err?.response?.data?.error ||
        err?.message ||
        'Hubo un problema al enviar tu pedido. Por favor intentá nuevamente.';
      alert(mensajeError);
    } finally {
      setEnviando(false);
    }
  };

  const subtituloModalidad = useMemo(() => {
    if (!configWeb.tiendaAbierta) return 'Pedidos online no disponibles';
    if (mesa) return `Consumo en el local · Mesa #${mesa}`;
    if (configWeb.envioActivo && configWeb.retiroActivo) {
      return 'Retiro en local o envío a domicilio';
    }
    if (configWeb.envioActivo) return 'Envío a domicilio disponible';
    if (configWeb.retiroActivo) return 'Retiro en local disponible';
    return 'Consultá disponibilidad';
  }, [
    configWeb.tiendaAbierta,
    configWeb.envioActivo,
    configWeb.retiroActivo,
    mesa
  ]);

  if (pedidoConfirmado) {
    return (
      <PedidoConfirmado
        pedido={pedidoConfirmado}
        onNuevoPedido={() => setPedidoConfirmado(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#090a0d] text-white pb-28">
      <HeaderTienda
        tiendaAbierta={configWeb.tiendaAbierta}
        sinSistema={errorCarga || cargando}
        envioActivo={configWeb.envioActivo}
        subtitulo={subtituloModalidad}
        mesa={mesa}
        onSalirMesa={handleSalirMesa}
        busqueda={busqueda}
        onChangeBusqueda={setBusqueda}
        tabsVisibles={tabsVisibles}
        categoriaActiva={categoriaActiva}
        onSeleccionarCategoria={setCategoriaActiva}
      />

      <main className="max-w-4xl mx-auto px-4 pt-4">
        {cargando ? (
          <div className="py-16 text-center text-xs font-bold uppercase text-gray-400">
            Cargando menú...
          </div>
        ) : errorCarga ? (
          <EstadoSinSistema
            tipo="sin_conexion"
            reintentando={cargando}
            onReintentar={cargarMenu}
          />
        ) : !configWeb.tiendaAbierta ? (
          <EstadoSinSistema
            tipo="cerrado"
            mensaje={configWeb.mensajeCierre}
            reintentando={cargando}
            onReintentar={cargarMenu}
          />
        ) : productosFiltrados.length === 0 ? (
          <div className="py-16 text-center text-xs font-bold uppercase text-gray-500">
            No se encontraron productos con ese filtro.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {productosFiltrados.map((prod) => {
              const sinStock = esProductoSinStock(prod);
              return (
                <div
                  key={`${prod.clase}-${prod.id}`}
                  className={`relative rounded-2xl ${
                    sinStock
                      ? 'opacity-50 grayscale-[45%] pointer-events-none select-none'
                      : ''
                  }`}
                >
                  {sinStock && (
                    <span className="absolute top-3 right-3 z-10 bg-red-600/90 text-white border border-red-300/30 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider">
                      SIN STOCK
                    </span>
                  )}
                  <CardProducto
                    producto={prod}
                    sinStock={sinStock}
                    cantidadEnCarrito={sinStock ? 0 : obtenerCantidadBase(prod)}
                    onAgregarRapido={(item) => {
                      if (sinStock) return;
                      agregarItemAlCarrito(item, item.precio, []);
                    }}
                    onAbrirPersonalizar={(item) => {
                      if (sinStock) return;
                      setProductoPersonalizando(item);
                    }}
                  />
                </div>
              );
            })}
          </div>
        )}
      </main>

      <ModalPersonalizar
        producto={productoPersonalizando}
        adicionalesDB={adicionalesDB}
        onCerrar={() => setProductoPersonalizando(null)}
        onConfirmarPersonalizado={({ producto, precioUnitario, notas }) => {
          agregarItemAlCarrito(producto, precioUnitario, notas);
          setProductoPersonalizando(null);
        }}
      />

      <BarraCarritoFlotante
        cantidadTotal={cantidadTotal}
        totalCarrito={totalCarrito}
        tiendaAbierta={configWeb.tiendaAbierta}
        onAbrirCarrito={() => setCarritoAbierto(true)}
        onAbrirCheckout={handleAbrirCheckout}
        enviando={enviando}
      />

      <DrawerCarrito
        abierto={carritoAbierto}
        onCerrar={() => setCarritoAbierto(false)}
        carrito={carrito}
        onCambiarCantidad={(id, clase, nuevaCant, itemObj) => {
          const clave =
            itemObj?.claveItem || construirClaveItem(id, clase, itemObj?.notas || []);
          cambiarCantidadPorClave(clave, nuevaCant);
        }}
        onVaciarCarrito={vaciarCarrito}
        onIrACheckout={() => {
          setCarritoAbierto(false);
          handleAbrirCheckout();
        }}
      />

      <ModalCheckout
        abierto={checkoutAbierto}
        onCerrar={() => setCheckoutAbierto(false)}
        carrito={carrito}
        mesa={mesa}
        envioActivo={configWeb.envioActivo}
        retiroActivo={configWeb.retiroActivo}
        onConfirmarPedido={handleConfirmarPedido}
        enviando={enviando}
      />
    </div>
  );
};

export default TiendaCliente;