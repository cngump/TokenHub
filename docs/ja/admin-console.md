# 管理コンソール

Language: [English](../admin-console.md) | [简体中文](../zh-CN/admin-console.md) | 日本語

管理コンソールは TokenHub の主な設定画面です。デフォルトでは `http://localhost:3000` で利用できます。

## 主な領域

| 領域 | 目的 |
| --- | --- |
| Overview | ランタイム状態、リクエスト量、コスト、Provider 状態、お知らせを確認します |
| Playground | 現在のルーティング設定で統一モデルをテストします |
| API Documentation | 開発者向けにモデル API の呼び出し方法を表示します |
| Provider Channels | 上流 Provider、Base URL、API Key、テンプレート、ヘルス状態を設定します |
| Model Catalog | TokenHub が公開する統一モデル名を管理します |
| Routing Policies | 統一モデルを Provider モデルに対応付け、Provider の順序を調整します |
| Projects and API Keys | 権限、クォータ、モデル許可リスト付きの Key を発行します |
| Teams and Users | ユーザー、チームメンバー、ロールを管理します |
| Usage and Request Logs | Token、コスト、状態、レイテンシ、リクエスト内容、ルート試行を確認します |
| Health and Alerts | Provider ヘルス、アラートルール、通知チャネルを設定します |
| Backups and Settings | SQLite バックアップ、ロール表示、ID ソース、システム設定を管理します |

## Provider 設定フロー

1. `Provider Channels` を開きます。
2. Provider を作成し、種別、Base URL、API Key を設定します。
3. 接続をテストします。
4. Provider テンプレートから上流モデルを選択します。
5. `Routing Policies` でルートが作成されたことを確認します。

## ルーティング設定フロー

ルーティングは統一モデルごとに表示されます。1 つの統一モデルに複数の Provider 行を持たせることができます。

- Provider 行をドラッグして呼び出し順序を変更できます。
- 最初の有効な行が主ルートです。
- 不健全な Provider または無効なルートはスキップされます。
- 非ストリーミングリクエストでは、再試行可能なエラー時に次のルートへフェイルオーバーできます。

## Key 設定フロー

1. `API Key` を開きます。
2. プロジェクト配下で Key を作成します。
3. 必要に応じてモデル許可リストを設定します。
4. 日次、月次、コスト、Token、並行数の上限を設定します。
5. 生成された Key をアプリケーションまたは SDK テストに設定します。

## リクエストログ

`Request Logs` には、モデル呼び出し、選択された Provider、上流モデル、レイテンシ、状態、利用量、コスト、ルート試行、およびバックエンドで有効化されている場合のリクエスト/レスポンス内容が記録されます。
