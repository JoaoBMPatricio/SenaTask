
import { auth, db } from "./firebase.js";

console.log("Firebase inicializado!");
console.log("Auth disponível:", Boolean(auth));
console.log("Firestore disponível:", Boolean(db));
