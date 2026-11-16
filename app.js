import { firebaseConfig } from "./firebase-config.js";

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";

import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDocs,
  onSnapshot,
  updateDoc
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/* ---------- UTENTE ---------- */

let userCode = localStorage.getItem("cpv_userCode");

if (!userCode) {
  userCode =
    "CPV-" +
    Math.random().toString(36).substring(2, 8).toUpperCase();

  localStorage.setItem("cpv_userCode", userCode);
}

document.getElementById("userCode").textContent = userCode;

/* ---------- LISTA INIZIALE ---------- */

const defaultItems = [
  ["Tagliere salumi","Salato"],
  ["Tagliere formaggi","Salato"],
  ["Focaccia farcita","Salato"],
  ["Torta salata","Salato"],
  ["Tramezzini assortiti","Salato"],

  ["Lasagne","Piatti fatti in casa"],
  ["Parmigiana","Piatti fatti in casa"],
  ["Polpette","Piatti fatti in casa"],
  ["Ricetta libera","Piatti fatti in casa"],

  ["Panettone","Dolci"],
  ["Pandoro","Dolci"],
  ["Torta fatta in casa","Dolci"],

  ["Coca Cola","Analcolici"],
  ["Coca Cola Zero","Analcolici"],
  ["Aranciata","Analcolici"],
  ["Succhi di frutta","Analcolici"],

  ["Prosecco","Bevande adulti"],
  ["Vino rosso","Bevande adulti"],
  ["Vino bianco","Bevande adulti"],
  ["Birra","Bevande adulti"],

  ["Ghiaccio","Materiali utili"]
];

/* ---------- INIZIALIZZAZIONE ---------- */

async function initializeItems() {

  const snapshot =
      await getDocs(collection(db,"items"));

  if(snapshot.empty){

    for(const item of defaultItems){

      const id = item[0]
        .toLowerCase()
        .replaceAll(" ","-");

      await setDoc(
        doc(db,"items",id),
        {
          name:item[0],
          category:item[1],
          booked:false,
          bookedBy:"",
          bookedByCode:""
        }
      );
    }
  }
}

initializeItems();

/* ---------- PRESENZE ---------- */

document
.getElementById("saveAttendance")
.addEventListener("click", saveAttendance);

async function saveAttendance(){

  const name =
   document.getElementById("guestName").value.trim();

  if(!name){
    alert("Inserisci nome e cognome");
    return;
  }

  const adults =
   Number(document.getElementById("adults").value);

  const children =
   Number(document.getElementById("children").value);

  await setDoc(
    doc(db,"attendees",userCode),
    {
      name,
      adults,
      children,
      code:userCode,
      updatedAt:Date.now()
    }
  );

  alert("Presenza salvata");
}

/* ---------- TOTALI ---------- */

onSnapshot(
 collection(db,"attendees"),
 snapshot => {

  let adults = 0;
  let children = 0;

  snapshot.forEach(docu => {

    const d = docu.data();

    adults += d.adults || 0;
    children += d.children || 0;
  });

  document.getElementById("stats").innerHTML = `
    <div class="stats-grid">

      <div class="stat">
      <div class="stat-number">${adults}</div>
      Adulti
      </div>

      <div class="stat">
      <div class="stat-number">${children}</div>
      Bambini
      </div>

      <div class="stat">
      <div class="stat-number">${adults+children}</div>
      Totale
      </div>

    </div>
  `;
 });

/* ---------- ELEMENTI ---------- */

const container =
 document.getElementById("itemsContainer");

onSnapshot(
 collection(db,"items"),
 snapshot => {

  let html = "";

  let beverages = 0;
  let food = 0;

  snapshot.forEach(itemDoc => {

    const item = itemDoc.data();

    if(
      item.category === "Analcolici" ||
      item.category === "Bevande adulti"
    ){
      beverages++;
    } else {
      food++;
    }

    let buttonHtml = "";

    if(!item.booked){

      buttonHtml = `
      <button
      class="book-btn"
      onclick="bookItem('${itemDoc.id}')">
      Lo porto io
      </button>`;
    }

    else if(item.bookedByCode === userCode){

      buttonHtml = `
      <button
      class="release-btn"
      onclick="releaseItem('${itemDoc.id}')">
      Ritira prenotazione
      </button>`;
    }

    html += `
    <div class="item-card">

      <div class="item-top">

        <div>

          <strong>${item.name}</strong>

          <div class="item-category">
          ${item.category}
          </div>

        </div>

        ${buttonHtml}

      </div>

      ${
        item.booked
        ?
        `<div class="item-owner">
          Prenotato da:
          ${item.bookedBy}
        </div>`
        :
        ""
      }

    </div>
    `;
  });

  container.innerHTML = html;

  updateAlerts(food,beverages);
 });

/* ---------- PRENOTAZIONI ---------- */

window.bookItem = async function(id){

  const userName =
    document.getElementById("guestName")
      .value.trim();

  if(!userName){
    alert(
      "Inserisci prima il tuo nome nelle presenze"
    );
    return;
  }

  await updateDoc(
   doc(db,"items",id),
   {
     booked:true,
     bookedBy:userName,
     bookedByCode:userCode
   }
  );
};

window.releaseItem = async function(id){

  await updateDoc(
   doc(db,"items",id),
   {
     booked:false,
     bookedBy:"",
     bookedByCode:""
   }
  );
};

/* ---------- SUGGERIMENTI ---------- */

function updateAlerts(food,drinks){

  const alerts =
   document.getElementById("alerts");

  let html = "";

  if(drinks < 5){

    html += `
    <div class="alert">
    ⚠️ Poche bevande prenotate.
    </div>`;
  }

  if(food < 8){

    html += `
    <div class="alert">
    ⚠️ Poco cibo prenotato.
    </div>`;
  }

  if(html === ""){

    html = `
    <div class="alert">
    ✅ Situazione equilibrata.
    </div>`;
  }

  alerts.innerHTML = html;
}

