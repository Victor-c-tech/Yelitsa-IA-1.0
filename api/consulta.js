import fetch from 'node-fetch';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }

    const apiKey = process.env.MISTRAL_API_KEY;

    if (!apiKey) {
        console.error("CRITICAL ERROR: MISTRAL_API_KEY environment variable not found!");
        return res.status(500).json({ error: "Server configuration error. API key is missing." });
    }

    try {
        const { messages } = req.body;
        
        if (!messages) {
            return res.status(400).json({ error: "Field 'messages' is required in the request body." });
        }

        // --- NUEVO: AÑADIR UN SYSTEM PROMPT PARA DARLE IDENTIDAD A LA IA ---
        const systemMessage = {
            role: 'system',
            content: 'Tú eres un asistente de IA servicial y amigable que se llama Yelitsa. Siempre que te pregunten tu nombre, debes responder que te llamas Yelitsa.'
        };

        // Creamos el cuerpo final de la solicitud, poniendo nuestro mensaje del sistema primero
        const payload = {
            model: "mistral-large-latest",
            messages: [systemMessage, ...messages] // Se combina el mensaje del sistema con los del usuario
        };

        const mistralResponse = await fetch("https://api.mistral.ai/v1/chat/completions", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(payload) // Enviamos el payload combinado
        });

        if (!mistralResponse.ok) {
            const errorData = await mistralResponse.json();
            console.error("Error from Mistral API:", errorData);
            return res.status(mistralResponse.status).json({ error: `External API Error: ${errorData.message || 'Unknown error'}` });
        }
        
        const data = await mistralResponse.json();
        res.status(200).json(data);

    } catch (error) {
        console.error("Unexpected server error:", error);
        res.status(500).json({ error: "An internal server error occurred." });
    }
}