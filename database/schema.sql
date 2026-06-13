-- ============================================
-- ESQUEMA DE BASE DE DATOS MySQL
-- Sistema de Gestión de Inventarios y Producción
-- ============================================

-- Crear la base de datos
CREATE DATABASE IF NOT EXISTS inventario_produccion
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE inventario_produccion;

-- ============================================
-- TABLA: operarios
-- Gestión de operarios/trabajadores
-- ============================================
CREATE TABLE operarios (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    identificacion VARCHAR(20) NOT NULL UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    edad INT NOT NULL CHECK (edad >= 18 AND edad <= 100),
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_operarios_identificacion (identificacion),
    INDEX idx_operarios_nombre (nombre, apellidos)
) ENGINE=InnoDB;

-- ============================================
-- TABLA: proveedores
-- Gestión de proveedores
-- ============================================
CREATE TABLE proveedores (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    nit VARCHAR(20) NOT NULL UNIQUE,
    nombre VARCHAR(200) NOT NULL,
    direccion VARCHAR(255),
    telefono VARCHAR(20),
    email VARCHAR(100),
    contacto VARCHAR(100),
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_proveedores_nit (nit),
    INDEX idx_proveedores_nombre (nombre)
) ENGINE=InnoDB;

-- ============================================
-- TABLA: categorias
-- Categorías de productos
-- ============================================
CREATE TABLE categorias (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    codigo VARCHAR(20) NOT NULL UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_categorias_codigo (codigo)
) ENGINE=InnoDB;

-- ============================================
-- TABLA: unidades_medida
-- Unidades de medida para productos
-- ============================================
CREATE TABLE unidades_medida (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    codigo VARCHAR(10) NOT NULL UNIQUE,
    nombre VARCHAR(50) NOT NULL,
    
    INDEX idx_unidades_codigo (codigo)
) ENGINE=InnoDB;

-- ============================================
-- TABLA: productos
-- Productos del inventario
-- ============================================
CREATE TABLE productos (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    codigo VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    categoria_id VARCHAR(36) NOT NULL,
    unidad_medida VARCHAR(10) NOT NULL,
    stock_actual DECIMAL(15, 3) DEFAULT 0,
    stock_minimo DECIMAL(15, 3) DEFAULT 0,
    stock_maximo DECIMAL(15, 3) DEFAULT 0,
    precio_unitario DECIMAL(15, 2) DEFAULT 0,
    ubicacion VARCHAR(100),
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    
    INDEX idx_productos_codigo (codigo),
    INDEX idx_productos_categoria (categoria_id),
    INDEX idx_productos_nombre (nombre)
) ENGINE=InnoDB;

-- ============================================
-- TABLA: motivos_movimiento
-- Catálogo de motivos para movimientos
-- ============================================
CREATE TABLE motivos_movimiento (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    codigo VARCHAR(10) NOT NULL UNIQUE,
    descripcion VARCHAR(200) NOT NULL,
    tipo ENUM('entrada', 'salida', 'ajuste') NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    
    INDEX idx_motivos_codigo (codigo)
) ENGINE=InnoDB;

