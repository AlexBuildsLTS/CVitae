# PortfolioOS

A high-performance, cinematic personal portfolio built with React Native (Expo), TypeScript, and Supabase.

## 🌟 Key Features

- **Glassmorphism UI:** Custom built `GlassCard` components using `expo-blur`.
- **Responsive Layout:** Automatically switches between Desktop (2-column grid, side-by-side layouts) and Mobile (stacked vertical layouts).
- **Admin Dashboard:** A secured CMS to manage your Projects, Messages, and Profile Status.
- **Real-time Status:** Updates "Open to Work" status instantly across all visitors via Supabase Realtime.
- **Secure:** Row Level Security (RLS) on all database tables.

## 📂 Project Structure

´´´
/src
  /app
    /(auth)/login.tsx       # Admin Login (Restricted width)
    /admin/projects.tsx     # Manage Portfolio items (Edit/Delete)
    /index.tsx              # MAIN PORTFOLIO (The public face)
    /_layout.tsx            # 
  /components
    GlassCard.tsx           # The core visual container
    GlassScheduler.tsx      # Meeting booking widget
    LiveStatus.tsx          # Realtime dot indicator
  /lib
    supabase.ts             # Database connection
  /constants
    Theme.ts                # Colors (Neon/Dark)
    ´´´
