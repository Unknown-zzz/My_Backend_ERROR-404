/**
 * Rutas para gestión de vendedores
 * Define todos los endpoints relacionados con vendedores
 */

const express = require('express');
const router = express.Router();
const sellerController = require('../controllers/sellerController');

// Middleware de validación (simplificado)
const validateSeller = (req, res, next) => {
    const { name, email } = req.body;
    
    if (req.method === 'POST' || req.method === 'PUT') {
        if (!name || name.trim().length < 2) {
            return res.status(400).json({
                success: false,
                error: 'El nombre debe tener al menos 2 caracteres'
            });
        }
        
        if (!email || !email.includes('@')) {
            return res.status(400).json({
                success: false,
                error: 'Email válido requerido'
            });
        }
    }
    
    next();
};

// GET /api/sellers - Obtener todos los vendedores
router.get('/', sellerController.getAllSellers);

// GET /api/sellers/stats - Estadísticas de vendedores
router.get('/stats', sellerController.getSellerStats);

// GET /api/sellers/:id - Obtener vendedor por ID
router.get('/:id', sellerController.getSellerById);

// POST /api/sellers - Crear nuevo vendedor
router.post('/', validateSeller, sellerController.createSeller);

// PUT /api/sellers/:id - Actualizar vendedor
router.put('/:id', validateSeller, sellerController.updateSeller);

// DELETE /api/sellers/:id - Eliminar vendedor
router.delete('/:id', sellerController.deleteSeller);

module.exports = router;