import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { catalogoDispositivos } from '../../data/mockData'
import { useAppStore } from '../../store/useAppStore'
import type { Dispositivo } from '../../types'

type Categoria = 'todos' | 'smartphone' | 'tablet' | 'tv' | 'wearable'
type Orden = 'recomendado' | 'precio_asc' | 'precio_desc'

// ── Packs/cross-selling proactivo (RF06-1) ──
const packsRelacionados: Record<string, { nombre: string; descuento: number; icono: string }[]> = {
  'd2': [{ nombre: 'Apple Watch Series 9', descuento: 50, icono: '⌚' }],
  'd3': [{ nombre: 'Apple Watch Series 9', descuento: 80, icono: '⌚' }, { nombre: 'AirPods Pro', descuento: 30, icono: '🎧' }],
  'd1': [{ nombre: 'Galaxy Watch 6', descuento: 40, icono: '⌚' }],
  'd5': [{ nombre: 'Auriculares Xiaomi', descuento: 20, icono: '🎧' }],
}

// ── PVPR simulado (RF04-1) ──
const pvprDispositivos: Record<string, number> = {
  'd1': 999, 'd2': 1099, 'd3': 1399, 'd4': 499,
  'd5': 899, 'd6': 899, 'd7': 799, 'd8': 479,
  'd9': 349, 'd10': 899,
}

type DispositivosPageProps = {
  modoNuevoCliente?: boolean
  onSeleccionar?: (d: Dispositivo) => void
}

