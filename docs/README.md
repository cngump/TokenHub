# TokenHub Documentation

Language: English | [简体中文](zh-CN/README.md) | [日本語](ja/README.md)

This directory contains public user documentation for running, configuring, and calling TokenHub. It intentionally focuses on operator and developer workflows instead of internal design notes.

## Contents

| Document | Description |
| --- | --- |
| [Quick start](quick-start.md) | Start the backend and admin console locally, then run a smoke test |
| [Model API](model-api.md) | Call TokenHub through OpenAI-compatible endpoints |
| [Admin console](admin-console.md) | Configure Providers, model routes, API keys, usage, logs, and alerts |
| [Model catalog](model-catalog.md) | Maintain the standard model catalog through YAML |
| [Deployment](deployment.md) | Configure environment variables, Docker Compose, data paths, and backups |
| [Security](security.md) | API key handling, admin access, RBAC, audit logs, and credential guidance |

## Recommended Reading Order

1. Start with [Quick start](quick-start.md).
2. Read [Admin console](admin-console.md) to understand the configuration flow.
3. Use [Model API](model-api.md) when integrating an application or SDK.
4. Review [Deployment](deployment.md) and [Security](security.md) before production use.
