/**
 * Modelo de Vendedores - Adaptado para usar tabla users con rol seller
 */

const db = require('../config/database');

class Seller {
    // Obtener todos los vendedores activos (users con rol seller)
    static async getAll() {
        try {
            const sql = `
                SELECT 
                    id, name, email, phone, address,
                    role, is_active, last_login, created_at, updated_at
                FROM users 
                WHERE role = 'seller' AND is_active = TRUE 
                ORDER BY name ASC
            `;
            return await db.query(sql);
        } catch (error) {
            throw new Error(`Error al obtener vendedores: ${error.message}`);
        }
    }

    // Obtener vendedor por ID
    static async getById(id) {
        try {
            const sql = `
                SELECT 
                    id, name, email, phone, address,
                    role, is_active, last_login, created_at, updated_at
                FROM users 
                WHERE id = ? AND role = 'seller' AND is_active = TRUE
            `;
            const sellers = await db.query(sql, [id]);
            return sellers.length > 0 ? sellers[0] : null;
        } catch (error) {
            throw new Error(`Error al obtener vendedor: ${error.message}`);
        }
    }

    // Crear nuevo vendedor (crear user con rol seller)
    static async create(sellerData) {
        try {
            const { name, email, phone, address, password_hash } = sellerData;
            
            const sql = `
                INSERT INTO users 
                (name, email, phone, address, password_hash, role) 
                VALUES (?, ?, ?, ?, ?, 'seller')
            `;
            
            const result = await db.execute(sql, [
                name, email, phone, address, password_hash
            ]);
            
            return { 
                id: result.insertId, 
                name, 
                email, 
                phone, 
                address, 
                role: 'seller',
                is_active: true
            };
        } catch (error) {
            // Manejar error de duplicado de email
            if (error.code === 'ER_DUP_ENTRY') {
                throw new Error('El email ya está registrado');
            }
            throw new Error(`Error al crear vendedor: ${error.message}`);
        }
    }

    // Actualizar vendedor
    static async update(id, sellerData) {
        try {
            const fields = [];
            const values = [];
            
            // Construir dinámicamente la consulta UPDATE
            Object.keys(sellerData).forEach(key => {
                if (sellerData[key] !== undefined && key !== 'role') {
                    fields.push(`${key} = ?`);
                    values.push(sellerData[key]);
                }
            });
            
            if (fields.length === 0) {
                throw new Error('No hay campos para actualizar');
            }
            
            values.push(id);
            
            const sql = `
                UPDATE users 
                SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP 
                WHERE id = ? AND role = 'seller'
            `;
            const result = await db.execute(sql, values);
            
            return result.affectedRows > 0 ? await this.getById(id) : null;
        } catch (error) {
            throw new Error(`Error al actualizar vendedor: ${error.message}`);
        }
    }

    // Desactivar vendedor (soft delete)
    static async deactivate(id) {
        try {
            const sql = `
                UPDATE users 
                SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP 
                WHERE id = ? AND role = 'seller'
            `;
            const result = await db.execute(sql, [id]);
            return result.affectedRows > 0;
        } catch (error) {
            throw new Error(`Error al desactivar vendedor: ${error.message}`);
        }
    }

    // Activar vendedor
    static async activate(id) {
        try {
            const sql = `
                UPDATE users 
                SET is_active = TRUE, updated_at = CURRENT_TIMESTAMP 
                WHERE id = ? AND role = 'seller'
            `;
            const result = await db.execute(sql, [id]);
            return result.affectedRows > 0;
        } catch (error) {
            throw new Error(`Error al activar vendedor: ${error.message}`);
        }
    }

    // Cambiar rol de usuario a seller
    static async convertToSeller(userId) {
        try {
            const sql = `
                UPDATE users 
                SET role = 'seller', updated_at = CURRENT_TIMESTAMP 
                WHERE id = ?
            `;
            const result = await db.execute(sql, [userId]);
            return result.affectedRows > 0;
        } catch (error) {
            throw new Error(`Error al convertir usuario a vendedor: ${error.message}`);
        }
    }

    // Obtener estadísticas de vendedores
    static async getStats() {
        try {
            const sql = `
                SELECT 
                    COUNT(*) as total_sellers,
                    COUNT(CASE WHEN is_active = TRUE THEN 1 END) as active_sellers,
                    COUNT(CASE WHEN is_active = FALSE THEN 1 END) as inactive_sellers
                FROM users
                WHERE role = 'seller'
            `;
            const stats = await db.query(sql);
            return stats[0];
        } catch (error) {
            throw new Error(`Error al obtener estadísticas: ${error.message}`);
        }
    }

    // Buscar vendedores por nombre o email
    static async search(query) {
        try {
            const sql = `
                SELECT 
                    id, name, email, phone, address,
                    role, is_active, last_login, created_at, updated_at
                FROM users 
                WHERE role = 'seller' 
                AND is_active = TRUE
                AND (name LIKE ? OR email LIKE ?)
                ORDER BY name ASC
            `;
            const searchTerm = `%${query}%`;
            return await db.query(sql, [searchTerm, searchTerm]);
        } catch (error) {
            throw new Error(`Error al buscar vendedores: ${error.message}`);
        }
    }

    // Obtener vendedor por email
    static async getByEmail(email) {
        try {
            const sql = `
                SELECT 
                    id, name, email, phone, address,
                    role, is_active, last_login, created_at, updated_at
                FROM users 
                WHERE email = ? AND role = 'seller' AND is_active = TRUE
            `;
            const sellers = await db.query(sql, [email]);
            return sellers.length > 0 ? sellers[0] : null;
        } catch (error) {
            throw new Error(`Error al obtener vendedor por email: ${error.message}`);
        }
    }

    // Obtener propiedades asignadas a un vendedor
    static async getAssignedProperties(sellerId) {
        try {
            const sql = `
                SELECT 
                    p.id, p.title, p.location, p.price, p.status,
                    p.property_type, p.size, p.created_at
                FROM properties p
                WHERE p.seller_id = ? AND p.is_active = TRUE
                ORDER BY p.created_at DESC
            `;
            return await db.query(sql, [sellerId]);
        } catch (error) {
            throw new Error(`Error al obtener propiedades del vendedor: ${error.message}`);
        }
    }
}

module.exports = Seller;