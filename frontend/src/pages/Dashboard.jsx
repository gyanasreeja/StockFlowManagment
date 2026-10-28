import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { errorMessage } from "../api/client.js";
import Spinner from "../components/Spinner.jsx";

function StatCard({ label, value }) {
  return (
    <div className="card px-5 py-4">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="mt-1 text-3xl font-semibold tabular-nums">{value.toLocaleString()}</div>
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/dashboard").then((r) => setData(r.data)).catch((e) => setError(errorMessage(e)));
  }, []);

  if (error) return <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>;
  if (!data) return <Spinner />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard label="Total products" value={data.total_products} />
        <StatCard label="Total quantity on hand" value={data.total_quantity_on_hand} />
      </div>

      <section className="card overflow-hidden">
        <div className="border-b border-slate-200 px-4 py-3">
          <h2 className="font-semibold">Low stock items</h2>
        </div>
        {data.low_stock_items.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-slate-500">
            {data.total_products === 0 ? (
              <>No products yet. <Link to="/products/new" className="font-medium text-moss-700 hover:underline">Add your first product</Link>.</>
            ) : (
              "Nothing is running low. Every product is above its threshold."
            )}
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50"><tr>
              <th className="th">Name</th><th className="th">SKU</th>
              <th className="th text-right">Quantity on hand</th><th className="th text-right">Low stock threshold</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {data.low_stock_items.map((i) => (
                <tr key={i.sku}>
                  <td className="td font-medium">{i.name}</td>
                  <td className="td text-slate-600">{i.sku}</td>
                  <td className="td text-right tabular-nums text-red-700">{i.quantity_on_hand}</td>
                  <td className="td text-right tabular-nums">{i.low_stock_threshold}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}