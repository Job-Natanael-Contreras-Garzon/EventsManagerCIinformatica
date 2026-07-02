"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@/modules/auth/schemas/auth.schema";
import { loginAction } from "@/modules/auth/actions/auth.actions";

export default function LoginPage() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: LoginInput) => {
    setError(null);
    startTransition(async () => {
      const result = await loginAction(data);
      if (result && !result.success) {
        setError(result.error);
      }
    });
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 selection:bg-brand-sky selection:text-brand-navy relative">
      <div className="fixed-background-bg" />
      
      <div className="w-full max-w-md bg-brand-dark/40 backdrop-blur-lg border border-brand-blue/35 rounded-3xl p-8 shadow-2xl relative overflow-hidden flex flex-col gap-6">
        {/* Glow decorative circle */}
        <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 bg-brand-sky/10 rounded-full blur-2xl pointer-events-none" />
        
        {/* Header logo / branding */}
        <div className="flex flex-col items-center text-center gap-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-blue to-brand-sky flex items-center justify-center font-black text-lg text-brand-navy shadow-lg shadow-brand-sky/15">
            AD
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-tight">Consola Administrativa</h1>
            <p className="text-xs font-bold text-brand-sky uppercase tracking-widest mt-1">CI Ingeniería Informática</p>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs font-medium text-center leading-relaxed">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="username" className="text-[10px] font-bold text-brand-sky uppercase tracking-wider">
              Correo Electrónico
            </label>
            <input
              id="username"
              type="email"
              placeholder="correo@ejemplo.com"
              {...register("username")}
              disabled={isPending}
              className="w-full px-4 py-3 rounded-xl bg-brand-navy/60 border border-brand-blue/30 text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:border-brand-sky focus:ring-1 focus:ring-brand-sky/50 transition-all"
            />
            {errors.username && (
              <span className="text-[10px] text-rose-400 font-medium" role="alert">
                {errors.username.message}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-[10px] font-bold text-brand-sky uppercase tracking-wider">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              {...register("password")}
              disabled={isPending}
              className="w-full px-4 py-3 rounded-xl bg-brand-navy/60 border border-brand-blue/30 text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:border-brand-sky focus:ring-1 focus:ring-brand-sky/50 transition-all"
            />
            {errors.password && (
              <span className="text-[10px] text-rose-400 font-medium" role="alert">
                {errors.password.message}
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-brand-blue to-brand-sky hover:from-brand-sky hover:to-brand-sky text-brand-navy hover:text-brand-navy text-sm font-bold tracking-tight shadow-md shadow-brand-sky/15 active:scale-[0.98] disabled:opacity-50 disabled:scale-100 transition-all cursor-pointer min-h-[44px] flex items-center justify-center"
          >
            {isPending ? (
              <div className="w-5 h-5 border-2 border-brand-navy border-t-transparent rounded-full animate-spin" />
            ) : (
              "Ingresar al Panel"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
