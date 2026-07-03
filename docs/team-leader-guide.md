# Team Leader Guide

Language: English | [简体中文](zh-CN/team-leader-guide.md) | [日本語](ja/team-leader-guide.md)

This guide is for team leaders who manage project spaces, project members, API keys, and team-level usage reports.

## Team Leader Scope

| Capability | Description |
| --- | --- |
| Project Spaces | Create or manage projects owned by your team |
| Project Members | Open a project and manage members from the right-side detail panel |
| Key Management | Issue project keys when your project role allows it |
| Team Reports | Review usage by member, project, model, and cost center |
| Cost Attribution | Trace consumption to `Payments Assistant`, `Customer Support Copilot`, or another project |

## Project Governance Model

Projects are the boundary for enterprise AI consumption. A person can belong to multiple projects, and each API key belongs to exactly one project.

| Project member role | Default capability |
| --- | --- |
| Owner | Manage project settings, members, API keys, and quota |
| Maintainer | Maintain project members and keys |
| Developer | Create and use project API keys |
| Viewer | View project information and usage only |

## Manage Members

1. Open **Project Spaces**.
2. Select a project such as `Payments Assistant`.
3. Use the right-side project panel to view members.
4. Add, edit, or remove users from the panel. The member list shows users only; role and key permission are edited in the member form.
5. Review team usage after changing membership so cost ownership remains clear.

## Issue Keys for a Project

1. Open **Key Management**.
2. Choose the project that should own the key.
3. Limit the key to the models and quota required by the application.
4. Copy the new key immediately. TokenHub shows the full secret once.
5. Rotate or revoke keys when an application owner changes.

## Report Review

Use team reports to answer four questions:

| Question | Report dimension |
| --- | --- |
| Who consumed the budget? | Member |
| Which product or app consumed it? | Project |
| Which model drove the cost? | Model |
| Which internal budget owns it? | Cost center |

## Screenshot

![Overview](assets/screenshots/overview-en.png)
