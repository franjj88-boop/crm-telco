import { useState } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { catalogoBundles, catalogoAddonsTV, buscarBundles } from '../../data/mockData'
import type { Bundle, ResultadoBusquedaBundle } from '../../types'

type Paso = 'retencion' | 'seleccion_baja' | 'reposicion' | 'firma'

type OfertaRetencion = {
  id: string
  tipo: 'descuento' | 'mejora'
  titulo: string
  descripcion: string
  detalle: string
  valor?: number
  duracionMeses?: number
}

const motivosBaja = [
  'Precio muy alto',
  'Me cambio de operador',
  'No uso los servicios',
  'Mal servicio técnico',
  'Mal servicio al cliente',
  'Me voy al extranjero',
  'Problemas económicos',
  'Otro motivo',
]

const motivosEstandarizados = [
  { id: 'precio',      label: 'Precio elevado',        keywords: ['precio', 'caro', 'econom', 'dinero'] },
  { id: 'competencia', label: 'Oferta competencia',    keywords: ['cambio', 'operador', 'competen', 'otra'] },
  { id: 'no_uso',      label: 'No usa servicios',      keywords: ['no uso', 'no necesito', 'poco uso'] },
  { id: 'tecnico',     label: 'Problema técnico',      keywords: ['técnico', 'avería', 'internet', 'caída', 'lento'] },
  { id: 'atencion',    label: 'Mala atención',         keywords: ['atención', 'servicio', 'mal trato'] },
  { id: 'traslado',    label: 'Traslado / Mudanza',    keywords: ['mudanza', 'traslado', 'extranjero', 'me voy'] },
  { id: 'economico',   label: 'Dificultad económica',  keywords: ['económic', 'problema económ', 'paro'] },
  { id: 'otro',        label: 'Otro motivo',           keywords: [] },
]

const argumentario: Record<string, string> = {
  'Precio muy alto': '"Entiendo que el precio es importante. Tenemos opciones para ajustar la tarifa hasta un 20% manteniendo todos tus servicios."',
  'Me cambio de operador': '"Antes de decidirte, ¿puedo mostrarte lo que perderías y una oferta especial por tu fidelidad?"',
  'No uso los servicios': '"Podemos revisar tu tarifa y ajustarla exactamente a lo que usas, sin pagar por lo que no necesitas."',
  'Mal servicio técnico': '"Lamentamos los problemas. Quiero asegurarme de que quede resuelto hoy mismo antes de hablar de cualquier cambio."',
  'Mal servicio al cliente': '"Entendemos tu frustración y queremos mejorar tu experiencia. ¿Puedo compensarte por las molestias?"',
  'Problemas económicos': '"Podemos estudiar un fraccionamiento o una tarifa más económica que se adapte mejor a tu situación."',
}

const BLUE = '#0033A0'
const BLUE_LIGHT = '#EEF2FF'
const BLUE_BORDER = '#C7D2FE'

