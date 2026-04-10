import type {
  Cliente, Bundle, AddonTV, LineaAdicional, Dispositivo, ResultadoBusquedaBundle, SatisfaccionRiesgo
} from '../types'

// ═══════════════════════════════════════════════════════════════
// CATÁLOGO DE BUNDLES
// ═══════════════════════════════════════════════════════════════

export const catalogoBundles: Bundle[] = [
  // ── FIBRA SOLA ──
  {
    id: 'baf-300', nombre: 'Fibra 300 Mb', descripcion: 'Solo fibra sin línea móvil',
    categoria: 'fibra_sola', precio: 29.90, disponible: true,
    ingredientes: { fibra: 300 }
  },
  {
    id: 'baf-600', nombre: 'Fibra 600 Mb', descripcion: 'Solo fibra sin línea móvil',
    categoria: 'fibra_sola', precio: 39.90, disponible: true,
    ingredientes: { fibra: 600 }
  },
  {
    id: 'baf-1g', nombre: 'Fibra 1 Gb', descripcion: 'Solo fibra sin línea móvil',
    categoria: 'fibra_sola', precio: 49.90, disponible: true,
    ingredientes: { fibra: 1000 }
  },

  // ── CONVERGENTE 1 LÍNEA ──
  {
    id: 'cv1-300-20', nombre: 'Fusión 300Mb + Móvil 20GB',
    descripcion: 'Fibra 300Mb con una línea móvil de 20GB',
    categoria: 'convergente_1l', precio: 44.90, disponible: true,
    ingredientes: { fibra: 300, lineas: [{ datos: 20, tipo: 'principal' }] }
  },
  {
    id: 'cv1-600-30', nombre: 'Fusión 600Mb + Móvil 30GB',
    descripcion: 'Fibra 600Mb con una línea móvil de 30GB',
    categoria: 'convergente_1l', precio: 54.90, disponible: true, destacado: true,
    ingredientes: { fibra: 600, lineas: [{ datos: 30, tipo: 'principal' }] }
  },
  {
    id: 'cv1-600-inf', nombre: 'Fusión 600Mb + Móvil Ilimitado',
    descripcion: 'Fibra 600Mb con una línea móvil ilimitada',
    categoria: 'convergente_1l', precio: 64.90, disponible: true, tag: 'Más vendido',
    ingredientes: { fibra: 600, lineas: [{ datos: 'ilimitado', tipo: 'principal' }] }
  },
  {
    id: 'cv1-1g-inf', nombre: 'Fusión 1Gb + Móvil Ilimitado',
    descripcion: 'Fibra 1Gb con una línea móvil ilimitada',
    categoria: 'convergente_1l', precio: 74.90, disponible: true, tag: 'Premium',
    ingredientes: { fibra: 1000, lineas: [{ datos: 'ilimitado', tipo: 'principal' }] }
  },

  // ── CONVERGENTE 2 LÍNEAS ──
  {
    id: 'cv2-600-inf-30', nombre: 'Fusión 600Mb + Ilimitado + 2ª 30GB',
    descripcion: 'Fibra 600Mb con línea ilimitada y segunda línea de 30GB',
    categoria: 'convergente_2l', precio: 79.90, disponible: true,
    ingredientes: { fibra: 600, lineas: [{ datos: 'ilimitado', tipo: 'principal' }, { datos: 30, tipo: 'adicional' }] }
  },
  {
    id: 'cv2-600-inf-inf', nombre: 'Fusión 600Mb + Ilimitado x2',
    descripcion: 'Fibra 600Mb con dos líneas móviles ilimitadas',
    categoria: 'convergente_2l', precio: 89.90, disponible: true, destacado: true,
    ingredientes: { fibra: 600, lineas: [{ datos: 'ilimitado', tipo: 'principal' }, { datos: 'ilimitado', tipo: 'adicional' }] }
  },
  {
    id: 'cv2-1g-inf-30', nombre: 'Fusión 1Gb + Ilimitado + 2ª 30GB',
    descripcion: 'Fibra 1Gb con línea ilimitada y segunda línea de 30GB',
    categoria: 'convergente_2l', precio: 89.90, disponible: true,
    ingredientes: { fibra: 1000, lineas: [{ datos: 'ilimitado', tipo: 'principal' }, { datos: 30, tipo: 'adicional' }] }
  },
  {
    id: 'cv2-1g-inf-inf', nombre: 'Fusión 1Gb + Ilimitado x2',
    descripcion: 'Fibra 1Gb con dos líneas móviles ilimitadas',
    categoria: 'convergente_2l', precio: 99.90, disponible: true, tag: 'Top',
    ingredientes: { fibra: 1000, lineas: [{ datos: 'ilimitado', tipo: 'principal' }, { datos: 'ilimitado', tipo: 'adicional' }] }
  },
  // ── SOLO MÓVIL ──
  {
    id: 'mov-20', nombre: 'Línea Móvil 20GB',
    descripcion: 'Solo línea móvil 20GB sin fibra',
    categoria: 'movil_sola', precio: 14.90, disponible: true,
    ingredientes: { lineas: [{ datos: 20, tipo: 'principal' }] }
  },
  {
    id: 'mov-30', nombre: 'Línea Móvil 30GB',
    descripcion: 'Solo línea móvil 30GB sin fibra',
    categoria: 'movil_sola', precio: 18.90, disponible: true, tag: 'Más vendido',
    ingredientes: { lineas: [{ datos: 30, tipo: 'principal' }] }
  },
  {
    id: 'mov-inf', nombre: 'Línea Móvil Ilimitada',
    descripcion: 'Solo línea móvil con datos ilimitados sin fibra',
    categoria: 'movil_sola', precio: 24.90, disponible: true, tag: 'Premium',
    ingredientes: { lineas: [{ datos: 'ilimitado', tipo: 'principal' }] }
  },
  {
    id: 'mov2-inf', nombre: '2 Líneas Móviles Ilimitadas',
    descripcion: 'Dos líneas móviles con datos ilimitados sin fibra',
    categoria: 'movil_2l', precio: 39.90, disponible: true,
    ingredientes: { lineas: [{ datos: 'ilimitado', tipo: 'principal' }, { datos: 'ilimitado', tipo: 'adicional' }] }
  },
  {
    id: 'mov2-mix', nombre: '2 Líneas Móviles Ilimitado + 30GB',
    descripcion: 'Línea ilimitada + segunda línea de 30GB sin fibra',
    categoria: 'movil_2l', precio: 32.90, disponible: true,
    ingredientes: { lineas: [{ datos: 'ilimitado', tipo: 'principal' }, { datos: 30, tipo: 'adicional' }] }
  },
]

// ── ADD-ONS DE TV ──
export const catalogoAddonsTV: AddonTV[] = [
  {
    id: 'tv-ficcion', nombre: 'TV Ficción', precio: 5,
    canales: ['HBO Max', 'AMC', 'TNT', 'AXN'],
    incluye: ['Series internacionales', 'Cine en estreno']
  },
  {
    id: 'tv-futbol', nombre: 'TV Fútbol', precio: 15,
    canales: ['LaLiga TV', 'Movistar Liga de Campeones', 'Movistar Deportes'],
    incluye: ['LaLiga', 'Champions League', 'Copa del Rey']
  },
  {
    id: 'tv-total', nombre: 'TV Total', precio: 22,
    canales: ['LaLiga TV', 'Champions', 'HBO Max', 'AMC', 'TNT', 'AXN', 'Movistar Deportes'],
    incluye: ['Ficción + Fútbol + Series']
  },
  {
    id: 'tv-netflix', nombre: 'Netflix incluido', precio: 8,
    canales: ['Netflix'],
    incluye: ['Plan Estándar Netflix']
  },
  {
    id: 'tv-disney', nombre: 'Disney+ incluido', precio: 5,
    canales: ['Disney+'],
    incluye: ['Plan Estándar Disney+']
  },
]

// ── LÍNEAS ADICIONALES ──
export const catalogoLineasAdicionales: LineaAdicional[] = [
  { id: 'linea-10', nombre: 'Línea adicional 10GB', datos: 10, precio: 8 },
  { id: 'linea-30', nombre: 'Línea adicional 30GB', datos: 30, precio: 12 },
  { id: 'linea-inf', nombre: 'Línea adicional Ilimitada', datos: 'ilimitado', precio: 18 },
]

// ═══════════════════════════════════════════════════════════════
// MOTOR DE BÚSQUEDA DE BUNDLES — Filtrado estricto por categoría
// ═══════════════════════════════════════════════════════════════

