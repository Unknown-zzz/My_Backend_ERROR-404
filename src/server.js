/**
 * Servidor Principal TerraSale Backend - CORREGIDO
 */

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;


app.use(cors());



// Middlewares de parsing
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos
app.use('/assets', express.static(path.join(__dirname, '../../database/assets')));

// Importar y usar rutas con manejo de errores
try {
    const sellerRoutes = require('./routes/sellers');
    const propertyRoutes = require('./routes/properties');
    const contactRoutes = require('./routes/contacts');
    const slackRoutes = require('./routes/slack');
    const salesRoutes = require('./routes/Sales');
    const usersRoutes = require('./routes/users');
    const authRoutes = require('./routes/auth');
    


    app.use('/api/sellers', sellerRoutes);
    app.use('/api/properties', propertyRoutes);
    app.use('/api/contacts', contactRoutes);
    app.use('/api/slack', slackRoutes);
    app.use('/api/Sales', salesRoutes);
    app.use('/api/Users', usersRoutes);
    app.use('/api/auth', authRoutes);



    
    console.log('✅ Todas las rutas cargadas correctamente');
} catch (error) {
    console.error('❌ Error cargando rutas:', error.message);
}

// Ruta de salud
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'TerraSale API funcionando correctamente',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Ruta raíz
app.get('/', (req, res) => {
    res.json({
        message: '🏡 TerraSale Backend API',
        endpoints: {
            health: '/api/health',
            sellers: '/api/sellers',
            properties: '/api/properties',
            contacts: '/api/contacts',
            slack: '/api/slack',
            sales: '/api/sales',
            users: '/api/users'

        },
        documentation: 'Ver README.md para más información'
    });
});

// Manejo de errores 404
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Ruta no encontrada',
        path: req.originalUrl,
        available_endpoints: ['/api/health', '/api/sellers', '/api/properties', '/api/contacts', '/api/slack']
    });
});

// Manejo global de errores
app.use((error, req, res, next) => {
    console.error('Error global:', error);
    res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Algo salió mal'
    });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor TerraSale ejecutándose en puerto ${PORT}`);
    console.log(`📊 Entorno: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🏠 API Base: http://localhost:${PORT}/api`);
});

module.exports = app;