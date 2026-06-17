# TokenHub AI SDK Smoke Test

This directory contains a small Vercel AI SDK test client for TokenHub's OpenAI-Compatible gateway.

## Setup

```bash
cd sdk
npm install
cp .env.example .env
```

Edit `.env` and set:

```bash
TOKENHUB_API_KEY=thk_xxx
TOKENHUB_MODEL=deepseek-chat
```

Then run:

```bash
npm run test:deepseek
```

## TokenHub Prerequisites

Before running the test, make sure TokenHub has:

- A Provider configured for DeepSeek or another OpenAI-compatible upstream.
- A route from unified model `deepseek-chat` to a JieKou upstream model such as `deepseek/deepseek-v3-0324`.
- An internal API Key whose allowed models include `deepseek-chat`.

The script calls `GET /v1/models` first, then sends a `generateText` request through AI SDK.

For JieKou, keep TokenHub's external/unified model as `deepseek-chat` if you want, but set the route's upstream `上游模型` to the exact JieKou model ID. Their docs show model IDs like `deepseek/deepseek-r1-0528`; `deepseek/deepseek-v3-0324` is a cheaper chat option.

## Troubleshooting

If `GET /v1/models` succeeds but `generateText` returns `provider_error` / `MODEL_NOT_FOUND`, TokenHub has accepted the internal API Key and selected a route, but the upstream Provider rejected the route's `provider_model`.

Fix it in TokenHub Admin:

- Open `路由策略`.
- Find the row whose `统一模型` matches `TOKENHUB_MODEL`.
- Set `上游模型` to the exact model/deployment name accepted by that Provider.

For OpenAI-compatible providers, TokenHub sends the route's `上游模型` as the request body's `model`.