-- ============================================
-- TABLA: movimientos
-- Encabezado de movimientos de inventario (entradas/salidas)
-- ============================================
CREATE TABLE movimientos (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    numero_documento VARCHAR(50) NOT NULL UNIQUE,
    motivo_id VARCHAR(36) NOT NULL,
    numero_factura VARCHAR(50),
    fecha DATE NOT NULL,
    fecha_factura DATE,
    proveedor_id VARCHAR(36),
    notas TEXT,
    valor_total DECIMAL(15, 2) DEFAULT 0,
    estado ENUM('pendiente', 'procesado', 'anulado') DEFAULT 'pendiente',
    usuario_creacion VARCHAR(100),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (motivo_id) REFERENCES motivos_movimiento(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (proveedor_id) REFERENCES proveedores(id) ON DELETE SET NULL ON UPDATE CASCADE,
    
    INDEX idx_movimientos_fecha (fecha),
    INDEX idx_movimientos_proveedor (proveedor_id),
    INDEX idx_movimientos_documento (numero_documento)
) ENGINE=InnoDB;

-- ============================================
-- TABLA: movimientos_detalle
-- Detalle de items en cada movimiento
-- ============================================
CREATE TABLE movimientos_detalle (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    movimiento_id VARCHAR(36) NOT NULL,
    producto_id VARCHAR(36) NOT NULL,
    codigo_producto VARCHAR(50) NOT NULL,
    descripcion VARCHAR(200),
    cantidad DECIMAL(15, 3) NOT NULL,
    valor_kg DECIMAL(15, 2) DEFAULT 0,
    valor_descuento DECIMAL(15, 2) DEFAULT 0,
    valor_total DECIMAL(15, 2) DEFAULT 0,
    
    FOREIGN KEY (movimiento_id) REFERENCES movimientos(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    
    INDEX idx_movimientos_detalle_movimiento (movimiento_id),
    INDEX idx_movimientos_detalle_producto (producto_id)
) ENGINE=InnoDB;

-- ============================================
-- TABLA: movimientos_inventario
-- Registro histórico de todos los movimientos de stock
-- ============================================
CREATE TABLE movimientos_inventario (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    producto_id VARCHAR(36) NOT NULL,
    tipo ENUM('entrada', 'salida', 'ajuste') NOT NULL,
    cantidad DECIMAL(15, 3) NOT NULL,
    stock_anterior DECIMAL(15, 3) NOT NULL,
    stock_nuevo DECIMAL(15, 3) NOT NULL,
    motivo VARCHAR(200),
    documento VARCHAR(100),
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    usuario VARCHAR(100),
    notas TEXT,
    
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    
    INDEX idx_mov_inv_producto (producto_id),
    INDEX idx_mov_inv_fecha (fecha),
    INDEX idx_mov_inv_tipo (tipo)
) ENGINE=InnoDB;

-- ============================================
-- TABLA: procesos
-- Procesos de producción/transformación
-- ============================================
CREATE TABLE procesos (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    fecha DATE NOT NULL,
    producto_origen_id VARCHAR(36) NOT NULL,
    producto_destino_id VARCHAR(36) NOT NULL,
    operario_id VARCHAR(36) NOT NULL,
    kg_entrada DECIMAL(15, 3) NOT NULL,
    porcentaje_merma DECIMAL(5, 2) DEFAULT 0,
    kg_merma DECIMAL(15, 3) DEFAULT 0,
    kg_salida DECIMAL(15, 3) NOT NULL,
    costo_por_kg DECIMAL(15, 2) DEFAULT 0,
    costo_total DECIMAL(15, 2) DEFAULT 0,
    valor_final_kg DECIMAL(15, 2) DEFAULT 0,
    notas TEXT,
    estado ENUM('pendiente', 'en_proceso', 'completado', 'anulado') DEFAULT 'completado',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (producto_origen_id) REFERENCES productos(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (producto_destino_id) REFERENCES productos(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (operario_id) REFERENCES operarios(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    
    INDEX idx_procesos_fecha (fecha),
    INDEX idx_procesos_operario (operario_id),
    INDEX idx_procesos_producto_origen (producto_origen_id),
    INDEX idx_procesos_producto_destino (producto_destino_id)
) ENGINE=InnoDB;

-- ============================================
-- DATOS INICIALES
-- ============================================

-- Insertar unidades de medida
INSERT INTO unidades_medida (id, codigo, nombre) VALUES
(UUID(), 'KG', 'Kilogramos'),
(UUID(), 'UND', 'Unidades'),
(UUID(), 'LT', 'Litros'),
(UUID(), 'MT', 'Metros'),
(UUID(), 'CJ', 'Cajas');

-- Insertar motivos de movimiento
INSERT INTO motivos_movimiento (id, codigo, descripcion, tipo) VALUES
(UUID(), 'EAC', 'Entrada por compra', 'entrada'),
(UUID(), 'SAL', 'Salida por venta', 'salida'),
(UUID(), 'AJU', 'Ajuste de inventario', 'ajuste');

-- Insertar categorías de ejemplo
INSERT INTO categorias (id, codigo, nombre, descripcion) VALUES
(UUID(), 'CAR', 'Carnes', 'Productos cárnicos'),
(UUID(), 'RES', 'Res', 'Cortes de res'),
(UUID(), 'CER', 'Cerdo', 'Cortes de cerdo'),
(UUID(), 'POL', 'Pollo', 'Productos de pollo'),
(UUID(), 'PES', 'Pescado', 'Productos de pescadería'),
(UUID(), 'EMB', 'Embutidos', 'Productos embutidos'),
(UUID(), 'LAC', 'Lácteos', 'Productos lácteos');

-- ============================================
-- VISTAS ÚTILES
-- ============================================

-- Vista: Resumen de inventario por producto
CREATE VIEW vista_inventario_resumen AS
SELECT 
    p.id,
    p.codigo,
    p.nombre,
    c.nombre AS categoria,
    p.unidad_medida,
    p.stock_actual,
    p.stock_minimo,
    p.stock_maximo,
    p.precio_unitario,
    (p.stock_actual * p.precio_unitario) AS valor_inventario,
    CASE 
        WHEN p.stock_actual <= p.stock_minimo THEN 'BAJO'
        WHEN p.stock_actual >= p.stock_maximo THEN 'ALTO'
        ELSE 'NORMAL'
    END AS estado_stock
FROM productos p
LEFT JOIN categorias c ON p.categoria_id = c.id
WHERE p.activo = TRUE;

-- Vista: Producción por operario
CREATE VIEW vista_produccion_operario AS
SELECT 
    o.id AS operario_id,
    CONCAT(o.nombre, ' ', o.apellidos) AS operario_nombre,
    o.identificacion,
    COUNT(pr.id) AS total_procesos,
    SUM(pr.kg_entrada) AS total_kg_entrada,
    SUM(pr.kg_salida) AS total_kg_salida,
    SUM(pr.kg_merma) AS total_kg_merma,
    AVG(pr.porcentaje_merma) AS promedio_merma,
    SUM(pr.costo_total) AS total_costo_mano_obra
FROM operarios o
LEFT JOIN procesos pr ON o.id = pr.operario_id
WHERE o.activo = TRUE
GROUP BY o.id, o.nombre, o.apellidos, o.identificacion;

-- Vista: Movimientos recientes
CREATE VIEW vista_movimientos_recientes AS
SELECT 
    m.id,
    m.numero_documento,
    mm.descripcion AS motivo,
    mm.tipo,
    m.fecha,
    p.nombre AS proveedor,
    m.valor_total,
    m.estado
FROM movimientos m
LEFT JOIN motivos_movimiento mm ON m.motivo_id = mm.id
LEFT JOIN proveedores p ON m.proveedor_id = p.id
ORDER BY m.fecha DESC, m.fecha_creacion DESC;

-- ============================================
-- PROCEDIMIENTOS ALMACENADOS
-- ============================================

DELIMITER //

-- Procedimiento: Actualizar stock de producto
CREATE PROCEDURE sp_actualizar_stock(
    IN p_producto_id VARCHAR(36),
    IN p_cantidad DECIMAL(15,3),
    IN p_tipo ENUM('entrada', 'salida', 'ajuste'),
    IN p_motivo VARCHAR(200),
    IN p_documento VARCHAR(100),
    IN p_usuario VARCHAR(100),
    IN p_notas TEXT
)
BEGIN
    DECLARE v_stock_anterior DECIMAL(15,3);
    DECLARE v_stock_nuevo DECIMAL(15,3);
    
    -- Obtener stock actual
    SELECT stock_actual INTO v_stock_anterior
    FROM productos WHERE id = p_producto_id;
    
    -- Calcular nuevo stock
    IF p_tipo = 'entrada' THEN
        SET v_stock_nuevo = v_stock_anterior + p_cantidad;
    ELSEIF p_tipo = 'salida' THEN
        SET v_stock_nuevo = v_stock_anterior - p_cantidad;
    ELSE
        SET v_stock_nuevo = p_cantidad; -- Ajuste directo
    END IF;
    
    -- Actualizar stock del producto
    UPDATE productos 
    SET stock_actual = v_stock_nuevo
    WHERE id = p_producto_id;
    
    -- Registrar movimiento
    INSERT INTO movimientos_inventario (
        id, producto_id, tipo, cantidad, stock_anterior, 
        stock_nuevo, motivo, documento, usuario, notas
    ) VALUES (
        UUID(), p_producto_id, p_tipo, p_cantidad, v_stock_anterior,
        v_stock_nuevo, p_motivo, p_documento, p_usuario, p_notas
    );
END //

-- Procedimiento: Liquidación de nómina por rango de fechas
CREATE PROCEDURE sp_liquidacion_nomina(
    IN p_fecha_inicio DATE,
    IN p_fecha_fin DATE,
    IN p_operario_id VARCHAR(36)
)
BEGIN
    SELECT 
        o.id AS operario_id,
        o.identificacion,
        CONCAT(o.nombre, ' ', o.apellidos) AS operario_nombre,
        COUNT(pr.id) AS total_procesos,
        SUM(pr.kg_entrada) AS total_kg_procesados,
        SUM(pr.kg_salida) AS total_kg_resultantes,
        SUM(pr.kg_merma) AS total_kg_merma,
        AVG(pr.porcentaje_merma) AS promedio_merma,
        SUM(pr.costo_total) AS total_a_pagar
    FROM operarios o
    INNER JOIN procesos pr ON o.id = pr.operario_id
    WHERE pr.fecha BETWEEN p_fecha_inicio AND p_fecha_fin
        AND (p_operario_id IS NULL OR o.id = p_operario_id)
        AND pr.estado = 'completado'
    GROUP BY o.id, o.identificacion, o.nombre, o.apellidos
    ORDER BY o.nombre, o.apellidos;
END //

DELIMITER ;

-- ============================================
-- TRIGGERS
-- ============================================

DELIMITER //

-- Trigger: Actualizar stock después de proceso
CREATE TRIGGER trg_proceso_after_insert
AFTER INSERT ON procesos
FOR EACH ROW
BEGIN
    -- Reducir stock del producto origen
    UPDATE productos 
    SET stock_actual = stock_actual - NEW.kg_entrada
    WHERE id = NEW.producto_origen_id;
    
    -- Aumentar stock del producto destino
    UPDATE productos 
    SET stock_actual = stock_actual + NEW.kg_salida
    WHERE id = NEW.producto_destino_id;
    
    -- Registrar movimiento de salida (origen)
    INSERT INTO movimientos_inventario (
        id, producto_id, tipo, cantidad, stock_anterior, 
        stock_nuevo, motivo, documento, usuario, notas
    )
    SELECT 
        UUID(),
        NEW.producto_origen_id,
        'salida',
        NEW.kg_entrada,
        stock_actual + NEW.kg_entrada,
        stock_actual,
        'Proceso de producción',
        NEW.id,
        'SISTEMA',
        CONCAT('Proceso ID: ', NEW.id)
    FROM productos WHERE id = NEW.producto_origen_id;
    
    -- Registrar movimiento de entrada (destino)
    INSERT INTO movimientos_inventario (
        id, producto_id, tipo, cantidad, stock_anterior, 
        stock_nuevo, motivo, documento, usuario, notas
    )
    SELECT 
        UUID(),
        NEW.producto_destino_id,
        'entrada',
        NEW.kg_salida,
        stock_actual - NEW.kg_salida,
        stock_actual,
        'Proceso de producción',
        NEW.id,
        'SISTEMA',
        CONCAT('Proceso ID: ', NEW.id)
    FROM productos WHERE id = NEW.producto_destino_id;
END //

DELIMITER ;