export function RetencionPage() {
  const { clienteActivo } = useAppStore()

  const [paso, setPaso] = useState<Paso>('retencion')
  const [motivosSel, setMotivosSel] = useState<Set<string>>(new Set())
  const [ofertaSel, setOfertaSel] = useState<OfertaRetencion | null>(null)
  const [productosBaja, setProductosBaja] = useState<Set<string>>(new Set())
  const [bundleSel, setBundleSel] = useState<Bundle | null>(null)
  const [addonsTVSel, setAddonsTVSel] = useState<Set<string>>(new Set())
  const [resultados, setResultados] = useState<ResultadoBusquedaBundle[]>([])
  const [buscado, setBuscado] = useState(false)
  const [procesando, setProcesando] = useState(false)
  const [resultado, setResultado] = useState<'retenido' | 'baja' | null>(null)
  const [firmando, setFirmando] = useState(false)
  const [mlpEmail, setMlpEmail] = useState('')
  const [mlpEnviado, setMlpEnviado] = useState(false)
  const [mostrarMLP, setMostrarMLP] = useState(false)

  if (!clienteActivo) return null

  const toggleMotivo = (m: string) => {
    const s = new Set(motivosSel)
    s.has(m) ? s.delete(m) : s.add(m)
    setMotivosSel(s)
  }

  const toggleProductoBaja = (pid: string) => {
    const s = new Set(productosBaja)
    s.has(pid) ? s.delete(pid) : s.add(pid)
    setProductosBaja(s)
  }

  const toggleAddonTV = (id: string) => {
    const s = new Set(addonsTVSel)
    s.has(id) ? s.delete(id) : s.add(id)
    setAddonsTVSel(s)
  }

  const calcularParqueTrasBaja = () => {
    const quedan = clienteActivo.productos.filter(p => !productosBaja.has(p.id))
    const tieneFibra = quedan.some(p => p.tipo === 'fibra')
    const lineas = quedan.filter(p => p.tipo === 'movil').length
    if (!tieneFibra && lineas === 0) return { tipo: 'baja_total', fibra: null, lineas: 0 }
    if (!tieneFibra && lineas > 0) return { tipo: 'solo_movil', fibra: null, lineas }
    if (tieneFibra && lineas === 0) return { tipo: 'solo_fibra', fibra: 600, lineas: 0 }
    return { tipo: 'convergente', fibra: 600, lineas }
  }

  const buscarReposicion = () => {
    const parque = calcularParqueTrasBaja()
    if (parque.tipo === 'baja_total') { setResultados([]); setBuscado(true); return }
    const res = buscarBundles(parque.fibra, parque.lineas, 'ilimitado')
    setResultados(res); setBuscado(true); setBundleSel(null)
  }

  const aceptarOferta = () => {
    setProcesando(true)
    setTimeout(() => { setProcesando(false); setResultado('retenido') }, 1800)
  }

  const confirmarBaja = () => {
    setFirmando(true)
    setTimeout(() => { setFirmando(false); setResultado('baja') }, 1800)
  }

  const totalParque = clienteActivo.productos.reduce((a, p) => a + (p.precio || 0), 0)
  const precioNuevo = bundleSel
    ? bundleSel.precio + catalogoAddonsTV.filter(a => addonsTVSel.has(a.id)).reduce((a, x) => a + x.precio, 0)
    : 0

  const parqueTrasCalc = calcularParqueTrasBaja()
  const esBajaTotal = parqueTrasCalc.tipo === 'baja_total'

  const generarOfertas = (): OfertaRetencion[] => {
    const ofertas: OfertaRetencion[] = []
    ofertas.push({
      id: 'desc-20', tipo: 'descuento', titulo: 'Descuento 20%',
      descripcion: 'Descuento del 20% sobre tu tarifa actual durante 6 meses',
      detalle: `${(totalParque * 0.8 * 1.21).toFixed(2)}€/mes durante 6 meses`,
      valor: 20, duracionMeses: 6
    })
    ofertas.push({
      id: 'desc-30', tipo: 'descuento', titulo: 'Descuento 30%',
      descripcion: 'Descuento del 30% sobre tu tarifa actual durante 3 meses',
      detalle: `${(totalParque * 0.7 * 1.21).toFixed(2)}€/mes durante 3 meses`,
      valor: 30, duracionMeses: 3
    })
    const bundleActualObj = catalogoBundles.find(b => b.id === clienteActivo.bundleActual)
    if (bundleActualObj?.ingredientes.fibra && bundleActualObj.ingredientes.fibra < 1000) {
      ofertas.push({
        id: 'mejora-fibra', tipo: 'mejora', titulo: 'Mejora a Fibra 1Gb',
        descripcion: 'Upgrade gratuito a Fibra 1Gb al mismo precio que pagas ahora',
        detalle: `Fibra 1Gb por ${(totalParque * 1.21).toFixed(2)}€/mes — mismo precio`
      })
    }
    if (bundleActualObj?.ingredientes.lineas?.[0]?.datos !== 'ilimitado') {
      ofertas.push({
        id: 'mejora-movil', tipo: 'mejora', titulo: 'Línea Ilimitada gratis',
        descripcion: 'Upgrade a datos ilimitados en tu línea principal sin coste adicional',
        detalle: `Datos ilimitados por ${(totalParque * 1.21).toFixed(2)}€/mes — mismo precio`
      })
    }
    return ofertas
  }

  const ofertas = generarOfertas()

  const matchColor = (tipo: string) => ({
    exacto:    { bg: '#F0FDF4', border: '#86EFAC', color: '#166534', label: '✓ Match exacto' },
    aproximado: { bg: BLUE_LIGHT, border: BLUE_BORDER, color: BLUE, label: '≈ Aproximado' },
    parcial:   { bg: '#FFFBEB', border: '#FCD34D', color: '#92400E', label: '~ Parcial' },
  }[tipo] || { bg: '', border: '', color: '', label: '' })

  const pasos: { id: Paso; label: string; num: number }[] = [
    { id: 'retencion', label: 'Retención', num: 1 },
    { id: 'seleccion_baja', label: 'Selección baja', num: 2 },
    { id: 'reposicion', label: 'Reposición', num: 3 },
    { id: 'firma', label: 'Firma', num: 4 },
  ]

  const pasoIdx = pasos.findIndex(p => p.id === paso)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Header con stepper */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>Retención / Gestión de baja</div>
          <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
            {clienteActivo.nombre} {clienteActivo.apellidos} · {clienteActivo.bundleActual}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center' }}>
          {pasos.map((p, i) => {
            const activo = p.id === paso
            const completado = pasoIdx > i
            return (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center' }}>
                {i > 0 && <div style={{ width: 24, height: 2, background: completado ? BLUE : '#E5E7EB' }} />}
                <div
                  onClick={() => !resultado && setPaso(p.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 20, background: activo ? BLUE_LIGHT : 'transparent', cursor: !resultado ? 'pointer' : 'default' }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, background: completado ? BLUE : activo ? BLUE : '#F3F4F6', color: (completado || activo) ? 'white' : '#9CA3AF', border: (!completado && !activo) ? '1.5px solid #D1D5DB' : 'none' }}>
                    {completado ? '✓' : p.num}
                  </div>
                  <span style={{ fontSize: 11, fontWeight: activo ? 600 : 400, color: activo ? BLUE : completado ? BLUE : '#9CA3AF', whiteSpace: 'nowrap' }}>{p.label}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Resultado final */}
      {resultado && (
        <div style={{ padding: '20px 24px', background: resultado === 'retenido' ? '#F0FDF4' : '#FEF2F2', border: `1px solid ${resultado === 'retenido' ? '#86EFAC' : '#FECACA'}`, borderRadius: 12, display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <span style={{ fontSize: 28, flexShrink: 0 }}>{resultado === 'retenido' ? '🎉' : '✓'}</span>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: resultado === 'retenido' ? '#166534' : '#991B1B', marginBottom: 4 }}>
              {resultado === 'retenido' ? 'Cliente retenido — oferta aceptada y confirmada' : 'Baja tramitada — confirmación enviada al cliente'}
            </div>
            <div style={{ fontSize: 13, color: resultado === 'retenido' ? '#166534' : '#991B1B', opacity: 0.85 }}>
              {resultado === 'retenido'
                ? ofertaSel?.tipo === 'descuento'
                  ? `Descuento del ${ofertaSel.valor}% aplicado durante ${ofertaSel.duracionMeses} meses`
                  : `Mejora aplicada: ${ofertaSel?.titulo}`
                : esBajaTotal
                  ? 'Baja total tramitada correctamente'
                  : `Baja parcial · Nueva tarifa: ${bundleSel?.nombre || 'sin reposición'}`
              }
            </div>
          </div>
        </div>
      )}

      {!resultado && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16 }}>

          {/* Panel izquierdo */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* ── PASO 1: RETENCIÓN ── */}
            {paso === 'retencion' && (
              <>
                {/* Motivos */}
                <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 4 }}>
                    Motivo de la baja
                    {motivosSel.size > 0 && <span style={{ marginLeft: 8, fontSize: 11, padding: '2px 8px', borderRadius: 10, background: BLUE_LIGHT, color: BLUE, fontWeight: 600 }}>{motivosSel.size} seleccionado/s</span>}
                  </div>
                  <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 14 }}>Selecciona el motivo o motivos declarados por el cliente</div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: motivosSel.size > 0 ? 16 : 0 }}>
                    {motivosBaja.map(m => (
                      <button key={m} onClick={() => toggleMotivo(m)}
                        style={{ padding: '7px 16px', fontSize: 13, borderRadius: 20, border: `2px solid ${motivosSel.has(m) ? BLUE : '#E5E7EB'}`, background: motivosSel.has(m) ? BLUE_LIGHT : 'white', color: motivosSel.has(m) ? BLUE : '#374151', cursor: 'pointer', fontWeight: motivosSel.has(m) ? 600 : 400, transition: 'all 0.1s' }}>
                        {motivosSel.has(m) ? '✓ ' : ''}{m}
                      </button>
                    ))}
                  </div>

                  {motivosSel.size > 0 && (
                    <div style={{ padding: '10px 14px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 8 }}>
                      <div style={{ fontSize: 11, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Motivos estandarizados para reporting</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {Array.from(motivosSel).map(m => {
                          const est = motivosEstandarizados.find(me => me.keywords.some(k => m.toLowerCase().includes(k))) || motivosEstandarizados[motivosEstandarizados.length - 1]
                          return (
                            <span key={m} style={{ fontSize: 12, padding: '3px 10px', borderRadius: 10, background: '#16A34A', color: 'white', fontWeight: 600 }}>
                              {est.label}
                            </span>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Argumentario */}
                {Array.from(motivosSel).filter(m => argumentario[m]).length > 0 && (
                  <div style={{ background: BLUE_LIGHT, border: `1px solid ${BLUE_BORDER}`, borderRadius: 12, padding: '16px 20px' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: BLUE, marginBottom: 12 }}>💬 Argumentario sugerido</div>
                    {Array.from(motivosSel).filter(m => argumentario[m]).map(m => (
                      <div key={m} style={{ fontSize: 13, color: '#374151', lineHeight: 1.6, padding: '8px 12px', background: 'rgba(255,255,255,0.6)', borderRadius: 8, marginBottom: 6, fontStyle: 'italic' }}>
                        {argumentario[m]}
                      </div>
                    ))}
                  </div>
                )}

                {/* Ofertas de retención — Top 3 */}
                <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 4 }}>Ofertas de retención</div>
                  <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 16 }}>Top {ofertas.length} propuestas personalizadas para este cliente</div>

                  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(ofertas.length, 3)}, 1fr)`, gap: 12, marginBottom: 16 }}>
                    {ofertas.slice(0, 3).map((of, idx) => {
                      const sel = ofertaSel?.id === of.id
                      return (
                        <div key={of.id} onClick={() => setOfertaSel(sel ? null : of)}
                          style={{ padding: '16px', border: `2px solid ${sel ? BLUE : '#E5E7EB'}`, borderRadius: 10, cursor: 'pointer', background: sel ? BLUE_LIGHT : 'white', transition: 'all 0.15s', boxShadow: sel ? `0 0 0 3px ${BLUE_LIGHT}` : 'none', position: 'relative' }}>
                          {idx === 0 && (
                            <div style={{ position: 'absolute', top: -8, left: '50%', transform: 'translateX(-50%)', fontSize: 10, padding: '2px 10px', borderRadius: 10, background: BLUE, color: 'white', fontWeight: 700, whiteSpace: 'nowrap' }}>
                              ⭐ Recomendada
                            </div>
                          )}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8, marginTop: idx === 0 ? 6 : 0 }}>
                            <span style={{ fontSize: 20 }}>{of.tipo === 'descuento' ? '💰' : '⬆️'}</span>
                            <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: of.tipo === 'descuento' ? '#DCFCE7' : '#F5F3FF', color: of.tipo === 'descuento' ? '#166534' : '#7C3AED', fontWeight: 700 }}>
                              {of.tipo === 'descuento' ? 'Descuento' : 'Mejora'}
                            </span>
                          </div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: sel ? BLUE : '#111827', marginBottom: 6 }}>{of.titulo}</div>
                          <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 8, lineHeight: 1.5 }}>{of.descripcion}</div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#16A34A' }}>{of.detalle}</div>
                          {sel && <div style={{ marginTop: 8, fontSize: 12, fontWeight: 700, color: BLUE }}>✓ Seleccionada</div>}
                        </div>
                      )
                    })}
                  </div>

                  <div style={{ display: 'flex', gap: 10 }}>
                    {ofertaSel && (
                      <button onClick={aceptarOferta} disabled={procesando}
                        style={{ flex: 1, padding: '12px', background: '#16A34A', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                        {procesando ? '⏳ Procesando...' : '✓ Cliente acepta — confirmar con OTP'}
                      </button>
                    )}
                    <button onClick={() => setPaso('seleccion_baja')}
                      style={{ flex: ofertaSel ? 0 : 1, padding: '12px 20px', background: '#FEF2F2', color: '#991B1B', border: '1.5px solid #FECACA', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                      Cliente rechaza → Gestionar baja
                    </button>
                  </div>

                  {/* MLP */}
                  {ofertaSel && (
                    <div style={{ marginTop: 10 }}>
                      <button onClick={() => { setMlpEmail(clienteActivo.email || ''); setMostrarMLP(true) }}
                        style={{ width: '100%', padding: '10px', border: `1.5px solid ${BLUE_BORDER}`, borderRadius: 8, background: BLUE_LIGHT, color: BLUE, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                        📄 Me lo pienso (MLP) — Enviar propuesta al cliente
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* ── PASO 2: SELECCIÓN DE BAJA ── */}
            {paso === 'seleccion_baja' && (
              <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 4 }}>
                  ¿Qué productos quiere dar de baja?
                  {productosBaja.size > 0 && <span style={{ marginLeft: 8, fontSize: 11, padding: '2px 8px', borderRadius: 10, background: '#FEE2E2', color: '#991B1B', fontWeight: 600 }}>{productosBaja.size} seleccionados</span>}
                </div>
                <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 16 }}>
                  Selecciona los productos. El sistema calculará automáticamente el reposicionamiento.
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                  {clienteActivo.productos.map(p => {
                    const sel = productosBaja.has(p.id)
                    return (
                      <div key={p.id} onClick={() => toggleProductoBaja(p.id)}
                        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', border: `2px solid ${sel ? '#FECACA' : '#E5E7EB'}`, borderRadius: 10, cursor: 'pointer', background: sel ? '#FEF2F2' : 'white', transition: 'all 0.1s' }}>
                        <div style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${sel ? '#EF4444' : '#D1D5DB'}`, background: sel ? '#EF4444' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {sel && <span style={{ fontSize: 10, color: 'white', fontWeight: 700 }}>✕</span>}
                        </div>
                        <span style={{ fontSize: 16, flexShrink: 0 }}>{p.tipo === 'fibra' ? '📡' : p.tipo === 'tv' ? '📺' : p.tipo === 'movil' ? '📱' : '☎️'}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: sel ? '#991B1B' : '#111827', textDecoration: sel ? 'line-through' : 'none' }}>{p.nombre}</div>
                          {p.direccion && <div style={{ fontSize: 11, color: '#9CA3AF' }}>{p.direccion}</div>}
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          {p.precio !== undefined && p.precio > 0 && (
                            <div style={{ fontSize: 13, fontWeight: 700, color: sel ? '#EF4444' : '#111827' }}>{p.precio.toFixed(2)}€</div>
                          )}
                          <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 8, background: p.estado === 'activa' ? '#DCFCE7' : '#FEE2E2', color: p.estado === 'activa' ? '#166534' : '#991B1B', fontWeight: 600 }}>
                            {p.estado}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Preview parque tras baja */}
                {productosBaja.size > 0 && (
                  <div style={{ padding: '12px 16px', background: esBajaTotal ? '#FEF2F2' : '#FFFBEB', border: `1px solid ${esBajaTotal ? '#FECACA' : '#FCD34D'}`, borderRadius: 10, marginBottom: 16 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: esBajaTotal ? '#991B1B' : '#92400E', marginBottom: 6 }}>
                      {esBajaTotal ? '⚠ Baja total — el cliente pierde todos los servicios' : '📋 Tras la baja el cliente mantiene:'}
                    </div>
                    {!esBajaTotal && clienteActivo.productos.filter(p => !productosBaja.has(p.id)).map(p => (
                      <div key={p.id} style={{ fontSize: 13, color: '#92400E', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                        <span style={{ color: '#16A34A' }}>✓</span> {p.nombre}
                      </div>
                    ))}
                    <div style={{ fontSize: 12, fontWeight: 600, color: esBajaTotal ? '#991B1B' : '#92400E', marginTop: 6, borderTop: '1px solid', borderColor: esBajaTotal ? '#FECACA' : '#FCD34D', paddingTop: 6 }}>
                      {esBajaTotal
                        ? 'No hay reposicionamiento posible'
                        : `Reposicionamiento sugerido: ${parqueTrasCalc.tipo === 'solo_fibra' ? 'Fibra sola' : parqueTrasCalc.tipo === 'convergente' ? `Convergente ${parqueTrasCalc.lineas} línea/s` : 'Solo móvil'}`
                      }
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => setPaso('retencion')}
                    style={{ padding: '10px 20px', border: '1.5px solid #E5E7EB', borderRadius: 8, background: 'white', fontSize: 13, cursor: 'pointer', color: '#6B7280' }}>
                    ← Atrás
                  </button>
                  <button onClick={() => { setPaso('reposicion'); buscarReposicion() }} disabled={productosBaja.size === 0}
                    style={{ flex: 1, padding: '12px', background: productosBaja.size > 0 ? BLUE : '#9CA3AF', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: productosBaja.size > 0 ? 'pointer' : 'not-allowed' }}>
                    Continuar → {esBajaTotal ? 'Confirmar baja total' : 'Ver reposicionamiento'}
                  </button>
                </div>
              </div>
            )}

            {/* ── PASO 3: REPOSICIONAMIENTO ── */}
            {paso === 'reposicion' && (
              <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 4 }}>Reposicionamiento tras la baja</div>
                <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 16 }}>
                  {esBajaTotal ? 'Baja total — sin reposicionamiento posible' : `Bundles compatibles con el parque resultante (${parqueTrasCalc.tipo === 'solo_fibra' ? 'Fibra sola' : parqueTrasCalc.tipo === 'convergente' ? `${parqueTrasCalc.lineas} línea/s + fibra` : 'Sin fibra'})`}
                </div>

                {esBajaTotal ? (
                  <div style={{ padding: '14px 16px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, marginBottom: 16 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#991B1B', marginBottom: 4 }}>⚠ Baja total</div>
                    <div style={{ fontSize: 13, color: '#991B1B' }}>El cliente perderá todos sus servicios. No hay bundle compatible que ofrecer.</div>
                  </div>
                ) : (
                  <>
                    {/* NBA en reposición */}
                    {resultados.length > 0 && (() => {
                      const nba = resultados.find(r => r.matchTipo === 'exacto') || resultados[0]
                      const delta = nba.bundle.precio - totalParque
                      return (
                        <div style={{ marginBottom: 16, padding: '14px 16px', background: BLUE_LIGHT, border: `1.5px solid ${BLUE_BORDER}`, borderRadius: 10 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                            <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: BLUE, color: 'white', fontWeight: 700 }}>⭐ NBA Recomendado</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <div style={{ fontSize: 14, fontWeight: 700, color: BLUE }}>{nba.bundle.nombre}</div>
                              <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{nba.bundle.descripcion}</div>
                              <div style={{ fontSize: 12, color: '#374151', fontStyle: 'italic', marginTop: 4 }}>
                                💬 "Solución óptima para mantener los servicios esenciales del cliente con menor impacto económico"
                              </div>
                            </div>
                            <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 16 }}>
                              <div style={{ fontSize: 20, fontWeight: 700, color: BLUE }}>{(nba.bundle.precio * 1.21).toFixed(0)}€/mes</div>
                              <div style={{ fontSize: 12, fontWeight: 600, color: delta < 0 ? '#16A34A' : '#EF4444' }}>
                                {delta < 0 ? `↓ Ahorra ${Math.abs(delta * 1.21).toFixed(2)}€/mes` : `↑ +${(delta * 1.21).toFixed(2)}€/mes`}
                              </div>
                              <button onClick={() => setBundleSel(nba.bundle)}
                                style={{ marginTop: 6, padding: '6px 14px', background: BLUE, color: 'white', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                                Seleccionar
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })()}

                    {buscado && resultados.length === 0 && (
                      <div style={{ textAlign: 'center', padding: '24px', color: '#9CA3AF', fontSize: 13 }}>
                        <div style={{ fontSize: 28, marginBottom: 8 }}>🔍</div>
                        No hay bundles para el parque resultante
                      </div>
                    )}

                    {resultados.length > 0 && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10, marginBottom: 14 }}>
                        {resultados.map(r => {
                          const mc = matchColor(r.matchTipo)
                          const sel = bundleSel?.id === r.bundle.id
                          const delta = r.bundle.precio - totalParque
                          return (
                            <div key={r.bundle.id} onClick={() => setBundleSel(sel ? null : r.bundle)}
                              style={{ padding: '14px', border: `2px solid ${sel ? BLUE : '#E5E7EB'}`, borderRadius: 10, cursor: 'pointer', background: sel ? BLUE_LIGHT : 'white', transition: 'all 0.1s' }}>
                              <div style={{ fontSize: 13, fontWeight: 700, color: sel ? BLUE : '#111827', marginBottom: 4 }}>{r.bundle.nombre}</div>
                              <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 8 }}>{r.bundle.descripcion}</div>
                              <div style={{ fontSize: 18, fontWeight: 700, color: '#111827', marginBottom: 4 }}>{(r.bundle.precio * 1.21).toFixed(0)}€/mes</div>
                              <div style={{ fontSize: 11, fontWeight: 600, color: delta < 0 ? '#16A34A' : '#EF4444', marginBottom: 8 }}>
                                {delta < 0 ? '↓' : '↑'} {Math.abs(delta * 1.21).toFixed(2)}€/mes vs actual
                              </div>
                              <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: mc.bg, border: `1px solid ${mc.border}`, color: mc.color, fontWeight: 600 }}>{mc.label}</span>
                              {sel && <div style={{ marginTop: 8, fontSize: 12, fontWeight: 700, color: BLUE }}>✓ Seleccionado</div>}
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {/* Add-ons TV */}
                    {bundleSel && bundleSel.categoria !== 'fibra_sola' && (
                      <div style={{ marginBottom: 14 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 10 }}>📺 Televisión (opcional)</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {catalogoAddonsTV.map(a => {
                            const sel = addonsTVSel.has(a.id)
                            return (
                              <div key={a.id} onClick={() => toggleAddonTV(a.id)}
                                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', border: `1.5px solid ${sel ? BLUE : '#E5E7EB'}`, borderRadius: 8, cursor: 'pointer', background: sel ? BLUE_LIGHT : 'white' }}>
                                <div>
                                  <div style={{ fontSize: 13, fontWeight: sel ? 600 : 400, color: sel ? BLUE : '#111827' }}>{a.nombre}</div>
                                  <div style={{ fontSize: 11, color: '#9CA3AF' }}>{a.canales.slice(0, 3).join(' · ')}</div>
                                </div>
                                <span style={{ fontSize: 13, fontWeight: 700, color: sel ? BLUE : '#374151' }}>+{a.precio}€/mes</span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </>
                )}

                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => setPaso('seleccion_baja')}
                    style={{ padding: '10px 20px', border: '1.5px solid #E5E7EB', borderRadius: 8, background: 'white', fontSize: 13, cursor: 'pointer', color: '#6B7280' }}>
                    ← Atrás
                  </button>
                  <button onClick={() => setPaso('firma')} disabled={!esBajaTotal && !bundleSel}
                    style={{ flex: 1, padding: '12px', background: (esBajaTotal || bundleSel) ? BLUE : '#9CA3AF', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: (esBajaTotal || bundleSel) ? 'pointer' : 'not-allowed' }}>
                    Continuar → Resumen y firma
                  </button>
                </div>
              </div>
            )}

            {/* ── PASO 4: FIRMA ── */}
            {paso === 'firma' && (
              <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 16 }}>Resumen y confirmación</div>

                {/* Venta consciente */}
                <div style={{ padding: '14px 16px', background: BLUE_LIGHT, border: `1px solid ${BLUE_BORDER}`, borderRadius: 10, marginBottom: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: BLUE, marginBottom: 10 }}>💬 Venta consciente — repasa con el cliente</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, color: '#374151' }}>
                    <div>✓ Productos que se dan de baja: <strong>{clienteActivo.productos.filter(p => productosBaja.has(p.id)).map(p => p.nombre).join(', ')}</strong></div>
                    {!esBajaTotal && bundleSel && (
                      <>
                        <div>✓ Nueva tarifa: <strong>{bundleSel.nombre}</strong> — <strong>{(precioNuevo * 1.21).toFixed(2)}€/mes con IVA</strong></div>
                        <div>✓ {totalParque > precioNuevo ? `Ahorro de ${((totalParque - precioNuevo) * 1.21).toFixed(2)}€/mes respecto a la tarifa actual` : `Diferencia de ${((precioNuevo - totalParque) * 1.21).toFixed(2)}€/mes respecto a la tarifa actual`}</div>
                      </>
                    )}
                    {esBajaTotal && <div>⚠ Baja total — el cliente perderá todos sus servicios.</div>}
                  </div>
                </div>

                {/* Resumen */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#EF4444', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Productos que se dan de baja:</div>
                  {clienteActivo.productos.filter(p => productosBaja.has(p.id)).map(p => (
                    <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '6px 10px', background: '#FEF2F2', borderRadius: 6 }}>
                      <span style={{ color: '#991B1B' }}>✕ {p.nombre}</span>
                      {p.precio ? <span style={{ color: '#991B1B', fontWeight: 600 }}>{p.precio.toFixed(2)}€</span> : null}
                    </div>
                  ))}
                  {!esBajaTotal && bundleSel && (
                    <>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#16A34A', marginTop: 8, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nueva tarifa:</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '6px 10px', background: '#F0FDF4', borderRadius: 6 }}>
                        <span style={{ color: '#166534', fontWeight: 600 }}>{bundleSel.nombre}</span>
                        <span style={{ color: '#166534', fontWeight: 700 }}>{(precioNuevo * 1.21).toFixed(2)}€/mes</span>
                      </div>
                      {addonsTVSel.size > 0 && (
                        <div style={{ fontSize: 12, color: '#6B7280', paddingLeft: 10 }}>
                          + {catalogoAddonsTV.filter(a => addonsTVSel.has(a.id)).map(a => a.nombre).join(' · ')}
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => setPaso('reposicion')}
                    style={{ padding: '10px 20px', border: '1.5px solid #E5E7EB', borderRadius: 8, background: 'white', fontSize: 13, cursor: 'pointer', color: '#6B7280' }}>
                    ← Atrás
                  </button>
                  <button onClick={confirmarBaja} disabled={firmando}
                    style={{ flex: 1, padding: '12px', background: '#EF4444', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    {firmando ? '⏳ Procesando...' : `🔐 Confirmar baja${!esBajaTotal && bundleSel ? ' + nueva tarifa' : ''} con OTP`}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Panel derecho */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Parque actual */}
            <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 12, padding: '16px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 12 }}>Parque actual</div>
              {clienteActivo.productos.map(p => (
                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #F3F4F6', opacity: productosBaja.has(p.id) ? 0.4 : 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {productosBaja.has(p.id) && <span style={{ fontSize: 10, color: '#EF4444', fontWeight: 700 }}>✕</span>}
                    <span style={{ fontSize: 13, color: '#374151', textDecoration: productosBaja.has(p.id) ? 'line-through' : 'none' }}>{p.nombre}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    {p.precio !== undefined && p.precio > 0 && (
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#111827' }}>{p.precio.toFixed(2)}€</span>
                    )}
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.estado === 'activa' ? '#16A34A' : '#EF4444' }} />
                  </div>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 700, marginTop: 10, paddingTop: 10, borderTop: '2px solid #E5E7EB' }}>
                <span>Total actual</span>
                <span style={{ color: BLUE }}>{(totalParque * 1.21).toFixed(2)}€/mes</span>
              </div>
            </div>

            {/* Factura de transición */}
            {bundleSel && !esBajaTotal && (
              <div style={{ background: BLUE_LIGHT, border: `1px solid ${BLUE_BORDER}`, borderRadius: 12, padding: '16px 20px' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: BLUE, marginBottom: 12 }}>Factura de transición</div>
                {[
                  { label: 'Tarifa actual', val: `${(totalParque * 1.21).toFixed(2)}€`, color: '#374151' },
                  { label: 'Nueva tarifa', val: `${(precioNuevo * 1.21).toFixed(2)}€`, color: BLUE },
                  { label: totalParque > precioNuevo ? 'Ahorro mensual' : 'Incremento', val: `${Math.abs((totalParque - precioNuevo) * 1.21).toFixed(2)}€/mes`, color: totalParque > precioNuevo ? '#16A34A' : '#EF4444' },
                ].map(row => (
                  <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '4px 0', borderBottom: '1px solid #E0E7FF' }}>
                    <span style={{ color: '#6B7280' }}>{row.label}</span>
                    <span style={{ fontWeight: 700, color: row.color }}>{row.val}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Indicadores */}
            <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 12, padding: '16px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 12 }}>Indicadores</div>
              {[
                { label: 'Satisfacción', val: clienteActivo.satisfaccionRiesgo, color: clienteActivo.satisfaccionRiesgo === 'ok' ? '#16A34A' : clienteActivo.satisfaccionRiesgo === 'en_riesgo' ? '#D97706' : '#EF4444', bg: clienteActivo.satisfaccionRiesgo === 'ok' ? '#DCFCE7' : clienteActivo.satisfaccionRiesgo === 'en_riesgo' ? '#FEF3C7' : '#FEE2E2' },
                { label: 'Riesgo scoring', val: clienteActivo.riesgoScore, color: clienteActivo.riesgoScore === 'bajo' ? '#16A34A' : clienteActivo.riesgoScore === 'medio' ? '#D97706' : '#EF4444', bg: clienteActivo.riesgoScore === 'bajo' ? '#DCFCE7' : clienteActivo.riesgoScore === 'medio' ? '#FEF3C7' : '#FEE2E2' },
                { label: 'Sin resolver', val: `${clienteActivo.historial.filter(h => !h.resuelto).length} llamadas`, color: clienteActivo.historial.filter(h => !h.resuelto).length > 2 ? '#EF4444' : '#16A34A', bg: clienteActivo.historial.filter(h => !h.resuelto).length > 2 ? '#FEE2E2' : '#DCFCE7' },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #F3F4F6' }}>
                  <span style={{ fontSize: 12, color: '#6B7280' }}>{row.label}</span>
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 8, background: row.bg, color: row.color, fontWeight: 600 }}>{row.val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal MLP */}
      {mostrarMLP && ofertaSel && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', borderRadius: 12, padding: '24px', width: 420, boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700 }}>Me lo pienso (MLP)</div>
                <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>Guardar propuesta y enviar al cliente</div>
              </div>
              <button onClick={() => setMostrarMLP(false)} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#9CA3AF' }}>✕</button>
            </div>

            <div style={{ padding: '12px 14px', background: BLUE_LIGHT, border: `1px solid ${BLUE_BORDER}`, borderRadius: 8, marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: BLUE, marginBottom: 4 }}>{ofertaSel.titulo}</div>
              <div style={{ fontSize: 12, color: '#374151' }}>{ofertaSel.descripcion}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#16A34A', marginTop: 4 }}>{ofertaSel.detalle}</div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 8 }}>Enviar propuesta a</div>
              <input className="input" style={{ height: 44 }} placeholder="Email del cliente"
                value={mlpEmail} onChange={e => setMlpEmail(e.target.value)} />
            </div>

            {mlpEnviado ? (
              <div style={{ padding: '12px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 8, fontSize: 13, color: '#166534', fontWeight: 600, textAlign: 'center' }}>
                ✓ Propuesta enviada · Válida 48h · El cliente recibirá el resumen en {mlpEmail}
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => { setMlpEnviado(true); setTimeout(() => { setMostrarMLP(false); setMlpEnviado(false) }, 2500) }}
                  disabled={!mlpEmail.trim()}
                  style={{ flex: 1, padding: '12px', background: mlpEmail.trim() ? BLUE : '#9CA3AF', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: mlpEmail.trim() ? 'pointer' : 'not-allowed' }}>
                  📧 Enviar por email
                </button>
                <button onClick={() => setMostrarMLP(false)}
                  style={{ padding: '12px 20px', border: '1.5px solid #E5E7EB', borderRadius: 8, background: 'white', fontSize: 13, cursor: 'pointer', color: '#6B7280' }}>
                  Cancelar
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}