export function buscarBundles(
  fibraMb: number | null,
  numLineas: number,
  datosPrincipal: number | 'ilimitado' | null,
  datosSecundaria?: number | 'ilimitado' | null
): ResultadoBusquedaBundle[] {

  // Determinar categoría estricta
  const categoriaRequerida = (() => {
    if (numLineas === 0 && fibraMb !== null) return 'fibra_sola'
    if (numLineas === 1 && fibraMb !== null) return 'convergente_1l'
    if (numLineas === 2 && fibraMb !== null) return 'convergente_2l'
    if (numLineas >= 3 && fibraMb !== null) return 'convergente_3l'
    if (numLineas === 1 && fibraMb === null) return 'movil_sola'
    if (numLineas === 2 && fibraMb === null) return 'movil_2l'
    if (numLineas >= 3 && fibraMb === null) return 'movil_sola' // fallback
    return null
  })()

  if (!categoriaRequerida) return []

  const resultados: ResultadoBusquedaBundle[] = []

  for (const bundle of catalogoBundles) {
    if (!bundle.disponible) continue
    // Filtro estricto por categoría
    if (bundle.categoria !== categoriaRequerida) continue

    let score = 0
    const diferencias: string[] = []
    const ing = bundle.ingredientes

    // Match fibra
    if (fibraMb !== null && ing.fibra) {
      if (ing.fibra === fibraMb) {
        score += 50
      } else if (ing.fibra > fibraMb) {
        score += 30
        diferencias.push(`Fibra ${ing.fibra}Mb en lugar de ${fibraMb}Mb`)
      } else {
        score += 15
        diferencias.push(`Fibra ${ing.fibra}Mb (inferior a ${fibraMb}Mb)`)
      }
    } else if (fibraMb === null && !ing.fibra) {
      score += 50
    } else if (fibraMb !== null && !ing.fibra) {
      score += 0
    }

    // Match datos línea principal
    if (datosPrincipal !== null && ing.lineas && ing.lineas[0]) {
      const datosBundle = ing.lineas[0].datos
      if (datosBundle === datosPrincipal) {
        score += 50
      } else if (datosBundle === 'ilimitado' && datosPrincipal !== 'ilimitado') {
        score += 30
        diferencias.push(`Ilimitado en lugar de ${datosPrincipal}GB`)
      } else if (
        typeof datosBundle === 'number' &&
        typeof datosPrincipal === 'number' &&
        datosBundle > datosPrincipal
      ) {
        score += 20
        diferencias.push(`${datosBundle}GB en lugar de ${datosPrincipal}GB`)
      } else {
        score += 10
        diferencias.push(`${datosBundle === 'ilimitado' ? 'Ilimitado' : datosBundle + 'GB'} (solicitaste ${datosPrincipal === 'ilimitado' ? 'Ilimitado' : datosPrincipal + 'GB'})`)
      }
    } else if (datosPrincipal === null && numLineas >= 1) {
      score += 25
    }

    // Match datos línea secundaria
    if (numLineas >= 2 && datosSecundaria !== null && ing.lineas && ing.lineas[1]) {
      const datosBundle = ing.lineas[1].datos
      if (datosBundle === datosSecundaria) {
        score += 20
      } else if (datosBundle === 'ilimitado') {
        score += 15
        diferencias.push(`2ª línea ilimitada en lugar de ${datosSecundaria}GB`)
      } else {
        score += 8
        diferencias.push(`2ª línea ${(datosBundle as any) === 'ilimitado' ? 'Ilimitado' : String(datosBundle) + 'GB'} (solicitaste ${(datosSecundaria as any) === 'ilimitado' ? 'Ilimitado' : String(datosSecundaria) + 'GB'})`)
      }
    }

    if (score < 10) continue

    const matchTipo = diferencias.length === 0 ? 'exacto'
      : score >= 70 ? 'aproximado' : 'parcial'

    resultados.push({
      bundle,
      matchScore: score,
      matchTipo,
      diferencias,
      addonsCompatibles: bundle.categoria !== 'fibra_sola' ? catalogoAddonsTV : []
    })
  }

  return resultados
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 6)
}

// ═══════════════════════════════════════════════════════════════
// CATÁLOGO DE DISPOSITIVOS
// ═══════════════════════════════════════════════════════════════

export const catalogoDispositivos: Dispositivo[] = [
  { id: 'd1', marca: 'Samsung', modelo: 'Galaxy S24', categoria: 'smartphone', storage: '128GB', pantalla: '6.2"', color: ['Negro', 'Gris'], precioLibre: 899, precioMensual: 37.46, mesesFinanciacion: 24, stock: true, imagen: '📱', destacado: true, ahorro: 80 },
  { id: 'd2', marca: 'Apple', modelo: 'iPhone 15', categoria: 'smartphone', storage: '128GB', pantalla: '6.1"', color: ['Negro', 'Blanco', 'Rosa'], precioLibre: 979, precioMensual: 40.79, mesesFinanciacion: 24, stock: true, imagen: '📱', destacado: true, ahorro: 100 },
  { id: 'd3', marca: 'Apple', modelo: 'iPhone 15 Pro', categoria: 'smartphone', storage: '256GB', pantalla: '6.1"', color: ['Titanio'], precioLibre: 1219, precioMensual: 50.79, mesesFinanciacion: 24, stock: true, imagen: '📱', destacado: false },
  { id: 'd4', marca: 'Samsung', modelo: 'Galaxy A55', categoria: 'smartphone', storage: '128GB', pantalla: '6.6"', color: ['Azul', 'Negro'], precioLibre: 449, precioMensual: 18.71, mesesFinanciacion: 24, stock: true, imagen: '📱', destacado: false, ahorro: 40 },
  { id: 'd5', marca: 'Xiaomi', modelo: '14', categoria: 'smartphone', storage: '256GB', pantalla: '6.4"', color: ['Negro', 'Blanco'], precioLibre: 799, precioMensual: 33.29, mesesFinanciacion: 24, stock: true, imagen: '📱', destacado: true, ahorro: 60 },
  { id: 'd6', marca: 'Samsung', modelo: 'Galaxy Tab S9', categoria: 'tablet', storage: '128GB', pantalla: '11"', color: ['Grafito'], precioLibre: 799, precioMensual: 33.29, mesesFinanciacion: 24, stock: true, imagen: '📟', destacado: false },
  { id: 'd7', marca: 'Apple', modelo: 'iPad Air', categoria: 'tablet', storage: '64GB', pantalla: '10.9"', color: ['Azul', 'Gris'], precioLibre: 699, precioMensual: 29.13, mesesFinanciacion: 24, stock: false, imagen: '📟', destacado: false },
  { id: 'd8', marca: 'Apple', modelo: 'Watch Series 9', categoria: 'wearable', storage: '32GB', color: ['Negro', 'Plata'], precioLibre: 429, precioMensual: 17.88, mesesFinanciacion: 24, stock: true, imagen: '⌚', destacado: false },
  { id: 'd9', marca: 'Samsung', modelo: 'Galaxy Watch 6', categoria: 'wearable', storage: '16GB', color: ['Negro'], precioLibre: 299, precioMensual: 12.46, mesesFinanciacion: 24, stock: true, imagen: '⌚', destacado: false },
  { id: 'd10', marca: 'Google', modelo: 'Pixel 8', categoria: 'smartphone', storage: '128GB', pantalla: '6.2"', color: ['Negro', 'Rosa'], precioLibre: 799, precioMensual: 33.29, mesesFinanciacion: 24, stock: true, imagen: '📱', destacado: false, ahorro: 50 },
]

// ═══════════════════════════════════════════════════════════════
// DATOS MOCK DE CLIENTES
// ═══════════════════════════════════════════════════════════════

