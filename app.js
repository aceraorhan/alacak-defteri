(function () {
  "use strict";

  const RATES = [1, 2, 2.5, 3];
  let notes = [];
  let selectedRate = 2.5;

  const app = document.getElementById("app");

  function formatTL(n) {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
      maximumFractionDigits: 2,
    }).format(n || 0);
  }

  function formatDate(iso) {
    return new Date(iso).toLocaleDateString("tr-TR");
  }

  function parseAmount(raw) {
    const val = parseFloat(String(raw).replace(",", "."));
    if (isNaN(val)) return NaN;
    return val * 1000;
  }

  function calcTotals() {
    return notes.reduce(
      (acc, n) => {
        const interest = n.amount * (n.rate / 100);
        acc.principal += n.amount;
        acc.interest += interest;
        return acc;
      },
      { principal: 0, interest: 0 }
    );
  }

  function render() {
    const totals = calcTotals();

    app.innerHTML = `
      <div class="eyebrow">Alacak Defteri</div>
      <h1>Kime, ne kadar, ne faizle</h1>

      <div class="io-row">
        <button class="io-btn sans" id="exportBtn" ${notes.length === 0 ? "disabled" : ""}>
          ${iconDownload()} Dışa aktar
        </button>
        <label class="io-btn sans">
          ${iconUpload()} İçe aktar
          <input type="file" id="importInput" accept="application/json,.json" />
        </label>
      </div>
      <div class="msg sans" id="importMsg"></div>
      <div class="hint sans">Veriler bu cihazda, tarayıcı hafızasında saklanır. Farklı bir cihaza taşımak için "Dışa aktar" / "İçe aktar" kullan.</div>

      ${
        notes.length > 0
          ? `<div class="summary-row" style="margin-top:24px;">
              <div class="summary-card">
                <div class="summary-label sans">Toplam Anapara</div>
                <div class="summary-value">${formatTL(totals.principal)}</div>
              </div>
              <div class="summary-card accent">
                <div class="summary-label sans">Toplam Faiz</div>
                <div class="summary-value">${formatTL(totals.interest)}</div>
              </div>
            </div>`
          : `<div style="margin-top:24px;"></div>`
      }

      <div class="card">
        <div class="field">
          <input type="text" id="nameInput" placeholder="Kişi adı" />
          <input type="text" id="amountInput" inputmode="decimal" placeholder="Borç tutarı — örn. 65 = 65.000 ₺" />
          <div class="hint sans" style="margin-top:-6px;">Girdiğin sayı bin ile çarpılır (65 → 65.000 ₺)</div>

          <div>
            <div class="rate-label sans">Faiz oranı</div>
            <div class="rate-row" id="rateRow">
              ${RATES.map(
                (r) =>
                  `<button type="button" class="rate-btn sans ${selectedRate === r ? "active" : ""}" data-rate="${r}">%${r}</button>`
              ).join("")}
            </div>
          </div>

          <div class="preview sans" id="preview"></div>
          <div class="error sans" id="formError"></div>

          <button class="add-btn sans" id="addBtn">${iconPlus()} Not ekle</button>
        </div>
      </div>

      ${
        notes.length === 0
          ? `<div class="empty">Henüz not eklenmedi. İlk borç kaydını yukarıdan ekleyebilirsin.</div>`
          : `<div class="notes">${notes.map(renderNote).join("")}</div>`
      }
    `;

    attachEvents();
    updatePreview();
  }

  function renderNote(n) {
    const interest = n.amount * (n.rate / 100);
    const total = n.amount + interest;
    return `
      <div class="note" data-id="${n.id}">
        <div class="note-top">
          <div class="note-left">
            <div class="avatar">👤</div>
            <div>
              <div class="note-name">${escapeHtml(n.name)}</div>
              <div class="note-date sans">${formatDate(n.createdAt)}</div>
            </div>
          </div>
          <button class="del-btn" data-del="${n.id}" aria-label="Notu sil">✕</button>
        </div>
        <div class="note-rates">
          ${RATES.map(
            (r) =>
              `<button type="button" class="rate-btn-small sans ${n.rate === r ? "active" : ""}" data-noterate="${n.id}" data-rate="${r}">%${r}</button>`
          ).join("")}
        </div>
        <div class="note-footer sans">
          <span class="principal">Anapara: ${formatTL(n.amount)}</span>
          <span class="interest">↗ Faiz: ${formatTL(interest)}</span>
          <span class="total">Toplam: ${formatTL(total)}</span>
        </div>
      </div>
    `;
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function updatePreview() {
    const amountInput = document.getElementById("amountInput");
    const preview = document.getElementById("preview");
    if (!amountInput || !preview) return;
    const val = parseAmount(amountInput.value);
    if (amountInput.value && !isNaN(val)) {
      const interest = val * (selectedRate / 100);
      const total = val + interest;
      preview.innerHTML = `Faiz: ${formatTL(interest)} — Toplam: <strong>${formatTL(total)}</strong>`;
    } else {
      preview.innerHTML = "";
    }
  }

  function attachEvents() {
    const exportBtn = document.getElementById("exportBtn");
    const importInput = document.getElementById("importInput");
    const addBtn = document.getElementById("addBtn");
    const amountInput = document.getElementById("amountInput");
    const rateRow = document.getElementById("rateRow");

    if (exportBtn) exportBtn.addEventListener("click", exportNotes);
    if (importInput) importInput.addEventListener("change", handleImport);
    if (addBtn) addBtn.addEventListener("click", addNote);
    if (amountInput) amountInput.addEventListener("input", updatePreview);

    if (rateRow) {
      rateRow.querySelectorAll(".rate-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          selectedRate = parseFloat(btn.dataset.rate);
          render();
        });
      });
    }

    document.querySelectorAll("[data-del]").forEach((btn) => {
      btn.addEventListener("click", () => {
        notes = notes.filter((n) => n.id !== btn.dataset.del);
        render();
      });
    });

    document.querySelectorAll("[data-noterate]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.noterate;
        const r = parseFloat(btn.dataset.rate);
        notes = notes.map((n) => (n.id === id ? { ...n, rate: r } : n));
        render();
      });
    });
  }

  function addNote() {
    const nameInput = document.getElementById("nameInput");
    const amountInput = document.getElementById("amountInput");
    const errorEl = document.getElementById("formError");

    const trimmedName = nameInput.value.trim();
    const numericAmount = parseAmount(amountInput.value);

    if (!trimmedName) {
      errorEl.textContent = "İsim girin.";
      return;
    }
    if (!numericAmount || numericAmount <= 0) {
      errorEl.textContent = "Geçerli bir borç tutarı girin.";
      return;
    }

    notes = [
      {
        id: Date.now().toString(),
        name: trimmedName,
        amount: numericAmount,
        rate: selectedRate,
        createdAt: new Date().toISOString(),
      },
      ...notes,
    ];
    selectedRate = 2.5;
    render();
  }

  function exportNotes() {
    const dataStr = JSON.stringify(notes, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const dateStr = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `alacak-defteri-${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function handleImport(e) {
    const msgEl = document.getElementById("importMsg");
    msgEl.textContent = "";
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onerror = () => {
      msgEl.textContent = "Dosya okunurken bir hata oluştu. Tekrar dener misin?";
    };
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target.result);
        if (!Array.isArray(parsed)) throw new Error("Geçersiz format");
        const valid = parsed.every(
          (n) => n && n.name && typeof n.amount === "number" && typeof n.rate === "number"
        );
        if (!valid) throw new Error("Geçersiz format");
        notes = parsed;
        saveToStorage();
        render();
        document.getElementById("importMsg").textContent = `${parsed.length} not içe aktarıldı.`;
      } catch (err) {
        msgEl.textContent = "Dosya okunamadı. Geçerli bir dışa aktarım dosyası seçtiğinden emin ol.";
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  function saveToStorage() {
    try {
      localStorage.setItem("alacak-defteri-notlar", JSON.stringify(notes));
    } catch (e) {
      // depolama dolu veya kullanılamıyor olabilir, sessizce geç
    }
  }

  function loadFromStorage() {
    try {
      const raw = localStorage.getItem("alacak-defteri-notlar");
      if (raw) notes = JSON.parse(raw);
    } catch (e) {
      notes = [];
    }
  }

  // Her değişiklikte otomatik kaydet
  const originalRender = render;
  render = function () {
    saveToStorage();
    originalRender();
  };

  function iconDownload() {
    return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`;
  }
  function iconUpload() {
    return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>`;
  }
  function iconPlus() {
    return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`;
  }

  loadFromStorage();
  render();

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js").catch(() => {});
    });
  }
})();
