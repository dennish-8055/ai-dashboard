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

// ✅ Test route
app.get("/", (req, res) => {
  res.send("✅ Server is running");
});

// ✅ Upload CSV
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

// ✅ AI function
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

    console.log("AI RAW:", text);

    text = text.replace(/```json|```/g, "").trim();

    return JSON.parse(text);

  } catch (err) {
    console.log("⚠️ AI failed, using fallback");
    return {};
  }
}

// ✅ Ask route
app.post("/ask", async (req, res) => {
  try {
    if (!dataset.length) {
      return res.status(400).json({ error: "Upload CSV first" });
    }

    const { question } = req.body;

    const columns = Object.keys(dataset[0]);
    console.log("Columns:", columns);

    const aiQuery = await getAIQuery(question, columns, dataset[0]);
    console.log("AI Query:", aiQuery);

    // ✅ FIXED NUMERIC DETECTION (checks all rows)
    const numericColumns = columns.filter(col => {
      return dataset.some(row => {
        const value = row[col];
        if (!value) return false;

        const cleaned = value.toString().replace(/,/g, "").trim();
        return !isNaN(cleaned);
      });
    });

    // ✅ category columns
    const categoryColumns = columns.filter(col => !numericColumns.includes(col));

    // remove date columns
    const filteredCategory = categoryColumns.filter(col =>
      !col.toLowerCase().includes("date")
    );

    // ✅ FINAL SELECTION
    let categoryColumn =
      aiQuery.column && columns.includes(aiQuery.column)
        ? aiQuery.column
        : filteredCategory[0] || categoryColumns[0];

    let metricColumn =
      aiQuery.metric && columns.includes(aiQuery.metric)
        ? aiQuery.metric
        : numericColumns[0];

    console.log("Using:", categoryColumn, metricColumn);

    const resultData = {};

    dataset.forEach((row) => {
      const key = row[categoryColumn];

      // ✅ FIXED VALUE PARSING
      const rawValue = row[metricColumn];
      const cleanedValue = rawValue
        ? rawValue.toString().replace(/,/g, "").trim()
        : 0;

      const value = parseFloat(cleanedValue) || 0;

      if (!key) return;

      resultData[key] = (resultData[key] || 0) + value;
    });

    const formatted = Object.entries(resultData).map(([key, value]) => ({
      name: key,
      value: value,
    }));

    res.json(formatted);

  } catch (err) {
    console.log("🔥 ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ✅ Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});