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
  orderBy,
  limit
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
      if (["Creditors", "Debtors"].includes(data.grp)) {
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
  const nar = document.getElementById("details").value.trim();

  if (!ttype || !dateInput || !fparty || !tparty || !amt) {
    alert("Please fill all required fields.");
    return;
  }

  const [year, month, day] = dateInput.includes("-")
    ? dateInput.split("-")
    : ["", "", ""];

  const saveDate = `${year}-${month}-${day}`;

  const tranCol = collection(db, "tran");
  const latestSnap = await getDocs(
    query(tranCol, orderBy("id", "desc"), limit(1))
  );

  let newId = 1;
  latestSnap.forEach((doc) => {
    const prevId = parseInt(doc.data().id, 10);
    if (!isNaN(prevId)) newId = prevId + 1;
  });

  let f = fparty;
  let t = tparty;

  if (ttype === "Sales") {
    f = tparty;
    t = fparty;
  }

  console.log("Auth user:", auth.currentUser);
  console.log("Transaction payload:", {
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
