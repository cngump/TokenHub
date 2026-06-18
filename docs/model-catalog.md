# Model Catalog

Language: English | [简体中文](zh-CN/model-catalog.md) | [日本語](ja/model-catalog.md)

The model catalog defines the unified model names that TokenHub exposes to applications and API keys.

## File Location

The default catalog file is:

```text
data/model-catalog.yaml
```

The backend resolves this file through `TOKENHUB_MODEL_CATALOG_FILE`. Docker deployments can mount a custom file and point the environment variable to it.

## Example Entry

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

## Important Fields

| Field | Meaning |
| --- | --- |
| `name` | Unified model name used by applications |
| `category` | Catalog grouping in the admin console |
| `family` | Model family or vendor label |
| `modality` | `chat`, `embedding`, `image`, `audio`, `video`, or another supported type |
| `context_window` | Context window size |
| `input_price_usd_per_1m` | Estimated input token price per 1M tokens |
| `output_price_usd_per_1m` | Estimated output token price per 1M tokens |
| `embedding_price_usd_per_1m` | Estimated embedding price per 1M tokens |
| `capabilities` | Capabilities shown in the admin console |
| `supported_parameters` | Parameters supported by the model |

## Update Flow

1. Edit `data/model-catalog.yaml`.
2. Restart the backend.
3. The backend upserts catalog models into SQLite during startup.
4. Open `Model Catalog` in the admin console and confirm the result.
5. Configure `Routing Policies` so each callable unified model has at least one Provider route.

The model catalog does not call upstream Provider model-list APIs by itself. Provider templates can help create route mappings, but the unified catalog is maintained by TokenHub.
