import { useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { datosCliente } from '../../data/mockData'

// ── TIPOS ──
type Tipologia = 'economicas' | 'provision' | 'atencion' | null

// ── MOCK LÍNEA DE TIEMPO ──
const timelineMock: Record<string, { estado: string; fecha: string; activo: boolean; comunicacion?: string }[]> = {
  'REC-2026-0341': [
    { estado: 'Abierta', fecha: '05/03/2026', activo: false, comunicacion: 'SMS confirmación apertura' },
    { estado: 'En CGR', fecha: '06/03/2026', activo: true },
    { estado: 'Consulta a terceros', fecha: '', activo: false },
    { estado: 'Resolución', fecha: '', activo: false },
    { estado: 'Comunicación resolución', fecha: '', activo: false },
    { estado: 'Gestión económica', fecha: '', activo: false },
    { estado: 'Cierre final', fecha: '', activo: false },
  ],
}

const reaperturasMock: Record<string, { version: number; fecha: string; motivo: string; diferencial: string }[]> = {
  'REC-2026-0341': [
    { version: 1, fecha: '05/03/2026', motivo: 'Apertura inicial — cargo roaming Francia', diferencial: 'Reclamación original 22,60€' },
    { version: 2, fecha: '08/03/2026', motivo: 'Reapertura — cliente indica también cargos de llamadas internacionales', diferencial: '+ Añadidas llamadas internacionales zona 2 — 3,20€' },
  ],
}

const comunicacionesMock: Record<string, { tipo: string; fecha: string; resumen: string }[]> = {
  'REC-2026-0341': [
    { tipo: 'SMS', fecha: '05/03/2026', resumen: 'Confirmación de apertura de reclamación REC-2026-0341' },
    { tipo: 'Email', fecha: '06/03/2026', resumen: 'Reclamación derivada a CGR para análisis — plazo estimado 7 días hábiles' },
  ],
}

const iconoTipo = (tipo: string) => ({ SMS: '💬', Email: '📧', Llamada: '📞' }[tipo] || '·')

export function ReclamacionesPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [vista, setVista] = useState<'home' | 'lista' | 'detalle'>('home')
  const [tipologia, setTipologia] = useState<Tipologia>(null)
  const [reclamacionActiva, setReclamacionActiva] = useState<string | null>(null)
  const [versionActiva, setVersionActiva] = useState<number>(0)
  const [cargando, setCargando] = useState(false)
  const [abriendo, setAbriendo] = useState(false)
  const [nuevaAbierta, setNuevaAbierta] = useState(false)
  const [mostrarFormNueva, setMostrarFormNueva] = useState(false)
  const [formMotivo, setFormMotivo] = useState('')
  const [formCategoria, setFormCategoria] = useState<'economica' | 'provision' | 'atencion'>('economica')
  const [formCanal, setFormCanal] = useState('Teléfono')
  const [formImporte, setFormImporte] = useState('')
  const [formFactura, setFormFactura] = useState('')
  const [formComentarioAgente, setFormComentarioAgente] = useState('')
  const [mostrarComms, setMostrarComms] = useState<string | null>(null)

  // Acciones sobre reclamación
  const [estadoReclamacion, setEstadoReclamacion] = useState<Record<string, string>>({})
  const [accionActiva, setAccionActiva] = useState<'escalar' | 'abono' | null>(null)
  const [escalarMotivo, setEscalarMotivo] = useState('')
  const [abonoParcial, setAbonoParcial] = useState('')
  const [confirmando, setConfirmando] = useState<'procedente' | 'improcedente' | null>(null)
  const [improcedMotivo, setImprocedMotivo] = useState('')
  const [accionEjecutada, setAccionEjecutada] = useState<{ tipo: string; detalle: string } | null>(null)

  // RF-18 — Multi-factura y autocodificación
  const [facturasSel, setFacturasSel] = useState<Set<string>>(new Set())
  const [modoMultiFactura, setModoMultiFactura] = useState(false)
  const [motivoCodificado, setMotivoCodificado] = useState<{ motivo: string; submotivo: string } | null>(null)

  if (!id) return null
  const datos = datosCliente[id]
  if (!datos) return null

  // RF-10 — Abrir formulario desde navegación externa
  const location = useLocation()
  useState(() => {
    if (location.state?.abrirFormulario) {
      setMostrarFormNueva(true)
      setNuevaAbierta(false)
      if (location.state?.facturaId) {
        setFormFactura(location.state.facturaId)
        setModoMultiFactura(false)
      }
      if (location.state?.importe) {
        setFormImporte(location.state.importe.toFixed(2))
      }
      if (location.state?.motivo) {
        setFormMotivo(location.state.motivo)
      }
    }
  })

  const reclamacion = reclamacionActiva
    ? datos.reclamaciones.find(r => r.id === reclamacionActiva) || null
    : null

  const timeline = reclamacion ? (timelineMock[reclamacion.id] || []) : []
  const reaperturas = reclamacion ? (reaperturasMock[reclamacion.id] || []) : []
  const comunicaciones = reclamacion ? (comunicacionesMock[reclamacion.id] || []) : []
  const versionData = reaperturas[versionActiva] || null

  const ejecutarAccion = (tipo: 'escalar' | 'abono' | 'procedente' | 'improcedente', detalle?: string) => {
    setCargando(true)
    setTimeout(() => {
      setCargando(false)
      setAccionActiva(null)
      setConfirmando(null)
      const nuevoEstado =
        tipo === 'escalar' ? 'escalada' :
        tipo === 'procedente' ? 'resuelta' :
        tipo === 'improcedente' ? 'denegada' :
        'en_gestion'
      if (reclamacion) {
        setEstadoReclamacion(prev => ({ ...prev, [reclamacion.id]: nuevoEstado }))
      }
      const detalleTexto =
        tipo === 'escalar' ? `Escalada a supervisor — motivo: ${detalle}` :
        tipo === 'abono' ? `Abono parcial de ${detalle}€ programado en próxima factura` :
        tipo === 'procedente' ? `Resolución favorable — abono de ${reclamacion?.importeReclamado.toFixed(2)}€ programado en próxima factura` :
        `Resolución denegada — motivo: ${detalle}`
      setAccionEjecutada({ tipo, detalle: detalleTexto })
    }, 1600)
  }

  const abrirNuevaReclamacion = () => {
    setAbriendo(true)
    setTimeout(() => {
      setAbriendo(false)
      setNuevaAbierta(true)
      setMostrarFormNueva(false)
      setFormMotivo('')
      setFormImporte('')
      setFormFactura('')
      setFormComentarioAgente('')
    }, 1800)
  }

  const abrirDetalle = (rid: string) => {
    setReclamacionActiva(rid)
    setVersionActiva((reaperturasMock[rid]?.length || 1) - 1)
    setVista('detalle')
  }

  const estadoPill = (e: string) => {
    if (e === 'resuelta') return 'pill-ok'
    if (e === 'denegada') return 'pill-err'
    if (e === 'en_gestion') return 'pill-blue'
    return 'pill-warn'
  }

  // ── MÓDULOS DE LA HOME ──
  const modulos = [
    {
      key: 'economicas' as Tipologia,
      icono: '💶',
      titulo: 'Económicas',
      desc: 'Cargos incorrectos, roaming, promociones, conceptos de factura',
      color: 'var(--color-red-mid)',
      bg: 'var(--color-red-light)',
      border: 'var(--color-red-border)',
      count: datos.reclamaciones.filter(r => (r as any).tipo === 'economica' || !(r as any).tipo).length,
    },
    {
      key: 'provision' as Tipologia,
      icono: '📦',
      titulo: 'Provisión / Pedidos / Averías',
      desc: 'Instalaciones, pedidos en curso, incidencias técnicas y averías',
      color: 'var(--color-blue-dark)',
      bg: 'var(--color-blue-light)',
      border: 'var(--color-blue-mid)',
      count: 0,
    },
    {
      key: 'atencion' as Tipologia,
      icono: '🎧',
      titulo: 'Atención / Políticas',
      desc: 'Trato recibido, información incorrecta, incumplimiento de compromisos',
      color: 'var(--color-purple)',
      bg: 'var(--color-purple-light)',
      border: 'var(--color-purple-border)',
      count: 0,
    },
  ]

  return (
    <>
      {/* ── HEADER ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {vista !== 'home' && (
            <button
              onClick={() => { setVista(vista === 'detalle' ? 'lista' : 'home'); setReclamacionActiva(null) }}
              className="btn-ghost"
              style={{ fontSize: 11, padding: '4px 8px' }}>
              ← Volver
            </button>
          )}
          <div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>
              Reclamaciones
              {vista === 'lista' && tipologia && ` — ${modulos.find(m => m.key === tipologia)?.titulo}`}
              {vista === 'detalle' && reclamacion && ` — ${reclamacion.numero}`}
            </div>
            <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 2 }}>
              {vista === 'home' && 'Selecciona el tipo de reclamación'}
              {vista === 'lista' && 'Lista · Línea de tiempo · Reaperturas'}
              {vista === 'detalle' && 'Panel de seguimiento integral'}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {vista !== 'home' && (
            <button onClick={() => navigate(`/cliente/${id}/facturas`)} className="btn-secondary" style={{ fontSize: 11 }}>
              Ver facturas →
            </button>
          )}
          <button
            onClick={() => { setMostrarFormNueva(true); setNuevaAbierta(false) }}
            className="btn-primary" style={{ fontSize: 11 }}>
            + Nueva reclamación
          </button>
        </div>
      </div>



      {nuevaAbierta && (
        <div className="alert alert-ok fade-in">
          <span>✓</span>
          <div>
            <div style={{ fontWeight: 600 }}>Reclamación abierta — REC-2026-{Math.floor(Math.random() * 900 + 100)}</div>
            <div style={{ fontSize: 11, marginTop: 2 }}>Robot ARTE iniciado · Resolución estimada en 7 días hábiles</div>
          </div>
        </div>
      )}

      {/* ── FORMULARIO NUEVA RECLAMACIÓN — RF-18 ── */}
      {mostrarFormNueva && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card fade-in" style={{ width: 580, maxHeight: '92vh', overflowY: 'auto', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--color-border-secondary)' }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>Nueva reclamación</div>
                <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginTop: 2 }}>
                  Motor ARTE · Autocodificación · Multi-factura sin límite
                </div>
              </div>
              <button onClick={() => { setMostrarFormNueva(false); setFacturasSel(new Set()); setModoMultiFactura(false); setMotivoCodificado(null) }}
                style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: 'var(--color-text-tertiary)', lineHeight: 1 }}>✕</button>
            </div>

            {/* Tipología */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Tipo de reclamación</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                {([
                  ['economica',  '💶', 'Económica',           'var(--color-red-light)',    'var(--color-red-border)',    'var(--color-red-dark)'],
                  ['provision',  '📦', 'Provisión / Averías', 'var(--color-blue-light)',   'var(--color-blue-mid)',      'var(--color-blue-dark)'],
                  ['atencion',   '🎧', 'Atención / Políticas','var(--color-purple-light)', 'var(--color-purple-border)', 'var(--color-purple)'],
                ] as const).map(([val, ico, label, bg, border, color]) => (
                  <div key={val} onClick={() => setFormCategoria(val)}
                    style={{ padding: '10px 8px', border: `1.5px solid ${formCategoria === val ? border : 'var(--color-border-tertiary)'}`, borderRadius: 'var(--border-radius-lg)', cursor: 'pointer', background: formCategoria === val ? bg : 'transparent', textAlign: 'center', transition: 'all 0.1s' }}>
                    <div style={{ fontSize: 20, marginBottom: 4 }}>{ico}</div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: formCategoria === val ? color : 'var(--color-text-secondary)' }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Motivo con autocodificación ARTE */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Motivo</div>
              <textarea
                className="input"
                placeholder="Describe el motivo con el máximo detalle posible..."
                value={formMotivo}
                onChange={e => {
                  setFormMotivo(e.target.value)
                  const t = e.target.value.toLowerCase()
                  if (t.length > 10) {
                    const cod =
                      t.includes('roaming') ? { motivo: 'Económica — Consumos', submotivo: 'Roaming / Itinerancia' } :
                      t.includes('precio') || t.includes('subida') ? { motivo: 'Económica — Tarifa', submotivo: 'Cambio de precio no comunicado' } :
                      t.includes('doble') || t.includes('duplicad') ? { motivo: 'Económica — Facturación', submotivo: 'Duplicidad de cargo' } :
                      t.includes('promo') || t.includes('descuento') ? { motivo: 'Económica — Facturación', submotivo: 'Promoción no aplicada' } :
                      t.includes('instal') || t.includes('técnico') ? { motivo: 'Provisión — Instalación', submotivo: 'Incidencia en instalación' } :
                      t.includes('avería') || t.includes('corte') ? { motivo: 'Provisión — Servicio', submotivo: 'Avería de servicio' } :
                      t.includes('trato') || t.includes('información') ? { motivo: 'Atención — Información', submotivo: 'Información incorrecta' } :
                      t.includes('900') || t.includes('800') ? { motivo: 'Económica — Consumos', submotivo: 'Llamadas a números especiales' } :
                      t.includes('emoción') || t.includes('suscripción') ? { motivo: 'Económica — Consumos', submotivo: 'Cargo por contenido externo' } :
                      null
                    setMotivoCodificado(cod)
                  } else {
                    setMotivoCodificado(null)
                  }
                }}
                style={{ height: 80, resize: 'none', paddingTop: 8, paddingBottom: 8 }}
              />

              {motivoCodificado && (
                <div className="fade-in" style={{ marginTop: 8, padding: '10px 12px', borderRadius: 'var(--border-radius-md)', background: 'var(--color-blue-light)', border: '1px solid var(--color-blue-mid)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', marginBottom: 3 }}>🤖 ARTE propone autocodificación</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-blue-dark)' }}>{motivoCodificado.motivo}</div>
                      <div style={{ fontSize: 11, color: 'var(--color-blue-dark)', marginTop: 2 }}>↳ {motivoCodificado.submotivo}</div>
                    </div>
                    <button
                      onClick={() => setMotivoCodificado(null)}
                      style={{ fontSize: 10, padding: '3px 8px', borderRadius: 'var(--border-radius-full)', border: '1px solid var(--color-border-secondary)', background: 'white', color: 'var(--color-text-secondary)', cursor: 'pointer', flexShrink: 0, marginLeft: 12 }}>
                      Cambiar
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Canal apertura</div>
                <select className="input" value={formCanal} onChange={e => setFormCanal(e.target.value)}>
                  {['Teléfono', 'Presencial', 'App', 'Web', 'Chat'].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Importe reclamado (€)</div>
                <input className="input" type="number" placeholder="0.00" value={formImporte} onChange={e => setFormImporte(e.target.value)} />
              </div>
            </div>

            {/* Comentario interno del agente */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Comentario interno del agente
                <span style={{ marginLeft: 6, fontSize: 10, fontWeight: 400, textTransform: 'none', color: 'var(--color-text-tertiary)' }}>(opcional — queda en auditoría, no se envía al cliente)</span>
              </div>
              <textarea
                className="input"
                placeholder="Observaciones adicionales, contexto de la llamada, acuerdos verbales..."
                value={formComentarioAgente}
                onChange={e => setFormComentarioAgente(e.target.value)}
                style={{ resize: 'vertical', minHeight: 64, fontFamily: 'var(--font-sans)' }}
              />
            </div>

            {/* RF-18 — Selección multi-factura */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Facturas vinculadas
                  {facturasSel.size > 0 && (
                    <span style={{ marginLeft: 8, fontSize: 10, padding: '1px 6px', borderRadius: 'var(--border-radius-full)', background: 'var(--color-blue)', color: '#fff', fontWeight: 700 }}>
                      {facturasSel.size} seleccionada/s
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setModoMultiFactura(!modoMultiFactura)}
                  style={{ fontSize: 10, padding: '3px 8px', borderRadius: 'var(--border-radius-full)', border: `1.5px solid ${modoMultiFactura ? 'var(--color-blue)' : 'var(--color-border-secondary)'}`, background: modoMultiFactura ? 'var(--color-blue-light)' : 'none', color: modoMultiFactura ? 'var(--color-blue-dark)' : 'var(--color-text-secondary)', cursor: 'pointer', fontWeight: modoMultiFactura ? 600 : 400 }}>
                  {modoMultiFactura ? '✓ Multi-factura activo' : 'Activar multi-factura'}
                </button>
              </div>

              {!modoMultiFactura ? (
                <select className="input" value={formFactura} onChange={e => setFormFactura(e.target.value)}>
                  <option value="">— Sin factura vinculada —</option>
                  {datos.facturas.map(f => (
                    <option key={f.id} value={f.id}>{f.periodo} · {f.numero} · {f.importe.toFixed(2)}€</option>
                  ))}
                </select>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', marginBottom: 2 }}>
                    Selecciona todas las facturas afectadas — sin límite de consecutividad ni número máximo
                  </div>
                  <div style={{ maxHeight: 200, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {datos.facturas.map(f => {
                      const sel = facturasSel.has(f.id)
                      const tieneAnomalia = f.conceptos.some((c: any) => c.anomalo)
                      return (
                        <div key={f.id}
                          onClick={() => {
                            const s = new Set(facturasSel)
                            if (s.has(f.id)) s.delete(f.id); else s.add(f.id)
                            setFacturasSel(s)
                          }}
                          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', border: `1.5px solid ${sel ? 'var(--color-blue)' : 'var(--color-border-tertiary)'}`, borderRadius: 'var(--border-radius-md)', cursor: 'pointer', background: sel ? 'var(--color-blue-light)' : 'transparent', transition: 'all 0.1s' }}>
                          <div style={{ width: 16, height: 16, borderRadius: 3, border: `2px solid ${sel ? 'var(--color-blue)' : 'var(--color-border-secondary)'}`, background: sel ? 'var(--color-blue)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {sel && <span style={{ fontSize: 9, color: '#fff', fontWeight: 700 }}>✓</span>}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 11, fontWeight: 600, color: sel ? 'var(--color-blue-dark)' : 'var(--color-text-primary)' }}>
                              {f.periodo} · {f.numero}
                            </div>
                            <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', marginTop: 1 }}>
                              Vence {f.fechaVencimiento} · {f.estado}
                              {tieneAnomalia && <span style={{ marginLeft: 6, color: 'var(--color-amber-dark)', fontWeight: 600 }}>⚠ anomalía</span>}
                            </div>
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)', color: sel ? 'var(--color-blue-dark)' : 'var(--color-text-primary)', flexShrink: 0 }}>
                            {f.importe.toFixed(2)}€
                          </span>
                        </div>
                      )
                    })}
                  </div>

                  {facturasSel.size > 0 && (
                    <div className="fade-in" style={{ padding: '8px 10px', borderRadius: 'var(--border-radius-md)', background: 'var(--color-green-light)', border: '1px solid var(--color-green-border)', marginTop: 4 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-green-dark)', marginBottom: 4 }}>
                        📋 Expediente único — {facturasSel.size} factura/s vinculadas
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--color-green-dark)' }}>
                        <span>{datos.facturas.filter(f => facturasSel.has(f.id)).map(f => f.periodo).join(' · ')}</span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                          {datos.facturas.filter(f => facturasSel.has(f.id)).reduce((a, f) => a + f.importe, 0).toFixed(2)}€ total
                        </span>
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--color-green-dark)', marginTop: 4, opacity: 0.8 }}>
                        Se creará un único ID de reclamación con todas las facturas incluidas — sin fragmentación por consecutividad
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Auditoría ARTE */}
            {(motivoCodificado || facturasSel.size > 1 || formComentarioAgente.trim()) && (
              <div style={{ marginBottom: 14, padding: '8px 10px', borderRadius: 'var(--border-radius-md)', background: 'var(--color-background-secondary)', border: '1px solid var(--color-border-tertiary)', fontSize: 10, color: 'var(--color-text-tertiary)' }}>
                <div style={{ fontWeight: 700, marginBottom: 3, color: 'var(--color-text-secondary)' }}>📊 Trazabilidad ARTE — para auditoría y reporting</div>
                {motivoCodificado && <div>Motivo autocodificado: {motivoCodificado.motivo} / {motivoCodificado.submotivo}</div>}
                {facturasSel.size > 1 && <div>Expediente multi-factura: {facturasSel.size} facturas · {datos.facturas.filter(f => facturasSel.has(f.id)).reduce((a, f) => a + f.importe, 0).toFixed(2)}€ total en disputa</div>}
                <div>Canal: {formCanal} · Fecha apertura: {new Date().toLocaleDateString('es-ES')}</div>
                {formComentarioAgente.trim() && <div style={{ marginTop: 3 }}>Comentario agente: {formComentarioAgente.trim()}</div>}
              </div>
            )}

            {/* Acciones */}
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={abrirNuevaReclamacion}
                disabled={abriendo || formMotivo.trim().length < 5}
                className="btn-primary"
                style={{ flex: 1, justifyContent: 'center', fontSize: 12 }}>
                {abriendo
                  ? <><span className="spinner spinner-sm" /> Abriendo reclamación...</>
                  : `✓ Abrir reclamación${facturasSel.size > 1 ? ` — ${facturasSel.size} facturas` : ''}`
                }
              </button>
              <button onClick={() => { setMostrarFormNueva(false); setFacturasSel(new Set()); setModoMultiFactura(false); setMotivoCodificado(null); setFormComentarioAgente('') }} className="btn-secondary" style={{ fontSize: 12 }}>
                Cancelar
              </button>
            </div>

            {formMotivo.trim().length < 5 && formMotivo.length > 0 && (
              <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', marginTop: 6, textAlign: 'center' }}>
                El motivo debe tener al menos 5 caracteres para continuar
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          HOME — RF-14: 4 módulos por tipología
      ══════════════════════════════════════ */}
      {vista === 'home' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Alerta si hay reclamaciones activas */}
          {datos.reclamaciones.some(r => r.estado !== 'resuelta') && (
            <div className="alert alert-warn">
              <span>⚠</span>
              <div>
                <div style={{ fontWeight: 600 }}>
                  {datos.reclamaciones.filter(r => r.estado !== 'resuelta').length} reclamación/es activa/s
                </div>
                <div style={{ fontSize: 11, marginTop: 2 }}>
                  {datos.reclamaciones.filter(r => r.bloquea).length > 0 &&
                    `${datos.reclamaciones.filter(r => r.bloquea).length} bloquea/n cobro · `}
                  Impacto estimado: {datos.reclamaciones.filter(r => r.estado !== 'resuelta').reduce((a, r) => a + r.importeReclamado, 0).toFixed(2)}€
                </div>
              </div>
            </div>
          )}

          {/* 3 módulos principales */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {modulos.map(m => (
              <div
                key={m.key}
                onClick={() => { setTipologia(m.key); setVista('lista') }}
                style={{ padding: '20px 18px', border: `1.5px solid ${m.border}`, borderRadius: 'var(--border-radius-lg)', cursor: 'pointer', background: m.bg, transition: 'all 0.15s', position: 'relative' }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow-md)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
              >
                {m.count > 0 && (
                  <div style={{ position: 'absolute', top: 12, right: 12, width: 20, height: 20, borderRadius: '50%', background: 'var(--color-red-mid)', color: '#fff', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {m.count}
                  </div>
                )}
                <div style={{ fontSize: 28, marginBottom: 12 }}>{m.icono}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: m.color, marginBottom: 6 }}>{m.titulo}</div>
                <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>{m.desc}</div>
                <div style={{ marginTop: 14, fontSize: 11, fontWeight: 600, color: m.color }}>
                  {m.count > 0 ? `${m.count} activa/s →` : 'Sin reclamaciones →'}
                </div>
              </div>
            ))}
          </div>

          {/* Módulo consulta histórico */}
          <div
            onClick={() => { setTipologia(null); setVista('lista') }}
            style={{ padding: '14px 18px', border: '1.5px solid var(--color-border-secondary)', borderRadius: 'var(--border-radius-lg)', cursor: 'pointer', background: 'var(--color-background-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.1s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--color-background-secondary)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--color-background-primary)'}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ fontSize: 22 }}>🔍</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Consulta de reclamaciones</div>
                <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>Historial completo · Buscar por ID, fecha o importe</div>
              </div>
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)', fontWeight: 600 }}>
              {datos.reclamaciones.length} total →
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          LISTA de reclamaciones
      ══════════════════════════════════════ */}
      {vista === 'lista' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

          {datos.reclamaciones.length === 0 && !nuevaAbierta ? (
            <div style={{ background: 'var(--color-background-primary)', border: '1px solid var(--color-border-tertiary)', borderRadius: 'var(--border-radius-lg)', padding: 32, textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: 12 }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>✓</div>
              Sin reclamaciones para este cliente.
              <div style={{ marginTop: 12 }}>
                <button onClick={() => navigate(`/cliente/${id}/facturas`)} className="btn-secondary" style={{ fontSize: 11 }}>
                  Ver facturas para reclamar →
                </button>
              </div>
            </div>
          ) : (
            datos.reclamaciones.map(r => (
              <div
                key={r.id}
                onClick={() => abrirDetalle(r.id)}
                style={{ background: 'var(--color-background-primary)', border: `1px solid ${r.bloquea ? 'var(--color-red-border)' : 'var(--color-border-tertiary)'}`, borderLeft: `4px solid ${r.bloquea ? 'var(--color-red-mid)' : r.estado === 'resuelta' ? 'var(--color-green-border)' : 'var(--color-amber-mid)'}`, borderRadius: 'var(--border-radius-lg)', padding: '12px 14px', cursor: 'pointer', transition: 'all 0.1s' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <div style={{ fontSize: 12, fontWeight: 700 }}>{r.numero}</div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    {r.bloquea && (
                      <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 'var(--border-radius-full)', background: 'var(--color-red-mid)', color: '#fff', fontWeight: 700 }}>
                        BLOQUEA COBRO
                      </span>
                    )}
                    {reaperturasMock[r.id] && (
                      <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 'var(--border-radius-full)', background: 'var(--color-amber-light)', color: 'var(--color-amber-dark)', border: '1px solid var(--color-amber-border)', fontWeight: 600 }}>
                        {reaperturasMock[r.id].length} versión/es
                      </span>
                    )}
                    <span className={`pill ${estadoPill(r.estado)}`} style={{ fontSize: 10 }}>{r.estado.replace('_', ' ')}</span>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 6 }}>{r.motivo}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: 10, fontSize: 11, color: 'var(--color-text-tertiary)' }}>
                    <span>{r.fechaApertura}</span>
                    <span>·</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--color-text-primary)' }}>{r.importeReclamado.toFixed(2)}€</span>
                    <span>·</span>
                    <span>{r.canal}</span>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--color-blue-dark)', fontWeight: 600 }}>Ver detalle →</span>
                </div>

                {/* Estado del timeline resumido */}
                {timelineMock[r.id] && (
                  <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--color-border-tertiary)', display: 'flex', gap: 4, alignItems: 'center' }}>
                    {timelineMock[r.id].map((t, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        {i > 0 && <div style={{ width: 16, height: 1, background: t.fecha ? 'var(--color-green-border)' : 'var(--color-border-secondary)' }} />}
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: t.activo ? 'var(--color-blue)' : t.fecha ? 'var(--color-green-border)' : 'var(--color-border-secondary)', flexShrink: 0 }} />
                      </div>
                    ))}
                    <span style={{ fontSize: 10, color: 'var(--color-text-tertiary)', marginLeft: 6 }}>
                      {timelineMock[r.id].find(t => t.activo)?.estado || 'Sin estado'}
                    </span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* ══════════════════════════════════════
          DETALLE — RF-15: Panel de seguimiento
      ══════════════════════════════════════ */}
      {vista === 'detalle' && reclamacion && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Cabecera de contexto */}
          <div className="card" style={{ borderColor: reclamacion.bloquea ? 'var(--color-red-border)' : 'var(--color-border-tertiary)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              {[
                { label: 'Número', val: reclamacion.numero },
                { label: 'Motivo', val: reclamacion.motivo },
                { label: 'Canal apertura', val: reclamacion.canal },
                { label: 'Fecha apertura', val: reclamacion.fechaApertura },
                { label: 'Importe reclamado', val: `${reclamacion.importeReclamado.toFixed(2)}€` },
                { label: 'Estado actual', val: estadoReclamacion[reclamacion.id] || reclamacion.estado },
                { label: 'Bloquea cobro', val: reclamacion.bloquea ? 'Sí' : 'No' },
              ].map(row => (
                <div key={row.label}>
                  <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>{row.label}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: row.label === 'Bloquea cobro' && reclamacion.bloquea ? 'var(--color-red)' : 'var(--color-text-primary)' }}>{row.val}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Bloqueo cobro */}
          {reclamacion.bloquea && (
            <div className="alert alert-err">
              <span>⚠</span>
              <div>
                <div style={{ fontWeight: 600 }}>Esta reclamación bloquea el cobro</div>
                <div style={{ fontSize: 11, marginTop: 2 }}>La factura asociada no puede cobrarse hasta resolución. <button onClick={() => navigate(`/cliente/${id}/cobros`)} style={{ fontSize: 11, color: 'var(--color-red-dark)', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Ver cobros →</button></div>
              </div>
            </div>
          )}

          {/* ── REAPERTURAS — barra n ── */}
          {reaperturas.length > 1 && (
            <div className="card">
              <div className="card-title">
                Versiones de la reclamación
                <span style={{ fontSize: 10, color: 'var(--color-text-tertiary)', fontWeight: 400 }}>
                  {reaperturas.length} versión/es
                </span>
              </div>
              <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                {reaperturas.map((r, i) => (
                  <button
                    key={i}
                    onClick={() => setVersionActiva(i)}
                    style={{ padding: '4px 12px', fontSize: 11, borderRadius: 'var(--border-radius-full)', border: `1.5px solid ${versionActiva === i ? 'var(--color-blue)' : 'var(--color-border-secondary)'}`, background: versionActiva === i ? 'var(--color-blue-light)' : 'none', color: versionActiva === i ? 'var(--color-blue-dark)' : 'var(--color-text-secondary)', cursor: 'pointer', fontWeight: versionActiva === i ? 600 : 400 }}>
                    v{r.version} {i === reaperturas.length - 1 ? '· Actual' : ''}
                  </button>
                ))}
              </div>
              {versionData && (
                <div style={{ padding: '10px 12px', background: 'var(--color-background-secondary)', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--color-border-tertiary)' }}>
                  <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginBottom: 4 }}>{versionData.fecha} · {versionData.motivo}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: versionActiva === reaperturas.length - 1 ? 'var(--color-blue-dark)' : 'var(--color-amber-dark)' }}>
                    {versionActiva === 0 ? versionData.diferencial : `↻ Diferencial: ${versionData.diferencial}`}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── LÍNEA DE TIEMPO ── */}
          {timeline.length > 0 && (
            <div className="card">
              <div className="card-title">Línea de tiempo</div>
              <div style={{ position: 'relative', paddingLeft: 24 }}>
                <div style={{ position: 'absolute', left: 8, top: 8, bottom: 8, width: 2, background: 'var(--color-border-secondary)', borderRadius: 2 }} />
                {timeline.map((t, i) => {
                  const completado = !!t.fecha && !t.activo
                  const activo = t.activo
                  const pendiente = !t.fecha && !t.activo
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: i < timeline.length - 1 ? 18 : 0, position: 'relative' }}>
                      <div style={{ width: 16, height: 16, borderRadius: '50%', background: completado ? 'var(--color-green-border)' : activo ? 'var(--color-blue)' : 'var(--color-border-secondary)', border: `2px solid ${completado ? 'var(--color-green-border)' : activo ? 'var(--color-blue)' : 'var(--color-border-secondary)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginLeft: -8, zIndex: 1, position: 'relative' }}>
                        {completado && <span style={{ fontSize: 8, color: '#fff', fontWeight: 700 }}>✓</span>}
                        {activo && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff', display: 'block' }} />}
                      </div>
                      <div style={{ flex: 1, paddingBottom: 4 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ fontSize: 12, fontWeight: activo ? 700 : completado ? 500 : 400, color: activo ? 'var(--color-blue-dark)' : completado ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)' }}>
                            {t.estado}
                            {activo && <span style={{ marginLeft: 8, fontSize: 10, padding: '1px 6px', borderRadius: 'var(--border-radius-full)', background: 'var(--color-blue)', color: '#fff', fontWeight: 700 }}>Actual</span>}
                          </div>
                          {t.fecha && <span style={{ fontSize: 10, color: 'var(--color-text-tertiary)' }}>{t.fecha}</span>}
                        </div>
                        {t.comunicacion && (
                          <div style={{ marginTop: 4, fontSize: 10, color: 'var(--color-blue-dark)', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span>💬</span>
                            <span>{t.comunicacion}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── COMUNICACIONES INTERMEDIAS ── */}
          {comunicaciones.length > 0 && (
            <div className="card">
              <div className="card-title">
                Comunicaciones
                <button onClick={() => setMostrarComms(mostrarComms ? null : reclamacion.id)} style={{ fontSize: 10, color: 'var(--color-blue-dark)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                  {mostrarComms ? 'Ocultar' : `Ver ${comunicaciones.length}`}
                </button>
              </div>
              {mostrarComms && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {comunicaciones.map((c, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 'var(--border-radius-md)', background: 'var(--color-background-secondary)', border: '1px solid var(--color-border-tertiary)' }}>
                      <span style={{ fontSize: 16 }}>{iconoTipo(c.tipo)}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 11, fontWeight: 600 }}>{c.tipo} · {c.fecha}</div>
                        <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 2 }}>{c.resumen}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="grid2">
            {/* Resumen ARTE */}
            {reclamacion.resumenIA && (
              <div className="card card-blue">
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <div style={{ width: 20, height: 20, background: 'var(--color-blue-light)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'var(--color-blue-dark)', fontWeight: 700 }}>AI</div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-blue-dark)' }}>Resumen ARTE</span>
                  <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 'var(--border-radius-full)', background: 'var(--color-blue-light)', color: 'var(--color-blue-dark)', border: '1px solid var(--color-blue-mid)' }}>Automático</span>
                </div>
                <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>{reclamacion.resumenIA}</div>

                {/* RF-03 — Impacto económico claro */}
                <div style={{ marginTop: 12, padding: '8px 10px', background: 'var(--color-green-light)', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--color-green-border)' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-green-dark)', marginBottom: 3 }}>
                    ✓ Impacto económico estimado
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--color-green-dark)' }}>
                    Abono de <strong>{reclamacion.importeReclamado.toFixed(2)}€</strong> en la próxima factura (estimado)
                  </div>
                </div>
              </div>
            )}

            {/* Conceptos reclamados */}
            {reclamacion.conceptos && reclamacion.conceptos.length > 0 && (
              <div className="card">
                <div className="card-title">Conceptos reclamados</div>
                {reclamacion.conceptos.map(c => (
                  <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid var(--color-border-tertiary)', fontSize: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className={`status-dot ${c.seleccionado ? 'status-dot-err' : 'status-dot-grey'}`} />
                      <span style={{ color: c.seleccionado ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)' }}>{c.descripcion}</span>
                    </div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: c.seleccionado ? 'var(--color-red)' : 'var(--color-text-tertiary)' }}>
                      {c.importe.toFixed(2)}€
                    </span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 13, marginTop: 8, paddingTop: 8, borderTop: '2px solid var(--color-border-secondary)' }}>
                  <span>Total reclamado</span>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-red)' }}>{reclamacion.importeReclamado.toFixed(2)}€</span>
                </div>
              </div>
            )}
          </div>

          {/* Acciones */}
          {(() => {
            const estadoActual = estadoReclamacion[reclamacion.id] || reclamacion.estado
            const resuelta = estadoActual === 'resuelta' || estadoActual === 'denegada' || estadoActual === 'escalada'
            return (
              <div className="card">
                <div className="card-title">
                  Acciones disponibles
                  {resuelta && (
                    <span className={`pill ${estadoActual === 'resuelta' ? 'pill-ok' : estadoActual === 'denegada' ? 'pill-err' : 'pill-blue'}`} style={{ fontSize: 10 }}>
                      {estadoActual === 'resuelta' ? '✓ Resuelta' : estadoActual === 'denegada' ? '✕ Denegada' : '↑ Escalada'}
                    </span>
                  )}
                </div>

                {accionEjecutada && (
                  <div className={`alert fade-in ${accionEjecutada.tipo === 'procedente' ? 'alert-ok' : accionEjecutada.tipo === 'improcedente' ? 'alert-err' : 'alert-blue'}`} style={{ marginBottom: 12 }}>
                    <span>{accionEjecutada.tipo === 'procedente' ? '✓' : accionEjecutada.tipo === 'improcedente' ? '✕' : '↑'}</span>
                    <div style={{ fontSize: 11 }}>{accionEjecutada.detalle}</div>
                  </div>
                )}

                {!resuelta && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

                    {/* Escalar a supervisor */}
                    <div>
                      <button
                        onClick={() => setAccionActiva(accionActiva === 'escalar' ? null : 'escalar')}
                        disabled={cargando}
                        className="btn-secondary"
                        style={{ width: '100%', justifyContent: 'flex-start', height: 'auto', padding: '10px 12px', flexDirection: 'column', alignItems: 'flex-start' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                          <span>↑</span>
                          <span style={{ fontWeight: 600, fontSize: 12 }}>Escalar a supervisor</span>
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)' }}>Derivar a nivel superior con motivo</div>
                      </button>
                      {accionActiva === 'escalar' && (
                        <div className="fade-in" style={{ marginTop: 6, padding: '10px 12px', border: '1px solid var(--color-blue-mid)', borderRadius: 'var(--border-radius-md)', background: 'var(--color-blue-light)' }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-blue-dark)', marginBottom: 6 }}>Motivo de escalada</div>
                          <textarea
                            className="input"
                            placeholder="Describe el motivo por el que escalas esta reclamación..."
                            value={escalarMotivo}
                            onChange={e => setEscalarMotivo(e.target.value)}
                            style={{ height: 60, resize: 'none', marginBottom: 8, paddingTop: 6 }}
                          />
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button
                              onClick={() => ejecutarAccion('escalar', escalarMotivo)}
                              disabled={cargando || escalarMotivo.trim().length < 5}
                              className="btn-primary" style={{ fontSize: 11, flex: 1, justifyContent: 'center' }}>
                              {cargando ? <><span className="spinner spinner-sm" /> Escalando...</> : 'Confirmar escalada'}
                            </button>
                            <button onClick={() => { setAccionActiva(null); setEscalarMotivo('') }} className="btn-secondary" style={{ fontSize: 11 }}>Cancelar</button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Abono parcial */}
                    <div>
                      <button
                        onClick={() => setAccionActiva(accionActiva === 'abono' ? null : 'abono')}
                        disabled={cargando}
                        className="btn-secondary"
                        style={{ width: '100%', justifyContent: 'flex-start', height: 'auto', padding: '10px 12px', flexDirection: 'column', alignItems: 'flex-start' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                          <span>½</span>
                          <span style={{ fontWeight: 600, fontSize: 12 }}>Aplicar abono parcial</span>
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)' }}>
                          Máximo: {reclamacion.importeReclamado.toFixed(2)}€
                        </div>
                      </button>
                      {accionActiva === 'abono' && (
                        <div className="fade-in" style={{ marginTop: 6, padding: '10px 12px', border: '1px solid var(--color-amber-border)', borderRadius: 'var(--border-radius-md)', background: 'var(--color-amber-light)' }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-amber-dark)', marginBottom: 6 }}>
                            Importe a abonar (máx. {reclamacion.importeReclamado.toFixed(2)}€)
                          </div>
                          <input
                            className="input"
                            type="number"
                            placeholder="0.00"
                            min="0"
                            max={reclamacion.importeReclamado}
                            value={abonoParcial}
                            onChange={e => setAbonoParcial(e.target.value)}
                            style={{ marginBottom: 8 }}
                          />
                          {abonoParcial && parseFloat(abonoParcial) > 0 && (
                            <div style={{ fontSize: 11, color: 'var(--color-amber-dark)', marginBottom: 8 }}>
                              Se programará un abono de <strong>{parseFloat(abonoParcial).toFixed(2)}€</strong> en la próxima factura
                            </div>
                          )}
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button
                              onClick={() => ejecutarAccion('abono', abonoParcial)}
                              disabled={cargando || !abonoParcial || parseFloat(abonoParcial) <= 0 || parseFloat(abonoParcial) > reclamacion.importeReclamado}
                              className="btn-primary" style={{ fontSize: 11, flex: 1, justifyContent: 'center' }}>
                              {cargando ? <><span className="spinner spinner-sm" /> Aplicando...</> : 'Confirmar abono'}
                            </button>
                            <button onClick={() => { setAccionActiva(null); setAbonoParcial('') }} className="btn-secondary" style={{ fontSize: 11 }}>Cancelar</button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Resolver procedente */}
                    <div>
                      <button
                        onClick={() => setConfirmando(confirmando === 'procedente' ? null : 'procedente')}
                        disabled={cargando}
                        style={{ width: '100%', justifyContent: 'flex-start', height: 'auto', padding: '10px 12px', flexDirection: 'column', alignItems: 'flex-start', background: 'var(--color-green-light)', border: '1.5px solid var(--color-green-border)', borderRadius: 'var(--border-radius-md)', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                          <span style={{ color: 'var(--color-green-dark)' }}>✓</span>
                          <span style={{ fontWeight: 600, fontSize: 12, color: 'var(--color-green-dark)' }}>Resolver como procedente</span>
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--color-green-dark)', opacity: 0.8 }}>
                          Abono de {reclamacion.importeReclamado.toFixed(2)}€ en próxima factura
                        </div>
                      </button>
                      {confirmando === 'procedente' && (
                        <div className="fade-in" style={{ marginTop: 6, padding: '10px 12px', border: '1px solid var(--color-green-border)', borderRadius: 'var(--border-radius-md)', background: 'var(--color-green-light)' }}>
                          <div style={{ fontSize: 12, color: 'var(--color-green-dark)', marginBottom: 10 }}>
                            ¿Confirmas la resolución favorable? Se programará el abono de <strong>{reclamacion.importeReclamado.toFixed(2)}€</strong> en la próxima factura del cliente.
                          </div>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button
                              onClick={() => ejecutarAccion('procedente')}
                              disabled={cargando}
                              className="btn-success" style={{ fontSize: 11, flex: 1, justifyContent: 'center' }}>
                              {cargando ? <><span className="spinner spinner-sm" /> Resolviendo...</> : '✓ Confirmar resolución'}
                            </button>
                            <button onClick={() => setConfirmando(null)} className="btn-secondary" style={{ fontSize: 11 }}>Cancelar</button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Resolver improcedente */}
                    <div>
                      <button
                        onClick={() => setConfirmando(confirmando === 'improcedente' ? null : 'improcedente')}
                        disabled={cargando}
                        className="btn-danger"
                        style={{ width: '100%', justifyContent: 'flex-start', height: 'auto', padding: '10px 12px', flexDirection: 'column', alignItems: 'flex-start' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                          <span>✕</span>
                          <span style={{ fontWeight: 600, fontSize: 12 }}>Resolver como improcedente</span>
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--color-red-dark)', opacity: 0.8 }}>Denegar — requiere motivo obligatorio</div>
                      </button>
                      {confirmando === 'improcedente' && (
                        <div className="fade-in" style={{ marginTop: 6, padding: '10px 12px', border: '1px solid var(--color-red-border)', borderRadius: 'var(--border-radius-md)', background: 'var(--color-red-light)' }}>
                          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-red-dark)', marginBottom: 6 }}>Motivo de denegación (obligatorio)</div>
                          <textarea
                            className="input"
                            placeholder="Indica el motivo por el que se deniega la reclamación..."
                            value={improcedMotivo}
                            onChange={e => setImprocedMotivo(e.target.value)}
                            style={{ height: 60, resize: 'none', marginBottom: 8, paddingTop: 6 }}
                          />
                          <div style={{ fontSize: 10, color: 'var(--color-red-dark)', marginBottom: 8 }}>
                            Se enviará comunicación al cliente con el motivo de denegación.
                          </div>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button
                              onClick={() => ejecutarAccion('improcedente', improcedMotivo)}
                              disabled={cargando || improcedMotivo.trim().length < 5}
                              className="btn-danger" style={{ fontSize: 11, flex: 1, justifyContent: 'center' }}>
                              {cargando ? <><span className="spinner spinner-sm" /> Denegando...</> : '✕ Confirmar denegación'}
                            </button>
                            <button onClick={() => { setConfirmando(null); setImprocedMotivo('') }} className="btn-secondary" style={{ fontSize: 11 }}>Cancelar</button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {resuelta && (
                  <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', textAlign: 'center', padding: '12px 0' }}>
                    Reclamación {estadoActual} — no se permiten más acciones
                  </div>
                )}
              </div>
            )
          })()}
        </div>
      )}
    </>
  )
}