/**
 * Rutas para gestión de propiedades/terrenos
 */

const express = require('express');
const router = express.Router();
const Property = require('../models/Property');

// GET /api/properties - Obtener todas las propiedades
router.get('/', async (req, res) => {
    try {
        const properties = await Property.getAll();
        res.json({
            success: true,
            data: properties,
            count: properties.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Error al obtener propiedades',
            message: error.message
        });
    }
});


// GET /api/properties - Obtener todas las propiedades DISPONIBLES
router.get('/', async (req, res) => {
    try {
        const { include_sold = 'false' } = req.query;
        
        let sql = `
            SELECT 
                p.*,
                s.name as seller_name,
                s.email as seller_email,
                s.phone as seller_phone,
                (SELECT image_url FROM property_images WHERE property_id = p.id AND is_primary = TRUE LIMIT 1) as primary_image
            FROM properties p
            LEFT JOIN sellers s ON p.seller_id = s.id
        `;

        // Si no se incluyen vendidas, filtrar solo disponibles
        if (include_sold !== 'true') {
            sql += ` WHERE p.status = 'available' `;
        }

        sql += ` ORDER BY p.created_at DESC`;

        const properties = await db.query(sql);
        
        // Obtener características para cada propiedad
        for (let property of properties) {
            const features = await db.query(
                'SELECT feature FROM property_features WHERE property_id = ?',
                [property.id]
            );
            property.features = features;
        }
        
        res.json({
            success: true,
            data: properties,
            count: properties.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Error al obtener propiedades',
            message: error.message
        });
    }
});

// POST /api/properties - Crear nueva propiedad
router.post('/', async (req, res) => {
    try {
        const newProperty = await Property.create(req.body);
        res.status(201).json({
            success: true,
            message: 'Propiedad creada exitosamente',
            data: newProperty
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Error al crear propiedad',
            message: error.message
        });
    }
});


// DELETE /api/properties/:id - Eliminar propiedad
router.delete('/:id', async (req, res) => {
    try {
        // Primero verificar si la propiedad tiene ventas asociadas
        const salesCheck = await db.query(
            'SELECT COUNT(*) as sales_count FROM sales WHERE property_id = ?',
            [req.params.id]
        );

        if (salesCheck[0].sales_count > 0) {
            return res.status(400).json({
                success: false,
                error: 'No se puede eliminar la propiedad porque tiene ventas asociadas'
            });
        }

        // Si no tiene ventas, proceder con la eliminación
        const sql = 'DELETE FROM properties WHERE id = ?';
        const result = await db.execute(sql, [req.params.id]);
        
        if (result.affectedRows > 0) {
            res.json({
                success: true,
                message: 'Propiedad eliminada exitosamente'
            });
        } else {
            res.status(404).json({
                success: false,
                error: 'Propiedad no encontrada'
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Error al eliminar propiedad',
            message: error.message
        });
    }
});

module.exports = router;