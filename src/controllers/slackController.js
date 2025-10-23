const slackService = require('../config/slack');

const slackController = {
  async webhook(req, res) {
    try {
      const { type, data, event } = req.body;

      console.log('📨 Webhook de Slack recibido:', { type, event });

      // Validación de campos requeridos
      if (!type) {
        console.warn('Webhook recibido sin tipo:', req.body);
        return res.status(400).json({
          success: false,
          error: 'El campo "type" es requerido. Tipos válidos: property_created, property_updated, contact_request, new_user, custom_message'
        });
      }

      if (!data) {
        return res.status(400).json({
          success: false,
          error: 'El campo "data" es requerido'
        });
      }

      let result;
      let message = '';

      switch (type) {
        case 'property_created':
          message = `🏠 Nueva propiedad creada: ${data.title}`;
          result = await slackService.sendPropertyNotification(data, 'creada');
          break;
        
        case 'property_updated':
          message = `✏️ Propiedad actualizada: ${data.title}`;
          result = await slackService.sendPropertyNotification(data, 'actualizada');
          break;
        
        case 'contact_request':
          message = `📞 Nueva solicitud de contacto de ${data.name}`;
          result = await slackService.sendContactNotification(data);
          break;
        
        case 'new_user':
          message = `👤 Nuevo usuario registrado: ${data.name}`;
          result = await slackService.sendNotification(message, [
            {
              color: '#28a745',
              fields: [
                { title: 'Nombre', value: data.name, short: true },
                { title: 'Email', value: data.email, short: true },
                { title: 'Rol', value: data.role, short: true },
                { title: 'Fecha', value: new Date(data.registration_date || Date.now()).toLocaleDateString(), short: true }
              ]
            }
          ]);
          break;

        case 'custom_message':
          result = await slackService.sendNotification(data.message, data.attachments || []);
          break;
        
        default:
          console.warn(`Tipo de evento no reconocido: ${type}`);
          return res.status(400).json({
            success: false,
            error: `Tipo de evento no soportado: ${type}`
          });
      }

      if (result.success) {
        console.log('✅ Notificación enviada a Slack correctamente');
        res.json({
          success: true,
          message: 'Notificación enviada correctamente a Slack',
          data: result.data
        });
      } else {
        console.warn('❌ Error enviando a Slack:', result.error);
        res.status(500).json({
          success: false,
          error: 'No se pudo enviar la notificación a Slack',
          details: result.error
        });
      }

    } catch (error) {
      console.error('❌ Error en webhook de Slack:', error);
      res.status(500).json({
        success: false,
        error: 'Error interno del servidor',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
};

module.exports = slackController;