import { getApps, getApp, initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut, sendPasswordResetEmail }
  from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDxQFnaTxPGvnyAH3YKeHvUIP24I2e422o",
  authDomain: "bayas-88ec5.firebaseapp.com",
  databaseURL: "https://bayas-88ec5-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "bayas-88ec5",
  appId: "1:484097821045:web:4682957645816860472b3c"
};
const auth = getAuth(getApps().length ? getApp() : initializeApp(firebaseConfig));

const MSG = {
  "auth/invalid-credential": "Correo o contraseña incorrectos.",
  "auth/invalid-email": "El correo no es válido.",
  "auth/missing-password": "Escribe la contraseña.",
  "auth/user-disabled": "Esta cuenta está desactivada.",
  "auth/too-many-requests": "Demasiados intentos. Espera unos minutos y vuelve a probar.",
  "auth/network-request-failed": "Sin conexión con el servidor."
};

const css = document.createElement("style");
css.textContent = `
#login{position:fixed;inset:0;z-index:100;background:#12141a;display:flex;align-items:center;justify-content:center;padding:16px}
#login form{background:#1b1f29;border:1px solid #2a2f3c;border-radius:14px;padding:24px;width:min(360px,100%);display:flex;flex-direction:column;gap:10px;color:#e8e8ee;font-family:system-ui,sans-serif}
#login h2{margin:0 0 4px;font-size:1.2rem}
#login input,#login button{background:#12141a;color:inherit;border:1px solid #2a2f3c;border-radius:8px;padding:9px 12px;font:inherit}
#login button.main{background:#2a4a8a;border-color:#3d6ac0;cursor:pointer;font-weight:600}
#login button.link{background:none;border:none;color:#6aa8ff;cursor:pointer;padding:0;text-align:left;font-size:.85rem}
#login .err{color:#f07a7a;font-size:.85rem;min-height:1.2em}
#login .ok{color:#6fd68a;font-size:.85rem}
#logout{position:fixed;right:12px;bottom:12px;z-index:20;background:#1b1f29;color:#9aa0b0;border:1px solid #2a2f3c;border-radius:8px;padding:5px 10px;font:inherit;font-size:.8rem;cursor:pointer}
#logout:hover{color:#e8e8ee;border-color:#6aa8ff}
`;
document.head.append(css);

const box = document.createElement("div");
box.id = "login"; box.hidden = true;
box.innerHTML = `<form>
  <h2>Acceso</h2>
  <input id="l-mail" type="email" placeholder="Correo" autocomplete="username" required>
  <input id="l-pass" type="password" placeholder="Contraseña" autocomplete="current-password" required>
  <div class="err" id="l-msg"></div>
  <button class="main" type="submit">Entrar</button>
  <button class="link" type="button" id="l-reset">¿Has olvidado la contraseña?</button>
</form>`;
document.body.append(box);

const out = document.createElement("button");
out.id = "logout"; out.hidden = true;
document.body.append(out);

const $ = id => document.getElementById(id);
const show = (t, ok) => { const m = $("l-msg"); m.textContent = t; m.className = ok ? "ok" : "err"; };

box.querySelector("form").addEventListener("submit", async e => {
  e.preventDefault(); show("");
  try { await signInWithEmailAndPassword(auth, $("l-mail").value.trim(), $("l-pass").value); }
  catch (err) { show(MSG[err.code] || "No se pudo iniciar sesión (" + err.code + ")."); }
});
$("l-reset").onclick = async () => {
  const mail = $("l-mail").value.trim();
  if (!mail) { show("Escribe tu correo arriba y vuelve a pulsar."); return; }
  try { await sendPasswordResetEmail(auth, mail); show("Si el correo existe, te hemos enviado un enlace.", true); }
  catch (err) { show(MSG[err.code] || "No se pudo enviar el correo."); }
};
out.onclick = () => signOut(auth);

let resolved = false;
export const authReady = new Promise(resolve => {
  onAuthStateChanged(auth, user => {
    if (user) {
      box.hidden = true;
      out.textContent = "Cerrar sesión (" + (user.email || "") + ")"; out.hidden = false;
      if (!resolved) { resolved = true; resolve(user); }
    } else if (resolved) {
      location.reload();
    } else {
      out.hidden = true; box.hidden = false;
    }
  });
});
