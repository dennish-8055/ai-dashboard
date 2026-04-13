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

// Gemini setup
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

let dataset = [];

// ✅ Health check
app.get("/", (req, res) => {
  res.send("✅ Server is running");
});


// =====================
// ✅ HELPER FUNCTIONS
// =====================

// 🔥 Clean number (handles commas, spaces)
function parseNumber(value) {
  if (!value) return 0;
  const cleaned = value.toString().replace(/,/g, "").trim();
  return parseFloat(cleaned) || 0;
}

// 🔥 Smart column match (VERY IMPORTANT FIX)
function findBestMatch(aiValue, columns) {
  if (!aiValue) return null;

  const cleaned = aiValue.toLowerCase().trim();

  return columns.find(col =>
    col.toLowerCase().includes(cleaned)
  );
}


// =====================
// ✅ UPLOAD CSV
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
// ✅ AI QUERY
// =====================
async function getAIQuery(question, columns, dataSample) {
  try {
    const prompt = `
You are a data assistant.

Columns available: ${columns}

Sample data: ${JSON.stringify(dataSample)}

Convert the question into JSON.

Question: ${question}

Return ONLY valid JSON:
{
  "column": "",
  "metric": ""
}
`;

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
    });

    const response = await result.response;
    let text = response.text();

    text = text.replace(/```json|```/g, "").trim();

    return JSON.parse(text);

  } catch (err) {
    console.log("⚠️ AI failed, using fallback");
    return {};
  }
}


// =====================
// ✅ ASK ROUTE
// =====================
app.post("/ask", async (req, res) => {
  try {
    if (!dataset.length) {
      return res.status(400).json({ error: "Upload CSV first" });
    }

    const { question } = req.body;
    const columns = Object.keys(dataset[0]);

    const aiQuery = await getAIQuery(question, columns, dataset[0]);

    // =====================
    // 🔥 DETECT NUMERIC COLUMNS
    // =====================
    const numericColumns = columns.filter(col =>
      dataset.some(row => !isNaN(parseNumber(row[col])))
    );

    const categoryColumns = columns.filter(col =>
      !numericColumns.includes(col)
    );

    const filteredCategory = categoryColumns.filter(col =>
      !col.toLowerCase().includes("date")
    );

    // =====================
    // 🔥 FIXED COLUMN MATCHING
    // =====================
    let categoryColumn =
      findBestMatch(aiQuery.column, columns) ||
      filteredCategory[0] ||
      categoryColumns[0];

    // =====================
    // 🔥 SMART METRIC DETECTION
    // =====================
    let metricColumn = numericColumns[0];
    const q = question.toLowerCase();

    if (q.includes("revenue")) {
      metricColumn =
        numericColumns.find(c => c.toLowerCase().includes("revenue")) ||
        metricColumn;
    } else if (q.includes("sales")) {
      metricColumn =
        numericColumns.find(c => c.toLowerCase().includes("sales")) ||
        metricColumn;
    } else if (q.includes("unit")) {
      metricColumn =
        numericColumns.find(c => c.toLowerCase().includes("unit")) ||
        metricColumn;
    }

    // AI override if valid
    const aiMetric = findBestMatch(aiQuery.metric, columns);
    if (aiMetric) metricColumn = aiMetric;

    console.log("Using:", categoryColumn, metricColumn);

    // =====================
    // 🔥 AGGREGATION
    // =====================
    const resultData = {};

    dataset.forEach(row => {
      const key = row[categoryColumn];
      const value = parseNumber(row[metricColumn]);

      if (!key) return;

      resultData[key] = (resultData[key] || 0) + value;
    });

    const formatted = Object.entries(resultData).map(([key, value]) => ({
      name: key,
      value,
    }));

    res.json(formatted);

  } catch (err) {
    console.log("🔥 ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});


// =====================
// ✅ START SERVER
// =====================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});