const DashboardCard = ({ title, value, description, icon, bg }) => {
  return (
    <div className={`p-5 rounded-xl shadow-md ${bg} text-white`}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm uppercase opacity-80">{title}</h3>
          <p className="text-3xl font-bold mt-1">{value}</p>
        </div>
        <div className="text-4xl opacity-90">
          {icon}
        </div>
      </div>
      <p className="text-sm mt-3 opacity-90">{description}</p>
    </div>
  );
};

export default DashboardCard;
