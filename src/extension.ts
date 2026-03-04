import * as vscode from 'vscode';
import { CortexPanel } from './ui/cortexPanel';
import { ContextRecovery } from './features/contextRecovery';
import { CodeExplainer } from './features/codeExplainer';
import { BoilerplateGenerator } from './features/boilerplateGenerator';

let statusBarItem: vscode.StatusBarItem;

export function activate(context: vscode.ExtensionContext) {
  console.log('Cortex AI is now active');

  // ── Status Bar ────────────────────────────────────────────────────────────
  statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 1000);
  statusBarItem.text = '$(sparkle) Cortex';
  statusBarItem.tooltip = 'Open Cortex AI Panel (Ctrl+Shift+A)';
  statusBarItem.command = 'cortex.openPanel';
  statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
  statusBarItem.show();
  context.subscriptions.push(statusBarItem);

  // ── Commands ──────────────────────────────────────────────────────────────

  // Open main panel
  context.subscriptions.push(
    vscode.commands.registerCommand('cortex.openPanel', () => {
      CortexPanel.createOrShow(context);
    })
  );

  // Context Recovery
  context.subscriptions.push(
    vscode.commands.registerCommand('cortex.recoverContext', async () => {
      CortexPanel.createOrShow(context);
      CortexPanel.postMessage({ type: 'setLoading', feature: 'context', message: 'Analyzing your last session...' });

      try {
        const recovery = new ContextRecovery();
        const briefing = await recovery.generateBriefing(context);
        CortexPanel.postMessage({ type: 'contextBriefing', data: briefing });
      } catch (err: any) {
        CortexPanel.postMessage({ type: 'error', feature: 'context', message: err.message });
        vscode.window.showErrorMessage(`Cortex: ${err.message}`);
      }
    })
  );

  // Explain Code
  context.subscriptions.push(
    vscode.commands.registerCommand('cortex.explainCode', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showWarningMessage('Cortex: Open a file first to explain code.');
        return;
      }

      const selection = editor.selection;
      const selectedText = editor.document.getText(selection.isEmpty ? undefined : selection);
      const fileName = editor.document.fileName.split(/[\\/]/).pop() || 'unknown';
      const language = editor.document.languageId;

      CortexPanel.createOrShow(context);
      CortexPanel.postMessage({ type: 'setLoading', feature: 'explain', message: 'Reading the code...' });

      try {
        const explainer = new CodeExplainer();
        const result = await explainer.explain(selectedText, fileName, language, context);
        CortexPanel.postMessage({ type: 'codeExplanation', data: result });
      } catch (err: any) {
        CortexPanel.postMessage({ type: 'error', feature: 'explain', message: err.message });
      }
    })
  );

  // Generate Boilerplate
  context.subscriptions.push(
    vscode.commands.registerCommand('cortex.generateBoilerplate', async () => {
      CortexPanel.createOrShow(context);
      CortexPanel.postMessage({ type: 'activateTab', tab: 'boilerplate' });
    })
  );

  // Voice Ask
  context.subscriptions.push(
    vscode.commands.registerCommand('cortex.voiceAsk', () => {
      CortexPanel.createOrShow(context);
      CortexPanel.postMessage({ type: 'activateTab', tab: 'voice' });
      CortexPanel.postMessage({ type: 'startVoice' });
    })
  );

  // ── Handle messages from Webview ──────────────────────────────────────────
  CortexPanel.onMessage(async (message: any) => {
    switch (message.type) {

      case 'recoverContext':
        vscode.commands.executeCommand('cortex.recoverContext');
        break;

      case 'explainCode':
        vscode.commands.executeCommand('cortex.explainCode');
        break;

      case 'generateBoilerplate': {
        try {
          const generator = new BoilerplateGenerator();
          const result = await generator.generate(message.prompt, message.language, context);
          CortexPanel.postMessage({ type: 'boilerplateResult', data: result });
        } catch (err: any) {
          CortexPanel.postMessage({ type: 'error', feature: 'boilerplate', message: err.message });
        }
        break;
      }

      case 'voiceQuery': {
        try {
          const explainer = new CodeExplainer();
          const result = await explainer.answerQuestion(message.query, context);
          CortexPanel.postMessage({ type: 'voiceAnswer', data: result });
        } catch (err: any) {
          CortexPanel.postMessage({ type: 'error', feature: 'voice', message: err.message });
        }
        break;
      }

      case 'insertCode': {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
          editor.edit(editBuilder => {
            editBuilder.insert(editor.selection.active, message.code);
          });
          vscode.window.showInformationMessage('Cortex: Code inserted into editor ✓');
        }
        break;
      }

      case 'copyCode': {
        vscode.env.clipboard.writeText(message.code);
        vscode.window.showInformationMessage('Cortex: Copied to clipboard ✓');
        break;
      }

      case 'checkApiKey': {
        const config = vscode.workspace.getConfiguration('cortex');
        const key = config.get<string>('geminiApiKey') || '';
        CortexPanel.postMessage({ type: 'apiKeyStatus', hasKey: key.length > 0 });
        break;
      }

      case 'saveApiKey': {
        const config = vscode.workspace.getConfiguration('cortex');
        await config.update('geminiApiKey', message.key, vscode.ConfigurationTarget.Global);
        CortexPanel.postMessage({ type: 'apiKeyStatus', hasKey: true });
        vscode.window.showInformationMessage('Cortex: API key saved successfully ✓');
        break;
      }
    }
  });

  // ── Auto Context Recovery ─────────────────────────────────────────────────
  const config = vscode.workspace.getConfiguration('cortex');
  if (config.get('autoRecover') && vscode.workspace.workspaceFolders) {
    setTimeout(async () => {
      try {
        const recovery = new ContextRecovery();
        const shouldShow = await recovery.shouldAutoRecover(context);
        if (shouldShow) {
          const action = await vscode.window.showInformationMessage(
            '🧠 Cortex: Welcome back! Ready to recover your last session.',
            'Show Briefing',
            'Dismiss'
          );
          if (action === 'Show Briefing') {
            vscode.commands.executeCommand('cortex.recoverContext');
          }
        }
      } catch (_) {
        // Silent fail on auto-recover
      }
    }, 3000);
  }
}

export function deactivate() {
  if (statusBarItem) { statusBarItem.dispose(); }
}