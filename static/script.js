async function generateCode() {
    const prompt = document.getElementById('prompt').value;
    const output = document.getElementById('output');
    const stream = document.getElementById('stream');
    output.textContent = "⏳ Generating code, please wait...";
    stream.textContent = "";

    const response = await fetch('/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
    });

    const data = await response.json();
    output.textContent = data.final_code || "⚠️ No output returned.";
}

// Start SSE connection on page load for live updates
(() => {
    const stream = document.getElementById('stream');
    if (!stream || !window.EventSource) return;
    const es = new EventSource('/stream');
    es.onmessage = (event) => {
        try {
            const payload = JSON.parse(event.data);
            const ts = new Date().toLocaleTimeString();
            stream.textContent += `[${ts}] ${JSON.stringify(payload, null, 2)}\n\n`;
            stream.scrollTop = stream.scrollHeight;
        } catch (e) {
            stream.textContent += event.data + "\n";
        }
    };
    es.onerror = () => {
        // Keep it simple; browser will retry
    };
})();
