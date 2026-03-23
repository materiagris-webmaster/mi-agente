// ─────────────────────────────────────────────
// SERVIDOR DEL AGENTE IA — Materia Gris
// ─────────────────────────────────────────────

// 1. Cargamos las herramientas que necesitamos
require('dotenv').config();                        // Lee el archivo .env (donde está tu API Key)
const express = require('express');                // Express: el framework que crea el servidor web
const Anthropic = require('@anthropic-ai/sdk');    // El SDK oficial de Anthropic para hablar con Claude

// 2. Creamos la "aplicación" de Express y el cliente de Anthropic
const app = express();
const client = new Anthropic();

// 3. Le decimos a Express que entienda JSON
//    (los mensajes del chat llegan en formato JSON)
app.use(express.json());

// 4. CORS — Permite que el widget de WordPress se conecte a este servidor
//    Sin esto, el navegador bloquearía la conexión por seguridad
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// 5. LA PERSONALIDAD DEL AGENTE (system prompt)
//    Aquí defines quién es, qué sabe y cómo se comporta
const SYSTEM_PROMPT = `Eres un asistente virtual de Materia Gris, una agencia digital premium ubicada en Querétaro, México.

Tu objetivo es:
1. Responder preguntas sobre los servicios de Materia Gris
2. Calificar leads (obtener nombre, empresa y presupuesto del visitante)
3. Derivar a WhatsApp cuando el lead esté listo

SERVICIOS DE MATERIA GRIS:
- Webs de Alto Impacto: sitios web profesionales para empresas que quieren destacar
- Plataformas a Medida: software personalizado para automatizar procesos de negocio
- Estrategia y Marketing Digital: posicionamiento, contenido y campañas digitales
- Marcas que no se olvidan: identidad visual y branding estratégico

PRECIOS ORIENTATIVOS:
- Sitios web: desde $15,000 MXN
- Plataformas a medida: desde $30,000 MXN
- Marketing digital: planes mensuales desde $5,000 MXN

CONTACTO:
- WhatsApp: +52 442 774 9881
- Correo: contacto@materiagrismx.com
- Sitio: materiagrismx.com

INSTRUCCIONES DE COMPORTAMIENTO:
- Sé amable, profesional y directo
- Habla siempre en español
- Si alguien pregunta por precios, da los rangos orientativos y luego pregunta por su proyecto específico
- Cuando alguien muestre interés real, pídele su nombre, el nombre de su empresa y su presupuesto aproximado
- Cuando tengas esos 3 datos, invítalo a continuar por WhatsApp con este mensaje exacto:
  "¡Perfecto! Ya tengo lo que necesito para que uno de nuestros especialistas te contacte. Te invito a continuar por WhatsApp para agendar una llamada sin compromiso: https://wa.me/524427749881"
- Nunca inventes precios ni servicios que no estén en esta lista
- Si no sabes algo, di que lo puede consultar directamente con el equipo`;

// 6. EL ENDPOINT DE CHAT
//    Esta es la "puerta" a la que el widget envía los mensajes
//    Ruta: POST /chat
app.post('/chat', async (req, res) => {

  // 6a. Extraemos el historial de mensajes que llega del widget
  //     "historial" es un arreglo con todos los mensajes anteriores de la conversación
  const { historial } = req.body;

  // 6b. Validación básica: si no llega historial, respondemos con error
  if (!historial || !Array.isArray(historial)) {
    return res.status(400).json({ error: 'Falta el historial de mensajes' });
  }

  try {
    // 6c. Enviamos el historial completo a Claude
    //     Claude necesita ver toda la conversación para recordar el contexto
    const respuesta = await client.messages.create({
      model: 'claude-sonnet-4-20250514',   // El modelo que usamos
      max_tokens: 1024,                     // Máximo de palabras en la respuesta
      system: SYSTEM_PROMPT,               // La personalidad del agente
      messages: historial                  // Todo el historial de la conversación
    });

    // 6d. Extraemos solo el texto de la respuesta y lo enviamos de vuelta al widget
    const texto = respuesta.content[0].text;
    res.json({ respuesta: texto });

  } catch (error) {
    // 6e. Si algo sale mal, lo reportamos
    console.error('Error al llamar a Claude:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// 7. RUTA DE PRUEBA
//    Sirve para verificar que el servidor está corriendo
//    Abre http://localhost:3000 en tu navegador y verás un mensaje
app.get('/', (req, res) => {
  res.send('Agente IA de Materia Gris — funcionando ✅');
});

// 8. ARRANCAMOS EL SERVIDOR
//    Puerto 3000 = la "puerta" por donde entra el tráfico localmente
const PUERTO = 3000;
app.listen(PUERTO, () => {
  console.log(`Servidor corriendo en http://localhost:${PUERTO}`);
});