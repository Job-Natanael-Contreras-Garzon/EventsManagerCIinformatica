// src/app/admin/eventos/ImageUploadField.tsx
"use client";

import { useState, useRef, useEffect } from "react";

interface ImageUploadFieldProps {
  value: string | null; // Base64 string from db
  onChange: (file: File | null) => void;
  onRemoveExisting?: () => void;
}

export function ImageUploadField({
  value,
  onChange,
  onRemoveExisting,
}: ImageUploadFieldProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load initial Base64 image from DB
  useEffect(() => {
    if (value) {
      setPreviewUrl(`data:image/webp;base64,${value}`);
      setErrorMsg(null);
    } else {
      setPreviewUrl(null);
    }
  }, [value]);

  const validateAndProcessFile = (file: File) => {
    setErrorMsg(null);

    // Format validation
    if (file.type !== "image/webp") {
      setErrorMsg("El formato del archivo debe ser WebP obligatoriamente.");
      return;
    }

    // Size validation: max 500 KB
    const maxBytes = 500 * 1024;
    if (file.size > maxBytes) {
      const actualSizeKb = (file.size / 1024).toFixed(1);
      setErrorMsg(`La imagen excede el máximo de 500 KB (tu archivo pesa ${actualSizeKb} KB).`);
      return;
    }

    // Create local object URL for instant preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    onChange(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndProcessFile(e.target.files[0]);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndProcessFile(e.dataTransfer.files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewUrl(null);
    setErrorMsg(null);
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (value && onRemoveExisting) {
      onRemoveExisting();
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
        Arte Promocional / Flyer (WebP Cuadrado)
      </label>

      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={triggerFileInput}
        className={`relative w-full aspect-square max-w-[200px] mx-auto rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all ${
          dragActive
            ? "border-violet-500 bg-violet-500/10"
            : previewUrl
            ? "border-zinc-800 bg-zinc-950"
            : "border-zinc-850 hover:border-zinc-700 bg-zinc-900/50"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/webp"
          className="hidden"
          onChange={handleFileChange}
        />

        {previewUrl ? (
          <div className="relative w-full h-full p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Preview del flyer del torneo"
              className="w-full h-full object-cover rounded-xl"
            />
            <button
              type="button"
              onClick={handleClear}
              className="absolute -top-1 -right-1 w-7 h-7 bg-rose-600 hover:bg-rose-500 text-white rounded-full flex items-center justify-center shadow-lg border border-zinc-900 active:scale-90 transition-transform"
              title="Quitar imagen"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : (
          <div className="p-4 text-center flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-zinc-800/80 border border-zinc-700 flex items-center justify-center text-zinc-400 group-hover:text-zinc-250 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-250">Selecciona o arrastra el flyer</p>
              <p className="text-[10px] text-zinc-500 mt-1">Solo formato WebP cuadrado</p>
              <p className="text-[9px] text-zinc-550">Máx. 500 KB</p>
            </div>
          </div>
        )}
      </div>

      {errorMsg && (
        <p className="text-[10px] text-rose-500 font-semibold text-center mt-1" role="alert">
          {errorMsg}
        </p>
      )}
    </div>
  );
}
