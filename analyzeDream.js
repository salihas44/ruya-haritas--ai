// netlify/functions/analyzeDream.js
// Bu fonksiyon Netlify Functions üzerinde çalışır ve OpenAI'ye doğrudan HTTP isteği atar.

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY tanımlı değil");
    }

    const body = JSON.parse(event.body || "{}");
    const text = (body.text || "").toString().trim();

    if (!text || text.length < 10) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Rüya metni çok kısa." }),
      };
    }

    const prompt = `Aşağıdaki rüyayı psikolojik açıdan analiz et. 
Rüyadan şu 4 şeyi üret:
1) Duygu analizi (kısa paragraf)
2) Temalar & semboller (kısa paragraf)
3) Bilinçaltı mesajı (kısa paragraf)
4) Bugünkü ruh hali özeti (kısa paragraf)

Daha sonra rüyadaki önemli öğelerden en fazla 6 tane çıkar ve her birine bir tür ata: "emotion", "theme" veya "symbol".
Çıktıyı mutlaka geçerli JSON formatında şu yapıda döndür:

{
  "emotionText": "...",
  "themesText": "...",
  "subconsciousText": "...",
  "moodText": "...",
  "nodes": [
    { "label": "Öğe", "type": "emotion" },
    { "label": "Öğe2", "type": "symbol" }
  ]
}

Rüya metni: ${text}`;

    // OpenAI'ye HTTP isteği
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: prompt,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("OpenAI error:", response.status, errText);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "OpenAI isteği başarısız" }),
      };
    }

    const data = await response.json();
    const out = data.output?.[0]?.content?.[0];
    const raw = out?.text || out?.output_text || JSON.stringify(out || data);

    let json;
    try {
      json = JSON.parse(raw);
    } catch (e) {
      console.error("JSON parse error:", e, raw);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "AI yanıtı JSON değil" }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(json),
    };
  } catch (err) {
    console.error("Function error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Sunucu hatası", details: err.message }),
    };
  }
};
