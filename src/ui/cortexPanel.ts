import * as vscode from 'vscode';

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
        localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'media')]
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
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; font-src https://fonts.googleapis.com https://fonts.gstatic.com; style-src 'unsafe-inline' https://fonts.googleapis.com; script-src 'unsafe-inline'; img-src data: https:;">
<title>Cortex AI</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

:root {
  --bg: #F9F9F8;
  --surface: #FFFFFF;
  --surface2: #F3F2EF;
  --border: #E8E8E5;
  --border2: #D4D4CF;
  --text: #1A1916;
  --text2: #6B6B6A;
  --text3: #9B9B99;
  --accent: #CF7B2E;
  --accent-bg: #FDF6EE;
  --accent-border: #F0D9BC;
  --blue: #2B6CB0;
  --blue-bg: #EBF4FF;
  --green: #276749;
  --green-bg: #F0FFF4;
  --red: #C53030;
  --red-bg: #FFF5F5;
  --purple: #553C9A;
  --purple-bg: #FAF5FF;
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
  --shadow: 0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04);
  --radius: 12px;
  --radius-sm: 8px;
  --font: 'Inter', -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;
}

* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: var(--font);
  background: var(--bg);
  color: var(--text);
  font-size: 13px;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}

/* ── SCROLLBAR ── */
::-webkit-scrollbar { width: 5px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 10px; }

/* ── HEADER ── */
.header {
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  padding: 14px 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: sticky;
  top: 0;
  z-index: 100;
}

.logo-area { display: flex; align-items: center; gap: 10px; }

.logo-icon {
  width: 30px; height: 30px;
  background: linear-gradient(135deg, #CF7B2E, #E8956A);
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  font-size: 15px;
  box-shadow: 0 2px 6px rgba(207,123,46,0.3);
}

.logo-text {
  font-size: 15px;
  font-weight: 700;
  color: var(--text);
  letter-spacing: -0.3px;
}

.logo-sub {
  font-size: 11px;
  color: var(--text3);
  font-weight: 400;
}

.status-pill {
  display: flex; align-items: center; gap: 5px;
  background: var(--green-bg);
  border: 1px solid #C6F6D5;
  border-radius: 20px;
  padding: 3px 10px;
  font-size: 11px;
  color: var(--green);
  font-weight: 500;
}

.status-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: var(--green);
  animation: pulse 2s ease-in-out infinite;
}

/* ── NAV ── */
.nav {
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  display: flex;
  padding: 0 14px;
  gap: 2px;
  position: sticky;
  top: 57px;
  z-index: 99;
}

.nav-item {
  display: flex; align-items: center; gap: 6px;
  padding: 10px 12px;
  font-size: 12px;
  font-weight: 500;
  color: var(--text2);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.15s;
  white-space: nowrap;
  user-select: none;
  border-radius: 4px 4px 0 0;
}

.nav-item:hover { color: var(--text); background: var(--bg); }

.nav-item.active {
  color: var(--accent);
  border-bottom-color: var(--accent);
  background: var(--accent-bg);
}

.nav-icon { font-size: 14px; }

/* ── CONTENT ── */
.content { padding: 18px; max-width: 100%; }

.panel { display: none; }
.panel.active { display: block; animation: fadeUp 0.2s ease; }

/* ── SECTION TITLE ── */
.section-title {
  font-size: 11px;
  font-weight: 600;
  color: var(--text3);
  letter-spacing: 0.5px;
  text-transform: uppercase;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.section-title::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--border);
}

/* ── CARDS ── */
.card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: var(--shadow-sm);
}

.card-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.card-desc {
  font-size: 12px;
  color: var(--text2);
  line-height: 1.65;
}

/* ── HIGHLIGHT CARD ── */
.card-highlight {
  background: var(--accent-bg);
  border: 1px solid var(--accent-border);
  border-radius: var(--radius);
  padding: 16px;
  margin-bottom: 12px;
}

.card-highlight .card-title { color: #7D4A1A; }
.card-highlight .card-desc { color: #A0622A; }

/* ── BRIEFING BLOCK ── */
.briefing-block {
  background: var(--surface2);
  border-left: 3px solid var(--accent);
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
  padding: 14px 16px;
  margin-bottom: 14px;
  font-size: 13px;
  line-height: 1.75;
  color: var(--text);
}

/* ── INFO ROW ── */
.info-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 12px;
}

.info-box {
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 10px 12px;
}

.info-label {
  font-size: 10px;
  font-weight: 600;
  color: var(--text3);
  text-transform: uppercase;
  letter-spacing: 0.4px;
  margin-bottom: 3px;
}

.info-value {
  font-size: 12px;
  font-weight: 600;
  color: var(--text);
}

/* ── PROGRESS BAR ── */
.progress-track {
  height: 4px;
  background: var(--border);
  border-radius: 10px;
  overflow: hidden;
  margin-top: 6px;
}

.progress-fill {
  height: 100%;
  border-radius: 10px;
  background: linear-gradient(90deg, var(--accent), #E8956A);
  transition: width 1s cubic-bezier(0.4,0,0.2,1);
}

/* ── STEP ITEMS ── */
.step-list { display: flex; flex-direction: column; gap: 6px; }

.step-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 10px 12px;
  transition: border-color 0.15s;
}

.step-item:hover { border-color: var(--border2); }

.step-num {
  width: 22px; height: 22px;
  border-radius: 6px;
  background: var(--accent-bg);
  border: 1px solid var(--accent-border);
  color: var(--accent);
  font-size: 11px;
  font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}

.step-text { font-size: 12px; color: var(--text); flex: 1; line-height: 1.5; }
.step-effort {
  font-size: 10px;
  color: var(--text3);
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 1px 7px;
  white-space: nowrap;
  flex-shrink: 0;
}

/* ── FILE ITEMS ── */
.file-list { display: flex; flex-direction: column; gap: 4px; }

.file-item {
  display: flex; align-items: center; gap: 8px;
  padding: 7px 10px;
  border-radius: var(--radius-sm);
  background: var(--surface2);
  border: 1px solid var(--border);
  font-size: 12px;
}

.file-dot {
  width: 7px; height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}

.file-name { flex: 1; color: var(--text); font-family: var(--font-mono); font-size: 11px; }
.file-status { font-size: 10px; color: var(--text3); }

/* ── BUTTONS ── */
.btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 16px;
  border-radius: var(--radius-sm);
  font-family: var(--font);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  border: none;
  transition: all 0.15s;
  white-space: nowrap;
}

