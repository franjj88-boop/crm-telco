import { useParams, useNavigate } from 'react-router-dom'
import { datosCliente } from '../../data/mockData'

export function HomePage() {
  const { id } = useParams()
  const navigate = useNavigate()

  if (!id) return null
  const datos = datosCliente[id]
  if (!datos) return null

  const esCritico = datos.satisfaccionRiesgo === 'critico'
  const tieneDeuda = datos.cobros.deudaTotal > 0
  const tieneAveria = datos.averias.some(a => a.estado !== 'resuelta')
  const tieneReclamacion = datos.reclamaciones.some(r => r.estado !== 'resuelta')
  const tienePedido = datos.pedidos.some(p => p.estado !== 'completado' && p.estado !== 'cancelado')
  const masiva = datos.averias.find(a => a.masiva)?.masiva
  const llamadasSinResolver = datos.historial.filter(h => !h.resuelto).length
  const tienePatron = llamadasSinResolver >= 2

  // Calcular diferencias reales entre facturas
  const calcularDiferencias = () => {
    if (datos.facturas.length < 2) return []
    const facturasNormales = datos.facturas.filter(f => !(f as any).esRectificativa)
    const actual = facturasNormales[0]
    const anterior = facturasNormales[1]
    const diffs: { concepto: string; anterior: number; actual: number; delta: number; tipo: 'subida' | 'bajada' | 'nuevo' | 'eliminado' }[] = []

    actual.conceptos.forEach(ca => {
      const match = anterior.conceptos.find(cp =>
        cp.descripcion.toLowerCase().replace(/\s*\([^)]*\)/g, '').trim() ===
        ca.descripcion.toLowerCase().replace(/\s*\([^)]*\)/g, '').trim()
      )
      if (!match) {
        diffs.push({ concepto: ca.descripcion, anterior: 0, actual: ca.importe, delta: ca.importe, tipo: 'nuevo' })
      } else if (Math.abs(ca.importe - match.importe) > 0.01) {
        diffs.push({ concepto: ca.descripcion, anterior: match.importe, actual: ca.importe, delta: ca.importe - match.importe, tipo: ca.importe > match.importe ? 'subida' : 'bajada' })
      }
    })
    anterior.conceptos.forEach(cp => {
      const match = actual.conceptos.find(ca =>
        ca.descripcion.toLowerCase().replace(/\s*\([^)]*\)/g, '').trim() ===
        cp.descripcion.toLowerCase().replace(/\s*\([^)]*\)/g, '').trim()
      )
      if (!match) {
        diffs.push({ concepto: cp.descripcion, anterior: cp.importe, actual: 0, delta: -cp.importe, tipo: 'eliminado' })
      }
    })
    return diffs
  }

  const diferencias = calcularDiferencias()
  const facturasNormalesHome = datos.facturas.filter(f => !(f as any).esRectificativa)
  const deltaTotalFactura = facturasNormalesHome.length >= 2
    ? facturasNormalesHome[0].importe - facturasNormalesHome[1].importe
    : 0

  return (
    <>
      {/* Banner crítico */}
      {esCritico && (
        <div className="critical-banner fade-in">
          <span style={{ fontSize: 16, flexShrink: 0 }}>⚠</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 1 }}>Cliente en estado CRÍTICO</div>
            <div style={{ fontSize: 11, opacity: 0.9, fontWeight: 400, lineHeight: 1.5 }}>{datos.resumenNatural}</div>
          </div>
        </div>
      )}

      {/* Masiva */}
      {masiva && (
        <div className="warning-banner fade-in">
          <span style={{ fontSize: 14, flexShrink: 0 }}>📡</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 12 }}>Incidencia masiva — {masiva.referencia}</div>
            <div style={{ fontSize: 11, opacity: 0.85 }}>{masiva.descripcion} · ETA: {masiva.eta}</div>
          </div>
        </div>
      )}

      {/* Patrón repetición */}
      {tienePatron && (
        <div className="alert alert-warn fade-in" style={{ padding: '8px 12px' }}>
          <span style={{ flexShrink: 0 }}>🔁</span>
          <div style={{ fontSize: 11 }}>
            <strong>Patrón de repetición</strong> — {llamadasSinResolver} llamadas sin resolver.
            Motivo principal: <strong>{datos.historial.find(h => !h.resuelto)?.causaAgrupacion}</strong>
          </div>
        </div>
      )}

      {/* Resumen natural (solo si no es crítico) */}
      {!esCritico && (
        <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.7, padding: '8px 12px', background: 'var(--color-background-primary)', borderRadius: 'var(--border-radius-lg)', border: '1px solid var(--color-border-tertiary)' }}>
          {datos.resumenNatural}
        </div>
      )}

      {/* KPIs — franja compacta */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        {[
          { label: 'Facturas', valor: datos.facturas.length, sub: datos.facturas.filter(f => f.estado === 'vencida').length > 0 ? `${datos.facturas.filter(f => f.estado === 'vencida').length} vencida/s` : 'Al día', tipo: datos.facturas.some(f => f.estado === 'vencida') ? 'err' : 'ok', ruta: 'facturas' },
          { label: 'Deuda', valor: tieneDeuda ? `${datos.cobros.deudaTotal.toFixed(2)}€` : 'Sin deuda', sub: tieneDeuda ? datos.cobros.estadoGeneral.replace('_', ' ') : 'Al corriente', tipo: tieneDeuda ? 'err' : 'ok', ruta: 'cobros' },
          { label: 'Averías', valor: datos.averias.filter(a => a.estado !== 'resuelta').length, sub: datos.averias.length === 0 ? 'Sin averías' : datos.averias[0].estado.replace(/_/g, ' '), tipo: tieneAveria ? 'err' : 'ok', ruta: 'averias' },
          { label: 'Reclamaciones', valor: datos.reclamaciones.length, sub: tieneReclamacion ? 'Activa/s' : 'Sin activas', tipo: tieneReclamacion ? 'warn' : 'ok', ruta: 'reclamaciones' },
        ].map(kpi => (
          <div key={kpi.label} onClick={() => navigate(`/cliente/${id}/${kpi.ruta}`)}
            style={{ background: 'var(--color-background-primary)', border: `1px solid ${kpi.tipo === 'err' ? 'var(--color-red-border)' : kpi.tipo === 'warn' ? 'var(--color-amber-border)' : 'var(--color-border-tertiary)'}`, borderTop: `3px solid ${kpi.tipo === 'err' ? 'var(--color-red-mid)' : kpi.tipo === 'warn' ? 'var(--color-amber-mid)' : 'var(--color-green-border)'}`, borderRadius: 'var(--border-radius-lg)', padding: '10px 12px', cursor: 'pointer', transition: 'box-shadow 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow-md)'}
            onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
            <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{kpi.label}</div>
            <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-mono)', color: kpi.tipo === 'err' ? 'var(--color-red)' : kpi.tipo === 'warn' ? 'var(--color-amber)' : 'var(--color-green)', marginBottom: 2 }}>{kpi.valor}</div>
            <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)' }}>{kpi.sub}</div>
          </div>
        ))}
      </div>

