import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { datosCliente, consumosPorCliente } from '../../data/mockData'

type Consumo = {
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
}

const labelCategoria: Record<string, string> = {
  roaming:  'Roaming',
  '900_800':'Números 900/800',
  emocion:  'Emoción / Pagos externos',
  otros:    'Otros consumos',
}
const iconoCategoria: Record<string, string> = {
  roaming: '✈️', '900_800': '📞', emocion: '💳', otros: '🔹',
}
const colorCategoria = (cat: string) => ({
  roaming:   { bg: 'var(--color-amber-light)',  border: 'var(--color-amber-border)',  color: 'var(--color-amber-dark)' },
  '900_800': { bg: 'var(--color-blue-light)',   border: 'var(--color-blue-mid)',      color: 'var(--color-blue-dark)' },
  emocion:   { bg: 'var(--color-purple-light)', border: 'var(--color-purple-border)', color: 'var(--color-purple)' },
  otros:     { bg: 'var(--color-background-secondary)', border: 'var(--color-border-secondary)', color: 'var(--color-text-secondary)' },
}[cat] || { bg: 'var(--color-background-secondary)', border: 'var(--color-border-secondary)', color: 'var(--color-text-secondary)' })

// Mini sparkline de barras inline SVG
function Sparkline({ valores, color = '#0052CC' }: { valores: number[]; color?: string }) {
  if (!valores.length) return null
  const max = Math.max(...valores, 0.01)
  const w = 6, gap = 3, h = 24
  const total = valores.length * w + (valores.length - 1) * gap
  return (
    <svg width={total} height={h} style={{ display: 'inline-block', verticalAlign: 'middle' }}>
      {valores.map((v, i) => {
        const barH = Math.max(2, (v / max) * h)
        return (
          <rect
            key={i}
            x={i * (w + gap)}
            y={h - barH}
            width={w}
            height={barH}
            rx={2}
            fill={color}
            opacity={0.7 + 0.3 * (v / max)}
          />
        )
      })}
    </svg>
  )
}

