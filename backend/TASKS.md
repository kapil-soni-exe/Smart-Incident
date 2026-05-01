# 📋 Day-1 Sprint: Team Task Details

Is document me baki team members ke liye detail me bataya gaya hai ki unhe kya aur kaise implement karna hai.

---

## 🏗️ Backend Integrations (Developer 2)
**Tera Goal:** System ko "Bolne" layak banana (Notifications & AI).

1.  **Redis + BullMQ Setup**: 
    - Saari notifications aur AI calls ko background me dalna hai. API request ke beech me ye mat karna varna system slow ho jayega.
    - Ek `emailQueue` aur `incidentQueue` banao.
2.  **Slack Alert Service**:
    - `POST /errors` me jab naya incident trigger ho, toh ek job queue me dalo.
    - Wo job Slack Webhook ko call karegi ek sundar UI format me (Title, Service, Severity).
3.  **OpenAI AI-Doctor**:
    - Incident bante hi uska stack trace OpenAI ko bhej kar "How to fix this?" pucho.
    - Jo response aaye usse `IncidentModel` ke `description` ya `aiSuggestion` field me update kar do.

---

## 🎨 Frontend Dashboard (Developer 3)
**Tera Goal:** Team ko unke gunah (Errors) dikhana.

1.  **Incident Feed**:
    - `GET /api/v1/errors` call karke aggregated list dikhao.
    - Filtering lagao: Service wise aur Severity (Red for Critical, Yellow for Medium) wise.
2.  **Error Detail View**:
    - Jab koi incident pe click kare, toh uska full stack trace aur metadata (IP, OS, Browser) dikhao.
    - **AI Suggestion Box**: OpenAI ne jo solution diya hai, usse highlight karke dikhao.
3.  **Real-time Update**:
    - Simple polling ya WebSockets (agar time mile) use karke dashboard ko fresh rakho.

---

## 📦 SDK Development (Developer 4)
**Tera Goal:** Error detect karne wali "Ambulance" banana.

1.  **The NPM SDK**:
    - Ek class ya function banao `SmartIncident.init({ apiKey, endpoint })`.
    - `window.onerror` aur `window.onunhandledrejection` ko override karo.
    - Jaise hi browser me error aaye, SDK ko automatically hamare server par `POST` karna hai sara data.
2.  **Onboarding Page**:
    - Ek simple page jahan log register karke apni `apiKey` le sakein.
    - Wahan SDK ko integrate karne ka code snippet (Copy-Paste) dikhao.

---

## 💡 System Logic (Samajh lo pehle)
- **Aggregation**: Same fingerprint wale error ka sirf `count` badhega, naya record nahi banega.
- **Incident Promotion**: 10 count hote hi backend automatically `Incident` create kar dega.
- **Data Flow**: SDK ➔ Backend API ➔ Aggregation ➔ Threshold Check ➔ BullMQ ➔ Slack/OpenAI.

---

**Bhaiyon, bina kisi confusion ke kaam pe lag jao! Best of luck.**
