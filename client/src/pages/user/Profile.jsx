import { useState, useEffect } from 'react';
import { useUserContext } from "../../context/UserContext.jsx";
import { getProfile, updateProfile } from "../../services/userService.js";
import { uploadImageToPinata } from "../../services/uploadImgService.js";
import { User, Mail, Phone, Calendar, MapPin, Wallet, Camera, Edit2, X, Save, Loader2 } from "lucide-react";

const PINATA_GATEWAY = "https://bronze-magnificent-constrictor-556.mypinata.cloud/ipfs/";

const BLANK = {
  walletAddress: "",
  firstName:     "",
  middleName:    "",
  lastName:      "",
  email:         "",
  mobileNumber:  "",
  gender:        "",
  dateOfBirth:   "",
  address: { houseNumber: "", street: "", barangay: "", city: "", postalCode: "" },
  profileImage:  null,
};

export default function Profile() {
  const { setUser } = useUserContext();

  const [form, setForm]                     = useState(BLANK);
  const [backup, setBackup]                 = useState(BLANK);
  const [isEditing, setIsEditing]           = useState(false);
  const [imagePreview, setImagePreview]     = useState(null);
  const [uploading, setUploading]           = useState(false);
  const [saving, setSaving]                 = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [role, setRole]                     = useState("");

  // ── Fetch profile on mount ────────────────────────────────────────────────
  useEffect(() => {
    const fetch = async () => {
      try {
        setLoadingProfile(true);
        const u = await getProfile();
        const populated = {
          walletAddress: u.walletAddress || "",
          firstName:     u.firstName     || "",
          middleName:    u.middleName    || "",
          lastName:      u.lastName      || "",
          email:         u.email         || "",
          mobileNumber:  u.mobileNumber  || "",
          gender:        u.gender        || "",
          dateOfBirth:   u.dob           || "",
          address: u.address || { houseNumber: "", street: "", barangay: "", city: "", postalCode: "" },
          profileImage:  u.profileImage  || null,
        };
        setForm(populated);
        setBackup(populated);
        setRole(u.role || "");
        if (setUser) setUser(u);
      } catch (err) {
        console.error("[Profile] fetch failed:", err);
      } finally {
        setLoadingProfile(false);
      }
    };
    fetch();
  }, []);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, address: { ...prev.address, [name]: value } }));
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImagePreview(URL.createObjectURL(file));
    try {
      setUploading(true);
      const cid = await uploadImageToPinata(file);
      setForm(prev => ({ ...prev, profileImage: cid }));
    } catch {
      alert("Failed to upload image to IPFS. Please try again.");
      setImagePreview(null);
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = () => {
    setBackup({ ...form });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setForm({ ...backup });
    setImagePreview(null);
    setIsEditing(false);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const updated = await updateProfile(form);
      if (setUser) setUser(updated);
      setBackup({ ...form });
      setIsEditing(false);
      setImagePreview(null);
    } catch (err) {
      alert(err.response?.data?.error || "Failed to save profile.");
    } finally {
      setSaving(false);
    }
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const formatAddress = ({ houseNumber, street, barangay, city, postalCode } = {}) =>
    `#${houseNumber} ${street}, ${barangay}, ${city}, ${postalCode}`;

  const resolveImage = () => {
    if (imagePreview) return imagePreview;
    const img = form.profileImage;
    if (!img) return "https://upload.wikimedia.org/wikipedia/commons/7/7c/User_icon_2.svg";
    if (img.startsWith("http")) return img;
    return `${PINATA_GATEWAY}${img}`;
  };

  const inputClass = (editable) =>
    `w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent ${
      !editable ? "bg-gray-100 cursor-not-allowed text-gray-600" : ""
    }`;

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loadingProfile) return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-100 p-6 rounded-lg">

      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-600 mt-2">Manage your account information</p>
        </div>
        {!isEditing ? (
          <button onClick={handleEdit}
            className="px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center gap-2">
            <Edit2 size={18} /> Edit Profile
          </button>
        ) : (
          <div className="flex gap-3">
            <button onClick={handleSave} disabled={saving || uploading}
              className="px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center gap-2 disabled:opacity-60">
              {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              {saving ? "Saving..." : "Save Changes"}
            </button>
            <button onClick={handleCancel} disabled={saving}
              className="px-5 py-2.5 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium flex items-center gap-2 disabled:opacity-60">
              <X size={18} /> Cancel
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left Column ─────────────────────────────────────────────────── */}
        <div className="lg:col-span-1 space-y-6">

          {/* Profile Picture */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Camera size={20} className="text-green-600" /> Profile Picture
            </h2>
            <div className="flex flex-col items-center">
              <div className="relative">
                <img src={resolveImage()} alt="Profile"
                  className="h-32 w-32 rounded-full border-4 border-green-500 object-cover shadow-lg"
                  onError={e => { e.target.src = "https://upload.wikimedia.org/wikipedia/commons/7/7c/User_icon_2.svg"; }} />
                {isEditing && (
                  <label className={`absolute bottom-0 right-0 p-2 rounded-full cursor-pointer shadow-lg transition-colors ${
                    uploading ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"
                  }`}>
                    {uploading
                      ? <Loader2 size={18} className="text-white animate-spin" />
                      : <Camera size={18} className="text-white" />}
                    <input type="file" accept="image/*" onChange={handleImageChange}
                      disabled={uploading} className="hidden" />
                  </label>
                )}
              </div>
              <h3 className="mt-4 text-xl font-bold text-gray-900">{form.firstName} {form.lastName}</h3>
              <p className="text-sm text-gray-500">{role}</p>
              {isEditing && (
                <p className="text-xs text-gray-400 text-center mt-3">
                  {uploading ? "Uploading to IPFS..." : "Click the camera icon to upload a new photo"}
                </p>
              )}
            </div>
          </div>

          {/* Wallet */}
          <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Wallet size={20} className="text-green-600" /> Blockchain Wallet
            </h2>
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <p className="text-xs text-gray-500 mb-2">Wallet Address</p>
              <p className="font-mono text-sm text-gray-900 break-all">{form.walletAddress}</p>
            </div>
            <p className="text-xs text-gray-500 mt-3 flex items-start gap-2">
              <span className="text-yellow-600">⚠️</span>
              <span>Your wallet address cannot be changed. It's permanently linked to your account.</span>
            </p>
          </div>
        </div>

        {/* ── Right Column ────────────────────────────────────────────────── */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <User size={20} className="text-blue-600" /> Personal Information
            </h2>

            <div className="space-y-6">

              {/* Name */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { label: "First Name",  name: "firstName"  },
                  { label: "Middle Name", name: "middleName" },
                  { label: "Last Name",   name: "lastName"   },
                ].map(f => (
                  <div key={f.name}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{f.label}</label>
                    <input type="text" name={f.name} value={form[f.name]} disabled={!isEditing}
                      onChange={handleChange} className={inputClass(isEditing)} />
                  </div>
                ))}
              </div>

              {/* Contact */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Mail size={16} /> Email Address
                  </label>
                  <input type="email" name="email" value={form.email} disabled={!isEditing}
                    onChange={handleChange} className={inputClass(isEditing)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Phone size={16} /> Mobile Number
                  </label>
                  <input type="tel" name="mobileNumber" value={form.mobileNumber} disabled={!isEditing}
                    onChange={handleChange} placeholder="09XXXXXXXXX" className={inputClass(isEditing)} />
                </div>
              </div>

              {/* DOB + Gender */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Calendar size={16} /> Date of Birth
                  </label>
                  <input type="date" name="dateOfBirth" value={form.dateOfBirth} disabled={!isEditing}
                    onChange={handleChange} className={inputClass(isEditing)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                  <div className="flex items-center gap-6 pt-2">
                    {["Male", "Female", "Other"].map(g => (
                      <label key={g} className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="gender" value={g} disabled={!isEditing}
                          checked={form.gender === g} onChange={handleChange}
                          className="w-4 h-4 accent-green-600 disabled:cursor-not-allowed" />
                        <span className={`text-sm ${!isEditing ? "text-gray-600" : "text-gray-900"}`}>{g}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Address */}
              <div className="pt-6 border-t border-gray-200">
                <h3 className="text-md font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <MapPin size={18} className="text-purple-600" /> Address Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { label: "House Number", name: "houseNumber" },
                    { label: "Street",       name: "street"      },
                    { label: "Barangay",     name: "barangay"    },
                    { label: "City",         name: "city"        },
                    { label: "Postal Code",  name: "postalCode"  },
                  ].map(f => (
                    <div key={f.name}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{f.label}</label>
                      <input type="text" name={f.name} value={form.address?.[f.name] || ""} disabled={!isEditing}
                        onChange={handleAddressChange} className={inputClass(isEditing)} />
                    </div>
                  ))}
                </div>

                {!isEditing && form.address && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-sm font-medium text-gray-700 mb-1">Complete Address:</p>
                    <p className="text-sm text-gray-600">{formatAddress(form.address)}</p>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}