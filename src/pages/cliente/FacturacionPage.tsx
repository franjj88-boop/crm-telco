import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { datosCliente } from '../../data/mockData'
import type { Factura } from '../../types'

// ── EVENTOS MOCK por factura ──
const eventosPorFactura: Record<string, { tipo: string; descripcion: string; fecha: string; impacto?: number }[]> = {
  'FAC-001': [
    { tipo: 'roaming', descripcion: 'Consumo de datos en roaming Francia (18–22 feb)', fecha: '22/02/2026', impacto: 22.60 },
    { tipo: 'promo_fin', descripcion: 'Fin de promoción descuento 10€ — vigente hasta ene 2026', fecha: '01/02/2026', impacto: 10.00 },
  ],
  'FAC-002': [
    { tipo: 'alta', descripcion: 'Alta de segunda línea móvil S 5GB', fecha: '15/01/2026', impacto: 0 },
  ],
  'FAC-003': [
    { tipo: 'precio', descripcion: 'Revisión anual de precio — incremento tarifa base', fecha: '01/12/2025', impacto: 2.00 },
  ],
}

// ── CONSUMOS EN VUELO MOCK ──
const consumosEnVuelo = [
  { id: 'cv1', descripcion: 'Datos roaming UK — periodo actual', fecha: 'Hoy', importe: 8.40, estado: 'en vuelo' },
  { id: 'cv2', descripcion: 'Llamadas internacionales zona 2', fecha: 'Ayer', importe: 3.20, estado: 'en vuelo' },
]

// ── RECLAMACIONES MOCK vinculadas a facturas ──
const reclamacionesPorFactura: Record<string, { id: string; estado: string; importe: number; motivo: string; fechaApertura: string; impactoEn?: string }> = {
  'FAC-001': {
    id: 'REC-2026-0341',
    estado: 'En gestión',
    importe: 22.60,
    motivo: 'Cargo incorrecto por roaming Francia',
    fechaApertura: '05/03/2026',
    impactoEn: 'Próxima factura (abono estimado)',
  },
}

function generarAnalisisIA(f1: Factura, f2: Factura): string {
  const delta = f1.importe - f2.importe
  const diffs: { concepto: string; anterior: number; actual: number; delta: number; tipo: string }[] = []

  f1.conceptos.forEach(ca => {
    const match = f2.conceptos.find(cp =>
      cp.descripcion.replace(/\s*\([^)]*\)/g, '').trim().toLowerCase() ===
      ca.descripcion.replace(/\s*\([^)]*\)/g, '').trim().toLowerCase()
    )
    if (!match) {
      diffs.push({ concepto: ca.descripcion, anterior: 0, actual: ca.importe, delta: ca.importe, tipo: 'nuevo' })
    } else if (Math.abs(ca.importe - match.importe) > 0.01) {
      diffs.push({ concepto: ca.descripcion, anterior: match.importe, actual: ca.importe, delta: ca.importe - match.importe, tipo: ca.importe > match.importe ? 'subida' : 'bajada' })
    }
  })
  f2.conceptos.forEach(cp => {
    const match = f1.conceptos.find(ca =>
      ca.descripcion.replace(/\s*\([^)]*\)/g, '').trim().toLowerCase() ===
      cp.descripcion.replace(/\s*\([^)]*\)/g, '').trim().toLowerCase()
    )
    if (!match) {
      diffs.push({ concepto: cp.descripcion, anterior: cp.importe, actual: 0, delta: -cp.importe, tipo: 'eliminado' })
    }
  })

  const signo = delta > 0 ? 'superior' : delta < 0 ? 'inferior' : 'igual'
  const abs = Math.abs(delta).toFixed(2)
  let texto = `La factura de ${f1.periodo} es ${signo} en ${abs}€ respecto a ${f2.periodo}.\n\n`

  if (diffs.length === 0) {
    texto += 'No se detectan variaciones significativas entre ambas facturas.'
    return texto
  }

  texto += 'Los cambios detectados son los siguientes:\n\n'
  const nuevos = diffs.filter(d => d.tipo === 'nuevo')
  const eliminados = diffs.filter(d => d.tipo === 'eliminado')
  const subidas = diffs.filter(d => d.tipo === 'subida')
  const bajadas = diffs.filter(d => d.tipo === 'bajada')

  if (nuevos.length > 0) {
    texto += `Cargos nuevos: ${nuevos.map(d => `${d.concepto.replace(/\s*\([^)]*\)/g, '').trim()} (${d.actual.toFixed(2)}€)`).join(', ')}. `
    if (nuevos.some(d => d.concepto.toLowerCase().includes('roaming'))) texto += 'El cargo de roaming indica consumo en el extranjero. '
    texto += '\n\n'
  }
  if (eliminados.length > 0) {
    texto += `Conceptos eliminados: ${eliminados.map(d => `${d.concepto.replace(/\s*\([^)]*\)/g, '').trim()} (${d.anterior.toFixed(2)}€)`).join(', ')}. Puede indicar fin de servicio o cancelación de promoción.\n\n`
  }
  if (subidas.length > 0) {
    texto += `Subidas: ${subidas.map(d => `${d.concepto.replace(/\s*\([^)]*\)/g, '').trim()} ${d.anterior.toFixed(2)}€ → ${d.actual.toFixed(2)}€ (+${d.delta.toFixed(2)}€)`).join(', ')}.\n\n`
  }
  if (bajadas.length > 0) {
    texto += `Bajadas: ${bajadas.map(d => `${d.concepto.replace(/\s*\([^)]*\)/g, '').trim()} ${d.anterior.toFixed(2)}€ → ${d.actual.toFixed(2)}€ (${d.delta.toFixed(2)}€)`).join(', ')}.\n\n`
  }

  if (delta > 5) {
    texto += `El incremento de ${abs}€ se explica principalmente por ${nuevos.length > 0 ? 'la aparición de nuevos cargos' : 'el aumento en conceptos existentes'}. Revisar con el cliente antes de cualquier reclamación.`
  } else if (delta < -5) {
    texto += `La reducción de ${abs}€ se debe a ${eliminados.length > 0 ? 'la desaparición de cargos anteriores' : 'la reducción en conceptos existentes'}. Facturación mejorada respecto al período anterior.`
  } else {
    texto += `La diferencia entre ambas facturas es mínima (${abs}€), indicando facturación estable.`
  }
  return texto
}

const iconoEvento = (tipo: string) => ({
  roaming: '✈',
  promo_fin: '⏱',
  alta: '＋',
  precio: '↑',
  baja: '−',
  traslado: '🏠',
}[tipo] || '·')

const colorEvento = (tipo: string) => ({
  roaming: { bg: 'var(--color-amber-light)', border: 'var(--color-amber-border)', color: 'var(--color-amber-dark)' },
  promo_fin: { bg: 'var(--color-red-light)', border: 'var(--color-red-border)', color: 'var(--color-red-dark)' },
  precio: { bg: 'var(--color-red-light)', border: 'var(--color-red-border)', color: 'var(--color-red-dark)' },
  alta: { bg: 'var(--color-blue-light)', border: 'var(--color-blue-mid)', color: 'var(--color-blue-dark)' },
  baja: { bg: 'var(--color-green-light)', border: 'var(--color-green-border)', color: 'var(--color-green-dark)' },
  traslado: { bg: 'var(--color-background-secondary)', border: 'var(--color-border-secondary)', color: 'var(--color-text-secondary)' },
}[tipo] || { bg: 'var(--color-background-secondary)', border: 'var(--color-border-secondary)', color: 'var(--color-text-secondary)' })

