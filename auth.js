import { getApps, getApp, initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut, sendPasswordResetEmail,
  updatePassword, reauthenticateWithCredential, EmailAuthProvider }
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
  "auth/wrong-password": "La contraseña actual no es correcta.",
  "auth/invalid-email": "El correo no es válido.",
  "auth/missing-password": "Escribe la contraseña.",
  "auth/weak-password": "La contraseña nueva es demasiado débil (mínimo 6 caracteres).",
  "auth/requires-recent-login": "Por seguridad, cierra sesión, vuelve a entrar e inténtalo de nuevo.",
  "auth/user-disabled": "Esta cuenta está desactivada.",
  "auth/too-many-requests": "Demasiados intentos. Espera unos minutos y vuelve a probar.",
  "auth/network-request-failed": "Sin conexión con el servidor."
};

const css = document.createElement("style");
css.textContent = `
#login,#pw{position:fixed;inset:0;z-index:100;display:flex;align-items:center;justify-content:center;padding:16px}
#login{background:#12141a}
#pw{background:#000a}
#login[hidden],#pw[hidden]{display:none}
#login form,#pw form{background:#1b1f29;border:1px solid #2a2f3c;border-radius:14px;padding:24px;width:min(360px,100%);display:flex;flex-direction:column;gap:10px;color:#e8e8ee;font-family:system-ui,sans-serif}
#login h2,#pw h2{margin:0 0 4px;font-size:1.2rem}
#login input,#login button,#pw input,#pw button{background:#12141a;color:inherit;border:1px solid #2a2f3c;border-radius:8px;padding:9px 12px;font:inherit}
#login button.main,#pw button.main{background:#2a4a8a;border-color:#3d6ac0;cursor:pointer;font-weight:600}
#login button.link,#pw button.link{background:none;border:none;color:#6aa8ff;cursor:pointer;padding:0;text-align:left;font-size:.85rem}
#login .err,#pw .err{color:#f07a7a;font-size:.85rem;min-height:1.2em}
#login .ok,#pw .ok{color:#6fd68a;font-size:.85rem;min-height:1.2em}
#acct{position:fixed;right:12px;bottom:12px;z-index:20;display:flex;gap:6px}
#acct button{background:#1b1f29;color:#9aa0b0;border:1px solid #2a2f3c;border-radius:8px;padding:5px 10px;font:inherit;font-size:.8rem;cursor:pointer}
#acct button:hover{color:#e8e8ee;border-color:#6aa8ff}
`;
document.head.append(css);

const login = document.createElement("div");
login.id = "login"; login.hidden = true;
login.innerHTML = `<form>
  <h2>Acceso</h2>
  <input id="l-mail" type="email" placeholder="Correo" autocomplete="username" required>
  <input id="l-pass" type="password" placeholder="Contraseña" autocomplete="current-password" required>
  <div class="err" id="l-msg"></div>
  <button class="main" type="submit">Entrar</button>
  <button class="link" type="button" id="l-reset">¿Has olvidado la contraseña?</button>
</form>`;
document.body.append(login);

const pw = document.createElement("div");
pw.id = "pw"; pw.hidden = true;
pw.innerHTML = `<form>
  <h2>Cambiar contraseña</h2>
  <input id="p-old" type="password" placeholder="Contraseña actual" autocomplete="current-password" required>
  <input id="p-new" type="password" placeholder="Contraseña nueva (mín. 6 caracteres)" autocomplete="new-password" required minlength="6">
  <input id="p-new2" type="password" placeholder="Repite la contraseña nueva" autocomplete="new-password" required minlength="6">
  <div id="p-msg" class="err"></div>
  <button class="main" type="submit">Guardar</button>
  <button class="link" type="button" id="p-cancel">Cancelar</button>
</form>`;
document.body.append(pw);

const acct = document.createElement("div");
acct.id = "acct"; acct.hidden = true;
acct.innerHTML = '<button id="a-pass">Cambiar contraseña</button><button id="a-out"></button>';
document.body.append(acct);

const $ = id => document.getElementById(id);
const show = (id, t, ok) => { const m = $(id); m.textContent = t; m.className = ok ? "ok" : "err"; };

login.querySelector("form").addEventListener("submit", async e => {
  e.preventDefault(); show("l-msg", "");
  try { await signInWithEmailAndPassword(auth, $("l-mail").value.trim(), $("l-pass").value); }
  catch (err) { show("l-msg", MSG[err.code] || "No se pudo iniciar sesión (" + err.code + ")."); }
});
$("l-reset").onclick = async () => {
  const mail = $("l-mail").value.trim();
  if (!mail) { show("l-msg", "Escribe tu correo arriba y vuelve a pulsar."); return; }
  try { await sendPasswordResetEmail(auth, mail); show("l-msg", "Si el correo existe, te hemos enviado un enlace.", true); }
  catch (err) { show("l-msg", MSG[err.code] || "No se pudo enviar el correo."); }
};

$("a-out").onclick = () => signOut(auth);
$("a-pass").onclick = () => {
  pw.querySelector("form").reset(); show("p-msg", ""); pw.hidden = false; $("p-old").focus();
};
$("p-cancel").onclick = () => { pw.hidden = true; };
pw.addEventListener("click", e => { if (e.target === pw) pw.hidden = true; });
pw.querySelector("form").addEventListener("submit", async e => {
  e.preventDefault(); show("p-msg", "");
  const user = auth.currentUser;
  if (!user) return;
  if ($("p-new").value !== $("p-new2").value) { show("p-msg", "Las contraseñas nuevas no coinciden."); return; }
  if ($("p-new").value === $("p-old").value) { show("p-msg", "La nueva contraseña debe ser distinta de la actual."); return; }
  try {
    await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, $("p-old").value));
    await updatePassword(user, $("p-new").value);
    show("p-msg", "Contraseña cambiada correctamente.", true);
    setTimeout(() => { pw.hidden = true; }, 1500);
  } catch (err) {
    show("p-msg", MSG[err.code] || "No se pudo cambiar la contraseña (" + err.code + ").");
  }
});

let resolved = false;
export const authReady = new Promise(resolve => {
  onAuthStateChanged(auth, user => {
    if (user) {
      login.hidden = true;
      $("a-out").textContent = "Cerrar sesión (" + (user.email || "") + ")";
      $("a-out").title = "UID: " + user.uid;
      acct.hidden = false;
      if (!resolved) { resolved = true; resolve(user); }
    } else if (resolved) {
      location.reload();
    } else {
      acct.hidden = true; login.hidden = false;
    }
  });
});
