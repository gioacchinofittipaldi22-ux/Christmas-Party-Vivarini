
import { firebaseConfig } from "./firebase-config.js";

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";

import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDocs,
  onSnapshot,
  runTransaction
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ---------- UTENTE ----------

let userCode = localStorage.getItem("cpv_userCode");

if (!userCode) {
  userCode = "CPV-" +
    crypto.randomUUID().substring(0, 8).toUpperCase();

  localStorage.setItem("cpv_userCode", userCode);
}

document.getElementById("userCode").textContent = userCode;

// ---------- UTILITÀ ----------

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function clean(value) {
  return String(value ?? "").trim().slice(0, 80);
}

// ---------- LISTA INIZIALE ----------

const defaultItems = [
  ["Tagliere salumi", "Salato"],
  ["Tagliere formaggi", "Salato"],
  ["Focaccia farcita", "Salato"],
  ["Torta salata", "Salato"],
  ["Tramezzini assortiti", "Salato"],
  ["Lasagne", "Piatti fatti in casa"],
  ["Parmigiana", "Piatti fatti in casa"],
  ["Polpette", "Piatti fatti in casa"],
  ["Ricetta libera", "Piatti fatti in casa"],
  ["Panettone", "Dolci"],
  ["Pandoro", "Dolci"],
  ["Torta fatta in casa", "Dolci"],
  ["Coca Cola", "Analcolici"],
  ["Coca Cola Zero", "Analcolici"],
  ["Aranciata", "Analcolici"],
  ["Succhi di frutta", "Analcolici"],
  ["Prosecco", "Bevande adulti"],
  ["Vino rosso", "Bevande adulti"],
  ["Vino bianco", "Bevande adulti"],
  ["Birra", "Bevande adulti"],
  ["Ghiaccio", "Materiali utili"]
];

// ---------- INIZIALIZZAZIONE ----------

async function initializeItems() {
  const snapshot = await getDocs(collection(db, "items"));

  if (snapshot.empty) {
    for (const [name, category] of defaultItems) {
      const id = name.toLowerCase().replaceAll(" ", "-");

      await setDoc(doc(db, "items", id), {
        name,
        category,
        booked: false,
        bookedBy: "",
        bookedByCode: "",
        createdAt: Date.now()
      });
    }
  }
}

initializeItems().catch(error => {
  console.error("Errore inizializzazione:", error);
  alert("Impossibile caricare la lista iniziale.");
});

// ---------- INTERFACCIA LISTA ----------

const container = document.getElementById("itemsContainer");

const toolbar = document.createElement("section");
toolbar.id = "itemsToolbar";

toolbar.innerHTML = `
  <div class="add-item-panel">
    <h3>🎁 Aggiungi qualcosa alla lista</h3>
    <p>Non trovi quello che vuoi portare?
       Aggiungilo liberamente!</p>

    <form id="addItemForm">
      <input
        id="newItemName"
        type="text"
        maxlength="80"
        placeholder="Es. Tiramisù fatto in casa"
        required
      >

      <input
        id="newItemCategory"
        type="text"
        maxlength="40"
        placeholder="Categoria (es. Dolci)"
        required
      >

      <button type="submit">+ Aggiungi alla lista</button>
    </form>
  </div>

  <div class="filter-panel">
    <h3>🔎 Cerca nella lista</h3>

    <input
      id="itemSearch"
      type="search"
      placeholder="Cerca un prodotto..."
    >

    <select id="categoryFilter">
      <option value="">Tutte le categorie</option>
    </select>

    <select id="availabilityFilter">
      <option value="all">Tutte le cose</option>
      <option value="available">Solo disponibili</option>
      <option value="booked">Solo prenotate</option>
      <option value="mine">Le mie prenotazioni</option>
    </select>
  </div>
`;

container.parentNode.insertBefore(toolbar, container);

// ---------- AGGIUNTA ELEMENTI LIBERI ----------

document.getElementById("addItemForm")
  .addEventListener("submit", async event => {
    event.preventDefault();

    const name = clean(
      document.getElementById("newItemName").value
    );

    const category = clean(
      document.getElementById("newItemCategory").value
    );

    if (!name || !category) {
      alert("Inserisci nome e categoria.");
      return;
    }

    try {
      const newRef = doc(collection(db, "items"));

      await setDoc(newRef, {
        name,
        category,
        booked: false,
        bookedBy: "",
        bookedByCode: "",
        createdBy: userCode,
        createdAt: Date.now()
      });

      document.getElementById("addItemForm").reset();

      alert("🎄 Elemento aggiunto alla lista!");
    } catch (error) {
      console.error(error);
      alert("Non è stato possibile aggiungere l'elemento.");
    }
  });

