# 📊 AI Data Dashboard

An intelligent web application that allows users to upload CSV files, ask natural language questions, and visualize insights instantly using AI.

---

## 🚀 Live Demo

* 🌐 Frontend: https://ai-dashboard-three-rouge.vercel.app
* ⚙️ Backend: https://ai-dashboard-backend.onrender.com

---

## ✨ Features

* 📁 Upload any CSV file
* 🤖 Ask questions in plain English
* 📊 Automatic data aggregation
* 📈 Interactive bar chart visualization
* 🧠 AI-powered query understanding (Google Gemini)
* 🔍 Smart column detection (works across different datasets)
* 💡 Auto-generated insights (highest value detection)

---

## 🧠 Example Questions

Try asking:

* total revenue by product
* total sales by region
* total units by category
* total salary by department
* total revenue by date

---

## 🏗️ Tech Stack

### Frontend

* React.js
* Axios
* Recharts

### Backend

* Node.js
* Express.js
* Multer (file upload)
* csv-parser

### AI Integration

* Google Gemini API

### Deployment

* Frontend: Vercel
* Backend: Render

---

## 📂 Project Structure

```
ai-dashboard/
│
├── client/        # React frontend
│   └── src/
│       └── App.js
│
├── server/        # Node.js backend
│   └── index.js
│
└── README.md
```

---

## ⚙️ Setup Instructions

### 1️⃣ Clone the repository

```
git clone https://github.com/your-username/ai-dashboard.git
cd ai-dashboard
```

---

### 2️⃣ Backend Setup

```
cd server
npm install
```

Create a `.env` file:

```
GEMINI_API_KEY=your_api_key_here
```

Run backend:

```
node index.js
```

Server runs on:

```
http://localhost:5000
```

---

### 3️⃣ Frontend Setup

```
cd client
npm install
```

Create `.env`:

```
REACT_APP_API_URL=http://localhost:5000
```

Run frontend:

```
npm start
```

---

## 📊 How It Works

1. Upload a CSV file
2. Ask a question (e.g., "total revenue by region")
3. AI detects:

   * Category column (grouping)
   * Metric column (numeric value)
4. Backend aggregates data
5. Frontend renders chart + insight

---

## ⚠️ Limitations

* Supports aggregation queries only (sum-based)
* Does not support filtering (e.g., "only Asia")
* Limited support for advanced analytics (avg, min, max)
* Depends on meaningful column names in CSV

---

## 🚀 Future Improvements

* 🔝 Top N results (Top 5 products)
* 🔎 Filtering support (region/date-based queries)
* 📊 Multiple chart types (line, pie)
* 📅 Time-series analysis
* 🧠 Improved AI query understanding

---

## 👨‍💻 Author

Developed by **Dennish**

---

## 📜 License

This project is licensed under the MIT License.
