import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  doc,
  deleteDoc,
  updateDoc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
import {
  getAuth,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";

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

// ------------- DOM refs -------------
const productForm = document.getElementById("productForm");
const goDashboard = document.getElementById("goDashboard");
const nameEl = document.getElementById("name");
const descEl = document.getElementById("desc");
const priceEl = document.getElementById("price");
const imageUrlEl = document.getElementById("imageUrl");
const editIdEl = document.getElementById("editId");
const formTitle = document.getElementById("formTitle");
const btnSave = document.getElementById("btnSave");
const btnCancelEdit = document.getElementById("btnCancelEdit");
const productList = document.getElementById("productList");
const productTableBody = document.getElementById("productTableBody");
const msgBox = document.getElementById("msgBox");
const successBox = document.getElementById("successBox");
const btnLogout = document.getElementById("btnLogout");

const productsCol = collection(db, "products");

// ------------- Helpers -------------
function showError(msg) {
  msgBox.textContent = msg;
  msgBox.style.display = "block";
  setTimeout(() => (msgBox.style.display = "none"), 4000);
}
function showSuccess(msg) {
  successBox.textContent = msg;
  successBox.style.display = "block";
  setTimeout(() => (successBox.style.display = "none"), 3000);
}
function clearForm() {
  nameEl.value = "";
  descEl.value = "";
  priceEl.value = "";
  imageUrlEl.value = "";
  editIdEl.value = "";
  formTitle.textContent = "Add Product";
  btnSave.textContent = "Add Product";
  btnCancelEdit.style.display = "none";
}
goDashboard.addEventListener('click',() => {
    window.location.href = './index.html'
})

// Fallback image handler string for inline event:
const FALLBACK_IMG = "https://static.vecteezy.com/system/resources/previews/004/141/669/non_2x/no-photo-or-blank-image-icon-loading-images-or-missing-image-mark-image-not-available-or-image-coming-soon-sign-simple-nature-silhouette-in-frame-isolated-illustration-vector.jpg";

// ------------- Add / Update product -------------
productForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = nameEl.value.trim();
  const desc = descEl.value.trim();
  const price = parseFloat(priceEl.value || 0);
  const imageUrl = imageUrlEl.value.trim() || "";

  if (!name || price <= 0) {
    showError("Please provide valid name and price (> 0).");
    return;
  }

  const editId = editIdEl.value;
  
  try {
    if (editId) {
      // update
      const docRef = doc(db, "products", editId);
      await updateDoc(docRef, { name, desc, price, imageUrl });
      showSuccess("Product updated.");
    } else {
      // add new
      await addDoc(productsCol, {
        name,
        desc,
        price,
        imageUrl,
        createdAt: new Date(),
      });
      showSuccess("Product added.");
    }
    clearForm();
  } catch (err) {
    console.error(err);
    showError("Failed to save product. Check console.");
  }
});

// Cancel edit button
btnCancelEdit.addEventListener("click", () => {
  clearForm();
});

// ------------- Real-time listener -------------
onSnapshot(
  productsCol,
  (snapshot) => {
    const docs = [];
    snapshot.forEach((docSnap) => {
      docs.push({ id: docSnap.id, ...docSnap.data() });
    });
    renderProducts(docs);
    renderTable(docs);
  },
  (err) => {
    console.error("onSnapshot error", err);
    showError("Could not load products in realtime.");
  }
);

// ------------- Render grid cards -------------
function renderProducts(items) {
  productList.innerHTML = "";
  if (items.length === 0) {
    productList.innerHTML = `<div class="col-12"><div class="alert alert-info">No products yet.</div></div>`;
    return;
  }

  items.forEach((item) => {
    const col = document.createElement("div");
    col.className = "col-md-6 col-lg-4 mb-4";

    col.innerHTML = `
        <div class="card h-100 shadow-sm">
          <img src="${
            item.imageUrl || FALLBACK_IMG
          }" class="card-img-top" alt="${escapeHtml(
      item.name
    )}" onerror="this.onerror=null;this.src='${FALLBACK_IMG}';" />
          <div class="card-body d-flex flex-column">
            <h5 class="card-title">${escapeHtml(item.name)}</h5>
            <p class="card-text text-truncate">${escapeHtml(
              item.desc || ""
            )}</p>
            <div class="mt-auto d-flex justify-content-between align-items-center">
              <div class="fs-5 fw-bold">$${Number(item.price).toFixed(2)}</div>
              <div class="btn-group">
                <button class="btn btn-sm btn-outline-primary" onclick="startEdit('${
                  item.id
                }')">Edit</button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteProduct('${
                  item.id
                }')">Delete</button>
              </div>
            </div>
          </div>
        </div>
      `;
    productList.appendChild(col);
  });
}

// ------------- Render table view -------------
function renderTable(items) {
  productTableBody.innerHTML = "";
  items.forEach((p) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
        <td><img src="${
          p.imageUrl || FALLBACK_IMG
        }" class="table-img" onerror="this.onerror=null;this.src='${FALLBACK_IMG}';" /></td>
        <td>${escapeHtml(p.name)}</td>
        <td style="max-width:320px; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(
          p.desc || ""
        )}</td>
        <td>$${Number(p.price).toFixed(2)}</td>
        <td>
          <button class="btn btn-sm btn-primary me-1" onclick="startEdit('${
            p.id
          }')">Edit</button>
          <button class="btn btn-sm btn-danger" onclick="deleteProduct('${
            p.id
          }')">Delete</button>
        </td>
      `;
    productTableBody.appendChild(tr);
  });
}

// ------------- Edit / Delete functions -------------
window.startEdit = async function (id) {
  try {
    const dref = doc(db, "products", id);
    const snap = await getDoc(dref);
    if (!snap.exists()) {
      showError("Product not found.");
      return;
    }
    const data = snap.data();
    editIdEl.value = id;
    nameEl.value = data.name || "";
    descEl.value = data.desc || "";
    priceEl.value = data.price || "";
    imageUrlEl.value = data.imageUrl || "";
    formTitle.textContent = "Edit Product";
    btnSave.textContent = "Update Product";
    btnCancelEdit.style.display = "inline-block";
    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch (err) {
    console.error(err);
    showError("Unable to start edit.");
  }
};

window.deleteProduct = async function (id) {
  if (!confirm("Delete this product?")) return;
  try {
    await deleteDoc(doc(db, "products", id));
    showSuccess("Product deleted.");
  } catch (err) {
    console.error(err);
    showError("Delete failed.");
  }
};

// ------------- Auth & Logout (optional) -------------
btnLogout.addEventListener("click", async () => {
  try {
    await signOut(auth);
    alert("Signed out");
    window.location.href = "/Auth.html";
  } catch (err) {
    console.error(err);
    showError("Logout failed.");
  }
});

// Optional: enforce admin-only access by checking email
onAuthStateChanged(auth, (user) => {  if (user) {
    // Example admin check (replace with your admin email or role logic)
    const ADMIN_EMAIL = "muddasir@example.com";
    if (user.email !== ADMIN_EMAIL) {
      alert("You are not an admin. Redirecting...");
      window.location.href = "/index.html";
    }
  } else {
    window.location.href = '/Auth.html';
  }
});

// ------------- small utilities -------------
function escapeHtml(text = "") {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
