# LLM Comparison Tool

A Next.js web application that sends the same question to four major AI providers (OpenAI, Anthropic, Google Gemini, and Mistral) in parallel and displays their responses side-by-side for easy comparison.

## Features

- **Parallel API Calls**: Sends requests to all four providers simultaneously for fast results
- **Timeout Protection**: 25-second timeout prevents hanging requests
- **Error Handling**: Graceful error handling with detailed error messages
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Real-time Metrics**: Shows response latency and finish reasons
- **Secure**: API keys are kept server-side only, never exposed to the client

## Supported Providers

- **OpenAI**: GPT-4o-mini
- **Anthropic**: Claude 3.5 Sonnet
- **Google Gemini**: Gemini 2.0 Flash Experimental
- **Mistral**: Mistral Large Latest

## Setup

### 1. Clone and Install

```bash
git clone <repository-url>
cd llm-compare
npm install
```

### 2. Environment Variables

Copy the example environment file and add your API keys:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your API keys:

```env
# Get your API keys from the respective providers:

# OpenAI API Key - https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-your-openai-key-here

# Anthropic API Key - https://console.anthropic.com/
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key-here

# Google Gemini API Key - https://aistudio.google.com/app/apikey
GEMINI_API_KEY=your-gemini-key-here

# Mistral API Key - https://console.mistral.ai/
MISTRAL_API_KEY=your-mistral-key-here
```

### 3. API Key Setup Instructions

#### OpenAI
1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Sign in or create an account
3. Click "Create new secret key"
4. Copy the key (starts with `sk-`)

#### Anthropic
1. Go to [Anthropic Console](https://console.anthropic.com/)
2. Sign in or create an account
3. Navigate to API Keys
4. Create a new key (starts with `sk-ant-`)

#### Google Gemini
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated key

#### Mistral
1. Go to [Mistral Console](https://console.mistral.ai/)
2. Sign in or create an account
3. Navigate to API Keys
4. Create a new key

## Running the Application

### Development

```bash
npm run dev
```

The application will be available at [http://localhost:54572](http://localhost:54572)

### Production

```bash
npm run build
npm run start
```

### Other Commands

```bash
# Lint the code
npm run lint

# Type check
npx tsc --noEmit

# Run tests (placeholder)
npm run test
```

## Usage

1. Open the application in your browser
2. Enter your question in the text area
3. Click "Ask All Providers" or press Enter
4. Wait for responses from all providers (up to 25 seconds)
5. Compare the responses side-by-side

## Changing Models

To change the AI models used, edit the `MODELS` constant in `app/api/ask/route.ts`:

```typescript
const MODELS = {
  openai: "gpt-4o-mini",           // Change to gpt-4, gpt-3.5-turbo, etc.
  anthropic: "claude-3-5-sonnet-20241022", // Change to claude-3-opus-20240229, etc.
  gemini: "gemini-2.0-flash-exp",  // Change to gemini-pro, gemini-pro-vision, etc.
  mistral: "mistral-large-latest", // Change to mistral-medium, mistral-small, etc.
} as const;
```

## API Reference

### POST /api/ask

Send a question to all AI providers.

**Request Body:**
```json
{
  "question": "What is the capital of France?"
}
```

**Response:**
```json
{
  "question": "What is the capital of France?",
  "results": [
    {
      "provider": "openai",
      "ok": true,
      "text": "The capital of France is Paris.",
      "latencyMs": 1250,
      "finishReason": "stop"
    },
    {
      "provider": "anthropic",
      "ok": true,
      "text": "Paris is the capital city of France.",
      "latencyMs": 1100,
      "finishReason": "end_turn"
    },
    // ... other providers
  ]
}
```

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to [Vercel](https://vercel.com)
3. Add your environment variables in the Vercel dashboard
4. Deploy

### Other Platforms

The application can be deployed to any platform that supports Next.js:

- **Netlify**: Use the Next.js build command
- **Railway**: Connect your GitHub repository
- **DigitalOcean App Platform**: Use the Next.js template
- **AWS Amplify**: Connect your repository and configure build settings

Make sure to set the environment variables on your chosen platform.

## Architecture

- **Frontend**: React with TypeScript, Tailwind CSS for styling
- **Backend**: Next.js API routes with server-side API key management
- **Error Handling**: Promise.allSettled for graceful failure handling
- **Timeout Management**: Custom timeout wrapper prevents hanging requests
- **Type Safety**: Full TypeScript coverage with Zod validation

## Security

- API keys are stored server-side only and never exposed to the client
- Input validation using Zod schemas
- CORS headers configured for iframe compatibility
- No sensitive data logged or exposed in error messages

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Troubleshooting

### Common Issues

1. **"Missing API keys" error**: Make sure all four API keys are set in `.env.local`
2. **Timeout errors**: Some providers may be slower; this is normal and handled gracefully
3. **Rate limiting**: If you hit rate limits, wait a few minutes before trying again
4. **CORS errors**: Make sure you're accessing the app through the correct URL

### Getting Help

- Check the browser console for detailed error messages
- Verify your API keys are valid and have sufficient credits
- Ensure you're using the correct model names for each provider

## Roadmap

Future enhancements could include:

- [ ] Provider toggle switches (enable/disable specific providers)
- [ ] Custom model selection per provider
- [ ] Response export (Markdown, JSON)
- [ ] Usage/cost tracking
- [ ] Streaming responses
- [ ] Response comparison metrics
- [ ] Custom system prompts
- [ ] Response history
