import { useState } from "react";
import api, { errorMessage } from "../api/client.js";
import { useToast } from "./Toast.jsx";

/** Inline stock control: enter N, optionally a note, then press - or +. */
export default function AdjustStock({ product, onUpdated }) {
  const [amount, setAmount] = useState("1");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const { push } = useToast();

  const apply = async (sign) => {
    const n = Number(amount);
    if (!Number.isInteger(n) || n < 1) return push("Enter a whole number of 1 or more.", "error");
    setBusy(true);
    try {
      const { data } = await api.patch(`/products/${product.id}/adjust-stock`, {
        delta: sign * n,
        note: note.trim() || null,
      });
      onUpdated(data);
      setNote("");
      push(`${product.name}: ${sign > 0 ? "added" : "removed"} ${n}. Now ${data.quantity_on_hand} on hand.`);
    } catch (err) {
      push(errorMessage(err), "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-1.5">
      <button className="btn-secondary btn-sm" disabled={busy} onClick={() => apply(-1)} aria-label={`Remove ${amount} from ${product.name}`}>−</button>
      <input
        type="number"
        min="1"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="input w-16 py-1 text-center"
        aria-label={`Amount to adjust for ${product.name}`}
      />
      <button className="btn-secondary btn-sm" disabled={busy} onClick={() => apply(1)} aria-label={`Add ${amount} to ${product.name}`}>+</button>
      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Note (optional)"
        maxLength={500}
        className="input w-36 py-1 text-xs"
        aria-label={`Note for ${product.name}`}
      />
    </div>
  );
}