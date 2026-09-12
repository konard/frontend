# vibe-management.pro Frontend MVP

This is a minimal viable product for the vibe-management.pro frontend service deployed as a submodule. The structure is split into:

## MVP Interface (packages/frontend)
Contains only basic pages:
- Main page (welcome screen with login/register options)
- Login page
- Registration page
- Role-based routing (`/user`, `/admin`)

This is the submodule that others can include in their projects.

## Full Interface (inside the package)
Located in src/full_interface/, this contains all specific functionality:
- Domain-specific components
- Complex UI elements
- Business logic components
- Widgets and features
- Shared utilities

## Authentication Flow
1. User visits the main page
2. If not authenticated, user can sign in or register
3. After authentication, user is redirected to their role-specific dashboard (`/user` or `/admin`)
4. Role-specific dashboards use components from the full_interface

## Authorization
- Protected routes are located under `/[role]/` dynamic segments
- Only authenticated users with the matching role can access role-specific content
- Access control is handled by the auth system

## Structure
```
packages/frontend/              # Submodule (MVP interface)
├── src/
│   ├── routes/                 # Basic routes (main, login, register, role-based)
│   ├── lib/                    # Core libraries
│   └── full_interface/         # Full functionality (internal)
│       ├── features/           # Specific features
│       ├── widgets/            # UI components
│       ├── shared/             # Shared utilities
│       ├── user_dashboard/     # User-specific dashboard
│       └── admin_dashboard/    # Admin-specific dashboard
```

This structure allows the MVP to be included as a submodule while keeping complex functionality internal to the package.