# StudyPal - AI-Powered Study Platform

A comprehensive study platform built with Next.js, React, and Firebase. Features include AI flashcard generation, study group management, exam planning, job search, and mental health support.

## Features

- 📚 **Smart Material Organization** - Upload and organize PDFs, images, and notes with AI-powered tagging
- ⚡ **AI Flashcard Generation** - Automatically generate flashcards from study materials
- 👥 **Study Groups** - Find and join collaborative study sessions with peers
- 📅 **Exam Prep Scheduler** - AI-generated personalized study schedules
- 💼 **Job Opportunities** - Discover internships and jobs tailored to your skills
- 🧠 **Mental Health Support** - Access resources and support when needed

## Tech Stack

- **Framework:** Next.js 16 with App Router
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** Radix UI
- **3D Graphics:** Three.js, React Three Fiber
- **Authentication:** Firebase Auth
- **Database:** Firebase Firestore
- **Storage:** Firebase Storage
- **Form Handling:** React Hook Form + Zod
- **Icons:** Lucide React

## Getting Started

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