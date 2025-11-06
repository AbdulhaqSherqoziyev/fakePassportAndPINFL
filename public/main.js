// main.js
document.addEventListener('DOMContentLoaded', () => {
  const genBtn = document.getElementById('genBtn');
  const countInput = document.getElementById('count');
  const status = document.getElementById('status');

  const setStatus = (msg, type = '') => {
    status.textContent = msg;
    status.className = type;
  };

  genBtn.addEventListener('click', async () => {
    setStatus('');
    let count = parseInt(countInput.value, 10);

    if (!Number.isFinite(count) || count <= 0) {
      setStatus('⚠️ Please enter a valid positive number.', 'error');
      return;
    }
    if (count > 100000) {
      setStatus('🚫 Max limit is 100,000 records.', 'error');
      return;
    }

    genBtn.disabled = true;
    const originalText = genBtn.textContent;
    genBtn.innerHTML = '<span class="spinner"></span> Generating...';

    try {
      const res = await fetch(`/generate?count=${count}`);
      if (!res.ok) throw new Error(await res.text());

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      let filename = 'pinfl_passport.xlsx';

      const cd = res.headers.get('content-disposition');
      if (cd) {
        const match = cd.match(/filename=\"(.+)\"/);
        if (match) filename = match[1];
      }

      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      setStatus(`✅ Downloaded: ${filename}`, 'success');
    } catch (err) {
      console.error(err);
      setStatus('❌ Error: ' + err.message, 'error');
    } finally {
      genBtn.disabled = false;
      genBtn.textContent = originalText;
    }
  });
});
