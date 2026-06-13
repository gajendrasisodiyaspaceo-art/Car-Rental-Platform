#!/usr/bin/env node
/**
 * qa-tdd report generator.
 * Reads a QA results JSON (conforming to results.schema.json) from a file-path argument or stdin,
 * and writes a styled .xlsx workbook (Summary, Test Cases, Security Findings, Coverage).
 *
 * Usage:
 *   node generate-xlsx.js <results.json> [output.xlsx]
 *   cat results.json | node generate-xlsx.js - [output.xlsx]
 */
'use strict';

const fs = require('fs');
const path = require('path');

let ExcelJS;
try {
  ExcelJS = require('exceljs');
} catch (e) {
  console.error(
    'Error: exceljs is not installed for the qa-tdd plugin.\n' +
      'Run:  npm install --prefix "' + __dirname + '"',
  );
  process.exit(1);
}

// ----- colors -----
const FILL = (argb) => ({ type: 'pattern', pattern: 'solid', fgColor: { argb } });
const HEADER_FILL = FILL('FF1F2937'); // slate-800
const HEADER_FONT = { bold: true, color: { argb: 'FFFFFFFF' } };
const STATUS_FILL = {
  pass: FILL('FFD1FAE5'),
  fail: FILL('FFFEE2E2'),
  skip: FILL('FFFEF3C7'),
  blocked: FILL('FFE5E7EB'),
};
const SEVERITY_FILL = {
  critical: FILL('FFB91C1C'),
  high: FILL('FFFEE2E2'),
  medium: FILL('FFFEF3C7'),
  low: FILL('FFDBEAFE'),
};
const SEVERITY_FONT = { critical: { color: { argb: 'FFFFFFFF' }, bold: true } };

function readInput() {
  const arg = process.argv[2];
  if (!arg || arg === '-') {
    const data = fs.readFileSync(0, 'utf8'); // stdin
    if (!data.trim()) {
      console.error('Error: no results JSON provided (pass a file path or pipe JSON on stdin).');
      process.exit(1);
    }
    return JSON.parse(data);
  }
  if (!fs.existsSync(arg)) {
    console.error('Error: results file not found: ' + arg);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(arg, 'utf8'));
}

function validate(r) {
  const errors = [];
  if (!r || typeof r !== 'object') errors.push('root must be an object');
  if (!r.meta) errors.push('missing "meta"');
  if (!r.summary) errors.push('missing "summary"');
  if (!Array.isArray(r.testCases)) errors.push('"testCases" must be an array');
  if (r.security && !Array.isArray(r.security)) errors.push('"security" must be an array');
  if (errors.length) {
    console.error('Invalid results JSON:\n - ' + errors.join('\n - '));
    process.exit(1);
  }
}

function styleHeader(row) {
  row.eachCell((cell) => {
    cell.fill = HEADER_FILL;
    cell.font = HEADER_FONT;
    cell.alignment = { vertical: 'middle' };
  });
}

function autosize(sheet, max = 60) {
  sheet.columns.forEach((col) => {
    let w = col.header ? String(col.header).length : 10;
    col.eachCell({ includeEmpty: false }, (cell) => {
      const len = cell.value ? String(cell.value).length : 0;
      if (len > w) w = len;
    });
    col.width = Math.min(Math.max(w + 2, 10), max);
  });
}

function buildSummary(wb, r) {
  const s = r.summary;
  const total = s.total || 0;
  const passed = s.passed || 0;
  const failed = s.failed || 0;
  const skipped = s.skipped || 0;
  const rate = total ? Math.round((passed / total) * 1000) / 10 : 0;

  const sheet = wb.addWorksheet('Summary');
  sheet.mergeCells('A1:B1');
  const title = sheet.getCell('A1');
  title.value = 'QA Report — ' + (r.meta.project || 'project') + ' / ' + (r.meta.app || '');
  title.font = { bold: true, size: 14 };

  const rows = [
    ['Date', r.meta.date || ''],
    ['Commit', r.meta.commit || ''],
    ['Total tests', total],
    ['Passed', passed],
    ['Failed', failed],
    ['Skipped', skipped],
    ['Pass rate', rate + '%'],
    ['Coverage', s.coveragePct != null ? s.coveragePct + '%' : 'n/a'],
    ['Security findings', (r.security || []).length],
  ];
  sheet.addRow([]);
  rows.forEach(([k, v]) => {
    const row = sheet.addRow([k, v]);
    row.getCell(1).font = { bold: true };
    if (k === 'Passed') row.getCell(2).fill = STATUS_FILL.pass;
    if (k === 'Failed' && failed > 0) row.getCell(2).fill = STATUS_FILL.fail;
    if (k === 'Skipped' && skipped > 0) row.getCell(2).fill = STATUS_FILL.skip;
    if (k === 'Pass rate') row.getCell(2).fill = rate >= 90 ? STATUS_FILL.pass : rate >= 70 ? STATUS_FILL.skip : STATUS_FILL.fail;
  });
  sheet.getColumn(1).width = 20;
  sheet.getColumn(2).width = 40;
}

