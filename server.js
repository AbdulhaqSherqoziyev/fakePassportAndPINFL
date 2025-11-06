// server.js
const express = require('express');
const path = require('path');
const ExcelJS = require('exceljs');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve frontend
app.use(express.static(path.join(__dirname, 'public')));

// Utility: safe integer parse
function toIntSafe(v, fallback = 0) {
  const n = parseInt(v, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

// Generate a random integer between min and max inclusive
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Generate synthetic PINFL-like number (14 digits)
// NOTE: This is synthetic and doesn't match any real country's official checksum.
function generatePinfl() {
  // Ensure first digit not zero
  let s = String(randInt(1, 9));
  for (let i = 0; i < 13; i++) s += String(randInt(0, 9));
  return s;
}

// Generate passport: prefix from allowed list + 7 digits (you asked BP, GP, CP)
const passportPrefixes = ['BP', 'GP', 'CP'];
function generatePassport() {
  const prefix = passportPrefixes[randInt(0, passportPrefixes.length - 1)];
  // 7 digit number with leading zeros allowed
  const number = String(randInt(0, 9999999)).padStart(7, '0');
  return { prefix, number, full: `${prefix}${number}` };
}

// Main endpoint: GET /generate?count=NN
app.get('/generate', async (req, res) => {
  const rawCount = toIntSafe(req.query.count, 0);
  const MAX = 100000; // safety limit
  const count = Math.min(rawCount, MAX);

  if (count <= 0) {
    return res.status(400).send('Invalid count. Provide count query param, e.g. /generate?count=100');
  }

  // Create workbook
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('generated');

  // Columns
  sheet.columns = [
    { header: 'No', key: 'no', width: 6 },
    { header: 'PINFL', key: 'pinfl', width: 20 },
    { header: 'Passport Prefix', key: 'pprefix', width: 12 },
    { header: 'Passport Number', key: 'pnum', width: 12 },
    { header: 'Passport Full', key: 'pfull', width: 20 }
  ];

  // Generate rows
  for (let i = 1; i <= count; i++) {
    const pinfl = generatePinfl();
    const passport = generatePassport();
    sheet.addRow({
      no: i,
      pinfl,
      pprefix: passport.prefix,
      pnum: passport.number,
      pfull: passport.full
    });
  }

  // Optional: nice header formatting (bold)
  sheet.getRow(1).font = { bold: true };

  try {
    // Write workbook to buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Set response headers for file download
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `pinfl_passport_${count}_${timestamp}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(Buffer.from(buffer));
  } catch (err) {
    console.error('Excel generation error:', err);
    res.status(500).send('Server error while generating Excel file.');
  }
});

// Fallback: serve index.html for root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