export function ConsumosPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [categoriaActiva, setCategoriaActiva] = useState<string>('todos')
  const [soloAnomalos, setSoloAnomalos] = useState(false)
  const [consumoSel, setConsumoSel] = useState<Consumo | null>(null)
  const [vistaResumen, setVistaResumen] = useState(false)

  // Estados acción reclamación
  const [mostrarFormRec, setMostrarFormRec] = useState(false)
  const [recAbierta, setRecAbierta] = useState(false)
  const [abriendo, setAbriendo] = useState(false)

  // Estados derivación
  const [derivando, setDerivando] = useState(false)
  const [derivado, setDerivado] = useState(false)

  // Bloqueo emoción
  const [bloqueando, setBloqueando] = useState(false)
  const [bloqueado, setBloqueado] = useState(false)

  if (!id) return null
  const datos = datosCliente[id]
  if (!datos) return null

  const consumos: Consumo[] = (consumosPorCliente[id] || []) as Consumo[]

  // Verificar si ya existe reclamación activa para el consumo seleccionado
  const tieneReclamacionActiva = (c: Consumo) => {
    if (!c.facturaId) return false
    return datos.reclamaciones.some(r =>
      r.facturaId === c.facturaId &&
      (r.estado === 'abierta' || r.estado === 'en_gestion')
    )
  }

  const categorias = ['todos', 'roaming', '900_800', 'emocion', 'otros']
  const consumosFiltrados = consumos
    .filter(c => categoriaActiva === 'todos' || c.categoria === categoriaActiva)
    .filter(c => !soloAnomalos || c.anomalo)

  // Sparkline: importe por mes (simulado con datos disponibles)
  const sparklineData = (cat: string) => {
    const base = consumos.filter(c => c.categoria === cat || cat === 'todos')
    const grupos = [0, 0, 0, 0, 0]
    base.forEach((c, i) => { grupos[i % 5] += c.importe })
    return grupos
  }

  // Resumen por categoría
  const resumenCategorias = ['roaming', '900_800', 'emocion', 'otros'].map(cat => {
    const items = consumos.filter(c => c.categoria === cat)
    const total = items.reduce((s, c) => s + c.importe, 0)
    const anomalos = items.filter(c => c.anomalo).length
    return { cat, items, total, anomalos, spark: sparklineData(cat) }
  })

  const abrirReclamacion = () => {
    setAbriendo(true)
    setTimeout(() => {
      setAbriendo(false)
      setRecAbierta(true)
      setMostrarFormRec(false)
    }, 1800)
  }

  const derivar = (destino: string) => {
    console.log('Derivar a', destino)
    setDerivando(true)
    setTimeout(() => { setDerivando(false); setDerivado(true) }, 1500)
  }

  const bloquearEmocion = () => {
    setBloqueando(true)
    setTimeout(() => { setBloqueando(false); setBloqueado(true) }, 1800)
  }

  return (
    <>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>Consumos fuera de tarifa</div>
          <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 2 }}>
            Roaming · Números 900/800 · Emoción · Otros · Facturados y en curso
          </div>
        </div>
        <button
          onClick={() => { setVistaResumen(!vistaResumen); setConsumoSel(null) }}
          className="btn-secondary"
          style={{ fontSize: 11 }}>
          {vistaResumen ? '☰ Vista lista' : '▦ Vista resumen'}
        </button>
      </div>

      {consumos.length === 0 ? (
        <div style={{ background: 'var(--color-background-primary)', border: '1px solid var(--color-border-tertiary)', borderRadius: 'var(--border-radius-lg)', padding: 32, textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: 12 }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>✅</div>
          Sin consumos fuera de tarifa este periodo.
        </div>
      ) : vistaResumen ? (
        /* ─── VISTA RESUMEN ────────────────────────────────── */
        <>
          <div className="grid2" style={{ gap: 10 }}>
            {resumenCategorias.map(({ cat, items, total, anomalos, spark }) => {
              const col = colorCategoria(cat)
              return (
                <div
                  key={cat}
                  className="card"
                  onClick={() => { setVistaResumen(false); setCategoriaActiva(cat) }}
                  style={{ cursor: 'pointer', border: `1.5px solid ${col.border}`, background: col.bg, transition: 'box-shadow 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.10)')}
                  onMouseLeave={e => (e.currentTarget.style.boxShadow = '')}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: col.color, marginBottom: 4 }}>
                        {iconoCategoria[cat]} {labelCategoria[cat]}
                      </div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: col.color }}>
                        {total.toFixed(2)} €
                      </div>
                      <div style={{ fontSize: 10, color: col.color, opacity: 0.75, marginTop: 2 }}>
                        {items.length} consumos{anomalos > 0 ? ` · ${anomalos} anómalos` : ''}
                      </div>
                    </div>
                    <Sparkline valores={spark} color={col.color.startsWith('var') ? '#0052CC' : col.color} />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Consumo por línea */}
          <div className="card">
            <div className="card-title">Consumo por línea</div>
            {datos.lineasMovil.map(linea => {
              const totalLinea = consumos.filter(c => c.linea === linea.numero).reduce((s, c) => s + c.importe, 0)
              return (
                <div key={linea.id} className="table-row">
                  <span className="table-row-label">{linea.numero} — {linea.tarifa}</span>
                  <span className="table-row-value" style={{ fontWeight: totalLinea > 0 ? 700 : 400, color: totalLinea > 10 ? 'var(--color-red)' : undefined }}>
                    {totalLinea.toFixed(2)} €
                  </span>
                </div>
              )
            })}
          </div>
        </>
      ) : (
        /* ─── VISTA LISTA ──────────────────────────────────── */
        <>
          {/* Filtros */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
            {categorias.map(cat => (
              <button
                key={cat}
                onClick={() => { setCategoriaActiva(cat); setConsumoSel(null) }}
                className={categoriaActiva === cat ? 'btn-primary' : 'btn-secondary'}
                style={{ fontSize: 11, padding: '4px 12px' }}>
                {cat === 'todos' ? 'Todos' : `${iconoCategoria[cat]} ${labelCategoria[cat]}`}
              </button>
            ))}
            <label style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
              <input type="checkbox" checked={soloAnomalos} onChange={e => setSoloAnomalos(e.target.checked)} />
              Solo anómalos
            </label>
          </div>

          {consumosFiltrados.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 32, color: 'var(--color-text-tertiary)', fontSize: 12 }}>
              No hay consumos con los filtros seleccionados.
            </div>
          ) : (
            <div className="grid2" style={{ alignItems: 'start' }}>
              {/* Lista */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {consumosFiltrados.map(c => {
                  const col = colorCategoria(c.categoria)
                  const enVuelo = !c.facturado && !c.fechaFin
                  const seleccionado = consumoSel?.id === c.id
                  return (
                    <div
                      key={c.id}
                      onClick={() => { setConsumoSel(c); setMostrarFormRec(false); setRecAbierta(false); setDerivado(false); setBloqueado(false) }}
                      style={{
                        padding: '10px 14px',
                        borderRadius: 'var(--border-radius-md)',
                        border: `1px solid ${seleccionado ? col.border : 'var(--color-border-tertiary)'}`,
                        background: seleccionado ? col.bg : 'var(--color-background-primary)',
                        cursor: 'pointer',
                        borderLeft: `4px solid ${col.border}`,
                        transition: 'all 0.15s',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                            <span style={{ fontSize: 10, fontWeight: 700, color: col.color }}>
                              {iconoCategoria[c.categoria]} {labelCategoria[c.categoria]}
                            </span>
                            {c.anomalo && <span className="pill pill-err" style={{ fontSize: 9 }}>⚠ Anómalo</span>}
                            {enVuelo && (
                              <span className="pill pill-warn" style={{ fontSize: 9, display: 'flex', alignItems: 'center', gap: 3 }}>
                                <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: 'var(--color-amber-dark)', animation: 'pulse 1.5s infinite' }} />
                                EN VUELO
                              </span>
                            )}
                            {tieneReclamacionActiva(c) && <span className="pill pill-blue" style={{ fontSize: 9 }}>📋 Reclamado</span>}
                          </div>
                          <div style={{ fontSize: 12, fontWeight: 500 }}>{c.descripcion}</div>
                          <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', marginTop: 2 }}>
                            {c.linea} · {c.fechaInicio}{c.fechaFin ? ` → ${c.fechaFin}` : ' → en curso'}
                            {c.pais ? ` · ${c.pais}` : ''}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', marginLeft: 12 }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: c.anomalo ? 'var(--color-red)' : 'var(--color-text-primary)' }}>
                            {c.importe.toFixed(2)} €
                          </div>
                          {c.facturaId ? (
                            <button
                              onClick={e => { e.stopPropagation(); navigate(`../${id}/facturas`) }}
                              style={{ fontSize: 9, color: 'var(--color-blue)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginTop: 2, textDecoration: 'underline' }}>
                              Ver factura
                            </button>
                          ) : (
                            <div style={{ fontSize: 9, color: 'var(--color-text-tertiary)', marginTop: 2 }}>No facturado</div>
                          )}
                          {/* RF-17 — Apertura reclamación desde consumo con precarga */}
                          {(c.descripcion.toLowerCase().includes('roaming') ||
                            c.descripcion.toLowerCase().includes('900') ||
                            c.descripcion.toLowerCase().includes('800') ||
                            c.importe > 5) && (
                            <button
                              onClick={e => { e.stopPropagation(); navigate(`/cliente/${id}/reclamaciones`, {
                                state: {
                                  abrirFormulario: true,
                                  facturaId: c.facturaId,
                                  importe: c.importe,
                                  motivo: `Reclamación consumo: ${c.descripcion}`,
                                  tipoPredef: c.descripcion.toLowerCase().includes('roaming') ? 'roaming' :
                                              c.descripcion.toLowerCase().includes('900') || c.descripcion.toLowerCase().includes('800') ? '900/800' : 'consumo',
                                  desdeConsumo: true,
                                }
                              })}}
                              style={{ fontSize: 9, padding: '2px 6px', borderRadius: 'var(--border-radius-full)', border: '1px solid var(--color-red-border)', background: 'var(--color-red-light)', color: 'var(--color-red-dark)', cursor: 'pointer', fontWeight: 600, marginTop: 4, display: 'block' }}>
                              Reclamar →
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Panel detalle */}
              {consumoSel ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

                  {/* Ficha */}
                  <div className="card">
                    <div className="card-title">
                      {iconoCategoria[consumoSel.categoria]} {labelCategoria[consumoSel.categoria]}
                      {consumoSel.anomalo && <span className="pill pill-err">Anómalo</span>}
                    </div>
                    {[
                      { label: 'Descripción', val: consumoSel.descripcion },
                      { label: 'Línea', val: consumoSel.linea },
                      { label: 'Inicio', val: consumoSel.fechaInicio },
                      { label: 'Fin', val: consumoSel.fechaFin || 'En curso' },
                      ...(consumoSel.pais ? [{ label: 'País', val: consumoSel.pais }] : []),
                      { label: 'Importe', val: `${consumoSel.importe.toFixed(2)} €` },
                      { label: 'Facturado', val: consumoSel.facturado ? 'Sí' : 'No (en vuelo)' },
                    ].map(row => (
                      <div key={row.label} className="table-row">
                        <span className="table-row-label">{row.label}</span>
                        <span className="table-row-value">{row.val}</span>
                      </div>
                    ))}
                  </div>

                  {/* Diagnóstico automático */}
                  {consumoSel.anomalo && (
                    <div className="card" style={{ background: 'var(--color-red-light)', border: '1px solid var(--color-red-border)' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-red)', marginBottom: 6 }}>⚠ Diagnóstico automático</div>
                      <div style={{ fontSize: 11, color: 'var(--color-red)', lineHeight: 1.6 }}>
                        {consumoSel.categoria === 'roaming'
                          ? 'Cargo de roaming superior al histórico del cliente. Posible uso no autorizado o error de red visitada.'
                          : consumoSel.categoria === 'emocion'
                            ? 'Cargo de emoción detectado. Puede ser una compra accidental o suscripción no reconocida por el cliente.'
                            : 'Cargo anómalo detectado. Revisar con el cliente si reconoce el consumo.'}
                      </div>
                    </div>
                  )}

                  {/* Gestionar */}
                  <div className="card">
                    <div className="card-title">Gestionar consumo</div>

                    {/* Bloquear servicio emoción */}
                    {consumoSel.categoria === 'emocion' && (
                      <div style={{ marginBottom: 10, padding: '10px 12px', background: 'var(--color-purple-light)', border: '1px solid var(--color-purple-border)', borderRadius: 'var(--border-radius-md)' }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-purple)', marginBottom: 8 }}>🔒 Bloqueo de servicio de emoción</div>
                        {bloqueado ? (
                          <div className="alert alert-ok" style={{ margin: 0 }}>
                            <span>✓</span>
                            <span>Servicio de emoción bloqueado correctamente para esta línea</span>
                          </div>
                        ) : (
                          <button
                            onClick={bloquearEmocion}
                            disabled={bloqueando}
                            className="btn-secondary"
                            style={{ width: '100%', justifyContent: 'center', fontSize: 11 }}>
                            {bloqueando ? <><span className="spinner spinner-sm" /> Bloqueando...</> : '🔒 Bloquear servicio de emoción'}
                          </button>
                        )}
                      </div>
                    )}

                    {/* Reclamación */}
                    {recAbierta ? (
                      <div className="alert alert-ok" style={{ margin: 0 }}>
                        <span>✓</span>
                        <span style={{ fontWeight: 600 }}>Reclamación abierta correctamente</span>
                      </div>
                    ) : tieneReclamacionActiva(consumoSel) ? (
                      <div className="alert alert-warn" style={{ margin: 0 }}>
                        <span>⚠</span>
                        <span>Ya existe una reclamación activa para esta factura. No se puede abrir otra.</span>
                      </div>
                    ) : mostrarFormRec ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 4 }}>Nueva reclamación por consumo</div>
                        <div className="table-row">
                          <span className="table-row-label">Importe reclamado</span>
                          <span className="table-row-value" style={{ fontWeight: 700 }}>{consumoSel.importe.toFixed(2)} €</span>
                        </div>
                        <div className="table-row">
                          <span className="table-row-label">Motivo</span>
                          <span className="table-row-value">{labelCategoria[consumoSel.categoria]} — no reconocido</span>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={() => setMostrarFormRec(false)} className="btn-secondary" style={{ flex: 1, justifyContent: 'center', fontSize: 11 }}>Cancelar</button>
                          <button onClick={abrirReclamacion} disabled={abriendo} className="btn-primary" style={{ flex: 1, justifyContent: 'center', fontSize: 11 }}>
                            {abriendo ? <><span className="spinner spinner-sm" /> Abriendo...</> : 'Confirmar reclamación'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <button onClick={() => setMostrarFormRec(true)} className="btn-secondary" style={{ justifyContent: 'center', fontSize: 11 }}>
                          📋 Abrir reclamación por este consumo
                        </button>
                        {derivado ? (
                          <div className="alert alert-ok" style={{ margin: 0 }}>
                            <span>✓</span>
                            <span>Derivado correctamente</span>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button onClick={() => derivar('fraude')} disabled={derivando} className="btn-secondary" style={{ flex: 1, justifyContent: 'center', fontSize: 11 }}>
                              {derivando ? <span className="spinner spinner-sm" /> : '🔍 Derivar a Fraude'}
                            </button>
                            <button onClick={() => derivar('cobros')} disabled={derivando} className="btn-secondary" style={{ flex: 1, justifyContent: 'center', fontSize: 11 }}>
                              {derivando ? <span className="spinner spinner-sm" /> : '💰 Derivar a Cobros'}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div style={{ padding: 32, textAlign: 'center', color: 'var(--color-text-tertiary)', fontSize: 12, background: 'var(--color-background-secondary)', borderRadius: 'var(--border-radius-lg)', border: '1px dashed var(--color-border-secondary)' }}>
                  Selecciona un consumo para ver el detalle y opciones de gestión
                </div>
              )}
            </div>
          )}
        </>
      )}
    </>
  )
}
