# モデル API

Language: [English](../model-api.md) | [简体中文](../zh-CN/model-api.md) | 日本語

TokenHub は OpenAI-compatible なモデルエンドポイントを提供します。アプリケーションは OpenAI-compatible SDK の `baseURL` を TokenHub に向け、TokenHub が発行した API Key を使用できます。

## Base URL

```text
http://localhost:8080/v1
```

本番環境では自社の HTTPS ドメインを使用してください。

## 認証

Bearer Token として TokenHub API Key を送信します。

```http
Authorization: Bearer thk_xxx
```

API Key は、プロジェクト、状態、有効期限、モデル許可リスト、クォータ、並行数制限の対象になります。

## モデル一覧

```bash
curl http://localhost:8080/v1/models \
  -H "Authorization: Bearer thk_xxx"
```

レスポンスには、現在の Key で利用できるモデルだけが含まれます。

## Chat Completions

```bash
curl http://localhost:8080/v1/chat/completions \
  -H "Authorization: Bearer thk_xxx" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "deepseek-chat",
    "messages": [
      {"role": "user", "content": "TokenHub を一文で説明してください。"}
    ]
  }'
```

`model` は TokenHub が外部に公開する統一モデル名です。TokenHub はルーティング設定に従って、設定済みの上流 Provider モデルへ転送します。

## Responses API

```bash
curl http://localhost:8080/v1/responses \
  -H "Authorization: Bearer thk_xxx" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4.1-mini",
    "input": "TokenHub を一文で要約してください。"
  }'
```

## Embeddings

```bash
curl http://localhost:8080/v1/embeddings \
  -H "Authorization: Bearer thk_xxx" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "text-embedding-3-small",
    "input": "TokenHub"
  }'
```

## ルーティング概念

- 統一モデル: アプリケーションが TokenHub を呼び出すときに使うモデル名。
- 上流モデル: Provider が実際に受け付けるモデル名またはデプロイ名。
- ルート: 統一モデルを Provider と上流モデルに対応付ける設定。
- 優先度と重み: 複数ルートがあるときの呼び出し順序と分配比率。

## エラー

エラーは `error.code`、`error.message`、`error.type` を含む JSON で返されます。レスポンスにはリクエストログ検索用の `request_id` も含まれます。

よくあるエラー:

| Code | 意味 |
| --- | --- |
| `invalid_api_key` | Key がない、または無効です |
| `api_key_disabled` | Key またはプロジェクトが無効です |
| `model_not_allowed` | 現在の Key では対象モデルを利用できません |
| `quota_exceeded` | リクエスト、Token、コスト、または並行数の上限を超えました |
| `provider_missing` | モデルに利用可能な健全ルートがありません |
| `provider_error` | 上流 Provider がエラーを返しました |
