# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- **JWT-based authentication system**
  - User login with username and password
  - JWT token-based session management
  - Secure password hashing with bcrypt
  - Admin user (ID 0) created automatically on first migration
- **Admin-controlled user management**
  - Only admin can register new users
  - Admin can delete users (except admin itself)
  - Admin can reset user passwords
  - Admin can list all users
- **User data isolation**
  - All journal entries scoped to authenticated user
  - All facts and chat sessions scoped to authenticated user
  - Vector search results filtered by user
  - Required user_id parameter in all data access methods
- **Login page UI**
  - Clean, modern login interface
  - Self-registration removed (admin-only user creation)
  - Automatic redirect to login when unauthenticated
- **API authentication middleware**
  - JWT token validation on protected routes
  - Automatic token injection in frontend API calls
  - 401 handling with redirect to login
- Light mode fixes

### Changed

- Database schema: Added `user_id` foreign key to `journal_entries`, `user_facts`, and `chat_sessions` tables
- All API routes now require authentication
- Vector search methods now require user_id as mandatory parameter
- Migration creates admin user with randomly generated password (printed to logs)

### Security

- Enforced user data isolation across all endpoints
- JWT_SECRET_KEY must be configured (no default for security)
- Password hashing using bcrypt
- Type-safe user_id requirements in data access layer

## [0.1.0] - 2025-08-17

Initial release of re:memo

[unreleased]: https://github.com/re-memo/re-memo/compare/v0.1.0...HEAD
[0.0.1]: https://github.com/re-memo/re-memo/releases/tag/v0.1.0
