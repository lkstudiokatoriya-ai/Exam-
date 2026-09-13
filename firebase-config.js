/**
 * Pariksha — shared Firebase setup
 * Loaded (via <script>) on every page, after the firebase-*-compat.js CDN scripts.
 */

const firebaseConfig = {
  apiKey: "AIzaSyDuT-QLNYwNCJqO-yeqykSOMpYC9EXh9HM",
  authDomain: "happy-birthday-5af75.firebaseapp.com",
  projectId: "happy-birthday-5af75",
  storageBucket: "happy-birthday-5af75.firebasestorage.app",
  messagingSenderId: "588106788176",
  appId: "1:588106788176:web:ec456b515e79ec07651055",
  measurementId: "G-QCJP47K90B"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();

// This UID is always treated as an admin, even before its user document
// exists. Change this if you want a different account to be the bootstrap
// admin — see README.md for how additional admins can be added later.
const ADMIN_UID = "6q5xbuTAMTU3tItqBvYD8eOUDk12";

/**
 * Makes sure a /users/{uid} document exists for the signed-in user and
 * returns their role ('admin' | 'student').
 */
async function ensureUserDoc(user) {
  const ref = db.collection("users").doc(user.uid);
  const snap = await ref.get();

  if (snap.exists) {
    return snap.data().role || "student";
  }

  const role = user.uid === ADMIN_UID ? "admin" : "student";
  await ref.set({
    name: user.displayName || (user.email ? user.email.split("@")[0] : "Student"),
    email: user.email,
    role,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });
  return role;
}

/**
 * Guards a page: redirects to the login page if nobody is signed in,
 * otherwise resolves the user's role and calls onReady(user, role).
 */
function requireAuth(onReady) {
  auth.onAuthStateChanged(async (user) => {
    if (!user) {
      window.location.href = "index.html";
      return;
    }
    try {
      const role = await ensureUserDoc(user);
      onReady(user, role);
    } catch (err) {
      console.error("Failed to load account:", err);
      alert("Could not load your account. Please refresh the page.");
    }
  });
}

function logout() {
  auth.signOut().then(() => {
    window.location.href = "index.html";
  });
}

/** Small helper used across pages to show a friendly Firebase error. */
function friendlyAuthError(err) {
  const map = {
    "auth/invalid-email": "That email address doesn't look right.",
    "auth/user-not-found": "No account found with that email.",
    "auth/wrong-password": "Incorrect password.",
    "auth/invalid-credential": "Incorrect email or password.",
    "auth/email-already-in-use": "An account already exists with that email.",
    "auth/weak-password": "Password should be at least 6 characters.",
    "auth/too-many-requests": "Too many attempts. Please wait a moment and try again."
  };
  return map[err.code] || err.message || "Something went wrong. Please try again.";
}
