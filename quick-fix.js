/**
 * Script de corrección rápida - Ejecutar una vez
 * node quick-fix.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Aplicando correcciones rápidas...');

// Crear directorios necesarios
const directories = [
    'src/models',
    'src/routes', 
    'src/services',
    'src/controllers',
    'src/config',
    '../../database/assets/team',
    '../../database/assets/properties'
];

directories.forEach(dir => {
    const fullPath = path.join(__dirname, dir);
    if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
        console.log(`✅ Directorio creado: ${dir}`);
    }
});

// Crear archivo .env si no existe
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
    const envContent = `# Configuración del Servidor
NODE_ENV=development
PORT=3000

# Base de Datos
DB_PATH=../../database/terrasale.db

# Slack (opcional)
SLACK_WEBHOOK_URL=
SLACK_CHANNEL=#terrasale-notifications
`;
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Archivo .env creado');
}

console.log('🎉 Correcciones aplicadas. Ahora ejecuta: npm run dev');