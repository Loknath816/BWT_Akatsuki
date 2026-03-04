import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { GoogleGenerativeAI } from '@google/generative-ai';

export interface ContextBriefing {
  summary: string;
  lastActiveFile: string;
  whatYouWereDoing: string;
  whereYouStopped: string;
  nextSteps: Array<{ priority: number; action: string; effort: string }>;
  recentFiles: Array<{ name: string; status: string; changes: number }>;
  confidence: number;
  sessionGap: string;
}

export class ContextRecovery {

  private getApiKey(): string {
    const config = vscode.workspace.getConfiguration('cortex');
    const key = config.get<string>('geminiApiKey') || '';
    if (!key) {
      throw new Error('No API key found. Please add your Gemini API key in Cortex settings.');
    }
    return key;
  }

  async shouldAutoRecover(context: vscode.ExtensionContext): Promise<boolean> {
    const lastSessionKey = 'cortex.lastSessionTime';
    const lastSession = context.globalState.get<number>(lastSessionKey, 0);
    const now = Date.now();
    const gapMinutes = (now - lastSession) / 1000 / 60;
    await context.globalState.update(lastSessionKey, now);
    return gapMinutes > 30 && !!vscode.workspace.workspaceFolders;
  }

  async generateBriefing(context: vscode.ExtensionContext): Promise<ContextBriefing> {
    const apiKey = this.getApiKey();
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const workspaceInfo = await this.gatherWorkspaceInfo();

    const prompt = `You are Cortex AI — a developer context recovery engine built into their IDE.
Analyze this developer's workspace and generate a precise, actionable re-entry briefing.

WORKSPACE DATA:
${JSON.stringify(workspaceInfo, null, 2)}

Return ONLY valid JSON with no markdown, no backticks, no explanation — just raw JSON:
{
  "summary": "2-3 sentence briefing in second person (You were...)",
  "lastActiveFile": "most recently modified filename",
  "whatYouWereDoing": "specific task the developer was working on",
  "whereYouStopped": "specific point where work likely stopped",
  "nextSteps": [
    { "priority": 1, "action": "specific actionable next step", "effort": "5min" },
    { "priority": 2, "action": "second step", "effort": "15min" },
    { "priority": 3, "action": "third step", "effort": "30min" }
  ],
  "recentFiles": [
    { "name": "filename.ts", "status": "modified", "changes": 12 }
  ],
  "confidence": 87,
  "sessionGap": "2 hours ago"
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const clean = text.replace(/```json|```/g, '').trim();
    return JSON.parse(clean) as ContextBriefing;
  }

  private async gatherWorkspaceInfo(): Promise<object> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) { return {}; }

    const rootPath = workspaceFolders[0].uri.fsPath;
    const info: any = {
      projectName: path.basename(rootPath),
      openFiles: [],
      recentFiles: [],
      projectType: 'unknown',
    };

    info.openFiles = vscode.window.tabGroups.all
      .flatMap(g => g.tabs)
      .map(tab => (tab.input as any)?.uri?.fsPath?.split(/[\\/]/).pop())
      .filter(Boolean);

    try {
      const pkgPath = path.join(rootPath, 'package.json');
      if (fs.existsSync(pkgPath)) {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        info.projectType = 'Node.js';
        info.projectName = pkg.name || info.projectName;
        info.dependencies = Object.keys(pkg.dependencies || {}).slice(0, 10);
        info.scripts = Object.keys(pkg.scripts || {});
      }
    } catch (_) {}

    try {
      info.recentFiles = this.getRecentFiles(rootPath, 24);
    } catch (_) {}

    try {
      const gitLog = await this.getGitLog(rootPath);
      info.recentCommits = gitLog;
    } catch (_) {}

    return info;
  }

  private getRecentFiles(rootPath: string, hoursBack: number): Array<object> {
    const results: Array<object> = [];
    const cutoff = Date.now() - hoursBack * 60 * 60 * 1000;
    const ignoreDirs = new Set(['node_modules', '.git', 'dist', 'out', '.next', 'build']);

    const walk = (dir: string, depth = 0) => {
      if (depth > 3) { return; }
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          if (ignoreDirs.has(entry.name)) { continue; }
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            walk(fullPath, depth + 1);
          } else {
            try {
              const stat = fs.statSync(fullPath);
              if (stat.mtimeMs > cutoff) {
                results.push({
                  name: entry.name,
                  path: fullPath.replace(rootPath, ''),
                  modifiedAt: new Date(stat.mtimeMs).toISOString(),
                  size: stat.size
                });
              }
            } catch (_) {}
          }
        }
      } catch (_) {}
    };

    walk(rootPath);
    return results
      .sort((a: any, b: any) => new Date(b.modifiedAt).getTime() - new Date(a.modifiedAt).getTime())
      .slice(0, 15);
  }

  private async getGitLog(rootPath: string): Promise<Array<object>> {
    return new Promise((resolve) => {
      const { exec } = require('child_process');
      exec(
        'git log --oneline -10 --pretty=format:"%h|%s|%ar|%an"',
        { cwd: rootPath, timeout: 3000 },
        (err: any, stdout: string) => {
          if (err) { resolve([]); return; }
          const commits = stdout.trim().split('\n').map(line => {
            const [hash, message, time, author] = line.split('|');
            return { hash, message, time, author };
          });
          resolve(commits);
        }
      );
    });
  }
}
