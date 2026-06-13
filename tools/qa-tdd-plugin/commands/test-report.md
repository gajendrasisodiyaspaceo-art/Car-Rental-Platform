---
description: Generate the .xlsx QA report from an existing results JSON file.
argument-hint: <path to results.json> [output.xlsx]
allowed-tools: Read, Bash
---

Use the **qa-test-report** skill to export an Excel report from: **$ARGUMENTS**

1. Read the results JSON and validate it against `${CLAUDE_PLUGIN_ROOT}/scripts/results.schema.json`
   (meta, summary, testCases[], security[]). Fix obvious shape issues; flag missing required fields.
2. Generate the workbook:
   ```bash
   node "${CLAUDE_PLUGIN_ROOT}/scripts/generate-xlsx.js" $ARGUMENTS
   ```
3. Confirm the output file exists and report its absolute path. If `exceljs` is not installed in the plugin,
   tell me to run `npm install --prefix "${CLAUDE_PLUGIN_ROOT}/scripts"`.
