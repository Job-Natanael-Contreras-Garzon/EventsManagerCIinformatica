// src/modules/registration/components/RegistrationForm.tsx
"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { registrationSchema } from "@/modules/registration/schema";
import { registerPlayer } from "@/modules/registration/actions";

type FormInput = z.input<typeof registrationSchema>;

interface RegistrationFormProps {
  eventId: string;
  eventName: string;
  registrationMode: "INDIVIDUAL" | "TEAM";
}

export function RegistrationForm({
  eventId,
  eventName,
  registrationMode,
}: RegistrationFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<FormInput>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      eventId,
      registrationType: registrationMode === "INDIVIDUAL" ? "individual" : "create_team",
      fullName: "",
      email: "",
      phone: "",
      registerCode: "",
      teamName: "",
      teamCode: "",
      acceptedTerms: undefined,
    },
  });

  // Watch the registrationType to conditionally render team fields
  const registrationType = watch("registrationType");

  const onSubmit = (data: FormInput) => {
    setServerError(null);
    startTransition(async () => {
      const result = await registerPlayer(data);

      if (!result.success) {
        // Map backend validation or business errors back to form fields
        if (result.fieldErrors) {
          Object.entries(result.fieldErrors).forEach(([field, messages]) => {
            setError(field as keyof FormInput, {
              type: "server",
              message: messages?.[0],
            });
          });
        } else if (result.error) {
          // General business error
          setServerError(result.error);
        }
        return;
      }

      // On success, redirect to success screen using confirmation code
      if (result.data?.confirmationCode) {
        router.push(`/registro/exito?regId=${result.data.confirmationCode}`);
      }
    });
  };

  const handleTabChange = (type: "create_team" | "join_team") => {
    setValue("registrationType", type);
    clearErrors(["teamName", "teamCode"]);
    setServerError(null);
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="w-full space-y-6 bg-brand-dark/45 p-5 sm:p-6 rounded-2xl border border-brand-blue/30 shadow-2xl relative"
      noValidate
    >
      {/* General Error Message from Server */}
      {serverError && (
        <div
          role="alert"
          aria-live="assertive"
          className="flex items-center gap-3 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-medium animate-fadeIn"
        >
          <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p>{serverError}</p>
        </div>
      )}

      {/* Conditionally render Team registration tab selection */}
      {registrationMode === "TEAM" && (
        <div className="grid grid-cols-2 p-1 bg-brand-navy/60 border border-brand-blue/30 rounded-xl mb-6">
          <button
            type="button"
            onClick={() => handleTabChange("create_team")}
            disabled={isPending}
            className={`w-full py-2.5 rounded-lg text-xs font-bold tracking-wider uppercase transition-all duration-150 min-h-[44px] ${
              registrationType === "create_team"
                ? "bg-brand-blue text-white border border-brand-blue/40 shadow"
                : "text-brand-sky/60 hover:text-brand-sky active:scale-95 disabled:opacity-40"
            }`}
          >
            Crear un Equipo
          </button>
          <button
            type="button"
            onClick={() => handleTabChange("join_team")}
            disabled={isPending}
            className={`w-full py-2.5 rounded-lg text-xs font-bold tracking-wider uppercase transition-all duration-150 min-h-[44px] ${
              registrationType === "join_team"
                ? "bg-brand-blue text-white border border-brand-blue/40 shadow"
                : "text-brand-sky/60 hover:text-brand-sky active:scale-95 disabled:opacity-40"
            }`}
          >
            Unirse a un Equipo
          </button>
        </div>
      )}

      {/* Team Details Group */}
      {registrationMode === "TEAM" && registrationType === "create_team" && (
        <div className="space-y-1.5 animate-fadeIn">
          <label
            htmlFor="teamName"
            className="text-xs font-semibold uppercase tracking-wider text-brand-sky/80 block"
          >
            Nombre del Equipo <span className="text-rose-555">*</span>
          </label>
          <input
            id="teamName"
            type="text"
            placeholder="Ej: Los Programadores Veloces"
            disabled={isPending}
            {...register("teamName")}
            className="w-full min-h-[48px] px-4 py-3 bg-brand-navy/60 border border-brand-blue/40 rounded-xl text-white text-base placeholder:text-brand-sky/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sky focus-visible:border-transparent transition-all disabled:opacity-40"
          />
          {errors.teamName && (
            <p role="alert" className="text-xs text-rose-450 mt-1 pl-1">
              {errors.teamName.message}
            </p>
          )}
        </div>
      )}

      {registrationMode === "TEAM" && registrationType === "join_team" && (
        <div className="space-y-1.5 animate-fadeIn">
          <label
            htmlFor="teamCode"
            className="text-xs font-semibold uppercase tracking-wider text-brand-sky/80 block"
          >
            Código de Equipo (6 caracteres) <span className="text-rose-555">*</span>
          </label>
          <input
            id="teamCode"
            type="text"
            maxLength={6}
            placeholder="Ej: A8B2C4"
            disabled={isPending}
            {...register("teamCode")}
            className="w-full min-h-[48px] px-4 py-3 bg-brand-navy/60 border border-brand-blue/40 rounded-xl text-white text-base placeholder:text-brand-sky/30 uppercase font-mono tracking-widest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sky focus-visible:border-transparent transition-all disabled:opacity-40"
          />
          {errors.teamCode && (
            <p role="alert" className="text-xs text-rose-450 mt-1 pl-1">
              {errors.teamCode.message}
            </p>
          )}
        </div>
      )}

      {/* Separator / Subtitle for Team Leader/Member Info */}
      {registrationMode === "TEAM" && (
        <div className="pt-4 border-t border-brand-blue/20">
          <h3 className="text-xs font-bold uppercase tracking-wider text-brand-sky">
            {registrationType === "create_team" ? "Datos del Líder del Equipo" : "Datos del Integrante"}
          </h3>
        </div>
      )}

      {/* Participant Personal Details */}
      <div className="space-y-4">
        {/* Full Name */}
        <div className="space-y-1.5">
          <label
            htmlFor="fullName"
            className="text-xs font-semibold uppercase tracking-wider text-brand-sky/80 block"
          >
            Nombre Completo <span className="text-rose-555">*</span>
          </label>
          <input
            id="fullName"
            type="text"
            placeholder="Nombre y Apellidos"
            disabled={isPending}
            {...register("fullName")}
            className="w-full min-h-[48px] px-4 py-3 bg-brand-navy/60 border border-brand-blue/40 rounded-xl text-white text-base placeholder:text-brand-sky/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sky focus-visible:border-transparent transition-all disabled:opacity-40"
          />
          {errors.fullName && (
            <p role="alert" className="text-xs text-rose-450 mt-1 pl-1">
              {errors.fullName.message}
            </p>
          )}
        </div>

        {/* University ID / Register Code */}
        <div className="space-y-1.5">
          <label
            htmlFor="registerCode"
            className="text-xs font-semibold uppercase tracking-wider text-brand-sky/80 block"
          >
            Código Universitario / Registro <span className="text-rose-555">*</span>
          </label>
          <input
            id="registerCode"
            type="text"
            placeholder="Ej: 202105432"
            disabled={isPending}
            {...register("registerCode")}
            className="w-full min-h-[48px] px-4 py-3 bg-brand-navy/60 border border-brand-blue/40 rounded-xl text-white text-base placeholder:text-brand-sky/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sky focus-visible:border-transparent transition-all disabled:opacity-40"
          />
          {errors.registerCode && (
            <p role="alert" className="text-xs text-rose-450 mt-1 pl-1">
              {errors.registerCode.message}
            </p>
          )}
        </div>

        {/* Phone / Whatsapp */}
        <div className="space-y-1.5">
          <label
            htmlFor="phone"
            className="text-xs font-semibold uppercase tracking-wider text-brand-sky/80 block"
          >
            Celular / WhatsApp (Bolivia) <span className="text-rose-555">*</span>
          </label>
          <input
            id="phone"
            type="tel"
            placeholder="Ej: 70712345"
            disabled={isPending}
            {...register("phone")}
            className="w-full min-h-[48px] px-4 py-3 bg-brand-navy/60 border border-brand-blue/40 rounded-xl text-white text-base placeholder:text-brand-sky/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sky focus-visible:border-transparent transition-all disabled:opacity-40"
          />
          {errors.phone && (
            <p role="alert" className="text-xs text-rose-450 mt-1 pl-1">
              {errors.phone.message}
            </p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <label
            htmlFor="email"
            className="text-xs font-semibold uppercase tracking-wider text-brand-sky/80 block"
          >
            Correo Electrónico <span className="text-rose-555">*</span>
          </label>
          <input
            id="email"
            type="email"
            placeholder="correo@ejemplo.com"
            disabled={isPending}
            {...register("email")}
            className="w-full min-h-[48px] px-4 py-3 bg-brand-navy/60 border border-brand-blue/40 rounded-xl text-white text-base placeholder:text-brand-sky/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sky focus-visible:border-transparent transition-all disabled:opacity-40"
          />
          {errors.email && (
            <p role="alert" className="text-xs text-rose-450 mt-1 pl-1">
              {errors.email.message}
            </p>
          )}
        </div>
      </div>

      {/* Terms & Conditions Checkbox */}
      <div className="pt-2">
        <label className="flex items-start gap-3 cursor-pointer select-none">
          <div className="relative flex items-center min-h-[44px]">
            <input
              type="checkbox"
              disabled={isPending}
              {...register("acceptedTerms")}
              className="peer sr-only"
            />
            <div className="w-5.5 h-5.5 rounded-md border border-brand-blue/40 bg-brand-navy flex items-center justify-center transition-all peer-checked:bg-brand-sky peer-checked:border-brand-sky peer-focus-visible:ring-2 peer-focus-visible:ring-brand-sky/50 peer-disabled:opacity-40">
              <svg
                className="w-3.5 h-3.5 text-brand-navy scale-0 transition-transform peer-checked:scale-100"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <span className="text-xs text-brand-light-gray/80 leading-tight pt-3">
            Acepto los términos y condiciones de inscripción y certifico que la información provista es verdadera. <span className="text-rose-500">*</span>
          </span>
        </label>
        {errors.acceptedTerms && (
          <p role="alert" className="text-xs text-rose-450 mt-1 pl-8">
            {errors.acceptedTerms.message}
          </p>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isPending}
        className="w-full min-h-[52px] bg-brand-sky hover:bg-brand-sky/90 active:scale-[0.98] active:bg-brand-sky/85 text-brand-navy font-bold text-base rounded-xl shadow-lg shadow-brand-navy/30 transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sky focus-visible:ring-offset-2 focus-visible:ring-offset-brand-navy flex items-center justify-center gap-2.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
      >
        {isPending ? (
          <>
            <svg className="animate-spin h-5.5 w-5.5 text-brand-navy" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span>Inscribiendo...</span>
          </>
        ) : (
          <span>Inscribirse al Evento</span>
        )}
      </button>
    </form>
  );
}
