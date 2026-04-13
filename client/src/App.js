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

  // Upload
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

  // Ask
  const askAI = async () => {
    if (!question) return setMessage("⚠️ Enter a question");

    setLoading(true);
    setMessage("");

    try {
      const res = await axios.post(`${API}/ask`, { question });

      if (!res.data.length) {
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

  // Insight
  const getInsight = () => {
    if (!data.length) return "";

    const max = data.reduce((a, b) => (a.value > b.value ? a : b));
    return `📊 ${max.name} has highest value (${max.value.toLocaleString()})`;
  };

  // Tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload?.length) {
      return (
        <div style={{
          background: "#020617",
          padding: "10px",
          borderRadius: "10px",
          border: "1px solid #334155"
        }}>
          <p style={{ color: "#38bdf8", fontWeight: "bold" }}>{label}</p>
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
      padding: "40px"
    }}>
      <h1>📊 AI Data Dashboard</h1>

      {/* Upload */}
      <div style={{ marginBottom: 20 }}>
        <input type="file" onChange={e => setFile(e.target.files[0])} />
        <button onClick={uploadFile}>Upload</button>
      </div>

      {/* Ask */}
      <div style={{ marginBottom: 20 }}>
        <input
          value={question}
          onChange={e => setQuestion(e.target.value)}
          placeholder="Ask: total revenue by region"
        />
        <button onClick={askAI}>Ask</button>
      </div>

      {message && <p>{message}</p>}
      {loading && <p>⏳ Loading...</p>}

      {/* Chart */}
      {data.length > 0 && (
        <div style={{ background: "#0f172a", padding: 20, borderRadius: 10 }}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid stroke="#1e293b" />
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" fill="#38bdf8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {data.length > 0 && <p>{getInsight()}</p>}
    </div>
  );
}

export default App;