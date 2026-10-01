# 畫點什麼｜ChatGPT Sites 公開版

這是 `../draw-guess` 的公開站台版本，沿用相同的畫板與繁體中文遊戲介面，使用 Vinext / Cloudflare Workers 執行模型請求。

- OpenAI、Anthropic、Google、OpenRouter：訪客自行輸入 API 金鑰。
- GitHub Copilot：訪客透過 GitHub 裝置代碼登入，站台會依帳號可用模型顯示選項。
- 金鑰與 GitHub 授權憑證只存在該訪客分頁的 `sessionStorage`；送出猜畫時會傳到本站 Worker，再轉交模型服務。伺服器不會持久儲存憑證。
- ChatGPT 與 Claude 的訂閱 OAuth 在原本本機版需要本機回呼；公開站台目前只提供 GitHub Copilot 訂閱登入。

本機驗證：`npm ci`、`npm run build`、`npm start -- --port 4175`。站台身分記錄於 `.openai/hosting.json`，使用 Sites 工作流程發佈。
