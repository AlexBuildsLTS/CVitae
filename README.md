# PortfolioOS | Senior Engineering Architecture

A high-performance, cinematic developer portfolio architected with **React Native (Expo)**, **TypeScript**, and **Supabase**. This project serves as a technical demonstration of cross-platform engineering, featuring a "Neo-Brutalism meets Swiss Design" aesthetic, 60fps micro-interactions, and a real-time administrative backbone.

---

## 🛠 Technical Stack

### Core Architecture

- **Framework:** Expo SDK 53+ (React Native for Web)
- **Navigation:** Expo Router v4 (Type-safe, file-based routing)
- **Language:** TypeScript (Strict Mode)
- **Backend:** Supabase (Postgres, Auth, Realtime RLS)

### UI/UX & Motion

- **Styling:** NativeWind v4 (Tailwind CSS engine)
- **Animations:** React Native Reanimated 3 (Worklet-based 60fps motion)
- **Components:** Custom Glassmorphism system via `expo-blur`
- **Typography:** Typography-driven hierarchy with Swiss Design principles
- **Icons:** Lucide React Native
- **Performance:** `expo-image` with blurhash pre-loading & optimization

---

## 🏛 Key Architectural Features

### 1. Bento-Grid Layout System

Utilizes a modular grid system optimized for information density and visual hierarchy. The layout is fully responsive, transitioning from a complex 2-column desktop grid to a high-legibility vertical stack on mobile devices.

### 2. Real-time Status Synchronization

Leverages Supabase Realtime to broadcast "Open to Work" status and live availability across all active client sessions without page refreshes.

### 3. Glassmorphism UI Engine

A bespoke `GlassCard` component architecture that utilizes platform-specific blurring (`expo-blur`) to maintain high performance while achieving a premium, frosted-glass aesthetic.

### 4. Secure Administrative CMS

A restricted `/admin` directory protected by Supabase Auth and Row Level Security (RLS), allowing for dynamic project management, message triaging, and real-time dashboard updates.

---

## 📂 Project Structure

```text
├── app/                  # Expo Router (File-based routing)
│   ├── (auth)/           # Admin authentication flow
│   ├── admin/            # Protected CMS Dashboard & Management
│   └── index.tsx         # Main Portfolio Entry (Public)
├── components/           # Atomic Design System
│   ├── GlassCard.tsx     # Core visual container
│   ├── LiveStatus.tsx    # Supabase Realtime indicator
│   └── PhilosophyBento.ts# Modular project showcase
├── lib/                  # Infrastructure & Third-party configs
│   └── supabase.ts       # Database client & RLS configuration
├── constants/            # Design System (Colors, Spacing, Theme)
├── hooks/                # Custom React Hooks (useFrameworkReady)
└── types/                # Centralized TypeScript Definitions
```
