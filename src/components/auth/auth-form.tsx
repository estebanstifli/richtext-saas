"use client";

import Link from "next/link";
import { useActionState } from "react";

import { loginAction, registerAction, type AuthActionState } from "@/lib/auth-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { messages } from "@/messages/en";

type AuthFormProps = {
  mode: "login" | "register";
  plan?: string;
};

const initialState: AuthActionState = {};

export function AuthForm({ mode, plan }: AuthFormProps) {
  const action = mode === "login" ? loginAction : registerAction;
  const [state, formAction, pending] = useActionState(action, initialState);
  const isLogin = mode === "login";

  return (
    <form action={formAction} className="space-y-5">
      <input name="plan" type="hidden" value={plan || ""} />
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="email">
          {messages.auth.emailLabel}
        </label>
        <Input autoComplete="email" id="email" name="email" required type="email" />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="password">
          {messages.auth.passwordLabel}
        </label>
        <Input
          autoComplete={isLogin ? "current-password" : "new-password"}
          id="password"
          minLength={isLogin ? undefined : 8}
          name="password"
          required
          type="password"
        />
        {!isLogin ? <p className="text-sm text-muted-foreground">{messages.auth.passwordHelp}</p> : null}
      </div>
      {state.error ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {state.error}
        </div>
      ) : null}
      <Button className="w-full" disabled={pending} type="submit">
        {isLogin ? messages.auth.loginButton : messages.auth.registerButton}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        {isLogin ? messages.auth.noAccount : messages.auth.hasAccount}{" "}
        <Link className="font-medium text-primary hover:underline" href={isLogin ? "/register" : "/login"}>
          {isLogin ? messages.auth.goToRegister : messages.auth.goToLogin}
        </Link>
      </p>
    </form>
  );
}
