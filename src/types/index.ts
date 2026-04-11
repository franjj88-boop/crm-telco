// ─── CLIENTE ─────────────────────────────────────────────────────────────────

export type SatisfaccionRiesgo = 'ok' | 'en_riesgo' | 'critico'
export type Canal = 'telefono' | 'tienda' | 'chat' | 'whatsapp' | 'email'
export type PerfilAgente = '1004' | 'tienda' | 'cobros' | 'backoffice'

export interface Cliente {
  id: string
  nombre: string
  apellidos: string
  dni: string
  email: string
  telefono: string
  direccion: string
  cp: string
  ciudad: string
  crmId: string
  porfolio: string
  bundleActual: string
  satisfaccionRiesgo: SatisfaccionRiesgo
  identificadoPorIVR: boolean
  resumenNatural: string
  proximosEventos: ProximoEvento[]
  productos: Producto[]
  lineasMovil: LineaMovil[]
  averias: Averia[]
  reclamaciones: Reclamacion[]
  pedidos: Pedido[]
  facturas: Factura[]
  cobros: Cobros
  historial: Interaccion[]
  senalizacionesParque?: {
    id: string
    nombreProducto: string
    proveedor: string
    icono: string
    estado: 'pendiente' | 'activo' | 'cancelado'
    fechaContratacion?: string
  }[]
  riesgoScore: 'bajo' | 'medio' | 'alto'
  representantes: Representante[]
  iban?: string
  estadoCliente?: 'activo' | 'baja' | 'suspendido'
}

export interface ProximoEvento {
  id: string
  tipo: 'fin_promo' | 'fin_permanencia' | 'ultima_cuota' | 'renovacion' | 'vencimiento'
  descripcion: string
  fecha: string
  impacto: 'positivo' | 'negativo' | 'neutro'
}

export interface Representante {
  nombre: string
  dni: string
  relacion: string
  autorizado: boolean
}

// ─── PRODUCTOS Y LÍNEAS ───────────────────────────────────────────────────────

export interface Producto {
  id: string
  nombre: string
  tipo: 'fibra' | 'movil' | 'tv' | 'fijo' | 'addon'
  estado: 'activa' | 'suspendida' | 'pendiente' | 'baja'
  precio?: number
  direccion?: string
  domicilioId?: string
}

export interface LineaMovil {
  id: string
  numero: string
  tarifa: string
  estado: 'activa' | 'suspendida' | 'baja'
  titularidad: 'titular' | 'adicional'
  consumoMes: ConsumoLinea
  terminal?: Terminal
  addons: AddonLinea[]
  cuotasTerminal?: CuotaTerminal
  domicilioId?: string
}

export interface ConsumoLinea {
  datosUsadosMB: number
  datosTotalesMB: number
  llamadasMinutos: number
  smsEnviados: number
  roamingActivo: boolean
  fechaReset: string
  enVuelo: ConsumoEnVuelo
}

export interface ConsumoEnVuelo {
  datosRestantesMB: number
  diasRestantesCiclo: number
  alertaConsumo: boolean
}

export interface Terminal {
  id: string
  marca: string
  modelo: string
  color: string
  imei: string
  fechaCompra: string
}

export interface AddonLinea {
  id: string
  nombre: string
  precio: number
  tipo: 'seguro' | 'roaming' | 'datos_extra' | 'otro'
}

export interface CuotaTerminal {
  precioTotal: number
  cuotaMensual: number
  cuotasPagadas: number
  cuotasTotales: number
  deudaRestante: number
  fechaUltimaCuota: string
}

// ─── BUNDLES Y CATÁLOGO ───────────────────────────────────────────────────────

export interface Bundle {
  id: string
  nombre: string
  descripcion: string
  categoria: 'fibra_sola' | 'convergente_1l' | 'convergente_2l' | 'convergente_3l' | 'movil_sola' | 'movil_2l'
  precio: number
  ingredientes: IngredienteBundle
  disponible: boolean
  destacado?: boolean
  tag?: string
}

export interface IngredienteBundle {
  fibra?: number        // velocidad en Mb
  lineas?: LineaBundle[]
  tv?: boolean
}

export interface LineaBundle {
  datos: number | 'ilimitado'
  tipo: 'principal' | 'adicional'
}

export interface AddonTV {
  id: string
  nombre: string
  precio: number
  precioBundle?: number
  canales: string[]
  incluye?: string[]
}

export interface LineaAdicional {
  id: string
  nombre: string
  datos: number | 'ilimitado'
  precio: number
}

export interface ResultadoBusquedaBundle {
  bundle: Bundle
  matchScore: number
  matchTipo: 'exacto' | 'aproximado' | 'parcial'
  diferencias: string[]
  addonsCompatibles: AddonTV[]
}

// ─── AVERÍAS ─────────────────────────────────────────────────────────────────

export interface Averia {
  id: string
  numero: string
  estado: 'abierta' | 'en_gestion' | 'resuelta' | 'asociada_masiva' | 'bloqueada_impago'
  sintoma: string
  producto: string
  prioridad: 'alta' | 'media' | 'baja'
  fechaApertura: string
  slaActivo: boolean
  diagnosticoTecnico: string
  acciones: string[]
  masiva?: MasivaInfo
}

