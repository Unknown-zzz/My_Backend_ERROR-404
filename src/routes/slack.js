const express = require('express');
const router = express.Router();
const slackController = require('../controllers/slackController');

// Middleware de validación
const validateWebhook = (req, res, next) => {
  const { type, data } = req.body;
  
  if (!type) {
    return res.status(400).json({
      success: false,
      error: 'El campo "type" es requerido'
    });
  }

  if (!data) {
    return res.status(400).json({
      success: false,
      error: 'El campo "data" es requerido'
    });
  }

  // Tipos válidos
  const validTypes = ['property_created', 'property_updated', 'contact_request', 'new_user', 'custom_message'];
  if (!validTypes.includes(type)) {
    return res.status(400).json({
      success: false,
      error: `Tipo no válido. Tipos permitidos: ${validTypes.join(', ')}`
    });
  }

  next();
};

router.post('/webhook', validateWebhook, slackController.webhook);

module.exports = router;