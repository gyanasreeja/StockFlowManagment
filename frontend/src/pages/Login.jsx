import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import AuthShell from "../components/AuthShell.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { errorMessage } from "../api/client.js";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState("");
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();

  const onSubmit = async (v) => {
    setServerError("");
    try {
      await login(v.email, v.password);
      navigate(location.state?.from?.pathname || "/", { replace: true });
    } catch (err) {
      setServerError(errorMessage(err));
    }
  };

  return (
    <AuthShell title="Log in" footer={<>New to StockFlow? <Link className="font-medium text-moss-700 hover:underline" to="/signup">Create an account</Link></>}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {serverError && <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{serverError}</div>}
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" type="email" autoComplete="email" className="input" {...register("email", { required: "Email is required", pattern: { value: /^\S+@\S+\.\S+$/, message: "Enter a valid email address" } })} />
          {errors.email && <p className="field-error">{errors.email.message}</p>}
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <input id="password" type="password" autoComplete="current-password" className="input" {...register("password", { required: "Password is required" })} />
          {errors.password && <p className="field-error">{errors.password.message}</p>}
        </div>
        <button className="btn-primary w-full" disabled={isSubmitting}>{isSubmitting ? "Logging in…" : "Log in"}</button>
      </form>
    </AuthShell>
  );
}