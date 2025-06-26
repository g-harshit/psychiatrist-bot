let userId = null;
let sessionId = null;
let mediaRecorder = null;
let audioChunks = [];
let currentBotAudio = null;

function showLoader() {
    let loaderDiv = document.getElementById('loader');
    if (!loaderDiv) {
        loaderDiv = document.createElement('div');
        loaderDiv.id = 'loader';
        loaderDiv.style.display = 'flex';
        loaderDiv.style.justifyContent = 'center';
        loaderDiv.style.alignItems = 'center';
        loaderDiv.style.margin = '12px auto 0 auto';
        loaderDiv.style.maxWidth = '420px';
        loaderDiv.innerHTML = `<div style="display:flex;align-items:center;gap:8px;"><span class="loader-spinner"></span> <span style="color:#ff7e5f;font-weight:600;">Thinking...</span></div>`;
        document.body.insertBefore(loaderDiv, document.getElementById('chat-section'));
    }
    loaderDiv.style.display = 'flex';
}

function hideLoader() {
    const loaderDiv = document.getElementById('loader');
    if (loaderDiv) loaderDiv.style.display = 'none';
}

function showError(message) {
    let errorDiv = document.getElementById('error-message');
    if (!errorDiv) {
        errorDiv = document.createElement('div');
        errorDiv.id = 'error-message';
        errorDiv.style.background = '#ffb3b3';
        errorDiv.style.color = '#a10000';
        errorDiv.style.padding = '12px 18px';
        errorDiv.style.borderRadius = '10px';
        errorDiv.style.margin = '12px auto 0 auto';
        errorDiv.style.maxWidth = '420px';
        errorDiv.style.textAlign = 'center';
        errorDiv.style.fontWeight = 'bold';
        errorDiv.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
        document.body.insertBefore(errorDiv, document.getElementById('chat-section'));
    }
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    setTimeout(() => { errorDiv.style.display = 'none'; }, 5000);
}

// On page load, check for saved userId/sessionId
window.addEventListener('DOMContentLoaded', () => {
    const savedUserId = localStorage.getItem('userId');
    const savedSessionId = localStorage.getItem('sessionId');
    if (savedUserId && savedSessionId) {
        userId = savedUserId;
        sessionId = savedSessionId;
        document.getElementById('register-section').style.display = 'none';
        document.getElementById('chat-section').style.display = 'flex';
        // Fetch and show chat history from backend
        fetch(`http://localhost:8000/api/v1/user/${userId}/sessions/`)
            .then(res => {
                if (res.status === 404) {
                    logoutUser();
                    showError('Your session has expired. Please register again.');
                    return [];
                }
                return res.json();
            })
            .then(sessions => {
                // Find the session with the matching sessionId
                const session = sessions.find(s => String(s.id) === String(sessionId));
                if (session && session.messages) {
                    updateChat(session.messages);
                } else {
                    updateChat([]);
                }
            })
            .catch(() => updateChat([]));
    }
});

async function registerUser() {
    try {
        showLoader();
        const name = document.getElementById('name').value.trim();
        const age = document.getElementById('age').value.trim();
        const sex = document.getElementById('sex').value;
        if (!name || !age || !sex) {
            hideLoader();
            showError('Please fill in all fields.');
            return;
        }
        const formData = new FormData();
        formData.append('name', name);
        formData.append('age', age);
        formData.append('sex', sex);
        const res = await fetch('http://localhost:8000/api/v1/register/', {
            method: 'POST',
            body: formData
        });
        hideLoader();
        if (!res.ok) {
            let errMsg = `Error: ${res.status}`;
            if (res.status >= 500) {
                errMsg = 'Something went wrong';
            } else {
                try {
                    const errJson = await res.json();
                    if (errJson.detail) {
                        errMsg = errJson.detail;
                    } else {
                        errMsg = JSON.stringify(errJson);
                    }
                } catch {
                    try {
                        errMsg = await res.text();
                    } catch {}
                }
            }
            showError(`Registration failed: ${errMsg}`);
            return;
        }
        const result = await res.json();
        userId = result.user.id;
        sessionId = result.session.id;
        // Save to localStorage
        localStorage.setItem('userId', userId);
        localStorage.setItem('sessionId', sessionId);
        document.getElementById('register-section').style.display = 'none';
        document.getElementById('chat-section').style.display = 'flex';
        // Show chat history if present
        if (result.session.messages && result.session.messages.length > 0) {
            updateChat(result.session.messages);
        } else {
            updateChat([]);
        }
    } catch (e) {
        hideLoader();
        showError('Network error during registration.');
    }
}

function stopBotAudio() {
    if (currentBotAudio) {
        currentBotAudio.pause();
        currentBotAudio.currentTime = 0;
        currentBotAudio = null;
    }
}

function playBotSpeech(text) {
    stopBotAudio();
    fetch(`http://localhost:8000/api/v1/chat/speech/?text=${encodeURIComponent(text)}`)
      .then(response => response.arrayBuffer())
      .then(arrayBuffer => {
        const audioBlob = new Blob([arrayBuffer], { type: 'audio/mpeg' });
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audio.playbackRate = 1.30; // 30% faster
        currentBotAudio = audio;
        audio.play();
      });
}

async function checkSessionValidity() {
    if (!userId || !sessionId) return;
    const res = await fetch(`http://localhost:8000/api/v1/user/${userId}/sessions/`);
    if (res.status === 404) {
        logoutUser();
        showError('Your session has expired. Please register again.');
        return false;
    }
    return true;
}

