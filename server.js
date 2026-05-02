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

  // ログ出力
  console.log("=== REQUEST ===");
  console.log("Time:", new Date().toISOString());
  console.log("IP:", req.ip);
  console.log("User-Agent:", req.headers["user-agent"]);
  console.log("Input:", text);

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
            content: `あなたはWebトラブルを整理し、ユーザーを安心させつつ適切な行動に導く専門家です。

以下のルールで答えてください：
・専門用語は使わない（初心者でも理解できる言葉にする）
・断定しない（〜の可能性があります、を使う）
・原因は3つ以内に絞る
・今すぐできる行動は1つだけ出す
・短く、読みやすくする（長文にしない）
・不安を煽りすぎないが、「放置リスク」は軽く伝える
・最後は安心できる一言で締める
・注意文は必ず以下をそのまま使う：

⚠ もし解決しない場合は、
設定や内部の問題が影響している可能性があります。

そのまま操作を続けると、
原因が分かりにくくなることもあるため注意が必要です。

さらに重要：
・「読むだけ」で終わらず、「1つ行動できる」構成にする
・ユーザーが「自分でやるか、相談するか」を自然に選べる流れにする
・営業っぽくしないが、相談が自然に選択肢に入るようにする

出力形式：

# 状況の整理
（ユーザーの状態をわかりやすく言い換える）

# 考えられる原因（多くても3つ）
1.
2.
3.

# まず試してほしいこと（1つだけ）
・具体的な行動を1つ

# 次の判断
（解決した場合 / しない場合の分岐を短く）

# ひとこと
（安心感のある締め）

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
