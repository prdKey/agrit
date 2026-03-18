import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppKit, useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import { BrowserProvider } from "ethers";
import { useUserContext } from "../context/UserContext.jsx";
import { getNonce, verifySignature } from "../services/authService.js";
import { getPangasinanCities, getBarangaysByCity } from "../services/addressService.js";
import { ensureSFuel } from "../services/sFuelService.js";

export default function Register() {
  const { login } = useUserContext();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [cities, setCities] = useState([]);
  const [barangays, setBarangays] = useState([]);

  const [formData, setFormData] = useState({
    firstName: "", lastName: "", email: "", phone: "",
    gender: "", dob: "", houseNumber: "", street: "",
    barangay: "", city: "", postalCode: "",
  });

  // @reown/appkit hooks
  const { open } = useAppKit();
  const { address, isConnected } = useAppKitAccount();
  const { walletProvider } = useAppKitProvider("eip155");

  // Auto-trigger signing after wallet connects
  const [pendingSubmit, setPendingSubmit] = useState(false);

  useEffect(() => {
    if (isConnected && address && walletProvider && pendingSubmit) {
      handleSign(address, walletProvider);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, address, walletProvider, pendingSubmit]);

  useEffect(() => {
    const loadCities = async () => {
      try {
        const res = await getPangasinanCities();
        setCities(res.data.sort((a, b) => a.name.localeCompare(b.name)));
      } catch (err) { console.error("Failed to load cities:", err); }
    };
    loadCities();
  }, []);

  useEffect(() => {
    const loadBarangays = async () => {
      if (!formData.city) return;
      const selectedCity = cities.find(c => c.name === formData.city);
      if (!selectedCity) return;
      try {
        const res = await getBarangaysByCity(selectedCity.code);
        setBarangays(res.data.sort((a, b) => a.name.localeCompare(b.name)));
      } catch (err) { console.error("Failed to load barangays:", err); }
    };
    loadBarangays();
  }, [formData.city, cities]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "city") {
      setFormData(prev => ({ ...prev, city: value, barangay: "" }));
      return;
    }
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSign = async (walletAddress, provider) => {
    try {
      const nonce = await getNonce(
        walletAddress,
        formData.firstName, formData.lastName, formData.email,
        formData.phone, formData.gender, formData.dob,
        formData.houseNumber, formData.street, formData.barangay,
        formData.city, formData.postalCode
      );

      const ethersProvider = new BrowserProvider(provider);
      const signer = await ethersProvider.getSigner();
      const messageToSign = `Sign this message to authenticate: ${nonce}`;
      const signature = await signer.signMessage(messageToSign);

      const user = await verifySignature(walletAddress, signature);
      login(user);
      ensureSFuel(walletAddress);
      alert("Registration successful!");
      navigate("/");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
      setPendingSubmit(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!isConnected) {
        // Opens AppKit modal — works on desktop AND mobile
        setPendingSubmit(true);
        await open();
        // handleSign will fire via useEffect once wallet connects
      } else {
        // Already connected, just sign
        await handleSign(address, walletProvider);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to open wallet modal");
      setLoading(false);
      setPendingSubmit(false);
    }
  };

  const isFormComplete = Object.values(formData).every(v => v.trim() !== "");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div onClick={() => navigate("/")} className="absolute inset-0 bg-black/50" />
      <div className="relative z-50 bg-white shadow-xl rounded-lg w-full max-w-md max-h-[80vh] p-6">
        <div className="flex flex-col justify-center items-center mb-4">
          <img src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg" alt="Wallet" className="h-16 w-16" />
          <h1 className="text-2xl font-bold mb-2 text-center">Welcome</h1>
          <p className="text-gray-500 text-center">Register your wallet to continue.</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="overflow-y-auto max-h-[40vh] p-2 space-y-3 scroll">
            <InputField label="First Name"        name="firstName"   value={formData.firstName}   onChange={handleChange} />
            <InputField label="Last Name"         name="lastName"    value={formData.lastName}    onChange={handleChange} />
            <InputField label="Email"             name="email"       type="email" value={formData.email} onChange={handleChange} />
            <InputField label="Phone Number"      name="phone"       type="tel"   value={formData.phone} onChange={handleChange} pattern="^(09\d{9}|\+639\d{9})$" />
            <SelectField label="Gender"           name="gender"      value={formData.gender}      onChange={handleChange} options={["Male","Female","Other"]} />
            <InputField label="Date of Birth"     name="dob"         type="date"  value={formData.dob}   onChange={handleChange} />
            <InputField label="House/Unit Number" name="houseNumber" value={formData.houseNumber} onChange={handleChange} />
            <InputField label="Street"            name="street"      value={formData.street}      onChange={handleChange} />
            <div>
              <label className="block font-medium mb-1">City / Municipality</label>
              <select name="city" value={formData.city} onChange={handleChange}
                className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-green-400" required>
                <option value="">Select City / Municipality</option>
                {cities.map(city => <option key={city.code} value={city.name}>{city.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block font-medium mb-1">Barangay</label>
              <select name="barangay" value={formData.barangay} onChange={handleChange}
                className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-green-400"
                required disabled={!formData.city}>
                <option value="">Select Barangay</option>
                {barangays.map(b => <option key={b.code} value={b.name}>{b.name}</option>)}
              </select>
            </div>
            <InputField label="Postal Code" name="postalCode" value={formData.postalCode} onChange={handleChange} />
          </div>
          <div className="flex flex-col justify-center mt-5">
            <button
              type="submit"
              disabled={!isFormComplete || loading}
              className={`w-full p-2 rounded-lg text-white transition ${
                isFormComplete && !loading ? "bg-green-500 hover:bg-green-600" : "bg-gray-400 cursor-not-allowed"
              }`}
            >
              {loading ? "Processing..." : "Register"}
            </button>

            {isConnected && address && (
              <p className="text-xs text-gray-400 text-center mt-2">
                Connected: {address.slice(0, 6)}...{address.slice(-4)}
              </p>
            )}

            <p onClick={() => navigate("/login")}
              className="text-xs text-gray-400 font-light text-center m-2 hover:underline hover:text-green-600 cursor-pointer">
              Already have an account? Connect your wallet
            </p>
            <p className="text-xs text-gray-400 mt-2 text-center">
              By continuing, you agree to our Terms & Conditions
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

function InputField({ label, name, type = "text", value, onChange, pattern }) {
  return (
    <div>
      <label className="block text-gray-700 font-medium mb-1">{label}</label>
      <input type={type} name={name} value={value} onChange={onChange} pattern={pattern}
        className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-green-400"
        required />
    </div>
  );
}

function SelectField({ label, name, value, onChange, options }) {
  return (
    <div>
      <label className="block text-gray-700 font-medium mb-1">{label}</label>
      <select name={name} value={value} onChange={onChange}
        className="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-green-400"
        required>
        <option value="">Select {label}</option>
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    </div>
  );
}