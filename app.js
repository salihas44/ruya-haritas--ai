// =======================
// Firebase Başlangıç
// =======================
const firebaseConfig = {
  apiKey: "BURAYA_API_KEY",
  authDomain: "BURAYA_AUTH_DOMAIN",
  projectId: "BURAYA_PROJECT_ID",
  storageBucket: "BURAYA_BUCKET",
  messagingSenderId: "BURAYA_SENDER_ID",
  appId: "BURAYA_APP_ID",
};

// Boş bırakılırsa hata vermesin diye try-catch
let db = null;
try {
  if (firebaseConfig.apiKey && firebaseConfig.apiKey !== "BURAYA_API_KEY") {
    const app = firebase.initializeApp(firebaseConfig);
    db = firebase.firestore(app);
    console.log("Firebase bağlandı");
  } else {
    console.warn("Firebase config doldurulmadı. Kayıt özelliği pasif.");
  }
} catch (err) {
  console.error("Firebase başlatılamadı:", err);
}

// =======================
// DOM Referansları
// =======================
const dreamTextEl = document.getElementById("dreamText");
const analyzeBtn = document.getElementById("analyzeBtn");
const saveDreamBtn = document.getElementById("saveDreamBtn");
const charCountEl = document.getElementById("charCount");

const emotionAnalysisEl = document.getElementById("emotionAnalysis");
const themesAnalysisEl = document.getElementById("themesAnalysis");
const subconsciousAnalysisEl = document.getElementById("subconsciousAnalysis");
const moodSummaryEl = document.getElementById("moodSummary");
const dreamMapEl = document.getElementById("dreamMap");

// =======================
// Yardımcı Fonksiyonlar
// =======================

function updateCharCount() {
  const len = dreamTextEl.value.trim().length;
  charCountEl.textContent = `${len} karakter`;
}

dreamTextEl.addEventListener("input", updateCharCount);
updateCharCount();

// UI'da loading göstergesi
function setLoadingState(isLoading) {
  analyzeBtn.disabled = isLoading;
  analyzeBtn.textContent = isLoading ? "🔄 Çözümleme yapılıyor..." : "🔮 Rüyayı Çözümle";
}

// Haritayı temizle
function clearDreamMap() {
  dreamMapEl.innerHTML = "";
}

// Haritaya baloncuk ekle
function addNodeToMap(label, type = "symbol") {
  const node = document.createElement("div");
  node.className = `dream-node ${type}`;
  node.textContent = label;
  dreamMapEl.appendChild(node);
}

// =======================
// ANALİZ AKIŞI (NETLIFY FONKSİYONU İLE GERÇEK AI)
// =======================
async function handleAnalyzeClick() {
  const text = dreamTextEl.value.trim();
  if (text.length < 30) {
    alert("Daha detaylı bir rüya anlatırsan analiz daha anlamlı olur (en az 30 karakter).");
    return;
  }

  setLoadingState(true);
  clearDreamMap();

  try {
    const response = await fetch("/.netlify/functions/analyzeDream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error("AI isteği başarısız");
    }

    const result = await response.json();

    emotionAnalysisEl.textContent = result.emotionText;
    themesAnalysisEl.textContent = result.themesText;
    subconsciousAnalysisEl.textContent = result.subconsciousText;
    moodSummaryEl.textContent = result.moodText;

    if (Array.isArray(result.nodes)) {
      result.nodes.forEach((n) => addNodeToMap(n.label, n.type || "symbol"));
    }
  } catch (err) {
    console.error(err);
    alert("Analiz sırasında bir hata oluştu. Daha sonra tekrar dene.");
  } finally {
    setLoadingState(false);
  }
}

// =======================
// RÜYA KAYDI (Firebase)
// =======================
async function handleSaveDream() {
  const text = dreamTextEl.value.trim();
  if (!db) {
    alert("Firebase yapılandırılmadığı için kayıt özelliği pasif. Önce firebaseConfig'i doldur.");
    return;
  }
  if (text.length < 10) {
    alert("Kaydetmek için biraz daha uzun bir rüya yazman iyi olur.");
    return;
  }

  try {
    saveDreamBtn.disabled = true;
    saveDreamBtn.textContent = "Kaydediliyor...";

    await db.collection("dreams").add({
      text,
      createdAt: new Date().toISOString(),
    });

    alert("Rüya başarıyla kaydedildi! 🎉");
  } catch (err) {
    console.error(err);
    alert("Rüya kaydedilirken bir hata oluştu.");
  } finally {
    saveDreamBtn.disabled = false;
    saveDreamBtn.textContent = "💾 Rüyayı Kaydet";
  }
}

// =======================
// Event Listener'lar
// =======================
analyzeBtn.addEventListener("click", handleAnalyzeClick);
saveDreamBtn.addEventListener("click", handleSaveDream);
