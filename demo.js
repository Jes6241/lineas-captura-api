/**
 * Script de demostración de líneas de captura
 * Ejecutar con: node demo.js
 */

const { 
  generarCodigoLinea, 
  formatearLineaCaptura, 
  desglosarLinea,
  validarLinea 
} = require('./services/generador');

console.log('========================================');
console.log('   DEMO: LÍNEAS DE CAPTURA BANCARIAS');
console.log('========================================\n');

// Ejemplo 1: Multa de tránsito con placa
console.log('📋 Ejemplo 1: Multa de tránsito con referencia de placa\n');

const linea1 = generarCodigoLinea({
  entidad: '09',        // CDMX
  concepto: '01',       // Multa tránsito
  referencia: '12345678',
  monto: 1500.00,
  diasVigencia: 15
});

console.log('Línea generada:');
console.log('  Sin formato:', linea1);
console.log('  Formateada: ', formatearLineaCaptura(linea1));

const desglose1 = desglosarLinea(linea1);
console.log('\nDesglose de componentes:');
console.log('┌────────────────────────────────────────────────┐');
console.log('│ Campo 09 (Entidad):       ', desglose1.entidad, '(CDMX)         │');
console.log('│ Campo 01 (Concepto):      ', desglose1.concepto, '(Multa tránsito)│');
console.log('│ Referencia:               ', desglose1.referencia, '           │');
console.log('│ Importe:                  $' + desglose1.importe.toFixed(2) + '          │');
console.log('│ Importe en centavos:      ', desglose1.importeCentavos + '         │');
console.log('│ Vigencia:                 ', desglose1.vigencia, '           │');
console.log('│ Fecha de vigencia:        ', desglose1.vigenciaFecha, '      │');
console.log('│ Dígito verificador MOD11: ', desglose1.verificador, '                │');
console.log('└────────────────────────────────────────────────┘');

// Ejemplo 2: Otra multa con referencia diferente
console.log('\n\n📋 Ejemplo 2: Otra multa con diferente monto\n');

const linea2 = generarCodigoLinea({
  entidad: '09',
  concepto: '01',
  referencia: 'ABC123',
  monto: 2500.50,
  diasVigencia: 30
});

console.log('Línea formateada:', formatearLineaCaptura(linea2));

const desglose2 = desglosarLinea(linea2);
console.log('Importe: $' + desglose2.importe.toFixed(2));
console.log('Vigencia:', desglose2.vigenciaFecha);

// Ejemplo 3: Validación de línea
console.log('\n\n📋 Ejemplo 3: Validación de línea de captura\n');

const validacion = validarLinea(linea1);
console.log('¿Es válida?:', validacion.valido ? '✅ SÍ' : '❌ NO');

// Probar con línea inválida
const lineaInvalida = '09011234567800150000260212 8'; // verificador incorrecto
const validacion2 = validarLinea(lineaInvalida);
console.log('Línea con verificador incorrecto:', validacion2.valido ? '✅ SÍ' : '❌ NO');
if (!validacion2.valido) {
  console.log('Error:', validacion2.error);
}

console.log('\n========================================');
console.log('   Formato compatible con imagen');
console.log('========================================\n');

// Generar una línea similar a la imagen
const lineaFinal = generarCodigoLinea({
  entidad: '09',
  concepto: '01',
  referencia: '12345678',
  monto: 1500.00,
  diasVigencia: 15
});

console.log('Línea de captura:', formatearLineaCaptura(lineaFinal));
console.log('\nCampos individuales:');
const d = desglosarLinea(lineaFinal);
console.log('  09:       Código de entidad (CDMX)');
console.log('  01:       Concepto (Multa tránsito)');
console.log('  ' + d.referencia + ': Referencia (basada en placa)');
console.log('  ' + d.importeCentavos + ': Importe en centavos');
console.log('  ' + d.vigencia + ':   Vigencia YYMMDD');
console.log('  ' + d.verificador + ':        Dígito verificador MOD 11');

console.log('\n========================================\n');
