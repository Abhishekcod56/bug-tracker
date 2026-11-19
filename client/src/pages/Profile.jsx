
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import api from "../api";

export default function Profile() {

  const savedUser = JSON.parse(localStorage.getItem("user") || "{}");

  const [name, setName] = useState(savedUser.name || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const updateName = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);

    try {
      const { data } = await api.patch("/auth/profile", { name });

      localStorage.setItem("user", JSON.stringify(data.user));
      setMessage("Name updated successfully.");
    } catch (err) {
      setError(err.response?.data?.message || "Could not update name.");
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (newPassword.length < 8) {
      setError("New password must contain at least 8 characters.");
      return;
    }

    setLoading(true);

    try {
      const { data } = await api.patch("/auth/profile", {
        currentPassword,
        newPassword
      });

      setCurrentPassword("");
      setNewPassword("");
      setMessage(data.message || "Password updated successfully.");
    } catch (err) {
      setError(err.response?.data?.message || "Could not update password.");
    } finally {
      setLoading(false);
    }
  };

  return (
   <div className="w-full max-w-2xl mx-auto space-y-6 min-w-0">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">My Profile</h1>
        <p className="text-slate-500 mt-1">
          Manage your account details and password.
        </p>
      </div>

      {message && (
        <p className="bg-green-50 text-green-700 p-3 rounded-lg">
          {message}
        </p>
      )}

      {error && (
        <p className="bg-red-50 text-red-700 p-3 rounded-lg">
          {error}
        </p>
      )}

      <form
        onSubmit={updateName}
        className="bg-white rounded-xl shadow-sm border p-4 sm:p-6 space-y-4 min-w-0"
      >
        <h2 className="text-lg font-semibold">Personal Information</h2>

        <div>
          <label className="block text-sm font-medium mb-1">Full Name</label>
          <input
            className="w-full border rounded-lg p-3"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            className="w-full border rounded-lg p-3 bg-slate-100"
            value={savedUser.email || ""}
            disabled
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
        >
          Save Name
        </button>
      </form>

      <form
        onSubmit={updatePassword}
        className="bg-white rounded-xl shadow-sm border p-4 sm:p-6 space-y-4 min-w-0"
      >
        <h2 className="text-lg font-semibold">Change Password</h2>

        <div>
          <label className="block text-sm font-medium mb-1">
            Current Password
          </label>
          <div className="flex gap-2">
            <input
              className="flex-1 min-w-0 border rounded-lg p-3"
              type={showCurrent ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              onClick={() => setShowCurrent(!showCurrent)}
              className="border rounded-lg px-3 text-slate-600 hover:bg-slate-100"
              aria-label={showCurrent ? "Hide current password" : "Show current password"}
            >
             {showCurrent ? <Eye size={20} /> : <EyeOff size={20} />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            New Password
          </label>
          <div className="flex gap-2">
            <input
              className="flex-1 min-w-0 border rounded-lg p-3"
              type={showNew ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={8}
              maxLength={128}
              autoComplete="new-password"
              required
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="border rounded-lg px-3 text-slate-600 hover:bg-slate-100"
              aria-label={showNew ? "Hide new password" : "Show new password"}
            >
             {showNew ? <Eye size={20} /> : <EyeOff size={20} />}
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Use at least 8 characters.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
        >
          Update Password
        </button>
      </form>
    </div>
  );
}
