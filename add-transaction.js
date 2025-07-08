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
  addDoc,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const db = getFirestore();

window.logout = logout;
window.openSidebar = openSidebar;
setupSidebarCloseOnOutsideClick();

setupAuthCheck(initTransactionPage);

function capitalizeWords(str) {
  return str
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

async function initTransactionPage() {
  setupTtypeDropdown();
}

function setupTtypeDropdown() {
  const ttypeInput = document.getElementById("ttype");
  const listDiv = document.getElementById("ttypeList");

  const types = ["Sales", "Purchase", "Receipt", "Payment"];

  ttypeInput.addEventListener("input", () => {
    const text = ttypeInput.value.toLowerCase();
    listDiv.innerHTML = "";

    const filtered = types.filter((t) =>
      t.toLowerCase().includes(text)
    );

    filtered.forEach((t) => {
      const div = document.createElement("div");
      div.textContent = t;
      div.onclick = () => {
        ttypeInput.value = t;
        listDiv.style.display = "none";
        loadPartiesForType(t);
      };
      listDiv.appendChild(div);
    });

    listDiv.style.display = filtered.length > 0 ? "block" : "none";
  });

  ttypeInput.addEventListener("focus", () => {
    ttypeInput.dispatchEvent(new Event("input"));
  });
}

async function loadPartiesForType(ttype) {
  const fpartyInput = document.getElementById("fparty");
  const fpartyList = document.getElementById("fpartyList");
  const tpartyInput = document.getElementById("tparty");
  const tpartyList = document.getElementById("tpartyList");

  fpartyInput.value = "";
  tpartyInput.value = "";
  fpartyList.innerHTML = "";
  tpartyList.innerHTML = "";

  let fpartyNames = [];
  let tpartyNames = [];

  const tranCol = collection(db, "tran");
  const snapshot = await getDocs(tranCol);

  if (ttype === "Sales" || ttype === "Purchase") {
    snapshot.forEach((doc) => {
      const data = doc.data();
      if (["Creditors", "Debitors"].includes(data.grp)) {
        if (data.name && !fpartyNames.includes(data.name)) {
          fpartyNames.push(data.name);
        }
      }
    });
  } else if (ttype === "Receipt" || ttype === "Payment") {
    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.grp && !["Sales", "Purchase"].includes(data.grp)) {
        if (data.name && !fpartyNames.includes(data.name)) {
          fpartyNames.push(data.name);
        }
      }
    });
  }

  if (ttype === "Sales") {
    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.grp === "Sales") {
        if (data.name && !tpartyNames.includes(data.name)) {
          tpartyNames.push(data.name);
        }
      }
    });
  } else if (ttype === "Purchase") {
    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.grp === "Purchase") {
        if (data.name && !tpartyNames.includes(data.name)) {
          tpartyNames.push(data.name);
        }
      }
    });
  } else {
    tpartyNames = fpartyNames.slice();
  }

  fpartyNames.sort((a, b) => a.localeCompare(b));
  tpartyNames.sort((a, b) => a.localeCompare(b));

  setupDropdown(fpartyInput, fpartyList, fpartyNames);
  setupDropdown(tpartyInput, tpartyList, tpartyNames);
}

function setupDropdown(input, listDiv, items) {
  input.addEventListener("input", () => {
    const text = input.value.toLowerCase();
    listDiv.innerHTML = "";

    const filtered = items.filter((t) =>
      t.toLowerCase().includes(text)
    );

    filtered.forEach((t) => {
      const div = document.createElement("div");
      div.textContent = capitalizeWords(t);
      div.onclick = () => {
        input.value = capitalizeWords(t);
        listDiv.style.display = "none";
      };
      listDiv.appendChild(div);
    });

    listDiv.style.display = filtered.length > 0 ? "block" : "none";
  });

  input.addEventListener("focus", () => {
    input.dispatchEvent(new Event("input"));
  });
}

document.getElementById("saveBtn").addEventListener("click", async () => {
  const ttype = capitalizeWords(
    document.getElementById("ttype").value.trim()
  );
  const dateInput = document.getElementById("tranDate").value.trim();
  const fparty = capitalizeWords(
    document.getElementById("fparty").value.trim()
  );
  const tparty = capitalizeWords(
    document.getElementById("tparty").value.trim()
  );
  const amt = document.getElementById("amount").value.trim();
  const nar = capitalizeWords(
    document.getElementById("details").value.trim()
  );

  if (!ttype || !dateInput || !fparty || !tparty || !amt) {
    alert("Please fill all required fields.");
    return;
  }

  // Convert DD-MM-YYYY → YYYY-MM-DD
  let saveDate = "";
  if (dateInput && dateInput.includes("-")) {
    const parts = dateInput.split("-");
    if (parts.length === 3) {
      saveDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
  } else {
    alert("Invalid date format. Please use DD-MM-YYYY.");
    return;
  }

  const tranCol = collection(db, "tran");
  const snapshot = await getDocs(tranCol);

  let maxId = 0;
  snapshot.forEach((doc) => {
    const idVal = parseInt(doc.data().id, 10);
    if (!isNaN(idVal) && idVal > maxId) {
      maxId = idVal;
    }
  });

  const newId = maxId + 1;

  let f = fparty;
  let t = tparty;
  if (ttype === "Sales") {
    f = tparty;
    t = fparty;
  }

  await addDoc(tranCol, {
    id: newId.toString(),
    date: saveDate,
    ttype,
    fparty: f,
    tparty: t,
    nar,
    amt,
    grp: "",
    name: ""
  });

  alert("Transaction saved!");
  document.getElementById("ttype").value = "";
  document.getElementById("tranDate").value = "";
  document.getElementById("fparty").value = "";
  document.getElementById("tparty").value = "";
  document.getElementById("amount").value = "";
  document.getElementById("details").value = "";
});
