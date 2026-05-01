# 🚨 Smart Incident Response Platform (SIRP)

SIRP ek advanced error aggregation engine hai jo raw errors ko intelligently process karke actionable incidents me convert karta hai. Ye system especially high-traffic applications ke liye design kiya gaya hai taaki developers logs me na doobein.

---

## 🛠️ Current Implementation Details (Mene kya kiya hai)

Hume abhi tak system ka **Core Processing Engine** ready kar liya hai. Neeche iske main components samjhaye gaye hain:

### 1. Error Normalization & Fingerprinting
Jab koi error system me aata hai, toh hum usse directly store nahi karte. 
- **Normalization**: Sabse pehle message se dynamic values (jaise numbers, IDs) hata di jati hain (e.g., `User 123 failed` ➔ `User failed`).
- **Hashing**: Message, Service, aur Operation ko mila kar ek unique **MD5 Fingerprint** banaya jata hai.
- **Benefit**: Isse different users ke same errors ek hi group me aate hain.

### 2. Smart Aggregation (1-Minute Window)
System ye check karta hai ki kya pichle **1 minute** me same fingerprint wala koi "active" error aaya hai?
- **Aggregated**: Agar haan, toh naya record banane ki jagah purane record ka `count` badha diya jata hai aur `lastSeen` update hota hai.
- **New**: Agar error naya hai ya 1 min se purana hai, toh ek fresh record banta hai.
- **Benefit**: DB spam nahi hota aur aggregation super efficient rehti hai.

### 3. Error ➔ Incident Transition (Threshold Layer)
Hamara system "Error" aur "Incident" me fark samajhta hai:
- **Threshold**: Humne limit **10** set ki hai.
- **Logic**: Jaise hi kisi error ka count 10 hit karta hai, system automatically ek **Incident Record** create kar deta hai. 
- **Benefit**: Team ko har error pe alert nahi milta, sirf tab milta hai jab koi issue serious (Frequent) ho jaye.

---

## 📂 Codebase Structure
- **`src/model/erros.models.js`**: Isme aggregation fields (`count`, `firstSeen`, `lastSeen`) aur TTL index (30-day auto-cleanup) hai.
- **`src/model/incident.models.js`**: Ye high-level incidents (Alerts) ka schema hai.
- **`src/contollers/error.controller.js`**: Yahan sara "Smart" logic (Normalization + Aggregation + Threshold) likha hai.
- **`src/routes/error.routes.js`**: API endpoints define kiye gaye hain.

---

## 🚀 Active API Endpoints

| Endpoint | Method | Input | Result |
| :--- | :--- | :--- | :--- |
| `/api/v1/errors` | `POST` | Raw Error Data | Aggregate or Create New |
| `/api/v1/errors` | `GET` | Query Params | Dashboard Data (Filtered & Sorted) |

---

> [!NOTE]
> Agle steps aur team assignments ke liye **TASKS.md** dekhein.
