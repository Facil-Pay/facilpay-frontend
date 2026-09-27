"use client";

import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { ImageUp, Trash2 } from "lucide-react";

const MAX_BYTES = 1024 * 1024;
const ACCEPTED_TYPES = ["image/png", "image/svg+xml"];
const VIEWPORT = 240;
const OUTPUT_SIZE = 512;

interface LogoUploaderProps {
  value: string | null;
  onChange: (dataUrl: string | null, fileName?: string) => void;
}

interface CropState {
  src: string;
  fileName: string;
  image: HTMLImageElement;
  zoom: number;
  x: number;
  y: number;
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not read that image"));
    image.src = src;
  });
}

/** Scale that makes the image cover the square viewport at zoom 1. */
function coverScale(image: HTMLImageElement) {
  return VIEWPORT / Math.min(image.naturalWidth, image.naturalHeight);
}

/** Keep the image covering the viewport so the crop never contains empty space. */
function clampOffset(crop: Pick<CropState, "image" | "zoom" | "x" | "y">) {
  const scale = coverScale(crop.image) * crop.zoom;
  const width = crop.image.naturalWidth * scale;
  const height = crop.image.naturalHeight * scale;
  return {
    x: Math.min(0, Math.max(VIEWPORT - width, crop.x)),
    y: Math.min(0, Math.max(VIEWPORT - height, crop.y)),
  };
}

/**
 * Logo upload with type/size validation, preview, and a square crop for
 * PNGs (zoom + drag). SVGs are vector and used as-is.
 */
export function LogoUploader({ value, onChange }: LogoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const dragRef = useRef<{ startX: number; startY: number; x: number; y: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [crop, setCrop] = useState<CropState | null>(null);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError("Upload a PNG or SVG file.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError(`That file is ${(file.size / 1024 / 1024).toFixed(2)} MB. The maximum is 1 MB.`);
      return;
    }
    try {
      const src = await readAsDataUrl(file);
      if (file.type === "image/svg+xml") {
        onChange(src, file.name);
        return;
      }
      const image = await loadImage(src);
      const scale = coverScale(image);
      setCrop({
        src,
        fileName: file.name,
        image,
        zoom: 1,
        x: (VIEWPORT - image.naturalWidth * scale) / 2,
        y: (VIEWPORT - image.naturalHeight * scale) / 2,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read that file.");
    }
  };

  const setZoom = (zoom: number) => {
    if (!crop) return;
    // Zoom around the viewport centre
    const ratio = zoom / crop.zoom;
    const center = VIEWPORT / 2;
    const next = { ...crop, zoom, x: center - (center - crop.x) * ratio, y: center - (center - crop.y) * ratio };
    setCrop({ ...next, ...clampOffset(next) });
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!crop) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { startX: event.clientX, startY: event.clientY, x: crop.x, y: crop.y };
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || !crop) return;
    const next = { ...crop, x: drag.x + event.clientX - drag.startX, y: drag.y + event.clientY - drag.startY };
    setCrop({ ...next, ...clampOffset(next) });
  };

  const applyCrop = () => {
    if (!crop) return;
    const scale = coverScale(crop.image) * crop.zoom;
    const canvas = document.createElement("canvas");
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.drawImage(crop.image, -crop.x / scale, -crop.y / scale, VIEWPORT / scale, VIEWPORT / scale, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
    onChange(canvas.toDataURL("image/png"), crop.fileName);
    setCrop(null);
  };

  const scale = crop ? coverScale(crop.image) * crop.zoom : 1;

  return (
    <div>
      {crop ? (
        <div className="space-y-3">
          <div
            className="relative cursor-move touch-none overflow-hidden rounded-xl bg-zinc-100 ring-1 ring-zinc-200"
            style={{ width: VIEWPORT, height: VIEWPORT }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={() => (dragRef.current = null)}
            onPointerCancel={() => (dragRef.current = null)}
            aria-label="Drag to position the logo"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- local data URL being cropped */}
            <img
              src={crop.src}
              alt="Logo being cropped"
              draggable={false}
              className="pointer-events-none absolute left-0 top-0 max-w-none select-none"
              style={{
                width: crop.image.naturalWidth * scale,
                height: crop.image.naturalHeight * scale,
                transform: `translate(${crop.x}px, ${crop.y}px)`,
              }}
            />
          </div>
          <label className="flex max-w-[240px] items-center gap-3 text-xs text-zinc-600">
            Zoom
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={crop.zoom}
              onChange={(event) => setZoom(Number(event.target.value))}
              className="flex-1"
            />
          </label>
          <div className="flex gap-2">
            <button type="button" onClick={applyCrop} className="rounded-lg bg-[#000F24] px-3 py-1.5 text-xs font-semibold text-white hover:bg-zinc-800">
              Apply crop
            </button>
            <button type="button" onClick={() => setCrop(null)} className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium hover:bg-zinc-50">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-xl border border-dashed border-zinc-300 bg-zinc-50">
            {value ? (
              // eslint-disable-next-line @next/next/no-img-element -- preview may be a local data URL
              <img src={value} alt="Current logo" className="h-full w-full object-contain" />
            ) : (
              <ImageUp className="h-6 w-6 text-zinc-400" aria-hidden="true" />
            )}
          </div>
          <div className="space-y-2">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium hover:bg-zinc-50"
              >
                {value ? "Replace logo" : "Upload logo"}
              </button>
              {value && (
                <button
                  type="button"
                  onClick={() => onChange(null)}
                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Remove
                </button>
              )}
            </div>
            <p className="text-xs text-zinc-500">PNG or SVG, up to 1 MB. PNGs can be cropped to a square.</p>
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        className="sr-only"
        tabIndex={-1}
        aria-label="Logo file"
        onChange={(event) => {
          void handleFile(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
      {error && (
        <p role="alert" className="mt-2 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
