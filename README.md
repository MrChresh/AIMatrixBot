# Matrix Bot for Ollama MCP Bridge

This Matrix bot integrates with the [ollama-mcp-bridge](https://github.com/jonigl/ollama-mcp-bridge) to enable communication between Matrix and Ollama models using the MCP (Model Communication Protocol) standard. The bot uses **index.js** as its main entry point.


## Features

- Seamless integration with Ollama via MCP bridge
- May work directly with Ollama models (no bridge required)
- Simple environment configuration
- Supports Ollama models
- Matrix text commands
- Read text type files from attachments
- Read image type files from attachments
- Response streaming (will send every 1000 characters)
- Allowed users via allowed_users.json to prevent abuse
- Chat history per user
- Cancel command
- In development MCP-bridge available: [llamacppMCPBridge](https://github.com/MrChresh/llamacppMCPBridge)

## Prerequisites

1. [Ollama](https://ollama.com/) installed and running
2. [ollama-mcp-bridge](https://github.com/jonigl/ollama-mcp-bridge) (optional for bridge integration) || [llamacppMCPBridge](https://github.com/MrChresh/llamacppMCPBridge)

## Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/MrChresh/AIMatrixBot.git
   cd AIMatrixBot
   ```

2. Install dependencies:
   ```bash
   npm install  # or yarn install
   ```

3. Create a `.env` file in the root directory (see example below)

## Environment Configuration

### .env Example

```env
# Matrix Home Server
MATRIX_HOME_SERVER='https://matrix.chresh.de'

# Matrix Bot Token
MATRIX_TOKEN=''

# Matrix Bot User Id
MATRIX_USER_ID='@bot:matrix.chresh.de'

# Port to use (host IP is always '127.0.0.1')
OLLAMA_PORT=11000

# Ollama Model to use
OLLAMA_MODEL='qwen3.5:35b'

# Whether to enable the think parameter
OLLAMA_THINK=true

# Set default additional context
DEFAULT_CONTEXT=32000
```

## Usage

Start the Matrix bot:
```bash
node index.js
```
To enter a prompt:
```
$ai
```
To clear context/chat history:
```
$context
```
Experimental, to cancel request use:
```
$cancel
```

## Compatibility

This bot was developed specifically for the [ollama-mcp-bridge](https://github.com/jonigl/ollama-mcp-bridge), but it can also work directly with Ollama models. The host IP is always '127.0.0.1'.

## Need Help?
Contact me using Matrix: @chresh:matrix.chresh.de

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.