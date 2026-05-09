"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type CRMUser = {
  username: string;
  password: string;
  role: "admin" | "counsellor";
  name: string;
  active: boolean;
};

const defaultUsers: CRMUser[] = [
  { username: "admin", password: "1234", role: "admin", name: "Admin", active: true },
  { username: "ramya", password: "1234", role: "counsellor", name: "Ramya", active: true },
  { username: "vivek", password: "1234", role: "counsellor", name: "Vivek", active: true },
];

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!localStorage.getItem("crm_users")) {
      localStorage.setItem("crm_users", JSON.stringify(defaultUsers));
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const savedUsers = localStorage.getItem("crm_users");
    const users: CRMUser[] = savedUsers ? JSON.parse(savedUsers) : defaultUsers;

    const user = users.find(
      (item) =>
        item.username === username.trim().toLowerCase() &&
        item.password === password
    );

    if (!user) {
      setError("Invalid username or password");
      return;
    }

    if (!user.active) {
      setError("This account is inactive");
      return;
    }

    localStorage.setItem("crm_logged_in", "true");
    localStorage.setItem("crm_role", user.role);
    localStorage.setItem("crm_user_name", user.name);
    localStorage.setItem("crm_username", user.username);

    router.push("/admin");
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-2">CRM Login</h1>
        <p className="text-center text-slate-500 mb-8">
          Admin & Counsellor Access
        </p>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block mb-2 font-medium">Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border rounded-xl px-4 py-3"
              placeholder="admin"
            />
          </div>

          <div>
            <label className="block mb-2 font-medium">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border rounded-xl px-4 py-3"
              placeholder="1234"
            />
          </div>

          {error && (
            <div className="bg-red-100 text-red-600 p-3 rounded-xl">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-slate-950 text-white py-3 rounded-xl"
          >
            Login
          </button>
        </form>

        <div className="mt-6 text-sm text-slate-500 bg-slate-50 p-4 rounded-xl">
          <p>Admin: admin / 1234</p>
          <p>Default counsellors: ramya / 1234, vivek / 1234</p>
        </div>
      </div>
    </main>
  );
}
