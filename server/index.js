app.post("/ask", async (req, res) => {
  try {
    if (!dataset.length) {
      return res.status(400).json({ error: "Upload CSV first" });
    }

    const { question } = req.body;
    const columns = Object.keys(dataset[0]);

    const aiQuery = await getAIQuery(question, columns, dataset[0]);

    // =====================
    // ✅ DETECT NUMERIC COLUMNS (ROBUST)
    // =====================
    const numericColumns = columns.filter(col =>
      dataset.some(row => {
        const val = row[col];
        if (!val) return false;
        const cleaned = val.toString().replace(/,/g, "").trim();
        return cleaned !== "" && !isNaN(cleaned);
      })
    );

    const categoryColumns = columns.filter(
      col => !numericColumns.includes(col)
    );

    // =====================
    // 🔥 SAFE CATEGORY DETECTION
    // =====================
    let categoryColumn =
      findBestMatch(aiQuery.column, columns) ||
      categoryColumns.find(c => dataset[0][c]) ||
      columns[0]; // fallback

    // =====================
    // 🔥 SAFE METRIC DETECTION
    // =====================
    let metricColumn =
      findBestMatch(aiQuery.metric, columns);

    if (!metricColumn && numericColumns.length > 0) {
      metricColumn = numericColumns[0];
    }

    const isMetricNumeric =
      metricColumn && numericColumns.includes(metricColumn);

    const q = question.toLowerCase();

    const isCountQuery =
      !metricColumn ||
      !isMetricNumeric ||
      q.includes("count") ||
      q.includes("number") ||
      q.includes("how many");

    console.log("FINAL:", categoryColumn, metricColumn, isCountQuery);

    // =====================
    // ✅ AGGREGATION
    // =====================
    const result = {};

    dataset.forEach(row => {
      const key = row[categoryColumn];

      // 🚨 CRITICAL FIX (prevents empty graph)
      if (!key || key === "") return;

      if (isCountQuery) {
        result[key] = (result[key] || 0) + 1;
      } else {
        const raw = row[metricColumn];
        const cleaned = raw
          ? raw.toString().replace(/,/g, "").trim()
          : 0;

        const value = parseFloat(cleaned);

        if (!isNaN(value)) {
          result[key] = (result[key] || 0) + value;
        }
      }
    });

    const formatted = Object.entries(result).map(([k, v]) => ({
      name: k,
      value: v
    }));

    console.log("OUTPUT:", formatted); // debug

    res.json(formatted);

  } catch (err) {
    console.log("ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});