async function sendText() {
    try {
        stopBotAudio();
        showLoader();
        const message = document.getElementById('text-input').value;
        if (!message) {
            hideLoader();
            return;
        }
        addMessageToChat({ role: 'user', content: message });
        document.getElementById('text-input').value = '';
        const formData = new FormData();
        formData.append('user_id', userId);
        formData.append('session_id', sessionId);
        formData.append('message', message);
        const res = await fetch('http://localhost:8000/api/v1/chat/text/', {
            method: 'POST',
            body: formData
        });
        hideLoader();
        if (!res.ok) {
            let errMsg = `Error: ${res.status}`;
            if (res.status >= 500) {
                errMsg = 'Something went wrong';
            } else {
                try {
                    const errJson = await res.json();
                    if (errJson.detail) {
                        errMsg = errJson.detail;
                    } else {
                        errMsg = JSON.stringify(errJson);
                    }
                } catch {
                    try {
                        errMsg = await res.text();
                    } catch {}
                }
            }
            showError(`Chat error: ${errMsg}`);
            await checkSessionValidity();
            return;
        }
        const data = await res.json();
        updateChat(data.history);
        // Play bot speech
        if (data.response) {
            playBotSpeech(data.response);
        }
        await checkSessionValidity();
    } catch (e) {
        hideLoader();
        showError('Network error during chat.');
    }
}

function formatTimestamp(date) {
    if (!(date instanceof Date)) date = new Date(date);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function updateChat(history) {
    const chatDiv = document.getElementById('chat-history');
    chatDiv.innerHTML = '';
    history.forEach(msg => addMessageToChat(msg));
    chatDiv.scrollTop = chatDiv.scrollHeight;
}

function addMessageToChat(msg) {
    const chatDiv = document.getElementById('chat-history');
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', msg.role === 'user' ? 'user' : 'bot');
    if (msg.role === 'bot' || msg.role === 'therapist') {
        // Human avatar for bot
        const avatar = document.createElement('div');
        avatar.className = 'bot-avatar';
        avatar.innerHTML = '<img src="/static/avatar.jpg" alt="Bot Avatar" style="width:40px;height:40px;border-radius:50%;object-fit:cover;">';
        messageDiv.appendChild(avatar);
    }
    const bubble = document.createElement('div');
    bubble.classList.add('bubble', msg.role === 'user' ? 'user' : 'bot');
    bubble.textContent = msg.content;
    messageDiv.appendChild(bubble);
    // Add timestamp
    const timestampDiv = document.createElement('div');
    timestampDiv.className = 'timestamp';
    if (msg.timestamp) {
        timestampDiv.textContent = formatTimestamp(msg.timestamp);
    } else {
        timestampDiv.textContent = formatTimestamp(new Date());
    }
    messageDiv.appendChild(timestampDiv);
    chatDiv.appendChild(messageDiv);
    chatDiv.scrollTop = chatDiv.scrollHeight;
}

function startRecording() {
    document.getElementById('mic-btn').style.display = 'none';
    document.getElementById('stop-btn').style.display = 'inline-block';
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
            mediaRecorder = new MediaRecorder(stream);
            audioChunks = [];
            mediaRecorder.ondataavailable = e => {
                audioChunks.push(e.data);
            };
            mediaRecorder.onstop = sendAudio;
            mediaRecorder.start();
        })
        .catch(() => showError('Could not access microphone.'));
}

function stopRecording() {
    document.getElementById('mic-btn').style.display = 'inline-block';
    document.getElementById('stop-btn').style.display = 'none';
    if (mediaRecorder) {
        mediaRecorder.stop();
    }
}

async function sendAudio() {
    try {
        stopBotAudio();
        showLoader();
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        const formData = new FormData();
        formData.append('user_id', userId);
        formData.append('session_id', sessionId);
        formData.append('audio', audioBlob, 'audio.wav');
        const res = await fetch('http://localhost:8000/api/v1/chat/audio/', {
            method: 'POST',
            body: formData
        });
        let transcribedText = '';
        let history = [];
        hideLoader();
        if (!res.ok) {
            let errMsg = `Error: ${res.status}`;
            if (res.status >= 500) {
                errMsg = 'Something went wrong. Please try again later.';
            }
            try {
                const errJson = await res.json();
                if (errJson.transcribed_text) {
                    transcribedText = errJson.transcribed_text;
                }
                if (errJson.history) {
                    history = errJson.history;
                }
                if (res.status < 500) {
                    if (errJson.detail) {
                        errMsg = errJson.detail;
                    } else if (errJson.error) {
                        errMsg = errJson.error;
                    }
                }
            } catch {
                try {
                    errMsg = await res.text();
                } catch {}
            }
            // Only add transcribedText if not already in history
            if (transcribedText && !history.some(msg => msg.role === 'user' && msg.content === transcribedText)) {
                history.push({ role: 'user', content: transcribedText });
            }
            showError(`Audio chat error: ${errMsg}`);
            updateChat(history);
            await checkSessionValidity();
            return;
        }
        const data = await res.json();
        updateChat(data.history);
        // Play bot speech
        if (data.response) {
            playBotSpeech(data.response);
        }
        await checkSessionValidity();
    } catch (e) {
        hideLoader();
        showError('Network error during audio chat.');
    }
}

function logoutUser() {
    localStorage.removeItem('userId');
    localStorage.removeItem('sessionId');
    window.location.reload();
} 