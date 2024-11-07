document.addEventListener("DOMContentLoaded", function () {
  const tableBody = document.querySelector("#quotationTable tbody");
  const grandTotalEl = document.getElementById("grandTotal");
  const subtotalEl = document.getElementById("subtotal");

  let subtotal = 0;
  let grandTotal = 0;
  let itemCount = 0;

  window.addItem = function () {
    const description = document.getElementById("description").value;
    const total = parseFloat(document.getElementById("totalPrice").value);

    if (description && total > 0) {
      subtotal += total; // Add to subtotal
      itemCount++;

      const row = document.createElement("tr");
      row.innerHTML = `
                <td>${itemCount}</td>
                <td>${description}</td>
                <td>${total.toLocaleString()}</td>
            `;

      tableBody.appendChild(row);

      // Update subtotal and grand total
      subtotalEl.textContent = subtotal.toLocaleString();
      grandTotal = subtotal;
      grandTotalEl.textContent = grandTotal.toLocaleString();

      // Clear input fields
      document.getElementById("description").value = "";
      document.getElementById("totalPrice").value = "";
    } else {
      alert("Please fill in all fields with valid information.");
    }
  };

  window.downloadQuotation = function () {
    const element = document.getElementById("quotationContent");
    const formSection = document.querySelector(".form");
    const addItemButton = document.querySelector('button[onclick="addItem()"]');

    formSection.style.display = "none";
    addItemButton.style.display = "none";

    html2pdf()
      .from(element)
      .set({
        margin: [10, 10, 10, 10],
        filename: "Invoice_Marachi_Metal_Fabricators.pdf",
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      })
      .save()
      .then(() => {
        formSection.style.display = "flex";
        addItemButton.style.display = "block";
        
        // Clear table and reset fields after download
        clearPage();
      });
  };

  function clearPage() {
    // Clear the table body
    tableBody.innerHTML = "";

    // Reset counters and totals
    subtotal = 0;
    grandTotal = 0;
    itemCount = 0;
    subtotalEl.textContent = "0.00";
    grandTotalEl.textContent = "0.00";

    // Clear input fields
    document.getElementById("description").value = "";
    document.getElementById("totalPrice").value = "";
    document.getElementById("clientName").value = "";
    document.getElementById("projectDesc").value = "";
  }

  // Set current date
  const dateElement = document.getElementById("currentDate");
  const today = new Date();
  const formattedDate = today.getFullYear() + "-" + 
                        String(today.getMonth() + 1).padStart(2, '0') + "-" + 
                        String(today.getDate()).padStart(2, '0');
  dateElement.textContent = formattedDate;
});
