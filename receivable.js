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

    // process fparty
    if (data.fparty && data.fparty.trim() !== "") {
      const party = data.fparty.trim().toLowerCase();
      balanceMap[party] = (balanceMap[party] || 0) + Number(data.amt || 0);
    }

    // process tparty
    if (data.tparty && data.tparty.trim() !== "") {
      const party = data.tparty.trim().toLowerCase();
      balanceMap[party] = (balanceMap[party] || 0) - Number(data.amt || 0);
    }
  });

  const filtered = Object.entries(balanceMap)
    .filter(([party, amount]) => amount < 0)
    .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));

  const tableBody = document.querySelector("#receivablesTable tbody");
  tableBody.innerHTML = "";

  filtered.forEach(([party, amount]) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${capitalizeWords(party)}</td>
      <td>${Math.abs(amount).toFixed(0)}</td>
    `;
    tableBody.appendChild(row);
  });
}

function capitalizeWords(str) {
  return str
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
