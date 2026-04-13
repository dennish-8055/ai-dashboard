require("dotenv").config();
const express = require("express");
const multer = require("multer");
const csv = require("csv-parser");
const fs = require("fs");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();

app.use(cors({ origin: "*" }));
app.use(express.json());

const upload = multer({ dest: "uploads/" });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

let dataset = [];

// =====================
// ROOT
// =====================
app.get("/", (req, res) => {
  res.send("✅ Server is running");
});

// =====================
// HELPERS
// =====================
function parseNumber(value) {
  if (!value) return 0;
  const cleaned = value.toString().replace(/,/g, "").trim();
  return parseFloat(cleaned) || 0;
}

function findBestMatch(value, columns) {
  if (!value) return null;
  return columns.find(col =>
    col.toLowerCase().includes(value.toLowerCase())
  );
}

// 🔥 Strong column detection
function detectColumnFromQuestion(question, columns) {
  const q = question.toLowerCase();

  if (q.includes("region")) return columns.find(c => c.toLowerCase().includes("region"));
  if (q.includes("date")) return columns.find(c => c.toLowerCase().includes("date"));
  if (q.includes("product")) return columns.find(c => c.toLowerCase().includes("product"));
  if (q.includes("category")) return columns.find(c => c.toLowerCase().includes("category"));

  return null;
}

// =====================
// UPLOAD
// =====================
app.post("/upload", upload.single("file"), (req, res) => {
  dataset = [];

  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on("data", (row) => dataset.push(row))
    .on("end", () => {
      console.log("CSV Loaded:", dataset[0]);
      res.json({ message: "File uploaded", rows: dataset.length });
    });
});

// =====================
// AI
// =====================
async function getAIQuery(question, columns, sample) {
  try {
    const prompt = `
Columns: ${columns}
Sample: ${JSON.stringify(sample)}

Question: ${question}

Return JSON:
{
  "column": "",
  "metric": ""
}
`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const text = result.response.text()
      .replace(/```json|```/g, "")
      .trim();

    return JSON.parse(text);

  } catch {
    return {};
  }
}

// =====================
// ASK
// =====================
app.post("/ask", async (req, res) => {
  try {
    if (!dataset.length) {
      return res.status(400).json({ error: "Upload CSV first" });
    }

    const { question } = req.body;
    const columns = Object.keys(dataset[0]);

    const aiQuery = await getAIQuery(question, columns, dataset[0]);

    // numeric columns
    const numericColumns = columns.filter(col =>
      dataset.some(row => !isNaN(parseNumber(row[col])))
    );

    const categoryColumns = columns.filter(col =>
      !numericColumns.includes(col)
    );

    // =====================
    // CATEGORY
    // =====================
    let categoryColumn =
      detectColumnFromQuestion(question, columns) ||
      findBestMatch(aiQuery.column, columns) ||
      categoryColumns[0];

    // =====================
    // METRIC
    // =====================
    let metricColumn = null;
    const q = question.toLowerCase();

    // detect metric properly
    if (q.includes("revenue")) {
      metricColumn = numericColumns.find(c => c.toLowerCase().includes("revenue"));
    } else if (q.includes("unit")) {
      metricColumn = numericColumns.find(c => c.toLowerCase().includes("unit"));
    } else if (q.includes("sales")) {
      metricColumn = numericColumns.find(c => c.toLowerCase().includes("sales"));
    }

    // fallback from AI
    if (!metricColumn) {
      const aiMetric = findBestMatch(aiQuery.metric, numericColumns);
      if (aiMetric) metricColumn = aiMetric;
    }

    // final fallback
    if (!metricColumn) {
      metricColumn = numericColumns[0];
    }

    console.log("FINAL:", categoryColumn, metricColumn);

    // =====================
    // AGGREGATION
    // =====================
    const result = {};

    dataset.forEach(row => {
      const key = row[categoryColumn];
      if (!key) return;

      let value = parseNumber(row[metricColumn]);

      result[key] = (result[key] || 0) + value;
    });

    const formatted = Object.entries(result).map(([k, v]) => ({
      name: k,
      value: v
    }));

    res.json(formatted);

  } catch (err) {
    console.log("ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// =====================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Running on ${PORT}`);
});