// main.js
document.addEventListener('DOMContentLoaded', () => {
  const countInput = document.getElementById('count');
  const genBtn = document.getElementById('genBtn');
  const status = document.getElementById('status');

  genBtn.addEventListener('click', async () => {
    status.textContent = '';
    let count = parseInt(countInput.value, 10);
    if (!Number.isFinite(count) || count <= 0) {
      status.textContent = 'Iltimos, musbat butun son kiriting.';
      return;
    }
    const MAX = 100000;
    if (count > MAX) {
      status.textContent = `Max ${MAX} ga cheklangan.`;
      return;
    }

    genBtn.disabled = true;
    genBtn.textContent = 'Preparing...';

    try {
      const resp = await fetch(`/generate?count=${count}`);
      if (!resp.ok) {
        const text = await resp.text();
        status.textContent = 'Server error: ' + text;
        genBtn.disabled = false;
        genBtn.textContent = 'Generate & Download Excel';
        return;
      }
      const blob = await resp.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      // derive filename from content-disposition if possible
      let filename = 'pinfl_passport.xlsx';
      const cd = resp.headers.get('content-disposition');
      if (cd) {
        const match = cd.match(/filename="(.+)"/);
        if (match) filename = match[1];
      }
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      status.textContent = `Yuklandi: ${filename}`;
    } catch (err) {
      console.error(err);
      status.textContent = 'Xatolik yuz berdi: ' + err.message;
    } finally {
      genBtn.disabled = false;
      genBtn.textContent = 'Generate & Download Excel';
    }
  });
});
