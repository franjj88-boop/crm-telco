# CRM Telco

## Instalación y arranque

```bash
npm install
npm run dev
```

Abre http://localhost:5173

## Clientes de prueba

| Cliente | DNI | Perfil |
|---|---|---|
| María García | 12345678A | Convergente activo, pedido en vuelo |
| Carlos Ruiz | 87654321B | Deuda vencida, avería bloqueada, Fusión |
| Empresa Técnica SL | B12345678 | Empresarial, 5 líneas, sin incidencias |

## Módulos disponibles

- **Home** — Ficha cliente con alertas IVR, parque, historial omnicanal
- **Facturación** — Historial, detalle, comparativa, simulador
- **Reclamaciones** — Apertura, resumen IA, ARTE
- **Averías** — Diagnóstico guiado, masivas, nivel 2
- **Pedidos** — Timeline, citas, seguimiento
- **Cobros** — Deuda, fraccionamientos, VRU
- **Ventas** — Configurador por ingredientes, NBA, cesta, OTP
- **Dispositivos** — Escaparate Top10, filtros, comparador
- **Retención** — Motor ofertas, baja parcial/total, MLP
- **Nueva Venta** — Wizard 5 pasos para alta de nuevo cliente

## Flujos de prueba recomendados

1. Busca "carlos" → ve las alertas críticas de deuda+avería
2. Busca "maria" → sigue el pedido en vuelo / abre reclamación de roaming
3. Busca "empresa" → explora el módulo de dispositivos y venta
4. Pulsa "+ Nueva venta" → wizard completo de alta sin cliente
