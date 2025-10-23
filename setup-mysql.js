/**
 * Script de configuración MySQL
 * Ejecutar: node setup-mysql.js
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

async function setupMySQL() {
    let connection;
    
    try {
        // Conectar sin especificar base de datos para crearla
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || ''
        });

        console.log('✅ Conectado al servidor MySQL');

        // Crear base de datos si no existe
        const dbName = process.env.DB_NAME || 'terrasale_db';
        await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
        console.log(`✅ Base de datos '${dbName}' verificada/creada`);

        console.log('\n🎉 Configuración MySQL completada!');
        console.log('📊 Ahora puedes ejecutar: npm run dev');

    } catch (error) {
        console.error('❌ Error en configuración MySQL:', error.message);
        console.log('\n🔧 Solución de problemas:');
        console.log('1. Verifica que MySQL esté ejecutándose');
        console.log('2. Revisa las credenciales en el archivo .env');
        console.log('3. Asegúrate de que el usuario tenga permisos para crear bases de datos');
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

setupMySQL();