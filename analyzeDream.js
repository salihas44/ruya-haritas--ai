// netlify/functions/analyzeDream.js
// Bu fonksiyon, OpenAI API'sini kullanarak rüyayı analiz eder.
// Netlify'da OPENAI_API_KEY adlı environment variable tanımlaman gerekiyor.

const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
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

    const completion = await client.responses.create({
      model: "gpt-4.1-mini",
      input: prompt,
      response_format: { type: "json_object" },
    });

    const out = completion.output?.[0]?.content?.[0];
    const raw = out?.text || out?.output_text || JSON.stringify(out);

    if (!raw) {
      throw new Error("AI yanıtı boş geldi.");
    }

    let data;
    try {
      data = JSON.parse(raw);
    } catch (e) {
      throw new Error("AI yanıtı geçerli JSON değil.");
    }

    return {
      statusCode: 200,
      body: JSON.stringify(data),
    };
  } catch (err) {
    console.error("AI hata:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Sunucu hatası", details: err.message }),
    };
  }
};
