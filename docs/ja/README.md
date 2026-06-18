# TokenHub ドキュメント

Language: [English](../README.md) | [简体中文](../zh-CN/README.md) | 日本語

このディレクトリには、TokenHub を実行、設定、利用するための公開ユーザードキュメントを置いています。内部設計メモではなく、運用者と開発者の実務に必要な内容に絞っています。

## 内容

| ドキュメント | 説明 |
| --- | --- |
| [クイックスタート](quick-start.md) | ローカルでバックエンドと管理コンソールを起動し、スモークテストを実行します |
| [モデル API](model-api.md) | OpenAI-compatible エンドポイントで TokenHub を呼び出します |
| [管理コンソール](admin-console.md) | Provider、モデルルート、API Key、利用量、ログ、アラートを設定します |
| [モデルカタログ](model-catalog.md) | YAML で標準モデルカタログを管理します |
| [デプロイ](deployment.md) | 環境変数、Docker Compose、データパス、バックアップを説明します |
| [セキュリティ](security.md) | API Key、管理アクセス、RBAC、監査ログ、認証情報の扱いを説明します |

## 推奨順序

1. まず [クイックスタート](quick-start.md) を読んでください。
2. 管理者は [管理コンソール](admin-console.md) で設定フローを確認してください。
3. アプリ開発者は [モデル API](model-api.md) で SDK 連携を確認してください。
4. 本番利用前に [デプロイ](deployment.md) と [セキュリティ](security.md) を確認してください。
