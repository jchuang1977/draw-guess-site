import OpenCC from "opencc-js";
import { modelCatalog } from "../bootstrap/route";
import { copilotAuth } from "../../lib/copilot";

export const runtime = "edge";

const toTaiwanese = OpenCC.Converter({ from: "cn", to: "twp" });

function error(message: string, status: number) {
  return Response.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });
}

function modelError(message: string) {
  if (/401|unauthorized|invalid.*key|authentication/i.test(message)) return "模型驗證失敗，請檢查帳號或 API 金鑰。";
  if (/403|forbidden|permission/i.test(message)) return "這個帳號沒有使用所選模型的權限，請換個模型。";
  if (/429|rate.?limit|quota|credit|insufficient/i.test(message)) return "模型額度不足或請求太頻繁，請稍後再試。";
  if (/404|model.*(not found|unsupported|unavailable)/i.test(message)) return "找不到所選模型，請到模型設定更換模型。";
  return "模型服務暫時無法回應，請稍後再試。";
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return error("請求來源不符", 403);
  if (!request.headers.get("content-type")?.startsWith("application/json")) return error("請傳送 JSON 資料", 415);
  if (Number(request.headers.get("content-length") || 0) > 5_000_000) return error("圖片太大，請清空畫布後再試一次", 413);
  let payload: { providerId?: string; modelId?: string; image?: string; credential?: { type?: string; key?: string; token?: string } };
  try {
    const raw = await request.text();
    if (raw.length > 5_000_000) return error("圖片太大，請清空畫布後再試一次", 413);
    payload = JSON.parse(raw);
  } catch { return error("JSON 格式錯誤", 400); }

  const { providerId, modelId, image, credential } = payload;
  const models = modelCatalog();
  const model = providerId && modelId ? models.getModel(providerId, modelId) : null;
  if (!model?.input?.includes("image")) return error("請選擇支援圖片辨識的模型", 400);
  if (typeof image !== "string" || !/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(image)) return error("畫布圖片格式錯誤", 400);

  let apiKey: string;
  let requestModel = model;
  try {
    if (providerId === "github-copilot") {
      if (credential?.type !== "copilot" || !credential.token || credential.token.length > 2048) return error("請先登入 GitHub Copilot", 401);
      const auth = await copilotAuth(credential.token);
      apiKey = auth.apiKey;
      requestModel = { ...model, baseUrl: auth.baseUrl };
    } else {
      if (credential?.type !== "api_key" || !credential.key?.trim() || credential.key.length > 2048) return error("請先設定 API 金鑰", 401);
      apiKey = credential.key.trim();
    }

    const response = await models.complete(requestModel, {
      systemPrompt: "你正在玩你畫我猜。只根據圖片猜測畫中的主要物品或場景，不要猜題目來源。請使用臺灣慣用的繁體中文回答。第一行只寫一個最可能的簡短答案，第二行可以輕鬆說明理由。即使不確定，也要給出一個猜測。不要使用 Markdown 格式。",
      messages: [{
        role: "user",
        content: [
          { type: "text", text: "你覺得我畫的是什麼？請大膽猜猜看。" },
          { type: "image", data: image.slice("data:image/png;base64,".length), mimeType: "image/png" },
        ],
        timestamp: Date.now(),
      }],
    }, { apiKey });
    if (response.stopReason === "error") return error(modelError(response.errorMessage || ""), 502);
    const answer = response.content.filter(block => block.type === "text").map(block => block.text).join("\n").trim();
    if (!answer) return error("模型沒有回傳猜測，請再試一次", 502);
    const [first, ...rest] = answer.replace(/^```[\s\S]*?\n|```$/g, "").split(/\r?\n/).filter(Boolean);
    return Response.json({ guess: toTaiwanese(first.replace(/^(答案|我猜|猜測|猜测)[：:]\s*/, "")).slice(0, 80), detail: toTaiwanese(rest.join(" ")).slice(0, 160) }, { headers: { "Cache-Control": "no-store" } });
  } catch (cause) {
    return error(modelError(cause instanceof Error ? cause.message : ""), 502);
  }
}
