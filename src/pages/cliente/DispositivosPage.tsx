import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { catalogoDispositivos } from '../../data/mockData'
import { useAppStore } from '../../store/useAppStore'
import type { Dispositivo } from '../../types'

type Categoria = 'todos' | 'smartphone' | 'tablet' | 'tv' | 'wearable'
type Orden = 'recomendado' | 'precio_asc' | 'precio_desc'

export function DispositivosPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { clienteActivo } = useAppStore()
  const [categoria, setCategoria] = useState<Categoria>('todos')
  const [orden, setOrden] = useState<Orden>('recomendado')
  const [busqueda, setBusqueda] = useState('')
  const [seleccionado, setSeleccionado] = useState<Dispositivo | null>(null)
  const [comparando, setComparando] = useState<Dispositivo[]>([])
  const [enCesta, setEnCesta] = useState<Dispositivo[]>([])

  const [firmado, setFirmado] = useState(false)
  const [firmando, setFirmando] = useState(false)

  if (!clienteActivo) return null

  const limiteCredito = clienteActivo.riesgoScore === 'alto' ? 500 : 2000
  const [mostrarVentaConsciente, setMostrarVentaConsciente] = useState(false)
  const [modalidadDetalle, setModalidadDetalle] = useState<'mensual' | 'libre' | 'rtr'>('mensual')

  // NBA — dispositivos recomendados según perfil cliente
  const dispositivosNBA = catalogoDispositivos
    .filter(d => {
      if (clienteActivo.riesgoScore === 'alto') return d.precioLibre <= 500
      if (clienteActivo.productos.some(p => p.tipo === 'movil')) return d.destacado
      return true
    })
    .map(d => d.id)

  const filtrados = catalogoDispositivos
    .filter(d => categoria === 'todos' || d.categoria === categoria)
    .filter(d => !busqueda || d.marca.toLowerCase().includes(busqueda.toLowerCase()) || d.modelo.toLowerCase().includes(busqueda.toLowerCase()))
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
    if (!enCesta.find(c => c.id === d.id)) setEnCesta([...enCesta, d])
    setSeleccionado(null)
  }

  const removeCesta = (d: Dispositivo) => {
    setEnCesta(enCesta.filter(c => c.id !== d.id))
  }

  const fueraLCD = (d: Dispositivo) => d.precioLibre > limiteCredito

  const totalCesta = enCesta.reduce((a, d) => a + d.precioMensual, 0)

  const firmar = () => {
    setFirmando(true)
    setTimeout(() => { setFirmando(false); setFirmado(true) }, 2000)
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>Escaparate de dispositivos</div>
          <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 2 }}>
            Top 10 personalizado · Filtros · Comparativa · LCD: {limiteCredito}€
          </div>
        </div>

        {/* Cesta */}
        {enCesta.length > 0 && !firmado && (
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

      {/* Filtros */}
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
            <button
              key={c}
              onClick={() => setCategoria(c)}
              style={{ padding: '4px 10px', borderRadius: 4, fontSize: 11, border: 'none', cursor: 'pointer', background: categoria === c ? 'var(--color-background-primary)' : 'none', color: categoria === c ? 'var(--color-text-primary)' : 'var(--color-text-secondary)', fontWeight: categoria === c ? 600 : 400, boxShadow: categoria === c ? 'var(--shadow-sm)' : 'none' }}>
              {c.charAt(0).toUpperCase() + c.slice(1)}
            </button>
          ))}
        </div>

        <select
          value={orden}
          onChange={e => setOrden(e.target.value as Orden)}
          className="select"
          style={{ width: 'auto' }}>
          <option value="recomendado">Recomendado</option>
          <option value="precio_asc">Precio: menor a mayor</option>
          <option value="precio_desc">Precio: mayor a menor</option>
        </select>

        {comparando.length >= 2 && (
          <button
            onClick={() => {}}
            className="btn-primary"
            style={{ fontSize: 11, height: 32 }}>
            Comparar ({comparando.length}) →
          </button>
        )}

        {comparando.length > 0 && (
          <button onClick={() => setComparando([])} className="btn-secondary" style={{ fontSize: 11, height: 32 }}>
            Limpiar comparativa
          </button>
        )}
      </div>

      {/* Comparativa */}
      {comparando.length >= 2 && (
        <div className="card">
          <div className="card-title">
            Comparativa
            <button onClick={() => setComparando([])} className="card-title-link">Cerrar</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${comparando.length}, 1fr)`, gap: 16 }}>
            {comparando.map(d => (
              <div key={d.id} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>{d.imagen}</div>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>{d.marca} {d.modelo}</div>
                {[
                  { label: 'Precio libre', val: `${d.precioLibre}€` },
                  { label: 'Financiado 24m', val: `${d.precioMensual.toFixed(2)}€/mes` },
                  { label: 'Almacenamiento', val: d.storage },
                  { label: 'Pantalla', val: d.pantalla || '—' },
                  { label: 'Stock', val: d.stock ? '✓ Disponible' : '✗ Agotado' },
                ].map(row => (
                  <div key={row.label} className="table-row" style={{ textAlign: 'left' }}>
                    <span className="table-row-label">{row.label}</span>
                    <span className="table-row-value">{row.val}</span>
                  </div>
                ))}
                <button
                  onClick={() => addCesta(d)}
                  disabled={!d.stock || fueraLCD(d)}
                  className="btn-primary"
                  style={{ width: '100%', justifyContent: 'center', marginTop: 10, fontSize: 11 }}>
                  + Añadir a cesta
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grid de dispositivos */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(165px, 1fr))', gap: 10 }}>
        {filtrados.map(d => {
          const fuera = fueraLCD(d)
          const enComp = !!comparando.find(c => c.id === d.id)
          const enCestaYa = !!enCesta.find(c => c.id === d.id)

          return (
            <div
              key={d.id}
              onClick={() => !fuera && d.stock && setSeleccionado(d)}
              style={{
                background: 'var(--color-background-primary)',
                border: `1px solid ${enCestaYa ? 'var(--color-blue-mid)' : seleccionado?.id === d.id ? 'var(--color-blue-mid)' : 'var(--color-border-tertiary)'}`,
                borderTop: `3px solid ${enCestaYa ? 'var(--color-blue)' : d.destacado && !fuera ? 'var(--color-blue)' : 'transparent'}`,
                borderRadius: 'var(--border-radius-lg)',
                padding: '12px',
                cursor: fuera || !d.stock ? 'not-allowed' : 'pointer',
                opacity: fuera ? 0.55 : 1,
                position: 'relative',
                transition: 'box-shadow 0.15s, transform 0.1s',
                boxShadow: 'var(--shadow-sm)',
              }}
              onMouseEnter={e => { if (!fuera && d.stock) { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateY(-1px)' } }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; e.currentTarget.style.transform = 'translateY(0)' }}
            >
              {/* Badges */}
              {dispositivosNBA.includes(d.id) && !fuera && (
                <div style={{ position: 'absolute', top: 8, right: 8, fontSize: 9, padding: '2px 6px', borderRadius: 'var(--border-radius-full)', background: 'var(--color-blue)', color: '#fff', fontWeight: 700 }}>⭐ NBA</div>
              )}
              {d.destacado && !fuera && !dispositivosNBA.includes(d.id) && (
                <div style={{ position: 'absolute', top: 8, right: 8, fontSize: 9, padding: '2px 6px', borderRadius: 'var(--border-radius-full)', background: 'var(--color-purple)', color: '#fff', fontWeight: 700 }}>TOP</div>
              )}
              {fuera && (
                <div style={{ position: 'absolute', top: 8, right: 8, fontSize: 9, padding: '2px 6px', borderRadius: 'var(--border-radius-full)', background: 'var(--color-red-mid)', color: '#fff', fontWeight: 700 }}>LCD</div>
              )}
              {enCestaYa && (
                <div style={{ position: 'absolute', top: 8, left: 8, fontSize: 9, padding: '2px 6px', borderRadius: 'var(--border-radius-full)', background: 'var(--color-blue)', color: '#fff', fontWeight: 700 }}>✓ En cesta</div>
              )}

              <div style={{ fontSize: 34, textAlign: 'center', marginBottom: 8, marginTop: enCestaYa ? 12 : 0 }}>{d.imagen}</div>
              <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', marginBottom: 1 }}>{d.marca}</div>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>{d.modelo}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-blue)', fontFamily: 'var(--font-mono)' }}>
                {d.precioMensual.toFixed(2)}€
                <span style={{ fontSize: 10, fontWeight: 400, color: 'var(--color-text-tertiary)' }}>/mes</span>
              </div>
              <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', marginBottom: 4 }}>{d.precioLibre}€ precio libre · {d.storage}</div>
              {d.ahorro && (
                <div style={{ fontSize: 10, color: 'var(--color-green-dark)', fontWeight: 600, marginBottom: 4 }}>💰 Ahorras {d.ahorro}€</div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                <span className={`pill ${d.stock ? 'pill-ok' : 'pill-err'}`} style={{ fontSize: 9 }}>
                  {d.stock ? 'Stock' : 'Agotado'}
                </span>
                <button
                  onClick={e => { e.stopPropagation(); toggleComparar(d) }}
                  style={{ fontSize: 9, padding: '2px 6px', borderRadius: 'var(--border-radius-full)', border: `1px solid ${enComp ? 'var(--color-blue)' : 'var(--color-border-secondary)'}`, background: enComp ? 'var(--color-blue-light)' : 'none', color: enComp ? 'var(--color-blue-dark)' : 'var(--color-text-tertiary)', cursor: 'pointer', fontWeight: enComp ? 600 : 400 }}>
                  {enComp ? '✓ Comp.' : 'Comparar'}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal detalle */}
      {seleccionado && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}
          onClick={() => setSeleccionado(null)}>
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: 'var(--color-background-primary)', borderRadius: 'var(--border-radius-xl)', padding: 24, width: 460, boxShadow: 'var(--shadow-lg)', maxHeight: '90vh', overflow: 'auto' }}>

            <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
              <div style={{ fontSize: 52 }}>{seleccionado.imagen}</div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginBottom: 2 }}>{seleccionado.marca}</div>
                <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>{seleccionado.modelo}</div>
                <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>{seleccionado.storage} · {seleccionado.pantalla}</div>
                <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 2 }}>Colores: {seleccionado.color.join(', ')}</div>
              </div>
            </div>

            {/* Modalidades unificadas */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              {([
                { id: 'mensual', label: `Financiado ${seleccionado.mesesFinanciacion}m`, precio: `${seleccionado.precioMensual.toFixed(2)}€/mes`, desc: 'Cuota mensual' },
                { id: 'libre', label: 'Pago único', precio: `${seleccionado.precioLibre}€`, desc: 'Sin cuotas' },
                { id: 'rtr', label: 'Rent-to-rent', precio: `${(seleccionado.precioMensual * 0.7).toFixed(2)}€/mes`, desc: 'Alquiler mensual' },
              ] as const).map(m => (
                <button
                  key={m.id}
                  onClick={() => setModalidadDetalle(m.id)}
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

            {seleccionado.ahorro && (
              <div className="alert alert-ok" style={{ marginBottom: 14 }}>
                <span>🎉</span>
                <span style={{ fontWeight: 600 }}>Ahorras {seleccionado.ahorro}€ por ser cliente — ventaja personal aplicada</span>
              </div>
            )}

            {/* Venta consciente */}
            {mostrarVentaConsciente && (
              <div className="fade-in" style={{ marginBottom: 12, padding: '10px 12px', borderRadius: 'var(--border-radius-md)', background: 'var(--color-green-light)', border: '1px solid var(--color-green-border)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-green-dark)', marginBottom: 6 }}>✓ Resumen venta consciente</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--color-green-dark)', marginBottom: 3 }}>
                  <span>Cuota actual parque</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{clienteActivo.productos.reduce((a, p) => a + (p.precio || 0), 0).toFixed(2)}€/mes</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--color-green-dark)', marginBottom: 3 }}>
                  <span>+ {seleccionado.marca} {seleccionado.modelo}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>+{seleccionado.precioMensual.toFixed(2)}€/mes</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700, color: 'var(--color-green-dark)', borderTop: '1px solid var(--color-green-border)', paddingTop: 6, marginTop: 6 }}>
                  <span>Nueva cuota total</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>{((clienteActivo.productos.reduce((a, p) => a + (p.precio || 0), 0) + seleccionado.precioMensual) * 1.21).toFixed(2)}€/mes</span>
                </div>
              </div>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setSeleccionado(null)} className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>
                Cancelar
              </button>
              {!mostrarVentaConsciente ? (
                <button onClick={() => setMostrarVentaConsciente(true)} className="btn-primary" style={{ flex: 2, justifyContent: 'center' }}>
                  Ver resumen →
                </button>
              ) : (
                <button onClick={() => { addCesta(seleccionado); setMostrarVentaConsciente(false) }} className="btn-primary" style={{ flex: 2, justifyContent: 'center' }}>
                  ✓ Confirmar y añadir a cesta
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}