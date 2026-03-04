[README (1).md](https://github.com/user-attachments/files/25736762/README.1.md)
<div align="center">

<img src="https://img.shields.io/badge/Cortex-AI%20Developer%20Tool-CF7B2E?style=for-the-badge&logo=visual-studio-code&logoColor=white"/>
<img src="https://img.shields.io/badge/Powered%20by-Groq%20%2B%20Llama%203.3-553C9A?style=for-the-badge"/>
<img src="https://img.shields.io/badge/Built%20for-TRAE%20AI%20IDE-0078D4?style=for-the-badge"/>
<img src="https://img.shields.io/badge/Hackathon-BWT%20Akatsuki-FF6B35?style=for-the-badge"/>

# 🧠 Cortex AI
### *The Focus Engine for Developers*

**Stop losing hours re-orientating yourself. Cortex is an AI layer that lives inside your IDE — recovering your context, explaining your code, generating smart boilerplate, and answering your questions via voice.**

[Features](#-features) · [Demo](#-demo) · [Installation](#-installation) · [Architecture](#-architecture) · [Roadmap](#-future-roadmap)

</div>

---

## 🚨 The Problem

Every developer faces this every single day:

| Situation | Time Lost |
|-----------|-----------|
| Reopening a project after a break | 15–45 min |
| Understanding unfamiliar code | 20–60 min |
| Writing repetitive boilerplate | 10–30 min |
| Asking questions without breaking flow | Constant context switching |

> **The average developer loses 2–3 hours per day just re-orientating themselves.** That's 30–40% of a workday gone before writing a single line of productive code.

Current tools don't solve this. GitHub Copilot autocompletes. ChatGPT requires context-switching. Stack Overflow requires searching. **None of them know where YOU stopped.**

---

## 💡 The Solution

**Cortex AI** is a VS Code extension that acts as your developer's second brain. It reads your workspace — git history, open files, recent changes — and instantly rebuilds your mental model so you can get back into flow in seconds, not hours.

```
You left at 11pm debugging an auth issue.
You return at 9am.
Cortex says: "You were fixing JWT token expiry in auth.ts.
              You stopped at line 47. Next: test the refresh flow."
```

---

## ✨ Features

### 1. ↩ Context Recovery — *Wake-Up Briefing*
Cortex analyzes your entire workspace when you return and generates a plain-English briefing telling you exactly where you stopped, what you were building, and your next 3 prioritized actions.

- Reads git commit history and recent file modifications
- Detects open editor tabs and active files  
- Generates confidence-scored briefing via Llama 3.3 70B
- Shows recently touched files with change counts

### 2. ◈ Code Explainer — *Deep Code Intelligence*
Select any code — a function, a class, an entire file — and Cortex explains it with surgical precision.

- **Purpose** — WHY this code exists in the system
- **How it works** — Step-by-step breakdown
- **Potential issues** — Security vulnerabilities, missing error handling, code smells
- **Dependencies** — Related concepts and patterns
- **Complexity rating** — Low / Medium / High

### 3. ⬡ Smart Boilerplate Generator — *Code That Matches Your Style*
Describe what you need in plain English. Cortex analyzes your codebase style and generates code that matches your exact naming conventions, patterns, and architecture.

- Detects your framework (React, Express, Next.js, Vue, etc.)
- Mirrors your naming conventions and import style
- Supports TypeScript, JavaScript, Python, Go, Rust, Java
- One-click insert at cursor or copy to clipboard

### 4. 🎙️ Voice Assistant — *Hands-Free Code Queries*
Ask questions about your codebase without breaking your flow. Speak naturally, get precise answers powered by Whisper AI + Llama 3.3.

- Real microphone recording via local browser popup
- Groq Whisper transcription (industry-leading accuracy)
- Context-aware answers based on your open files
- Text-to-speech response playback
- Text input fallback for silent environments

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        DEVELOPER                            │
│           VS Code / TRAE AI IDE (TypeScript)                │
└──────────────────────┬──────────────────────────────────────┘
                       │
         ┌─────────────▼─────────────┐
         │      Cortex Extension      │
         │   ┌─────────────────────┐  │
         │   │   Webview Panel UI  │  │
         │   │  (Claude-inspired)  │  │
         │   └──────────┬──────────┘  │
         │              │             │
         │   ┌──────────▼──────────┐  │
         │   │  Extension Host     │  │
         │   │  ┌───────────────┐  │  │
         │   │  │ContextRecovery│  │  │
         │   │  │ CodeExplainer │  │  │
         │   │  │ Boilerplate   │  │  │
         │   │  │ VoiceServer   │  │  │
         │   │  └───────┬───────┘  │  │
         │   └──────────┼──────────┘  │
         └──────────────┼─────────────┘
                        │
         ┌──────────────▼──────────────┐
         │         Groq API            │
         │  ┌──────────────────────┐   │
         │  │  Llama 3.3 70B       │   │
         │  │  (Context + Code AI) │   │
         │  └──────────────────────┘   │
         │  ┌──────────────────────┐   │
         │  │  Whisper Large V3    │   │
         │  │  (Voice Transcription│   │
         │  └──────────────────────┘   │
         └─────────────────────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Extension Platform | VS Code Extension API (TypeScript) |
| AI Inference | Groq API — Llama 3.3 70B Versatile |
| Voice Transcription | Groq Whisper Large V3 Turbo |
| Voice Recording | Browser MediaRecorder API (local HTTP server) |
| Code Analysis | VS Code Language API + File System |
| Git Intelligence | Child Process git log parsing |
| UI | Custom Webview — Claude-inspired design |
| Target IDE | TRAE AI IDE (VS Code compatible) |

---

## 📦 Installation

### Prerequisites
- Node.js 18+
- VS Code 1.85+ or TRAE AI IDE
- Groq API key (free at [console.groq.com](https://console.groq.com))

### Setup

```bash
# Clone the repository
git clone https://github.com/Loknath816/BWT_Akatsuki.git
cd BWT_Akatsuki

# Install dependencies
npm install

# Compile the extension
npm run compile

# Launch in VS Code
# Press F5 to open Extension Development Host
```

### Configure API Key
1. Open Cortex panel with `Ctrl+Shift+A`
2. Click **⚙ Setup** tab
3. Paste your Groq API key
4. Click **💾 Save Key**

---

## 🎮 Usage

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+A` | Open Cortex Panel |
| `Ctrl+Shift+R` | Recover Context |
| `Ctrl+Shift+E` | Explain Selected Code |
| `Ctrl+Shift+B` | Generate Boilerplate |

---

## 🚀 Future Roadmap

### Phase 2 — Team Intelligence
- [ ] **Team Context Sync** — Share context briefings across your team
- [ ] **PR Explainer** — Auto-explain pull requests before review
- [ ] **Meeting Mode** — Generate standup summaries from git activity

### Phase 3 — Deeper IDE Integration  
- [ ] **TRAE AI Native Integration** — Built directly into TRAE's sidebar
- [ ] **Inline Explanations** — Hover over any symbol for AI explanation
- [ ] **Real-time Bug Detection** — Flag issues as you type
- [ ] **Multi-repo Context** — Understand dependencies across repositories

### Phase 4 — Enterprise
- [ ] **Private LLM Support** — Run on-premise with local models
- [ ] **Codebase Onboarding** — Generate onboarding docs for new developers
- [ ] **Tech Debt Radar** — AI-powered technical debt scoring
- [ ] **Architecture Diagram Generation** — Auto-generate system diagrams

---

## 👥 Team

**BWT Akatsuki** — Built for the TRAE AI IDE Hackathon

| Role | Focus |
|------|-------|
| AI/ML Engineering | LLM integration, prompt engineering, Groq API |
| Extension Development | VS Code API, TypeScript, Webview UI |

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">

**Built with ❤️ for developers who value their focus and flow**

*Cortex AI — Because your time is too![architecture (1)](https://github.com/user-attachments/assets/61ce2aae-d31c-4290-be60-7ffac0c325da)
 valuable to spend re-orientating you<svg width="900" height="620" viewBox="0 0 900 620" xmlns="http://www.w3.org/2000/svg" font-family="'Segoe UI', -apple-system, sans-serif">
  <!-- White background -->
  <rect width="900" height="620" fill="#FFFFFF"/>

  <!-- Subtle grid -->
  <defs>
    <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
      <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#F0F0F0" stroke-width="0.5"/>
    </pattern>
    <filter id="shadow">
      <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="#00000012"/>
    </filter>
    <filter id="shadow-sm">
      <feDropShadow dx="0" dy="1" stdDeviation="2" flood-color="#0000000A"/>
    </filter>
  </defs>
  <rect width="900" height="620" fill="url(#grid)"/>

  <!-- Title -->
  <text x="450" y="38" text-anchor="middle" font-size="20" font-weight="700" fill="#1A1916" letter-spacing="-0.5">Cortex AI — System Architecture</text>
  <text x="450" y="58" text-anchor="middle" font-size="12" fill="#9B9B99">Developer Focus Engine · Built for TRAE AI IDE Hackathon</text>

  <!-- ── LAYER 1: DEVELOPER / IDE ── -->
  <rect x="40" y="80" width="820" height="90" rx="14" fill="#FDF6EE" stroke="#F0D9BC" stroke-width="1.5" filter="url(#shadow-sm)"/>
  <text x="70" y="106" font-size="10" font-weight="700" fill="#9B9B99" letter-spacing="1.5">DEVELOPER ENVIRONMENT</text>

  <!-- VS Code box -->
  <rect x="60" y="114" width="220" height="42" rx="8" fill="#FFFFFF" stroke="#E8E8E5" stroke-width="1" filter="url(#shadow-sm)"/>
  <rect x="60" y="114" width="6" height="42" rx="3" fill="#0078D4"/>
  <text x="82" y="131" font-size="11" font-weight="600" fill="#1A1916">VS Code / TRAE AI IDE</text>
  <text x="82" y="146" font-size="10" fill="#6B6B6A">TypeScript Extension Host</text>

  <!-- Cortex Panel box -->
  <rect x="310" y="114" width="180" height="42" rx="8" fill="#FFFFFF" stroke="#E8E8E5" stroke-width="1" filter="url(#shadow-sm)"/>
  <rect x="310" y="114" width="6" height="42" rx="3" fill="#CF7B2E"/>
  <text x="330" y="131" font-size="11" font-weight="600" fill="#1A1916">Cortex Panel UI</text>
  <text x="330" y="146" font-size="10" fill="#6B6B6A">Claude-inspired Webview</text>

  <!-- Keyboard shortcuts -->
  <rect x="520" y="114" width="180" height="42" rx="8" fill="#FFFFFF" stroke="#E8E8E5" stroke-width="1" filter="url(#shadow-sm)"/>
  <rect x="520" y="114" width="6" height="42" rx="3" fill="#553C9A"/>
  <text x="540" y="131" font-size="11" font-weight="600" fill="#1A1916">Keyboard Commands</text>
  <text x="540" y="146" font-size="10" fill="#6B6B6A">Ctrl+Shift+A/R/E/B</text>

  <!-- Status Bar -->
  <rect x="730" y="114" width="110" height="42" rx="8" fill="#FFFFFF" stroke="#E8E8E5" stroke-width="1" filter="url(#shadow-sm)"/>
  <rect x="730" y="114" width="6" height="42" rx="3" fill="#276749"/>
  <text x="750" y="131" font-size="11" font-weight="600" fill="#1A1916">Status Bar</text>
  <text x="750" y="146" font-size="10" fill="#6B6B6A">$(sparkle) Active</text>

  <!-- Arrow down -->
  <line x1="450" y1="170" x2="450" y2="198" stroke="#D4D4CF" stroke-width="1.5" stroke-dasharray="4,3"/>
  <polygon points="445,196 455,196 450,204" fill="#D4D4CF"/>

  <!-- ── LAYER 2: EXTENSION FEATURES ── -->
  <rect x="40" y="210" width="820" height="130" rx="14" fill="#F8F7FF" stroke="#D6BCFA" stroke-width="1.5" filter="url(#shadow-sm)"/>
  <text x="70" y="236" font-size="10" font-weight="700" fill="#9B9B99" letter-spacing="1.5">CORTEX AI FEATURES — EXTENSION LAYER</text>

  <!-- Feature 1 -->
  <rect x="60" y="244" width="175" height="82" rx="10" fill="#FFFFFF" stroke="#E8E8E5" stroke-width="1" filter="url(#shadow-sm)"/>
  <rect x="60" y="244" width="175" height="8" rx="5" fill="#CF7B2E"/>
  <rect x="60" y="248" width="175" height="4" fill="#CF7B2E"/>
  <text x="148" y="268" text-anchor="middle" font-size="18">↩</text>
  <text x="148" y="286" text-anchor="middle" font-size="11" font-weight="700" fill="#1A1916">Context Recovery</text>
  <text x="148" y="300" text-anchor="middle" font-size="9.5" fill="#6B6B6A">Git history + file analysis</text>
  <text x="148" y="313" text-anchor="middle" font-size="9.5" fill="#6B6B6A">Wake-up briefing generation</text>

  <!-- Feature 2 -->
  <rect x="255" y="244" width="175" height="82" rx="10" fill="#FFFFFF" stroke="#E8E8E5" stroke-width="1" filter="url(#shadow-sm)"/>
  <rect x="255" y="244" width="175" height="8" rx="5" fill="#2B6CB0"/>
  <rect x="255" y="248" width="175" height="4" fill="#2B6CB0"/>
  <text x="343" y="268" text-anchor="middle" font-size="18">◈</text>
  <text x="343" y="286" text-anchor="middle" font-size="11" font-weight="700" fill="#1A1916">Code Explainer</text>
  <text x="343" y="300" text-anchor="middle" font-size="9.5" fill="#6B6B6A">Purpose + How it works</text>
  <text x="343" y="313" text-anchor="middle" font-size="9.5" fill="#6B6B6A">Issues + Dependencies</text>

  <!-- Feature 3 -->
  <rect x="450" y="244" width="175" height="82" rx="10" fill="#FFFFFF" stroke="#E8E8E5" stroke-width="1" filter="url(#shadow-sm)"/>
  <rect x="450" y="244" width="175" height="8" rx="5" fill="#276749"/>
  <rect x="450" y="248" width="175" height="4" fill="#276749"/>
  <text x="538" y="268" text-anchor="middle" font-size="18">⬡</text>
  <text x="538" y="286" text-anchor="middle" font-size="11" font-weight="700" fill="#1A1916">Boilerplate Generator</text>
  <text x="538" y="300" text-anchor="middle" font-size="9.5" fill="#6B6B6A">Style-aware code generation</text>
  <text x="538" y="313" text-anchor="middle" font-size="9.5" fill="#6B6B6A">Framework detection</text>

  <!-- Feature 4 -->
  <rect x="645" y="244" width="175" height="82" rx="10" fill="#FFFFFF" stroke="#E8E8E5" stroke-width="1" filter="url(#shadow-sm)"/>
  <rect x="645" y="244" width="175" height="8" rx="5" fill="#553C9A"/>
  <rect x="645" y="248" width="175" height="4" fill="#553C9A"/>
  <text x="733" y="268" text-anchor="middle" font-size="18">🎙️</text>
  <text x="733" y="286" text-anchor="middle" font-size="11" font-weight="700" fill="#1A1916">Voice Assistant</text>
  <text x="733" y="300" text-anchor="middle" font-size="9.5" fill="#6B6B6A">Local HTTP voice server</text>
  <text x="733" y="313" text-anchor="middle" font-size="9.5" fill="#6B6B6A">Browser mic → Whisper</text>

  <!-- Arrow down -->
  <line x1="450" y1="340" x2="450" y2="368" stroke="#D4D4CF" stroke-width="1.5" stroke-dasharray="4,3"/>
  <polygon points="445,366 455,366 450,374" fill="#D4D4CF"/>

  <!-- ── LAYER 3: DATA SOURCES ── -->
  <rect x="40" y="380" width="380" height="100" rx="14" fill="#F0FFF4" stroke="#C6F6D5" stroke-width="1.5" filter="url(#shadow-sm)"/>
  <text x="70" y="404" font-size="10" font-weight="700" fill="#9B9B99" letter-spacing="1.5">LOCAL WORKSPACE DATA</text>

  <rect x="60" y="412" width="100" height="54" rx="8" fill="#FFFFFF" stroke="#E8E8E5" stroke-width="1"/>
  <text x="110" y="434" text-anchor="middle" font-size="18">📁</text>
  <text x="110" y="450" text-anchor="middle" font-size="10" font-weight="600" fill="#1A1916">File System</text>
  <text x="110" y="462" text-anchor="middle" font-size="9" fill="#6B6B6A">Recent files</text>

  <rect x="175" y="412" width="100" height="54" rx="8" fill="#FFFFFF" stroke="#E8E8E5" stroke-width="1"/>
  <text x="225" y="434" text-anchor="middle" font-size="18">⎇</text>
  <text x="225" y="450" text-anchor="middle" font-size="10" font-weight="600" fill="#1A1916">Git History</text>
  <text x="225" y="462" text-anchor="middle" font-size="9" fill="#6B6B6A">Commits + diffs</text>

  <rect x="290" y="412" width="110" height="54" rx="8" fill="#FFFFFF" stroke="#E8E8E5" stroke-width="1"/>
  <text x="345" y="434" text-anchor="middle" font-size="18">📋</text>
  <text x="345" y="450" text-anchor="middle" font-size="10" font-weight="600" fill="#1A1916">Open Editors</text>
  <text x="345" y="462" text-anchor="middle" font-size="9" fill="#6B6B6A">Tabs + selections</text>

  <!-- Arrow between layers -->
  <line x1="660" y1="380" x2="660" y2="370" stroke="#D4D4CF" stroke-width="1" stroke-dasharray="3,3"/>

  <!-- ── LAYER 4: GROQ AI ── -->
  <rect x="460" y="380" width="400" height="100" rx="14" fill="#EBF8FF" stroke="#BEE3F8" stroke-width="1.5" filter="url(#shadow-sm)"/>
  <text x="490" y="404" font-size="10" font-weight="700" fill="#9B9B99" letter-spacing="1.5">GROQ AI INFERENCE</text>

  <rect x="480" y="412" width="160" height="54" rx="8" fill="#FFFFFF" stroke="#E8E8E5" stroke-width="1"/>
  <rect x="480" y="412" width="160" height="4" rx="2" fill="#F6833A"/>
  <text x="560" y="432" text-anchor="middle" font-size="11" font-weight="700" fill="#1A1916">Llama 3.3 70B</text>
  <text x="560" y="447" text-anchor="middle" font-size="9.5" fill="#6B6B6A">Context · Explain · Generate</text>
  <text x="560" y="459" text-anchor="middle" font-size="9" fill="#9B9B99">groq.com — Free tier</text>

  <rect x="660" y="412" width="180" height="54" rx="8" fill="#FFFFFF" stroke="#E8E8E5" stroke-width="1"/>
  <rect x="660" y="412" width="180" height="4" rx="2" fill="#553C9A"/>
  <text x="750" y="432" text-anchor="middle" font-size="11" font-weight="700" fill="#1A1916">Whisper Large V3</text>
  <text x="750" y="447" text-anchor="middle" font-size="9.5" fill="#6B6B6A">Voice transcription</text>
  <text x="750" y="459" text-anchor="middle" font-size="9" fill="#9B9B99">Industry-leading accuracy</text>

  <!-- ── CONNECTING ARROWS ── -->
  <!-- Features to Workspace -->
  <line x1="230" y1="340" x2="230" y2="380" stroke="#C6F6D5" stroke-width="1.5" stroke-dasharray="4,3"/>
  <polygon points="225,378 235,378 230,386" fill="#C6F6D5"/>

  <!-- Features to Groq -->
  <line x1="660" y1="340" x2="660" y2="380" stroke="#BEE3F8" stroke-width="1.5" stroke-dasharray="4,3"/>
  <polygon points="655,378 665,378 660,386" fill="#BEE3F8"/>
    <!-- ── OUTPUT LAYER ── -->
  <rect x="40" y="510" width="820" height="80" rx="14" fill="#FFFBEB" stroke="#FDE68A" stroke-width="1.5" filter="url(#shadow-sm)"/>
  <text x="70" y="534" font-size="10" font-weight="700" fill="#9B9B99" letter-spacing="1.5">DEVELOPER OUTPUTS</text>

  <rect x="60" y="542" width="140" height="36" rx="7" fill="#FFFFFF" stroke="#E8E8E5" stroke-width="1"/>
  <text x="130" y="556" text-anchor="middle" font-size="10" font-weight="600" fill="#CF7B2E">📍 Context Briefing</text>
  <text x="130" y="569" text-anchor="middle" font-size="9" fill="#6B6B6A">Where you stopped</text>

  <rect x="220" y="542" width="140" height="36" rx="7" fill="#FFFFFF" stroke="#E8E8E5" stroke-width="1"/>
  <text x="290" y="556" text-anchor="middle" font-size="10" font-weight="600" fill="#2B6CB0">🔍 Code Explanation</text>
  <text x="290" y="569" text-anchor="middle" font-size="9" fill="#6B6B6A">Deep understanding</text>

  <rect x="380" y="542" width="140" height="36" rx="7" fill="#FFFFFF" stroke="#E8E8E5" stroke-width="1"/>
  <text x="450" y="556" text-anchor="middle" font-size="10" font-weight="600" fill="#276749">⬡ Generated Code</text>
  <text x="450" y="569" text-anchor="middle" font-size="9" fill="#6B6B6A">Style-matched boilerplate</text>

  <rect x="540" y="542" width="140" height="36" rx="7" fill="#FFFFFF" stroke="#E8E8E5" stroke-width="1"/>
  <text x="610" y="556" text-anchor="middle" font-size="10" font-weight="600" fill="#553C9A">🎙️ Voice Answer</text>
  <text x="610" y="569" text-anchor="middle" font-size="9" fill="#6B6B6A">Spoken + chat response</text>

  <rect x="700" y="542" width="140" height="36" rx="7" fill="#FFFFFF" stroke="#E8E8E5" stroke-width="1"/>
  <text x="770" y="556" text-anchor="middle" font-size="10" font-weight="600" fill="#C53030">⚡ Next Actions</text>
  <text x="770" y="569" text-anchor="middle" font-size="9" fill="#6B6B6A">Prioritized tasks</text>

  <!-- Arrow to outputs -->
  <line x1="230" y1="480" x2="230" y2="510" stroke="#FDE68A" stroke-width="1.5" stroke-dasharray="4,3"/>
  <polygon points="225,508 235,508 230,516" fill="#FDE68A"/>
  <line x1="660" y1="480" x2="660" y2="510" stroke="#FDE68A" stroke-width="1.5" stroke-dasharray="4,3"/>
  <polygon points="655,508 665,508 660,516" fill="#FDE68A"/>

  <!-- Footer -->
  <text x="450" y="608" text-anchor="middle" font-size="10" fill="#C0C0C0">BWT Akatsuki · TRAE AI IDE Hackathon · github.com/Loknath816/BWT_Akatsuki</text>
</svg>
rself*

</div>


