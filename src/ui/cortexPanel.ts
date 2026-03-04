import * as vscode from 'vscode';
import * as path from 'path';

type MessageHandler = (message: any) => void;

export class CortexPanel {
  public static currentPanel: CortexPanel | undefined;
  private static _messageHandler: MessageHandler | undefined;

  private readonly _panel: vscode.WebviewPanel;
  private readonly _context: vscode.ExtensionContext;
  private _disposables: vscode.Disposable[] = [];

  public static createOrShow(context: vscode.ExtensionContext) {
    const column = vscode.ViewColumn.Beside;
    if (CortexPanel.currentPanel) {
      CortexPanel.currentPanel._panel.reveal(column);
      return;
    }
    const panel = vscode.window.createWebviewPanel(
      'cortexAI',
      'Cortex AI',
      column,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
          vscode.Uri.joinPath(context.extensionUri, 'media')
        ]
      }
    );
    CortexPanel.currentPanel = new CortexPanel(panel, context);
  }

  public static postMessage(message: any) {
    CortexPanel.currentPanel?._panel.webview.postMessage(message);
  }

  public static onMessage(handler: MessageHandler) {
    CortexPanel._messageHandler = handler;
  }

  private constructor(panel: vscode.WebviewPanel, context: vscode.ExtensionContext) {
    this._panel = panel;
    this._context = context;
    this._panel.webview.html = this._getHtml();
    this._panel.iconPath = vscode.Uri.joinPath(context.extensionUri, 'media', 'icon.png');

    this._panel.webview.onDidReceiveMessage(
      (message) => CortexPanel._messageHandler?.(message),
      null,
      this._disposables
    );

    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
  }

  public dispose() {
    CortexPanel.currentPanel = undefined;
    this._panel.dispose();
    while (this._disposables.length) {
      const d = this._disposables.pop();
      if (d) { d.dispose(); }
    }
  }

  private _getHtml(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Cortex AI</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;600;700&family=Orbitron:wght@700;900&display=swap');

  :root {
    --bg: #080C16;
    --surface: #0D1420;
    --surface2: #111827;
    --border: rgba(0,212,255,0.12);
    --cyan: #00D4FF;
    --orange: #FF6B35;
    --purple: #A855F7;
    --green: #00FF94;
    --amber: #F59E0B;
    --red: #EF4444;
    --text: #C8D8E8;
    --muted: #4A6080;
    --font: 'IBM Plex Mono', 'Courier New', monospace;
    --font-display: 'Orbitron', monospace;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    background: var(--bg);
    color: var(--text);
    font-family: var(--font);
    font-size: 12px;
    min-height: 100vh;
    overflow-x: hidden;
  }

  /* Grid background */
  body::before {
    content: '';
    position: fixed;
    inset: 0;
    background-image:
      linear-gradient(rgba(0,212,255,0.025) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0,212,255,0.025) 1px, transparent 1px);
    background-size: 32px 32px;
    pointer-events: none;
    z-index: 0;
  }

  /* ── HEADER ── */
  .header {
    position: sticky;
    top: 0;
    z-index: 100;
    background: rgba(8,12,22,0.95);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--border);
    padding: 12px 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .logo {
    font-family: var(--font-display);
    font-size: 16px;
    font-weight: 900;
    color: var(--cyan);
    letter-spacing: 2px;
    text-shadow: 0 0 20px rgba(0,212,255,0.4);
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .logo-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--green);
    animation: pulse 2s ease-in-out infinite;
  }

  .header-meta {
    font-size: 9px;
    color: var(--muted);
    letter-spacing: 2px;
    text-transform: uppercase;
  }

  /* ── TABS ── */
  .tabs {
    display: flex;
    border-bottom: 1px solid var(--border);
    background: var(--surface);
    position: sticky;
    top: 53px;
    z-index: 99;
  }

  .tab {
    flex: 1;
    padding: 10px 4px;
    text-align: center;
    cursor: pointer;
    font-size: 9px;
    letter-spacing: 1.5px;
    color: var(--muted);
    border-bottom: 2px solid transparent;
    transition: all 0.2s;
    text-transform: uppercase;
    font-weight: 600;
    user-select: none;
  }

  .tab:hover { color: var(--text); background: rgba(0,212,255,0.03); }

  .tab.active {
    color: var(--cyan);
    border-bottom-color: var(--cyan);
    background: rgba(0,212,255,0.05);
  }

  .tab-icon { font-size: 14px; display: block; margin-bottom: 2px; }

  /* ── CONTENT ── */
  .content {
    position: relative;
    z-index: 1;
    padding: 16px;
  }

  .panel { display: none; }
  .panel.active { display: block; animation: fadeSlideUp 0.3s ease both; }

  /* ── CARDS ── */
  .card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 16px;
    margin-bottom: 12px;
  }

  .card-header {
    font-size: 9px;
    letter-spacing: 2px;
    text-transform: uppercase;
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .card-header::after {
    content: '';
    flex: 1;
    height: 1px;
    background: var(--border);
  }

  /* ── BUTTONS ── */
  .btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    border-radius: 6px;
    font-family: var(--font);
    font-size: 11px;
    font-weight: 600;
    cursor: pointer;
    border: none;
    letter-spacing: 1px;
    transition: all 0.2s;
  }

  .btn:active { transform: scale(0.97); }

  .btn-primary {
    background: linear-gradient(135deg, var(--cyan), #0088CC);
    color: #000;
    box-shadow: 0 0 20px rgba(0,212,255,0.25);
  }

  .btn-primary:hover { box-shadow: 0 0 30px rgba(0,212,255,0.4); }

  .btn-secondary {
    background: rgba(0,212,255,0.06);
    color: var(--cyan);
    border: 1px solid rgba(0,212,255,0.2);
  }

  .btn-secondary:hover { background: rgba(0,212,255,0.12); }

  .btn-orange {
    background: linear-gradient(135deg, var(--orange), #CC4400);
    color: white;
    box-shadow: 0 0 20px rgba(255,107,53,0.25);
  }

  .btn-purple {
    background: linear-gradient(135deg, var(--purple), #7C3AED);
    color: white;
    box-shadow: 0 0 20px rgba(168,85,247,0.25);
  }

  .btn-green {
    background: linear-gradient(135deg, var(--green), #00AA66);
    color: #000;
    box-shadow: 0 0 20px rgba(0,255,148,0.25);
  }

  .btn-row { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 12px; }

  /* ── INPUTS ── */
  .input, textarea.input {
    width: 100%;
    background: rgba(0,0,0,0.3);
    border: 1px solid var(--border);
    border-radius: 6px;
    color: var(--text);
    font-family: var(--font);
    font-size: 12px;
    padding: 10px 12px;
    outline: none;
    resize: vertical;
    transition: border-color 0.2s;
  }

  .input:focus, textarea.input:focus {
    border-color: rgba(0,212,255,0.4);
    box-shadow: 0 0 0 2px rgba(0,212,255,0.08);
  }

  select.input { cursor: pointer; }

  /* ── LOADING ── */
  .loading {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 14px;
    background: rgba(0,212,255,0.04);
    border: 1px solid rgba(0,212,255,0.1);
    border-radius: 8px;
    margin-bottom: 12px;
  }

  .loading-dots span {
    display: inline-block;
    width: 5px; height: 5px;
    border-radius: 50%;
    background: var(--cyan);
    animation: dotPulse 1.2s ease-in-out infinite;
  }

  .loading-dots span:nth-child(2) { animation-delay: 0.2s; }
  .loading-dots span:nth-child(3) { animation-delay: 0.4s; }

  /* ── BRIEFING ── */
  .briefing-summary {
    font-size: 13px;
    line-height: 1.7;
    color: #E2F4FF;
    margin-bottom: 14px;
    padding: 14px;
    background: rgba(0,212,255,0.04);
    border-left: 3px solid var(--cyan);
    border-radius: 0 6px 6px 0;
  }

  .info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    margin-bottom: 14px;
  }

  .info-item {
    background: rgba(0,0,0,0.2);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 10px;
  }

  .info-label { font-size: 9px; color: var(--muted); letter-spacing: 1.5px; margin-bottom: 4px; text-transform: uppercase; }
  .info-value { font-size: 11px; color: var(--text); font-weight: 600; }

  /* ── STEPS ── */
  .step-item {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    padding: 10px;
    border-radius: 6px;
    margin-bottom: 6px;
    background: rgba(0,0,0,0.2);
    border: 1px solid var(--border);
  }

  .step-num {
    width: 22px; height: 22px;
    border-radius: 5px;
    display: flex; align-items: center; justify-content: center;
    font-size: 10px; font-weight: 700;
    flex-shrink: 0;
  }

  .step-body { flex: 1; }
  .step-action { font-size: 11px; color: var(--text); margin-bottom: 2px; }
  .step-effort { font-size: 9px; color: var(--muted); }

  /* ── EXPLANATION ── */
  .explain-section { margin-bottom: 14px; }
  .explain-title { font-size: 10px; color: var(--cyan); letter-spacing: 1.5px; margin-bottom: 8px; text-transform: uppercase; }

  .how-it-works-item {
    display: flex; gap: 10px; margin-bottom: 8px; align-items: flex-start;
  }

  .how-num {
    width: 20px; height: 20px; border-radius: 50%;
    background: rgba(0,212,255,0.1); border: 1px solid rgba(0,212,255,0.3);
    display: flex; align-items: center; justify-content: center;
    font-size: 9px; color: var(--cyan); font-weight: 700; flex-shrink: 0;
  }

  .tag {
    display: inline-block;
    font-size: 9px;
    padding: 2px 8px;
    border-radius: 4px;
    margin: 2px;
    font-weight: 600;
  }

  .issue-item {
    padding: 10px;
    border-radius: 6px;
    margin-bottom: 6px;
    border-left: 3px solid transparent;
  }

  .issue-item.high { background: rgba(239,68,68,0.05); border-left-color: var(--red); }
  .issue-item.medium { background: rgba(245,158,11,0.05); border-left-color: var(--amber); }
  .issue-item.low { background: rgba(34,197,94,0.05); border-left-color: var(--green); }

  .severity-badge {
    font-size: 8px; font-weight: 700; letter-spacing: 1px;
    padding: 1px 6px; border-radius: 3px; text-transform: uppercase; margin-right: 6px;
  }

  /* ── CODE BLOCK ── */
  .code-block {
    background: rgba(0,0,0,0.4);
    border: 1px solid var(--border);
    border-radius: 8px;
    overflow: hidden;
    margin-bottom: 12px;
  }

  .code-header {
    display: flex; justify-content: space-between; align-items: center;
    padding: 8px 14px;
    background: rgba(0,0,0,0.3);
    border-bottom: 1px solid var(--border);
    font-size: 9px; color: var(--muted);
  }

  .code-actions { display: flex; gap: 6px; }
  .code-btn {
    background: rgba(0,212,255,0.06); border: 1px solid rgba(0,212,255,0.15);
    color: var(--cyan); font-family: var(--font); font-size: 9px;
    padding: 3px 10px; border-radius: 4px; cursor: pointer; letter-spacing: 1px;
  }
  .code-btn:hover { background: rgba(0,212,255,0.12); }

  pre {
    padding: 14px;
    overflow-x: auto;
    font-size: 11px;
    line-height: 1.6;
    color: #A8C8E8;
    white-space: pre-wrap;
    word-break: break-word;
  }

  /* ── VOICE ── */
  .voice-orb {
    width: 100px; height: 100px; border-radius: 50%;
    background: radial-gradient(circle, rgba(168,85,247,0.3), rgba(168,85,247,0.05));
    border: 2px solid rgba(168,85,247,0.4);
    display: flex; align-items: center; justify-content: center;
    margin: 20px auto;
    cursor: pointer;
    font-size: 36px;
    transition: all 0.3s;
    position: relative;
  }

  .voice-orb:hover {
    box-shadow: 0 0 40px rgba(168,85,247,0.3);
    transform: scale(1.05);
  }

  .voice-orb.listening {
    animation: voicePulse 1.5s ease-in-out infinite;
    border-color: var(--purple);
    box-shadow: 0 0 40px rgba(168,85,247,0.5);
  }

  .voice-chat {
    max-height: 300px;
    overflow-y: auto;
    padding: 4px;
  }

  .voice-message {
    padding: 10px 14px;
    border-radius: 8px;
    margin-bottom: 8px;
    font-size: 12px;
    line-height: 1.6;
    animation: fadeSlideUp 0.3s ease;
  }

  .voice-message.user {
    background: rgba(168,85,247,0.1);
    border: 1px solid rgba(168,85,247,0.2);
    text-align: right;
    color: #D8B8F8;
  }

  .voice-message.ai {
    background: rgba(0,212,255,0.05);
    border: 1px solid rgba(0,212,255,0.12);
    color: var(--text);
  }

  .voice-status {
    text-align: center;
    font-size: 11px;
    color: var(--muted);
    margin-bottom: 12px;
    letter-spacing: 1px;
  }

  /* ── SETUP ── */
  .setup-card {
    background: rgba(245,158,11,0.05);
    border: 1px solid rgba(245,158,11,0.2);
    border-radius: 10px;
    padding: 20px;
    text-align: center;
    margin-bottom: 16px;
  }

  .setup-icon { font-size: 32px; margin-bottom: 10px; }
  .setup-title { font-size: 14px; font-weight: 700; color: var(--amber); margin-bottom: 6px; }
  .setup-desc { font-size: 11px; color: var(--muted); margin-bottom: 14px; line-height: 1.6; }

  /* ── RADIAL SCORE ── */
  .scores-row { display: flex; justify-content: space-around; margin: 14px 0; }
  .score-item { text-align: center; }
  .score-label { font-size: 9px; color: var(--muted); letter-spacing: 1px; margin-top: 4px; text-transform: uppercase; }

  /* ── FILE LIST ── */
  .file-item {
    display: flex; align-items: center; gap: 8px;
    padding: 6px 10px; border-radius: 5px;
    margin-bottom: 4px; background: rgba(0,0,0,0.2);
    border: 1px solid var(--border);
    font-size: 11px;
  }

  .file-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
  .file-name { flex: 1; color: var(--text); }
  .file-changes { font-size: 9px; color: var(--muted); }

  /* ── DIVIDER ── */
  .divider { height: 1px; background: var(--border); margin: 14px 0; }

  /* ── ANIMATIONS ── */
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
  @keyframes dotPulse { 0%,80%,100%{transform:scale(0.6);opacity:0.5} 40%{transform:scale(1);opacity:1} }
  @keyframes fadeSlideUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  @keyframes voicePulse { 0%,100%{box-shadow:0 0 20px rgba(168,85,247,0.4)} 50%{box-shadow:0 0 60px rgba(168,85,247,0.8)} }
  @keyframes spin { to{transform:rotate(360deg)} }

  /* ── EMPTY STATE ── */
  .empty-state {
    text-align: center;
    padding: 40px 20px;
    color: var(--muted);
  }

  .empty-icon { font-size: 40px; margin-bottom: 12px; opacity: 0.4; }
  .empty-text { font-size: 12px; line-height: 1.6; }

  /* ── SCROLLBAR ── */
  ::-webkit-scrollbar { width: 3px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(0,212,255,0.15); border-radius: 2px; }

  /* ── CONFIDENCE BAR ── */
  .confidence-bar {
    height: 3px;
    background: rgba(0,212,255,0.1);
    border-radius: 2px;
    overflow: hidden;
    margin-top: 6px;
  }

  .confidence-fill {
    height: 100%;
    border-radius: 2px;
    background: linear-gradient(90deg, var(--cyan), var(--purple));
    transition: width 1s cubic-bezier(0.4,0,0.2,1);
  }

  .complexity-badge {
    display: inline-block;
    font-size: 9px; font-weight: 700; letter-spacing: 1px;
    padding: 2px 8px; border-radius: 4px; text-transform: uppercase;
  }
  .complexity-low { background: rgba(0,255,148,0.1); color: var(--green); border: 1px solid rgba(0,255,148,0.2); }
  .complexity-medium { background: rgba(245,158,11,0.1); color: var(--amber); border: 1px solid rgba(245,158,11,0.2); }
  .complexity-high { background: rgba(239,68,68,0.1); color: var(--red); border: 1px solid rgba(239,68,68,0.2); }

  .placeholder-hint {
    font-size: 9px; color: var(--muted);
    letter-spacing: 1px; margin-top: 6px;
    text-align: center;
  }
</style>
</head>
<body>

<!-- HEADER -->
<div class="header">
  <div class="logo">
    <div class="logo-dot"></div>
    CORTEX
    <span style="color: var(--orange); font-size:12px;">AI</span>
  </div>
  <div class="header-meta">// FOCUS ENGINE v1.0</div>
</div>

<!-- TABS -->
<div class="tabs">
  <div class="tab active" onclick="switchTab('context')" id="tab-context">
    <span class="tab-icon">⟳</span>CONTEXT
  </div>
  <div class="tab" onclick="switchTab('explain')" id="tab-explain">
    <span class="tab-icon">◈</span>EXPLAIN
  </div>
  <div class="tab" onclick="switchTab('boilerplate')" id="tab-boilerplate">
    <span class="tab-icon">⬡</span>BOILER
  </div>
  <div class="tab" onclick="switchTab('voice')" id="tab-voice">
    <span class="tab-icon">◎</span>VOICE
  </div>
  <div class="tab" onclick="switchTab('setup')" id="tab-setup">
    <span class="tab-icon">⚙</span>SETUP
  </div>
</div>

<!-- CONTENT -->
<div class="content">

  <!-- ── CONTEXT RECOVERY PANEL ── -->
  <div class="panel active" id="panel-context">
    <div id="context-loading" style="display:none">
      <div class="loading">
        <div class="loading-dots"><span></span><span></span><span></span></div>
        <span style="color:var(--muted)" id="context-loading-text">Analyzing your last session...</span>
      </div>
    </div>

    <div id="context-result" style="display:none"></div>

    <div id="context-empty">
      <div class="card">
        <div class="card-header" style="color:var(--cyan)">◈ CONTEXT RECOVERY</div>
        <div style="font-size:12px;color:var(--muted);line-height:1.7;margin-bottom:14px">
          Instantly understand where you left off. Cortex reads your recent files, git history and open tabs to rebuild your mental context in seconds.
        </div>
        <div class="btn-row">
          <button class="btn btn-primary" onclick="recoverContext()">⟳ Recover My Context</button>
        </div>
        <p class="placeholder-hint" style="margin-top:10px">Shortcut: Ctrl+Shift+R</p>
      </div>

      <div class="card" style="border-color:rgba(255,107,53,0.15)">
        <div class="card-header" style="color:var(--orange)">◇ WHAT YOU GET</div>
        <div style="display:flex;flex-direction:column;gap:8px">
          ${['📍 Exactly where you stopped', '🧠 What you were building', '⚡ Your next 3 actions', '🐛 Any bugs in recent code', '📂 Recently touched files'].map(item => `
          <div style="display:flex;gap:8px;align-items:center;font-size:11px;color:var(--muted)">
            <span>${item}</span>
          </div>`).join('')}
        </div>
      </div>
    </div>
  </div>

  <!-- ── CODE EXPLAIN PANEL ── -->
  <div class="panel" id="panel-explain">
    <div id="explain-loading" style="display:none">
      <div class="loading">
        <div class="loading-dots"><span></span><span></span><span></span></div>
        <span style="color:var(--muted)">Reading the code structure...</span>
      </div>
    </div>

    <div id="explain-result" style="display:none"></div>

    <div id="explain-empty">
      <div class="card">
        <div class="card-header" style="color:var(--green)">◈ CODE EXPLAINER</div>
        <div style="font-size:12px;color:var(--muted);line-height:1.7;margin-bottom:14px">
          Select any code in your editor — a function, a class, or an entire file — and Cortex will explain what it does, why it exists, and potential issues.
        </div>
        <div class="btn-row">
          <button class="btn btn-green" onclick="explainCode()">◈ Explain Selected Code</button>
        </div>
        <p class="placeholder-hint" style="margin-top:10px">Select code first, then click. Shortcut: Ctrl+Shift+E</p>
      </div>

      <div class="card" style="border-color:rgba(0,255,148,0.1)">
        <div class="card-header" style="color:var(--green)">◇ INTELLIGENCE LAYERS</div>
        <div style="display:flex;flex-direction:column;gap:8px">
          ${['🔍 Purpose — WHY this code exists', '⚙️ How it works — step by step', '⚠️ Potential bugs & issues', '🧩 Dependencies & concepts', '📊 Complexity assessment'].map(item => `
          <div style="font-size:11px;color:var(--muted)">${item}</div>`).join('')}
        </div>
      </div>
    </div>
  </div>

  <!-- ── BOILERPLATE PANEL ── -->
  <div class="panel" id="panel-boilerplate">
    <div id="boilerplate-loading" style="display:none">
      <div class="loading">
        <div class="loading-dots"><span></span><span></span><span></span></div>
        <span style="color:var(--muted)">Analyzing your codebase style...</span>
      </div>
    </div>

    <div class="card">
      <div class="card-header" style="color:var(--amber)">⬡ SMART BOILERPLATE</div>
      <div style="margin-bottom:10px">
        <label style="font-size:9px;color:var(--muted);letter-spacing:1px;display:block;margin-bottom:6px">DESCRIBE WHAT YOU NEED</label>
        <textarea class="input" id="boilerplate-prompt" rows="3"
          placeholder="e.g. REST API endpoint for user authentication with JWT&#10;e.g. React component with useState and useEffect&#10;e.g. Database model for products table"></textarea>
      </div>
      <div style="margin-bottom:12px">
        <label style="font-size:9px;color:var(--muted);letter-spacing:1px;display:block;margin-bottom:6px">LANGUAGE</label>
        <select class="input" id="boilerplate-language">
          <option value="typescript">TypeScript</option>
          <option value="javascript">JavaScript</option>
          <option value="python">Python</option>
          <option value="java">Java</option>
          <option value="go">Go</option>
          <option value="rust">Rust</option>
          <option value="cpp">C++</option>
        </select>
      </div>
      <div class="btn-row">
        <button class="btn btn-orange" onclick="generateBoilerplate()">⬡ Generate Code</button>
      </div>
    </div>

    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px">
      <span style="font-size:9px;color:var(--muted);letter-spacing:1px;margin-right:4px;align-self:center">QUICK:</span>
      ${['REST endpoint', 'Auth middleware', 'DB model', 'React hook', 'Error handler', 'Unit test'].map(q => `
      <button onclick="quickBoilerplate('${q}')"
        style="background:rgba(245,158,11,0.06);border:1px solid rgba(245,158,11,0.15);color:var(--amber);
               font-family:var(--font);font-size:9px;padding:4px 10px;border-radius:4px;cursor:pointer;letter-spacing:1px">
        ${q}
      </button>`).join('')}
    </div>

    <div id="boilerplate-result" style="display:none"></div>
  </div>

  <!-- ── VOICE PANEL ── -->
  <div class="panel" id="panel-voice">
    <div class="card" style="border-color:rgba(168,85,247,0.2);text-align:center">
      <div class="card-header" style="color:var(--purple)">◎ VOICE ASSISTANT</div>

      <div class="voice-orb" id="voice-orb" onclick="toggleVoice()">🎙️</div>

      <div class="voice-status" id="voice-status">Click orb to speak — ask anything about your code</div>

      <div style="display:flex;gap:8px;justify-content:center;margin-bottom:14px">
        <button class="btn btn-purple" onclick="toggleVoice()" id="voice-btn">🎙️ Start Listening</button>
        <button class="btn btn-secondary" onclick="stopSpeaking()">⬛ Stop</button>
      </div>

      <div style="font-size:9px;color:var(--muted);margin-bottom:14px">
        EXAMPLE QUESTIONS
      </div>
      <div style="display:flex;flex-direction:column;gap:6px">
        ${['"Where is the authentication logic?"','"What does the payment module do?"','"Explain the database connection"','"What should I work on next?"'].map(q => `
        <div onclick="askVoiceQuestion(${q})"
          style="padding:7px 12px;background:rgba(168,85,247,0.05);border:1px solid rgba(168,85,247,0.15);
                 border-radius:6px;cursor:pointer;font-size:11px;color:var(--muted);text-align:left;transition:all 0.2s"
          onmouseover="this.style.borderColor='rgba(168,85,247,0.4)'"
          onmouseout="this.style.borderColor='rgba(168,85,247,0.15)'">
          ${q}
        </div>`).join('')}
      </div>
    </div>

    <div class="card" id="voice-conversation" style="display:none">
      <div class="card-header" style="color:var(--purple)">◎ CONVERSATION</div>
      <div class="voice-chat" id="voice-chat"></div>
    </div>
  </div>

  <!-- ── SETUP PANEL ── -->
  <div class="panel" id="panel-setup">
    <div class="card" id="api-setup-card">
      <div class="card-header" style="color:var(--amber)">⚙ API CONFIGURATION</div>

      <div id="api-key-missing" style="display:none">
        <div class="setup-card">
          <div class="setup-icon">🔑</div>
          <div class="setup-title">API Key Required</div>
          <div class="setup-desc">Add your Anthropic API key to enable all Cortex AI features.</div>
        </div>
      </div>

      <div id="api-key-ok" style="display:none">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;padding:10px;background:rgba(0,255,148,0.05);border:1px solid rgba(0,255,148,0.15);border-radius:6px">
          <span>✅</span>
          <span style="font-size:11px;color:var(--green)">API key configured. All features active.</span>
        </div>
      </div>

      <div style="margin-bottom:12px">
        <label style="font-size:9px;color:var(--muted);letter-spacing:1px;display:block;margin-bottom:6px">ANTHROPIC API KEY</label>
        <input type="password" class="input" id="api-key-input" placeholder="sk-ant-..." style="letter-spacing:2px"/>
      </div>
      <div class="btn-row">
        <button class="btn btn-primary" onclick="saveApiKey()">💾 Save Key</button>
      </div>
      <div style="margin-top:10px;font-size:9px;color:var(--muted);line-height:1.6">
        Get your key at console.anthropic.com → API Keys → Create Key<br/>
        Key is stored securely in VS Code settings.
      </div>
    </div>

    <div class="card">
      <div class="card-header" style="color:var(--cyan)">◈ KEYBOARD SHORTCUTS</div>
      <div style="display:flex;flex-direction:column;gap:8px">
        ${[
          ['Ctrl+Shift+A', 'Open Cortex Panel'],
          ['Ctrl+Shift+R', 'Recover Context'],
          ['Ctrl+Shift+E', 'Explain Selected Code'],
          ['Ctrl+Shift+B', 'Generate Boilerplate'],
        ].map(([key, desc]) => `
        <div style="display:flex;justify-content:space-between;align-items:center;font-size:11px">
          <span style="background:rgba(0,212,255,0.06);border:1px solid rgba(0,212,255,0.15);color:var(--cyan);padding:2px 8px;border-radius:4px;font-size:9px;letter-spacing:1px">${key}</span>
          <span style="color:var(--muted)">${desc}</span>
        </div>`).join('')}
      </div>
    </div>
  </div>

</div>

<script>
  const vscode = acquireVsCodeApi();
  let currentTab = 'context';
  let isListening = false;
  let recognition = null;
  let synth = window.speechSynthesis;

  // ── TAB SWITCHING ──────────────────────────────────────────────────────────
  function switchTab(tab) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    document.getElementById('tab-' + tab).classList.add('active');
    document.getElementById('panel-' + tab).classList.add('active');
    currentTab = tab;
  }

  // ── FEATURE ACTIONS ────────────────────────────────────────────────────────
  function recoverContext() {
    vscode.postMessage({ type: 'recoverContext' });
  }

  function explainCode() {
    vscode.postMessage({ type: 'explainCode' });
  }

  function generateBoilerplate() {
    const prompt = document.getElementById('boilerplate-prompt').value.trim();
    const language = document.getElementById('boilerplate-language').value;
    if (!prompt) {
      document.getElementById('boilerplate-prompt').style.borderColor = 'rgba(239,68,68,0.4)';
      setTimeout(() => document.getElementById('boilerplate-prompt').style.borderColor = '', 1500);
      return;
    }
    showLoading('boilerplate', 'Analyzing your codebase style and generating code...');
    vscode.postMessage({ type: 'generateBoilerplate', prompt, language });
  }

  function quickBoilerplate(type) {
    document.getElementById('boilerplate-prompt').value = type;
    generateBoilerplate();
  }

  function saveApiKey() {
    const key = document.getElementById('api-key-input').value.trim();
    if (!key) return;
    vscode.postMessage({ type: 'saveApiKey', key });
    document.getElementById('api-key-input').value = '';
  }

  function insertCode(code) { vscode.postMessage({ type: 'insertCode', code }); }
  function copyCode(code) { vscode.postMessage({ type: 'copyCode', code }); }

  // ── LOADING STATE ──────────────────────────────────────────────────────────
  function showLoading(feature, message) {
    const loadingEl = document.getElementById(feature + '-loading');
    const resultEl = document.getElementById(feature + '-result');
    const emptyEl = document.getElementById(feature + '-empty');

    if (loadingEl) { loadingEl.style.display = 'block'; }
    if (resultEl) { resultEl.style.display = 'none'; }
    if (emptyEl) { emptyEl.style.display = 'none'; }

    const textEl = document.getElementById(feature + '-loading-text');
    if (textEl && message) { textEl.textContent = message; }
  }

  function hideLoading(feature) {
    const loadingEl = document.getElementById(feature + '-loading');
    if (loadingEl) { loadingEl.style.display = 'none'; }
  }

  // ── RENDER CONTEXT BRIEFING ────────────────────────────────────────────────
  function renderContextBriefing(data) {
    hideLoading('context');
    const resultEl = document.getElementById('context-result');
    resultEl.style.display = 'block';

    const stepColors = ['var(--cyan)', 'var(--orange)', 'var(--purple)'];

    resultEl.innerHTML = \`
      <div class="card">
        <div class="card-header" style="color:var(--cyan)">⟳ WAKE-UP BRIEFING
          <span style="font-size:9px;color:var(--muted);margin-left:auto">\${data.sessionGap || ''}</span>
        </div>
        <div class="briefing-summary">\${data.summary || 'Context analyzed.'}</div>
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">Last Active File</div>
            <div class="info-value" style="color:var(--cyan)">\${data.lastActiveFile || '—'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Confidence</div>
            <div class="info-value">\${data.confidence || 0}%</div>
            <div class="confidence-bar"><div class="confidence-fill" style="width:\${data.confidence || 0}%"></div></div>
          </div>
        </div>
        <div class="info-item" style="margin-bottom:12px">
          <div class="info-label">Where You Stopped</div>
          <div class="info-value" style="color:var(--orange);margin-top:4px">\${data.whereYouStopped || '—'}</div>
        </div>
      </div>

      <div class="card">
        <div class="card-header" style="color:var(--green)">⚡ NEXT ACTIONS</div>
        \${(data.nextSteps || []).map((step, i) => \`
        <div class="step-item">
          <div class="step-num" style="background:\${stepColors[i] + '22'};border:1px solid \${stepColors[i] + '44'};color:\${stepColors[i]}">\${step.priority}</div>
          <div class="step-body">
            <div class="step-action">\${step.action}</div>
            <div class="step-effort">~\${step.effort}</div>
          </div>
        </div>\`).join('')}
      </div>

      \${data.recentFiles && data.recentFiles.length ? \`
      <div class="card">
        <div class="card-header" style="color:var(--amber)">📂 RECENT FILES</div>
        \${data.recentFiles.slice(0, 5).map(f => \`
        <div class="file-item">
          <div class="file-dot" style="background:\${f.status === 'modified' ? 'var(--amber)' : 'var(--muted)'}"></div>
          <div class="file-name">\${f.name}</div>
          <div class="file-changes">\${f.changes ? f.changes + ' changes' : f.status}</div>
        </div>\`).join('')}
      </div>\` : ''}

      <div class="btn-row">
        <button class="btn btn-secondary" onclick="recoverContext()">⟳ Refresh</button>
      </div>
    \`;
  }

  // ── RENDER CODE EXPLANATION ────────────────────────────────────────────────
  function renderCodeExplanation(data) {
    hideLoading('explain');
    const resultEl = document.getElementById('explain-result');
    resultEl.style.display = 'block';

    resultEl.innerHTML = \`
      <div class="card">
        <div class="card-header" style="color:var(--green)">◈ EXPLANATION
          <span class="complexity-badge complexity-\${data.complexity || 'medium'}" style="margin-left:auto">\${data.complexity || 'medium'} complexity</span>
        </div>

        <div class="explain-section">
          <div class="briefing-summary">\${data.summary || ''}</div>
        </div>

        <div class="explain-section">
          <div class="explain-title">◇ PURPOSE</div>
          <div style="font-size:12px;color:var(--muted);line-height:1.7">\${data.purpose || ''}</div>
        </div>

        \${data.howItWorks && data.howItWorks.length ? \`
        <div class="explain-section">
          <div class="explain-title">⚙ HOW IT WORKS</div>
          \${data.howItWorks.map(step => \`
          <div class="how-it-works-item">
            <div class="how-num">\${step.step}</div>
            <div style="font-size:12px;color:var(--muted);line-height:1.6">\${step.description}</div>
          </div>\`).join('')}
        </div>\` : ''}

        \${data.potentialIssues && data.potentialIssues.length ? \`
        <div class="explain-section">
          <div class="explain-title">⚠ POTENTIAL ISSUES</div>
          \${data.potentialIssues.map(issue => \`
          <div class="issue-item \${issue.severity}">
            <span class="severity-badge" style="background:\${issue.severity === 'high' ? 'rgba(239,68,68,0.15)' : issue.severity === 'medium' ? 'rgba(245,158,11,0.15)' : 'rgba(34,197,94,0.15)'};color:\${issue.severity === 'high' ? 'var(--red)' : issue.severity === 'medium' ? 'var(--amber)' : 'var(--green)'}">\${issue.severity}</span>
            \${issue.issue}
            \${issue.suggestion ? \`<div style="font-size:10px;color:var(--green);margin-top:4px">→ \${issue.suggestion}</div>\` : ''}
          </div>\`).join('')}
        </div>\` : ''}

        \${data.dependencies && data.dependencies.length ? \`
        <div class="explain-section">
          <div class="explain-title">🧩 DEPENDENCIES & CONCEPTS</div>
          <div>\${data.dependencies.map(d => \`<span class="tag" style="background:rgba(0,212,255,0.07);border:1px solid rgba(0,212,255,0.15);color:var(--cyan)">\${d}</span>\`).join('')}</div>
        </div>\` : ''}
      </div>

      <div class="btn-row">
        <button class="btn btn-secondary" onclick="explainCode()">◈ Explain Again</button>
      </div>
    \`;
  }

  // ── RENDER BOILERPLATE ─────────────────────────────────────────────────────
function renderBoilerplate(data) {
    hideLoading('boilerplate');
    const resultEl = document.getElementById('boilerplate-result');
    resultEl.style.display = 'block';

    window._lastCode = data.code;
    const safeCode = data.code.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

    resultEl.innerHTML =
      '<div class="card" style="border-color:rgba(245,158,11,0.2)">' +
      '<div class="card-header" style="color:var(--amber)">⬡ GENERATED — ' + (data.fileName || 'code') + '</div>' +
      '<div style="font-size:11px;color:var(--muted);margin-bottom:12px">' + (data.description || '') + '</div>' +
      '<div class="code-block">' +
      '<div class="code-header"><span>' + (data.language || 'code') + '</span>' +
      '<div class="code-actions">' +
      '<button class="code-btn" onclick="insertCode(window._lastCode)">↙ Insert</button>' +
      '<button class="code-btn" onclick="copyCode(window._lastCode)">⎘ Copy</button>' +
      '</div></div>' +
      '<pre>' + safeCode + '</pre>' +
      '</div>' +
      '<div style="font-size:9px;color:var(--muted)">Insert at: ' + (data.insertionPoint || 'cursor position') + '</div>' +
      '</div>';

    // dummy to replace the old opening backtick - delete the next line and the old closing backtick below
    var _unused = \`
      <div class="card" style="border-color:rgba(245,158,11,0.2)">
        <div class="card-header" style="color:var(--amber)">⬡ GENERATED — \${data.fileName || 'code'}</div>
        <div style="font-size:11px;color:var(--muted);margin-bottom:12px">\${data.description || ''}</div>
        <div class="code-block">
          <div class="code-header">
            <span>\${data.language || 'code'}</span>
            <div class="code-actions">
              <button class="code-btn" onclick="insertCode(window._lastCode)">↙ Insert</button>
              <button class="code-btn" onclick="copyCode(window._lastCode)">⎘ Copy</button>
            </div>
          </div>
          <pre>\${escapeHtml(data.code)}</pre>
        </div>
        <div style="font-size:9px;color:var(--muted)">Insert at: \${data.insertionPoint || 'cursor position'}</div>
      </div>
    \`;

    window._lastCode = data.code;
  }

  // ── VOICE ──────────────────────────────────────────────────────────────────
  function toggleVoice() {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }

  function startListening() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      updateVoiceStatus('❌ Speech recognition not supported in this environment');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      isListening = true;
      document.getElementById('voice-orb').classList.add('listening');
      document.getElementById('voice-btn').textContent = '⬛ Stop';
      updateVoiceStatus('🎙️ Listening...');
    };

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map(r => r[0].transcript).join('');
      updateVoiceStatus('Heard: "' + transcript + '"');

      if (event.results[0].isFinal) {
        stopListening();
        processVoiceQuery(transcript);
      }
    };

    recognition.onerror = (event) => {
      stopListening();
      updateVoiceStatus('Error: ' + event.error + '. Try clicking again.');
    };

    recognition.onend = () => stopListening();

    recognition.start();
  }

  function stopListening() {
    isListening = false;
    if (recognition) { recognition.stop(); recognition = null; }
    document.getElementById('voice-orb').classList.remove('listening');
    document.getElementById('voice-btn').textContent = '🎙️ Start Listening';
    updateVoiceStatus('Click orb to speak — ask anything about your code');
  }

  function stopSpeaking() {
    if (synth.speaking) { synth.cancel(); }
    stopListening();
  }

  function askVoiceQuestion(q) {
    processVoiceQuery(q);
  }

  function processVoiceQuery(query) {
    addVoiceMessage(query, 'user');
    updateVoiceStatus('⟳ Cortex is thinking...');
    vscode.postMessage({ type: 'voiceQuery', query });
  }

  function addVoiceMessage(text, role) {
    const chatEl = document.getElementById('voice-chat');
    const conversationEl = document.getElementById('voice-conversation');
    conversationEl.style.display = 'block';

    const msg = document.createElement('div');
    msg.className = 'voice-message ' + role;
    msg.textContent = text;
    chatEl.appendChild(msg);
    chatEl.scrollTop = chatEl.scrollHeight;
  }

  function updateVoiceStatus(text) {
    document.getElementById('voice-status').textContent = text;
  }

  function speakText(text) {
    if (!synth) { return; }
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.volume = 0.9;
    synth.speak(utterance);
  }

  // ── ERROR DISPLAY ──────────────────────────────────────────────────────────
  function showError(feature, message) {
    hideLoading(feature);
    const resultEl = document.getElementById(feature + '-result');
    if (resultEl) {
      resultEl.style.display = 'block';
      resultEl.innerHTML = \`
        <div class="card" style="border-color:rgba(239,68,68,0.2)">
          <div class="card-header" style="color:var(--red)">⚠ ERROR</div>
          <div style="font-size:11px;color:var(--muted);line-height:1.6">\${escapeHtml(message)}</div>
          \${message.includes('API key') ? \`
          <div class="btn-row" style="margin-top:10px">
            <button class="btn btn-secondary" onclick="switchTab('setup')">⚙ Add API Key</button>
          </div>\` : ''}
        </div>
      \`;
    }
  }

  // ── UTILITIES ──────────────────────────────────────────────────────────────
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(text));
    return div.innerHTML;
  }

  // ── MESSAGE HANDLER ────────────────────────────────────────────────────────
  window.addEventListener('message', event => {
    const msg = event.data;

    switch(msg.type) {

      case 'setLoading':
        switchTab(msg.feature === 'context' ? 'context' : msg.feature === 'explain' ? 'explain' : msg.feature);
        showLoading(msg.feature, msg.message);
        break;

      case 'activateTab':
        switchTab(msg.tab);
        break;

      case 'contextBriefing':
        renderContextBriefing(msg.data);
        switchTab('context');
        break;

      case 'codeExplanation':
        renderCodeExplanation(msg.data);
        switchTab('explain');
        break;

      case 'boilerplateResult':
        renderBoilerplate(msg.data);
        break;

      case 'voiceAnswer':
        addVoiceMessage(msg.data, 'ai');
        updateVoiceStatus('Click orb to ask another question');
        speakText(msg.data);
        break;

      case 'error':
        showError(msg.feature || 'context', msg.message);
        break;

      case 'startVoice':
        startListening();
        break;

      case 'apiKeyStatus':
        document.getElementById('api-key-missing').style.display = msg.hasKey ? 'none' : 'block';
        document.getElementById('api-key-ok').style.display = msg.hasKey ? 'block' : 'none';
        break;
    }
  });

  // ── INIT ───────────────────────────────────────────────────────────────────
  vscode.postMessage({ type: 'checkApiKey' });

</script>
</body>
</html>`;
  }
}