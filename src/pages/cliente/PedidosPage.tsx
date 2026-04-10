import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { datosCliente } from '../../data/mockData'

export function PedidosPage() {
  const { id } = useParams()
  const [reprogramando, setReprogramando] = useState(false)
  const [notificado, setNotificado] = useState(false)
  const [notificando, setNotificando] = useState(false)

  if (!id) return null
  const datos = datosCliente[id]
  if (!datos) return null

  const pedido = datos.pedidos[0] || null

  const notificar = () => {
    setNotificando(true)
    setTimeout(() => {
      setNotificando(false)
      setNotificado(true)
      setTimeout(() => setNotificado(false), 3000)
    }, 1500)
  }

  const estadoColor = (e: string) => {
    if (e === 'completado') return 'pill-ok'
    if (e === 'en_instalacion' || e === 'en_validacion') return 'pill-blue'
    if (e === 'en_incidencia' || e === 'cancelado') return 'pill-err'
    if (e === 'prepedido') return 'pill-warn'
    return 'pill-neutral'
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>Seguimiento de pedidos</div>
          <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 2 }}>
            Estado de contrataciones en curso · "¿Cómo va lo mío?"
          </div>
        </div>
      </div>

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
          {notificado && (
            <div className="alert alert-ok fade-in">
              <span>✓</span>
              <span style={{ fontWeight: 600 }}>Estado enviado al cliente por SMS y email</span>
            </div>
          )}

          {pedido && (
            <div className="grid2">
              {/* Resumen pedido */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div className="card">
                  <div className="card-title">
                    Pedido {pedido.numero}
                    <span className={`pill ${estadoColor(pedido.estado)}`}>
                      {pedido.estado.replace(/_/g, ' ')}
                    </span>
                  </div>
                  {[
                    { label: 'Producto', val: pedido.producto },
                    { label: 'Tipo', val: pedido.tipo },
                    { label: 'Fecha creación', val: pedido.fechaCreacion },
                    { label: 'Próximo hito', val: pedido.proximoHito },
                    { label: 'Fecha estimada', val: pedido.fechaProximoHito || 'Por confirmar' },
                  ].map(row => (
                    <div key={row.label} className="table-row">
                      <span className="table-row-label">{row.label}</span>
                      <span className="table-row-value">{row.val}</span>
                    </div>
                  ))}
                </div>

                {/* Cita */}
                {pedido.citaFecha && (
                  <div className="card card-blue">
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-blue-dark)', marginBottom: 10 }}>
                      📅 Cita programada
                    </div>
                    <div className="grid2" style={{ gap: 8, marginBottom: 10 }}>
                      {[
                        { label: 'Fecha', val: pedido.citaFecha },
                        { label: 'Hora', val: pedido.citaHora || '—' },
                        { label: 'Técnico', val: pedido.citaAgente || '—' },
                      ].map(row => (
                        <div key={row.label} style={{ background: 'rgba(255,255,255,0.6)', borderRadius: 'var(--border-radius-md)', padding: '8px 10px' }}>
                          <div style={{ fontSize: 10, color: 'var(--color-blue-dark)', opacity: 0.7, marginBottom: 2 }}>{row.label}</div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-blue-dark)' }}>{row.val}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => setReprogramando(!reprogramando)}
                        className="btn-secondary"
                        style={{ flex: 1, justifyContent: 'center', fontSize: 11 }}>
                        Reprogramar cita
                      </button>
                      <button
                        onClick={notificar}
                        disabled={notificando}
                        className="btn-primary"
                        style={{ flex: 1, justifyContent: 'center', fontSize: 11 }}>
                        {notificando ? <><span className="spinner spinner-sm" /> Enviando...</> : 'Notificar cliente'}
                      </button>
                    </div>

                    {/* Slots reprogramación */}
                    {reprogramando && (
                      <div style={{ marginTop: 10, padding: '10px', background: 'rgba(255,255,255,0.7)', borderRadius: 'var(--border-radius-md)' }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-blue-dark)', marginBottom: 8 }}>Selecciona nuevo horario</div>
                        {[
                          '20/04/2026 · 09:00 – 13:00',
                          '21/04/2026 · 10:00 – 14:00',
                          '22/04/2026 · 16:00 – 20:00',
                          '24/04/2026 · 09:00 – 13:00',
                        ].map(slot => (
                          <div
                            key={slot}
                            onClick={() => setReprogramando(false)}
                            style={{ padding: '8px 10px', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--color-blue-mid)', marginBottom: 4, fontSize: 11, color: 'var(--color-blue-dark)', cursor: 'pointer', background: 'white', fontWeight: 500, transition: 'background 0.1s' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'var(--color-blue-light)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'white'}
                          >
                            {slot}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Acciones */}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={notificar} disabled={notificando} className="btn-primary" style={{ flex: 1, justifyContent: 'center', fontSize: 11 }}>
                    {notificando ? '⏳' : '📱 Enviar estado por SMS'}
                  </button>
                  <button className="btn-secondary" style={{ flex: 1, justifyContent: 'center', fontSize: 11 }}>
                    ⚠ Escalar incidencia
                  </button>
                </div>
              </div>

              {/* Timeline */}
              <div className="card">
                <div className="card-title">Línea temporal de eventos</div>
                <div style={{ position: 'relative', paddingLeft: 24 }}>
                  {pedido.eventos.map((ev, i) => (
                    <div key={ev.id} style={{ position: 'relative', paddingBottom: i < pedido.eventos.length - 1 ? 20 : 0 }}>
                      {/* Línea vertical */}
                      {i < pedido.eventos.length - 1 && (
                        <div style={{ position: 'absolute', left: -16, top: 16, width: 1, height: '100%', background: ev.resultado === 'ok' ? 'var(--color-green-mid)' : 'var(--color-border-secondary)' }} />
                      )}
                      {/* Punto */}
                      <div style={{ position: 'absolute', left: -20, top: 4, width: 10, height: 10, borderRadius: '50%', background: ev.resultado === 'ok' ? 'var(--color-green-border)' : ev.resultado === 'error' ? 'var(--color-red-mid)' : 'var(--color-amber-mid)', border: '2px solid white', boxShadow: `0 0 0 1px ${ev.resultado === 'ok' ? 'var(--color-green-mid)' : ev.resultado === 'error' ? 'var(--color-red-mid)' : 'var(--color-amber-mid)'}` }} />
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
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </>
  )
}