# System Overview

UJAX Frontend is a modern web application built with scalability and performance in mind.
It provides a rich set of features for algorithm learning and sharing.

## Tech Stack

- **Framework**: `React` + `TypeScript`
- **Build Tool**: `Vite` (Fast HMR & Optimized Build)
- **Styling**: `Tailwind CSS` + `clsx` + `tailwind-merge`
- **State Management**: `Recoil` (Atomic State)
- **Routing**: `React Router v7`
- **UI Components**: `Lucide React` (Icons), `Radix UI` (Headless Primitives for Buttons/Modals)
  - Legacy UI: `Base.tsx` (Custom implementation)
  - Modern UI: `Shadcn UI` (Individual file components)

## Key Features

1. **Workspace System**: Multi-tenant architecture within a single app. Each user can have multiple workspaces.
2. **Algorithm IDE**: Monaco Editor integration, Problem Solving environment.
3. **Problem Bank**: Browse, solve, and register problems.
4. **Community**: Q&A, solution sharing.
5. **Gamification**: Challenges, badges, contribution graph.

## Architectural Decisions

### 1. Feature-Sliced Architecture
We organize code by domain (features) rather than technical layer. This keeps related logic together and makes the codebase easier to navigate and maintain.

### 2. Recoil for State Management
We use Recoil for global state because its atomic model fits well with our need for granular updates (e.g., specific workspace state, user session). Atoms are defined in `src/store/atoms.ts`.

### 3. Tailwind CSS for Styling
We use utility-first CSS for rapid development and consistency.