function buildTestCases(wb, r) {
  const sheet = wb.addWorksheet('Test Cases');
  sheet.columns = [
    { header: 'ID', key: 'id' },
    { header: 'Module', key: 'module' },
    { header: 'Title', key: 'title' },
    { header: 'Type', key: 'type' },
    { header: 'Priority', key: 'priority' },
    { header: 'Steps', key: 'steps' },
    { header: 'Expected', key: 'expected' },
    { header: 'Actual', key: 'actual' },
    { header: 'Status', key: 'status' },
    { header: 'Severity', key: 'severity' },
    { header: 'Notes', key: 'notes' },
  ];
  styleHeader(sheet.getRow(1));
  (r.testCases || []).forEach((tc) => {
    const row = sheet.addRow(tc);
    const statusCell = row.getCell('status');
    if (STATUS_FILL[tc.status]) statusCell.fill = STATUS_FILL[tc.status];
    const sevCell = row.getCell('severity');
    if (tc.severity && SEVERITY_FILL[tc.severity]) {
      sevCell.fill = SEVERITY_FILL[tc.severity];
      if (SEVERITY_FONT[tc.severity]) sevCell.font = SEVERITY_FONT[tc.severity];
    }
    row.getCell('steps').alignment = { wrapText: true };
    row.getCell('expected').alignment = { wrapText: true };
  });
  sheet.autoFilter = { from: 'A1', to: { row: 1, column: sheet.columnCount } };
  sheet.views = [{ state: 'frozen', ySplit: 1 }];
  autosize(sheet, 45);
}

function buildSecurity(wb, r) {
  const findings = r.security || [];
  const sheet = wb.addWorksheet('Security Findings');
  sheet.columns = [
    { header: 'ID', key: 'id' },
    { header: 'Category', key: 'category' },
    { header: 'Title', key: 'title' },
    { header: 'Severity', key: 'severity' },
    { header: 'Location', key: 'location' },
    { header: 'Description', key: 'description' },
    { header: 'Recommendation', key: 'recommendation' },
    { header: 'Status', key: 'status' },
  ];
  styleHeader(sheet.getRow(1));
  const order = { critical: 0, high: 1, medium: 2, low: 3 };
  findings
    .slice()
    .sort((a, b) => (order[a.severity] ?? 9) - (order[b.severity] ?? 9))
    .forEach((f) => {
      const row = sheet.addRow(f);
      const sevCell = row.getCell('severity');
      if (SEVERITY_FILL[f.severity]) {
        sevCell.fill = SEVERITY_FILL[f.severity];
        if (SEVERITY_FONT[f.severity]) sevCell.font = SEVERITY_FONT[f.severity];
      }
      row.getCell('description').alignment = { wrapText: true };
      row.getCell('recommendation').alignment = { wrapText: true };
    });
  if (!findings.length) sheet.addRow({ title: 'No security findings recorded.' });
  sheet.autoFilter = { from: 'A1', to: { row: 1, column: sheet.columnCount } };
  sheet.views = [{ state: 'frozen', ySplit: 1 }];
  autosize(sheet, 50);
}

function buildCoverage(wb, r) {
  const sheet = wb.addWorksheet('Coverage');
  sheet.columns = [
    { header: 'Module', key: 'module' },
    { header: 'Total', key: 'total' },
    { header: 'Passed', key: 'passed' },
    { header: 'Failed', key: 'failed' },
    { header: 'Skipped', key: 'skipped' },
    { header: 'Pass rate', key: 'rate' },
  ];
  styleHeader(sheet.getRow(1));
  const byModule = {};
  (r.testCases || []).forEach((tc) => {
    const m = tc.module || 'unknown';
    byModule[m] = byModule[m] || { module: m, total: 0, passed: 0, failed: 0, skipped: 0 };
    byModule[m].total++;
    if (tc.status === 'pass') byModule[m].passed++;
    else if (tc.status === 'fail') byModule[m].failed++;
    else if (tc.status === 'skip' || tc.status === 'blocked') byModule[m].skipped++;
  });
  Object.values(byModule).forEach((m) => {
    const rate = m.total ? Math.round((m.passed / m.total) * 1000) / 10 : 0;
    const row = sheet.addRow({ ...m, rate: rate + '%' });
    row.getCell('rate').fill = rate >= 90 ? STATUS_FILL.pass : rate >= 70 ? STATUS_FILL.skip : STATUS_FILL.fail;
  });
  autosize(sheet, 30);
}

function resolveOutput(r) {
  const out = process.argv[3];
  if (out) return path.resolve(out);
  const base = process.env.CLAUDE_PROJECT_DIR || process.cwd();
  const app = (r.meta && r.meta.app) || 'app';
  const date = (r.meta && r.meta.date) || 'report';
  return path.join(base, 'qa-reports', `qa-report-${app}-${date}.xlsx`);
}

async function main() {
  const r = readInput();
  validate(r);

  const wb = new ExcelJS.Workbook();
  wb.creator = 'qa-tdd plugin';
  buildSummary(wb, r);
  buildTestCases(wb, r);
  buildSecurity(wb, r);
  buildCoverage(wb, r);

  const outPath = resolveOutput(r);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  await wb.xlsx.writeFile(outPath);
  console.log('QA report written to: ' + outPath);
}

main().catch((err) => {
  console.error('Failed to generate report: ' + (err && err.message ? err.message : err));
  process.exit(1);
});
