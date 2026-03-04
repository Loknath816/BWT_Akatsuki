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
    background: #0F1117;
    color: #E2E8F0;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    flex-direction: column;
    gap: 24px;
    padding: 32px;
  }
  .logo { font-size: 28px; font-weight: 800; color: #CF7B2E; letter-spacing: -1px; }
  .subtitle { font-size: 14px; color: #718096; }
  .orb {
    width: 120px; height: 120px; border-radius: 50%;
    background: radial-gradient(circle, rgba(168,85,247,0.4), rgba(168,85,247,0.05));
    border: 2px solid rgba(168,85,247,0.5);
    display: flex; align-items: center; justify-content: center;
    font-size: 44px; cursor: pointer;
    transition: all 0.3s;
    box-shadow: 0 0 30px rgba(168,85,247,0.2);
  }
  .orb:hover { transform: scale(1.05); box-shadow: 0 0 50px rgba(168,85,247,0.4); }
  .orb.recording {
    animation: pulse 1.2s ease-in-out infinite;
    border-color: #EF4444;
    box-shadow: 0 0 0 0 rgba(239,68,68,0.4);
  }
  .status {
    font-size: 15px; color: #A0AEC0; text-align: center;
    min-height: 24px; transition: all 0.3s;
  }
  .status.active { color: #EF4444; font-weight: 600; }
  .status.success { color: #48BB78; font-weight: 600; }
  .btn {
    padding: 12px 32px; border-radius: 10px; border: none;
    font-size: 14px; font-weight: 600; cursor: pointer;
    transition: all 0.2s;
  }
  .btn-record { background: #553C9A; color: white; }
  .btn-record:hover { background: #6B46C1; }
  .btn-stop { background: #C53030; color: white; display: none; }
  .btn-stop:hover { background: #9B2C2C; }
  .transcript-box {
    width: 100%; max-width: 400px;
    background: #1A202C; border: 1px solid #2D3748;
    border-radius: 10px; padding: 16px;
    font-size: 14px; color: #E2E8F0;
    min-height: 60px; display: none;
    line-height: 1.6;
  }
  .close-hint { font-size: 12px; color: #4A5568; text-align: center; }
  @keyframes pulse {
    0% { box-shadow: 0 0 0 0 rgba(239,68,68,0.6); }
    70% { box-shadow: 0 0 0 20px rgba(239,68,68,0); }
    100% { box-shadow: 0 0 0 0 rgba(239,68,68,0); }
  }
</style>
</head>
<body>
  <div>
    <div class="logo">🧠 CORTEX</div>
  </div>
  <div class="subtitle">Voice Assistant — Speak your question</div>

  <div class="orb" id="orb" onclick="toggleRecording()">🎙️</div>

  <div class="status" id="status">Click to start recording</div>

  <div style="display:flex;gap:12px">
    <button class="btn btn-record" id="btn-record" onclick="toggleRecording()">🎙️ Start Recording</button>
    <button class="btn btn-stop" id="btn-stop" onclick="stopRecording()">⬛ Stop & Send</button>
  </div>

  <div class="transcript-box" id="transcript-box"></div>
  <div class="close-hint">This tab will auto-close after sending. Switch back to VS Code.</div>

<script>
let mediaRecorder = null;
let audioChunks = [];
let isRecording = false;

function toggleRecording() {
  isRecording ? stopRecording() : startRecording();
}

async function startRecording() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioChunks = [];

    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus' : 'audio/webm';

    mediaRecorder = new MediaRecorder(stream, { mimeType });
    mediaRecorder.ondataavailable = e => { if (e.data.size > 0) audioChunks.push(e.data); };
    mediaRecorder.onstop = () => sendAudio(stream, mimeType);
    mediaRecorder.start(250);

    isRecording = true;
    document.getElementById('orb').classList.add('recording');
    document.getElementById('orb').textContent = '🔴';
    document.getElementById('status').textContent = '🔴 Recording... Click stop when done';
    document.getElementById('status').className = 'status active';
    document.getElementById('btn-record').style.display = 'none';
    document.getElementById('btn-stop').style.display = 'inline-block';
  } catch (err) {
    document.getElementById('status').textContent = '❌ Mic access denied — please allow microphone in browser';
    document.getElementById('status').className = 'status';
  }
}

function stopRecording() {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
  }
  isRecording = false;
  document.getElementById('orb').classList.remove('recording');
  document.getElementById('orb').textContent = '⟳';
  document.getElementById('status').textContent = '⟳ Sending to Whisper AI...';
  document.getElementById('btn-stop').style.display = 'none';
}

async function sendAudio(stream, mimeType) {
  stream.getTracks().forEach(t => t.stop());
  const blob = new Blob(audioChunks, { type: mimeType });
  const reader = new FileReader();
  reader.onloadend = async () => {
    const base64 = reader.result.split(',')[1];
    try {
      const resp = await fetch('http://127.0.0.1:${this.port}/audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audio: base64, mimeType })
      });
      const data = await resp.json();
      if (data.transcript) {
        document.getElementById('orb').textContent = '✅';
        document.getElementById('status').textContent = '✅ Sent to Cortex!';
        document.getElementById('status').className = 'status success';
        document.getElementById('transcript-box').textContent = '"' + data.transcript + '"';
        document.getElementById('transcript-box').style.display = 'block';
        document.getElementById('btn-record').style.display = 'inline-block';
        document.getElementById('btn-record').textContent = '🎙️ Record Again';
        setTimeout(() => window.close(), 3000);
      } else {
        throw new Error(data.error || 'No transcript');
      }
    } catch (err) {
      document.getElementById('status').textContent = '❌ Error: ' + err.message;
      document.getElementById('orb').textContent = '🎙️';
      document.getElementById('btn-record').style.display = 'inline-block';
    }
  };
  reader.readAsDataURL(blob);
}
</script>
</body>
</html>`;
  }
}