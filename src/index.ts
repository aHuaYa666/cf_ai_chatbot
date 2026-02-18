export interface Env {
  AI: any;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // 1. API Endpoint: Chat Logic with Streaming enabled
    if (request.method === "POST" && url.pathname === "/api/chat") {
      try {
        const { prompt, history } = await request.json() as any;

        const messages = [
          { role: "system", content: "You are a professional AI Assistant running on Cloudflare edge. Be concise and accurate." },
          ...(history || []),
          { role: "user", content: prompt }
        ];

        // Enable streaming for real-time response
        const stream = await env.AI.run("@cf/meta/llama-3-8b-instruct", {
          messages,
          stream: true,
        });

        return new Response(stream, {
          headers: { "Content-Type": "text/event-stream" },
        });

      } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
      }
    }

    // 2. Frontend: Responsive UI with Stream Handling
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Assistant | Cloudflare Edge</title>
    <style>
        :root { --primary: #007bff; --bg: #f8f9fa; --chat-bg: #ffffff; }
        body { font-family: -apple-system, system-ui, sans-serif; background: var(--bg); margin: 0; display: flex; flex-direction: column; height: 100vh; }
        header { background: #fff; padding: 1rem 2rem; border-bottom: 1px solid #ddd; font-weight: bold; display: flex; align-items: center; justify-content: space-between; }
        .status { font-size: 12px; color: #28a745; display: flex; align-items: center; gap: 5px; }
        .dot { height: 8px; width: 8px; background: #28a745; border-radius: 50%; }
        #chat-box { flex: 1; overflow-y: auto; padding: 2rem; display: flex; flex-direction: column; gap: 1rem; }
        .msg { max-width: 80%; padding: 12px 16px; border-radius: 15px; line-height: 1.5; font-size: 15px; }
        .user { align-self: flex-end; background: var(--primary); color: white; border-bottom-right-radius: 2px; }
        .ai { align-self: flex-start; background: var(--chat-bg); color: #333; border: 1px solid #ddd; border-bottom-left-radius: 2px; }
        .input-area { background: #fff; padding: 1.5rem; border-top: 1px solid #ddd; display: flex; gap: 10px; }
        input { flex: 1; padding: 12px 20px; border: 1px solid #ddd; border-radius: 25px; outline: none; font-size: 15px; }
        button { background: var(--primary); color: white; border: none; padding: 0 25px; border-radius: 25px; cursor: pointer; font-weight: 600; }
        button:disabled { background: #ccc; cursor: not-allowed; }
    </style>
</head>
<body>
    <header>
        <span>EdgeChat AI</span>
        <div class="status"><span class="dot"></span> Llama 3 Online</div>
    </header>
    <div id="chat-box">
        <div class="msg ai">Hello! I'm your AI assistant running on Cloudflare's edge network. How can I help you today?</div>
    </div>
    <div class="input-area">
        <input type="text" id="userInput" placeholder="Ask me anything..." autocomplete="off">
        <button id="sendBtn">Send</button>
    </div>

    <script>
        let chatHistory = [];
        const box = document.getElementById('chat-box');
        const input = document.getElementById('userInput');
        const btn = document.getElementById('sendBtn');

        async function send() {
            const text = input.value.trim();
            if (!text || btn.disabled) return;

            // Render User Input
            box.innerHTML += '<div class="msg user">' + text + '</div>';
            input.value = '';
            btn.disabled = true;
            
            // Create Placeholder for AI Response
            const aiMsgDiv = document.createElement('div');
            aiMsgDiv.className = 'msg ai';
            aiMsgDiv.innerText = '...';
            box.appendChild(aiMsgDiv);
            box.scrollTop = box.scrollHeight;

            try {
                const response = await fetch('/api/chat', {
                    method: 'POST',
                    body: JSON.stringify({ prompt: text, history: chatHistory })
                });

                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let fullResponse = "";
                aiMsgDiv.innerText = ""; 

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    
                    const chunk = decoder.decode(value, { stream: true });
                    const lines = chunk.split('\\n');
                    
                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const dataStr = line.substring(6);
                            if (dataStr === '[DONE]') break;
                            try {
                                const data = JSON.parse(dataStr);
                                if (data.response) {
                                    fullResponse += data.response;
                                    aiMsgDiv.innerText = fullResponse;
                                    box.scrollTop = box.scrollHeight;
                                }
                            } catch (e) {}
                        }
                    }
                }
                chatHistory.push({ role: "user", content: text });
                chatHistory.push({ role: "assistant", content: fullResponse });
            } catch (err) {
                aiMsgDiv.innerText = "Error: Connection lost.";
            } finally {
                btn.disabled = false;
            }
        }
        btn.addEventListener('click', send);
        input.addEventListener('keypress', (e) => { if(e.key === 'Enter') send(); });
    </script>
</body>
</html>`;

    return new Response(html, { headers: { "Content-Type": "text/html;charset=UTF-8" } });
  },
};