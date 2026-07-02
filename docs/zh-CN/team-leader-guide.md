# 团队负责人指南

Language: [English](../team-leader-guide.md) | 简体中文 | [日本語](../ja/team-leader-guide.md)

本指南面向管理项目空间、项目成员、API Key 和团队报表的团队负责人。

## 团队负责人范围

| 能力 | 说明 |
| --- | --- |
| Project Spaces | 创建或管理团队所属项目 |
| Project Members | 打开项目后，在右侧详情栏管理成员 |
| Key Management | 在项目角色允许时发放项目 Key |
| Team Reports | 按成员、项目、模型和成本中心查看用量 |
| Cost Attribution | 将消费归因到 `Payments Assistant`、`Customer Support Copilot` 等项目 |

## 项目治理模型

项目是企业 AI 消费的边界。一个人可以加入多个项目，每个 API Key 只属于一个项目。

| 项目成员角色 | 默认能力 |
| --- | --- |
| Owner | 管理项目设置、成员、API Key 和额度 |
| Maintainer | 维护项目成员和 Key |
| Developer | 创建和使用项目 API Key |
| Viewer | 只能查看项目信息和用量 |

## 管理成员

1. 打开 **Project Spaces**。
2. 选择项目，例如 `Payments Assistant`。
3. 在右侧项目详情栏查看成员。
4. 在详情栏里添加、编辑或移除用户。成员列表只展示用户；角色和 Key 权限在成员表单中编辑。
5. 调整成员后查看团队用量，确保成本归属清晰。

## 为项目发放 Key

1. 打开 **Key Management**。
2. 选择 Key 所属项目。
3. 将 Key 限制到应用实际需要的模型和额度。
4. 立即复制新 Key，TokenHub 只展示一次完整 Secret。
5. 当应用负责人变化时，轮换或撤销 Key。

## 报表检查

| 问题 | 报表维度 |
| --- | --- |
| 谁消耗了预算？ | Member |
| 哪个产品或应用消耗了预算？ | Project |
| 哪个模型带来了主要成本？ | Model |
| 哪个内部预算承担成本？ | Cost center |

## 截图

![Overview](../assets/screenshots/overview-en.png)
