import { useEffect, useRef, useState } from "react";
import { Image as ImageIcon, Move, X } from "lucide-react";
import { Button } from "./ui";

export type PhotoAdjustment = {
  src: string;
  focalX: number;
  focalY: number;
  zoom: number;
};

export function PhotoAdjuster({
  open,
  title = "Ajustar enquadramento",
  aspect = "4 / 3",
  initial,
  onClose,
  onUse,
}: {
  open: boolean;
  title?: string;
  aspect?: "4 / 3" | "3 / 1" | "1 / 1";
  initial: string;
  onClose: () => void;
  onUse: (adjustment: PhotoAdjustment) => void;
}) {
  const [src, setSrc] = useState(initial);
  const [focalX, setFocalX] = useState(50);
  const [focalY, setFocalY] = useState(30);
  const [zoom, setZoom] = useState(1);
  const dragging = useRef(false);
  useEffect(() => {
    if (open) setSrc(initial);
  }, [initial, open]);
  if (!open) return null;
  const imageStyle = {
    objectPosition: `${focalX}% ${focalY}%`,
    transform: `scale(${zoom})`,
  };
  const moveFromPointer = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    const rect = event.currentTarget.getBoundingClientRect();
    setFocalX(
      Math.round(Math.max(0, Math.min(100, ((event.clientX - rect.left) / rect.width) * 100))),
    );
    setFocalY(
      Math.round(Math.max(0, Math.min(100, ((event.clientY - rect.top) / rect.height) * 100))),
    );
  };
  return (
    <div
      className="photo-adjust-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="photo-adjust-title"
    >
      <div className="photo-adjuster">
        <header>
          <div>
            <span className="eyebrow">Foto do perfil</span>
            <h2 id="photo-adjust-title">{title}</h2>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Fechar">
            <X />
          </button>
        </header>
        <div
          className="photo-adjust-stage"
          style={{ aspectRatio: aspect }}
          onPointerDown={(event) => {
            dragging.current = true;
            event.currentTarget.setPointerCapture(event.pointerId);
            moveFromPointer(event);
          }}
          onPointerMove={moveFromPointer}
          onPointerUp={() => {
            dragging.current = false;
          }}
        >
          <img src={src} alt="Prévia para ajuste" style={imageStyle} />
          <span>
            <Move /> Arraste para reposicionar
          </span>
        </div>
        <label className="zoom-control">
          <span>Zoom {zoom.toFixed(1)}x</span>
          <input
            type="range"
            min="1"
            max="2"
            step="0.1"
            value={zoom}
            onChange={(event) => setZoom(Number(event.target.value))}
          />
        </label>
        <div className="focal-shortcuts" aria-label="Atalhos de enquadramento">
          <button
            onClick={() => {
              setFocalX(50);
              setFocalY(22);
            }}
          >
            Rosto
          </button>
          <button
            onClick={() => {
              setFocalX(50);
              setFocalY(50);
            }}
          >
            Centro
          </button>
          <button
            onClick={() => {
              setFocalX(50);
              setFocalY(65);
            }}
          >
            Corpo inteiro
          </button>
        </div>
        <div className="crop-previews">
          {[
            ["Card 4:3", "card"],
            ["Post 1:1", "post"],
            ["Story 9:16", "story"],
          ].map(([label, kind]) => (
            <figure key={kind} className={kind}>
              <div>
                <img src={src} alt="" style={imageStyle} />
              </div>
              <figcaption>{label}</figcaption>
            </figure>
          ))}
        </div>
        <div className="photo-adjust-actions">
          <label className="button button-secondary">
            <ImageIcon /> Escolher outra
            <input
              type="file"
              accept="image/*"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) setSrc(URL.createObjectURL(file));
              }}
            />
          </label>
          <Button onClick={() => onUse({ src, focalX, focalY, zoom })}>Usar esta foto</Button>
        </div>
      </div>
    </div>
  );
}