// ---------- PRESENZE ----------

document.getElementById("saveAttendance")
  .addEventListener("click", saveAttendance);

async function saveAttendance() {
  const name = clean(
    document.getElementById("guestName").value
  );

  const adults = Number(
    document.getElementById("adults").value
  );

  const children = Number(
    document.getElementById("children").value
  );

  if (!name) {
    alert("Inserisci nome e cognome.");
    return;
  }

  if (
    !Number.isInteger(adults) ||
    !Number.isInteger(children) ||
    adults < 0 ||
    children < 0 ||
    adults + children < 1
  ) {
    alert("Inserisci un numero valido di adulti e bambini.");
    return;
  }

  try {
    await setDoc(doc(db, "attendees", userCode), {
      name,
      adults,
      children,
      code: userCode,
      updatedAt: Date.now()
    });

    alert("🎄 Presenza salvata correttamente!");
  } catch (error) {
    console.error(error);
    alert("Errore durante il salvataggio.");
  }
}

// ---------- TOTALI E LISTA ISCRITTI ----------

const attendeesList = document.getElementById("attendeesList");

onSnapshot(collection(db, "attendees"), snapshot => {
  let adults = 0;
  let children = 0;
  const attendees = [];

  snapshot.forEach(attendee => {
    const data = attendee.data();
    adults += Number(data.adults) || 0;
    children += Number(data.children) || 0;
    attendees.push({ name: clean(data.name) || "Nome non disponibile" });
  });

  document.getElementById("stats").innerHTML = `
    <div class="stats-grid">
      <div class="stat"><div class="stat-number">${adults}</div>Adulti</div>
      <div class="stat"><div class="stat-number">${children}</div>Bambini</div>
      <div class="stat"><div class="stat-number">${adults + children}</div>Totale persone</div>
      <div class="stat"><div class="stat-number">${attendees.length}</div>Prenotazioni</div>
    </div>
  `;

  attendees.sort((a, b) => a.name.localeCompare(b.name, "it"));

  attendeesList.innerHTML = attendees.length
    ? `<ul class="guest-list">${attendees.map(({name}) => `
        <li class="guest-list-item"><strong>${escapeHTML(name)}</strong></li>
      `).join("")}</ul>`
    : '<div class="empty-list">Non ci sono ancora iscrizioni. Sarai il primo?</div>';
}, error => {
  console.error("Errore caricamento iscritti:", error);
  attendeesList.textContent = "Non è stato possibile caricare la lista degli iscritti. Riprova più tardi.";
});

// ---------- FILTRI ----------

const searchInput = document.getElementById("itemSearch");
const categoryFilter = document.getElementById("categoryFilter");
const availabilityFilter = document.getElementById("availabilityFilter");

let allItems = [];

[searchInput, categoryFilter, availabilityFilter].forEach(input => {
  input.addEventListener("input", renderItems);
  input.addEventListener("change", renderItems);
});

// ---------- CARICAMENTO ELEMENTI IN TEMPO REALE ----------

onSnapshot(collection(db, "items"), snapshot => {
  allItems = snapshot.docs.map(itemDoc => ({
    id: itemDoc.id,
    ...itemDoc.data()
  }));

  const categories = [...new Set(
    allItems.map(item => item.category).filter(Boolean)
  )].sort();

  const previousCategory = categoryFilter.value;

  categoryFilter.innerHTML =
    '<option value="">Tutte le categorie</option>' +
    categories.map(category =>
      `<option value="${escapeHTML(category)}">
        ${escapeHTML(category)}
      </option>`
    ).join("");

  if (categories.includes(previousCategory)) {
    categoryFilter.value = previousCategory;
  }

  renderItems();
});

// ---------- VISUALIZZAZIONE ELEMENTI ----------

