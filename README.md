# studyos
## The Problem

Every AI study tool has the same flaw: you re-explain everything every session. Re-upload the syllabus. Re-describe the assessment criteria. Re-explain which module you're working on. It makes AI feel like a smart stranger rather than a study partner.

## What StudyOS Does

StudyOS is a **self-organising, context-aware study companion**. Set it up once per subject and it remembers everything for the rest of the term.

- **Brain dump your notes** during or after class, raw, messy, incomplete, and StudyOS structures them automatically
- **Syllabus-aware organisation**, notes are mapped to your actual course topics every time
- **Subject-intelligent outputs**, Spanish lessons get vocab lists; Physics gets key formulas; History gets argument maps
- **Revision mode**, conversational Q&A powered by your own notes, with citations back to specific lessons and syllabus sections
- **Learns how you study**, adapts note structure to your learning style over time

---

## Features

| Feature | Description |
|---|---|
| 🗓 Module Dashboard | All your subjects in one place with progress tracking and upcoming lessons |
| 📅 Auto Lesson Calendar | Set your term dates once, every lesson slot is generated automatically |
| 🧠 Brain Dump → Notes | Paste raw class notes, get back structured, syllabus-aligned notes |
| 📋 Contents Page | Auto-generated table of contents per module, updated after every lesson |
| 🔬 Revise Mode | Chat-based revision that cites which lesson and syllabus section it's drawing from |
| 📎 File Upload | Upload your syllabus as PDF, TXT, or MD, no copy-pasting required |
| ⚙️ Custom Instructions | Tell the AI how to behave per module in plain English |
| 🌙 Light / Dark Mode | Saved to your profile, persists across sessions |
| 🤷 Learning Style Inference | Select "I don't know yet", the app watches your habits and suggests your style after 3 lessons |

---

## Tech Stack

- **Frontend** — React (single-page app)
- **AI** — Claude Sonnet via Anthropic API (streaming responses)
- **Storage** — Persistent key-value storage (sessions survive page refresh)
- **Styling** — Pure CSS-in-JS with CSS custom properties for theming
- **Fonts** — Lora (headings) + Outfit (body) via Google Fonts

---

## Getting Started

### Prerequisites
- Node.js 18+
- An [Anthropic API key](https://console.anthropic.com)

### Installation

```bash
git clone https://github.com/yourusername/studyos.git
cd studyos
npm install
```

### Environment Setup

Create a `.env` file in the root:

```
ANTHROPIC_API_KEY=your_api_key_here
```

> ⚠️ Never commit your `.env` file. It's already in `.gitignore`.

### Run Locally

```bash
npm start
```

Opens at `http://localhost:3000`

### Deploy to Vercel

1. Push to GitHub
2. Import the repo at [vercel.com](https://vercel.com)
3. Add `ANTHROPIC_API_KEY` in the Environment Variables section
4. Deploy — done

---

## How It Works

### First Launch
On first open, StudyOS runs a one-time onboarding to capture your learning style (how you prefer to encounter new material, how you remember things best). This is asked **once** and applied to every module you create — you never have to repeat it.

### Module Setup
Create a module for each subject. Set the lesson day, term start/end dates, and paste or upload your syllabus. StudyOS generates every lesson slot for the full term and builds an AI context layer from your documents.

### Brain Dump Flow
Open a lesson → complete a quick check-in (how familiar was today? anything confusing?) → paste your raw notes → click Organise. The AI structures your notes according to your syllabus, your learning style, and your custom module instructions — and streams the result back in real time.

### Revision Mode
Open any module → Revise tab → start a session. The AI quizzes you using only your own notes and syllabus. Every answer cites its source: `(Lesson 4 March)` or `(Syllabus: Unit 2)`.

---

## Project Background

StudyOS was designed from a full Product Requirements Document (PRD), covering user research, feature prioritisation, data modelling, and UX flows — before a single line of code was written. The PRD lives in `/docs` if you want to see the thinking behind the product decisions.

---

## Roadmap

- [ ] Flashcard generation from notes
- [ ] Spaced repetition review system
- [ ] Export to Anki / Notion / PDF
- [ ] Mobile app
- [ ] Multi-user / study group mode
- [ ] Calendar integration (Google Calendar sync)

---

## License

MIT — free to use, modify, and build on.

---

*Built with [Claude](https://anthropic.com) · Designed for students who are tired of re-explaining themselves*