<div className="grid2">
        {/* RF-03 — Resumen inteligente de interacciones omnicanal */}
        <div className="card">
          <div className="card-title">Interacciones recientes</div>
          {(() => {
            const historial = datos.historial || []

            const porMotivo: Record<string, typeof historial> = {}
            historial.forEach(h => {
              const key = h.motivo || 'Sin motivo'
              if (!porMotivo[key]) porMotivo[key] = []
              porMotivo[key].push(h)
            })

            const patrones = Object.entries(porMotivo).filter(([, items]) => items.length >= 2)

            return (
              <>
                {/* Patrones detectados — RF-03 CA-03-02 */}
                {patrones.length > 0 && (
                  <div style={{ marginBottom: 12, padding: '8px 10px', borderRadius: 'var(--border-radius-md)', background: 'var(--color-amber-light)', border: '1px solid var(--color-amber-border)' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-amber-dark)', marginBottom: 4 }}>
                      🔁 Patrones detectados
                    </div>
                    {patrones.map(([motivo, items]) => (
                      <div key={motivo} style={{ fontSize: 11, color: 'var(--color-amber-dark)', marginBottom: 2 }}>
                        ⚠ <strong>{items.length} contactos</strong> por "{motivo}" en los últimos {Math.ceil(items.length * 3)} días
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {historial.slice(0, 4).map((h, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '7px 0', borderBottom: i < 3 ? '1px solid var(--color-border-tertiary)' : 'none' }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                        <span style={{ fontSize: 14, flexShrink: 0 }}>
                          {h.canal === 'telefono' ? '📞' : h.canal === 'tienda' ? '🏪' : h.canal === 'chat' ? '💬' : '📱'}
                        </span>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-primary)' }}>{h.motivo || 'Consulta general'}</div>
                          <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', marginTop: 1 }}>{h.fecha} · {h.canal}</div>
                          {!h.resuelto && (
                            <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 9999, background: 'var(--color-amber-light)', color: 'var(--color-amber-dark)', border: '1px solid var(--color-amber-border)', fontWeight: 700 }}>
                              Sin resolver
                            </span>
                          )}
                        </div>
                      </div>
                      {porMotivo[h.motivo || 'Sin motivo']?.length >= 2 && (
                        <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 9999, background: 'var(--color-red-light)', color: 'var(--color-red-dark)', border: '1px solid var(--color-red-border)', fontWeight: 700, flexShrink: 0, marginLeft: 8 }}>
                          {porMotivo[h.motivo || 'Sin motivo'].length}x
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )
          })()}
        </div>

        {/* Panel derecho */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

          {/* Comparativa facturas con diferencias reales */}
          {datos.facturas.length >= 2 && (
            <div className="card">
              <div className="card-title">
                Comparativa facturas
                {deltaTotalFactura !== 0 && (
                  <span style={{ fontSize: 11, fontWeight: 600, color: deltaTotalFactura > 0 ? 'var(--color-red)' : 'var(--color-green)', textTransform: 'none', letterSpacing: 0 }}>
                    {deltaTotalFactura > 0 ? '↑' : '↓'} {Math.abs(deltaTotalFactura).toFixed(2)}€
                  </span>
                )}
              </div>

              {/* Resumen por factura */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                {facturasNormalesHome.slice(0, 2).map((f, i) => (
                  <div key={f.id} style={{ flex: 1, padding: '8px 10px', background: i === 0 ? 'var(--color-background-secondary)' : 'transparent', border: `1px solid ${f.estado === 'vencida' ? 'var(--color-red-border)' : 'var(--color-border-tertiary)'}`, borderRadius: 'var(--border-radius-md)' }}>
                    <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', marginBottom: 2 }}>{i === 0 ? 'Actual' : 'Anterior'} · {f.periodo}</div>
                    <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-mono)', color: f.estado === 'vencida' ? 'var(--color-red)' : 'var(--color-text-primary)' }}>{f.importe.toFixed(2)}€</div>
                    <span className={`pill pill-${f.estado === 'pagada' ? 'ok' : f.estado === 'vencida' ? 'err' : 'warn'}`} style={{ fontSize: 9, marginTop: 4, display: 'inline-block' }}>{f.estado}</span>
                  </div>
                ))}
              </div>

              {/* Diferencias reales */}
              {diferencias.length > 0 ? (
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Variaciones detectadas</div>
                  {diferencias.map((d, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 8px', marginBottom: 3, borderRadius: 'var(--border-radius-sm)', background: d.tipo === 'nuevo' || d.tipo === 'subida' ? 'var(--color-red-light)' : 'var(--color-green-light)', border: `1px solid ${d.tipo === 'nuevo' || d.tipo === 'subida' ? 'var(--color-red-border)' : 'var(--color-green-border)'}` }}>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 500, color: d.tipo === 'nuevo' || d.tipo === 'subida' ? 'var(--color-red-dark)' : 'var(--color-green-dark)' }}>
                          {d.tipo === 'nuevo' ? '+ Nuevo: ' : d.tipo === 'eliminado' ? '− Eliminado: ' : ''}{d.concepto.replace(/\s*\([^)]*\)/g, '')}
                        </div>
                        {d.tipo !== 'nuevo' && d.tipo !== 'eliminado' && (
                          <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)' }}>{d.anterior.toFixed(2)}€ → {d.actual.toFixed(2)}€</div>
                        )}
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-mono)', color: d.delta > 0 ? 'var(--color-red)' : 'var(--color-green)', flexShrink: 0 }}>
                        {d.delta > 0 ? '+' : ''}{d.delta.toFixed(2)}€
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', textAlign: 'center', padding: '8px 0' }}>
                  Sin variaciones entre facturas
                </div>
              )}

              <button onClick={() => navigate(`/cliente/${id}/facturas`)} className="btn-ghost" style={{ width: '100%', justifyContent: 'center', marginTop: 8, fontSize: 11 }}>
                Ver detalle completo →
              </button>
            </div>
          )}

          {/* Deuda O2 */}
          {datos.cobros.tieneDeudaO2 && (
            <div
              onClick={() => navigate(`/cliente/${id}/cobros`)}
              className="card"
              style={{ background: 'var(--color-amber-light)', border: '1px solid var(--color-amber-border)', cursor: 'pointer' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-amber-dark)', marginBottom: 3 }}>⚠ Deuda O2 pendiente</div>
                  <div style={{ fontSize: 11, color: 'var(--color-amber-dark)' }}>El cliente tiene deuda registrada en el sistema O2 — revisar en cobros</div>
                </div>
                <span style={{ fontSize: 11, color: 'var(--color-amber-dark)', fontWeight: 600, flexShrink: 0, marginLeft: 10 }}>Ver →</span>
              </div>
            </div>
          )}

          {/* Próximos eventos */}
          {datos.proximosEventos.length > 0 && (
            <div className="card">
              <div className="card-title">Próximos eventos</div>
              {datos.proximosEventos.map(ev => (
                <div key={ev.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--color-border-tertiary)', fontSize: 11 }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>{ev.descripcion}</span>
                  <span style={{ color: ev.impacto === 'negativo' ? 'var(--color-amber-dark)' : ev.impacto === 'positivo' ? 'var(--color-green)' : 'var(--color-text-tertiary)', fontWeight: 500, flexShrink: 0, marginLeft: 8 }}>{ev.fecha}</span>
                </div>
              ))}
            </div>
          )}

          {/* Pedido en vuelo */}
          {tienePedido && (() => {
            const pedido = datos.pedidos.find(p => p.estado !== 'completado' && p.estado !== 'cancelado')
            if (!pedido) return null
            return (
              <div className="card fade-in" onClick={() => navigate(`/cliente/${id}/pedidos`)}
                style={{ border: '1px solid var(--color-blue-mid)', background: 'var(--color-blue-light)', cursor: 'pointer' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-blue-dark)', marginBottom: 3 }}>📦 Pedido en vuelo</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-blue-dark)' }}>{pedido.numero}</div>
                    <div style={{ fontSize: 11, color: 'var(--color-blue-dark)', marginTop: 2 }}>{pedido.producto}</div>
                  </div>
                  <span className="pill pill-blue" style={{ fontSize: 9 }}>{pedido.estado.replace(/_/g, ' ')}</span>
                </div>
                {pedido.citaFecha && (
                  <div style={{ padding: '6px 8px', background: 'rgba(255,255,255,0.6)', borderRadius: 'var(--border-radius-md)', fontSize: 11, color: 'var(--color-blue-dark)', fontWeight: 600 }}>
                    📅 Cita: {pedido.citaFecha} · {pedido.citaHora}
                  </div>
                )}
                {!pedido.citaFecha && pedido.proximoHito && (
                  <div style={{ fontSize: 11, color: 'var(--color-blue-dark)' }}>
                    Próximo hito: {pedido.proximoHito} · {pedido.fechaProximoHito}
                  </div>
                )}
                <div style={{ fontSize: 10, color: 'var(--color-blue-dark)', marginTop: 6, fontWeight: 600 }}>Ver detalle →</div>
              </div>
            )
          })()}

          {/* Avería activa */}
          {tieneAveria && (() => {
            const averia = datos.averias.find(a => a.estado !== 'resuelta')
            if (!averia) return null
            const bloqueada = averia.estado === 'bloqueada_impago'
            return (
              <div className="card fade-in" onClick={() => navigate(`/cliente/${id}/averias`)}
                style={{ border: `1px solid ${bloqueada ? 'var(--color-red-border)' : 'var(--color-amber-border)'}`, background: bloqueada ? 'var(--color-red-light)' : 'var(--color-amber-light)', cursor: 'pointer' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: bloqueada ? 'var(--color-red-dark)' : 'var(--color-amber-dark)', marginBottom: 3 }}>
                      🔧 Avería {bloqueada ? 'bloqueada' : 'activa'}
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: bloqueada ? 'var(--color-red-dark)' : 'var(--color-amber-dark)' }}>AV-{averia.numero}</div>
                    <div style={{ fontSize: 11, color: bloqueada ? 'var(--color-red-dark)' : 'var(--color-amber-dark)', marginTop: 2 }}>{averia.sintoma}</div>
                  </div>
                  <span className={`pill ${bloqueada ? 'pill-err' : 'pill-warn'}`} style={{ fontSize: 9 }}>{averia.estado.replace(/_/g, ' ')}</span>
                </div>
                {bloqueada && (
                  <div style={{ fontSize: 10, color: 'var(--color-red-dark)', fontWeight: 600 }}>
                    ⚠ Bloqueada por impago — regularizar cobro primero
                  </div>
                )}
                <div style={{ fontSize: 10, color: bloqueada ? 'var(--color-red-dark)' : 'var(--color-amber-dark)', marginTop: 4, fontWeight: 600 }}>Ver avería →</div>
              </div>
            )
          })()}

          {/* Representantes */}
          {datos.representantes.length > 0 && (
            <div className="card">
              <div className="card-title">Representantes</div>
              {datos.representantes.map(r => (
                <div key={r.dni} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, padding: '4px 0' }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>{r.nombre} · {r.relacion}</span>
                  <span className={`pill ${r.autorizado ? 'pill-ok' : 'pill-neutral'}`} style={{ fontSize: 9 }}>
                    {r.autorizado ? 'Autorizado' : 'Sin autorización'}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* RF-PI-01 RN-PI-07 — NBA solo si sin alertas críticas */}
          {(datos as any).porfolio === 'fusion' && (() => {
            const hayAlertaCritica =
              datos.cobros.estadoGeneral === 'vencida' ||
              datos.averias.some(a => a.estado !== 'resuelta') ||
              datos.pedidos.some(p => p.estado === 'en_incidencia')

            if (hayAlertaCritica) return (
              <div style={{ padding: '10px 14px', borderRadius: 'var(--border-radius-lg)', background: 'var(--color-amber-light)', border: '1px solid var(--color-amber-border)', fontSize: 11, color: 'var(--color-amber-dark)' }}>
                ⚠ Propuesta comercial pausada — hay alertas críticas activas que requieren atención primero
              </div>
            )
            return (
              <div className="card fade-in" style={{ border: '1.5px solid #FB923C', background: '#FFF7ED' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#C2410C', marginBottom: 4 }}>
                      🔄 Migración disponible — tu porfolio puede mejorar
                    </div>
                    <div style={{ fontSize: 11, color: '#9A3412' }}>
                      Este cliente tiene Fusión. Puede migrar a mi Movistar y acceder a mejores condiciones.
                    </div>
                  </div>
                  <button
                    onClick={() => navigate(`/cliente/${id}/venta`)}
                    style={{ padding: '6px 14px', background: '#EA580C', color: '#fff', border: 'none', borderRadius: 'var(--border-radius-md)', fontSize: 11, fontWeight: 700, cursor: 'pointer', flexShrink: 0, marginLeft: 12 }}>
                    Gestionar →
                  </button>
                </div>
              </div>
            )
          })()}
        </div>
      </div>
    </>
  )
}