function renderItems() {
  const search = searchInput.value.toLowerCase();
  const category = categoryFilter.value;
  const availability = availabilityFilter.value;

  const filtered = allItems.filter(item => {
    const matchesSearch =
      item.name.toLowerCase().includes(search);

    const matchesCategory =
      !category || item.category === category;

    let matchesAvailability = true;

    if (availability === "available") {
      matchesAvailability = !item.booked;
    }

    if (availability === "booked") {
      matchesAvailability = item.booked;
    }

    if (availability === "mine") {
      matchesAvailability =
        item.bookedByCode === userCode;
    }

    return matchesSearch &&
      matchesCategory &&
      matchesAvailability;
  });

  if (!filtered.length) {
    container.innerHTML = `
      <div class="empty-list">
        🎄 Nessun elemento trovato.
        Puoi aggiungerne uno nuovo!
      </div>
    `;
  } else {
    container.innerHTML = filtered.map(item => `
      <div class="item-card">

        <div class="item-top">
          <div>
            <strong>${escapeHTML(item.name)}</strong>
            <div class="item-category">
              ${escapeHTML(item.category)}
            </div>
          </div>

          ${
            !item.booked
              ? `
                <button
                  class="book-btn"
                  data-action="book"
                  data-id="${escapeHTML(item.id)}">
                  Lo porto io
                </button>
              `
              : item.bookedByCode === userCode
                ? `
                  <button
                    class="release-btn"
                    data-action="release"
                    data-id="${escapeHTML(item.id)}">
                    Annulla
                  </button>
                `
                : `
                  <span class="booked-label">
                    ✓ Prenotato
                  </span>
                `
          }
        </div>

        ${
          item.booked
            ? `
              <div class="item-owner">
                🎁 Lo porta: ${escapeHTML(item.bookedBy)}
                ${
                  item.bookedByCode === userCode
                    ? "(Tu)"
                    : ""
                }
              </div>
            `
            : `
              <div class="item-available">
                ✓ Ancora disponibile
              </div>
            `
        }

      </div>
    `).join("");
  }

  updateAlerts();
}

// ---------- PRENOTAZIONI SICURE ----------

container.addEventListener("click", async event => {
  const button = event.target.closest("button[data-action]");

  if (!button) return;

  const id = button.dataset.id;
  const action = button.dataset.action;

  if (action === "book") {
    await bookItem(id);
  }

  if (action === "release") {
    await releaseItem(id);
  }
});

async function bookItem(id) {
  const userName = clean(
    document.getElementById("guestName").value
  );

  if (!userName) {
    alert("Inserisci prima il tuo nome nelle presenze.");
    return;
  }

  try {
    await runTransaction(db, async transaction => {
      const itemRef = doc(db, "items", id);
      const itemSnapshot = await transaction.get(itemRef);

      if (!itemSnapshot.exists()) {
        throw new Error("Elemento non trovato.");
      }

      if (itemSnapshot.data().booked) {
        throw new Error("Questo elemento è già stato prenotato!");
      }

      transaction.update(itemRef, {
        booked: true,
        bookedBy: userName,
        bookedByCode: userCode,
        bookedAt: Date.now()
      });
    });

    alert("🎄 Prenotazione confermata!");
  } catch (error) {
    console.error(error);
    alert(error.message || "Errore nella prenotazione.");
  }
}

// ---------- ANNULLAMENTO PRENOTAZIONI ----------

async function releaseItem(id) {
  if (!confirm("Vuoi annullare questa prenotazione?")) {
    return;
  }

  try {
    await runTransaction(db, async transaction => {
      const itemRef = doc(db, "items", id);
      const itemSnapshot = await transaction.get(itemRef);

      if (!itemSnapshot.exists()) {
        throw new Error("Elemento non trovato.");
      }

      if (itemSnapshot.data().bookedByCode !== userCode) {
        throw new Error("Non puoi annullare la prenotazione di un altro invitato.");
      }

      transaction.update(itemRef, {
        booked: false,
        bookedBy: "",
        bookedByCode: "",
        bookedAt: null
      });
    });

    alert("Prenotazione annullata!");
  } catch (error) {
    console.error(error);
    alert(error.message || "Errore durante l'annullamento.");
  }
}

// ---------- SUGGERIMENTI ----------

function updateAlerts() {
  const alerts = document.getElementById("alerts");

  const available = allItems.filter(item => !item.booked);

  const food = available.filter(item =>
    !["Analcolici", "Bevande adulti", "Materiali utili"]
      .includes(item.category)
  );

  const drinks = available.filter(item =>
    ["Analcolici", "Bevande adulti"].includes(item.category)
  );

  const booked = allItems.filter(item => item.booked).length;

  let html = `
    <div class="stats-grid">
      <div class="stat">
        <div class="stat-number">${allItems.length}</div>
        Elementi totali
      </div>

      <div class="stat">
        <div class="stat-number">${booked}</div>
        Prenotati
      </div>

      <div class="stat">
        <div class="stat-number">${available.length}</div>
        Disponibili
      </div>
    </div>
  `;

  if (drinks.length < 5) {
    html += `
      <div class="alert">
        🥤 Mancano ancora alcune bevande!
      </div>
    `;
  }

  if (food.length < 8) {
    html += `
      <div class="alert">
        🍽️ Sarebbe utile aggiungere altro cibo!
      </div>
    `;
  }

  if (food.length >= 8 && drinks.length >= 5) {
    html += `
      <div class="alert">
        🎅 Ottimo! La lista sta prendendo forma!
      </div>
    `;
  }

  alerts.innerHTML = html;
}
