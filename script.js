// ================== تخزين البيانات ==================
const USERS_KEY = "shop_users";
const SESSION_KEY = "shop_current_user";

function getUsers() {
  return JSON.parse(localStorage.getItem(USERS_KEY) || "{}");
}
function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}
function getCurrentUser() {
  return localStorage.getItem(SESSION_KEY);
}
function setCurrentUser(username) {
  localStorage.setItem(SESSION_KEY, username);
}
function clearCurrentUser() {
  localStorage.removeItem(SESSION_KEY);
}
function recordsKey(username) {
  return "shop_records_" + username;
}
function getRecords(username) {
  return JSON.parse(localStorage.getItem(recordsKey(username)) || "[]");
}
function saveRecords(username, records) {
  localStorage.setItem(recordsKey(username), JSON.stringify(records));
}

// ================== أدوات مساعدة ==================
function fmtMoney(n) {
  return n.toFixed(2) + " د.أ";
}
function todayLabel() {
  const d = new Date();
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}
function todayISO() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

// ================== التنقل بين الشاشات ==================
const screens = {
  auth: document.getElementById("authScreen"),
  main: document.getElementById("mainScreen"),
  records: document.getElementById("recordsScreen"),
};
function showScreen(name) {
  Object.values(screens).forEach((s) => s.classList.add("hidden"));
  screens[name].classList.remove("hidden");
}

// ================== عناصر تسجيل الدخول ==================
const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");
const loginError = document.getElementById("loginError");
const signupError = document.getElementById("signupError");
const showSignupBtn = document.getElementById("showSignup");
const showLoginBtn = document.getElementById("showLogin");

showSignupBtn.addEventListener("click", () => {
  loginForm.classList.add("hidden");
  showSignupBtn.classList.add("hidden");
  signupForm.classList.remove("hidden");
  showLoginBtn.classList.remove("hidden");
  loginError.textContent = "";
});

showLoginBtn.addEventListener("click", () => {
  signupForm.classList.add("hidden");
  showLoginBtn.classList.add("hidden");
  loginForm.classList.remove("hidden");
  showSignupBtn.classList.remove("hidden");
  signupError.textContent = "";
});

loginForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const username = document.getElementById("loginUsername").value.trim();
  const password = document.getElementById("loginPassword").value;
  const users = getUsers();

  if (!users[username]) {
    loginError.textContent = "اسم المستخدم غير موجود.";
    return;
  }
  if (users[username] !== password) {
    loginError.textContent = "كلمة المرور غير صحيحة.";
    return;
  }
  loginError.textContent = "";
  loginForm.reset();
  setCurrentUser(username);
  enterApp(username);
});

signupForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const username = document.getElementById("signupUsername").value.trim();
  const password = document.getElementById("signupPassword").value;
  const confirm = document.getElementById("signupPasswordConfirm").value;
  const users = getUsers();

  if (!username || !password) {
    signupError.textContent = "الرجاء تعبئة كل الحقول.";
    return;
  }
  if (users[username]) {
    signupError.textContent = "اسم المستخدم موجود مسبقًا، اختر اسمًا آخر.";
    return;
  }
  if (password !== confirm) {
    signupError.textContent = "كلمتا المرور غير متطابقتين.";
    return;
  }

  users[username] = password;
  saveUsers(users);
  signupError.textContent = "";
  signupForm.reset();
  setCurrentUser(username);
  enterApp(username);
});

// ================== الدخول للتطبيق ==================
function enterApp(username) {
  document.getElementById("welcomeUser").textContent = `مرحبًا ${username} 👋`;
  document.getElementById("welcomeUser2").textContent = `مرحبًا ${username} 👋`;
  document.getElementById("todayDate").textContent = `التاريخ: ${todayLabel()}`;
  resetEntryForm();
  showScreen("main");
}

function logout() {
  clearCurrentUser();
  showScreen("auth");
}
document.getElementById("logoutBtn").addEventListener("click", logout);
document.getElementById("logoutBtn2").addEventListener("click", logout);

// ================== شاشة الجرد ==================
const cashYesterdayEl = document.getElementById("cashYesterday");
const cashTodayEl = document.getElementById("cashToday");
const purchasesEl = document.getElementById("purchases");
const expensesEl = document.getElementById("expenses");
const salesResultEl = document.getElementById("salesResult");
const profitNoteEl = document.getElementById("profitNote");
const saveMsgEl = document.getElementById("saveMsg");

function resetEntryForm() {
  [cashYesterdayEl, cashTodayEl, purchasesEl, expensesEl].forEach((el) => (el.value = ""));
  saveMsgEl.textContent = "";
  updateSales();
}

