/**
 * Rutas para gestión de contactos/leads
 */

const express = require('express');
const router = express.Router();
const Contact = require('../models/Contact');
const SlackService = require('../services/slackService');

// Middleware para log de requests
const logRequest = (req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`, req.body);
    next();
};

router.use(logRequest);

// GET /api/contacts - Obtener todos los contactos
router.get('/', async (req, res) => {
    try {
        const contacts = await Contact.getAll();
        
        res.json({
            success: true,
            data: contacts,
            count: contacts.length,
            message: 'Contactos obtenidos exitosamente'
        });
        
    } catch (error) {
        console.error('Error en GET /api/contacts:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener contactos',
            message: error.message
        });
    }
});

// GET /api/contacts/stats - Obtener estadísticas de contactos
router.get('/stats', async (req, res) => {
    try {
        const stats = await Contact.getStats();
        
        res.json({
            success: true,
            data: stats,
            message: 'Estadísticas obtenidas exitosamente'
        });
        
    } catch (error) {
        console.error('Error en GET /api/contacts/stats:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener estadísticas',
            message: error.message
        });
    }
});

// GET /api/contacts/status/:status - Obtener contactos por estado
router.get('/status/:status', async (req, res) => {
    try {
        const { status } = req.params;
        const contacts = await Contact.getByStatus(status);
        
        res.json({
            success: true,
            data: contacts,
            count: contacts.length,
            message: `Contactos con estado ${status} obtenidos exitosamente`
        });
        
    } catch (error) {
        console.error('Error en GET /api/contacts/status/:status:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener contactos por estado',
            message: error.message
        });
    }
});

// GET /api/contacts/type/:type - Obtener contactos por tipo
router.get('/type/:type', async (req, res) => {
    try {
        const { type } = req.params;
        const contacts = await Contact.getByType(type);
        
        res.json({
            success: true,
            data: contacts,
            count: contacts.length,
            message: `Contactos de tipo ${type} obtenidos exitosamente`
        });
        
    } catch (error) {
        console.error('Error en GET /api/contacts/type/:type:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener contactos por tipo',
            message: error.message
        });
    }
});

// GET /api/contacts/:id - Obtener contacto por ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const contact = await Contact.getById(id);
        
        if (!contact) {
            return res.status(404).json({
                success: false,
                error: 'Contacto no encontrado',
                message: `No se encontró el contacto con ID ${id}`
            });
        }
        
        res.json({
            success: true,
            data: contact,
            message: 'Contacto obtenido exitosamente'
        });
        
    } catch (error) {
        console.error('Error en GET /api/contacts/:id:', error);
        res.status(500).json({
            success: false,
            error: 'Error al obtener contacto',
            message: error.message
        });
    }
});

// POST /api/contacts - Crear nuevo contacto
router.post('/', async (req, res) => {
    try {
        const { name, email, phone, message, property_id, contact_type } = req.body;
        
        // Validaciones básicas
        if (!name || !name.trim()) {
            return res.status(400).json({
                success: false,
                error: 'Nombre requerido',
                message: 'El campo nombre es obligatorio'
            });
        }
        
        if (!email || !email.trim()) {
            return res.status(400).json({
                success: false,
                error: 'Email requerido',
                message: 'El campo email es obligatorio'
            });
        }
        
        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                error: 'Email inválido',
                message: 'El formato del email no es válido'
            });
        }

        const newContact = await Contact.create({
            name: name.trim(),
            email: email.trim(),
            phone: phone ? phone.trim() : null,
            message: message ? message.trim() : null,
            property_id: property_id || null,
            contact_type: contact_type || 'general'
        });

        // Notificar en Slack (si el servicio existe)
        try {
            if (SlackService && SlackService.notifyNewContact) {
                await SlackService.notifyNewContact(newContact);
            }
        } catch (slackError) {
            console.warn('Error al notificar en Slack:', slackError);
            // No falla la creación si Slack falla
        }

        res.status(201).json({
            success: true,
            message: 'Contacto creado exitosamente',
            data: newContact
        });
        
    } catch (error) {
        console.error('Error en POST /api/contacts:', error);
        res.status(500).json({
            success: false,
            error: 'Error al crear contacto',
            message: error.message
        });
    }
});

// PUT /api/contacts/:id - Actualizar contacto completo
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, phone, message, property_id, contact_type, status } = req.body;
        
        // Validaciones
        if (!name || !name.trim()) {
            return res.status(400).json({
                success: false,
                error: 'Nombre requerido',
                message: 'El campo nombre es obligatorio'
            });
        }
        
        if (!email || !email.trim()) {
            return res.status(400).json({
                success: false,
                error: 'Email requerido',
                message: 'El campo email es obligatorio'
            });
        }

        const updatedContact = await Contact.update(id, {
            name: name.trim(),
            email: email.trim(),
            phone: phone ? phone.trim() : null,
            message: message ? message.trim() : null,
            property_id: property_id || null,
            contact_type: contact_type || 'general',
            status: status || 'new'
        });

        res.json({
            success: true,
            message: 'Contacto actualizado exitosamente',
            data: updatedContact
        });
        
    } catch (error) {
        console.error('Error en PUT /api/contacts/:id:', error);
        
        if (error.message === 'Contacto no encontrado') {
            return res.status(404).json({
                success: false,
                error: 'Contacto no encontrado',
                message: error.message
            });
        }
        
        res.status(500).json({
            success: false,
            error: 'Error al actualizar contacto',
            message: error.message
        });
    }
});

// PATCH /api/contacts/:id/status - Actualizar solo el estado
router.patch('/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        if (!status) {
            return res.status(400).json({
                success: false,
                error: 'Estado requerido',
                message: 'El campo status es obligatorio'
            });
        }

        const validStatuses = ['new', 'contacted', 'responded', 'closed', 'rejected'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                error: 'Estado inválido',
                message: `El estado debe ser uno de: ${validStatuses.join(', ')}`
            });
        }

        const updatedContact = await Contact.updateStatus(id, status);

        res.json({
            success: true,
            message: `Estado actualizado a ${status} exitosamente`,
            data: updatedContact
        });
        
    } catch (error) {
        console.error('Error en PATCH /api/contacts/:id/status:', error);
        
        if (error.message === 'Contacto no encontrado') {
            return res.status(404).json({
                success: false,
                error: 'Contacto no encontrado',
                message: error.message
            });
        }
        
        res.status(500).json({
            success: false,
            error: 'Error al actualizar estado',
            message: error.message
        });
    }
});

// DELETE /api/contacts/:id - Eliminar contacto
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await Contact.delete(id);

        res.json({
            success: true,
            message: 'Contacto eliminado exitosamente',
            data: result
        });
        
    } catch (error) {
        console.error('Error en DELETE /api/contacts/:id:', error);
        
        if (error.message === 'Contacto no encontrado') {
            return res.status(404).json({
                success: false,
                error: 'Contacto no encontrado',
                message: error.message
            });
        }
        
        res.status(500).json({
            success: false,
            error: 'Error al eliminar contacto',
            message: error.message
        });
    }
});

// Middleware para manejar rutas no encontradas
router.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        error: 'Ruta no encontrada',
        message: `La ruta ${req.originalUrl} no existe`
    });
});

module.exports = router;