export const datosCliente: Record<string, Cliente> = {

  'CRM-001': {
    id: 'CRM-001',
    nombre: 'María',
    apellidos: 'García Fernández',
    dni: '12345678A',
    email: 'maria.garcia@email.com',
    telefono: '+34 622 481 903',
    direccion: 'C/ Gran Vía, 48 3ºB',
    cp: '28013',
    ciudad: 'Madrid',
    crmId: 'CRM-001',
    porfolio: 'mi_movistar',
    bundleActual: 'cv1-600-30',
    satisfaccionRiesgo: 'ok',
    identificadoPorIVR: true,
    riesgoScore: 'bajo',
    resumenNatural: 'Cliente con buen historial de pago. Tiene un pedido de instalación de Wi-Fi 7 pendiente con cita el 18 de abril. Ha reclamado cargos de roaming de su viaje a Francia el mes pasado. Sin deuda activa.',
    proximosEventos: [
      { id: 'pe1', tipo: 'fin_promo', descripcion: 'Fin de promoción 20% descuento', fecha: 'Jun 2026', impacto: 'negativo' },
      { id: 'pe2', tipo: 'ultima_cuota', descripcion: 'Última cuota Samsung A55', fecha: 'Feb 2027', impacto: 'positivo' },
    ],
    representantes: [],
    productos: [
      { id: 'p1', nombre: 'Fibra 600 Mb', tipo: 'fibra', estado: 'activa', precio: 32, direccion: 'C/ Gran Vía, 48', domicilioId: 'dom1' },
      { id: 'p2', nombre: 'Movistar Plus+', tipo: 'tv', estado: 'activa', precio: 14, domicilioId: 'dom1' },
      { id: 'p3', nombre: '622 481 903 · XL 30GB', tipo: 'movil', estado: 'activa', precio: 12 },
      { id: 'p4', nombre: '611 204 771 · S 5GB', tipo: 'movil', estado: 'activa', precio: 5 },
    ],
    lineasMovil: [
      {
        id: 'l1', numero: '622 481 903', tarifa: 'XL 30GB', estado: 'activa', titularidad: 'titular',
        consumoMes: {
          datosUsadosMB: 18432, datosTotalesMB: 30720,
          llamadasMinutos: 234, smsEnviados: 12,
          roamingActivo: false, fechaReset: '01/04/2026',
          enVuelo: { datosRestantesMB: 12288, diasRestantesCiclo: 8, alertaConsumo: false }
        },
        terminal: { id: 't1', marca: 'Samsung', modelo: 'A55', color: 'Azul', imei: '352938475612', fechaCompra: '01/03/2025' },
        cuotasTerminal: { precioTotal: 449, cuotaMensual: 18.71, cuotasPagadas: 13, cuotasTotales: 24, deudaRestante: 205.81, fechaUltimaCuota: 'Feb 2027' },
        addons: [{ id: 'a1', nombre: 'Seguro móvil', precio: 5.99, tipo: 'seguro' }]
      },
      {
        id: 'l2', numero: '611 204 771', tarifa: 'S 5GB', estado: 'activa', titularidad: 'adicional',
        consumoMes: {
          datosUsadosMB: 2048, datosTotalesMB: 5120,
          llamadasMinutos: 45, smsEnviados: 3,
          roamingActivo: false, fechaReset: '01/04/2026',
          enVuelo: { datosRestantesMB: 3072, diasRestantesCiclo: 8, alertaConsumo: false }
        },
        addons: []
      }
    ],
    averias: [],
    reclamaciones: [
      {
        id: 'r1', numero: 'REC-2026-0341', estado: 'en_gestion',
        motivo: 'Cargos roaming no reconocidos — Francia marzo 2026',
        importeReclamado: 34.50, facturaId: 'f1',
        fechaApertura: '28/03/2026', canal: 'Teléfono',
        bloquea: false,
        resumenIA: 'Cliente detectó cargos de roaming en Francia durante 3 días de marzo. Se ha iniciado proceso de verificación con ARTE. Resolución estimada en 7 días hábiles.',
        conceptos: [
          { id: 'c1', descripcion: 'Roaming datos Francia 15/03', importe: 12.50, seleccionado: true },
          { id: 'c2', descripcion: 'Roaming datos Francia 16/03', importe: 11.00, seleccionado: true },
          { id: 'c3', descripcion: 'Roaming llamadas Francia 15/03', importe: 11.00, seleccionado: false },
        ]
      }
    ],
    pedidos: [
      {
        id: 'ped1', numero: 'PED-2026-0892',
        estado: 'en_instalacion', tipo: 'Mejora de equipamiento',
        producto: 'Router Wi-Fi 7 Avanzado',
        fechaCreacion: '05/03/2026',
        proximoHito: 'Instalación técnico', fechaProximoHito: '18/04/2026',
        citaFecha: '18/04/2026', citaHora: '10:00 - 14:00', citaAgente: 'Técnico zona Madrid Centro',
        eventos: [
          { id: 'e1', tipo: 'Pedido creado', fecha: '05/03/2026', descripcion: 'Solicitud de mejora de router a Wi-Fi 7', resultado: 'ok' },
          { id: 'e2', tipo: 'Validación', fecha: '06/03/2026', descripcion: 'Pedido validado — cobertura confirmada', resultado: 'ok' },
          { id: 'e3', tipo: 'Envío equipo', fecha: '10/03/2026', descripcion: 'Router enviado a almacén técnico', resultado: 'ok' },
          { id: 'e4', tipo: 'Cita técnico', fecha: '18/04/2026', descripcion: 'Instalación programada con técnico', resultado: 'pendiente' },
        ]
      }
    ],
    facturas: [
      {
        id: 'f1', numero: 'FAC-2026-03-0045', periodo: 'Marzo 2026',
        fechaEmision: '01/03/2026', fechaVencimiento: '20/03/2026',
        importe: 89.40, estado: 'pagada',
        conceptos: [
          { id: 'fc1', descripcion: 'Cuota Fusión 600Mb + 30GB', importe: 54.90, tipo: 'cuota' },
          { id: 'fc2', descripcion: 'Cuota TV Movistar Plus+', importe: 14.00, tipo: 'cuota' },
          { id: 'fc3', descripcion: 'Cuota Samsung A55 (13/24)', importe: 18.71, tipo: 'dispositivo' },
          { id: 'fc4', descripcion: 'Roaming datos Francia', importe: 23.50, tipo: 'consumo', anomalo: true },
          { id: 'fc5', descripcion: 'Descuento fidelidad 20%', importe: -21.71, tipo: 'descuento' },
        ],
        variaciones: [
          { concepto: 'Roaming Francia', importeAnterior: 0, importeActual: 23.50, diferencia: 23.50, tipo: 'nuevo' }
        ]
      },
      {
        id: 'fr1', numero: 'FAC-R-2026-03-0001', periodo: 'Marzo 2026',
        fechaEmision: '15/03/2026', fechaVencimiento: '—',
        importe: -22.60, estado: 'rectificativa',
        conceptos: [
          { id: 'frc1', descripcion: 'Abono roaming Francia — reclamación REC-2026-0341', importe: -22.60, tipo: 'abono' },
        ],
        esRectificativa: true,
        facturaRectificadaId: 'f1',
        motivoRectificacion: 'Abono por reclamación económica — roaming Francia',
      },
      {
        id: 'f2', numero: 'FAC-2026-02-0038', periodo: 'Febrero 2026',
        fechaEmision: '01/02/2026', fechaVencimiento: '20/02/2026',
        importe: 65.90, estado: 'pagada',
        conceptos: [
          { id: 'fc6', descripcion: 'Cuota Fusión 600Mb + 30GB', importe: 54.90, tipo: 'cuota' },
          { id: 'fc7', descripcion: 'Cuota TV Movistar Plus+', importe: 14.00, tipo: 'cuota' },
          { id: 'fc8', descripcion: 'Cuota Samsung A55 (12/24)', importe: 18.71, tipo: 'dispositivo' },
          { id: 'fc9', descripcion: 'Descuento fidelidad 20%', importe: -21.71, tipo: 'descuento' },
        ]
      },
      {
        id: 'f3', numero: 'FAC-2026-01-0029', periodo: 'Enero 2026', fechaEmision: '01/01/2026', fechaVencimiento: '20/01/2026', importe: 65.90, estado: 'pagada',
        conceptos: [
          { id: 'fc11', descripcion: 'Cuota Fusión 600Mb + 30GB', importe: 54.90, tipo: 'cuota' },
          { id: 'fc12', descripcion: 'Cuota TV Movistar Plus+', importe: 14.00, tipo: 'cuota' },
          { id: 'fc13', descripcion: 'Cuota Samsung A55 (11/24)', importe: 18.71, tipo: 'dispositivo' },
          { id: 'fc14', descripcion: 'Descuento fidelidad 20%', importe: -21.71, tipo: 'descuento' },
        ]
      },
      {
        id: 'f4', numero: 'FAC-2025-12-0021', periodo: 'Diciembre 2025', fechaEmision: '01/12/2025', fechaVencimiento: '20/12/2025', importe: 71.30, estado: 'pagada',
        conceptos: [
          { id: 'fc15', descripcion: 'Cuota Fusión 600Mb + 30GB', importe: 54.90, tipo: 'cuota' },
          { id: 'fc16', descripcion: 'Cuota TV Movistar Plus+', importe: 14.00, tipo: 'cuota' },
          { id: 'fc17', descripcion: 'Cuota Samsung A55 (10/24)', importe: 18.71, tipo: 'dispositivo' },
          { id: 'fc18', descripcion: 'Roaming llamadas Alemania', importe: 4.20, tipo: 'consumo', anomalo: false },
          { id: 'fc19', descripcion: 'Descuento fidelidad 20%', importe: -20.51, tipo: 'descuento' },
        ],
        variaciones: [{ concepto: 'Roaming Alemania', importeAnterior: 0, importeActual: 4.20, diferencia: 4.20, tipo: 'nuevo' }]
      },
      {
        id: 'f5', numero: 'FAC-2025-11-0018', periodo: 'Noviembre 2025', fechaEmision: '01/11/2025', fechaVencimiento: '20/11/2025', importe: 65.90, estado: 'pagada',
        conceptos: [
          { id: 'fc20', descripcion: 'Cuota Fusión 600Mb + 30GB', importe: 54.90, tipo: 'cuota' },
          { id: 'fc21', descripcion: 'Cuota TV Movistar Plus+', importe: 14.00, tipo: 'cuota' },
          { id: 'fc22', descripcion: 'Cuota Samsung A55 (9/24)', importe: 18.71, tipo: 'dispositivo' },
          { id: 'fc23', descripcion: 'Descuento fidelidad 20%', importe: -21.71, tipo: 'descuento' },
        ]
      },
      {
        id: 'f6', numero: 'FAC-2025-10-0015', periodo: 'Octubre 2025', fechaEmision: '01/10/2025', fechaVencimiento: '20/10/2025', importe: 65.90, estado: 'pagada',
        conceptos: [
          { id: 'fc24', descripcion: 'Cuota Fusión 600Mb + 30GB', importe: 54.90, tipo: 'cuota' },
          { id: 'fc25', descripcion: 'Cuota TV Movistar Plus+', importe: 14.00, tipo: 'cuota' },
          { id: 'fc26', descripcion: 'Cuota Samsung A55 (8/24)', importe: 18.71, tipo: 'dispositivo' },
          { id: 'fc27', descripcion: 'Descuento fidelidad 20%', importe: -21.71, tipo: 'descuento' },
        ]
      },
      {
        id: 'f7', numero: 'FAC-2025-09-0012', periodo: 'Septiembre 2025', fechaEmision: '01/09/2025', fechaVencimiento: '20/09/2025', importe: 55.90, estado: 'pagada',
        conceptos: [
          { id: 'fc28', descripcion: 'Cuota Fusión 600Mb + 30GB', importe: 54.90, tipo: 'cuota' },
          { id: 'fc29', descripcion: 'Cuota TV Movistar Plus+', importe: 14.00, tipo: 'cuota' },
          { id: 'fc30', descripcion: 'Descuento promoción alta 30%', importe: -13.00, tipo: 'descuento' },
        ]
      },
      {
        id: 'f8', numero: 'FAC-2025-08-0009', periodo: 'Agosto 2025', fechaEmision: '01/08/2025', fechaVencimiento: '20/08/2025', importe: 98.50, estado: 'pagada',
        conceptos: [
          { id: 'fc31', descripcion: 'Cuota Fusión 600Mb + 30GB', importe: 54.90, tipo: 'cuota' },
          { id: 'fc32', descripcion: 'Cuota TV Movistar Plus+', importe: 14.00, tipo: 'cuota' },
          { id: 'fc33', descripcion: 'Roaming datos Italia — vacaciones', importe: 31.60, tipo: 'consumo', anomalo: true },
          { id: 'fc34', descripcion: 'Descuento promoción alta 30%', importe: -2.00, tipo: 'descuento' },
        ],
        variaciones: [{ concepto: 'Roaming Italia', importeAnterior: 0, importeActual: 31.60, diferencia: 31.60, tipo: 'nuevo' }]
      },
      {
        id: 'f9', numero: 'FAC-2025-07-0007', periodo: 'Julio 2025', fechaEmision: '01/07/2025', fechaVencimiento: '20/07/2025', importe: 55.90, estado: 'pagada',
        conceptos: [
          { id: 'fc35', descripcion: 'Cuota Fusión 600Mb + 30GB', importe: 54.90, tipo: 'cuota' },
          { id: 'fc36', descripcion: 'Cuota TV Movistar Plus+', importe: 14.00, tipo: 'cuota' },
          { id: 'fc37', descripcion: 'Descuento promoción alta 30%', importe: -13.00, tipo: 'descuento' },
        ]
      },
      {
        id: 'f10', numero: 'FAC-2025-06-0005', periodo: 'Junio 2025', fechaEmision: '01/06/2025', fechaVencimiento: '20/06/2025', importe: 55.90, estado: 'pagada',
        conceptos: [
          { id: 'fc38', descripcion: 'Cuota Fusión 600Mb + 30GB', importe: 54.90, tipo: 'cuota' },
          { id: 'fc39', descripcion: 'Cuota TV Movistar Plus+', importe: 14.00, tipo: 'cuota' },
          { id: 'fc40', descripcion: 'Descuento promoción alta 30%', importe: -13.00, tipo: 'descuento' },
        ]
      },
    ],
    cobros: {
      deudaTotal: 0, estadoGeneral: 'sin_deuda', riesgo: 'bajo',
      facturasConDeuda: []
    },
    historial: [
      { id: 'h1', fecha: '28/03/2026', canal: 'Teléfono', motivo: 'Reclamación roaming Francia', causaAgrupacion: 'Reclamación económica', resolucion: 'Reclamación abierta — pendiente resolución', agente: 'AGT-334', duracion: '8min', resuelto: false },
      { id: 'h2', fecha: '05/03/2026', canal: 'App', motivo: 'Solicitud mejora router Wi-Fi 7', causaAgrupacion: 'Pedido equipamiento', resolucion: 'Pedido creado PED-2026-0892', agente: 'Online', duracion: '—', resuelto: true },
      { id: 'h3', fecha: '12/01/2026', canal: 'Teléfono', motivo: 'Consulta factura diciembre', causaAgrupacion: 'Consulta factura', resolucion: 'Factura explicada — sin acción', agente: 'AGT-201', duracion: '4min', resuelto: true },
    ]
  },

  'CRM-002': {
    id: 'CRM-002',
    nombre: 'Carlos',
    apellidos: 'Ruiz Martín',
    dni: '87654321B',
    email: 'carlos.ruiz@email.com',
    telefono: '+34 654 892 001',
    direccion: 'Avda. Castellana, 120 5ºA',
    cp: '28046',
    ciudad: 'Madrid',
    crmId: 'CRM-002',
    porfolio: 'fusion',
    bundleActual: 'cv1-300-20',
    satisfaccionRiesgo: 'critico',
    identificadoPorIVR: true,
    riesgoScore: 'alto',
    resumenNatural: 'Cliente CRÍTICO. Deuda vencida de 156,40€ en 2 facturas. Avería de fibra bloqueada por impago. Reclamación abierta que bloquea cobro de febrero. Ha llamado 4 veces este mes por cobros. Porfolio Fusión descatalogado.',
    proximosEventos: [
      { id: 'pe1', tipo: 'fin_permanencia', descripcion: 'Fin de permanencia — posible baja libre', fecha: 'May 2026', impacto: 'negativo' },
    ],
    representantes: [
      { nombre: 'Ana Ruiz García', dni: '98765432C', relacion: 'Cónyuge', autorizado: true }
    ],
    productos: [
      { id: 'p1', nombre: 'Fibra 300 Mb', tipo: 'fibra', estado: 'suspendida', precio: 24, direccion: 'Avda. Castellana, 120', domicilioId: 'dom1' },
      { id: 'p2', nombre: '654 892 001 · M 15GB', tipo: 'movil', estado: 'suspendida', precio: 20 },
    ],
    lineasMovil: [
      {
        id: 'l1', numero: '654 892 001', tarifa: 'M 15GB', estado: 'suspendida', titularidad: 'titular',
        consumoMes: {
          datosUsadosMB: 8192, datosTotalesMB: 15360,
          llamadasMinutos: 187, smsEnviados: 8,
          roamingActivo: false, fechaReset: '01/04/2026',
          enVuelo: { datosRestantesMB: 7168, diasRestantesCiclo: 8, alertaConsumo: false }
        },
        terminal: { id: 't1', marca: 'Apple', modelo: 'iPhone 14', color: 'Negro', imei: '356789012345', fechaCompra: '01/09/2023' },
        cuotasTerminal: { precioTotal: 929, cuotaMensual: 38.71, cuotasPagadas: 8, cuotasTotales: 24, deudaRestante: 619.36, fechaUltimaCuota: 'Ago 2025' },
        addons: []
      }
    ],
    averias: [
      {
        id: 'av1', numero: '2026-1204',
        estado: 'bloqueada_impago',
        sintoma: 'Sin conexión a internet — fibra caída',
        producto: 'Fibra 300 Mb',
        prioridad: 'alta',
        fechaApertura: '15/03/2026',
        slaActivo: false,
        diagnosticoTecnico: 'Señal OLT correcta. Servicio suspendido administrativamente por deuda vencida. Requiere regularización de pago para reactivación.',
        acciones: ['Diagnóstico remoto ejecutado 15/03', 'Suspensión administrativa confirmada 16/03'],
        masiva: {
          referencia: 'INC-2026-0089',
          descripcion: 'Incidencia masiva fibra zona Castellana Norte — nodos afectados',
          alcance: '~340 clientes zona 28046',
          eta: 'Hoy 20:00h',
          ultimaActualizacion: 'Hace 2 horas'
        }
      }
    ],
    reclamaciones: [
      {
        id: 'r1', numero: 'REC-2026-0287', estado: 'abierta',
        motivo: 'Cargo incorrecto — doble cobro cuota febrero',
        importeReclamado: 44.90, facturaId: 'f2',
        fechaApertura: '02/03/2026', canal: 'Teléfono',
        bloquea: true,
        resumenIA: 'Cliente detectó duplicidad en cobro de cuota mensual de febrero. Reclamación en revisión. Bloquea cobro de factura FAC-2026-02-0014 hasta resolución.',
        conceptos: [
          { id: 'c1', descripcion: 'Cuota duplicada Fusión 300Mb + 15GB feb', importe: 44.90, seleccionado: true },
        ]
      }
    ],
    pedidos: [],
    facturas: [
      {
        id: 'f1', numero: 'FAC-2026-03-0021', periodo: 'Marzo 2026',
        fechaEmision: '01/03/2026', fechaVencimiento: '20/03/2026',
        importe: 111.50, estado: 'vencida',
        conceptos: [
          { id: 'fc1', descripcion: 'Cuota Fusión 300Mb + 15GB', importe: 44.90, tipo: 'cuota' },
          { id: 'fc2', descripcion: 'Cuota iPhone 14 (9/24)', importe: 38.71, tipo: 'dispositivo' },
          { id: 'fc3', descripcion: 'Cargo reposición técnico', importe: 27.89, tipo: 'consumo', anomalo: true },
        ],
        variaciones: [
          { concepto: 'Cargo reposición técnico', importeAnterior: 0, importeActual: 27.89, diferencia: 27.89, tipo: 'nuevo' }
        ]
      },
      {
        id: 'f2', numero: 'FAC-2026-02-0014', periodo: 'Febrero 2026',
        fechaEmision: '01/02/2026', fechaVencimiento: '20/02/2026',
        importe: 44.90, estado: 'vencida',
        conceptos: [
          { id: 'fc4', descripcion: 'Cuota Fusión 300Mb + 15GB', importe: 44.90, tipo: 'cuota' },
        ]
      },
      {
        id: 'fr1', numero: 'FAC-R-2026-02-0001', periodo: 'Febrero 2026',
        fechaEmision: '10/03/2026', fechaVencimiento: '—',
        importe: -44.90, estado: 'rectificativa',
        conceptos: [
          { id: 'frc1', descripcion: 'Abono cuota duplicada — reclamación REC-2026-0287', importe: -44.90, tipo: 'abono' },
        ],
        esRectificativa: true,
        facturaRectificadaId: 'f2',
        motivoRectificacion: 'Rectificación por doble cobro cuota febrero 2026',
      },
      {
        id: 'f3', numero: 'FAC-2026-01-0009', periodo: 'Enero 2026', fechaEmision: '01/01/2026', fechaVencimiento: '20/01/2026', importe: 83.61, estado: 'pagada',
        conceptos: [
          { id: 'fc5', descripcion: 'Cuota Fusión 300Mb + 15GB', importe: 44.90, tipo: 'cuota' },
          { id: 'fc6', descripcion: 'Cuota iPhone 14 (7/24)', importe: 38.71, tipo: 'dispositivo' },
        ]
      },
      {
        id: 'f4', numero: 'FAC-2025-12-0008', periodo: 'Diciembre 2025', fechaEmision: '01/12/2025', fechaVencimiento: '20/12/2025', importe: 83.61, estado: 'pagada',
        conceptos: [
          { id: 'fc7', descripcion: 'Cuota Fusión 300Mb + 15GB', importe: 44.90, tipo: 'cuota' },
          { id: 'fc8', descripcion: 'Cuota iPhone 14 (6/24)', importe: 38.71, tipo: 'dispositivo' },
        ]
      },
      {
        id: 'f5', numero: 'FAC-2025-11-0007', periodo: 'Noviembre 2025', fechaEmision: '01/11/2025', fechaVencimiento: '20/11/2025', importe: 98.20, estado: 'pagada',
        conceptos: [
          { id: 'fc9', descripcion: 'Cuota Fusión 300Mb + 15GB', importe: 44.90, tipo: 'cuota' },
          { id: 'fc10', descripcion: 'Cuota iPhone 14 (5/24)', importe: 38.71, tipo: 'dispositivo' },
          { id: 'fc11', descripcion: 'Roaming datos Portugal', importe: 14.59, tipo: 'consumo', anomalo: true },
        ],
        variaciones: [{ concepto: 'Roaming Portugal', importeAnterior: 0, importeActual: 14.59, diferencia: 14.59, tipo: 'nuevo' }]
      },
      {
        id: 'f6', numero: 'FAC-2025-10-0006', periodo: 'Octubre 2025', fechaEmision: '01/10/2025', fechaVencimiento: '20/10/2025', importe: 83.61, estado: 'pagada',
        conceptos: [
          { id: 'fc12', descripcion: 'Cuota Fusión 300Mb + 15GB', importe: 44.90, tipo: 'cuota' },
          { id: 'fc13', descripcion: 'Cuota iPhone 14 (4/24)', importe: 38.71, tipo: 'dispositivo' },
        ]
      },
      {
        id: 'f7', numero: 'FAC-2025-09-0005', periodo: 'Septiembre 2025', fechaEmision: '01/09/2025', fechaVencimiento: '20/09/2025', importe: 83.61, estado: 'pagada',
        conceptos: [
          { id: 'fc14', descripcion: 'Cuota Fusión 300Mb + 15GB', importe: 44.90, tipo: 'cuota' },
          { id: 'fc15', descripcion: 'Cuota iPhone 14 (3/24)', importe: 38.71, tipo: 'dispositivo' },
        ]
      },
      {
        id: 'f8', numero: 'FAC-2025-08-0004', periodo: 'Agosto 2025', fechaEmision: '01/08/2025', fechaVencimiento: '20/08/2025', importe: 83.61, estado: 'pagada',
        conceptos: [
          { id: 'fc16', descripcion: 'Cuota Fusión 300Mb + 15GB', importe: 44.90, tipo: 'cuota' },
          { id: 'fc17', descripcion: 'Cuota iPhone 14 (2/24)', importe: 38.71, tipo: 'dispositivo' },
        ]
      },
      {
        id: 'f9', numero: 'FAC-2025-07-0003', periodo: 'Julio 2025', fechaEmision: '01/07/2025', fechaVencimiento: '20/07/2025', importe: 57.61, estado: 'pagada',
        conceptos: [
          { id: 'fc18', descripcion: 'Cuota Fusión 300Mb + 15GB', importe: 44.90, tipo: 'cuota' },
          { id: 'fc19', descripcion: 'Cuota iPhone 14 (1/24)', importe: 38.71, tipo: 'dispositivo' },
          { id: 'fc20', descripcion: 'Descuento bienvenida', importe: -26.00, tipo: 'descuento' },
        ]
      },
    ],
    cobros: {
      deudaTotal: 156.40,
      estadoGeneral: 'vencida',
      riesgo: 'alto',
      tieneDeudaO2: true,
      facturasConDeuda: [
        {
          facturaId: 'f1', numero: 'FAC-2026-03-0021', periodo: 'Marzo 2026',
          importe: 111.50, vencimiento: '20/03/2026', estado: 'vencida',
          bloqueadaPorReclamacion: false, tipo: 'fijo' as const,
          eventosCobro: [
            { fecha: '20/03/2026', descripcion: 'Cargo domiciliado', resultado: 'fallido', importe: 111.50 },
            { fecha: '22/03/2026', descripcion: 'Reintento cargo', resultado: 'fallido', importe: 111.50 },
            { fecha: '25/03/2026', descripcion: 'Aviso SMS enviado', resultado: 'ok' },
          ]
        },
        {
          facturaId: 'f2', numero: 'FAC-2026-02-0014', periodo: 'Febrero 2026',
          importe: 44.90, vencimiento: '20/02/2026', estado: 'vencida',
          bloqueadaPorReclamacion: true, reclamacionId: 'REC-2026-0287', tipo: 'fijo' as const,
          eventosCobro: [
            { fecha: '20/02/2026', descripcion: 'Cargo domiciliado', resultado: 'fallido', importe: 44.90 },
            { fecha: '02/03/2026', descripcion: 'Reclamación abierta — cobro suspendido', resultado: 'pendiente' },
          ]
        }
      ],
      resumenVRU: {
        motivoDerivacion: 'Deuda vencida — 2 facturas impagadas',
        intentosPago: 3,
        resultadoUltimoPago: 'Fallido — fondos insuficientes',
        llamadasHoy: 2
      }
    },
    historial: [
      { id: 'h1', fecha: '01/04/2026', canal: 'Teléfono', motivo: 'Cobros — avería sin internet', causaAgrupacion: 'Cobros', resolucion: 'Derivado a especialista cobros', agente: 'AGT-112', duracion: '12min', resuelto: false },
      { id: 'h2', fecha: '28/03/2026', canal: 'Teléfono', motivo: 'Cobros — no puede pagar online', causaAgrupacion: 'Cobros', resolucion: 'Se informó de VRU de pago', agente: 'AGT-089', duracion: '6min', resuelto: false },
      { id: 'h3', fecha: '22/03/2026', canal: 'Teléfono', motivo: 'Sin internet — avería', causaAgrupacion: 'Avería', resolucion: 'Bloqueada por impago — info dada', agente: 'AGT-201', duracion: '9min', resuelto: false },
      { id: 'h4', fecha: '15/03/2026', canal: 'Teléfono', motivo: 'Sin internet', causaAgrupacion: 'Avería', resolucion: 'Avería abierta AV-2026-1204', agente: 'AGT-334', duracion: '14min', resuelto: false },
      { id: 'h5', fecha: '02/03/2026', canal: 'Teléfono', motivo: 'Doble cobro febrero', causaAgrupacion: 'Reclamación económica', resolucion: 'Reclamación abierta REC-2026-0287', agente: 'AGT-445', duracion: '11min', resuelto: false },
    ]
  },

  'CRM-003': {
    id: 'CRM-003',
    nombre: 'Empresa Técnica SL',
    apellidos: '',
    dni: 'B12345678',
    email: 'admin@empresatecnica.es',
    telefono: '+34 912 345 678',
    direccion: 'C/ Serrano, 45 2ºD',
    cp: '28001',
    ciudad: 'Madrid',
    crmId: 'CRM-003',
    porfolio: 'mi_movistar',
    bundleActual: 'cv2-1g-inf-inf',
    satisfaccionRiesgo: 'ok',
    identificadoPorIVR: false,
    riesgoScore: 'bajo',
    resumenNatural: 'Cliente empresarial con 2 sedes y 3 líneas móviles Business. Facturación media 245€/mes. Sin incidencias activas. Contrato renovado en enero 2026. Posible interés en alarma MPA según última interacción.',
    proximosEventos: [
      { id: 'pe1', tipo: 'renovacion', descripcion: 'Revisión anual contrato Business', fecha: 'Ene 2027', impacto: 'neutro' },
    ],
    representantes: [
      { nombre: 'Pedro Sánchez López', dni: '11223344D', relacion: 'Administrador', autorizado: true }
    ],
    productos: [
      { id: 'p1', nombre: 'Fibra 1 Gb — Sede principal', tipo: 'fibra', estado: 'activa', precio: 49.90, direccion: 'C/ Serrano, 45', domicilioId: 'dom1' },
      { id: 'p2', nombre: 'Fibra 600 Mb — Sede secundaria', tipo: 'fibra', estado: 'activa', precio: 39.90, direccion: 'C/ Alcalá, 200', domicilioId: 'dom2' },
      { id: 'p3', nombre: '912 345 678 · Fijo principal', tipo: 'fijo', estado: 'activa', precio: 0 },
      { id: 'p4', nombre: '600 001 001 · Business Ilimitado', tipo: 'movil', estado: 'activa', precio: 18 },
      { id: 'p5', nombre: '600 001 002 · Business Ilimitado', tipo: 'movil', estado: 'activa', precio: 18 },
      { id: 'p6', nombre: '600 001 003 · Business Ilimitado', tipo: 'movil', estado: 'activa', precio: 18 },
    ],
    lineasMovil: [
      {
        id: 'l1', numero: '600 001 001', tarifa: 'Business Ilimitado', estado: 'activa', titularidad: 'titular',
        consumoMes: { datosUsadosMB: 45056, datosTotalesMB: -1, llamadasMinutos: 890, smsEnviados: 45, roamingActivo: false, fechaReset: '01/04/2026', enVuelo: { datosRestantesMB: -1, diasRestantesCiclo: 8, alertaConsumo: false } },
        addons: [{ id: 'a1', nombre: 'Roaming Europa', precio: 0, tipo: 'roaming' }]
      },
      {
        id: 'l2', numero: '600 001 002', tarifa: 'Business Ilimitado', estado: 'activa', titularidad: 'adicional',
        consumoMes: { datosUsadosMB: 12288, datosTotalesMB: -1, llamadasMinutos: 234, smsEnviados: 12, roamingActivo: false, fechaReset: '01/04/2026', enVuelo: { datosRestantesMB: -1, diasRestantesCiclo: 8, alertaConsumo: false } },
        addons: []
      },
      {
        id: 'l3', numero: '600 001 003', tarifa: 'Business Ilimitado', estado: 'activa', titularidad: 'adicional',
        consumoMes: { datosUsadosMB: 8192, datosTotalesMB: -1, llamadasMinutos: 123, smsEnviados: 5, roamingActivo: false, fechaReset: '01/04/2026', enVuelo: { datosRestantesMB: -1, diasRestantesCiclo: 8, alertaConsumo: false } },
        addons: []
      },
    ],
    averias: [],
    reclamaciones: [],
    pedidos: [],
    facturas: [
      {
        id: 'f1', numero: 'FAC-2026-03-0098', periodo: 'Marzo 2026',
        fechaEmision: '01/03/2026', fechaVencimiento: '20/03/2026',
        importe: 245.70, estado: 'pagada',
        conceptos: [
          { id: 'fc1', descripcion: 'Fibra 1Gb sede principal', importe: 49.90, tipo: 'cuota' },
          { id: 'fc2', descripcion: 'Fibra 600Mb sede secundaria', importe: 39.90, tipo: 'cuota' },
          { id: 'fc3', descripcion: '3x Business Ilimitado', importe: 54.00, tipo: 'cuota' },
          { id: 'fc4', descripcion: 'Descuento Business 20%', importe: -28.76, tipo: 'descuento' },
          { id: 'fc5', descripcion: 'IVA 21%', importe: 130.66, tipo: 'cuota' },
        ]
      },
      {
        id: 'f2', numero: 'FAC-2026-02-0081', periodo: 'Febrero 2026', fechaEmision: '01/02/2026', fechaVencimiento: '20/02/2026', importe: 245.70, estado: 'pagada',
        conceptos: [
          { id: 'fc6', descripcion: 'Fibra 1Gb sede principal', importe: 49.90, tipo: 'cuota' },
          { id: 'fc7', descripcion: 'Fibra 600Mb sede secundaria', importe: 39.90, tipo: 'cuota' },
          { id: 'fc8', descripcion: '3x Business Ilimitado', importe: 54.00, tipo: 'cuota' },
          { id: 'fc9', descripcion: 'Descuento Business 20%', importe: -28.76, tipo: 'descuento' },
          { id: 'fc10', descripcion: 'IVA 21%', importe: 130.66, tipo: 'cuota' },
        ]
      },
      {
        id: 'f3', numero: 'FAC-2026-01-0065', periodo: 'Enero 2026', fechaEmision: '01/01/2026', fechaVencimiento: '20/01/2026', importe: 278.40, estado: 'pagada',
        conceptos: [
          { id: 'fc11', descripcion: 'Fibra 1Gb sede principal', importe: 49.90, tipo: 'cuota' },
          { id: 'fc12', descripcion: 'Fibra 600Mb sede secundaria', importe: 39.90, tipo: 'cuota' },
          { id: 'fc13', descripcion: '3x Business Ilimitado', importe: 54.00, tipo: 'cuota' },
          { id: 'fc14', descripcion: 'Renovación anual contrato Business', importe: 35.00, tipo: 'cuota' },
          { id: 'fc15', descripcion: 'Descuento Business 20%', importe: -28.76, tipo: 'descuento' },
          { id: 'fc16', descripcion: 'IVA 21%', importe: 128.36, tipo: 'cuota' },
        ],
        variaciones: [{ concepto: 'Renovación anual contrato', importeAnterior: 0, importeActual: 35.00, diferencia: 35.00, tipo: 'nuevo' }]
      },
      {
        id: 'f4', numero: 'FAC-2025-12-0059', periodo: 'Diciembre 2025', fechaEmision: '01/12/2025', fechaVencimiento: '20/12/2025', importe: 245.70, estado: 'pagada',
        conceptos: [
          { id: 'fc17', descripcion: 'Fibra 1Gb sede principal', importe: 49.90, tipo: 'cuota' },
          { id: 'fc18', descripcion: 'Fibra 600Mb sede secundaria', importe: 39.90, tipo: 'cuota' },
          { id: 'fc19', descripcion: '3x Business Ilimitado', importe: 54.00, tipo: 'cuota' },
          { id: 'fc20', descripcion: 'Descuento Business 20%', importe: -28.76, tipo: 'descuento' },
          { id: 'fc21', descripcion: 'IVA 21%', importe: 130.66, tipo: 'cuota' },
        ]
      },
      {
        id: 'f5', numero: 'FAC-2025-11-0051', periodo: 'Noviembre 2025', fechaEmision: '01/11/2025', fechaVencimiento: '20/11/2025', importe: 245.70, estado: 'pagada',
        conceptos: [
          { id: 'fc22', descripcion: 'Fibra 1Gb sede principal', importe: 49.90, tipo: 'cuota' },
          { id: 'fc23', descripcion: 'Fibra 600Mb sede secundaria', importe: 39.90, tipo: 'cuota' },
          { id: 'fc24', descripcion: '3x Business Ilimitado', importe: 54.00, tipo: 'cuota' },
          { id: 'fc25', descripcion: 'Descuento Business 20%', importe: -28.76, tipo: 'descuento' },
          { id: 'fc26', descripcion: 'IVA 21%', importe: 130.66, tipo: 'cuota' },
        ]
      },
      {
        id: 'f6', numero: 'FAC-2025-10-0044', periodo: 'Octubre 2025', fechaEmision: '01/10/2025', fechaVencimiento: '20/10/2025', importe: 289.30, estado: 'pagada',
        conceptos: [
          { id: 'fc27', descripcion: 'Fibra 1Gb sede principal', importe: 49.90, tipo: 'cuota' },
          { id: 'fc28', descripcion: 'Fibra 600Mb sede secundaria', importe: 39.90, tipo: 'cuota' },
          { id: 'fc29', descripcion: '3x Business Ilimitado', importe: 54.00, tipo: 'cuota' },
          { id: 'fc30', descripcion: 'Roaming Alemania — feria sector', importe: 0, tipo: 'cuota' },
          { id: 'fc31', descripcion: 'Exceso consumo datos sede secundaria', importe: 44.36, tipo: 'consumo', anomalo: true },
          { id: 'fc32', descripcion: 'Descuento Business 20%', importe: -28.76, tipo: 'descuento' },
          { id: 'fc33', descripcion: 'IVA 21%', importe: 129.90, tipo: 'cuota' },
        ],
        variaciones: [{ concepto: 'Exceso consumo sede secundaria', importeAnterior: 0, importeActual: 44.36, diferencia: 44.36, tipo: 'nuevo' }]
      },
      {
        id: 'f7', numero: 'FAC-2025-09-0039', periodo: 'Septiembre 2025', fechaEmision: '01/09/2025', fechaVencimiento: '20/09/2025', importe: 245.70, estado: 'pagada',
        conceptos: [
          { id: 'fc34', descripcion: 'Fibra 1Gb sede principal', importe: 49.90, tipo: 'cuota' },
          { id: 'fc35', descripcion: 'Fibra 600Mb sede secundaria', importe: 39.90, tipo: 'cuota' },
          { id: 'fc36', descripcion: '3x Business Ilimitado', importe: 54.00, tipo: 'cuota' },
          { id: 'fc37', descripcion: 'Descuento Business 20%', importe: -28.76, tipo: 'descuento' },
          { id: 'fc38', descripcion: 'IVA 21%', importe: 130.66, tipo: 'cuota' },
        ]
      },
      {
        id: 'f8', numero: 'FAC-2025-08-0033', periodo: 'Agosto 2025', fechaEmision: '01/08/2025', fechaVencimiento: '20/08/2025', importe: 245.70, estado: 'pagada',
        conceptos: [
          { id: 'fc39', descripcion: 'Fibra 1Gb sede principal', importe: 49.90, tipo: 'cuota' },
          { id: 'fc40', descripcion: 'Fibra 600Mb sede secundaria', importe: 39.90, tipo: 'cuota' },
          { id: 'fc41', descripcion: '3x Business Ilimitado', importe: 54.00, tipo: 'cuota' },
          { id: 'fc42', descripcion: 'Descuento Business 20%', importe: -28.76, tipo: 'descuento' },
          { id: 'fc43', descripcion: 'IVA 21%', importe: 130.66, tipo: 'cuota' },
        ]
      },
      {
        id: 'f9', numero: 'FAC-2025-07-0028', periodo: 'Julio 2025', fechaEmision: '01/07/2025', fechaVencimiento: '20/07/2025', importe: 245.70, estado: 'pagada',
        conceptos: [
          { id: 'fc44', descripcion: 'Fibra 1Gb sede principal', importe: 49.90, tipo: 'cuota' },
          { id: 'fc45', descripcion: 'Fibra 600Mb sede secundaria', importe: 39.90, tipo: 'cuota' },
          { id: 'fc46', descripcion: '3x Business Ilimitado', importe: 54.00, tipo: 'cuota' },
          { id: 'fc47', descripcion: 'Descuento Business 20%', importe: -28.76, tipo: 'descuento' },
          { id: 'fc48', descripcion: 'IVA 21%', importe: 130.66, tipo: 'cuota' },
        ]
      },
      {
        id: 'f10', numero: 'FAC-2025-06-0022', periodo: 'Junio 2025', fechaEmision: '01/06/2025', fechaVencimiento: '20/06/2025', importe: 245.70, estado: 'pagada',
        conceptos: [
          { id: 'fc49', descripcion: 'Fibra 1Gb sede principal', importe: 49.90, tipo: 'cuota' },
          { id: 'fc50', descripcion: 'Fibra 600Mb sede secundaria', importe: 39.90, tipo: 'cuota' },
          { id: 'fc51', descripcion: '3x Business Ilimitado', importe: 54.00, tipo: 'cuota' },
          { id: 'fc52', descripcion: 'Descuento Business 20%', importe: -28.76, tipo: 'descuento' },
          { id: 'fc53', descripcion: 'IVA 21%', importe: 130.66, tipo: 'cuota' },
        ]
      },
    ],
    cobros: {
      deudaTotal: 0, estadoGeneral: 'sin_deuda', riesgo: 'bajo',
      facturasConDeuda: []
    },
    historial: [
      { id: 'h1', fecha: '15/03/2026', canal: 'Teléfono', motivo: 'Consulta ampliación líneas móviles', causaAgrupacion: 'Venta', resolucion: 'Info dada — interés en 2 líneas más', agente: 'AGT-556', duracion: '18min', resuelto: true },
      { id: 'h2', fecha: '10/01/2026', canal: 'Tienda', motivo: 'Renovación contrato anual', causaAgrupacion: 'Renovación', resolucion: 'Contrato renovado hasta ene 2027', agente: 'TDA-012', duracion: '35min', resuelto: true },
    ]
  }
}

