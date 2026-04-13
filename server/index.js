app.post("/ask", async (req, res) => {
  try {
    if (!dataset.length) {
      return res.status(400).json({ error: "Upload CSV first" });
    }

    const { question } = req.body;
    const columns = Object.keys(dataset[0]);

    const aiQuery = await getAIQuery(question, columns, dataset[0]);

    // =====================
    // ✅ DETECT NUMERIC COLUMNS
    // =====================
    const numericColumns = columns.filter(col =>
      dataset.some(row => {
        const val = row[col];
        if (!val) return false;
        const cleaned = val.toString().replace(/,/g, "").trim();
        return !isNaN(cleaned);
      })
    );

    const categoryColumns = columns.filter(col =>
      !numericColumns.includes(col)
    );

    // =====================
    // ✅ SELECT CATEGORY
    // =====================
    let categoryColumn =
      findBestMatch(aiQuery.column, columns) ||
      categoryColumns[0];

    // =====================
    // ✅ SELECT METRIC
    // =====================
    let metricColumn =
      findBestMatch(aiQuery.metric, columns);

    // =====================
   
    // =====================
    const isMetricNumeric =
      metricColumn && numericColumns.includes(metricColumn);

    const q = question.toLowerCase();

    const isCountQuery =
      !metricColumn ||              // no metric found
      !isMetricNumeric ||           // metric is text (like region)
      q.includes("count") ||
      q.includes("number") ||
      q.includes("how many");

    // fallback metric if needed
    if (!metricColumn && numericColumns.length > 0) {
      metricColumn = numericColumns[0];
    }

    console.log("FINAL:", categoryColumn, metricColumn, isCountQuery);

    // =====================
    // ✅ AGGREGATION
    // =====================
    const result = {};

    dataset.forEach(row => {
      const key = row[categoryColumn];
      if (!key) return;

      if (isCountQuery) {
        // ✅ COUNT
        result[key] = (result[key] || 0) + 1;
      } else {
        // ✅ SUM
        const raw = row[metricColumn];
        const cleaned = raw
          ? raw.toString().replace(/,/g, "").trim()
          : 0;

        const value = parseFloat(cleaned) || 0;

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