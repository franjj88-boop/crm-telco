import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { datosCliente } from '../../data/mockData'

type Paso = 'categoria' | 'sintoma' | 'acciones'

const grupos = [
  { id: 'internet', label: 'Internet / Fibra', icon: '🌐', sintomas: ['Sin conexión a internet', 'Conexión muy lenta', 'Cortes intermitentes', 'Router sin luz de internet', 'WiFi no aparece'] },
  { id: 'tv', label: 'Televisión', icon: '📺', sintomas: ['Canales en negro', 'Sin señal de TV', 'Decodificador no enciende', 'Error en pantalla', 'Pixelado o cortes'] },
  { id: 'movil', label: 'Línea móvil', icon: '📱', sintomas: ['Sin cobertura', 'Llamadas se caen', 'Sin datos móviles', 'SMS no llegan', 'No puede llamar'] },
  { id: 'fijo', label: 'Teléfono fijo', icon: '☎️', sintomas: ['Sin tono de llamada', 'No puede realizar llamadas', 'Ruido en la línea', 'No recibe llamadas'] },
]

const accionesPorGrupo: Record<string, { label: string; desc: string; primary?: boolean }[]> = {
  internet: [
    { label: 'Reset CPE / Router', desc: 'Reinicio remoto del equipo de cliente', primary: true },
    { label: 'Reprovisionado de servicio', desc: 'Reenvío de configuración al equipo' },
    { label: 'Diagnóstico de línea', desc: 'Test automático de señal y calidad' },
    { label: 'Derivar a nivel 2', desc: 'Escalar a técnico especialista de red' },
  ],
  tv: [
    { label: 'Refresco de señal TV', desc: 'Re-sincronización del decodificador', primary: true },
    { label: 'Reset decodificador', desc: 'Reinicio remoto del deco' },
    { label: 'Reenvío de suscripciones', desc: 'Reprovisionar canales contratados' },
    { label: 'Derivar a nivel 2', desc: 'Escalar a técnico especialista' },
  ],
  movil: [
    { label: 'Verificar estado SIM', desc: 'Comprobar activación y estado', primary: true },
    { label: 'Reset configuración APN', desc: 'Reenviar configuración de datos' },
    { label: 'Comprobar cobertura zona', desc: 'Verificar mapa de cobertura en dirección' },
    { label: 'Derivar a nivel 2', desc: 'Escalar a técnico especialista' },
  ],
  fijo: [
    { label: 'Test de línea fija', desc: 'Diagnóstico automático de la línea', primary: true },
    { label: 'Reprovisionado de voz', desc: 'Reconfiguración del servicio de voz' },
    { label: 'Derivar a nivel 2', desc: 'Escalar a técnico especialista' },
  ],
}

