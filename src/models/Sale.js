/**
 * Modelo de Ventas
 */

const db = require('../config/database');

class Sale {
    // Obtener todas las ventas
    static async getAll() {
        try {
            const sql = `
                SELECT 
                    s.*,
                    p.title as property_title,
                    p.location as property_location,
                    sel.name as seller_name,
                    sel.email as seller_email
                FROM sales s
                LEFT JOIN properties p ON s.property_id = p.id
                LEFT JOIN sellers sel ON s.seller_id = sel.id
                ORDER BY s.sale_date DESC
            `;
            return await db.query(sql);
        } catch (error) {
            throw new Error(`Error al obtener ventas: ${error.message}`);
        }
    }

    // Obtener venta por ID
    static async getById(id) {
        try {
            const sql = `
                SELECT 
                    s.*,
                    p.title as property_title,
                    p.location as property_location,
                    sel.name as seller_name
                FROM sales s
                LEFT JOIN properties p ON s.property_id = p.id
                LEFT JOIN sellers sel ON s.seller_id = sel.id
                WHERE s.id = ?
            `;
            const sales = await db.query(sql, [id]);
            return sales.length > 0 ? sales[0] : null;
        } catch (error) {
            throw new Error(`Error al obtener venta: ${error.message}`);
        }
    }

    // O en su lugar, modificar el método create existente:
static async create(saleData) {
    const connection = await db.getConnection();
    
    try {
        await connection.beginTransaction();

        const {
            property_id, seller_id, buyer_name, buyer_email, buyer_phone,
            sale_amount, commission, sale_date, status = 'completed'
        } = saleData;

        // 1. Insertar la venta
        const saleSql = `
            INSERT INTO sales 
            (property_id, seller_id, buyer_name, buyer_email, buyer_phone, sale_amount, commission, sale_date, status) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const saleResult = await connection.execute(saleSql, [
            property_id, seller_id, buyer_name, buyer_email, buyer_phone,
            sale_amount, commission, sale_date, status
        ]);

        // 2. Actualizar el estado de la propiedad a "sold"
        const propertySql = `UPDATE properties SET status = 'sold', updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
        await connection.execute(propertySql, [property_id]);

        await connection.commit();
        return await this.getById(saleResult[0].insertId);

    } catch (error) {
        await connection.rollback();
        throw new Error(`Error al crear venta: ${error.message}`);
    } finally {
        connection.release();
    }
}

    // Actualizar venta
    static async update(id, saleData) {
        try {
            const fields = [];
            const values = [];

            Object.keys(saleData).forEach(key => {
                if (saleData[key] !== undefined) {
                    fields.push(`${key} = ?`);
                    values.push(saleData[key]);
                }
            });

            if (fields.length === 0) {
                throw new Error('No hay campos para actualizar');
            }

            values.push(id);
            const sql = `UPDATE sales SET ${fields.join(', ')} WHERE id = ?`;
            const result = await db.execute(sql, values);

            return result.affectedRows > 0 ? await this.getById(id) : null;
        } catch (error) {
            throw new Error(`Error al actualizar venta: ${error.message}`);
        }
    }

    // Eliminar venta
    static async delete(id) {
        try {
            const sql = `DELETE FROM sales WHERE id = ?`;
            const result = await db.execute(sql, [id]);
            return result.affectedRows > 0;
        } catch (error) {
            throw new Error(`Error al eliminar venta: ${error.message}`);
        }
    }

    // Obtener estadísticas de ventas
    static async getStats(timeRange = 'month') {
        try {
            let dateFilter = '';
            switch (timeRange) {
                case 'week':
                    dateFilter = 'AND s.sale_date >= DATE_SUB(NOW(), INTERVAL 1 WEEK)';
                    break;
                case 'month':
                    dateFilter = 'AND s.sale_date >= DATE_SUB(NOW(), INTERVAL 1 MONTH)';
                    break;
                case 'year':
                    dateFilter = 'AND s.sale_date >= DATE_SUB(NOW(), INTERVAL 1 YEAR)';
                    break;
            }

            const sql = `
                SELECT 
                    COUNT(*) as total_sales,
                    SUM(s.sale_amount) as total_revenue,
                    SUM(s.commission) as total_commission,
                    AVG(s.sale_amount) as average_sale,
                    MAX(s.sale_amount) as highest_sale,
                    MIN(s.sale_amount) as lowest_sale,
                    COUNT(DISTINCT s.seller_id) as active_sellers
                FROM sales s
                WHERE 1=1 ${dateFilter}
            `;
            const stats = await db.query(sql);
            return stats[0];
        } catch (error) {
            throw new Error(`Error al obtener estadísticas: ${error.message}`);
        }
    }

    // Obtener ventas por vendedor
    static async getBySeller(sellerId) {
        try {
            const sql = `
                SELECT 
                    s.*,
                    p.title as property_title
                FROM sales s
                LEFT JOIN properties p ON s.property_id = p.id
                WHERE s.seller_id = ?
                ORDER BY s.sale_date DESC
            `;
            return await db.query(sql, [sellerId]);
        } catch (error) {
            throw new Error(`Error al obtener ventas del vendedor: ${error.message}`);
        }
    }

    // Obtener tendencias mensuales
    static async getMonthlyTrends() {
        try {
            const sql = `
                SELECT 
                    DATE_FORMAT(sale_date, '%Y-%m') as month,
                    COUNT(*) as sales_count,
                    SUM(sale_amount) as total_amount,
                    SUM(commission) as total_commission
                FROM sales 
                WHERE sale_date >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
                GROUP BY DATE_FORMAT(sale_date, '%Y-%m')
                ORDER BY month ASC
            `;
            return await db.query(sql);
        } catch (error) {
            throw new Error(`Error al obtener tendencias: ${error.message}`);
        }
    }
}

module.exports = Sale;