function num(el) {
  const v = parseFloat(el.value);
  return isNaN(v) ? 0 : v;
}

function updateSales() {
  const yesterday = num(cashYesterdayEl);
  const today = num(cashTodayEl);
  const purchases = num(purchasesEl);
  const expenses = num(expensesEl);

  const sales = today + purchases + expenses - yesterday;
  salesResultEl.textContent = fmtMoney(sales);

  profitNoteEl.textContent =
    "ملاحظة: ما فينا نحسب صافي الربح من هالأرقام، لأنه بده يعرف تكلفة البضاعة المباعة مش بس قيمة المشتريات. المشتريات ممكن تكون تجديد للمخزون مش بالضرورة كلفة اللي انباع اليوم.";

  saveMsgEl.textContent = "";
}

[cashYesterdayEl, cashTodayEl, purchasesEl, expensesEl].forEach((el) =>
  el.addEventListener("input", updateSales)
);

document.getElementById("saveBtn").addEventListener("click", () => {
  const username = getCurrentUser();
  if (!username) return;

  const yesterday = num(cashYesterdayEl);
  const today = num(cashTodayEl);
  const purchases = num(purchasesEl);
  const expenses = num(expensesEl);
  const sales = today + purchases + expenses - yesterday;

  const record = {
    dateLabel: todayLabel(),
    dateISO: todayISO(),
    cashYesterday: yesterday,
    cashToday: today,
    purchases: purchases,
    expenses: expenses,
    sales: sales,
    savedAt: new Date().toISOString(),
  };

  const records = getRecords(username);
  const existingIndex = records.findIndex((r) => r.dateISO === record.dateISO);
  if (existingIndex >= 0) {
    records[existingIndex] = record;
  } else {
    records.push(record);
  }
  saveRecords(username, records);

  saveMsgEl.textContent = "تم حفظ جرد اليوم ✅";
});

// ================== سجل الجرد ==================
document.getElementById("goRecords").addEventListener("click", () => {
  renderRecords();
  showScreen("records");
});
document.getElementById("backToMain").addEventListener("click", () => {
  showScreen("main");
});

const recordsBody = document.getElementById("recordsBody");
const noRecordsEl = document.getElementById("noRecords");

function renderRecords() {
  const username = getCurrentUser();
  const records = getRecords(username)
    .slice()
    .sort((a, b) => (a.dateISO < b.dateISO ? 1 : -1));

  recordsBody.innerHTML = "";

  if (records.length === 0) {
    noRecordsEl.classList.remove("hidden");
    return;
  }
  noRecordsEl.classList.add("hidden");

  records.forEach((r) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${r.dateLabel}</td>
      <td>${r.cashYesterday.toFixed(2)}</td>
      <td>${r.cashToday.toFixed(2)}</td>
      <td>${r.purchases.toFixed(2)}</td>
      <td>${r.expenses.toFixed(2)}</td>
      <td>${r.sales.toFixed(2)}</td>
    `;
    tr.addEventListener("click", () => showDetail(r));
    recordsBody.appendChild(tr);
  });
}

// ================== نافذة التفاصيل ==================
const detailModal = document.getElementById("detailModal");
const modalDate = document.getElementById("modalDate");
const modalBody = document.getElementById("modalBody");

function showDetail(r) {
  modalDate.textContent = `جرد يوم ${r.dateLabel}`;
  modalBody.innerHTML = `
    <div class="modal-row"><span>كاش أمس</span><span>${fmtMoney(r.cashYesterday)}</span></div>
    <div class="modal-row"><span>كاش اليوم</span><span>${fmtMoney(r.cashToday)}</span></div>
    <div class="modal-row"><span>المشتريات</span><span>${fmtMoney(r.purchases)}</span></div>
    <div class="modal-row"><span>المصاريف</span><span>${fmtMoney(r.expenses)}</span></div>
    <div class="modal-row highlight"><span>المبيعات المحسوبة</span><span>${fmtMoney(r.sales)}</span></div>
  `;
  detailModal.classList.remove("hidden");
}
document.getElementById("closeModal").addEventListener("click", () => {
  detailModal.classList.add("hidden");
});
detailModal.addEventListener("click", (e) => {
  if (e.target === detailModal) detailModal.classList.add("hidden");
});

// ================== بدء التشغيل ==================
(function init() {
  const username = getCurrentUser();
  if (username && getUsers()[username] !== undefined) {
    enterApp(username);
  } else {
    clearCurrentUser();
    showScreen("auth");
  }
})();
