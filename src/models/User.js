/**
 * Modelo de Usuarios - TerraSale Admin
 */

const db = require('../config/database');

class User {
    // Obtener todos los usuarios activos
    static async getAll() {
        try {
            const sql = `
                SELECT 
                    id, name, email, phone, address, role, is_active, 
                    last_login, created_at, updated_at
                FROM users 
                WHERE is_active = TRUE 
                ORDER BY name ASC
            `;
            return await db.query(sql);
        } catch (error) {
            throw new Error(`Error al obtener usuarios: ${error.message}`);
        }
    }

    // Obtener usuario por ID
    static async getById(id) {
        try {
            const sql = `
                SELECT 
                    id, name, email, phone, address, role, is_active,
                    last_login, created_at, updated_at
                FROM users 
                WHERE id = ? AND is_active = TRUE
            `;
            const users = await db.query(sql, [id]);
            return users.length > 0 ? users[0] : null;
        } catch (error) {
            throw new Error(`Error al obtener usuario: ${error.message}`);
        }
    }

    // Obtener usuario por email (para login)
    static async getByEmail(email) {
        try {
            const sql = `
                SELECT 
                    id, name, email, phone, address, password_hash, role, is_active,
                    last_login, created_at, updated_at
                FROM users 
                WHERE email = ? AND is_active = TRUE
            `;
            const users = await db.query(sql, [email]);
            return users.length > 0 ? users[0] : null;
        } catch (error) {
            throw new Error(`Error al buscar usuario por email: ${error.message}`);
        }
    }

    // Crear nuevo usuario
    static async create(userData) {
        try {
            const { name, email, password_hash, phone, address } = userData;
            
            const sql = `
                INSERT INTO users 
                (name, email, password_hash, phone, address) 
                VALUES (?, ?, ?, ?, ?)
            `;
            
            const result = await db.execute(sql, [
                name, 
                email, 
                password_hash,
                phone || null,
                address || null
            ]);
            
            // Retornar el usuario creado sin password_hash
            return await this.getById(result.insertId);
        } catch (error) {
            // Manejar error de duplicado de email
            if (error.code === 'ER_DUP_ENTRY') {
                throw new Error('El email ya está registrado');
            }
            throw new Error(`Error al crear usuario: ${error.message}`);
        }
    }

    // Actualizar usuario
    static async update(id, userData) {
        try {
            const allowedFields = ['name', 'email', 'phone', 'address'];
            const fields = [];
            const values = [];
            
            // Construir dinámicamente la consulta UPDATE solo con campos permitidos
            Object.keys(userData).forEach(key => {
                if (userData[key] !== undefined && allowedFields.includes(key)) {
                    fields.push(`${key} = ?`);
                    // Convertir empty strings a null para phone y address
                    if ((key === 'phone' || key === 'address') && userData[key] === '') {
                        values.push(null);
                    } else {
                        values.push(userData[key]);
                    }
                }
            });
            
            if (fields.length === 0) {
                throw new Error('No hay campos válidos para actualizar');
            }
            
            fields.push('updated_at = CURRENT_TIMESTAMP');
            values.push(id);
            
            const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
            const result = await db.execute(sql, values);
            
            if (result.affectedRows === 0) {
                return null;
            }
            
            // Devolver el usuario actualizado
            return await this.getById(id);
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                throw new Error('El email ya está registrado');
            }
            throw new Error(`Error al actualizar usuario: ${error.message}`);
        }
    }

    // Resto de métodos permanecen igual...
    // Desactivar usuario (soft delete)
    static async deactivate(id) {
        try {
            const sql = `UPDATE users SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
            const result = await db.execute(sql, [id]);
            return result.affectedRows > 0;
        } catch (error) {
            throw new Error(`Error al desactivar usuario: ${error.message}`);
        }
    }

    // Actualizar último login
    static async updateLastLogin(id) {
        try {
            const sql = `UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?`;
            const result = await db.execute(sql, [id]);
            return result.affectedRows > 0;
        } catch (error) {
            throw new Error(`Error al actualizar último login: ${error.message}`);
        }
    }

    // Obtener estadísticas de usuarios
    static async getStats() {
        try {
            const sql = `
                SELECT 
                    COUNT(*) as total_users,
                    COUNT(CASE WHEN is_active = TRUE THEN 1 END) as active_users,
                    COUNT(CASE WHEN is_active = FALSE THEN 1 END) as inactive_users
                FROM users
            `;
            const stats = await db.query(sql);
            return stats[0];
        } catch (error) {
            throw new Error(`Error al obtener estadísticas: ${error.message}`);
        }
    }
}

module.exports = User;