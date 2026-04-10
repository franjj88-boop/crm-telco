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

const labelCategoria = {
  roaming: 'Roaming',
  '900_800': 'Números 900/800',
  emocion: 'Emoción / Pagos externos',
  otros: 'Otros consumos',
}

const iconoCategoria = {
  roaming: '✈',
  '900_800': '📞',
  emocion: '💳',
  otros: '•',
}

const colorCategoria = (cat: string) => ({
  roaming:  { bg: 'var(--color-amber-light)',  border: 'var(--color-amber-border)',  color: 'var(--color-amber-dark)' },
  '900_800':{ bg: 'var(--color-blue-light)',   border: 'var(--color-blue-mid)',      color: 'var(--color-blue-dark)' },
  emocion:  { bg: 'var(--color-purple-light)', border: 'var(--color-purple-border)', color: 'var(--color-purple)' },
  otros:    { bg: 'var(--color-background-secondary)', border: 'var(--color-border-secondary)', color: 'var(--color-text-secondary)' },
}[cat] || { bg: 'var(--color-background-secondary)', border: 'var(--color-border-secondary)', color: 'var(--color-text-secondary)' })

export function ConsumosPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [categoriaActiva, setCategoriaActiva] = useState<string>('todas')
  const [soloAnomalos, setSoloAnomalos] = useState(false)
  const [consumoSel, setConsumoSel] = useState<Consumo | null>(null)
  const [desdeWhen, setDesdeWhen] = useState('')
  const [mostrarFormRec, setMostrarFormRec] = useState(false)
  const [recAbierta, setRecAbierta] = useState(false)
  const [abriendo, setAbriendo] = useState(false)
  const [derivando, setDerivando] = useState(false)
  const [derivado, setDerivado] = useState<string | null>(null)

  if (!id) return null
  const datos = datosCliente[id]
  if (!datos) return null

  const todosConsumos: Consumo[] = consumosPorCliente[id] || []

  const consumosFiltrados = todosConsumos.filter(c => {
    if (categoriaActiva !== 'todas' && c.categoria !== categoriaActiva) return false
    if (soloAnomalos && !c.anomalo) return false
    return true
  })

  const enVuelo = todosConsumos.filter(c => !c.facturado)
  const totalAnomalo = todosConsumos.filter(c => c.anomalo && c.facturado).reduce((a, c) => a + c.importe, 0)

  // Periodos afectados por el consumo seleccionado y "desde cuándo"
  const periodosAfectados = (() => {
    if (!consumoSel || !desdeWhen) return []
    const facturasCliente = datos.facturas || []
    // Arrastramos todas las facturas desde el periodo indicado hasta hoy
    const mesesMap: Record<string, string> = {
      'ene': '01', 'feb': '02', 'mar': '03', 'abr': '04',
      'may': '05', 'jun': '06', 'jul': '07', 'ago': '08',
      'sep': '09', 'oct': '10', 'nov': '11', 'dic': '12',
    }
    const partes = desdeWhen.toLowerCase().split('/')
    if (partes.length !== 2) return []
    const [mesStr, anioStr] = partes
    const mesNum = parseInt(mesesMap[mesStr.slice(0, 3)] || mesStr)
    const anio = parseInt(anioStr)
    if (isNaN(mesNum) || isNaN(anio)) return []

    return facturasCliente.filter(f => {
      // Extraemos mes/año del periodo "Marzo 2026"
      const mesesEs: Record<string, number> = {
        enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6,
        julio: 7, agosto: 8, septiembre: 9, octubre: 10, noviembre: 11, diciembre: 12
      }
      const partesPeriodo = f.periodo.toLowerCase().split(' ')
      const mesF = mesesEs[partesPeriodo[0]] || 0
      const anioF = parseInt(partesPeriodo[1]) || 0
      const fechaF = anioF * 12 + mesF
      const fechaDesde = anio * 12 + mesNum
      return fechaF >= fechaDesde
    })
  })()

  const abrirReclamacion = () => {
    setAbriendo(true)
    setTimeout(() => {
      setAbriendo(false)
      setRecAbierta(true)
      setMostrarFormRec(false)
    }, 1800)
  }

  const derivarGestion = (destino: string) => {
    setDerivando(true)
    setTimeout(() => {
      setDerivando(false)
      setDerivado(destino)
    }, 1200)
  }

  // Diagnóstico: ¿procede económica o se deriva?
  const diagnosticarConsumo = (c: Consumo): 'economica' | 'politica' | 'averia' => {
    if (c.anomalo && c.importe > 0) return 'economica'
    if (c.categoria === 'emocion' && c.anomalo) return 'politica'
    if (c.categoria === 'otros') return 'averia'
    return 'economica'
  }

  return (
    <>
      {/* ── HEADER ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>Consumos</div>
          <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 2 }}>
            Roaming · 900/800 · Emoción · Consumos en vuelo
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => navigate(`/cliente/${id}/facturas`)}
            className="btn-secondary" style={{ fontSize: 11 }}>
            Ver facturas →
          </button>
          <button
            onClick={() => navigate(`/cliente/${id}/reclamaciones`)}
            className="btn-secondary" style={{ fontSize: 11 }}>
            Ver reclamaciones →
          </button>
        </div>
      </div>

      {/* ── ALERTAS CONSUMOS EN VUELO ── */}
      {enVuelo.length > 0 && (
        <div className="card fade-in" style={{ border: '1.5px solid var(--color-amber-border)', background: 'var(--color-amber-light)' }}>
          <div className="card-title" style={{ color: 'var(--color-amber-dark)' }}>
            ✈ {enVuelo.length} consumo/s en vuelo — pendientes de facturar
            <span style={{ fontSize: 10, fontWeight: 400 }}>No aparecen en la última factura emitida</span>
          </div>
          {enVuelo.map(c => (
            <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 10px', marginBottom: 6, borderRadius: 'var(--border-radius-md)', background: 'rgba(255,255,255,0.6)', border: '1px solid var(--color-amber-border)' }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-amber-dark)' }}>
                  {iconoCategoria[c.categoria]} {c.descripcion}
                  {c.pais && <span style={{ fontSize: 10, marginLeft: 6, color: 'var(--color-text-tertiary)' }}>· {c.pais}</span>}
                </div>
                <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', marginTop: 2 }}>
                  Desde {c.fechaInicio} · Línea {c.linea} · Aún no facturado
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-amber-dark)' }}>
                  {c.importe > 0 ? `+${c.importe.toFixed(2)}€` : 'Incluido'}
                </span>
                <button
                  onClick={() => { setConsumoSel(c); setMostrarFormRec(true); setRecAbierta(false); setDerivado(null) }}
                  style={{ fontSize: 10, padding: '3px 8px', borderRadius: 'var(--border-radius-full)', border: '1px solid var(--color-amber-border)', background: 'white', color: 'var(--color-amber-dark)', cursor: 'pointer', fontWeight: 600 }}>
                  Reclamar
                </button>
              </div>
            </div>
          ))}
          <div style={{ fontSize: 10, color: 'var(--color-amber-dark)', fontWeight: 600, marginTop: 4 }}>
            Aparecerán en la próxima factura · Importe estimado: {enVuelo.reduce((a, c) => a + c.importe, 0).toFixed(2)}€
          </div>
        </div>
      )}

      {/* ── RESUMEN ANOMALÍAS ── */}
      {totalAnomalo > 0 && (
        <div className="alert alert-warn">
          <span>⚠</span>
          <div>
            <div style={{ fontWeight: 600 }}>Consumos anómalos detectados en el historial</div>
            <div style={{ fontSize: 11, marginTop: 2 }}>
              Importe total en consumos marcados como anómalos: <strong>{totalAnomalo.toFixed(2)}€</strong> — revisa con el cliente si los reconoce
            </div>
          </div>
        </div>
      )}

      {/* ── FILTROS ── */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        {['todas', 'roaming', '900_800', 'emocion', 'otros'].map(cat => (
          <button key={cat}
            onClick={() => setCategoriaActiva(cat)}
            style={{ padding: '4px 12px', fontSize: 11, borderRadius: 'var(--border-radius-full)', border: `1.5px solid ${categoriaActiva === cat ? 'var(--color-blue)' : 'var(--color-border-secondary)'}`, background: categoriaActiva === cat ? 'var(--color-blue-light)' : 'none', color: categoriaActiva === cat ? 'var(--color-blue-dark)' : 'var(--color-text-secondary)', cursor: 'pointer', fontWeight: categoriaActiva === cat ? 600 : 400 }}>
            {cat === 'todas' ? 'Todos' : labelCategoria[cat as keyof typeof labelCategoria]}
          </button>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
          <input type="checkbox" id="soloAnom" checked={soloAnomalos} onChange={e => setSoloAnomalos(e.target.checked)} style={{ accentColor: 'var(--color-amber-mid)', cursor: 'pointer' }} />
          <label htmlFor="soloAnom" style={{ fontSize: 11, color: 'var(--color-amber-dark)', cursor: 'pointer', fontWeight: 600 }}>Solo anómalos</label>
        </div>
        <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>{consumosFiltrados.length} resultado/s</span>
      </div>

      <div className="grid2" style={{ alignItems: 'start' }}>

        {/* ── LISTA DE CONSUMOS ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {consumosFiltrados.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--color-text-tertiary)', fontSize: 12, background: 'var(--color-background-primary)', border: '1px solid var(--color-border-tertiary)', borderRadius: 'var(--border-radius-lg)' }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>📊</div>
              Sin consumos para los filtros seleccionados
            </div>
          ) : (
            consumosFiltrados.map(c => {
              const col = colorCategoria(c.categoria)
              const isActive = consumoSel?.id === c.id
              return (
                <div key={c.id}
                  onClick={() => { setConsumoSel(c); setMostrarFormRec(false); setRecAbierta(false); setDerivado(null); setDesdeWhen('') }}
                  style={{ background: isActive ? 'var(--color-blue-light)' : 'var(--color-background-primary)', border: `1px solid ${isActive ? 'var(--color-blue-mid)' : c.anomalo ? 'var(--color-amber-border)' : 'var(--color-border-tertiary)'}`, borderLeft: `4px solid ${isActive ? 'var(--color-blue)' : c.anomalo ? 'var(--color-amber-mid)' : col.border}`, borderRadius: 'var(--border-radius-lg)', padding: '10px 12px', cursor: 'pointer', transition: 'all 0.1s' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 22, height: 22, borderRadius: '50%', background: col.bg, border: `1px solid ${col.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, flexShrink: 0 }}>
                        {iconoCategoria[c.categoria]}
                      </div>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: isActive ? 'var(--color-blue-dark)' : 'var(--color-text-primary)' }}>
                          {c.descripcion}
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', marginTop: 1 }}>
                          Línea {c.linea} · {c.fechaInicio}{c.fechaFin && c.fechaFin !== c.fechaInicio ? ` — ${c.fechaFin}` : ''}
                          {c.pais && ` · ${c.pais}`}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                      {c.anomalo && <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 'var(--border-radius-full)', background: 'var(--color-amber-light)', color: 'var(--color-amber-dark)', border: '1px solid var(--color-amber-border)', fontWeight: 700 }}>⚠ ANÓMALO</span>}
                      {!c.facturado && <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 'var(--border-radius-full)', background: 'var(--color-amber-mid)', color: '#fff', fontWeight: 700 }}>EN VUELO</span>}
                      <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)', color: c.importe > 0 ? (c.anomalo ? 'var(--color-amber-dark)' : 'var(--color-text-primary)') : 'var(--color-green)' }}>
                        {c.importe > 0 ? `+${c.importe.toFixed(2)}€` : 'Incluido'}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 'var(--border-radius-full)', background: col.bg, color: col.color, border: `1px solid ${col.border}`, fontWeight: 600 }}>
                      {labelCategoria[c.categoria]}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--color-blue-dark)', fontWeight: 600 }}>
                      {c.facturado ? `Factura ${c.facturaId}` : 'Pendiente de facturar'}
                    </span>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* ── PANEL DERECHO: DETALLE + RECLAMACIÓN ── */}
        {consumoSel ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

            {/* Ficha del consumo */}
            <div className="card">
              <div className="card-title">
                Detalle del consumo
                <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 'var(--border-radius-full)', background: colorCategoria(consumoSel.categoria).bg, color: colorCategoria(consumoSel.categoria).color, border: `1px solid ${colorCategoria(consumoSel.categoria).border}`, fontWeight: 700 }}>
                  {labelCategoria[consumoSel.categoria]}
                </span>
              </div>
              {[
                { label: 'Descripción', val: consumoSel.descripcion },
                { label: 'Línea', val: consumoSel.linea },
                { label: 'Fecha inicio', val: consumoSel.fechaInicio },
                { label: 'Fecha fin', val: consumoSel.fechaFin || 'En curso' },
                consumoSel.pais ? { label: 'País', val: consumoSel.pais } : null,
                { label: 'Importe', val: consumoSel.importe > 0 ? `${consumoSel.importe.toFixed(2)}€` : 'Incluido en tarifa' },
                { label: 'Estado facturación', val: consumoSel.facturado ? `Facturado en ${consumoSel.facturaId}` : 'Pendiente de facturar — en vuelo' },
              ].filter(Boolean).map((row: any) => (
                <div key={row.label} className="table-row">
                  <span className="table-row-label">{row.label}</span>
                  <span className="table-row-value">{row.val}</span>
                </div>
              ))}

              {/* Diagnóstico automático */}
              {consumoSel.anomalo && (() => {
                const diag = diagnosticarConsumo(consumoSel)
                return (
                  <div style={{ marginTop: 12, padding: '8px 10px', borderRadius: 'var(--border-radius-md)', background: diag === 'economica' ? 'var(--color-amber-light)' : 'var(--color-blue-light)', border: `1px solid ${diag === 'economica' ? 'var(--color-amber-border)' : 'var(--color-blue-mid)'}` }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: diag === 'economica' ? 'var(--color-amber-dark)' : 'var(--color-blue-dark)', marginBottom: 3 }}>
                      🔍 Diagnóstico automático
                    </div>
                    <div style={{ fontSize: 11, color: diag === 'economica' ? 'var(--color-amber-dark)' : 'var(--color-blue-dark)' }}>
                      {diag === 'economica' && 'Consumo anómalo con cargo económico — procede apertura de reclamación económica'}
                      {diag === 'politica' && 'Cargo de emoción no reconocido — puede derivar a política comercial o mala información'}
                      {diag === 'averia' && 'Consumo vinculado a posible incidencia técnica — valorar derivación a Averías'}
                    </div>
                  </div>
                )
              })()}
            </div>

            {/* Formulario de reclamación */}
            {!recAbierta && !derivado && (
              <div className="card">
                <div className="card-title">Apertura de reclamación desde consumo</div>

                {!mostrarFormRec ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {consumoSel.anomalo && (
                      <button
                        onClick={() => setMostrarFormRec(true)}
                        className="btn-primary" style={{ width: '100%', justifyContent: 'center', fontSize: 12 }}>
                        ⚠ Abrir reclamación económica por este consumo
                      </button>
                    )}
                    {diagnosticarConsumo(consumoSel) !== 'economica' && (
                      <button
                        onClick={() => derivarGestion('Política comercial / Mala información')}
                        disabled={derivando}
                        className="btn-secondary" style={{ width: '100%', justifyContent: 'center', fontSize: 12 }}>
                        {derivando ? <><span className="spinner spinner-sm" /> Derivando...</> : '→ Derivar a política comercial'}
                      </button>
                    )}
                    {consumoSel.categoria === 'otros' && (
                      <button
                        onClick={() => derivarGestion('Gestión de Averías')}
                        disabled={derivando}
                        className="btn-secondary" style={{ width: '100%', justifyContent: 'center', fontSize: 12 }}>
                        {derivando ? <><span className="spinner spinner-sm" /> Derivando...</> : '→ Derivar a Averías'}
                      </button>
                    )}
                    {!consumoSel.anomalo && (
                      <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', textAlign: 'center', padding: '8px 0' }}>
                        Este consumo no está marcado como anómalo — no procede reclamación económica directa
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

                    {/* Pre-carga automática */}
                    <div style={{ padding: '8px 10px', borderRadius: 'var(--border-radius-md)', background: 'var(--color-blue-light)', border: '1px solid var(--color-blue-mid)' }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-blue-dark)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Datos precargados automáticamente</div>
                      <div style={{ fontSize: 11, color: 'var(--color-blue-dark)' }}>
                        Tipo: Reclamación económica · Categoría: {labelCategoria[consumoSel.categoria]}<br />
                        Concepto: {consumoSel.descripcion}<br />
                        Importe: {consumoSel.importe.toFixed(2)}€ · Línea: {consumoSel.linea}
                      </div>
                    </div>

                    {/* Desde cuándo — arrastre de periodos */}
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 6, color: 'var(--color-text-secondary)' }}>
                        ¿Desde cuándo te pasa? <span style={{ fontWeight: 400, color: 'var(--color-text-tertiary)' }}>(formato mes/año, ej: 03/2026)</span>
                      </div>
                      <input
                        className="input"
                        placeholder="ej: 03/2026"
                        value={desdeWhen}
                        onChange={e => setDesdeWhen(e.target.value)}
                      />
                      {periodosAfectados.length > 0 && (
                        <div style={{ marginTop: 8, padding: '8px 10px', borderRadius: 'var(--border-radius-md)', background: 'var(--color-amber-light)', border: '1px solid var(--color-amber-border)' }}>
                          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-amber-dark)', marginBottom: 4 }}>
                            📋 {periodosAfectados.length} factura/s arrastradas automáticamente
                          </div>
                          {periodosAfectados.map(f => (
                            <div key={f.id} style={{ fontSize: 11, color: 'var(--color-amber-dark)', display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                              <span>{f.periodo} · {f.numero}</span>
                              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{f.importe.toFixed(2)}€</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={abrirReclamacion}
                        disabled={abriendo}
                        className="btn-primary"
                        style={{ flex: 1, justifyContent: 'center', fontSize: 12 }}>
                        {abriendo
                          ? <><span className="spinner spinner-sm" /> Abriendo reclamación...</>
                          : `Confirmar reclamación${periodosAfectados.length > 0 ? ` — ${periodosAfectados.length} factura/s` : ''}`
                        }
                      </button>
                      <button onClick={() => { setMostrarFormRec(false); setDesdeWhen('') }} className="btn-secondary" style={{ fontSize: 12 }}>
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Confirmación reclamación abierta */}
            {recAbierta && (
              <div className="alert alert-ok fade-in">
                <span>✓</span>
                <div>
                  <div style={{ fontWeight: 600 }}>
                    Reclamación abierta — REC-2026-{Math.floor(Math.random() * 900 + 100)}
                  </div>
                  <div style={{ fontSize: 11, marginTop: 2 }}>
                    Tipo: {labelCategoria[consumoSel.categoria]} · Concepto: {consumoSel.descripcion}
                    {periodosAfectados.length > 0 && ` · ${periodosAfectados.length} factura/s vinculadas`}
                  </div>
                  <button
                    onClick={() => navigate(`/cliente/${id}/reclamaciones`)}
                    style={{ marginTop: 8, fontSize: 11, color: 'var(--color-green-dark)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, padding: 0 }}>
                    Ver en reclamaciones →
                  </button>
                </div>
              </div>
            )}

            {/* Confirmación derivación */}
            {derivado && (
              <div className="alert alert-blue fade-in">
                <span>→</span>
                <div>
                  <div style={{ fontWeight: 600 }}>Derivado a: {derivado}</div>
                  <div style={{ fontSize: 11, marginTop: 2 }}>
                    El consumo no procede como reclamación económica — gestionado por el módulo correspondiente
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--color-text-tertiary)', fontSize: 12, background: 'var(--color-background-primary)', border: '1px solid var(--color-border-tertiary)', borderRadius: 'var(--border-radius-lg)' }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>📊</div>
            Selecciona un consumo para ver el detalle y gestionar una reclamación
          </div>
        )}
      </div>
    </>
  )
}