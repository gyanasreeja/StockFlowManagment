import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import api, { errorMessage, fieldErrors } from "../api/client.js";
import Spinner from "../components/Spinner.jsx";
import { useToast } from "../components/Toast.jsx";

const EMPTY = { name: "", sku: "", description: "", quantity_on_hand: "0", cost_price: "", selling_price: "", low_stock_threshold: "" };
const optionalNumber = (v) => (v === "" || v == null ? null : Number(v));
const optionalPrice = { validate: (v) => v === "" || (Number(v) >= 0 && /^\d+(\.\d{1,2})?$/.test(String(v))) || "Enter an amount of 0 or more, up to 2 decimals" };

function Field({ name, label, hint, error, children }) {
  return (
    <div>
      <label className="label" htmlFor={name}>{label}</label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
      {error && <p className="field-error">{error.message}</p>}
    </div>
  );
}

export default function ProductForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { push } = useToast();
  const [loading, setLoading] = useState(isEdit);
  const [serverError, setServerError] = useState("");
  const { register, handleSubmit, reset, setError, formState: { errors, isSubmitting } } = useForm({ defaultValues: EMPTY });

  useEffect(() => {
    if (!isEdit) return;
    api
      .get(`/products/${id}`)
      .then(({ data: p }) =>
        reset({
          name: p.name,
          sku: p.sku,
          description: p.description ?? "",
          quantity_on_hand: String(p.quantity_on_hand),
          cost_price: p.cost_price ?? "",
          selling_price: p.selling_price ?? "",
          low_stock_threshold: p.low_stock_threshold ?? "",
        })
      )
      .catch((e) => {
        push(errorMessage(e), "error");
        navigate("/products", { replace: true });
      })
      .finally(() => setLoading(false));
  }, [id, isEdit, reset, navigate, push]);

  const onSubmit = async (v) => {
    setServerError("");
    const body = {
      name: v.name.trim(),
      sku: v.sku.trim(),
      description: v.description.trim() || null,
      quantity_on_hand: Number(v.quantity_on_hand),
      cost_price: optionalNumber(v.cost_price),
      selling_price: optionalNumber(v.selling_price),
      low_stock_threshold: optionalNumber(v.low_stock_threshold),
    };
    try {
      if (isEdit) await api.put(`/products/${id}`, body);
      else await api.post("/products", body);
      push(isEdit ? "Product saved." : "Product created.");
      navigate("/products");
    } catch (err) {
      if (err.response?.status === 409) setError("sku", { message: errorMessage(err) });
      else {
        Object.entries(fieldErrors(err)).forEach(([f, message]) => setError(f, { message }));
        setServerError(errorMessage(err));
      }
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <Link to="/products" className="text-sm text-moss-700 hover:underline">Back to products</Link>
        <h1 className="mt-1 text-2xl font-semibold">{isEdit ? "Edit product" : "Add product"}</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="card space-y-4 p-6" noValidate>
        {serverError && !errors.sku && <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{serverError}</div>}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field name="name" error={errors.name} label="Name">
            <input id="name" className="input" {...register("name", { validate: (v) => v.trim().length > 0 || "Name is required" })} />
          </Field>
          <Field name="sku" error={errors.sku} label="SKU" hint="Must be unique within your organization.">
            <input id="sku" className="input" {...register("sku", { validate: (v) => v.trim().length > 0 || "SKU is required" })} />
          </Field>
        </div>
        <Field name="description" error={errors.description} label="Description">
          <textarea id="description" rows={3} className="input" {...register("description")} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field name="quantity_on_hand" error={errors.quantity_on_hand} label="Quantity on hand">
            <input id="quantity_on_hand" type="number" className="input" {...register("quantity_on_hand", { required: "Quantity is required", validate: (v) => (/^\d+$/.test(String(v)) ? true : "Enter a whole number of 0 or more") })} />
          </Field>
          <Field name="low_stock_threshold" error={errors.low_stock_threshold} label="Low stock threshold" hint="Leave blank to use the organization default.">
            <input id="low_stock_threshold" type="number" className="input" {...register("low_stock_threshold", { validate: (v) => v === "" || /^\d+$/.test(String(v)) || "Enter a whole number of 0 or more" })} />
          </Field>
          <Field name="cost_price" error={errors.cost_price} label="Cost price">
            <input id="cost_price" type="number" step="0.01" className="input" {...register("cost_price", optionalPrice)} />
          </Field>
          <Field name="selling_price" error={errors.selling_price} label="Selling price">
            <input id="selling_price" type="number" step="0.01" className="input" {...register("selling_price", optionalPrice)} />
          </Field>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Link to="/products" className="btn-secondary">Cancel</Link>
          <button className="btn-primary" disabled={isSubmitting}>{isSubmitting ? "Saving…" : isEdit ? "Save changes" : "Create product"}</button>
        </div>
      </form>
    </div>
  );
}