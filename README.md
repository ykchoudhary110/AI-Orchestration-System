🤖 Intelligent Offline AI Model Orchestration System
🚀 Project Overview

This project presents an Intelligent Offline AI Model Orchestration System that automatically understands user prompts and recommends the most suitable AI model to handle the task. Unlike traditional systems where users manually select models, our system uses semantic understanding and similarity search to automate this process efficiently.

The system is designed to work on low-resource devices using lightweight open-source models while maintaining performance close to cloud-based AI systems.

🎯 Problem Statement

Most AI tools today require:

Manual model selection
High computational resources
Internet dependency

This creates barriers for:

Students
Low-end device users
Offline environments
💡 Proposed Solution

We built a system that:

Accepts a natural language prompt
Understands its meaning using embeddings
Finds similar prompts using FAISS
Suggests the best Primary and Fallback AI models

This enables:
✔ Automatic model selection
✔ Offline AI usage
✔ Resource-efficient execution

⚙️ System Architecture
User Prompt
   ↓
Input Cleaning
   ↓
Embedding (SentenceTransformer)
   ↓
FAISS Similarity Search
   ↓
Top-K Matching Prompts
   ↓
Model Suggestion (Primary + Fallback)
   ↓
Output to UI
🧠 Methodology (Step-by-Step)
1. Input Processing

The user enters a prompt. The system cleans and preprocesses the text for better understanding.

2. Text Embedding

We use a pre-trained model (all-MiniLM-L6-v2) to convert text into numerical vectors that capture semantic meaning.

3. Similarity Matching (FAISS)

The user query embedding is compared with stored dataset embeddings using FAISS to find the most similar prompts.

4. Top-K Retrieval

The system retrieves the top similar prompts (K nearest neighbors).

5. Model Suggestion

Based on matched prompts, the system suggests:

Primary Model (lightweight, fast)
Fallback Model (more powerful)
6. Safety Layer

The system filters:

Restricted requests (e.g., hacking, malware)
Invalid tasks
🧩 Key Features

✨ Semantic understanding (not keyword-based)
✨ Fully offline-capable system
✨ Lightweight and efficient
✨ Automatic model routing
✨ Safety and validation layer
✨ Scalable architecture

📊 Dataset

We created a custom dataset of 2000+ prompts, each containing:

Prompt
Task Type
Primary Model
Fallback Model

🔗 Prompt Dataset:
https://docs.google.com/spreadsheets/d/1Pc8FpfCMw4ld0yArRx_xWuslsvf1XmBs_f5exsP3bFY/edit?usp=sharing

🔗 Models & Licenses:
https://docs.google.com/spreadsheets/d/1wNpJtnlyQYCCl3eqThxfNHg7xCFxG04SSkXVGXIxd4g/edit?usp=sharing

🤖 Models Used

We use open-source, commercially usable AI models, including:

Phi-3.5 Mini (Text)
Mistral 7B (Text - fallback)
StarCoder2 (Code)
Qwen2.5-Coder (Code - fallback)
Stable Diffusion (Image)
SDXL (Image - fallback)
Whisper (Audio)
Piper TTS (Speech)
🛠️ Tech Stack
Python
SentenceTransformers
FAISS
Pandas / NumPy
Gradio (UI)
Google Colab
🖥️ User Interface

We built a simple UI using Gradio, where users:

Enter a prompt
Receive task detection
Get model suggestions instantly
🔐 Licensing Strategy

We prioritized:

MIT License
Apache 2.0

To ensure:
✔ Commercial usage
✔ No legal restrictions
✔ Scalability for startups

🚀 Future Improvements
Multi-intent task splitting
Real model execution (LLaMA, SD integration)
API deployment (FastAPI)
Voice assistant support
Performance optimization
🎓 Conclusion

This project demonstrates that intelligent AI orchestration can be achieved on low-resource devices using smart routing instead of heavy computation. It bridges the gap between accessibility and performance in AI systems.

👨‍💻 Authors
Your Name
⭐ If you like this project, give it a star!
