export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <div className="grid md:grid-cols-3 gap-6">
        <div className="p-4 bg-white rounded shadow-sm">
          <div className="text-xs text-gray-500">Rugs (sample)</div>
          <div className="text-2xl font-semibold">—</div>
        </div>
        <div className="p-4 bg-white rounded shadow-sm">
          <div className="text-xs text-gray-500">Reviews Pending</div>
          <div className="text-2xl font-semibold">—</div>
        </div>
        <div className="p-4 bg-white rounded shadow-sm">
          <div className="text-xs text-gray-500">Trade-In Requests</div>
          <div className="text-2xl font-semibold">—</div>
        </div>
      </div>
      <p className="text-sm text-gray-600">More analytics & quick actions will appear here.</p>
    </div>
  );
}

