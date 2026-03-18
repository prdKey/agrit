const AddressTab = () => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <h2 className="text-lg font-semibold mb-4">Shipping Address</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input type="text" placeholder="Street Address" className="input" />
        <input type="text" placeholder="City" className="input" />
        <input type="text" placeholder="Province / State" className="input" />
        <input type="text" placeholder="Postal Code" className="input" />
        <input type="text" placeholder="Country" className="input" />
      </div>

      <button className="mt-6 bg-green-600 text-white px-6 py-2 rounded">
        Save Address
      </button>
    </div>
  );
};

export default AddressTab;
