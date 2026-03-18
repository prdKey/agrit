import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getPangasinanCities,
  getBarangaysByCity,
  getAddressById,
  createAddress,
  updateAddress,
} from "../../services/addressService.js";
import {
  MapPin, Home, Briefcase, ChevronLeft, Loader2,
  CheckCircle, User, Phone, Hash, Navigation
} from "lucide-react";


const LABELS = ["Home", "Work", "Other"];
const LABEL_ICONS = { Home, Work: Briefcase, Other: MapPin };

const EMPTY = {
  name: "", phone: "", label: "Home",
  houseNumber: "", street: "", barangay: "", city: "", zipCode: "",
  isDefault: false,
};

// ── Standalone so React doesn't remount on every keystroke ───────────────────
const Field = ({ label, error, children }) => (
  <div>
    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">{label}</label>
    {children}
    {error && <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><span>⚠</span>{error}</p>}
  </div>
);

const inputClass = (field, errors) =>
  `w-full border ${errors[field] ? "border-red-400 bg-red-50" : "border-gray-200"} rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all`;

export default function AddressFormPage() {
  const navigate  = useNavigate();
  const { id }    = useParams(); // present = edit mode
  const isEdit    = Boolean(id);

  const [form, setForm]         = useState(EMPTY);
  const [cities, setCities]     = useState([]);
  const [barangays, setBarangays] = useState([]);
  const [loading, setLoading]   = useState(isEdit);
  const [saving, setSaving]     = useState(false);
  const [errors, setErrors]     = useState({});

  /* Load cities */
  useEffect(() => {
    getPangasinanCities()
      .then(res => setCities(res.data.sort((a, b) => a.name.localeCompare(b.name))))
      .catch(console.error);
  }, []);

  /* Load barangays when city changes */
  useEffect(() => {
    if (!form.city) return setBarangays([]);
    const city = cities.find(c => c.name === form.city);
    if (!city) return;
    getBarangaysByCity(city.code)
      .then(res => setBarangays(res.data.sort((a, b) => a.name.localeCompare(b.name))))
      .catch(console.error);
  }, [form.city, cities]);

  /* Load existing address if editing */
  useEffect(() => {
    if (!isEdit) return;
    getAddressById(id)
      .then(res => {
        const a = res.address;
        setForm({
          name: a.name || "", phone: a.phone || "", label: a.label || "Home",
          houseNumber: a.houseNumber || "", street: a.street || "",
          barangay: a.barangay || "", city: a.city || "",
          zipCode: a.zipCode || "", isDefault: a.isDefault || false,
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const set = (field, val) => {
    setForm(p => ({ ...p, [field]: val }));
    setErrors(p => ({ ...p, [field]: "" }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim())        e.name        = "Recipient name is required";
    if (!form.phone.trim())       e.phone       = "Phone number is required";
    if (!form.houseNumber.trim()) e.houseNumber = "House / unit number is required";
    if (!form.city)               e.city        = "City is required";
    if (!form.barangay)           e.barangay    = "Barangay is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      if (isEdit) {
        await updateAddress(id, form);
      } else {
        await createAddress(form);
      }
      navigate("/user/address");
    } catch (e) {
      console.error(e);
      setErrors({ general: e.response?.data?.error || "Failed to save address." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate("/user/address")}
            className="p-2 rounded-xl hover:bg-white transition-colors border border-gray-200">
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{isEdit ? "Edit Address" : "New Address"}</h1>
            <p className="text-sm text-gray-400">{isEdit ? "Update your delivery address" : "Add a new delivery address"}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

          {/* Label selector */}
          <div className="p-6 border-b border-gray-50">
            <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-3">Address Type</p>
            <div className="flex gap-2">
              {LABELS.map(lbl => {
                const Icon = LABEL_ICONS[lbl];
                const active = form.label === lbl;
                return (
                  <button
                    key={lbl}
                    onClick={() => set("label", lbl)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${
                      active ? "border-green-500 bg-green-50 text-green-700" : "border-gray-200 text-gray-500 hover:border-gray-300"
                    }`}
                  >
                    <Icon className="w-4 h-4" /> {lbl}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form fields */}
          <div className="p-6 space-y-4">

            {/* General error */}
            {errors.general && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 flex items-center gap-2">
                <span>⚠</span> {errors.general}
              </div>
            )}

            {/* Recipient */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Recipient Name" error={errors.name}>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                  <input
                    value={form.name}
                    onChange={e => set("name", e.target.value)}
                    placeholder="Full name"
                    className={`${inputClass("name", errors)} pl-9`}
                  />
                </div>
              </Field>
              <Field label="Phone Number" error={errors.phone}>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                  <input
                    value={form.phone}
                    onChange={e => set("phone", e.target.value)}
                    placeholder="+63 9XX XXX XXXX"
                    className={`${inputClass("phone", errors)} pl-9`}
                  />
                </div>
              </Field>
            </div>

            {/* House + Street */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="House / Unit No." error={errors.houseNumber}>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                  <input
                    value={form.houseNumber}
                    onChange={e => set("houseNumber", e.target.value)}
                    placeholder="e.g. 123 or Unit 4B"
                    className={`${inputClass("houseNumber", errors)} pl-9`}
                  />
                </div>
              </Field>
              <Field label="Street (optional)">
                <div className="relative">
                  <Navigation className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                  <input
                    value={form.street}
                    onChange={e => set("street", e.target.value)}
                    placeholder="Street name"
                    className={`${inputClass("street", errors)} pl-9`}
                  />
                </div>
              </Field>
            </div>

            {/* City */}
            <Field label="City / Municipality" error={errors.city}>
              <select
                value={form.city}
                onChange={e => { set("city", e.target.value); set("barangay", ""); }}
                className={inputClass("city", errors)}
              >
                <option value="">Select city...</option>
                {cities.map(c => <option key={c.code} value={c.name}>{c.name}</option>)}
              </select>
            </Field>

            {/* Barangay */}
            <Field label="Barangay" error={errors.barangay}>
              <select
                value={form.barangay}
                onChange={e => set("barangay", e.target.value)}
                disabled={!form.city}
                className={`${inputClass("barangay", errors)} disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <option value="">Select barangay...</option>
                {barangays.map(b => <option key={b.code} value={b.name}>{b.name}</option>)}
              </select>
            </Field>

            {/* Zip */}
            <Field label="ZIP Code (optional)">
              <input
                value={form.zipCode}
                onChange={e => set("zipCode", e.target.value)}
                placeholder="e.g. 2400"
                className={inputClass("zipCode", errors)}
              />
            </Field>

            {/* Set as default toggle */}
            <label className="flex items-center gap-3 cursor-pointer group pt-1">
              <div className="relative" onClick={() => set("isDefault", !form.isDefault)}>
                <div className={`w-10 h-5 rounded-full transition-colors ${form.isDefault ? "bg-green-600" : "bg-gray-200"}`} />
                <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isDefault ? "translate-x-5" : "translate-x-0"}`} />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800 group-hover:text-green-600 transition-colors">Set as default address</p>
                <p className="text-xs text-gray-400">Used automatically at checkout</p>
              </div>
              {form.isDefault && <CheckCircle className="w-4 h-4 text-green-500 ml-auto" />}
            </label>
          </div>

          {/* Footer actions */}
          <div className="px-6 pb-6 flex gap-3">
            <button
              onClick={() => navigate("/user/address")}
              className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-3 bg-green-600 text-white rounded-xl font-semibold text-sm hover:bg-green-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              {saving ? "Saving..." : isEdit ? "Save Changes" : "Add Address"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}