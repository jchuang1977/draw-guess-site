import { createModels } from "@earendil-works/pi-ai/models";
import { openaiProvider } from "@earendil-works/pi-ai/providers/openai";
import { anthropicProvider } from "@earendil-works/pi-ai/providers/anthropic";
import { googleProvider } from "@earendil-works/pi-ai/providers/google";
import { openrouterProvider } from "@earendil-works/pi-ai/providers/openrouter";
import { githubCopilotProvider } from "@earendil-works/pi-ai/providers/github-copilot";

export const runtime = "edge";

export function modelCatalog() {
  const models = createModels();
  for (const factory of [openaiProvider, anthropicProvider, googleProvider, openrouterProvider, githubCopilotProvider]) {
    models.setProvider(factory());
  }
  return models;
}

export async function GET() {
  const models = modelCatalog();
  const providers = models.getProviders().map(provider => ({
    id: provider.id,
    name: provider.name,
    apiKey: provider.id !== "github-copilot",
    oauth: provider.id === "github-copilot" ? { label: "使用 GitHub Copilot 訂閱帳號登入", subscription: true } : null,
    connected: false,
    stored: false,
    authType: null,
    models: models.getModels(provider.id)
      .filter(model => model.input?.includes("image"))
      .map(model => ({ id: model.id, name: model.name || model.id })),
  })).filter(provider => provider.models.length);
  return Response.json({ providers }, { headers: { "Cache-Control": "public, max-age=3600" } });
}
