// src/app/admin/eventos/ImageUploadField.tsx
"use client";

import { useState, useRef, useEffect } from "react";

interface ImageUploadFieldProps {
  value: string | null; // Base64 string from db
  onChange: (file: File | null) => void;
  onRemoveExisting?: () => void;
}

/** Calidad WebP (0–1). 0.82 da un balance óptimo entre tamaño y calidad visual. */
const WEBP_QUALITY = 0.82;

/** Dimensión máxima (ancho o alto) en píxeles antes de reescalar. */
const MAX_DIMENSION = 800;

/**
 * Convierte cualquier imagen (JPEG, PNG, GIF, AVIF, etc.) a WebP optimizado
 * usando el API Canvas del navegador. También reescala la imagen si sus
 * dimensiones superan MAX_DIMENSION px manteniendo la relación de aspecto.
 *
 * @param file - Archivo de imagen original del usuario.
 * @returns Promesa que resuelve con un File WebP listo para enviar.
 */
async function convertToWebP(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      // ── Calcular dimensiones de destino ────────────────────────────────
      let { width, height } = img;
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        if (width >= height) {
          height = Math.round((height / width) * MAX_DIMENSION);
          width = MAX_DIMENSION;
        } else {
          width = Math.round((width / height) * MAX_DIMENSION);
          height = MAX_DIMENSION;
        }
      }

      // ── Dibujar en canvas y exportar a WebP ────────────────────────────
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("No se pudo obtener el contexto 2D del canvas."));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("El canvas no pudo generar el Blob WebP."));
            return;
          }
          // Crear un File con extensión .webp y tipo correcto
          const baseName = file.name.replace(/\.[^/.]+$/, "");
          const webpFile = new File([blob], `${baseName}.webp`, {
            type: "image/webp",
            lastModified: Date.now(),
          });
          resolve(webpFile);
        },
        "image/webp",
        WEBP_QUALITY
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("No se pudo cargar la imagen para convertirla."));
    };

    img.src = objectUrl;
  });
}

export function ImageUploadField({
  value,
  onChange,
  onRemoveExisting,
}: ImageUploadFieldProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [converting, setConverting] = useState(false);
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

  const validateAndProcessFile = async (file: File) => {
    setErrorMsg(null);

    // Validar que sea un archivo de tipo imagen
    if (!file.type.startsWith("image/")) {
      setErrorMsg("Solo se permiten archivos de imagen (JPG, PNG, WebP, etc.).");
      return;
    }

    setConverting(true);
    try {
      // Convertir a WebP optimizado sin importar el formato original
      const webpFile = await convertToWebP(file);

      // Validación de tamaño POST-conversión: máx. 500 KB
      const maxBytes = 500 * 1024;
      if (webpFile.size > maxBytes) {
        const sizeKb = (webpFile.size / 1024).toFixed(1);
        setErrorMsg(
          `La imagen convertida ocupa ${sizeKb} KB, lo que supera el límite de 500 KB. ` +
            `Prueba con una imagen de menor resolución o contenido.`
        );
        return;
      }

      // Crear URL de previsualización
      const objectUrl = URL.createObjectURL(webpFile);
      setPreviewUrl(objectUrl);
      onChange(webpFile);
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "Ocurrió un error al procesar la imagen."
      );
    } finally {
      setConverting(false);
    }
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
    if (!converting) fileInputRef.current?.click();
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
        Arte Promocional / Flyer
      </label>

      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={triggerFileInput}
        className={`relative w-full aspect-square max-w-[200px] mx-auto rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition-all ${
          converting
            ? "cursor-wait border-violet-400/50 bg-violet-500/5"
            : dragActive
            ? "border-violet-500 bg-violet-500/10 cursor-copy"
            : previewUrl
            ? "border-zinc-800 bg-zinc-950 cursor-pointer"
            : "border-zinc-850 hover:border-zinc-700 bg-zinc-900/50 cursor-pointer"
        }`}
      >
        {/* Input acepta cualquier imagen */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
          disabled={converting}
        />

        {converting ? (
          /* ── Estado de conversión ─────────────────────────────────────── */
          <div className="p-4 text-center flex flex-col items-center gap-3">
            <div className="w-10 h-10 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
            <p className="text-[10px] font-semibold text-violet-400">
              Convirtiendo a WebP…
            </p>
          </div>
        ) : previewUrl ? (
          /* ── Vista previa de la imagen ────────────────────────────────── */
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
          /* ── Estado vacío / drop zone ─────────────────────────────────── */
          <div className="p-4 text-center flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-zinc-800/80 border border-zinc-700 flex items-center justify-center text-zinc-400 transition-colors">
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
              <p className="text-[10px] text-zinc-500 mt-1">JPG, PNG, WebP, AVIF…</p>
              <p className="text-[9px] text-zinc-550">Se convierte a WebP automáticamente</p>
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
