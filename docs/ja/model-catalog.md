# モデルカタログ

Language: [English](../model-catalog.md) | [简体中文](../zh-CN/model-catalog.md) | 日本語

モデルカタログは、TokenHub がアプリケーションと API Key に公開する統一モデル名を定義します。

## ファイル位置

デフォルトのカタログファイル:

```text
data/model-catalog.yaml
```

バックエンドは `TOKENHUB_MODEL_CATALOG_FILE` でこのファイルを解決します。Docker デプロイではカスタムファイルをマウントし、環境変数でパスを指定できます。

## 例

```yaml
version: 1
models:
  - name: deepseek-chat
    category: deepseek
    family: DeepSeek
    modality: chat
    context_window: 64000
    input_price_usd_per_1m: 0.27
    output_price_usd_per_1m: 1.10
    capabilities:
      - text
      - chat
    supported_parameters:
      - temperature
      - max_tokens
```

## 重要フィールド

| フィールド | 意味 |
| --- | --- |
| `name` | アプリケーションが呼び出す統一モデル名 |
| `category` | 管理コンソール上のグループ |
| `family` | モデルファミリーまたはベンダー表示名 |
| `modality` | `chat`、`embedding`、`image`、`audio`、`video` など |
| `context_window` | コンテキストウィンドウサイズ |
| `input_price_usd_per_1m` | 入力 Token 100 万あたりの推定価格 |
| `output_price_usd_per_1m` | 出力 Token 100 万あたりの推定価格 |
| `embedding_price_usd_per_1m` | Embedding Token 100 万あたりの推定価格 |
| `capabilities` | 管理コンソールに表示する能力 |
| `supported_parameters` | モデルが対応するパラメータ |

## 更新フロー

1. `data/model-catalog.yaml` を編集します。
2. バックエンドを再起動します。
3. 起動時にバックエンドがカタログモデルを SQLite に upsert します。
4. 管理コンソールの `Model Catalog` で結果を確認します。
5. 呼び出し可能にする統一モデルには、`Routing Policies` で少なくとも 1 つの Provider ルートを設定します。

モデルカタログ自体は、上流 Provider のモデル一覧 API を自動では呼び出しません。Provider テンプレートはルート作成を補助しますが、統一カタログは TokenHub 側で管理します。
