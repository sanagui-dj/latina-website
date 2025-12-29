// scripts/notificaciones.js
import { db } from './init.js';
import { collection, query, orderBy, limit, onSnapshot } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const q = query(collection(db, "avisos_vivos"), orderBy("fecha", "desc"), limit(1));

onSnapshot(q, (snapshot) => {
  snapshot.docChanges().forEach((change) => {
    if (change.type === "added") {
      const data = change.doc.data();
      // Aquí puedes personalizar cómo se ve (un alert, un div que aparece, etc.)
      console.log("AVISO LATINA:", data.mensaje);
      // alert("LATINA LIVE: " + data.mensaje);
    }
  });
});