.btn:active { transform: scale(0.97); }

.btn-primary {
  background: var(--accent);
  color: white;
  box-shadow: 0 2px 6px rgba(207,123,46,0.35);
}
.btn-primary:hover { background: #B86E26; box-shadow: 0 4px 10px rgba(207,123,46,0.4); }

.btn-secondary {
  background: var(--surface);
  color: var(--text);
  border: 1px solid var(--border2);
}
.btn-secondary:hover { background: var(--surface2); border-color: var(--border2); }

.btn-ghost {
  background: transparent;
  color: var(--text2);
  border: 1px solid var(--border);
  padding: 6px 12px;
}
.btn-ghost:hover { background: var(--surface2); color: var(--text); }

.btn-blue {
  background: var(--blue);
  color: white;
  box-shadow: 0 2px 6px rgba(43,108,176,0.3);
}
.btn-blue:hover { background: #2558A0; }

.btn-green {
  background: var(--green);
  color: white;
  box-shadow: 0 2px 6px rgba(39,103,73,0.3);
}
.btn-green:hover { background: #1E5438; }

.btn-row { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 12px; }

/* ── QUICK CHIPS ── */
.chips { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 14px; }

.chip {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 20px;
  padding: 4px 12px;
  font-size: 11px;
  font-weight: 500;
  color: var(--text2);
  cursor: pointer;
  transition: all 0.15s;
}

.chip:hover {
  border-color: var(--accent);
  color: var(--accent);
  background: var(--accent-bg);
}

/* ── INPUTS ── */
.input-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--text2);
  margin-bottom: 5px;
  display: block;
}

.input, textarea.input {
  width: 100%;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text);
  font-family: var(--font);
  font-size: 12px;
  padding: 9px 12px;
  outline: none;
  resize: vertical;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.input:focus, textarea.input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(207,123,46,0.12);
}

select.input { cursor: pointer; }

.input-group { margin-bottom: 12px; }

/* ── CODE BLOCK ── */
.code-wrap {
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  overflow: hidden;
  margin-bottom: 12px;
  box-shadow: var(--shadow-sm);
}

.code-bar {
  display: flex; justify-content: space-between; align-items: center;
  padding: 8px 14px;
  background: #F0EFEC;
  border-bottom: 1px solid var(--border);
  font-size: 11px;
  color: var(--text2);
  font-weight: 500;
}

.code-actions { display: flex; gap: 6px; }

.code-btn {
  background: var(--surface);
  border: 1px solid var(--border);
  color: var(--text2);
  font-family: var(--font);
  font-size: 10px;
  font-weight: 500;
  padding: 3px 10px;
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.15s;
}
.code-btn:hover { border-color: var(--accent); color: var(--accent); }

pre {
  padding: 14px;
  overflow-x: auto;
  font-family: var(--font-mono);
  font-size: 11.5px;
  line-height: 1.65;
  color: #2D2D2D;
  background: #FAFAF8;
  white-space: pre-wrap;
  word-break: break-word;
}

/* ── BADGES ── */
.badge {
  display: inline-flex; align-items: center;
  font-size: 10px; font-weight: 600;
  padding: 2px 8px; border-radius: 20px;
  letter-spacing: 0.2px;
}

