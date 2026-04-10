import { useParams, useNavigate } from 'react-router-dom'
import { useAppStore } from '../../store/useAppStore'

export function ProductoDetallePage() {
  const { id, productoId } = useParams()
  const navigate = useNavigate()
  const { clienteActivo } = useAppStore()

  if (!clienteActivo || !productoId) return null

  const producto = clienteActivo.productos.find(p => p.id === productoId)
  if (!producto) return null

  const lineaMovil = producto.tipo === 'movil'
    ? clienteActivo.lineasMovil.find(l => producto.nombre.includes(l.numero))
    : null

  const porcentajeDatos = lineaMovil && lineaMovil.consumoMes.datosTotalesMB > 0
    ? Math.min(100, Math.round((lineaMovil.consumoMes.datosUsadosMB / lineaMovil.consumoMes.datosTotalesMB) * 100))
    : 0

  const colorBarra = porcentajeDatos > 80 ? 'var(--color-red-mid)' : porcentajeDatos > 60 ? 'var(--color-amber-mid)' : 'var(--color-blue)'

  return (
    <>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => navigate(-1)} className="btn-secondary" style={{ fontSize: 11, height: 28 }}>
            ← Volver
          </button>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>{producto.nombre}</div>
            <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 1 }}>
              Detalle del producto · {clienteActivo.nombre} {clienteActivo.apellidos}
            </div>
          </div>
        </div>
        <span className={`pill pill-${producto.estado === 'activa' ? 'ok' : producto.estado === 'suspendida' ? 'err' : 'warn'}`}>
          {producto.estado}
        </span>
      </div>

      {/* ── LÍNEA MÓVIL ── */}
      {producto.tipo === 'movil' && lineaMovil && (
        <>
          {/* Cabecera línea */}
          <div className="card">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              {[
                { label: 'Número', val: lineaMovil.numero },
                { label: 'Tarifa', val: lineaMovil.tarifa },
                { label: 'Titularidad', val: lineaMovil.titularidad },
              ].map(row => (
                <div key={row.label} style={{ background: 'var(--color-background-secondary)', borderRadius: 'var(--border-radius-md)', padding: '10px 12px' }}>
                  <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', marginBottom: 3 }}>{row.label}</div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{row.val}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid2">
            {/* Consumo */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div className="card">
                <div className="card-title">Consumo del mes</div>

                {/* Datos */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 600 }}>Datos móviles</span>
                    <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)', color: porcentajeDatos > 80 ? 'var(--color-red)' : 'var(--color-text-primary)' }}>
                      {lineaMovil.consumoMes.datosTotalesMB < 0
                        ? 'Ilimitado'
                        : `${(lineaMovil.consumoMes.datosUsadosMB / 1024).toFixed(1)} GB / ${(lineaMovil.consumoMes.datosTotalesMB / 1024).toFixed(0)} GB`
                      }
                    </span>
                  </div>
                  {lineaMovil.consumoMes.datosTotalesMB > 0 && (
                    <>
                      <div style={{ height: 8, background: 'var(--color-background-secondary)', borderRadius: 4, overflow: 'hidden', marginBottom: 4 }}>
                        <div style={{ height: '100%', width: `${porcentajeDatos}%`, background: colorBarra, borderRadius: 4, transition: 'width 0.5s' }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--color-text-tertiary)' }}>
                        <span>{porcentajeDatos}% usado</span>
                        <span>{(lineaMovil.consumoMes.datosTotalesMB - lineaMovil.consumoMes.datosUsadosMB) > 0 ? `${((lineaMovil.consumoMes.datosTotalesMB - lineaMovil.consumoMes.datosUsadosMB) / 1024).toFixed(1)} GB restantes` : 'Bono agotado'}</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Consumo en vuelo */}
                <div style={{ padding: '10px 12px', background: 'var(--color-background-secondary)', borderRadius: 'var(--border-radius-md)', marginBottom: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 6 }}>📡 Consumo en vuelo (tiempo real)</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <div>
                      <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', marginBottom: 2 }}>Datos restantes ciclo</div>
                      <div style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-blue)' }}>
                        {lineaMovil.consumoMes.datosTotalesMB < 0 ? '∞' : `${(lineaMovil.consumoMes.enVuelo.datosRestantesMB / 1024).toFixed(1)} GB`}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', marginBottom: 2 }}>Días restantes ciclo</div>
                      <div style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                        {lineaMovil.consumoMes.enVuelo.diasRestantesCiclo}d
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', marginTop: 6 }}>
                    Reset de ciclo: {lineaMovil.consumoMes.fechaReset}
                  </div>
                  {lineaMovil.consumoMes.enVuelo.alertaConsumo && (
                    <div style={{ marginTop: 6, padding: '4px 8px', background: 'var(--color-amber-light)', borderRadius: 'var(--border-radius-sm)', fontSize: 10, color: 'var(--color-amber-dark)', fontWeight: 600 }}>
                      ⚠ Alerta de consumo activada — próximo al límite
                    </div>
                  )}
                </div>

                {/* Llamadas y SMS */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div style={{ padding: '10px 12px', background: 'var(--color-background-secondary)', borderRadius: 'var(--border-radius-md)' }}>
                    <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', marginBottom: 3 }}>📞 Llamadas</div>
                    <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{lineaMovil.consumoMes.llamadasMinutos} min</div>
                  </div>
                  <div style={{ padding: '10px 12px', background: 'var(--color-background-secondary)', borderRadius: 'var(--border-radius-md)' }}>
                    <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', marginBottom: 3 }}>💬 SMS</div>
                    <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{lineaMovil.consumoMes.smsEnviados}</div>
                  </div>
                </div>

                {lineaMovil.consumoMes.roamingActivo && (
                  <div className="alert alert-warn" style={{ marginTop: 10 }}>
                    <span>🌍</span>
                    <span style={{ fontSize: 11, fontWeight: 600 }}>Roaming activo en este momento</span>
                  </div>
                )}
              </div>

              {/* Add-ons */}
              {lineaMovil.addons.length > 0 && (
                <div className="card">
                  <div className="card-title">Add-ons activos</div>
                  {lineaMovil.addons.map(a => (
                    <div key={a.id} className="table-row">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 12 }}>
                          {a.tipo === 'seguro' ? '🛡️' : a.tipo === 'roaming' ? '🌍' : a.tipo === 'datos_extra' ? '📶' : '➕'}
                        </span>
                        <span className="table-row-label">{a.nombre}</span>
                      </div>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                        {a.precio > 0 ? `${a.precio.toFixed(2)}€/mes` : 'Incluido'}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Acciones línea */}
              <div className="card">
                <div className="card-title">Acciones</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <button onClick={() => navigate(`/cliente/${id}/venta`)} className="btn-primary" style={{ justifyContent: 'flex-start', fontSize: 12 }}>
                    🔄 Cambiar tarifa de esta línea
                  </button>
                  <button onClick={() => navigate(`/cliente/${id}/dispositivos`)} className="btn-secondary" style={{ justifyContent: 'flex-start', fontSize: 12 }}>
                    📱 Añadir o cambiar dispositivo
                  </button>
                  <button className="btn-secondary" style={{ justifyContent: 'flex-start', fontSize: 12 }}>
                    📶 Añadir bono de datos
                  </button>
                  <button className="btn-secondary" style={{ justifyContent: 'flex-start', fontSize: 12 }}>
                    🌍 Activar/desactivar roaming
                  </button>
                  {producto.estado === 'activa' ? (
                    <button className="btn-danger" style={{ justifyContent: 'flex-start', fontSize: 12 }}>
                      ⏸ Suspender línea temporalmente
                    </button>
                  ) : (
                    <button className="btn-success" style={{ justifyContent: 'flex-start', fontSize: 12 }}>
                      ▶ Reactivar línea
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Terminal y cuotas */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {lineaMovil.terminal && lineaMovil.cuotasTerminal ? (
                <div className="card">
                  <div className="card-title">Terminal asociado</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                    <div style={{ width: 56, height: 56, borderRadius: 'var(--border-radius-lg)', background: 'var(--color-background-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0 }}>
                      📱
                    </div>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 2 }}>
                        {lineaMovil.terminal.marca} {lineaMovil.terminal.modelo}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>
                        Color: {lineaMovil.terminal.color}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                        IMEI: {lineaMovil.terminal.imei}
                      </div>
                    </div>
                  </div>

                  {[
                    { label: 'Fecha de compra', val: lineaMovil.terminal.fechaCompra },
                    { label: 'Precio total', val: `${lineaMovil.cuotasTerminal.precioTotal.toFixed(2)}€` },
                    { label: 'Cuota mensual', val: `${lineaMovil.cuotasTerminal.cuotaMensual.toFixed(2)}€/mes` },
                  ].map(row => (
                    <div key={row.label} className="table-row">
                      <span className="table-row-label">{row.label}</span>
                      <span className="table-row-value">{row.val}</span>
                    </div>
                  ))}

                  {/* Progreso cuotas */}
                  <div style={{ margin: '14px 0 8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 6 }}>
                      <span style={{ color: 'var(--color-text-secondary)' }}>Cuotas pagadas</span>
                      <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                        {lineaMovil.cuotasTerminal.cuotasPagadas} / {lineaMovil.cuotasTerminal.cuotasTotales}
                      </span>
                    </div>
                    <div style={{ height: 8, background: 'var(--color-background-secondary)', borderRadius: 4, overflow: 'hidden', marginBottom: 4 }}>
                      <div style={{ height: '100%', width: `${Math.round((lineaMovil.cuotasTerminal.cuotasPagadas / lineaMovil.cuotasTerminal.cuotasTotales) * 100)}%`, background: 'var(--color-blue)', borderRadius: 4 }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--color-text-tertiary)' }}>
                      <span>{Math.round((lineaMovil.cuotasTerminal.cuotasPagadas / lineaMovil.cuotasTerminal.cuotasTotales) * 100)}% pagado</span>
                      <span>Última cuota: {lineaMovil.cuotasTerminal.fechaUltimaCuota}</span>
                    </div>
                  </div>

                  {/* Deuda restante */}
                  <div style={{ padding: '12px', background: lineaMovil.cuotasTerminal.deudaRestante > 0 ? 'var(--color-amber-light)' : 'var(--color-green-light)', border: `1px solid ${lineaMovil.cuotasTerminal.deudaRestante > 0 ? 'var(--color-amber-border)' : 'var(--color-green-border)'}`, borderRadius: 'var(--border-radius-md)', marginTop: 4 }}>
                    <div style={{ fontSize: 10, color: lineaMovil.cuotasTerminal.deudaRestante > 0 ? 'var(--color-amber-dark)' : 'var(--color-green-dark)', marginBottom: 3 }}>
                      Deuda restante del terminal
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-mono)', color: lineaMovil.cuotasTerminal.deudaRestante > 0 ? 'var(--color-amber)' : 'var(--color-green)' }}>
                      {lineaMovil.cuotasTerminal.deudaRestante.toFixed(2)}€
                    </div>
                  </div>
                </div>
              ) : (
                <div className="card">
                  <div className="card-title">Terminal asociado</div>
                  <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--color-text-tertiary)', fontSize: 12 }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>📱</div>
                    Sin terminal financiado en esta línea
                  </div>
                  <button onClick={() => navigate(`/cliente/${id}/dispositivos`)} className="btn-primary" style={{ width: '100%', justifyContent: 'center', fontSize: 12 }}>
                    Ver escaparate de dispositivos →
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ── FIBRA ── */}
      {producto.tipo === 'fibra' && (
        <>
          <div className="grid2">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div className="card">
                <div className="card-title">Servicio de fibra</div>
                {[
                  { label: 'Velocidad contratada', val: producto.nombre.includes('1 Gb') ? '1 Gb simétrico' : producto.nombre.includes('600') ? '600 Mb simétrico' : '300 Mb simétrico' },
                  { label: 'Dirección de instalación', val: producto.direccion || '—' },
                  { label: 'Estado del servicio', val: producto.estado, pill: producto.estado === 'activa' ? 'pill-ok' : 'pill-err' },
                  { label: 'Tecnología', val: 'Fibra óptica GPON' },
                  { label: 'Precio mensual', val: `${(producto.precio || 0).toFixed(2)}€/mes` },
                ].map(row => (
                  <div key={row.label} className="table-row">
                    <span className="table-row-label">{row.label}</span>
                    {(row as any).pill
                      ? <span className={`pill ${(row as any).pill}`} style={{ fontSize: 10 }}>{row.val}</span>
                      : <span className="table-row-value">{row.val}</span>
                    }
                  </div>
                ))}
              </div>

              <div className="card">
                <div className="card-title">Estado técnico en tiempo real</div>
                {[
                  { label: 'Señal OLT', ok: producto.estado === 'activa', val: producto.estado === 'activa' ? 'OK — señal estable' : 'Suspendido' },
                  { label: 'CPE / Router', ok: producto.estado === 'activa', val: producto.estado === 'activa' ? 'OK — conectado' : 'Sin señal' },
                  { label: 'Masivas en zona', ok: !clienteActivo.averias.some(a => a.masiva), val: clienteActivo.averias.some(a => a.masiva) ? 'Incidencia activa' : 'Sin masivas' },
                ].map(row => (
                  <div key={row.label} className="table-row">
                    <span className="table-row-label">{row.label}</span>
                    <span className={`pill pill-${row.ok ? 'ok' : 'err'}`} style={{ fontSize: 10 }}>{row.val}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div className="card">
                <div className="card-title">Equipo instalado</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                  <div style={{ width: 48, height: 48, background: 'var(--color-background-secondary)', borderRadius: 'var(--border-radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
                    📡
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>Router Fibra</div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>Askey RTF8115VW</div>
                    <span className={`pill pill-${producto.estado === 'activa' ? 'ok' : 'err'}`} style={{ fontSize: 9, marginTop: 4, display: 'inline-block' }}>
                      {producto.estado === 'activa' ? 'Operativo' : 'Sin conexión'}
                    </span>
                  </div>
                </div>
                {[
                  { label: 'Número de serie', val: 'ASK-' + producto.id.toUpperCase() + '-001' },
                  { label: 'Fecha instalación', val: '15/06/2023' },
                  { label: 'Última actualización FW', val: 'Hace 3 días' },
                ].map(row => (
                  <div key={row.label} className="table-row">
                    <span className="table-row-label">{row.label}</span>
                    <span className="table-row-value" style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>{row.val}</span>
                  </div>
                ))}
              </div>

              <div className="card">
                <div className="card-title">Acciones</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <button onClick={() => navigate(`/cliente/${id}/averias`)} className="btn-primary" style={{ justifyContent: 'flex-start', fontSize: 12 }}>
                    ⚡ Gestionar avería
                  </button>
                  <button className="btn-secondary" style={{ justifyContent: 'flex-start', fontSize: 12 }}>
                    🔄 Reiniciar router remotamente
                  </button>
                  <button className="btn-secondary" style={{ justifyContent: 'flex-start', fontSize: 12 }}>
                    📋 Ver histórico de incidencias
                  </button>
                  <button onClick={() => navigate(`/cliente/${id}/venta`)} className="btn-secondary" style={{ justifyContent: 'flex-start', fontSize: 12 }}>
                    🔄 Cambiar velocidad de fibra
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── TV ── */}
      {producto.tipo === 'tv' && (
        <div className="grid2">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div className="card">
              <div className="card-title">Paquete de televisión</div>
              {[
                { label: 'Producto', val: producto.nombre },
                { label: 'Estado', val: producto.estado, pill: producto.estado === 'activa' ? 'pill-ok' : 'pill-err' },
                { label: 'Precio mensual', val: `${(producto.precio || 0).toFixed(2)}€/mes` },
              ].map(row => (
                <div key={row.label} className="table-row">
                  <span className="table-row-label">{row.label}</span>
                  {(row as any).pill
                    ? <span className={`pill ${(row as any).pill}`} style={{ fontSize: 10 }}>{row.val}</span>
                    : <span className="table-row-value">{row.val}</span>
                  }
                </div>
              ))}

              {/* Canales incluidos */}
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Canales y contenidos incluidos</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {[
                    producto.nombre.toLowerCase().includes('fútbol') && { icono: '⚽', label: 'Fútbol', desc: 'LaLiga · Champions · Copa' },
                    producto.nombre.toLowerCase().includes('ficción') && { icono: '🎬', label: 'Ficción', desc: 'HBO Max · AMC · TNT · AXN' },
                    producto.nombre.toLowerCase().includes('netflix') && { icono: '🎥', label: 'Netflix', desc: 'Plan Estándar incluido' },
                    producto.nombre.toLowerCase().includes('disney') && { icono: '🏰', label: 'Disney+', desc: 'Plan Estándar incluido' },
                    { icono: '📺', label: 'Canales básicos', desc: 'Más de 80 canales en HD' },
                  ].filter(Boolean).map((canal: any) => (
                    <div key={canal.label} style={{ padding: '8px 10px', background: 'var(--color-background-secondary)', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--color-border-tertiary)', flex: '1 1 calc(50% - 6px)' }}>
                      <div style={{ fontSize: 14, marginBottom: 3 }}>{canal.icono}</div>
                      <div style={{ fontSize: 11, fontWeight: 600 }}>{canal.label}</div>
                      <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)' }}>{canal.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-title">Acciones</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <button onClick={() => navigate(`/cliente/${id}/venta`)} className="btn-primary" style={{ justifyContent: 'flex-start', fontSize: 12 }}>
                  ➕ Añadir canales o paquetes
                </button>
                <button className="btn-secondary" style={{ justifyContent: 'flex-start', fontSize: 12 }}>
                  🔄 Refresco de señal TV
                </button>
                <button className="btn-secondary" style={{ justifyContent: 'flex-start', fontSize: 12 }}>
                  📋 Ver histórico decodificador
                </button>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div className="card">
              <div className="card-title">Decodificador</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <div style={{ width: 48, height: 48, background: 'var(--color-background-secondary)', borderRadius: 'var(--border-radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
                  📺
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>Decodificador 4K</div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>Humax HB-1100S</div>
                  <span className="pill pill-ok" style={{ fontSize: 9, marginTop: 4, display: 'inline-block' }}>Operativo</span>
                </div>
              </div>
              {[
                { label: 'Número de serie', val: 'HMX-' + producto.id.toUpperCase() + '-TV1' },
                { label: 'Estado señal', val: 'Óptima' },
                { label: 'Última sincronización', val: 'Hace 2 horas' },
                { label: 'Versión firmware', val: '4.2.1' },
              ].map(row => (
                <div key={row.label} className="table-row">
                  <span className="table-row-label">{row.label}</span>
                  <span className="table-row-value" style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>{row.val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── FIJO ── */}
      {producto.tipo === 'fijo' && (
        <div className="card">
          <div className="card-title">Teléfono fijo</div>
          {[
            { label: 'Número', val: producto.nombre },
            { label: 'Estado', val: producto.estado, pill: producto.estado === 'activa' ? 'pill-ok' : 'pill-err' },
            { label: 'Dirección', val: producto.direccion || '—' },
            { label: 'Tecnología', val: 'VoIP sobre fibra' },
          ].map(row => (
            <div key={row.label} className="table-row">
              <span className="table-row-label">{row.label}</span>
              {(row as any).pill
                ? <span className={`pill ${(row as any).pill}`} style={{ fontSize: 10 }}>{row.val}</span>
                : <span className="table-row-value">{row.val}</span>
              }
            </div>
          ))}
          <div style={{ marginTop: 12 }}>
            <button onClick={() => navigate(`/cliente/${id}/averias`)} className="btn-secondary" style={{ fontSize: 12 }}>
              ⚡ Reportar problema con el fijo
            </button>
          </div>
        </div>
      )}
    </>
  )
}