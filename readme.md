<div align="center">

# SkillPet AI

**AI-powered learning platform with gamification, character companions, and structured course progression.**

![Next.js](https://img.shields.io/badge/Next.js-16.2-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38BDF8?logo=tailwindcss)
![Strapi](https://img.shields.io/badge/Strapi_v5-CMS-8E75FF?logo=strapi)
![License](https://img.shields.io/badge/license-MIT-green)
![PRs](https://img.shields.io/badge/PRs-welcome-brightgreen)

</div>

---

## Table of Contents

- [About](#about)
- [Architecture](#architecture)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [API Routes](#api-routes)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

---

## About

**SkillPet AI** is an educational platform combining structured courses, gamification, and AI companions for engaging programming and IT learning.

Users progress through chapters, answer questions, earn experience points and gems, unlock achievements, and compete on a leaderboard. Personalized pet companions accompany users throughout their learning journey.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        SkillPet AI                              │
├─────────────────────────┬───────────────────────────────────────┤
│   Frontend (Next.js)    │   Backend (Strapi v5 CMS)             │
├─────────────────────────┼───────────────────────────────────────┤
│  • User Interface       │  • Content Management                 │
│  • Auth (InsForge)      │  • REST API                           │
│  • Gamification Logic   │  • Database (PostgreSQL / SQLite)     │
│  • Progress Tracking    │  • Roles & Permissions                │
│  • Dashboard & Charts   │  • File Uploads (Cloudinary)          │
└─────────────────────────┴───────────────────────────────────────┘
```

- Frontend communicates with Strapi API via REST requests
- Authentication via JWT tokens (InsForge — email/password + Google OAuth)
- Strapi serves as the data source for courses, chapters, users, and progress

---

## Features

| Feature | Description |
|---------|-------------|
| Structured courses | Chapter-based learning with theory, quizzes, and practice |
| Pet companions | 8 unique characters that accompany learning |
| Streak system | Daily activity tracking with rewards |
| Gems & XP | Earn gems for correct answers and level up |
| Leaderboard | Compete with other students by XP |
| Achievements | 19 achievements across multiple categories |
| Progress dashboard | Visual tracking of weekly goals and activity |
| Subscription tiers | Free, Freemium, and Pro access levels |
| Dark theme | Modern dark UI built with Tailwind CSS |

---

## Tech Stack

### Frontend

| Technology | Version |
|------------|---------|
| Next.js | 16.2 |
| React | 19 |
| TypeScript | 5 |
| Tailwind CSS | 4 |
| Lucide React | Icons |
| React Context | State management |
| InsForge SDK | Authentication |

### Backend

| Technology | Version |
|------------|---------|
| Strapi | 5.50 |
| PostgreSQL | Production |
| SQLite | Development |
| Cloudinary | File uploads |

---

## Getting Started

### Prerequisites

- Node.js **18+** (recommended: 20)
- npm or yarn
- Strapi v5 instance (local or hosted)

### 1. Clone and install

```bash
git clone https://github.com/your-username/skillpet-ai-full.git
cd skillpet-ai-full
```

### 2. Setup Frontend

```bash
cd skillpet-ai_frontend
npm install
cp .env.example .env
# Edit .env with your values
npm run dev
# Open http://localhost:3000
```

### 3. Setup Backend (Strapi)

```bash
cd ../skillpet-ai_backend
npm install
cp .env.example .env
# Edit .env with your values
npm run develop
# Open http://localhost:1337/admin
```

---

## Project Structure

### Frontend (`skillpet-ai_frontend/`)

```
app/
├── api/
│   ├── auth/
│   │   ├── select-character/      # Character selection
│   │   ├── update-user-stats/     # Streaks, gems, XP
│   │   └── user-profile/          # Profile CRUD
│   ├── chapters/                  # Chapter data
│   ├── chapter-content-blocks/    # Lesson content blocks
│   ├── courses/                   # Course catalog
│   ├── leaderboard/               # XP leaderboard
│   ├── subscriptions/             # Subscription management
│   ├── user-course-program/       # Enrollment tracking
│   └── user-progress/             # Chapter progress
├── auth/                          # Auth pages
├── courses/[slug]/                # Course detail page
├── dashboard/
│   ├── achievements/              # Achievements & leaderboard
│   ├── billing/                   # Subscription management
│   ├── courses/                   # Enrolled courses
│   ├── explore-courses/           # Course catalog
│   ├── profile/                   # Profile & character
│   ├── progress/                  # Stats & goals
│   └── settings/                  # Settings (placeholder)
├── learn/[chapterId]/             # Learning interface
├── signin/                        # Sign in page
├── signup/                        # Sign up page
├── character-picker/              # Character selection
└── page.tsx                       # Landing / redirect

components/
├── chapter-content/               # Content block renderers
├── learning/                      # Learning UI components
├── dashboard-sidebar.tsx          # Navigation sidebar
└── ...

lib/
├── api-auth.ts                    # JWT verification (server)
├── api-client.ts                  # Auth fetch wrapper (client)
├── auth-context.tsx               # Auth state management
├── course-access.ts               # Access control helpers
├── characters.ts                  # Character definitions
├── strapi.ts                      # Strapi API helpers
└── utils.ts                       # Utilities
```

### Backend (`skillpet-ai_backend/`)

```
src/
├── api/
│   ├── app-user/                  # User content type
│   ├── chapter-content-block/     # Content blocks
│   ├── chapter/                   # Chapters
│   ├── course/                    # Courses
│   ├── user-course-program/       # Enrollments
│   └── user-progress/             # User progress
├── admin/                         # Admin panel settings
├── extensions/                    # Strapi extensions
└── index.ts                       # Entry point

config/
├── admin.js                       # Admin settings
├── database.js                    # Database config
├── middlewares.js                 # CORS & middleware
└── server.js                      # Server settings
```

---

## API Routes

### Frontend (Next.js API Routes)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/select-character` | Yes | Character selection |
| POST | `/api/auth/update-user-stats` | Yes | Update streaks/gems |
| GET/POST | `/api/auth/user-profile` | Yes | Profile CRUD |
| GET/POST | `/api/user-progress` | Yes | Chapter progress |
| GET/POST | `/api/user-course-program` | Yes | Course enrollments |
| GET/POST/DELETE | `/api/subscriptions` | Yes | Subscription management |
| GET | `/api/courses` | No | Course catalog |
| GET | `/api/chapters` | No | Chapter data |
| GET | `/api/leaderboard` | No | XP leaderboard |

### Strapi API (Backend)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/local` | Local authentication |
| GET | `/api/courses` | Get courses |
| GET | `/api/courses/:slug` | Get course by slug |
| GET | `/api/chapters` | Get chapters |
| GET | `/api/users/me` | Get user profile |
| PUT | `/api/users/:id` | Update user |

---

## Environment Variables

### Frontend (`.env`)

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_STRAPI_URL` | Strapi instance URL | Yes |
| `STRAPI_API_TOKEN` | Strapi API token | Yes |
| `NEXT_PUBLIC_INSFORGE_BASE_URL` | InsForge base URL | Yes |
| `NEXT_PUBLIC_INSFORGE_ANON_KEY` | InsForge anonymous key | Yes |

### Backend (`.env`)

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_CLIENT` | Database client (postgres/sqlite) | Yes |
| `DATABASE_HOST` | Database host | Yes |
| `DATABASE_PORT` | Database port | Yes |
| `DATABASE_NAME` | Database name | Yes |
| `DATABASE_USERNAME` | Database username | Yes |
| `DATABASE_PASSWORD` | Database password | Yes |
| `JWT_SECRET` | JWT secret key | Yes |
| `APP_KEYS` | Application keys | Yes |
| `API_TOKEN_SALT` | API token salt | Yes |
| `ADMIN_JWT_SECRET` | Admin JWT secret | Yes |
| `TRANSFER_TOKEN_SALT` | Transfer token salt | Yes |

---

## Deployment

### Frontend (Vercel)

```bash
cd skillpet-ai_frontend
npm run build
# Deploy via Vercel CLI or GitHub Integration
```

### Backend (Strapi Cloud / Docker)

```bash
cd skillpet-ai_backend
npm run build
npm run start
```

### Docker

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_USER: ${DB_USER}
      POSTGRES_DB: ${DB_NAME}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  backend:
    build: ./skillpet-ai_backend
    ports:
      - "1337:1337"
    environment:
      - DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/${DB_NAME}
    depends_on:
      - postgres

  frontend:
    build: ./skillpet-ai_frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_STRAPI_URL=http://backend:1337
    depends_on:
      - backend

volumes:
  postgres_data:
```

---

## Contributing

Contributions are welcome!

1. **Fork** the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a **Pull Request**

### Guidelines

- Follow TypeScript code style
- Add comments for complex parts
- Update documentation when changing API
- Write clear commit messages

---

## License

This project is licensed under the **MIT License**. See [LICENSE](LICENSE) for details.

---

<div align="center">

**Made with care for learners worldwide**

</div>
