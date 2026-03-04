import * as vscode from 'vscode';
import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import Groq from 'groq-sdk';

export class VoiceServer {
  private server: http.Server | null = null;
  private port: number = 54321;
  private onTranscript: ((text: string) => void) | null = null;

  async start(onTranscript: (text: string) => void): Promise<number> {
    this.onTranscript = onTranscript;

    return new Promise((resolve, reject) => {
      this.server = http.createServer((req, res) => {
        // CORS headers for browser
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
          res.writeHead(200);
          res.end();
          return;
        }

        if (req.method === 'GET' && req.url === '/') {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(this.getRecorderHtml());
          return;
        }

        if (req.method === 'POST' && req.url === '/audio') {
          const chunks: Buffer[] = [];
          req.on('data', (chunk) => chunks.push(chunk));
          req.on('end', async () => {
            try {
              const body = JSON.parse(Buffer.concat(chunks).toString());
              const transcript = await this.transcribeBase64(body.audio, body.mimeType);
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ transcript }));
              if (this.onTranscript && transcript) {
                this.onTranscript(transcript);
              }
            } catch (err: any) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }

        res.writeHead(404);
        res.end();
      });

      this.server.listen(this.port, '127.0.0.1', () => {
        resolve(this.port);
      });

      this.server.on('error', (err: any) => {
        if (err.code === 'EADDRINUSE') {
          this.port = 54322 + Math.floor(Math.random() * 100);
          this.server!.listen(this.port, '127.0.0.1', () => resolve(this.port));
        } else {
          reject(err);
        }
      });
    });
  }

  stop() {
    if (this.server) {
      this.server.close();
      this.server = null;
    }
  }

  private async transcribeBase64(audioBase64: string, mimeType: string): Promise<string> {
    const config = vscode.workspace.getConfiguration('cortex');
    const apiKey = config.get<string>('groqApiKey') || '';
    if (!apiKey) { throw new Error('No Groq API key configured.'); }

    const groq = new Groq({ apiKey });
    const ext = mimeType.includes('webm') ? 'webm' : mimeType.includes('mp4') ? 'mp4' : 'wav';
    const tempFile = path.join(os.tmpdir(), `cortex_${Date.now()}.${ext}`);
    fs.writeFileSync(tempFile, Buffer.from(audioBase64, 'base64'));

    try {
      const result = await groq.audio.transcriptions.create({
        file: fs.createReadStream(tempFile),
        model: 'whisper-large-v3-turbo',
        language: 'en',
        response_format: 'json',
      });
      return result.text || '';
    } finally {
      try { fs.unlinkSync(tempFile); } catch (_) {}
    }
  }

  private getRecorderHtml(): string {
    const port = this.port;
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Cortex Voice</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, 'Inter', sans-serif;
    background: #111318;
    color: #E2E8F0;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100vh;
    overflow: hidden;
  }
  .container {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    padding: 28px 32px;
    background: #1A1D24;
    border: 1px solid #2D3748;
    border-radius: 20px;
    box-shadow: 0 20px 60px rgba(0,0,0,0.5);
    min-width: 260px;
  }
  .brand { font-size: 11px; font-weight: 700; color: #CF7B2E; letter-spacing: 3px; text-transform: uppercase; }
  .orb {
    width: 80px; height: 80px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 32px; position: relative;
    transition: all 0.3s;
  }
  .orb-ring {
    position: absolute; inset: -4px; border-radius: 50%;
    border: 2px solid rgba(168,85,247,0.4);
    animation: ringPulse 2s ease-in-out infinite;
  }
  .orb.recording .orb-ring { border-color: #EF4444; animation: ringPulseRed 0.8s ease-in-out infinite; }
  .orb.done .orb-ring { border-color: #48BB78; animation: none; }

  .status { font-size: 13px; color: #718096; text-align: center; min-height: 18px; }
  .status.recording { color: #FC8181; font-weight: 600; }
  .status.sending { color: #F6AD55; }
  .status.done { color: #68D391; font-weight: 600; }
  .status.error { color: #FC8181; }

  .timer {
    font-size: 22px; font-weight: 700; color: #E2E8F0;
    font-variant-numeric: tabular-nums;
    letter-spacing: -1px;
    min-height: 28px;
  }
  .timer.warning { color: #FC8181; }

  .stop-btn {
    padding: 8px 24px; border-radius: 8px; border: none;
    background: #553C9A; color: white; font-size: 12px;
    font-weight: 600; cursor: pointer; transition: all 0.2s;
    display: none;
  }
  .stop-btn:hover { background: #6B46C1; }
  .stop-btn.visible { display: block; }

  .transcript {
    font-size: 12px; color: #A0AEC0; text-align: center;
    font-style: italic; max-width: 220px; line-height: 1.5;
    min-height: 16px;
  }

  @keyframes ringPulse {
    0%,100% { transform: scale(1); opacity: 0.6; }
    50% { transform: scale(1.15); opacity: 1; }
  }
  @keyframes ringPulseRed {
    0%,100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.2); opacity: 0.6; }
  }
</style>
</head>
<body>
<div class="container">
  <div class="brand">CORTEX VOICE</div>
  <div class="orb" id="orb">
    <div class="orb-ring"></div>
    <span id="orb-emoji">🎙️</span>
  </div>
  <div class="timer" id="timer"></div>
  <div class="status" id="status">Requesting microphone...</div>
  <button class="stop-btn" id="stop-btn" onclick="stopNow()">⬛ Send Now</button>
  <div class="transcript" id="transcript"></div>
</div>

<script>
let mediaRecorder = null;
let audioChunks = [];
let timerInterval = null;
let seconds = 0;
let maxSeconds = 10;
let autoStopTimeout = null;

// Resize window to compact popup
window.resizeTo(320, 300);

async function init() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    startRecording(stream);
  } catch (err) {
    setStatus('❌ Mic blocked — allow access in browser', 'error');
    document.getElementById('orb-emoji').textContent = '❌';
  }
}

function startRecording(stream) {
  audioChunks = [];
  const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
    ? 'audio/webm;codecs=opus' : 'audio/webm';

  mediaRecorder = new MediaRecorder(stream, { mimeType });
  mediaRecorder.ondataavailable = e => { if (e.data.size > 0) audioChunks.push(e.data); };
  mediaRecorder.onstop = () => sendAudio(stream, mimeType);
  mediaRecorder.start(200);

  // UI
  document.getElementById('orb').classList.add('recording');
  document.getElementById('orb-emoji').textContent = '🔴';
  document.getElementById('stop-btn').classList.add('visible');
  setStatus('Recording... speak now', 'recording');

  // Countdown timer
  seconds = 0;
  timerInterval = setInterval(() => {
    seconds++;
    const remaining = maxSeconds - seconds;
    document.getElementById('timer').textContent = remaining + 's';
    if (remaining <= 3) {
      document.getElementById('timer').className = 'timer warning';
    }
    if (seconds >= maxSeconds) {
      stopNow();
    }
  }, 1000);

  // Auto stop after maxSeconds
  autoStopTimeout = setTimeout(stopNow, maxSeconds * 1000);
}

function stopNow() {
  clearInterval(timerInterval);
  clearTimeout(autoStopTimeout);
  document.getElementById('timer').textContent = '';
  document.getElementById('stop-btn').classList.remove('visible');
  document.getElementById('orb').classList.remove('recording');
  document.getElementById('orb-emoji').textContent = '⟳';
  setStatus('Transcribing with Whisper AI...', 'sending');

  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
  }
}

async function sendAudio(stream, mimeType) {
  stream.getTracks().forEach(t => t.stop());
  const blob = new Blob(audioChunks, { type: mimeType });
  const reader = new FileReader();
  reader.onloadend = async () => {
    const base64 = reader.result.split(',')[1];
    try {
      const resp = await fetch('http://127.0.0.1:${port}/audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audio: base64, mimeType })
      });
      const data = await resp.json();
      if (data.transcript) {
        document.getElementById('orb').classList.add('done');
        document.getElementById('orb-emoji').textContent = '✅';
        setStatus('Sent to Cortex!', 'done');
        document.getElementById('transcript').textContent = '"' + data.transcript + '"';
        setTimeout(() => window.close(), 1800);
      } else {
        throw new Error(data.error || 'No transcript received');
      }
    } catch (err) {
      setStatus('Error: ' + err.message, 'error');
      document.getElementById('orb-emoji').textContent = '❌';
    }
  };
  reader.readAsDataURL(blob);
}

function setStatus(text, type) {
  const el = document.getElementById('status');
  el.textContent = text;
  el.className = 'status ' + (type || '');
}

// Auto-start immediately
window.addEventListener('load', init);
</script>
</body>
</html>`;
  }
}
