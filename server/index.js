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

// Parse numbers safely
function parseNumber(value) {
  if (!value) return NaN;
  return parseFloat(value.toString().replace(/,/g, "").trim());
}

// Numeric columns
function getNumericColumns(columns, data) {
  return columns.filter(col =>
    data.some(row => !isNaN(parseNumber(row[col])))
  );
}

// Category columns
function getCategoryColumns(columns, numericColumns) {
  return columns.filter(col => !numericColumns.includes(col));
}


function matchColumn(question, columns) {
  const words = question.toLowerCase().split(" ");

  for (let word of words) {
    for (let col of columns) {
      if (col.toLowerCase().includes(word)) {
        return col;
      }
    }
  }

  return null;
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
      console.log("CSV Loaded:", dataset[0]);
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

    const numericColumns = getNumericColumns(columns, dataset);
    const categoryColumns = getCategoryColumns(columns, numericColumns);

    // =====================
    //  METRIC DETECTION
    // =====================
    let metricColumn =
      matchColumn(question, numericColumns) ||
      matchColumn(aiQuery.metric || "", numericColumns);

    // ❗ VALIDATION (IMPORTANT FIX)
    if (!metricColumn && numericColumns.length === 0) {
      return res.json([]); // no numeric data at all
    }

    // fallback ONLY if numeric exists
    if (!metricColumn && numericColumns.length > 0) {
      metricColumn = numericColumns[0];
    }

    // =====================
    // CATEGORY DETECTION
    // =====================
    let categoryColumn =
      matchColumn(question, categoryColumns) ||
      matchColumn(aiQuery.column || "", categoryColumns) ||
      categoryColumns[0];

    // =====================
    // QUERY TYPE
    // =====================
    const q = question.toLowerCase();

    const isCountQuery =
      q.includes("count") ||
      q.includes("number") ||
      q.includes("how many") ||
      !metricColumn;

    console.log("Using:", categoryColumn, metricColumn, isCountQuery);

    // =====================
    // AGGREGATION
    // =====================
    const result = {};

    dataset.forEach(row => {
      const key = row[categoryColumn];
      if (!key) return;

      if (isCountQuery) {
        result[key] = (result[key] || 0) + 1;
      } else {
        const value = parseNumber(row[metricColumn]);
        if (!isNaN(value)) {
          result[key] = (result[key] || 0) + value;
        }
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