// server.js
const express = require('express');
const path = require('path');
const ExcelJS = require('exceljs');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static frontend
app.use(express.static(path.join(__dirname, 'public')));

// --- Helpers ---
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generatePinfl() {
  let s = String(randInt(1, 9));
  for (let i = 0; i < 13; i++) s += String(randInt(0, 9));
  return s;
}

const prefixes = ['BP', 'GP', 'CP'];
function generatePassport() {
  const prefix = prefixes[randInt(0, prefixes.length - 1)];
  const number = String(randInt(0, 9999999)).padStart(7, '0');
  return { prefix, number, full: `${prefix}${number}` };
}

// --- Main route ---
app.get('/generate', async (req, res) => {
  const count = Math.min(parseInt(req.query.count) || 0, 100000);
  if (count <= 0) return res.status(400).send('Invalid count');

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Generated');

  sheet.columns = [
    { header: '№', key: 'no', width: 6 },
    { header: 'PINFL', key: 'pinfl', width: 20 },
    { header: 'Passport Prefix', key: 'prefix', width: 15 },
    { header: 'Passport Number', key: 'number', width: 15 },
    { header: 'Passport Full', key: 'full', width: 20 }
  ];

  // Sets to store used PINFLs and passports
  const usedPinfls = new Set();
  const usedPassports = new Set();

  let rowCount = 0;
  while (rowCount < count) {
    const pinfl = generatePinfl();
    const passport = generatePassport();

    const pinflUnique = !usedPinfls.has(pinfl);
    const passUnique = !usedPassports.has(passport.full);

    if (pinflUnique && passUnique) {
      usedPinfls.add(pinfl);
      usedPassports.add(passport.full);
      sheet.addRow({
        no: rowCount + 1,
        pinfl,
        prefix: passport.prefix,
        number: passport.number,
        full: passport.full
      });
      rowCount++;
    }
  }

  sheet.getRow(1).font = { bold: true };

  const buffer = await workbook.xlsx.writeBuffer();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `pinfl_passport_${count}_${timestamp}.xlsx`;

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(Buffer.from(buffer));
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
