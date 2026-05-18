document.addEventListener("DOMContentLoaded", function () {
  const tableBody = document.querySelector("#quotationTable tbody");
  const grandTotalEl = document.getElementById("grandTotal");
  const subtotalEl = document.getElementById("subtotal");

  let subtotal = 0;
  let itemCount = 0;

  const dateElement = document.getElementById("currentDate");
  const today = new Date();
  const formattedDate = today.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  dateElement.textContent = formattedDate;

  function fmt(n) {
    return n.toLocaleString("en-KE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  function updateTotals() {
    const taxRate = parseFloat(document.getElementById("taxRate").value) || 0;
    const taxAmt = subtotal * taxRate / 100;
    const total = subtotal + taxAmt;
    const amountPaid = parseFloat(document.getElementById("amountPaid").value) || 0;
    const balanceDue = Math.max(0, total - amountPaid);

    subtotalEl.textContent = fmt(subtotal);
    document.getElementById("taxAmount").textContent = fmt(taxAmt);
    grandTotalEl.textContent = fmt(balanceDue);
  }

  function renumberRows() {
    tableBody.querySelectorAll("tr").forEach((row, index) => {
      row.querySelector("td:first-child").textContent = index + 1;
    });
    itemCount = tableBody.querySelectorAll("tr").length;
  }

  window.addItem = function () {
    const descInput = document.getElementById("description");
    const measInput = document.getElementById("measurements");
    const qtyInput = document.getElementById("quantity");
    const priceInput = document.getElementById("unitPrice");
    const errorEl = document.getElementById("addItemError");

    const description = descInput.value.trim();
    const measurements = measInput.value.trim();
    const qty = parseInt(qtyInput.value);
    const unitPrice = parseFloat(priceInput.value);

    [descInput, qtyInput, priceInput].forEach(el => el.classList.remove("input-error"));
    errorEl.textContent = "";

    const errors = [];
    if (!description) { descInput.classList.add("input-error"); errors.push("description"); }
    if (isNaN(qty) || qty <= 0) { qtyInput.classList.add("input-error"); errors.push("quantity"); }
    if (isNaN(unitPrice) || unitPrice < 0) { priceInput.classList.add("input-error"); errors.push("unit price"); }

    if (errors.length) {
      errorEl.textContent = `Please enter a valid ${errors.join(", ")}.`;
      return;
    }

    const total = qty * unitPrice;
    subtotal += total;
    itemCount++;

    const row = document.createElement("tr");
    row.dataset.rowTotal = total;
    row.innerHTML = `
      <td>${itemCount}</td>
      <td>${description}</td>
      <td>${measurements || "-"}</td>
      <td>${qty}</td>
      <td>${fmt(unitPrice)}</td>
      <td>${fmt(total)}</td>
      <td class="actions-cell">
        <button class="btn-edit" onclick="editRow(this)">Edit</button>
        <button class="btn-delete" onclick="deleteRow(this)">Delete</button>
      </td>
    `;

    tableBody.appendChild(row);
    updateTotals();

    descInput.value = "";
    measInput.value = "";
    qtyInput.value = "";
    priceInput.value = "";
  };

  window.editRow = function (btn) {
    const row = btn.closest("tr");
    const cells = row.querySelectorAll("td");

    if (btn.textContent === "Edit") {
      const desc = cells[1].textContent;
      const meas = cells[2].textContent === "-" ? "" : cells[2].textContent;
      const qty = cells[3].textContent;
      const unitPriceRaw = cells[4].textContent.replace(/,/g, "");

      cells[1].innerHTML = `<input type="text" value="${desc}" class="edit-input">`;
      cells[2].innerHTML = `<input type="text" value="${meas}" class="edit-input" placeholder="Measurements">`;
      cells[3].innerHTML = `<input type="number" value="${qty}" class="edit-input" min="1" style="width:60px">`;
      cells[4].innerHTML = `<input type="number" value="${unitPriceRaw}" class="edit-input" min="0" step="0.01" style="width:100px">`;
      cells[5].innerHTML = `<span class="live-total">${cells[5].textContent}</span>`;

      const updateLiveTotal = () => {
        const q = parseFloat(cells[3].querySelector("input").value) || 0;
        const p = parseFloat(cells[4].querySelector("input").value) || 0;
        cells[5].querySelector(".live-total").textContent = fmt(q * p);
      };

      cells[3].querySelector("input").addEventListener("input", updateLiveTotal);
      cells[4].querySelector("input").addEventListener("input", updateLiveTotal);

      btn.textContent = "Save";
      btn.className = "btn-save";
    } else {
      const desc = cells[1].querySelector("input").value.trim() || "-";
      const meas = cells[2].querySelector("input").value.trim() || "-";
      const qty = parseInt(cells[3].querySelector("input").value) || 0;
      const unitPrice = parseFloat(cells[4].querySelector("input").value) || 0;
      const total = qty * unitPrice;
      const oldTotal = parseFloat(row.dataset.rowTotal || 0);

      cells[1].textContent = desc;
      cells[2].textContent = meas;
      cells[3].textContent = qty;
      cells[4].textContent = fmt(unitPrice);
      cells[5].textContent = fmt(total);

      subtotal = subtotal - oldTotal + total;
      row.dataset.rowTotal = total;
      updateTotals();

      btn.textContent = "Edit";
      btn.className = "btn-edit";
    }
  };

  window.deleteRow = function (btn) {
    if (!confirm("Delete this item?")) return;
    const row = btn.closest("tr");
    const total = parseFloat(row.dataset.rowTotal || 0);
    subtotal -= total;
    row.remove();
    updateTotals();
    renumberRows();
  };

  window.addNote = function (text) {
    const notesArea = document.getElementById("deliveryNotes");
    const current = notesArea.value.trim();
    notesArea.value = current ? current + "\n• " + text : "• " + text;
  };

  window.downloadQuotation = function () {
    const element = document.getElementById("quotationContent");
    const addItemSection = document.querySelector(".add-item-section");
    const quickAdd = document.querySelector(".quick-add");
    const actionHeaders = document.querySelectorAll(".actions-header");
    const actionCells = document.querySelectorAll(".actions-cell");
    const notesSection = document.querySelector(".delivery-notes-section");
    const notesEmpty = !document.getElementById("deliveryNotes").value.trim();

    addItemSection.style.display = "none";
    if (quickAdd) quickAdd.style.display = "none";
    if (notesEmpty && notesSection) notesSection.style.display = "none";
    actionHeaders.forEach((el) => (el.style.display = "none"));
    actionCells.forEach((el) => (el.style.display = "none"));
    element.classList.add("pdf-generating");

    const receiptNo = document.getElementById("invoiceNumber").value || "Receipt";

    html2pdf()
      .from(element)
      .set({
        margin: [5, 6, 5, 6],
        filename: `${receiptNo}_Marachi.pdf`,
        image: { type: "jpeg", quality: 0.96 },
        html2canvas: { scale: 1.6, useCORS: true },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        pagebreak: { mode: ["avoid-all", "css"] },
      })
      .save()
      .then(() => {
        addItemSection.style.display = "";
        if (quickAdd) quickAdd.style.display = "";
        if (notesEmpty && notesSection) notesSection.style.display = "";
        actionHeaders.forEach((el) => (el.style.display = ""));
        actionCells.forEach((el) => (el.style.display = ""));
        element.classList.remove("pdf-generating");
      });
  };

  window.togglePaid = function () {
    const container = document.getElementById("quotationContent");
    const btn = document.getElementById("paidToggleBtn");
    const isPaid = container.classList.toggle("is-paid");
    btn.textContent = isPaid ? "Remove PAID Stamp" : "Mark as PAID";
  };

  document.getElementById("taxRate").addEventListener("input", updateTotals);
  document.getElementById("amountPaid").addEventListener("input", updateTotals);

  updateTotals();
});
