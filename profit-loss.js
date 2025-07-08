import {
  auth,
  setupAuthCheck,
  logout,
  openSidebar,
  setupSidebarCloseOnOutsideClick
} from "./helpers.js";

import {
  getFirestore,
  collection,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const db = getFirestore();

window.logout = logout;
window.openSidebar = openSidebar;
setupSidebarCloseOnOutsideClick();

setupAuthCheck(loadPL);

document.getElementById("calcBtn").addEventListener("click", () => {
  const fromDate = document.getElementById("fromDate").value;
  const toDate = document.getElementById("toDate").value;
  const closingStock = parseFloat(document.getElementById("closingStock").value || 0);
  loadPL(fromDate, toDate, closingStock);
});

async function loadPL(fromDate = "", toDate = "", closingStock = 0) {
  const tranCol = collection(db, "tran");
  const snapshot = await getDocs(tranCol);

  let openingStock = 0;
  let purchase = 0;
  let expense = 0;
  let sales = 0;

  snapshot.forEach(doc => {
    const data = doc.data();

    let tranDate = data.date || "";
    let amount = parseFloat(data.amt || 0);
    let ttype = (data.ttype || "").toLowerCase();

    if (fromDate && toDate) {
      if (tranDate < fromDate || tranDate > toDate) {
        return; // skip transactions outside date range
      }
    }

    if (ttype === "op stock") {
      openingStock += amount;
    } else if (ttype === "purchase") {
      purchase += amount;
    } else if (ttype === "expense") {
      expense += amount;
    } else if (ttype === "sales") {
      sales += amount;
    }
  });

  let debitTotal = openingStock + purchase + expense;
  let creditTotal = sales + closingStock;
  let profit = creditTotal - debitTotal;

  const rows = [
    ["Opening Stock", openingStock.toFixed(0)],
    ["Purchase", purchase.toFixed(0)],
    ["Expense", expense.toFixed(0)],
    ["Total (Op+Pur+Exp)", debitTotal.toFixed(0)],
    ["Sales", sales.toFixed(0)],
    ["Closing Stock", closingStock.toFixed(0)],
    ["Total (Sales+Clo)", creditTotal.toFixed(0)],
    ["Profit / Loss", profit.toFixed(0)],
  ];

  const tbody = document.querySelector("#plTable tbody");
  tbody.innerHTML = "";
  rows.forEach(([desc, amount]) => {
    const tr = document.createElement("tr");
    const td1 = document.createElement("td");
    td1.textContent = desc;
    const td2 = document.createElement("td");
    td2.textContent = amount;
    tr.appendChild(td1);
    tr.appendChild(td2);
    tbody.appendChild(tr);
  });
}