export function AveriasPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [paso, setPaso] = useState<Paso>('categoria')
  const [grupoSel, setGrupoSel] = useState<string | null>(null)
  const [sintomaSel, setSintomaSel] = useState<string | null>(null)
  const [accionEjecutada, setAccionEjecutada] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)
  const [averiaAbierta, setAveriaAbierta] = useState(false)
  const [nuevaAveriaId, setNuevaAveriaId] = useState<string | null>(null)

  if (!id) return null
  const datos = datosCliente[id]
  if (!datos) return null

  const averiaExistente = datos.averias[0] || null
  const masiva = averiaExistente?.masiva || null
  const bloqueadaImpago = datos.cobros.estadoGeneral === 'vencida'

  const ejecutarAccion = (accion: string) => {
    setCargando(true)
    setTimeout(() => { setCargando(false); setAccionEjecutada(accion) }, 1800)
  }

  const abrirAveria = () => {
    setCargando(true)
    setTimeout(() => {
      setCargando(false)
      setAveriaAbierta(true)
      setNuevaAveriaId(`AV-2026-${Math.floor(Math.random() * 9000 + 1000)}`)
    }, 1500)
  }

  const StepNum = ({ num, label, state }: { num: number; label: string; state: 'done' | 'active' | 'todo' }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{
        width: 22, height: 22, borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 11, fontWeight: 600, flexShrink: 0,
        background: state === 'done' ? 'var(--color-green-border)' : state === 'active' ? 'var(--color-blue)' : 'var(--color-background-secondary)',
        color: state === 'todo' ? 'var(--color-text-tertiary)' : '#fff',
        border: state === 'todo' ? '1px solid var(--color-border-secondary)' : 'none',
      }}>
        {state === 'done' ? '✓' : num}
      </div>
      <span style={{
        fontSize: 11,
        color: state === 'done' ? 'var(--color-green)' : state === 'active' ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)',
        fontWeight: state === 'active' ? 600 : 400
      }}>
        {label}
      </span>
    </div>
  )

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>Gestión de averías</div>
          <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 2 }}>
            Diagnóstico guiado por síntomas · Detección automática de masivas
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {masiva && (
            <span style={{ fontSize: 11, padding: '4px 10px', background: 'var(--color-amber-light)', color: 'var(--color-amber-dark)', borderRadius: 'var(--border-radius-full)', border: '1px solid var(--color-amber-border)', fontWeight: 600 }}>
              ⚠ Masiva activa en zona
            </span>
          )}
          {averiaExistente && (
            <span style={{ fontSize: 11, padding: '4px 10px', background: 'var(--color-blue-light)', color: 'var(--color-blue-dark)', borderRadius: 'var(--border-radius-full)', border: '1px solid var(--color-blue-mid)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
              AV-{averiaExistente.numero}
            </span>
          )}
        </div>
      </div>

      {/* Bloqueo por impago */}
      {bloqueadaImpago && (
        <div className="alert alert-err">
          <span style={{ fontSize: 18 }}>🔒</span>
          <div>
            <div style={{ fontWeight: 700 }}>Tramitación bloqueada por deuda vencida</div>
            <div style={{ fontSize: 11, marginTop: 2 }}>
              No es posible abrir averías técnicas con deuda vencida. Regulariza primero el cobro.
            </div>
            <button onClick={() => navigate(`/cliente/${id}/cobros`)} style={{ marginTop: 8, background: 'var(--color-red-mid)', color: '#fff', border: 'none', borderRadius: 'var(--border-radius-md)', padding: '5px 12px', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}>
              Gestionar cobros →
            </button>
          </div>
        </div>
      )}

      {/* Masiva */}
      {masiva && (
        <div style={{ background: 'var(--color-amber-light)', border: '1px solid var(--color-amber-border)', borderRadius: 'var(--border-radius-lg)', padding: '12px 14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-amber-dark)' }}>📡 Incidencia masiva — {masiva.referencia}</div>
              <div style={{ fontSize: 11, color: 'var(--color-amber)', marginTop: 2 }}>{masiva.descripcion}</div>
            </div>
            <span className="badge badge-warn">En resolución</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 10 }}>
            {[
              { label: 'Alcance', val: masiva.alcance },
              { label: 'ETA resolución', val: masiva.eta },
              { label: 'Última actualización', val: masiva.ultimaActualizacion },
            ].map(row => (
              <div key={row.label} style={{ background: 'rgba(255,255,255,0.6)', borderRadius: 'var(--border-radius-md)', padding: '8px 10px' }}>
                <div style={{ fontSize: 10, color: 'var(--color-amber)', opacity: 0.8, marginBottom: 2 }}>{row.label}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-amber-dark)' }}>{row.val}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => {}} className="btn-warning" style={{ fontSize: 11, background: 'var(--color-amber-accent)', color: '#fff', border: 'none', borderRadius: 'var(--border-radius-md)', padding: '6px 14px', cursor: 'pointer', fontWeight: 600 }}>
              ✓ Suscribir cliente a notificaciones
            </button>
            <button className="btn-secondary" style={{ fontSize: 11 }}>
              Enviar SMS informativo
            </button>
          </div>
        </div>
      )}

      {/* Avería existente */}
      {averiaExistente && (
        <div className="card card-err">
          <div className="card-title">
            Avería activa — {averiaExistente.numero}
            <span className={`pill ${averiaExistente.estado === 'resuelta' ? 'pill-ok' : averiaExistente.estado === 'bloqueada_impago' ? 'pill-err' : averiaExistente.estado === 'asociada_masiva' ? 'pill-warn' : 'pill-blue'}`}>
              {averiaExistente.estado.replace(/_/g, ' ')}
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
            {[
              { label: 'Síntoma', val: averiaExistente.sintoma },
              { label: 'Producto', val: averiaExistente.producto },
              { label: 'Prioridad', val: averiaExistente.prioridad },
              { label: 'Fecha apertura', val: averiaExistente.fechaApertura },
              { label: 'SLA activo', val: averiaExistente.slaActivo ? 'Sí' : 'No — suspendido' },
            ].map(row => (
              <div key={row.label} className="table-row" style={{ gridColumn: row.label === 'Síntoma' ? '1/-1' : 'auto' }}>
                <span className="table-row-label">{row.label}</span>
                <span className="table-row-value">{row.val}</span>
              </div>
            ))}
          </div>
          <div style={{ padding: '8px 10px', background: 'var(--color-background-secondary)', borderRadius: 'var(--border-radius-md)', fontSize: 11, color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
            <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>Diagnóstico técnico: </span>
            {averiaExistente.diagnosticoTecnico}
          </div>
          {averiaExistente.acciones.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Acciones registradas</div>
              {averiaExistente.acciones.map((a, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 3 }}>
                  <span className="status-dot status-dot-ok" style={{ marginTop: 3 }} />
                  {a}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="grid2">
        {/* Diagnóstico guiado */}
        <div className="card">
          <div className="card-title">Diagnóstico guiado por síntomas</div>

          {/* Stepper */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <StepNum num={1} label="Categoría" state={grupoSel ? 'done' : paso === 'categoria' ? 'active' : 'todo'} />
            <div style={{ flex: 1, height: 1, background: grupoSel ? 'var(--color-green-border)' : 'var(--color-border-secondary)' }} />
            <StepNum num={2} label="Síntoma" state={sintomaSel ? 'done' : paso === 'sintoma' ? 'active' : 'todo'} />
            <div style={{ flex: 1, height: 1, background: sintomaSel ? 'var(--color-green-border)' : 'var(--color-border-secondary)' }} />
            <StepNum num={3} label="Acciones" state={paso === 'acciones' ? 'active' : 'todo'} />
          </div>

          {/* Paso 1 */}
          {paso === 'categoria' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 4 }}>¿Dónde tiene el problema el cliente?</div>
              {grupos.map(g => (
                <button
                  key={g.id}
                  onClick={() => { setGrupoSel(g.id); setPaso('sintoma') }}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', border: '1px solid var(--color-border-tertiary)', borderRadius: 'var(--border-radius-md)', cursor: 'pointer', fontSize: 12, color: 'var(--color-text-primary)', background: 'var(--color-background-secondary)', textAlign: 'left', fontFamily: 'var(--font-sans)', transition: 'all 0.1s', fontWeight: 500 }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-blue-light)'; e.currentTarget.style.borderColor = 'var(--color-blue-mid)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'var(--color-background-secondary)'; e.currentTarget.style.borderColor = 'var(--color-border-tertiary)' }}
                >
                  <span style={{ fontSize: 20, width: 28, textAlign: 'center' }}>{g.icon}</span>
                  {g.label}
                </button>
              ))}
            </div>
          )}

          {/* Paso 2 */}
          {paso === 'sintoma' && grupoSel && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <button onClick={() => { setPaso('categoria'); setSintomaSel(null) }} className="btn-ghost" style={{ fontSize: 11, padding: '2px 6px' }}>← Atrás</button>
                <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>Selecciona el síntoma principal</span>
              </div>
              {grupos.find(g => g.id === grupoSel)?.sintomas.map(s => (
                <button
                  key={s}
                  onClick={() => { setSintomaSel(s); setPaso('acciones') }}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', border: '1px solid var(--color-border-tertiary)', borderRadius: 'var(--border-radius-md)', cursor: 'pointer', fontSize: 12, background: 'var(--color-background-secondary)', color: 'var(--color-text-primary)', textAlign: 'left', fontFamily: 'var(--font-sans)', transition: 'all 0.1s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-blue-light)'; e.currentTarget.style.borderColor = 'var(--color-blue-mid)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'var(--color-background-secondary)'; e.currentTarget.style.borderColor = 'var(--color-border-tertiary)' }}
                >
                  <span className="status-dot status-dot-blue" />
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Paso 3 */}
          {paso === 'acciones' && sintomaSel && grupoSel && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <button onClick={() => { setPaso('sintoma'); setAccionEjecutada(null) }} className="btn-ghost" style={{ fontSize: 11, padding: '2px 6px' }}>← Atrás</button>
                <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>Síntoma: <strong>{sintomaSel}</strong></span>
              </div>

              {accionEjecutada && (
                <div className="alert alert-ok">
                  <span>✓</span>
                  <span style={{ fontWeight: 600 }}>{accionEjecutada} ejecutado</span>
                </div>
              )}

              {(accionesPorGrupo[grupoSel] || []).map(a => (
                <button
                  key={a.label}
                  onClick={() => !bloqueadaImpago && !masiva && ejecutarAccion(a.label)}
                  disabled={bloqueadaImpago || !!masiva || cargando}
                  style={{
                    padding: '9px 12px',
                    border: `1px solid ${a.primary ? 'var(--color-blue-mid)' : 'var(--color-border-tertiary)'}`,
                    borderRadius: 'var(--border-radius-md)',
                    fontSize: 11, cursor: bloqueadaImpago || masiva ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', gap: 10,
                    background: a.primary ? 'var(--color-blue-light)' : 'var(--color-background-secondary)',
                    color: a.primary ? 'var(--color-blue-dark)' : 'var(--color-text-primary)',
                    textAlign: 'left', width: '100%', fontFamily: 'var(--font-sans)',
                    opacity: bloqueadaImpago || masiva ? 0.5 : 1,
                  }}
                >
                  <span className={`status-dot ${a.primary ? 'status-dot-blue' : 'status-dot-grey'}`} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>{a.label}</div>
                    <div style={{ fontSize: 10, opacity: 0.7, marginTop: 1 }}>{a.desc}</div>
                  </div>
                  {cargando && <span className="spinner spinner-sm" />}
                </button>
              ))}

              {masiva && (
                <div className="alert alert-warn">
                  <span>⚠</span>
                  <span>Acciones técnicas deshabilitadas — incidencia masiva activa en zona</span>
                </div>
              )}

              {!averiaAbierta && !bloqueadaImpago && !masiva && (
                <button onClick={abrirAveria} disabled={cargando} className="btn-primary" style={{ justifyContent: 'center', marginTop: 4 }}>
                  {cargando ? <><span className="spinner spinner-sm" /> Abriendo...</> : '+ Abrir avería técnica'}
                </button>
              )}

              {averiaAbierta && (
                <div className="alert alert-ok">
                  <span>✓</span>
                  <div>
                    <div style={{ fontWeight: 600 }}>Avería abierta — {nuevaAveriaId}</div>
                    <div style={{ fontSize: 11, marginTop: 2 }}>SLA activado · Técnico asignado en los próximos minutos</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Panel estado técnico */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="card">
            <div className="card-title">Estado técnico en tiempo real</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {[
                { label: 'Red fibra / OLT', ok: datos.averias.length === 0, val: datos.averias.length === 0 ? 'OK — señal estable' : 'Señal degradada' },
                { label: 'CPE / Router', ok: !bloqueadaImpago, val: bloqueadaImpago ? 'Suspendido administrativamente' : 'OK — conectado' },
                { label: 'Masivas en zona', ok: !masiva, val: masiva ? `1 activa — ${masiva.referencia}` : 'Sin masivas activas' },
                { label: 'Validación administrativa', ok: !bloqueadaImpago, val: bloqueadaImpago ? 'BLOQUEADO — deuda vencida' : 'OK — sin restricciones' },
              ].map(row => (
                <div key={row.label} className="table-row">
                  <span className="table-row-label">{row.label}</span>
                  <span className={`pill ${row.ok ? 'pill-ok' : 'pill-err'}`} style={{ fontSize: 10 }}>{row.val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Contexto IVR */}
          {averiaExistente && (
            <div className="card card-blue">
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <div style={{ width: 20, height: 20, background: 'var(--color-blue-light)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'var(--color-blue-dark)', fontWeight: 700 }}>AI</div>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-blue-dark)' }}>Contexto detectado por IVR</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                Cliente con <strong style={{ color: 'var(--color-text-primary)' }}>{averiaExistente.sintoma}</strong>.
                Estado actual: <strong style={{ color: 'var(--color-text-primary)' }}>{averiaExistente.diagnosticoTecnico}</strong>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}