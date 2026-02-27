# Blog-to-Image AI ✨

> **Visual Storytelling Engine** — Turn any blog post into a set of AI-generated editorial illustrations, ready for LinkedIn & Twitter.

---

## What it does

Paste a blog post → the app detects its sections → uses **Gemini** to summarize each section → generates a unique **16:9 illustration** for every section using the `nano banana 2` image model.

Each generated card shows:
- The section heading & AI-written summary
- A contextual illustration (cinematic or flat style)
- Download & Regenerate controls on hover

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + TypeScript (Vite) |
| Styling | Tailwind CSS v4 |
| Animations | Motion (Framer Motion v12) |
| AI — Text | Gemini `gemini-3-flash-preview` |
| AI — Images | Gemini `gemini-3.1-flash-image-preview` (**nano banana 2**) |
| Icons | Lucide React |

---

## Features

- 📝 **Smart section parser** — detects Markdown headings (`#`, `##`, etc.) automatically
- 🎨 **Two image styles** — toggle between **Cinematic** and **Flat Illustration**
- ⚡ **Lighting toggle** — cinematic vs. soft professional lighting
- 🔄 **Per-section regeneration** — re-roll a single image without touching the rest
- 💾 **One-click download** — saves each illustration as a `.png`
- 🔑 **AI Studio key selector** — prompts for a paid key if none is detected

---

## Run Locally

**Prerequisites:** Node.js 18+

```bash
# 1. Install dependencies
npm install

# 2. Set your Gemini API key
cp .env.example .env
# Edit .env and set GEMINI_API_KEY=your_key_here

# 3. Start the dev server (http://localhost:3000)
npm run dev
```

> **Note:** Image generation requires a paid Google Cloud project API key because it uses the `gemini-3.1-flash-image-preview` (**nano banana 2**) model.  
> Get one at [ai.google.dev](https://ai.google.dev/) or learn about [billing](https://ai.google.dev/gemini-api/docs/billing).

---

## Project Structure

```
src/
├── App.tsx          # Main UI — blog input, section grid, controls
├── types.ts         # BlogSection, GenerationConfig, ImageStyle types
├── index.css        # Global styles
└── services/
    └── gemini.ts    # summarizeSection() + generateIllustration()
```

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `GEMINI_API_KEY` | Your Google Gemini API key (required) |
| `APP_URL` | Deployment URL (injected automatically by AI Studio) |
