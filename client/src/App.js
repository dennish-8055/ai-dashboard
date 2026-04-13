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
  //  Tooltip
  // =====================
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: "#020617",
          border: "1px solid #334155",
          borderRadius: "12px",
          padding: "10px 14px",
          boxShadow: "0 6px 25px rgba(0,0,0,0.5)"
        }}>
          <p style={{
            color: "#38bdf8",
            fontWeight: "bold",
            marginBottom: "4px"
          }}>
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
    <div style={{
      background: "#020617",
      minHeight: "100vh",
      color: "white",
      padding: "40px",
      fontFamily: "system-ui"
    }}>
      <h1 style={{
        fontSize: "34px",
        marginBottom: "25px",
        fontWeight: "600"
      }}>
        📊 AI Data Dashboard
      </h1>

      {/* Upload */}
      <div style={card}>
        <input type="file" onChange={(e) => setFile(e.target.files[0])} />
        <button style={btn} onClick={uploadFile}>Upload</button>
      </div>

      {/* Ask */}
      <div style={card}>
        <input
          style={input}
          placeholder="Ask: total revenue by region"
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
        <div style={chartCard}>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={data}>
              <CartesianGrid stroke="#1e293b" vertical={false} />
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />

              {/* ✅ TOOLTIP */}
              <Tooltip
               content={<CustomTooltip />}
               cursor={{ fill: "rgba(56,189,248,0.08)" }}
               wrapperStyle={{ outline: "none" }}
              />

              {/* ✅ BAR */}
              <Bar
                dataKey="value"
                fill="#38bdf8"
                radius={[8, 8, 0, 0]}
                activeBar={{
                  fill: "#0ea5e9",
                  stroke: "#38bdf8",
                  strokeWidth: 1
                }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Insight */}
      {data.length > 0 && (
        <p style={{
          marginTop: "20px",
          color: "#94a3b8",
          fontSize: "16px"
        }}>
          {getInsight()}
        </p>
      )}
    </div>
  );
}

// =====================
// Styles
// =====================
const card = {
  marginBottom: "20px",
  display: "flex",
  gap: "10px",
  alignItems: "center"
};

const chartCard = {
  background: "#0f172a",
  padding: "20px",
  borderRadius: "14px",
  boxShadow: "0 6px 30px rgba(0,0,0,0.4)"
};

const btn = {
  padding: "8px 16px",
  background: "#38bdf8",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "600",
  color: "#020617"
};

const input = {
  padding: "10px",
  width: "320px",
  borderRadius: "8px",
  border: "1px solid #334155",
  outline: "none",
  background: "#020617",
  color: "white"
};

export default App;