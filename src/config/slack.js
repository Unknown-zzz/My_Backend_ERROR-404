const axios = require('axios');

class SlackService {
  constructor() {
    this.webhookUrl = process.env.SLACK_WEBHOOK_URL;
    this.channel = process.env.SLACK_CHANNEL || '#general';
    this.username = process.env.SLACK_USERNAME || 'TerraSale Bot';
  }

  async sendNotification(message, attachments = []) {
    try {
      if (!this.webhookUrl) {
        console.warn('Slack webhook URL no configurada');
        return { success: false, error: 'Webhook no configurado' };
      }

      const payload = {
        channel: this.channel,
        username: this.username,
        text: message,
        attachments: attachments,
        icon_emoji: ':house:'
      };

      const response = await axios.post(this.webhookUrl, payload, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error enviando notificación a Slack:', error.response?.data || error.message);
      return { 
        success: false, 
        error: error.response?.data || error.message 
      };
    }
  }

  // Método específico para notificaciones de propiedades
  async sendPropertyNotification(property, action = 'creada') {
    const message = `🏠 Propiedad ${action}: ${property.title}`;
    
    const attachments = [
      {
        color: action === 'creada' ? 'good' : '#36a64f',
        fields: [
          {
            title: 'Propiedad',
            value: property.title,
            short: true
          },
          {
            title: 'Precio',
            value: `$${property.price}`,
            short: true
          },
          {
            title: 'Ubicación',
            value: property.location,
            short: true
          },
          {
            title: 'Tipo',
            value: property.property_type === 'land' ? 'Terreno' : 'Casa',
            short: true
          },
          {
            title: 'Tamaño',
            value: property.size || 'N/A',
            short: true
          },
          {
            title: 'Vendedor',
            value: property.seller_name || 'N/A',
            short: true
          }
        ],
        ts: Math.floor(Date.now() / 1000)
      }
    ];

    return await this.sendNotification(message, attachments);
  }

  // Método para notificaciones de contacto
  async sendContactNotification(contact) {
    const message = `📞 Nueva solicitud de contacto: ${contact.name}`;
    
    const attachments = [
      {
        color: '#007bff',
        fields: [
          {
            title: 'Nombre',
            value: contact.name,
            short: true
          },
          {
            title: 'Email',
            value: contact.email,
            short: true
          },
          {
            title: 'Teléfono',
            value: contact.phone || 'No proporcionado',
            short: true
          },
          {
            title: 'Propiedad',
            value: contact.property_title || 'N/A',
            short: true
          },
          {
            title: 'Precio',
            value: `$${contact.property_price}`,
            short: true
          },
          {
            title: 'Ubicación',
            value: contact.property_location,
            short: true
          }
        ]
      }
    ];

    if (contact.message) {
      attachments[0].fields.push({
        title: 'Mensaje',
        value: contact.message.length > 100 ? contact.message.substring(0, 100) + '...' : contact.message,
        short: false
      });
    }

    return await this.sendNotification(message, attachments);
  }
}

module.exports = new SlackService();