.badge-red { background: var(--red-bg); color: var(--red); border: 1px solid #FEB2B2; }
.badge-yellow { background: #FFFFF0; color: #744210; border: 1px solid #FAF089; }
.badge-green { background: var(--green-bg); color: var(--green); border: 1px solid #C6F6D5; }
.badge-blue { background: var(--blue-bg); color: var(--blue); border: 1px solid #BEE3F8; }
.badge-purple { background: var(--purple-bg); color: var(--purple); border: 1px solid #D6BCFA; }
.badge-orange { background: var(--accent-bg); color: var(--accent); border: 1px solid var(--accent-border); }

/* ── ISSUE ITEM ── */
.issue-item {
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  margin-bottom: 6px;
  border-left: 3px solid transparent;
}
.issue-high { background: #FFF5F5; border-left-color: var(--red); }
.issue-medium { background: #FFFFF0; border-left-color: #D69E2E; }
.issue-low { background: var(--green-bg); border-left-color: var(--green); }
.issue-title { font-size: 12px; font-weight: 500; color: var(--text); margin-bottom: 4px; }
.issue-fix { font-size: 11px; color: var(--green); margin-top: 4px; }

/* ── TAGS ── */
.tag {
  display: inline-block;
  font-size: 11px;
  padding: 3px 9px;
  border-radius: 5px;
  margin: 2px;
  font-weight: 500;
  background: var(--surface2);
  border: 1px solid var(--border);
  color: var(--text2);
}

/* ── HOW IT WORKS ── */
.how-item {
  display: flex; gap: 10px; margin-bottom: 8px; align-items: flex-start;
}
.how-num {
  width: 22px; height: 22px; border-radius: 50%;
  background: var(--blue-bg); border: 1px solid #BEE3F8;
  display: flex; align-items: center; justify-content: center;
  font-size: 10px; font-weight: 700; color: var(--blue); flex-shrink: 0;
}
.how-text { font-size: 12px; color: var(--text2); line-height: 1.6; }

/* ── VOICE ── */
.voice-center { text-align: center; padding: 10px 0; }

.voice-orb {
  width: 88px; height: 88px; border-radius: 50%;
  background: linear-gradient(135deg, var(--purple-bg), #EDE9FE);
  border: 2px solid #D6BCFA;
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 14px;
  cursor: pointer;
  font-size: 32px;
  transition: all 0.25s;
  box-shadow: var(--shadow-sm);
}

.voice-orb:hover {
  box-shadow: 0 8px 24px rgba(85,60,154,0.2);
  transform: scale(1.04);
}

.voice-orb.listening {
  animation: orbPulse 1.4s ease-in-out infinite;
  border-color: var(--purple);
  box-shadow: 0 0 0 8px rgba(85,60,154,0.08);
}

.voice-status {
  font-size: 12px;
  color: var(--text2);
  margin-bottom: 14px;
}

.chat-list { display: flex; flex-direction: column; gap: 8px; }

.chat-msg {
  padding: 10px 14px;
  border-radius: var(--radius);
  font-size: 12px;
  line-height: 1.65;
  animation: fadeUp 0.25s ease;
}

.chat-user {
  background: var(--purple-bg);
  border: 1px solid #D6BCFA;
  color: var(--purple);
  align-self: flex-end;
  text-align: right;
  max-width: 90%;
}

.chat-ai {
  background: var(--surface);
  border: 1px solid var(--border);
  color: var(--text);
  max-width: 95%;
  box-shadow: var(--shadow-sm);
}

.chat-ai-label {
  font-size: 10px;
  font-weight: 600;
  color: var(--accent);
  margin-bottom: 4px;
  display: flex; align-items: center; gap: 5px;
}

.example-q {
  padding: 8px 12px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 12px;
  color: var(--text2);
  transition: all 0.15s;
  text-align: left;
}
.example-q:hover {
  border-color: var(--purple);
  color: var(--purple);
  background: var(--purple-bg);
}

/* ── SETUP ── */
.api-status-ok {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 14px;
  background: var(--green-bg);
  border: 1px solid #C6F6D5;
  border-radius: var(--radius-sm);
  margin-bottom: 14px;
  font-size: 12px;
  font-weight: 500;
  color: var(--green);
}

.shortcut-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid var(--border);
  font-size: 12px;
}
.shortcut-row:last-child { border-bottom: none; }

.kbd {
  background: var(--surface2);
  border: 1px solid var(--border2);
  border-bottom: 2px solid var(--border2);
  border-radius: 5px;
  padding: 2px 8px;
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--text2);
}

/* ── LOADING ── */
.loading-bar {
  display: flex; align-items: center; gap: 10px;
  padding: 12px 14px;
  background: var(--accent-bg);
  border: 1px solid var(--accent-border);
  border-radius: var(--radius-sm);
  margin-bottom: 12px;
  font-size: 12px;
  color: #7D4A1A;
}

.dots span {
  display: inline-block;
  width: 5px; height: 5px;
  border-radius: 50%;
  background: var(--accent);
  animation: dotBounce 1.2s ease-in-out infinite;
  margin-right: 3px;
}
.dots span:nth-child(2) { animation-delay: 0.2s; }
.dots span:nth-child(3) { animation-delay: 0.4s; }

/* ── EMPTY STATE ── */
.empty {
  text-align: center;
  padding: 32px 20px;
}
.empty-icon { font-size: 36px; margin-bottom: 10px; opacity: 0.5; }
.empty-title { font-size: 14px; font-weight: 600; color: var(--text); margin-bottom: 6px; }
.empty-desc { font-size: 12px; color: var(--text2); line-height: 1.65; }

/* ── FEATURE LIST ── */
.feature-list { display: flex; flex-direction: column; gap: 6px; }

.feature-item {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 10px;
  border-radius: var(--radius-sm);
  font-size: 12px;
  color: var(--text2);
}
.feature-item:hover { background: var(--surface2); }

.feature-icon {
  width: 28px; height: 28px;
  border-radius: 7px;
  display: flex; align-items: center; justify-content: center;
  font-size: 14px;
  flex-shrink: 0;
}

/* ── DIVIDER ── */
.divider { height: 1px; background: var(--border); margin: 14px 0; }

/* ── ANIMATIONS ── */
@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
@keyframes dotBounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-5px)} }
@keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
@keyframes orbPulse { 0%,100%{box-shadow:0 0 0 0 rgba(85,60,154,0.15)} 50%{box-shadow:0 0 0 14px rgba(85,60,154,0)} }
</style>
</head>
<body>

<!-- HEADER -->
<div class="header">
  <div class="logo-area">
    <div class="logo-icon">🧠</div>
    <div>
      <div class="logo-text">Cortex AI</div>
      <div class="logo-sub">Developer Focus Engine</div>
    </div>
  </div>
  <div class="status-pill">
    <div class="status-dot"></div>
    Active
  </div>
</div>

<!-- NAV -->
<div class="nav">
  <div class="nav-item active" id="tab-context">
    <span class="nav-icon">↩</span> Context
  </div>
  <div class="nav-item" id="tab-explain">
    <span class="nav-icon">◈</span> Explain
  </div>
  <div class="nav-item" id="tab-boilerplate">
    <span class="nav-icon">⬡</span> Generate
  </div>
  <div class="nav-item" id="tab-voice">
    <span class="nav-icon">🎙</span> Voice
  </div>
  <div class="nav-item" id="tab-setup">
    <span class="nav-icon">⚙</span> Setup
  </div>
</div>

<!-- CONTENT -->
<div class="content">

  <!-- ── CONTEXT PANEL ── -->
  <div class="panel active" id="panel-context">
    <div id="ctx-loading" style="display:none">
      <div class="loading-bar">
        <div class="dots"><span></span><span></span><span></span></div>
        <span id="ctx-loading-text">Analyzing your workspace...</span>
      </div>
    </div>
    <div id="ctx-result" style="display:none"></div>
    <div id="ctx-empty">
      <div class="card-highlight">
        <div class="card-title">↩ Context Recovery</div>
        <div class="card-desc">Instantly understand where you left off. Cortex reads your recent files, git history and open tabs to rebuild your mental context in seconds.</div>
        <div class="btn-row">
          <button class="btn btn-primary" id="btn-recover">↩ Recover My Context</button>
        </div>
      </div>
      <div class="section-title">What you get</div>
      <div class="feature-list">
        <div class="feature-item">
          <div class="feature-icon" style="background:#FEF3C7">📍</div>
          <div><strong>Exactly where you stopped</strong> — last file and function</div>
        </div>
        <div class="feature-item">
          <div class="feature-icon" style="background:#E0F2FE">🧠</div>
          <div><strong>What you were building</strong> — plain English summary</div>
        </div>
        <div class="feature-item">
          <div class="feature-icon" style="background:#F0FFF4">⚡</div>
          <div><strong>Your next 3 actions</strong> — prioritized and time-estimated</div>
        </div>
        <div class="feature-item">
          <div class="feature-icon" style="background:#FFF5F5">🐛</div>
          <div><strong>Bugs in recent code</strong> — with fix suggestions</div>
        </div>
        <div class="feature-item">
          <div class="feature-icon" style="background:#FAF5FF">📂</div>
          <div><strong>Recently touched files</strong> — sorted by activity</div>
        </div>
      </div>
      <div style="margin-top:10px;font-size:11px;color:var(--text3);text-align:center">Shortcut: Ctrl+Shift+R</div>
    </div>
  </div>

  <!-- ── EXPLAIN PANEL ── -->
  <div class="panel" id="panel-explain">
    <div id="exp-loading" style="display:none">
      <div class="loading-bar">
        <div class="dots"><span></span><span></span><span></span></div>
        <span>Reading the code structure...</span>
      </div>
    </div>
    <div id="exp-result" style="display:none"></div>
    <div id="exp-empty">
      <div class="card-highlight">
        <div class="card-title">◈ Code Explainer</div>
        <div class="card-desc">Select any code in your editor — a function, a class, or an entire file — then click below. Cortex explains what it does, why it exists, and spots potential issues.</div>
        <div class="btn-row">
          <button class="btn btn-primary" id="btn-explain">◈ Explain Selected Code</button>
        </div>
      </div>
      <div class="section-title">Intelligence layers</div>
      <div class="feature-list">
        <div class="feature-item"><div class="feature-icon" style="background:#F0FFF4">🔍</div><div><strong>Purpose</strong> — WHY this code exists in the system</div></div>
        <div class="feature-item"><div class="feature-icon" style="background:#E0F2FE">⚙️</div><div><strong>How it works</strong> — step-by-step breakdown</div></div>
        <div class="feature-item"><div class="feature-icon" style="background:#FFF5F5">⚠️</div><div><strong>Potential issues</strong> — bugs and code smells</div></div>
        <div class="feature-item"><div class="feature-icon" style="background:#FAF5FF">🧩</div><div><strong>Dependencies</strong> — related concepts and patterns</div></div>
      </div>
      <div style="margin-top:10px;font-size:11px;color:var(--text3);text-align:center">Select code first · Shortcut: Ctrl+Shift+E</div>
    </div>
  </div>

  <!-- ── BOILERPLATE PANEL ── -->
  <div class="panel" id="panel-boilerplate">
    <div id="bp-loading" style="display:none">
      <div class="loading-bar">
        <div class="dots"><span></span><span></span><span></span></div>
        <span>Analyzing your codebase style...</span>
      </div>
    </div>

    <div class="card">
      <div class="card-title">⬡ Smart Boilerplate Generator</div>
      <div class="card-desc" style="margin-bottom:14px">Generates code that matches your exact style, naming conventions, and patterns.</div>

      <div class="input-group">
        <label class="input-label">What do you need?</label>
        <textarea class="input" id="bp-prompt" rows="3"
          placeholder="e.g. REST API endpoint for user authentication with JWT
e.g. React hook for debounced search
e.g. Database model for products table"></textarea>
      </div>

      <div class="input-group">
        <label class="input-label">Language</label>
        <select class="input" id="bp-lang">
          <option value="typescript">TypeScript</option>
          <option value="javascript">JavaScript</option>
          <option value="python">Python</option>
          <option value="java">Java</option>
          <option value="go">Go</option>
          <option value="rust">Rust</option>
        </select>
      </div>

      <button class="btn btn-primary" id="btn-generate" style="width:100%">⬡ Generate Code</button>
    </div>

    <div class="section-title" style="margin-top:4px">Quick generate</div>
    <div class="chips">
      <div class="chip" data-quick="REST API endpoint">REST endpoint</div>
      <div class="chip" data-quick="authentication middleware">Auth middleware</div>
      <div class="chip" data-quick="database model">DB model</div>
      <div class="chip" data-quick="React custom hook">React hook</div>
      <div class="chip" data-quick="error handler middleware">Error handler</div>
      <div class="chip" data-quick="unit test suite">Unit test</div>
      <div class="chip" data-quick="async queue worker">Queue worker</div>
    </div>

    <div id="bp-result" style="display:none"></div>
  </div>

  <!-- ── VOICE PANEL ── -->
  <div class="panel" id="panel-voice">
    <div class="card">
      <div class="voice-center">
        <div class="voice-orb" id="voice-orb">🎙️</div>
        <div class="voice-status" id="voice-status">Click the orb to open voice input</div>
        <div style="display:flex;gap:8px;justify-content:center;margin-bottom:14px">
          <button class="btn" id="voice-btn" style="background:var(--purple);color:white;box-shadow:0 2px 6px rgba(85,60,154,0.3)">🎙️ Ask a Question</button>
          <button class="btn btn-secondary" id="stop-btn">⬛ Stop</button>
        </div>
        <div id="voice-error" style="display:none;font-size:11px;color:var(--red);margin-bottom:8px;padding:8px;background:var(--red-bg);border-radius:6px;border:1px solid #FEB2B2"></div>
      </div>

      <div class="section-title">Or type your question</div>
      <div style="display:flex;gap:8px;margin-bottom:14px">
        <input class="input" id="voice-text-input" placeholder="Ask anything about your code..." style="flex:1"/>
        <button class="btn" id="voice-send-btn" style="background:var(--purple);color:white;white-space:nowrap">Send</button>
      </div>

      <div class="section-title">Quick questions</div>
      <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:4px">
        <button class="example-q" data-question="Where is the authentication logic?">"Where is the authentication logic?"</button>
        <button class="example-q" data-question="What does the payment module do?">"What does the payment module do?"</button>
        <button class="example-q" data-question="Explain the database connection setup">"Explain the database connection setup"</button>
        <button class="example-q" data-question="What should I work on next?">"What should I work on next?"</button>
      </div>
    </div>

    <div id="voice-chat-card" style="display:none">
      <div class="section-title">Conversation</div>
      <div class="chat-list" id="chat-list"></div>
    </div>
  </div>

  <!-- ── SETUP PANEL ── -->
  <div class="panel" id="panel-setup">
    <div class="card">
      <div class="card-title">🔑 API Configuration</div>

      <div id="key-ok" style="display:none">
        <div class="api-status-ok">✅ Gemini API key configured. All features active.</div>
      </div>
      <div id="key-missing" style="display:none">
        <div style="padding:12px;background:var(--red-bg);border:1px solid #FEB2B2;border-radius:8px;margin-bottom:14px;font-size:12px;color:var(--red)">
          ⚠️ API key required to use Cortex AI features.
        </div>
      </div>

      <div class="input-group">
        <label class="input-label">Google Gemini API Key</label>
        <input type="password" class="input" id="key-input" placeholder="AIza..."/>
      </div>
      <div class="btn-row">
        <button class="btn btn-primary" id="btn-save-key">💾 Save Key</button>
        <button class="btn btn-ghost" id="btn-get-key">Get free key ↗</button>
      </div>
      <div style="margin-top:10px;font-size:11px;color:var(--text3);line-height:1.7">
        Free at aistudio.google.com → API Keys → Create key<br/>
        Stored securely in VS Code settings.
      </div>
    </div>

    <div class="card">
      <div class="card-title">⌨️ Keyboard Shortcuts</div>
      <div class="shortcut-row"><span>Open Cortex Panel</span><span class="kbd">Ctrl+Shift+A</span></div>
      <div class="shortcut-row"><span>Recover Context</span><span class="kbd">Ctrl+Shift+R</span></div>
      <div class="shortcut-row"><span>Explain Selected Code</span><span class="kbd">Ctrl+Shift+E</span></div>
      <div class="shortcut-row"><span>Generate Boilerplate</span><span class="kbd">Ctrl+Shift+B</span></div>
    </div>

    <div class="card">
      <div class="card-title">ℹ️ About Cortex AI</div>
      <div class="card-desc">Version 1.0.0 · Built for TRAE AI IDE Hackathon<br/>Powered by Google Gemini 1.5 Flash</div>
    </div>
  </div>

</div>

<script>
const vscode = acquireVsCodeApi();
let isListening = false;
let recognition = null;
const synth = window.speechSynthesis;

// ── TABS ──
function switchTab(tab) {
  document.querySelectorAll('.nav-item').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.getElementById('tab-' + tab).classList.add('active');
  document.getElementById('panel-' + tab).classList.add('active');
}

// ── ACTIONS ──
function recoverContext() {
  vscode.postMessage({ type: 'recoverContext' });
}

function explainCode() {
  vscode.postMessage({ type: 'explainCode' });
}

function generateBoilerplate() {
  const prompt = document.getElementById('bp-prompt').value.trim();
  const language = document.getElementById('bp-lang').value;
  if (!prompt) {
    document.getElementById('bp-prompt').style.borderColor = 'var(--red)';
    setTimeout(() => document.getElementById('bp-prompt').style.borderColor = '', 1500);
    return;
  }
  showLoading('bp', 'Analyzing your codebase style...');
  vscode.postMessage({ type: 'generateBoilerplate', prompt, language });
}

function quickBp(type) {
  document.getElementById('bp-prompt').value = type;
  switchTab('boilerplate');
  generateBoilerplate();
}

function saveKey() {
  const key = document.getElementById('key-input').value.trim();
  if (!key) return;
  vscode.postMessage({ type: 'saveApiKey', key });
  document.getElementById('key-input').value = '';
}

function insertCode(code) { vscode.postMessage({ type: 'insertCode', code }); }
function copyCode(code) { vscode.postMessage({ type: 'copyCode', code }); }

// ── LOADING ──
function showLoading(feature, msg) {
  const loading = document.getElementById(feature + '-loading');
  const result  = document.getElementById(feature + '-result');
  const empty   = document.getElementById(feature + '-empty');
  if (loading) loading.style.display = 'flex';
  if (result)  result.style.display  = 'none';
  if (empty)   empty.style.display   = 'none';
  const txt = document.getElementById(feature + '-loading-text');
  if (txt && msg) txt.textContent = msg;
}

function hideLoading(feature) {
  const loading = document.getElementById(feature + '-loading');
  if (loading) loading.style.display = 'none';
}

// ── RENDER CONTEXT ──
function renderContext(d) {
  hideLoading('ctx');
  const el = document.getElementById('ctx-result');
  el.style.display = 'block';

  const colors = ['var(--accent)','var(--blue)','var(--purple)'];

  el.innerHTML =
    '<div class="card">' +
      '<div class="card-title">↩ Wake-Up Briefing <span style="margin-left:auto;font-size:11px;font-weight:400;color:var(--text3)">' + (d.sessionGap||'') + '</span></div>' +
      '<div class="briefing-block">' + esc(d.summary||'Context analyzed.') + '</div>' +
      '<div class="info-row">' +
        '<div class="info-box"><div class="info-label">Last Active File</div><div class="info-value" style="color:var(--accent);font-family:var(--font-mono);font-size:11px">' + esc(d.lastActiveFile||'—') + '</div></div>' +
        '<div class="info-box"><div class="info-label">Confidence</div><div class="info-value">' + (d.confidence||0) + '%</div><div class="progress-track"><div class="progress-fill" style="width:' + (d.confidence||0) + '%"></div></div></div>' +
      '</div>' +
      '<div class="info-box" style="margin-bottom:14px"><div class="info-label">Where You Stopped</div><div class="info-value" style="color:var(--blue);margin-top:3px;font-size:12px">' + esc(d.whereYouStopped||'—') + '</div></div>' +
    '</div>' +

    '<div class="section-title">⚡ Next Actions</div>' +
    '<div class="step-list">' +
    (d.nextSteps||[]).map((s,i) =>
      '<div class="step-item">' +
        '<div class="step-num" style="background:' + colors[i%3] + '18;border-color:' + colors[i%3] + '33;color:' + colors[i%3] + '">' + s.priority + '</div>' +
        '<div class="step-text">' + esc(s.action) + '</div>' +
        '<div class="step-effort">~' + esc(s.effort) + '</div>' +
      '</div>'
    ).join('') +
    '</div>' +

    (d.recentFiles && d.recentFiles.length ?
      '<div class="section-title" style="margin-top:14px">📂 Recent Files</div>' +
      '<div class="file-list">' +
      d.recentFiles.slice(0,5).map(f =>
        '<div class="file-item">' +
          '<div class="file-dot" style="background:' + (f.status==='modified'?'#D69E2E':'var(--text3)') + '"></div>' +
          '<div class="file-name">' + esc(f.name) + '</div>' +
          '<div class="file-status">' + (f.changes ? f.changes+' changes' : f.status) + '</div>' +
        '</div>'
      ).join('') +
      '</div>'
    : '') +

    '<div class="btn-row" style="margin-top:14px">' +
      '<button class="btn btn-secondary" id="btn-refresh">↩ Refresh</button>' +
    '</div>';
  const ref = document.getElementById('btn-refresh');
  if (ref) ref.addEventListener('click', recoverContext);
}

// ── RENDER EXPLAIN ──
function renderExplain(d) {
  hideLoading('exp');
  const el = document.getElementById('exp-result');
  el.style.display = 'block';

  const cxMap = { low:'badge-green', medium:'badge-yellow', high:'badge-red' };
  const cx = d.complexity || 'medium';

  el.innerHTML =
    '<div class="card">' +
      '<div class="card-title">◈ Explanation <span class="badge ' + cxMap[cx] + '" style="margin-left:auto">' + cx + ' complexity</span></div>' +
      '<div class="briefing-block">' + esc(d.summary||'') + '</div>' +

      '<div class="section-title">Purpose</div>' +
      '<div style="font-size:12px;color:var(--text2);line-height:1.7;margin-bottom:14px">' + esc(d.purpose||'') + '</div>' +

      (d.howItWorks && d.howItWorks.length ?
        '<div class="section-title">How it works</div>' +
        d.howItWorks.map(s =>
          '<div class="how-item"><div class="how-num">' + s.step + '</div><div class="how-text">' + esc(s.description) + '</div></div>'
        ).join('') + '<div style="margin-bottom:14px"></div>'
      : '') +

      (d.potentialIssues && d.potentialIssues.length ?
        '<div class="section-title">Potential Issues</div>' +
        d.potentialIssues.map(i =>
          '<div class="issue-item issue-' + i.severity + '">' +
            '<div class="issue-title"><span class="badge badge-' + (i.severity==='high'?'red':i.severity==='medium'?'yellow':'green') + '" style="margin-right:6px">' + i.severity + '</span>' + esc(i.issue) + '</div>' +
            (i.suggestion ? '<div class="issue-fix">→ ' + esc(i.suggestion) + '</div>' : '') +
          '</div>'
        ).join('')
      : '') +

      (d.dependencies && d.dependencies.length ?
        '<div class="section-title" style="margin-top:8px">Dependencies</div>' +
        '<div style="margin-bottom:14px">' + d.dependencies.map(t => '<span class="tag">' + esc(t) + '</span>').join('') + '</div>'
      : '') +
    '</div>' +
    '<div class="btn-row"><button class="btn btn-secondary" id="btn-explain-again">◈ Explain Again</button></div>';
  const ea = document.getElementById('btn-explain-again');
  if (ea) ea.addEventListener('click', explainCode);
}

// ── RENDER BOILERPLATE ──
function renderBoilerplate(d) {
  hideLoading('bp');
  const el = document.getElementById('bp-result');
  el.style.display = 'block';
  window._lastCode = d.code;

  const safe = esc(d.code);
  el.innerHTML =
    '<div class="section-title" style="margin-top:4px">Generated — ' + esc(d.fileName||'code') + '</div>' +
    '<div class="card" style="padding:0;overflow:hidden">' +
      '<div class="code-wrap" style="margin:0;border:none;border-radius:0;box-shadow:none">' +
        '<div class="code-bar">' +
          '<span>' + esc(d.language||'code') + '</span>' +
          '<div class="code-actions">' +
            '<button class="code-btn" id="btn-insert-code">↙ Insert at cursor</button>' +
            '<button class="code-btn" id="btn-copy-code">⎘ Copy</button>' +
          '</div>' +
        '</div>' +
        '<pre>' + safe + '</pre>' +
      '</div>' +
    '</div>' +
    '<div style="font-size:11px;color:var(--text3);margin-top:4px">' + esc(d.description||'') + '</div>';
  const ic = document.getElementById('btn-insert-code');
  if (ic) ic.addEventListener('click', () => insertCode(window._lastCode));
  const cc = document.getElementById('btn-copy-code');
  if (cc) cc.addEventListener('click', () => copyCode(window._lastCode));
}

// ── VOICE ──
// ── VOICE via Extension (PowerShell Speech Recognition) ──
function toggleVoice() {
  if (isListening) {
    stopVoice();
  } else {
    startVoice();
  }
}

function startVoice() {
  isListening = true;
  document.getElementById('voice-orb').classList.add('listening');
  document.getElementById('voice-btn').textContent = '⟳ Waiting...';
  setVoiceStatus('🌐 Browser opening — allow mic, speak, then return to VS Code...');
  hideVoiceError();
  vscode.postMessage({ type: 'startVoiceRecording' });
}

function stopVoice() {
  isListening = false;
  document.getElementById('voice-orb').classList.remove('listening');
  document.getElementById('voice-btn').textContent = '🎙️ Start Recording';
  setVoiceStatus('Click orb to start recording');
}

function stopSpeaking() {
  synth.cancel();
  stopVoice();
}

function showVoiceError(msg) {
  const el = document.getElementById('voice-error');
  if (el) { el.textContent = msg; el.style.display = 'block'; }
}

function hideVoiceError() {
  const el = document.getElementById('voice-error');
  if (el) el.style.display = 'none';
}

function askQuestion(q) {
  addChat(q, 'user');
  setVoiceStatus('⟳ Thinking...');
  vscode.postMessage({ type: 'voiceQuery', query: q });
}

function addChat(text, role) {
  const card = document.getElementById('voice-chat-card');
  const list = document.getElementById('chat-list');
  card.style.display = 'block';

  const div = document.createElement('div');
  div.className = 'chat-msg chat-' + role;
  if (role === 'ai') {
    div.innerHTML = '<div class="chat-ai-label">🧠 Cortex</div>' + esc(text);
  } else {
    div.textContent = text;
  }
  list.appendChild(div);
  list.scrollTop = list.scrollHeight;
}

function setVoiceStatus(t) {
  document.getElementById('voice-status').textContent = t;
}

function speakText(text) {
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = 0.95;
  synth.speak(u);
}

// ── ERROR ──
function showError(feature, msg) {
  hideLoading(feature);
  const el = document.getElementById(feature + '-result');
  if (!el) return;
  el.style.display = 'block';
  el.innerHTML =
    '<div class="card" style="border-color:#FEB2B2;background:var(--red-bg)">' +
      '<div class="card-title" style="color:var(--red)">⚠️ Error</div>' +
      '<div class="card-desc">' + esc(msg) + '</div>' +
      (msg.includes('key') ?
        '<div class="btn-row"><button class="btn btn-secondary" id="btn-err-setup">⚙ Add API Key</button></div>' : '') +
    '</div>';
  const eb = document.getElementById('btn-err-setup');
  if (eb) eb.addEventListener('click', () => switchTab('setup'));
}

// ── UTILITIES ──
function esc(t) {
  const d = document.createElement('div');
  d.appendChild(document.createTextNode(String(t || '')));
  return d.innerHTML;
}

// ── MESSAGE HANDLER ──
window.addEventListener('message', e => {
  const m = e.data;
  switch(m.type) {
    case 'setLoading':
      switchTab(m.feature === 'context' ? 'context' : m.feature === 'explain' ? 'explain' : m.feature);
      showLoading(m.feature === 'context' ? 'ctx' : m.feature === 'explain' ? 'exp' : 'bp', m.message);
      break;
    case 'activateTab': switchTab(m.tab); break;
    case 'contextBriefing': renderContext(m.data); switchTab('context'); break;
    case 'codeExplanation': renderExplain(m.data); switchTab('explain'); break;
    case 'boilerplateResult': renderBoilerplate(m.data); break;
    case 'voiceAnswer':
      addChat(m.data, 'ai');
      setVoiceStatus('Click orb to record again');
      speakText(m.data);
      break;
    case 'transcribed':
      stopVoice();
      setVoiceStatus('You said: "' + m.text + '"');
      addChat(m.text, 'user');
      break;
    case 'recordingStatus':
      setVoiceStatus(m.message);
      break;
    case 'transcribeError':
      stopVoice();
      setVoiceStatus('Try text input below ↓');
      showVoiceError(m.message);
      break;
    case 'error': showError(m.feature||'ctx', m.message); break;
    case 'startVoice': startListening(); break;
    case 'apiKeyStatus':
      document.getElementById('key-ok').style.display = m.hasKey ? 'block' : 'none';
      document.getElementById('key-missing').style.display = m.hasKey ? 'none' : 'block';
      break;
  }
});

// ── WIRE ALL BUTTONS ──
function wireButtons() {
  // Nav tabs
  ['context','explain','boilerplate','voice','setup'].forEach(tab => {
    const el = document.getElementById('tab-' + tab);
    if (el) el.addEventListener('click', () => switchTab(tab));
  });

  // Context
  const r = document.getElementById('btn-recover');
  if (r) r.addEventListener('click', recoverContext);

  // Explain
  const ex = document.getElementById('btn-explain');
  if (ex) ex.addEventListener('click', explainCode);

  // Generate
  const gen = document.getElementById('btn-generate');
  if (gen) gen.addEventListener('click', generateBoilerplate);

  // Quick chips
  document.querySelectorAll('[data-quick]').forEach(el => {
    el.addEventListener('click', () => quickBp(el.getAttribute('data-quick')));
  });

  // Voice orb & buttons
  const orb = document.getElementById('voice-orb');
  if (orb) orb.addEventListener('click', toggleVoice);
  const vBtn = document.getElementById('voice-btn');
  if (vBtn) vBtn.addEventListener('click', toggleVoice);
  const sBtn = document.getElementById('stop-btn');
  if (sBtn) sBtn.addEventListener('click', stopSpeaking);

  // Voice text input
  const sendBtn = document.getElementById('voice-send-btn');
  if (sendBtn) sendBtn.addEventListener('click', () => {
    const input = document.getElementById('voice-text-input');
    const q = input.value.trim();
    if (q) { askQuestion(q); input.value = ''; }
  });
  const textInput = document.getElementById('voice-text-input');
  if (textInput) textInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const q = textInput.value.trim();
      if (q) { askQuestion(q); textInput.value = ''; }
    }
  });

  // Example questions
  document.querySelectorAll('[data-question]').forEach(el => {
    el.addEventListener('click', () => askQuestion(el.getAttribute('data-question')));
  });

  // Setup
  const sk = document.getElementById('btn-save-key');
  if (sk) sk.addEventListener('click', saveKey);
  const gk = document.getElementById('btn-get-key');
  if (gk) gk.addEventListener('click', () => vscode.postMessage({ type: 'openUrl', url: 'https://aistudio.google.com' }));
}

// Wire on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', wireButtons);
} else {
  wireButtons();
}

vscode.postMessage({ type: 'checkApiKey' });
</script>
</body>
</html>`;
  }
}