import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { catalogoBundles, catalogoAddonsTV, catalogoDispositivos, buscarBundles } from '../../data/mockData'
import type { Bundle, ResultadoBusquedaBundle, Dispositivo } from '../../types'

type Paso = 1 | 2 | 3 | 4 | 5 | 6
type TipoAlta = 'movil' | 'convergente' | null

type DatosCobertura = {
  calle: string; numero: string; cp: string; ciudad: string
  tecnologia: 'fibra' | 'radio' | null
  velocidadMax: number; autoinstalable: boolean; verificada: boolean
}
type DatosCliente = {
  dni: string; nombre: string; apellidos: string
  email: string; telefono: string; iban: string; nacionalidad: string; idioma: string
}
type DatosProvision = {
  citaFecha: string; citaFranja: string
  sim: 'fisica' | 'esim'
  fttr: 'no' | 'con-instalacion'
  entrega: 'domicilio' | 'tienda'
}

const fechasDisponibles = [
  { label: 'Lunes 14 abril', val: '2026-04-14' },
  { label: 'Martes 15 abril', val: '2026-04-15' },
  { label: 'Miércoles 16 abril', val: '2026-04-16' },
  { label: 'Jueves 17 abril', val: '2026-04-17' },
  { label: 'Viernes 18 abril', val: '2026-04-18' },
]
const franjas = ['09:00 - 12:00', '12:00 - 15:00', '15:00 - 18:00', '18:00 - 21:00']

const validarDNI = (v: string) => /^[0-9]{8}[A-Za-z]$/.test(v.trim())
const validarEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())
const validarIBAN = (v: string) => v.replace(/\s/g, '').length >= 20
const validarTel = (v: string) => /^[0-9]{9}$/.test(v.replace(/\s/g, ''))

// ── MARCAS únicas del catálogo ──
const marcasDisponibles = [...new Set(catalogoDispositivos.map(d => d.marca))].sort()
const categoriasDisponibles = [...new Set(catalogoDispositivos.map(d => d.categoria))]

