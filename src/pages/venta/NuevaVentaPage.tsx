import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { catalogoBundles, catalogoAddonsTV, catalogoDispositivos, buscarBundles, catalogoTerceros, crearSenalizacion, compatibilidadTV, addonsTVCore, focosComerciales, argumentarioNBA } from '../../data/mockData'
import { useAppStore } from '../../store/useAppStore'
import type { Bundle, ResultadoBusquedaBundle, Dispositivo } from '../../types'

type Paso = 1 | 2 | 3 | 4 | 5
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

const marcasDisponibles = [...new Set(catalogoDispositivos.map(d => d.marca))].sort()
const categoriasDisponibles = [...new Set(catalogoDispositivos.map(d => d.categoria))]

// Colores corporativos
const BLUE = '#0033A0'
const BLUE_LIGHT = '#EEF2FF'
const BLUE_BORDER = '#C7D2FE'

type NuevaVentaProps = {
  tipoForzado?: 'movil' | 'convergente'
  clientePreCargado?: {
    dni: string; nombre: string; apellidos: string
    email: string; telefono: string; iban?: string
    scoringOK?: boolean
  }
}

export function NuevaVentaPage({ tipoForzado, clientePreCargado }: NuevaVentaProps = {}) {
  const navigate = useNavigate()
  const { canalActual } = useAppStore()
  const [paso, setPaso] = useState<Paso>(tipoForzado ? 2 : 1)
  const [tipoAlta, setTipoAlta] = useState<TipoAlta>(tipoForzado || null)

  // Cobertura
  const [cob, setCob] = useState<DatosCobertura>({ calle: '', numero: '', cp: '', ciudad: '', tecnologia: null, velocidadMax: 0, autoinstalable: false, verificada: false })
  const [verificando, setVerificando] = useState(false)
  const [sinCob, setSinCob] = useState(false)
  const [callejeroQuery, setCallejeroQuery] = useState('')
  const [callejeroSugerencias, setCallejeroSugerencias] = useState<{ display_name: string; address: { road?: string; house_number?: string; postcode?: string; city?: string; town?: string; village?: string; municipality?: string } }[]>([])
  const [callejeroCargando, setCallejeroCargando] = useState(false)
  const [callejeroTimer, setCallejeroTimer] = useState<ReturnType<typeof setTimeout> | null>(null)
  const [callejeroAbierto, setCallejeroAbierto] = useState(false)

  // Configurador paso 2
  const [fibraSel, setFibraSel] = useState<number | null>(null)
  const [numLineas, setNumLineas] = useState(0)
  const [datosPpal, setDatosPpal] = useState<number | 'ilimitado' | null>(null)
  const [datosSec, setDatosSec] = useState<number | 'ilimitado' | null>(null)
  const [resultados, setResultados] = useState<ResultadoBusquedaBundle[]>([])
  const [buscado, setBuscado] = useState(false)
  const [bundleSel, setBundleSel] = useState<Bundle | null>(null)
  const [addonsSel, setAddonsSel] = useState<Set<string>>(new Set())
  const [dispositivoSel, setDispositivoSel] = useState<Dispositivo | null>(null)
  const [modalAbierto, setModalAbierto] = useState(false)

  // FTTR (movido a paso 2)
  const [fttr, setFttr] = useState<'no' | 'con-instalacion'>('no')

  // Portabilidad
  const [portaLineas, setPortaLineas] = useState<'ninguna' | 'primera' | 'segunda' | 'ambas'>('ninguna')
  const [numeroPorta1, setNumeroPorta1] = useState('')
  const [operadorPorta1, setOperadorPorta1] = useState('')
  const [numeroPorta2, setNumeroPorta2] = useState('')
  const [operadorPorta2, setOperadorPorta2] = useState('')

  // Señalización terceros
  const [senalizaciones, setSenalizaciones] = useState<string[]>([])
  const [mostrarTerceros, setMostrarTerceros] = useState(false)

  // Filtros escaparate
  const [filtroPrecioMin, setFiltroPrecioMin] = useState(0)
  const [filtroPrecioMax, setFiltroPrecioMax] = useState(2000)
  const [filtroMarcas, setFiltroMarcas] = useState<Set<string>>(new Set())
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todas')
  const [filtroOrden, setFiltroOrden] = useState<'relevancia' | 'precio_asc' | 'precio_desc'>('relevancia')
  const [mostrarMas, setMostrarMas] = useState(false)
  const hayFiltros = filtroMarcas.size > 0 || filtroCategoria !== 'todas' || filtroPrecioMin > 0 || filtroPrecioMax < 2000

  // Datos cliente paso 3
  const [datos, setDatos] = useState<DatosCliente>({
    dni: clientePreCargado?.dni || '',
    nombre: clientePreCargado?.nombre || '',
    apellidos: clientePreCargado?.apellidos || '',
    email: clientePreCargado?.email || '',
    telefono: clientePreCargado?.telefono || '',
    iban: clientePreCargado?.iban || '',
    nacionalidad: 'Española',
    idioma: 'Castellano'
  })
  const [scoring, setScoring] = useState<boolean | null>(clientePreCargado?.scoringOK ? true : null)
  const [scoringCargando, setScoringCargando] = useState(false)

  // Provisión paso 4
  const [prov, setProv] = useState<DatosProvision>({ citaFecha: '', citaFranja: '', sim: 'fisica', entrega: 'domicilio' })

  // Firma paso 5
  const [firmando, setFirmando] = useState(false)
  const [firmado, setFirmado] = useState(false)

  // UI extras
  const [mostrarCalculadora, setMostrarCalculadora] = useState(false)
  const [modoAutonomo, setModoAutonomo] = useState(false)

  // Precios
  const precioBundle = bundleSel?.precio || 0
  const precioAddons = catalogoAddonsTV.filter(a => addonsSel.has(a.id)).reduce((s, a) => s + a.precio, 0)
  const precioFttr = fttr === 'con-instalacion' ? 12 : 0
  const precioSeguro = senalizaciones.includes('seguro-movil') ? 5.99 : 0
  const precioTotal = precioBundle + precioAddons + precioFttr + precioSeguro
  const precioConIVA = precioTotal * 1.21
  const cuotaDisp = dispositivoSel?.precioMensual || 0

  const tieneLinea = bundleSel && bundleSel.categoria !== 'fibra_sola'
  const esSoloMovil = tipoAlta === 'movil'

  const toggleAddon = (id: string) => {
    const s = new Set(addonsSel); s.has(id) ? s.delete(id) : s.add(id); setAddonsSel(s)
  }
  const toggleMarca = (m: string) => {
    const s = new Set(filtroMarcas); s.has(m) ? s.delete(m) : s.add(m); setFiltroMarcas(s)
  }

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

  const buscar = () => {
    const fibra = esSoloMovil ? null : fibraSel
    const res = buscarBundles(fibra, numLineas, datosPpal, datosSec)
    setResultados(res); setBuscado(true); setBundleSel(null)
  }

  const ejecutarScoring = () => {
    if (!validarDNI(datos.dni)) return
    setScoringCargando(true); setScoring(null)
    setTimeout(() => { setScoring(!datos.dni.startsWith('0')); setScoringCargando(false) }, 1800)
  }

  const paso1OK = tipoAlta !== null
  const paso2OK = !!bundleSel
  const paso3OK = validarDNI(datos.dni) && datos.nombre.trim().length > 1 && datos.apellidos.trim().length > 1 && validarEmail(datos.email) && validarTel(datos.telefono) && validarIBAN(datos.iban) && scoring === true
  const paso4OK = esSoloMovil || cob.autoinstalable || (prov.citaFecha !== '' && prov.citaFranja !== '')

  const avanzar = () => {
    if (paso === 1) {
      if (esSoloMovil) { setNumLineas(1); setPaso(2) }
      else setPaso(2)
    } else if (paso < 5) setPaso((paso + 1) as Paso)
  }
  const retroceder = () => {
    if (paso === 2 && tipoForzado) return // no puede volver al paso 1 si el tipo está forzado
    if (paso > 1) setPaso((paso - 1) as Paso)
  }

  const pasosMostrados = [
    { num: 1, label: 'Tipo de alta' },
    { num: 2, label: 'Producto' },
    { num: 3, label: 'Tus datos' },
    { num: 4, label: 'Instalación' },
    { num: 5, label: 'Firma' },
  ]

  const matchColor = (tipo: string) => ({
    exacto: { bg: '#F0FDF4', border: '#86EFAC', color: '#166534', label: '✓ Match exacto' },
    aproximado: { bg: BLUE_LIGHT, border: BLUE_BORDER, color: BLUE, label: '≈ Aproximado' },
    parcial: { bg: '#FFFBEB', border: '#FCD34D', color: '#92400E', label: '~ Parcial' },
  }[tipo] || { bg: '', border: '', color: '', label: '' })

  // Panel resumen lateral
  const ResumenLateral = ({ mostrarFirma = false }: { mostrarFirma?: boolean }) => (
    <div style={{ position: 'sticky', top: 12 }}>
      <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 12, padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, color: '#111827' }}>Resumen del pedido</div>

        {!bundleSel ? (
          <div style={{ fontSize: 13, color: '#9CA3AF', textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>📦</div>
            Selecciona un bundle
          </div>
        ) : (
          <>
            <div style={{ borderBottom: '1px solid #E5E7EB', paddingBottom: 14, marginBottom: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontSize: 13, color: '#374151', flex: 1, marginRight: 8 }}>{bundleSel.nombre}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#111827', flexShrink: 0 }}>{bundleSel.precio.toFixed(0)}€/mes</span>
              </div>
              {catalogoAddonsTV.filter(a => addonsSel.has(a.id)).map(a => (
                <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, color: '#6B7280' }}>{a.nombre}</span>
                  <span style={{ fontSize: 13 }}>{a.precio}€/mes</span>
                </div>
              ))}
              {fttr === 'con-instalacion' && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, color: '#6B7280' }}>FTTR — Fiber to the Room</span>
                  <span style={{ fontSize: 13 }}>+12€/mes</span>
                </div>
              )}
              {dispositivoSel && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, color: '#6B7280' }}>{dispositivoSel.marca} {dispositivoSel.modelo}</span>
                  <span style={{ fontSize: 13 }}>+{cuotaDisp.toFixed(2)}€/mes</span>
                </div>
              )}
              {senalizaciones.includes('seguro-movil') && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#374151', padding: '3px 0' }}>
                  <span>Seguro Móvil Plus</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>+5.99 €/mes</span>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
              <span style={{ fontSize: 14, fontWeight: 700 }}>Cuota mensual:</span>
              <span style={{ fontSize: 22, fontWeight: 700, color: '#111827' }}>{(precioConIVA + cuotaDisp * 1.21).toFixed(0)}€/mes</span>
            </div>
            <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: mostrarFirma ? 16 : 0 }}>Todos los precios con IVA incluido</div>

            {mostrarFirma && (
              <>
                <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: 14 }}>
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', marginBottom: 14 }}>
                    <input type="checkbox" style={{ marginTop: 2, accentColor: BLUE }} checked={firmando} onChange={e => setFirmando(e.target.checked)} />
                    <span style={{ fontSize: 12, color: '#374151', lineHeight: 1.5 }}>
                      He leído y <span style={{ color: BLUE, textDecoration: 'underline', cursor: 'pointer' }}>acepto las condiciones generales, particulares y de desistimiento</span>
                    </span>
                  </label>
                  <button
                    onClick={() => {
                      if (firmando) setTimeout(() => {
                        // RF01-4: crear señalizaciones reales al firmar
                        senalizaciones.forEach(id => {
                          const prod = catalogoTerceros.find(p => p.id === id)
                          if (prod) crearSenalizacion({
                            clienteId: 'NUEVO',
                            productoId: id,
                            nombreProducto: prod.nombre,
                            fecha: new Date().toLocaleDateString('es-ES'),
                            estado: 'pendiente',
                            notas: `Señalización generada en alta nuevo cliente — ${datos.nombre} ${datos.apellidos}`,
                            agente: 'AGT-actual',
                          })
                        })
                        setFirmado(true)
                      }, 1500)
                    }}
                    disabled={!firmando}
                    style={{ width: '100%', padding: '14px', background: firmando ? BLUE : '#9CA3AF', color: 'white', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: firmando ? 'pointer' : 'not-allowed', transition: 'background 0.2s' }}>
                    🔐 Confirmar pedido con OTP
                  </button>
                  <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 10, lineHeight: 1.5 }}>
                    Te llamaremos en los próximos días para concertar una cita para la instalación o solicitarte información adicional.
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB' }}>

      {/* HEADER FIJO */}
      <div style={{ position: 'sticky', top: 0, zIndex: 50, background: 'white', borderBottom: '1px solid #E5E7EB', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#6B7280', display: 'flex', alignItems: 'center', gap: 4 }}>
            ← Salir
          </button>
          <div style={{ width: 1, height: 18, background: '#E5E7EB' }} />
          <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>
            {tipoForzado === 'convergente' ? 'Alta de servicio — BAF / BAF Convergente' : tipoForzado === 'movil' ? 'Alta línea Móvil' : 'Alta de nuevo cliente'}
          </span>
        </div>

        {/* Stepper */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {pasosMostrados.map((p, i) => {
            const activo = p.num === paso
            const completado = paso > p.num
            return (
              <div key={p.num} style={{ display: 'flex', alignItems: 'center' }}>
                {i > 0 && <div style={{ width: 28, height: 2, background: completado ? BLUE : '#E5E7EB' }} />}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 20, background: activo ? BLUE_LIGHT : 'transparent' }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, background: completado ? BLUE : activo ? BLUE : '#F3F4F6', color: (completado || activo) ? 'white' : '#9CA3AF', border: (!completado && !activo) ? '1.5px solid #D1D5DB' : 'none', flexShrink: 0 }}>
                    {completado ? '✓' : p.num}
                  </div>
                  <span style={{ fontSize: 11, fontWeight: activo ? 600 : 400, color: activo ? BLUE : completado ? BLUE : '#9CA3AF', whiteSpace: 'nowrap' }}>{p.label}</span>
                </div>
              </div>
            )
          })}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {bundleSel && (
            <div style={{ fontSize: 12, padding: '6px 14px', background: BLUE_LIGHT, border: `1px solid ${BLUE_BORDER}`, borderRadius: 20, color: BLUE, fontWeight: 600 }}>
              {bundleSel.nombre} · {(precioConIVA).toFixed(0)}€/mes
            </div>
          )}
          <button onClick={() => setMostrarCalculadora(v => !v)}
            style={{ padding: '6px 14px', fontSize: 12, fontWeight: 600, background: mostrarCalculadora ? '#111827' : 'white', color: mostrarCalculadora ? 'white' : '#374151', border: '1px solid #D1D5DB', borderRadius: 20, cursor: 'pointer', transition: 'all 0.15s' }}>
            📊 Calculadora
          </button>
        </div>
      </div>

      {/* Calculadora desplegable */}
      {mostrarCalculadora && (
        <div style={{ position: 'sticky', top: 57, zIndex: 40, background: '#1E293B', borderBottom: '1px solid #334155', padding: '12px 24px' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 32, flexWrap: 'wrap' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1 }}>Calculadora de precio</div>
            <div style={{ display: 'flex', gap: 24, flex: 1, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 10, color: '#64748B', textTransform: 'uppercase' }}>Bundle</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: 'white' }}>{bundleSel ? `${bundleSel.precio.toFixed(2)}€` : '—'}</span>
              </div>
              {catalogoAddonsTV.filter(a => addonsSel.has(a.id)).map(a => (
                <div key={a.id} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontSize: 10, color: '#64748B', textTransform: 'uppercase' }}>{a.nombre}</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'white' }}>+{a.precio.toFixed(2)}€</span>
                </div>
              ))}
              {fttr === 'con-instalacion' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontSize: 10, color: '#64748B', textTransform: 'uppercase' }}>FTTR</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'white' }}>+12.00€</span>
                </div>
              )}
              {dispositivoSel && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontSize: 10, color: '#64748B', textTransform: 'uppercase' }}>{dispositivoSel.marca} {dispositivoSel.modelo}</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'white' }}>+{cuotaDisp.toFixed(2)}€</span>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 24, alignItems: 'baseline' }}>
              <div>
                <div style={{ fontSize: 10, color: '#64748B', textTransform: 'uppercase' }}>Sin IVA</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#94A3B8' }}>{(precioTotal + cuotaDisp).toFixed(2)}€/mes</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: '#64748B', textTransform: 'uppercase' }}>Con IVA (21%)</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#F8FAFC' }}>{(precioConIVA + cuotaDisp * 1.21).toFixed(0)}€/mes</div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>

        {/* ══════════ PASO 1 — TIPO DE ALTA ══════════ */}
        {paso === 1 && (
          <div style={{ maxWidth: 680, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#111827', marginBottom: 8 }}>¿Qué quiere contratar el cliente?</div>
              <div style={{ fontSize: 14, color: '#6B7280' }}>Selecciona el tipo de alta para comenzar</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {[
                {
                  val: 'movil' as TipoAlta,
                  icono: '📱',
                  titulo: 'Alta línea Móvil',
                  desc: 'Alta de una o varias líneas móviles sin fibra. No requiere verificación de cobertura.',
                  color: '#7C3AED',
                  bg: '#F5F3FF',
                  border: '#DDD6FE',
                  borderActive: '#7C3AED',
                },
                {
                  val: 'convergente' as TipoAlta,
                  icono: '🏠',
                  titulo: 'BAF / BAF Convergente',
                  desc: 'Fibra + líneas móviles. Se verifica cobertura en la dirección de instalación.',
                  color: BLUE,
                  bg: BLUE_LIGHT,
                  border: BLUE_BORDER,
                  borderActive: BLUE,
                },
              ].map(op => (
                <div key={op.val!} onClick={() => setTipoAlta(op.val)}
                  style={{ padding: '28px 24px', border: `2px solid ${tipoAlta === op.val ? op.borderActive : '#E5E7EB'}`, borderRadius: 12, cursor: 'pointer', background: tipoAlta === op.val ? op.bg : 'white', transition: 'all 0.15s', boxShadow: tipoAlta === op.val ? `0 0 0 4px ${op.bg}` : '0 1px 4px rgba(0,0,0,0.06)' }}
                  onMouseEnter={e => { if (tipoAlta !== op.val) e.currentTarget.style.borderColor = op.border }}
                  onMouseLeave={e => { if (tipoAlta !== op.val) e.currentTarget.style.borderColor = '#E5E7EB' }}>
                  <div style={{ fontSize: 40, marginBottom: 14 }}>{op.icono}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: tipoAlta === op.val ? op.color : '#111827', marginBottom: 8 }}>{op.titulo}</div>
                  <div style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.6 }}>{op.desc}</div>
                  {tipoAlta === op.val && (
                    <div style={{ marginTop: 12, fontSize: 12, fontWeight: 600, color: op.color, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span>✓</span> Seleccionado
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={avanzar} disabled={!paso1OK}
                style={{ padding: '12px 32px', background: paso1OK ? BLUE : '#9CA3AF', color: 'white', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: paso1OK ? 'pointer' : 'not-allowed' }}>
                Continuar →
              </button>
            </div>
          </div>
        )}

        {/* ══════════ PASO 2 — PRODUCTO ══════════ */}
        {paso === 2 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Cobertura — solo convergente */}
              {!esSoloMovil && (
                <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 12, padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 4 }}>Verificación de cobertura</div>
                  <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 16 }}>Introduce la dirección de instalación para verificar la cobertura disponible.</div>

                  {!cob.verificada ? (
                    <>
                      {/* Autocomplete Nominatim */}
                      <div style={{ position: 'relative', marginBottom: 10 }}>
                        <input
                          className="input"
                          placeholder="Buscar dirección (calle, número, ciudad)..."
                          value={callejeroQuery}
                          style={{ height: 44, width: '100%', boxSizing: 'border-box', paddingRight: callejeroCargando ? 36 : undefined }}
                          onChange={e => {
                            const q = e.target.value
                            setCallejeroQuery(q)
                            setCob(p => ({ ...p, calle: '', numero: '', cp: '', ciudad: '', verificada: false }))
                            if (callejeroTimer) clearTimeout(callejeroTimer)
                            if (q.length < 5) { setCallejeroSugerencias([]); setCallejeroAbierto(false); return }
                            const t = setTimeout(async () => {
                              setCallejeroCargando(true)
                              try {
                                const res = await fetch(
                                  `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&countrycodes=es&limit=6&q=${encodeURIComponent(q)}`,
                                  { headers: { 'Accept-Language': 'es' } }
                                )
                                const data = await res.json()
                                setCallejeroSugerencias(data)
                                setCallejeroAbierto(data.length > 0)
                              } catch { /* red sin acceso — ignorar */ }
                              finally { setCallejeroCargando(false) }
                            }, 400)
                            setCallejeroTimer(t)
                          }}
                          onBlur={() => setTimeout(() => setCallejeroAbierto(false), 150)}
                          onFocus={() => { if (callejeroSugerencias.length > 0) setCallejeroAbierto(true) }}
                        />
                        {callejeroCargando && (
                          <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 16, pointerEvents: 'none' }}>⏳</span>
                        )}
                        {callejeroAbierto && callejeroSugerencias.length > 0 && (
                          <ul style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, background: 'white', border: '1px solid #D1D5DB', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.12)', margin: 0, padding: 0, listStyle: 'none', maxHeight: 260, overflowY: 'auto' }}>
                            {callejeroSugerencias.map((s, i) => (
                              <li
                                key={i}
                                onMouseDown={() => {
                                  const a = s.address
                                  const calle = a.road || ''
                                  const numero = a.house_number || ''
                                  const cp = a.postcode || ''
                                  const ciudad = a.city || a.town || a.village || a.municipality || ''
                                  setCob(p => ({ ...p, calle, numero, cp, ciudad, verificada: false }))
                                  setCallejeroQuery([calle, numero, cp, ciudad].filter(Boolean).join(', '))
                                  setCallejeroAbierto(false)
                                }}
                                style={{ padding: '10px 14px', fontSize: 13, color: '#374151', cursor: 'pointer', borderBottom: '1px solid #F3F4F6' }}
                                onMouseEnter={e => (e.currentTarget.style.background = '#F0F9FF')}
                                onMouseLeave={e => (e.currentTarget.style.background = 'white')}
                              >
                                {s.display_name}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                      {/* Campos manuales (se autocompletan al elegir sugerencia, editables) */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: 10, marginBottom: 10 }}>
                        <input className="input" placeholder="Calle / avenida / plaza..." value={cob.calle} onChange={e => setCob(p => ({ ...p, calle: e.target.value, verificada: false }))} style={{ height: 44 }} />
                        <input className="input" placeholder="Nº" value={cob.numero} onChange={e => setCob(p => ({ ...p, numero: e.target.value, verificada: false }))} style={{ height: 44 }} />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 10, marginBottom: 16 }}>
                        <input className="input" placeholder="Código postal" value={cob.cp} onChange={e => setCob(p => ({ ...p, cp: e.target.value, verificada: false }))} style={{ height: 44 }} />
                        <input className="input" placeholder="Ciudad" value={cob.ciudad} onChange={e => setCob(p => ({ ...p, ciudad: e.target.value, verificada: false }))} style={{ height: 44 }} />
                      </div>
                      <button onClick={verificarCobertura} disabled={verificando || !cob.calle || !cob.numero || !cob.cp || !cob.ciudad}
                        style={{ padding: '10px 24px', background: BLUE, color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: (!cob.calle || !cob.numero || !cob.cp || !cob.ciudad || verificando) ? 0.6 : 1 }}>
                        {verificando ? '⏳ Verificando cobertura...' : '📡 Verificar cobertura'}
                      </button>
                      {sinCob && (
                        <div style={{ marginTop: 12, padding: '12px 16px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, fontSize: 13, color: '#991B1B' }}>
                          ✕ Sin cobertura en esta dirección. Puedes registrar un prepedido.
                        </div>
                      )}
                      <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 10 }}>
                        Simulación: CPs 28x, 08x, 41x, 46x, 48x → Fibra · Resto → Fibra 600Mb · CP 00000 → Sin cobertura
                      </div>
                    </>
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 8 }}>
                      <span style={{ fontSize: 13, color: '#166534' }}>
                        ✓ <strong>{cob.calle} {cob.numero}, {cob.cp} {cob.ciudad}</strong> · Fibra hasta {cob.velocidadMax === 1000 ? '1 Gb' : `${cob.velocidadMax} Mb`}
                      </span>
                      <button onClick={() => setCob(p => ({ ...p, verificada: false }))} style={{ fontSize: 12, color: BLUE, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                        Modificar
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* RF20260327-11: Focos comerciales por canal */}
              {(() => {
                const focos = focosComerciales.filter(f => f.activo && f.canal.includes(canalActual as string))
                if (focos.length === 0) return null
                return (
                  <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                      🎯 Focos comerciales activos
                      <span style={{ fontSize: 10, padding: '2px 8px', background: '#F3F4F6', borderRadius: 9999, color: '#6B7280' }}>{canalActual}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      {focos.map(foco => (
                        <div key={foco.id} style={{ flex: '1 1 200px', padding: '12px 14px', border: `1.5px solid ${foco.color}20`, borderRadius: 10, background: `${foco.color}08` }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                            <span style={{ fontSize: 20 }}>{foco.icono}</span>
                            <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 9999, background: foco.color, color: 'white', fontWeight: 700 }}>{foco.badge}</span>
                          </div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: foco.color, marginBottom: 4 }}>{foco.titulo}</div>
                          <div style={{ fontSize: 11, color: '#6B7280', lineHeight: 1.5 }}>{foco.descripcion}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })()}

              {/* Configurador tarifa */}
              {(esSoloMovil || cob.verificada) && (
                <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 12, padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 20 }}>Configura la tarifa</div>

                  {/* Fibra */}
                  {!esSoloMovil && (
                    <div style={{ marginBottom: 20 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 10 }}>🌐 Velocidad de fibra</div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {[300, 600, 1000].filter(f => f <= (cob.velocidadMax || 1000)).map(f => (
                          <button key={f} onClick={() => setFibraSel(f)}
                            style={{ padding: '8px 20px', fontSize: 13, fontWeight: 600, border: `2px solid ${fibraSel === f ? BLUE : '#E5E7EB'}`, borderRadius: 8, cursor: 'pointer', background: 'white', color: fibraSel === f ? BLUE : '#374151', transition: 'all 0.1s' }}>
                            {f === 1000 ? '1 Gb' : `${f} Mb`}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* RF20260327-12: Segmentación autónomos */}
                  <div style={{ marginBottom: 20, padding: '12px 16px', background: modoAutonomo ? '#EFF6FF' : '#F9FAFB', border: `1.5px solid ${modoAutonomo ? '#BFDBFE' : '#E5E7EB'}`, borderRadius: 10, transition: 'all 0.15s' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                      <input type="checkbox" checked={modoAutonomo} onChange={e => setModoAutonomo(e.target.checked)}
                        style={{ width: 16, height: 16, accentColor: BLUE, cursor: 'pointer' }} />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: modoAutonomo ? BLUE : '#374151' }}>
                          🧾 Cliente autónomo / profesional
                        </div>
                        <div style={{ fontSize: 11, color: '#6B7280', marginTop: 1 }}>
                          Activa opciones de facturación y líneas profesionales para autónomos y empresas unipersonales
                        </div>
                      </div>
                    </label>
                    {modoAutonomo && (
                      <div style={{ marginTop: 10, padding: '8px 12px', background: '#DBEAFE', borderRadius: 8, fontSize: 12, color: '#1E40AF', lineHeight: 1.6 }}>
                        ℹ️ Modo autónomo activo — se habilitará factura con NIF profesional y descuento IVA deducible.
                        Las líneas móviles incluirán opción de detalle de llamadas para contabilidad.
                      </div>
                    )}
                  </div>

                  {/* Líneas */}
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 10 }}>📱 Líneas móviles</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {(esSoloMovil ? [1, 2, 3] : [0, 1, 2, 3]).map(n => (
                        <button key={n} onClick={() => { setNumLineas(n); if (n === 0) { setDatosPpal(null); setDatosSec(null) } }}
                          style={{ padding: '8px 20px', fontSize: 13, fontWeight: 600, border: `2px solid ${numLineas === n ? BLUE : '#E5E7EB'}`, borderRadius: 8, cursor: 'pointer', background: 'white', color: numLineas === n ? BLUE : '#374151' }}>
                          {n === 0 ? 'Sin línea' : `${n} línea${n > 1 ? 's' : ''}`}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Datos línea principal */}
                  {numLineas >= 1 && (
                    <div style={{ marginBottom: 20 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 10 }}>📶 Datos línea {numLineas > 1 ? 'principal' : ''}</div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {([20, 30, 'ilimitado'] as (number | 'ilimitado')[]).map(d => (
                          <button key={String(d)} onClick={() => setDatosPpal(d)}
                            style={{ padding: '8px 20px', fontSize: 13, fontWeight: 600, border: `2px solid ${datosPpal === d ? BLUE : '#E5E7EB'}`, borderRadius: 8, cursor: 'pointer', background: 'white', color: datosPpal === d ? BLUE : '#374151' }}>
                            {d === 'ilimitado' ? 'Ilimitado' : `${d} GB`}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Datos 2ª línea */}
                  {numLineas >= 2 && (
                    <div style={{ marginBottom: 20 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 10 }}>📶 Datos 2ª línea</div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {([20, 30, 'ilimitado'] as (number | 'ilimitado')[]).map(d => (
                          <button key={String(d)} onClick={() => setDatosSec(d)}
                            style={{ padding: '8px 20px', fontSize: 13, fontWeight: 600, border: `2px solid ${datosSec === d ? BLUE : '#E5E7EB'}`, borderRadius: 8, cursor: 'pointer', background: 'white', color: datosSec === d ? BLUE : '#374151' }}>
                            {d === 'ilimitado' ? 'Ilimitado' : `${d} GB`}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <button onClick={buscar}
                    style={{ padding: '12px 28px', background: BLUE, color: 'white', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                    🔍 Buscar bundles compatibles
                  </button>
                </div>
              )}

              {/* Resultados bundles con NBA */}
              {buscado && (
                <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 12, padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>
                      Bundles compatibles
                      {resultados.length > 0 && <span style={{ fontSize: 12, fontWeight: 400, color: '#9CA3AF', marginLeft: 8 }}>{resultados.length} resultados</span>}
                    </div>
                  </div>

                  {/* RF20260327-3: Doble resultado NBA */}
                  {resultados.length > 0 && (() => {
                    const exacto = resultados.find(r => r.matchTipo === 'exacto') || resultados[0]
                    const nba = resultados.find(r => r.bundle.id !== exacto.bundle.id && r.matchTipo !== 'parcial') || (resultados.length > 1 ? resultados[1] : null)
                    const argExacto = argumentarioNBA[exacto.bundle.id]
                    const argNba = nba ? argumentarioNBA[nba.bundle.id] : null
                    return (
                      <div style={{ marginBottom: 16, display: 'flex', flexDirection: 'column' }}>
                        {/* Propuesta 1 — Lo solicitado */}
                        <div style={{ padding: '14px 16px', background: BLUE_LIGHT, border: `1.5px solid ${BLUE_BORDER}`, borderRadius: '10px 10px 0 0', borderBottom: 'none' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                            <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: BLUE, color: 'white', fontWeight: 700 }}>📋 Propuesta 1</span>
                            <span style={{ fontSize: 12, color: '#374151', fontWeight: 600 }}>Lo solicitado</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: 14, fontWeight: 700, color: BLUE }}>{exacto.bundle.nombre}</div>
                              <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
                                {exacto.diferencias.length === 0 ? 'Match perfecto con lo solicitado' : `Ajuste: ${exacto.diferencias[0]}`}
                              </div>
                              {argExacto && (
                                <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 3 }}>
                                  {argExacto.beneficios.map((b, i) => (
                                    <div key={i} style={{ fontSize: 11, color: '#374151' }}>✓ {b}</div>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 16 }}>
                              <div style={{ fontSize: 20, fontWeight: 700, color: BLUE }}>{(exacto.bundle.precio * 1.21).toFixed(0)}€/mes</div>
                              <button onClick={() => setBundleSel(exacto.bundle)}
                                style={{ marginTop: 6, padding: '6px 16px', background: BLUE, color: 'white', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                                Seleccionar
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Propuesta 2 — NBA recomendada */}
                        {nba && (
                          <div style={{ padding: '14px 16px', background: '#FFF7ED', border: '1.5px solid #FED7AA', borderRadius: '0 0 10px 10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                              <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: '#EA580C', color: 'white', fontWeight: 700 }}>⭐ Propuesta 2</span>
                              <span style={{ fontSize: 12, color: '#7C2D12', fontWeight: 600 }}>NBA recomendada</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 14, fontWeight: 700, color: '#EA580C' }}>{nba.bundle.nombre}</div>
                                {argNba && (
                                  <>
                                    <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 3 }}>
                                      {argNba.beneficios.map((b, i) => (
                                        <div key={i} style={{ fontSize: 11, color: '#374151' }}>✓ {b}</div>
                                      ))}
                                    </div>
                                    <div style={{ marginTop: 8, fontSize: 11, color: '#92400E', fontStyle: 'italic', lineHeight: 1.5 }}>
                                      💬 "{argNba.comparativa}"
                                    </div>
                                    {argNba.ahorroPrecio && (
                                      <div style={{ marginTop: 6, fontSize: 12, fontWeight: 700, color: '#166534' }}>
                                        💰 Ahorro potencial: {argNba.ahorroPrecio}€/mes
                                      </div>
                                    )}
                                  </>
                                )}
                              </div>
                              <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 16 }}>
                                <div style={{ fontSize: 20, fontWeight: 700, color: '#EA580C' }}>{(nba.bundle.precio * 1.21).toFixed(0)}€/mes</div>
                                <button onClick={() => setBundleSel(nba.bundle)}
                                  style={{ marginTop: 6, padding: '6px 16px', background: '#EA580C', color: 'white', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                                  Seleccionar
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })()}

                  {resultados.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '24px', color: '#9CA3AF', fontSize: 13 }}>
                      <div style={{ fontSize: 28, marginBottom: 8 }}>🔍</div>
                      Sin bundles para esta combinación. Ajusta los filtros.
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
                      {resultados.map((r, idx) => {
                        const mc = matchColor(r.matchTipo)
                        const sel = bundleSel?.id === r.bundle.id
                        const letra = String.fromCharCode(65 + idx)
                        return (
                          <div key={r.bundle.id} onClick={() => setBundleSel(sel ? null : r.bundle)}
                            style={{ padding: '16px', border: `2px solid ${sel ? BLUE : '#E5E7EB'}`, borderRadius: 10, cursor: 'pointer', background: sel ? BLUE_LIGHT : 'white', transition: 'all 0.1s', boxShadow: sel ? `0 0 0 3px ${BLUE_LIGHT}` : 'none' }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: BLUE, marginBottom: 8 }}>OPCIÓN {letra}</div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginBottom: 4 }}>{r.bundle.nombre}</div>
                            <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 10 }}>{r.bundle.descripcion}</div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
                              <span style={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>{(r.bundle.precio * 1.21).toFixed(0)}€</span>
                              <span style={{ fontSize: 12, color: '#9CA3AF' }}>/mes</span>
                            </div>
                            <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: mc.bg, border: `1px solid ${mc.border}`, color: mc.color, fontWeight: 600 }}>{mc.label}</span>
                            {r.diferencias.length > 0 && (
                              <div style={{ marginTop: 8 }}>
                                {r.diferencias.map((d, i) => <div key={i} style={{ fontSize: 11, color: '#92400E' }}>· {d}</div>)}
                              </div>
                            )}
                            {sel && (
                              <div style={{ marginTop: 8, fontSize: 12, fontWeight: 700, color: BLUE }}>✓ Seleccionado</div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Add-ons TV — RF01-2 filtrado por porfolio + RF01-3 Ver más */}
              {bundleSel && bundleSel.categoria !== 'fibra_sola' && (() => {
                // Nuevo cliente → siempre mi_movistar (catálogo completo)
                const porfolio: 'fusion' | 'mi_movistar' = 'mi_movistar'
                const compatibles = compatibilidadTV[porfolio] || []
                const addonsFiltrados = catalogoAddonsTV.filter(a => compatibles.includes(a.id))
                const addonsCore = addonsFiltrados.filter(a => addonsTVCore.includes(a.id))
                const addonsExtra = addonsFiltrados.filter(a => !addonsTVCore.includes(a.id))
                return (
                  <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 12, padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 4 }}>📺 Televisión (opcional)</div>
                    <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 16 }}>Añade los canales que quiera el cliente</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {addonsCore.map(a => {
                        const sel = addonsSel.has(a.id)
                        // RF01-5: descuento bundle si TV Total + convergente
                        const descuento = a.id === 'tv-total' && bundleSel.categoria.startsWith('convergente') ? 3 : 0
                        const precioEfectivo = a.precio - descuento
                        return (
                          <div key={a.id} onClick={() => toggleAddon(a.id)}
                            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', border: `1.5px solid ${sel ? BLUE : '#E5E7EB'}`, borderRadius: 8, cursor: 'pointer', background: sel ? BLUE_LIGHT : 'white', transition: 'all 0.1s' }}>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: sel ? 600 : 400, color: sel ? BLUE : '#111827' }}>
                                {a.nombre}
                                {a.id === 'tv-total' && <span style={{ fontSize: 9, background: '#F0FDF4', color: '#166534', border: '1px solid #86EFAC', borderRadius: 9999, padding: '1px 6px', marginLeft: 6, fontWeight: 700 }}>COMPLETO</span>}
                              </div>
                              <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>{a.canales.slice(0, 3).join(' · ')}</div>
                              {descuento > 0 && sel && (
                                <div style={{ fontSize: 10, color: '#166534', fontWeight: 700, marginTop: 3 }}>✓ Descuento bundle −{descuento}€ aplicado</div>
                              )}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              {descuento > 0 ? (
                                <div style={{ textAlign: 'right' }}>
                                  <span style={{ fontSize: 11, textDecoration: 'line-through', color: '#9CA3AF', marginRight: 4 }}>{a.precio}€</span>
                                  <span style={{ fontSize: 14, fontWeight: 700, color: '#166534' }}>+{precioEfectivo}€/mes</span>
                                </div>
                              ) : (
                                <span style={{ fontSize: 14, fontWeight: 700, color: sel ? BLUE : '#374151' }}>+{a.precio}€/mes</span>
                              )}
                              <div style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${sel ? BLUE : '#D1D5DB'}`, background: sel ? BLUE : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                {sel && <span style={{ fontSize: 10, color: 'white', fontWeight: 700 }}>✓</span>}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* RF01-3: Ver más */}
                    {addonsExtra.length > 0 && (
                      <>
                        <button onClick={() => setMostrarMas(!mostrarMas)}
                          style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10, background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: BLUE, fontWeight: 600, padding: '4px 0' }}>
                          {mostrarMas ? '▲ Ver menos' : `▼ Ver más opciones (${addonsExtra.length})`}
                        </button>
                        {mostrarMas && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }} className="fade-in">
                            {addonsExtra.map(a => {
                              const sel = addonsSel.has(a.id)
                              return (
                                <div key={a.id} onClick={() => toggleAddon(a.id)}
                                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', border: `1.5px solid ${sel ? BLUE : '#E5E7EB'}`, borderRadius: 8, cursor: 'pointer', background: sel ? BLUE_LIGHT : '#F9FAFB', transition: 'all 0.1s' }}>
                                  <div>
                                    <div style={{ fontSize: 13, fontWeight: sel ? 600 : 400, color: sel ? BLUE : '#111827' }}>{a.nombre}</div>
                                    <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>{a.canales.join(' · ')}</div>
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <span style={{ fontSize: 14, fontWeight: 700, color: sel ? BLUE : '#374151' }}>+{a.precio}€/mes</span>
                                    <div style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${sel ? BLUE : '#D1D5DB'}`, background: sel ? BLUE : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                      {sel && <span style={{ fontSize: 10, color: 'white', fontWeight: 700 }}>✓</span>}
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )
              })()}

              {/* Portabilidad */}
              {bundleSel && numLineas >= 1 && (
                <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 12, padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 4 }}>↔ Portabilidad</div>
                  <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 16 }}>¿El cliente quiere portar algún número de otro operador?</div>

                  <div style={{ display: 'flex', gap: 8, marginBottom: portaLineas !== 'ninguna' ? 16 : 0, flexWrap: 'wrap' }}>
                    {[
                      { val: 'ninguna', label: 'Sin portabilidad' },
                      { val: 'primera', label: numLineas === 1 ? 'Portar la línea' : 'Portar 1ª línea' },
                      ...(numLineas >= 2 ? [
                        { val: 'segunda', label: 'Portar 2ª línea' },
                        { val: 'ambas', label: 'Portar ambas' },
                      ] : []),
                    ].map(op => (
                      <button key={op.val} onClick={() => setPortaLineas(op.val as any)}
                        style={{ padding: '8px 18px', fontSize: 13, fontWeight: 600, border: `2px solid ${portaLineas === op.val ? BLUE : '#E5E7EB'}`, borderRadius: 8, cursor: 'pointer', background: 'white', color: portaLineas === op.val ? BLUE : '#374151', transition: 'all 0.1s' }}>
                        {op.label}
                      </button>
                    ))}
                  </div>

                  {/* Campos porta línea 1 */}
                  {(portaLineas === 'primera' || portaLineas === 'ambas') && (
                    <div className="fade-in" style={{ marginBottom: 14, padding: '14px', background: '#F9FAFB', borderRadius: 8, border: '1px solid #E5E7EB' }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 10 }}>
                        {numLineas === 1 ? 'Datos de portabilidad' : 'Portabilidad — 1ª línea'}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <div>
                          <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 4 }}>Número a portar</div>
                          <input className="input" style={{ height: 40 }} placeholder="6XX XXX XXX"
                            value={numeroPorta1} onChange={e => setNumeroPorta1(e.target.value)} />
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 4 }}>Operador origen</div>
                          <select className="input" style={{ height: 40 }} value={operadorPorta1} onChange={e => setOperadorPorta1(e.target.value)}>
                            <option value="">— Seleccionar —</option>
                            {['Vodafone', 'Orange', 'MásMóvil', 'Digi', 'Yoigo', 'Otro'].map(op => <option key={op}>{op}</option>)}
                          </select>
                        </div>
                      </div>
                      {operadorPorta1 && (
                        <div style={{ marginTop: 8, padding: '6px 10px', background: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: 6, fontSize: 11, color: '#92400E', fontWeight: 600 }}>
                          ⚠ Recuerda: ventana de portabilidad 10 días hábiles · Verificar SVIC antes de confirmar
                        </div>
                      )}
                    </div>
                  )}

                  {/* Campos porta línea 2 */}
                  {(portaLineas === 'segunda' || portaLineas === 'ambas') && (
                    <div className="fade-in" style={{ marginBottom: 14, padding: '14px', background: '#F9FAFB', borderRadius: 8, border: '1px solid #E5E7EB' }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 10 }}>Portabilidad — 2ª línea</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <div>
                          <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 4 }}>Número a portar</div>
                          <input className="input" style={{ height: 40 }} placeholder="6XX XXX XXX"
                            value={numeroPorta2} onChange={e => setNumeroPorta2(e.target.value)} />
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 4 }}>Operador origen</div>
                          <select className="input" style={{ height: 40 }} value={operadorPorta2} onChange={e => setOperadorPorta2(e.target.value)}>
                            <option value="">— Seleccionar —</option>
                            {['Vodafone', 'Orange', 'MásMóvil', 'Digi', 'Yoigo', 'Otro'].map(op => <option key={op}>{op}</option>)}
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* FTTR */}
              {bundleSel && !esSoloMovil && (
                <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 12, padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 4 }}>🔧 FTTR — Fiber to the Room (opcional)</div>
                  <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 16 }}>Extiende la fibra óptica a cada habitación del hogar.</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    {([
                      ['no', '❌', 'Sin FTTR', '', ''],
                      ['con-instalacion', '🔧', 'Con instalación', '+12€/mes durante 48 meses', 'Un técnico instala la fibra en cada habitación'],
                    ] as const).map(([val, ico, tit, precio, desc]) => (
                      <div key={val} onClick={() => setFttr(val)}
                        style={{ padding: '16px', border: `2px solid ${fttr === val ? BLUE : '#E5E7EB'}`, borderRadius: 10, cursor: 'pointer', background: fttr === val ? BLUE_LIGHT : 'white', textAlign: 'center', transition: 'all 0.1s' }}>
                        <div style={{ fontSize: 24, marginBottom: 8 }}>{ico}</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: fttr === val ? BLUE : '#111827', marginBottom: 4 }}>{tit}</div>
                        {precio && <div style={{ fontSize: 12, fontWeight: 600, color: BLUE, marginBottom: 4 }}>{precio}</div>}
                        {desc && <div style={{ fontSize: 11, color: '#9CA3AF' }}>{desc}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Dispositivo */}
              {bundleSel && (
                <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 12, padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>📱 Dispositivo (opcional)</div>
                      <div style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>Añade un terminal financiado o libre</div>
                    </div>
                    {dispositivoSel && (
                      <button onClick={() => setDispositivoSel(null)} style={{ fontSize: 12, color: '#DC2626', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                        Quitar
                      </button>
                    )}
                  </div>
                  {dispositivoSel ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: BLUE_LIGHT, borderRadius: 8, border: `1.5px solid ${BLUE_BORDER}` }}>
                      <div style={{ fontSize: 36 }}>{dispositivoSel.imagen}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: BLUE }}>{dispositivoSel.marca} {dispositivoSel.modelo}</div>
                        <div style={{ fontSize: 12, color: '#4338CA', marginTop: 2 }}>
                          {dispositivoSel.mesesFinanciacion} cuotas de {dispositivoSel.precioMensual.toFixed(2)}€/mes · {dispositivoSel.precioLibre}€ libre
                        </div>
                        {dispositivoSel.ahorro && (
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#166534', background: '#DCFCE7', padding: '2px 8px', borderRadius: 10, marginTop: 4, display: 'inline-block' }}>
                            Ahorras {dispositivoSel.ahorro}€
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => setModalAbierto(true)}
                      style={{ padding: '10px 24px', border: `1.5px solid ${BLUE}`, borderRadius: 8, color: BLUE, background: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                      📱 Ver escaparate de dispositivos →
                    </button>
                  )}
                </div>
              )}

              {/* Productos de terceros — RF01-4 con catalogoTerceros real */}
              {bundleSel && (
                <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 12, padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: mostrarTerceros ? 16 : 0 }}>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>🤝 Productos de terceros</div>
                      <div style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>Alarmas, energía solar y otros servicios — señalización integrada sin salir de Telco</div>
                    </div>
                    <button onClick={() => setMostrarTerceros(!mostrarTerceros)}
                      style={{ fontSize: 13, color: BLUE, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                      {mostrarTerceros ? '▲ Ocultar' : '▼ Ver productos'}
                    </button>
                  </div>
                  {mostrarTerceros && (
                    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {catalogoTerceros.map(prod => {
                        const sel = senalizaciones.includes(prod.id)
                        return (
                          <div key={prod.id}
                            onClick={() => setSenalizaciones(prev =>
                              prev.includes(prod.id) ? prev.filter(s => s !== prod.id) : [...prev, prod.id]
                            )}
                            style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '12px 16px',
                              border: `1.5px solid ${sel ? '#BBF7D0' : '#E5E7EB'}`,
                              borderRadius: 8, background: sel ? '#F0FDF4' : 'white', cursor: 'pointer', transition: 'all 0.1s' }}>
                            <span style={{ fontSize: 24, flexShrink: 0, marginTop: 2 }}>{prod.icono}</span>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                                <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{prod.nombre}</span>
                                <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 9999, fontWeight: 700,
                                  background: prod.tramitable ? '#F0FDF4' : '#FFFBEB',
                                  color: prod.tramitable ? '#166534' : '#92400E',
                                  border: `1px solid ${prod.tramitable ? '#86EFAC' : '#FCD34D'}` }}>
                                  {prod.tramitable ? '✓ Tramitable' : '📋 Señalizable'}
                                </span>
                                {prod.tramitable && (
                                  <span style={{ fontSize: 13, fontWeight: 700, color: '#111827', marginLeft: 'auto' }}>
                                    +5.99 €/mes
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 4 }}>{prod.proveedor}</div>
                              <div style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.5 }}>{prod.descripcion}</div>
                              {prod.tramitable && sel && (
                                <div style={{ marginTop: 6, fontSize: 11, color: '#166534', fontWeight: 600 }}>
                                  ✓ Añadido al carrito — se incluirá en el pedido
                                </div>
                              )}
                              {!prod.tramitable && sel && (
                                <div style={{ marginTop: 6, fontSize: 11, color: '#92400E', fontWeight: 600 }}>
                                  📋 Señalización creada — un especialista contactará al cliente
                                </div>
                              )}
                            </div>
                            <div style={{ width: 20, height: 20, borderRadius: 4, border: `2px solid ${sel ? '#16A34A' : '#D1D5DB'}`,
                              background: sel ? '#16A34A' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              {sel && <span style={{ fontSize: 11, color: 'white', fontWeight: 700 }}>✓</span>}
                            </div>
                          </div>
                        )
                      })}
                      {senalizaciones.length > 0 && (
                        <div style={{ padding: '10px 14px', background: BLUE_LIGHT, border: `1px solid ${BLUE_BORDER}`, borderRadius: 8, fontSize: 12, color: BLUE }}>
                          ℹ️ Al confirmar el pedido se generará una señalización para <strong>{senalizaciones.length} producto{senalizaciones.length > 1 ? 's' : ''}</strong>. Un especialista contactará al cliente para cada uno.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <button onClick={retroceder} style={{ padding: '10px 20px', border: '1.5px solid #E5E7EB', borderRadius: 8, background: 'white', fontSize: 13, cursor: 'pointer', color: '#6B7280' }}>
                  ← Atrás
                </button>
                <button onClick={avanzar} disabled={!paso2OK}
                  style={{ padding: '12px 32px', background: paso2OK ? BLUE : '#9CA3AF', color: 'white', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: paso2OK ? 'pointer' : 'not-allowed' }}>
                  Continuar → Mis datos
                </button>
              </div>
            </div>

            <ResumenLateral />
          </div>
        )}

        {/* ══════════ PASO 3 — DATOS CLIENTE ══════════ */}
        {paso === 3 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 12, padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 20 }}>Datos del cliente</div>

                {/* DNI + Scoring */}
                <div style={{ marginBottom: 20, padding: '16px', background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 10 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 10 }}>DNI / NIE / Pasaporte *</div>
                  <input className="input" placeholder="12345678A" value={datos.dni}
                    onChange={e => { setDatos(p => ({ ...p, dni: e.target.value.toUpperCase() })); setScoring(null) }}
                    style={{ marginBottom: 8, height: 44, borderColor: datos.dni && !validarDNI(datos.dni) ? '#EF4444' : undefined }}
                  />
                  {datos.dni && !validarDNI(datos.dni) && <div style={{ fontSize: 11, color: '#EF4444', marginBottom: 8 }}>Formato inválido — 8 dígitos + 1 letra</div>}
                  {clientePreCargado?.scoringOK ? (
                    <div style={{ padding: '10px 14px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 8, fontSize: 13, color: '#166534', fontWeight: 600 }}>
                      ✓ Scoring OK — Cliente verificado previamente
                    </div>
                  ) : (
                    <button onClick={ejecutarScoring} disabled={!validarDNI(datos.dni) || scoringCargando}
                      style={{ width: '100%', padding: '10px', background: scoring === true ? '#16A34A' : scoring === false ? '#DC2626' : BLUE, color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: (!validarDNI(datos.dni) || scoringCargando) ? 0.6 : 1 }}>
                      {scoringCargando ? '⏳ Verificando scoring...' : scoring === true ? '✓ Scoring OK — Apto para contratar' : scoring === false ? '✕ Scoring KO — No apto' : '🔍 Ejecutar scoring de riesgo'}
                    </button>
                  )}
                </div>

                {/* Formulario datos — solo si scoring OK */}
                {scoring === true && (
                  <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {clientePreCargado && (
                      <div style={{ padding: '10px 14px', background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: 8, fontSize: 12, color: '#0033A0', fontWeight: 600 }}>
                        ✓ Datos precargados del cliente — revisa y confirma antes de continuar
                      </div>
                    )}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Nombre *</div>
                        <input className="input" style={{ height: 44 }} placeholder="Nombre" value={datos.nombre} onChange={e => setDatos(p => ({ ...p, nombre: e.target.value }))} />
                      </div>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Apellidos *</div>
                        <input className="input" style={{ height: 44 }} placeholder="Apellidos" value={datos.apellidos} onChange={e => setDatos(p => ({ ...p, apellidos: e.target.value }))} />
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Email *</div>
                        <input className="input" style={{ height: 44, borderColor: datos.email && !validarEmail(datos.email) ? '#EF4444' : undefined }}
                          placeholder="email@ejemplo.com" value={datos.email} onChange={e => setDatos(p => ({ ...p, email: e.target.value }))} />
                      </div>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Teléfono *</div>
                        <input className="input" style={{ height: 44, borderColor: datos.telefono && !validarTel(datos.telefono) ? '#EF4444' : undefined }}
                          placeholder="612 345 678" value={datos.telefono} onChange={e => setDatos(p => ({ ...p, telefono: e.target.value }))} />
                        <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 3 }}>Te enviaremos un SMS para confirmar el pedido</div>
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>IBAN — Cuenta para domiciliación *</div>
                      <input className="input" style={{ height: 44, borderColor: datos.iban && !validarIBAN(datos.iban) ? '#EF4444' : undefined }}
                        placeholder="ES91 2100 0418 4502 0005 1332" value={datos.iban} onChange={e => setDatos(p => ({ ...p, iban: e.target.value.toUpperCase() }))} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Nacionalidad</div>
                        <select className="input" style={{ height: 44 }} value={datos.nacionalidad} onChange={e => setDatos(p => ({ ...p, nacionalidad: e.target.value }))}>
                          {['Española', 'Europea', 'Iberoamericana', 'Otra'].map(n => <option key={n}>{n}</option>)}
                        </select>
                      </div>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Idioma</div>
                        <select className="input" style={{ height: 44 }} value={datos.idioma} onChange={e => setDatos(p => ({ ...p, idioma: e.target.value }))}>
                          {['Castellano', 'Catalán', 'Euskera', 'Gallego', 'Inglés'].map(i => <option key={i}>{i}</option>)}
                        </select>
                      </div>
                    </div>
                    <div style={{ padding: '10px 14px', background: '#F9FAFB', borderRadius: 8, fontSize: 12, color: '#6B7280' }}>
                      💡 La factura se enviará digitalmente al email indicado por defecto.
                    </div>
                  </div>
                )}

                {scoring === false && (
                  <div style={{ padding: '12px 16px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, fontSize: 13, color: '#991B1B', marginTop: 8 }}>
                    ✕ Cliente no apto — no se puede continuar con esta oferta
                  </div>
                )}
              </div>

              {!paso3OK && scoring === null && validarDNI(datos.dni) && (
                <div style={{ padding: '12px 16px', background: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: 8, fontSize: 13, color: '#92400E' }}>
                  ⚠ Ejecuta el scoring de riesgo antes de continuar.
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <button onClick={retroceder} style={{ padding: '10px 20px', border: '1.5px solid #E5E7EB', borderRadius: 8, background: 'white', fontSize: 13, cursor: 'pointer', color: '#6B7280' }}>
                  ← Atrás
                </button>
                <button onClick={avanzar} disabled={!paso3OK}
                  style={{ padding: '12px 32px', background: paso3OK ? BLUE : '#9CA3AF', color: 'white', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: paso3OK ? 'pointer' : 'not-allowed' }}>
                  Continuar → Instalación
                </button>
              </div>
            </div>

            <ResumenLateral />
          </div>
        )}

        {/* ══════════ PASO 4 — PROVISIÓN ══════════ */}
        {paso === 4 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Instalación fibra */}
              {!esSoloMovil && (
                <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 12, padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 4 }}>📅 Cita de instalación</div>
                  <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 16 }}>Selecciona la fecha y franja horaria de instalación con técnico.</div>
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 10 }}>Fecha</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {fechasDisponibles.map(f => (
                        <button key={f.val} onClick={() => setProv(p => ({ ...p, citaFecha: f.val }))}
                          style={{ padding: '8px 16px', fontSize: 12, border: `2px solid ${prov.citaFecha === f.val ? BLUE : '#E5E7EB'}`, borderRadius: 8, background: 'white', color: prov.citaFecha === f.val ? BLUE : '#374151', cursor: 'pointer', fontWeight: prov.citaFecha === f.val ? 600 : 400 }}>
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 10 }}>Franja horaria</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {franjas.map(f => (
                        <button key={f} onClick={() => setProv(p => ({ ...p, citaFranja: f }))}
                          style={{ padding: '8px 16px', fontSize: 12, border: `2px solid ${prov.citaFranja === f ? BLUE : '#E5E7EB'}`, borderRadius: 8, background: 'white', color: prov.citaFranja === f ? BLUE : '#374151', cursor: 'pointer', fontWeight: prov.citaFranja === f ? 600 : 400 }}>
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>
                  {prov.citaFecha && prov.citaFranja && (
                    <div style={{ marginTop: 14, padding: '10px 14px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 8, fontSize: 13, color: '#166534', fontWeight: 600 }}>
                      ✓ Cita: {fechasDisponibles.find(f => f.val === prov.citaFecha)?.label} · {prov.citaFranja}
                    </div>
                  )}
                </div>
              )}

              {/* SIM */}
              {(tieneLinea || esSoloMovil) && (
                <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 12, padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 16 }}>SIM / eSIM</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    {([['fisica', '💳', 'SIM física', 'Tarjeta física — correo o recogida en tienda'], ['esim', '📲', 'eSIM', 'Activación digital inmediata en el dispositivo']] as const).map(([val, ico, tit, desc]) => (
                      <div key={val} onClick={() => setProv(p => ({ ...p, sim: val }))
                      } style={{ padding: '16px', border: `2px solid ${prov.sim === val ? BLUE : '#E5E7EB'}`, borderRadius: 10, cursor: 'pointer', background: prov.sim === val ? BLUE_LIGHT : 'white', textAlign: 'center' }}>
                        <div style={{ fontSize: 28, marginBottom: 8 }}>{ico}</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: prov.sim === val ? BLUE : '#111827', marginBottom: 4 }}>{tit}</div>
                        <div style={{ fontSize: 11, color: '#9CA3AF' }}>{desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Entrega */}
              <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 12, padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginBottom: 16 }}>Entrega de equipos{dispositivoSel ? ' y dispositivo' : ''}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {([['domicilio', '🏠', 'Envío a domicilio', 'Recibirás el equipo en 2-3 días hábiles'], ['tienda', '🏪', 'Recogida en tienda', 'El cliente recoge el equipo en la tienda hoy']] as const).map(([val, ico, tit, desc]) => (
                    <div key={val} onClick={() => setProv(p => ({ ...p, entrega: val }))}
                      style={{ padding: '16px', border: `2px solid ${prov.entrega === val ? BLUE : '#E5E7EB'}`, borderRadius: 10, cursor: 'pointer', background: prov.entrega === val ? BLUE_LIGHT : 'white', textAlign: 'center' }}>
                      <div style={{ fontSize: 28, marginBottom: 8 }}>{ico}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: prov.entrega === val ? BLUE : '#111827', marginBottom: 4 }}>{tit}</div>
                      <div style={{ fontSize: 11, color: '#9CA3AF' }}>{desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <button onClick={retroceder} style={{ padding: '10px 20px', border: '1.5px solid #E5E7EB', borderRadius: 8, background: 'white', fontSize: 13, cursor: 'pointer', color: '#6B7280' }}>
                  ← Atrás
                </button>
                <button onClick={avanzar} disabled={!paso4OK}
                  style={{ padding: '12px 32px', background: paso4OK ? BLUE : '#9CA3AF', color: 'white', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: paso4OK ? 'pointer' : 'not-allowed' }}>
                  Continuar → Resumen y firma
                </button>
              </div>
            </div>

            <ResumenLateral />
          </div>
        )}

        {/* ══════════ PASO 5 — VENTA CONSCIENTE + FIRMA ══════════ */}
        {paso === 5 && (
          firmado ? (
            <div style={{ maxWidth: 600, margin: '40px auto', background: 'white', border: '1px solid #E5E7EB', borderRadius: 16, padding: '48px 40px', textAlign: 'center', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
              <div style={{ fontSize: 56, marginBottom: 20 }}>🎉</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#16A34A', marginBottom: 10 }}>Alta completada correctamente</div>
              <div style={{ fontSize: 14, color: '#6B7280', marginBottom: 28, lineHeight: 1.6 }}>
                OTP verificado · Pedido generado · Confirmación enviada a <strong>{datos.email}</strong>
              </div>
              <button onClick={() => navigate('/')} style={{ padding: '12px 32px', background: BLUE, color: 'white', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                Volver al inicio
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'start' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* Venta consciente */}
                <div style={{ background: BLUE_LIGHT, border: `1px solid ${BLUE_BORDER}`, borderRadius: 12, padding: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                    <div style={{ width: 28, height: 28, background: BLUE, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: 'white' }}>💬</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: BLUE }}>Venta consciente — repasa con el cliente</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, color: '#374151', lineHeight: 1.7 }}>
                    <div>✓ Contratas <strong>{bundleSel?.nombre}</strong>{addonsSel.size > 0 ? ` con ${catalogoAddonsTV.filter(a => addonsSel.has(a.id)).map(a => a.nombre).join(' y ')}` : ''}.</div>
                    <div>✓ Tu cuota mensual es de <strong>{precioConIVA.toFixed(2)}€ con IVA</strong> ({precioTotal.toFixed(2)}€ sin IVA).</div>
                    {dispositivoSel && <div>✓ Además, {dispositivoSel.mesesFinanciacion} cuotas de <strong>{cuotaDisp.toFixed(2)}€/mes</strong> por el {dispositivoSel.marca} {dispositivoSel.modelo}.</div>}
                    {fttr === 'con-instalacion' && <div>✓ FTTR incluido: +12€/mes durante 48 meses para fibra en cada habitación.</div>}
                    <div>✓ El cobro se realizará por domiciliación bancaria en la cuenta indicada.</div>
                    <div>✓ Recibirás la factura digitalmente en <strong>{datos.email}</strong>.</div>
                    {portaLineas !== 'ninguna' && (
                      <div>✓ Portabilidad solicitada para {portaLineas === 'primera' ? 'la línea principal' : portaLineas === 'segunda' ? 'la segunda línea' : 'ambas líneas'} — ventana de 10 días hábiles.</div>
                    )}
                    {!esSoloMovil && prov.citaFecha && (
                      <div>✓ Cita de instalación: <strong>{fechasDisponibles.find(f => f.val === prov.citaFecha)?.label}</strong> de <strong>{prov.citaFranja}</strong>.</div>
                    )}
                    {prov.sim === 'esim' && <div>✓ eSIM — activación digital inmediata.</div>}
                    {prov.entrega === 'tienda' && <div>✓ Recogida de equipo en tienda hoy.</div>}
                    {senalizaciones.length > 0 && (
                      <div>✓ Señalizaciones pendientes: <strong>{senalizaciones.join(', ')}</strong> — un especialista contactará al cliente.</div>
                    )}
                  </div>
                </div>

                {/* Resumen contrato */}
                <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: 12, padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', marginBottom: 16 }}>Resumen del contrato</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
                    {[
                      { l: 'Bundle', v: bundleSel?.nombre || '—' },
                      { l: 'Titular', v: `${datos.nombre} ${datos.apellidos}` },
                      { l: 'DNI', v: datos.dni },
                      { l: 'Email', v: datos.email },
                      { l: 'Teléfono', v: datos.telefono },
                      { l: 'IBAN', v: datos.iban.replace(/(.{4})/g, '$1 ').trim() },
                      ...(!esSoloMovil && cob.verificada ? [{ l: 'Dirección', v: `${cob.calle} ${cob.numero}, ${cob.cp} ${cob.ciudad}` }] : []),
                      ...(!esSoloMovil && prov.citaFecha ? [{ l: 'Cita técnico', v: `${fechasDisponibles.find(f => f.val === prov.citaFecha)?.label} · ${prov.citaFranja}` }] : []),
                      { l: 'SIM', v: prov.sim === 'fisica' ? 'SIM física' : 'eSIM' },
                      { l: 'Entrega', v: prov.entrega === 'domicilio' ? 'Envío a domicilio (2-3 días)' : 'Recogida en tienda hoy' },
                    ].map(row => (
                      <div key={row.l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '4px 0', borderBottom: '1px solid #F3F4F6' }}>
                        <span style={{ color: '#9CA3AF' }}>{row.l}</span>
                        <span style={{ color: '#111827', fontWeight: 500, textAlign: 'right', maxWidth: '60%' }}>{row.v}</span>
                      </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 700, paddingTop: 10, borderTop: '2px solid #E5E7EB' }}>
                      <span>Total mensual c/IVA</span>
                      <span style={{ color: BLUE }}>{(precioConIVA + cuotaDisp * 1.21).toFixed(2)}€</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <button onClick={retroceder} style={{ padding: '10px 20px', border: '1.5px solid #E5E7EB', borderRadius: 8, background: 'white', fontSize: 13, cursor: 'pointer', color: '#6B7280' }}>
                    ← Atrás
                  </button>
                </div>
              </div>

              <ResumenLateral mostrarFirma={true} />
            </div>
          )
        )}
      </div>

      {/* ══════════ MODAL ESCAPARATE DISPOSITIVOS ══════════ */}
      {modalAbierto && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '20px', overflowY: 'auto' }}
          onClick={e => { if (e.target === e.currentTarget) setModalAbierto(false) }}>
          <div style={{ background: 'white', borderRadius: 12, width: '100%', maxWidth: 960, boxShadow: '0 8px 32px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', maxHeight: '90vh', overflow: 'hidden' }}>

            <div style={{ padding: '16px 24px', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>Escaparate de dispositivos</div>
                <div style={{ fontSize: 12, color: '#9CA3AF' }}>{dispositivosFiltrados.length} dispositivos disponibles</div>
              </div>
              <button onClick={() => setModalAbierto(false)} style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #E5E7EB', background: 'none', cursor: 'pointer', fontSize: 16 }}>✕</button>
            </div>

            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
              {/* Filtros */}
              <div style={{ width: 220, borderRight: '1px solid #E5E7EB', padding: '20px', overflowY: 'auto', flexShrink: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 16 }}>Filtros</div>

                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Ordenar por</div>
                  {[['relevancia', 'Relevancia'], ['precio_asc', 'Precio: menor a mayor'], ['precio_desc', 'Precio: mayor a menor']].map(([val, label]) => (
                    <div key={val} onClick={() => setFiltroOrden(val as any)}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', cursor: 'pointer', fontSize: 13, color: filtroOrden === val ? BLUE : '#374151', fontWeight: filtroOrden === val ? 600 : 400 }}>
                      <div style={{ width: 14, height: 14, borderRadius: '50%', border: `2px solid ${filtroOrden === val ? BLUE : '#D1D5DB'}`, background: filtroOrden === val ? BLUE : 'transparent', flexShrink: 0 }} />
                      {label}
                    </div>
                  ))}
                </div>

                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Precio</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#6B7280', marginBottom: 8 }}>
                    <span>{filtroPrecioMin}€</span>
                    <span>{filtroPrecioMax === 2000 ? '2000€+' : `${filtroPrecioMax}€`}</span>
                  </div>
                  <input type="range" min={0} max={2000} step={50} value={filtroPrecioMax}
                    onChange={e => setFiltroPrecioMax(Math.max(Number(e.target.value), filtroPrecioMin + 50))}
                    style={{ width: '100%', cursor: 'pointer', accentColor: BLUE }} />
                  <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
                    {[300, 500, 800, 1200].map(p => (
                      <button key={p} onClick={() => { setFiltroPrecioMin(0); setFiltroPrecioMax(p) }}
                        style={{ flex: 1, padding: '3px', fontSize: 10, borderRadius: 4, border: `1px solid ${filtroPrecioMax === p && filtroPrecioMin === 0 ? BLUE : '#E5E7EB'}`, background: filtroPrecioMax === p && filtroPrecioMin === 0 ? BLUE_LIGHT : 'white', cursor: 'pointer', color: '#6B7280' }}>
                        &lt;{p}€
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Marca</div>
                  {marcasDisponibles.map(m => (
                    <div key={m} onClick={() => toggleMarca(m)}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', cursor: 'pointer', fontSize: 13, color: filtroMarcas.has(m) ? BLUE : '#374151', fontWeight: filtroMarcas.has(m) ? 600 : 400 }}>
                      <div style={{ width: 14, height: 14, borderRadius: 3, border: `2px solid ${filtroMarcas.has(m) ? BLUE : '#D1D5DB'}`, background: filtroMarcas.has(m) ? BLUE : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {filtroMarcas.has(m) && <span style={{ fontSize: 9, color: 'white', fontWeight: 700 }}>✓</span>}
                      </div>
                      {m}
                    </div>
                  ))}
                </div>

                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Categoría</div>
                  {['todas', ...categoriasDisponibles].map(c => (
                    <div key={c} onClick={() => setFiltroCategoria(c)}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', cursor: 'pointer', fontSize: 13, color: filtroCategoria === c ? BLUE : '#374151', fontWeight: filtroCategoria === c ? 600 : 400 }}>
                      <div style={{ width: 14, height: 14, borderRadius: '50%', border: `2px solid ${filtroCategoria === c ? BLUE : '#D1D5DB'}`, background: filtroCategoria === c ? BLUE : 'transparent', flexShrink: 0 }} />
                      {c === 'todas' ? 'Todas' : c.charAt(0).toUpperCase() + c.slice(1)}
                    </div>
                  ))}
                </div>

                {hayFiltros && (
                  <button onClick={() => { setFiltroMarcas(new Set()); setFiltroCategoria('todas'); setFiltroPrecioMin(0); setFiltroPrecioMax(2000); setFiltroOrden('relevancia') }}
                    style={{ width: '100%', padding: '8px', border: '1px solid #E5E7EB', borderRadius: 8, background: 'white', fontSize: 12, cursor: 'pointer', color: '#6B7280' }}>
                    ↺ Limpiar filtros
                  </button>
                )}
              </div>

              {/* Grid */}
              <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
                {dispositivosMostrados.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#9CA3AF', fontSize: 13 }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
                    Sin dispositivos para estos filtros
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
                      {dispositivosMostrados.map(d => {
                        const sel = dispositivoSel?.id === d.id
                        return (
                          <div key={d.id} onClick={() => { setDispositivoSel(sel ? null : d); setModalAbierto(false) }}
                            style={{ padding: '16px', border: `2px solid ${sel ? BLUE : d.destacado ? '#FCD34D' : '#E5E7EB'}`, borderRadius: 10, cursor: d.stock ? 'pointer' : 'not-allowed', background: sel ? BLUE_LIGHT : d.destacado ? '#FFFBEB' : 'white', opacity: d.stock ? 1 : 0.5, position: 'relative', transition: 'all 0.1s' }}
                            onMouseEnter={e => { if (d.stock) e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)' }}
                            onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none' }}>
                            {d.destacado && !sel && <div style={{ position: 'absolute', top: 8, right: 8, fontSize: 9, padding: '2px 6px', borderRadius: 10, background: '#FCD34D', color: '#92400E', fontWeight: 700 }}>DEST.</div>}
                            {!d.stock && <div style={{ position: 'absolute', top: 8, left: 8, fontSize: 9, padding: '2px 6px', borderRadius: 10, background: '#FEE2E2', color: '#991B1B', fontWeight: 700 }}>AGOTADO</div>}
                            {d.ahorro && d.stock && <div style={{ position: 'absolute', top: 8, left: 8, fontSize: 9, padding: '2px 6px', borderRadius: 10, background: '#DCFCE7', color: '#166534', fontWeight: 700 }}>-{d.ahorro}€</div>}
                            <div style={{ textAlign: 'center', fontSize: 40, marginBottom: 10, marginTop: (d.destacado || !d.stock || d.ahorro) ? 14 : 0 }}>{d.imagen}</div>
                            <div style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 2 }}>{d.marca}</div>
                            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: sel ? BLUE : '#111827' }}>{d.modelo}</div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: sel ? BLUE : BLUE, fontFamily: 'var(--font-mono)' }}>{d.precioMensual.toFixed(2)}€<span style={{ fontSize: 10, fontWeight: 400, color: '#9CA3AF' }}>/mes</span></div>
                            <div style={{ fontSize: 11, color: '#9CA3AF' }}>{d.precioLibre}€ libre · {d.storage}</div>
                            {sel && <div style={{ marginTop: 8, fontSize: 12, fontWeight: 700, color: BLUE, textAlign: 'center' }}>✓ Seleccionado</div>}
                          </div>
                        )
                      })}
                    </div>
                    {hayMas && (
                      <div style={{ textAlign: 'center', marginTop: 20 }}>
                        <button onClick={() => setMostrarMas(true)} style={{ padding: '10px 24px', border: `1.5px solid ${BLUE}`, borderRadius: 8, color: BLUE, background: 'white', fontSize: 13, cursor: 'pointer' }}>
                          Ver más dispositivos →
                        </button>
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