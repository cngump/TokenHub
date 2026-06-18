# 模型目录

Language: [English](../model-catalog.md) | 简体中文 | [日本語](../ja/model-catalog.md)

模型目录定义 TokenHub 对业务应用和 API Key 暴露的统一模型名。

## 文件位置

默认模型目录文件：

```text
data/model-catalog.yaml
```

后端通过 `TOKENHUB_MODEL_CATALOG_FILE` 读取该文件。Docker 部署时可以挂载自定义文件，并通过环境变量指定路径。

## 示例

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

## 重要字段

| 字段 | 含义 |
| --- | --- |
| `name` | 业务应用调用的统一模型名 |
| `category` | 管理后台里的模型分组 |
| `family` | 模型家族或厂商标签 |
| `modality` | `chat`、`embedding`、`image`、`audio`、`video` 等模型类型 |
| `context_window` | 上下文窗口大小 |
| `input_price_usd_per_1m` | 每 100 万输入 Token 的估算价格 |
| `output_price_usd_per_1m` | 每 100 万输出 Token 的估算价格 |
| `embedding_price_usd_per_1m` | 每 100 万 Embedding Token 的估算价格 |
| `capabilities` | 管理后台展示的模型能力 |
| `supported_parameters` | 模型支持的参数 |

## 更新流程

1. 编辑 `data/model-catalog.yaml`。
2. 重启后端。
3. 后端启动时会把目录模型 upsert 到 SQLite。
4. 打开管理后台的 `模型目录`，确认结果。
5. 到 `路由策略` 中为可调用的统一模型配置至少一条 Provider 路由。

模型目录本身不会主动调用上游 Provider 的模型列表接口。Provider 模板可以辅助生成路由映射，但统一模型目录由 TokenHub 维护。
