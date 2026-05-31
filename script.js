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
  dateElement.value = formattedDate;

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

    subtotalEl.textContent = fmt(subtotal);
    document.getElementById("taxAmount").textContent = fmt(taxAmt);
    grandTotalEl.textContent = fmt(total);
  }

  function renumberRows() {
    tableBody.querySelectorAll("tr").forEach((row, index) => {
      row.querySelector("td:first-child").textContent = index + 1;
    });
    itemCount = tableBody.querySelectorAll("tr").length;
  }

  window.addItem = function () {
    const descInput = document.getElementById("description");
    const priceInput = document.getElementById("unitPrice");
    const errorEl = document.getElementById("addItemError");

    const description = descInput.value.trim();
    const amount = parseFloat(priceInput.value);

    [descInput, priceInput].forEach(el => el.classList.remove("input-error"));
    errorEl.textContent = "";

    const errors = [];
    if (!description) { descInput.classList.add("input-error"); errors.push("description"); }
    if (isNaN(amount) || amount < 0) { priceInput.classList.add("input-error"); errors.push("amount"); }

    if (errors.length) {
      errorEl.textContent = `Please enter a valid ${errors.join(", ")}.`;
      return;
    }

    subtotal += amount;
    itemCount++;

    const row = document.createElement("tr");
    row.dataset.rowTotal = amount;
    row.innerHTML = `
      <td>${itemCount}</td>
      <td>${description}</td>
      <td>${fmt(amount)}</td>
      <td class="actions-cell">
        <button class="btn-edit" onclick="editRow(this)">Edit</button>
        <button class="btn-delete" onclick="deleteRow(this)">Delete</button>
      </td>
    `;

    tableBody.appendChild(row);
    updateTotals();

    descInput.value = "";
    priceInput.value = "";
  };

  window.editRow = function (btn) {
    const row = btn.closest("tr");
    const cells = row.querySelectorAll("td");

    if (btn.textContent === "Edit") {
      const desc = cells[1].textContent;
      const amountRaw = cells[2].textContent.replace(/,/g, "");

      cells[1].innerHTML = `<input type="text" value="${desc}" class="edit-input">`;
      cells[2].innerHTML = `<input type="number" value="${amountRaw}" class="edit-input" min="0" step="0.01" style="width:110px">`;

      btn.textContent = "Save";
      btn.className = "btn-save";
    } else {
      const desc = cells[1].querySelector("input").value.trim() || "-";
      const amount = parseFloat(cells[2].querySelector("input").value) || 0;
      const oldTotal = parseFloat(row.dataset.rowTotal || 0);

      cells[1].textContent = desc;
      cells[2].textContent = fmt(amount);

      subtotal = subtotal - oldTotal + amount;
      row.dataset.rowTotal = amount;
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

  window.downloadQuotation = function () {
    const element = document.getElementById("quotationContent");
    const addItemSection = document.querySelector(".add-item-section");
    const actionHeaders = document.querySelectorAll(".actions-header");
    const actionCells = document.querySelectorAll(".actions-cell");

    addItemSection.style.display = "none";
    actionHeaders.forEach((el) => (el.style.display = "none"));
    actionCells.forEach((el) => (el.style.display = "none"));
    element.classList.add("pdf-generating");
    element.style.width = "1060px";
    element.style.maxWidth = "1060px";
    element.style.margin = "0";

    const fileName = document.getElementById("projectDesc").value.trim()
      || document.getElementById("invoiceNumber").value.trim()
      || "Receipt";

    html2pdf()
      .from(element)
      .set({
        margin: [5, 6, 5, 6],
        filename: `${fileName}_Marachi.pdf`,
        image: { type: "jpeg", quality: 0.96 },
        html2canvas: { scale: 1.6, useCORS: true, windowWidth: 1200 },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        pagebreak: { mode: ["avoid-all", "css"] },
      })
      .save()
      .then(() => {
        addItemSection.style.display = "";
        actionHeaders.forEach((el) => (el.style.display = ""));
        actionCells.forEach((el) => (el.style.display = ""));
        element.classList.remove("pdf-generating");
        element.style.width = "";
        element.style.maxWidth = "";
        element.style.margin = "";
      });
  };

  window.togglePaid = function () {
    const container = document.getElementById("quotationContent");
    const btn = document.getElementById("paidToggleBtn");
    const isPaid = container.classList.toggle("is-paid");
    btn.textContent = isPaid ? "Remove PAID Stamp" : "Mark as PAID";
  };

  document.getElementById("taxRate").addEventListener("input", updateTotals);
  document.getElementById("taxRate").addEventListener("change", updateTotals);

  updateTotals();
});
