import { useState } from 'react'
import { useAppStore } from '../../store/useAppStore'
import {
  catalogoBundles, catalogoAddonsTV, buscarBundles,
  catalogoTerceros, crearSenalizacion,
  getPropuestaMigracion,
  compatibilidadTV, addonsTVCore,
} from '../../data/mockData'
import type { Bundle, ResultadoBusquedaBundle } from '../../types'
import { NuevaVentaPage } from '../venta/NuevaVentaPage'

type ModoVenta = 'selector' | 'cambio_tarifa' | 'alta_servicio' | 'linea_adicional' | 'modo_ahorro'

// ── Colores corporativos ──
const BLUE = '#0033A0'
const BLUE_LIGHT = '#EEF2FF'
const BLUE_BORDER = '#C7D2FE'
const ORANGE = '#EA580C'
const ORANGE_LIGHT = '#FFF7ED'
const ORANGE_BORDER = '#FED7AA'
const GREY_LIGHT = '#F3F4F6'
const GREY_BORDER = '#D1D5DB'

// ── Modal de migración Fusión → mi Movistar (RF01-1) ──
function ModalMigracion({
  bundleActualNombre,
  propuesta,
  bundleEquivalente,
  onAceptar,
  onRechazar,
}: {
  bundleActualNombre: string
  propuesta: ReturnType<typeof getPropuestaMigracion>
  bundleEquivalente: Bundle | null
  onAceptar: () => void
  onRechazar: () => void
}) {
  if (!propuesta || !bundleEquivalente) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ background: 'white', borderRadius: 16, width: '100%', maxWidth: 480, padding: 32, boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
          <div style={{ fontSize: 28, marginBottom: 12, textAlign: 'center' }}>⚠️</div>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#111827', textAlign: 'center', marginBottom: 8 }}>Porfolio descatalogado</div>
          <div style={{ fontSize: 13, color: '#6B7280', textAlign: 'center', marginBottom: 24, lineHeight: 1.6 }}>
            Este cliente tiene un porfolio <strong>Fusión</strong> descatalogado. Para modificar la tarifa, es necesario migrar a <strong>mi Movistar</strong>.
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onRechazar} style={{ flex: 1, padding: '12px', border: `1.5px solid ${GREY_BORDER}`, borderRadius: 8, background: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#374151' }}>
              Ver opciones Fusión
            </button>
            <button onClick={onAceptar} style={{ flex: 1, padding: '12px', background: BLUE, color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              Migrar a mi Movistar
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: 'white', borderRadius: 16, width: '100%', maxWidth: 560, boxShadow: '0 20px 60px rgba(0,0,0,0.25)', overflow: 'hidden' }}>

        <div style={{ background: 'linear-gradient(135deg, #0033A0 0%, #1e40af 100%)', padding: '24px 28px 20px', color: 'white' }}>
          <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', opacity: 0.8, marginBottom: 6 }}>Proyecto Genduka · Migración recomendada</div>
          <div style={{ fontSize: 19, fontWeight: 700, lineHeight: 1.3 }}>Este cliente tiene un porfolio <span style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 4, padding: '1px 6px' }}>Fusión</span> descatalogado</div>
          <div style={{ fontSize: 13, opacity: 0.85, marginTop: 6 }}>Migrando a mi Movistar mejora su servicio y simplifica la gestión</div>
        </div>

        <div style={{ padding: '24px 28px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 12, alignItems: 'center', marginBottom: 24 }}>
            <div style={{ background: GREY_LIGHT, border: `1.5px solid ${GREY_BORDER}`, borderRadius: 10, padding: '14px 16px' }}>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#6B7280', marginBottom: 6 }}>📦 Tarifa actual</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 4 }}>{bundleActualNombre}</div>
              <div style={{ fontSize: 11, color: '#9CA3AF' }}>Porfolio descatalogado</div>
              <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4, fontWeight: 600 }}>
                {catalogoBundles.find(b => b.nombre === bundleActualNombre)?.precio?.toFixed(2) || '—'}€/mes
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{ fontSize: 20 }}>→</div>
              <div style={{ fontSize: 9, color: ORANGE, fontWeight: 700, textTransform: 'uppercase' }}>Propuesta</div>
            </div>

            <div style={{ background: ORANGE_LIGHT, border: `2px solid ${ORANGE_BORDER}`, borderRadius: 10, padding: '14px 16px', position: 'relative' }}>
              <div style={{ position: 'absolute', top: -8, right: 10, background: ORANGE, color: 'white', fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 9999, letterSpacing: '0.05em' }}>⭐ RECOMENDADA</div>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: ORANGE, marginBottom: 6 }}>✨ mi Movistar</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#92400E', marginBottom: 4 }}>{bundleEquivalente.nombre}</div>
              <div style={{ fontSize: 11, color: '#B45309' }}>{bundleEquivalente.descripcion}</div>
              <div style={{ fontSize: 12, color: ORANGE, marginTop: 4, fontWeight: 700 }}>
                {bundleEquivalente.precio.toFixed(2)}€/mes
                {propuesta.deltaEuros !== 0 && (
                  <span style={{ fontSize: 10, marginLeft: 6, opacity: 0.8 }}>
                    ({propuesta.deltaEuros > 0 ? '+' : ''}{propuesta.deltaEuros.toFixed(2)}€)
                  </span>
                )}
              </div>
            </div>
          </div>

          <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 8, padding: '12px 14px', marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#166534', marginBottom: 8 }}>✓ Beneficios de la migración</div>
            {propuesta.beneficios.map((b, i) => (
              <div key={i} style={{ fontSize: 12, color: '#15803D', display: 'flex', alignItems: 'flex-start', gap: 6, marginBottom: 4 }}>
                <span style={{ flexShrink: 0, marginTop: 1 }}>✓</span> {b}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onRechazar} style={{ flex: 1, padding: '13px', border: `1.5px solid ${GREY_BORDER}`, borderRadius: 8, background: GREY_LIGHT, fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#374151' }}>
              Mantener Fusión
            </button>
            <button onClick={onAceptar} style={{ flex: 2, padding: '13px', background: `linear-gradient(135deg, ${ORANGE} 0%, #c2410c 100%)`, color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(234,88,12,0.35)' }}>
              ✨ Migrar a mi Movistar
            </button>
          </div>
          <div style={{ fontSize: 11, color: '#9CA3AF', textAlign: 'center', marginTop: 10 }}>
            Si el cliente rechaza la migración, se mostrarán solo las opciones compatibles con Fusión
          </div>
        </div>
      </div>
    </div>
  )
}

function ModoAhorroWizard({
  oportunidades,
  onVolver,
  onIrCambioTarifa,
}: {
  oportunidades: { id: string; icono: string; titulo: string; desc: string; accion: string; color: string; bg: string; border: string }[]
  onVolver: () => void
  onIrCambioTarifa: () => void
}) {
  const [accionesHechas, setAccionesHechas] = useState<Set<string>>(new Set())
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>💡 Modo ahorro — Guía de retención</div>
          <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 2 }}>
            Sigue el orden recomendado antes de ejecutar un ajuste de tarifa
          </div>
        </div>
        <button onClick={onVolver} className="btn-secondary" style={{ fontSize: 11 }}>← Volver</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {oportunidades.map((op, idx) => {
          const hecha = accionesHechas.has(op.id)
          return (
            <div key={op.id} style={{ padding: '14px 16px', border: `1.5px solid ${hecha ? 'var(--color-green-border)' : op.border}`, borderRadius: 'var(--border-radius-lg)', background: hecha ? 'var(--color-green-light)' : op.bg, transition: 'all 0.15s' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: hecha ? 'var(--color-green-border)' : 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: hecha ? 'white' : 'var(--color-text-secondary)', flexShrink: 0 }}>
                    {hecha ? '✓' : idx + 1}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: hecha ? 'var(--color-green-dark)' : op.color, marginBottom: 4 }}>
                      {op.icono} {op.titulo}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>{op.desc}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0, marginLeft: 12 }}>
                  {op.id === 'ajuste' ? (
                    <button onClick={onIrCambioTarifa} className="btn-secondary" style={{ fontSize: 11 }}>
                      {op.accion} →
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        const s = new Set(accionesHechas)
                        hecha ? s.delete(op.id) : s.add(op.id)
                        setAccionesHechas(s)
                      }}
                      style={{ fontSize: 11, padding: '4px 10px', borderRadius: 'var(--border-radius-md)', border: `1px solid ${hecha ? 'var(--color-green-border)' : op.border}`, background: hecha ? 'var(--color-green-border)' : 'white', color: hecha ? 'white' : op.color, cursor: 'pointer', fontWeight: 600 }}>
                      {hecha ? '✓ Hecho' : 'Marcar hecho'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {accionesHechas.size > 0 && (
        <div className="alert alert-blue fade-in">
          <span>📋</span>
          <div style={{ fontSize: 11 }}>
            <strong>{accionesHechas.size} acción/es registrada/s</strong> — trazabilidad guardada para el siguiente agente
          </div>
        </div>
      )}
    </>
  )
}

export function VentaPage() {
  const { clienteActivo, canalActual } = useAppStore()
  const [modo, setModo] = useState<ModoVenta>('selector')

  // Modal migración Fusión
  const [mostrarModalMigracion, setMostrarModalMigracion] = useState(false)
  const [migracionDecidida, setMigracionDecidida] = useState<'aceptada' | 'rechazada' | null>(null)

  // Selector necesidades
  const [fibraSel, setFibraSel] = useState<number | null>(null)
  const [numLineas, setNumLineas] = useState(0)
  const [datosPrincipal, setDatosPrincipal] = useState<number | 'ilimitado' | null>(null)
  const [datosSecundaria, setDatosSecundaria] = useState<number | 'ilimitado' | null>(null)
  const [addonsTVSel, setAddonsTVSel] = useState<Set<string>>(new Set())
  const [mostrarMasTV, setMostrarMasTV] = useState(false)

  // Resultados
  const [resultados, setResultados] = useState<ResultadoBusquedaBundle[]>([])
  const [buscado, setBuscado] = useState(false)
  const [bundleSel, setBundleSel] = useState<Bundle | null>(null)

  // Firma
  const [firmando, setFirmando] = useState(false)
  const [ventaConscienteVista, setVentaConscienteVista] = useState(false)
  const [firmado, setFirmado] = useState(false)
  const [mostrarMLP, setMostrarMLP] = useState(false)
  const [mlpEmail, setMlpEmail] = useState('')
  const [mlpEnviado, setMlpEnviado] = useState(false)

  // Señalización terceros (RF01-4)
  const [senSelIds, setSenSelIds] = useState<Set<string>>(new Set())
  const [senConfirmadas, setSenConfirmadas] = useState<string[]>([])
  const [mostrarTerceros, setMostrarTerceros] = useState(false)

  if (!clienteActivo) return null

  const tieneFusion = clienteActivo.porfolio === 'fusion'
  const bundleActualObj = catalogoBundles.find(b => b.id === clienteActivo.bundleActual)
  const propuestaMig = getPropuestaMigracion(clienteActivo.bundleActual)
  const bundleEquivalente = propuestaMig ? catalogoBundles.find(b => b.id === propuestaMig.bundleEquivalenteId) || null : null

  // RF01-2: porfolio efectivo tras decisión de migración
  const porfolioEfectivo: 'fusion' | 'mi_movistar' =
    migracionDecidida === 'aceptada' ? 'mi_movistar' :
    migracionDecidida === 'rechazada' ? 'fusion' :
    (clienteActivo.porfolio as 'fusion' | 'mi_movistar') || 'mi_movistar'

  // RF01-2: addons TV compatibles con el porfolio efectivo
  const addonsCompatibles = compatibilidadTV[porfolioEfectivo] || []
  const addonsTVFiltrados = catalogoAddonsTV.filter(a => addonsCompatibles.includes(a.id))
  const addonsCoreVisibles = addonsTVFiltrados.filter(a => addonsTVCore.includes(a.id))
  const addonsExtras = addonsTVFiltrados.filter(a => !addonsTVCore.includes(a.id))

  const precargarBundleActual = () => {
    if (!bundleActualObj) return
    const ing = bundleActualObj.ingredientes
    setFibraSel(ing.fibra || null)
    setNumLineas(ing.lineas?.length || 0)
    setDatosPrincipal(ing.lineas?.[0]?.datos || null)
    setDatosSecundaria(ing.lineas?.[1]?.datos || null)
  }

  const iniciarModo = (m: ModoVenta) => {
    setModo(m)
    setBuscado(false); setResultados([]); setBundleSel(null); setFirmado(false)
    setAddonsTVSel(new Set()); setMigracionDecidida(null); setMostrarMasTV(false)
    if (m === 'cambio_tarifa') {
      precargarBundleActual()
      if (tieneFusion) setMostrarModalMigracion(true)
    } else {
      setFibraSel(null); setNumLineas(0); setDatosPrincipal(null); setDatosSecundaria(null)
    }
  }

  const handleAceptarMigracion = () => {
    setMigracionDecidida('aceptada')
    setMostrarModalMigracion(false)
    if (bundleEquivalente) setBundleSel(bundleEquivalente)
  }

  const handleRechazarMigracion = () => {
    setMigracionDecidida('rechazada')
    setMostrarModalMigracion(false)
  }

  const buscar = () => {
    const res = buscarBundles(fibraSel, numLineas, datosPrincipal, datosSecundaria)
    const filtrados = migracionDecidida === 'rechazada' && bundleActualObj
      ? res.filter(r => r.bundle.precio <= bundleActualObj.precio * 1.15)
      : res
    setResultados(filtrados); setBuscado(true); setBundleSel(null); setFirmado(false)
  }

  const toggleAddonTV = (id: string) => {
    const s = new Set(addonsTVSel); s.has(id) ? s.delete(id) : s.add(id); setAddonsTVSel(s)
  }

  const toggleTercero = (id: string) => {
    const s = new Set(senSelIds); s.has(id) ? s.delete(id) : s.add(id); setSenSelIds(s)
  }

  // RF01-5: precio con motor de promociones
  const precioBase = bundleSel?.precio || 0
  const precioAddonsTV = catalogoAddonsTV.filter(a => addonsTVSel.has(a.id)).reduce((acc, a) => {
    if ((a.id === 'tv-ficcion' || a.id === 'tv-futbol') && addonsTVSel.has('tv-total')) return acc
    return acc + a.precio
  }, 0)
  const precioTotal = () => precioBase + precioAddonsTV

  const firmar = () => {
    setFirmando(true)
    setTimeout(() => {
      setFirmando(false); setFirmado(true)
      senSelIds.forEach(id => {
        const prod = catalogoTerceros.find(p => p.id === id)
        if (prod) {
          crearSenalizacion({
            clienteId: clienteActivo.id,
            productoId: id,
            nombreProducto: prod.nombre,
            fecha: new Date().toLocaleDateString('es-ES'),
            estado: 'pendiente',
            notas: `Señalización generada desde módulo Venta. Canal: ${canalActual}`,
            agente: 'AGT-actual',
          })
        }
      })
      setSenConfirmadas([...senSelIds])
    }, 2000)
  }

  const resetear = () => {
    setModo('selector'); setBuscado(false); setResultados([]); setBundleSel(null)
    setFirmado(false); setMigracionDecidida(null); setSenSelIds(new Set()); setSenConfirmadas([])
  }

  const matchColor = (tipo: string) => {
    if (tipo === 'exacto') return { bg: '#F0FDF4', border: '#86EFAC', color: '#166534', label: '✓ Match exacto' }
    if (tipo === 'aproximado') return { bg: BLUE_LIGHT, border: BLUE_BORDER, color: BLUE, label: '≈ Match aproximado' }
    return { bg: '#FFFBEB', border: '#FCD34D', color: '#92400E', label: '~ Match parcial' }
  }

  const parqueActualPrecio = clienteActivo.productos.reduce((a, p) => a + (p.precio || 0), 0)

  // ── SELECTOR INICIAL ──
  if (modo === 'selector') {
    return (
      <>
        {mostrarModalMigracion && (
          <ModalMigracion
            bundleActualNombre={bundleActualObj?.nombre || ''}
            propuesta={propuestaMig}
            bundleEquivalente={bundleEquivalente}
            onAceptar={handleAceptarMigracion}
            onRechazar={handleRechazarMigracion}
          />
        )}

        <div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>Venta / Modificación</div>
          <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 2 }}>Selecciona el tipo de gestión comercial</div>
        </div>

        {/* RF001-15 — Alarmas de entrada */}
        {(() => {
          const tienePedidoEnVuelo = clienteActivo.pedidos.some(p => p.estado !== 'completado' && p.estado !== 'cancelado')
          const tieneMLP = false // En producción vendría del estado de sesión
          const tieneProcesoAhorro = clienteActivo.satisfaccionRiesgo === 'en_riesgo'

          if (!tienePedidoEnVuelo && !tieneMLP && !tieneProcesoAhorro) return null
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {tienePedidoEnVuelo && (
                <div style={{ padding: '8px 12px', borderRadius: 'var(--border-radius-md)', background: 'var(--color-blue-light)', border: '1px solid var(--color-blue-mid)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: 11, color: 'var(--color-blue-dark)' }}>
                    <strong>⚠ Pedido en vuelo activo</strong> — {clienteActivo.pedidos.find(p => p.estado !== 'completado' && p.estado !== 'cancelado')?.numero}. Algunas acciones pueden estar bloqueadas hasta su resolución.
                  </div>
                  <button onClick={() => window.history.pushState(null, '', `/cliente/${clienteActivo.id}/pedidos`)} style={{ fontSize: 10, padding: '3px 8px', borderRadius: 9999, border: '1px solid var(--color-blue-mid)', background: 'white', color: 'var(--color-blue-dark)', cursor: 'pointer', fontWeight: 600, flexShrink: 0, marginLeft: 10 }}>
                    Ver →
                  </button>
                </div>
              )}
              {tieneProcesoAhorro && (
                <div style={{ padding: '8px 12px', borderRadius: 'var(--border-radius-md)', background: 'var(--color-amber-light)', border: '1px solid var(--color-amber-border)', fontSize: 11, color: 'var(--color-amber-dark)' }}>
                  <strong>💡 Cliente en proceso de revisión de ahorro</strong> — Priorizar propuestas de valor antes de cambios de tarifa.
                </div>
              )}
            </div>
          )
        })()}

        {tieneFusion && (
          <div style={{ background: ORANGE_LIGHT, border: `1.5px solid ${ORANGE_BORDER}`, borderRadius: 8, padding: '10px 14px', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>🔶</span>
            <div style={{ fontSize: 11 }}>
              <div style={{ fontWeight: 700, color: ORANGE, marginBottom: 2 }}>Porfolio descatalogado — FUSIÓN</div>
              <div style={{ color: '#92400E', opacity: 0.9 }}>Para modificar la tarifa es necesario migrar a "mi Movistar". Al seleccionar Cambiar tarifa se mostrará la propuesta de migración.</div>
            </div>
          </div>
        )}

        {bundleActualObj && (
          <div style={{ background: 'var(--color-background-primary)', border: '1px solid var(--color-border-tertiary)', borderLeft: `3px solid ${tieneFusion ? ORANGE : BLUE}`, borderRadius: 'var(--border-radius-lg)', padding: '12px 14px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
              {tieneFusion ? '🔶 Tarifa actual (descatalogada)' : '📦 Tarifa actual'}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2, color: tieneFusion ? '#92400E' : 'var(--color-text-primary)' }}>{bundleActualObj.nombre}</div>
                <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{bundleActualObj.descripcion}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-mono)', color: tieneFusion ? ORANGE : 'var(--color-text-primary)' }}>{bundleActualObj.precio.toFixed(2)}€</div>
                <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)' }}>/mes sin IVA</div>
              </div>
            </div>
          </div>
        )}

        {/* RF001-16 — Beneficios condicionados no automáticos */}
        {(() => {
          const tieneMultisim = clienteActivo.lineasMovil.length >= 2
          const beneficiosPendientes = []
          if (!tieneMultisim && clienteActivo.lineasMovil.length === 1) {
            beneficiosPendientes.push({
              id: 'multisim',
              titulo: 'Multisim sin coste disponible',
              desc: 'El cliente puede añadir una SIM adicional vinculada a su línea principal sin coste extra. Requiere solicitud explícita.',
              icono: '📶',
            })
          }
          if (clienteActivo.porfolio === 'mi_movistar' && !clienteActivo.productos.some(p => p.tipo === 'tv')) {
            beneficiosPendientes.push({
              id: 'tv',
              titulo: 'TV Movistar Plus+ disponible',
              desc: 'El cliente puede añadir TV a su bundle convergente. No se aplica automáticamente.',
              icono: '📺',
            })
          }
          if (beneficiosPendientes.length === 0) return null
          return (
            <div style={{ padding: '10px 14px', borderRadius: 'var(--border-radius-md)', background: 'var(--color-green-light)', border: '1px solid var(--color-green-border)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-green-dark)', marginBottom: 8 }}>
                🎁 Beneficios disponibles — requieren solicitud explícita del agente
              </div>
              {beneficiosPendientes.map(b => (
                <div key={b.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6, fontSize: 11, color: 'var(--color-green-dark)' }}>
                  <span style={{ flexShrink: 0 }}>{b.icono}</span>
                  <div>
                    <div style={{ fontWeight: 600 }}>{b.titulo}</div>
                    <div style={{ opacity: 0.85, marginTop: 2 }}>{b.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          )
        })()}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            { modo: 'cambio_tarifa' as ModoVenta, icono: '🔄', titulo: 'Cambiar tarifa', desc: 'Reposicionar en un bundle diferente. El sistema parte de la tarifa actual y busca alternativas.', color: BLUE, bgColor: BLUE_LIGHT, border: BLUE_BORDER },
            { modo: 'alta_servicio' as ModoVenta, icono: '➕', titulo: 'Alta de servicio', desc: 'Alta línea Móvil o BAF / BAF Convergente. Mismo proceso que nueva contratación con datos precargados.', color: 'var(--color-green)', bgColor: 'var(--color-green-light)', border: 'var(--color-green-border)' },
            { modo: 'linea_adicional' as ModoVenta, icono: '📱', titulo: 'Añadir línea', desc: 'Añadir una línea móvil adicional sobre el bundle convergente actual.', color: 'var(--color-purple)', bgColor: 'var(--color-purple-light)', border: 'var(--color-purple-border)' },
            { modo: 'modo_ahorro' as ModoVenta, icono: '💡', titulo: 'Modo ahorro', desc: 'Wizard guiado para clientes en riesgo. Prioriza acciones de retención y ajuste de tarifa.', color: 'var(--color-amber)', bgColor: 'var(--color-amber-light)', border: 'var(--color-amber-border)' },
          ].map(op => (
            <div key={op.modo} onClick={() => iniciarModo(op.modo)}
              style={{ background: op.bgColor, border: `1.5px solid ${op.border}`, borderRadius: 'var(--border-radius-lg)', padding: 16, cursor: 'pointer', transition: 'box-shadow 0.15s', boxShadow: 'var(--shadow-sm)' }}
              onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-md)'}
              onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-sm)'}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>{op.icono}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: op.color, marginBottom: 6 }}>{op.titulo}</div>
              <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>{op.desc}</div>
            </div>
          ))}
        </div>
      </>
    )
  }

  // ── MODO AHORRO (RF001-13 RepoDown) ──
  if (modo === 'modo_ahorro') {
    const oportunidades = [
      {
        id: 'valor',
        icono: '✨',
        titulo: 'Poner en valor el servicio',
        desc: 'Recordar al cliente los beneficios de su tarifa actual: velocidad, datos, TV incluida.',
        accion: 'Argumentar beneficios',
        color: 'var(--color-blue)',
        bg: 'var(--color-blue-light)',
        border: 'var(--color-blue-mid)',
      },
      {
        id: 'va',
        icono: '🔍',
        titulo: 'Revisar servicios de valor añadido',
        desc: 'Identificar servicios que no usa (seguros, roaming) y eliminarlos para reducir cuota.',
        accion: 'Revisar parque',
        color: 'var(--color-amber)',
        bg: 'var(--color-amber-light)',
        border: 'var(--color-amber-border)',
      },
      {
        id: 'promo',
        icono: '🎁',
        titulo: 'Aplicar promoción de prevención',
        desc: 'Ofrecer descuento temporal de retención si el cliente cumple criterios.',
        accion: 'Ver promociones',
        color: 'var(--color-green)',
        bg: 'var(--color-green-light)',
        border: 'var(--color-green-border)',
      },
      {
        id: 'ajuste',
        icono: '📉',
        titulo: 'Ajuste de tarifa (RepoDown)',
        desc: 'Migrar a una tarifa inferior manteniendo el cliente. Registra como retención activa.',
        accion: 'Ir a cambio tarifa',
        color: 'var(--color-red)',
        bg: 'var(--color-red-light)',
        border: 'var(--color-red-border)',
      },
    ]
    return <ModoAhorroWizard oportunidades={oportunidades} onVolver={resetear} onIrCambioTarifa={() => iniciarModo('cambio_tarifa')} />
  }

  // ── LÍNEA ADICIONAL ──
  if (modo === 'linea_adicional') {
    return <NuevaVentaPage tipoForzado="movil" clientePreCargado={{ dni: clienteActivo.dni, nombre: clienteActivo.nombre, apellidos: clienteActivo.apellidos, email: clienteActivo.email, telefono: clienteActivo.telefono, iban: '', scoringOK: clienteActivo.riesgoScore !== 'alto' }} />
  }

  // ── ALTA SERVICIO ──
  if (modo === 'alta_servicio') {
    return <NuevaVentaPage tipoForzado="convergente" clientePreCargado={{ dni: clienteActivo.dni, nombre: clienteActivo.nombre, apellidos: clienteActivo.apellidos, email: clienteActivo.email, telefono: clienteActivo.telefono, iban: '', scoringOK: clienteActivo.riesgoScore !== 'alto' }} />
  }

  // ── CAMBIO TARIFA ──
  return (
    <>
      {mostrarModalMigracion && (
        <ModalMigracion
          bundleActualNombre={bundleActualObj?.nombre || ''}
          propuesta={propuestaMig}
          bundleEquivalente={bundleEquivalente}
          onAceptar={handleAceptarMigracion}
          onRechazar={handleRechazarMigracion}
        />
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>Cambiar tarifa</div>
          <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 2 }}>
            Reposicionamiento · {migracionDecidida === 'aceptada' ? '✨ Migrando a mi Movistar' : migracionDecidida === 'rechazada' ? '🔶 Manteniendo Fusión' : 'Selecciona nueva tarifa'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {tieneFusion && migracionDecidida && (
            <div style={{ padding: '4px 10px', borderRadius: 9999, fontSize: 11, fontWeight: 600, background: migracionDecidida === 'aceptada' ? ORANGE_LIGHT : GREY_LIGHT, color: migracionDecidida === 'aceptada' ? ORANGE : '#6B7280', border: `1px solid ${migracionDecidida === 'aceptada' ? ORANGE_BORDER : GREY_BORDER}` }}>
              {migracionDecidida === 'aceptada' ? '✨ Migración aceptada' : '📦 Fusión mantenida'}
            </div>
          )}
          {tieneFusion && !migracionDecidida && (
            <button onClick={() => setMostrarModalMigracion(true)} style={{ padding: '4px 10px', borderRadius: 9999, fontSize: 11, fontWeight: 600, background: ORANGE_LIGHT, color: ORANGE, border: `1px solid ${ORANGE_BORDER}`, cursor: 'pointer' }}>
              Ver propuesta migración
            </button>
          )}
          {bundleActualObj && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 12px', background: 'var(--color-background-secondary)', border: '1px solid var(--color-border-tertiary)', borderRadius: 'var(--border-radius-md)', fontSize: 11 }}>
              <span style={{ color: 'var(--color-text-tertiary)' }}>Actual:</span>
              <span style={{ fontWeight: 600 }}>{bundleActualObj.nombre}</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-secondary)' }}>{bundleActualObj.precio.toFixed(2)}€</span>
            </div>
          )}
          <button onClick={resetear} className="btn-secondary" style={{ fontSize: 11 }}>← Volver</button>
        </div>
      </div>

      {/* Propuesta mi Movistar precargada (si aceptó migración) */}
      {migracionDecidida === 'aceptada' && bundleEquivalente && (
        <div style={{ background: ORANGE_LIGHT, border: `1.5px solid ${ORANGE_BORDER}`, borderRadius: 10, padding: '14px 16px' }} className="fade-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: ORANGE, marginBottom: 2 }}>✨ Bundle equivalente mi Movistar precargado</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#92400E' }}>{bundleEquivalente.nombre}</div>
              <div style={{ fontSize: 11, color: '#B45309', marginTop: 2 }}>{bundleEquivalente.descripcion}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: ORANGE }}>{bundleEquivalente.precio.toFixed(2)}€</div>
              <div style={{ fontSize: 10, color: '#B45309' }}>/mes sin IVA</div>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 12 }}>
        {/* Selector necesidades */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="card">
            <div className="card-title">
              ¿Qué necesita ahora el cliente?
              <button onClick={precargarBundleActual} className="card-title-link">↺ Recargar tarifa actual</button>
            </div>

            {/* Fibra */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 8 }}>🌐 Velocidad de fibra</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {([null, 300, 600, 1000] as (number | null)[]).map(f => (
                  <button key={String(f)} onClick={() => setFibraSel(f)}
                    style={{ padding: '5px 12px', fontSize: 11, borderRadius: 'var(--border-radius-md)', border: `1.5px solid ${fibraSel === f ? BLUE : 'var(--color-border-secondary)'}`, background: fibraSel === f ? BLUE_LIGHT : 'var(--color-background-secondary)', color: fibraSel === f ? BLUE : 'var(--color-text-secondary)', cursor: 'pointer', fontWeight: fibraSel === f ? 600 : 400 }}>
                    {f === null ? 'Sin fibra' : f === 1000 ? '1 Gb' : `${f} Mb`}
                  </button>
                ))}
              </div>
            </div>

            {/* Líneas */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 8 }}>📱 Número de líneas móviles</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {[0, 1, 2, 3].map(n => (
                  <button key={n} onClick={() => { setNumLineas(n); if (n === 0) { setDatosPrincipal(null); setDatosSecundaria(null) } }}
                    style={{ width: 44, height: 32, fontSize: 12, borderRadius: 'var(--border-radius-md)', border: `1.5px solid ${numLineas === n ? BLUE : 'var(--color-border-secondary)'}`, background: numLineas === n ? BLUE_LIGHT : 'var(--color-background-secondary)', color: numLineas === n ? BLUE : 'var(--color-text-secondary)', cursor: 'pointer', fontWeight: numLineas === n ? 700 : 400 }}>
                    {n === 0 ? '—' : n}
                  </button>
                ))}
              </div>
            </div>

            {numLineas >= 1 && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 8 }}>📶 Datos línea principal</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {([20, 30, 'ilimitado'] as (number | 'ilimitado')[]).map(d => (
                    <button key={d.toString()} onClick={() => setDatosPrincipal(d)}
                      style={{ padding: '5px 12px', fontSize: 11, borderRadius: 'var(--border-radius-md)', border: `1.5px solid ${datosPrincipal === d ? BLUE : 'var(--color-border-secondary)'}`, background: datosPrincipal === d ? BLUE_LIGHT : 'var(--color-background-secondary)', color: datosPrincipal === d ? BLUE : 'var(--color-text-secondary)', cursor: 'pointer', fontWeight: datosPrincipal === d ? 600 : 400 }}>
                      {d === 'ilimitado' ? 'Ilimitado' : `${d} GB`}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {numLineas >= 2 && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 8 }}>📶 Datos 2ª línea</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {([20, 30, 'ilimitado'] as (number | 'ilimitado')[]).map(d => (
                    <button key={d.toString()} onClick={() => setDatosSecundaria(d)}
                      style={{ padding: '5px 12px', fontSize: 11, borderRadius: 'var(--border-radius-md)', border: `1.5px solid ${datosSecundaria === d ? BLUE : 'var(--color-border-secondary)'}`, background: datosSecundaria === d ? BLUE_LIGHT : 'var(--color-background-secondary)', color: datosSecundaria === d ? BLUE : 'var(--color-text-secondary)', cursor: 'pointer', fontWeight: datosSecundaria === d ? 600 : 400 }}>
                      {d === 'ilimitado' ? 'Ilimitado' : `${d} GB`}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button onClick={buscar} className="btn-primary" style={{ width: '100%', justifyContent: 'center', height: 36, fontSize: 13 }}>
              🔍 Buscar bundles compatibles
            </button>
          </div>

          {/* Resultados */}
          {buscado && (
            <div className="card">
              <div className="card-title">
                Bundles compatibles
                {resultados.length > 0 && <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>{resultados.length} resultados</span>}
              </div>

              {migracionDecidida === 'rechazada' && (
                <div style={{ background: GREY_LIGHT, border: `1px solid ${GREY_BORDER}`, borderRadius: 6, padding: '8px 10px', marginBottom: 8, fontSize: 11, color: '#6B7280' }}>
                  📦 Mostrando solo opciones compatibles con porfolio <strong>Fusión</strong>
                </div>
              )}
              {migracionDecidida === 'aceptada' && (
                <div style={{ background: ORANGE_LIGHT, border: `1px solid ${ORANGE_BORDER}`, borderRadius: 6, padding: '8px 10px', marginBottom: 8, fontSize: 11, color: '#92400E' }}>
                  ✨ Mostrando opciones del porfolio <strong>mi Movistar</strong>
                </div>
              )}

              {resultados.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--color-text-tertiary)', fontSize: 12 }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>🔍</div>
                  Sin bundles para esta combinación. Ajusta los filtros.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {resultados.map(r => {
                    const mc = matchColor(r.matchTipo)
                    const isSelected = bundleSel?.id === r.bundle.id
                    const esMismoBundle = r.bundle.id === clienteActivo.bundleActual
                    const delta = r.bundle.precio - (bundleActualObj?.precio || 0)
                    return (
                      <div key={r.bundle.id} onClick={() => setBundleSel(isSelected ? null : r.bundle)}
                        style={{ padding: '12px 14px', border: `1.5px solid ${isSelected ? BLUE : esMismoBundle ? 'var(--color-border-secondary)' : 'var(--color-border-tertiary)'}`, borderRadius: 'var(--border-radius-lg)', cursor: esMismoBundle ? 'default' : 'pointer', background: isSelected ? BLUE_LIGHT : esMismoBundle ? 'var(--color-background-secondary)' : 'var(--color-background-primary)', transition: 'all 0.1s', opacity: esMismoBundle ? 0.7 : 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                              <span style={{ fontSize: 13, fontWeight: 700 }}>{r.bundle.nombre}</span>
                              {esMismoBundle && <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, background: 'var(--color-background-tertiary)', color: 'var(--color-text-tertiary)', fontWeight: 700 }}>ACTUAL</span>}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{r.bundle.descripcion}</div>
                          </div>
                          <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 12 }}>
                            <div>
                              <span style={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>{r.bundle.precio.toFixed(2)}€</span>
                              <span style={{ fontSize: 11, color: '#6B7280' }}>/mes sin IVA</span>
                            </div>
                            <div style={{ fontSize: 11, color: '#6B7280' }}>({(r.bundle.precio * 1.21).toFixed(2)}€ con IVA)</div>
                            {!esMismoBundle && bundleActualObj && (
                              <div style={{ fontSize: 11, fontWeight: 600, color: delta > 0 ? 'var(--color-red)' : 'var(--color-green)' }}>
                                {delta > 0 ? '↑' : '↓'} {Math.abs(delta).toFixed(2)}€/mes
                              </div>
                            )}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 'var(--border-radius-full)', background: mc.bg, border: `1px solid ${mc.border}`, color: mc.color, fontWeight: 600 }}>{mc.label}</span>
                          {r.bundle.tag && <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 'var(--border-radius-full)', background: 'var(--color-purple-light)', border: '1px solid var(--color-purple-border)', color: 'var(--color-purple)', fontWeight: 600 }}>{r.bundle.tag}</span>}
                          {r.matchTipo === 'exacto' && !esMismoBundle && <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 'var(--border-radius-full)', background: BLUE_LIGHT, border: `1px solid ${BLUE_BORDER}`, color: BLUE, fontWeight: 600 }}>⭐ NBA</span>}
                        </div>
                        {/* Diferencias detectadas — Sección 7.2 */}
                        {r.matchTipo !== 'exacto' && (() => {
                          const diffs: string[] = []
                          const b = r.bundle
                          if (b.ingredientes.fibra && fibraSel && b.ingredientes.fibra !== fibraSel) {
                            diffs.push(`Fibra: ${b.ingredientes.fibra}Mb ofrecida vs ${fibraSel}Mb pedida`)
                          }
                          if (b.ingredientes.lineas?.[0]?.datos && datosPrincipal && b.ingredientes.lineas[0].datos !== datosPrincipal) {
                            diffs.push(`Línea 1: ${b.ingredientes.lineas[0].datos} vs ${datosPrincipal} pedidos`)
                          }
                          if (diffs.length === 0) return null
                          return (
                            <div style={{ marginTop: 6 }}>
                              {diffs.map((d, i) => (
                                <div key={i} style={{ fontSize: 10, color: '#92400E', display: 'flex', gap: 4 }}>
                                  <span>⚠</span><span>{d}</span>
                                </div>
                              ))}
                            </div>
                          )
                        })()}
                        {r.diferencias.length > 0 && (
                          <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--color-border-tertiary)' }}>
                            {r.diferencias.map((d, i) => <div key={i} style={{ fontSize: 11, color: 'var(--color-amber-dark)' }}>· {d}</div>)}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Propuestas alternativas */}
          {bundleSel && (() => {
            const propDown = resultados.filter(r => r.bundle.precio < bundleSel.precio && r.bundle.id !== clienteActivo.bundleActual).sort((a, b) => b.bundle.precio - a.bundle.precio)[0]?.bundle || null
            const propUp = resultados.filter(r => r.bundle.precio > bundleSel.precio && r.bundle.id !== clienteActivo.bundleActual).sort((a, b) => a.bundle.precio - b.bundle.precio)[0]?.bundle || null
            const props = [
              { key: 'down', label: '↓ Down', bundle: propDown, color: 'var(--color-amber-dark)', bg: 'var(--color-amber-light)', border: 'var(--color-amber-border)' },
              { key: 'base', label: '= Base', bundle: bundleSel, color: BLUE, bg: BLUE_LIGHT, border: BLUE_BORDER },
              { key: 'up', label: '↑ Up', bundle: propUp, color: 'var(--color-green-dark)', bg: 'var(--color-green-light)', border: 'var(--color-green-border)' },
            ] as const
            return (
              <div className="card">
                <div className="card-title">🎯 Propuestas alternativas</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  {props.map(p => (
                    <div key={p.key} onClick={() => p.bundle && setBundleSel(p.bundle)}
                      style={{ padding: '10px 12px', border: `1.5px solid ${p.bundle ? p.border : 'var(--color-border-tertiary)'}`, borderRadius: 'var(--border-radius-md)', cursor: p.bundle ? 'pointer' : 'default', background: p.bundle ? p.bg : 'var(--color-background-secondary)', opacity: p.bundle ? 1 : 0.45 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: p.bundle ? p.color : 'var(--color-text-tertiary)', marginBottom: 4 }}>{p.label}</div>
                      {p.bundle ? (
                        <>
                          <div style={{ fontSize: 11, fontWeight: 600, color: p.color, marginBottom: 2, lineHeight: 1.3 }}>{p.bundle.nombre}</div>
                          <div style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)', color: p.color }}>{p.bundle.precio.toFixed(2)}€</div>
                        </>
                      ) : (
                        <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>No disponible</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })()}

          {/* RF01-2 + RF01-3: TV filtrada por porfolio */}
          {bundleSel && bundleSel.categoria !== 'fibra_sola' && addonsTVFiltrados.length > 0 && (
            <div className="card">
              <div className="card-title">
                📺 Televisión
                {migracionDecidida === 'rechazada' && <span style={{ fontSize: 10, color: '#6B7280', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>Solo opciones Fusión</span>}
                {migracionDecidida === 'aceptada' && <span style={{ fontSize: 10, color: ORANGE, fontWeight: 600, textTransform: 'none', letterSpacing: 0 }}>Catálogo completo mi Movistar</span>}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {addonsCoreVisibles.map(addon => {
                  const sel = addonsTVSel.has(addon.id)
                  const descuentoBundle = addon.id === 'tv-total' && bundleSel.categoria.startsWith('convergente') ? 3 : 0
                  const precioEfectivo = addon.precio - descuentoBundle
                  return (
                    <div key={addon.id} onClick={() => toggleAddonTV(addon.id)}
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 12px', border: `1.5px solid ${sel ? BLUE : 'var(--color-border-tertiary)'}`, borderRadius: 'var(--border-radius-md)', cursor: 'pointer', background: sel ? BLUE_LIGHT : 'transparent', transition: 'all 0.1s' }}>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: sel ? 600 : 400, color: sel ? BLUE : 'var(--color-text-primary)' }}>
                          {addon.nombre}
                          {addon.id === 'tv-total' && <span style={{ fontSize: 9, background: '#F0FDF4', color: '#166534', border: '1px solid #86EFAC', borderRadius: 9999, padding: '1px 5px', marginLeft: 6, fontWeight: 700 }}>COMPLETO</span>}
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)' }}>{addon.canales.slice(0, 3).join(' · ')}</div>
                        {descuentoBundle > 0 && sel && <div style={{ fontSize: 9, color: '#166534', fontWeight: 700, marginTop: 2 }}>✓ Descuento bundle −{descuentoBundle}€ aplicado</div>}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        {bundleSel && bundleSel.categoria.startsWith('convergente') && addon.precioBundle !== undefined && addon.precioBundle < addon.precio ? (
                          <div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-green-dark)' }}>+{addon.precioBundle}€/mes</div>
                            <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', textDecoration: 'line-through' }}>{addon.precio}€ a la carta</div>
                            <div style={{ fontSize: 9, color: 'var(--color-green-dark)', fontWeight: 600 }}>Precio bundle</div>
                          </div>
                        ) : descuentoBundle > 0 ? (
                          <div>
                            <span style={{ fontSize: 11, textDecoration: 'line-through', color: 'var(--color-text-tertiary)', marginRight: 4 }}>{addon.precio}€</span>
                            <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#166534' }}>+{precioEfectivo}€</span>
                          </div>
                        ) : (
                          <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)', color: sel ? BLUE : 'var(--color-text-primary)' }}>+{addon.precio.toFixed(2)}€</span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              {addonsExtras.length > 0 && (
                <>
                  <button onClick={() => setMostrarMasTV(!mostrarMasTV)}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: BLUE, fontWeight: 600, padding: '4px 0' }}>
                    {mostrarMasTV ? '▲ Ver menos' : `▼ Ver más opciones (${addonsExtras.length})`}
                  </button>
                  {mostrarMasTV && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 6 }} className="fade-in">
                      {addonsExtras.map(addon => {
                        const sel = addonsTVSel.has(addon.id)
                        return (
                          <div key={addon.id} onClick={() => toggleAddonTV(addon.id)}
                            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 12px', border: `1.5px solid ${sel ? BLUE : 'var(--color-border-tertiary)'}`, borderRadius: 'var(--border-radius-md)', cursor: 'pointer', background: sel ? BLUE_LIGHT : 'var(--color-background-secondary)', transition: 'all 0.1s' }}>
                            <div>
                              <div style={{ fontSize: 12, fontWeight: sel ? 600 : 400, color: sel ? BLUE : 'var(--color-text-primary)' }}>{addon.nombre}</div>
                              <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)' }}>{addon.canales.join(' · ')}</div>
                            </div>
                            <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)', color: sel ? BLUE : 'var(--color-text-primary)' }}>+{addon.precio.toFixed(2)}€</span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* RF001-7 — Productos relacionados dinámicos según cesta */}
          {bundleSel && (() => {
            const relacionados: { id: string; icono: string; titulo: string; desc: string; tipo: string }[] = []
            if (bundleSel.categoria.startsWith('convergente') && addonsTVSel.size === 0) {
              relacionados.push({ id: 'tv', icono: '📺', titulo: 'Añadir paquete de TV', desc: 'El cliente tiene fibra + móvil pero no TV. Oportunidad de upsell.', tipo: 'contratable' })
            }
            if (bundleSel.ingredientes.lineas && bundleSel.ingredientes.lineas.length > 0) {
              relacionados.push({ id: 'seguro', icono: '🛡', titulo: 'Seguro de móvil', desc: 'Protección ante rotura o robo. 5,99€/mes.', tipo: 'contratable' })
            }
            if (bundleSel.ingredientes.fibra) {
              relacionados.push({ id: 'fttr', icono: '🔧', titulo: 'FTTR — Fibra hasta la habitación', desc: '+12€/mes. Señalización instalación incluida.', tipo: 'senalizable' })
            }
            if (relacionados.length === 0) return null
            return (
              <div className="card">
                <div className="card-title">🔗 Productos relacionados</div>
                <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', marginBottom: 8 }}>
                  Actualizados según la cesta actual
                </div>
                {relacionados.map(r => (
                  <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--color-border-tertiary)', fontSize: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 16 }}>{r.icono}</span>
                      <div>
                        <div style={{ fontWeight: 600 }}>{r.titulo}</div>
                        <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)' }}>{r.desc}</div>
                      </div>
                    </div>
                    <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 9999, fontWeight: 700, background: r.tipo === 'contratable' ? 'var(--color-green-light)' : 'var(--color-amber-light)', color: r.tipo === 'contratable' ? 'var(--color-green-dark)' : 'var(--color-amber-dark)', border: `1px solid ${r.tipo === 'contratable' ? 'var(--color-green-border)' : 'var(--color-amber-border)'}`, flexShrink: 0, marginLeft: 8 }}>
                      {r.tipo === 'contratable' ? 'AÑADIR' : 'SEÑALIZAR'}
                    </span>
                  </div>
                ))}
              </div>
            )
          })()}

          {/* RF01-4: Señalización de productos de terceros */}
          {bundleSel && (
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: mostrarTerceros ? 10 : 0 }}>
                <div className="card-title" style={{ margin: 0 }}>🤝 Productos de terceros</div>
                <button onClick={() => setMostrarTerceros(!mostrarTerceros)} className="btn-ghost" style={{ fontSize: 11 }}>
                  {mostrarTerceros ? '▲ Ocultar' : '▼ Ver productos'}
                </button>
              </div>
              {!mostrarTerceros && (
                <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 6 }}>Alarmas, energía solar y más — señalización integrada sin salir de Telco</div>
              )}
              {mostrarTerceros && (
                <div className="fade-in">
                  <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 10 }}>
                    Selecciona los productos de interés para el cliente. Se generará una señalización automática y un especialista le contactará.
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {catalogoTerceros.map(prod => {
                      const sel = senSelIds.has(prod.id)
                      const confirmada = senConfirmadas.includes(prod.id)
                      return (
                        <div key={prod.id} onClick={() => !firmado && toggleTercero(prod.id)}
                          style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '10px 12px', border: `1.5px solid ${confirmada ? '#86EFAC' : sel ? BLUE_BORDER : 'var(--color-border-tertiary)'}`, borderRadius: 'var(--border-radius-md)', cursor: firmado ? 'default' : 'pointer', background: confirmada ? '#F0FDF4' : sel ? BLUE_LIGHT : 'var(--color-background-primary)', transition: 'all 0.1s' }}>
                          <div style={{ fontSize: 24, flexShrink: 0 }}>{prod.icono}</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <div style={{ fontSize: 12, fontWeight: 700, color: confirmada ? '#166534' : sel ? BLUE : 'var(--color-text-primary)', marginBottom: 2 }}>{prod.nombre}</div>
                              {confirmada && <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 9999, background: '#BBF7D0', color: '#166534', fontWeight: 700, flexShrink: 0 }}>✓ Señalizado</span>}
                              {sel && !confirmada && <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 9999, background: BLUE_LIGHT, color: BLUE, fontWeight: 700, border: `1px solid ${BLUE_BORDER}`, flexShrink: 0 }}>Seleccionado</span>}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>{prod.descripcion}</div>
                            <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', marginTop: 4 }}>{prod.proveedor} · {prod.tramitable ? 'Contratación inmediata' : 'Contacto especialista'}</div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  {senSelIds.size > 0 && !firmado && (
                    <div style={{ marginTop: 10, padding: '8px 10px', background: BLUE_LIGHT, border: `1px solid ${BLUE_BORDER}`, borderRadius: 6, fontSize: 11, color: BLUE }}>
                      {senSelIds.size} producto{senSelIds.size > 1 ? 's' : ''} seleccionado{senSelIds.size > 1 ? 's' : ''} — se señalizarán al firmar la venta
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Cesta */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="card" style={{ position: 'sticky', top: 0 }}>
            <div className="card-title">🔄 Nueva tarifa</div>

            {!bundleSel ? (
              <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--color-text-tertiary)', fontSize: 12 }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>📦</div>
                Selecciona un bundle de los resultados
              </div>
            ) : (
              <>
                <div style={{ padding: '10px 12px', background: migracionDecidida === 'aceptada' ? ORANGE_LIGHT : BLUE_LIGHT, borderRadius: 'var(--border-radius-md)', marginBottom: 10, border: migracionDecidida === 'aceptada' ? `1px solid ${ORANGE_BORDER}` : 'none' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: migracionDecidida === 'aceptada' ? '#92400E' : BLUE, marginBottom: 4 }}>{bundleSel.nombre}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: migracionDecidida === 'aceptada' ? '#B45309' : BLUE }}>
                    <span>Bundle base</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{bundleSel.precio.toFixed(2)}€</span>
                  </div>
                </div>

                {addonsTVSel.size > 0 && catalogoAddonsTV.filter(a => addonsTVSel.has(a.id)).map(a => (
                  <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--color-text-secondary)', padding: '3px 0' }}>
                    <span>{a.nombre}</span>
                    <span style={{ fontFamily: 'var(--font-mono)' }}>+{a.precio.toFixed(2)}€</span>
                  </div>
                ))}

                <div style={{ borderTop: '1px solid var(--color-border-secondary)', paddingTop: 10, marginTop: 8, marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 3 }}>
                    <span>Sin IVA</span><span style={{ fontFamily: 'var(--font-mono)' }}>{precioTotal().toFixed(2)}€</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 700 }}>
                    <span>Total/mes</span>
                    <span style={{ fontFamily: 'var(--font-mono)', color: migracionDecidida === 'aceptada' ? ORANGE : BLUE }}>{(precioTotal() * 1.21).toFixed(2)}€</span>
                  </div>
                </div>

                {bundleActualObj && (
                  <div style={{ padding: '8px 10px', borderRadius: 'var(--border-radius-md)', background: precioTotal() < bundleActualObj.precio ? 'var(--color-green-light)' : precioTotal() > bundleActualObj.precio ? 'var(--color-red-light)' : 'var(--color-background-secondary)', border: `1px solid ${precioTotal() < bundleActualObj.precio ? 'var(--color-green-border)' : precioTotal() > bundleActualObj.precio ? 'var(--color-red-border)' : 'var(--color-border-secondary)'}`, marginBottom: 12, fontSize: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ color: 'var(--color-text-secondary)' }}>Tarifa actual</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{(bundleActualObj.precio * 1.21).toFixed(2)}€</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: precioTotal() < bundleActualObj.precio ? 'var(--color-green-dark)' : precioTotal() > bundleActualObj.precio ? 'var(--color-red-dark)' : 'var(--color-text-primary)' }}>
                      <span>{precioTotal() < bundleActualObj.precio ? '↓ Ahorro' : precioTotal() > bundleActualObj.precio ? '↑ Incremento' : '= Sin cambio'}</span>
                      <span style={{ fontFamily: 'var(--font-mono)' }}>
                        {precioTotal() !== bundleActualObj.precio ? `${Math.abs((precioTotal() - bundleActualObj.precio) * 1.21).toFixed(2)}€/mes` : '—'}
                      </span>
                    </div>
                  </div>
                )}

                {!firmado && (
                  <div style={{ marginBottom: 12, padding: '10px 12px', borderRadius: 'var(--border-radius-md)', background: ventaConscienteVista ? 'var(--color-green-light)' : 'var(--color-background-secondary)', border: `1px solid ${ventaConscienteVista ? 'var(--color-green-border)' : 'var(--color-border-secondary)'}` }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: ventaConscienteVista ? 'var(--color-green-dark)' : 'var(--color-text-primary)', marginBottom: 6 }}>
                      💬 Venta consciente
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', lineHeight: 1.6, marginBottom: 8 }}>
                      Informa al cliente del nuevo precio ({(precioTotal() * 1.21).toFixed(2)}€/mes con IVA), condiciones de permanencia y derecho de desistimiento de 14 días.
                    </div>
                    {!ventaConscienteVista ? (
                      <button
                        onClick={() => setVentaConscienteVista(true)}
                        style={{ width: '100%', padding: '6px', background: 'var(--color-green-border)', color: '#fff', border: 'none', borderRadius: 'var(--border-radius-md)', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                        ✓ He verbalizado los términos al cliente — continuar con OTP
                      </button>
                    ) : (
                      <div style={{ fontSize: 11, color: 'var(--color-green-dark)', fontWeight: 600 }}>✓ Términos verbalizados</div>
                    )}
                  </div>
                )}

                {firmado ? (
                  <div className="alert alert-ok">
                    <span>✓</span>
                    <div>
                      <div style={{ fontWeight: 700 }}>Cambio de tarifa confirmado</div>
                      <div style={{ fontSize: 11, marginTop: 2 }}>
                        OTP verificado · El cliente recibirá confirmación
                        {senConfirmadas.length > 0 && ` · ${senConfirmadas.length} señalización${senConfirmadas.length > 1 ? 'es' : ''} creada${senConfirmadas.length > 1 ? 's' : ''}`}
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <button onClick={firmar} disabled={!ventaConscienteVista || firmando} className="btn-primary" style={{ width: '100%', justifyContent: 'center', height: 36, fontSize: 13, marginBottom: 6 }}>
                      {firmando ? <><span className="spinner spinner-sm" /> Enviando OTP...</> : '🔐 Firmar con OTP'}
                    </button>
                    {!ventaConscienteVista && (
                      <div style={{ fontSize: 10, color: 'var(--color-amber-dark)', marginTop: 4, textAlign: 'center' }}>
                        ⚠ RN-CONF-15: Verbaliza los términos al cliente antes de solicitar OTP
                      </div>
                    )}
                    <button onClick={() => { setMlpEmail(clienteActivo.email || ''); setMostrarMLP(true) }} className="btn-secondary" style={{ width: '100%', justifyContent: 'center', fontSize: 11 }}>
                      📄 Me lo pienso (MLP)
                    </button>
                  </>
                )}
              </>
            )}
          </div>

          {/* Calculadora ARPU */}
          <div className="card" style={{ border: `1.5px solid ${BLUE_BORDER}`, background: BLUE_LIGHT }}>
            <div className="card-title" style={{ color: BLUE }}>📊 Calculadora ARPU</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 10 }}>
              {clienteActivo.productos.filter(p => (p.precio || 0) > 0).map(p => (
                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: BLUE }}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>{p.nombre}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, flexShrink: 0 }}>{(p.precio || 0).toFixed(2)}€</span>
                </div>
              ))}
            </div>
            <div style={{ borderTop: `1px solid ${BLUE_BORDER}`, paddingTop: 8, marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700, color: BLUE }}>
                <span>ARPU actual (c/IVA)</span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>{(parqueActualPrecio * 1.21).toFixed(2)}€</span>
              </div>
            </div>
            {bundleSel && (
              <div className="fade-in" style={{ borderTop: `1px solid ${BLUE_BORDER}`, paddingTop: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700, color: precioTotal() > parqueActualPrecio ? 'var(--color-green-dark)' : 'var(--color-red-dark)' }}>
                  <span>ARPU nuevo (c/IVA)</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>{(precioTotal() * 1.21).toFixed(2)}€</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700, color: precioTotal() > parqueActualPrecio ? 'var(--color-green-dark)' : 'var(--color-amber-dark)', marginTop: 4 }}>
                  <span>{precioTotal() > parqueActualPrecio ? '↑ Incremento' : '↓ Reducción'}</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>{precioTotal() > parqueActualPrecio ? '+' : ''}{((precioTotal() - parqueActualPrecio) * 1.21).toFixed(2)}€/mes</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal MLP */}
      {mostrarMLP && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card" style={{ width: 360, maxWidth: '90vw' }}>
            <div className="card-title">📄 Enviar propuesta MLP</div>
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 12 }}>
              Se enviará un resumen de la oferta al cliente para que la consulte cuando quiera.
            </div>
            {bundleSel && (
              <div style={{ padding: '8px 10px', background: BLUE_LIGHT, borderRadius: 'var(--border-radius-md)', marginBottom: 12, fontSize: 12 }}>
                <div style={{ fontWeight: 700, color: BLUE, marginBottom: 2 }}>{bundleSel.nombre}</div>
                <div style={{ color: BLUE }}>{(bundleSel.precio * 1.21).toFixed(2)}€/mes (c/IVA)</div>
              </div>
            )}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 4, color: 'var(--color-text-secondary)' }}>Email del cliente</div>
              <input value={mlpEmail} onChange={e => setMlpEmail(e.target.value)} placeholder="email@dominio.com"
                style={{ width: '100%', padding: '7px 10px', fontSize: 12, border: '1.5px solid var(--color-border-secondary)', borderRadius: 'var(--border-radius-md)', boxSizing: 'border-box', fontFamily: 'inherit' }} />
            </div>
            {mlpEnviado ? (
              <div className="alert alert-ok"><span>✓</span><div>MLP enviado correctamente</div></div>
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setMostrarMLP(false)} className="btn-secondary" style={{ flex: 1, justifyContent: 'center', fontSize: 12 }}>Cancelar</button>
                <button onClick={() => { setMlpEnviado(true); setTimeout(() => { setMostrarMLP(false); setMlpEnviado(false) }, 2000) }}
                  disabled={!mlpEmail.trim() || !mlpEmail.includes('@')}
                  className="btn-primary" style={{ flex: 1, justifyContent: 'center', fontSize: 12 }}>
                  Enviar MLP
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
