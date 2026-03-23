require('dotenv').config();
const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic();

async function main() {
  const mensaje = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [
      { role: 'user', content: '¿Cual es la capital de Kasajastan?' }
    ]
  });

  console.log(mensaje.content[0].text);
}

main();