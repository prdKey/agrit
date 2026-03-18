

export default function MetricCard({title, value, icon: Icon, color}) {
  return (
    <div className="bg-white p-4 rounded-lg shadow flex items-center justify-between">
        <div>
        <h3 className="text-gray-500 text-sm">{title}</h3>
        <h2 className="text-2xl font-bold">{value}</h2>
        </div>
        <div className={`p-4 rounded-full ${color} text-white`}>
            {Icon && <Icon className="w-6 h-6" />}
        </div>
    </div>
  )
}
