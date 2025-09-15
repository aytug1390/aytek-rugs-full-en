"use client";
import { signIn } from "next-auth/react";
import { useState } from "react";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  return (
    <div className="max-w-sm mx-auto py-16 space-y-3">
      <h1 className="text-xl font-semibold">Admin Sign In</h1>
      <form
        onSubmit={e => {
          e.preventDefault();
          signIn("credentials", { email, password, callbackUrl: "/admin" });
        }}
        className="space-y-3"
      >
  <input name="email" className="border px-3 py-2 w-full" placeholder="Email"
         value={email} onChange={e=>setEmail(e.target.value)} />
        <div className="relative">
     <input name="password" className="border px-3 py-2 w-full pr-10" type={showPassword ? "text" : "password"} placeholder="Password"
       value={password} onChange={e=>setPassword(e.target.value)} />
          <button
            type="button"
            className="absolute right-2 top-2 text-xs text-gray-500"
            onClick={() => setShowPassword(s => !s)}
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
        <div className="text-xs text-gray-500 mt-1">Şifre: <span className="font-mono">{password}</span></div>
        <button type="submit" className="px-3 py-2 bg-black text-white rounded">
          Sign In
        </button>
      </form>
    </div>
  );
}

