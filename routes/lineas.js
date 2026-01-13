const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { 
  generarCodigoLinea, 
  validarLinea, 
  calcularFechaVencimiento,
  formatearLineaCaptura,
  desglosarLinea
} = require('../services/generador');

/**
 * POST /api/lineas/generar
 * Genera una nueva línea de captura
 * Body: { 
 *   monto: number (requerido),
 *   concepto?: string (código o descripción),
 *   referencia_externa?: string (placa, folio, etc),
 *   entidad?: string (código de entidad, default '09' = CDMX)
 * }
 */
router.post('/generar', async (req, res) => {
  try {
    const { monto, concepto, referencia_externa, entidad } = req.body;

    if (!monto || monto <= 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'El monto debe ser mayor a 0' 
      });
    }

    // Mapear conceptos a códigos
    const conceptosCodigos = {
      'multa': '01',
      'multa tránsito': '01',
      'multa transito': '01',
      'tenencia': '02',
      'refrendo': '03',
      'predial': '04'
    };

    // Determinar código de concepto
    let codigoConcepto = '01'; // Default: multa tránsito
    if (concepto) {
      const conceptoLower = concepto.toLowerCase();
      codigoConcepto = conceptosCodigos[conceptoLower] || concepto.slice(0, 2).padStart(2, '0');
    }

    // Generar código único con verificación
    let codigo;
    let intentos = 0;
    const maxIntentos = 5;

    if (supabase) {
      while (intentos < maxIntentos) {
        codigo = generarCodigoLinea({
          entidad: entidad || '09',
          concepto: codigoConcepto,
          referencia: referencia_externa,
          monto: parseFloat(monto),
          diasVigencia: 15
        });
        
        // Verificar si ya existe
        const { data: existe } = await supabase
          .from('lineas_captura')
          .select('codigo')
          .eq('codigo', codigo)
          .single();
        
        if (!existe) {
          break; // Código único encontrado
        }
        intentos++;
      }

      if (intentos >= maxIntentos) {
        return res.status(500).json({ 
          success: false, 
          error: 'No se pudo generar código único después de múltiples intentos' 
        });
      }
    } else {
      codigo = generarCodigoLinea({
        entidad: entidad || '09',
        concepto: codigoConcepto,
        referencia: referencia_externa,
        monto: parseFloat(monto),
        diasVigencia: 15
      });
    }

    const fecha_vencimiento = calcularFechaVencimiento(15);
    const fecha_generacion = new Date().toISOString();

    // Desglosar la línea para obtener información detallada
    const desglose = desglosarLinea(codigo);
    
    const lineaCaptura = {
      codigo,
      codigo_formateado: formatearLineaCaptura(codigo),
      monto: parseFloat(monto),
      concepto: concepto || 'Pago de multa de tránsito',
      referencia_externa: referencia_externa || null,
      fecha_generacion,
      fecha_vencimiento,
      estado: 'disponible', // disponible, usada, vencida, cancelada
      usado_por: null,
      fecha_uso: null,
      desglose: desglose
    };

    // Guardar en base de datos si está configurada
    if (supabase) {
      const { data, error } = await supabase
        .from('lineas_captura')
        .insert([{
          codigo,
          monto: parseFloat(monto),
          concepto: concepto || 'Pago de multa de tránsito',
          referencia_externa: referencia_externa || null,
          fecha_generacion,
          fecha_vencimiento,
          estado: 'disponible',
          usado_por: null,
          fecha_uso: null
        }])
        .select()
        .single();

      if (error) {
        console.error('Error guardando línea:', error);
        return res.status(500).json({ 
          success: false, 
          error: 'Error al generar línea de captura' 
        });
      }

      // Agregar información formateada a la respuesta
      return res.json({ 
        success: true, 
        linea: {
          ...data,
          codigo_formateado: formatearLineaCaptura(data.codigo),
          desglose: desglosarLinea(data.codigo)
        }
      });
    }

    // Modo sin base de datos (pruebas)
    res.json({ success: true, linea: lineaCaptura });

  } catch (error) {
    console.error('Error en /generar:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/lineas/disponibles
 * Lista líneas de captura disponibles (no usadas, no vencidas)
 * Query: ?limite=10
 */
router.get('/disponibles', async (req, res) => {
  try {
    const limite = parseInt(req.query.limite) || 10;
    const hoy = new Date().toISOString().split('T')[0];

    if (!supabase) {
      return res.json({ 
        success: true, 
        lineas: [],
        mensaje: 'Base de datos no configurada' 
      });
    }

    const { data, error } = await supabase
      .from('lineas_captura')
      .select('*')
      .eq('estado', 'disponible')
      .gte('fecha_vencimiento', hoy)
      .order('fecha_generacion', { ascending: true })
      .limit(limite);

    if (error) {
      console.error('Error obteniendo líneas:', error);
      return res.status(500).json({ success: false, error: error.message });
    }

    res.json({ success: true, lineas: data, total: data.length });

  } catch (error) {
    console.error('Error en /disponibles:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/lineas/:codigo/validar
 * Valida si una línea de captura es válida para pago
 */
router.get('/:codigo/validar', async (req, res) => {
  try {
    const { codigo } = req.params;

    // Primero validar formato y dígito verificador
    const validacion = validarLinea(codigo);
    if (!validacion.valido) {
      return res.json({ 
        success: false, 
        valida: false, 
        error: validacion.error 
      });
    }

    if (!supabase) {
      return res.json({ 
        success: true, 
        valida: true, 
        mensaje: 'Formato válido (sin verificar en BD)' 
      });
    }

    // Buscar en base de datos
    const { data, error } = await supabase
      .from('lineas_captura')
      .select('*')
      .eq('codigo', codigo)
      .single();

    if (error || !data) {
      return res.json({ 
        success: false, 
        valida: false, 
        error: 'Línea de captura no encontrada' 
      });
    }

    // Verificar estado
    const hoy = new Date().toISOString().split('T')[0];
    
    if (data.estado === 'usada') {
      return res.json({ 
        success: false, 
        valida: false, 
        error: 'Línea de captura ya fue utilizada',
        fecha_uso: data.fecha_uso
      });
    }

    if (data.estado === 'cancelada') {
      return res.json({ 
        success: false, 
        valida: false, 
        error: 'Línea de captura cancelada' 
      });
    }

    if (data.fecha_vencimiento < hoy) {
      // Actualizar estado a vencida
      await supabase
        .from('lineas_captura')
        .update({ estado: 'vencida' })
        .eq('codigo', codigo);

      return res.json({ 
        success: false, 
        valida: false, 
        error: 'Línea de captura vencida',
        fecha_vencimiento: data.fecha_vencimiento
      });
    }

    res.json({ 
      success: true, 
      valida: true, 
      linea: {
        codigo: data.codigo,
        monto: data.monto,
        concepto: data.concepto,
        fecha_vencimiento: data.fecha_vencimiento
      }
    });

  } catch (error) {
    console.error('Error en /validar:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/lineas/:codigo/usar
 * Marca una línea de captura como usada (al confirmar pago)
 * Body: { referencia_pago, pagado_por? }
 */
router.post('/:codigo/usar', async (req, res) => {
  try {
    const { codigo } = req.params;
    const { referencia_pago, pagado_por } = req.body;

    if (!supabase) {
      return res.json({ 
        success: true, 
        mensaje: 'Línea marcada como usada (modo prueba)' 
      });
    }

    // Verificar que existe y está disponible
    const { data: linea, error: fetchError } = await supabase
      .from('lineas_captura')
      .select('*')
      .eq('codigo', codigo)
      .single();

    if (fetchError || !linea) {
      return res.status(404).json({ 
        success: false, 
        error: 'Línea de captura no encontrada' 
      });
    }

    if (linea.estado !== 'disponible') {
      return res.status(400).json({ 
        success: false, 
        error: `Línea no disponible. Estado actual: ${linea.estado}` 
      });
    }

    // Marcar como usada
    const { data, error } = await supabase
      .from('lineas_captura')
      .update({ 
        estado: 'usada',
        usado_por: pagado_por || null,
        fecha_uso: new Date().toISOString(),
        referencia_pago: referencia_pago || null
      })
      .eq('codigo', codigo)
      .select()
      .single();

    if (error) {
      console.error('Error actualizando línea:', error);
      return res.status(500).json({ success: false, error: error.message });
    }

    res.json({ 
      success: true, 
      mensaje: 'Línea de captura marcada como usada',
      linea: data
    });

  } catch (error) {
    console.error('Error en /usar:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/lineas/:codigo
 * Consulta información de una línea de captura
 */
router.get('/:codigo', async (req, res) => {
  try {
    const { codigo } = req.params;

    if (!supabase) {
      const validacion = validarLinea(codigo);
      return res.json({ 
        success: validacion.valido, 
        mensaje: 'Modo prueba - solo validación de formato',
        formato_valido: validacion.valido
      });
    }

    const { data, error } = await supabase
      .from('lineas_captura')
      .select('*')
      .eq('codigo', codigo)
      .single();

    if (error || !data) {
      return res.status(404).json({ 
        success: false, 
        error: 'Línea de captura no encontrada' 
      });
    }

    res.json({ success: true, linea: data });

  } catch (error) {
    console.error('Error en consulta:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/lineas/lote
 * Genera múltiples líneas de captura (pre-generación)
 * Body: { cantidad, monto_default? }
 */
router.post('/lote', async (req, res) => {
  try {
    const { cantidad, monto_default } = req.body;
    const cantidadNum = parseInt(cantidad) || 10;

    if (cantidadNum > 100) {
      return res.status(400).json({ 
        success: false, 
        error: 'Máximo 100 líneas por lote' 
      });
    }

    const lineas = [];
    const fecha_vencimiento = calcularFechaVencimiento(15);
    const fecha_generacion = new Date().toISOString();

    for (let i = 0; i < cantidadNum; i++) {
      lineas.push({
        codigo: generarCodigoLinea(),
        monto: monto_default || 0,
        concepto: 'Línea pre-generada',
        fecha_generacion,
        fecha_vencimiento,
        estado: 'disponible'
      });
    }

    if (supabase) {
      const { data, error } = await supabase
        .from('lineas_captura')
        .insert(lineas)
        .select();

      if (error) {
        console.error('Error guardando lote:', error);
        return res.status(500).json({ success: false, error: error.message });
      }

      return res.json({ 
        success: true, 
        generadas: data.length, 
        lineas: data 
      });
    }

    res.json({ 
      success: true, 
      generadas: lineas.length, 
      lineas 
    });

  } catch (error) {
    console.error('Error en /lote:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
