import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import api, { errorMessage } from "../api/client.js";
import Spinner from "../components/Spinner.jsx";
import { useToast } from "../components/Toast.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function Settings() {
  const { refreshUser } = useAuth();
  const { push } = useToast();
  const [loading, setLoading] = useState(true);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({ defaultValues: { default_low_stock_threshold: "5" } });

  useEffect(() => {
    api
      .get("/settings")
      .then((r) => reset({ default_low_stock_threshold: String(r.data.default_low_stock_threshold) }))
      .catch((e) => push(errorMessage(e), "error"))
      .finally(() => setLoading(false));
  }, [reset, push]);

  const onSubmit = async (v) => {
    try {
      await api.put("/settings", { default_low_stock_threshold: Number(v.default_low_stock_threshold) });
      await refreshUser();
      push("Settings saved.");
    } catch (e) {
      push(errorMessage(e), "error");
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="max-w-lg space-y-5">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="card space-y-4 p-6" noValidate>
        <div>
          <label className="label" htmlFor="threshold">Default low stock threshold</label>
          <input id="threshold" type="number" min="0" className="input" {...register("default_low_stock_threshold", { required: "Enter a threshold", validate: (v) => /^\d+$/.test(String(v)) || "Enter a whole number of 0 or more" })} />
          <p className="mt-1 text-xs text-slate-500">Products with no threshold of their own are flagged as low stock when their quantity is at or below this number.</p>
          {errors.default_low_stock_threshold && <p className="field-error">{errors.default_low_stock_threshold.message}</p>}
        </div>
        <div className="flex justify-end">
          <button className="btn-primary" disabled={isSubmitting}>{isSubmitting ? "Saving…" : "Save settings"}</button>
        </div>
      </form>
    </div>
  );
}