import React, { useState } from "react";
import axios from "axios";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer
} from "recharts";

function App() {
  const [file, setFile] = useState(null);
  const [question, setQuestion] = useState("");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  // ✅ SAFE API URL (fallback added)
  const API =
    process.env.REACT_APP_API_URL ||
    "https://ai-dashboard-backend.onrender.com"; // 🔥 replace if using other link

  console.log("API URL:", API); // debug

  // Upload CSV
  const uploadFile = async () => {
    if (!file) {
      alert("Please select a file");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      await axios.post(`${API}/upload`, formData);
      alert("✅ File Uploaded");
    } catch (err) {
      console.error(err);
      alert("❌ Upload failed");
    }
  };

  // Ask question
  const askAI = async () => {
    if (!question) {
      alert("Enter a question");
      return;
    }

    setLoading(true);

    try {
      const res = await axios.post(`${API}/ask`, { question });
      console.log("Response:", res.data); // debug
      setData(res.data);
    } catch (err) {
      console.error(err);
      alert("❌ Error fetching data");
    }

    setLoading(false);
  };

  // Insight generator
  const getInsight = () => {
    if (!data.length) return "";

    let maxItem = data[0];

    data.forEach(item => {
      if (item.value > maxItem.value) {
        maxItem = item;
      }
    });

    return `📊 Insight: ${maxItem.name} has the highest value (${maxItem.value}).`;
  };

  return (
    <div style={{
      backgroundColor: "#0f172a",
      minHeight: "100vh",
      color: "white",
      padding: "30px",
      fontFamily: "sans-serif"
    }}>
      <h1 style={{ fontSize: "32px", marginBottom: "20px" }}>
        📊 AI Data Dashboard
      </h1>

      {/* Upload */}
      <div style={{ marginBottom: "20px" }}>
        <input type="file" onChange={(e) => setFile(e.target.files[0])} />
        <button style={btn} onClick={uploadFile}>Upload</button>
      </div>

      {/* Ask */}
      <div style={{ marginBottom: "20px" }}>
        <input
          style={input}
          placeholder="Ask something like: total revenue by product"
          onChange={(e) => setQuestion(e.target.value)}
        />
        <button style={btn} onClick={askAI}>Ask</button>
      </div>

      {/* Loading */}
      {loading && (
        <p style={{ color: "#38bdf8" }}>⏳ Processing...</p>
      )}

      {/* Chart */}
      <div style={{
        background: "#1e293b",
        padding: "20px",
        borderRadius: "10px"
      }}>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <XAxis dataKey="name" stroke="#ccc" />
            <YAxis stroke="#ccc" />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1e293b",
                border: "none",
                borderRadius: "8px",
                color: "white"
              }}
              itemStyle={{ color: "#38bdf8" }}
              cursor={{ fill: "rgba(255,255,255,0.05)" }}
            />
            <Bar dataKey="value" fill="#38bdf8" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Insight */}
      {data.length > 0 && (
        <p style={{
          marginTop: "15px",
          color: "#94a3b8",
          fontSize: "16px"
        }}>
          {getInsight()}
        </p>
      )}
    </div>
  );
}

// Button style
const btn = {
  marginLeft: "10px",
  padding: "8px 14px",
  background: "#38bdf8",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontWeight: "bold"
};

// Input style
const input = {
  padding: "8px",
  width: "300px",
  borderRadius: "6px",
  border: "none",
  outline: "none"
};

export default App;