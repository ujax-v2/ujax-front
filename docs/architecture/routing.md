# Routing Strategy

UJAX uses `React Router` to handle client-side routing.
The application routing is split into two main scopes: **Global Scope** and **Workspace Scope**.

## 1. Global Scope (`/`)
Routes accessible to all users (logged-in or guest), or routes that are not specific to a workspace.

- `/`: Landing Page (Home)
- `/explore`: Public Workspace Explorer
- `/login`, `/signup`: User Authentication
- `/profile`: User Profile
- `/settings`: Global User Settings

## 2. Workspace Scope (`/ws/:wsId/...`)
Routes that belong to a specific workspace context.
The `:wsId` parameter determines the current workspace.

- `/ws/:wsId/dashboard`: Workspace Dashboard
- `/ws/:wsId/problems`: Problem List within the workspace
- `/ws/:wsId/ide/:problemId`: Coding Environment
- `/ws/:wsId/community`: Workspace-specific discussions

### Implementation Details
- **`src/App.tsx`**: Defines the entire route tree.
- **`WorkspaceScope` Component**: A wrapper component responsible for reading the `:wsId` from the URL and synchronizing it with the Recoil atom `currentWorkspaceState`.
- **`useWorkspaceNavigate` Hook**: A custom hook that abstracts navigation within a workspace. Instead of manually constructing `/ws/${id}/path`, developers can use `toWs('path')`.

## 3. Redirect Handling
- **Authentication Redirect**: If a user is not logged in, `ProtectedRoute` redirects to `/login`.
- **Workspace Validation**: `WorkspaceScope` verifies if the user is a member of the requested workspace. If not, access is denied (Error Page).
- **Legacy Route Support**: Old routes (e.g., `/dashboard`) are redirected to the user's default workspace via `RedirectToWorkspace` component.
