import React, { useState } from "react";
import axios from "axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
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
  // Upload
  // =====================
  const uploadFile = async () => {
    if (!file) return setMessage("⚠️ Select a file");

    const formData = new FormData();
    formData.append("file", file);

    try {
      await axios.post(`${API}/upload`, formData);
      setMessage("✅ Uploaded successfully");
      setData([]);
    } catch {
      setMessage("❌ Upload failed");
    }
  };

  // =====================
  // Ask
  // =====================
  const askAI = async () => {
    if (!question) return setMessage("⚠️ Enter a question");

    setLoading(true);
    setMessage("");

    try {
      const res = await axios.post(`${API}/ask`, { question });

      if (!res.data || res.data.length === 0) {
        setData([]);
        setMessage("📭 No data found");
      } else {
        setData(res.data);
      }
    } catch {
      setMessage("❌ Error fetching data");
    }

    setLoading(false);
  };

  // =====================
  // Insight
  // =====================
  const getInsight = () => {
    if (!data.length) return "";

    const max = data.reduce((a, b) =>
      a.value > b.value ? a : b
    );

    return `📊 ${max.name} has highest value (${max.value.toLocaleString()})`;
  };

  // =====================
  // Tooltip (clean & centered)
  // =====================
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div
          style={{
            background: "#020617",
            padding: "10px 14px",
            borderRadius: "10px",
            border: "1px solid #334155",
            boxShadow: "0 6px 20px rgba(0,0,0,0.5)"
          }}
        >
          <p style={{ color: "#38bdf8", fontWeight: "bold" }}>
            {label}
          </p>
          <p style={{ color: "#e2e8f0" }}>
            Value: {payload[0].value.toLocaleString()}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div
      style={{
        background: "#020617",
        minHeight: "100vh",
        color: "white",
        padding: "40px",
        fontFamily: "system-ui"
      }}
    >
      <h1 style={{ marginBottom: "20px" }}>
        📊 AI Data Dashboard
      </h1>

      {/* Upload */}
      <div style={{ marginBottom: 20 }}>
        <input
          type="file"
          onChange={(e) => setFile(e.target.files[0])}
        />
        <button style={btn} onClick={uploadFile}>
          Upload
        </button>
      </div>

      {/* Ask */}
      <div style={{ marginBottom: 20 }}>
        <input
          style={input}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask: total revenue by region"
        />
        <button style={btn} onClick={askAI}>
          Ask
        </button>
      </div>

      {/* Message */}
      {message && (
        <p style={{ color: "#94a3b8" }}>{message}</p>
      )}

      {/* Loading */}
      {loading && (
        <p style={{ color: "#38bdf8" }}>⏳ Loading...</p>
      )}

      {/* Chart */}
      {data.length > 0 && (
        <div
          style={{
            background: "#0f172a",
            padding: "20px",
            borderRadius: "12px",
            marginTop: "20px"
          }}
        >
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={data}>
              <CartesianGrid
                stroke="#1e293b"
                vertical={false}
              />
              <XAxis
                dataKey="name"
                interval={0}
                angle={0}
                height={60}
              /> 

              <YAxis stroke="#94a3b8" />

              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: "rgba(56,189,248,0.08)" }}
              />

              <Bar
                dataKey="value"
                fill="#38bdf8"
                radius={[6, 6, 0, 0]}
                activeBar={{
                  fill: "#0ea5e9"
                }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Insight */}
      {data.length > 0 && (
        <p style={{ marginTop: "15px", color: "#94a3b8" }}>
          {getInsight()}
        </p>
      )}
    </div>
  );
}

// =====================
// Styles
// =====================
const btn = {
  marginLeft: "10px",
  padding: "8px 14px",
  background: "#38bdf8",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontWeight: "bold",
  color: "#020617"
};

const input = {
  padding: "8px",
  width: "320px",
  borderRadius: "6px",
  border: "1px solid #334155",
  outline: "none",
  background: "#020617",
  color: "white"
};

export default App;