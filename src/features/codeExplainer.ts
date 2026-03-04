import * as vscode from 'vscode';
import { GoogleGenerativeAI } from '@google/generative-ai';

export interface CodeExplanation {
  summary: string;
  purpose: string;
  howItWorks: Array<{ step: number; description: string }>;
  dependencies: string[];
  potentialIssues: Array<{ severity: 'high' | 'medium' | 'low'; issue: string; suggestion: string }>;
  complexity: 'low' | 'medium' | 'high';
  relatedConcepts: string[];
}

export class CodeExplainer {

  private getApiKey(): string {
    const config = vscode.workspace.getConfiguration('cortex');
    const key = config.get<string>('geminiApiKey') || '';
    if (!key) {
      throw new Error('No API key found. Please add your Gemini API key in Cortex settings.');
    }
    return key;
  }

  async explain(
    code: string,
    fileName: string,
    language: string,
    context: vscode.ExtensionContext
  ): Promise<CodeExplanation> {
    const apiKey = this.getApiKey();
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const surroundingContext = await this.getSurroundingContext();

    const prompt = `You are Cortex AI — an expert code intelligence engine inside a developer's IDE.
Explain this code with deep technical insight.

FILE: ${fileName}
LANGUAGE: ${language}
${surroundingContext ? `FILE CONTEXT:\n${surroundingContext}\n` : ''}

CODE TO EXPLAIN:
\`\`\`${language}
${code}
\`\`\`

Return ONLY valid JSON with no markdown, no backticks, no explanation — just raw JSON:
{
  "summary": "One clear sentence of what this code does",
  "purpose": "WHY this code exists — its role in the system",
  "howItWorks": [
    { "step": 1, "description": "First thing that happens" },
    { "step": 2, "description": "Second thing" }
  ],
  "dependencies": ["list", "of", "key", "dependencies"],
  "potentialIssues": [
    { "severity": "high", "issue": "description", "suggestion": "how to fix" }
  ],
  "complexity": "low",
  "relatedConcepts": ["related", "patterns"]
}`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const clean = text.replace(/```json|```/g, '').trim();
    return JSON.parse(clean) as CodeExplanation;
  }

  async answerQuestion(question: string, context: vscode.ExtensionContext): Promise<string> {
    const apiKey = this.getApiKey();
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const openFilesContext = await this.getOpenFilesContext();
    const activeFile = vscode.window.activeTextEditor?.document.getText() || '';
    const activeFileName = vscode.window.activeTextEditor?.document.fileName.split(/[\\/]/).pop() || '';

    const prompt = `You are Cortex AI — a voice-enabled AI companion inside a developer's IDE.
Answer the developer's question about their codebase concisely and helpfully.

${activeFile ? `CURRENT FILE (${activeFileName}):\n\`\`\`\n${activeFile.slice(0, 3000)}\n\`\`\`` : ''}
${openFilesContext ? `\nOTHER OPEN FILES:\n${openFilesContext}` : ''}

DEVELOPER QUESTION: "${question}"

Respond in 2-4 sentences maximum. Be direct, specific, and actionable.`;

    const result = await model.generateContent(prompt);
    return result.response.text();
  }

  private async getSurroundingContext(): Promise<string> {
    try {
      const editor = vscode.window.activeTextEditor;
      if (!editor) { return ''; }
      return editor.document.getText().slice(0, 2000);
    } catch (_) { return ''; }
  }

  private async getOpenFilesContext(): Promise<string> {
    try {
      const contexts: string[] = [];
      for (const tabGroup of vscode.window.tabGroups.all) {
        for (const tab of tabGroup.tabs.slice(0, 3)) {
          const uri = (tab.input as any)?.uri;
          if (uri) {
            const doc = await vscode.workspace.openTextDocument(uri);
            const name = uri.fsPath.split(/[\\/]/).pop();
            contexts.push(`${name}:\n${doc.getText().slice(0, 500)}`);
          }
        }
      }
      return contexts.join('\n\n---\n\n');
    } catch (_) { return ''; }
  }
}
