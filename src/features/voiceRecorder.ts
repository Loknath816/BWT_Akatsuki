import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { exec } from 'child_process';
import Groq from 'groq-sdk';

export class VoiceRecorder {

  private recordingProcess: any = null;
  private tempFile: string = '';

  private getApiKey(context: vscode.ExtensionContext): string {
    const config = vscode.workspace.getConfiguration('cortex');
    const key = config.get<string>('groqApiKey') || '';
    if (!key) { throw new Error('No Groq API key found. Please add it in Cortex settings.'); }
    return key;
  }

  // Start recording using PowerShell on Windows
  async startRecording(): Promise<void> {
    this.tempFile = path.join(os.tmpdir(), `cortex_${Date.now()}.wav`);

    return new Promise((resolve, reject) => {
      // PowerShell script to record audio using Windows built-in APIs
      const psScript = `
        Add-Type -AssemblyName System.Runtime.WindowsRuntime
        [Windows.Media.Capture.MediaCapture,Windows.Media.Capture,ContentType=WindowsRuntime] | Out-Null
        Add-Type -Path "C:\\Windows\\System32\\SoundRecorder.exe" -ErrorAction SilentlyContinue

        # Use ffmpeg if available
        $ffmpeg = Get-Command ffmpeg -ErrorAction SilentlyContinue
        if ($ffmpeg) {
          Start-Process ffmpeg -ArgumentList "-f dshow -i audio=\\"@device_cm_{33D9A762-90C8-11D0-BD43-00A0C911CE86}\\\\wave_{default}\\" -t 10 \\"${this.tempFile.replace(/\\/g, '\\\\')}\\"" -NoNewWindow -Wait
        }
      `.trim();

      // Simpler approach: use PowerShell with SoundRecorder
      const cmd = `powershell -Command "& {
        Add-Type -AssemblyName System.Speech;
        $r = New-Object System.Speech.Recognition.SpeechRecognitionEngine;
        $r.SetInputToDefaultAudioDevice();
        $g = New-Object System.Speech.Recognition.DictationGrammar;
        $r.LoadGrammar($g);
        $result = $r.Recognize([System.TimeSpan]::FromSeconds(8));
        if ($result -ne $null) { Write-Output $result.Text } else { Write-Output '' }
      }"`;

      this.recordingProcess = exec(cmd, { timeout: 12000 }, (err, stdout, stderr) => {
        if (err && !stdout) {
          reject(new Error('Could not start recording. Make sure microphone is connected.'));
          return;
        }
        // Store result in temp file as text for now
        const text = stdout.trim();
        fs.writeFileSync(this.tempFile + '.txt', text);
        resolve();
      });
    });
  }

  async stopAndTranscribe(context: vscode.ExtensionContext): Promise<string> {
    // If we used PowerShell speech recognition, read the text directly
    const txtFile = this.tempFile + '.txt';
    if (fs.existsSync(txtFile)) {
      const text = fs.readFileSync(txtFile, 'utf8').trim();
      try { fs.unlinkSync(txtFile); } catch (_) {}
      if (text) { return text; }
    }

    // If we have a WAV file, use Groq Whisper
    if (fs.existsSync(this.tempFile)) {
      return await this.transcribeFile(this.tempFile, context);
    }

    throw new Error('No audio captured. Please try again.');
  }

  async transcribeFile(audioFilePath: string, context: vscode.ExtensionContext): Promise<string> {
    const apiKey = this.getApiKey(context);
    const groq = new Groq({ apiKey });

    try {
      const transcription = await groq.audio.transcriptions.create({
        file: fs.createReadStream(audioFilePath),
        model: 'whisper-large-v3-turbo',
        language: 'en',
        response_format: 'json',
      });
      return transcription.text || '';
    } finally {
      try { fs.unlinkSync(audioFilePath); } catch (_) {}
    }
  }

  async transcribeBase64(audioBase64: string, mimeType: string, context: vscode.ExtensionContext): Promise<string> {
    const apiKey = this.getApiKey(context);
    const groq = new Groq({ apiKey });

    const ext = mimeType.includes('webm') ? 'webm' : mimeType.includes('mp4') ? 'mp4' : 'wav';
    const tempFile = path.join(os.tmpdir(), `cortex_voice_${Date.now()}.${ext}`);
    const buffer = Buffer.from(audioBase64, 'base64');
    fs.writeFileSync(tempFile, buffer);

    try {
      const transcription = await groq.audio.transcriptions.create({
        file: fs.createReadStream(tempFile),
        model: 'whisper-large-v3-turbo',
        language: 'en',
        response_format: 'json',
      });
      return transcription.text || '';
    } finally {
      try { fs.unlinkSync(tempFile); } catch (_) {}
    }
  }
}