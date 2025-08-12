// ---------- FIREBASE (v9 modular) ----------
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDoc,
  updateDoc,
  query,
  orderBy,
  serverTimestamp,
  increment,
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";

// ---------- CONFIG: REPLACE WITH YOUR FIREBASE CONFIG ----------
const firebaseConfig = {
  apiKey: "AIzaSyARgr3xiOEQ1Dznue9HTTEJR5RTLmTFQos",
  authDomain: "learning-firebase-39d50.firebaseapp.com",
  projectId: "learning-firebase-39d50",
  storageBucket: "learning-firebase-39d50.firebasestorage.app",
  messagingSenderId: "922354948167",
  appId: "1:922354948167:web:ea210e9f968e05a63eb962",
  measurementId: "G-9H2CRDES5X",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// ---------- DOM ----------
const productGrid = document.getElementById("productGrid");
const cartCounter = document.getElementById("cartCounter");
const cartOpenBtn = document.getElementById("cartOpenBtn");
const cartTableBody = document.getElementById("cartTableBody");
const userEmailEl = document.getElementById("userEmail");
const emptyNote = document.getElementById("emptyNote");
const cartEmptyNote = document.getElementById("cartEmptyNote");

const FALLBACK_IMG = "https://static.vecteezy.com/system/resources/previews/004/141/669/non_2x/no-photo-or-blank-image-icon-loading-images-or-missing-image-mark-image-not-available-or-image-coming-soon-sign-simple-nature-silhouette-in-frame-isolated-illustration-vector.jpg";

// ---------- State ----------
let currentUser = null;
let productsMap = new Map(); // productId -> productData
let cartMap = new Map(); // productId -> cartData (quantity etc.)

// Bootstrap modal instance
const cartModalEl = document.getElementById("cartModal");
const cartModal = new bootstrap.Modal(cartModalEl);

// ---------- AUTH ----------
onAuthStateChanged(auth, (user) => {
  if (!user) {
    // not signed in: redirect to login (change path as needed)
    window.location.href = "/Auth.html";
    return;
  }
  currentUser = user;
  userEmailEl.textContent = user.email || "";
  startRealtime();
});

// ---------- Realtime listeners ----------
let unsubProducts = null;
let unsubCart = null;

function startRealtime() {
  // listen to products (ordered newest first if you store createdAt)
  const productsCol = collection(db, "products");
  const productsQuery = query(productsCol, orderBy("createdAt", "desc"));

  unsubProducts = onSnapshot(
    productsQuery,
    (snap) => {
      const items = [];
      productsMap.clear();
      snap.forEach((d) => {
        const data = { id: d.id, ...d.data() };
        items.push(data);
        productsMap.set(d.id, data);
      });
      renderProducts(items);
    },
    (err) => {
      console.error("Products onSnapshot error:", err);
    }
  );

  // listen to current user's cart: users/{uid}/cart
  const cartCol = collection(db, "users", currentUser.uid, "cart");
  unsubCart = onSnapshot(
    cartCol,
    (snap) => {
      cartMap.clear();
      snap.forEach((d) => {
        cartMap.set(d.id, { id: d.id, ...d.data() });
      });
      updateCartBadge();
      renderCartTable(); // update modal table if open
    },
    (err) => {
      console.error("Cart onSnapshot error:", err);
    }
  );
}

// ---------- Render products ----------
function renderProducts(items) {
  productGrid.innerHTML = "";
  if (!items || items.length === 0) {
    emptyNote.style.display = "block";
    return;
  } else emptyNote.style.display = "none";

  items.forEach((item) => {
    const col = document.createElement("div");
    col.className = "col-sm-6 col-md-4 col-lg-3";
    col.innerHTML = `
          <div class="card card-custom h-100">
            <img src="${
              item.imageUrl || FALLBACK_IMG
            }" class="product-img" alt="${escapeHtml(item.name)}"
                 onerror="this.onerror=null;this.src='${FALLBACK_IMG}';" />
            <div class="card-body d-flex flex-column">
              <div class="mb-2">
                <div class="product-title">${escapeHtml(item.name)}</div>
                <div class="product-desc small">${escapeHtml(
                  item.desc || ""
                )}</div>
              </div>
              <div class="mt-auto d-flex justify-content-between align-items-center">
                <div class="fs-6 fw-bold">$${Number(item.price || 0).toFixed(
                  2
                )}</div>
                <button class="btn btn-sm btn-add" data-id="${
                  item.id
                }">Add to Cart</button>
              </div>
            </div>
          </div>
        `;
    productGrid.appendChild(col);
  });

  // attach add-to-cart listeners
  document.querySelectorAll(".btn-add").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const id = btn.getAttribute("data-id");
      await addToCart(id);
    });
  });
}

