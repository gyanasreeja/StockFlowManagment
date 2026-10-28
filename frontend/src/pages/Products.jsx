import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api, { errorMessage } from "../api/client.js";
import Spinner from "../components/Spinner.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import AdjustStock from "../components/AdjustStock.jsx";
import { useToast } from "../components/Toast.jsx";

const money = (v) => (v == null ? "—" : `$${Number(v).toFixed(2)}`);

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const { push } = useToast();

  useEffect(() => {
    const t = setTimeout(() => setQuery(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .get("/products", { params: query ? { search: query } : {} })
      .then((r) => !cancelled && setProducts(r.data))
      .catch((e) => !cancelled && push(errorMessage(e), "error"))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [query, push]);

  const replace = (updated) => setProducts((list) => list.map((p) => (p.id === updated.id ? updated : p)));

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/products/${toDelete.id}`);
      setProducts((list) => list.filter((p) => p.id !== toDelete.id));
      push(`Deleted ${toDelete.name}.`);
      setToDelete(null);
    } catch (e) {
      push(errorMessage(e), "error");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Products</h1>
        <Link to="/products/new" className="btn-primary">Add product</Link>
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by name or SKU"
        className="input max-w-sm"
        aria-label="Search products"
      />

      <div className="card overflow-x-auto">
        {loading ? (
          <Spinner />
        ) : products.length === 0 ? (
          <div className="px-4 py-12 text-center text-sm text-slate-500">
            {query ? (
              <>No products match “{query}”.</>
            ) : (
              <>You haven't added any products yet. <Link to="/products/new" className="font-medium text-moss-700 hover:underline">Add your first product</Link>.</>
            )}
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50"><tr>
              <th className="th">Name</th><th className="th">SKU</th>
              <th className="th text-right">Quantity</th><th className="th">Stock status</th>
              <th className="th text-right">Selling price</th><th className="th">Adjust stock</th><th className="th" />
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((p) => (
                <tr key={p.id}>
                  <td className="td font-medium">{p.name}</td>
                  <td className="td text-slate-600">{p.sku}</td>
                  <td className="td text-right tabular-nums">{p.quantity_on_hand}</td>
                  <td className="td">
                    {p.is_low_stock ? (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">Low stock</span>
                    ) : (
                      <span className="text-xs text-slate-400">In stock</span>
                    )}
                  </td>
                  <td className="td text-right tabular-nums">{money(p.selling_price)}</td>
                  <td className="td"><AdjustStock product={p} onUpdated={replace} /></td>
                  <td className="td whitespace-nowrap text-right">
                    <Link to={`/products/${p.id}/edit`} className="btn-secondary btn-sm mr-1.5">Edit</Link>
                    <button className="btn-secondary btn-sm text-red-700" onClick={() => setToDelete(p)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <ConfirmDialog
        open={!!toDelete}
        title="Delete product?"
        message={toDelete ? `“${toDelete.name}” (${toDelete.sku}) will be permanently deleted. This can't be undone.` : ""}
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}