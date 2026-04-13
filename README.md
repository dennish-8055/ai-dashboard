# 📊 AI Data Dashboard

An intelligent web application that allows users to upload CSV files, ask natural language questions, and visualize insights instantly using AI.

---

## 🚀 Live Demo

Frontend: https://ai-dashboard-three-rouge.vercel.app
Backend: https://ai-dashboard-backend.onrender.com

---

## ✨ Features

* 📁 Upload any CSV file
* 🤖 Ask questions in plain English
* 📊 Automatic data aggregation
* 📈 Interactive bar chart visualization
* 🧠 AI-powered query understanding (Google Gemini)
* 🔍 Smart column detection (works with different datasets)
* 💡 Auto-generated insights

---

## 🧠 Example Questions

* total revenue by product
* total sales by region
* total units by category
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

## 🌐 Deployment

* Frontend deployed on Vercel
* Backend deployed on Render

No need to keep your laptop running — app is hosted online.

---

## ⚠️ Limitations

* Supports aggregation queries only (sum-based)
* Does not support filtering (e.g., only Asia)
* Does not support advanced analytics (avg, min, max)

---

## 🚀 Future Improvements

* Top N results (Top 5 products)
* Filtering support (region-based queries)
* Multiple chart types (line, pie)
* Sorting & time-series analysis
* Better AI query understanding

---

## 👨‍💻 Author

Developed by Dennish

---

## 📜 License

This project is for educational purposes.
