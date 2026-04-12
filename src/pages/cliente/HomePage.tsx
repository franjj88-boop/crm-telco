import { useParams, useNavigate } from 'react-router-dom'
import { datosCliente, consumosPorCliente, propuestasNBA } from '../../data/mockData'

export function HomePage() {
  const { id } = useParams()
  const navigate = useNavigate()

  if (!id) return null
  const datos = datosCliente[id]
  if (!datos) return null

  return (
    <>
      {/* Alertas críticas — solo si existen */}
      {datos.cobros?.estadoGeneral === 'vencida' && (
        <div style={{ padding: '8px 14px', borderRadius: 'var(--border-radius-md)', background: 'var(--color-red-light)', border: '1px solid var(--color-red-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: 'var(--color-red-dark)', fontWeight: 600 }}>
          <span>⚠ Deuda vencida — {datos.cobros.deudaTotal.toFixed(2)}€ · Gestionar antes de cualquier tramitación</span>
          <button onClick={() => navigate(`/cliente/${id}/cobros`)} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 9999, border: '1px solid var(--color-red-border)', background: 'white', color: 'var(--color-red-dark)', cursor: 'pointer', fontWeight: 700 }}>Cobros →</button>
        </div>
      )}
      {datos.averias?.some(a => a.masiva) && (
        <div style={{ padding: '8px 14px', borderRadius: 'var(--border-radius-md)', background: 'var(--color-amber-light)', border: '1px solid var(--color-amber-border)', fontSize: 11, color: 'var(--color-amber-dark)', fontWeight: 600 }}>
          📡 Incidencia masiva activa — {datos.averias.find(a => a.masiva)?.masiva?.descripcion}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>

        {/* COLUMNA IZQUIERDA */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

          {/* Última factura con desglose */}
          {(() => {
            const facturasNormales = datos.facturas.filter(f => !(f as any).esRectificativa)
            const periodos = [...new Set(facturasNormales.map(f => f.periodo))]
            const ultimoPeriodo = periodos[0]
            const facturasUltimo = facturasNormales.filter(f => f.periodo === ultimoPeriodo)
            const totalUltimo = facturasUltimo.reduce((a, f) => a + f.importe, 0)
            const periodoAnterior = periodos[1]
            const facturasAnterior = facturasNormales.filter(f => f.periodo === periodoAnterior)
            const totalAnterior = facturasAnterior.reduce((a, f) => a + f.importe, 0)
            const delta = totalUltimo - totalAnterior
            const conceptosAnomalos = facturasUltimo.flatMap(f => f.conceptos.filter((c: any) => c.anomalo))

            return (
              <div className="card">
                <div className="card-title">
                  Última factura · {ultimoPeriodo}
                  <button onClick={() => navigate(`/cliente/${id}/facturas`)} style={{ fontSize: 10, color: 'var(--color-blue)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Ver detalle →</button>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--color-text-primary)', lineHeight: 1 }}>{totalUltimo.toFixed(2)}€</div>
                    <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', marginTop: 3 }}>
                      {facturasUltimo.length > 1 ? `${facturasUltimo.length} jurídicas` : (facturasUltimo[0] as any)?.juridica || 'Telefónica de España SAU'}
                    </div>
                  </div>
                  {periodoAnterior && (
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: delta > 0 ? 'var(--color-red-dark)' : delta < 0 ? 'var(--color-green-dark)' : 'var(--color-text-tertiary)' }}>
                        {delta > 0 ? '↑ +' : delta < 0 ? '↓ ' : '= '}{delta.toFixed(2)}€ vs {periodoAnterior}
                      </div>
                    </div>
                  )}
                </div>

                {/* Conceptos */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginBottom: conceptosAnomalos.length > 0 ? 10 : 0 }}>
                  {facturasUltimo.flatMap(f => f.conceptos).slice(0, 5).map((c: any, i: number) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 8px', borderRadius: 5, background: c.anomalo ? 'var(--color-amber-light)' : 'var(--color-background-secondary)', border: c.anomalo ? '1px solid var(--color-amber-border)' : 'none' }}>
                      <span style={{ fontSize: 11, color: c.anomalo ? 'var(--color-amber-dark)' : 'var(--color-text-secondary)', fontWeight: c.anomalo ? 600 : 400 }}>
                        {c.anomalo && '⚠ '}{c.descripcion}
                      </span>
                      <span style={{ fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-mono)', color: c.anomalo ? 'var(--color-amber-dark)' : 'var(--color-text-primary)', flexShrink: 0, marginLeft: 8 }}>
                        {c.importe > 0 ? '+' : ''}{c.importe.toFixed(2)}€
                      </span>
                    </div>
                  ))}
                </div>

                {/* Diagnóstico si hay anómalos */}
                {conceptosAnomalos.length > 0 && (
                  <div style={{ padding: '8px 10px', borderRadius: 6, background: 'var(--color-amber-light)', border: '1px solid var(--color-amber-border)' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-amber-dark)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Diagnóstico automático
                    </div>
                    {conceptosAnomalos.map((c: any, i: number) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--color-amber-dark)', marginBottom: 3 }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-amber-dark)', flexShrink: 0 }} />
                        <span style={{ flex: 1 }}>{c.descripcion} — cargo no estándar</span>
                        <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{c.importe.toFixed(2)}€</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })()}

          {/* Interacciones recientes con patrones */}
          {(() => {
            const historial = datos.historial || []
            const porMotivo: Record<string, typeof historial> = {}
            historial.forEach((h: any) => {
              const key = h.motivo || 'Sin motivo'
              if (!porMotivo[key]) porMotivo[key] = []
              porMotivo[key].push(h)
            })
            const patrones = Object.entries(porMotivo).filter(([, items]) => items.length >= 2)
            return (
              <div className="card">
                <div className="card-title">Interacciones recientes</div>
                {patrones.length > 0 && (
                  <div style={{ marginBottom: 10, padding: '6px 8px', borderRadius: 6, background: 'var(--color-amber-light)', border: '1px solid var(--color-amber-border)', fontSize: 10, color: 'var(--color-amber-dark)', fontWeight: 600 }}>
                    🔁 Patrón: {patrones.map(([m, items]) => `${items.length}× "${m}"`).join(' · ')}
                  </div>
                )}
                {historial.slice(0, 4).map((h: any, i: number) => (
                  <div key={i} style={{ display: 'flex', gap: 8, padding: '6px 0', borderBottom: i < Math.min(historial.length, 4) - 1 ? '1px solid var(--color-border-tertiary)' : 'none' }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: h.resuelto ? 'var(--color-green-light)' : 'var(--color-amber-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: h.resuelto ? 'var(--color-green-dark)' : 'var(--color-amber-dark)', flexShrink: 0 }}>
                      {h.canal === 'Teléfono' ? 'T' : h.canal === 'Tienda' ? 'Ti' : 'C'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-text-primary)' }}>{h.motivo}</div>
                      <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', marginTop: 1 }}>{h.fecha} · {h.canal}</div>
                      <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 7, fontWeight: 700, display: 'inline-block', marginTop: 2, background: h.resuelto ? 'var(--color-green-light)' : 'var(--color-amber-light)', color: h.resuelto ? 'var(--color-green-dark)' : 'var(--color-amber-dark)', border: `1px solid ${h.resuelto ? 'var(--color-green-border)' : 'var(--color-amber-border)'}` }}>
                        {h.resuelto ? 'Resuelto' : 'Sin resolver'}
                      </span>
                    </div>
                    {(porMotivo[h.motivo || 'Sin motivo']?.length || 0) >= 2 && (
                      <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 7, background: 'var(--color-red-light)', color: 'var(--color-red-dark)', fontWeight: 700, alignSelf: 'flex-start', flexShrink: 0 }}>
                        {porMotivo[h.motivo || 'Sin motivo'].length}×
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )
          })()}
        </div>

        {/* COLUMNA DERECHA */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

          {/* Parque activo */}
          {(() => {
            const facturasNormales = datos.facturas.filter(f => !(f as any).esRectificativa)
            const periodos = [...new Set(facturasNormales.map(f => f.periodo))]
            const totalMes = facturasNormales.filter(f => f.periodo === periodos[0]).reduce((a, f) => a + f.importe, 0)
            const consumosAnomalos = consumosPorCliente[id || '']?.filter((c) => c.anomalo && !c.facturado) || []

            return (
              <div className="card">
                <div className="card-title">
                  Parque activo
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-primary)' }}>{totalMes.toFixed(2)}€/mes</span>
                </div>
                {datos.productos.map((p: any) => (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderBottom: '1px solid var(--color-border-tertiary)' }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: p.estado === 'activa' ? 'var(--color-green-border)' : p.estado === 'suspendida' ? 'var(--color-red-mid)' : 'var(--color-amber-mid)', flexShrink: 0 }} />
                    <span style={{ fontSize: 11, color: 'var(--color-text-primary)', flex: 1 }}>{p.nombre}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-primary)' }}>{p.precio?.toFixed(2)}€</span>
                  </div>
                ))}
                {consumosAnomalos.length > 0 && (
                  <div style={{ marginTop: 8, padding: '6px 8px', borderRadius: 5, background: 'var(--color-amber-light)', border: '1px solid var(--color-amber-border)', fontSize: 10, color: 'var(--color-amber-dark)', fontWeight: 600 }}>
                    ⚠ {consumosAnomalos.length} consumo{consumosAnomalos.length > 1 ? 's' : ''} en vuelo anómalo{consumosAnomalos.length > 1 ? 's' : ''} no facturado{consumosAnomalos.length > 1 ? 's' : ''}
                  </div>
                )}
              </div>
            )
          })()}

          {/* Próximos eventos */}
          {datos.proximosEventos?.length > 0 && (
            <div className="card">
              <div className="card-title">Próximos eventos</div>
              {datos.proximosEventos.map((ev: any) => (
                <div key={ev.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--color-border-tertiary)', fontSize: 11 }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>{ev.descripcion}</span>
                  <span style={{ fontWeight: 600, color: ev.impacto === 'negativo' ? 'var(--color-red-dark)' : ev.impacto === 'positivo' ? 'var(--color-green-dark)' : 'var(--color-text-tertiary)', flexShrink: 0, marginLeft: 8 }}>{ev.fecha}</span>
                </div>
              ))}
            </div>
          )}

          {/* NBA — propuesta comercial */}
          {(() => {
            const npsDetractor = datos.nps?.segmento === 'detractor'
            const hayReclamacionActiva = datos.reclamaciones?.some(
              r => r.estado === 'abierta' || r.estado === 'en_gestion'
            )
            const hayDeuda = datos.cobros?.estadoGeneral === 'vencida'
            const hayAveria = datos.averias?.some(a => a.estado !== 'resuelta')
            const bloqueado = hayDeuda || hayAveria
            const propuestas = propuestasNBA[id || ''] || []

            const iconoTipo = (tipo: string) => ({
              dispositivo: '📱', tarifa: '🔄', servicio: '🔧', contenido: '📺'
            }[tipo] || '💡')

            return (
              <div className="card">
                <div className="card-title">NBA · propuesta comercial</div>

                {bloqueado && (
                  <div style={{ padding: '8px 10px', borderRadius: 6, background: 'var(--color-amber-light)', border: '1px solid var(--color-amber-border)', fontSize: 11, color: 'var(--color-amber-dark)', marginBottom: 10 }}>
                    <div style={{ fontWeight: 700, marginBottom: 3 }}>⚠ No presentar ahora</div>
                    <div>
                      {hayDeuda && 'Deuda vencida — gestionar en Cobros primero. '}
                      {hayAveria && 'Avería sin resolver. '}
                      {hayReclamacionActiva && 'Reclamación activa — resolver antes de ofertar. '}
                      {npsDetractor && !hayReclamacionActiva && !hayDeuda && !hayAveria && `NPS ${datos.nps?.valor}/10 — cliente detractor, priorizar resolución.`}
                    </div>
                    {hayReclamacionActiva && (
                      <button onClick={() => navigate(`/cliente/${id}/consumos`)}
                        style={{ marginTop: 6, fontSize: 10, padding: '3px 8px', borderRadius: 9999, border: '1px solid var(--color-amber-border)', background: 'white', color: 'var(--color-amber-dark)', cursor: 'pointer', fontWeight: 700 }}>
                        Acción recomendada: bloquear emoción →
                      </button>
                    )}
                    {hayDeuda && (
                      <button onClick={() => navigate(`/cliente/${id}/cobros`)}
                        style={{ marginTop: 6, fontSize: 10, padding: '3px 8px', borderRadius: 9999, border: '1px solid var(--color-amber-border)', background: 'white', color: 'var(--color-amber-dark)', cursor: 'pointer', fontWeight: 700 }}>
                        Acción recomendada: ir a Cobros →
                      </button>
                    )}
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {npsDetractor && !bloqueado && (
                    <div style={{ fontSize: 10, color: 'var(--color-amber-dark)', marginBottom: 8, padding: '5px 8px', borderRadius: 5, background: 'var(--color-amber-light)', border: '1px solid var(--color-amber-border)', fontStyle: 'italic' }}>
                      NPS {datos.nps?.valor}/10 · detractor — presentar propuesta con cautela
                    </div>
                  )}
                  {propuestas.slice(0, 3).map((p, i) => (
                    <div key={p.id}
                      onClick={() => !bloqueado && navigate(`/cliente/${id}/${p.destino}`)}
                      style={{
                        padding: '9px 11px', borderRadius: 6,
                        border: `1px solid ${bloqueado ? 'var(--color-border-tertiary)' : i === 0 ? 'var(--color-blue-mid)' : 'var(--color-border-secondary)'}`,
                        background: bloqueado ? 'var(--color-background-secondary)' : i === 0 ? 'var(--color-blue-light)' : 'var(--color-background-primary)',
                        cursor: bloqueado ? 'default' : 'pointer',
                        opacity: bloqueado ? 0.6 : 1,
                        transition: 'all 0.1s',
                      }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                            <span style={{ fontSize: 14 }}>{iconoTipo(p.tipo)}</span>
                            <span style={{ fontSize: 11, fontWeight: 700, color: bloqueado ? 'var(--color-text-secondary)' : i === 0 ? 'var(--color-blue-dark)' : 'var(--color-text-primary)' }}>
                              {p.titulo}
                            </span>
                            {i === 0 && !bloqueado && (
                              <span style={{ fontSize: 8, padding: '1px 5px', borderRadius: 9999, background: 'var(--color-blue)', color: 'white', fontWeight: 700 }}>TOP</span>
                            )}
                          </div>
                          <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', lineHeight: 1.4 }}>{p.descripcion}</div>
                        </div>
                        {p.impactoMensual > 0 && (
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: bloqueado ? 'var(--color-text-tertiary)' : 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}>
                              +{p.impactoMensual.toFixed(2)}€
                            </div>
                            <div style={{ fontSize: 9, color: 'var(--color-text-tertiary)' }}>/mes</div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })()}

          {/* Pedido en vuelo */}
          {datos.pedidos?.filter(p => p.estado !== 'completado' && p.estado !== 'cancelado').map(pedido => (
            <div key={pedido.id} className="card" onClick={() => navigate(`/cliente/${id}/pedidos`)} style={{ border: '1px solid var(--color-blue-mid)', background: 'var(--color-blue-light)', cursor: 'pointer' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-blue-dark)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>📦 Pedido en vuelo</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-blue-dark)' }}>{pedido.numero} · {pedido.producto}</div>
              {pedido.citaFecha && <div style={{ fontSize: 11, color: 'var(--color-blue-dark)', marginTop: 4 }}>📅 Cita: {pedido.citaFecha} · {pedido.citaHora}</div>}
              <div style={{ fontSize: 10, color: 'var(--color-blue-dark)', marginTop: 6, fontWeight: 600 }}>Ver detalle →</div>
            </div>
          ))}

          {/* Avería activa */}
          {datos.averias?.filter(a => a.estado !== 'resuelta').map(averia => (
            <div key={averia.id} className="card" onClick={() => navigate(`/cliente/${id}/averias`)} style={{ border: `1px solid ${averia.estado === 'bloqueada_impago' ? 'var(--color-red-border)' : 'var(--color-amber-border)'}`, background: averia.estado === 'bloqueada_impago' ? 'var(--color-red-light)' : 'var(--color-amber-light)', cursor: 'pointer' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: averia.estado === 'bloqueada_impago' ? 'var(--color-red-dark)' : 'var(--color-amber-dark)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>
                🔧 Avería {averia.estado === 'bloqueada_impago' ? 'bloqueada' : 'activa'}
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: averia.estado === 'bloqueada_impago' ? 'var(--color-red-dark)' : 'var(--color-amber-dark)' }}>{averia.sintoma}</div>
              <div style={{ fontSize: 10, color: averia.estado === 'bloqueada_impago' ? 'var(--color-red-dark)' : 'var(--color-amber-dark)', marginTop: 4, fontWeight: 600 }}>Ver avería →</div>
            </div>
          ))}

          {/* Representantes */}
          {datos.representantes?.length > 0 && (
            <div className="card">
              <div className="card-title">Representantes</div>
              {datos.representantes.map((r: any) => (
                <div key={r.dni} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, padding: '4px 0' }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>{r.nombre} · {r.relacion}</span>
                  <span className={`pill ${r.autorizado ? 'pill-ok' : 'pill-neutral'}`} style={{ fontSize: 9 }}>
                    {r.autorizado ? 'Autorizado' : 'Sin autorización'}
                  </span>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </>
  )
}