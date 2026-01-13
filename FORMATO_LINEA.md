# 🏦 Formato de Línea de Captura Bancaria

Tu API ahora genera líneas de captura en el formato bancario estándar mexicano.

## 📋 Formato de la Línea de Captura

```
09 01 12345678 00150000 260212 7
```

### Estructura de 27 dígitos:

| Campo | Posición | Longitud | Descripción | Ejemplo |
|-------|----------|----------|-------------|---------|
| **Campo 09** | 1-2 | 2 dígitos | Código de entidad (CDMX) | `09` |
| **Campo 01** | 3-4 | 2 dígitos | Concepto (Multa tránsito) | `01` |
| **Referencia** | 5-12 | 8 dígitos | Basada en placa/folio | `12345678` |
| **Importe** | 13-20 | 8 dígitos | Importe en centavos | `00150000` ($1,500.00) |
| **Vigencia** | 21-26 | 6 dígitos | Fecha YYMMDD | `260212` (2026-02-12) |
| **Verificador** | 27 | 1 dígito | Dígito verificador MOD 11 | `7` |

## 🚀 Uso del API

### Generar Línea de Captura

```bash
curl -X POST http://localhost:3001/api/lineas/generar \
  -H "Content-Type: application/json" \
  -d '{
    "monto": 1500.00,
    "concepto": "multa tránsito",
    "referencia_externa": "ABC123"
  }'
```

### Respuesta

```json
{
  "success": true,
  "linea": {
    "codigo": "090100001150001500002601287",
    "codigo_formateado": "09 01 00001150 00150000 260128 7",
    "monto": 1500,
    "concepto": "multa tránsito",
    "referencia_externa": "ABC123",
    "fecha_generacion": "2026-01-13T12:00:00.000Z",
    "fecha_vencimiento": "2026-01-28",
    "estado": "disponible",
    "desglose": {
      "entidad": "09",
      "concepto": "01",
      "referencia": "00001150",
      "importe": 1500,
      "importeCentavos": 150000,
      "vigencia": "260128",
      "vigenciaFecha": "2026-01-28",
      "verificador": "7",
      "lineaFormateada": "09 01 00001150 00150000 260128 7"
    }
  }
}
```

## 📝 Códigos de Concepto

| Código | Descripción |
|--------|-------------|
| `01` | Multa de tránsito |
| `02` | Tenencia vehicular |
| `03` | Refrendo |
| `04` | Predial |

## 🧪 Probar el Sistema

Ejecuta el script de demostración:

```bash
node demo.js
```

## 🔧 Algoritmo de Verificación

El dígito verificador se calcula usando el algoritmo **MOD 11** con pesos cíclicos:

```javascript
Pesos: [3, 7, 1]
Proceso:
1. Multiplicar cada dígito por su peso cíclico
2. Sumar todos los productos
3. Calcular: 11 - (suma % 11)
4. Si el resultado es 10, usar 0
```

## 📖 Ejemplo de Uso en Código

```javascript
const { generarCodigoLinea, formatearLineaCaptura, desglosarLinea } = require('./services/generador');

// Generar línea
const linea = generarCodigoLinea({
  entidad: '09',           // CDMX
  concepto: '01',          // Multa tránsito
  referencia: '12345678',  // Placa o folio
  monto: 1500.00,          // Monto en pesos
  diasVigencia: 15         // Días de vigencia
});

console.log('Línea:', linea);
// Output: 090100001932001500002601287

console.log('Formateada:', formatearLineaCaptura(linea));
// Output: 09 01 00001932 00150000 260128 7

// Desglosar componentes
const desglose = desglosarLinea(linea);
console.log('Importe:', desglose.importe);        // 1500.00
console.log('Vigencia:', desglose.vigenciaFecha); // 2026-01-28
```

## ✅ Características

- ✨ Formato bancario estándar mexicano
- 🔒 Dígito verificador MOD 11 para validación
- 📅 Cálculo automático de vigencia
- 🔄 Conversión automática de referencias alfanuméricas
- 💰 Manejo de centavos para precisión monetaria
- 📊 Desglose detallado de componentes
- 🎯 Compatible con sistemas bancarios

## 🌟 Diferencias con el formato anterior

| Aspecto | Formato Anterior | Formato Nuevo |
|---------|-----------------|---------------|
| Longitud | 16 dígitos | 27 dígitos |
| Formato | AAAA-MMDD-XXXXXX-VV | 09 01 RRRRRRRR IIIIIIII YYMMDD V |
| Verificador | Módulo 97 | Módulo 11 |
| Compatibilidad | Genérico | Bancario mexicano |
| Componentes | Fecha + secuencial | Entidad + concepto + referencia + importe + vigencia |

---

Para más información, revisa el código en `services/generador.js`
