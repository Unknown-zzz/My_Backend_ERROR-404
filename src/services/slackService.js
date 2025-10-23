const axios = require('axios');

class SlackService {
    constructor() {
        this.webhookUrl = process.env.SLACK_WEBHOOK_URL || '';
        this.botToken = process.env.SLACK_BOT_TOKEN || '';
        this.channelName = process.env.SLACK_CHANNEL_NAME || '#terrasale-notifications';
    }

    isConfigured() {
        return !!this.webhookUrl || !!this.botToken;
    }

    setWebhook(webhookUrl, channelName = null) {
        try {
            this.webhookUrl = webhookUrl;
            if (channelName) {
                this.channelName = channelName;
            }
            
            // Opcional: Guardar en base de datos o variables persistentes
            // await this.saveConfigToDatabase();
            
            return true;
        } catch (error) {
            console.error('Error setting Slack webhook:', error);
            return false;
        }
    }

    async sendTestMessage(webhookUrl = null, channelName = null) {
        const targetWebhook = webhookUrl || this.webhookUrl;
        const targetChannel = channelName || this.channelName;

        if (!targetWebhook) {
            throw new Error('Webhook URL no configurado');
        }

        const message = {
            text: '🧪 Test de integración Slack - TerraSale System',
            blocks: [
                {
                    type: 'header',
                    text: {
                        type: 'plain_text',
                        text: '✅ TerraSale System - Test Exitoso'
                    }
                },
                {
                    type: 'section',
                    fields: [
                        {
                            type: 'mrkdwn',
                            text: `*Canal:* ${targetChannel}`
                        },
                        {
                            type: 'mrkdwn',
                            text: `*Fecha:* ${new Date().toLocaleString()}`
                        },
                        {
                            type: 'mrkdwn',
                            text: '*Estado:* Sistema funcionando correctamente'
                        }
                    ]
                },
                {
                    type: 'context',
                    elements: [
                        {
                            type: 'mrkdwn',
                            text: '🔔 Este es un mensaje de prueba del sistema TerraSale'
                        }
                    ]
                }
            ]
        };

        try {
            const response = await axios.post(targetWebhook, message);
            return {
                status: response.status,
                statusText: response.statusText,
                data: response.data
            };
        } catch (error) {
            console.error('Error sending Slack message:', error.response?.data || error.message);
            throw new Error(`Error enviando mensaje a Slack: ${error.response?.data?.message || error.message}`);
        }
    }

    async sendMessage(text, blocks = null) {
        if (!this.isConfigured()) {
            throw new Error('Slack no está configurado');
        }

        const message = {
            text: text,
            blocks: blocks
        };

        if (this.webhookUrl) {
            // Usar webhook
            return await axios.post(this.webhookUrl, message);
        } else if (this.botToken) {
            // Usar bot token (implementación alternativa)
            return await this.sendViaBotToken(message);
        }
    }

    async sendViaBotToken(message) {
        // Implementación para usar Bot Token en lugar de webhook
        const response = await axios.post('https://slack.com/api/chat.postMessage', {
            channel: this.channelName,
            ...message
        }, {
            headers: {
                'Authorization': `Bearer ${this.botToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.data.ok) {
            throw new Error(response.data.error);
        }

        return response;
    }
}

module.exports = new SlackService();