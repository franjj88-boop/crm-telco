import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { datosCliente, historicoPagosPorCliente } from '../../data/mockData'
import type { FacturaDeuda } from '../../types'

// ── PRE-CHECK DE TRAMITABILIDAD (RF-06) ──
function calcularPreCheck(cobros: any, reclamaciones: any[]) {
  const bloqueos: { motivo: string; detalle: string; accion: string; nivel: 'bloqueante' | 'advertencia' }[] = []

  if (cobros.estadoGeneral === 'vencida') {
    bloqueos.push({
      motivo: 'Deuda vencida',
      detalle: `Importe vencido: ${cobros.deudaTotal.toFixed(2)}€ — supera la fecha límite de pago`,
      accion: 'Gestionar cobro antes de tramitar nuevos servicios',
      nivel: 'bloqueante'
    })
  }

  if (cobros.riesgo === 'alto') {
    bloqueos.push({
      motivo: 'Scoring de riesgo alto',
      detalle: 'El perfil de riesgo del cliente impide nuevas contrataciones en este momento',
      accion: 'Resolver deuda pendiente para mejorar el scoring',
      nivel: 'bloqueante'
    })
  }

  const recAbiertas = reclamaciones.filter(r => r.estado !== 'resuelta' && r.bloquea)
  if (recAbiertas.length > 0) {
    bloqueos.push({
      motivo: 'Reclamación abierta con bloqueo de cobro',
      detalle: `${recAbiertas.map(r => r.numero).join(', ')} — cobro suspendido hasta resolución`,
      accion: 'Resolver la reclamación antes de reiterar el cobro',
      nivel: 'advertencia'
    })
  }

  if (cobros.fraccionamientoActivo) {
    bloqueos.push({
      motivo: 'Fraccionamiento activo',
      detalle: `${cobros.fraccionamientoActivo.cuotasPagadas}/${cobros.fraccionamientoActivo.totalCuotas} cuotas pagadas — no se puede reiterar cobro del importe fraccionado`,
      accion: 'Esperar al vencimiento de las cuotas o renegociar el plan',
      nivel: 'advertencia'
    })
  }

  return bloqueos
}