export function DispositivosPage({ modoNuevoCliente = false, onSeleccionar }: DispositivosPageProps = {}) {
  const { id } = useParams()
  const navigate = useNavigate()
  const { clienteActivo } = useAppStore()
  const [categoria, setCategoria] = useState<Categoria>('todos')
  const [orden, setOrden] = useState<Orden>('recomendado')
  const [busqueda, setBusqueda] = useState('')
  const [seleccionado, setSeleccionado] = useState<Dispositivo | null>(null)
  const [comparando, setComparando] = useState<Dispositivo[]>([])
  const [mostrarComparativa, setMostrarComparativa] = useState(false)
  const [enCesta, setEnCesta] = useState<Dispositivo[]>([])
  const [firmado, setFirmado] = useState(false)
  const [firmando, setFirmando] = useState(false)
  const [mostrarVentaConsciente, setMostrarVentaConsciente] = useState(false)
  const [modalidadDetalle, setModalidadDetalle] = useState<'mensual' | 'libre' | 'rtr'>('mensual')

  // RF08-2 — Opciones post-selección
  const [seguroSeleccionado, setSeguroSeleccionado] = useState(false)
  const [recompraSeleccionada, setRecompraSeleccionada] = useState(false)

  // RF07-1 — GDR
  const [solicitandoGDR, setSolicitandoGDR] = useState(false)
  const [gdrSolicitado, setGdrSolicitado] = useState(false)

  // Cliente puede ser nulo en modo nuevo cliente
  const esClienteExistente = !modoNuevoCliente && !!clienteActivo

  const limiteCredito = !esClienteExistente ? 2000
    : clienteActivo!.riesgoScore === 'alto' ? 500 : 2000

  // NBA — dispositivos recomendados según perfil cliente
  const dispositivosNBA = catalogoDispositivos
    .filter(d => {
      if (!esClienteExistente) return d.destacado
      if (clienteActivo!.riesgoScore === 'alto') return d.precioLibre <= 500
      if (clienteActivo!.productos.some(p => p.tipo === 'movil')) return d.destacado
      return true
    })
    .map(d => d.id)

  const filtrados = catalogoDispositivos
    .filter(d => categoria === 'todos' || d.categoria === categoria)
    .filter(d => !busqueda ||
      d.marca.toLowerCase().includes(busqueda.toLowerCase()) ||
      d.modelo.toLowerCase().includes(busqueda.toLowerCase()))
    .sort((a, b) => {
      if (orden === 'precio_asc') return a.precioLibre - b.precioLibre
      if (orden === 'precio_desc') return b.precioLibre - a.precioLibre
      return (b.destacado ? 1 : 0) - (a.destacado ? 1 : 0)
    })

  const toggleComparar = (d: Dispositivo) => {
    if (comparando.find(c => c.id === d.id)) {
      setComparando(comparando.filter(c => c.id !== d.id))
    } else if (comparando.length < 3) {
      setComparando([...comparando, d])
    }
  }

  const addCesta = (d: Dispositivo) => {
    if (onSeleccionar) { onSeleccionar(d); return }
    if (!enCesta.find(c => c.id === d.id)) setEnCesta([...enCesta, d])
    setSeleccionado(null)
    setMostrarVentaConsciente(false)
    setSeguroSeleccionado(false)
    setRecompraSeleccionada(false)
  }

  const fueraLCD = (d: Dispositivo) => d.precioLibre > limiteCredito

  const totalCesta = enCesta.reduce((a, d) => a + d.precioMensual, 0)

  const firmar = () => {
    setFirmando(true)
    setTimeout(() => { setFirmando(false); setFirmado(true) }, 2000)
  }

  const parqueActualPrecio = esClienteExistente
    ? clienteActivo!.productos.reduce((a, p) => a + (p.precio || 0), 0)
    : 0

  const abrirDetalle = (d: Dispositivo) => {
    setSeleccionado(d)
    setMostrarVentaConsciente(false)
    setModalidadDetalle('mensual')
    setSeguroSeleccionado(false)
    setRecompraSeleccionada(false)
  }

  return (
    <>
      {/* ── HEADER ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>Escaparate de dispositivos</div>
          <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 2 }}>
            Top 10 personalizado · Filtros · Comparativa · LCD: {limiteCredito}€
            {modoNuevoCliente && <span style={{ marginLeft: 8, padding: '1px 6px', borderRadius: 9999, background: 'var(--color-blue-light)', color: 'var(--color-blue-dark)', fontSize: 10, fontWeight: 700 }}>NUEVO CLIENTE</span>}
          </div>
        </div>

        {enCesta.length > 0 && !firmado && !modoNuevoCliente && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', background: 'var(--color-blue-light)', border: '1.5px solid var(--color-blue-mid)', borderRadius: 'var(--border-radius-lg)', fontSize: 12, color: 'var(--color-blue-dark)' }}>
            <span style={{ fontWeight: 600 }}>🛒 {enCesta.length} dispositivo/s · {totalCesta.toFixed(2)}€/mes</span>
            <button onClick={firmar} disabled={firmando} className="btn-primary" style={{ height: 28, fontSize: 11 }}>
              {firmando ? <><span className="spinner spinner-sm" /> OTP...</> : '🔐 Firmar OTP'}
            </button>
          </div>
        )}

        {firmado && (
          <div className="alert alert-ok" style={{ padding: '6px 14px' }}>
            <span>✓</span>
            <span style={{ fontWeight: 600, fontSize: 12 }}>Pedido generado — dispositivo en camino</span>
          </div>
        )}
      </div>

      {/* ── FILTROS ── */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar marca o modelo..."
          className="input"
          style={{ width: 200, height: 32 }}
        />
        <div style={{ display: 'flex', gap: 2, background: 'var(--color-background-secondary)', borderRadius: 'var(--border-radius-md)', padding: 2, border: '1px solid var(--color-border-tertiary)' }}>
          {(['todos', 'smartphone', 'tablet', 'wearable'] as Categoria[]).map(c => (
            <button key={c} onClick={() => setCategoria(c)}
              style={{ padding: '4px 10px', borderRadius: 4, fontSize: 11, border: 'none', cursor: 'pointer', background: categoria === c ? 'var(--color-background-primary)' : 'none', color: categoria === c ? 'var(--color-text-primary)' : 'var(--color-text-secondary)', fontWeight: categoria === c ? 600 : 400, boxShadow: categoria === c ? 'var(--shadow-sm)' : 'none' }}>
              {c.charAt(0).toUpperCase() + c.slice(1)}
            </button>
          ))}
        </div>
        <select value={orden} onChange={e => setOrden(e.target.value as Orden)} className="select" style={{ width: 'auto' }}>
          <option value="recomendado">Recomendado</option>
          <option value="precio_asc">Precio: menor a mayor</option>
          <option value="precio_desc">Precio: mayor a menor</option>
        </select>
        {comparando.length >= 2 && (
          <button onClick={() => setMostrarComparativa(true)} className="btn-primary" style={{ fontSize: 11, height: 32 }}>
            Ver comparativa ({comparando.length}) →
          </button>
        )}
        {comparando.length > 0 && (
          <button onClick={() => { setComparando([]); setMostrarComparativa(false) }} className="btn-secondary" style={{ fontSize: 11, height: 32 }}>
            Limpiar
          </button>
        )}
      </div>

      {/* ── RF05-1: COMPARATIVA EN TABLA PARALELA ── */}
      {mostrarComparativa && comparando.length >= 2 && (
        <div className="card fade-in">
          <div className="card-title">
            Comparativa de dispositivos
            <button onClick={() => setMostrarComparativa(false)} className="card-title-link">Cerrar</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: `140px repeat(${comparando.length}, 1fr)`, gap: 0, border: '1px solid var(--color-border-tertiary)', borderRadius: 'var(--border-radius-md)', overflow: 'hidden' }}>
            {/* Cabecera vacía + dispositivos */}
            <div style={{ background: 'var(--color-background-secondary)', padding: '10px 12px', borderBottom: '1px solid var(--color-border-tertiary)', borderRight: '1px solid var(--color-border-tertiary)' }} />
            {comparando.map((d, i) => (
              <div key={d.id} style={{ padding: '10px 12px', textAlign: 'center', borderBottom: '1px solid var(--color-border-tertiary)', borderRight: i < comparando.length - 1 ? '1px solid var(--color-border-tertiary)' : 'none', background: dispositivosNBA.includes(d.id) ? 'var(--color-blue-light)' : 'var(--color-background-secondary)' }}>
                <div style={{ fontSize: 28, marginBottom: 4 }}>{d.imagen}</div>
                <div style={{ fontSize: 11, fontWeight: 700 }}>{d.marca} {d.modelo}</div>
                {dispositivosNBA.includes(d.id) && <span style={{ fontSize: 9, padding: '1px 5px', borderRadius: 9999, background: 'var(--color-blue)', color: '#fff', fontWeight: 700 }}>⭐ NBA</span>}
              </div>
            ))}

            {/* Filas de especificaciones */}
            {[
              { label: 'Cuota mensual', fn: (d: Dispositivo) => `${d.precioMensual.toFixed(2)}€/mes` },
              { label: 'Precio libre', fn: (d: Dispositivo) => `${d.precioLibre}€` },
              { label: 'PVPR', fn: (d: Dispositivo) => `${pvprDispositivos[d.id] || d.precioLibre}€` },
              { label: 'Ahorro vs PVPR', fn: (d: Dispositivo) => {
                const pvpr = pvprDispositivos[d.id] || d.precioLibre
                const ahorro = pvpr - d.precioLibre
                return ahorro > 0 ? `💰 ${ahorro}€` : '—'
              }},
              { label: 'Almacenamiento', fn: (d: Dispositivo) => d.storage },
              { label: 'Pantalla', fn: (d: Dispositivo) => d.pantalla || '—' },
              { label: 'Financiación', fn: (d: Dispositivo) => `${d.mesesFinanciacion} meses` },
              { label: 'Stock', fn: (d: Dispositivo) => d.stock ? '✓ Disponible' : '✗ Agotado' },
              { label: 'LCD', fn: (d: Dispositivo) => fueraLCD(d) ? '⚠ Fuera de LCD' : '✓ Dentro de LCD' },
            ].map((row, rowIdx) => (
              <>
                <div key={`label-${rowIdx}`} style={{ padding: '8px 12px', fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', borderBottom: rowIdx < 8 ? '1px solid var(--color-border-tertiary)' : 'none', borderRight: '1px solid var(--color-border-tertiary)', background: rowIdx % 2 === 0 ? 'var(--color-background-secondary)' : 'var(--color-background-primary)' }}>
                  {row.label}
                </div>
                {comparando.map((d, i) => (
                  <div key={`val-${rowIdx}-${d.id}`} style={{ padding: '8px 12px', fontSize: 12, textAlign: 'center', borderBottom: rowIdx < 8 ? '1px solid var(--color-border-tertiary)' : 'none', borderRight: i < comparando.length - 1 ? '1px solid var(--color-border-tertiary)' : 'none', background: rowIdx % 2 === 0 ? 'white' : 'var(--color-background-secondary)', color: row.label === 'Stock' ? (d.stock ? 'var(--color-green-dark)' : 'var(--color-red-dark)') : row.label === 'LCD' ? (fueraLCD(d) ? 'var(--color-amber-dark)' : 'var(--color-green-dark)') : row.label === 'Ahorro vs PVPR' ? 'var(--color-green-dark)' : 'var(--color-text-primary)', fontWeight: row.label === 'Cuota mensual' ? 700 : 400 }}>
                    {row.fn(d)}
                  </div>
                ))}
              </>
            ))}

            {/* Fila botones */}
            <div style={{ padding: '10px 12px', background: 'var(--color-background-secondary)', borderRight: '1px solid var(--color-border-tertiary)' }} />
            {comparando.map((d, i) => (
              <div key={`btn-${d.id}`} style={{ padding: '10px 12px', textAlign: 'center', borderRight: i < comparando.length - 1 ? '1px solid var(--color-border-tertiary)' : 'none' }}>
                <button onClick={() => { abrirDetalle(d); setMostrarComparativa(false) }}
                  disabled={!d.stock || fueraLCD(d)}
                  className="btn-primary"
                  style={{ width: '100%', justifyContent: 'center', fontSize: 11 }}>
                  {fueraLCD(d) ? '⚠ LCD' : !d.stock ? 'Agotado' : 'Seleccionar'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── RF06-1: PACKS / CROSS-SELLING PROACTIVO ── */}
      {seleccionado === null && enCesta.length === 0 && (() => {
        const packsDestacados = Object.entries(packsRelacionados).slice(0, 1)
        const dispBase = catalogoDispositivos.find(d => d.id === packsDestacados[0]?.[0])
        const packs = packsDestacados[0]?.[1] || []
        if (!dispBase || packs.length === 0) return null
        return (
          <div className="card" style={{ border: '1.5px solid var(--color-amber-border)', background: 'var(--color-amber-light)' }}>
            <div className="card-title" style={{ color: 'var(--color-amber-dark)' }}>
              🎁 Oferta combinada destacada
              <span style={{ fontSize: 10, fontWeight: 400, color: 'var(--color-text-tertiary)', textTransform: 'none', letterSpacing: 0 }}>Visible antes de seleccionar producto</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: 'var(--color-amber-dark)' }}>
              <span style={{ fontSize: 24 }}>{dispBase.imagen}</span>
              <div>
                <div style={{ fontWeight: 700, marginBottom: 2 }}>Si compras {dispBase.marca} {dispBase.modelo}...</div>
                {packs.map((p, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                    <span>{p.icono}</span>
                    <span>... el <strong>{p.nombre}</strong> te sale con <strong>{p.descuento}€ de descuento</strong></span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      })()}

      {/* ── GRID DE DISPOSITIVOS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(165px, 1fr))', gap: 10 }}>
        {filtrados.map(d => {
          const fuera = fueraLCD(d)
          const enComp = !!comparando.find(c => c.id === d.id)
          const enCestaYa = !!enCesta.find(c => c.id === d.id)
          const pvpr = pvprDispositivos[d.id] || d.precioLibre
          const ahorroVsPVPR = pvpr - d.precioLibre
          const packs = packsRelacionados[d.id] || []

          return (
            <div key={d.id}
              onClick={() => !fuera && d.stock && abrirDetalle(d)}
              style={{ background: 'var(--color-background-primary)', border: `1px solid ${enCestaYa ? 'var(--color-blue-mid)' : seleccionado?.id === d.id ? 'var(--color-blue-mid)' : 'var(--color-border-tertiary)'}`, borderTop: `3px solid ${enCestaYa ? 'var(--color-blue)' : d.destacado && !fuera ? 'var(--color-blue)' : 'transparent'}`, borderRadius: 'var(--border-radius-lg)', padding: '12px', cursor: fuera || !d.stock ? 'not-allowed' : 'pointer', opacity: fuera ? 0.55 : 1, position: 'relative', transition: 'box-shadow 0.15s, transform 0.1s', boxShadow: 'var(--shadow-sm)' }}
              onMouseEnter={e => { if (!fuera && d.stock) { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateY(-1px)' } }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; e.currentTarget.style.transform = 'translateY(0)' }}>

              {/* Badges */}
              {dispositivosNBA.includes(d.id) && !fuera && (
                <div style={{ position: 'absolute', top: 8, right: 8, fontSize: 9, padding: '2px 6px', borderRadius: 'var(--border-radius-full)', background: 'var(--color-blue)', color: '#fff', fontWeight: 700 }}>⭐ NBA</div>
              )}
              {d.destacado && !fuera && !dispositivosNBA.includes(d.id) && (
                <div style={{ position: 'absolute', top: 8, right: 8, fontSize: 9, padding: '2px 6px', borderRadius: 'var(--border-radius-full)', background: 'var(--color-purple)', color: '#fff', fontWeight: 700 }}>TOP</div>
              )}
              {/* RF07-1 — Badge LCD */}
              {fuera && (
                <div style={{ position: 'absolute', top: 8, right: 8, fontSize: 9, padding: '2px 6px', borderRadius: 'var(--border-radius-full)', background: 'var(--color-red-mid)', color: '#fff', fontWeight: 700 }}>⚠ LCD</div>
              )}
              {enCestaYa && (
                <div style={{ position: 'absolute', top: 8, left: 8, fontSize: 9, padding: '2px 6px', borderRadius: 'var(--border-radius-full)', background: 'var(--color-blue)', color: '#fff', fontWeight: 700 }}>✓ Cesta</div>
              )}
              {packs.length > 0 && !fuera && (
                <div style={{ position: 'absolute', top: enCestaYa ? 24 : 8, left: 8, fontSize: 9, padding: '2px 6px', borderRadius: 'var(--border-radius-full)', background: 'var(--color-amber-mid)', color: 'var(--color-amber-dark)', fontWeight: 700 }}>🎁 Pack</div>
              )}

              <div style={{ fontSize: 34, textAlign: 'center', marginBottom: 8, marginTop: (enCestaYa || packs.length > 0) ? 12 : 0 }}>{d.imagen}</div>
              <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', marginBottom: 1 }}>{d.marca}</div>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>{d.modelo}</div>

              {/* RF04-1 — Precio cliente vs PVPR */}
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-blue)', fontFamily: 'var(--font-mono)' }}>
                {d.precioMensual.toFixed(2)}€<span style={{ fontSize: 10, fontWeight: 400, color: 'var(--color-text-tertiary)' }}>/mes</span>
              </div>
              {ahorroVsPVPR > 0 && (
                <div style={{ fontSize: 10, marginBottom: 2 }}>
                  <span style={{ textDecoration: 'line-through', color: 'var(--color-text-tertiary)', marginRight: 4 }}>{pvpr}€</span>
                  <span style={{ color: 'var(--color-green-dark)', fontWeight: 700 }}>{d.precioLibre}€</span>
                </div>
              )}
              {d.ahorro && (
                <div style={{ fontSize: 10, color: 'var(--color-green-dark)', fontWeight: 700, marginBottom: 2 }}>💰 Ahorras {d.ahorro}€ por ser tú</div>
              )}
              <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', marginBottom: 4 }}>{d.storage}</div>

              {/* RF07-1 — LCD deshabilitado con mensaje */}
              {fuera && (
                <div style={{ fontSize: 9, color: 'var(--color-red-dark)', fontWeight: 600, marginBottom: 4, lineHeight: 1.4 }}>
                  Fuera de límite de crédito (LCD: {limiteCredito}€)
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                <span className={`pill ${d.stock ? 'pill-ok' : 'pill-err'}`} style={{ fontSize: 9 }}>
                  {d.stock ? 'Stock' : 'Agotado'}
                </span>
                <button onClick={e => { e.stopPropagation(); toggleComparar(d) }}
                  style={{ fontSize: 9, padding: '2px 6px', borderRadius: 'var(--border-radius-full)', border: `1px solid ${enComp ? 'var(--color-blue)' : 'var(--color-border-secondary)'}`, background: enComp ? 'var(--color-blue-light)' : 'none', color: enComp ? 'var(--color-blue-dark)' : 'var(--color-text-tertiary)', cursor: 'pointer', fontWeight: enComp ? 600 : 400 }}>
                  {enComp ? '✓ Comp.' : 'Comparar'}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── MODAL DETALLE (RF03-2 + RF04-1 + RF07-1 + RF08-2) ── */}
      {seleccionado && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}
          onClick={() => { setSeleccionado(null); setMostrarVentaConsciente(false) }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: 'var(--color-background-primary)', borderRadius: 'var(--border-radius-xl)', padding: 24, width: 500, boxShadow: 'var(--shadow-lg)', maxHeight: '90vh', overflow: 'auto' }}>

            {/* Cabecera */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
              <div style={{ fontSize: 52 }}>{seleccionado.imagen}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginBottom: 2 }}>{seleccionado.marca}</div>
                <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>{seleccionado.modelo}</div>
                <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{seleccionado.storage} · {seleccionado.pantalla}</div>
                <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 2 }}>Colores: {seleccionado.color.join(', ')}</div>
                {/* RF04-1: precio personalizado vs PVPR */}
                {(() => {
                  const pvpr = pvprDispositivos[seleccionado.id] || seleccionado.precioLibre
                  const ahorro = pvpr - seleccionado.precioLibre
                  return ahorro > 0 ? (
                    <div style={{ marginTop: 6, padding: '4px 8px', borderRadius: 'var(--border-radius-sm)', background: 'var(--color-green-light)', border: '1px solid var(--color-green-border)', display: 'inline-block' }}>
                      <span style={{ fontSize: 10, color: 'var(--color-green-dark)', fontWeight: 700 }}>
                        💰 Ahorras {ahorro}€ por ser tú · PVPR: {pvpr}€ → Tu precio: {seleccionado.precioLibre}€
                      </span>
                    </div>
                  ) : null
                })()}
              </div>
            </div>

            {/* RF04-2 — Modalidades unificadas */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              {([
                { id: 'mensual', label: `Financiado ${seleccionado.mesesFinanciacion}m`, precio: `${seleccionado.precioMensual.toFixed(2)}€/mes`, desc: 'Cuota mensual' },
                { id: 'libre', label: 'Pago único', precio: `${seleccionado.precioLibre}€`, desc: 'Sin cuotas' },
                { id: 'rtr', label: 'Rent-to-rent', precio: `${(seleccionado.precioMensual * 0.7).toFixed(2)}€/mes`, desc: 'Alquiler mensual' },
              ] as const).map(m => (
                <button key={m.id} onClick={() => setModalidadDetalle(m.id)}
                  style={{ flex: 1, padding: '10px 6px', border: `1.5px solid ${modalidadDetalle === m.id ? 'var(--color-blue)' : 'var(--color-border-secondary)'}`, borderRadius: 'var(--border-radius-md)', background: modalidadDetalle === m.id ? 'var(--color-blue-light)' : 'var(--color-background-secondary)', cursor: 'pointer', textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: 'var(--color-text-secondary)', marginBottom: 3 }}>{m.label}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-mono)', color: modalidadDetalle === m.id ? 'var(--color-blue-dark)' : 'var(--color-text-primary)' }}>{m.precio}</div>
                  <div style={{ fontSize: 9, color: 'var(--color-text-tertiary)', marginTop: 2 }}>{m.desc}</div>
                </button>
              ))}
            </div>

            {modalidadDetalle === 'rtr' && (
              <div className="fade-in" style={{ marginBottom: 12, padding: '8px 10px', borderRadius: 'var(--border-radius-md)', background: 'var(--color-purple-light)', border: '1px solid var(--color-purple-border)', fontSize: 11, color: 'var(--color-purple)' }}>
                Modalidad rent-to-rent: el dispositivo vuelve al operador al finalizar el contrato. Sin compromiso de compra.
              </div>
            )}

            {/* RF08-2 — Opciones post-selección: seguro y recompra */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Servicios adicionales
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {/* Seguro móvil */}
                <div onClick={() => setSeguroSeleccionado(!seguroSeleccionado)}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', border: `1.5px solid ${seguroSeleccionado ? 'var(--color-blue)' : 'var(--color-border-tertiary)'}`, borderRadius: 'var(--border-radius-md)', background: seguroSeleccionado ? 'var(--color-blue-light)' : 'transparent', cursor: 'pointer', transition: 'all 0.1s' }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: seguroSeleccionado ? 'var(--color-blue-dark)' : 'var(--color-text-primary)' }}>
                      🛡 Seguro móvil
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)' }}>Rotura, robo y daños accidentales · Recomendado</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-mono)', color: seguroSeleccionado ? 'var(--color-blue-dark)' : 'var(--color-text-primary)' }}>+5,99€/mes</span>
                    <div style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${seguroSeleccionado ? 'var(--color-blue)' : 'var(--color-border-secondary)'}`, background: seguroSeleccionado ? 'var(--color-blue)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {seguroSeleccionado && <span style={{ fontSize: 10, color: '#fff', fontWeight: 700 }}>✓</span>}
                    </div>
                  </div>
                </div>

                {/* Recompra */}
                <div onClick={() => setRecompraSeleccionada(!recompraSeleccionada)}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', border: `1.5px solid ${recompraSeleccionada ? 'var(--color-green-border)' : 'var(--color-border-tertiary)'}`, borderRadius: 'var(--border-radius-md)', background: recompraSeleccionada ? 'var(--color-green-light)' : 'transparent', cursor: 'pointer', transition: 'all 0.1s' }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: recompraSeleccionada ? 'var(--color-green-dark)' : 'var(--color-text-primary)' }}>
                      ♻ Recompra de terminal actual
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)' }}>Valoración y descuento por entrega del terminal usado</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-mono)', color: recompraSeleccionada ? 'var(--color-green-dark)' : 'var(--color-text-primary)' }}>
                      {recompraSeleccionada ? '−50€' : 'Valorar'}
                    </span>
                    <div style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${recompraSeleccionada ? 'var(--color-green-border)' : 'var(--color-border-secondary)'}`, background: recompraSeleccionada ? 'var(--color-green-border)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {recompraSeleccionada && <span style={{ fontSize: 10, color: '#fff', fontWeight: 700 }}>✓</span>}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* RF06-1 — Cross-selling contextual tras seleccionar */}
            {packsRelacionados[seleccionado.id] && (
              <div style={{ marginBottom: 14, padding: '10px 12px', borderRadius: 'var(--border-radius-md)', background: 'var(--color-amber-light)', border: '1px solid var(--color-amber-border)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-amber-dark)', marginBottom: 6 }}>🎁 Oferta combinada disponible</div>
                {packsRelacionados[seleccionado.id].map((p, i) => (
                  <div key={i} style={{ fontSize: 11, color: 'var(--color-amber-dark)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                    <span>{p.icono}</span>
                    <span>Añade <strong>{p.nombre}</strong> con <strong>{p.descuento}€ de descuento</strong> al comprar este dispositivo</span>
                  </div>
                ))}
              </div>
            )}

            {/* RF07-1 — GDR si fuera de LCD */}
            {fueraLCD(seleccionado) && (
              <div style={{ marginBottom: 14, padding: '10px 12px', borderRadius: 'var(--border-radius-md)', background: 'var(--color-red-light)', border: '1px solid var(--color-red-border)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-red-dark)', marginBottom: 4 }}>
                  ⚠ Dispositivo fuera del límite de crédito (LCD: {limiteCredito}€)
                </div>
                <div style={{ fontSize: 11, color: 'var(--color-red-dark)', marginBottom: 8 }}>
                  El cliente puede solicitar una ampliación de crédito (GDR) para acceder a este dispositivo.
                </div>
                {gdrSolicitado ? (
                  <div className="alert alert-ok fade-in"><span>✓</span><div style={{ fontSize: 11 }}>Solicitud GDR enviada — el cliente recibirá respuesta en 24-48h</div></div>
                ) : (
                  <button
                    onClick={() => { setSolicitandoGDR(true); setTimeout(() => { setSolicitandoGDR(false); setGdrSolicitado(true) }, 1800) }}
                    disabled={solicitandoGDR}
                    className="btn-danger"
                    style={{ width: '100%', justifyContent: 'center', fontSize: 11 }}>
                    {solicitandoGDR ? <><span className="spinner spinner-sm" /> Solicitando GDR...</> : '📋 Solicitar ampliación de crédito (GDR)'}
                  </button>
                )}
              </div>
            )}

            {seleccionado.ahorro && (
              <div className="alert alert-ok" style={{ marginBottom: 14 }}>
                <span>🎉</span>
                <span style={{ fontWeight: 600 }}>Ahorras {seleccionado.ahorro}€ por ser cliente — ventaja personal aplicada</span>
              </div>
            )}

            {/* RF09-1 + adaptación cliente nuevo/existente — Venta consciente */}
            {mostrarVentaConsciente && (
              <div className="fade-in" style={{ marginBottom: 12, padding: '10px 12px', borderRadius: 'var(--border-radius-md)', background: 'var(--color-green-light)', border: '1px solid var(--color-green-border)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-green-dark)', marginBottom: 8 }}>✓ Información para el cliente — venta consciente</div>

                {esClienteExistente && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--color-green-dark)', marginBottom: 3 }}>
                      <span>Cuota actual parque</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{parqueActualPrecio.toFixed(2)}€/mes</span>
                    </div>
                  </>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--color-green-dark)', marginBottom: 3 }}>
                  <span>+ {seleccionado.marca} {seleccionado.modelo} ({modalidadDetalle === 'libre' ? 'pago único' : modalidadDetalle === 'rtr' ? 'rent-to-rent' : `${seleccionado.mesesFinanciacion} cuotas`})</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                    {modalidadDetalle === 'libre' ? `${seleccionado.precioLibre}€` : `+${(modalidadDetalle === 'rtr' ? seleccionado.precioMensual * 0.7 : seleccionado.precioMensual).toFixed(2)}€/mes`}
                  </span>
                </div>

                {seguroSeleccionado && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--color-green-dark)', marginBottom: 3 }}>
                    <span>+ Seguro móvil</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>+5,99€/mes</span>
                  </div>
                )}

                {recompraSeleccionada && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--color-green-dark)', marginBottom: 3 }}>
                    <span>− Descuento recompra terminal</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--color-green)' }}>−50,00€</span>
                  </div>
                )}

                {esClienteExistente && modalidadDetalle !== 'libre' && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700, color: 'var(--color-green-dark)', borderTop: '1px solid var(--color-green-border)', paddingTop: 6, marginTop: 6 }}>
                    <span>Nueva cuota total</span>
                    <span style={{ fontFamily: 'var(--font-mono)' }}>
                      {((parqueActualPrecio + (modalidadDetalle === 'rtr' ? seleccionado.precioMensual * 0.7 : seleccionado.precioMensual) + (seguroSeleccionado ? 5.99 : 0)) * 1.21).toFixed(2)}€/mes
                    </span>
                  </div>
                )}

                {!esClienteExistente && modalidadDetalle !== 'libre' && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700, color: 'var(--color-green-dark)', borderTop: '1px solid var(--color-green-border)', paddingTop: 6, marginTop: 6 }}>
                    <span>Cuota dispositivo (c/IVA)</span>
                    <span style={{ fontFamily: 'var(--font-mono)' }}>
                      {((modalidadDetalle === 'rtr' ? seleccionado.precioMensual * 0.7 : seleccionado.precioMensual) * 1.21 + (seguroSeleccionado ? 5.99 : 0)).toFixed(2)}€/mes
                    </span>
                  </div>
                )}

                {/* RF09-1 — Guión verbalización */}
                <div style={{ marginTop: 10, padding: '8px 10px', borderRadius: 'var(--border-radius-sm)', background: 'rgba(255,255,255,0.6)', border: '1px solid var(--color-green-border)', fontSize: 11, color: 'var(--color-green-dark)', fontStyle: 'italic', lineHeight: 1.6 }}>
                  💬 «Estás {modalidadDetalle === 'libre' ? 'comprando' : `contratando`} un <strong>{seleccionado.marca} {seleccionado.modelo}</strong> por <strong>{modalidadDetalle === 'libre' ? `${seleccionado.precioLibre}€ al contado` : `${(modalidadDetalle === 'rtr' ? seleccionado.precioMensual * 0.7 : seleccionado.precioMensual).toFixed(2)}€/mes durante ${seleccionado.mesesFinanciacion} meses`}</strong>{seguroSeleccionado ? ', con seguro incluido' : ''}. Lo recibirás en tu domicilio en 2-3 días hábiles.»
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => { setSeleccionado(null); setMostrarVentaConsciente(false) }} className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>
                ← Volver
              </button>
              {!fueraLCD(seleccionado) && (
                !mostrarVentaConsciente ? (
                  <button onClick={() => setMostrarVentaConsciente(true)} className="btn-primary" style={{ flex: 2, justifyContent: 'center' }}>
                    Ver resumen →
                  </button>
                ) : (
                  <button onClick={() => addCesta(seleccionado)} className="btn-primary" style={{ flex: 2, justifyContent: 'center' }}>
                    ✓ {modoNuevoCliente ? 'Seleccionar dispositivo' : 'Confirmar y añadir a cesta'}
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}