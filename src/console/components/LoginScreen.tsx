import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { Button, Field, Input } from './ui';

interface LoginProps {
  loginEmail: string;
  setLoginEmail: (value: string) => void;
  loginPassword: string;
  setLoginPassword: (value: string) => void;
  loginError: string;
  onSubmit: (event: React.FormEvent) => void;
}

export function LoginScreen(props: LoginProps) {
  const [rememberMe, setRememberMe] = useState(true);

  return (
    <div className="min-h-screen bg-white px-4 py-6 text-slate-900 sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-5xl items-center justify-center">
        <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-[0_6px_20px_rgba(15,23,42,0.06)] sm:p-8">
          <div className="mb-7 space-y-3 text-center">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white">
              <Sparkles size={18} />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950">Welcome Back</h1>
          </div>

          <form onSubmit={props.onSubmit} className="space-y-4" noValidate>
            <Field label="Email address">
              <Input
                value={props.loginEmail}
                onChange={(event) => props.setLoginEmail(event.target.value)}
                placeholder="you@company.com"
                autoComplete="email"
                required
              />
            </Field>

            <Field label="Password">
              <Input
                value={props.loginPassword}
                type="password"
                onChange={(event) => props.setLoginPassword(event.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
              />
            </Field>

            <div className="flex items-center justify-between gap-3">
              <label className="inline-flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(event) => setRememberMe(event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                Remember me
              </label>
              <button type="button" className="text-sm font-medium text-blue-700 hover:text-blue-800">Forgot password?</button>
            </div>

            {props.loginError ? <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{props.loginError}</div> : null}

            <Button type="submit" variant="primary" className="w-full py-2.5">Sign In</Button>
          </form>

          <div className="mt-6 border-t border-slate-200 pt-4 text-center text-xs text-slate-500">
            <button type="button" className="hover:text-slate-700">Terms</button>
            <span className="px-2">•</span>
            <button type="button" className="hover:text-slate-700">Privacy</button>
          </div>
        </div>
      </div>
    </div>
  );
}
