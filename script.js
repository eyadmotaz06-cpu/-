// ===== إعدادات عامة =====
const STORAGE_KEY = 'shopInventoryRecords';

const els = {
  cashYesterday: document.getElementById('cashYesterday'),
  cashToday: document.getElementById('cashToday'),
  purchases: document.getElementById('purchases'),
  expenses: document.getElementById('expenses'),
  hint: document.getElementById('resultHint'),
  sales: document.getElementById('salesValue'),
  expectedCash: document.getElementById('expectedCashValue'),
  profit: document.getElementById('profitValue'),
  saveBtn: document.getElementById('saveBtn'),
  todayDate: document.getElementById('todayDate'),
  historyToggle: document.getElementById('historyToggle'),
  historyBody: document.getElementById('historyBody'),
  chevron: document.getElementById('chevron'),
  historyTableBody: document.getElementById('historyTableBody'),
  emptyHistory: document.getElementById('emptyHistory'),
};

// ===== أدوات مساعدة =====

function formatMoney(n) {
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(n).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${sign}${abs} د.أ`;
}

function readNumber(input) {
  if (input.value === '') return null;
  const n = parseFloat(input.value);
  return isNaN(n) ? null : n;
}

function formatDate(d) {
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}

function pulse(el) {
  el.classList.remove('pulse');
  // إعادة تشغيل الحركة
  void el.offsetWidth;
  el.classList.add('pulse');
}

// ===== الحساب التلقائي =====

function calculate() {
  const cashYesterday = readNumber(els.cashYesterday);
  const cashToday = readNumber(els.cashToday);
  const purchases = readNumber(els.purchases) ?? 0;
  const expenses = readNumber(els.expenses) ?? 0;

  if (cashYesterday === null || cashToday === null) {
    els.sales.textContent = '—';
    els.expectedCash.textContent = '—';
    els.profit.textContent = '—';
    els.profit.classList.remove('positive', 'negative');
    els.hint.textContent = 'أدخل كاش أمس وكاش اليوم لحساب المبيعات تلقائيًا';
    els.hint.style.display = 'block';
    return null;
  }

  const sales = cashToday + purchases + expenses - cashYesterday;
  const expectedCash = cashToday;
  const profit = sales - purchases - expenses;

  els.sales.textContent = formatMoney(sales);
  els.expectedCash.textContent = formatMoney(expectedCash);
  els.profit.textContent = formatMoney(profit);
  els.profit.classList.toggle('positive', profit >= 0);
  els.profit.classList.toggle('negative', profit < 0);
  els.hint.style.display = 'none';

  pulse(els.sales);

  return { cashYesterday, cashToday, purchases, expenses, sales, profit };
}

['cashYesterday', 'cashToday', 'purchases', 'expenses'].forEach((key) => {
  els[key].addEventListener('input', calculate);
});

// ===== التخزين المحلي =====

function getRecords() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function setRecords(records) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function renderHistory() {
  const records = getRecords();

  if (records.length === 0) {
    els.historyTableBody.innerHTML = '';
    els.emptyHistory.style.display = 'block';
    return;
  }

  els.emptyHistory.style.display = 'none';
  els.historyTableBody.innerHTML = records
    .map((r, i) => `
      <tr>
        <td>${r.date}</td>
        <td>${formatMoney(r.cashYesterday)}</td>
        <td>${formatMoney(r.cashToday)}</td>
        <td>${formatMoney(r.purchases)}</td>
        <td>${formatMoney(r.expenses)}</td>
        <td>${formatMoney(r.sales)}</td>
        <td class="profit-cell ${r.profit >= 0 ? 'positive' : 'negative'}">${formatMoney(r.profit)}</td>
        <td><button class="delete-btn" data-index="${i}" title="حذف">✕</button></td>
      </tr>
    `)
    .join('');

  els.historyTableBody.querySelectorAll('.delete-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.index, 10);
      const current = getRecords();
      current.splice(idx, 1);
      setRecords(current);
      renderHistory();
    });
  });
}

// ===== حفظ جرد اليوم =====

els.saveBtn.addEventListener('click', () => {
  const data = calculate();
  if (!data) {
    els.hint.style.color = 'var(--bad)';
    els.hint.textContent = 'الرجاء إدخال كاش أمس وكاش اليوم قبل الحفظ';
    return;
  }

  const record = {
    date: formatDate(new Date()),
    ...data,
    savedAt: Date.now(),
  };

  const records = getRecords();
  records.unshift(record);
  setRecords(records);
  renderHistory();

  const original = els.saveBtn.textContent;
  els.saveBtn.textContent = 'تم الحفظ ✓';
  els.saveBtn.disabled = true;
  setTimeout(() => {
    els.saveBtn.textContent = original;
    els.saveBtn.disabled = false;
  }, 1400);
});

// ===== طي/فتح سجل الجرد =====

els.historyToggle.addEventListener('click', () => {
  const isOpen = els.historyBody.classList.toggle('open');
  els.chevron.classList.toggle('open', isOpen);
  els.historyToggle.setAttribute('aria-expanded', String(isOpen));
});

// ===== التهيئة =====

els.todayDate.textContent = `التاريخ: ${formatDate(new Date())}`;
calculate();
renderHistory();
