import { useState } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { catalogoBundles, catalogoAddonsTV, buscarBundles } from '../../data/mockData'
import type { Bundle, ResultadoBusquedaBundle, Producto } from '../../types'

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
  { id: 'precio',      label: 'Precio elevado',            keywords: ['precio', 'caro', 'econom', 'dinero'] },
  { id: 'competencia', label: 'Oferta de competencia',     keywords: ['cambio', 'operador', 'competen', 'otra'] },
  { id: 'no_uso',      label: 'No usa los servicios',      keywords: ['no uso', 'no necesito', 'poco uso'] },
  { id: 'tecnico',     label: 'Problema técnico',          keywords: ['técnico', 'avería', 'internet', 'caída', 'lento'] },
  { id: 'atencion',    label: 'Mala atención',             keywords: ['atención', 'servicio', 'mal trato'] },
  { id: 'traslado',    label: 'Traslado / Mudanza',        keywords: ['mudanza', 'traslado', 'extranjero', 'me voy'] },
  { id: 'economico',   label: 'Dificultad económica',      keywords: ['económic', 'problema económ', 'paro'] },
  { id: 'otro',        label: 'Otro motivo',               keywords: [] },
]

const argumentario: Record<string, string> = {
  'Precio muy alto': '"Entiendo que el precio es importante. Tenemos opciones para ajustar la tarifa hasta un 20% manteniendo todos tus servicios."',
  'Me cambio de operador': '"Antes de decidirte, ¿puedo mostrarte lo que perderías y una oferta especial por tu fidelidad?"',
  'No uso los servicios': '"Podemos revisar tu tarifa y ajustarla exactamente a lo que usas, sin pagar por lo que no necesitas."',
  'Mal servicio técnico': '"Lamentamos los problemas. Quiero asegurarme de que quede resuelto hoy mismo antes de hablar de cualquier cambio."',
  'Mal servicio al cliente': '"Entendemos tu frustración y queremos mejorar tu experiencia. ¿Puedo compensarte por las molestias?"',
  'Problemas económicos': '"Podemos estudiar un fraccionamiento o una tarifa más económica que se adapte mejor a tu situación."',
}

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

  if (!clienteActivo) return null

  const toggleMotivo = (m: string) => {
    const s = new Set(motivosSel)
    if (s.has(m)) s.delete(m); else s.add(m)
    setMotivosSel(s)
  }

  const toggleProductoBaja = (pid: string) => {
    const s = new Set(productosBaja)
    if (s.has(pid)) s.delete(pid); else s.add(pid)
    setProductosBaja(s)
  }

  const toggleAddonTV = (id: string) => {
    const s = new Set(addonsTVSel)
    if (s.has(id)) s.delete(id); else s.add(id)
    setAddonsTVSel(s)
  }

  // Calcular qué queda tras la baja y qué bundle ofrecer
  const calcularParqueTrasBaja = () => {
    const productosQueQuedan = clienteActivo.productos.filter(p => !productosBaja.has(p.id))
    const tieneFibra = productosQueQuedan.some(p => p.tipo === 'fibra')
    const lineasMovil = productosQueQuedan.filter(p => p.tipo === 'movil')
    const numLineas = lineasMovil.length

    // Determinar qué bundle buscar según lo que queda
    if (!tieneFibra && numLineas === 0) return { tipo: 'baja_total', fibra: null, lineas: 0 }
    if (!tieneFibra && numLineas > 0) return { tipo: 'solo_movil', fibra: null, lineas: numLineas }
    if (tieneFibra && numLineas === 0) return { tipo: 'solo_fibra', fibra: 600, lineas: 0 }
    return { tipo: 'convergente', fibra: 600, lineas: numLineas }
  }

  const buscarReposicion = () => {
    const parque = calcularParqueTrasBaja()
    if (parque.tipo === 'baja_total') {
      setResultados([])
      setBuscado(true)
      return
    }
    const res = buscarBundles(parque.fibra, parque.lineas, 'ilimitado')
    setResultados(res)
    setBuscado(true)
    setBundleSel(null)
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

  // Generar ofertas de retención según motivos
  const generarOfertas = (): OfertaRetencion[] => {
    const ofertas: OfertaRetencion[] = []

    // Ofertas de descuento
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

    // Ofertas de mejora de servicio
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

  const matchColor = (tipo: string) => {
    if (tipo === 'exacto') return { bg: 'var(--color-green-light)', border: 'var(--color-green-border)', color: 'var(--color-green-dark)', label: '✓ Exacto' }
    if (tipo === 'aproximado') return { bg: 'var(--color-blue-light)', border: 'var(--color-blue-mid)', color: 'var(--color-blue-dark)', label: '≈ Aproximado' }
    return { bg: 'var(--color-amber-light)', border: 'var(--color-amber-border)', color: 'var(--color-amber-dark)', label: '~ Parcial' }
  }

  const StepTab = ({ id, label, num, active, done }: { id: Paso; label: string; num: number; active: boolean; done: boolean }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      {num > 1 && <div style={{ width: 20, height: 1, background: done ? 'var(--color-green-border)' : 'var(--color-border-secondary)' }} />}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 'var(--border-radius-full)', background: active ? 'var(--color-blue-light)' : 'transparent', border: `1px solid ${active ? 'var(--color-blue-mid)' : 'transparent'}`, cursor: !resultado ? 'pointer' : 'default' }}
        onClick={() => !resultado && setPaso(id)}>
        <div style={{ width: 16, height: 16, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, background: done ? 'var(--color-green-border)' : active ? 'var(--color-blue)' : 'var(--color-background-secondary)', color: done || active ? '#fff' : 'var(--color-text-tertiary)', border: !done && !active ? '1px solid var(--color-border-secondary)' : 'none' }}>
          {done ? '✓' : num}
        </div>
        <span style={{ fontSize: 11, fontWeight: active ? 600 : 400, color: active ? 'var(--color-blue-dark)' : done ? 'var(--color-green)' : 'var(--color-text-tertiary)' }}>{label}</span>
      </div>
    </div>
  )

  return (
    <>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>Retención / Gestión de baja</div>
          <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 2 }}>
            Retención · Selección de baja · Reposicionamiento · Firma
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
          <StepTab id="retencion" label="Retención" num={1} active={paso === 'retencion'} done={paso !== 'retencion' && (!!ofertaSel || motivosSel.size > 0)} />
          <StepTab id="seleccion_baja" label="Selección baja" num={2} active={paso === 'seleccion_baja'} done={paso === 'reposicion' || paso === 'firma'} />
          <StepTab id="reposicion" label="Reposición" num={3} active={paso === 'reposicion'} done={paso === 'firma'} />
          <StepTab id="firma" label="Firma" num={4} active={paso === 'firma'} done={!!resultado} />
        </div>
      </div>

      {/* Resultado final */}
      {resultado && (
        <div className={`alert ${resultado === 'retenido' ? 'alert-ok' : 'alert-err'} fade-in`} style={{ padding: '14px 16px' }}>
          <span style={{ fontSize: 20 }}>{resultado === 'retenido' ? '🎉' : '✓'}</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13 }}>
              {resultado === 'retenido' ? 'Cliente retenido — oferta aceptada y confirmada' : 'Baja tramitada — confirmación enviada al cliente'}
            </div>
            <div style={{ fontSize: 11, marginTop: 3, opacity: 0.85 }}>
              {resultado === 'retenido'
                ? ofertaSel?.tipo === 'descuento'
                  ? `Descuento del ${ofertaSel.valor}% aplicado durante ${ofertaSel.duracionMeses} meses`
                  : `Mejora aplicada: ${ofertaSel?.titulo}`
                : esBajaTotal
                  ? 'Baja total tramitada correctamente'
                  : `Baja parcial tramitada · Nueva tarifa: ${bundleSel?.nombre || 'sin reposición'}`
              }
            </div>
          </div>
        </div>
      )}

      {!resultado && (
        <div className="grid2">
          {/* Panel izquierdo — flujo */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

            {/* ── PASO 1: RETENCIÓN ── */}
            {paso === 'retencion' && (
              <>
                {/* Motivos — RF-09 */}
                <div className="card">
                  <div className="card-title">
                    1. Motivo de contacto
                    {motivosSel.size > 0 && (
                      <span className="badge badge-blue">{motivosSel.size} seleccionado/s</span>
                    )}
                  </div>

                  <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 10 }}>
                    Selecciona el motivo o motivos declarados por el cliente
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: motivosSel.size > 0 ? 12 : 0 }}>
                    {motivosBaja.map(m => (
                      <button key={m} onClick={() => toggleMotivo(m)}
                        style={{ padding: '5px 12px', fontSize: 11, borderRadius: 'var(--border-radius-full)', border: `1.5px solid ${motivosSel.has(m) ? 'var(--color-blue)' : 'var(--color-border-secondary)'}`, background: motivosSel.has(m) ? 'var(--color-blue-light)' : 'var(--color-background-secondary)', color: motivosSel.has(m) ? 'var(--color-blue-dark)' : 'var(--color-text-secondary)', cursor: 'pointer', fontWeight: motivosSel.has(m) ? 600 : 400, transition: 'all 0.1s' }}>
                        {motivosSel.has(m) ? '✓ ' : ''}{m}
                      </button>
                    ))}
                  </div>

                  {motivosSel.size > 0 && (
                    <div className="fade-in" style={{ padding: '8px 10px', borderRadius: 'var(--border-radius-md)', background: 'var(--color-green-light)', border: '1px solid var(--color-green-border)' }}>
                      <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                        Motivo/s estandarizado/s para reporting
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {Array.from(motivosSel).map(m => {
                          const estandar = motivosEstandarizados.find(me =>
                            me.keywords.some(k => m.toLowerCase().includes(k))
                          ) || motivosEstandarizados[motivosEstandarizados.length - 1]
                          return (
                            <span key={m} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 'var(--border-radius-full)', background: 'var(--color-green-border)', color: '#fff', fontWeight: 600 }}>
                              {estandar.label}
                            </span>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Argumentario contextual */}
                {Array.from(motivosSel).filter(m => argumentario[m]).length > 0 && (
                  <div className="card card-blue">
                    <div className="card-title">💬 Argumentario sugerido</div>
                    {Array.from(motivosSel).filter(m => argumentario[m]).map(m => (
                      <div key={m} style={{ fontSize: 11, color: 'var(--color-blue-dark)', lineHeight: 1.6, padding: '6px 8px', background: 'rgba(255,255,255,0.5)', borderRadius: 'var(--border-radius-sm)', marginBottom: 6, fontStyle: 'italic' }}>
                        {argumentario[m]}
                      </div>
                    ))}
                  </div>
                )}

                {/* Ofertas de retención */}
                <div className="card">
                  <div className="card-title">Ofertas de retención disponibles</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                    {ofertas.map(of => (
                      <div key={of.id} onClick={() => setOfertaSel(ofertaSel?.id === of.id ? null : of)}
                        style={{ padding: '10px 12px', border: `1.5px solid ${ofertaSel?.id === of.id ? 'var(--color-blue)' : 'var(--color-border-tertiary)'}`, borderRadius: 'var(--border-radius-lg)', cursor: 'pointer', background: ofertaSel?.id === of.id ? 'var(--color-blue-light)' : 'transparent', transition: 'all 0.1s' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 14 }}>{of.tipo === 'descuento' ? '💰' : '⬆️'}</span>
                            <span style={{ fontSize: 12, fontWeight: 700, color: ofertaSel?.id === of.id ? 'var(--color-blue-dark)' : 'var(--color-text-primary)' }}>{of.titulo}</span>
                          </div>
                          <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 3, background: of.tipo === 'descuento' ? 'var(--color-green-light)' : 'var(--color-purple-light)', color: of.tipo === 'descuento' ? 'var(--color-green-dark)' : 'var(--color-purple)', fontWeight: 700, textTransform: 'uppercase' }}>
                            {of.tipo === 'descuento' ? 'Descuento' : 'Mejora'}
                          </span>
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 3 }}>{of.descripcion}</div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-green-dark)' }}>{of.detalle}</div>
                      </div>
                    ))}
                  </div>

                  {ofertaSel && (
                    <button onClick={aceptarOferta} disabled={procesando} className="btn-success" style={{ width: '100%', justifyContent: 'center', height: 38, fontSize: 13 }}>
                      {procesando ? <><span className="spinner spinner-sm" /> Procesando...</> : '✓ Cliente acepta — confirmar oferta + OTP'}
                    </button>
                  )}

                  <button onClick={() => setPaso('seleccion_baja')}
                    className="btn-danger" style={{ width: '100%', justifyContent: 'center', marginTop: ofertaSel ? 8 : 0, fontSize: 12 }}>
                    Cliente rechaza todas las ofertas → Gestionar baja
                  </button>
                </div>
              </>
            )}

            {/* ── PASO 2: SELECCIÓN DE BAJA ── */}
            {paso === 'seleccion_baja' && (
              <div className="card">
                <div className="card-title">
                  2. ¿Qué productos quiere dar de baja?
                  {productosBaja.size > 0 && <span className="badge badge-err">{productosBaja.size} seleccionados</span>}
                </div>
                <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 12 }}>
                  Selecciona los productos a dar de baja. El sistema calculará automáticamente el reposicionamiento necesario.
                </div>

                {clienteActivo.productos.map(p => {
                  const seleccionado = productosBaja.has(p.id)
                  return (
                    <div key={p.id} onClick={() => toggleProductoBaja(p.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', marginBottom: 6, border: `1.5px solid ${seleccionado ? 'var(--color-red-border)' : 'var(--color-border-tertiary)'}`, borderRadius: 'var(--border-radius-lg)', cursor: 'pointer', background: seleccionado ? 'var(--color-red-light)' : 'transparent', transition: 'all 0.1s' }}>
                      <input type="checkbox" checked={seleccionado} readOnly style={{ cursor: 'pointer', width: 14, height: 14, flexShrink: 0, accentColor: 'var(--color-red-mid)' }} />
                      <span style={{ fontSize: 14, width: 20, textAlign: 'center', flexShrink: 0 }}>
                        {p.tipo === 'fibra' ? '📡' : p.tipo === 'tv' ? '📺' : p.tipo === 'movil' ? '📱' : '☎️'}
                      </span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: seleccionado ? 'var(--color-red-dark)' : 'var(--color-text-primary)' }}>{p.nombre}</div>
                        {p.direccion && <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)' }}>{p.direccion}</div>}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        {p.precio !== undefined && p.precio > 0 && (
                          <div style={{ fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-mono)', color: seleccionado ? 'var(--color-red)' : 'var(--color-text-primary)' }}>{p.precio.toFixed(2)}€</div>
                        )}
                        <span className={`pill ${p.estado === 'activa' ? 'pill-ok' : 'pill-err'}`} style={{ fontSize: 9 }}>{p.estado}</span>
                      </div>
                    </div>
                  )
                })}

                {/* Preview de lo que queda */}
                {productosBaja.size > 0 && (
                  <div style={{ marginTop: 12, padding: '10px 12px', background: esBajaTotal ? 'var(--color-red-light)' : 'var(--color-amber-light)', border: `1px solid ${esBajaTotal ? 'var(--color-red-border)' : 'var(--color-amber-border)'}`, borderRadius: 'var(--border-radius-md)' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: esBajaTotal ? 'var(--color-red-dark)' : 'var(--color-amber-dark)', marginBottom: 4 }}>
                      {esBajaTotal ? '⚠ Baja total — el cliente pierde todos los servicios' : '📋 Tras la baja el cliente mantiene:'}
                    </div>
                    {!esBajaTotal && clienteActivo.productos.filter(p => !productosBaja.has(p.id)).map(p => (
                      <div key={p.id} style={{ fontSize: 11, color: 'var(--color-amber-dark)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span className="status-dot status-dot-ok" style={{ width: 6, height: 6 }} />
                        {p.nombre}
                      </div>
                    ))}
                    <div style={{ fontSize: 11, fontWeight: 600, color: esBajaTotal ? 'var(--color-red-dark)' : 'var(--color-amber-dark)', marginTop: 6 }}>
                      {esBajaTotal
                        ? 'No hay reposicionamiento posible'
                        : `Reposicionamiento sugerido: ${parqueTrasCalc.tipo === 'solo_fibra' ? 'Fibra sola' : parqueTrasCalc.tipo === 'convergente' ? `Convergente ${parqueTrasCalc.lineas} línea/s` : 'Solo móvil'}`
                      }
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button onClick={() => setPaso('retencion')} className="btn-secondary" style={{ fontSize: 11 }}>← Atrás</button>
                  <button
                    onClick={() => { setPaso('reposicion'); buscarReposicion() }}
                    disabled={productosBaja.size === 0}
                    className="btn-primary"
                    style={{ flex: 1, justifyContent: 'center', fontSize: 12 }}>
                    Continuar → {esBajaTotal ? 'Confirmar baja total' : 'Ver reposicionamiento'}
                  </button>
                </div>
              </div>
            )}

            {/* ── PASO 3: REPOSICIONAMIENTO ── */}
            {paso === 'reposicion' && (
              <div className="card">
                <div className="card-title">3. Reposicionamiento tras la baja</div>

                {esBajaTotal ? (
                  <div className="alert alert-err" style={{ marginBottom: 12 }}>
                    <span>⚠</span>
                    <div>
                      <div style={{ fontWeight: 700 }}>Baja total — sin reposicionamiento</div>
                      <div style={{ fontSize: 11, marginTop: 2 }}>El cliente perderá todos sus servicios. No hay bundle compatible que ofrecer.</div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 12 }}>
                      Bundles compatibles con el parque resultante tras la baja
                      <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                        {' '}({parqueTrasCalc.tipo === 'solo_fibra' ? 'Fibra sola' : parqueTrasCalc.tipo === 'convergente' ? `${parqueTrasCalc.lineas} línea/s + fibra` : 'Sin fibra'})
                      </span>
                    </div>

                    {buscado && resultados.length === 0 && (
                      <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--color-text-tertiary)', fontSize: 12 }}>
                        <div style={{ fontSize: 24, marginBottom: 8 }}>🔍</div>
                        No hay bundles para el parque resultante
                      </div>
                    )}

                    {resultados.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                        {resultados.map(r => {
                          const mc = matchColor(r.matchTipo)
                          const isSelected = bundleSel?.id === r.bundle.id
                          const delta = r.bundle.precio - totalParque

                          return (
                            <div key={r.bundle.id} onClick={() => setBundleSel(isSelected ? null : r.bundle)}
                              style={{ padding: '10px 12px', border: `1.5px solid ${isSelected ? 'var(--color-blue)' : 'var(--color-border-tertiary)'}`, borderRadius: 'var(--border-radius-lg)', cursor: 'pointer', background: isSelected ? 'var(--color-blue-light)' : 'transparent', transition: 'all 0.1s' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                <div style={{ fontSize: 12, fontWeight: 700 }}>{r.bundle.nombre}</div>
                                <div style={{ textAlign: 'right' }}>
                                  <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{r.bundle.precio.toFixed(2)}€</div>
                                  <div style={{ fontSize: 10, fontWeight: 600, color: delta < 0 ? 'var(--color-green)' : 'var(--color-red)' }}>
                                    {delta < 0 ? '↓' : '↑'} {Math.abs(delta).toFixed(2)}€/mes vs. actual
                                  </div>
                                </div>
                              </div>
                              <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 6 }}>{r.bundle.descripcion}</div>
                              <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 'var(--border-radius-full)', background: mc.bg, border: `1px solid ${mc.border}`, color: mc.color, fontWeight: 600 }}>{mc.label}</span>
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {/* Add-ons TV */}
                    {bundleSel && bundleSel.categoria !== 'fibra_sola' && (
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 8 }}>📺 TV (opcional)</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {catalogoAddonsTV.map(a => {
                            const sel = addonsTVSel.has(a.id)
                            return (
                              <button key={a.id} onClick={() => toggleAddonTV(a.id)}
                                style={{ padding: '4px 10px', fontSize: 11, borderRadius: 'var(--border-radius-full)', border: `1.5px solid ${sel ? 'var(--color-blue)' : 'var(--color-border-secondary)'}`, background: sel ? 'var(--color-blue-light)' : 'none', color: sel ? 'var(--color-blue-dark)' : 'var(--color-text-secondary)', cursor: 'pointer', fontWeight: sel ? 600 : 400 }}>
                                {a.nombre} +{a.precio}€
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </>
                )}

                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setPaso('seleccion_baja')} className="btn-secondary" style={{ fontSize: 11 }}>← Atrás</button>
                  <button
                    onClick={() => setPaso('firma')}
                    disabled={!esBajaTotal && !bundleSel}
                    className="btn-primary"
                    style={{ flex: 1, justifyContent: 'center', fontSize: 12 }}>
                    Continuar → Resumen y firma
                  </button>
                </div>
              </div>
            )}

            {/* ── PASO 4: FIRMA ── */}
            {paso === 'firma' && (
              <div className="card">
                <div className="card-title">4. Resumen y confirmación</div>

                <div style={{ background: 'var(--color-background-secondary)', borderRadius: 'var(--border-radius-md)', padding: '12px 14px', marginBottom: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Resumen de la gestión</div>

                  <div style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-red-dark)', marginBottom: 4 }}>Productos que se dan de baja:</div>
                    {clienteActivo.productos.filter(p => productosBaja.has(p.id)).map(p => (
                      <div key={p.id} style={{ fontSize: 11, color: 'var(--color-red-dark)', display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
                        <span>✕</span> {p.nombre} {p.precio ? `(${p.precio.toFixed(2)}€)` : ''}
                      </div>
                    ))}
                  </div>

                  {!esBajaTotal && bundleSel && (
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-green-dark)', marginBottom: 4 }}>Nueva tarifa:</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-green-dark)' }}>
                        {bundleSel.nombre} — {(precioNuevo * 1.21).toFixed(2)}€/mes con IVA
                      </div>
                      {addonsTVSel.size > 0 && (
                        <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 2 }}>
                          + {catalogoAddonsTV.filter(a => addonsTVSel.has(a.id)).map(a => a.nombre).join(' · ')}
                        </div>
                      )}
                    </div>
                  )}

                  {esBajaTotal && (
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-red-dark)' }}>
                      Baja total — sin nueva tarifa
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setPaso('reposicion')} className="btn-secondary" style={{ fontSize: 11 }}>← Atrás</button>
                  <button onClick={confirmarBaja} disabled={firmando} className="btn-danger" style={{ flex: 1, justifyContent: 'center', height: 38, fontSize: 13 }}>
                    {firmando
                      ? <><span className="spinner spinner-sm" /> Procesando...</>
                      : `🔐 Confirmar baja${!esBajaTotal && bundleSel ? ' + nueva tarifa' : ''} con OTP`
                    }
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Panel derecho — info cliente */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

            {/* Parque actual */}
            <div className="card">
              <div className="card-title">Parque actual</div>
              {clienteActivo.productos.map(p => (
                <div key={p.id} className="table-row" style={{ opacity: productosBaja.has(p.id) ? 0.4 : 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {productosBaja.has(p.id) && <span style={{ fontSize: 10, color: 'var(--color-red)', fontWeight: 700 }}>✕</span>}
                    <span className="table-row-label" style={{ textDecoration: productosBaja.has(p.id) ? 'line-through' : 'none' }}>{p.nombre}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    {p.precio !== undefined && p.precio > 0 && (
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600 }}>{p.precio.toFixed(2)}€</span>
                    )}
                    <span className={`status-dot ${p.estado === 'activa' ? 'status-dot-ok' : 'status-dot-err'}`} style={{ width: 6, height: 6 }} />
                  </div>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700, marginTop: 8, paddingTop: 8, borderTop: '2px solid var(--color-border-secondary)' }}>
                <span>Total actual</span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>{(totalParque * 1.21).toFixed(2)}€/mes</span>
              </div>
            </div>

            {/* Factura de transición */}
            {bundleSel && !esBajaTotal && (
              <div className="card card-blue">
                <div className="card-title">Factura de transición</div>
                {[
                  { label: 'Tarifa actual', val: `${(totalParque * 1.21).toFixed(2)}€`, color: 'var(--color-text-primary)' },
                  { label: 'Nueva tarifa', val: `${(precioNuevo * 1.21).toFixed(2)}€`, color: 'var(--color-blue-dark)' },
                  {
                    label: totalParque > precioNuevo ? 'Ahorro mensual' : 'Incremento',
                    val: `${Math.abs((totalParque - precioNuevo) * 1.21).toFixed(2)}€/mes`,
                    color: totalParque > precioNuevo ? 'var(--color-green)' : 'var(--color-red)'
                  },
                ].map(row => (
                  <div key={row.label} className="table-row">
                    <span className="table-row-label">{row.label}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: row.color }}>{row.val}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Riesgo */}
            <div className="card">
              <div className="card-title">Indicadores</div>
              {[
                { label: 'Satisfacción', val: clienteActivo.satisfaccionRiesgo, pill: clienteActivo.satisfaccionRiesgo === 'ok' ? 'pill-ok' : clienteActivo.satisfaccionRiesgo === 'en_riesgo' ? 'pill-warn' : 'pill-err' },
                { label: 'Riesgo scoring', val: clienteActivo.riesgoScore, pill: clienteActivo.riesgoScore === 'bajo' ? 'pill-ok' : clienteActivo.riesgoScore === 'medio' ? 'pill-warn' : 'pill-err' },
                { label: 'Sin resolver', val: `${clienteActivo.historial.filter(h => !h.resuelto).length} llamadas`, pill: clienteActivo.historial.filter(h => !h.resuelto).length > 2 ? 'pill-err' : 'pill-ok' },
              ].map(row => (
                <div key={row.label} className="table-row">
                  <span className="table-row-label">{row.label}</span>
                  <span className={`pill ${row.pill}`} style={{ fontSize: 10 }}>{row.val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}