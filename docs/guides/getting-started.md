# Getting Started Guide

This guide will help you set up the development environment for the UJAX Frontend project.

## 1. Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **Git**: Latest version

## 2. Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/ujax-v2/ujax-front.git
cd ujax-front
npm install
```

## 3. Development Server

Start the local development server:

```bash
npm run dev
```

- By default, the app runs at `http://localhost:5173`.
- If you need to access it from an external device (e.g., mobile testing), use:
  ```bash
  npm run dev -- --host 0.0.0.0
  ```

### Troubleshooting: Port In Use
If you see an error like `Port 5173 is in use`, Vite will automatically try the next available port (e.g., 5174).
To clear stuck processes:

**Windows (PowerShell):**
```powershell
Stop-Process -Name node -Force
```

**Mac/Linux:**
```bash
pkill -f node
```

## 4. Project Configuration

### Path Aliases (`@/`)
This project uses **Path Aliases**. You should import components using `@/` instead of relative paths.
- `@/components` -> `src/components`
- `@/features` -> `src/features`
- `@/store` -> `src/store`

**Example:**
```tsx
// ✅ Correct
import { Button } from '@/components/ui/button';

// ❌ Avoid
import { Button } from '../../../../components/ui/button';
```

### Environment Variables
Create a `.env` file in the root directory for local configuration:

```env
VITE_API_BASE_URL=http://localhost:8080/api
```
(Currently, the project uses `mockData.ts`, so this is optional until backend integration.)
