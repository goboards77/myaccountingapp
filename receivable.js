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
  getDocs
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const db = getFirestore();

window.logout = logout;
window.openSidebar = openSidebar;
setupSidebarCloseOnOutsideClick();

setupAuthCheck(fetchReceivable);

async function fetchReceivable() {
  const tranCol = collection(db, "tran");
  const snapshot = await getDocs(tranCol);

  const balanceMap = {};

  snapshot.forEach((doc) => {
    const data = doc.data();

    if (data.fparty && data.fparty !== "") {
      balanceMap[data.fparty] = (balanceMap[data.fparty] || 0) + Number(data.amt);
    }
    if (data.tparty && data.tparty !== "") {
      balanceMap[data.tparty] = (balanceMap[data.tparty] || 0) - Number(data.amt);
    }
  });

  const filtered = Object.entries(balanceMap)
    .filter(([party, amount]) => amount < 0)
    .sort((a, b) => a[1] - b[1]);

  const tableBody = document.querySelector("#resultTable tbody");
  tableBody.innerHTML = "";

  filtered.forEach(([party, amount]) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${party}</td>
      <td>${Math.abs(amount).toFixed(0)}</td>
    `;
    tableBody.appendChild(row);
  });
}