export interface MasivaInfo {
  referencia: string
  descripcion: string
  alcance: string
  eta: string
  ultimaActualizacion: string
}

// ─── RECLAMACIONES ────────────────────────────────────────────────────────────

export interface Reclamacion {
  id: string
  numero: string
  estado: 'abierta' | 'en_gestion' | 'resuelta' | 'denegada'
  motivo: string
  importeReclamado: number
  facturaId?: string
  fechaApertura: string
  fechaResolucion?: string
  canal: string
  bloquea: boolean
  resumenIA?: string
  conceptos?: ConceptoReclamado[]
}

export interface ConceptoReclamado {
  id: string
  descripcion: string
  importe: number
  seleccionado: boolean
}

// ─── PEDIDOS ─────────────────────────────────────────────────────────────────

export interface Pedido {
  id: string
  numero: string
  estado: 'prepedido' | 'en_validacion' | 'en_instalacion' | 'completado' | 'en_incidencia' | 'cancelado'
  tipo: string
  producto: string
  fechaCreacion: string
  proximoHito: string
  fechaProximoHito?: string
  citaFecha?: string
  citaHora?: string
  citaAgente?: string
  eventos: EventoPedido[]
}

export interface EventoPedido {
  id: string
  tipo: string
  fecha: string
  descripcion: string
  resultado: 'ok' | 'pendiente' | 'error'
}

// ─── FACTURAS ─────────────────────────────────────────────────────────────────

export interface Factura {
  id: string
  numero: string
  periodo: string
  fechaEmision: string
  fechaVencimiento: string
  importe: number
  estado: 'pagada' | 'pendiente' | 'vencida' | 'devuelta' | 'fraccionada' | 'rectificativa'
  conceptos: ConceptoFactura[]
  variaciones?: VariacionFactura[]
  esRectificativa?: boolean
  facturaRectificadaId?: string
  motivoRectificacion?: string
}

export interface ConceptoFactura {
  id: string
  descripcion: string
  importe: number
  tipo: 'cuota' | 'consumo' | 'ajuste' | 'descuento' | 'dispositivo' | 'abono'
  anomalo?: boolean
}

export interface VariacionFactura {
  concepto: string
  importeAnterior: number
  importeActual: number
  diferencia: number
  tipo: 'subida' | 'bajada' | 'nuevo' | 'eliminado'
}

// ─── COBROS ───────────────────────────────────────────────────────────────────

export interface Cobros {
  deudaTotal: number
  estadoGeneral: 'sin_deuda' | 'en_plazo' | 'vencida' | 'fraccionada'
  riesgo: 'bajo' | 'medio' | 'alto'
  facturasConDeuda: FacturaDeuda[]
  fraccionamientoActivo?: Fraccionamiento
  resumenVRU?: ResumenVRU
  tieneDeudaO2?: boolean
  cedidaEGC?: boolean          // RF-COB-06: deuda cedida a EGC/FGES
  deudaIncobrable?: boolean    // RF-COB-06: deuda en bolsa incobrable
  saldoAFavor?: number         // RF-COB-07: saldo disponible para compensación
}

export interface FacturaDeuda {
  facturaId: string
  numero: string
  periodo: string
  importe: number
  vencimiento: string
  estado: 'en_plazo' | 'vencida' | 'fraccionada'
  bloqueadaPorReclamacion: boolean
  reclamacionId?: string
  tipo?: 'fijo' | 'movil'
  eventosCobro: EventoCobro[]
}

export interface EventoCobro {
  fecha: string
  descripcion: string
  resultado: 'ok' | 'fallido' | 'pendiente'
  importe?: number
}

export interface Fraccionamiento {
  id: string
  totalCuotas: number
  cuotasPagadas: number
  importeCuota: number
  proximaFecha: string
}

export interface ResumenVRU {
  motivoDerivacion: string
  intentosPago: number
  resultadoUltimoPago: string
  llamadasHoy: number
}

// ─── HISTORIAL ────────────────────────────────────────────────────────────────

export interface Interaccion {
  id: string
  fecha: string
  canal: string
  motivo: string
  causaAgrupacion: string
  resolucion: string
  agente: string
  duracion: string
  resuelto: boolean
  relacionadoCon?: string
}

// ─── DISPOSITIVOS ─────────────────────────────────────────────────────────────

export interface Dispositivo {
  id: string
  marca: string
  modelo: string
  categoria: 'smartphone' | 'tablet' | 'tv' | 'wearable'
  storage: string
  pantalla?: string
  color: string[]
  precioLibre: number
  precioMensual: number
  mesesFinanciacion: number
  stock: boolean
  imagen: string
  destacado: boolean
  ahorro?: number
}

// ─── STORE ────────────────────────────────────────────────────────────────────

export interface AppState {
  clienteActivo: Cliente | null
  canalActual: Canal
  perfilAgente: PerfilAgente
  tiempoLlamada: number
  llamadaActiva: boolean
  notas: string
  moduloActivo: string
  notificaciones: Notificacion[]
}

export interface Notificacion {
  id: string
  tipo: 'info' | 'warn' | 'err' | 'ok'
  titulo: string
  mensaje: string
  timestamp: number
  leida: boolean
}