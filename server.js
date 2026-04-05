const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("AI diagnose server is running");
});

// 使えるモデル確認用
app.get("/api/models", async (req, res) => {
  try {
    const response = await fetch("https://api.anthropic.com/v1/models", {
      method: "GET",
      headers: {
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      }
    });

    const data = await response.json();
    console.log("models一覧:", data);
    res.json(data);
  } catch (err) {
    console.error("models取得エラー:", err);
    res.status(500).json({ error: "models取得に失敗しました" });
  }
});

// 診断API
app.post("/api/diagnose", async (req, res) => {
  const text = req.body.input || "";

  try {
    console.log("APIキー先頭:", process.env.ANTHROPIC_API_KEY?.slice(0, 12));
    console.log("送信モデル:", "claude-sonnet-4-6");
    console.log("受信テキスト:", text);

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 500,
        messages: [
          {
            role: "user",
            content: `あなたはWebトラブルを整理する専門家です。

以下のルールで答えてください：
・専門用語をできるだけ使わない
・断定しない（〜の可能性があります、を使う）
・原因は3つ以内
・今できる確認を1つだけ出す
・最後は安心できる一言で終わる
・日本語で、見出しつきでわかりやすく出す
・もし不安が残る場合は「専門家に相談するのも一つです」と自然に案内する

出力形式：
【現在の状況】
【考えられる原因】
【今できる確認】
【ひとこと】

入力：
${text}`
          }
        ]
      })
    });

    const data = await response.json();
    console.log("返ってきたデータ:", data);

    const result =
      data?.content?.[0]?.text ||
      data?.error?.message ||
      "AIからの応答が取得できませんでした";

    res.json({ result });
  } catch (err) {
    console.error("エラー:", err);
    res.status(500).json({
      result: "エラーが発生しました。もう一度お試しください。"
    });
  }
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});