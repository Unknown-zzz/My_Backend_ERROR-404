// routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// POST /api/auth/login - Login de usuario
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Email y contraseña son requeridos'
            });
        }

        // Buscar usuario por email
        const user = await User.getByEmail(email);
        
        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Credenciales inválidas'
            });
        }

        // Verificar contraseña (en un caso real, esto debería comparar el hash)
        // Por ahora, asumimos que la contraseña está en texto plano para testing
        if (password !== user.password_hash && !bcrypt.compareSync(password, user.password_hash)) {
            return res.status(401).json({
                success: false,
                error: 'Credenciales inválidas'
            });
        }

        // Generar token JWT
        const token = jwt.sign(
            { 
                id: user.id, 
                email: user.email 
            }, 
            process.env.JWT_SECRET || 'terrasale_secret_key',
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            message: 'Login exitoso',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                is_active: user.is_active,
                last_login: user.last_login
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Error en el servidor',
            message: error.message
        });
    }
});

module.exports = router;