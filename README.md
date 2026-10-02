# 畫點什麼｜ChatGPT Sites 公開版

這是 `../draw-guess` 的公開站台版本，沿用相同的畫板與臺灣繁體中文遊戲介面，使用 Vinext / Cloudflare Workers 處理模型請求。

公開版讓每位訪客自行登入模型供應商，不需手動貼 API 金鑰：

- GitHub Copilot：開啟 GitHub 裝置登入頁，輸入畫面上的代碼。本站依該帳號可用的圖片模型顯示選項；需要 Copilot 使用權限。
- OpenRouter：透過公開 HTTPS 回呼與 PKCE 完成帳號授權。OpenRouter 會在背景發給該使用者連線憑證；可選其提供的 GPT、Claude、Gemini 等圖片模型，用量依 OpenRouter 帳號計算。

兩種授權憑證都只存在該訪客分頁的 `sessionStorage`；送出猜畫時傳到本站 Worker，再轉交對應模型服務。伺服器不會持久儲存憑證。OpenRouter 登入前會暫存目前畫布，返回後還原。站內「移除此分頁的連線」只清除本地憑證；若要撤銷 OpenRouter 產生的授權金鑰，須到該帳號管理頁操作。

pi-ai 的 ChatGPT 與 Claude 訂閱 OAuth 使用固定的 `localhost` 回呼，不能在公開 Sites 網址自動接回；Google provider 在此 SDK 沒有相同的帳號登入流程。這些供應商的模型可經 OpenRouter 帳號選用，但不會使用訪客的 ChatGPT／Claude 訂閱權益。

本機驗證：`npm ci`、`npm run build`、`npm start -- --port 4175`。站台身分記錄於 `.openai/hosting.json`，使用 Sites 工作流程發佈。
