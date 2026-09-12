# vibe-management.pro Frontend MVP

This is a minimal viable product for the vibe-management.pro frontend service. This submodule contains only basic authentication and routing functionality.

## Structure
- `/routes` - Contains only basic pages:
  - Main page (welcome screen with login/register)
  - Login page
  - Registration page
  - Dynamic role-based routing (`/user`, `/admin`)
- `/lib` - Core libraries for auth, notifications, etc.
- `/full_interface` - Internal directory containing all complex domain-specific functionality

## Authentication Flow
1. User visits the main page
2. If not authenticated, user can sign in or register
3. After authentication, user is redirected to their role-specific dashboard (`/user` or `/admin`)

## Authorization
- Protected routes are located under `/[role]/` dynamic segments
- Only authenticated users with the matching role can access role-specific content
- Access control is handled by the auth system

## Organization
All complex domain-specific functionality has been moved to the `/src/full_interface/` directory inside the package. This keeps the submodule lightweight while maintaining full functionality internally.

For more information about the structure, see MVP_STRUCTURE.md