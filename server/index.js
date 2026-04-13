require("dotenv").config();
const express = require("express");
const multer = require("multer");
const csv = require("csv-parser");
const fs = require("fs");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express(); // ✅ THIS WAS MISSING

app.use(cors({ origin: "*" }));
app.use(express.json());

const upload = multer({ dest: "uploads/" });

// Gemini
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
  return parseFloat(value.toString().replace(/,/g, "")) || 0;
}

function findBestMatch(value, columns) {
  if (!value) return null;
  const v = value.toLowerCase();
  return columns.find(c => c.toLowerCase().includes(v));
}

// =====================
// UPLOAD
// =====================
app.post("/upload", upload.single("file"), (req, res) => {
  dataset = [];

  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on("data", row => dataset.push(row))
    .on("end", () => {
      res.json({ message: "Uploaded", rows: dataset.length });
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
      contents: [{ role: "user", parts: [{ text: prompt }] }]
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

    const numericColumns = columns.filter(col =>
      dataset.some(row => !isNaN(parseNumber(row[col])))
    );

    const categoryColumns = columns.filter(col =>
      !numericColumns.includes(col)
    );

    let categoryColumn =
      findBestMatch(aiQuery.column, columns) ||
      categoryColumns[0];

    let metricColumn =
      findBestMatch(aiQuery.metric, columns);

    const isMetricNumeric =
      metricColumn && numericColumns.includes(metricColumn);

    const q = question.toLowerCase();

    const isCountQuery =
      !metricColumn ||
      !isMetricNumeric ||
      q.includes("count") ||
      q.includes("number") ||
      q.includes("how many");

    if (!metricColumn && numericColumns.length > 0) {
      metricColumn = numericColumns[0];
    }

    const result = {};

    dataset.forEach(row => {
      const key = row[categoryColumn];
      if (!key) return;

      if (isCountQuery) {
        result[key] = (result[key] || 0) + 1;
      } else {
        const value = parseNumber(row[metricColumn]);
        result[key] = (result[key] || 0) + value;
      }
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