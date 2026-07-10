# Conduit

The open-source interface layer for every API key you own.

Bring any API key — chat, image generation, search, code execution — and get a purpose-built interface for it. Self-hosted, full control, zero data leaves your machine.

## Deploy in 60 seconds

```bash
git clone https://github.com/picklem0b/Conduit.git
cd Conduit
cp .env.example .env
docker compose up --build
```

## Docs

→ [Gateway](./docs/gateway/routes.md)
→ [Providers](./docs/gateway/providers.md)
→ [Cascade](./docs/gateway/cascade.md)
→ [Deployment](./docs/deployment/docker.md)
→ [Environment](./docs/deployment/env.md)


## Interfaces

| Interface | Purpose | Port |
|-----------|---------|------|
| `interfaces/chat` | Chat + image + video + coding | 5173 |
| `interfaces/media` | Media creation + coding workspace | 5174 |
| `interfaces/tester` | API key discovery and testing | 5175 |
| `interfaces/landing` | Public landing page | 5176 |

## Stack

- **Gateway** — Bun + Hono (TypeScript) — routes, providers, cascade, streaming
- **Engine** — Python + FastAPI — data aggregation, health scoring, Redis orchestration
- **Interfaces** — React + Vite + Tailwind
- **Database** — Postgres (durable store) + Redis (fast-changing state)

## Providers

| Category | Providers |
|----------|-----------|
| Chat | Anthropic, OpenAI, Google, Groq, Ollama |
| Image | OpenAI Images, Stability AI |
| Search | SerpAPI, Brave Search |
| Code | E2B |

Add keys from the UI — no `.env` edits required.

## Configuration

Edit `conduit.config.toml` for cascade profiles, feature flags, and site routing.
Edit `.env` for secrets, ports, and connection strings.

## License

MIT — [LICENSE](./LICENSE)