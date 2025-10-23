/**
 * Configuración de Base de Datos MySQL
 * Conexión y gestión de base de datos MySQL
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

class MySQLDatabase {
    constructor() {
        this.pool = null;
        this.init();
    }

    async init() {
        try {
            this.pool = mysql.createPool({
                host: process.env.DB_HOST || 'localhost',
                port: process.env.DB_PORT || 3306,
                user: process.env.DB_USER || 'root',
                password: process.env.DB_PASSWORD || '',
                database: process.env.DB_NAME || 'terrasale_db',
                charset: process.env.DB_CHARSET || 'utf8mb4',
                timezone: process.env.DB_TIMEZONE || 'local',
                connectionLimit: 10,
                acquireTimeout: 60000,
                reconnect: true,
                // Opciones adicionales para mejor rendimiento
                namedPlaceholders: true,
                decimalNumbers: true
            });

            // Probar la conexión
            await this.testConnection();
            await this.createTables();
            
        } catch (error) {
            console.error('❌ Error al conectar con MySQL:', error.message);
            process.exit(1);
        }
    }

    async testConnection() {
        try {
            const connection = await this.pool.getConnection();
            console.log('✅ Conectado a la base de datos MySQL');
            connection.release();
        } catch (error) {
            throw new Error(`No se pudo conectar a MySQL: ${error.message}`);
        }
    }

    async createTables() {
        try {
            await this.query(`
                CREATE TABLE IF NOT EXISTS sellers (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    name VARCHAR(100) NOT NULL,
                    role VARCHAR(100) NOT NULL,
                    bio TEXT,
                    email VARCHAR(150) UNIQUE NOT NULL,
                    phone VARCHAR(20),
                    whatsapp VARCHAR(20),
                    profile_image VARCHAR(255),
                    is_active BOOLEAN DEFAULT TRUE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    INDEX idx_sellers_active (is_active),
                    INDEX idx_sellers_email (email)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            `);

            await this.query(`
                CREATE TABLE IF NOT EXISTS properties (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    title VARCHAR(200) NOT NULL,
                    location VARCHAR(200) NOT NULL,
                    size VARCHAR(50) NOT NULL,
                    price DECIMAL(12,2) NOT NULL,
                    description TEXT,
                    property_type VARCHAR(50) DEFAULT 'land',
                    status VARCHAR(20) DEFAULT 'available',
                    seller_id INT,
                    latitude DECIMAL(10,8),
                    longitude DECIMAL(11,8),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    FOREIGN KEY (seller_id) REFERENCES sellers(id) ON DELETE SET NULL,
                    INDEX idx_properties_status (status),
                    INDEX idx_properties_seller (seller_id),
                    INDEX idx_properties_location (location)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            `);

            await this.query(`
                CREATE TABLE IF NOT EXISTS property_features (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    property_id INT NOT NULL,
                    feature VARCHAR(100) NOT NULL,
                    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
                    INDEX idx_features_property (property_id)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            `);

            await this.query(`
                CREATE TABLE IF NOT EXISTS property_images (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    property_id INT NOT NULL,
                    image_url VARCHAR(255) NOT NULL,
                    is_primary BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
                    INDEX idx_images_property (property_id),
                    INDEX idx_images_primary (is_primary)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            `);

            await this.query(`
                CREATE TABLE IF NOT EXISTS contacts (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    name VARCHAR(100) NOT NULL,
                    email VARCHAR(150),
                    phone VARCHAR(20),
                    message TEXT,
                    property_id INT,
                    contact_type VARCHAR(50) DEFAULT 'general',
                    status VARCHAR(20) DEFAULT 'new',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE SET NULL,
                    INDEX idx_contacts_email (email),
                    INDEX idx_contacts_status (status),
                    INDEX idx_contacts_created (created_at)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            `);

            await this.query(`
                CREATE TABLE IF NOT EXISTS slack_config (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    webhook_url VARCHAR(500),
                    channel_name VARCHAR(100),
                    bot_token VARCHAR(300),
                    is_active BOOLEAN DEFAULT TRUE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            `);
            // Agregar estas tablas después de las existentes
await this.query(`
    CREATE TABLE IF NOT EXISTS sales (
        id INT PRIMARY KEY AUTO_INCREMENT,
        property_id INT NOT NULL,
        seller_id INT NOT NULL,
        buyer_name VARCHAR(100) NOT NULL,
        buyer_email VARCHAR(150),
        buyer_phone VARCHAR(20),
        sale_amount DECIMAL(12,2) NOT NULL,
        commission DECIMAL(10,2) NOT NULL,
        sale_date DATE NOT NULL,
        status VARCHAR(20) DEFAULT 'completed',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
        FOREIGN KEY (seller_id) REFERENCES sellers(id) ON DELETE CASCADE,
        INDEX idx_sales_date (sale_date),
        INDEX idx_sales_seller (seller_id),
        INDEX idx_sales_property (property_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`);

await this.query(`
    CREATE TABLE IF NOT EXISTS user_sessions (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT,
        session_data JSON,
        ip_address VARCHAR(45),
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP NULL,
        INDEX idx_sessions_user (user_id),
        INDEX idx_sessions_expires (expires_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`);

// Insertar datos de ejemplo para ventas
await this.query(`
    INSERT INTO sales (property_id, seller_id, buyer_name, buyer_email, buyer_phone, sale_amount, commission, sale_date) VALUES
    (1, 1, 'Roberto Silva', 'roberto@email.com', '+59170012345', 45000.00, 2250.00, '2024-01-15'),
    (2, 2, 'Laura Mendoza', 'laura@email.com', '+59170012346', 80000.00, 4000.00, '2024-02-20'),
    (3, 1, 'Carlos Herrera', 'carlos@email.com', '+59170012347', 120000.00, 6000.00, '2024-03-10');
`);

            console.log('✅ Tablas MySQL verificadas/creadas correctamente');
            await this.insertSampleData();
            
        } catch (error) {
            console.error('❌ Error creando tablas:', error.message);
        }
    }

    async insertSampleData() {
        try {
            // Verificar si ya existen datos
            const existingSellers = await this.query('SELECT COUNT(*) as count FROM sellers');
            if (existingSellers[0].count > 0) {
                console.log('✅ Datos de ejemplo ya existen');
                return;
            }

            // Insertar vendedores de ejemplo
            await this.query(`
                INSERT INTO sellers (name, role, bio, email, phone, whatsapp, profile_image) VALUES
                ('María González', 'Asesora Senior', 'Experta en terrenos comerciales con 10 años de experiencia', 'maria@terrasale.com', '+59112345678', '+59112345678', '/assets/team/avatar1.jpg'),
                ('Carlos Rodríguez', 'Asesor Inmobiliario', 'Especialista en zonas residenciales y proyectos de inversión', 'carlos@terrasale.com', '+59165037136', '+59165037136', '/assets/team/avatar2.jpg'),
                ('Ana Martínez', 'Consultora', 'Enfocada en terrenos agrícolas y rurales', 'ana@terrasale.com', '+59112345680', '+59112345680', '/assets/team/avatar3.jpg');
            `);

            // Insertar propiedades de ejemplo
            await this.query(`
                INSERT INTO properties (title, location, size, price, description, seller_id) VALUES
                ('Terreno Zona Norte', 'Zona Norte, Santa Cruz', '500 m²', 45000.00, 'Excelente terreno en zona en desarrollo', 1),
                ('Lote Centro Histórico', 'Centro Histórico, La Paz', '350 m²', 80000.00, 'Terreno comercial en zona céntrica', 2),
                ('Propiedad Zona Sur', 'Zona Sur, Cochabamba', '1000 m²', 120000.00, 'Amplio terreno residencial', 3);
            `);

            // Insertar características
            await this.query(`
                INSERT INTO property_features (property_id, feature) VALUES
                (1, 'Agua'), (1, 'Luz'), (1, 'Cerca'),
                (2, 'Comercial'), (2, 'Esquina'),
                (3, 'Residencial'), (3, 'Seguridad');
            `);

            // Insertar imágenes
            await this.query(`
                INSERT INTO property_images (property_id, image_url, is_primary) VALUES
                (1, '/assets/properties/land1.jpg', TRUE),
                (2, '/assets/properties/land2.jpg', TRUE),
                (3, '/assets/properties/land3.jpg', TRUE);
            `);

            console.log('✅ Datos de ejemplo insertados correctamente');

        } catch (error) {
            console.error('❌ Error insertando datos de ejemplo:', error.message);
        }
    }

    // Ejecutar consultas
    async query(sql, params = []) {
        try {
            const [rows] = await this.pool.execute(sql, params);
            return rows;
        } catch (error) {
            console.error('Error en consulta MySQL:', error.message);
            console.error('SQL:', sql);
            console.error('Params:', params);
            throw error;
        }
    }

    // Ejecutar consultas que no retornan datos (INSERT, UPDATE, DELETE)
    async execute(sql, params = []) {
        try {
            const [result] = await this.pool.execute(sql, params);
            return result;
        } catch (error) {
            console.error('Error ejecutando en MySQL:', error.message);
            throw error;
        }
    }

    // Obtener una conexión para transacciones
    async getConnection() {
        return await this.pool.getConnection();
    }

    // Cerrar la conexión
    async close() {
        if (this.pool) {
            await this.pool.end();
            console.log('✅ Conexión MySQL cerrada');
        }
    }
}

module.exports = new MySQLDatabase();