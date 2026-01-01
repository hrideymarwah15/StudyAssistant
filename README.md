# StudyPal - AI-Powered Study Platform

A comprehensive AI-powered study platform with local AI capabilities. Features include intelligent Q&A, flashcard generation, study planning, material organization, and voice transcription - all powered by local AI models running on your laptop.

## ✨ Features

### 🤖 AI-Powered Features (Local)
- **Smart Q&A** - Ask questions and get answers from your study materials using RAG
- **Flashcard Generation** - Automatically create flashcards from any content
- **Study Plan Creation** - Get personalized study plans based on your materials
- **Voice Transcription** - Upload audio lectures for automatic transcription
- **Semantic Search** - Find relevant materials using AI-powered search

### 📚 Study Management
- **Material Organization** - Upload and organize PDFs, images, and notes with folders
- **JARVIS Assistant** - Voice-activated AI assistant for study help
- **Progress Tracking** - Dashboard with tasks, habits, and analytics
- **Calendar Integration** - Schedule study sessions and track deadlines

### 🎯 Productivity Tools
- **Pomodoro Timer** - Focus sessions with built-in timer
- **Habit Tracker** - Build and maintain study habits
- **Task Management** - Organize your study tasks with priorities
- **Streak Tracking** - Stay motivated with streak counters

## 🏗️ Architecture

### Frontend (Deployed on Netlify)
- **Framework:** Next.js 16 with App Router
- **Language:** TypeScript
- **Styling:** Tailwind CSS + shadcn/ui
- **Authentication:** Firebase Auth
- **Database:** Firebase Firestore

### Backend (Local AI)
- **Framework:** FastAPI (Python)
- **AI Models:** Ollama (Mixtral + Qwen)
- **Vector DB:** Qdrant
- **Speech-to-Text:** OpenAI Whisper
- **Embeddings:** sentence-transformers

## 🚀 Quick Start

### Option 1: Local Hosting (Recommended)

Run the full AI backend on your laptop and expose it via a secure tunnel.

**Prerequisites:**
- Docker (for Qdrant)
- Ollama (for AI models)
- Python 3.10+
- Ngrok OR Cloudflare Tunnel

**Start everything:**
```bash
./scripts/start_everything.sh
```

See [docs/local_hosting.md](docs/local_hosting.md) for detailed instructions.

### Option 2: Cloud Deployment

Deploy backend to Render/Railway and frontend to Netlify.

See [deployment docs](docs/QUICKSTART.md) for instructions.

### Prerequisites

- Node.js 18+ installed
- npm or pnpm package manager
- Firebase project (for authentication and database)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/hrideymarwah15/StudyPal.git
cd StudyPal
```

2. Install dependencies:
```bash
npm install --legacy-peer-deps
```

3. Configure Firebase:
   - Create a Firebase project at https://console.firebase.google.com/
   - Copy your Firebase config credentials
   - Update `.env.local` with your credentials:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_DATABASE_URL=your_database_url
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
app/
├── api/          # API routes
├── flashcards/   # Flashcard pages
├── groups/       # Study group pages
├── jobs/         # Job listings
├── login/        # Authentication pages
├── materials/    # Study materials
├── planner/      # Exam scheduler
├── signup/       # User registration
├── support/      # Mental health resources
├── layout.tsx    # Root layout
└── page.tsx      # Homepage

components/
├── ui/           # Reusable UI components
├── auth-provider.tsx
├── error-boundary.tsx
├── navigation.tsx
└── webgl-hero.tsx

lib/
├── hooks/        # Custom React hooks
├── api-client.ts
├── firebase.ts
└── utils.ts
```


## 📚 Documentation

- [Local Hosting Guide](docs/local_hosting.md) - Complete guide for local AI setup
- [Quick Reference](docs/QUICKSTART.md) - Command cheat sheet
- [Backend API](backend/README.md) - API documentation
- [Deployment Guide](docs/DEPLOYMENT.md) - Cloud deployment instructions

## 🎯 How It Works

### Local AI Setup

1. **Qdrant** stores your study materials as vectors for semantic search
2. **Ollama** runs AI models (Mixtral, Qwen) locally on your laptop
3. **Whisper** transcribes audio lectures to text
4. **FastAPI** provides REST API for the frontend
5. **Tunnel** (Ngrok/Cloudflare) exposes your local backend to the internet
6. **Netlify** hosts the frontend and connects to your local backend

### Data Flow

```
User → Frontend (Netlify) → Tunnel → Local Backend → AI Models
                                     ↓
                                  Qdrant (Vector DB)
```

## 🛠️ Available Scripts

### Backend Scripts
- `./scripts/run_local_backend.sh` - Start backend with all checks
- `./scripts/setup_tunnel.sh` - Create public HTTPS tunnel
- `./scripts/start_everything.sh` - One-command setup
- `./scripts/test_services.sh` - Verify all services

### Frontend Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## 🔧 Configuration

### Environment Variables

**Frontend (.env.local):**
```env
NEXT_PUBLIC_API_URL=https://your-tunnel-url
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
```

**Backend (backend/.env):**
```env
QDRANT_URL=http://localhost:6333
OLLAMA_BASE_URL=http://localhost:11434
FRONTEND_URL=https://assistantstudy.netlify.app
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Features in Detail

### Authentication
- Email/password authentication
- Form validation with Zod
- Protected routes
- Error handling

### Study Materials
- Upload PDFs, images, and notes
- AI-powered organization
- Search and filter
- Tag-based categorization

### Flashcards
- AI-generated from materials
- Interactive flip cards
- Progress tracking
- Custom deck creation

### Study Groups
- Real-time chat
- Group discovery
- Member management
- Subject-based matching

### Exam Planner
- AI-generated schedules
- Progress tracking
- Task management
- Deadline reminders

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.

## Acknowledgments

- Built with Next.js and React
- UI components from Radix UI
- Icons from Lucide React
- 3D graphics with Three.js