// ═══════════════════════════════════════════════════════════════
// CONSUMOS CATEGORIZADOS — RF-17
// ═══════════════════════════════════════════════════════════════

export const consumosPorCliente: Record<string, {
  id: string
  categoria: 'roaming' | '900_800' | 'emocion' | 'otros'
  linea: string
  descripcion: string
  pais?: string
  fechaInicio: string
  fechaFin: string | null
  importe: number
  facturado: boolean
  facturaId: string | null
  anomalo: boolean
}[]> = {
  'CRM-001': [
    { id: 'cv1', categoria: 'roaming', linea: '622 481 903', descripcion: 'Datos roaming Francia', pais: 'Francia', fechaInicio: '15/03/2026', fechaFin: '17/03/2026', importe: 22.60, facturado: true, facturaId: 'f1', anomalo: true },
    { id: 'cv2', categoria: 'roaming', linea: '622 481 903', descripcion: 'Datos roaming UK — periodo actual', pais: 'Reino Unido', fechaInicio: '02/04/2026', fechaFin: null, importe: 8.40, facturado: false, facturaId: null, anomalo: true },
    { id: 'cv3', categoria: 'roaming', linea: '622 481 903', descripcion: 'Llamadas roaming Alemania', pais: 'Alemania', fechaInicio: '10/12/2025', fechaFin: '10/12/2025', importe: 4.20, facturado: true, facturaId: 'f4', anomalo: false },
    { id: 'cv4', categoria: 'roaming', linea: '622 481 903', descripcion: 'Datos roaming Italia — vacaciones verano', pais: 'Italia', fechaInicio: '01/08/2025', fechaFin: '05/08/2025', importe: 31.60, facturado: true, facturaId: 'f8', anomalo: true },
    { id: 'cv5', categoria: 'roaming', linea: '622 481 903', descripcion: 'Llamadas internacionales zona 2 — en vuelo', pais: 'Varios', fechaInicio: '08/04/2026', fechaFin: null, importe: 3.20, facturado: false, facturaId: null, anomalo: false },
    { id: 'cv6', categoria: '900_800', linea: '622 481 903', descripcion: 'Llamada 900 123 456 — servicio atención banco', fechaInicio: '20/02/2026', fechaFin: '20/02/2026', importe: 1.80, facturado: true, facturaId: 'f2', anomalo: false },
    { id: 'cv7', categoria: '900_800', linea: '611 204 771', descripcion: 'Llamada 800 000 100 — servicio gratuito', fechaInicio: '05/03/2026', fechaFin: '05/03/2026', importe: 0, facturado: true, facturaId: 'f1', anomalo: false },
    { id: 'cv8', categoria: 'emocion', linea: '622 481 903', descripcion: 'Compra app Google Play — Spotify Premium', fechaInicio: '01/03/2026', fechaFin: '01/03/2026', importe: 9.99, facturado: true, facturaId: 'f1', anomalo: false },
    { id: 'cv9', categoria: 'emocion', linea: '622 481 903', descripcion: 'Suscripción contenido externo no reconocido', fechaInicio: '14/02/2026', fechaFin: '14/02/2026', importe: 4.99, facturado: true, facturaId: 'f2', anomalo: true },
  ],
  'CRM-002': [
    { id: 'cv101', categoria: 'roaming', linea: '654 892 001', descripcion: 'Datos roaming Portugal', pais: 'Portugal', fechaInicio: '10/11/2025', fechaFin: '12/11/2025', importe: 14.59, facturado: true, facturaId: 'f5', anomalo: true },
    { id: 'cv102', categoria: '900_800', linea: '654 892 001', descripcion: 'Llamada 902 100 200 — banco', fechaInicio: '03/03/2026', fechaFin: '03/03/2026', importe: 2.40, facturado: true, facturaId: 'f1', anomalo: false },
    { id: 'cv103', categoria: 'emocion', linea: '654 892 001', descripcion: 'Donación SMS ONG Cruz Roja', fechaInicio: '15/01/2026', fechaFin: '15/01/2026', importe: 1.20, facturado: true, facturaId: 'f3', anomalo: false },
  ],
  'CRM-003': [
    { id: 'cv201', categoria: 'roaming', linea: '600 001 001', descripcion: 'Datos roaming Alemania — feria sector', pais: 'Alemania', fechaInicio: '01/10/2025', fechaFin: '04/10/2025', importe: 0, facturado: true, facturaId: 'f6', anomalo: false },
    { id: 'cv202', categoria: 'roaming', linea: '600 001 002', descripcion: 'Datos roaming Francia — reunión cliente', pais: 'Francia', fechaInicio: '20/02/2026', fechaFin: '21/02/2026', importe: 0, facturado: true, facturaId: 'f2', anomalo: false },
    { id: 'cv203', categoria: '900_800', linea: '600 001 001', descripcion: 'Llamada 900 gestión proveedores', fechaInicio: '12/03/2026', fechaFin: '12/03/2026', importe: 3.60, facturado: true, facturaId: 'f1', anomalo: false },
    { id: 'cv204', categoria: 'otros', linea: '600 001 003', descripcion: 'Exceso consumo datos sede secundaria', fechaInicio: '01/10/2025', fechaFin: '31/10/2025', importe: 44.36, facturado: true, facturaId: 'f6', anomalo: true },
  ],
}

