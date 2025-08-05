# <p align="center" width="100%"><img width="250" height="250" alt="re:memo" align="center" src="https://github.com/user-attachments/assets/142110dc-9567-4e24-9837-e2d4d7d143a5" /><p/>


> *AI-assisted journaling that helps you remember, reflect, and grow*

**re:memo** is a privacy-focused AI journaling application that transforms your thoughts into structured insights while keeping your data under your control. Built during a 30-hour hackathon, it combines the intimacy of personal journaling with the power of AI to help you understand patterns in your life, remember important details, and gain deeper self-awareness.

## 🌟 Motivation

In our fast-paced world, we often lose track of our thoughts, experiences, and personal growth. Traditional journaling is powerful but can feel overwhelming - where do you start? What should you write about? How do you find patterns in months of entries?

**re:memo** solves these problems by:
- **Removing the blank page problem** with AI-powered writing prompts based on your history
- **Extracting meaningful insights** from your stream-of-consciousness writing
- **Creating a searchable memory palace** of your experiences and growth
- **Respecting your privacy** with local AI options and full data control
- **Making reflection effortless** through intelligent suggestions and chat-based exploration

## 🚀 Key Features

### ✅ Core Features (MVP)
- [x] **Markdown Journal Editor** - Write with live preview, just like Obsidian
- [x] **AI-Powered Processing** - Automatically extract events, facts, and insights from entries
- [x] **Smart Topic Suggestions** - Get personalized writing prompts based on your history
- [x] **Intelligent Search** - Vector-based search to find relevant entries and memories
- [x] **Chat with Your Journal** - Ask questions about your past entries and get AI responses
- [x] **Privacy-First Design** - Optional local LLM support with Ollama
- [x] **Docker Deployment** - One-command setup with docker-compose
- [x] **Entry Review System** - AI-generated insights and connections to past entries

### 🔄 In Development
- [ ] **Voice Journaling** - Speak your thoughts, get structured journal entries
- [ ] **Advanced Fact Management** - Smart handling of changing preferences and contradictions
- [ ] **Rich Text Search** - Full-text fuzzy search across all journal entries

### 🎯 Future Enhancements
- [ ] **Insights Dashboard** - Visualize emotions, themes, and growth over time
- [ ] **Habit Tracking Integration** - Connect journal insights with behavior patterns
- [ ] **Export & Backup** - Multiple format exports (PDF, Markdown, JSON)
- [ ] **Mobile App** - React Native companion app
- [ ] **Advanced Privacy** - End-to-end encryption options
- [ ] **Collaboration Features** - Share insights with therapists or coaches (opt-in)

## 🏗️ Architecture

### Tech Stack
- **Frontend**: React 18 + Vite + Tailwind CSS
- **Backend**: Python Quart (async Flask)
- **Database**: PostgreSQL with pgvector for embeddings
- **AI/ML**: 
  - LLMs: Ollama (local) or OpenAI-compatible APIs
  - Embeddings: HuggingFace sentence-transformers
- **Deployment**: Docker + Docker Compose

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- (Optional) NVIDIA GPU for local LLM support

### 1. Clone and Configure
```bash
git clone https://github.com/your-username/re-memo.git
cd re-memo
cp .env.example .env
# Edit .env with your preferences
```

### 2. Choose Your Setup

> [!TIP]
> So far, we have tested the default prompt flows with Mistral 3.2 Instruct and GPT 4o-mini.
> However, we would like to build a reference of LLM models and model-specific prompts that work well with re:memo!

**Option A: Full Privacy (Local AI)**
```bash
# Requires GPU for optimal performance
docker-compose --profile llm-selfhost --profile db-selfhost up -d
```

**Option B: Hybrid (Local DB + External OpenAI API / Ollama API compatible provider)**
> [!NOTE]
> This option can still be private! You might have your LLM service privately hosted elsewhere :)
```bash
docker-compose --profile db-selfhost up -d
```

**Option C: Backend Only**
> [!NOTE]
> Like before, this is still private if you already have a private Postgres + LLM provider elsewhere :)
```bash
# Fastest setup for testing
docker-compose up -d rememo
```

### 3. Start Journaling
Navigate to `http://localhost:8080` and start writing! 

## 💡 How It Works

1. **Write Naturally** - Use the markdown editor to journal however feels comfortable
2. **AI Processing** - When you mark an entry complete, AI extracts key facts, events, and topics
3. **Build Your Memory** - Facts are stored as searchable embeddings in your personal database
4. **Get Suggestions** - Next time you write, get personalized prompts based on your history
5. **Chat & Explore** - Ask questions about your past entries through the chat interface

## 🎯 Use Cases

- **Daily Reflection** - Process your day with AI-guided prompts
- **Therapy Support** - Structured self-reflection between sessions
- **Creative Writing** - Explore themes and patterns in your creative process
- **Goal Tracking** - Monitor progress and mindset changes over time
- **Memory Palace** - Never lose important thoughts or realizations
- **Personal Research** - Chat with your past self to find insights

## 🔧 Configuration

Key environment variables:

```bash
# LLM Configuration
LLM_PROVIDER=ollama          # ollama or openai
OPENAI_API_KEY=sk-...        # For OpenAI/compatible APIs
OPENAI_BASE_URL=https://...  # ^
DEFAULT_MODEL=llama3.1       # Model name

# AI Behavior
SYSTEM_PROMPT="Custom prompt..."     # Customize AI personality
```

## 🤝 Contributing

This project started as a hackathon but we welcome contributions! Areas where help is needed:

- **UI/UX Design** - Making the interface more intuitive and beautiful
- **AI Prompt Engineering** - Improving fact extraction and suggestions
- **Privacy Features** - Enhanced security and data protection
- **Mobile Development** - React Native companion app
- **Documentation** - User guides and developer docs

## 📄 License

Shield: [![CC BY-NC-SA 4.0][cc-by-nc-sa-shield]][cc-by-nc-sa]

This work is licensed under a
[Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International License][cc-by-nc-sa].

[![CC BY-NC-SA 4.0][cc-by-nc-sa-image]][cc-by-nc-sa]

[cc-by-nc-sa]: http://creativecommons.org/licenses/by-nc-sa/4.0/
[cc-by-nc-sa-image]: https://licensebuttons.net/l/by-nc-sa/4.0/88x31.png
[cc-by-nc-sa-shield]: https://img.shields.io/badge/License-CC%20BY--NC--SA%204.0-lightgrey.svg

## 🙏 Acknowledgments

- Built during AI Engine: Hackathon 2025
- Inspired by tools like Obsidian, Day One, and Roam Research
- Thanks to the open-source AI community for making local LLMs accessible
- Thanks to my lil bro @asian-mario for the sick logo
- Thanks to my bestie @curz46 for the sick name

---

**Start your journey of self-discovery today.** Your thoughts deserve to be remembered, understood, and connected. 

*Made with ❤️ by developers who believe in privacy-first AI*
