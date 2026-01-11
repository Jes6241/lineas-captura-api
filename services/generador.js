/**
 * Servicio de generación de líneas de captura
 * Simula el comportamiento de un sistema de tesorería bancario
 */

// Algoritmo para generar dígito verificador (módulo 97 - similar a CLABE bancaria)
const calcularDigitoVerificador = (numero) => {
  const resto = BigInt(numero) % 97n;
  const verificador = 98n - resto;
  return verificador.toString().padStart(2, '0');
};

// Generar código único de línea de captura
// Formato: AAAA-MMDD-XXXXXX-VV (20 caracteres con guiones)
// AAAA = Año
// MMDD = Mes y día
// XXXXXX = Número secuencial aleatorio
// VV = Dígito verificador
const generarCodigoLinea = (secuencial = null) => {
  const ahora = new Date();
  const año = ahora.getFullYear().toString();
  const mes = (ahora.getMonth() + 1).toString().padStart(2, '0');
  const dia = ahora.getDate().toString().padStart(2, '0');
  
  // Secuencial: 6 dígitos aleatorios o proporcionado
  const sec = secuencial || Math.floor(Math.random() * 999999).toString().padStart(6, '0');
  
  // Base para cálculo del verificador (sin guiones)
  const base = `${año}${mes}${dia}${sec}`;
  const verificador = calcularDigitoVerificador(base);
  
  // Formato final con guiones para legibilidad
  return `${año}-${mes}${dia}-${sec}-${verificador}`;
};

// Validar formato y dígito verificador de una línea
const validarLinea = (codigo) => {
  // Quitar guiones para validar
  const limpio = codigo.replace(/-/g, '');
  
  if (limpio.length !== 16) {
    return { valido: false, error: 'Longitud incorrecta' };
  }
  
  if (!/^\d+$/.test(limpio)) {
    return { valido: false, error: 'Solo debe contener números' };
  }
  
  // Extraer partes
  const base = limpio.slice(0, 14);
  const verificadorRecibido = limpio.slice(14, 16);
  const verificadorCalculado = calcularDigitoVerificador(base);
  
  if (verificadorRecibido !== verificadorCalculado) {
    return { valido: false, error: 'Dígito verificador inválido' };
  }
  
  return { valido: true };
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

module.exports = {
  generarCodigoLinea,
  validarLinea,
  calcularFechaVencimiento,
  calcularDigitoVerificador
};
