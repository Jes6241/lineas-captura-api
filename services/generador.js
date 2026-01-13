/**
 * Servicio de generación de líneas de captura
 * Formato bancario mexicano para líneas de captura
 */

// Algoritmo MOD 11 para dígito verificador
const calcularDigitoVerificadorMod11 = (cadena) => {
  const pesos = [3, 7, 1]; // Pesos cíclicos
  let suma = 0;
  
  for (let i = 0; i < cadena.length; i++) {
    const digito = parseInt(cadena[i]);
    const peso = pesos[i % 3];
    suma += digito * peso;
  }
  
  const resto = suma % 11;
  const verificador = resto === 0 ? 0 : 11 - resto;
  
  // Si el resultado es 10, usar 0
  return verificador === 10 ? 0 : verificador;
};

/**
 * Generar línea de captura bancaria
 * Formato: 09 01 RRRRRRRR IIIIIIII YYMMDD V
 * - Campo 09: Código de entidad (2 dígitos)
 * - Campo 01: Concepto (2 dígitos)
 * - RRRRRRRR: Referencia (8 dígitos, basada en placa o identificador)
 * - IIIIIIII: Importe en centavos (8 dígitos)
 * - YYMMDD: Vigencia (6 dígitos)
 * - V: Dígito verificador MOD 11 (1 dígito)
 */
const generarCodigoLinea = (params = {}) => {
  const {
    entidad = '09',           // Código de entidad (CDMX por defecto)
    concepto = '01',          // Concepto: 01 = Multa tránsito
    referencia = null,        // Referencia externa (placa, folio, etc)
    monto = 0,                // Monto en pesos
    diasVigencia = 15         // Días de vigencia
  } = params;
  
  // Campo 09: Código de entidad (2 dígitos)
  const campo09 = entidad.toString().padStart(2, '0').slice(-2);
  
  // Campo 01: Concepto (2 dígitos)
  const campo01 = concepto.toString().padStart(2, '0').slice(-2);
  
  // Referencia: 8 dígitos basados en placa o generado aleatoriamente
  let referenciaNum;
  if (referencia) {
    // Convertir referencia a número (tomar caracteres alfanuméricos)
    const refLimpia = referencia.replace(/[^A-Z0-9]/gi, '').toUpperCase();
    let numRef = 0;
    for (let i = 0; i < refLimpia.length; i++) {
      const char = refLimpia[i];
      numRef += char.charCodeAt(0) * (i + 1);
    }
    referenciaNum = numRef.toString().padStart(8, '0').slice(-8);
  } else {
    referenciaNum = Math.floor(Math.random() * 99999999).toString().padStart(8, '0');
  }
  
  // Importe en centavos: 8 dígitos
  const importeCentavos = Math.round(monto * 100);
  const campoImporte = importeCentavos.toString().padStart(8, '0').slice(-8);
  
  // Vigencia: YYMMDD (6 dígitos)
  const fechaVencimiento = new Date();
  fechaVencimiento.setDate(fechaVencimiento.getDate() + diasVigencia);
  const año = fechaVencimiento.getFullYear().toString().slice(-2);
  const mes = (fechaVencimiento.getMonth() + 1).toString().padStart(2, '0');
  const dia = fechaVencimiento.getDate().toString().padStart(2, '0');
  const vigencia = `${año}${mes}${dia}`;
  
  // Concatenar todos los campos para calcular verificador
  const lineaSinVerificador = `${campo09}${campo01}${referenciaNum}${campoImporte}${vigencia}`;
  
  // Calcular dígito verificador MOD 11
  const verificador = calcularDigitoVerificadorMod11(lineaSinVerificador);
  
  // Línea completa (27 dígitos)
  const lineaCompleta = `${lineaSinVerificador}${verificador}`;
  
  return lineaCompleta;
};

// Validar formato y dígito verificador de una línea
const validarLinea = (codigo) => {
  // Quitar espacios y guiones
  const limpio = codigo.replace(/[\s-]/g, '');
  
  if (limpio.length !== 27) {
    return { valido: false, error: 'Longitud incorrecta (debe ser 27 dígitos)' };
  }
  
  if (!/^\d+$/.test(limpio)) {
    return { valido: false, error: 'Solo debe contener números' };
  }
  
  // Extraer partes
  const base = limpio.slice(0, 26);
  const verificadorRecibido = parseInt(limpio.slice(26, 27));
  const verificadorCalculado = calcularDigitoVerificadorMod11(base);
  
  if (verificadorRecibido !== verificadorCalculado) {
    return { valido: false, error: 'Dígito verificador inválido' };
  }
  
  return { 
    valido: true,
    entidad: limpio.slice(0, 2),
    concepto: limpio.slice(2, 4),
    referencia: limpio.slice(4, 12),
    importe: parseInt(limpio.slice(12, 20)) / 100,
    vigencia: limpio.slice(20, 26)
  };
};

// Calcular fecha de vencimiento (15 días hábiles desde hoy)
const calcularFechaVencimiento = (diasHabiles = 15) => {
  const fecha = new Date();
  let diasAgregados = 0;
  
  while (diasAgregados < diasHabiles) {
    fecha.setDate(fecha.getDate() + 1);
    const diaSemana = fecha.getDay();
    // Saltar fines de semana (0 = domingo, 6 = sábado)
    if (diaSemana !== 0 && diaSemana !== 6) {
      diasAgregados++;
    }
  }
  
  return fecha.toISOString().split('T')[0];
};

/**
 * Formatear línea de captura para mejor legibilidad
 * Ejemplo: 09011234567800150000260212 7 -> 09 01 12345678 00150000 260212 7
 */
const formatearLineaCaptura = (linea) => {
  const limpio = linea.replace(/[\s-]/g, '');
  
  if (limpio.length !== 27) {
    return linea;
  }
  
  const campo09 = limpio.slice(0, 2);
  const campo01 = limpio.slice(2, 4);
  const referencia = limpio.slice(4, 12);
  const importe = limpio.slice(12, 20);
  const vigencia = limpio.slice(20, 26);
  const verificador = limpio.slice(26, 27);
  
  return `${campo09} ${campo01} ${referencia} ${importe} ${vigencia} ${verificador}`;
};

/**
 * Desglosar componentes de una línea de captura
 */
const desglosarLinea = (linea) => {
  const limpio = linea.replace(/[\s-]/g, '');
  
  if (limpio.length !== 27) {
    return null;
  }
  
  const importeCentavos = parseInt(limpio.slice(12, 20));
  const vigenciaStr = limpio.slice(20, 26);
  
  return {
    entidad: limpio.slice(0, 2),
    concepto: limpio.slice(2, 4),
    referencia: limpio.slice(4, 12),
    importe: importeCentavos / 100,
    importeCentavos: importeCentavos,
    vigencia: vigenciaStr,
    vigenciaFecha: `20${vigenciaStr.slice(0,2)}-${vigenciaStr.slice(2,4)}-${vigenciaStr.slice(4,6)}`,
    verificador: limpio.slice(26, 27),
    lineaFormateada: formatearLineaCaptura(limpio)
  };
};

module.exports = {
  generarCodigoLinea,
  validarLinea,
  calcularFechaVencimiento,
  calcularDigitoVerificadorMod11,
  formatearLineaCaptura,
  desglosarLinea
};
