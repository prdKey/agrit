const RecentCard = ({ title, items }) => {
  return (
    <div className="bg-white rounded-xl shadow-md p-5">
      <h2 className="text-lg font-semibold mb-4">{title}</h2>

      {items.length === 0 ? (
        <p className="text-gray-500 text-sm">No recent activity</p>
      ) : (
        <ul className="divide-y">
          {items.map((item, index) => (
            <li key={index} className="py-3 flex justify-between items-center">
              <div>
                <p className="font-medium">{item.label}</p>
                <p className="text-sm text-gray-500">{item.date}</p>
              </div>
              <span className="text-sm font-semibold text-green-600">
                {item.status}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default RecentCard;
