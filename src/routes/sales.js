/**
 * Rutas para gestión de ventas
 */

const express = require('express');
const router = express.Router();
const Sale = require('../models/Sale');

// GET /api/sales - Obtener todas las ventas
router.get('/', async (req, res) => {
    try {
        const sales = await Sale.getAll();
        res.json({
            success: true,
            data: sales,
            count: sales.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Error al obtener ventas',
            message: error.message
        });
    }
});

// GET /api/sales/stats - Estadísticas de ventas
router.get('/stats', async (req, res) => {
    try {
        const { period = 'month' } = req.query;
        const stats = await Sale.getStats(period);
        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Error al obtener estadísticas',
            message: error.message
        });
    }
});

// GET /api/sales/trends - Tendencias mensuales
router.get('/trends', async (req, res) => {
    try {
        const trends = await Sale.getMonthlyTrends();
        res.json({
            success: true,
            data: trends
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Error al obtener tendencias',
            message: error.message
        });
    }
});

// GET /api/sales/seller/:id - Ventas por vendedor
router.get('/seller/:id', async (req, res) => {
    try {
        const sales = await Sale.getBySeller(req.params.id);
        res.json({
            success: true,
            data: sales
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Error al obtener ventas del vendedor',
            message: error.message
        });
    }
});

// POST /api/sales - Crear nueva venta
router.post('/', async (req, res) => {
    try {
        const newSale = await Sale.create(req.body);
        res.status(201).json({
            success: true,
            message: 'Venta creada exitosamente',
            data: newSale
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Error al crear venta',
            message: error.message
        });
    }
});

// PUT /api/sales/:id - Actualizar venta
router.put('/:id', async (req, res) => {
    try {
        const updatedSale = await Sale.update(req.params.id, req.body);
        if (!updatedSale) {
            return res.status(404).json({
                success: false,
                error: 'Venta no encontrada'
            });
        }
        res.json({
            success: true,
            message: 'Venta actualizada exitosamente',
            data: updatedSale
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Error al actualizar venta',
            message: error.message
        });
    }
});

// DELETE /api/sales/:id - Eliminar venta
router.delete('/:id', async (req, res) => {
    try {
        const deleted = await Sale.delete(req.params.id);
        if (!deleted) {
            return res.status(404).json({
                success: false,
                error: 'Venta no encontrada'
            });
        }
        res.json({
            success: true,
            message: 'Venta eliminada exitosamente'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Error al eliminar venta',
            message: error.message
        });
    }
});

module.exports = router;