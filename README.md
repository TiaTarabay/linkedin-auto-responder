# LinkedIn Auto-Responder

An n8n automation on my own LinkedIn account. It accepts incoming connection requests and replies to direct messages with short, human-sounding answers written by an LLM.

Built by Tia Tarabay for the Primops developer test.

## How it works

```
LinkedIn ──► Unipile ──webhook──► n8n ──► Groq (Gemini as backup) ──► Unipile ──► LinkedIn
```

LinkedIn has no official API for messaging or invitations, so [Unipile](https://www.unipile.com/) connects my account and exposes it through a REST API and webhooks. [n8n](https://n8n.io/) Cloud runs two workflows.

### 1. Message replies (`workflows/linkedin-message-handler.json`)

| Step | What it does |
|---|---|
| Webhook | Receives a `message.new` event from Unipile the moment a message arrives |
| Filter message | Ignores my own messages, system events, deleted messages, other accounts, and duplicate deliveries |
| Wait 5 to 8 seconds | A short, human-like pause that also lets messages sent in a row arrive |
| Get conversation | Loads the latest 20 messages in the chat, bypassing Unipile's cache |
| Check conversation | Replies only to the newest message, so several messages in a row get one combined reply. Skips group chats and chats I'm handling myself, limits replies per chat, and builds the prompt |
| Groq reply | `openai/gpt-oss-120b` writes the answer as JSON: reply, language, spam flag |
| Gemini backup | Used if Groq fails or hits a rate limit |
| Prepare reply | Adds the greeting with the sender's real first name and an AI disclosure line on the first reply, in English, French, or Arabic. Blocks phone numbers, emails, and leaked instructions, and falls back to a polite default if the AI output is empty or unsafe |
| Send reply | Sends the message from my account |
| Record reply | Remembers what the bot sent, so follow-ups don't repeat the greeting and the bot never replies twice |

### 2. Accepting connection requests (`workflows/linkedin-invitation-acceptor.json`)

Unipile has no webhook for incoming invitations, so the workflow checks every 3 minutes, bypassing the cache. It accepts new requests one at a time and skips any sent before the bot went live, so old pending requests are left alone.

## Handling unusual messages

| Message | Behavior |
|---|---|
| Several in a row | One combined reply to the newest message |
| Another language | Replies in that language, with the greeting and disclosure translated |
| Very long | Each message is capped at 2,000 characters in the prompt |
| Nearly empty or emoji only | A brief reply asking what they'd like to talk about |
| Link | Says it can't open links and responds to the text |
| File or image | Says it can't open attachments and asks what it's about |
| Rude or spam | One short, neutral line, with no greeting |
| Question it can't know | Says it will check and get back, instead of guessing |
| Prompt injection | Treated as normal text and steered back to conversation |
| "Are you a bot?" | Says honestly that it's an automated assistant |

## Honesty and safety

- The first reply in each conversation ends with: "This reply was written by my AI assistant. I read every conversation personally."
- It never invents facts about me, shares contact details or salary expectations, or confirms interviews or start dates.
- It only replies. It never writes first, sends connection requests, or sends bulk messages.
- No API keys, login details, or other people's messages are stored in this repository.

## How to run it

1. Create a Unipile account, connect your LinkedIn account, and create an API key.
2. Create Groq and Google AI Studio API keys.
3. In n8n, create three **Header Auth** credentials:
   - `Unipile API Key`: name `X-API-KEY`
   - `Groq API Key`: name `Authorization`, value `Bearer <key>`
   - `Gemini API Key`: name `x-goog-api-key`
4. Import both files from `workflows/` and link the credentials.
5. Set your Unipile account ID in **Filter message** and **Config**, and the go-live time in **Config** (`acceptSentAfter`).
6. In Unipile, add a webhook for `message.new` pointing to the message workflow's Production URL.
7. Publish both workflows.

`prompts/system-prompt.md` is the system prompt. `src/` has the code from each Code node, for easier reading. `workflows/prompt-tester.json` runs 16 tricky test messages through the prompt.

## What it can't do yet

- **It can't read attachments, images, or links.** It says so instead of guessing.
- **Invitations are checked every 3 minutes**, because Unipile has no webhook for incoming requests, so acceptance takes up to 3 minutes.
- **Free-tier rate limits:** many messages in the same minute can hit Groq's limit. It then falls back to Gemini, then to a polite default message.
- **No alerts:** messages that need me personally are flagged in the workflow data, but I'm not notified yet.
- **Limited context:** it sees the last 12 messages of a conversation and doesn't keep long-term memory across chats.
- **It runs on hosted services** (Unipile and n8n Cloud), and automating a personal account goes against LinkedIn's terms, so activity is kept low.
