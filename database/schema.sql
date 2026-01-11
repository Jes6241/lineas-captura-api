-- Tabla de líneas de captura para Supabase
-- Ejecutar en el SQL Editor de Supabase

CREATE TABLE IF NOT EXISTS lineas_captura (
  id BIGSERIAL PRIMARY KEY,
  codigo VARCHAR(25) UNIQUE NOT NULL,
  monto DECIMAL(10,2) NOT NULL DEFAULT 0,
  concepto TEXT,
  referencia_externa VARCHAR(50),
  
  -- Estados: disponible, usada, vencida, cancelada
  estado VARCHAR(20) DEFAULT 'disponible',
  
  -- Fechas
  fecha_generacion TIMESTAMPTZ DEFAULT NOW(),
  fecha_vencimiento DATE NOT NULL,
  fecha_uso TIMESTAMPTZ,
  
  -- Información de uso
  usado_por VARCHAR(100),
  referencia_pago VARCHAR(100),
  
  -- Auditoría
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_lineas_estado ON lineas_captura(estado);
CREATE INDEX IF NOT EXISTS idx_lineas_vencimiento ON lineas_captura(fecha_vencimiento);
CREATE INDEX IF NOT EXISTS idx_lineas_referencia ON lineas_captura(referencia_externa);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_lineas_captura_updated_at ON lineas_captura;
CREATE TRIGGER update_lineas_captura_updated_at
    BEFORE UPDATE ON lineas_captura
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS (Row Level Security)
ALTER TABLE lineas_captura ENABLE ROW LEVEL SECURITY;

-- Política para permitir todas las operaciones (ajustar según necesidades)
CREATE POLICY "Permitir todas las operaciones" ON lineas_captura
  FOR ALL USING (true) WITH CHECK (true);

-- Comentarios
COMMENT ON TABLE lineas_captura IS 'Líneas de captura para pagos de multas';
COMMENT ON COLUMN lineas_captura.codigo IS 'Código único formato: AAAA-MMDD-XXXXXX-VV';
COMMENT ON COLUMN lineas_captura.estado IS 'disponible, usada, vencida, cancelada';
