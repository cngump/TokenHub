# チームリーダー LLM API 導入ガイド

Language: [English](../team-leader-guide.md) | [简体中文](../zh-CN/team-leader-guide.md) | 日本語

このガイドは、業務アプリケーションが Project 単位の TokenHub API Key で承認済み大規模言語モデルを呼び出せるようにするチームリーダー向けです。

## チームリーダーの責任

| 領域 | 管理するもの |
| --- | --- |
| Project | メンバー、Key、クォータ、コスト配賦の境界 |
| Members | Project 詳細パネルでアプリ責任者または開発者を追加 |
| API Keys | 利用量とコストを持つ Project で Key を発行 |
| Models | Key が意図したモデル一覧を見られるか検証 |
| Reports | メンバー、Project、モデル、Cost Center 別に利用量を確認 |

## Project Key の発行

1. **Project Spaces** で Project を作成または選択します。
2. Project をクリックし、右側メンバーパネルでアプリ責任者を追加します。
3. **Key Management** を開き、その Project で Key を作成します。
4. Key をアプリケーションに必要なモデルとクォータに制限します。
5. `GET /v1/models` で Key のモデル範囲を検証します。
6. 社内のシークレット運用に従って Key をアプリ責任者へ渡します。

## 利用可能モデルの検証

```bash
curl --request GET \
  --url "http://localhost:8080/v1/models" \
  --header "Authorization: Bearer PROJECT_API_KEY" \
  --header "Content-Type: application/json"
```

返された `data[].id` がアプリケーションで利用できるモデル ID です。

## Chat 呼び出しの検証

```bash
curl --request POST \
  --url "http://localhost:8080/v1/chat/completions" \
  --header "Authorization: Bearer PROJECT_API_KEY" \
  --header "Content-Type: application/json" \
  --data '{
    "model": "gpt-4.1-mini",
    "messages": [
      {"role": "user", "content": "Write a concise project onboarding checklist."}
    ],
    "stream": false
  }'
```

## ガバナンスチェック

| チェック | 重要な理由 |
| --- | --- |
| Project owner | 利用量とコストの責任者を明確にするため |
| Member role | 信頼できる Project メンバーだけが Key を発行またはローテーションするため |
| Model scope | Key が必要なモデルだけを公開するため |
| Quota | クォータと同時実行を想定トラフィックに合わせるため |
| Logs | 失敗リクエストを `request_id` で追跡するため |

## よくあるエラー

| ステータス | チームリーダーの対応 |
| --- | --- |
| 401 | アプリが有効な Project Key を使っているか確認 |
| 403 | Project メンバーと Key の許可モデル範囲を確認 |
| 429 | クォータ、同時実行、Key/Project 制限を確認 |
| 503 | 管理者にルートと Provider ヘルス確認を依頼 |
| 500 | Request Logs で `request_id` から上流エラーを確認 |

## スクリーンショット

![Gateway documentation](../assets/screenshots/gateway-en.png)
