"use client";

export default function AdminLoginPage() {
  return (
    <main className="min-h-screen bg-[#f5f5f2] px-5 py-12 text-[#141414]">
      <div className="mx-auto max-w-md rounded-3xl border border-black/10 bg-white p-7 shadow-[0_14px_50px_rgba(0,0,0,0.08)] sm:p-9">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-[#e66a24]">M&J Metal</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight">Admin login</h1>
        <p className="mt-3 text-sm leading-6 text-black/55">Mark and Jonathan will each have their own login. Authentication activates once the dedicated M&J Supabase project is connected.</p>

        <form className="mt-7 space-y-4" onSubmit={(event) => event.preventDefault()}>
          <label className="block">
            <span className="mb-1.5 block text-sm font-bold">Email</span>
            <input type="email" autoComplete="email" className="h-12 w-full rounded-xl border border-black/15 px-3 outline-none focus:border-[#e66a24]" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-bold">Password</span>
            <input type="password" autoComplete="current-password" className="h-12 w-full rounded-xl border border-black/15 px-3 outline-none focus:border-[#e66a24]" />
          </label>
          <button type="submit" className="h-12 w-full rounded-xl bg-[#e66a24] font-black text-white disabled:opacity-50" disabled>Login</button>
        </form>

        <p className="mt-5 rounded-xl bg-[#f5f5f2] p-3 text-xs leading-5 text-black/50">Login is intentionally disabled on the build branch until Supabase Auth and the two approved admin users are connected.</p>
      </div>
    </main>
  );
}
