# Edge AI Assistant (Llama 3 Powered)

A high-performance, full-stack AI chatbot deployed globally on Cloudflare's edge network. Built with a focus on low latency and serverless architecture.

## 🔗 Project Links
- **Live Demo**: [https://cf-ai-chatbot.jinlindqueenie.workers.dev](https://cf-ai-chatbot.jinlindqueenie.workers.dev)
- **GitHub Repository**: [https://github.com/aHuaYa666/cf_ai_chatbot](https://github.com/aHuaYa666/cf_ai_chatbot)
- **Tech Stack**: Cloudflare Workers, TypeScript, Meta Llama 3 (8B-Instruct).

## 🚀 Key Technical Highlights

### 1. Streaming Architecture (SSE)
Unlike traditional JSON-based APIs that wait for the full response, this project implements **Server-Sent Events (SSE)**. 
- **Benefit**: Reduces "Time to First Token" (TTFT) to sub-second levels, providing a smooth, "typewriter" effect UI.
- **Implementation**: Utilizes `ReadableStream` on the Workers runtime to pipe AI chunks directly to the client.

### 2. Edge-Native Performance
By leveraging **Cloudflare Workers AI**, the application eliminates the need for managing heavy GPU infrastructure.
- **Global Distribution**: Code and AI inference run at the edge node closest to the user.
- **Zero-Cold Start**: Instant-on performance compared to traditional containerized deployments.

### 3. Context-Aware Memory
The assistant maintains conversation continuity by coordinating chat history between the client and the edge.
- **Logic**: Implements a sliding window history buffer to ensure the LLM retains context while staying within token limits.

## 🏗️ System Architecture

[User Browser] 
      |
      | (HTTP POST /api/chat)
      v
[Cloudflare Edge Node]
      |
      |-- (Worker Logic: History Injection)
      |-- (Workers AI: Llama-3-8B Inference)
      |
      v
[Streaming Response (SSE)] ---> [Real-time UI Update]

## 🛠️ Local Development

1. **Clone & Install**:
   ```bash
   git clone [Your-Repo-URL]
   npm install
