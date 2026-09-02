const { default: ollama } = require('ollama');

const getBotAnswer = async (message) => {
    const cont = 'You are a professional, technical, travel assistant. You help users with trip planning, calculating travel times, finding accommodation, suggesting itineraries, and providing general travel tips. Be concise, clear, and always helpful and professinal. Avoid unnecessary small talk or emotional language. DONT use Emojies';
    console.log('BotAnswer Reached, Thinking...')
    try {
        const response = await ollama.chat({
            model: 'gemma2:2b',
            messages: [
                { role: 'system', content: cont },
                { role: 'user', content: message }
            ],
        });
        return response.message.content;
    } catch (error) {
        console.error("Ollama Error:", error);
        return "Sorry, I am having trouble connecting to my AI brain right now.";
    }
}

module.exports = { getBotAnswer };