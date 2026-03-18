import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getAddresses as fetchAddresses,
  setDefaultAddress,
  deleteAddress as removeAddress,
} from "../../services/addressService.js";
import {
  MapPin, Plus, Home, Briefcase, MoreVertical, CheckCircle,
  Pencil, Trash2, Star, Loader2, AlertCircle, X
} from "lucide-react";


const LABEL_ICON = { Home: Home, Work: Briefcase, Other: MapPin };
const LABEL_COLOR = {
  Home:  "bg-blue-100 text-blue-700",
  Work:  "bg-purple-100 text-purple-700",
  Other: "bg-gray-100 text-gray-600",
};

export default function AddressesPage() {
  const navigate   = useNavigate();
  const [addresses, setAddresses]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [defaultingId, setDefaultingId] = useState(null);
  const [menuId, setMenuId]         = useState(null); // which card has menu open
  const [confirmDelete, setConfirmDelete] = useState(null); // address to confirm delete

  const fetch = async () => {
    try {
      setLoading(true);
      const data = await fetchAddresses();
      setAddresses(data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  const handleSetDefault = async (id) => {
    setMenuId(null);
    setDefaultingId(id);
    try {
      await setDefaultAddress(id);
      await fetch();
    } catch (e) { console.error(e); }
    finally { setDefaultingId(null); }
  };

  const handleDelete = async (id) => {
    setConfirmDelete(null);
    setDeletingId(id);
    try {
      await removeAddress(id);
      await fetch();
    } catch (e) { console.error(e); }
    finally { setDeletingId(null); }
  };

  const fmtAddr = (a) =>
    [a.houseNumber, a.street, a.barangay, a.city, a.zipCode]
      .filter(Boolean).join(", ");

  if (loading) return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* Delete confirm modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={() => setConfirmDelete(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6"
            onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 text-center mb-1">Delete Address?</h3>
            <p className="text-sm text-gray-500 text-center mb-5">
              "<span className="font-medium text-gray-700">{confirmDelete.name}</span>" at {confirmDelete.barangay}, {confirmDelete.city} will be removed.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={() => handleDelete(confirmDelete.id)}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Addresses</h1>
          <p className="text-gray-500 mt-1">{addresses.length} saved address{addresses.length !== 1 ? "es" : ""}</p>
        </div>
        <button
          onClick={() => navigate("/address/new")}
          className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add Address
        </button>
      </div>

      {/* Empty */}
      {addresses.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-8 h-8 text-gray-300" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">No addresses yet</h3>
          <p className="text-gray-400 text-sm mb-5">Add a delivery address to use at checkout</p>
          <button
            onClick={() => navigate("/address/new")}
            className="px-5 py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors"
          >
            Add Your First Address
          </button>
        </div>
      )}

      {/* Address cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {addresses.map(addr => {
          const LabelIcon = LABEL_ICON[addr.label] || MapPin;
          const isDeleting   = deletingId === addr.id;
          const isDefaulting = defaultingId === addr.id;

          return (
            <div key={addr.id}
              className={`bg-white rounded-2xl border-2 transition-all shadow-sm relative ${addr.isDefault ? "border-green-500" : "border-gray-100 hover:border-gray-200"}`}
              onClick={() => setMenuId(null)}
            >
              {/* Default badge */}
              {addr.isDefault && (
                <div className="absolute -top-3 left-4 flex items-center gap-1 bg-green-600 text-white text-xs font-bold px-3 py-0.5 rounded-full shadow">
                  <CheckCircle className="w-3 h-3" /> Default
                </div>
              )}

              <div className="p-5">
                {/* Top row */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <LabelIcon className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-sm leading-tight">{addr.name}</p>
                      <p className="text-xs text-gray-400">{addr.phone}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${LABEL_COLOR[addr.label] || LABEL_COLOR.Other}`}>
                      {addr.label}
                    </span>

                    {/* Kebab menu */}
                    <div className="relative">
                      <button
                        onClick={e => { e.stopPropagation(); setMenuId(menuId === addr.id ? null : addr.id); }}
                        className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <MoreVertical className="w-4 h-4 text-gray-400" />
                      </button>

                      {menuId === addr.id && (
                        <div className="absolute right-0 top-8 bg-white border border-gray-100 rounded-xl shadow-xl z-10 w-44 py-1 overflow-hidden"
                          onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => navigate(`/address/edit/${addr.id}`)}
                            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            <Pencil className="w-3.5 h-3.5 text-gray-400" /> Edit Address
                          </button>
                          {!addr.isDefault && (
                            <button
                              onClick={() => handleSetDefault(addr.id)}
                              disabled={isDefaulting}
                              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-green-700 hover:bg-green-50 disabled:opacity-50"
                            >
                              {isDefaulting
                                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                : <Star className="w-3.5 h-3.5" />
                              } Set as Default
                            </button>
                          )}
                          <div className="h-px bg-gray-100 my-1" />
                          <button
                            onClick={() => { setMenuId(null); setConfirmDelete(addr); }}
                            disabled={isDeleting}
                            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                          >
                            {isDeleting
                              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              : <Trash2 className="w-3.5 h-3.5" />
                            } Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Address text */}
                <p className="text-sm text-gray-700 leading-relaxed">{fmtAddr(addr)}</p>
              </div>

              {/* Quick actions bottom bar */}
              <div className="border-t border-gray-50 px-5 py-2.5 flex gap-3">
                <button
                  onClick={() => navigate(`/address/edit/${addr.id}`)}
                  className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-green-600 transition-colors font-medium"
                >
                  <Pencil className="w-3 h-3" /> Edit
                </button>
                {!addr.isDefault && (
                  <button
                    onClick={() => handleSetDefault(addr.id)}
                    disabled={isDefaulting}
                    className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-green-600 transition-colors font-medium disabled:opacity-50"
                  >
                    <Star className="w-3 h-3" /> Set Default
                  </button>
                )}
                <button
                  onClick={() => setConfirmDelete(addr)}
                  className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-500 transition-colors font-medium ml-auto"
                >
                  <Trash2 className="w-3 h-3" /> Remove
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}