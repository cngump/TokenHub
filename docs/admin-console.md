# Admin Console

Language: English | [简体中文](zh-CN/admin-console.md) | [日本語](ja/admin-console.md)

The admin console is the main place to configure TokenHub. By default it is available at `http://localhost:3000`.

## Main Areas

| Area | Purpose |
| --- | --- |
| Overview | Runtime status, request volume, cost, Provider status, and announcements |
| Playground | Test a unified model through the current routing policy |
| API Documentation | Show developers how to call the model API |
| Provider Channels | Configure upstream Providers, Base URLs, API keys, templates, and health |
| Model Catalog | Maintain the unified model names exposed by TokenHub |
| Routing Policies | Map unified models to Provider models and adjust Provider order |
| Projects and API Keys | Issue scoped keys, quotas, model allowlists, and project limits |
| Teams and Users | Manage users, team membership, and role assignment |
| Usage and Request Logs | Inspect tokens, cost, status, latency, request payloads, and route attempts |
| Health and Alerts | Check Provider health, configure alert rules, and notification channels |
| Backups and Settings | Manage SQLite backups, role labels, identity sources, and system settings |

## Typical Provider Setup

1. Open `Provider Channels`.
2. Create a Provider and set its type, Base URL, and API key.
3. Test the connection.
4. Select upstream models from the Provider template.
5. Confirm that routes were created under `Routing Policies`.

## Typical Routing Setup

Routes are shown by unified model. Each unified model can have multiple Provider rows.

- Drag Provider rows to change call order.
- The first active row is the primary route.
- Unhealthy Providers or inactive routes are skipped.
- Non-streaming requests can fail over to the next route when the error is retryable.

## Typical Key Setup

1. Open `API Key`.
2. Create a key under a project.
3. Set allowed models when the key should be restricted.
4. Configure daily, monthly, cost, token, and concurrency limits as needed.
5. Use the generated key in applications or the SDK smoke test.

## Request Logs

`Request Logs` records model calls, selected Provider, upstream model, latency, status, usage, cost, route attempts, and request/response payloads when enabled by the backend.
