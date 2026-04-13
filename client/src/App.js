import React, { useState } from "react";
import axios from "axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from "recharts";

function App() {
  const [file, setFile] = useState(null);
  const [question, setQuestion] = useState("");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const API =
    process.env.REACT_APP_API_URL ||
    "https://ai-dashboard-backend.onrender.com";

  // =====================
  // Upload CSV
  // =====================
  const uploadFile = async () => {
    if (!file) {
      setMessage("⚠️ Please select a file");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      await axios.post(`${API}/upload`, formData);
      setMessage("✅ File uploaded successfully");
      setData([]);
    } catch (err) {
      console.error(err);
      setMessage("❌ Upload failed");
    }
  };

  // =====================
  // Ask Question
  // =====================
  const askAI = async () => {
    if (!question) {
      setMessage("⚠️ Enter a question");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const res = await axios.post(`${API}/ask`, { question });

      if (!res.data || res.data.length === 0) {
        setData([]);
        setMessage("📭 No data found. Try a different question.");
      } else {
        setData(res.data);
      }
    } catch (err) {
      console.error(err);
      setMessage("❌ Error fetching data");
    }

    setLoading(false);
  };

  // =====================
  // Insight
  // =====================
  const getInsight = () => {
    if (!data.length) return "";

    let max = data[0];
    data.forEach(d => {
      if (d.value > max.value) max = d;
    });

    return `📊 Insight: ${max.name} has the highest value (${max.value.toLocaleString()}).`;
  };

  // =====================
  // Custom Tooltip (🔥 PRO UI)
  // =====================
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: "#0f172a",
          border: "1px solid #334155",
          borderRadius: "10px",
          padding: "10px",
          color: "white"
        }}>
          <p style={{ color: "#38bdf8", fontWeight: "bold" }}>
            {label}
          </p>
          <p>Value: {payload[0].value.toLocaleString()}</p>
        </div>
      );
    }
    return null;
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
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
        />
        <button style={btn} onClick={askAI}>Ask</button>
      </div>

      {/* Message */}
      {message && (
        <p style={{ color: "#94a3b8", marginBottom: "10px" }}>
          {message}
        </p>
      )}

      {/* Loading */}
      {loading && (
        <p style={{ color: "#38bdf8" }}>⏳ Processing...</p>
      )}

      {/* Chart */}
      {data.length > 0 && (
        <div style={{
          background: "#1e293b",
          padding: "20px",
          borderRadius: "10px"
        }}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <XAxis dataKey="name" stroke="#ccc" />
              <YAxis stroke="#ccc" />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" fill="#38bdf8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

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

// Styles
const btn = {
  marginLeft: "10px",
  padding: "8px 14px",
  background: "#38bdf8",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontWeight: "bold"
};

const input = {
  padding: "8px",
  width: "300px",
  borderRadius: "6px",
  border: "none",
  outline: "none"
};

export default App;