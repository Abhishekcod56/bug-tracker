import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Eye, EyeOff } from "lucide-react"; import {
  Routes,
  Route,
  Navigate,
  Link,
  NavLink,
  useNavigate
} from "react-router-dom";

import api from "./api";
import Dashboard from "./pages/Dashboard.jsx";
import Profile from "./pages/Profile.jsx";

// LOGIN AND REGISTER
function AuthPage({ mode }) {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const { data } = await api.post(`/auth/${mode}`, {
        ...form,
        name: form.name.trim(),
        email: form.email.trim().toLowerCase()
      });
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    }
  };

  return (
    <main className="min-h-screen grid place-items-center p-5 bg-slate-100">
      <form onSubmit={submit} className="bg-white p-8 rounded-2xl shadow max-w-md w-full space-y-4">
        <h1 className="text-2xl font-bold">
          {mode === "login" ? "Welcome back" : "Create your account"}
        </h1>
        {mode === "register" && (
          <input
            className="w-full border rounded-lg p-3"
            placeholder="Full name"
            maxLength={80}
            required
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
          />
        )}
        <input
          className="w-full border rounded-lg p-3"
          type="email"
          placeholder="Email"
          autoComplete="email"
          required
          value={form.email}
          onChange={e => setForm({ ...form, email: e.target.value })}
        />
        <div className="relative">
          <input
            className="w-full border rounded-lg p-3 pr-12"
            type={showPassword ? "text" : "password"}
            minLength={mode === "register" ? 8 : undefined}
            maxLength={128}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            placeholder="Password (min 8 characters)"
            required
            value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
          />

          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
          >
            {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
          </button>
        </div>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button className="w-full bg-indigo-600 text-white rounded-lg p-3 font-semibold">
          {mode === "login" ? "Login" : "Register"}
        </button>
        <p className="text-sm text-slate-600">
          {mode === "login" ? "New here?" : "Already registered?"}{" "}
          <Link className="text-indigo-600" to={mode === "login" ? "/register" : "/login"}>
            {mode === "login" ? "Create account" : "Login"}
          </Link>
        </p>
      </form>
    </main>
  );
}

// SHARED SIDEBAR AND PROTECTED PAGES
function Protected() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  if (!localStorage.getItem("token")) {
    return <Navigate to="/login" replace />;
  }

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login", { replace: true });
  };

  const linkClass = ({ isActive }) =>
    `block rounded-lg px-4 py-3 font-medium transition-colors ${isActive
      ? "bg-indigo-600 text-white"
      : "text-slate-300 hover:bg-slate-800 hover:text-white"
    }`;

  return (
    <div className="min-h-screen flex bg-slate-100">

      {/* Mobile menu button */}
      <button
        type="button"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="md:hidden fixed top-4 left-4 z-50 bg-slate-900 text-white p-2 rounded-lg"
        aria-label="Toggle navigation menu"
      >
        {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/40 z-30"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-64 shrink-0 bg-slate-900 text-white p-5 flex flex-col min-h-screen transform transition-transform duration-200 md:translate-x-0 ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        <div className="mb-10 px-2">
          <h2 className="text-2xl font-bold">IssueBoard</h2>
          <p className="text-sm text-slate-400 mt-1">
            Project &amp; bug tracking
          </p>
        </div>

        <nav className="space-y-2">
          <NavLink
            to="/"
            end
            className={linkClass}
            onClick={() => setMobileMenuOpen(false)}
          >
            Dashboard
          </NavLink>

          <NavLink
            to="/profile"
            className={linkClass}
            onClick={() => setMobileMenuOpen(false)}
          >
            Profile
          </NavLink>

          <NavLink
            to="/projects"
            className={linkClass}
            onClick={() => setMobileMenuOpen(false)}
          >
            Projects
          </NavLink>

          <NavLink
            to="/tickets"
            className={linkClass}
            onClick={() => setMobileMenuOpen(false)}
          >
            Ticket Status
          </NavLink>
        </nav>

        <div className="mt-auto border-t border-slate-700 pt-6">
          <button
            type="button"
            onClick={logout}
            className="w-full text-left rounded-lg px-4 py-3 text-red-300 hover:bg-slate-800"
          >
            Logout
          </button>
        </div>
      </aside>


      <div className="flex-1 min-w-0">
        <header className="bg-white border-b px-6 py-5 pl-16 md:pl-6 flex justify-between items-center gap-2">
          <div>
            <h1 className="text-xl font-bold text-slate-900">IssueBoard</h1>
            <p className="text-sm text-slate-500">Project &amp; bug tracking</p>
          </div>
          <span className="text-xs sm:text-sm 
          text-slate-500 truncate">
            Welcome, {user.name || "User"}
          </span>
        </header>

        <main className="p-5 md:p-8">
          <Routes>
            <Route path="/" element={<Dashboard page="dashboard" />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/projects" element={<Dashboard page="projects" />} />
            <Route path="/tickets" element={<Dashboard page="tickets" />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

// MAIN APP
export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/register" element={<AuthPage mode="register" />} />
      <Route path="/*" element={<Protected />} />
    </Routes>
  );
}