export function FacturacionPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [facturaActiva, setFacturaActiva] = useState<string | null>(null)
  const [accionOk, setAccionOk] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)
  const [modalEnvio, setModalEnvio] = useState(false)
  const [envioCanal, setEnvioCanal] = useState<'email' | 'sms' | 'portal'>('email')
  const [envioDestinatario, setEnvioDestinatario] = useState('')
  const [envioDuplicado, setEnvioDuplicado] = useState(false)
  const [trazabilidadEnvios, setTrazabilidadEnvios] = useState<{ fecha: string; canal: string; destinatario: string; factura: string }[]>([])
  const [panelAbierto, setPanelAbierto] = useState<'consumos' | 'buscador' | 'simulador' | 'comparativa' | 'prefactura' | null>(null)

  const [modoComparativa, setModoComparativa] = useState(false)
  const [facturaComp1, setFacturaComp1] = useState<string | null>(null)
  const [facturaComp2, setFacturaComp2] = useState<string | null>(null)
  const [analizando, setAnalizando] = useState(false)
  const [analisisIA, setAnalisisIA] = useState<string | null>(null)

  // RF-08 — Buscador y filtros
  const [filtroBusqueda, setFiltroBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState<string>('todos')
  const [filtroImporteMin, setFiltroImporteMin] = useState('')
  const [filtroImporteMax, setFiltroImporteMax] = useState('')

  // RF-11 — Simulador
  const [simPromo, setSimPromo] = useState(false)
  const [simNuevaLinea, setSimNuevaLinea] = useState(false)
  const [simRoaming, setSimRoaming] = useState(false)
  const [simCalculando, setSimCalculando] = useState(false)
  const [simResultado, setSimResultado] = useState<number | null>(null)

  // RF-16 — Vista tipo factura con diagnóstico
  const [modoVistaFactura, setModoVistaFactura] = useState(false)
  const [conceptoDrilldown, setConceptoDrilldown] = useState<string | null>(null)
  const [cargandoDetalle, setCargandoDetalle] = useState(false)
  const [busquedaInline, setBusquedaInline] = useState('')
  const [paginaFacturas, setPaginaFacturas] = useState(0)
  const [filtroAnio, setFiltroAnio] = useState<string>('todos')
  const [filtroMes, setFiltroMes] = useState<string>('todos')
  const FACTURAS_POR_PAGINA = 5
  const [seleccionEnvio, setSeleccionEnvio] = useState<Set<string>>(new Set())
  const [modoEnvioMultiple, setModoEnvioMultiple] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [conceptosReclamacion, setConceptosReclamacion] = useState<{
    conceptoId: string
    facturaId: string
    facturaPeriodo: string
    descripcion: string
    importe: number
  }[]>([])

  const mostrarConsumos = panelAbierto === 'consumos'
  const modoBuscador = panelAbierto === 'buscador'
  const modoSimulador = panelAbierto === 'simulador'
  const modoPreFactura = panelAbierto === 'prefactura'

  if (!id) return null
  const datos = datosCliente[id]
  if (!datos) return null

  const _meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
  const facturasOrdenadas = [...datos.facturas].sort((a, b) => {
    const [mesA, anioA] = a.periodo.split(' ')
    const [mesB, anioB] = b.periodo.split(' ')
    if (anioB !== anioA) return parseInt(anioB) - parseInt(anioA)
    if (mesB !== mesA) return _meses.indexOf(mesB) - _meses.indexOf(mesA)
    const jA = a.juridicaId || 'A'
    const jB = b.juridicaId || 'A'
    return jA.localeCompare(jB)
  })

  const factura = facturaActiva
    ? datos.facturas.find(f => f.id === facturaActiva) || facturasOrdenadas[0]
    : facturasOrdenadas[0]

  const seleccionarFactura = (fid: string) => {
    if (fid === factura?.id) return
    setCargandoDetalle(true)
    setModoVistaFactura(false)
    setConceptoDrilldown(null)
    setTimeout(() => { setFacturaActiva(fid); setCargandoDetalle(false) }, 400)
  }

  const ejecutar = (accion: string) => {
    setCargando(true)
    setTimeout(() => { setCargando(false) }, 1500)
  }

  const confirmarEnvioDuplicado = () => {
    if (!envioDestinatario.trim()) return
    setCargando(true)
    setTimeout(() => {
      setCargando(false)
      setTrazabilidadEnvios(prev => [...prev, {
        fecha: new Date().toLocaleString('es-ES'),
        canal: envioCanal,
        destinatario: envioDestinatario,
        factura: factura?.numero || ''
      }])
      setEnvioDuplicado(true)
      setModalEnvio(false)
      setTimeout(() => setEnvioDuplicado(false), 4000)
    }, 1500)
  }

  const estadoPill = (e: string) => {
    if (e === 'pagada') return 'pill-ok'
    if (e === 'vencida') return 'pill-err'
    if (e === 'devuelta') return 'pill-err'
    if (e === 'fraccionada') return 'pill-purple'
    return 'pill-warn'
  }

  const lanzarAnalisis = () => {
    if (!facturaComp1 || !facturaComp2) return
    const f1 = datos.facturas.find(f => f.id === facturaComp1)
    const f2 = datos.facturas.find(f => f.id === facturaComp2)
    if (!f1 || !f2) return
    setAnalizando(true)
    setAnalisisIA(null)
    setTimeout(() => { setAnalisisIA(generarAnalisisIA(f1, f2)); setAnalizando(false) }, 2200)
  }

  const seleccionarParaComparativa = (factId: string) => {
    if (!facturaComp1) { setFacturaComp1(factId) }
    else if (!facturaComp2 && factId !== facturaComp1) { setFacturaComp2(factId) }
    else if (factId === facturaComp1) { setFacturaComp1(facturaComp2); setFacturaComp2(null); setAnalisisIA(null) }
    else if (factId === facturaComp2) { setFacturaComp2(null); setAnalisisIA(null) }
  }

  const f1Obj = datos.facturas.find(f => f.id === facturaComp1)
  const f2Obj = datos.facturas.find(f => f.id === facturaComp2)

  const calcDiffs = (f1: Factura, f2: Factura) => {
    const diffs: { concepto: string; anterior: number; actual: number; delta: number; tipo: string }[] = []
    f1.conceptos.forEach(ca => {
      const match = f2.conceptos.find(cp =>
        cp.descripcion.replace(/\s*\([^)]*\)/g, '').trim().toLowerCase() ===
        ca.descripcion.replace(/\s*\([^)]*\)/g, '').trim().toLowerCase()
      )
      if (!match) diffs.push({ concepto: ca.descripcion, anterior: 0, actual: ca.importe, delta: ca.importe, tipo: 'nuevo' })
      else if (Math.abs(ca.importe - match.importe) > 0.01) diffs.push({ concepto: ca.descripcion, anterior: match.importe, actual: ca.importe, delta: ca.importe - match.importe, tipo: ca.importe > match.importe ? 'subida' : 'bajada' })
    })
    f2.conceptos.forEach(cp => {
      const match = f1.conceptos.find(ca =>
        ca.descripcion.replace(/\s*\([^)]*\)/g, '').trim().toLowerCase() ===
        cp.descripcion.replace(/\s*\([^)]*\)/g, '').trim().toLowerCase()
      )
      if (!match) diffs.push({ concepto: cp.descripcion, anterior: cp.importe, actual: 0, delta: -cp.importe, tipo: 'eliminado' })
    })
    return diffs
  }

  const diffs = f1Obj && f2Obj ? calcDiffs(f1Obj, f2Obj) : []
  const eventosFactura = factura ? (eventosPorFactura[factura.id] || []) : []
  const reclamacionFactura = factura ? reclamacionesPorFactura[factura.id] : null

  // Comparativa automática con factura anterior
  const facturasNormales = facturasOrdenadas.filter(f => !(f as any).esRectificativa)
  const facturaAnteriorAuto = factura
    ? facturasNormales.find(f =>
        f.id !== factura.id &&
        ((f as any).juridicaId || 'A') === ((factura as any).juridicaId || 'A') &&
        (() => {
          const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
          const [mesAct, anioAct] = factura.periodo.split(' ')
          const [mesF, anioF] = f.periodo.split(' ')
          const idxAct = parseInt(anioAct) * 12 + meses.indexOf(mesAct)
          const idxF = parseInt(anioF) * 12 + meses.indexOf(mesF)
          return idxF < idxAct
        })()
      ) || null
    : null
  const diffsAuto = factura && facturaAnteriorAuto ? calcDiffs(factura, facturaAnteriorAuto) : []
  const deltaAuto = factura && facturaAnteriorAuto ? factura.importe - facturaAnteriorAuto.importe : 0

  // RF-08 — Facturas filtradas
  const facturasFiltradas = datos.facturas.filter(f => {
    if (filtroEstado !== 'todos' && f.estado !== filtroEstado) return false
    if (filtroAnio !== 'todos' && !f.periodo.includes(filtroAnio)) return false
    if (filtroMes !== 'todos' && !f.periodo.toLowerCase().startsWith(filtroMes)) return false
    if (filtroImporteMin && f.importe < parseFloat(filtroImporteMin)) return false
    if (filtroImporteMax && f.importe > parseFloat(filtroImporteMax)) return false
    if (filtroBusqueda) {
      const q = filtroBusqueda.toLowerCase()
      return f.numero.toLowerCase().includes(q) ||
        f.periodo.toLowerCase().includes(q) ||
        f.conceptos.some(c => c.descripcion.toLowerCase().includes(q))
    }
    return true
  })

  const hayFiltros = filtroEstado !== 'todos' || filtroAnio !== 'todos' || filtroMes !== 'todos' || filtroImporteMin || filtroImporteMax || filtroBusqueda

  // RF-11 — Cálculo simulado
  // RF-16 — Motor de diagnóstico por concepto
  const diagnosticarConcepto = (c: any, factura: any, facturaAnterior: any) => {
    if (!c.anomalo && c.importe >= 0) {
      if (facturaAnterior) {
        const match = facturaAnterior.conceptos.find((cp: any) =>
          cp.descripcion.replace(/\s*\([^)]*\)/g, '').trim().toLowerCase() ===
          c.descripcion.replace(/\s*\([^)]*\)/g, '').trim().toLowerCase()
        )
        if (!match) return { badge: 'nuevo', label: 'Nuevo concepto', color: 'var(--color-blue-dark)', bg: 'var(--color-blue-light)', border: 'var(--color-blue-mid)', explicacion: 'Este concepto no aparecía en la factura anterior. Puede ser un nuevo servicio, consumo puntual o cargo adicional.' }
        if (Math.abs(c.importe - match.importe) > 1) {
          const subio = c.importe > match.importe
          return { badge: subio ? 'subida' : 'bajada', label: subio ? `↑ Subida ${(c.importe - match.importe).toFixed(2)}€` : `↓ Bajada ${(match.importe - c.importe).toFixed(2)}€`, color: subio ? 'var(--color-red-dark)' : 'var(--color-green-dark)', bg: subio ? 'var(--color-red-light)' : 'var(--color-green-light)', border: subio ? 'var(--color-red-border)' : 'var(--color-green-border)', explicacion: subio ? `El importe ha subido de ${match.importe.toFixed(2)}€ a ${c.importe.toFixed(2)}€. Puede deberse a una revisión de precio, fin de promoción o cambio de tarifa.` : `El importe ha bajado de ${match.importe.toFixed(2)}€ a ${c.importe.toFixed(2)}€. Puede deberse a una promoción aplicada, ajuste de tarifa o abono parcial.` }
        }
      }
      return { badge: 'normal', label: 'Normal', color: 'var(--color-green-dark)', bg: 'var(--color-green-light)', border: 'var(--color-green-border)', explicacion: 'Concepto estable, sin variaciones respecto a la factura anterior.' }
    }
    if (c.importe < 0) return { badge: 'descuento', label: 'Descuento / Abono', color: 'var(--color-green-dark)', bg: 'var(--color-green-light)', border: 'var(--color-green-border)', explicacion: 'Descuento, promoción o abono aplicado a esta factura.' }
    if (c.anomalo) {
      const desc = c.descripcion.toLowerCase()
      if (desc.includes('roaming')) return { badge: 'anomalia', label: '⚠ Anomalía — Roaming', color: 'var(--color-amber-dark)', bg: 'var(--color-amber-light)', border: 'var(--color-amber-border)', explicacion: 'Cargo de roaming detectado. Puede indicar viaje al extranjero con datos activos. Verificar con el cliente si lo reconoce.' }
      if (desc.includes('reposición') || desc.includes('técnico')) return { badge: 'anomalia', label: '⚠ Anomalía — Cargo técnico', color: 'var(--color-amber-dark)', bg: 'var(--color-amber-light)', border: 'var(--color-amber-border)', explicacion: 'Cargo por visita o intervención técnica. Verificar si el cliente autorizó la intervención.' }
      if (desc.includes('contenido') || desc.includes('suscripción') || desc.includes('emoción')) return { badge: 'anomalia', label: '⚠ Anomalía — Contenido externo', color: 'var(--color-red-dark)', bg: 'var(--color-red-light)', border: 'var(--color-red-border)', explicacion: 'Cargo por contenido o suscripción externa. Verificar si el cliente reconoce la contratación.' }
      return { badge: 'no_identificada', label: '? No identificada', color: 'var(--color-text-secondary)', bg: 'var(--color-background-secondary)', border: 'var(--color-border-secondary)', explicacion: 'Variación detectada pero sin causa clara identificada. Requiere revisión manual.' }
    }
    return { badge: 'normal', label: 'Normal', color: 'var(--color-green-dark)', bg: 'var(--color-green-light)', border: 'var(--color-green-border)', explicacion: 'Concepto estable.' }
  }

  const facturaAnterior = factura
    ? datos.facturas.find((f, i) => datos.facturas[i - 1]?.id === factura.id) ||
      datos.facturas[datos.facturas.indexOf(factura) + 1] || null
    : null

  const lanzarSimulacion = () => {
    setSimCalculando(true)
    setSimResultado(null)
    setTimeout(() => {
      const base = datos.facturas[0]?.importe || 0
      let estimado = base
      if (simPromo) estimado -= 10
      if (simNuevaLinea) estimado += 18.90
      if (simRoaming) estimado += 12.50
      setSimResultado(estimado)
      setSimCalculando(false)
    }, 1800)
  }

  return (
    <>
      {/* ── HEADER ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>Consulta de facturas</div>
          <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 2 }}>
            Historial · Detalle · Eventos · Comparativa IA
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setPanelAbierto(panelAbierto === 'consumos' ? null : 'consumos')}
            style={{ padding: '4px 12px', fontSize: 11, borderRadius: 'var(--border-radius-full)', border: `1.5px solid ${mostrarConsumos ? 'var(--color-amber-border)' : 'var(--color-border-secondary)'}`, background: mostrarConsumos ? 'var(--color-amber-light)' : 'none', color: mostrarConsumos ? 'var(--color-amber-dark)' : 'var(--color-text-secondary)', cursor: 'pointer', fontWeight: mostrarConsumos ? 600 : 400 }}>
            ✈ Consumos en vuelo ({consumosEnVuelo.length})
          </button>
          <button
            onClick={() => { setPanelAbierto(panelAbierto === 'buscador' ? null : 'buscador'); setFiltroBusqueda(''); setFiltroEstado('todos'); setFiltroImporteMin(''); setFiltroImporteMax('') }}
            style={{ padding: '4px 12px', fontSize: 11, borderRadius: 'var(--border-radius-full)', border: `1.5px solid ${modoBuscador ? 'var(--color-blue)' : 'var(--color-border-secondary)'}`, background: modoBuscador ? 'var(--color-blue-light)' : 'none', color: modoBuscador ? 'var(--color-blue-dark)' : 'var(--color-text-secondary)', cursor: 'pointer', fontWeight: modoBuscador ? 600 : 400 }}>
            🔍 Buscar
          </button>
          <button
            onClick={() => setPanelAbierto(panelAbierto === 'prefactura' ? null : 'prefactura')}
            style={{ padding: '4px 12px', fontSize: 11, borderRadius: 'var(--border-radius-full)', border: `1.5px solid ${modoPreFactura ? 'var(--color-green-border)' : 'var(--color-border-secondary)'}`, background: modoPreFactura ? 'var(--color-green-light)' : 'none', color: modoPreFactura ? 'var(--color-green-dark)' : 'var(--color-text-secondary)', cursor: 'pointer', fontWeight: modoPreFactura ? 600 : 400 }}>
            🧾 Pre-factura
          </button>
          <button
            onClick={() => setPanelAbierto(panelAbierto === 'simulador' ? null : 'simulador')}
            style={{ padding: '4px 12px', fontSize: 11, borderRadius: 'var(--border-radius-full)', border: `1.5px solid ${modoSimulador ? 'var(--color-purple-border)' : 'var(--color-border-secondary)'}`, background: modoSimulador ? 'var(--color-purple-light)' : 'none', color: modoSimulador ? 'var(--color-purple)' : 'var(--color-text-secondary)', cursor: 'pointer', fontWeight: modoSimulador ? 600 : 400 }}>
            📊 Simulador
          </button>
          <button
            onClick={() => { setPanelAbierto(panelAbierto === 'comparativa' ? null : 'comparativa'); setModoComparativa(panelAbierto !== 'comparativa'); setFacturaComp1(null); setFacturaComp2(null); setAnalisisIA(null) }}
            style={{ padding: '4px 12px', fontSize: 11, borderRadius: 'var(--border-radius-full)', border: `1.5px solid ${modoComparativa ? 'var(--color-blue)' : 'var(--color-border-secondary)'}`, background: modoComparativa ? 'var(--color-blue-light)' : 'none', color: modoComparativa ? 'var(--color-blue-dark)' : 'var(--color-text-secondary)', cursor: 'pointer', fontWeight: modoComparativa ? 600 : 400 }}>
            {modoComparativa ? '✓ Comparativa activa' : '⇄ Comparar facturas'}
          </button>
          {datos.cobros.deudaTotal > 0 && (
            <button onClick={() => navigate(`/cliente/${id}/cobros`)} className="btn-danger" style={{ fontSize: 11 }}>
              ⚠ Deuda: {datos.cobros.deudaTotal.toFixed(2)}€
            </button>
          )}
        </div>
      </div>

      {accionOk && (
        <div className="alert alert-ok fade-in">
          <span>✓</span>
          <span style={{ fontWeight: 600 }}>{accionOk} ejecutado correctamente</span>
        </div>
      )}

      {/* ── CONSUMOS EN VUELO (RF-01) ── */}
      {mostrarConsumos && (
        <div className="card fade-in" style={{ border: '1.5px solid var(--color-amber-border)', background: 'var(--color-amber-light)' }}>
          <div className="card-title" style={{ color: 'var(--color-amber-dark)' }}>
            ✈ Consumos en vuelo — pendientes de facturar
            <span style={{ fontSize: 10, fontWeight: 400, color: 'var(--color-amber-dark)' }}>No aparecen en la última factura emitida</span>
          </div>
          {consumosEnVuelo.map(c => (
            <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', marginBottom: 6, borderRadius: 'var(--border-radius-md)', background: 'rgba(255,255,255,0.6)', border: '1px solid var(--color-amber-border)' }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-amber-dark)' }}>{c.descripcion}</div>
                <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)' }}>{c.fecha} · {c.estado}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-amber-dark)' }}>+{c.importe.toFixed(2)}€</span>
                <button onClick={() => navigate(`/cliente/${id}/reclamaciones`, { state: { abrirFormulario: true, importe: c.importe, motivo: `Consumo en vuelo: ${c.descripcion}` } })} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 'var(--border-radius-full)', border: '1px solid var(--color-amber-border)', background: 'white', color: 'var(--color-amber-dark)', cursor: 'pointer', fontWeight: 600 }}>
                  Reclamar
                </button>
              </div>
            </div>
          ))}
          <div style={{ fontSize: 10, color: 'var(--color-amber-dark)', marginTop: 6, fontWeight: 600 }}>
            Total estimado en vuelo: {consumosEnVuelo.reduce((a, c) => a + c.importe, 0).toFixed(2)}€ — aparecerá en la próxima factura
          </div>
        </div>
      )}

      {/* ── BUSCADOR Y FILTROS (RF-08) ── */}
      {modoBuscador && (
        <div className="card fade-in">
          <div className="card-title">
            🔍 Búsqueda avanzada
            {hayFiltros && (
              <button
                onClick={() => { setFiltroBusqueda(''); setFiltroEstado('todos'); setFiltroAnio('todos'); setFiltroMes('todos'); setFiltroImporteMin(''); setFiltroImporteMax('') }}
                style={{ fontSize: 10, color: 'var(--color-blue-dark)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                ↺ Limpiar filtros
              </button>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, marginBottom: 10 }}>
            <input
              className="input"
              placeholder="Buscar por número, periodo o concepto..."
              value={filtroBusqueda}
              onChange={e => setFiltroBusqueda(e.target.value)}
              autoFocus
            />
            <span style={{ display: 'flex', alignItems: 'center', fontSize: 12, color: 'var(--color-text-tertiary)', padding: '0 8px' }}>
              {facturasFiltradas.length} resultado/s
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-tertiary)', marginBottom: 4, textTransform: 'uppercase' }}>Año</div>
              <select className="input" value={filtroAnio} onChange={e => setFiltroAnio(e.target.value)}>
                <option value="todos">Todos</option>
                {Array.from(new Set(datos.facturas.map(f => f.periodo.split(' ')[1]))).sort((a, b) => b.localeCompare(a)).map(anio => (
                  <option key={anio} value={anio}>{anio}</option>
                ))}
              </select>
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-tertiary)', marginBottom: 4, textTransform: 'uppercase' }}>Mes</div>
              <select className="input" value={filtroMes} onChange={e => setFiltroMes(e.target.value)}>
                <option value="todos">Todos</option>
                {['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'].map(m => (
                  <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-tertiary)', marginBottom: 4, textTransform: 'uppercase' }}>Estado</div>
              <select className="input" value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}>
                <option value="todos">Todos</option>
                <option value="pagada">Pagada</option>
                <option value="pendiente">Pendiente</option>
                <option value="vencida">Vencida</option>
                <option value="fraccionada">Fraccionada</option>
              </select>
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-tertiary)', marginBottom: 4, textTransform: 'uppercase' }}>Importe mínimo</div>
              <input className="input" type="number" placeholder="0€" value={filtroImporteMin} onChange={e => setFiltroImporteMin(e.target.value)} />
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text-tertiary)', marginBottom: 4, textTransform: 'uppercase' }}>Importe máximo</div>
              <input className="input" type="number" placeholder="999€" value={filtroImporteMax} onChange={e => setFiltroImporteMax(e.target.value)} />
            </div>
          </div>

          {!hayFiltros ? (
            <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--color-text-tertiary)', fontSize: 12 }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>🔍</div>
              Usa los filtros o el buscador para encontrar facturas
            </div>
          ) : facturasFiltradas.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--color-text-tertiary)', fontSize: 12 }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>🔍</div>
              Sin resultados para estos filtros
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {facturasFiltradas.map(f => {
                const tieneRec = !!reclamacionesPorFactura[f.id]
                const eventos = eventosPorFactura[f.id] || []
                return (
                  <div
                    key={f.id}
                    onClick={() => { seleccionarFactura(f.id); setPanelAbierto(null); setConceptosReclamacion([]) }}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', border: `1px solid ${tieneRec ? 'var(--color-red-border)' : 'var(--color-border-tertiary)'}`, borderLeft: `3px solid ${tieneRec ? 'var(--color-red-mid)' : f.estado === 'pagada' ? 'var(--color-green-border)' : 'var(--color-amber-mid)'}`, borderRadius: 'var(--border-radius-md)', cursor: 'pointer', background: 'var(--color-background-primary)', transition: 'all 0.1s' }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 12, fontWeight: 600 }}>{f.numero}</span>
                        <span className={`pill ${estadoPill(f.estado)}`} style={{ fontSize: 9 }}>{f.estado}</span>
                        {tieneRec && <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 'var(--border-radius-full)', background: 'var(--color-red-light)', color: 'var(--color-red-dark)', border: '1px solid var(--color-red-border)', fontWeight: 600 }}>⚠ REC</span>}
                        {eventos.length > 0 && <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 'var(--border-radius-full)', background: 'var(--color-blue-light)', color: 'var(--color-blue-dark)', border: '1px solid var(--color-blue-mid)', fontWeight: 600 }}>{eventos.length} ev.</span>}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{f.periodo} · Vence {f.fechaVencimiento}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-mono)', color: f.estado === 'vencida' ? 'var(--color-red)' : 'var(--color-text-primary)' }}>{f.importe.toFixed(2)}€</div>
                      <div style={{ fontSize: 10, color: 'var(--color-blue-dark)', fontWeight: 600, marginTop: 2 }}>Ver detalle →</div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── PRE-FACTURA — Factura cerrada pendiente de cargo bancario ── */}
      {modoPreFactura && (() => {
        // Datos de pre-factura simulados basados en el cliente activo
        const ultimaFactura = datos.facturas.filter(f => !(f as any).esRectificativa)[0]
        const fechaCierre = '09/04/2026'
        const fechaCargo = '13/04/2026'
        const diasParaCargo = 2

        // Conceptos de la pre-factura = mismos que la última + consumos en vuelo cerrados
        const conceptosPreFactura = [
          ...( ultimaFactura?.conceptos.filter(c => c.tipo === 'cuota' || c.tipo === 'dispositivo' || c.tipo === 'descuento') || []),
          // Consumos en vuelo que ya entraron en el cierre
          ...consumosEnVuelo.map((c, i) => ({
            id: `vuelo-${i}`,
            descripcion: c.descripcion,
            importe: c.importe,
            tipo: 'consumo' as const,
            anomalo: c.importe > 5,
          }))
        ]

        const importePreFactura = conceptosPreFactura.reduce((a, c) => a + c.importe, 0)
        const importeAnterior = ultimaFactura?.importe || 0
        const delta = importePreFactura - importeAnterior

        return (
          <div className="card fade-in" style={{ border: '1.5px solid var(--color-green-border)', background: 'var(--color-green-light)' }}>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-green-dark)' }}>🧾 Pre-factura — Abril 2026</span>
                  <span style={{ fontSize: 9, padding: '2px 8px', borderRadius: 9999, background: 'var(--color-green-border)', color: '#fff', fontWeight: 700 }}>CERRADA</span>
                  <span style={{ fontSize: 9, padding: '2px 8px', borderRadius: 9999, background: 'var(--color-amber-light)', color: 'var(--color-amber-dark)', border: '1px solid var(--color-amber-border)', fontWeight: 700 }}>PENDIENTE CARGO</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--color-green-dark)', opacity: 0.85 }}>
                  Factura cerrada el {fechaCierre} · Cargo bancario previsto el <strong>{fechaCargo}</strong>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 24, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-green-dark)' }}>
                  {importePreFactura.toFixed(2)}€
                </div>
                <div style={{ fontSize: 10, color: 'var(--color-green-dark)', opacity: 0.8 }}>Pendiente de cargo</div>
              </div>
            </div>

            {/* Cuenta atrás para cargo */}
            <div style={{ marginBottom: 14, padding: '10px 12px', borderRadius: 'var(--border-radius-md)', background: 'rgba(255,255,255,0.65)', border: '1px solid var(--color-green-border)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--color-green-border)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: 13, fontWeight: 700 }}>{diasParaCargo}</span>
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-green-dark)' }}>
                  Cargo bancario en {diasParaCargo} días
                </div>
                <div style={{ fontSize: 10, color: 'var(--color-green-dark)', opacity: 0.8, marginTop: 2 }}>
                  {datos.cobros.estadoGeneral !== 'sin_deuda' ? '⚠ Revisar domiciliación' : '✓ Domiciliación activa — cargo automático el ' + fechaCargo}
                </div>
              </div>
            </div>

            {/* Comparativa vs factura anterior */}
            {ultimaFactura && (
              <div style={{ marginBottom: 14, padding: '8px 12px', borderRadius: 'var(--border-radius-md)', background: delta > 0 ? 'var(--color-red-light)' : delta < 0 ? 'var(--color-green-light)' : 'rgba(255,255,255,0.5)', border: `1px solid ${delta > 0 ? 'var(--color-red-border)' : delta < 0 ? 'var(--color-green-border)' : 'var(--color-border-secondary)'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 11, color: delta > 0 ? 'var(--color-red-dark)' : delta < 0 ? 'var(--color-green-dark)' : 'var(--color-text-secondary)' }}>
                  {delta > 0 ? '↑ Incremento' : delta < 0 ? '↓ Reducción' : '= Sin cambios'} vs {ultimaFactura.periodo}
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)', color: delta > 0 ? 'var(--color-red-dark)' : delta < 0 ? 'var(--color-green-dark)' : 'var(--color-text-secondary)' }}>
                  {delta > 0 ? '+' : ''}{delta.toFixed(2)}€
                </div>
              </div>
            )}

            {/* Desglose de conceptos */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-green-dark)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, opacity: 0.8 }}>
                Desglose de conceptos
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {conceptosPreFactura.map((c, i) => (
                  <div key={c.id || i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 10px', borderRadius: 'var(--border-radius-md)', background: 'rgba(255,255,255,0.65)', border: `1px solid ${c.anomalo ? 'var(--color-amber-border)' : 'var(--color-green-border)'}` }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 500, color: c.anomalo ? 'var(--color-amber-dark)' : 'var(--color-green-dark)' }}>
                        {c.anomalo && '⚠ '}{c.descripcion}
                      </div>
                      <div style={{ fontSize: 9, color: 'var(--color-green-dark)', opacity: 0.7, marginTop: 1, textTransform: 'capitalize' }}>
                        {c.tipo === 'consumo' ? '⚡ Consumo en vuelo — incluido en este cierre' : c.tipo}
                      </div>
                    </div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: c.importe < 0 ? 'var(--color-green)' : c.anomalo ? 'var(--color-amber-dark)' : 'var(--color-green-dark)', flexShrink: 0, marginLeft: 12 }}>
                      {c.importe > 0 ? '+' : ''}{c.importe.toFixed(2)}€
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Total y aviso */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderRadius: 'var(--border-radius-md)', background: 'rgba(255,255,255,0.8)', border: '1.5px solid var(--color-green-border)', marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-green-dark)' }}>Total pre-factura</span>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-green-dark)' }}>{importePreFactura.toFixed(2)}€</div>
                <div style={{ fontSize: 10, color: 'var(--color-green-dark)', opacity: 0.8 }}>{(importePreFactura * 1.21).toFixed(2)}€ con IVA</div>
              </div>
            </div>

            {/* Anomalías detectadas */}
            {conceptosPreFactura.some(c => c.anomalo) && (
              <div className="alert alert-warn fade-in" style={{ marginBottom: 12 }}>
                <span>⚠</span>
                <div>
                  <div style={{ fontWeight: 600 }}>Anomalías detectadas en esta pre-factura</div>
                  <div style={{ fontSize: 11, marginTop: 2 }}>
                    Hay cargos marcados como anómalos. El cliente puede reclamarlos cuando la factura se emita oficialmente.
                  </div>
                </div>
              </div>
            )}

            {/* Acciones */}
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => navigate(`/cliente/${id}/consumos`)}
                className="btn-secondary"
                style={{ flex: 1, justifyContent: 'center', fontSize: 11 }}>
                Ver consumos →
              </button>
              <button
                onClick={() => {
                  setEnvioDestinatario(datos.email || '')
                  setModalEnvio(true)
                }}
                className="btn-secondary"
                style={{ flex: 1, justifyContent: 'center', fontSize: 11 }}>
                📧 Enviar pre-factura al cliente
              </button>
            </div>

            <div style={{ marginTop: 10, fontSize: 10, color: 'var(--color-green-dark)', opacity: 0.75, fontStyle: 'italic' }}>
              ⚠ La pre-factura es informativa. El importe definitivo puede variar hasta la emisión oficial. No genera reclamación hasta que la factura esté emitida.
            </div>
          </div>
        )
      })()}

      {/* ── SIMULADOR DE FACTURA FUTURA (RF-11) ── */}
      {modoSimulador && (
        <div className="card fade-in" style={{ border: '1.5px solid var(--color-purple-border)', background: 'var(--color-purple-light)' }}>
          <div className="card-title" style={{ color: 'var(--color-purple)' }}>
            📊 Simulador de próxima factura
            <span style={{ fontSize: 10, fontWeight: 400, color: 'var(--color-text-tertiary)' }}>Estimación orientativa — no vinculante</span>
          </div>

          <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 14 }}>
            Selecciona los cambios previstos para simular el impacto en la próxima factura.
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            {[
              { id: 'promo', label: 'Vencimiento de promoción', desc: 'La promo de 10€/mes vence este mes', impacto: '+10,00€', state: simPromo, set: setSimPromo },
              { id: 'linea', label: 'Alta de nueva línea móvil', desc: 'Se añade una segunda línea a 18,90€/mes', impacto: '+18,90€', state: simNuevaLinea, set: setSimNuevaLinea },
              { id: 'roaming', label: 'Consumo de roaming activo', desc: 'Consumo estimado en UK — periodo actual', impacto: '+12,50€', state: simRoaming, set: setSimRoaming },
            ].map(s => (
              <div
                key={s.id}
                onClick={() => { s.set(!s.state); setSimResultado(null) }}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 'var(--border-radius-md)', border: `1.5px solid ${s.state ? 'var(--color-purple-border)' : 'var(--color-border-secondary)'}`, background: s.state ? 'rgba(124,58,237,0.08)' : 'var(--color-background-primary)', cursor: 'pointer', transition: 'all 0.1s' }}
              >
                <div style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${s.state ? 'var(--color-purple)' : 'var(--color-border-secondary)'}`, background: s.state ? 'var(--color-purple)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {s.state && <span style={{ fontSize: 10, color: '#fff', fontWeight: 700 }}>✓</span>}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: s.state ? 'var(--color-purple)' : 'var(--color-text-primary)' }}>{s.label}</div>
                  <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', marginTop: 2 }}>{s.desc}</div>
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-red-dark)', flexShrink: 0 }}>{s.impacto}</span>
              </div>
            ))}
          </div>

          <button
            onClick={lanzarSimulacion}
            disabled={simCalculando}
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center', height: 36, fontSize: 12, background: 'var(--color-purple)', borderColor: 'var(--color-purple)' }}>
            {simCalculando
              ? <><span className="spinner spinner-sm" /> Calculando estimación...</>
              : '📊 Calcular próxima factura estimada'
            }
          </button>

          {simResultado !== null && !simCalculando && (
            <div style={{ marginTop: 14, padding: '14px', borderRadius: 'var(--border-radius-lg)', background: 'var(--color-background-primary)', border: '1.5px solid var(--color-purple-border)' }} className="fade-in">
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                Estimación próxima factura
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 2 }}>Factura actual</div>
                  <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-text-secondary)' }}>
                    {datos.facturas[0]?.importe.toFixed(2)}€
                  </div>
                </div>
                <div style={{ fontSize: 20, color: 'var(--color-text-tertiary)' }}>→</div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 2 }}>Estimación próxima</div>
                  <div style={{ fontSize: 24, fontWeight: 700, fontFamily: 'var(--font-mono)', color: simResultado > (datos.facturas[0]?.importe || 0) ? 'var(--color-red)' : 'var(--color-green)' }}>
                    {simResultado.toFixed(2)}€
                  </div>
                </div>
              </div>

              {(() => {
                const delta = simResultado - (datos.facturas[0]?.importe || 0)
                return delta !== 0 ? (
                  <div style={{ padding: '6px 10px', borderRadius: 'var(--border-radius-md)', background: delta > 0 ? 'var(--color-red-light)' : 'var(--color-green-light)', border: `1px solid ${delta > 0 ? 'var(--color-red-border)' : 'var(--color-green-border)'}`, fontSize: 12, fontWeight: 600, color: delta > 0 ? 'var(--color-red-dark)' : 'var(--color-green-dark)', textAlign: 'center', marginBottom: 10 }}>
                    {delta > 0 ? '↑' : '↓'} {delta > 0 ? '+' : ''}{delta.toFixed(2)}€ respecto a la factura actual
                  </div>
                ) : null
              })()}

              <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', fontStyle: 'italic', lineHeight: 1.6 }}>
                ⚠ Esta estimación es orientativa y no tiene en cuenta posibles cambios en el catálogo, cargos extraordinarios ni ajustes de facturación. La factura real puede variar.
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── MODO COMPARATIVA ── */}
      {modoComparativa && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {!facturaComp1 && (
            <div className="alert alert-blue">
              <span>ℹ</span>
              <span style={{ fontSize: 11 }}>Selecciona dos facturas para comparar. La IA analizará las diferencias y los eventos asociados.</span>
            </div>
          )}
          {facturaComp1 && !facturaComp2 && (
            <div className="alert alert-blue">
              <span>ℹ</span>
              <span style={{ fontSize: 11 }}>Ahora selecciona la segunda factura para comparar con <strong>{f1Obj?.periodo}</strong>.</span>
            </div>
          )}

          <div style={{ display: 'flex', gap: 8 }}>
            {datos.facturas.map(f => {
              const isComp1 = facturaComp1 === f.id
              const isComp2 = facturaComp2 === f.id
              return (
                <div key={f.id} onClick={() => seleccionarParaComparativa(f.id)}
                  style={{ flex: 1, padding: '10px 12px', border: `1.5px solid ${isComp1 ? 'var(--color-blue)' : isComp2 ? 'var(--color-purple-border)' : 'var(--color-border-tertiary)'}`, borderRadius: 'var(--border-radius-lg)', cursor: 'pointer', background: isComp1 ? 'var(--color-blue-light)' : isComp2 ? 'var(--color-purple-light)' : 'var(--color-background-primary)', transition: 'all 0.1s', position: 'relative' }}>
                  {(isComp1 || isComp2) && (
                    <div style={{ position: 'absolute', top: 6, right: 8, fontSize: 10, fontWeight: 700, color: isComp1 ? 'var(--color-blue-dark)' : 'var(--color-purple)' }}>
                      {isComp1 ? 'Factura A' : 'Factura B'}
                    </div>
                  )}
                  <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginBottom: 2 }}>{f.periodo}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-mono)', color: f.estado === 'vencida' ? 'var(--color-red)' : 'var(--color-text-primary)', marginBottom: 4 }}>{f.importe.toFixed(2)}€</div>
                  <span className={`pill ${estadoPill(f.estado)}`} style={{ fontSize: 9 }}>{f.estado}</span>
                  {eventosPorFactura[f.id]?.length > 0 && (
                    <div style={{ marginTop: 6, fontSize: 9, color: 'var(--color-amber-dark)', fontWeight: 600 }}>
                      {eventosPorFactura[f.id].length} evento/s detectado/s
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {facturaComp1 && facturaComp2 && !analisisIA && (
            <button onClick={lanzarAnalisis} disabled={analizando} className="btn-primary" style={{ justifyContent: 'center', height: 38, fontSize: 13 }}>
              {analizando
                ? <><span className="spinner spinner-sm" /> Analizando con IA...</>
                : '🤖 Analizar diferencias con IA'
              }
            </button>
          )}

          {analizando && (
            <div className="card" style={{ textAlign: 'center', padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 12 }}>
                <span className="spinner" />
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-blue-dark)' }}>Analizando facturas...</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>
                Comparando conceptos · Detectando variaciones · Identificando eventos
              </div>
            </div>
          )}

          {f1Obj && f2Obj && analisisIA && (
            <>
              <div className="grid2">
                {[f1Obj, f2Obj].map((f, i) => (
                  <div key={f.id} style={{ padding: '12px 14px', border: `1.5px solid ${i === 0 ? 'var(--color-blue-mid)' : 'var(--color-purple-border)'}`, borderRadius: 'var(--border-radius-lg)', background: i === 0 ? 'var(--color-blue-light)' : 'var(--color-purple-light)' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: i === 0 ? 'var(--color-blue-dark)' : 'var(--color-purple)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                      Factura {i === 0 ? 'A' : 'B'} · {f.periodo}
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-mono)', color: i === 0 ? 'var(--color-blue-dark)' : 'var(--color-purple)', marginBottom: 6 }}>{f.importe.toFixed(2)}€</div>
                    <span className={`pill ${estadoPill(f.estado)}`} style={{ fontSize: 9 }}>{f.estado}</span>
                  </div>
                ))}
              </div>

              {(() => {
                const delta = f1Obj.importe - f2Obj.importe
                return (
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <div style={{ padding: '8px 20px', borderRadius: 'var(--border-radius-full)', background: delta > 0 ? 'var(--color-red-light)' : delta < 0 ? 'var(--color-green-light)' : 'var(--color-background-secondary)', border: `1.5px solid ${delta > 0 ? 'var(--color-red-border)' : delta < 0 ? 'var(--color-green-border)' : 'var(--color-border-secondary)'}`, fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)', color: delta > 0 ? 'var(--color-red)' : delta < 0 ? 'var(--color-green)' : 'var(--color-text-secondary)' }}>
                      {delta > 0 ? '↑' : delta < 0 ? '↓' : '='} {delta > 0 ? '+' : ''}{delta.toFixed(2)}€ entre A y B
                    </div>
                  </div>
                )
              })()}

              {/* Eventos de las dos facturas (RF-07) */}
              {([f1Obj, f2Obj] as Factura[]).some(f => (eventosPorFactura[f.id] || []).length > 0) && (
                <div className="card">
                  <div className="card-title">📋 Eventos asociados a las facturas comparadas</div>
                  {([f1Obj, f2Obj] as Factura[]).map((f, idx) =>
                    (eventosPorFactura[f.id] || []).map((ev, i) => {
                      const col = colorEvento(ev.tipo)
                      return (
                        <div key={`${idx}-${i}`} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 10px', marginBottom: 6, borderRadius: 'var(--border-radius-md)', background: col.bg, border: `1px solid ${col.border}` }}>
                          <div style={{ width: 22, height: 22, borderRadius: '50%', background: col.border, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#fff', flexShrink: 0, fontWeight: 700 }}>
                            {iconoEvento(ev.tipo)}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 11, fontWeight: 600, color: col.color }}>
                              {f.periodo} — {ev.descripcion}
                            </div>
                            <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', marginTop: 2 }}>{ev.fecha}</div>
                          </div>
                          {ev.impacto != null && ev.impacto > 0 && (
                            <span style={{ fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-mono)', color: col.color, flexShrink: 0 }}>+{ev.impacto.toFixed(2)}€</span>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>
              )}

              {diffs.length > 0 && (
                <div className="card">
                  <div className="card-title">Variaciones detectadas</div>
                  {diffs.map((d, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 10px', marginBottom: 4, borderRadius: 'var(--border-radius-md)', background: d.tipo === 'nuevo' || d.tipo === 'subida' ? 'var(--color-red-light)' : 'var(--color-green-light)', border: `1px solid ${d.tipo === 'nuevo' || d.tipo === 'subida' ? 'var(--color-red-border)' : 'var(--color-green-border)'}` }}>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: d.tipo === 'nuevo' || d.tipo === 'subida' ? 'var(--color-red-dark)' : 'var(--color-green-dark)' }}>
                          {d.tipo === 'nuevo' ? '+ Nuevo' : d.tipo === 'eliminado' ? '− Eliminado' : d.tipo === 'subida' ? '↑ Subida' : '↓ Bajada'}: {d.concepto.replace(/\s*\([^)]*\)/g, '').trim()}
                        </div>
                        {d.tipo !== 'nuevo' && d.tipo !== 'eliminado' && (
                          <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', marginTop: 1 }}>{d.anterior.toFixed(2)}€ → {d.actual.toFixed(2)}€</div>
                        )}
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)', color: d.delta > 0 ? 'var(--color-red)' : 'var(--color-green)', flexShrink: 0, marginLeft: 12 }}>
                        {d.delta > 0 ? '+' : ''}{d.delta.toFixed(2)}€
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="card card-blue">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <div style={{ width: 24, height: 24, background: 'var(--color-blue)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#fff', fontWeight: 700, flexShrink: 0 }}>AI</div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-blue-dark)' }}>Análisis comparativo IA</div>
                    <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)' }}>Generado automáticamente · {f1Obj.periodo} vs {f2Obj.periodo}</div>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.8, whiteSpace: 'pre-line' }}>{analisisIA}</div>
                <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                  <button onClick={() => navigate(`/cliente/${id}/reclamaciones`, { state: { abrirFormulario: true, facturaId: factura?.id } })} className="btn-secondary" style={{ fontSize: 11 }}>
                    Abrir reclamación →
                  </button>
                  <button onClick={() => { setFacturaComp1(null); setFacturaComp2(null); setAnalisisIA(null) }} className="btn-ghost" style={{ fontSize: 11 }}>
                    Nueva comparativa
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── MODO NORMAL ── */}
      {!modoComparativa && (
        <div className="grid2">
          {/* Lista facturas */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

            {/* ── SPARKLINE evolución importes ── */}
            {(() => {
              const facturasNormalesAll = facturasOrdenadas.filter(f => !(f as any).esRectificativa)
              const periodos = [...new Set(facturasNormalesAll.map(f => f.periodo))].slice(0, 12).reverse()
              const porPeriodo = periodos.map(periodo => {
                const facsPeriodo = facturasNormalesAll.filter(f => f.periodo === periodo)
                const totalA = facsPeriodo.filter(f => f.juridicaId === 'A' || !f.juridicaId).reduce((a, f) => a + f.importe, 0)
                const totalB = facsPeriodo.filter(f => f.juridicaId === 'B').reduce((a, f) => a + f.importe, 0)
                const total = totalA + totalB
                return { periodo, totalA, totalB, total }
              })
              const max = Math.max(...porPeriodo.map(p => p.total))
              const min = Math.min(...porPeriodo.map(p => p.total))
              const tieneJuridicaB = porPeriodo.some(p => p.totalB > 0)
              return (
                <div className="card" style={{ padding: '10px 12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Evolución últimos {porPeriodo.length} meses
                      {tieneJuridicaB && (
                        <span style={{ marginLeft: 10, fontWeight: 400 }}>
                          <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: 'var(--color-blue)', marginRight: 3 }} />Jurídica A
                          <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: 'var(--color-green-border)', marginLeft: 8, marginRight: 3 }} />Jurídica B
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 12, fontSize: 10, color: 'var(--color-text-tertiary)' }}>
                      <span>Mín: <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-green-dark)' }}>{min.toFixed(0)}€</strong></span>
                      <span>Máx: <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-red-dark)' }}>{max.toFixed(0)}€</strong></span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 52 }}>
                    {porPeriodo.map((p) => {
                      const alturaTotalPx = max === min ? 26 : Math.round(((p.total - min) / (max - min)) * 44 + 8)
                      const alturaAPx = p.total > 0 ? Math.round((p.totalA / p.total) * alturaTotalPx) : 0
                      const alturaBPx = alturaTotalPx - alturaAPx
                      const facsPeriodo = facturasNormalesAll.filter(f => f.periodo === p.periodo)
                      const tieneAnomalia = facsPeriodo.some(f => f.conceptos.some((c: any) => c.anomalo))
                      const isActiva = factura?.periodo === p.periodo
                      return (
                        <div key={p.periodo}
                          onClick={() => { const primera = facsPeriodo[0]; if (primera) seleccionarFactura(primera.id) }}
                          title={`${p.periodo}: ${p.total.toFixed(2)}€${p.totalB > 0 ? ` (A: ${p.totalA.toFixed(2)}€ + B: ${p.totalB.toFixed(2)}€)` : ''}`}
                          style={{ flex: 1, cursor: 'pointer', alignSelf: 'flex-end', display: 'flex', flexDirection: 'column' }}>
                          {p.totalB > 0 && (
                            <div style={{ width: '100%', height: alturaBPx, background: isActiva ? 'var(--color-green-dark)' : 'var(--color-green-border)', borderRadius: '3px 3px 0 0', opacity: isActiva ? 1 : 0.6 }} />
                          )}
                          <div style={{
                            width: '100%', height: alturaAPx,
                            background: isActiva ? 'var(--color-blue)' : tieneAnomalia ? 'var(--color-amber-mid)' : 'var(--color-blue-mid)',
                            borderRadius: p.totalB > 0 ? '0' : '3px 3px 0 0',
                            opacity: isActiva ? 1 : 0.55,
                            transition: 'all 0.15s',
                          }} />
                        </div>
                      )
                    })}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 9, color: 'var(--color-text-tertiary)' }}>
                    <span>{porPeriodo[0]?.periodo}</span>
                    <span>{porPeriodo[porPeriodo.length - 1]?.periodo}</span>
                  </div>
                </div>
              )
            })()}

            {/* ── Buscador inline ── */}
            <div style={{ position: 'relative' }}>
              <input
                className="input"
                placeholder="🔍 Buscar factura por mes, número o concepto..."
                value={busquedaInline}
                onChange={e => { setBusquedaInline(e.target.value); setPaginaFacturas(0) }}
                style={{ paddingLeft: 12 }}
              />
              {busquedaInline && (
                <button
                  onClick={() => setBusquedaInline('')}
                  style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--color-text-tertiary)' }}>
                  ✕
                </button>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Historial ({facturasOrdenadas.length} facturas)
                {facturasOrdenadas.some(f => f.juridicaId === 'B') && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                    <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 9999, background: 'var(--color-blue-light)', color: 'var(--color-blue-dark)', border: '1px solid var(--color-blue-mid)', fontWeight: 600 }}>
                      A — Telefónica de España SAU
                    </span>
                    <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 9999, background: 'var(--color-green-light)', color: 'var(--color-green-dark)', border: '1px solid var(--color-green-border)', fontWeight: 600 }}>
                      B — Movistar Móviles SL
                    </span>
                  </div>
                )}
              </div>
              <button
                onClick={() => { setModoEnvioMultiple(!modoEnvioMultiple); setSeleccionEnvio(new Set()) }}
                style={{ fontSize: 10, padding: '3px 8px', borderRadius: 'var(--border-radius-full)', border: `1.5px solid ${modoEnvioMultiple ? 'var(--color-blue)' : 'var(--color-border-secondary)'}`, background: modoEnvioMultiple ? 'var(--color-blue-light)' : 'none', color: modoEnvioMultiple ? 'var(--color-blue-dark)' : 'var(--color-text-secondary)', cursor: 'pointer', fontWeight: modoEnvioMultiple ? 600 : 400 }}>
                📧 {modoEnvioMultiple ? 'Cancelar' : 'Envío múltiple'}
              </button>
            </div>
            {modoEnvioMultiple && seleccionEnvio.size > 0 && (
              <div className="fade-in" style={{ padding: '8px 12px', borderRadius: 'var(--border-radius-md)', background: 'var(--color-blue-light)', border: '1px solid var(--color-blue-mid)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: 'var(--color-blue-dark)', fontWeight: 600 }}>
                  {seleccionEnvio.size} factura/s seleccionada/s
                </span>
                <button
                  onClick={() => {
                    setEnviando(true)
                    setTimeout(() => { setEnviando(false); setSeleccionEnvio(new Set()); setModoEnvioMultiple(false) }, 1800)
                  }}
                  disabled={enviando}
                  className="btn-primary" style={{ fontSize: 11, height: 28 }}>
                  {enviando ? <><span className="spinner spinner-sm" /> Enviando...</> : `📧 Enviar ${seleccionEnvio.size} factura/s`}
                </button>
              </div>
            )}
            {(() => {
              const filtradas = facturasOrdenadas.filter(f => {
                if (!busquedaInline) return true
                const q = busquedaInline.toLowerCase()
                return f.numero.toLowerCase().includes(q) ||
                  f.periodo.toLowerCase().includes(q) ||
                  f.conceptos.some((c: any) => c.descripcion.toLowerCase().includes(q))
              })
              const totalPaginas = Math.ceil(filtradas.length / FACTURAS_POR_PAGINA)
              const paginadas = filtradas.slice(paginaFacturas * FACTURAS_POR_PAGINA, (paginaFacturas + 1) * FACTURAS_POR_PAGINA)
              return <>
                {paginadas.map((f) => {
                  const arr = filtradas.filter(f => !(f as any).esRectificativa)
              const mismaJuridica = arr.filter(fj =>
                ((fj as any).juridicaId || 'A') === ((f as any).juridicaId || 'A')
              )
              const idxMismaJuridica = mismaJuridica.indexOf(f)
              const fAnterior = mismaJuridica[idxMismaJuridica + 1] || null
              const deltaVsAnterior = fAnterior ? f.importe - fAnterior.importe : null
              const isActive = factura?.id === f.id
              const tieneAnomalos = f.conceptos.some(c => c.anomalo)
              const tieneReclamacion = !!reclamacionesPorFactura[f.id]
              const eventos = eventosPorFactura[f.id] || []
              const esRectificativa = f.esRectificativa === true
              return (
                <div key={f.id} onClick={() => modoEnvioMultiple ? (() => { const s = new Set(seleccionEnvio); s.has(f.id) ? s.delete(f.id) : s.add(f.id); setSeleccionEnvio(s) })() : seleccionarFactura(f.id)}
                  style={{ background: isActive ? 'var(--color-blue-light)' : esRectificativa ? 'var(--color-green-light)' : f.estado === 'vencida' ? 'var(--color-red-light)' : 'var(--color-background-primary)', border: `1px solid ${isActive ? 'var(--color-blue-mid)' : esRectificativa ? 'var(--color-green-border)' : f.estado === 'vencida' ? 'var(--color-red-border)' : 'var(--color-border-tertiary)'}`, borderLeft: `4px solid ${isActive ? 'var(--color-blue)' : esRectificativa ? 'var(--color-green-border)' : tieneReclamacion ? 'var(--color-red-mid)' : f.estado === 'pagada' ? 'var(--color-green-border)' : 'var(--color-amber-mid)'}`, borderRadius: 'var(--border-radius-lg)', padding: '12px 14px', cursor: 'pointer', transition: 'all 0.1s' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {modoEnvioMultiple && (
                        <div style={{ width: 16, height: 16, borderRadius: 3, border: `2px solid ${seleccionEnvio.has(f.id) ? 'var(--color-blue)' : 'var(--color-border-secondary)'}`, background: seleccionEnvio.has(f.id) ? 'var(--color-blue)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {seleccionEnvio.has(f.id) && <span style={{ fontSize: 9, color: '#fff', fontWeight: 700 }}>✓</span>}
                        </div>
                      )}
                      <div style={{ fontSize: 12, fontWeight: 600 }}>{f.numero}</div>
                      {f.juridica && (
                        <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 9999, fontWeight: 600, background: f.juridicaId === 'B' ? 'var(--color-green-light)' : 'var(--color-blue-light)', color: f.juridicaId === 'B' ? 'var(--color-green-dark)' : 'var(--color-blue-dark)', border: `1px solid ${f.juridicaId === 'B' ? 'var(--color-green-border)' : 'var(--color-blue-mid)'}` }}>
                          {f.juridicaId === 'B' ? 'Movistar Móviles SL' : 'Telefónica de España SAU'}
                        </span>
                      )}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-mono)', color: f.estado === 'vencida' ? 'var(--color-red)' : 'var(--color-text-primary)' }}>
                        {f.importe.toFixed(2)}€
                      </div>
                      {deltaVsAnterior !== null && (
                        <div style={{ fontSize: 10, fontWeight: 600, fontFamily: 'var(--font-mono)', color: deltaVsAnterior > 0 ? 'var(--color-red-dark)' : deltaVsAnterior < 0 ? 'var(--color-green-dark)' : 'var(--color-text-tertiary)', marginTop: 1 }}>
                          {deltaVsAnterior > 0 ? '↑ +' : deltaVsAnterior < 0 ? '↓ ' : '= '}{deltaVsAnterior.toFixed(2)}€ vs ant.
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: tieneReclamacion ? 8 : 0 }}>
                    <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>
                      {f.periodo} · Vence {f.fechaVencimiento}
                    </div>
                    <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                      {esRectificativa && (
                        <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 'var(--border-radius-full)', background: 'var(--color-green-border)', color: '#fff', fontWeight: 700 }}>↩ RECTIFICATIVA</span>
                      )}
                      {tieneAnomalos && !esRectificativa && (
                        <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 'var(--border-radius-full)', background: 'var(--color-amber-mid)', color: 'var(--color-amber-dark)', fontWeight: 700 }}>⚠ ANOMALÍA</span>
                      )}
                      {eventos.length > 0 && (
                        <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 'var(--border-radius-full)', background: 'var(--color-blue-light)', color: 'var(--color-blue-dark)', border: '1px solid var(--color-blue-mid)', fontWeight: 600 }}>
                          {eventos.length} evento/s
                        </span>
                      )}
                      {!esRectificativa && <span className={`pill ${estadoPill(f.estado)}`} style={{ fontSize: 10 }}>{f.estado}</span>}
                    </div>
                  </div>

                  {/* RF-12 — Resumen in-line de reclamación vinculada */}
                  {tieneReclamacion && (() => {
                    const rec = reclamacionesPorFactura[f.id]
                    return (
                      <div style={{ padding: '7px 10px', borderRadius: 'var(--border-radius-md)', background: 'var(--color-red-light)', border: '1px solid var(--color-red-border)', marginTop: 4 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-red-dark)' }}>
                            ⚠ Reclamación vinculada — {rec.id}
                          </div>
                          <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 'var(--border-radius-full)', background: 'var(--color-amber-light)', color: 'var(--color-amber-dark)', border: '1px solid var(--color-amber-border)', fontWeight: 600 }}>
                            {rec.estado}
                          </span>
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--color-red-dark)', marginBottom: 3 }}>{rec.motivo}</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)' }}>
                            Abierta {rec.fechaApertura} · En disputa: {rec.importe.toFixed(2)}€
                          </div>
                          {rec.impactoEn && (
                            <div style={{ fontSize: 10, color: 'var(--color-green-dark)', fontWeight: 600 }}>
                              ✓ {rec.impactoEn}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })()}

                  {isActive && f.variaciones && f.variaciones.length > 0 && (
                    <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--color-blue-mid)' }}>
                      {f.variaciones.map(v => (
                        <div key={v.concepto} style={{ fontSize: 11, color: v.tipo === 'subida' || v.tipo === 'nuevo' ? 'var(--color-red-dark)' : 'var(--color-green-dark)', display: 'flex', justifyContent: 'space-between' }}>
                          <span>{v.tipo === 'nuevo' ? '+ ' : v.tipo === 'subida' ? '↑ ' : '↓ '}{v.concepto}</span>
                          <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{v.diferencia > 0 ? '+' : ''}{v.diferencia.toFixed(2)}€</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
              })}
                {totalPaginas > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 4px' }}>
                    <button
                      onClick={() => setPaginaFacturas(p => Math.max(0, p - 1))}
                      disabled={paginaFacturas === 0}
                      className="btn-ghost" style={{ fontSize: 11, opacity: paginaFacturas === 0 ? 0.4 : 1 }}>
                      ← Anterior
                    </button>
                    <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>
                      {paginaFacturas + 1} / {totalPaginas} · {filtradas.length} facturas
                    </span>
                    <button
                      onClick={() => setPaginaFacturas(p => Math.min(totalPaginas - 1, p + 1))}
                      disabled={paginaFacturas === totalPaginas - 1}
                      className="btn-ghost" style={{ fontSize: 11, opacity: paginaFacturas === totalPaginas - 1 ? 0.4 : 1 }}>
                      Siguiente →
                    </button>
                  </div>
                )}
              </>
            })()}
          </div>

          {/* Detalle factura */}
          {factura && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

              {/* ── COMPARATIVA AUTOMÁTICA CON FACTURA ANTERIOR ── */}
              {facturaAnteriorAuto && (
                <div className="card fade-in">
                  <div className="card-title">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      ⇄ Comparativa con mes anterior
                      {deltaAuto !== 0 && (
                        <span style={{ fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-mono)', color: deltaAuto > 0 ? 'var(--color-red)' : 'var(--color-green)' }}>
                          {deltaAuto > 0 ? '↑ +' : '↓ '}{deltaAuto.toFixed(2)}€
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: 10, color: 'var(--color-text-tertiary)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>
                      vs {facturaAnteriorAuto.periodo}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: 8, marginBottom: diffsAuto.length > 0 ? 10 : 0 }}>
                    <div style={{ flex: 1, padding: '8px 10px', background: 'var(--color-background-secondary)', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--color-border-tertiary)' }}>
                      <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', marginBottom: 2 }}>Actual · {factura.periodo}</div>
                      <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{factura.importe.toFixed(2)}€</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', color: 'var(--color-text-tertiary)', fontSize: 14 }}>→</div>
                    <div style={{ flex: 1, padding: '8px 10px', background: 'transparent', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--color-border-tertiary)' }}>
                      <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', marginBottom: 2 }}>Anterior · {facturaAnteriorAuto.periodo}</div>
                      <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-text-secondary)' }}>{facturaAnteriorAuto.importe.toFixed(2)}€</div>
                    </div>
                  </div>

                  {diffsAuto.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {diffsAuto.map((d, i) => {
                        const explicacion =
                          d.tipo === 'nuevo' && d.concepto.toLowerCase().includes('roaming')
                            ? 'Cargo de roaming detectado. Verificar con el cliente si reconoce el consumo en el extranjero.'
                          : d.tipo === 'nuevo' && d.concepto.toLowerCase().includes('dispositivo')
                            ? 'Nuevo cargo por dispositivo financiado. Corresponde a una cuota de pago a plazos.'
                          : d.tipo === 'nuevo'
                            ? 'Concepto que no existía en la factura anterior. Puede ser un nuevo servicio o consumo puntual.'
                          : d.tipo === 'eliminado'
                            ? 'Concepto que desaparece respecto al mes anterior. Puede indicar fin de servicio o cancelación de promoción.'
                          : d.tipo === 'subida' && d.concepto.toLowerCase().includes('promo')
                            ? 'Fin o reducción de promoción aplicada. El importe vuelve al precio base del servicio.'
                          : d.tipo === 'subida'
                            ? 'El importe de este concepto ha subido respecto al mes anterior. Puede deberse a revisión de precio o cambio de tarifa.'
                          : d.tipo === 'bajada'
                            ? 'El importe de este concepto ha bajado. Puede deberse a una promoción aplicada o ajuste de tarifa.'
                          : ''

                        return (
                          <div key={i} style={{ borderRadius: 'var(--border-radius-md)', border: `1px solid ${d.tipo === 'nuevo' || d.tipo === 'subida' ? 'var(--color-red-border)' : 'var(--color-green-border)'}`, overflow: 'hidden' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 10px', background: d.tipo === 'nuevo' || d.tipo === 'subida' ? 'var(--color-red-light)' : 'var(--color-green-light)' }}>
                              <div>
                                <div style={{ fontSize: 11, fontWeight: 600, color: d.tipo === 'nuevo' || d.tipo === 'subida' ? 'var(--color-red-dark)' : 'var(--color-green-dark)' }}>
                                  {d.tipo === 'nuevo' ? '+ Nuevo: ' : d.tipo === 'eliminado' ? '− Eliminado: ' : d.tipo === 'subida' ? '↑ ' : '↓ '}
                                  {d.concepto.replace(/\s*\([^)]*\)/g, '').trim()}
                                </div>
                                {d.tipo !== 'nuevo' && d.tipo !== 'eliminado' && (
                                  <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', marginTop: 1 }}>
                                    {d.anterior.toFixed(2)}€ → {d.actual.toFixed(2)}€
                                  </div>
                                )}
                              </div>
                              <span style={{ fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-mono)', color: d.delta > 0 ? 'var(--color-red)' : 'var(--color-green)', flexShrink: 0, marginLeft: 8 }}>
                                {d.delta > 0 ? '+' : ''}{d.delta.toFixed(2)}€
                              </span>
                            </div>
                            {explicacion && (
                              <div style={{ padding: '6px 10px', background: 'rgba(255,255,255,0.6)', fontSize: 10, color: d.tipo === 'nuevo' || d.tipo === 'subida' ? 'var(--color-red-dark)' : 'var(--color-green-dark)', lineHeight: 1.5, borderTop: `1px solid ${d.tipo === 'nuevo' || d.tipo === 'subida' ? 'var(--color-red-border)' : 'var(--color-green-border)'}` }}>
                                💡 {explicacion}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', textAlign: 'center', padding: '6px 0' }}>
                      ✓ Sin variaciones respecto al mes anterior
                    </div>
                  )}
                </div>
              )}

              {/* RF-01 — Eventos de la factura activa */}
              {eventosFactura.length > 0 && (
                <div className="card fade-in" style={{ border: '1px solid var(--color-border-tertiary)' }}>
                  <div className="card-title">📋 Eventos en este periodo</div>
                  {eventosFactura.map((ev, i) => {
                    const col = colorEvento(ev.tipo)
                    return (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px', marginBottom: i < eventosFactura.length - 1 ? 6 : 0, borderRadius: 'var(--border-radius-md)', background: col.bg, border: `1px solid ${col.border}` }}>
                        <div style={{ width: 20, height: 20, borderRadius: '50%', background: col.border, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#fff', flexShrink: 0, fontWeight: 700 }}>
                          {iconoEvento(ev.tipo)}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: col.color }}>{ev.descripcion}</div>
                          <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)' }}>{ev.fecha}</div>
                        </div>
                        {ev.impacto != null && ev.impacto > 0 && (
                          <span style={{ fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-mono)', color: col.color, flexShrink: 0 }}>
                            +{ev.impacto.toFixed(2)}€
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              <div className={`card ${factura.esRectificativa ? 'card-ok' : ''}`}>
                <div className="card-title">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {factura.esRectificativa ? '↩ ' : ''}Detalle — {factura.numero}
                    {factura.esRectificativa
                      ? <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 'var(--border-radius-full)', background: 'var(--color-green-border)', color: '#fff', fontWeight: 700 }}>RECTIFICATIVA</span>
                      : <span className={`pill ${estadoPill(factura.estado)}`} style={{ fontSize: 10 }}>{factura.estado}</span>
                    }
                  </div>
                  <button
                    onClick={() => { setModoVistaFactura(!modoVistaFactura); setConceptoDrilldown(null) }}
                    style={{ fontSize: 10, padding: '2px 8px', borderRadius: 'var(--border-radius-full)', border: `1.5px solid ${modoVistaFactura ? 'var(--color-blue)' : 'var(--color-border-secondary)'}`, background: modoVistaFactura ? 'var(--color-blue-light)' : 'none', color: modoVistaFactura ? 'var(--color-blue-dark)' : 'var(--color-text-secondary)', cursor: 'pointer', fontWeight: modoVistaFactura ? 600 : 400 }}>
                    {modoVistaFactura ? '✓ Vista diagnóstico' : '🔍 Vista diagnóstico'}
                  </button>
                </div>

                {/* RF-03 — Cómo va lo mío — resumen reclamación inline */}
                {reclamacionFactura && (
                  <div className="fade-in" style={{ marginBottom: 12, padding: '10px 12px', borderRadius: 'var(--border-radius-md)', background: 'var(--color-amber-light)', border: '1px solid var(--color-amber-border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-amber-dark)' }}>
                        ⚠ Reclamación vinculada — {reclamacionFactura.id}
                      </div>
                      <span className={`pill ${reclamacionFactura.estado === 'resuelta' ? 'pill-ok' : reclamacionFactura.estado === 'en_gestion' ? 'pill-blue' : 'pill-warn'}`} style={{ fontSize: 9 }}>
                        {reclamacionFactura.estado.replace('_', ' ')}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--color-amber-dark)', marginBottom: 6 }}>{reclamacionFactura.motivo}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 8 }}>
                      <div style={{ padding: '6px 8px', background: 'rgba(255,255,255,0.6)', borderRadius: 'var(--border-radius-sm)' }}>
                        <div style={{ fontSize: 9, color: 'var(--color-text-tertiary)', marginBottom: 2 }}>EN DISPUTA</div>
                        <div style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-amber-dark)' }}>{reclamacionFactura.importe.toFixed(2)}€</div>
                      </div>
                      <div style={{ padding: '6px 8px', background: 'rgba(255,255,255,0.6)', borderRadius: 'var(--border-radius-sm)' }}>
                        <div style={{ fontSize: 9, color: 'var(--color-text-tertiary)', marginBottom: 2 }}>IMPACTO ESTIMADO</div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-green-dark)' }}>Abono en próxima factura</div>
                      </div>
                    </div>
                    <button
                      onClick={() => navigate(`/cliente/${id}/reclamaciones`)}
                      style={{ fontSize: 11, color: 'var(--color-amber-dark)', background: 'none', border: '1px solid var(--color-amber-border)', borderRadius: 'var(--border-radius-md)', padding: '3px 10px', cursor: 'pointer', fontWeight: 600 }}>
                      Ver seguimiento completo →
                    </button>
                  </div>
                )}

                {factura.esRectificativa && (
                  <div className="fade-in" style={{ marginBottom: 12, padding: '10px 12px', borderRadius: 'var(--border-radius-md)', background: 'var(--color-green-light)', border: '1px solid var(--color-green-border)' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-green-dark)', marginBottom: 4 }}>
                      ↩ Factura rectificativa — abono al cliente
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--color-green-dark)', marginBottom: 8 }}>
                      {factura.motivoRectificacion}
                    </div>
                    {factura.facturaRectificadaId && (
                      <button
                        onClick={() => seleccionarFactura(factura.facturaRectificadaId!)}
                        style={{ fontSize: 11, color: 'var(--color-green-dark)', background: 'none', border: '1px solid var(--color-green-border)', borderRadius: 'var(--border-radius-md)', padding: '3px 10px', cursor: 'pointer', fontWeight: 600 }}>
                        Ver factura original →
                      </button>
                    )}
                  </div>
                )}

                {/* ── MODO DIAGNÓSTICO (RF-16) ── */}
                {modoVistaFactura ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
                    <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginBottom: 4 }}>
                      Diagnóstico automático por concepto · Pulsa cualquiera para ver la explicación y reclamar
                    </div>
                    {factura.conceptos.map(c => {
                      const diag = diagnosticarConcepto(c, factura, facturaAnterior)
                      const isDrill = conceptoDrilldown === c.id
                      return (
                        <div key={c.id}>
                          <div
                            onClick={() => setConceptoDrilldown(isDrill ? null : c.id)}
                            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', borderRadius: isDrill ? 'var(--border-radius-md) var(--border-radius-md) 0 0' : 'var(--border-radius-md)', border: `1px solid ${isDrill ? 'var(--color-blue-mid)' : diag.border}`, background: isDrill ? 'var(--color-blue-light)' : diag.bg, cursor: 'pointer', transition: 'all 0.1s' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 12, fontWeight: 600, color: isDrill ? 'var(--color-blue-dark)' : diag.color }}>
                                  {c.descripcion}
                                </div>
                                <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', marginTop: 1, textTransform: 'capitalize' }}>{c.tipo}</div>
                              </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                              <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 'var(--border-radius-full)', background: isDrill ? 'var(--color-blue)' : diag.border, color: '#fff', fontWeight: 700, whiteSpace: 'nowrap' }}>
                                {diag.label}
                              </span>
                              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: c.importe < 0 ? 'var(--color-green)' : isDrill ? 'var(--color-blue-dark)' : diag.color }}>
                                {c.importe > 0 ? '+' : ''}{c.importe.toFixed(2)}€
                              </span>
                              <span style={{ fontSize: 10, color: isDrill ? 'var(--color-blue-dark)' : 'var(--color-text-tertiary)' }}>{isDrill ? '▲' : '▼'}</span>
                            </div>
                          </div>

                          {isDrill && (
                            <div className="fade-in" style={{ padding: '10px 12px', borderRadius: '0 0 var(--border-radius-md) var(--border-radius-md)', border: '1px solid var(--color-blue-mid)', borderTop: 'none', background: 'var(--color-background-primary)' }}>
                              <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', lineHeight: 1.7, marginBottom: 10 }}>
                                {diag.explicacion}
                              </div>
                              {facturaAnterior && (() => {
                                const match = facturaAnterior.conceptos.find((cp: any) =>
                                  cp.descripcion.replace(/\s*\([^)]*\)/g, '').trim().toLowerCase() ===
                                  c.descripcion.replace(/\s*\([^)]*\)/g, '').trim().toLowerCase()
                                )
                                return match ? (
                                  <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginBottom: 8 }}>
                                    Factura anterior ({facturaAnterior.periodo}): <strong style={{ fontFamily: 'var(--font-mono)' }}>{match.importe.toFixed(2)}€</strong>
                                    {' '}→ Esta factura: <strong style={{ fontFamily: 'var(--font-mono)', color: diag.color }}>{c.importe.toFixed(2)}€</strong>
                                  </div>
                                ) : (
                                  <div style={{ fontSize: 11, color: 'var(--color-blue-dark)', marginBottom: 8 }}>
                                    Concepto nuevo — no aparecía en {facturaAnterior.periodo}
                                  </div>
                                )
                              })()}
                              <div style={{ display: 'flex', gap: 6 }}>
                                {(diag.badge === 'anomalia' || diag.badge === 'no_identificada' || diag.badge === 'nuevo' || diag.badge === 'subida') && (() => {
                                // RF-16 CA-04: bloqueo si hay masiva activa
                                const masivaActiva = datos.averias.some(a => a.masiva && a.estado !== 'resuelta')
                                // RF-02 CA-03: aviso si ya existe reclamación abierta sobre esta factura
                                const reclamacionDuplicada = datos.reclamaciones.some(r =>
                                  r.facturaId === factura?.id && (r.estado === 'abierta' || r.estado === 'en_gestion')
                                )
                                if (masivaActiva) return (
                                  <div style={{ padding: '7px 10px', borderRadius: 'var(--border-radius-md)', background: 'var(--color-amber-light)', border: '1px solid var(--color-amber-border)', fontSize: 11, color: 'var(--color-amber-dark)', fontWeight: 600 }}>
                                    📡 Incidencia masiva activa — reclamación económica bloqueada. Informar al cliente del ETA de resolución.
                                  </div>
                                )
                                if (reclamacionDuplicada) return (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    <div style={{ padding: '7px 10px', borderRadius: 'var(--border-radius-md)', background: 'var(--color-blue-light)', border: '1px solid var(--color-blue-mid)', fontSize: 11, color: 'var(--color-blue-dark)' }}>
                                      ℹ Ya existe una reclamación activa sobre esta factura — no se puede abrir otra hasta su resolución.
                                    </div>
                                    <button
                                      onClick={() => navigate(`/cliente/${id}/reclamaciones`)}
                                      className="btn-secondary" style={{ fontSize: 11, height: 28 }}>
                                      Ver reclamación activa →
                                    </button>
                                  </div>
                                )
                                return (
                                  <button
                                    onClick={() => navigate(`/cliente/${id}/reclamaciones`, { state: { abrirFormulario: true, facturaId: factura?.id, importe: c.importe, motivo: `Reclamación: ${c.descripcion}` } })}
                                    className="btn-danger" style={{ fontSize: 11, height: 28 }}>
                                    ⚠ Reclamar este concepto
                                  </button>
                                )
                              })()}
                                <button
                                  onClick={() => navigate(`/cliente/${id}/consumos`)}
                                  className="btn-secondary" style={{ fontSize: 11, height: 28 }}>
                                  Ver consumos →
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}

                    {(() => {
                      const anomalias = factura.conceptos.filter(c => diagnosticarConcepto(c, factura, facturaAnterior).badge === 'anomalia' || diagnosticarConcepto(c, factura, facturaAnterior).badge === 'no_identificada').length
                      const nuevos = factura.conceptos.filter(c => diagnosticarConcepto(c, factura, facturaAnterior).badge === 'nuevo').length
                      const subidas = factura.conceptos.filter(c => diagnosticarConcepto(c, factura, facturaAnterior).badge === 'subida').length
                      return (anomalias + nuevos + subidas) > 0 ? (
                        <div style={{ marginTop: 4, padding: '8px 10px', borderRadius: 'var(--border-radius-md)', background: 'var(--color-amber-light)', border: '1px solid var(--color-amber-border)', display: 'flex', gap: 16, fontSize: 11 }}>
                          {anomalias > 0 && <span style={{ color: 'var(--color-amber-dark)', fontWeight: 600 }}>⚠ {anomalias} anomalía/s</span>}
                          {nuevos > 0 && <span style={{ color: 'var(--color-blue-dark)', fontWeight: 600 }}>+ {nuevos} nuevo/s</span>}
                          {subidas > 0 && <span style={{ color: 'var(--color-red-dark)', fontWeight: 600 }}>↑ {subidas} subida/s</span>}
                        </div>
                      ) : (
                        <div style={{ padding: '8px 10px', borderRadius: 'var(--border-radius-md)', background: 'var(--color-green-light)', border: '1px solid var(--color-green-border)', fontSize: 11, color: 'var(--color-green-dark)', fontWeight: 600 }}>
                          ✓ Todos los conceptos son normales — sin variaciones relevantes
                        </div>
                      )
                    })()}
                  </div>
                ) : (
                  /* ── MODO NORMAL ── */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 }}>
                    {factura.conceptos.some(c => c.anomalo) && (
                      <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginBottom: 4 }}>
                        Pulsa un concepto ⚠ para seleccionarlo y reclamar
                      </div>
                    )}
                    {factura.conceptos.map(c => (
                      <div key={c.id} style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '8px 12px', borderRadius: 'var(--border-radius-md)',
                        background: c.anomalo ? 'var(--color-amber-light)' : 'transparent',
                        border: c.anomalo ? '1px solid var(--color-amber-border)' : 'none',
                        marginBottom: 4,
                      }}>
                        {c.anomalo && (
                          <div
                            onClick={() => {
                              const yaEsta = conceptosReclamacion.some(x => x.conceptoId === c.id)
                              if (yaEsta) {
                                setConceptosReclamacion(prev => prev.filter(x => x.conceptoId !== c.id))
                              } else {
                                setConceptosReclamacion(prev => [...prev, {
                                  conceptoId: c.id,
                                  facturaId: factura!.id,
                                  facturaPeriodo: factura?.periodo || '',
                                  descripcion: c.descripcion,
                                  importe: c.importe,
                                }])
                              }
                            }}
                            style={{
                              width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                              border: `2px solid ${conceptosReclamacion.some(x => x.conceptoId === c.id) ? 'var(--color-amber-dark)' : 'var(--color-amber-border)'}`,
                              background: conceptosReclamacion.some(x => x.conceptoId === c.id) ? 'var(--color-amber-dark)' : 'white',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              cursor: 'pointer',
                            }}>
                            {conceptosReclamacion.some(x => x.conceptoId === c.id) && (
                              <span style={{ fontSize: 11, color: 'white', fontWeight: 700 }}>✓</span>
                            )}
                          </div>
                        )}
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 12, fontWeight: c.anomalo ? 600 : 400, color: c.anomalo ? 'var(--color-amber-dark)' : 'var(--color-text-primary)' }}>
                            {c.anomalo && '⚠ '}{c.descripcion}
                          </div>
                          <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', marginTop: 1, textTransform: 'capitalize' }}>{c.tipo}</div>
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-mono)', color: c.importe < 0 ? 'var(--color-green)' : c.anomalo ? 'var(--color-amber-dark)' : 'var(--color-text-primary)', flexShrink: 0 }}>
                          {c.importe > 0 ? '+' : ''}{c.importe.toFixed(2)}€
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 14, padding: '8px 0', borderTop: '2px solid var(--color-border-secondary)' }}>
                  <span>Total</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>{factura.importe.toFixed(2)}€</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 12 }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => ejecutar('PDF generado')} disabled={cargando} className="btn-secondary" style={{ flex: 1, justifyContent: 'center', fontSize: 11 }}>
                      📄 PDF
                    </button>
                    <button
                      onClick={() => {
                        setEnvioDestinatario(datos.email || '')
                        setModalEnvio(true)
                        setEnvioDuplicado(false)
                      }}
                      disabled={cargando}
                      className="btn-secondary"
                      style={{ flex: 1, justifyContent: 'center', fontSize: 11 }}>
                      📧 Enviar duplicado
                    </button>
                  </div>

                  {envioDuplicado && (
                    <div className="fade-in" style={{ padding: '8px 10px', borderRadius: 'var(--border-radius-md)', background: 'var(--color-green-light)', border: '1px solid var(--color-green-border)', fontSize: 11, color: 'var(--color-green-dark)', fontWeight: 600 }}>
                      ✓ Duplicado enviado y registrado en trazabilidad
                    </div>
                  )}

                  {trazabilidadEnvios.filter(t => t.factura === factura?.numero).length > 0 && (
                    <div style={{ padding: '8px 10px', borderRadius: 'var(--border-radius-md)', background: 'var(--color-background-secondary)', border: '1px solid var(--color-border-tertiary)' }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                        Trazabilidad de envíos
                      </div>
                      {trazabilidadEnvios.filter(t => t.factura === factura?.numero).map((t, i) => (
                        <div key={i} style={{ fontSize: 10, color: 'var(--color-text-secondary)', display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                          <span>📤 {t.canal.toUpperCase()} → {t.destinatario}</span>
                          <span style={{ color: 'var(--color-text-tertiary)' }}>{t.fecha}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {factura.estado === 'vencida' && (
                    <button onClick={() => navigate(`/cliente/${id}/cobros`)} className="btn-danger" style={{ width: '100%', justifyContent: 'center', fontSize: 12 }}>
                      💳 Gestionar cobro
                    </button>
                  )}
                  {/* Panel acumulador reclamación multi-concepto */}
                  {conceptosReclamacion.length > 0 && (() => {
                    const importeTotal = conceptosReclamacion.reduce((a, c) => a + c.importe, 0)
                    const facturasAfectadas = [...new Map(
                      conceptosReclamacion.map(c => [c.facturaId, c.facturaPeriodo])
                    ).entries()]

                    return (
                      <div className="fade-in" style={{
                        border: '1.5px solid var(--color-amber-border)',
                        borderRadius: 'var(--border-radius-lg)',
                        background: 'var(--color-amber-light)',
                        padding: '12px 14px',
                      }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-amber-dark)', marginBottom: 10 }}>
                          ⚠ Reclamación en construcción — {conceptosReclamacion.length} concepto{conceptosReclamacion.length > 1 ? 's' : ''} seleccionado{conceptosReclamacion.length > 1 ? 's' : ''}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 10 }}>
                          {conceptosReclamacion.map(c => (
                            <div key={c.conceptoId} style={{
                              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                              padding: '5px 8px', borderRadius: 'var(--border-radius-md)',
                              background: 'rgba(255,255,255,0.65)',
                              border: '1px solid var(--color-amber-border)',
                              fontSize: 11,
                            }}>
                              <div>
                                <div style={{ fontWeight: 500, color: 'var(--color-amber-dark)' }}>{c.descripcion}</div>
                                <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)' }}>{c.facturaPeriodo}</div>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-amber-dark)' }}>
                                  {c.importe.toFixed(2)}€
                                </span>
                                <button
                                  onClick={() => setConceptosReclamacion(prev => prev.filter(x => x.conceptoId !== c.conceptoId))}
                                  style={{ fontSize: 10, color: 'var(--color-text-tertiary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, lineHeight: 1 }}>
                                  ✕
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div style={{ padding: '6px 10px', borderRadius: 'var(--border-radius-md)', background: 'rgba(255,255,255,0.5)', border: '1px solid var(--color-amber-border)', marginBottom: 10 }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-amber-dark)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            {facturasAfectadas.length} factura{facturasAfectadas.length > 1 ? 's' : ''} vinculada{facturasAfectadas.length > 1 ? 's' : ''}
                          </div>
                          {facturasAfectadas.map(([fId, fPeriodo]) => (
                            <div key={fId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--color-amber-dark)', padding: '2px 0', borderBottom: '1px solid rgba(255,255,255,0.4)' }}>
                              <span>{fPeriodo} · {fId}</span>
                              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                                {conceptosReclamacion.filter(c => c.facturaId === fId).reduce((a, c) => a + c.importe, 0).toFixed(2)}€
                              </span>
                            </div>
                          ))}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                          <span style={{ fontSize: 12, color: 'var(--color-amber-dark)' }}>Total a reclamar</span>
                          <span style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-amber-dark)' }}>
                            {importeTotal.toFixed(2)}€
                          </span>
                        </div>

                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            onClick={() => navigate(`/cliente/${id}/reclamaciones`, {
                              state: {
                                abrirFormulario: true,
                                desdeFactura: true,
                                multiConsumo: true,
                                importeTotal,
                                facturasIds: facturasAfectadas.map(([fId]) => fId),
                                motivo: `Reclamación conceptos: ${conceptosReclamacion.map(c => c.descripcion).join(', ')}`,
                                tipoPredef: 'economica',
                              }
                            })}
                            className="btn-primary"
                            style={{ flex: 2, justifyContent: 'center', fontSize: 12, background: 'var(--color-amber-dark)', borderColor: 'var(--color-amber-dark)' }}>
                            Abrir reclamación — {importeTotal.toFixed(2)}€ · {facturasAfectadas.length} factura{facturasAfectadas.length > 1 ? 's' : ''}
                          </button>
                          <button
                            onClick={() => setConceptosReclamacion([])}
                            className="btn-secondary"
                            style={{ flex: 1, justifyContent: 'center', fontSize: 12 }}>
                            Limpiar
                          </button>
                        </div>
                      </div>
                    )
                  })()}
                  <button onClick={() => { setPanelAbierto('comparativa'); setModoComparativa(true) }} className="btn-ghost" style={{ width: '100%', justifyContent: 'center', fontSize: 11 }}>
                    ⇄ Comparar con otra factura →
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── MODAL ENVÍO DUPLICADO RF-04 ── */}
      {modalEnvio && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card fade-in" style={{ width: 420, boxShadow: 'var(--shadow-lg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>Envío de duplicado</div>
                <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginTop: 2 }}>
                  {factura?.numero} · {factura?.periodo}
                </div>
              </div>
              <button onClick={() => setModalEnvio(false)} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: 'var(--color-text-tertiary)' }}>✕</button>
            </div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Canal de envío</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {(['email', 'sms', 'portal'] as const).map(c => (
                  <button
                    key={c}
                    onClick={() => setEnvioCanal(c)}
                    style={{ flex: 1, padding: '8px 6px', border: `1.5px solid ${envioCanal === c ? 'var(--color-blue)' : 'var(--color-border-secondary)'}`, borderRadius: 'var(--border-radius-md)', background: envioCanal === c ? 'var(--color-blue-light)' : 'transparent', color: envioCanal === c ? 'var(--color-blue-dark)' : 'var(--color-text-secondary)', fontSize: 11, fontWeight: envioCanal === c ? 600 : 400, cursor: 'pointer', textTransform: 'uppercase' }}>
                    {c === 'email' ? '📧 Email' : c === 'sms' ? '💬 SMS' : '🌐 Portal'}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {envioCanal === 'email' ? 'Dirección email' : envioCanal === 'sms' ? 'Número de teléfono' : 'Usuario portal'}
              </div>
              <input
                className="input"
                placeholder={envioCanal === 'email' ? 'email@ejemplo.com' : envioCanal === 'sms' ? '+34 6XX XXX XXX' : 'Usuario del portal'}
                value={envioDestinatario}
                onChange={e => setEnvioDestinatario(e.target.value)}
                autoFocus
              />
              <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', marginTop: 4 }}>
                El envío quedará registrado con fecha, hora, canal y destinatario para auditoría
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={confirmarEnvioDuplicado}
                disabled={cargando || !envioDestinatario.trim()}
                className="btn-primary"
                style={{ flex: 1, justifyContent: 'center', fontSize: 12 }}>
                {cargando ? <><span className="spinner spinner-sm" /> Enviando...</> : '📤 Confirmar envío'}
              </button>
              <button onClick={() => setModalEnvio(false)} className="btn-secondary" style={{ fontSize: 12 }}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

    </>
  )
}