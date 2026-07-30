"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

const inputClass =
  "w-full bg-white border border-slate-300 text-slate-900 text-sm px-4 py-3 rounded-xl outline-none focus:border-slate-500 transition-colors placeholder-slate-400";

const defaultForm = {
  name: "",
  email: "",
  password: "",
  role: "admin",
};

type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
};

async function hashPassword(password: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export default function AdminManagePage() {
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const savedRole =
      typeof window !== "undefined" && localStorage.getItem("adminRole");
    if (savedRole !== "superadmin") {
      router.push("/Admin");
      return;
    }
    setRole(savedRole);
    fetchAdmins();
  }, [router]);

  async function fetchAdmins() {
    setLoading(true);
    const { data, error } = await supabase
      .from("admin_users")
      .select("id, name, email, role, is_active, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      setError(error.message);
      setAdmins([]);
    } else {
      setAdmins(data ?? []);
    }
    setLoading(false);
  }

  async function handleCreateAdmin() {
    if (!form.name || !form.email || !form.password) {
      alert("Name, email, and password are required.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const password_hash = await hashPassword(form.password);
      const { error } = await supabase.from("admin_users").insert({
        name: form.name,
        email: form.email,
        password_hash,
        role: form.role,
        is_active: true,
      });

      if (error) {
        throw error;
      }

      setForm(defaultForm);
      await fetchAdmins();
    } catch (err: any) {
      setError(err?.message || "Failed to create admin.");
    }

    setSaving(false);
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white font-titillium px-4 py-10">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-[10px] tracking-[0.4em] uppercase text-slate-500 mb-2">
              Superadmin Panel
            </p>
            <h1 className="text-3xl font-bold">Admin Users</h1>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-[10px] uppercase tracking-[0.3em] text-slate-500 mb-2 block">
                Name
              </label>
              <input
                name="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={inputClass}
                placeholder="Admin name"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-[0.3em] text-slate-500 mb-2 block">
                Email
              </label>
              <input
                name="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className={inputClass}
                placeholder="admin@example.com"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-[0.3em] text-slate-500 mb-2 block">
                Password
              </label>
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className={inputClass}
                placeholder="Secret password"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-[0.3em] text-slate-500 mb-2 block">
                Role
              </label>
              <select
                name="role"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className={inputClass}
              >
                <option value="admin">Admin</option>
                <option value="superadmin">Superadmin</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={handleCreateAdmin}
              disabled={saving}
              className="inline-flex items-center justify-center rounded-2xl bg-slate-200 px-5 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-950 hover:bg-white transition-colors disabled:opacity-60"
            >
              {saving ? "Saving..." : "Create Admin"}
            </button>
            <p className="text-xs text-slate-400">
              New admins are only visible to superadmin once created.
            </p>
          </div>

          {error && (
            <div className="rounded-2xl border border-red-500 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Existing Admins</h2>
            <button
              onClick={fetchAdmins}
              className="text-xs uppercase tracking-[0.2em] text-slate-400 hover:text-white"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="text-sm text-slate-400">Loading admins...</div>
          ) : (
            <div className="space-y-3">
              {admins.length === 0 ? (
                <p className="text-sm text-slate-400">No admins found.</p>
              ) : (
                <div className="grid gap-3">
                  {admins.map((admin) => (
                    <div
                      key={admin.id}
                      className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-4"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold text-white">
                            {admin.name}
                          </p>
                          <p className="text-xs text-slate-500">
                            {admin.email}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">
                            {admin.role}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {admin.is_active ? "Active" : "Inactive"}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
