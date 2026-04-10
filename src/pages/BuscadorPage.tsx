import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { clientesLista } from '../data/mockData'
import { useAppStore } from '../store/useAppStore'

function matchScore(cliente: typeof clientesLista[0], query: string): number {
  if (!query) return 1
  const q = query.toLowerCase().replace(/\s/g, '')
  const campos = [
    cliente.nombre.toLowerCase(),
    cliente.dni.toLowerCase(),
    cliente.telefono.replace(/\s/g, ''),
    cliente.direccion.toLowerCase(),
    cliente.id.toLowerCase(),
    ...cliente.lineas.map(l => l.replace(/\s/g, '')),
  ]
  for (const campo of campos) {
    if (campo.replace(/\s/g, '').includes(q)) return 100
  }
  // Fuzzy parcial
  let best = 0
  for (const campo of campos) {
    let hits = 0
    for (const char of q) {
      if (campo.includes(char)) hits++
    }
    const score = Math.round((hits / q.length) * 60)
    if (score > best) best = score
  }
  return best
}

export function BuscadorPage() {
  const navigate = useNavigate()
  const { setCanalActual, setPerfilAgente } = useAppStore()
  const [query, setQuery] = useState('')
  const [canalSel, setCanalSel] = useState('telefono')
  const [perfilSel, setPerfilSel] = useState('1004')

  const resultados = clientesLista
    .map(c => ({ ...c, score: matchScore(c, query) }))
    .filter(c => c.score > 30)
    .sort((a, b) => b.score - a.score)

  const irACliente = (id: string) => {
    setCanalActual(canalSel as any)
    setPerfilAgente(perfilSel as any)
    navigate(`/cliente/${id}/home`)
  }

  const estadoColor = (s: string) => {
    if (s === 'critico') return { dot: 'status-dot-err', pill: 'pill-err', label: '⚠ Crítico' }
    if (s === 'en_riesgo') return { dot: 'status-dot-warn', pill: 'pill-warn', label: '⚡ En riesgo' }
    return { dot: 'status-dot-ok', pill: 'pill-ok', label: '✓ OK' }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-background-tertiary)', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{ background: 'var(--color-background-primary)', borderBottom: '1px solid var(--color-border-tertiary)', padding: '0 24px', height: 52, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-blue)' }} />
          <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--color-text-primary)' }}>CRM Telco</span>
        </div>
        <div style={{ width: 1, height: 18, background: 'var(--color-border-secondary)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--color-green)' }}>
          <span className="status-dot status-dot-ok" />
          Agente conectado
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select
            value={canalSel}
            onChange={e => setCanalSel(e.target.value)}
            style={{ height: 30, padding: '0 24px 0 8px', fontSize: 11, border: '1px solid var(--color-border-secondary)', borderRadius: 'var(--border-radius-md)', background: 'var(--color-background-secondary)', color: 'var(--color-text-primary)', cursor: 'pointer', appearance: 'none', backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 6px center' }}>
            <option value="telefono">📞 Teléfono</option>
            <option value="tienda">🏪 Tienda</option>
            <option value="chat">💬 Chat</option>
            <option value="whatsapp">📲 WhatsApp</option>
          </select>
          <select
            value={perfilSel}
            onChange={e => setPerfilSel(e.target.value)}
            style={{ height: 30, padding: '0 24px 0 8px', fontSize: 11, border: '1px solid var(--color-border-secondary)', borderRadius: 'var(--border-radius-md)', background: 'var(--color-background-secondary)', color: 'var(--color-text-primary)', cursor: 'pointer', appearance: 'none', backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%236B7280' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 6px center' }}>
            <option value="1004">👤 Agente 1004</option>
            <option value="tienda">🏪 Agente Tienda</option>
            <option value="cobros">💳 Especialista Cobros</option>
            <option value="backoffice">🖥 Backoffice</option>
          </select>
          <button
            onClick={() => navigate('/nueva-venta')}
            className="btn-primary"
            style={{ height: 30, fontSize: 11 }}>
            + Nueva venta
          </button>
        </div>
      </div>

      {/* Buscador central */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 24px 24px' }}>
        <div style={{ width: '100%', maxWidth: 640 }}>

          {/* Título */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 8 }}>
              Identificación de cliente
            </div>
            <div style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>
              Busca por nombre, DNI, teléfono, línea móvil o dirección
            </div>
          </div>

          {/* Input búsqueda */}
          <div style={{ position: 'relative', marginBottom: 24 }}>
            <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: 'var(--color-text-tertiary)' }}>🔍</div>
            <input
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Escribe nombre, DNI, teléfono o número de línea..."
              style={{ width: '100%', height: 52, padding: '0 16px 0 44px', fontSize: 15, border: '2px solid var(--color-border-secondary)', borderRadius: 'var(--border-radius-lg)', background: 'var(--color-background-primary)', color: 'var(--color-text-primary)', fontFamily: 'var(--font-sans)', boxShadow: 'var(--shadow-md)', transition: 'border-color 0.15s, box-shadow 0.15s', outline: 'none' }}
              onFocus={e => { e.target.style.borderColor = 'var(--color-blue-mid)'; e.target.style.boxShadow = '0 0 0 4px var(--color-blue-light)' }}
              onBlur={e => { e.target.style.borderColor = 'var(--color-border-secondary)'; e.target.style.boxShadow = 'var(--shadow-md)' }}
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: 'var(--color-text-tertiary)' }}>
                ✕
              </button>
            )}
          </div>

          {/* Resultados */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {resultados.map(c => {
              const est = estadoColor(c.satisfaccionRiesgo)
              return (
                <div
                  key={c.id}
                  onClick={() => irACliente(c.id)}
                  style={{ background: 'var(--color-background-primary)', border: `1px solid ${c.satisfaccionRiesgo === 'critico' ? 'var(--color-red-border)' : 'var(--color-border-tertiary)'}`, borderLeft: `4px solid ${c.satisfaccionRiesgo === 'critico' ? 'var(--color-red-mid)' : c.satisfaccionRiesgo === 'en_riesgo' ? 'var(--color-amber-mid)' : 'var(--color-green-border)'}`, borderRadius: 'var(--border-radius-lg)', padding: '14px 16px', cursor: 'pointer', transition: 'box-shadow 0.15s, transform 0.1s', boxShadow: 'var(--shadow-sm)' }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; e.currentTarget.style.transform = 'translateY(0)' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <div style={{ width: 40, height: 40, borderRadius: '50%', background: c.satisfaccionRiesgo === 'critico' ? 'var(--color-red-mid)' : c.satisfaccionRiesgo === 'en_riesgo' ? 'var(--color-amber-mid)' : 'var(--color-blue)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, flexShrink: 0 }}>
                        {c.nombre.split(' ').map(w => w[0]).slice(0, 2).join('')}
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 3 }}>{c.nombre}</div>
                        <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', display: 'flex', gap: 10 }}>
                          <span>{c.dni}</span>
                          <span>{c.telefono}</span>
                          <span>{c.direccion}</span>
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', marginTop: 3 }}>
                          Líneas: {c.lineas.join(' · ')}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                      <span className={`pill ${est.pill}`} style={{ fontSize: 10 }}>{est.label}</span>
                      <span style={{ fontSize: 10, color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-mono)' }}>{c.id}</span>
                    </div>
                  </div>
                </div>
              )
            })}

            {query && resultados.length === 0 && (
              <div style={{ textAlign: 'center', padding: '32px', color: 'var(--color-text-tertiary)', fontSize: 13 }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>🔍</div>
                No se encontraron clientes para "{query}"
                <div style={{ fontSize: 11, marginTop: 8 }}>Prueba con DNI, número de línea o dirección</div>
              </div>
            )}

            {!query && (
              <div style={{ textAlign: 'center', padding: '16px', color: 'var(--color-text-tertiary)', fontSize: 12 }}>
                {clientesLista.length} clientes disponibles — escribe para filtrar
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}