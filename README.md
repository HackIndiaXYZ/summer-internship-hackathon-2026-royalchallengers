# Medo-Veda

**Medo-Veda** is a state-of-the-art AI-powered health and clinical analysis suite designed to simplify and enhance the way users understand healthcare data and product ingredients. 

Combining the principles of personalized health with advanced 9-agent AI pipelines, Medo-Veda delivers deep, actionable insights into dietary habits, ingredient transparency, and overall wellness.

---

## 🛠️ Technology Stack

### **Frontend**
- **React.js & Vite**: Modern, lightning-fast development framework.
- **TailwindCSS**: Utitlity-first styling for premium, responsive UI.
- **Google Fonts (Outfit & Inter)**: Precision typography for a professional, clinical feel.
- **Lucide & Material Symbols**: High-fidelity iconography.

### **Backend**
- **Node.js & Express**: High-performance API architecture.
- **Google Cloud Platform**: Leverages Gemini 1.5 Pro and Flash for complex clinical analysis.
- **Cheerio & Puppeteer (Web Grounding)**: Real-time ingredient research and verification.

---

## 🏗️ Core Features

- **🔬 9-Agent Clinical Analysis**: Deep research into any product's ingredients, potential allergens, and long-term health impacts.
- **📊 Interactive Bento-Grid Dashboard**: A clean, responsive interface for tracking health metrics and history at a glance.
- **🎙️ Multi-modal Input**: Scan barcodes, upload images of labels, or use voice commands for seamless analysis.
- **📈 Personal Health Scoring**: Intelligent scoring system that adapts based on your specific health profile and demographic.
- **📱 Fully Mobile Responsive**: A premium experience across all devices, from ultra-wide desktops to small smartphones.

---

## 🚦 Getting Started

### Prerequisites
- Node.js (v18+)
- npm or yarn
- Google Cloud API Key (for Gemini)

### Setup

1. **Clone the project**
   ```bash
   git clone https://github.com/Dineshkumar2006471/Medo-veda.git
   cd Medo-veda
   ```

2. **Backend Configuration**
   ```bash
   cd backend
   npm install
   # Create a .env file with your GEMINI_API_KEY
   npm start
   ```

3. **Frontend Configuration**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

---

## 🚀 Deployment

### Backend (Render / Railway)
1. Deploy the `backend/` directory as a "Web Service".
2. Set Environment Variables:
   - `PORT=3001`
   - `GEMINI_API_KEY=your_google_ai_key`
   - `DATABASE_URL=your_db_connection_string`

### Frontend (Vercel)
1. Link your GitHub repo to Vercel.
2. Root directory: `frontend`
3. Framework Preset: `Vite`
4. Set Environment Variables:
   - **`VITE_API_URL`**: Set this to your **deployed backend URL** (e.g., `https://medoveda-backend.onrender.com`).
5. Click **Deploy**.

---

## 👨‍⚕️ Design Philosophy
Medo-Veda follows a "Clinical Bento" design architecture, focusing on high contrast, readability, and information density without a cluttered experience. Our goal is to make healthcare data as accessible and beautiful as top-tier consumer apps.

---

## 📄 License
This project is for academic and HackIndia hackathon purposes.
