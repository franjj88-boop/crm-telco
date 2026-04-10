import { useState } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { catalogoBundles, catalogoAddonsTV, buscarBundles } from '../../data/mockData'
import type { Bundle, ResultadoBusquedaBundle } from '../../types'
import { NuevaVentaPage } from '../venta/NuevaVentaPage'

type ModoVenta = 'selector' | 'cambio_tarifa' | 'alta_servicio' | 'linea_adicional'

export function VentaPage() {
  const { clienteActivo } = useAppStore()
  const [modo, setModo] = useState<ModoVenta>('selector')

  // Selector necesidades
  const [fibraSel, setFibraSel] = useState<number | null>(null)
  const [numLineas, setNumLineas] = useState(0)
  const [datosPrincipal, setDatosPrincipal] = useState<number | 'ilimitado' | null>(null)
  const [datosSecundaria, setDatosSecundaria] = useState<number | 'ilimitado' | null>(null)
  const [addonsTVSel, setAddonsTVSel] = useState<Set<string>>(new Set())

  // Resultados
  const [resultados, setResultados] = useState<ResultadoBusquedaBundle[]>([])
  const [buscado, setBuscado] = useState(false)
  const [bundleSel, setBundleSel] = useState<Bundle | null>(null)

  // Firma
  const [firmando, setFirmando] = useState(false)
  const [firmado, setFirmado] = useState(false)
  const [tipoMovimiento, setTipoMovimiento] = useState<'alta' | 'porta' | 'migra'>('alta')
  const [numeroPorta, setNumeroPorta] = useState('')
  const [tipoAltaServicio, setTipoAltaServicio] = useState<'movil' | 'convergente' | null>(null)
  const [mostrarMLP, setMostrarMLP] = useState(false)
  const [mlpEmail, setMlpEmail] = useState('')
  const [mlpEnviado, setMlpEnviado] = useState(false)
  const [simTipo, setSimTipo] = useState<'sim' | 'esim'>('sim')
  const [entrega, setEntrega] = useState<'domicilio' | 'tienda'>('domicilio')

  if (!clienteActivo) return null

  const tieneFusion = clienteActivo.porfolio === 'fusion'
  const bundleActualObj = catalogoBundles.find(b => b.id === clienteActivo.bundleActual)

  const precargarBundleActual = () => {
    if (!bundleActualObj) return
    const ing = bundleActualObj.ingredientes
    setFibraSel(ing.fibra || null)
    setNumLineas(ing.lineas?.length || 0)
    setDatosPrincipal(ing.lineas?.[0]?.datos || null)
    setDatosSecundaria(ing.lineas?.[1]?.datos || null)
  }

  const iniciarModo = (m: ModoVenta) => {
    setModo(m)
    setBuscado(false)
    setResultados([])
    setBundleSel(null)
    setFirmado(false)
    setAddonsTVSel(new Set())
    if (m === 'cambio_tarifa') {
      precargarBundleActual()
    } else {
      setFibraSel(null)
      setNumLineas(0)
      setDatosPrincipal(null)
      setDatosSecundaria(null)
    }
  }

  const buscar = () => {
    const res = buscarBundles(fibraSel, numLineas, datosPrincipal, datosSecundaria)
    setResultados(res)
    setBuscado(true)
    setBundleSel(null)
    setFirmado(false)
  }

  const toggleAddonTV = (id: string) => {
    const s = new Set(addonsTVSel)
    if (s.has(id)) s.delete(id); else s.add(id)
    setAddonsTVSel(s)
  }

  const precioTotal = () => {
    if (!bundleSel) return 0
    return bundleSel.precio + catalogoAddonsTV.filter(a => addonsTVSel.has(a.id)).reduce((a, x) => a + x.precio, 0)
  }

  const firmar = () => {
    setFirmando(true)
    setTimeout(() => { setFirmando(false); setFirmado(true) }, 2000)
  }

  const resetear = () => {
    setModo('selector')
    setBuscado(false)
    setResultados([])
    setBundleSel(null)
    setFirmado(false)
    setTipoAltaServicio(null)
  }

  const matchColor = (tipo: string) => {
    if (tipo === 'exacto') return { bg: 'var(--color-green-light)', border: 'var(--color-green-border)', color: 'var(--color-green-dark)', label: '✓ Match exacto' }
    if (tipo === 'aproximado') return { bg: 'var(--color-blue-light)', border: 'var(--color-blue-mid)', color: 'var(--color-blue-dark)', label: '≈ Match aproximado' }
    return { bg: 'var(--color-amber-light)', border: 'var(--color-amber-border)', color: 'var(--color-amber-dark)', label: '~ Match parcial' }
  }

  const parqueActualPrecio = clienteActivo.productos.reduce((a, p) => a + (p.precio || 0), 0)

  // ── SELECTOR INICIAL ──
  if (modo === 'selector') {
    return (
      <>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>Venta / Modificación</div>
          <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 2 }}>
            Selecciona el tipo de gestión comercial
          </div>
        </div>

        {tieneFusion && (
          <div className="warning-banner">
            <span style={{ fontSize: 14, flexShrink: 0 }}>⚠</span>
            <div style={{ fontSize: 11 }}>
              <strong>Porfolio descatalogado — {clienteActivo.porfolio.toUpperCase()}</strong>
              <div style={{ opacity: 0.85, marginTop: 2 }}>Para modificar la tarifa es necesario migrar a "mi Movistar".</div>
            </div>
          </div>
        )}

        {/* Bundle actual */}
        {bundleActualObj && (
          <div style={{ background: 'var(--color-background-primary)', border: '1px solid var(--color-border-tertiary)', borderRadius: 'var(--border-radius-lg)', padding: '12px 14px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Tarifa actual</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>{bundleActualObj.nombre}</div>
                <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{bundleActualObj.descripcion}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-text-primary)' }}>{bundleActualObj.precio.toFixed(2)}€</div>
                <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)' }}>/mes sin IVA</div>
              </div>
            </div>
          </div>
        )}

        {/* Opciones */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          {[
            {
              modo: 'cambio_tarifa' as ModoVenta,
              icono: '🔄',
              titulo: 'Cambiar tarifa',
              desc: 'Reposicionar al cliente en un bundle diferente al actual. El sistema parte de la tarifa actual y busca alternativas.',
              color: 'var(--color-blue)',
              bgColor: 'var(--color-blue-light)',
              border: 'var(--color-blue-mid)',
            },
            {
              modo: 'alta_servicio' as ModoVenta,
              icono: '➕',
              titulo: 'Alta de servicio',
              desc: 'Alta línea Móvil o BAF / BAF Convergente. Mismo proceso que nueva contratación con datos del cliente precargados.',
              color: 'var(--color-green)',
              bgColor: 'var(--color-green-light)',
              border: 'var(--color-green-border)',
            },
            {
              modo: 'linea_adicional' as ModoVenta,
              icono: '📱',
              titulo: 'Añadir línea',
              desc: 'Añadir una línea móvil adicional sobre el bundle convergente actual sin cambiar el resto del parque.',
              color: 'var(--color-purple)',
              bgColor: 'var(--color-purple-light)',
              border: 'var(--color-purple-border)',
            },
          ].map(op => (
            <div
              key={op.modo}
              onClick={() => iniciarModo(op.modo)}
              style={{ background: op.bgColor, border: `1.5px solid ${op.border}`, borderRadius: 'var(--border-radius-lg)', padding: '16px', cursor: 'pointer', transition: 'box-shadow 0.15s', boxShadow: 'var(--shadow-sm)' }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow-md)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = 'var(--shadow-sm)'}
            >
              <div style={{ fontSize: 28, marginBottom: 10 }}>{op.icono}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: op.color, marginBottom: 6 }}>{op.titulo}</div>
              <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>{op.desc}</div>
            </div>
          ))}
        </div>
      </>
    )
  }

  // ── LÍNEA ADICIONAL ──
  if (modo === 'linea_adicional') {
    return (
      <NuevaVentaPage
        tipoForzado="movil"
        clientePreCargado={{
          dni: clienteActivo.dni,
          nombre: clienteActivo.nombre,
          apellidos: clienteActivo.apellidos,
          email: clienteActivo.email,
          telefono: clienteActivo.telefono,
          iban: '',
          scoringOK: clienteActivo.riesgoScore !== 'alto',
        }}
      />
    )
  }

  // ── ALTA SERVICIO ──
  if (modo === 'alta_servicio') {
    return (
      <NuevaVentaPage
        tipoForzado="convergente"
        clientePreCargado={{
          dni: clienteActivo.dni,
          nombre: clienteActivo.nombre,
          apellidos: clienteActivo.apellidos,
          email: clienteActivo.email,
          telefono: clienteActivo.telefono,
          iban: '',
          scoringOK: clienteActivo.riesgoScore !== 'alto',
        }}
      />
    )
  }

  // ── CAMBIO TARIFA ──
  const titulos = {
    cambio_tarifa: { titulo: 'Cambiar tarifa', sub: 'Reposicionamiento sobre bundle actual · El sistema parte de la tarifa actual' },
    alta_servicio: { titulo: 'Alta de servicio', sub: 'Nueva contratación · Búsqueda libre de bundles' },
  }
  const tituloActual = titulos[modo as keyof typeof titulos]

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>{tituloActual?.titulo}</div>
          <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 2 }}>{tituloActual?.sub}</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {modo === 'cambio_tarifa' && bundleActualObj && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 12px', background: 'var(--color-background-secondary)', border: '1px solid var(--color-border-tertiary)', borderRadius: 'var(--border-radius-md)', fontSize: 11 }}>
              <span style={{ color: 'var(--color-text-tertiary)' }}>Actual:</span>
              <span style={{ fontWeight: 600 }}>{bundleActualObj.nombre}</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text-secondary)' }}>{bundleActualObj.precio.toFixed(2)}€</span>
            </div>
          )}
          <button onClick={resetear} className="btn-secondary" style={{ fontSize: 11 }}>← Volver</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 12 }}>
        {/* Selector necesidades */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="card">
            <div className="card-title">
              {modo === 'cambio_tarifa' ? '¿Qué necesita ahora el cliente?' : '¿Qué quiere contratar?'}
              {modo === 'cambio_tarifa' && (
                <button onClick={precargarBundleActual} className="card-title-link">↺ Recargar tarifa actual</button>
              )}
            </div>

            {/* Fibra */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 8 }}>🌐 Velocidad de fibra</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <button onClick={() => setFibraSel(null)}
                  style={{ padding: '5px 12px', fontSize: 11, borderRadius: 'var(--border-radius-md)', border: `1.5px solid ${fibraSel === null ? 'var(--color-blue)' : 'var(--color-border-secondary)'}`, background: fibraSel === null ? 'var(--color-blue-light)' : 'var(--color-background-secondary)', color: fibraSel === null ? 'var(--color-blue-dark)' : 'var(--color-text-secondary)', cursor: 'pointer', fontWeight: fibraSel === null ? 600 : 400 }}>
                  Sin fibra
                </button>
                {[300, 600, 1000].map(f => (
                  <button key={f} onClick={() => setFibraSel(f)}
                    style={{ padding: '5px 12px', fontSize: 11, borderRadius: 'var(--border-radius-md)', border: `1.5px solid ${fibraSel === f ? 'var(--color-blue)' : 'var(--color-border-secondary)'}`, background: fibraSel === f ? 'var(--color-blue-light)' : 'var(--color-background-secondary)', color: fibraSel === f ? 'var(--color-blue-dark)' : 'var(--color-text-secondary)', cursor: 'pointer', fontWeight: fibraSel === f ? 600 : 400 }}>
                    {f === 1000 ? '1 Gb' : `${f} Mb`}
                  </button>
                ))}
              </div>
            </div>

            {/* Líneas */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 8 }}>📱 Número de líneas móviles</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {[0, 1, 2, 3].map(n => (
                  <button key={n} onClick={() => { setNumLineas(n); if (n === 0) { setDatosPrincipal(null); setDatosSecundaria(null) } }}
                    style={{ width: 44, height: 32, fontSize: 12, borderRadius: 'var(--border-radius-md)', border: `1.5px solid ${numLineas === n ? 'var(--color-blue)' : 'var(--color-border-secondary)'}`, background: numLineas === n ? 'var(--color-blue-light)' : 'var(--color-background-secondary)', color: numLineas === n ? 'var(--color-blue-dark)' : 'var(--color-text-secondary)', cursor: 'pointer', fontWeight: numLineas === n ? 700 : 400 }}>
                    {n === 0 ? '—' : n}
                  </button>
                ))}
              </div>
            </div>

            {/* Datos principal */}
            {numLineas >= 1 && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 8 }}>📶 Datos línea principal</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {([20, 30, 'ilimitado'] as (number | 'ilimitado')[]).map(d => (
                    <button key={d.toString()} onClick={() => setDatosPrincipal(d)}
                      style={{ padding: '5px 12px', fontSize: 11, borderRadius: 'var(--border-radius-md)', border: `1.5px solid ${datosPrincipal === d ? 'var(--color-blue)' : 'var(--color-border-secondary)'}`, background: datosPrincipal === d ? 'var(--color-blue-light)' : 'var(--color-background-secondary)', color: datosPrincipal === d ? 'var(--color-blue-dark)' : 'var(--color-text-secondary)', cursor: 'pointer', fontWeight: datosPrincipal === d ? 600 : 400 }}>
                      {d === 'ilimitado' ? 'Ilimitado' : `${d} GB`}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Datos secundaria */}
            {numLineas >= 2 && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 8 }}>📶 Datos 2ª línea</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {([20, 30, 'ilimitado'] as (number | 'ilimitado')[]).map(d => (
                    <button key={d.toString()} onClick={() => setDatosSecundaria(d)}
                      style={{ padding: '5px 12px', fontSize: 11, borderRadius: 'var(--border-radius-md)', border: `1.5px solid ${datosSecundaria === d ? 'var(--color-blue)' : 'var(--color-border-secondary)'}`, background: datosSecundaria === d ? 'var(--color-blue-light)' : 'var(--color-background-secondary)', color: datosSecundaria === d ? 'var(--color-blue-dark)' : 'var(--color-text-secondary)', cursor: 'pointer', fontWeight: datosSecundaria === d ? 600 : 400 }}>
                      {d === 'ilimitado' ? 'Ilimitado' : `${d} GB`}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button onClick={buscar} className="btn-primary" style={{ width: '100%', justifyContent: 'center', height: 36, fontSize: 13 }}>
              🔍 Buscar bundles compatibles
            </button>
          </div>

          {/* Resultados */}
          {buscado && (
            <div className="card">
              <div className="card-title">
                Bundles compatibles
                {resultados.length > 0 && (
                  <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>
                    {resultados.length} resultados
                  </span>
                )}
              </div>

              {tieneFusion && (
                <div className="warning-banner" style={{ marginBottom: 8 }}>
                  <span style={{ fontSize: 14, flexShrink: 0 }}>⚠</span>
                  <div style={{ fontSize: 11 }}>
                    <strong>Porfolio descatalogado — {clienteActivo.porfolio.toUpperCase()}</strong>
                    <div style={{ opacity: 0.85, marginTop: 2 }}>La venta requiere migración a "mi Movistar" y puede implicar cambios en la tarificación.</div>
                  </div>
                </div>
              )}

              {resultados.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--color-text-tertiary)', fontSize: 12 }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>🔍</div>
                  Sin bundles para esta combinación. Ajusta los filtros.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {resultados.map(r => {
                    const mc = matchColor(r.matchTipo)
                    const isSelected = bundleSel?.id === r.bundle.id
                    const esMismoBundle = r.bundle.id === clienteActivo.bundleActual
                    const delta = r.bundle.precio - (bundleActualObj?.precio || 0)

                    return (
                      <div key={r.bundle.id} onClick={() => setBundleSel(isSelected ? null : r.bundle)}
                        style={{ padding: '12px 14px', border: `1.5px solid ${isSelected ? 'var(--color-blue)' : esMismoBundle ? 'var(--color-border-secondary)' : 'var(--color-border-tertiary)'}`, borderRadius: 'var(--border-radius-lg)', cursor: esMismoBundle ? 'default' : 'pointer', background: isSelected ? 'var(--color-blue-light)' : esMismoBundle ? 'var(--color-background-secondary)' : 'var(--color-background-primary)', transition: 'all 0.1s', opacity: esMismoBundle ? 0.7 : 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                              <span style={{ fontSize: 13, fontWeight: 700 }}>{r.bundle.nombre}</span>
                              {esMismoBundle && <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, background: 'var(--color-background-tertiary)', color: 'var(--color-text-tertiary)', fontWeight: 700 }}>ACTUAL</span>}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{r.bundle.descripcion}</div>
                          </div>
                          <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 12 }}>
                            <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{r.bundle.precio.toFixed(2)}€</div>
                            {modo === 'cambio_tarifa' && !esMismoBundle && bundleActualObj && (
                              <div style={{ fontSize: 11, fontWeight: 600, color: delta > 0 ? 'var(--color-red)' : 'var(--color-green)' }}>
                                {delta > 0 ? '↑' : '↓'} {Math.abs(delta).toFixed(2)}€/mes
                              </div>
                            )}
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 'var(--border-radius-full)', background: mc.bg, border: `1px solid ${mc.border}`, color: mc.color, fontWeight: 600 }}>
                            {mc.label}
                          </span>
                          {r.bundle.tag && (
                            <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 'var(--border-radius-full)', background: 'var(--color-purple-light)', border: '1px solid var(--color-purple-border)', color: 'var(--color-purple)', fontWeight: 600 }}>
                              {r.bundle.tag}
                            </span>
                          )}
                          {r.matchTipo === 'exacto' && !esMismoBundle && (
                            <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 'var(--border-radius-full)', background: 'var(--color-blue-light)', border: '1px solid var(--color-blue-mid)', color: 'var(--color-blue-dark)', fontWeight: 600 }}>
                              ⭐ NBA
                            </span>
                          )}
                        </div>

                        {r.diferencias.length > 0 && (
                          <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--color-border-tertiary)' }}>
                            {r.diferencias.map((d, i) => (
                              <div key={i} style={{ fontSize: 11, color: 'var(--color-amber-dark)' }}>· {d}</div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Propuestas alternativas */}
          {bundleSel && (() => {
            const propDown = resultados.filter(r => r.bundle.precio < bundleSel.precio && r.bundle.id !== clienteActivo.bundleActual).sort((a, b) => b.bundle.precio - a.bundle.precio)[0]?.bundle || null
            const propUp = resultados.filter(r => r.bundle.precio > bundleSel.precio && r.bundle.id !== clienteActivo.bundleActual).sort((a, b) => a.bundle.precio - b.bundle.precio)[0]?.bundle || null
            const props = [
              { key: 'down', label: '↓ Down', bundle: propDown, color: 'var(--color-amber-dark)', bg: 'var(--color-amber-light)', border: 'var(--color-amber-border)' },
              { key: 'base', label: '= Base', bundle: bundleSel, color: 'var(--color-blue-dark)', bg: 'var(--color-blue-light)', border: 'var(--color-blue-mid)' },
              { key: 'up',   label: '↑ Up',   bundle: propUp,  color: 'var(--color-green-dark)', bg: 'var(--color-green-light)', border: 'var(--color-green-border)' },
            ] as const
            return (
              <div className="card">
                <div className="card-title">🎯 Propuestas alternativas</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  {props.map(p => (
                    <div key={p.key} onClick={() => p.bundle && setBundleSel(p.bundle)}
                      style={{ padding: '10px 12px', border: `1.5px solid ${p.bundle ? p.border : 'var(--color-border-tertiary)'}`, borderRadius: 'var(--border-radius-md)', cursor: p.bundle ? 'pointer' : 'default', background: p.bundle ? p.bg : 'var(--color-background-secondary)', opacity: p.bundle ? 1 : 0.45, transition: 'all 0.1s' }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: p.bundle ? p.color : 'var(--color-text-tertiary)', marginBottom: 4 }}>{p.label}</div>
                      {p.bundle ? (
                        <>
                          <div style={{ fontSize: 11, fontWeight: 600, color: p.color, marginBottom: 2, lineHeight: 1.3 }}>{p.bundle.nombre}</div>
                          <div style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)', color: p.color }}>{p.bundle.precio.toFixed(2)}€</div>
                        </>
                      ) : (
                        <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>No disponible</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })()}

          {/* Add-ons TV */}
          {bundleSel && bundleSel.categoria !== 'fibra_sola' && (
            <div className="card">
              <div className="card-title">📺 Add-ons de televisión (opcional)</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {catalogoAddonsTV.map(addon => {
                  const sel = addonsTVSel.has(addon.id)
                  return (
                    <div key={addon.id} onClick={() => toggleAddonTV(addon.id)}
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 12px', border: `1.5px solid ${sel ? 'var(--color-blue)' : 'var(--color-border-tertiary)'}`, borderRadius: 'var(--border-radius-md)', cursor: 'pointer', background: sel ? 'var(--color-blue-light)' : 'transparent', transition: 'all 0.1s' }}>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: sel ? 600 : 400, color: sel ? 'var(--color-blue-dark)' : 'var(--color-text-primary)' }}>{addon.nombre}</div>
                        <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)' }}>{addon.canales.slice(0, 3).join(' · ')}</div>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)', color: sel ? 'var(--color-blue-dark)' : 'var(--color-text-primary)' }}>+{addon.precio.toFixed(2)}€</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Cesta */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="card" style={{ position: 'sticky', top: 0 }}>
            <div className="card-title">
              {modo === 'cambio_tarifa' ? '🔄 Nueva tarifa' : '🛒 Oferta'}
            </div>

            {!bundleSel ? (
              <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--color-text-tertiary)', fontSize: 12 }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>📦</div>
                Selecciona un bundle de los resultados
              </div>
            ) : (
              <>
                <div style={{ padding: '10px 12px', background: 'var(--color-blue-light)', borderRadius: 'var(--border-radius-md)', marginBottom: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-blue-dark)', marginBottom: 4 }}>{bundleSel.nombre}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--color-blue-dark)' }}>
                    <span>Bundle base</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{bundleSel.precio.toFixed(2)}€</span>
                  </div>
                </div>

                {addonsTVSel.size > 0 && catalogoAddonsTV.filter(a => addonsTVSel.has(a.id)).map(a => (
                  <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--color-text-secondary)', padding: '3px 0' }}>
                    <span>{a.nombre}</span>
                    <span style={{ fontFamily: 'var(--font-mono)' }}>+{a.precio.toFixed(2)}€</span>
                  </div>
                ))}

                <div style={{ borderTop: '1px solid var(--color-border-secondary)', paddingTop: 10, marginTop: 8, marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 3 }}>
                    <span>Sin IVA</span><span style={{ fontFamily: 'var(--font-mono)' }}>{precioTotal().toFixed(2)}€</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 700 }}>
                    <span>Total/mes</span>
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-blue)' }}>{(precioTotal() * 1.21).toFixed(2)}€</span>
                  </div>
                </div>

                {/* Comparativa con parque actual en cambio tarifa */}
                {modo === 'cambio_tarifa' && bundleActualObj && (
                  <div style={{ padding: '8px 10px', borderRadius: 'var(--border-radius-md)', background: precioTotal() < bundleActualObj.precio ? 'var(--color-green-light)' : precioTotal() > bundleActualObj.precio ? 'var(--color-red-light)' : 'var(--color-background-secondary)', border: `1px solid ${precioTotal() < bundleActualObj.precio ? 'var(--color-green-border)' : precioTotal() > bundleActualObj.precio ? 'var(--color-red-border)' : 'var(--color-border-secondary)'}`, marginBottom: 12, fontSize: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ color: 'var(--color-text-secondary)' }}>Tarifa actual</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{(bundleActualObj.precio * 1.21).toFixed(2)}€</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: precioTotal() < bundleActualObj.precio ? 'var(--color-green-dark)' : precioTotal() > bundleActualObj.precio ? 'var(--color-red-dark)' : 'var(--color-text-primary)' }}>
                      <span>{precioTotal() < bundleActualObj.precio ? '↓ Ahorro' : precioTotal() > bundleActualObj.precio ? '↑ Incremento' : '= Sin cambio'}</span>
                      <span style={{ fontFamily: 'var(--font-mono)' }}>
                        {precioTotal() !== bundleActualObj.precio ? `${Math.abs((precioTotal() - bundleActualObj.precio) * 1.21).toFixed(2)}€/mes` : '—'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Provisión SIM/eSIM */}
                {modo !== 'cambio_tarifa' && bundleSel && bundleSel.ingredientes.lineas && bundleSel.ingredientes.lineas.length > 0 && (
                  <div style={{ padding: '10px 12px', background: 'var(--color-background-secondary)', borderRadius: 'var(--border-radius-md)', marginBottom: 10 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: 8 }}>📶 Provisión</div>
                    <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                      {(['sim', 'esim'] as const).map(t => (
                        <button key={t} onClick={() => setSimTipo(t)}
                          style={{ flex: 1, padding: '5px 0', fontSize: 11, fontWeight: simTipo === t ? 700 : 400, border: `1.5px solid ${simTipo === t ? 'var(--color-blue)' : 'var(--color-border-secondary)'}`, borderRadius: 'var(--border-radius-md)', background: simTipo === t ? 'var(--color-blue-light)' : 'var(--color-background-primary)', color: simTipo === t ? 'var(--color-blue-dark)' : 'var(--color-text-secondary)', cursor: 'pointer' }}>
                          {t === 'sim' ? '💳 SIM física' : '📲 eSIM'}
                        </button>
                      ))}
                    </div>
                    {simTipo === 'esim' && (
                      <div style={{ fontSize: 10, color: 'var(--color-blue-dark)', background: 'var(--color-blue-light)', borderRadius: 'var(--border-radius-sm)', padding: '4px 8px', marginBottom: 8 }}>
                        Se enviará QR al email para activación inmediata
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: 6 }}>
                      {(['domicilio', 'tienda'] as const).map(t => (
                        <button key={t} onClick={() => setEntrega(t)}
                          style={{ flex: 1, padding: '5px 0', fontSize: 11, fontWeight: entrega === t ? 700 : 400, border: `1.5px solid ${entrega === t ? 'var(--color-blue)' : 'var(--color-border-secondary)'}`, borderRadius: 'var(--border-radius-md)', background: entrega === t ? 'var(--color-blue-light)' : 'var(--color-background-primary)', color: entrega === t ? 'var(--color-blue-dark)' : 'var(--color-text-secondary)', cursor: 'pointer' }}>
                          {t === 'domicilio' ? '🏠 Domicilio' : '🏪 Tienda'}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {firmado ? (
                  <div className="alert alert-ok">
                    <span>✓</span>
                    <div>
                      <div style={{ fontWeight: 700 }}>
                        {modo === 'cambio_tarifa' ? 'Cambio de tarifa confirmado' : 'Pedido generado'}
                      </div>
                      <div style={{ fontSize: 11, marginTop: 2 }}>OTP verificado · El cliente recibirá confirmación</div>
                    </div>
                  </div>
                ) : (
                  <>
                    <button onClick={firmar} disabled={firmando} className="btn-primary" style={{ width: '100%', justifyContent: 'center', height: 36, fontSize: 13, marginBottom: 6 }}>
                      {firmando ? <><span className="spinner spinner-sm" /> Enviando OTP...</> : '🔐 Firmar con OTP'}
                    </button>
                    <button onClick={() => { setMlpEmail(clienteActivo.email || ''); setMostrarMLP(true) }} className="btn-secondary" style={{ width: '100%', justifyContent: 'center', fontSize: 11 }}>
                      📄 Me lo pienso (MLP)
                    </button>
                  </>
                )}
              </>
            )}
          </div>

          {/* Calculadora ARPU global */}
          <div className="card" style={{ border: '1.5px solid var(--color-blue-mid)', background: 'var(--color-blue-light)' }}>
            <div className="card-title" style={{ color: 'var(--color-blue-dark)' }}>
              📊 Calculadora ARPU
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 10 }}>
              {clienteActivo.productos.filter(p => (p.precio || 0) > 0).map(p => (
                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--color-blue-dark)' }}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>{p.nombre}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, flexShrink: 0 }}>{(p.precio || 0).toFixed(2)}€</span>
                </div>
              ))}
            </div>
            <div style={{ borderTop: '1px solid var(--color-blue-mid)', paddingTop: 8, marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700, color: 'var(--color-blue-dark)' }}>
                <span>ARPU actual (c/IVA)</span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>{(parqueActualPrecio * 1.21).toFixed(2)}€</span>
              </div>
            </div>
            {bundleSel && (
              <div className="fade-in" style={{ borderTop: '1px solid var(--color-blue-mid)', paddingTop: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700, color: precioTotal() > parqueActualPrecio ? 'var(--color-green-dark)' : 'var(--color-red-dark)' }}>
                  <span>ARPU nuevo (c/IVA)</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>{(precioTotal() * 1.21).toFixed(2)}€</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 700, color: precioTotal() > parqueActualPrecio ? 'var(--color-green-dark)' : 'var(--color-amber-dark)', marginTop: 4 }}>
                  <span>{precioTotal() > parqueActualPrecio ? '↑ Incremento' : '↓ Reducción'}</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>{precioTotal() > parqueActualPrecio ? '+' : ''}{((precioTotal() - parqueActualPrecio) * 1.21).toFixed(2)}€/mes</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal MLP */}
      {mostrarMLP && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card" style={{ width: 360, maxWidth: '90vw' }}>
            <div className="card-title">📄 Enviar propuesta MLP</div>
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 12 }}>
              Se enviará un resumen de la oferta al cliente para que la consulte cuando quiera.
            </div>
            {bundleSel && (
              <div style={{ padding: '8px 10px', background: 'var(--color-blue-light)', borderRadius: 'var(--border-radius-md)', marginBottom: 12, fontSize: 12 }}>
                <div style={{ fontWeight: 700, color: 'var(--color-blue-dark)', marginBottom: 2 }}>{bundleSel.nombre}</div>
                <div style={{ color: 'var(--color-blue-dark)' }}>{(bundleSel.precio * 1.21).toFixed(2)}€/mes (c/IVA)</div>
              </div>
            )}
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 4, color: 'var(--color-text-secondary)' }}>Email del cliente</div>
              <input value={mlpEmail} onChange={e => setMlpEmail(e.target.value)} placeholder="email@dominio.com"
                style={{ width: '100%', padding: '7px 10px', fontSize: 12, border: '1.5px solid var(--color-border-secondary)', borderRadius: 'var(--border-radius-md)', boxSizing: 'border-box', fontFamily: 'inherit' }} />
            </div>
            {mlpEnviado ? (
              <div className="alert alert-ok"><span>✓</span><div>MLP enviado correctamente</div></div>
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setMostrarMLP(false)} className="btn-secondary" style={{ flex: 1, justifyContent: 'center', fontSize: 12 }}>Cancelar</button>
                <button
                  onClick={() => { setMlpEnviado(true); setTimeout(() => { setMostrarMLP(false); setMlpEnviado(false) }, 2000) }}
                  disabled={!mlpEmail.trim() || !mlpEmail.includes('@')}
                  className="btn-primary" style={{ flex: 1, justifyContent: 'center', fontSize: 12 }}>
                  Enviar MLP
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}