export function CobrosPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [facturaActiva, setFacturaActiva] = useState<FacturaDeuda | null>(null)
  const [accionEn, setAccionEn] = useState<string | null>(null)
  const [accionOk, setAccionOk] = useState<string | null>(null)
  const [mostrarFracc, setMostrarFracc] = useState(false)
  const [cuotas, setCuotas] = useState(3)
  const [preCheckVisible, setPreCheckVisible] = useState(true)
  const [historicoPagosVisible, setHistoricoPagosVisible] = useState(false)
  const [vruTransferido, setVruTransferido] = useState(false)
  const [vruResultado, setVruResultado] = useState<'pendiente' | 'ok' | 'fallido' | null>(null)
  const [compensacionTipo, setCompensacionTipo] = useState<'intra' | 'cruzada' | null>(null)
  const [compensacionEjecutada, setCompensacionEjecutada] = useState(false)
  const [mostrarCompensacion, setMostrarCompensacion] = useState(false)

  if (!id) return null
  const datos = datosCliente[id]
  if (!datos) return null

  const cobros = datos.cobros
  const factura = facturaActiva || cobros.facturasConDeuda[0] || null
  const preCheck = calcularPreCheck(cobros, datos.reclamaciones || [])
  const hayBloqueantes = preCheck.some(b => b.nivel === 'bloqueante')
  const hayAdvertencias = preCheck.some(b => b.nivel === 'advertencia')

  const ejecutar = (accion: string) => {
    setAccionEn(accion)
    setTimeout(() => {
      setAccionEn(null)
      setAccionOk(accion)
      setTimeout(() => setAccionOk(null), 3000)
    }, 1800)
  }

  const estadoPill = (e: string) => {
    if (e === 'sin_deuda') return 'pill-ok'
    if (e === 'en_plazo') return 'pill-blue'
    if (e === 'vencida') return 'pill-err'
    if (e === 'fraccionada') return 'pill-purple'
    return 'pill-neutral'
  }

  // Determina si una acción está bloqueada según reglas de negocio (RF-13)
  const accionBloqueada = (accionId: string): { bloqueada: boolean; motivo: string } => {
    if (!factura) return { bloqueada: false, motivo: '' }

    if (factura.bloqueadaPorReclamacion) {
      if (['banco', 'fracc', 'aplaz'].includes(accionId)) {
        return {
          bloqueada: true,
          motivo: `Bloqueada por reclamación ${factura.reclamacionId} — cobro suspendido hasta resolución`
        }
      }
    }

    if (cobros.fraccionamientoActivo && accionId === 'tarjeta') {
      return {
        bloqueada: true,
        motivo: 'Fraccionamiento activo — el importe está siendo gestionado en cuotas'
      }
    }

    // RN-COB-07: no permitir nuevo fraccionamiento si ya hay uno activo
    if (cobros.fraccionamientoActivo && accionId === 'fracc') {
      return {
        bloqueada: true,
        motivo: `Fraccionamiento activo en curso — ${cobros.fraccionamientoActivo.cuotasPagadas}/${cobros.fraccionamientoActivo.totalCuotas} cuotas pagadas. Esperar a liquidación o renegociar con especialista.`
      }
    }

    // Exclusión EGC/buró — requiere deuda saldada
    if (accionId === 'asnef') {
      if (cobros.deudaTotal > 0) {
        return { bloqueada: true, motivo: 'No aplicable — el cliente tiene deuda vencida. La exclusión de buró requiere deuda saldada.' }
      }
    }

    // Rehabilitación a crédito — requiere deuda saldada y sin riesgo alto
    if (accionId === 'rehab') {
      if (cobros.deudaTotal > 0) {
        return { bloqueada: true, motivo: 'No aplicable — rehabilitación requiere deuda saldada y mínimo 30 días sin impagos.' }
      }
      if (cobros.riesgo === 'alto') {
        return { bloqueada: true, motivo: 'No aplicable — scoring de riesgo alto. Revisar con especialista de cobros.' }
      }
    }

    // EJG — solo disponible si hay deuda vencida
    if (accionId === 'ejg') {
      if (cobros.deudaTotal === 0) {
        return { bloqueada: true, motivo: 'No aplicable — no existe deuda vencida sobre la que iniciar expediente judicial.' }
      }
    }

    // Compensación — bloqueada si hay fraccionamiento activo
    if (accionId === 'compens' && cobros.fraccionamientoActivo) {
      return { bloqueada: true, motivo: 'No aplicable con fraccionamiento activo — esperar a liquidación de cuotas.' }
    }

    return { bloqueada: false, motivo: '' }
  }

  return (
    <>
      {/* ── HEADER ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>Gestión de Cobros</div>
          <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 2 }}>
            Deuda activa · Histórico · Pre-check de tramitabilidad
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => navigate(`/cliente/${id}/reclamaciones`)}
            className="btn-secondary"
            style={{ fontSize: 11 }}>
            Ver reclamaciones →
          </button>
          <button
            onClick={() => navigate(`/cliente/${id}/facturas`)}
            className="btn-secondary"
            style={{ fontSize: 11 }}>
            Ver facturas →
          </button>
        </div>
      </div>

      {/* ── PRE-CHECK DE TRAMITABILIDAD (RF-06) ── */}
      {preCheck.length > 0 && preCheckVisible && (
        <div style={{
          border: `1.5px solid ${hayBloqueantes ? 'var(--color-red-border)' : 'var(--color-amber-border)'}`,
          borderRadius: 'var(--border-radius-lg)',
          background: hayBloqueantes ? 'var(--color-red-light)' : 'var(--color-amber-light)',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '10px 14px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: `1px solid ${hayBloqueantes ? 'var(--color-red-border)' : 'var(--color-amber-border)'}`
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 14 }}>{hayBloqueantes ? '🔴' : '🟡'}</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: hayBloqueantes ? 'var(--color-red-dark)' : 'var(--color-amber-dark)' }}>
                  Pre-check de tramitabilidad —
                  {hayBloqueantes ? ' Tramitación bloqueada' : ' Advertencias activas'}
                </div>
                <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', marginTop: 1 }}>
                  {preCheck.filter(b => b.nivel === 'bloqueante').length} bloqueo/s · {preCheck.filter(b => b.nivel === 'advertencia').length} advertencia/s
                </div>
              </div>
            </div>
            <button
              onClick={() => setPreCheckVisible(false)}
              style={{ fontSize: 11, color: 'var(--color-text-tertiary)', background: 'none', border: 'none', cursor: 'pointer' }}>
              Ocultar
            </button>
          </div>

          <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {preCheck.map((b, i) => (
              <div key={i} style={{
                padding: '8px 12px',
                borderRadius: 'var(--border-radius-md)',
                background: 'rgba(255,255,255,0.6)',
                border: `1px solid ${b.nivel === 'bloqueante' ? 'var(--color-red-border)' : 'var(--color-amber-border)'}`,
                display: 'flex',
                gap: 10
              }}>
                <div style={{ fontSize: 14, flexShrink: 0 }}>
                  {b.nivel === 'bloqueante' ? '🔴' : '🟡'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: b.nivel === 'bloqueante' ? 'var(--color-red-dark)' : 'var(--color-amber-dark)', marginBottom: 2 }}>
                    {b.motivo}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 4 }}>
                    {b.detalle}
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: b.nivel === 'bloqueante' ? 'var(--color-red-dark)' : 'var(--color-amber-dark)' }}>
                    → {b.accion}
                  </div>
                </div>
                <div style={{
                  flexShrink: 0,
                  fontSize: 9,
                  padding: '2px 7px',
                  borderRadius: 'var(--border-radius-full)',
                  background: b.nivel === 'bloqueante' ? 'var(--color-red-mid)' : 'var(--color-amber-mid)',
                  color: '#fff',
                  fontWeight: 700,
                  alignSelf: 'flex-start',
                  marginTop: 2
                }}>
                  {b.nivel === 'bloqueante' ? 'BLOQUEA' : 'AVISO'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Botón para mostrar pre-check si está oculto */}
      {preCheck.length > 0 && !preCheckVisible && (
        <button
          onClick={() => setPreCheckVisible(true)}
          style={{
            padding: '6px 14px', fontSize: 11, borderRadius: 'var(--border-radius-full)',
            border: `1.5px solid ${hayBloqueantes ? 'var(--color-red-border)' : 'var(--color-amber-border)'}`,
            background: hayBloqueantes ? 'var(--color-red-light)' : 'var(--color-amber-light)',
            color: hayBloqueantes ? 'var(--color-red-dark)' : 'var(--color-amber-dark)',
            cursor: 'pointer', fontWeight: 600
          }}>
          {hayBloqueantes ? '🔴' : '🟡'} Ver pre-check ({preCheck.length} condición/es)
        </button>
      )}

      {/* ── CONTEXTO VRU ── */}
      {cobros.resumenVRU && (
        <div className="card card-blue">
          <div className="card-title">Contexto VRU — Motivo de derivación</div>
          <div className="grid3">
            {[
              { label: 'Motivo derivación', val: cobros.resumenVRU.motivoDerivacion },
              { label: 'Intentos de pago', val: `${cobros.resumenVRU.intentosPago} intentos · ${cobros.resumenVRU.resultadoUltimoPago}` },
              { label: 'Llamadas hoy', val: `${cobros.resumenVRU.llamadasHoy} llamadas este día` },
            ].map(row => (
              <div key={row.label} style={{ background: 'var(--color-background-secondary)', borderRadius: 'var(--border-radius-md)', padding: '8px 10px' }}>
                <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', marginBottom: 3 }}>{row.label}</div>
                <div style={{ fontSize: 12, fontWeight: 600 }}>{row.val}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── KPIs ── */}
      <div className="grid4">
        {[
          {
            label: 'Deuda total',
            val: `${cobros.deudaTotal.toFixed(2)}€`,
            color: cobros.deudaTotal > 0
              ? cobros.estadoGeneral === 'vencida' ? 'var(--color-red)' : 'var(--color-amber)'
              : 'var(--color-green)',
          },
          {
            label: 'Estado',
            val: cobros.estadoGeneral.replace('_', ' '),
            pill: estadoPill(cobros.estadoGeneral),
          },
          {
            label: 'Vencimiento',
            val: cobros.facturasConDeuda[0]?.vencimiento || '—',
          },
          {
            label: 'Nuevas contrataciones',
            val: cobros.riesgo === 'alto' ? 'Bloqueadas' : cobros.riesgo === 'medio' ? 'Con validación' : 'Permitidas',
            color: cobros.riesgo === 'bajo' ? 'var(--color-green)' : cobros.riesgo === 'medio' ? 'var(--color-amber)' : 'var(--color-red)',
          },
        ].map(kpi => (
          <div key={kpi.label} style={{ background: 'var(--color-background-primary)', border: '1px solid var(--color-border-tertiary)', borderRadius: 'var(--border-radius-lg)', padding: '10px 12px', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{kpi.label}</div>
            {kpi.pill
              ? <span className={`pill ${kpi.pill}`}>{kpi.val}</span>
              : <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--font-mono)', color: kpi.color || 'var(--color-text-primary)' }}>{kpi.val}</div>
            }
          </div>
        ))}
      </div>

      {/* ── HISTÓRICO DE PAGOS ── */}
      {(() => {
        const historial = historicoPagosPorCliente[id] || []
        if (historial.length === 0) return null
        const conRetraso = historial.filter(h => h.diasRetraso > 0)
        const sinRetraso = historial.filter(h => h.diasRetraso === 0)
        const maxRetraso = Math.max(...historial.map(h => h.diasRetraso))
        return (
          <div className="card" style={{ marginTop: 12 }}>
            <div
              onClick={() => setHistoricoPagosVisible(!historicoPagosVisible)}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', userSelect: 'none' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700 }}>Histórico de pagos</span>
                <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>{historial.length} facturas saldadas</span>
                {conRetraso.length > 0 && (
                  <span style={{ fontSize: 10, fontWeight: 700, background: 'var(--color-amber-light)', color: 'var(--color-amber-dark)', border: '1px solid var(--color-amber-border)', borderRadius: 4, padding: '1px 6px' }}>
                    {conRetraso.length} con retraso
                  </span>
                )}
                {conRetraso.length === 0 && (
                  <span style={{ fontSize: 10, fontWeight: 700, background: 'var(--color-green-light)', color: 'var(--color-green-dark)', border: '1px solid var(--color-green-border)', borderRadius: 4, padding: '1px 6px' }}>
                    Todos en plazo
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--color-text-secondary)' }}>
                  <span>✓ {sinRetraso.length} a tiempo</span>
                  {conRetraso.length > 0 && <span style={{ color: 'var(--color-amber-dark)' }}>⚠ {conRetraso.length} con retraso · máx {maxRetraso}d</span>}
                </div>
                <span style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>{historicoPagosVisible ? '▲' : '▼'}</span>
              </div>
            </div>

            {historicoPagosVisible && (
              <div style={{ marginTop: 12, overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--color-border-secondary)' }}>
                      {['Período', 'Factura', 'Importe', 'Vencimiento', 'Fecha pago', 'Método', 'Retraso', 'Incidencia'].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '4px 8px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-tertiary)', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {historial.map(h => {
                      const tarde = h.diasRetraso > 0
                      return (
                        <tr key={h.id} style={{ borderBottom: '1px solid var(--color-border-tertiary)', background: tarde ? 'var(--color-amber-light)' : 'transparent' }}>
                          <td style={{ padding: '5px 8px', fontWeight: 500 }}>{h.periodo}</td>
                          <td style={{ padding: '5px 8px', color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)' }}>{h.numeroFactura}</td>
                          <td style={{ padding: '5px 8px', fontWeight: 600, whiteSpace: 'nowrap' }}>{h.importe.toFixed(2)} €</td>
                          <td style={{ padding: '5px 8px', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>{h.fechaVencimiento}</td>
                          <td style={{ padding: '5px 8px', whiteSpace: 'nowrap' }}>{h.fechaPago}</td>
                          <td style={{ padding: '5px 8px', color: 'var(--color-text-secondary)' }}>{h.metodoPago}</td>
                          <td style={{ padding: '5px 8px', whiteSpace: 'nowrap', fontWeight: tarde ? 700 : 400, color: tarde ? 'var(--color-amber-dark)' : 'var(--color-green-dark)' }}>
                            {tarde ? `+${h.diasRetraso}d` : '— en plazo'}
                          </td>
                          <td style={{ padding: '5px 8px', color: 'var(--color-text-secondary)', fontSize: 11 }}>{h.incidencia || '—'}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )
      })()}

      {accionOk && (
        <div className="alert alert-ok fade-in">
          <span>✓</span>
          <span style={{ fontWeight: 600 }}>{accionOk} ejecutado correctamente — registro actualizado</span>
        </div>
      )}

      {cobros.facturasConDeuda.length === 0 ? (
        <div style={{ background: 'var(--color-background-primary)', border: '1px solid var(--color-border-tertiary)', borderRadius: 'var(--border-radius-lg)', padding: 32, textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: 12 }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>✓</div>
          Sin deuda activa — cliente al corriente de pago
        </div>
      ) : (
        <div className="grid2">

          {/* ── LISTA FACTURAS CON DEUDA ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Facturas con deuda ({cobros.facturasConDeuda.length})
            </div>

            {cobros.facturasConDeuda.map(f => {
              const isActive = factura?.facturaId === f.facturaId
              const bloqueoInfo = accionBloqueada('tarjeta')
              return (
                <div
                  key={f.facturaId}
                  onClick={() => setFacturaActiva(f)}
                  style={{
                    background: isActive ? 'var(--color-red-light)' : 'var(--color-background-primary)',
                    border: `1px solid ${isActive ? 'var(--color-red-border)' : f.estado === 'vencida' ? 'var(--color-red-border)' : 'var(--color-border-tertiary)'}`,
                    borderLeft: `4px solid ${f.estado === 'vencida' ? 'var(--color-red-mid)' : 'var(--color-amber-mid)'}`,
                    borderRadius: 'var(--border-radius-lg)',
                    padding: '12px 14px',
                    cursor: 'pointer',
                    transition: 'all 0.1s',
                  }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{f.numero}</div>
                    <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-red)' }}>
                      {f.importe.toFixed(2)}€
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: f.bloqueadaPorReclamacion ? 8 : 0 }}>
                    <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>
                      {f.periodo} · Vence {f.vencimiento}
                    </div>
                    <span className={`pill ${f.estado === 'vencida' ? 'pill-err' : 'pill-warn'}`} style={{ fontSize: 10 }}>
                      {f.estado}
                    </span>
                  </div>

                  {/* RF-13 — Bloqueo explícito con motivo */}
                  {f.bloqueadaPorReclamacion && (
                    <div style={{
                      padding: '6px 10px',
                      borderRadius: 'var(--border-radius-md)',
                      background: 'rgba(220,38,38,0.08)',
                      border: '1px solid var(--color-red-border)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-red-dark)', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                          🔒 Cobro bloqueado — {f.reclamacionId}
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)' }}>
                          RN-01: No se permite reiterar cobro con reclamación abierta sobre esta factura
                        </div>
                      </div>
                      <button
                        onClick={e => { e.stopPropagation(); navigate(`/cliente/${id}/reclamaciones`) }}
                        style={{ fontSize: 10, padding: '3px 8px', borderRadius: 'var(--border-radius-full)', border: '1px solid var(--color-red-border)', background: 'white', color: 'var(--color-red-dark)', cursor: 'pointer', fontWeight: 600, flexShrink: 0, marginLeft: 8 }}>
                        Ver →
                      </button>
                    </div>
                  )}

                  {/* Histórico cobro expandido */}
                  {isActive && f.eventosCobro.length > 0 && (
                    <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--color-red-border)' }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Histórico cobro</div>
                      {f.eventosCobro.map((ev, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 8px', borderRadius: 'var(--border-radius-sm)', marginBottom: 3, fontSize: 11, background: ev.resultado === 'ok' ? 'var(--color-green-light)' : ev.resultado === 'fallido' ? 'var(--color-red-light)' : 'var(--color-amber-light)' }}>
                          <span style={{ color: 'var(--color-text-secondary)' }}>{ev.fecha} · {ev.descripcion}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                            {ev.importe !== undefined && (
                              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, color: ev.resultado === 'ok' ? 'var(--color-green-dark)' : 'var(--color-red-dark)' }}>
                                {ev.importe.toFixed(2)}€
                              </span>
                            )}
                            <span className={`status-dot ${ev.resultado === 'ok' ? 'status-dot-ok' : ev.resultado === 'fallido' ? 'status-dot-err' : 'status-dot-warn'}`} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* ── PANEL DERECHO ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

            {/* Acciones disponibles con bloqueos por regla (RF-13) */}
            <div className="card">
              <div className="card-title">Acciones disponibles</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[
                  { id: 'tarjeta', label: 'Pago con tarjeta (VRU)', desc: 'Transferir al sistema de pago automático', primary: true },
                  { id: 'banco', label: 'Reenviar cargo al banco', desc: 'Reintentar domiciliación bancaria' },
                  { id: 'fracc', label: 'Solicitar fraccionamiento', desc: 'Dividir la deuda en cuotas mensuales' },
                  { id: 'aplaz', label: 'Aplazar vencimiento', desc: 'Ampliar la fecha límite de pago' },
                  { id: 'compens', label: 'Aplicar compensación', desc: 'Compensar con saldo a favor si existe' },
                  { id: '__sep__', label: '', desc: '' },
                  { id: 'asnef', label: 'Consultar ASNEF/RAI', desc: 'Verificar inclusión en ficheros de morosidad' },
                  { id: 'ejg', label: 'Solicitar EJG', desc: 'Iniciar expediente de gestión judicial' },
                  { id: 'cert', label: 'Emitir certificado deuda', desc: 'Generar certificado oficial de deuda pendiente' },
                  { id: 'rehab', label: 'Rehabilitar servicio', desc: 'Reactivar servicio suspendido por impago' },
                  { id: 'libpagos', label: 'Liberar pagos retenidos', desc: 'Desbloquear pagos pendientes de validación' },
                ].map(a => {
                  if (a.id === '__sep__') return <div key="sep" style={{ height: 1, background: 'var(--color-border-tertiary)', margin: '4px 0' }} />
                  const blq = accionBloqueada(a.id)
                  return (
                    <div key={a.id}>
                      <button
                        onClick={() => {
                          if (blq.bloqueada) return
                          if (a.id === 'fracc') { setMostrarFracc(!mostrarFracc); setMostrarCompensacion(false); return }
                          if (a.id === 'compens') { setMostrarCompensacion(!mostrarCompensacion); setMostrarFracc(false); return }
                          if (a.id === 'tarjeta') {
                            setVruTransferido(true)
                            setVruResultado('pendiente')
                            setTimeout(() => setVruResultado(Math.random() > 0.3 ? 'ok' : 'fallido'), 4000)
                            return
                          }
                          ejecutar(a.label)
                        }}
                        disabled={blq.bloqueada || !!accionEn}
                        style={{
                          padding: '9px 12px',
                          border: `1px solid ${a.primary && !blq.bloqueada ? 'var(--color-blue-mid)' : blq.bloqueada ? 'var(--color-border-secondary)' : 'var(--color-border-tertiary)'}`,
                          borderRadius: 'var(--border-radius-md)',
                          fontSize: 11,
                          cursor: blq.bloqueada ? 'not-allowed' : 'pointer',
                          display: 'flex', alignItems: 'center', gap: 10,
                          background: blq.bloqueada ? 'var(--color-background-secondary)' : a.primary ? 'var(--color-blue-light)' : 'var(--color-background-secondary)',
                          color: blq.bloqueada ? 'var(--color-text-tertiary)' : a.primary ? 'var(--color-blue-dark)' : 'var(--color-text-primary)',
                          textAlign: 'left', width: '100%', fontFamily: 'var(--font-sans)',
                          opacity: blq.bloqueada ? 0.6 : 1,
                        }}>
                        <span className={`status-dot ${blq.bloqueada ? 'status-dot-grey' : a.primary ? 'status-dot-blue' : 'status-dot-grey'}`} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600 }}>
                            {blq.bloqueada && '🔒 '}{a.label}
                          </div>
                          <div style={{ fontSize: 10, opacity: 0.7, marginTop: 1 }}>{a.desc}</div>
                        </div>
                        {accionEn === a.label && <span className="spinner spinner-sm" />}
                      </button>

                      {/* Motivo del bloqueo visible bajo el botón (RF-06 RN-03) */}
                      {blq.bloqueada && (
                        <div style={{
                          marginTop: 3, marginBottom: 2,
                          padding: '4px 10px',
                          fontSize: 10,
                          color: 'var(--color-red-dark)',
                          background: 'var(--color-red-light)',
                          borderRadius: '0 0 var(--border-radius-md) var(--border-radius-md)',
                          border: '1px solid var(--color-red-border)',
                          borderTop: 'none'
                        }}>
                          {blq.motivo}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Configurador fraccionamiento */}
              {mostrarFracc && (
                <div style={{ marginTop: 12, padding: '12px', background: 'var(--color-background-secondary)', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--color-border-secondary)' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Configurar fraccionamiento</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>Número de cuotas:</span>
                    {[2, 3, 6, 12].map(n => (
                      <button
                        key={n}
                        onClick={() => setCuotas(n)}
                        style={{ width: 36, height: 30, borderRadius: 'var(--border-radius-md)', border: `1.5px solid ${cuotas === n ? 'var(--color-blue)' : 'var(--color-border-secondary)'}`, background: cuotas === n ? 'var(--color-blue-light)' : 'none', color: cuotas === n ? 'var(--color-blue-dark)' : 'var(--color-text-secondary)', fontSize: 12, cursor: 'pointer', fontWeight: cuotas === n ? 700 : 400 }}>
                        {n}
                      </button>
                    ))}
                  </div>
                  {factura && (
                    <div style={{ fontSize: 12, marginBottom: 10 }}>
                      <span style={{ color: 'var(--color-text-secondary)' }}>Cuota mensual: </span>
                      <strong style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-mono)' }}>
                        {(factura.importe / cuotas).toFixed(2)}€/mes
                      </strong>
                    </div>
                  )}
                  <button
                    onClick={() => { ejecutar('Fraccionamiento aprobado'); setMostrarFracc(false) }}
                    className="btn-primary"
                    style={{ width: '100%', justifyContent: 'center', fontSize: 12 }}>
                    Confirmar {cuotas} cuotas de {factura ? (factura.importe / cuotas).toFixed(2) : '—'}€
                  </button>
                </div>
              )}

              {/* RF-COB-07 — Compensación intra/cruzada */}
              {mostrarCompensacion && (() => {
                const saldo = cobros.saldoAFavor || 0
                const deuda = cobros.deudaTotal
                const tieneDeudaOtra = cobros.tieneDeudaO2
                const importesCoinciden = saldo > 0 && Math.abs(saldo - deuda) < 0.01

                return (
                  <div style={{ marginTop: 12, padding: '12px', background: 'var(--color-background-secondary)', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--color-border-secondary)' }}>
                    <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 10 }}>Compensación de deuda</div>

                    {saldo > 0 ? (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                          <span style={{ color: 'var(--color-text-secondary)' }}>Saldo a favor (misma jurídica)</span>
                          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-green-dark)' }}>+{saldo.toFixed(2)}€</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 12 }}>
                          <span style={{ color: 'var(--color-text-secondary)' }}>Deuda pendiente</span>
                          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--color-red-dark)' }}>{deuda.toFixed(2)}€</span>
                        </div>

                        {compensacionEjecutada ? (
                          <div className="alert alert-ok fade-in"><span>✓</span><div style={{ fontSize: 11 }}>Compensación intra-jurídica ejecutada — saldo aplicado a deuda</div></div>
                        ) : (
                          <button
                            onClick={() => { setCompensacionEjecutada(true); setCompensacionTipo('intra') }}
                            className="btn-primary"
                            style={{ width: '100%', justifyContent: 'center', fontSize: 12 }}>
                            ✓ Ejecutar compensación intra-jurídica ({saldo.toFixed(2)}€)
                          </button>
                        )}
                      </>
                    ) : (
                      <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginBottom: 10 }}>
                        Sin saldo a favor en esta jurídica
                      </div>
                    )}

                    {/* Compensación cruzada — RF-COB-07 RN-COB-03 */}
                    {tieneDeudaOtra && (
                      <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--color-border-secondary)' }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: 6 }}>
                          Compensación cruzada (otra jurídica)
                        </div>
                        {importesCoinciden ? (
                          <button
                            onClick={() => { setCompensacionEjecutada(true); setCompensacionTipo('cruzada') }}
                            disabled={compensacionEjecutada}
                            className="btn-primary"
                            style={{ width: '100%', justifyContent: 'center', fontSize: 12 }}>
                            ✓ Ejecutar compensación cruzada — importes coinciden
                          </button>
                        ) : (
                          <div style={{ padding: '8px 10px', borderRadius: 'var(--border-radius-md)', background: 'var(--color-amber-light)', border: '1px solid var(--color-amber-border)', fontSize: 11, color: 'var(--color-amber-dark)' }}>
                            <div style={{ fontWeight: 700, marginBottom: 3 }}>⚠ Importes no coinciden — compensación cruzada bloqueada</div>
                            <div>RN-COB-03: La compensación cruzada requiere importes idénticos. Escalar a especialista de cobros.</div>
                            <button
                              onClick={() => ejecutar('Escalado a especialista cobros multimarca')}
                              className="btn-secondary"
                              style={{ marginTop: 8, fontSize: 11 }}>
                              Escalar a especialista →
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })()}

              {/* Retorno VRU en tiempo real */}
              {vruTransferido && (
                <div className="fade-in" style={{ marginTop: 12, padding: '12px', borderRadius: 'var(--border-radius-md)', border: `1px solid ${vruResultado === 'ok' ? 'var(--color-green-border)' : vruResultado === 'fallido' ? 'var(--color-red-border)' : 'var(--color-blue-mid)'}`, background: vruResultado === 'ok' ? 'var(--color-green-light)' : vruResultado === 'fallido' ? 'var(--color-red-light)' : 'var(--color-blue-light)' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: vruResultado === 'ok' ? 'var(--color-green-dark)' : vruResultado === 'fallido' ? 'var(--color-red-dark)' : 'var(--color-blue-dark)', marginBottom: 6 }}>
                    {vruResultado === 'pendiente' && <><span className="spinner spinner-sm" style={{ marginRight: 6 }} />Esperando resultado del VRU de pago...</>}
                    {vruResultado === 'ok' && '✓ Pago completado por VRU'}
                    {vruResultado === 'fallido' && '✕ Pago fallido en VRU'}
                  </div>
                  {vruResultado === 'pendiente' && (
                    <div style={{ fontSize: 10, color: 'var(--color-blue-dark)' }}>
                      El cliente está en proceso de pago con tarjeta — resultado en tiempo real
                    </div>
                  )}
                  {vruResultado === 'ok' && (
                    <div style={{ fontSize: 11, color: 'var(--color-green-dark)' }}>
                      Deuda saldada · El registro se actualizará en los próximos minutos
                    </div>
                  )}
                  {vruResultado === 'fallido' && (
                    <div style={{ fontSize: 11, color: 'var(--color-red-dark)' }}>
                      El pago no se ha podido completar — ofrecer fraccionamiento o aplazamiento
                    </div>
                  )}
                  {vruResultado !== 'pendiente' && (
                    <button onClick={() => { setVruTransferido(false); setVruResultado(null) }} className="btn-ghost" style={{ fontSize: 10, marginTop: 8 }}>
                      Reintentar
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* ── INDICADORES FIJOS (RF-06) ── */}
            <div className="card">
              <div className="card-title">Indicadores fijos del cliente</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

                {/* Cobros — desglosado por tipo */}
                <div style={{ padding: '8px 10px', borderRadius: 'var(--border-radius-md)', background: cobros.estadoGeneral === 'vencida' ? 'var(--color-red-light)' : cobros.estadoGeneral === 'en_plazo' ? 'var(--color-amber-light)' : 'var(--color-green-light)', border: `1px solid ${cobros.estadoGeneral === 'vencida' ? 'var(--color-red-border)' : cobros.estadoGeneral === 'en_plazo' ? 'var(--color-amber-border)' : 'var(--color-green-border)'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: cobros.facturasConDeuda.length > 0 ? 6 : 0 }}>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-tertiary)', marginBottom: 2 }}>Cobros</div>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>
                        {cobros.estadoGeneral === 'vencida' ? `Deuda vencida — ${cobros.deudaTotal.toFixed(2)}€` :
                         cobros.estadoGeneral === 'en_plazo' ? `Deuda en plazo — ${cobros.deudaTotal.toFixed(2)}€` :
                         'Al corriente de pago'}
                      </div>
                    </div>
                    <span className={`pill ${estadoPill(cobros.estadoGeneral)}`} style={{ fontSize: 10 }}>
                      {cobros.estadoGeneral.replace('_', ' ')}
                    </span>
                  </div>
                  {cobros.facturasConDeuda.length > 0 && (() => {
                    const deudaFijo = cobros.facturasConDeuda.filter(f => f.tipo === 'fijo' || !f.tipo).reduce((s, f) => s + f.importe, 0)
                    const deudaMovil = cobros.facturasConDeuda.filter(f => f.tipo === 'movil').reduce((s, f) => s + f.importe, 0)
                    return (
                      <div style={{ display: 'flex', gap: 8 }}>
                        {deudaFijo > 0 && (
                          <div style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}>
                            📡 Fijo/Fibra: <strong style={{ fontFamily: 'var(--font-mono)' }}>{deudaFijo.toFixed(2)}€</strong>
                          </div>
                        )}
                        {deudaMovil > 0 && (
                          <div style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}>
                            📱 Móvil: <strong style={{ fontFamily: 'var(--font-mono)' }}>{deudaMovil.toFixed(2)}€</strong>
                          </div>
                        )}
                      </div>
                    )
                  })()}
                </div>

                {/* RF-COB-06 — Indicador EGC/FGES */}
                {cobros.cedidaEGC && (
                  <div style={{ padding: '8px 10px', borderRadius: 'var(--border-radius-md)', background: 'var(--color-red-light)', border: '1px solid var(--color-red-border)' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-tertiary)', marginBottom: 2 }}>Deuda cedida a EGC/FGES</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-red-dark)' }}>
                      ⛔ Deuda cedida a empresa de gestión de cobros externa
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--color-red-dark)', marginTop: 3, lineHeight: 1.5 }}>
                      Las acciones de cobro estándar están restringidas. Contactar con especialista EGC/FGES para gestión.
                    </div>
                  </div>
                )}

                {/* RF-COB-06 — Indicador deuda incobrable */}
                {cobros.deudaIncobrable && (
                  <div style={{ padding: '8px 10px', borderRadius: 'var(--border-radius-md)', background: 'var(--color-background-secondary)', border: '1px solid var(--color-border-secondary)' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-tertiary)', marginBottom: 2 }}>Deuda incobrable</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                      📁 Deuda en bolsa incobrable — sin acciones de cobro ordinarias
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', marginTop: 3 }}>
                      No genera acciones de recobro. Visible solo a efectos informativos.
                    </div>
                  </div>
                )}

                {/* RF-COB-07 — Saldo a favor disponible */}
                {(cobros.saldoAFavor || 0) > 0 && (
                  <div style={{ padding: '8px 10px', borderRadius: 'var(--border-radius-md)', background: 'var(--color-green-light)', border: '1px solid var(--color-green-border)' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-tertiary)', marginBottom: 2 }}>Saldo a favor</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-green-dark)' }}>
                        ✓ Disponible para compensación
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-green-dark)' }}>
                        +{(cobros.saldoAFavor || 0).toFixed(2)}€
                      </span>
                    </div>
                  </div>
                )}

                {/* RF-COB-09 — Alerta multimarca O2 */}
                {cobros.tieneDeudaO2 && (
                  <div style={{ padding: '8px 10px', borderRadius: 'var(--border-radius-md)', background: 'var(--color-amber-light)', border: '1px solid var(--color-amber-border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-tertiary)', marginBottom: 2 }}>⚠ Alerta multimarca — O2</div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-amber-dark)' }}>
                          Deuda activa detectada en marca O2
                        </div>
                      </div>
                      <span className="pill pill-warn" style={{ fontSize: 10, flexShrink: 0 }}>RIESGO</span>
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--color-amber-dark)', lineHeight: 1.5, marginBottom: 6 }}>
                      RF-COB-09: Indicador de riesgo/fraude cross-marca. No se pueden ejecutar acciones sobre la deuda O2 desde este perfil.
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <div style={{ flex: 1, padding: '5px 8px', borderRadius: 'var(--border-radius-sm)', background: 'rgba(255,255,255,0.6)', fontSize: 10, color: 'var(--color-amber-dark)' }}>
                        🔒 Acción fuera de marca — consultar con especialista cobros multimarca
                      </div>
                    </div>
                  </div>
                )}

                {/* Nuevas contrataciones */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', borderRadius: 'var(--border-radius-md)', background: cobros.riesgo === 'alto' ? 'var(--color-red-light)' : cobros.riesgo === 'medio' ? 'var(--color-amber-light)' : 'var(--color-green-light)', border: `1px solid ${cobros.riesgo === 'alto' ? 'var(--color-red-border)' : cobros.riesgo === 'medio' ? 'var(--color-amber-border)' : 'var(--color-green-border)'}` }}>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-tertiary)', marginBottom: 2 }}>Nuevas contrataciones</div>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>
                      {cobros.riesgo === 'alto' ? '🚫 Bloqueadas — scoring alto' : cobros.riesgo === 'medio' ? '⚠ Con validación — scoring medio' : '✓ Permitidas — scoring bajo'}
                    </div>
                  </div>
                  <span className={`pill ${cobros.riesgo === 'bajo' ? 'pill-ok' : cobros.riesgo === 'medio' ? 'pill-warn' : 'pill-err'}`} style={{ fontSize: 10 }}>
                    {cobros.riesgo === 'alto' ? 'Bloqueadas' : cobros.riesgo === 'medio' ? 'Con validación' : 'Permitidas'}
                  </span>
                </div>

                {/* Fraccionamiento activo */}
                {cobros.fraccionamientoActivo && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', borderRadius: 'var(--border-radius-md)', background: 'var(--color-purple-light)', border: '1px solid var(--color-purple-border)' }}>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-tertiary)', marginBottom: 2 }}>Fraccionamiento activo</div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-purple)' }}>
                        {cobros.fraccionamientoActivo.cuotasPagadas}/{cobros.fraccionamientoActivo.totalCuotas} cuotas pagadas
                      </div>
                    </div>
                    <span className="pill pill-purple" style={{ fontSize: 10 }}>En curso</span>
                  </div>
                )}

                {/* Acceso rápido reclamaciones con bloqueo */}
                {datos.reclamaciones?.some(r => r.bloquea && r.estado !== 'resuelta') && (
                  <div
                    onClick={() => navigate(`/cliente/${id}/reclamaciones`)}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', borderRadius: 'var(--border-radius-md)', background: 'var(--color-red-light)', border: '1px solid var(--color-red-border)', cursor: 'pointer' }}>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-text-tertiary)', marginBottom: 2 }}>Reclamaciones</div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-red-dark)' }}>
                        {datos.reclamaciones.filter(r => r.bloquea && r.estado !== 'resuelta').length} bloquea/n cobro
                      </div>
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--color-red-dark)', fontWeight: 600 }}>Ver →</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </>
  )
}