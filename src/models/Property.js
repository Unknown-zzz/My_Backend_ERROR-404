/**
 * Modelo de Propiedades/Terrenos - Adaptado para MySQL
 */

const db = require('../config/database');

class Property {


    // Obtener todas las propiedades activas
    static async getAll() {
        try {
            const sql = `
                SELECT 
                    p.*,
                    s.name as seller_name,
                    s.email as seller_email,
                    s.phone as seller_phone,
                    (SELECT image_url FROM property_images WHERE property_id = p.id AND is_primary = TRUE LIMIT 1) as primary_image
                FROM properties p
                LEFT JOIN sellers s ON p.seller_id = s.id
                WHERE p.status = 'available'
                ORDER BY p.created_at DESC
            `;
            const properties = await db.query(sql);
            
            // Obtener características para cada propiedad
            for (let property of properties) {
                const features = await db.query(
                    'SELECT feature FROM property_features WHERE property_id = ?',
                    [property.id]
                );
                property.features = features;
            }
            
            return properties;
        } catch (error) {
            throw new Error(`Error al obtener propiedades: ${error.message}`);
        }
    }

    // Obtener propiedad por ID
    static async getById(id) {
        try {
            const sql = `
                SELECT 
                    p.*,
                    s.name as seller_name,
                    s.email as seller_email,
                    s.phone as seller_phone,
                    s.whatsapp as seller_whatsapp
                FROM properties p
                LEFT JOIN sellers s ON p.seller_id = s.id
                WHERE p.id = ?
            `;
            const properties = await db.query(sql, [id]);
            
            if (properties.length === 0) return null;
            
            const property = properties[0];
            
            // Obtener características
            const features = await db.query(
                'SELECT feature FROM property_features WHERE property_id = ?',
                [id]
            );
            property.features = features;
            
            // Obtener imágenes
            const images = await db.query(
                'SELECT image_url, is_primary FROM property_images WHERE property_id = ?',
                [id]
            );
            property.images = images;
            
            return property;
        } catch (error) {
            throw new Error(`Error al obtener propiedad: ${error.message}`);
        }
    }

    // Crear nueva propiedad
    static async create(propertyData) {
        const connection = await db.getConnection();
        
        try {
            await connection.beginTransaction();
            
            const {
                title, location, size, price, description, 
                property_type, seller_id, features = []
            } = propertyData;
            
            const sql = `
                INSERT INTO properties 
                (title, location, size, price, description, property_type, seller_id) 
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `;
            
            const result = await connection.execute(sql, [
                title, location, size, price, description, property_type, seller_id
            ]);
            
            const propertyId = result[0].insertId;
            
            // Insertar características
            for (const feature of features) {
                await connection.execute(
                    'INSERT INTO property_features (property_id, feature) VALUES (?, ?)',
                    [propertyId, feature]
                );
            }
            
            await connection.commit();
            return await this.getById(propertyId);
            
        } catch (error) {
            await connection.rollback();
            throw new Error(`Error al crear propiedad: ${error.message}`);
        } finally {
            connection.release();
        }
    }
}

module.exports = Property;