export function NuevaVentaPage() {
  const navigate = useNavigate()
  const [paso, setPaso] = useState<Paso>(1)
  const [tipoAlta, setTipoAlta] = useState<TipoAlta>(null)

  // ── COBERTURA ──
  const [cob, setCob] = useState<DatosCobertura>({ calle: '', numero: '', cp: '', ciudad: '', tecnologia: null, velocidadMax: 0, autoinstalable: false, verificada: false })
  const [verificando, setVerificando] = useState(false)
  const [sinCob, setSinCob] = useState(false)

  // ── CONFIGURADOR ──
  const [fibraSel, setFibraSel] = useState<number | null>(null)
  const [numLineas, setNumLineas] = useState(0)
  const [datosPpal, setDatosPpal] = useState<number | 'ilimitado' | null>(null)
  const [datosSec, setDatosSec] = useState<number | 'ilimitado' | null>(null)
  const [resultados, setResultados] = useState<ResultadoBusquedaBundle[]>([])
  const [buscado, setBuscado] = useState(false)
  const [bundleSel, setBundleSel] = useState<Bundle | null>(null)
  const [addonsSel, setAddonsSel] = useState<Set<string>>(new Set())
  const [dispositivoSel, setDispositivoSel] = useState<Dispositivo | null>(null)

  // ── MODAL ESCAPARATE ──
  const [modalAbierto, setModalAbierto] = useState(false)
  const [filtroPrecioMin, setFiltroPrecioMin] = useState(0)
  const [filtroPrecioMax, setFiltroPrecioMax] = useState(2000)
  const [filtroMarcas, setFiltroMarcas] = useState<Set<string>>(new Set())
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todas')
  const [filtroOrden, setFiltroOrden] = useState<'relevancia' | 'precio_asc' | 'precio_desc'>('relevancia')
  const [mostrarMas, setMostrarMas] = useState(false)
  const hayFiltros = filtroMarcas.size > 0 || filtroCategoria !== 'todas' || filtroPrecioMin > 0 || filtroPrecioMax < 2000

  // ── DATOS CLIENTE ──
  const [datos, setDatos] = useState<DatosCliente>({ dni: '', nombre: '', apellidos: '', email: '', telefono: '', iban: '', nacionalidad: 'Española', idioma: 'Castellano' })
  const [scoring, setScoring] = useState<boolean | null>(null)
  const [scoringCargando, setScoringCargando] = useState(false)

  // ── PROVISIÓN ──
  const [prov, setProv] = useState<DatosProvision>({ citaFecha: '', citaFranja: '', sim: 'fisica', fttr: 'no', entrega: 'domicilio' })

  // ── FIRMA ──
  const [firmando, setFirmando] = useState(false)
  const [firmado, setFirmado] = useState(false)

  // ── PRECIOS ──
  const precioBundle = bundleSel?.precio || 0
  const precioAddons = catalogoAddonsTV.filter(a => addonsSel.has(a.id)).reduce((s, a) => s + a.precio, 0)
  const precioDispositivo = dispositivoSel ? dispositivoSel.precioMensual : 0
  const precioFttr = prov.fttr === 'con-instalacion' ? 12 : 0
  const precioTotal = precioBundle + precioAddons + precioFttr
  const precioConIVA = precioTotal * 1.21
  const cuotaDisp = dispositivoSel?.precioMensual || 0

  // ── HELPERS ──
  const tieneLinea = bundleSel && bundleSel.categoria !== 'fibra_sola'
  const esSoloMovil = tipoAlta === 'movil'

  const toggleAddon = (id: string) => {
    const s = new Set(addonsSel); s.has(id) ? s.delete(id) : s.add(id); setAddonsSel(s)
  }
  const toggleMarca = (m: string) => {
    const s = new Set(filtroMarcas); s.has(m) ? s.delete(m) : s.add(m); setFiltroMarcas(s)
  }

  // ── DISPOSITIVOS FILTRADOS ──
  const dispositivosFiltrados = useMemo(() => {
    let lista = [...catalogoDispositivos]
    if (filtroMarcas.size > 0) lista = lista.filter(d => filtroMarcas.has(d.marca))
    if (filtroCategoria !== 'todas') lista = lista.filter(d => d.categoria === filtroCategoria)
    lista = lista.filter(d => d.precioLibre >= filtroPrecioMin && d.precioLibre <= filtroPrecioMax)
    if (filtroOrden === 'precio_asc') lista.sort((a, b) => a.precioLibre - b.precioLibre)
    else if (filtroOrden === 'precio_desc') lista.sort((a, b) => b.precioLibre - a.precioLibre)
    else lista.sort((a, b) => (b.destacado ? 1 : 0) - (a.destacado ? 1 : 0))
    return lista
  }, [filtroMarcas, filtroCategoria, filtroPrecioMin, filtroPrecioMax, filtroOrden])

  const dispositivosMostrados = hayFiltros || mostrarMas ? dispositivosFiltrados.slice(0, 20) : dispositivosFiltrados.slice(0, 10)
  const hayMas = !hayFiltros && !mostrarMas && dispositivosFiltrados.length > 10

  // ── VERIFICAR COBERTURA ──
  const verificarCobertura = () => {
    if (!cob.calle || !cob.numero || !cob.cp || !cob.ciudad) return
    setVerificando(true); setSinCob(false)
    setTimeout(() => {
      if (cob.cp === '00000') { setSinCob(true); setVerificando(false); return }
      const esFibra = ['28', '08', '41', '46', '48'].some(p => cob.cp.startsWith(p))
      setCob(prev => ({ ...prev, tecnologia: 'fibra', velocidadMax: esFibra ? 1000 : 600, autoinstalable: false, verificada: true }))
      setFibraSel(esFibra ? 600 : 300)
      setVerificando(false)
    }, 1800)
  }

  // ── BUSCAR BUNDLES ──
  const buscar = () => {
    const fibra = esSoloMovil ? null : fibraSel
    const res = buscarBundles(fibra, numLineas, datosPpal, datosSec)
    setResultados(res); setBuscado(true); setBundleSel(null)
  }

  // ── SCORING ──
  const ejecutarScoring = () => {
    if (!validarDNI(datos.dni)) return
    setScoringCargando(true); setScoring(null)
    setTimeout(() => { setScoring(!datos.dni.startsWith('0')); setScoringCargando(false) }, 1800)
  }

  // ── VALIDACIONES ──
  const paso1OK = tipoAlta !== null
  const paso2OK = esSoloMovil ? true : cob.verificada
  const paso3OK = !!bundleSel
  const paso4OK = validarDNI(datos.dni) && datos.nombre.trim().length > 1 && datos.apellidos.trim().length > 1 && validarEmail(datos.email) && validarTel(datos.telefono) && validarIBAN(datos.iban) && scoring === true
  const paso5OK = cob.autoinstalable || esSoloMovil || (prov.citaFecha !== '' && prov.citaFranja !== '')

  const avanzar = () => {
    if (paso === 1) {
      if (esSoloMovil) { setNumLineas(1); setPaso(3) }
      else setPaso(2)
    } else if (paso === 2) setPaso(3)
    else if (paso < 6) setPaso((paso + 1) as Paso)
  }
  const retroceder = () => {
    if (paso === 3 && esSoloMovil) setPaso(1)
    else if (paso > 1) setPaso((paso - 1) as Paso)
  }

  const pasosMostrados = esSoloMovil
    ? [{ num: 1, label: 'Tipo alta' }, { num: 3, label: 'Tarifa' }, { num: 4, label: 'Cliente' }, { num: 5, label: 'Provisión' }, { num: 6, label: 'Firma' }]
    : [{ num: 1, label: 'Tipo alta' }, { num: 2, label: 'Cobertura' }, { num: 3, label: 'Tarifa' }, { num: 4, label: 'Cliente' }, { num: 5, label: 'Provisión' }, { num: 6, label: 'Firma' }]

  const pasoActualIdx = pasosMostrados.findIndex(p => p.num === paso)

  const matchColor = (tipo: string) => ({
    exacto: { bg: 'var(--color-green-light)', border: 'var(--color-green-border)', color: 'var(--color-green-dark)', label: '✓ Exacto' },
    aproximado: { bg: 'var(--color-blue-light)', border: 'var(--color-blue-mid)', color: 'var(--color-blue-dark)', label: '≈ Aproximado' },
    parcial: { bg: 'var(--color-amber-light)', border: 'var(--color-amber-border)', color: 'var(--color-amber-dark)', label: '~ Parcial' },
  }[tipo] || { bg: '', border: '', color: '', label: '' })

  // ── LAYOUT ──
  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-background-secondary)', overflowY: 'auto' }}>

      {/* ── HEADER FIJO ── */}
      <div style={{ position: 'sticky', top: 0, zIndex: 50, background: 'var(--color-background-primary)', borderBottom: '1px solid var(--color-border-tertiary)', padding: '10px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => navigate('/')} className="btn-secondary" style={{ fontSize: 11, height: 28 }}>← Salir</button>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700 }}>Alta de nuevo cliente</div>
            <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)' }}>
              {tipoAlta === 'movil' ? 'Solo línea móvil' : tipoAlta === 'convergente' ? 'Fibra + móvil (convergente)' : 'Nueva contratación'}
            </div>
          </div>
        </div>

        {/* Stepper */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {pasosMostrados.map((p, i) => {
            const activo = p.num === paso
            const completado = pasoActualIdx > i
            return (
              <div key={p.num} style={{ display: 'flex', alignItems: 'center' }}>
                {i > 0 && <div style={{ width: 24, height: 2, background: completado ? 'var(--color-green-border)' : 'var(--color-border-secondary)' }} />}
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 'var(--border-radius-full)', background: activo ? 'var(--color-blue-light)' : 'transparent' }}>
                  <div style={{ width: 18, height: 18, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, background: completado ? 'var(--color-green-border)' : activo ? 'var(--color-blue)' : 'var(--color-background-secondary)', color: (completado || activo) ? '#fff' : 'var(--color-text-tertiary)', border: (!completado && !activo) ? '1px solid var(--color-border-secondary)' : 'none', flexShrink: 0 }}>
                    {completado ? '✓' : i + 1}
                  </div>
                  <span style={{ fontSize: 10, fontWeight: activo ? 600 : 400, color: activo ? 'var(--color-blue-dark)' : completado ? 'var(--color-green)' : 'var(--color-text-tertiary)' }}>{p.label}</span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Cesta mini */}
        {bundleSel && (
          <div style={{ fontSize: 11, padding: '4px 12px', background: 'var(--color-blue-light)', border: '1px solid var(--color-blue-mid)', borderRadius: 'var(--border-radius-full)', color: 'var(--color-blue-dark)', fontWeight: 600 }}>
            {bundleSel.nombre} · {precioConIVA.toFixed(2)}€/mes
            {dispositivoSel && ` + ${dispositivoSel.marca} ${dispositivoSel.modelo}`}
          </div>
        )}
      </div>

      <div style={{ padding: 20 }}>

        {/* ══════════════════════════════════════
            PASO 1 — TIPO DE ALTA
        ══════════════════════════════════════ */}
        {paso === 1 && (
          <div style={{ maxWidth: 640, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>¿Qué quiere contratar el cliente?</div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {[
                { val: 'movil' as TipoAlta, icono: '📱', titulo: 'Solo línea móvil', desc: 'Alta de una o varias líneas móviles sin fibra. No requiere verificación de cobertura.', color: 'var(--color-purple)', bg: 'var(--color-purple-light)', border: 'var(--color-purple-border)' },
                { val: 'convergente' as TipoAlta, icono: '🏠', titulo: 'Convergente', desc: 'Fibra + líneas móviles. Se verifica cobertura en la dirección de instalación.', color: 'var(--color-blue)', bg: 'var(--color-blue-light)', border: 'var(--color-blue-mid)' },
              ].map(op => (
                <div key={op.val!} onClick={() => setTipoAlta(op.val)}
                  style={{ padding: '24px 20px', border: `2px solid ${tipoAlta === op.val ? op.border : 'var(--color-border-tertiary)'}`, borderRadius: 'var(--border-radius-lg)', cursor: 'pointer', background: tipoAlta === op.val ? op.bg : 'var(--color-background-primary)', transition: 'all 0.15s', boxShadow: tipoAlta === op.val ? 'var(--shadow-md)' : 'var(--shadow-sm)' }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow-md)'}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = tipoAlta === op.val ? 'var(--shadow-md)' : 'var(--shadow-sm)'}
                >
                  <div style={{ fontSize: 36, marginBottom: 12 }}>{op.icono}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: tipoAlta === op.val ? op.color : 'var(--color-text-primary)', marginBottom: 8 }}>{op.titulo}</div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>{op.desc}</div>
                  {tipoAlta === op.val && (
                    <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, color: op.color }}>
                      <span>✓</span> Seleccionado
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={avanzar} disabled={!paso1OK} className="btn-primary" style={{ fontSize: 12, height: 36 }}>
                Continuar →
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════
            PASO 2 — COBERTURA (solo convergente)
        ══════════════════════════════════════ */}
        {paso === 2 && (
          <div style={{ maxWidth: 640, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="card">
              <div className="card-title">Verificación de cobertura</div>
              <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 16 }}>
                Introduce la dirección de instalación para verificar la cobertura disponible antes de configurar la tarifa.
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px', gap: 8, marginBottom: 8 }}>
                <input className="input" placeholder="Calle / avenida / plaza..." value={cob.calle} onChange={e => setCob(p => ({ ...p, calle: e.target.value, verificada: false }))} />
                <input className="input" placeholder="Nº" value={cob.numero} onChange={e => setCob(p => ({ ...p, numero: e.target.value, verificada: false }))} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: 8, marginBottom: 16 }}>
                <input className="input" placeholder="Código postal" value={cob.cp} onChange={e => setCob(p => ({ ...p, cp: e.target.value, verificada: false }))} />
                <input className="input" placeholder="Ciudad / municipio" value={cob.ciudad} onChange={e => setCob(p => ({ ...p, ciudad: e.target.value, verificada: false }))} />
              </div>

              <button onClick={verificarCobertura} disabled={verificando || !cob.calle || !cob.numero || !cob.cp || !cob.ciudad} className="btn-primary" style={{ width: '100%', justifyContent: 'center', height: 38 }}>
                {verificando ? <><span className="spinner spinner-sm" /> Verificando cobertura...</> : '📡 Verificar cobertura'}
              </button>

              {sinCob && (
                <div className="alert alert-err" style={{ marginTop: 12 }}>
                  <span>✕</span>
                  <div>
                    <div style={{ fontWeight: 700 }}>Sin cobertura disponible</div>
                    <div style={{ fontSize: 11, marginTop: 2 }}>No hay cobertura en esta dirección. Puedes registrar un prepedido.</div>
                  </div>
                </div>
              )}

              {cob.verificada && (
                <div className="alert alert-ok fade-in" style={{ marginTop: 12 }}>
                  <span>✓</span>
                  <div>
                    <div style={{ fontWeight: 700 }}>Fibra óptica disponible</div>
                    <div style={{ fontSize: 11, marginTop: 4, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                      <span>📍 {cob.calle} {cob.numero}, {cob.cp} {cob.ciudad}</span>
                      <span>🚀 Hasta {cob.velocidadMax === 1000 ? '1 Gb' : `${cob.velocidadMax} Mb`}</span>
                      <span>👷 Requiere técnico</span>
                    </div>
                  </div>
                </div>
              )}

              <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', marginTop: 10, textAlign: 'center' }}>
                Simulación: CPs que empiecen por 28, 08, 41, 46 o 48 → Fibra · Resto → Fibra 600Mb · CP 00000 → Sin cobertura
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button onClick={retroceder} className="btn-secondary" style={{ fontSize: 11 }}>← Atrás</button>
              <button onClick={avanzar} disabled={!paso2OK} className="btn-primary" style={{ fontSize: 12, height: 36 }}>
                Continuar → Configurar tarifa
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════
            PASO 3 — CONFIGURADOR + DISPOSITIVO
        ══════════════════════════════════════ */}
        {paso === 3 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, maxWidth: 1100, margin: '0 auto' }}>

            {/* COLUMNA IZQUIERDA */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

              {/* Info cobertura */}
              {!esSoloMovil && cob.verificada && (
                <div style={{ padding: '8px 14px', background: 'var(--color-green-light)', border: '1px solid var(--color-green-border)', borderRadius: 'var(--border-radius-md)', fontSize: 11, color: 'var(--color-green-dark)', display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span>✓</span>
                  <span><strong>{cob.calle} {cob.numero}, {cob.cp} {cob.ciudad}</strong> · Fibra hasta {cob.velocidadMax === 1000 ? '1 Gb' : `${cob.velocidadMax} Mb`}</span>
                </div>
              )}

              {/* TILES INGREDIENTES */}
              <div className="card">
                <div className="card-title">Configura la tarifa</div>

                {/* Fibra — solo convergente */}
                {!esSoloMovil && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 8 }}>🌐 Velocidad de fibra</div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {[300, 600, 1000].map(f => {
                        const label = f === 1000 ? '1 Gb' : `${f} Mb`
                        const activo = fibraSel === f
                        const disabled = f > (cob.velocidadMax || 1000)
                        return (
                          <div key={f} onClick={() => !disabled && setFibraSel(f)}
                            style={{ flex: 1, padding: '12px 8px', border: `2px solid ${activo ? 'var(--color-blue)' : 'var(--color-border-secondary)'}`, borderRadius: 'var(--border-radius-lg)', cursor: disabled ? 'not-allowed' : 'pointer', background: activo ? 'var(--color-blue-light)' : 'var(--color-background-secondary)', opacity: disabled ? 0.4 : 1, textAlign: 'center', transition: 'all 0.1s' }}>
                            <div style={{ fontSize: 18, marginBottom: 4 }}>📡</div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: activo ? 'var(--color-blue-dark)' : 'var(--color-text-primary)' }}>{label}</div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Líneas */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 8 }}>📱 Líneas móviles</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {(esSoloMovil ? [1, 2, 3] : [0, 1, 2, 3]).map(n => {
                      const activo = numLineas === n
                      return (
                        <div key={n} onClick={() => { setNumLineas(n); if (n === 0) { setDatosPpal(null); setDatosSec(null) } }}
                          style={{ flex: 1, padding: '12px 8px', border: `2px solid ${activo ? 'var(--color-blue)' : 'var(--color-border-secondary)'}`, borderRadius: 'var(--border-radius-lg)', cursor: 'pointer', background: activo ? 'var(--color-blue-light)' : 'var(--color-background-secondary)', textAlign: 'center', transition: 'all 0.1s' }}>
                          <div style={{ fontSize: 18, marginBottom: 4 }}>{n === 0 ? '—' : '📱'.repeat(Math.min(n, 2))}</div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: activo ? 'var(--color-blue-dark)' : 'var(--color-text-primary)' }}>{n === 0 ? 'Sin línea' : `${n} línea${n > 1 ? 's' : ''}`}</div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Datos línea principal */}
                {numLineas >= 1 && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 8 }}>📶 Datos línea {numLineas > 1 ? 'principal' : ''}</div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {([20, 30, 'ilimitado'] as (number | 'ilimitado')[]).map(d => {
                        const activo = datosPpal === d
                        const label = d === 'ilimitado' ? 'Ilimitado' : `${d} GB`
                        return (
                          <div key={String(d)} onClick={() => setDatosPpal(d)}
                            style={{ flex: 1, padding: '12px 8px', border: `2px solid ${activo ? 'var(--color-blue)' : 'var(--color-border-secondary)'}`, borderRadius: 'var(--border-radius-lg)', cursor: 'pointer', background: activo ? 'var(--color-blue-light)' : 'var(--color-background-secondary)', textAlign: 'center', transition: 'all 0.1s' }}>
                            <div style={{ fontSize: 16, marginBottom: 4 }}>📶</div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: activo ? 'var(--color-blue-dark)' : 'var(--color-text-primary)' }}>{label}</div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Datos 2ª línea */}
                {numLineas >= 2 && (
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', marginBottom: 8 }}>📶 Datos 2ª línea</div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {([20, 30, 'ilimitado'] as (number | 'ilimitado')[]).map(d => {
                        const activo = datosSec === d
                        const label = d === 'ilimitado' ? 'Ilimitado' : `${d} GB`
                        return (
                          <div key={String(d)} onClick={() => setDatosSec(d)}
                            style={{ flex: 1, padding: '12px 8px', border: `2px solid ${activo ? 'var(--color-blue)' : 'var(--color-border-secondary)'}`, borderRadius: 'var(--border-radius-lg)', cursor: 'pointer', background: activo ? 'var(--color-blue-light)' : 'var(--color-background-secondary)', textAlign: 'center', transition: 'all 0.1s' }}>
                            <div style={{ fontSize: 16, marginBottom: 4 }}>📶</div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: activo ? 'var(--color-blue-dark)' : 'var(--color-text-primary)' }}>{label}</div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                <button onClick={buscar} className="btn-primary" style={{ width: '100%', justifyContent: 'center', height: 38 }}>
                  🔍 Buscar bundles compatibles
                </button>
              </div>

              {/* RESULTADOS */}
              {buscado && (
                <div className="card">
                  <div className="card-title">
                    Bundles compatibles
                    {resultados.length > 0 && <span style={{ fontSize: 10, color: 'var(--color-text-tertiary)', fontWeight: 400 }}>{resultados.length} resultados</span>}
                  </div>
                  {resultados.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '20px', color: 'var(--color-text-tertiary)', fontSize: 12 }}>
                      <div style={{ fontSize: 28, marginBottom: 8 }}>🔍</div>
                      Sin bundles para esta combinación. Ajusta los filtros.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {resultados.map(r => {
                        const mc = matchColor(r.matchTipo)
                        const sel = bundleSel?.id === r.bundle.id
                        return (
                          <div key={r.bundle.id} onClick={() => setBundleSel(sel ? null : r.bundle)}
                            style={{ padding: '12px 14px', border: `1.5px solid ${sel ? 'var(--color-blue)' : 'var(--color-border-tertiary)'}`, borderRadius: 'var(--border-radius-lg)', cursor: 'pointer', background: sel ? 'var(--color-blue-light)' : 'var(--color-background-primary)', transition: 'all 0.1s' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                                  <span style={{ fontSize: 13, fontWeight: 700 }}>{r.bundle.nombre}</span>
                                  {r.bundle.tag && <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 3, background: 'var(--color-purple-light)', color: 'var(--color-purple)', fontWeight: 700 }}>{r.bundle.tag}</span>}
                                </div>
                                <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{r.bundle.descripcion}</div>
                              </div>
                              <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 12 }}>
                                <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{r.bundle.precio.toFixed(2)}€</div>
                                <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)' }}>/mes sin IVA</div>
                              </div>
                            </div>
                            <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 'var(--border-radius-full)', background: mc.bg, border: `1px solid ${mc.border}`, color: mc.color, fontWeight: 600 }}>{mc.label}</span>
                            {r.diferencias.length > 0 && (
                              <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px solid var(--color-border-tertiary)' }}>
                                {r.diferencias.map((d, i) => <div key={i} style={{ fontSize: 11, color: 'var(--color-amber-dark)' }}>· {d}</div>)}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ADD-ONS TV */}
              {bundleSel && bundleSel.categoria !== 'fibra_sola' && (
                <div className="card">
                  <div className="card-title">📺 Add-ons de televisión (opcional)</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {catalogoAddonsTV.map(a => {
                      const sel = addonsSel.has(a.id)
                      return (
                        <div key={a.id} onClick={() => toggleAddon(a.id)}
                          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 12px', border: `1.5px solid ${sel ? 'var(--color-blue)' : 'var(--color-border-tertiary)'}`, borderRadius: 'var(--border-radius-md)', cursor: 'pointer', background: sel ? 'var(--color-blue-light)' : 'transparent', transition: 'all 0.1s' }}>
                          <div>
                            <div style={{ fontSize: 12, fontWeight: sel ? 600 : 400 }}>{a.nombre}</div>
                            <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)' }}>{a.canales.slice(0, 3).join(' · ')}</div>
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>+{a.precio.toFixed(2)}€</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* DISPOSITIVO */}
              <div className="card">
                <div className="card-title">
                  📱 Dispositivo (opcional)
                  {dispositivoSel && (
                    <button onClick={() => setDispositivoSel(null)} style={{ fontSize: 10, padding: '1px 7px', borderRadius: 'var(--border-radius-full)', border: '1px solid var(--color-red-border)', background: 'var(--color-red-light)', color: 'var(--color-red-dark)', cursor: 'pointer', fontWeight: 600 }}>
                      Quitar
                    </button>
                  )}
                </div>

                {dispositivoSel ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: 'var(--color-blue-light)', borderRadius: 'var(--border-radius-md)', border: '1.5px solid var(--color-blue-mid)' }}>
                    <div style={{ fontSize: 28 }}>{dispositivoSel.imagen}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-blue-dark)' }}>{dispositivoSel.marca} {dispositivoSel.modelo}</div>
                      <div style={{ fontSize: 11, color: 'var(--color-blue-dark)' }}>{dispositivoSel.mesesFinanciacion} cuotas de {dispositivoSel.precioMensual.toFixed(2)}€/mes</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-blue-dark)' }}>{dispositivoSel.precioLibre}€</div>
                      <div style={{ fontSize: 10, color: 'var(--color-blue-dark)' }}>precio libre</div>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setModalAbierto(true)} className="btn-secondary" style={{ width: '100%', justifyContent: 'center', fontSize: 12 }}>
                    📱 Ver escaparate de dispositivos →
                  </button>
                )}
              </div>
            </div>

            {/* COLUMNA DERECHA — CESTA */}
            <div>
              <div className="card" style={{ position: 'sticky', top: 70 }}>
                <div className="card-title">🛒 Resumen</div>

                {!bundleSel ? (
                  <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--color-text-tertiary)', fontSize: 12 }}>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>📦</div>
                    Selecciona un bundle
                  </div>
                ) : (
                  <>
                    <div style={{ padding: '8px 10px', background: 'var(--color-blue-light)', borderRadius: 'var(--border-radius-md)', marginBottom: 8 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-blue-dark)', marginBottom: 3 }}>{bundleSel.nombre}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--color-blue-dark)' }}>
                        <span>Bundle</span><span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{bundleSel.precio.toFixed(2)}€</span>
                      </div>
                    </div>

                    {catalogoAddonsTV.filter(a => addonsSel.has(a.id)).map(a => (
                      <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--color-text-secondary)', padding: '2px 0' }}>
                        <span>{a.nombre}</span><span style={{ fontFamily: 'var(--font-mono)' }}>+{a.precio.toFixed(2)}€</span>
                      </div>
                    ))}

                    {dispositivoSel && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--color-text-secondary)', padding: '4px 0', borderTop: '1px solid var(--color-border-tertiary)', marginTop: 4 }}>
                        <span>{dispositivoSel.marca} {dispositivoSel.modelo}</span>
                        <span style={{ fontFamily: 'var(--font-mono)' }}>+{cuotaDisp.toFixed(2)}€/mes</span>
                      </div>
                    )}

                    <div style={{ borderTop: '1px solid var(--color-border-secondary)', paddingTop: 8, marginTop: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 2 }}>
                        <span>Sin IVA</span><span style={{ fontFamily: 'var(--font-mono)' }}>{precioTotal.toFixed(2)}€</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 700 }}>
                        <span>Total/mes</span>
                        <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-blue)' }}>{precioConIVA.toFixed(2)}€</span>
                      </div>
                      {dispositivoSel && (
                        <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', marginTop: 4 }}>
                          Incl. cuota terminal {cuotaDisp.toFixed(2)}€/mes × {dispositivoSel.mesesFinanciacion} meses
                        </div>
                      )}
                    </div>
                  </>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 14 }}>
                  <button onClick={avanzar} disabled={!paso3OK} className="btn-primary" style={{ width: '100%', justifyContent: 'center', fontSize: 12 }}>
                    Continuar → Datos cliente
                  </button>
                  <button onClick={retroceder} className="btn-secondary" style={{ width: '100%', justifyContent: 'center', fontSize: 11 }}>
                    ← Atrás
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════
            PASO 4 — DATOS DEL CLIENTE
        ══════════════════════════════════════ */}
        {paso === 4 && (
          <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="card">
              <div className="card-title">Datos del cliente</div>

              {/* DNI + Scoring */}
              <div style={{ marginBottom: 14, padding: '14px', background: 'var(--color-background-secondary)', borderRadius: 'var(--border-radius-lg)', border: '1px solid var(--color-border-tertiary)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 8, color: 'var(--color-text-secondary)' }}>DNI / NIE / Pasaporte *</div>
                <input className="input" placeholder="12345678A" value={datos.dni}
                  onChange={e => { setDatos(p => ({ ...p, dni: e.target.value.toUpperCase() })); setScoring(null) }}
                  style={{ marginBottom: 8, borderColor: datos.dni && !validarDNI(datos.dni) ? 'var(--color-red-border)' : undefined }}
                />
                {datos.dni && !validarDNI(datos.dni) && <div style={{ fontSize: 10, color: 'var(--color-red)', marginBottom: 8 }}>Formato inválido — 8 dígitos + 1 letra (ej: 12345678A)</div>}
                <button
                  onClick={ejecutarScoring}
                  disabled={!validarDNI(datos.dni) || scoringCargando}
                  className={scoring === null ? 'btn-primary' : scoring ? 'btn-success' : 'btn-danger'}
                  style={{ width: '100%', justifyContent: 'center', height: 36, fontSize: 12 }}
                >
                  {scoringCargando
                    ? <><span className="spinner spinner-sm" /> Verificando scoring de riesgo...</>
                    : scoring === null ? '🔍 Ejecutar scoring de riesgo'
                    : scoring ? '✓ Scoring OK — cliente apto · Ejecutar de nuevo'
                    : '✕ Scoring KO — cliente no apto · Ejecutar de nuevo'
                  }
                </button>
                {scoring === true && <div style={{ fontSize: 11, color: 'var(--color-green)', marginTop: 8, fontWeight: 600, textAlign: 'center' }}>✓ Cliente apto para la contratación</div>}
                {scoring === false && <div style={{ fontSize: 11, color: 'var(--color-red)', marginTop: 8, fontWeight: 600, textAlign: 'center' }}>✕ Cliente no apto — no se puede continuar con esta oferta</div>}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 4, color: 'var(--color-text-secondary)' }}>Nombre *</div>
                  <input className="input" placeholder="Nombre" value={datos.nombre} onChange={e => setDatos(p => ({ ...p, nombre: e.target.value }))} />
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 4, color: 'var(--color-text-secondary)' }}>Apellidos *</div>
                  <input className="input" placeholder="Apellidos" value={datos.apellidos} onChange={e => setDatos(p => ({ ...p, apellidos: e.target.value }))} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 4, color: 'var(--color-text-secondary)' }}>Email *</div>
                  <input className="input" placeholder="email@ejemplo.com" value={datos.email}
                    onChange={e => setDatos(p => ({ ...p, email: e.target.value }))}
                    style={{ borderColor: datos.email && !validarEmail(datos.email) ? 'var(--color-red-border)' : undefined }}
                  />
                  {datos.email && !validarEmail(datos.email) && <div style={{ fontSize: 10, color: 'var(--color-red)', marginTop: 3 }}>Email inválido</div>}
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 4, color: 'var(--color-text-secondary)' }}>Teléfono *</div>
                  <input className="input" placeholder="612 345 678" value={datos.telefono}
                    onChange={e => setDatos(p => ({ ...p, telefono: e.target.value }))}
                    style={{ borderColor: datos.telefono && !validarTel(datos.telefono) ? 'var(--color-red-border)' : undefined }}
                  />
                  {datos.telefono && !validarTel(datos.telefono) && <div style={{ fontSize: 10, color: 'var(--color-red)', marginTop: 3 }}>9 dígitos</div>}
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 4, color: 'var(--color-text-secondary)' }}>IBAN — Cuenta para domiciliación *</div>
                <input className="input" placeholder="ES91 2100 0418 4502 0005 1332" value={datos.iban}
                  onChange={e => setDatos(p => ({ ...p, iban: e.target.value.toUpperCase() }))}
                  style={{ borderColor: datos.iban && !validarIBAN(datos.iban) ? 'var(--color-red-border)' : undefined }}
                />
                {datos.iban && !validarIBAN(datos.iban) && <div style={{ fontSize: 10, color: 'var(--color-red)', marginTop: 3 }}>IBAN demasiado corto</div>}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 4, color: 'var(--color-text-secondary)' }}>Nacionalidad</div>
                  <select className="input" value={datos.nacionalidad} onChange={e => setDatos(p => ({ ...p, nacionalidad: e.target.value }))}>
                    {['Española', 'Europea', 'Iberoamericana', 'Otra'].map(n => <option key={n}>{n}</option>)}
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 4, color: 'var(--color-text-secondary)' }}>Idioma de comunicación</div>
                  <select className="input" value={datos.idioma} onChange={e => setDatos(p => ({ ...p, idioma: e.target.value }))}>
                    {['Castellano', 'Catalán', 'Euskera', 'Gallego', 'Inglés'].map(i => <option key={i}>{i}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginTop: 14, padding: '8px 12px', background: 'var(--color-background-secondary)', borderRadius: 'var(--border-radius-md)' }}>
                💡 La factura se enviará digitalmente al email indicado por defecto. El cliente puede solicitar factura en papel posteriormente.
              </div>
            </div>

            {!paso4OK && scoring === null && validarDNI(datos.dni) && (
              <div className="alert alert-warn">
                <span>⚠</span>
                <span style={{ fontSize: 11 }}>Ejecuta el scoring de riesgo antes de continuar al siguiente paso.</span>
              </div>
            )}

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={retroceder} className="btn-secondary" style={{ fontSize: 11 }}>← Atrás</button>
              <button onClick={avanzar} disabled={!paso4OK} className="btn-primary" style={{ flex: 1, justifyContent: 'center', fontSize: 12 }}>
                Continuar → Provisión
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════
            PASO 5 — PROVISIÓN
        ══════════════════════════════════════ */}
        {paso === 5 && (
          <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Instalación — solo si hay fibra */}
            {!esSoloMovil && (
              <div className="card">
                <div className="card-title">Instalación de fibra</div>
                {cob.autoinstalable ? (
                  <div className="alert alert-ok">
                    <span>🔧</span>
                    <div><div style={{ fontWeight: 700 }}>Autoinstalación disponible</div><div style={{ fontSize: 11, marginTop: 2 }}>Esta dirección no requiere técnico. El cliente recibirá el equipo en casa con instrucciones.</div></div>
                  </div>
                ) : (
                  <>
                    <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 14 }}>Selecciona la fecha y franja horaria de instalación con técnico.</div>
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 8, color: 'var(--color-text-secondary)' }}>📅 Fecha</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {fechasDisponibles.map(f => (
                          <button key={f.val} onClick={() => setProv(p => ({ ...p, citaFecha: f.val }))}
                            style={{ padding: '6px 12px', fontSize: 11, borderRadius: 'var(--border-radius-md)', border: `1.5px solid ${prov.citaFecha === f.val ? 'var(--color-blue)' : 'var(--color-border-secondary)'}`, background: prov.citaFecha === f.val ? 'var(--color-blue-light)' : 'var(--color-background-secondary)', color: prov.citaFecha === f.val ? 'var(--color-blue-dark)' : 'var(--color-text-secondary)', cursor: 'pointer', fontWeight: prov.citaFecha === f.val ? 600 : 400 }}>
                            {f.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 8, color: 'var(--color-text-secondary)' }}>🕐 Franja horaria</div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {franjas.map(f => (
                          <button key={f} onClick={() => setProv(p => ({ ...p, citaFranja: f }))}
                            style={{ padding: '6px 14px', fontSize: 11, borderRadius: 'var(--border-radius-md)', border: `1.5px solid ${prov.citaFranja === f ? 'var(--color-blue)' : 'var(--color-border-secondary)'}`, background: prov.citaFranja === f ? 'var(--color-blue-light)' : 'var(--color-background-secondary)', color: prov.citaFranja === f ? 'var(--color-blue-dark)' : 'var(--color-text-secondary)', cursor: 'pointer', fontWeight: prov.citaFranja === f ? 600 : 400 }}>
                            {f}
                          </button>
                        ))}
                      </div>
                    </div>
                    {prov.citaFecha && prov.citaFranja && (
                      <div className="alert alert-ok" style={{ marginTop: 12 }}>
                        <span>✓</span>
                        <div style={{ fontSize: 12 }}>Cita: <strong>{fechasDisponibles.find(f => f.val === prov.citaFecha)?.label}</strong> · <strong>{prov.citaFranja}</strong></div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* SIM */}
            {(tieneLinea || esSoloMovil) && (
              <div className="card">
                <div className="card-title">SIM / eSIM</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {[['fisica', '💳', 'SIM física', 'Tarjeta física por correo o recogida en tienda'], ['esim', '📲', 'eSIM', 'Activación digital inmediata en el dispositivo']] .map(([val, ico, tit, desc]) => (
                    <div key={val} onClick={() => setProv(p => ({ ...p, sim: val as 'fisica' | 'esim' }))}
                      style={{ padding: '14px', border: `1.5px solid ${prov.sim === val ? 'var(--color-blue)' : 'var(--color-border-tertiary)'}`, borderRadius: 'var(--border-radius-lg)', cursor: 'pointer', background: prov.sim === val ? 'var(--color-blue-light)' : 'transparent', textAlign: 'center', transition: 'all 0.1s' }}>
                      <div style={{ fontSize: 24, marginBottom: 6 }}>{ico}</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: prov.sim === val ? 'var(--color-blue-dark)' : 'var(--color-text-primary)', marginBottom: 4 }}>{tit}</div>
                      <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)' }}>{desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* FTTR */}
            <div className="card">
              <div className="card-title">FTTR — Fiber to the Room (opcional)</div>
              <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 14 }}>
                Extiende la fibra óptica a cada habitación del hogar. Selecciona si el cliente quiere incluirlo y qué modalidad.
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {([
                  ['no',              '❌', 'Sin FTTR',        '',                          ''],
                  ['con-instalacion', '🔧', 'Con instalación', '+12€/mes durante 48 meses', 'Un técnico instala la fibra en cada habitación'],
                ] as const).map(([val, ico, tit, precio, desc]) => (
                  <div key={val}
                    onClick={() => setProv(p => ({ ...p, fttr: val }))}
                    style={{
                      padding: '14px 10px',
                      border: `1.5px solid ${prov.fttr === val ? 'var(--color-blue)' : 'var(--color-border-tertiary)'}`,
                      borderRadius: 'var(--border-radius-lg)',
                      cursor: 'pointer',
                      background: prov.fttr === val ? 'var(--color-blue-light)' : 'transparent',
                      textAlign: 'center',
                      transition: 'all 0.1s'
                    }}>
                    <div style={{ fontSize: 22, marginBottom: 8 }}>{ico}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: prov.fttr === val ? 'var(--color-blue-dark)' : 'var(--color-text-primary)', marginBottom: 4 }}>{tit}</div>
                    {precio && <div style={{ fontSize: 11, fontWeight: 600, color: val === 'con-instalacion' ? 'var(--color-blue-dark)' : 'var(--color-green-dark)', marginBottom: 4 }}>{precio}</div>}
                    {desc && <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', lineHeight: 1.5 }}>{desc}</div>}
                  </div>
                ))}
              </div>
            </div>

            {/* Entrega router/dispositivo */}
            <div className="card">
              <div className="card-title">Entrega de equipos{dispositivoSel ? ' y dispositivo' : ''}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[['domicilio', '🏠', 'Envío a domicilio', 'Recibirás el equipo en 2-3 días hábiles'], ['tienda', '🏪', 'Recogida en tienda', 'El cliente recoge el equipo en la tienda hoy']].map(([val, ico, tit, desc]) => (
                  <div key={val} onClick={() => setProv(p => ({ ...p, entrega: val as 'domicilio' | 'tienda' }))}
                    style={{ padding: '14px', border: `1.5px solid ${prov.entrega === val ? 'var(--color-blue)' : 'var(--color-border-tertiary)'}`, borderRadius: 'var(--border-radius-lg)', cursor: 'pointer', background: prov.entrega === val ? 'var(--color-blue-light)' : 'transparent', textAlign: 'center', transition: 'all 0.1s' }}>
                    <div style={{ fontSize: 24, marginBottom: 6 }}>{ico}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: prov.entrega === val ? 'var(--color-blue-dark)' : 'var(--color-text-primary)', marginBottom: 4 }}>{tit}</div>
                    <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)' }}>{desc}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={retroceder} className="btn-secondary" style={{ fontSize: 11 }}>← Atrás</button>
              <button onClick={avanzar} disabled={!paso5OK} className="btn-primary" style={{ flex: 1, justifyContent: 'center', fontSize: 12 }}>
                Continuar → Resumen y firma
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════
            PASO 6 — RESUMEN Y FIRMA
        ══════════════════════════════════════ */}
        {paso === 6 && (
          <div style={{ maxWidth: 860, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {firmado ? (
              <div className="card fade-in" style={{ textAlign: 'center', padding: '40px 24px' }}>
                <div style={{ fontSize: 52, marginBottom: 16 }}>🎉</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-green)', marginBottom: 8 }}>Alta completada correctamente</div>
                <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 24 }}>OTP verificado · Pedido generado · Confirmación enviada a <strong>{datos.email}</strong></div>
                <button onClick={() => navigate('/')} className="btn-primary" style={{ fontSize: 12 }}>Volver al inicio</button>
              </div>
            ) : (
              <>
                {/* Venta consciente */}
                <div style={{ padding: '16px', background: 'var(--color-blue-light)', border: '1px solid var(--color-blue-mid)', borderRadius: 'var(--border-radius-lg)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <div style={{ width: 24, height: 24, background: 'var(--color-blue)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#fff' }}>💬</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-blue-dark)' }}>Venta consciente — repasa esto con el cliente</div>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--color-blue-dark)', lineHeight: 1.9 }}>
                    <div>✓ Contratas <strong>{bundleSel?.nombre}</strong>{addonsSel.size > 0 ? ` con ${catalogoAddonsTV.filter(a => addonsSel.has(a.id)).map(a => a.nombre).join(' y ')}` : ''}.</div>
                    <div>✓ Tu cuota mensual es de <strong>{precioConIVA.toFixed(2)}€ con IVA</strong> ({precioTotal.toFixed(2)}€ sin IVA).</div>
                    {dispositivoSel && <div>✓ Además, {dispositivoSel.mesesFinanciacion} cuotas de <strong>{cuotaDisp.toFixed(2)}€/mes</strong> por el {dispositivoSel.marca} {dispositivoSel.modelo}.</div>}
                    <div>✓ El cobro se realizará por domiciliación bancaria en la cuenta indicada.</div>
                    <div>✓ Recibirás la factura digitalmente en <strong>{datos.email}</strong>.</div>
                    {!esSoloMovil && !cob.autoinstalable && prov.citaFecha && <div>✓ Cita de instalación: <strong>{fechasDisponibles.find(f => f.val === prov.citaFecha)?.label}</strong> de <strong>{prov.citaFranja}</strong>.</div>}
                    {(esSoloMovil || cob.autoinstalable) && <div>✓ Recibirás el equipo en tu domicilio con instrucciones de instalación.</div>}
                    {prov.fttr !== 'no' && (
                      <div>✓ FTTR incluido con instalación profesional — +12€/mes durante 48 meses.</div>
                    )}
                  </div>
                </div>

                <div className="grid2">
                  {/* Resumen contrato */}
                  <div className="card">
                    <div className="card-title">Resumen del contrato</div>
                    <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 2 }}>{bundleSel?.nombre}</div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 12 }}>{bundleSel?.descripcion}</div>

                    {addonsSel.size > 0 && (
                      <div style={{ marginBottom: 10 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Add-ons TV</div>
                        {catalogoAddonsTV.filter(a => addonsSel.has(a.id)).map(a => (
                          <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '2px 0' }}>
                            <span>{a.nombre}</span><span style={{ fontFamily: 'var(--font-mono)' }}>+{a.precio.toFixed(2)}€</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {prov.fttr === 'con-instalacion' && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 0', borderTop: '1px dashed var(--color-border-secondary)', marginTop: 4 }}>
                        <span style={{ color: 'var(--color-text-secondary)' }}>FTTR — Fiber to the Room</span>
                        <span style={{ fontFamily: 'var(--font-mono)' }}>+12,00€</span>
                      </div>
                    )}

                    {dispositivoSel && (
                      <div style={{ marginBottom: 10, padding: '8px 10px', background: 'var(--color-background-secondary)', borderRadius: 'var(--border-radius-md)' }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Dispositivo</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                          <span>{dispositivoSel.marca} {dispositivoSel.modelo}</span>
                          <span style={{ fontFamily: 'var(--font-mono)' }}>{cuotaDisp.toFixed(2)}€/mes × {dispositivoSel.mesesFinanciacion}</span>
                        </div>
                      </div>
                    )}

                    <div style={{ borderTop: '1px solid var(--color-border-secondary)', paddingTop: 10 }}>
                      {[
                        { l: 'Subtotal sin IVA', v: `${precioTotal.toFixed(2)}€` },
                        { l: 'IVA (21%)', v: `${(precioConIVA - precioTotal).toFixed(2)}€` },
                      ].map(r => (
                        <div key={r.l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 4 }}>
                          <span>{r.l}</span><span style={{ fontFamily: 'var(--font-mono)' }}>{r.v}</span>
                        </div>
                      ))}
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 700, marginTop: 6 }}>
                        <span>Total mensual</span>
                        <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-blue)' }}>{precioConIVA.toFixed(2)}€</span>
                      </div>
                    </div>

                    <div style={{ borderTop: '1px solid var(--color-border-secondary)', paddingTop: 12, marginTop: 12 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Instalación y provisión</div>
                      {[
                        !esSoloMovil && { label: 'Dirección', val: `${cob.calle} ${cob.numero}, ${cob.cp} ${cob.ciudad}` },
                        !esSoloMovil && { label: 'Tecnología', val: 'Fibra óptica' },
                        !esSoloMovil && !cob.autoinstalable && prov.citaFecha && { label: 'Cita técnico', val: `${fechasDisponibles.find(f => f.val === prov.citaFecha)?.label} · ${prov.citaFranja}` },
                        (esSoloMovil || cob.autoinstalable) && { label: 'Provisión', val: 'Autoinstalación / envío a domicilio' },
                        { label: 'Entrega', val: prov.entrega === 'domicilio' ? 'Envío a domicilio (2-3 días)' : 'Recogida en tienda hoy' },
                        prov.fttr !== 'no' && { label: 'FTTR', val: 'Con instalación (+12€/mes × 48 meses)' },
                        (tieneLinea || esSoloMovil) && { label: 'SIM', val: prov.sim === 'fisica' ? 'SIM física' : 'eSIM' },
                      ].filter(Boolean).map((row: any) => (
                        <div key={row.label} className="table-row">
                          <span className="table-row-label">{row.label}</span>
                          <span className="table-row-value">{row.val}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Titular + firma */}
                  <div className="card">
                    <div className="card-title">Datos del titular</div>
                    {[
                      { label: 'Nombre', val: `${datos.nombre} ${datos.apellidos}` },
                      { label: 'DNI/NIE', val: datos.dni },
                      { label: 'Email', val: datos.email },
                      { label: 'Teléfono', val: datos.telefono },
                      { label: 'IBAN', val: datos.iban.replace(/(.{4})/g, '$1 ').trim() },
                      { label: 'Idioma', val: datos.idioma },
                    ].map(row => (
                      <div key={row.label} className="table-row">
                        <span className="table-row-label">{row.label}</span>
                        <span className="table-row-value">{row.val}</span>
                      </div>
                    ))}

                    <div style={{ marginTop: 16, padding: '10px 12px', background: 'var(--color-background-secondary)', borderRadius: 'var(--border-radius-md)', fontSize: 10, color: 'var(--color-text-tertiary)', lineHeight: 1.6 }}>
                      Al firmar, el cliente acepta las condiciones generales del servicio, la política de privacidad y autoriza la domiciliación bancaria para el pago de las facturas mensuales.
                    </div>

                    <button
                      onClick={() => { setFirmando(true); setTimeout(() => { setFirmando(false); setFirmado(true) }, 2000) }}
                      disabled={firmando}
                      className="btn-primary"
                      style={{ width: '100%', justifyContent: 'center', height: 44, fontSize: 14, marginTop: 14 }}
                    >
                      {firmando
                        ? <><span className="spinner spinner-sm" /> Enviando OTP al {datos.telefono}...</>
                        : '🔐 Firmar contrato con OTP'
                      }
                    </button>
                    <button onClick={retroceder} className="btn-ghost" style={{ width: '100%', justifyContent: 'center', fontSize: 11, marginTop: 8 }}>
                      ← Volver a provisión
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════
          MODAL ESCAPARATE DISPOSITIVOS
      ══════════════════════════════════════ */}
      {modalAbierto && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '20px', overflowY: 'auto' }}
          onClick={e => { if (e.target === e.currentTarget) setModalAbierto(false) }}>
          <div style={{ background: 'var(--color-background-primary)', borderRadius: 'var(--border-radius-lg)', width: '100%', maxWidth: 960, boxShadow: 'var(--shadow-lg)', display: 'flex', flexDirection: 'column', maxHeight: '90vh', overflow: 'hidden' }}>

            {/* Header modal */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border-tertiary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700 }}>Escaparate de dispositivos</div>
                <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>{dispositivosFiltrados.length} dispositivos disponibles</div>
              </div>
              <button onClick={() => setModalAbierto(false)} style={{ width: 28, height: 28, borderRadius: 'var(--border-radius-md)', border: '1px solid var(--color-border-secondary)', background: 'none', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>

            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
              {/* Panel filtros */}
              <div style={{ width: 220, borderRight: '1px solid var(--color-border-tertiary)', padding: '16px', overflowY: 'auto', flexShrink: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Filtros</div>

                {/* Ordenación */}
                <div style={{ marginBottom: 18 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 8 }}>Ordenar por</div>
                  {[['relevancia', 'Relevancia'], ['precio_asc', 'Precio: menor a mayor'], ['precio_desc', 'Precio: mayor a menor']].map(([val, label]) => (
                    <div key={val} onClick={() => setFiltroOrden(val as any)}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 0', cursor: 'pointer', fontSize: 11, color: filtroOrden === val ? 'var(--color-blue-dark)' : 'var(--color-text-secondary)', fontWeight: filtroOrden === val ? 600 : 400 }}>
                      <div style={{ width: 12, height: 12, borderRadius: '50%', border: `2px solid ${filtroOrden === val ? 'var(--color-blue)' : 'var(--color-border-secondary)'}`, background: filtroOrden === val ? 'var(--color-blue)' : 'transparent' }} />
                      {label}
                    </div>
                  ))}
                </div>

                {/* Rango precio */}
                <div style={{ marginBottom: 18 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 8 }}>Precio</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 8 }}>
                    <span>{filtroPrecioMin}€</span>
                    <span>{filtroPrecioMax === 2000 ? '2000€+' : `${filtroPrecioMax}€`}</span>
                  </div>
                  <div style={{ position: 'relative', height: 20, marginBottom: 6 }}>
                    <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 4, background: 'var(--color-border-secondary)', borderRadius: 2, transform: 'translateY(-50%)' }}>
                      <div style={{ position: 'absolute', left: `${(filtroPrecioMin / 2000) * 100}%`, right: `${100 - (filtroPrecioMax / 2000) * 100}%`, background: 'var(--color-blue)', height: '100%', borderRadius: 2 }} />
                    </div>
                    <input type="range" min={0} max={2000} step={50} value={filtroPrecioMin}
                      onChange={e => setFiltroPrecioMin(Math.min(Number(e.target.value), filtroPrecioMax - 50))}
                      style={{ position: 'absolute', width: '100%', opacity: 0, cursor: 'pointer', zIndex: 2 }}
                    />
                  </div>
                  <div style={{ position: 'relative', height: 20 }}>
                    <input type="range" min={0} max={2000} step={50} value={filtroPrecioMax}
                      onChange={e => setFiltroPrecioMax(Math.max(Number(e.target.value), filtroPrecioMin + 50))}
                      style={{ width: '100%', cursor: 'pointer', accentColor: 'var(--color-blue)' }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                    {[300, 500, 800, 1200].map(p => (
                      <button key={p} onClick={() => { setFiltroPrecioMin(0); setFiltroPrecioMax(p) }}
                        style={{ flex: 1, padding: '3px 0', fontSize: 9, borderRadius: 3, border: `1px solid ${filtroPrecioMax === p && filtroPrecioMin === 0 ? 'var(--color-blue)' : 'var(--color-border-secondary)'}`, background: filtroPrecioMax === p && filtroPrecioMin === 0 ? 'var(--color-blue-light)' : 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>
                        &lt;{p}€
                      </button>
                    ))}
                  </div>
                </div>

                {/* Marcas */}
                <div style={{ marginBottom: 18 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 8 }}>Marca</div>
                  {marcasDisponibles.map(m => (
                    <div key={m} onClick={() => toggleMarca(m)}
                      style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '4px 0', cursor: 'pointer', fontSize: 11, color: filtroMarcas.has(m) ? 'var(--color-blue-dark)' : 'var(--color-text-secondary)', fontWeight: filtroMarcas.has(m) ? 600 : 400 }}>
                      <div style={{ width: 13, height: 13, borderRadius: 3, border: `2px solid ${filtroMarcas.has(m) ? 'var(--color-blue)' : 'var(--color-border-secondary)'}`, background: filtroMarcas.has(m) ? 'var(--color-blue)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#fff', flexShrink: 0 }}>
                        {filtroMarcas.has(m) ? '✓' : ''}
                      </div>
                      {m}
                    </div>
                  ))}
                </div>

                {/* Categoría */}
                <div style={{ marginBottom: 18 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 8 }}>Categoría</div>
                  {['todas', ...categoriasDisponibles].map(c => (
                    <div key={c} onClick={() => setFiltroCategoria(c)}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 0', cursor: 'pointer', fontSize: 11, color: filtroCategoria === c ? 'var(--color-blue-dark)' : 'var(--color-text-secondary)', fontWeight: filtroCategoria === c ? 600 : 400 }}>
                      <div style={{ width: 12, height: 12, borderRadius: '50%', border: `2px solid ${filtroCategoria === c ? 'var(--color-blue)' : 'var(--color-border-secondary)'}`, background: filtroCategoria === c ? 'var(--color-blue)' : 'transparent' }} />
                      {c === 'todas' ? 'Todas' : c.charAt(0).toUpperCase() + c.slice(1)}
                    </div>
                  ))}
                </div>

                {/* Reset */}
                {hayFiltros && (
                  <button onClick={() => { setFiltroMarcas(new Set()); setFiltroCategoria('todas'); setFiltroPrecioMin(0); setFiltroPrecioMax(2000); setFiltroOrden('relevancia') }}
                    className="btn-ghost" style={{ width: '100%', justifyContent: 'center', fontSize: 11 }}>
                    ↺ Limpiar filtros
                  </button>
                )}
              </div>

              {/* Grid dispositivos */}
              <div style={{ flex: 1, padding: '16px', overflowY: 'auto' }}>
                {dispositivosMostrados.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-text-tertiary)', fontSize: 12 }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
                    Sin dispositivos para estos filtros
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
                      {dispositivosMostrados.map(d => {
                        const seleccionado = dispositivoSel?.id === d.id
                        return (
                          <div key={d.id}
                            onClick={() => { setDispositivoSel(seleccionado ? null : d); setModalAbierto(false) }}
                            style={{ padding: '14px 12px', border: `1.5px solid ${seleccionado ? 'var(--color-blue)' : d.destacado ? 'var(--color-amber-border)' : 'var(--color-border-tertiary)'}`, borderRadius: 'var(--border-radius-lg)', cursor: d.stock ? 'pointer' : 'not-allowed', background: seleccionado ? 'var(--color-blue-light)' : d.destacado ? 'var(--color-amber-light)' : 'var(--color-background-secondary)', opacity: d.stock ? 1 : 0.5, transition: 'all 0.1s', position: 'relative' }}>
                            {d.destacado && !seleccionado && <div style={{ position: 'absolute', top: 6, right: 6, fontSize: 9, padding: '1px 5px', borderRadius: 3, background: 'var(--color-amber-mid)', color: 'var(--color-amber-dark)', fontWeight: 700 }}>DEST.</div>}
                            {!d.stock && <div style={{ position: 'absolute', top: 6, left: 6, fontSize: 9, padding: '1px 5px', borderRadius: 3, background: 'var(--color-red-light)', color: 'var(--color-red-dark)', fontWeight: 700 }}>AGOTADO</div>}
                            {d.ahorro && d.stock && <div style={{ position: 'absolute', top: 6, left: 6, fontSize: 9, padding: '1px 5px', borderRadius: 3, background: 'var(--color-green-light)', color: 'var(--color-green-dark)', fontWeight: 700 }}>-{d.ahorro}€</div>}

                            <div style={{ textAlign: 'center', fontSize: 36, marginBottom: 8, marginTop: (d.destacado || !d.stock || d.ahorro) ? 12 : 0 }}>{d.imagen}</div>
                            <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 2, color: seleccionado ? 'var(--color-blue-dark)' : 'var(--color-text-primary)' }}>{d.marca}</div>
                            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, color: seleccionado ? 'var(--color-blue-dark)' : 'var(--color-text-primary)' }}>{d.modelo}</div>

                            {d.storage && <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', marginBottom: 2 }}>{d.storage}{d.pantalla ? ` · ${d.pantalla}` : ''}</div>}

                            <div style={{ borderTop: '1px solid var(--color-border-tertiary)', paddingTop: 8, marginTop: 6 }}>
                              <div style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)', color: seleccionado ? 'var(--color-blue-dark)' : 'var(--color-blue)' }}>
                                {d.precioMensual.toFixed(2)}€<span style={{ fontSize: 9, fontWeight: 400, color: 'var(--color-text-tertiary)' }}>/mes</span>
                              </div>
                              <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)' }}>{d.precioLibre}€ libre · {d.mesesFinanciacion} meses</div>
                            </div>

                            {seleccionado && (
                              <div style={{ marginTop: 8, fontSize: 11, fontWeight: 700, color: 'var(--color-blue-dark)', textAlign: 'center' }}>✓ Seleccionado</div>
                            )}
                          </div>
                        )
                      })}
                    </div>

                    {/* Mostrar más */}
                    {hayMas && (
                      <div style={{ textAlign: 'center', marginTop: 16 }}>
                        <button onClick={() => setMostrarMas(true)} className="btn-secondary" style={{ fontSize: 12 }}>
                          Ver {Math.min(10, dispositivosFiltrados.length - 10)} dispositivos más →
                        </button>
                      </div>
                    )}
                    {mostrarMas && !hayFiltros && (
                      <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', textAlign: 'center', marginTop: 12 }}>
                        Usa los filtros para refinar tu búsqueda en el catálogo completo
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}