// ═══════════════════════════════════════════════════════════════
// HISTÓRICO DE PAGOS — deudas anteriores ya saldadas
// ═══════════════════════════════════════════════════════════════

export const historicoPagosPorCliente: Record<string, {
  id: string
  periodo: string
  numeroFactura: string
  importe: number
  fechaVencimiento: string
  fechaPago: string
  metodoPago: string
  diasRetraso: number
  incidencia?: string
}[]> = {
  'CRM-001': [
    { id: 'hp1', periodo: 'Febrero 2026', numeroFactura: 'FAC-2026-02-0038', importe: 65.90, fechaVencimiento: '20/02/2026', fechaPago: '18/02/2026', metodoPago: 'Domiciliación bancaria', diasRetraso: 0 },
    { id: 'hp2', periodo: 'Enero 2026', numeroFactura: 'FAC-2026-01-0029', importe: 65.90, fechaVencimiento: '20/01/2026', fechaPago: '19/01/2026', metodoPago: 'Domiciliación bancaria', diasRetraso: 0 },
    { id: 'hp3', periodo: 'Diciembre 2025', numeroFactura: 'FAC-2025-12-0021', importe: 71.30, fechaVencimiento: '20/12/2025', fechaPago: '20/12/2025', metodoPago: 'Domiciliación bancaria', diasRetraso: 0 },
    { id: 'hp4', periodo: 'Noviembre 2025', numeroFactura: 'FAC-2025-11-0018', importe: 65.90, fechaVencimiento: '20/11/2025', fechaPago: '22/11/2025', metodoPago: 'Domiciliación bancaria', diasRetraso: 2, incidencia: 'Primer cargo devuelto — reintento exitoso' },
    { id: 'hp5', periodo: 'Octubre 2025', numeroFactura: 'FAC-2025-10-0015', importe: 65.90, fechaVencimiento: '20/10/2025', fechaPago: '20/10/2025', metodoPago: 'Domiciliación bancaria', diasRetraso: 0 },
    { id: 'hp6', periodo: 'Septiembre 2025', numeroFactura: 'FAC-2025-09-0012', importe: 55.90, fechaVencimiento: '20/09/2025', fechaPago: '19/09/2025', metodoPago: 'Domiciliación bancaria', diasRetraso: 0 },
  ],
  'CRM-002': [
    { id: 'hp1', periodo: 'Enero 2026', numeroFactura: 'FAC-2026-01-0009', importe: 83.61, fechaVencimiento: '20/01/2026', fechaPago: '28/01/2026', metodoPago: 'Pago con tarjeta (VRU)', diasRetraso: 8, incidencia: 'Cargo domiciliado devuelto — pagado por VRU tarjeta' },
    { id: 'hp2', periodo: 'Diciembre 2025', numeroFactura: 'FAC-2025-12-0008', importe: 83.61, fechaVencimiento: '20/12/2025', fechaPago: '27/12/2025', metodoPago: 'Pago con tarjeta (VRU)', diasRetraso: 7, incidencia: 'Cargo devuelto — pagado por VRU' },
    { id: 'hp3', periodo: 'Noviembre 2025', numeroFactura: 'FAC-2025-11-0007', importe: 98.20, fechaVencimiento: '20/11/2025', fechaPago: '20/11/2025', metodoPago: 'Domiciliación bancaria', diasRetraso: 0 },
    { id: 'hp4', periodo: 'Octubre 2025', numeroFactura: 'FAC-2025-10-0006', importe: 83.61, fechaVencimiento: '20/10/2025', fechaPago: '31/10/2025', metodoPago: 'Pago con tarjeta (VRU)', diasRetraso: 11, incidencia: 'Cargo domiciliado devuelto — pagado por VRU' },
    { id: 'hp5', periodo: 'Septiembre 2025', numeroFactura: 'FAC-2025-09-0005', importe: 83.61, fechaVencimiento: '20/09/2025', fechaPago: '20/09/2025', metodoPago: 'Domiciliación bancaria', diasRetraso: 0 },
  ],
  'CRM-003': [
    { id: 'hp1', periodo: 'Febrero 2026', numeroFactura: 'FAC-2026-02-0081', importe: 245.70, fechaVencimiento: '20/02/2026', fechaPago: '18/02/2026', metodoPago: 'Domiciliación bancaria', diasRetraso: 0 },
    { id: 'hp2', periodo: 'Enero 2026', numeroFactura: 'FAC-2026-01-0065', importe: 278.40, fechaVencimiento: '20/01/2026', fechaPago: '20/01/2026', metodoPago: 'Domiciliación bancaria', diasRetraso: 0 },
    { id: 'hp3', periodo: 'Diciembre 2025', numeroFactura: 'FAC-2025-12-0059', importe: 245.70, fechaVencimiento: '20/12/2025', fechaPago: '19/12/2025', metodoPago: 'Domiciliación bancaria', diasRetraso: 0 },
    { id: 'hp4', periodo: 'Noviembre 2025', numeroFactura: 'FAC-2025-11-0051', importe: 245.70, fechaVencimiento: '20/11/2025', fechaPago: '20/11/2025', metodoPago: 'Domiciliación bancaria', diasRetraso: 0 },
    { id: 'hp5', periodo: 'Octubre 2025', numeroFactura: 'FAC-2025-10-0044', importe: 289.30, fechaVencimiento: '20/10/2025', fechaPago: '20/10/2025', metodoPago: 'Domiciliación bancaria', diasRetraso: 0 },
  ],
}

// ── ÍNDICE BÚSQUEDA ──
export const clientesLista: { id: string; nombre: string; dni: string; telefono: string; direccion: string; lineas: string[]; satisfaccionRiesgo: SatisfaccionRiesgo }[] = [
  { id: 'CRM-001', nombre: 'María García Fernández', dni: '12345678A', telefono: '+34 622 481 903', direccion: 'C/ Gran Vía, 48 3ºB', lineas: ['622 481 903', '611 204 771'], satisfaccionRiesgo: 'ok' },
  { id: 'CRM-002', nombre: 'Carlos Ruiz Martín', dni: '87654321B', telefono: '+34 654 892 001', direccion: 'Avda. Castellana, 120 5ºA', lineas: ['654 892 001'], satisfaccionRiesgo: 'critico' },
  { id: 'CRM-003', nombre: 'Empresa Técnica SL', dni: 'B12345678', telefono: '+34 912 345 678', direccion: 'C/ Serrano, 45 2ºD', lineas: ['600 001 001', '600 001 002', '600 001 003'], satisfaccionRiesgo: 'ok' },
]