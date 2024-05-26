import * as vscode from 'vscode';
import axios from 'axios';

export function activate(context: vscode.ExtensionContext) {
  console.log('AI Chat Extension activated');
  console.log('Congratulations, your extension "vs-ext" is now active!');

  const provider = new AiChatViewProvider(context);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('aiChatView', provider)
  );
}

class AiChatViewProvider implements vscode.WebviewViewProvider {
  constructor(private readonly context: vscode.ExtensionContext) {}

  public resolveWebviewView(webviewView: vscode.WebviewView) {
    webviewView.webview.options = {
      enableScripts: true
    };

    webviewView.webview.html = getWebviewContent();

    webviewView.webview.onDidReceiveMessage(
      async (message) => {
        const { apiKey, prompt } = message;
        if (!apiKey) {
          vscode.window.showErrorMessage('Please provide an OpenAI API key.');
          return;
        }

        try {
          const response = await axios.post('https://api.openai.com/v1/completions', {
            model: 'gpt-3.5-turbo-instruct',
            prompt: prompt,
            max_tokens: 100,
            temperature: 0.7
          }, {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json'
            }
          });

          const completion = response.data.choices[0].text;
          webviewView.webview.postMessage({ type: 'response', text: completion });
        } catch (error: any) {
          console.error('Error communicating with OpenAI API:', error);
          if (error.response) {
            console.error('Response data:', error.response.data);
            vscode.window.showErrorMessage(`OpenAI API Error: ${error.response.data.error.message}`);
          } else {
            vscode.window.showErrorMessage('Failed to communicate with OpenAI API.');
          }
        }
      },
      undefined,
      this.context.subscriptions
    );
  }
}

function getWebviewContent() {
	return `
	  <!DOCTYPE html>
	  <html lang="en">
	  <head>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<title>AI Chat</title>
		<style>
		  body {
			font-family: Arial, sans-serif;
			padding: 0;
			margin: 0;
			height: 100vh;
			display: flex;
			flex-direction: column;
		  }
		  .chat-container {
			flex-grow: 1;
			display: flex;
			flex-direction: column;
			padding: 20px;
			overflow: auto;
		  }
		  input, textarea {
			width: 100%;
			padding: 10px;
			margin: 10px 0;
			box-sizing: border-box;
		  }
		  button {
			padding: 10px 20px;
			background-color: #007ACC;
			color: white;
			border: none;
			cursor: pointer;
			align-self: flex-end;
		  }
		  .response {
			margin-top: 20px;
			white-space: pre-wrap;
			word-wrap: break-word;
			overflow-wrap: break-word;
			max-width: 100%;
		  }
		  .response-container {
			max-width: 800px;
		  }
		</style>
	  </head>
	  <body>
		<div class="chat-container">
		  <h1>AI Chat</h1>
		  <form id="aiChatForm">
			<label for="apiKey">API Key:</label>
			<input type="text" id="apiKey" name="apiKey" required>
			<label for="prompt">Prompt:</label>
			<textarea id="prompt" name="prompt" rows="4" required></textarea>
			<button type="submit">Send</button>
		  </form>
		  <div class="response-container">
			<h2>Answer:</h2>
			<pre class="response" id="answer"></pre>
		  </div>
		</div>
		<script>
		  const vscode = acquireVsCodeApi();
		  const answerElement = document.getElementById('answer');
  
		  document.getElementById('aiChatForm').addEventListener('submit', (e) => {
			e.preventDefault();
			const apiKey = document.getElementById('apiKey').value;
			const prompt = document.getElementById('prompt').value;
			vscode.postMessage({ apiKey, prompt });
		  });
  
		  window.addEventListener('message', event => {
			const message = event.data;
			if (message.type === 'response') {
			  answerElement.innerText += message.text;
			}
		  });
		</script>
	  </body>
	  </html>
	`;
  }
export function deactivate() {}