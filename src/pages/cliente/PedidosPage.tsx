import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { datosCliente } from '../../data/mockData'

export function PedidosPage() {
  const { id } = useParams()
  const [reprogramando, setReprogramando] = useState(false)
  const [notificado, setNotificado] = useState(false)
  const [notificando, setNotificando] = useState(false)
  const [pedidoActivoId, setPedidoActivoId] = useState<string | null>(null)
  const [vistaHistorial, setVistaHistorial] = useState(false)
  const [busqueda, setBusqueda] = useState('')
  const [busquedaActiva, setBusquedaActiva] = useState(false)
  const [mostrarITSM, setMostrarITSM] = useState(false)
  const [accionITSM, setAccionITSM] = useState<string | null>(null)
  const [itsmEjecutado, setItsmEjecutado] = useState(false)

  if (!id) return null
  const datos = datosCliente[id]
  if (!datos) return null

  const pedidosActivos = datos.pedidos.filter(p => p.estado !== 'completado' && p.estado !== 'cancelado')
  const pedidosCompletados = datos.pedidos.filter(p => p.estado === 'completado' || p.estado === 'cancelado')

  const pedidoSel = pedidoActivoId
    ? datos.pedidos.find(p => p.id === pedidoActivoId)
    : pedidosActivos[0] || null

  const notificar = () => {
    setNotificando(true)
    setTimeout(() => { setNotificando(false); setNotificado(true); setTimeout(() => setNotificado(false), 3500) }, 1500)
  }

  const estadoColor = (e: string) => {
    if (e === 'completado') return 'pill-ok'
    if (e === 'en_instalacion' || e === 'en_validacion') return 'pill-blue'
    if (e === 'en_incidencia' || e === 'cancelado') return 'pill-err'
    if (e === 'prepedido') return 'pill-warn'
    return 'pill-neutral'
  }

  const estadoIcono = (e: string) => {
    if (e === 'completado') return '✓'
    if (e === 'en_instalacion') return '🔧'
    if (e === 'en_validacion') return '🔍'
    if (e === 'en_incidencia') return '⚠'
    if (e === 'cancelado') return '✕'
    if (e === 'prepedido') return '⏳'
    return '○'
  }

  const calcularProgreso = (eventos: { resultado: string }[]) => {
    if (!eventos.length) return 0
    const ok = eventos.filter(e => e.resultado === 'ok').length
    return Math.round((ok / eventos.length) * 100)
  }

  return (
    <>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>Seguimiento de pedidos</div>
          <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 2 }}>
            Estado de contrataciones en curso · "¿Cómo va lo mío?"
          </div>
        </div>
      </div>

      {/* RF-SEG-PED-02 — Búsqueda por múltiples claves */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && setBusquedaActiva(true)}
          placeholder="Buscar por ID pedido, teléfono, email, MLP..."
          className="input"
          style={{ flex: 1, height: 34 }}
        />
        <button
          onClick={() => setBusquedaActiva(!!busqueda.trim())}
          className="btn-secondary"
          style={{ fontSize: 11, height: 34 }}>
          🔍 Buscar
        </button>
        {busquedaActiva && (
          <button onClick={() => { setBusqueda(''); setBusquedaActiva(false) }} className="btn-ghost" style={{ fontSize: 11 }}>
            ✕ Limpiar
          </button>
        )}
      </div>

      {/* Resultado búsqueda simulado */}
      {busquedaActiva && busqueda.trim() && (
        <div className="card fade-in" style={{ border: '1.5px solid var(--color-blue-mid)', background: 'var(--color-blue-light)' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-blue-dark)', marginBottom: 8 }}>
            Resultados para "{busqueda}"
          </div>
          {datos.pedidos.filter(p =>
            p.numero.toLowerCase().includes(busqueda.toLowerCase()) ||
            p.producto.toLowerCase().includes(busqueda.toLowerCase()) ||
            busqueda.toLowerCase().includes('@') ||
            !!busqueda.match(/^\d{9}$/)
          ).length > 0 ? (
            datos.pedidos.map(p => (
              <div key={p.id}
                onClick={() => { setPedidoActivoId(p.id); setBusquedaActiva(false); setBusqueda(''); setVistaHistorial(false) }}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', borderRadius: 'var(--border-radius-md)', background: 'rgba(255,255,255,0.7)', border: '1px solid var(--color-blue-mid)', cursor: 'pointer', marginBottom: 4 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-blue-dark)' }}>{p.numero}</div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{p.producto} · {p.tipo}</div>
                </div>
                <span className={`pill ${estadoColor(p.estado)}`} style={{ fontSize: 10 }}>{p.estado.replace(/_/g, ' ')}</span>
              </div>
            ))
          ) : (
            <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', padding: '8px 0' }}>
              Sin resultados. Comprueba el identificador introducido.
            </div>
          )}
          <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', marginTop: 6, fontStyle: 'italic' }}>
            Búsqueda por: ID pedido · teléfono · email · MLP · dirección
          </div>
        </div>
      )}

      {datos.pedidos.length === 0 ? (
        <div style={{ background: 'var(--color-background-primary)', border: '1px solid var(--color-border-tertiary)', borderRadius: 'var(--border-radius-lg)', padding: 32, textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: 12 }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📦</div>
          No hay pedidos en curso para este cliente.
          <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginTop: 8 }}>
            Puedes iniciar una nueva contratación desde el módulo de Ventas.
          </div>
        </div>
      ) : (
        <>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--color-border-tertiary)' }}>
            {[
              { key: false, label: `En curso (${pedidosActivos.length})` },
              { key: true,  label: `Historial (${pedidosCompletados.length})` },
            ].map(tab => (
              <button
                key={String(tab.key)}
                onClick={() => setVistaHistorial(tab.key)}
                style={{
                  padding: '8px 16px',
                  fontSize: 12,
                  fontWeight: vistaHistorial === tab.key ? 700 : 400,
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  borderBottom: vistaHistorial === tab.key ? '2px solid var(--color-blue)' : '2px solid transparent',
                  color: vistaHistorial === tab.key ? 'var(--color-blue)' : 'var(--color-text-secondary)',
                  transition: 'all 0.15s',
                }}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Alertas globales */}
          {notificado && (
            <div className="alert alert-ok fade-in">
              <span>✓</span>
              <span style={{ fontWeight: 600 }}>Estado enviado al cliente por SMS y email</span>
            </div>
          )}

          {/* ─── VISTA HISTORIAL ─── */}
          {vistaHistorial ? (
            pedidosCompletados.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 32, color: 'var(--color-text-tertiary)', fontSize: 12 }}>
                No hay pedidos completados o cancelados aún.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {pedidosCompletados.map(p => (
                  <div key={p.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>{p.numero}</div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 2 }}>{p.producto} · {p.tipo}</div>
                      <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', marginTop: 2 }}>Creado: {p.fechaCreacion}</div>
                    </div>
                    <span className={`pill ${estadoColor(p.estado)}`}>
                      {estadoIcono(p.estado)} {p.estado.replace(/_/g, ' ')}
                    </span>
                  </div>
                ))}
              </div>
            )
          ) : (
            /* ─── VISTA EN CURSO ─── */
            <>
              {/* Selector multi-pedido */}
              {pedidosActivos.length > 1 && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {pedidosActivos.map(p => (
                    <button
                      key={p.id}
                      onClick={() => setPedidoActivoId(p.id)}
                      className={pedidoSel?.id === p.id ? 'btn-primary' : 'btn-secondary'}
                      style={{ fontSize: 11 }}>
                      {p.numero} — {p.producto}
                    </button>
                  ))}
                </div>
              )}

              {/* RF-SEG-PED-01 RN-11 — Alarmas jerárquicas */}
              {(() => {
                const pedidoEnVuelo = pedidosActivos.find(p => p.estado !== 'prepedido')
                const prepedidoBloqueo = pedidosActivos.find(p => p.estado === 'prepedido')
                const enIncidencia = pedidosActivos.find(p => p.estado === 'en_incidencia')

                if (!pedidoEnVuelo && !prepedidoBloqueo && !enIncidencia) return null
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {pedidoEnVuelo && (
                      <div style={{ padding: '8px 12px', borderRadius: 'var(--border-radius-md)', background: 'var(--color-blue-light)', border: '1.5px solid var(--color-blue-mid)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: 11, color: 'var(--color-blue-dark)' }}>
                          <strong>📦 Pedido en vuelo</strong> — {pedidoEnVuelo.numero} · {pedidoEnVuelo.proximoHito}
                        </div>
                        <button onClick={() => { setPedidoActivoId(pedidoEnVuelo.id); setVistaHistorial(false) }}
                          style={{ fontSize: 10, padding: '3px 8px', borderRadius: 9999, border: '1px solid var(--color-blue-mid)', background: 'white', color: 'var(--color-blue-dark)', cursor: 'pointer', fontWeight: 600, flexShrink: 0, marginLeft: 10 }}>
                          Ver →
                        </button>
                      </div>
                    )}
                    {enIncidencia && (
                      <div style={{ padding: '8px 12px', borderRadius: 'var(--border-radius-md)', background: 'var(--color-red-light)', border: '1.5px solid var(--color-red-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: 11, color: 'var(--color-red-dark)' }}>
                          <strong>⚠ Incidencia bloqueante</strong> — {enIncidencia.numero} requiere atención
                        </div>
                        <button onClick={() => { setPedidoActivoId(enIncidencia.id); setVistaHistorial(false) }}
                          style={{ fontSize: 10, padding: '3px 8px', borderRadius: 9999, border: '1px solid var(--color-red-border)', background: 'white', color: 'var(--color-red-dark)', cursor: 'pointer', fontWeight: 600, flexShrink: 0, marginLeft: 10 }}>
                          Gestionar →
                        </button>
                      </div>
                    )}
                    {prepedidoBloqueo && !pedidoEnVuelo && (
                      <div style={{ padding: '8px 12px', borderRadius: 'var(--border-radius-md)', background: 'var(--color-amber-light)', border: '1px solid var(--color-amber-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: 11, color: 'var(--color-amber-dark)' }}>
                          <strong>⏳ Prepedido pendiente</strong> — {prepedidoBloqueo.numero} · Revisar bloqueos
                        </div>
                        <button onClick={() => { setPedidoActivoId(prepedidoBloqueo.id); setVistaHistorial(false) }}
                          style={{ fontSize: 10, padding: '3px 8px', borderRadius: 9999, border: '1px solid var(--color-amber-border)', background: 'white', color: 'var(--color-amber-dark)', cursor: 'pointer', fontWeight: 600, flexShrink: 0, marginLeft: 10 }}>
                          Revisar →
                        </button>
                      </div>
                    )}
                  </div>
                )
              })()}

              {pedidosActivos.length === 0 && (
                <div style={{ textAlign: 'center', padding: 32, color: 'var(--color-text-tertiary)', fontSize: 12 }}>
                  No hay pedidos activos en este momento.
                </div>
              )}

              {pedidoSel && (() => {
                const progreso = calcularProgreso(pedidoSel.eventos)
                return (
                  <div className="grid2">
                    {/* COLUMNA IZQUIERDA */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

                      {/* Resumen pedido */}
                      <div className="card">
                        <div className="card-title">
                          {pedidoSel.numero}
                          <span className={`pill ${estadoColor(pedidoSel.estado)}`}>{pedidoSel.estado.replace(/_/g, ' ')}</span>
                        </div>

                        {/* RF-SEG-PED-03 — Vista prepedido con bloqueos */}
                        {pedidoSel.estado === 'prepedido' && (
                          <div className="fade-in" style={{ marginBottom: 12, padding: '10px 12px', borderRadius: 'var(--border-radius-md)', background: 'var(--color-amber-light)', border: '1px solid var(--color-amber-border)' }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-amber-dark)', marginBottom: 8 }}>
                              ⏳ Prepedido — Pendiente de validaciones
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                              {[
                                { check: true, label: 'Identificación del cliente', desc: 'DNI/NIF verificado' },
                                { check: false, label: 'Dirección validada', desc: 'Pendiente — verificar numeración de entrada' },
                                { check: false, label: 'Cobertura verificada', desc: 'Pendiente — confirmar disponibilidad en zona' },
                                { check: true, label: 'Oferta configurada', desc: 'Producto seleccionado y precio confirmado' },
                              ].map((item, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 11 }}>
                                  <span style={{ color: item.check ? 'var(--color-green-dark)' : 'var(--color-red-dark)', fontWeight: 700, flexShrink: 0 }}>
                                    {item.check ? '✓' : '✕'}
                                  </span>
                                  <div>
                                    <div style={{ fontWeight: 600, color: item.check ? 'var(--color-green-dark)' : 'var(--color-red-dark)' }}>{item.label}</div>
                                    <div style={{ color: 'var(--color-text-tertiary)', fontSize: 10 }}>{item.desc}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                            <button style={{ marginTop: 10, width: '100%', padding: '7px', background: 'var(--color-amber-accent)', color: '#fff', border: 'none', borderRadius: 'var(--border-radius-md)', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                              Completar validaciones → Emitir pedido
                            </button>
                          </div>
                        )}

                        {/* Barra de progreso */}
                        <div style={{ marginBottom: 12 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--color-text-tertiary)', marginBottom: 4 }}>
                            <span>Progreso del pedido</span>
                            <span style={{ fontWeight: 700, color: progreso === 100 ? 'var(--color-green)' : 'var(--color-blue)' }}>{progreso}%</span>
                          </div>
                          <div style={{ height: 6, background: 'var(--color-border-tertiary)', borderRadius: 9999, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${progreso}%`, background: progreso === 100 ? 'var(--color-green-border)' : 'var(--color-blue)', borderRadius: 9999, transition: 'width 0.4s ease' }} />
                          </div>
                        </div>

                        {[
                          { label: 'Producto', val: pedidoSel.producto },
                          { label: 'Tipo', val: pedidoSel.tipo },
                          { label: 'Fecha creación', val: pedidoSel.fechaCreacion },
                          { label: 'Próximo hito', val: pedidoSel.proximoHito },
                          { label: 'Fecha estimada', val: pedidoSel.fechaProximoHito || 'Por confirmar' },
                        ].map(row => (
                          <div key={row.label} className="table-row">
                            <span className="table-row-label">{row.label}</span>
                            <span className="table-row-value">{row.val}</span>
                          </div>
                        ))}
                      </div>

                      {/* "¿Cómo va lo mío?" — resumen natural */}
                      <div className="card" style={{ background: 'var(--color-blue-light)', border: '1.5px solid var(--color-blue-mid)' }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-blue-dark)', marginBottom: 8 }}>💬 ¿Cómo va lo mío? — Resumen para el cliente</div>
                        <div style={{ fontSize: 12, color: 'var(--color-blue-dark)', lineHeight: 1.7 }}>
                          {progreso === 100
                            ? `Tu pedido ${pedidoSel.numero} para ${pedidoSel.producto} está completado. ¡Todo listo!`
                            : pedidoSel.citaFecha
                              ? `Tu pedido está en marcha. Tienes cita con el técnico el ${pedidoSel.citaFecha}${pedidoSel.citaHora ? ` de ${pedidoSel.citaHora}` : ''}. Te avisaremos si hay cambios.`
                              : `Tu pedido ${pedidoSel.numero} está en proceso. El próximo paso es: ${pedidoSel.proximoHito}${pedidoSel.fechaProximoHito ? ` (estimado ${pedidoSel.fechaProximoHito})` : ''}.`
                          }
                        </div>
                        <button onClick={notificar} disabled={notificando} className="btn-primary" style={{ marginTop: 10, justifyContent: 'center', width: '100%', fontSize: 11, background: 'var(--color-blue)' }}>
                          {notificando ? <><span className="spinner spinner-sm" /> Enviando...</> : '📱 Enviar este resumen al cliente'}
                        </button>
                      </div>

                      {/* Cita */}
                      {pedidoSel.citaFecha && (
                        <div className="card card-blue">
                          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-blue-dark)', marginBottom: 10 }}>📅 Cita programada</div>
                          <div className="grid2" style={{ gap: 8, marginBottom: 10 }}>
                            {[
                              { label: 'Fecha', val: pedidoSel.citaFecha },
                              { label: 'Hora', val: pedidoSel.citaHora || '—' },
                              { label: 'Técnico', val: pedidoSel.citaAgente ? pedidoSel.citaAgente.split(' ')[0] : '—' },
                            ].map(row => (
                              <div key={row.label} style={{ background: 'rgba(255,255,255,0.6)', borderRadius: 'var(--border-radius-md)', padding: '8px 10px' }}>
                                <div style={{ fontSize: 10, color: 'var(--color-blue-dark)', opacity: 0.7, marginBottom: 2 }}>{row.label}</div>
                                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-blue-dark)' }}>{row.val}</div>
                              </div>
                            ))}
                          </div>
                          <button onClick={() => setReprogramando(!reprogramando)} className="btn-secondary" style={{ width: '100%', justifyContent: 'center', fontSize: 11, marginBottom: 6 }}>
                            📅 Reprogramar cita
                          </button>

                          {reprogramando && (
                            <div style={{ marginTop: 6, padding: 10, background: 'rgba(255,255,255,0.7)', borderRadius: 'var(--border-radius-md)' }}>
                              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-blue-dark)', marginBottom: 8 }}>Selecciona nuevo horario</div>
                              {['20/04/2026 · 09:00 – 13:00', '21/04/2026 · 10:00 – 14:00', '22/04/2026 · 16:00 – 20:00', '24/04/2026 · 09:00 – 13:00'].map(slot => (
                                <div key={slot} onClick={() => setReprogramando(false)}
                                  style={{ padding: '8px 10px', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--color-blue-mid)', marginBottom: 4, fontSize: 11, color: 'var(--color-blue-dark)', cursor: 'pointer', background: 'white', fontWeight: 500 }}
                                  onMouseEnter={e => e.currentTarget.style.background = 'var(--color-blue-light)'}
                                  onMouseLeave={e => e.currentTarget.style.background = 'white'}>
                                  {slot}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Acciones */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={notificar} disabled={notificando} className="btn-primary" style={{ flex: 1, justifyContent: 'center', fontSize: 11 }}>
                            {notificando ? <><span className="spinner spinner-sm" /> Enviando...</> : '📱 Enviar estado por SMS'}
                          </button>
                          <button onClick={() => setMostrarITSM(!mostrarITSM)} className="btn-secondary" style={{ flex: 1, justifyContent: 'center', fontSize: 11 }}>
                            🔧 Gestión ITSM
                          </button>
                        </div>

                        {/* RF-SEG-PED-05 — Panel gestión ITSM */}
                        {mostrarITSM && (
                          <div className="fade-in" style={{ padding: '12px', borderRadius: 'var(--border-radius-md)', background: 'var(--color-background-secondary)', border: '1px solid var(--color-border-secondary)' }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 10 }}>
                              Gestión de incidencias ITSM
                            </div>
                            {itsmEjecutado ? (
                              <div className="alert alert-ok fade-in">
                                <span>✓</span>
                                <div>
                                  <div style={{ fontWeight: 600 }}>{accionITSM} — ejecutado</div>
                                  <div style={{ fontSize: 10, marginTop: 2 }}>Trazabilidad: {new Date().toLocaleString('es-ES')} · Vinculado a {pedidoSel.numero}</div>
                                </div>
                              </div>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {[
                                  { id: 'abrir', label: '+ Abrir incidencia ITSM', desc: 'Nueva incidencia vinculada al pedido', color: 'var(--color-blue)' },
                                  { id: 'actualizar', label: '✎ Actualizar incidencia', desc: 'Añadir nota o cambiar estado', color: 'var(--color-text-secondary)' },
                                  { id: 'escalar', label: '⬆ Escalar a N2', desc: 'Derivar a técnico especialista con contexto completo', color: 'var(--color-amber-dark)' },
                                  { id: 'cerrar', label: '✓ Cerrar incidencia', desc: 'Marcar como resuelta y registrar cierre', color: 'var(--color-green-dark)' },
                                ].map(a => (
                                  <button key={a.id}
                                    onClick={() => {
                                      setAccionITSM(a.label)
                                      setTimeout(() => setItsmEjecutado(true), 1500)
                                    }}
                                    style={{ padding: '8px 10px', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--color-border-tertiary)', background: 'var(--color-background-primary)', fontSize: 11, cursor: 'pointer', textAlign: 'left', display: 'flex', gap: 8, alignItems: 'flex-start', fontFamily: 'var(--font-sans)' }}>
                                    <div>
                                      <div style={{ fontWeight: 600, color: a.color }}>{a.label}</div>
                                      <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', marginTop: 2 }}>{a.desc}</div>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Aviso incidencia bloqueante */}
                        {pedidoSel.estado === 'en_incidencia' && (
                          <div style={{ padding: '8px 12px', borderRadius: 'var(--border-radius-md)', background: 'var(--color-red-light)', border: '1.5px solid var(--color-red-border)', fontSize: 11, color: 'var(--color-red-dark)' }}>
                            <div style={{ fontWeight: 700, marginBottom: 3 }}>⚠ Incidencia bloqueante activa</div>
                            <div>Este pedido tiene una incidencia que bloquea la provisión. Gestionar desde el panel ITSM o escalar a N2.</div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* COLUMNA DERECHA — Timeline */}
                    <div className="card">
                      <div className="card-title">Línea temporal de eventos</div>
                      <div style={{ position: 'relative', paddingLeft: 24 }}>
                        {pedidoSel.eventos.map((ev, i) => (
                          <div key={ev.id} style={{ position: 'relative', paddingBottom: i < pedidoSel.eventos.length - 1 ? 20 : 0 }}>
                            {/* Línea vertical */}
                            {i < pedidoSel.eventos.length - 1 && (
                              <div style={{ position: 'absolute', left: -16, top: 16, width: 1, height: '100%', background: ev.resultado === 'ok' ? 'var(--color-green-mid)' : 'var(--color-border-secondary)' }} />
                            )}
                            {/* Punto */}
                            <div style={{
                              position: 'absolute', left: -20, top: 4, width: 10, height: 10, borderRadius: '50%',
                              background: ev.resultado === 'ok' ? 'var(--color-green-border)' : ev.resultado === 'error' ? 'var(--color-red-mid)' : 'var(--color-amber-mid)',
                              border: '2px solid white',
                              boxShadow: `0 0 0 1px ${ev.resultado === 'ok' ? 'var(--color-green-mid)' : ev.resultado === 'error' ? 'var(--color-red-mid)' : 'var(--color-amber-mid)'}`,
                            }} />
                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                                <div style={{ fontSize: 12, fontWeight: 600, color: ev.resultado === 'pendiente' ? 'var(--color-text-tertiary)' : 'var(--color-text-primary)' }}>
                                  {ev.tipo}
                                </div>
                                <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-mono)' }}>{ev.fecha}</div>
                              </div>
                              <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>{ev.descripcion}</div>
                              {ev.resultado === 'pendiente' && (
                                <span className="pill pill-warn" style={{ fontSize: 9, marginTop: 4, display: 'inline-block' }}>Pendiente</span>
                              )}
                              {ev.resultado === 'error' && (
                                <span className="pill pill-err" style={{ fontSize: 9, marginTop: 4, display: 'inline-block' }}>Error</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              })()}
            </>
          )}
        </>
      )}
    </>
  )
}
