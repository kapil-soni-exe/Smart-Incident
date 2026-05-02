# 🚨 OpusGuard

**OpusGuard** ek advanced Sentry-like error aggregation aur incident management engine hai. Ye aapki full-stack applications ke raw errors ko intelligently process karta hai, unhe aggregate karta hai, aur jab issues serious ho jaate hain toh incidents generate karke alerts bhejta hai. AI powered insights se bugs ko fix karna aur bhi aasan ho jata hai.

---

## 🛠️ Project Flow (Ye System Kaise Kaam Karta Hai?)

Hamara platform errors capture karne se lekar unhe dashboard pe dikhane aur Slack pe alert aane tak ka poora flow cover karta hai:

1. **Error Capture (Client-Side SDK)**: 
   Hamara custom `opus` client browser ya Node app me integrate hota hai. Jab bhi koi JavaScript error aata hai, SDK usko pakad kar hamare Backend API par bhej deta hai.
   
2. **Error Normalization & Fingerprinting (Backend)**:
   Backend jab error receive karta hai, toh usme se dynamic values (jaise numbers, IDs) ko hata kar ek normalized string banata hai. Is string, service, aur operation ka use karke ek **MD5 Fingerprint** generate hota hai taaki same errors ko pehchana ja sake.

3. **Smart Aggregation (1-Minute Window)**:
   System check karta hai ki kya same fingerprint wala koi error last 1 minute me aaya hai. 
   - Agar haan, toh DB me naya record banane ki jagah purane wale ka `count` badh jata hai. (Is se Database spam nahi hota).
   - Agar naya hai, toh fresh error record create hota hai.

4. **Incident Generation (Threshold Layer)**:
   Jaise hi kisi specific error ka count ek threshold (limit = 10) ko hit karta hai, system automatically ek **Incident** create kar deta hai. Iska matlab ab ye ek critical issue ban chuka hai.

5. **Background Processing & AI Insights (BullMQ + OpenAI)**:
   Incidents generate hone ke baad, hum **BullMQ** aur Redis ka use karke heavy tasks background me bhejte hain. Yahan **OpenAI** integration ki madad se error stack trace ko analyze kiya jata hai, aur developers ke liye "Kaise fix karein?" par AI suggestions generate hote hain.

6. **Alerting & Notification**:
   Incident create hone par team ko turant **Slack webhook** par notification bhej di jati hai.

7. **Frontend Dashboard**:
   Developers frontend dashboard me login karke, errors ke real-time metrics, incident details, aur AI suggestions ko dekh sakte hain.

---

## 💻 Tech Stack (Humne Kya Use Kiya Hai?)

### Frontend
- **React (Vite)**: Fast aur modern UI ke liye.
- **Tailwind CSS**: Styling, dark mode, aur responsive design ke liye.
- **Recharts**: Dashboard pe error analytics aur charts dikhane ke liye.
- **Axios & React Router DOM**: API calls aur routing.
- **Lucide React**: Beautiful icons.

### Backend
- **Node.js & Express**: API server create karne ke liye.
- **MongoDB (Mongoose)**: Errors, incidents aur user data store karne ke liye (30-day auto-cleanup TTL indexes ke sath).
- **BullMQ & Redis**: Background job queues ke liye taaki heavy tasks jaise AI aur Slack alerts asynchronous run ho sakein.
- **OpenAI API**: Error logs read karke fixes aur suggestions generate karne ke liye.
- **JWT & bcryptjs**: Authentication aur secure login ke liye.

### SDK
- **Vanilla JavaScript**: Ek lightweight custom SDK (`opus`) jo kisi bhi project me easily integrate ho jaye bina zyada dependencies ke.

---

## 🚀 Key Features

- **Auth & Dashboard**: Secure login aur intuitive dashboard jisme total errors, active incidents, aur any metrics ko dikhane ke liye.
- **AI Error Assistant**: OpenAI ki madad se incident root cause aur code fix suggestions frontend par display hote hain.
- **Slack Alerting**: Critical incidents aate hi slack channel pe message broadcast karna.
- **De-duplication**: MD5 hashing ke through same error ko baar-baar naya record banane se rokta hai.

---

## 🎯 Use Cases (Is System Ko Kahan Use Karein?)

Ye system un sabhi applications ke liye zaroori hai jahan production errors ko track karna aur fast fix karna priority hai:
- **E-commerce Websites**: Jahan payment gateways ya cart me aane wale errors ko track karna bohot important hota hai. Ek chhota error revenue loss karwa sakta hai.
- **SaaS Platforms**: Taaki users (customers) ko bugs ka pata lagne se pehle hi developers ko pata chal jaye aur woh issue resolve kar lein.
- **Enterprise Internal Tools**: Apne company ke projects ki reliability badhane ke liye aur IT team ko automatically alert karne ke liye.
- **High-Traffic Production Apps**: Jahan server errors aur client-side crashes ko manually track karna impossible hota hai.

---

## 🛠️ Usage (Is System Ko Kaise Use Karein?)

Is system ko use karna bahut hi simple hai:

1. **System Start Karein**: Sabse pehle apne Backend aur Frontend servers ko start karein (neeche Setup instructions dekhein).
2. **SDK Integrate Karein**: Apne kisi bhi naye ya existing project (React, Node.js, ya Vanilla JS) me hamara custom `opus` package install/import karein.
3. **Initialize Karein**: Apne app ki main entry file me SDK ko sirf is tarah initialize karein:
   ```javascript
   import { Opus } from 'opus';
   
   Opus.init({
     dsn: 'http://localhost:5000/api/v1/errors', // Aapke backend API ka URL
     service: 'my-frontend-app'
   });
   ```
4. **Automatic Tracking**: Ab aapke application me jab bhi koi unhandled error aayega, SDK use automatically pakad kar OpusGuard backend pe bhej dega. Aap khud bhi `Opus.captureException(error)` function se custom errors bhej sakte hain.
5. **Dashboard Monitor Karein**: Developers frontend dashboard me login karke aane wale errors dekh sakte hain. Jab kisi error ka count threshold cross karega, tab automatically Incident generate hoga aur Slack par alert aa jayega. OpenAI aapko frontend pe us error ko fix karne ka suggestion bhi dega.

---

## 📂 Codebase Structure

Hamara project ek modular structure follow karta hai:

```text
📦 Smart-Incident
 ┣ 📂 backend          # Node.js + Express API Server, BullMQ Workers, Mongoose Models
 ┣ 📂 frontend         # React + Tailwind Dashboard
 ┣ 📂 sdk              # opus for client side error capturing
 ┗ 📜 README.md
```

---

## ⚙️ Setup Instructions (Local me kaise chalayein?)

### 1. Backend Setup
1. `backend` folder me jayein: `cd backend`
2. Dependencies install karein: `npm install`
3. Ek `.env` file banayein aur apna configuration dalein (MongoDB URI, Redis URI, OpenAI Key, Slack Webhook, JWT Secret).
4. Server run karein: `npm run dev`

### 2. Frontend Setup
1. `frontend` folder me jayein: `cd frontend`
2. Dependencies install karein: `npm install`
3. Development server run karein: `npm run dev`

### 3. SDK Testing
1. `sdk` folder me jayein: `cd sdk`
2. Aap SDK ko node ke jariye test kar sakte hain: `npm run test` (make sure backend is running).

---

Ek baar setup ho jaye toh aapka **OpusGuard** aapko errors pakadne aur team ko alert karne ke liye bilkul taiyar hai! 🎉
