# UNIK - KBL All-Star 2026 Tour

A premium travel tour website for Filipino basketball fans to experience the KBL All-Star 2026 in Korea.

## 🏀 Project Overview

- **Event**: KBL All-Star 2026 (January 15-18, 2026)
- **Target**: Filipino basketball fans
- **Purpose**: Tour package promotion & registration

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, Tailwind CSS
- **Backend**: Firebase (Firestore, Auth, Functions)
- **Analytics**: Firebase Analytics
- **Hosting**: Vercel
- **Package Manager**: pnpm

## 📁 Project Structure

```
unik/
├── frontend/
│   ├── web/          # Main website (unik.ph)
│   └── admin/        # Admin dashboard (admin.unik.ph)
├── backend/
│   └── functions/    # Firebase Functions
├── shared/           # Shared types & configs
└── package.json      # Root workspace config
```

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- pnpm 8+

### Installation

```bash
# Install dependencies
pnpm install

# Run web development server
pnpm dev:web

# Run admin development server
pnpm dev:admin
```

### Environment Variables

Create `.env.local` in `frontend/web/` and `frontend/admin/`:

```env
# Firebase (already configured in shared/firebase/config.ts)
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
```

## 📱 Pages

### Main Website (unik.ph)
- `/` - Home
- `/players` - Filipino player profiles
- `/tour` - Tour package details
- `/info` - Travel information & FAQ
- `/register` - Registration form
- `/contact` - Contact page

### Admin Dashboard (admin.unik.ph)
- `/` - Dashboard
- `/registrations` - Registration management
- `/players` - Player content management
- `/tours` - Tour package management
- `/analytics` - Statistics & reports

## 🔐 Admin Access

Admin access is restricted to `@cebudirectclub.com` email domain via Google OAuth.

## 📧 Contact

- Email: ticket@cebudirectclub.com
- Website: https://unik.ph

## 📄 License

Private - All rights reserved.

