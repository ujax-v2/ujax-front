# Directory Structure Overview

UJAX Frontend project follows a **Feature-First Architecture**.
This structure ensures scalability and maintainability by organizing code based on business features rather than file types.

## 1. Top-Level Structure

```
ujax-front/
├── dist/               # Production build output
├── public/             # Static assets (favicon, logos)
├── src/                # Main source code
├── docs/               # Architecture, Guides, API docs
├── .gitignore          # Git ignore configuration
├── index.html          # Entry HTML file
├── package.json        # Dependencies and scripts
├── tsconfig.json       # TypeScript configuration (Path alias @/)
├── vite.config.ts      # Vite configuration
└── ...
```

## 2. Source Code (`src/`)

### 2.1 Core Directories
- **`api/`**: API integration layer. (Currently contains `mockData.ts`)
  - Should contain Axios/Fetch wrappers and endpoint definitions.
- **`components/`**: Reusable UI components.
  - `ui/`: Design system components (Buttons, Modals, Cards).
    - Contains both legacy (`Base.tsx`) and modern Shadcn UI individual files.
  - `layout/`: Global layout components (`Sidebar`, `Navbar`).
  - `common/`: Business-logic agnostics (`ErrorBoundary`).
  - `modals/`: Global modals (`CreateWorkspaceModal`).
- **`features/`**: Feature-specific implementations (Pages & Components).
  - `auth/`: Authentication logic (`Login`, `SignUp`).
  - `home/`: Public landing page (`Home`).
  - `explore/`: Public workspace exploration (`WorkspaceExplore`).
  - `dashboard/`: Workspace dashboard (`Dashboard`).
  - `ide/`: Code editor environment (`IDE`).
  - `problems/`: Problem bank & submission (`ProblemList`, `ProblemRegistration`).
  - `community/`: Q&A and Discussions (`Community`).
  - `challenges/`: Gamified challenges (`ChallengeList`, etc.).
  - `user/`: User settings (`Profile`, `Settings`).
- **`hooks/`**: Custom React Hooks.
  - `useWorkspaceNavigate.ts`: Routing helper for workspace scope.
- **`store/`**: Global state management.
  - `atoms.ts`: Recoil atoms definitions.
- **`utils/`**: Helper functions.

### 2.2 Key Files
- **`App.tsx`**: Main application component, **Routing definitions**.
- **`main.tsx`**: Application entry point, providers setup (`RecoilRoot`, `ErrorBoundary`).
- **`index.css`**: Global styles & Tailwind directives.

## 3. Organizational Principles

### Feature-Based Organization (`src/features`)
- Instead of grouping by type (e.g., `components/Page1`, `api/Page1`), all code related to a feature is colocated in `src/features/<feature-name>`.
- Each feature folder should ideally contain its own components, hooks, and types if they are only used within that feature.

### Shared UI (`src/components/ui`)
- Atomic design components reside here.
- These components should have **no dependency on specific features or business logic**.

### Global State (`src/store`)
- Use Recoil atoms for shared state across features.
- Avoid prop drilling by leveraging atoms.
