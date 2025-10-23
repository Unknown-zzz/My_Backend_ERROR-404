/**
 * Modelo de Contactos/Leads para MySQL
 */

const db = require('../config/database');

class Contact {
    // Obtener todos los contactos
    static async getAll() {
        try {
            const sql = `
                SELECT 
                    c.*,
                    p.title as property_title,
                    p.location as property_location
                FROM contacts c
                LEFT JOIN properties p ON c.property_id = p.id
                ORDER BY c.created_at DESC
            `;
            const contacts = await db.query(sql);
            return contacts;
        } catch (error) {
            console.error('Error en Contact.getAll:', error);
            throw new Error(`Error al obtener contactos: ${error.message}`);
        }
    }

    // Obtener contacto por ID
    static async getById(id) {
        try {
            const sql = `
                SELECT 
                    c.*,
                    p.title as property_title,
                    p.location as property_location
                FROM contacts c
                LEFT JOIN properties p ON c.property_id = p.id
                WHERE c.id = ?
            `;
            const contacts = await db.query(sql, [id]);
            return contacts[0] || null;
        } catch (error) {
            console.error('Error en Contact.getById:', error);
            throw new Error(`Error al obtener contacto: ${error.message}`);
        }
    }

    // Crear nuevo contacto
    static async create(contactData) {
        try {
            const { 
                name, 
                email, 
                phone, 
                message, 
                property_id = null, 
                contact_type = 'general',
                status = 'new'
            } = contactData;
            
            console.log('Datos recibidos en Contact.create:', contactData);
            
            const sql = `
                INSERT INTO contacts 
                (name, email, phone, message, property_id, contact_type, status) 
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `;
            
            const result = await db.execute(sql, [
                name, 
                email, 
                phone, 
                message, 
                property_id, 
                contact_type,
                status
            ]);
            
            console.log('Resultado de la inserción:', result);
            
            // Obtener el contacto recién creado
            const newContact = await this.getById(result.insertId);
            return newContact;
            
        } catch (error) {
            console.error('Error en Contact.create:', error);
            throw new Error(`Error al crear contacto: ${error.message}`);
        }
    }

    // Actualizar contacto
    static async update(id, contactData) {
        try {
            const { 
                name, 
                email, 
                phone, 
                message, 
                property_id, 
                contact_type, 
                status 
            } = contactData;
            
            const sql = `
                UPDATE contacts 
                SET name = ?, email = ?, phone = ?, message = ?, 
                    property_id = ?, contact_type = ?, status = ?
                WHERE id = ?
            `;
            
            const result = await db.execute(sql, [
                name, email, phone, message, 
                property_id, contact_type, status, id
            ]);
            
            if (result.affectedRows === 0) {
                throw new Error('Contacto no encontrado');
            }
            
            return await this.getById(id);
        } catch (error) {
            console.error('Error en Contact.update:', error);
            throw new Error(`Error al actualizar contacto: ${error.message}`);
        }
    }

    // Actualizar solo el estado de contacto (CORREGIDO)
    static async updateStatus(id, status) {
        try {
            const sql = `
                UPDATE contacts 
                SET status = ?
                WHERE id = ?
            `;
            const result = await db.execute(sql, [status, id]);
            
            if (result.affectedRows === 0) {
                throw new Error('Contacto no encontrado');
            }
            
            return await this.getById(id);
        } catch (error) {
            console.error('Error en Contact.updateStatus:', error);
            throw new Error(`Error al actualizar estado: ${error.message}`);
        }
    }

    // Eliminar contacto
    static async delete(id) {
        try {
            const sql = `DELETE FROM contacts WHERE id = ?`;
            const result = await db.execute(sql, [id]);
            
            if (result.affectedRows === 0) {
                throw new Error('Contacto no encontrado');
            }
            
            return { success: true, message: 'Contacto eliminado correctamente' };
        } catch (error) {
            console.error('Error en Contact.delete:', error);
            throw new Error(`Error al eliminar contacto: ${error.message}`);
        }
    }

