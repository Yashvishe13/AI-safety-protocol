// ======= Global Variables ======= */
let currentExecutionId = null;
let isGenerating = false;
let streamVisible = false;
let eventSource = null;

// ======= DOM Elements ======= */
const elements = {
    prompt: document.getElementById('prompt'),
    generateBtn: document.getElementById('generate-btn'),
    output: document.getElementById('output'),
    stream: document.getElementById('stream'),
    streamContainer: document.getElementById('stream-container'),
    progressSection: document.getElementById('progress-section'),
    progressFill: document.getElementById('progress-fill'),
    progressText: document.getElementById('progress-text'),
    agentStatus: document.getElementById('agent-status'),
    commandSection: document.getElementById('command-section'),
    commandStatus: document.getElementById('command-status'),
    safetySection: document.getElementById('safety-section'),
    safetyGrid: document.getElementById('safety-grid'),
    statusIndicator: document.getElementById('status-indicator'),
    charCount: document.getElementById('char-count'),
    toggleStream: document.getElementById('toggle-stream'),
    copyBtn: document.getElementById('copy-btn'),
    downloadBtn: document.getElementById('download-btn')
};

// ======= Utility Functions ======= */
function showToast(message, type = 'info', duration = 3000) {
    const toastContainer = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = getToastIcon(type);
    toast.innerHTML = `
        <i class="fas ${icon}"></i>
        <span>${message}</span>
    `;
    
    toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, duration);
}

function getToastIcon(type) {
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    return icons[type] || icons.info;
}

function updateStatusIndicator(status, text) {
    elements.statusIndicator.className = `status-indicator ${status}`;
    elements.statusIndicator.querySelector('span').textContent = text;
}

function updateCharCount() {
    const count = elements.prompt.value.length;
    elements.charCount.textContent = `${count} characters`;
    
    if (count > 1000) {
        elements.charCount.style.color = 'var(--warning-color)';
    } else if (count > 500) {
        elements.charCount.style.color = 'var(--info-color)';
    } else {
        elements.charCount.style.color = 'var(--text-muted)';
    }
}

