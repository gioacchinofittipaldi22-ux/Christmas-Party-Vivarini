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

Il giorno lun 16 nov 2026 alle ore 12:41 gioacchino fittipaldi <gioacchinofittipaldi22@gmail.com> ha scritto:
:root{
  --green:#1E5631;
  --red:#B22222;
  --gold:#D4AF37;
  --bg:#FFF8F0;
  --card:#ffffff;
}

*{
  box-sizing:border-box;
}

body{
  margin:0;
  font-family:Arial,Helvetica,sans-serif;
  background:var(--bg);
  color:#333;
}

.hero{
  text-align:center;
  background:linear-gradient(135deg,var(--green),var(--red));
  color:white;
  padding:30px 20px;
}

.hero h1{
  margin:0 0 10px;
}

.welcome{
  max-width:700px;
  margin:auto;
}

.container{
  max-width:1000px;
  margin:auto;
  padding:20px;
}

.card{
  background:var(--card);
  border-radius:16px;
  margin-bottom:20px;
  padding:20px;
  box-shadow:0 4px 12px rgba(0,0,0,.08);
}

.card h2{
  margin-top:0;
  color:var(--green);
}

input,
select{
  width:100%;
  padding:12px;
  margin-bottom:10px;
  border:1px solid #ddd;
  border-radius:10px;
}

button{
  border:none;
  border-radius:10px;
  padding:12px 16px;
  cursor:pointer;
  font-weight:600;
}

#saveAttendance{
  background:var(--green);
  color:white;
  width:100%;
}

.filters{
  display:flex;
  gap:10px;
  flex-wrap:wrap;
}

.filter-btn{
  background:#ececec;
}

.filter-btn.active{
  background:var(--green);
  color:white;
}

.item-card{
  border:1px solid #ececec;
  border-radius:12px;
  padding:14px;
  margin-bottom:12px;
}

.item-top{
  display:flex;
  justify-content:space-between;
  align-items:center;
  gap:15px;
}

.item-category{
  color:#777;
  font-size:14px;
  margin-top:4px;
}

.item-owner{
  margin-top:10px;
  color:var(--red);
  font-weight:bold;
}

.book-btn{
  background:var(--green);
  color:white;
}

.release-btn{
  background:#888;
  color:white;
}

.alert{
  padding:12px;
  border-radius:10px;
  background:#fff5db;
  border-left:5px solid #ffb000;
  margin-bottom:10px;
}

.recovery{
  margin-top:15px;
  padding:10px;
  background:#f3f3f3;
  border-radius:10px;
}

.stats-grid{
  display:grid;
  grid-template-columns:repeat(3,1fr);
  gap:10px;
}

.stat{
  background:#f7f7f7;
  border-radius:10px;
  padding:12px;
  text-align:center;
}

.stat-number{
  font-size:24px;
  font-weight:bold;
}

@media(max-width:600px){

  .item-top{
    flex-direction:column;
    align-items:flex-start;
  }

  .stats-grid{
    grid-template-columns:1fr;
  }

}

Il giorno lun 16 nov 2026 alle ore 12:40 gioacchino fittipaldi <gioacchinofittipaldi22@gmail.com> ha scritto:
<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">

<title>Christmas Party Vivarini</title>

<link rel="stylesheet" href="style.css">

</head>

<body>

<header class="hero">
    <h1>🎄 Christmas Party Vivarini</h1>

    <p>
        11 dicembre 2026 • ore 20:30
    </p>

    <p>
        📍 Via Privata Vivarini 5
    </p>

    <p class="welcome">
        Porta quello che puoi e che ti fa piacere condividere.
        Organizziamoci per evitare doppioni.
    </p>
</header>

<main class="container">

<section class="card">

<h2>👥 Presenze</h2>

<input
id="guestName"
type="text"
placeholder="Nome e cognome">

<input
id="adults"
type="number"
min="1"
value="1">

<input
id="children"
type="number"
min="0"
value="0">

<button id="saveAttendance">
Conferma presenza
</button>

<div class="recovery">
Il tuo codice personale:
<span id="userCode">non ancora generato</span>
</div>

</section>

<section class="card">

<h2>📊 Totali</h2>

<div id="stats">

Adulti: 0

<br>

Bambini: 0

<br>

Totale: 0

</div>

</section>

<section class="card">

<h2>🔎 Filtri</h2>

<div class="filters">

<button class="filter-btn" data-filter="all">
Tutte
</button>

<button class="filter-btn" data-filter="free">
Solo libere
</button>

<button class="filter-btn" data-filter="booked">
Già prenotate
</button>

</div>

<input
id="searchText"
type="text"
placeholder="Cerca invitato">

</section>

<section class="card">

<h2>🍽️ Cosa portiamo</h2>

<div id="itemsContainer">

Caricamento elementi...

</div>

</section>

<section class="card">

<h2>📢 Suggerimenti</h2>

<div id="alerts">

Nessun avviso.

</div>

</section>

</main>

<script type="module" src="./app.js"></script>

</body>
</html>