// ---------- Add to cart (create or increment quantity) ----------
async function addToCart(productId) {
  if (!currentUser) return alert("Please login.");

  try {
    const cartDocRef = doc(db, "users", currentUser.uid, "cart", productId);
    // If exists -> increment quantity, else create with quantity 1
    const snapshot = await getDoc(cartDocRef);
    if (snapshot.exists()) {
      // increment quantity
      await updateDoc(cartDocRef, { quantity: increment(1) });
    } else {
      // create with product copy + quantity
      const prod = productsMap.get(productId) || {};
      await setDoc(cartDocRef, {
        productId,
        name: prod.name || "",
        price: Number(prod.price || 0),
        imageUrl: prod.imageUrl || "",
        quantity: 1,
        addedAt: serverTimestamp(),
      });
    }
    // UI updates via onSnapshot listener
  } catch (err) {
    console.error("Add to cart failed", err);
    alert("Could not add to cart. See console.");
  }
}

// ---------- Update cart badge ----------
function updateCartBadge() {
  // total quantity
  let total = 0;
  cartMap.forEach((v) => {
    total += Number(v.quantity || 0);
  });
  cartCounter.textContent = total;
}

// ---------- Render cart table (modal) ----------
function renderCartTable() {
  cartTableBody.innerHTML = "";
  if (cartMap.size === 0) {
    cartEmptyNote.style.display = "block";
  } else {
    cartEmptyNote.style.display = "none";
  }

  cartMap.forEach((item, id) => {
    // item contains stored product fields
    const tr = document.createElement("tr");
    tr.innerHTML = `
          <td><img src="${
            item.imageUrl || FALLBACK_IMG
          }" class="tbl-img" onerror="this.onerror=null;this.src='${FALLBACK_IMG}';" /></td>
          <td style="min-width:200px">${escapeHtml(item.name)}</td>
          <td>$${Number(item.price || 0).toFixed(2)}</td>
          <td><button class="btn btn-sm btn-danger btn-unwish" data-id="${id}">Remove</button></td>
        `;
    cartTableBody.appendChild(tr);
  });

  // attach remove listeners
  document.querySelectorAll(".btn-unwish").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      const pid = btn.getAttribute("data-id");
      await removeFromCart(pid);
    });
  });
}

// ---------- Remove from cart ----------
async function removeFromCart(productId) {
  if (!currentUser) return;
  if (!confirm("Remove this item from your cart?")) return;
  try {
    await deleteDoc(doc(db, "users", currentUser.uid, "cart", productId));
    // UI updates via onSnapshot
  } catch (err) {
    console.error("Remove from cart failed", err);
    alert("Could not remove item. See console.");
  }
}

// ---------- Open cart modal ----------
cartOpenBtn.addEventListener("click", () => {
  renderCartTable(); // ensure up-to-date
  cartModal.show();
});

// ---------- Logout ----------
document.getElementById("logoutBtn").addEventListener("click", async () => {
  try {
    await signOut(auth);
    window.location.href = "/Auth.html";
  } catch (err) {
    console.error("Sign out failed", err);
    alert("Logout failed. Check console.");
  }
});

// ---------- Utility ----------
function escapeHtml(text = "") {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

// ---------- Cleanup ----------
window.addEventListener("beforeunload", () => {
  if (typeof unsubProducts === "function") unsubProducts();
  if (typeof unsubCart === "function") unsubCart();
});
