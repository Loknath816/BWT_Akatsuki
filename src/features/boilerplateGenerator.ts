import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import Groq from 'groq-sdk';

export interface BoilerplateResult {
  code: string;
  language: string;
  fileName: string;
  description: string;
  insertionPoint: string;
}

export class BoilerplateGenerator {

  private getApiKey(): string {
    const config = vscode.workspace.getConfiguration('cortex');
    const key = config.get<string>('groqApiKey') || '';
    if (!key) {
      throw new Error('No API key found. Please add your Groq API key in Cortex settings.');
    }
    return key;
  }

  async generate(
    prompt: string,
    requestedLanguage: string,
    context: vscode.ExtensionContext
  ): Promise<BoilerplateResult> {
    const apiKey = this.getApiKey();
    const groq = new Groq({ apiKey });

    const styleContext = await this.analyzeCodebaseStyle();
    const activeFile = vscode.window.activeTextEditor?.document.getText() || '';
    const activeFileName = vscode.window.activeTextEditor?.document.fileName.split(/[\\/]/).pop() || '';
    const language = requestedLanguage || vscode.window.activeTextEditor?.document.languageId || 'typescript';

    const fullPrompt = `You are Cortex AI — a smart boilerplate generator inside a developer's IDE.
Generate code that matches the EXACT style, patterns, and conventions of the developer's codebase.

CODEBASE STYLE:
${JSON.stringify(styleContext, null, 2)}

${activeFile ? `CURRENT FILE (${activeFileName}):\n\`\`\`${language}\n${activeFile.slice(0, 2000)}\n\`\`\`` : ''}

Generate boilerplate for: ${prompt}
Language: ${language}

Return ONLY valid JSON with no markdown, no backticks, no explanation — just raw JSON:
{
  "code": "the complete generated code as a string with \\n for newlines",
  "language": "${language}",
  "fileName": "suggested filename",
  "description": "brief description of what was generated",
  "insertionPoint": "cursor"
}`;

    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: fullPrompt }],
      max_tokens: 1500,
      temperature: 0.2,
    });

    const text = response.choices[0]?.message?.content || '{}';
    const clean = text.replace(/```json|```/g, '').trim();
    return JSON.parse(clean) as BoilerplateResult;
  }

  private async analyzeCodebaseStyle(): Promise<object> {
    const style: any = {
      language: 'unknown',
      hasTypeScript: false,
      framework: 'none',
    };

    try {
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders) { return style; }
      const rootPath = workspaceFolders[0].uri.fsPath;

      style.hasTypeScript = fs.existsSync(path.join(rootPath, 'tsconfig.json'));

      try {
        const pkg = JSON.parse(fs.readFileSync(path.join(rootPath, 'package.json'), 'utf8'));
        const deps = { ...pkg.dependencies, ...pkg.devDependencies };
        if (deps['react']) { style.framework = 'React'; }
        else if (deps['vue']) { style.framework = 'Vue'; }
        else if (deps['express']) { style.framework = 'Express'; }
        else if (deps['next']) { style.framework = 'Next.js'; }
        style.allDependencies = Object.keys(deps).slice(0, 15);
      } catch (_) {}

      const sampleFile = await this.getSampleSourceFile(rootPath);
      if (sampleFile) {
        style.sampleCode = sampleFile.slice(0, 1500);
        style.usesAsyncAwait = sampleFile.includes('async ');
        style.usesArrowFunctions = sampleFile.includes('=>');
      }
    } catch (_) {}

    return style;
  }

  private async getSampleSourceFile(rootPath: string): Promise<string | null> {
    const ignoreDirs = new Set(['node_modules', '.git', 'dist', 'out', '.next', 'build']);
    const extensions = ['.ts', '.tsx', '.js', '.jsx', '.py'];

    const find = (dir: string, depth = 0): string | null => {
      if (depth > 3) { return null; }
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          if (ignoreDirs.has(entry.name)) { continue; }
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            const result = find(fullPath, depth + 1);
            if (result) { return result; }
          } else if (extensions.some(ext => entry.name.endsWith(ext))) {
            try { return fs.readFileSync(fullPath, 'utf8'); } catch (_) {}
          }
        }
      } catch (_) {}
      return null;
    };

    return find(rootPath);
  }
}