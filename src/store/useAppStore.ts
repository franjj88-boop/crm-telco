import { create } from 'zustand'
import type { Cliente, Canal, PerfilAgente, Notificacion } from '../types'

interface AppStore {
  // Cliente
  clienteActivo: Cliente | null
  setClienteActivo: (cliente: Cliente | null) => void

  // Canal y perfil
  canalActual: Canal
  setCanalActual: (canal: Canal) => void
  perfilAgente: PerfilAgente
  setPerfilAgente: (perfil: PerfilAgente) => void

  // Llamada
  tiempoLlamada: number
  llamadaActiva: boolean
  iniciarLlamada: () => void
  finalizarLlamada: () => void
  _timerInterval: ReturnType<typeof setInterval> | null

  // Módulo activo
  moduloActivo: string
  setModuloActivo: (modulo: string) => void

  // Notas
  notas: string
  setNotas: (notas: string) => void

  // Notificaciones
  notificaciones: Notificacion[]
  addNotificacion: (n: Omit<Notificacion, 'id' | 'timestamp' | 'leida'>) => void
  marcarLeida: (id: string) => void
  clearNotificaciones: () => void
}

export const useAppStore = create<AppStore>((set, get) => ({
  clienteActivo: null,
  setClienteActivo: (cliente) => set({ clienteActivo: cliente }),

  canalActual: 'telefono',
  setCanalActual: (canal) => set({ canalActual: canal }),

  perfilAgente: '1004',
  setPerfilAgente: (perfil) => set({ perfilAgente: perfil }),

  tiempoLlamada: 0,
  llamadaActiva: false,
  _timerInterval: null,

  iniciarLlamada: () => {
    const interval = setInterval(() => {
      set(state => ({ tiempoLlamada: state.tiempoLlamada + 1 }))
    }, 1000)
    set({ llamadaActiva: true, tiempoLlamada: 0, _timerInterval: interval })
  },

  finalizarLlamada: () => {
    const { _timerInterval } = get()
    if (_timerInterval) clearInterval(_timerInterval)
    set({ llamadaActiva: false, tiempoLlamada: 0, _timerInterval: null })
  },

  moduloActivo: 'home',
  setModuloActivo: (modulo) => set({ moduloActivo: modulo }),

  notas: '',
  setNotas: (notas) => set({ notas }),

  notificaciones: [],
  addNotificacion: (n) => set(state => ({
    notificaciones: [
      {
        ...n,
        id: Math.random().toString(36).slice(2),
        timestamp: Date.now(),
        leida: false,
      },
      ...state.notificaciones,
    ]
  })),
  marcarLeida: (id) => set(state => ({
    notificaciones: state.notificaciones.map(n =>
      n.id === id ? { ...n, leida: true } : n
    )
  })),
  clearNotificaciones: () => set({ notificaciones: [] }),
}))