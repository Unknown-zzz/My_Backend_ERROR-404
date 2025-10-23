/**
 * Rutas para gestión de usuarios - TerraSale Admin
 */

const bcrypt = require('bcrypt');

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const SlackService = require('../services/slackService');

// GET /api/users - Obtener todos los usuarios
router.get('/', async (req, res) => {
    try {
        const users = await User.getAll();
        res.json({
            success: true,
            data: users,
            count: users.length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Error al obtener usuarios',
            message: error.message
        });
    }
});

// GET /api/users/stats - Obtener estadísticas de usuarios
router.get('/stats', async (req, res) => {
    try {
        const stats = await User.getStats();
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

// GET /api/users/:id - Obtener usuario por ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.getById(id);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'Usuario no encontrado'
            });
        }

        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Error al obtener usuario',
            message: error.message
        });
    }
});

// POST /api/users - Crear nuevo usuario
// POST /api/users - Crear nuevo usuario
router.post('/', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Nombre, email y contraseña son requeridos'
            });
        }

        // Hashear la contraseña antes de guardarla
        const saltRounds = 10;
        const password_hash = await bcrypt.hash(password, saltRounds);

        const newUser = await User.create({
            name, 
            email, 
            password_hash
        });

        res.status(201).json({
            success: true,
            message: 'Usuario creado exitosamente',
            data: newUser
        });
    } catch (error) {
        if (error.message === 'El email ya está registrado') {
            return res.status(409).json({
                success: false,
                error: 'El email ya está registrado'
            });
        }
        
        res.status(500).json({
            success: false,
            error: 'Error al crear usuario',
            message: error.message
        });
    }
});

// PUT /api/users/:id - Actualizar usuario
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        // No permitir actualizar campos sensibles directamente
        delete updateData.password_hash;
        delete updateData.last_login;
        delete updateData.created_at;

        const updatedUser = await User.update(id, updateData);
        
        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                error: 'Usuario no encontrado'
            });
        }

        res.json({
            success: true,
            message: 'Usuario actualizado exitosamente',
            data: updatedUser
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Error al actualizar usuario',
            message: error.message
        });
    }
});

// DELETE /api/users/:id - Desactivar usuario (soft delete)
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await User.deactivate(id);
        
        if (!result) {
            return res.status(404).json({
                success: false,
                error: 'Usuario no encontrado'
            });
        }

        res.json({
            success: true,
            message: 'Usuario desactivado exitosamente'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Error al desactivar usuario',
            message: error.message
        });
    }
});

// POST /api/users/:id/update-login - Actualizar último login
router.post('/:id/update-login', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await User.updateLastLogin(id);
        
        if (!result) {
            return res.status(404).json({
                success: false,
                error: 'Usuario no encontrado'
            });
        }

        res.json({
            success: true,
            message: 'Último login actualizado'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Error al actualizar último login',
            message: error.message
        });
    }
});

module.exports = router;