    // Obtener contactos por estado
    static async getByStatus(status) {
        try {
            const sql = `
                SELECT 
                    c.*,
                    p.title as property_title,
                    p.location as property_location
                FROM contacts c
                LEFT JOIN properties p ON c.property_id = p.id
                WHERE c.status = ?
                ORDER BY c.created_at DESC
            `;
            return await db.query(sql, [status]);
        } catch (error) {
            console.error('Error en Contact.getByStatus:', error);
            throw new Error(`Error al obtener contactos por estado: ${error.message}`);
        }
    }

    // Obtener contactos por tipo
    static async getByType(contact_type) {
        try {
            const sql = `
                SELECT 
                    c.*,
                    p.title as property_title,
                    p.location as property_location
                FROM contacts c
                LEFT JOIN properties p ON c.property_id = p.id
                WHERE c.contact_type = ?
                ORDER BY c.created_at DESC
            `;
            return await db.query(sql, [contact_type]);
        } catch (error) {
            console.error('Error en Contact.getByType:', error);
            throw new Error(`Error al obtener contactos por tipo: ${error.message}`);
        }
    }

    // Obtener estadísticas de contactos
    static async getStats() {
        try {
            const sql = `
                SELECT 
                    status,
                    contact_type,
                    COUNT(*) as count
                FROM contacts 
                GROUP BY status, contact_type
            `;
            const stats = await db.query(sql);
            
            // Calcular totales
            const totalContacts = await db.query('SELECT COUNT(*) as total FROM contacts');
            const newContacts = await db.query('SELECT COUNT(*) as count FROM contacts WHERE status = "new"');
            
            return {
                total: totalContacts[0].total,
                new: newContacts[0].count,
                byStatus: stats.filter(stat => stat.status),
                byType: stats.filter(stat => stat.contact_type)
            };
        } catch (error) {
            console.error('Error en Contact.getStats:', error);
            throw new Error(`Error al obtener estadísticas: ${error.message}`);
        }
    }

    // Buscar contactos
    static async search(searchTerm) {
        try {
            const sql = `
                SELECT 
                    c.*,
                    p.title as property_title,
                    p.location as property_location
                FROM contacts c
                LEFT JOIN properties p ON c.property_id = p.id
                WHERE c.name LIKE ? OR c.email LIKE ? OR c.phone LIKE ? OR c.message LIKE ?
                ORDER BY c.created_at DESC
            `;
            const searchPattern = `%${searchTerm}%`;
            return await db.query(sql, [searchPattern, searchPattern, searchPattern, searchPattern]);
        } catch (error) {
            console.error('Error en Contact.search:', error);
            throw new Error(`Error al buscar contactos: ${error.message}`);
        }
    }

    // Obtener contactos recientes (últimos 7 días)
    static async getRecent(limit = 10) {
        try {
            const sql = `
                SELECT 
                    c.*,
                    p.title as property_title,
                    p.location as property_location
                FROM contacts c
                LEFT JOIN properties p ON c.property_id = p.id
                WHERE c.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
                ORDER BY c.created_at DESC
                LIMIT ?
            `;
            return await db.query(sql, [limit]);
        } catch (error) {
            console.error('Error en Contact.getRecent:', error);
            throw new Error(`Error al obtener contactos recientes: ${error.message}`);
        }
    }

    // Obtener contactos por rango de fechas
    static async getByDateRange(startDate, endDate) {
        try {
            const sql = `
                SELECT 
                    c.*,
                    p.title as property_title,
                    p.location as property_location
                FROM contacts c
                LEFT JOIN properties p ON c.property_id = p.id
                WHERE DATE(c.created_at) BETWEEN ? AND ?
                ORDER BY c.created_at DESC
            `;
            return await db.query(sql, [startDate, endDate]);
        } catch (error) {
            console.error('Error en Contact.getByDateRange:', error);
            throw new Error(`Error al obtener contactos por rango de fechas: ${error.message}`);
        }
    }
}

module.exports = Contact;