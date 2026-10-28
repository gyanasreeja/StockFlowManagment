import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import AuthShell from "../components/AuthShell.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { errorMessage, fieldErrors } from "../api/client.js";

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState("");
  const { register, handleSubmit, watch, setError, formState: { errors, isSubmitting } } = useForm();

  const onSubmit = async (v) => {
    setServerError("");
    try {
      await signup({
        email: v.email,
        password: v.password,
        confirm_password: v.confirm_password,
        organization_name: v.organization_name,
      });
      navigate("/", { replace: true });
    } catch (err) {
      if (err.response?.status === 409) setError("email", { message: errorMessage(err) });
      else {
        Object.entries(fieldErrors(err)).forEach(([f, message]) => setError(f, { message }));
        setServerError(errorMessage(err));
      }
    }
  };

  return (
    <AuthShell title="Create your account" subtitle="Set up your organization and start tracking stock." footer={<>Already have an account? <Link className="font-medium text-moss-700 hover:underline" to="/login">Log in</Link></>}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {serverError && !Object.keys(errors).length && <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{serverError}</div>}
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" type="email" autoComplete="email" className="input" {...register("email", { required: "Email is required", pattern: { value: /^\S+@\S+\.\S+$/, message: "Enter a valid email address" } })} />
          {errors.email && <p className="field-error">{errors.email.message}</p>}
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <input id="password" type="password" autoComplete="new-password" className="input" {...register("password", { required: "Password is required", minLength: { value: 8, message: "Use at least 8 characters" }, maxLength: { value: 72, message: "Use 72 characters or fewer" } })} />
          {errors.password && <p className="field-error">{errors.password.message}</p>}
        </div>
        <div>
          <label className="label" htmlFor="confirm_password">Confirm password</label>
          <input id="confirm_password" type="password" autoComplete="new-password" className="input" {...register("confirm_password", { required: "Confirm your password", validate: (val) => val === watch("password") || "Passwords do not match" })} />
          {errors.confirm_password && <p className="field-error">{errors.confirm_password.message}</p>}
        </div>
        <div>
          <label className="label" htmlFor="organization_name">Organization name</label>
          <input id="organization_name" className="input" {...register("organization_name", { validate: (val) => val.trim().length > 0 || "Organization name is required" })} />
          {errors.organization_name && <p className="field-error">{errors.organization_name.message}</p>}
        </div>
        <button className="btn-primary w-full" disabled={isSubmitting}>{isSubmitting ? "Creating account…" : "Create account"}</button>
      </form>
    </AuthShell>
  );
}