import { useState, useEffect } from "react";
import { getProductsByUser, listProduct, updateProduct, deleteProduct } from "../../services/productService.js";
import { uploadImageToPinata } from "../../services/uploadImgService.js";
import { useUserContext } from "../../context/UserContext.jsx";
import Notification from "../../components/common/Notification.jsx";
import { Package, Plus, Search, Edit2, Trash2, X, Image as ImageIcon, Tag } from "lucide-react";

const UNITS    = ["kg", "lb", "g", "pc", "bundle", "tray", "sack"];
const PRESETS  = ["250 g", "500 g", "1 kg", "2 kg", "5 kg", "10 kg", "1 lb", "2 lb", "5 lb", "1 pc", "1 bundle", "1 tray", "1 sack"];

const emptyVariant = () => ({ label: "", pricePerUnit: "", stock: "" });

export default function SellerProducts() {
  const [products,  setProducts]  = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [saving,    setSaving]    = useState(false);
  const { user }                  = useUserContext();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const data = await getProductsByUser(user.id);
        setProducts(data.products);
      } catch (err) { console.error(err); }
    })();
  }, [user]);

  const addNotif = (message, type) => {
    const id = Date.now();
    setNotifications(n => [...n, { id, message, type }]);
  };
  const removeNotif = (id) => setNotifications(n => n.filter(x => x.id !== id));

  // ── form ──────────────────────────────────────────────────────────────
  const blankForm = {
    id: null, name: "", category: "", imageCID: "",
    variants: [emptyVariant()],
  };
  const [form,        setForm]        = useState(blankForm);
  const [isEditing,   setIsEditing]   = useState(false);
  const [imagePreview,setImagePreview]= useState(null);
  const [searchId,    setSearchId]    = useState("");
  const [catFilter,   setCatFilter]   = useState("ALL");

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  // ── variant helpers ───────────────────────────────────────────────────
  const setVariant = (i, field, value) =>
    setForm(f => {
      const v = [...f.variants];
      v[i] = { ...v[i], [field]: value };
      return { ...f, variants: v };
    });

  const addVariant    = ()  => setForm(f => ({ ...f, variants: [...f.variants, emptyVariant()] }));
  const removeVariant = (i) => setForm(f => ({ ...f, variants: f.variants.filter((_, idx) => idx !== i) }));

  const applyPreset = (i, label) => {
    const kg = parseFloat(label);
    const price = isNaN(kg) ? "" : (kg * 5).toFixed(2);
    setForm(f => {
      const v = [...f.variants];
      v[i] = { ...v[i], label, pricePerUnit: price };
      return { ...f, variants: v };
    });
  };

  // ── validate ──────────────────────────────────────────────────────────
  const validate = () => {
    if (!form.name || !form.category) { addNotif("Fill in name and category", "error"); return false; }
    if (!form.imageCID && !isEditing)  { addNotif("Please add a product image", "error"); return false; }
    if (form.variants.length === 0)    { addNotif("Add at least one variant", "error"); return false; }
    for (const v of form.variants) {
      if (!v.label || !v.pricePerUnit || !v.stock) {
        addNotif("Fill in all variant fields", "error"); return false;
      }
    }
    return true;
  };

  // ── add ───────────────────────────────────────────────────────────────
  const handleAdd = async () => {
    if (!validate()) return;
    setSaving(true); setLoading(true);
    try {
      const cid  = await uploadImageToPinata(form.imageCID);
      const data = await listProduct({
        name:     form.name,
        category: form.category,
        imageCID: cid,
        variants: form.variants.map(v => ({
          label:        v.label,
          pricePerUnit: Number(v.pricePerUnit),
          stock:        Number(v.stock),
        })),
      });
      setProducts(data.products);
      addNotif(`"${form.name}" added!`, "success");
      resetForm();
    } catch { addNotif("Failed to add product", "error"); }
    finally { setSaving(false); setLoading(false); }
  };

  // ── edit / update ─────────────────────────────────────────────────────
  const handleEdit = (product) => {
    setIsEditing(true);
    setForm({
      id:       product.id,
      name:     product.name,
      category: product.category,
      imageCID: "",
      variants: product.variants?.length
        ? product.variants.map(v => ({
            label:        v.label        ?? "",
            pricePerUnit: v.pricePerUnit ?? "",
            stock:        v.stock        ?? "",
          }))
        : [{ label: "1 kg", pricePerUnit: product.pricePerUnit ?? "", stock: product.stock ?? "" }],
    });
    setImagePreview(`https://bronze-magnificent-constrictor-556.mypinata.cloud/ipfs/${product.imageCID}`);
  };

  const handleUpdate = async () => {
    if (!validate()) return;
    setSaving(true); setLoading(true);
    try {
      let cid = form.imageCID;
      if (cid && typeof cid === "object") cid = await uploadImageToPinata(cid);

      const data = await updateProduct({
        id:       form.id,
        name:     form.name,
        category: form.category,
        imageCID: cid,
        variants: form.variants.map(v => ({
          label:        v.label,
          pricePerUnit: Number(v.pricePerUnit),
          stock:        Number(v.stock),
        })),
      });
      setProducts(data.products);
      addNotif(`"${form.name}" updated!`, "success");
      setIsEditing(false);
      resetForm();
    } catch { addNotif("Failed to update product", "error"); }
    finally { setSaving(false); setLoading(false); }
  };

  // ── delete ────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    try {
      const data = await deleteProduct(id);
      setProducts(data.products);
      addNotif("Product deleted", "success");
      setIsEditing(false);
      resetForm();
    } catch { addNotif("Failed to delete product", "error"); }
  };

  const resetForm = () => { setForm(blankForm); setImagePreview(null); };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setForm(f => ({ ...f, imageCID: file }));
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const filtered = products.filter(p => {
    const matchSearch = searchId ? p.id === Number(searchId) : true;
    const matchCat    = catFilter === "ALL" || p.category === catFilter;
    return matchSearch && matchCat;
  });

  // ─────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-100 p-6 rounded-lg">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">My Products</h1>
        <p className="text-gray-600 mt-2">Manage your product inventory</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Products", value: products.length,                              color: "text-gray-900" },
          { label: "Total Stock",    value: products.reduce((s,p) => s + (p.variants?.reduce((a,v) => a + Number(v.stock), 0) ?? p.stock ?? 0), 0), color: "text-green-600" },
          { label: "Active",         value: products.filter(p => p.active).length,         color: "text-blue-600"  },
          { label: "Inactive",       value: products.filter(p => !p.active).length,        color: "text-gray-500"  },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <p className="text-xs text-gray-500 uppercase tracking-wide">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input type="number" placeholder="Search by Product ID..."
            value={searchId} onChange={e => setSearchId(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent" />
        </div>
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2 w-full md:w-48 focus:ring-2 focus:ring-green-500 focus:border-transparent">
          <option value="ALL">All Categories</option>
          {["Fruits","Vegetables","Grains","Dairy"].map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* ── Form ── */}
      <div className="bg-white shadow-sm rounded-lg p-6 mb-6 border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          {isEditing
            ? <><Edit2 size={20} className="text-green-600" /> Edit Product</>
            : <><Plus size={20} className="text-blue-600" /> Add New Product</>}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <input name="name" value={form.name} onChange={handleChange} placeholder="Product name"
            className="border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-green-500" />
          <select name="category" value={form.category} onChange={handleChange}
            className="border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-green-500">
            <option value="">Select Category</option>
            {["Fruits","Vegetables","Grains","Dairy"].map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Image */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <ImageIcon size={16} /> Product Image
          </label>
          <input type="file" accept="image/*" onChange={handleImageChange}
            className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-green-500 cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100" />
          {imagePreview && (
            <img src={imagePreview} alt="Preview"
              className="mt-3 h-40 w-40 rounded-lg object-cover border-2 border-gray-200" />
          )}
        </div>

        {/* ── Variants ── */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Tag size={15} className="text-green-600" /> Variants (weight / size)
            </label>
            <button onClick={addVariant}
              className="flex items-center gap-1 text-xs text-green-600 font-semibold hover:text-green-700 border border-green-300 rounded-lg px-3 py-1.5 hover:bg-green-50 transition-colors">
              <Plus size={12} /> Add Variant
            </button>
          </div>

          {/* Header row */}
          <div className="hidden md:grid grid-cols-12 gap-2 text-xs text-gray-400 font-semibold uppercase tracking-wide mb-1 px-1">
            <div className="col-span-4">Label</div>
            <div className="col-span-3">Price (AGT)</div>
            <div className="col-span-3">Stock</div>
            <div className="col-span-2" />
          </div>

          <div className="space-y-2">
            {form.variants.map((v, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-center bg-gray-50 rounded-lg p-2 border border-gray-200">
                {/* Label with preset dropdown */}
                <div className="col-span-12 md:col-span-4 flex gap-1">
                  <input value={v.label} onChange={e => setVariant(i, "label", e.target.value)}
                    placeholder="e.g. 1 kg"
                    className="flex-1 min-w-0 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                  <select onChange={e => e.target.value && applyPreset(i, e.target.value)} value=""
                    className="border border-gray-300 rounded-lg px-1 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                    title="Quick presets">
                    <option value="">Presets</option>
                    {PRESETS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>

                {/* Price */}
                <div className="col-span-5 md:col-span-3 relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">AGT</span>
                  <input type="number" value={v.pricePerUnit} onChange={e => setVariant(i, "pricePerUnit", e.target.value)}
                    placeholder="0.00" min="0" step="0.01"
                    className="w-full border border-gray-300 rounded-lg pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>

                {/* Stock */}
                <div className="col-span-5 md:col-span-3">
                  <input type="number" value={v.stock} onChange={e => setVariant(i, "stock", e.target.value)}
                    placeholder="Stock" min="0"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>

                {/* Remove */}
                <div className="col-span-2 flex justify-center">
                  {form.variants.length > 1 && (
                    <button onClick={() => removeVariant(i)}
                      className="text-red-400 hover:text-red-600 transition-colors p-1.5 rounded-lg hover:bg-red-50">
                      <X size={15} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          {!isEditing ? (
            <button onClick={handleAdd} disabled={loading}
              className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors font-medium flex items-center justify-center gap-2">
              <Plus size={18} />
              {saving ? "Adding..." : "Add Product"}
            </button>
          ) : (
            <>
              <button onClick={handleUpdate} disabled={loading}
                className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors font-medium flex items-center justify-center gap-2">
                <Edit2 size={18} />
                {saving ? "Updating..." : "Update Product"}
              </button>
              <button onClick={() => { setIsEditing(false); resetForm(); }} disabled={loading}
                className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors font-medium flex items-center justify-center gap-2">
                <X size={18} /> Cancel
              </button>
            </>
          )}
        </div>
      </div>

      {/* Product Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center border border-gray-200">
          <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
          <p className="text-gray-500">
            {searchId || catFilter !== "ALL" ? "Try adjusting your filters" : "Start by adding your first product"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filtered.map(p => (
            <SellerProductCard key={p.id} product={p} onEdit={handleEdit} onDelete={handleDelete} />
          ))}
        </div>
      )}

      {notifications.map(n => (
        <Notification key={n.id} message={n.message} type={n.type} onClose={() => removeNotif(n.id)} />
      ))}
    </div>
  );
}

// ── Seller Product Card ───────────────────────────────────────────────────────
function SellerProductCard({ product, onEdit, onDelete }) {
  const [imgError, setImgError] = useState(false);
  const [selVariant, setSelVariant] = useState(0);

  const variants = product.variants?.length
    ? product.variants
    : [{ label: "default", pricePerUnit: product.pricePerUnit, stock: product.stock }];

  const v = variants[selVariant] ?? variants[0];

  return (
    <div className="group bg-white rounded-lg border-2 border-gray-200 hover:border-green-500 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col h-full">
      {/* Image */}
      <div className="relative w-full aspect-square bg-gray-100 overflow-hidden">
        <img
          src={imgError || !product.imageCID
            ? "https://via.placeholder.com/400x400?text=No+Image"
            : `https://bronze-magnificent-constrictor-556.mypinata.cloud/ipfs/${product.imageCID}`}
          alt={product.name}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
        />
        {!product.active && (
          <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
            INACTIVE
          </div>
        )}
        <div className="absolute top-2 left-2 bg-green-600 text-white text-xs px-2 py-1 rounded-full font-semibold">
          ID: {product.id}
        </div>
        {variants.length > 1 && (
          <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">
            {variants.length} variants
          </div>
        )}
      </div>

      <div className="flex flex-col flex-1 p-4">
        <h3 className="font-bold text-base text-gray-900 mb-0.5 line-clamp-1">{product.name}</h3>
        <p className="text-xs text-gray-400 mb-3">{product.category}</p>

        {/* Variant selector */}
        {variants.length > 1 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {variants.map((vr, i) => (
              <button key={i} onClick={() => setSelVariant(i)}
                className={`text-[11px] px-2 py-1 rounded-full border transition-all font-semibold
                  ${selVariant === i
                    ? "bg-green-600 text-white border-green-600"
                    : "bg-gray-50 text-gray-600 border-gray-200 hover:border-green-400"}`}>
                {vr.label}
              </button>
            ))}
          </div>
        )}

        {/* Price + stock for selected variant */}
        <p className="text-xl font-bold text-green-600 mb-1">
          {Number(v.pricePerUnit).toFixed(2)} <span className="text-xs font-semibold text-green-500">AGT</span>
        </p>
        <div className="flex items-center gap-2 mb-3">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full
            ${Number(v.stock) === 0 ? "bg-red-100 text-red-600" : Number(v.stock) <= 10 ? "bg-orange-100 text-orange-600" : "bg-green-100 text-green-700"}`}>
            {Number(v.stock) === 0 ? "Out of stock" : `${v.stock} left`}
          </span>
          <span className="text-xs text-gray-400">{v.label}</span>
        </div>

        <div className="mt-auto pt-3 border-t border-gray-200 flex items-center gap-4">
          <button onClick={() => onEdit(product)}
            className="flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors">
            <Edit2 size={15} /> Edit
          </button>
          <button onClick={() => onDelete(product.id)}
            className="flex items-center gap-1 text-red-500 hover:text-red-600 font-medium text-sm transition-colors">
            <Trash2 size={15} /> Delete
          </button>
        </div>
      </div>
    </div>
  );
}