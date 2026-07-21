# Changelog

All notable changes to TokenHub will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **PostgreSQL database support** - Full production-ready PostgreSQL support alongside SQLite
  - Automatic database driver detection from connection URL
  - Connection pool configuration (max open/idle connections, lifetime)
  - Database driver logging with password redaction for security
  - Integration tests for PostgreSQL with concurrent write verification
  
- **Environment configuration improvements**
  - Auto-load `.env` files using godotenv library
  - Support for multiple `.env` file locations (backend/.env, .env, ../.env)
  - Environment variable precedence: shell export > .env file > defaults
  
- **Docker Compose PostgreSQL deployment**
  - New `docker-compose.postgres.yml` for PostgreSQL-based deployments
  - Support for external PostgreSQL database connections
  - PostgreSQL connection pool environment variables
  
- **Documentation**
  - Comprehensive PostgreSQL setup guide (`docs/postgresql-setup.md`)
  - Database URL configuration examples in deployment guide
  - README updated with database configuration section
  - Updated `.env.example` with PostgreSQL configuration templates

### Fixed

- **start.sh database configuration** - Remove hardcoded SQLite default that was overriding `.env` PostgreSQL settings
  - `TOKENHUB_DATABASE_URL` now only forwarded to backend when explicitly set in shell
  - Allows `backend/.env` to control database configuration
  - Proper precedence: shell export > backend/.env > built-in default

### Changed

- **Database abstraction layer** - GORM dialect selection now supports both SQLite and PostgreSQL
  - SQLite maintains single connection (legacy behavior)
  - PostgreSQL uses configurable connection pooling for production workloads

## Previous Releases

See [GitHub Releases](https://github.com/astaxie/TokenHub/releases) for earlier versions.
