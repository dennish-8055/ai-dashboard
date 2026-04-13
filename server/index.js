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
  res.send("✅ Server running");
});

// =====================
// HELPERS
// =====================

function parseNumber(value) {
  if (!value) return NaN;
  return parseFloat(value.toString().replace(/,/g, "").trim());
}

function getNumericColumns(columns, data) {
  return columns.filter(col =>
    data.some(row => !isNaN(parseNumber(row[col])))
  );
}

function getCategoryColumns(columns, numericColumns) {
  return columns.filter(col => !numericColumns.includes(col));
}


function matchColumn(question, columns) {
  const q = question.toLowerCase();

  return columns.find(col => {
    const c = col.toLowerCase();
    return (
      q.includes(c) ||
      c.includes(q) ||
      q.split(" ").some(word => c.includes(word))
    );
  });
}

// DATE FORMAT (dynamic)
function formatDate(value, mode = "month") {
  const d = new Date(value);
  if (isNaN(d)) return value;

  if (mode === "day") {
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  }

  if (mode === "year") {
    return `${d.getFullYear()}`;
  }

  return `${d.getFullYear()}-${d.getMonth() + 1}`;
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
// AI (optional)
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

    return JSON.parse(
      result.response.text().replace(/```json|```/g, "").trim()
    );

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

    const q = question.toLowerCase();

    // =====================
    // METRIC
    // =====================
    let metricColumn =
      matchColumn(question, numericColumns) ||
      matchColumn(aiQuery.metric || "", numericColumns);

    if (!metricColumn && numericColumns.length === 0) {
      return res.json([]);
    }

    if (!metricColumn) {
      metricColumn = numericColumns[0];
    }

    // =====================
    // CATEGORY
    // =====================
    let categoryColumn = null;

    if (q.includes("date") || q.includes("month") || q.includes("year")) {
      categoryColumn = columns.find(col =>
        col.toLowerCase().includes("date")
      );
    }

    categoryColumn =
      categoryColumn ||
      matchColumn(question, categoryColumns) ||
      matchColumn(aiQuery.column || "", categoryColumns) ||
      categoryColumns[0];

    // =====================
    // DATE MODE
    // =====================
    let uniqueDates = new Set(dataset.map(r => r[categoryColumn]));

    let dateMode = "day";

    // If all dates are first of month → treat as month
    if ([...uniqueDates].every(d => new Date(d).getDate() === 1)) {
    dateMode = "month";
}

if (q.includes("year")) dateMode = "year";
if (q.includes("month")) dateMode = "month";

    // =====================
    // QUERY TYPE
    // =====================
    const isCountQuery =
      q.includes("count") ||
      q.includes("number") ||
      q.includes("how many");

    // =====================
    // AGGREGATION
    // =====================
    let result = {};

    dataset.forEach(row => {
      let key = row[categoryColumn];
      if (!key) return;

      if (categoryColumn.toLowerCase().includes("date")) {
        key = formatDate(key, dateMode);
      }

      if (isCountQuery) {
        result[key] = (result[key] || 0) + 1;
      } else {
        const value = parseNumber(row[metricColumn]);
        if (!isNaN(value)) {
          result[key] = (result[key] || 0) + value;
        }
      }
    });

   
    if (
      Object.keys(result).length === 1 &&
      categoryColumn.toLowerCase().includes("date")
    ) {
      result = {};

      dataset.forEach(row => {
        let key = formatDate(row[categoryColumn], "day");

        if (isCountQuery) {
          result[key] = (result[key] || 0) + 1;
        } else {
          const value = parseNumber(row[metricColumn]);
          if (!isNaN(value)) {
            result[key] = (result[key] || 0) + value;
          }
        }
      });
    }

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