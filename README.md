# 📊 AI Data Analyst Dashboard

## 🚀 Overview

This project is a web-based AI-powered data analysis dashboard that allows users to upload CSV files, ask questions in natural language, and visualize insights instantly.

It simplifies data analysis for non-technical users by combining data processing, visualization, and AI-based query interpretation.

---

## 🎯 Features

* 📂 Upload CSV files
* 💬 Ask questions in natural language
* 📊 Dynamic data visualization (Bar Charts)
* 📈 Automatic data aggregation
* 🧠 Insight generation (highest value detection)
* 🔒 Secure API key handling using environment variables
* ⚡ Fast and responsive UI

---

## 🛠️ Tech Stack

### Frontend

* React.js
* Recharts
* Axios

### Backend

* Node.js
* Express.js
* CSV Parser

### AI Integration

* Google Gemini API (with fallback mechanism)

---

## ⚙️ Installation & Setup

### 1️⃣ Clone the repository

```bash
git clone https://github.com/dennish-8055/ai-dashboard.git
cd ai-dashboard
```

---

### 2️⃣ Setup Backend

```bash
cd server
npm install
```

Create a `.env` file:

```env
GEMINI_API_KEY=your_api_key_here
```

Run backend:

```bash
node index.js
```

---

### 3️⃣ Setup Frontend

Open new terminal:

```bash
cd client
npm install
npm start
```

---

## 🧠 How It Works

1. User uploads a CSV file
2. Data is parsed and stored on the server
3. User asks a question (e.g., "total sales by product")
4. System interprets query
5. Data is processed and aggregated
6. Results are displayed as charts with insights

---

## 🔐 Security

* API keys are stored using `.env` files
* `.env` is excluded using `.gitignore`
* `.env.example` is provided for setup

---

## 📌 Example Queries

* “Total sales by product”
* “Show sales distribution”
* “Which product has highest sales?”

---

## 📈 Future Improvements

* Line and Pie charts
* Advanced AI query handling
* Dashboard saving feature
* Real-time analytics

---

## 👨‍💻 Author

* Dennish Yadav

---

## 📄 License

This project is for educational and internship purposes.
