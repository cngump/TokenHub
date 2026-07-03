# 利用者ガイド

Language: [English](../user-guide.md) | [简体中文](../zh-CN/user-guide.md) | 日本語

このガイドは、TokenHub 経由で承認済み AI モデルを利用する社員とアプリケーション開発者向けです。

## 利用できる領域

| 領域 | 用途 |
| --- | --- |
| Overview | 表示可能な Project、Key、最近のアクティビティを確認します |
| API Documentation | Base URL をコピーし、モデル API 例とロール別ガイドを確認します |
| Model Playground | アカウントで呼び出せるモデルを使ってプロンプトを試します |
| Available Models | 有効なルーティングがあるモデルを確認します |
| Key Management | 割り当て済み Project の API Key を作成またはコピーします |
| Usage Analytics | 現在のアカウントに見えるリクエスト、Token、コストを確認します |
| Request Logs | request ID で失敗した呼び出しを調査します |

## 日常フロー

1. **Available Models** または **Model Playground** を開き、呼び出せるモデルを確認します。
2. **Key Management** を開き、割り当て済み Project、たとえば `Payments Assistant` を選びます。
3. アプリケーションに必要な場合だけ API Key を作成します。新しい Key は一度だけ表示されるため、すぐにコピーします。
4. アプリケーションに TokenHub Base URL と Project API Key を設定します。
5. **Usage Analytics** と **Request Logs** で自分のトラフィックを確認します。

## モデル API の呼び出し

モデル通信には Project API Key を使います。コンソールログイントークンはモデル API では利用できません。

```bash
curl -X POST "http://localhost:8080/v1/chat/completions" \
  -H "Authorization: Bearer YOUR_TOKENHUB_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4.1-mini",
    "messages": [
      {"role": "system", "content": "You are an internal enterprise AI assistant."},
      {"role": "user", "content": "Summarize today'\''s support tickets for the Payments project."}
    ],
    "temperature": 0.7,
    "stream": false
  }'
```

## トラブルシューティング

| ステータス | 意味 | 対応 |
| --- | --- | --- |
| 401 | API Key が無効または不足 | `Authorization` header と Key の有効状態を確認します |
| 403 | Project またはモデルが許可されていません | チームリーダーに Project メンバーシップとモデル権限を確認してもらいます |
| 429 | クォータまたは同時実行制限 | クォータ期間の回復を待つか、クォータ増加を依頼します |
| 503 | 健全なルートがありません | 管理者にルーティングと Provider ヘルスを確認してもらいます |

## スクリーンショット

![Gateway documentation](../assets/screenshots/gateway-en.png)