// ======= Main Functions ======= */
async function generateCode() {
    if (isGenerating) return;
    
    const prompt = elements.prompt.value.trim();
    if (!prompt) {
        showToast('Please enter a coding prompt', 'warning');
        elements.prompt.focus();
        return;
    }
    
    isGenerating = true;
    currentExecutionId = null;
    
    // Update UI state
    elements.generateBtn.disabled = true;
    elements.generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
    elements.output.textContent = '⏳ Generating code, please wait...';
    elements.stream.textContent = '';
    elements.commandSection.style.display = 'none';
    elements.safetySection.style.display = 'none';
    elements.progressSection.style.display = 'block';
    
    updateStatusIndicator('processing', 'Generating');
    showToast('Starting code generation...', 'info');
    
    try {
        const response = await fetch('/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        elements.output.textContent = data.final_code || '⚠️ No output returned.';
        
        showToast('Code generation completed!', 'success');
        updateStatusIndicator('ready', 'Ready');
        
    } catch (error) {
        console.error('Error generating code:', error);
        elements.output.textContent = `❌ Error: ${error.message}`;
        showToast('Code generation failed', 'error');
        updateStatusIndicator('error', 'Error');
    } finally {
        isGenerating = false;
        elements.generateBtn.disabled = false;
        elements.generateBtn.innerHTML = '<i class="fas fa-magic"></i> Generate Code';
        elements.progressSection.style.display = 'none';
    }
}

async function sendUserCommand(command) {
    if (!currentExecutionId) {
        showToast('No active execution to command', 'warning');
        return;
    }
    
    const commandStatus = elements.commandStatus;
    const acceptBtn = document.getElementById('accept-btn');
    const rejectBtn = document.getElementById('reject-btn');
    
    // Disable buttons and show loading
    acceptBtn.disabled = true;
    rejectBtn.disabled = true;
    commandStatus.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Sending ${command} command...`;
    
    try {
        const response = await fetch('/api/user-command', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                execution_id: currentExecutionId,
                command: command
            })
        });
        
        const data = await response.json();
        
        if (data.status === 'success') {
            commandStatus.innerHTML = `<i class="fas fa-check"></i> ${command} command sent successfully`;
            showToast(`Command '${command}' sent successfully`, 'success');
            
            // Hide command section after a delay
            setTimeout(() => {
                elements.commandSection.style.display = 'none';
            }, 2000);
        } else {
            commandStatus.innerHTML = `<i class="fas fa-exclamation-triangle"></i> Error: ${data.message}`;
            showToast(`Error sending command: ${data.message}`, 'error');
        }
    } catch (error) {
        console.error('Error sending user command:', error);
        commandStatus.innerHTML = `<i class="fas fa-exclamation-circle"></i> Error sending command: ${error.message}`;
        showToast('Error sending command', 'error');
    } finally {
        // Re-enable buttons
        acceptBtn.disabled = false;
        rejectBtn.disabled = false;
    }
}

function clearInput() {
    elements.prompt.value = '';
    updateCharCount();
    elements.prompt.focus();
    showToast('Input cleared', 'info');
}

function toggleStream() {
    streamVisible = !streamVisible;
    elements.streamContainer.style.display = streamVisible ? 'block' : 'none';
    elements.toggleStream.innerHTML = streamVisible ? 
        '<i class="fas fa-eye-slash"></i> Hide Details' : 
        '<i class="fas fa-eye"></i> Show Details';
}

function clearStream() {
    elements.stream.textContent = '';
    showToast('Stream cleared', 'info');
}

function copyCode() {
    const code = elements.output.textContent;
    if (!code || code === 'Ready to generate code...') {
        showToast('No code to copy', 'warning');
        return;
    }
    
    navigator.clipboard.writeText(code).then(() => {
        showToast('Code copied to clipboard!', 'success');
    }).catch(() => {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = code;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showToast('Code copied to clipboard!', 'success');
    });
}

function downloadCode() {
    const code = elements.output.textContent;
    if (!code || code === 'Ready to generate code...') {
        showToast('No code to download', 'warning');
        return;
    }
    
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `generated_code_${new Date().toISOString().slice(0, 10)}.py`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Code downloaded!', 'success');
}

function showAbout() {
    document.getElementById('about-modal').classList.add('show');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('show');
}

function showHelp() {
    showToast('Help documentation coming soon!', 'info');
}

// ======= Progress Management ======= */
function updateProgress(step, total, text) {
    const percentage = (step / total) * 100;
    elements.progressFill.style.width = `${percentage}%`;
    elements.progressText.textContent = text;
}

function addAgentStatus(agentName, status, details = '') {
    const agentCard = document.createElement('div');
    agentCard.className = `agent-card ${status}`;
    agentCard.innerHTML = `
        <div class="agent-name">${agentName}</div>
        <div class="agent-status-text">${details}</div>
    `;
    elements.agentStatus.appendChild(agentCard);
}

function updateAgentStatus(agentName, status, details = '') {
    const existingCard = elements.agentStatus.querySelector(`[data-agent="${agentName}"]`);
    if (existingCard) {
        existingCard.className = `agent-card ${status}`;
        existingCard.querySelector('.agent-status-text').textContent = details;
    } else {
        const agentCard = document.createElement('div');
        agentCard.className = `agent-card ${status}`;
        agentCard.setAttribute('data-agent', agentName);
        agentCard.innerHTML = `
            <div class="agent-name">${agentName}</div>
            <div class="agent-status-text">${details}</div>
        `;
        elements.agentStatus.appendChild(agentCard);
    }
}

// ======= Safety Analysis ======= */
function displaySafetyAnalysis(sentinelResult) {
    if (!sentinelResult) return;
    
    elements.safetySection.style.display = 'block';
    elements.safetyGrid.innerHTML = '';
    
    const layers = [
        { key: 'L1', name: 'CodeGuard', color: 'info' },
        { key: 'llama_guard', name: 'Llama Guard', color: 'warning' },
        { key: 'L2', name: 'Backdoor Guard', color: 'danger' },
        { key: 'L3', name: 'MultiAgent', color: 'success' }
    ];
    
    layers.forEach(layer => {
        const result = sentinelResult[layer.key];
        if (!result) return;
        
        const card = document.createElement('div');
        card.className = `safety-card ${result.category?.toLowerCase() || 'low'}`;
        card.innerHTML = `
            <div class="safety-level ${result.category?.toLowerCase() || 'low'}">
                ${layer.name}
            </div>
            <div class="safety-description">
                ${result.flagged ? 'Flagged' : 'Clean'}
                ${result.reason ? `: ${result.reason}` : ''}
            </div>
        `;
        elements.safetyGrid.appendChild(card);
    });
}

// ======= Event Listeners ======= */
document.addEventListener('DOMContentLoaded', function() {
    // Character count for textarea
    elements.prompt.addEventListener('input', updateCharCount);
    
    // Enter key to generate (Ctrl+Enter)
    elements.prompt.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.key === 'Enter') {
            generateCode();
        }
    });
    
    // Modal close on outside click
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            e.target.classList.remove('show');
        }
    });
    
    // Initialize character count
    updateCharCount();
    
    // Initialize stream as hidden
    elements.streamContainer.style.display = 'none';
});

// ======= SSE Connection ======= */
function initializeSSE() {
    if (eventSource) {
        eventSource.close();
    }
    
    if (!window.EventSource) {
        console.warn('EventSource not supported');
        return;
    }
    
    eventSource = new EventSource('/stream');
    
    eventSource.onmessage = function(event) {
        try {
            const payload = JSON.parse(event.data);
            const ts = new Date().toLocaleTimeString();
            
            // Update stream display
            elements.stream.textContent += `[${ts}] ${JSON.stringify(payload, null, 2)}\n\n`;
            elements.stream.scrollTop = elements.stream.scrollHeight;
            
            // Extract execution ID
            if (payload.execution_id) {
                currentExecutionId = payload.execution_id;
            }
            
            // Handle different types of updates
            if (payload.agent_name) {
                updateAgentStatus(
                    payload.agent_name,
                    payload.status || 'active',
                    payload.task || 'Processing...'
                );
            }
            
            // Check for pause events
            if (payload.task && payload.task.includes('Pausing')) {
                currentExecutionId = payload.execution_id;
                elements.commandSection.style.display = 'block';
                elements.commandStatus.innerHTML = '<i class="fas fa-clock"></i> Waiting for your decision...';
                showToast('Workflow paused - action required', 'warning');
            }
            
            // Display safety analysis if available
            if (payload.sentinel_result) {
                displaySafetyAnalysis(payload.sentinel_result);
            }
            
        } catch (e) {
            elements.stream.textContent += event.data + "\n";
        }
    };
    
    eventSource.onerror = function() {
        console.warn('SSE connection error, retrying...');
        setTimeout(initializeSSE, 5000);
    };
}

// ======= Initialize ======= */
document.addEventListener('DOMContentLoaded', function() {
    initializeSSE();
    showToast('AI Safety Protocol loaded successfully', 'success');
});