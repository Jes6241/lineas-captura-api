# Líneas de Captura API

Microservicio de generación y gestión de líneas de captura para el sistema de multas de tránsito.

## 🏗️ Arquitectura

Este servicio simula un sistema de tesorería/bancario que genera y valida líneas de captura para pagos.

```
┌─────────────────────┐     ┌──────────────────────┐     ┌─────────────────┐
│   App Multas        │────▶│   API Multas         │────▶│ API Líneas de   │
│   (React Native)    │     │   (Express)          │     │ Captura (este)  │
└─────────────────────┘     └──────────────────────┘     └─────────────────┘
```

## 📋 Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/lineas/generar` | Genera una nueva línea de captura |
| GET | `/api/lineas/disponibles` | Lista líneas disponibles |
| GET | `/api/lineas/:codigo/validar` | Valida una línea para pago |
| POST | `/api/lineas/:codigo/usar` | Marca línea como usada |
| GET | `/api/lineas/:codigo` | Consulta información de línea |
| POST | `/api/lineas/lote` | Genera múltiples líneas |

## 🚀 Instalación

```bash
# Clonar repositorio
git clone https://github.com/tu-usuario/lineas-captura-api.git
cd lineas-captura-api

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales de Supabase

# Ejecutar en desarrollo
npm run dev

# Ejecutar en producción
npm start
```

## 🗄️ Base de Datos

Ejecuta el archivo `database/schema.sql` en tu proyecto de Supabase para crear la tabla necesaria.

## 📝 Formato de Línea de Captura

```
AAAA-MMDD-XXXXXX-VV
│    │    │      └── Dígito verificador (módulo 97)
│    │    └── Número secuencial (6 dígitos)
│    └── Mes y día (4 dígitos)
└── Año (4 dígitos)

Ejemplo: 2026-0111-847392-45
```

## 🔧 Uso desde API de Multas

```javascript
// Al crear una multa, solicitar línea de captura:
const response = await fetch('https://lineas-captura-api.onrender.com/api/lineas/generar', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    monto: 1684.00,
    concepto: 'Multa de tránsito - Folio: RT0012345',
    referencia_externa: 'RT0012345' // folio de la multa
  })
});

const { linea } = await response.json();
// linea.codigo = "2026-0111-847392-45"
// linea.fecha_vencimiento = "2026-01-30"
```

## 🌐 Deploy en Render

1. Crear nuevo Web Service en Render
2. Conectar con repositorio de GitHub
3. Configurar:
   - Build Command: `npm install`
   - Start Command: `npm start`
4. Agregar variables de entorno (SUPABASE_URL, SUPABASE_SERVICE_KEY)

## 📄 Licencia

ISC
