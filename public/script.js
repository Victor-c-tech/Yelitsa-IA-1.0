document.addEventListener('DOMContentLoaded', () => {
    const chatForm = document.getElementById('chat-form'),
          promptInput = document.getElementById('prompt-input'),
          sendBtn = document.getElementById('send-btn'),
          chatResponseDiv = document.getElementById('chat-response'),
          promptStatsSpan = document.getElementById('prompt-stats'),
          completionStatsSpan = document.getElementById('completion-stats'),
          sessionTotalTokensSpan = document.getElementById('session-total-tokens'),
          sessionTotalCharsSpan = document.getElementById('session-total-chars'),
          historyPanel = document.getElementById('history-panel'),
          statsPanel = document.getElementById('stats-panel'),
          toggleHistoryBtn = document.getElementById('toggle-history-btn'),
          toggleStatsBtn = document.getElementById('toggle-stats-btn'),
          closeHistoryBtn = document.getElementById('close-history-btn'),
          closeStatsBtn = document.getElementById('close-stats-btn'),
          historyList = document.getElementById('history-list'),
          newChatBtn = document.getElementById('new-chat-btn'),
          clearHistoryBtn = document.getElementById('clear-history-btn');

    let sessionTotalTokens = 0,
        sessionTotalChars = 0,
        history = [],
        currentChatId = null,
        currentMessages = [];

    function scrollToBottom() {
        setTimeout(() => { chatResponseDiv.scrollTop = chatResponseDiv.scrollHeight; }, 0);
    }

    function showTypingIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'message ai-message';
        indicator.id = 'typing-indicator';
        indicator.innerHTML = `<div class="message-header ai"><i class="fa-solid fa-headset"></i> Yelitsa</div><div class="message-content typing-indicator"><span></span><span></span><span></span></div>`;
        chatResponseDiv.appendChild(indicator);
        scrollToBottom();
    }

    function hideTypingIndicator() {
        const indicator = document.getElementById('typing-indicator');
        if (indicator) indicator.remove();
    }

    function renderMessage(content, sender) {
        hideTypingIndicator();
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender === 'user' ? 'user' : 'ai'}-message`;
        messageDiv.innerHTML = `<div class="message-header ${sender === 'user' ? 'user' : 'ai'}"><i class="fa-solid ${sender === 'user' ? 'fa-user' : 'fa-headset'}"></i> ${sender === 'user' ? 'Tú' : 'Yelitsa'}</div><div class="message-content">${marked.parse(content || '<p style="color:#F87171;">Error: Respuesta vacía.</p>')}</div>`;
        chatResponseDiv.appendChild(messageDiv);
        scrollToBottom();
    }

    function loadChat(chatId) {
        const chat = history.find(c => c.id === chatId);
        if (chat) {
            currentChatId = chatId;
            currentMessages = [...chat.messages];
            chatResponseDiv.innerHTML = '';
            currentMessages.forEach(msg => renderMessage(msg.content, msg.role));
            renderHistory();
            scrollToBottom();
        }
    }

    function loadHistoryFromStorage() { const stored = localStorage.getItem('chatHistory'); if (stored) history = JSON.parse(stored); renderHistory(); }
    function saveHistoryToStorage() { localStorage.setItem('chatHistory', JSON.stringify(history)); }
    function renderHistory() { historyList.innerHTML = ''; history.forEach(chat => { const item = document.createElement('div'); item.className = 'history-item'; item.textContent = chat.title; item.dataset.chatId = chat.id; if (chat.id === currentChatId) item.classList.add('active'); item.addEventListener('click', () => loadChat(chat.id)); historyList.prepend(item); }); }
    function startNewChat() { currentChatId = null; currentMessages = []; chatResponseDiv.innerHTML = '<div class="welcome-message"><p>¡Hola! Soy Yelitsa 👩 tu asistente de desarrollo. ¿En qué puedo ayudarte hoy?</p></div>'; renderHistory(); promptStatsSpan.textContent = '-'; completionStatsSpan.textContent = '-'; }
    function clearHistory() { if (confirm('¿Estás seguro?')) { history = []; currentChatId = null; saveHistoryToStorage(); startNewChat(); } }
    function updateStats(promptText, aiContent, usage) { promptStatsSpan.textContent = `${usage.prompt_tokens} tokens / ${promptText.length} chars`; completionStatsSpan.textContent = `${usage.completion_tokens} tokens / ${aiContent.length} chars`; sessionTotalTokens += usage.total_tokens || 0; sessionTotalChars += (promptText.length + (aiContent?.length || 0)); sessionTotalTokensSpan.textContent = sessionTotalTokens; sessionTotalCharsSpan.textContent = sessionTotalChars; }

    toggleHistoryBtn.addEventListener('click', () => { statsPanel.classList.remove('is-visible'); historyPanel.classList.toggle('is-visible'); });
    toggleStatsBtn.addEventListener('click', () => { historyPanel.classList.remove('is-visible'); statsPanel.classList.toggle('is-visible'); });
    closeHistoryBtn.addEventListener('click', () => historyPanel.classList.remove('is-visible'));
    closeStatsBtn.addEventListener('click', () => statsPanel.classList.remove('is-visible'));
    newChatBtn.addEventListener('click', startNewChat);
    clearHistoryBtn.addEventListener('click', clearHistory);

    chatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const promptText = promptInput.value.trim();
        if (!promptText) return;

        renderMessage(promptText, 'user');
        currentMessages.push({ role: 'user', content: promptText });
        promptInput.value = '';
        sendBtn.disabled = true;

        // ---- INICIO DE LA PARTE AGREGADA ----
        const promptLower = promptText.toLowerCase();
        const isCreatorQuestion = promptLower.includes('quién te creó') || promptLower.includes('quien te creo') || promptLower.includes('quién es tu dueño') || promptLower.includes('quien es tu dueño');

        if (isCreatorQuestion) {
            const creatorResponse = "Fui creada por Victor-Tech usando la tecnología de Mistral. Mi dueño es Victor Manuel Alejos, un estudiante de la carrera de ingeniería en sistema y computación de la universidad Dominicana O&M y técnico en ciberseguridad con habilidades en desarrollo web, análisis de datos y programación de dispositivo móvil.";
            
            showTypingIndicator();

            setTimeout(() => {
                renderMessage(creatorResponse, 'assistant');
                currentMessages.push({ role: 'assistant', content: creatorResponse });

                if (currentChatId) {
                    const chat = history.find(c => c.id === currentChatId);
                    chat.messages = [...currentMessages];
                } else {
                    currentChatId = Date.now();
                    const title = promptText.substring(0, 30) + (promptText.length > 30 ? '...' : '');
                    history.push({ id: currentChatId, title: title, messages: [...currentMessages] });
                }
                saveHistoryToStorage();
                renderHistory();
                sendBtn.disabled = false;
            }, 1000); // Simulamos 1 segundo de "pensamiento"
            return; // Detenemos la ejecución para no llamar a la API
        }
        // ---- FIN DE LA PARTE AGREGADA ----
        
        showTypingIndicator();
        try {
            const response = await fetch('/api/consulta', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: currentMessages }) });
            const data = await response.json();
            if (response.status !== 200 || data.error) { throw new Error(data.error || 'Ocurrió un error en la API.'); }
            const aiContent = data.choices[0].message.content;
            renderMessage(aiContent, 'assistant');
            currentMessages.push({ role: 'assistant', content: aiContent });
            if (currentChatId) {
                const chat = history.find(c => c.id === currentChatId);
                chat.messages = [...currentMessages];
            } else {
                currentChatId = Date.now();
                const title = promptText.substring(0, 30) + (promptText.length > 30 ? '...' : '');
                history.push({ id: currentChatId, title: title, messages: [...currentMessages] });
            }
            saveHistoryToStorage();
            renderHistory();
            if (data.usage) { updateStats(promptText, aiContent, data.usage); }
        } catch (error) {
            console.error('Error:', error);
            renderMessage(`**Error:**\n\n${error.message}`, 'ai');
        } finally {
            hideTypingIndicator();
            sendBtn.disabled = false;
        }
    });

    loadHistoryFromStorage();
    startNewChat();
});