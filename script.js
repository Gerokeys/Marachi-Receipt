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
      subtotal += total;
      itemCount++;

      const row = document.createElement("tr");
      row.innerHTML = `
                <td>${itemCount}</td>
                <td>${description}</td>
                <td>${total.toLocaleString()}</td>
            `;

      tableBody.appendChild(row);

      subtotalEl.textContent = subtotal.toLocaleString();
      grandTotal = subtotal;
      grandTotalEl.textContent = grandTotal.toLocaleString();

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
        clearPage();
      });
  };

  // Download Word Document Function
  window.downloadWordQuotation = function () {
    const { Document, Packer, Paragraph, TextRun } = window.docx; // Use docx from the global window

    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph({
              children: [new TextRun("Quotation - Marachi Metal Fabricators")],
              heading: "Heading1",
            }),
            new Paragraph({
              children: [new TextRun(`Date: ${formattedDate}`)],
            }),
            new Paragraph({
              children: [new TextRun(`Subtotal: ${subtotalEl.textContent}`)],
            }),
            new Paragraph({
              children: [new TextRun(`Grand Total: ${grandTotalEl.textContent}`)],
            }),
            new Paragraph({
              text: "\nItems:",
              spacing: { after: 200 },
            }),
          ],
        },
      ],
    });

    // Add items from the table to the Word document
    tableBody.querySelectorAll("tr").forEach((row, index) => {
      const columns = row.querySelectorAll("td");
      const itemText = `${columns[0].textContent}. ${columns[1].textContent} - Ksh ${columns[2].textContent}`;
      doc.addSection({
        children: [new Paragraph({ text: itemText })],
      });
    });

    // Generate and download the Word document
    Packer.toBlob(doc).then((blob) => {
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "Quotation_Marachi_Metal_Fabricators.docx";
      link.click();
    });
  };

  function clearPage() {
    tableBody.innerHTML = "";
    subtotal = 0;
    grandTotal = 0;
    itemCount = 0;
    subtotalEl.textContent = "0.00";
    grandTotalEl.textContent = "0.00";

    document.getElementById("description").value = "";
    document.getElementById("totalPrice").value = "";
    document.getElementById("clientName").value = "";
    document.getElementById("projectDesc").value = "";
  }

  const dateElement = document.getElementById("currentDate");
  const today = new Date();
  const formattedDate = today.getFullYear() + "-" + 
                        String(today.getMonth() + 1).padStart(2, '0') + "-" + 
                        String(today.getDate()).padStart(2, '0');
  dateElement.textContent = formattedDate;
});
