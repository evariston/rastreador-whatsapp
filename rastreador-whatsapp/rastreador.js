// rastreador.js
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const axios = require('axios');

// Configurações do WhatsApp
const client = new Client({
    authStrategy: new LocalAuth({ clientId: "edcelulares" })
});

// Seu número da loja
const LOJA_NUMERO = '5516992710999'; // sem o +, formato para whatsapp-web.js

// Token Melhor Envio
const MELHOR_ENVIO_TOKEN = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9...';

// Mensagens automáticas
const MENSAGENS = {
    postado: (codigoRastreio, link) => `✅ Seu pedido foi postado.\nRastreamento: ${codigoRastreio}\nAcompanhe aqui: ${link}`,
    centroDistribuicao: (cidade) => `📦 Seu pedido está no centro de distribuição: ${cidade}`,
    rotaEntrega: () => `🚚 Seu produto saiu para entrega.`,
    entregue: () => `🎉 Seu produto foi entregue com sucesso! Obrigado por comprar na EDCelulares. Se puder, deixe seu feedback positivo em nosso site.`
};

// Exibe QR code no terminal
client.on('qr', qr => {
    console.log('Escaneie este QR Code com o seu WhatsApp:');
    qrcode.generate(qr, { small: true });
});

// Confirma login
client.on('ready', async () => {
    console.log('✅ Conectado ao WhatsApp com sucesso!');

    // Teste de envio (opcional)
    // await enviarMensagem(LOJA_NUMERO, '🤖 Sistema de rastreio ativo!');
});

// Função para enviar mensagem
async function enviarMensagem(numero, mensagem) {
    const chatId = `${numero}@c.us`;
    try {
        await client.sendMessage(chatId, mensagem);
        console.log(`Mensagem enviada para ${numero}`);
    } catch (err) {
        console.error(`Erro ao enviar mensagem para ${numero}:`, err.message);
    }
}

// Função para consultar status do pedido pelo Melhor Envio
async function consultarRastreio(codigoRastreio) {
    try {
        const res = await axios.get(`https://www.melhorenvio.com.br/api/v2/rastreamento/${codigoRastreio}`, {
            headers: {
                Authorization: `Bearer ${MELHOR_ENVIO_TOKEN}`
            }
        });
        return res.data;
    } catch (err) {
        console.error('Erro ao consultar rastreio:', err.message);
        return null;
    }
}

// Função principal para monitorar pedidos e enviar mensagens automáticas
async function monitorarPedido(codigoRastreio, numeroCliente) {
    const rastreio = await consultarRastreio(codigoRastreio);
    if (!rastreio) return;

    // Exemplo simplificado do fluxo:
    for (const evento of rastreio.eventos) {
        let mensagem;
        switch (evento.status) {
            case 'postado':
                mensagem = MENSAGENS.postado(codigoRastreio, `https://rastreamento.melhorenvio.com.br/${codigoRastreio}`);
                break;
            case 'centro_distribuicao':
                mensagem = MENSAGENS.centroDistribuicao(evento.cidade);
                break;
            case 'rota_entrega':
                mensagem = MENSAGENS.rotaEntrega();
                break;
            case 'entregue':
                mensagem = MENSAGENS.entregue();
                break;
            default:
                mensagem = null;
        }
        if (mensagem) await enviarMensagem(numeroCliente, mensagem);
    }
}

// Inicializa cliente
client.initialize();

// Exporta função para chamadas externas (Render ou cron jobs)
module.exports = {
    monitorarPedido,
    enviarMensagem
};
