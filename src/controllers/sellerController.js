/**
 * Controlador de Vendedores
 * Maneja las requests HTTP para operaciones con vendedores
 */

const Seller = require('../models/Seller');
const SlackService = require('../services/slackService');

class SellerController {
    // Obtener todos los vendedores
    async getAllSellers(req, res) {
        try {
            const sellers = await Seller.getAll();
            
            // Log en Slack (solo en producción)
            if (process.env.NODE_ENV === 'production') {
                await SlackService.logAction('SELLERS_FETCHED', {
                    count: sellers.length,
                    user_agent: req.get('User-Agent')
                });
            }
            
            res.json({
                success: true,
                data: sellers,
                count: sellers.length,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error en getAllSellers:', error);
            res.status(500).json({
                success: false,
                error: 'Error al obtener vendedores',
                message: error.message
            });
        }
    }

    // Obtener vendedor por ID
    async getSellerById(req, res) {
        try {
            const { id } = req.params;
            const seller = await Seller.getById(id);
            
            if (!seller) {
                return res.status(404).json({
                    success: false,
                    error: 'Vendedor no encontrado'
                });
            }
            
            res.json({
                success: true,
                data: seller
            });
        } catch (error) {
            console.error('Error en getSellerById:', error);
            res.status(500).json({
                success: false,
                error: 'Error al obtener vendedor',
                message: error.message
            });
        }
    }

    // Crear nuevo vendedor
    async createSeller(req, res) {
        try {
            const sellerData = req.body;
            
            // Validaciones básicas
            if (!sellerData.name || !sellerData.email) {
                return res.status(400).json({
                    success: false,
                    error: 'Nombre y email son requeridos'
                });
            }
            
            const newSeller = await Seller.create(sellerData);
            
            // Notificar en Slack
            await SlackService.notifyNewSeller(newSeller);
            
            res.status(201).json({
                success: true,
                message: 'Vendedor creado exitosamente',
                data: newSeller
            });
        } catch (error) {
            console.error('Error en createSeller:', error);
            res.status(500).json({
                success: false,
                error: 'Error al crear vendedor',
                message: error.message
            });
        }
    }

    // Actualizar vendedor
    async updateSeller(req, res) {
        try {
            const { id } = req.params;
            const sellerData = req.body;
            
            const updatedSeller = await Seller.update(id, sellerData);
            
            if (!updatedSeller) {
                return res.status(404).json({
                    success: false,
                    error: 'Vendedor no encontrado'
                });
            }
            
            res.json({
                success: true,
                message: 'Vendedor actualizado exitosamente',
                data: updatedSeller
            });
        } catch (error) {
            console.error('Error en updateSeller:', error);
            res.status(500).json({
                success: false,
                error: 'Error al actualizar vendedor',
                message: error.message
            });
        }
    }

    // Eliminar vendedor (soft delete)
    async deleteSeller(req, res) {
        try {
            const { id } = req.params;
            const deleted = await Seller.deactivate(id);
            
            if (!deleted) {
                return res.status(404).json({
                    success: false,
                    error: 'Vendedor no encontrado'
                });
            }
            
            await SlackService.logAction('SELLER_DELETED', { seller_id: id });
            
            res.json({
                success: true,
                message: 'Vendedor eliminado exitosamente'
            });
        } catch (error) {
            console.error('Error en deleteSeller:', error);
            res.status(500).json({
                success: false,
                error: 'Error al eliminar vendedor',
                message: error.message
            });
        }
    }

    // Obtener estadísticas
    async getSellerStats(req, res) {
        try {
            const stats = await Seller.getStats();
            res.json({
                success: true,
                data: stats
            });
        } catch (error) {
            console.error('Error en getSellerStats:', error);
            res.status(500).json({
                success: false,
                error: 'Error al obtener estadísticas',
                message: error.message
            });
        }
    }
}

module.exports = new SellerController();