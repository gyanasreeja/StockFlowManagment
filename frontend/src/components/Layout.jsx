import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const links = [
  { to: "/", label: "Dashboard", end: true },
  { to: "/products", label: "Products" },
  { to: "/settings", label: "Settings" },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const signOut = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-60 shrink-0 flex-col bg-moss-800 text-moss-50">
        <div className="px-5 py-5 text-lg font-semibold tracking-tight">StockFlow</div>
        <nav className="flex-1 space-y-1 px-3">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                `block rounded-md px-3 py-2 text-sm ${isActive ? "bg-moss-700 font-medium text-white" : "text-moss-100 hover:bg-moss-700/60"}`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-moss-700 p-4 text-sm">
          <div className="truncate font-medium">{user.organization.name}</div>
          <div className="truncate text-xs text-moss-100/80">{user.email}</div>
          <button onClick={signOut} className="mt-3 w-full rounded-md border border-moss-600 px-3 py-1.5 text-sm hover:bg-moss-700">
            Log out
          </button>
        </div>
      </aside>
      <main className="min-w-0 flex-1 p-8">
        <div className="mx-auto max-w-6xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}