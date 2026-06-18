# Security

Language: English | [简体中文](zh-CN/security.md) | [日本語](ja/security.md)

TokenHub should be deployed as an enterprise-controlled gateway for authorized model API access.

## API Keys

- API keys are created inside projects.
- Keys can be enabled, disabled, rotated, revoked, expired, and restricted by model allowlist.
- Keys can have request, token, cost, and concurrency limits.
- Applications should only receive keys for the models and projects they need.

## Admin Access

- The Admin API is protected by an admin token and admin sessions.
- Replace development tokens before production use.
- Restrict admin console access through your network, SSO, VPN, or reverse proxy controls.

## Roles and Data Scope

TokenHub supports role-based UI and backend data filtering:

- Regular users can create and manage their own keys and inspect their own usage and request logs.
- Team leaders can inspect team members and team usage.
- Administrators can manage global configuration.
- Security administrators can inspect security-related logs, alerts, and policies.

Frontend menu hiding is only a usability layer. Backend APIs must enforce data scope.

## Provider Credentials

- Use official enterprise-owned Provider credentials.
- Do not expose Provider API keys in frontend code or public documentation.
- Rotate Provider keys according to your internal policy.
- Prefer secret managers or protected environment variables in production.

## Request Logs

Request logs are useful for troubleshooting and auditing. Review your retention and masking policy before enabling payload retention in production.

Recommended controls:

- Mask secrets and sensitive fields.
- Limit payload visibility to authorized roles.
- Set retention periods for request and response bodies.
- Export logs only to approved storage.

## Network Controls

- Serve production traffic over HTTPS.
- Restrict Admin API access by network when possible.
- Configure upstream Provider egress through approved proxy routes when required by enterprise policy.
