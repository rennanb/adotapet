import { useRef, useState } from "react";
import { Copy, Download, ExternalLink, Printer, QrCode as QrIcon } from "lucide-react";
import { Link } from "react-router";
import { QRCodeCanvas, QRCodeSVG } from "qrcode.react";
import { petObjectPosition, type Pet } from "../mocks";
import { Badge, Button, StatusBadge, TagCard } from "./ui";

export function PetCard({ pet, compact = false }: { pet: Pet; compact?: boolean }) {
  return (
    <Link to={`/pet/${pet.slug}`} className={`pet-card ${compact ? "compact" : ""}`}>
      <div className="pet-photo duotone">
        <img
          src={pet.image}
          alt={`${pet.name}, ${pet.species.toLowerCase()} para adoção`}
          style={{ objectPosition: petObjectPosition(pet) }}
        />
      </div>
      <div className="pet-card-body">
        <div className="row-between">
          <h3>{pet.name}</h3>
          <StatusBadge status={pet.status} />
        </div>
        <p>
          {pet.species} · {pet.sex} · {pet.size} · {pet.age}
        </p>
      </div>
    </Link>
  );
}

export function QrCard({
  petName,
  ongName = "Amigos de Patas",
  url,
}: {
  petName?: string;
  ongName?: string;
  url: string;
}) {
  return (
    <TagCard className="qr-card">
      <span className="qr-label">
        <QrIcon size={18} />
        AdotaPet
      </span>
      {!petName && <div className="ong-qr-logo">AP</div>}
      <div className="qr-wrap">
        <QRCodeSVG
          value={url}
          size={190}
          bgColor="#ffffff"
          fgColor="#101010"
          level="M"
          includeMargin
        />
      </div>
      <h2>{petName || "Conheça nossos pets"}</h2>
      <p>{ongName}</p>
      <Badge tone="amber">Aponte a câmera</Badge>
    </TagCard>
  );
}

type QrActionProps =
  | { context: "pet"; pet: Pet; url: string }
  | { context: "ong"; ong: { name: string; slug: string }; url: string };

export function QrActions(props: QrActionProps) {
  const { url } = props;
  const pet = props.context === "pet" ? props.pet : null;
  const ongData = props.context === "ong" ? props.ong : null;
  const displayName = pet?.name || ongData!.name;
  const filePrefix = pet ? `adotapet-${pet.name.toLowerCase()}` : `adotapet-ong-${ongData!.slug}`;
  const qrRef = useRef<HTMLCanvasElement>(null);
  const svgRef = useRef<HTMLDivElement>(null);
  const [qrSize, setQrSize] = useState(1024);
  const drawCover = (
    context: CanvasRenderingContext2D,
    image: HTMLImageElement,
    x: number,
    y: number,
    width: number,
    height: number,
  ) => {
    const scale = Math.max(width / image.width, height / image.height);
    const sourceWidth = width / scale;
    const sourceHeight = height / scale;
    const sourceX = (image.width - sourceWidth) / 2;
    const focalRatio = pet?.focal === "top" ? 0.2 : pet?.focal === "center" ? 0.5 : 0.3;
    const sourceY = Math.max(0, (image.height - sourceHeight) * focalRatio);
    context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, x, y, width, height);
  };
  const drawWrappedText = (
    context: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number,
    maxLines: number,
  ) => {
    const words = text.split(" ");
    const lines: string[] = [];
    let line = "";
    words.forEach((word) => {
      const test = `${line}${line ? " " : ""}${word}`;
      if (context.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    });
    if (line) lines.push(line);
    lines.slice(0, maxLines).forEach((value, index) => {
      const clipped =
        index === maxLines - 1 && lines.length > maxLines
          ? `${value.replace(/[.,]$/, "")}…`
          : value;
      context.fillText(clipped, x, y + index * lineHeight);
    });
    return y + Math.min(lines.length, maxLines) * lineHeight;
  };
  const downloadPng = async (format: "post" | "story") => {
    const logicalWidth = 1080;
    const logicalHeight = format === "post" ? 1080 : 1920;
    const scale = 2;
    const canvas = document.createElement("canvas");
    canvas.width = logicalWidth * scale;
    canvas.height = logicalHeight * scale;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.scale(scale, scale);
    context.fillStyle = "#fffdf7";
    context.fillRect(0, 0, logicalWidth, logicalHeight);
    await document.fonts.ready;
    context.fillStyle = "#15181e";
    context.font = "700 34px Poppins";
    context.fillText("AdotaPet", 72, 92);
    const photoY = 130;
    const photoHeight = format === "post" ? 500 : 920;
    if (pet) {
      const image = new Image();
      image.crossOrigin = "anonymous";
      image.src = pet.image.replace("auto=format", "fm=webp").replace(/w=\d+/, "w=800");
      await image.decode();
      context.save();
      context.beginPath();
      context.roundRect(56, photoY, logicalWidth - 112, photoHeight, 30);
      context.clip();
      drawCover(context, image, 56, photoY, logicalWidth - 112, photoHeight);
      context.restore();
    } else {
      context.fillStyle = "#fef3c7";
      context.beginPath();
      context.roundRect(56, photoY, logicalWidth - 112, photoHeight, 30);
      context.fill();
      context.fillStyle = "#f59e0b";
      context.font = "700 120px Poppins";
      context.fillText("AP", 120, photoY + photoHeight / 2);
    }
    const contentY = photoY + photoHeight + 54;
    context.fillStyle = "#15181e";
    context.font = "700 48px Poppins";
    context.fillText(displayName, 64, contentY);
    context.font = "500 22px Inter";
    context.fillText(
      pet ? `${pet.species} · ${pet.sex} · ${pet.size} · ${pet.age}` : "Conheça nossos pets",
      64,
      contentY + 46,
    );
    const qr = qrRef.current;
    if (qr) context.drawImage(qr, logicalWidth - 274, contentY - 38, 210, 210);
    if (pet) {
      const description = pet.description || "";
      context.fillStyle = "#15181e";
      context.font = `600 ${format === "story" ? 26 : 20}px Inter`;
      context.fillText(description ? `Sobre o ${pet.name}` : "Ficha do pet", 64, contentY + 96);
      context.fillStyle = "#3f3f46";
      context.font = `400 ${format === "story" ? 26 : 20}px Inter`;
      const textEnd = description
        ? drawWrappedText(
            context,
            description,
            64,
            contentY + 134,
            650,
            format === "story" ? 34 : 27,
            format === "story" ? 4 : 2,
          )
        : drawWrappedText(
            context,
            `${pet.species}, ${pet.sex}, porte ${pet.size.toLowerCase()}, ${pet.age}.`,
            64,
            contentY + 134,
            650,
            format === "story" ? 38 : 30,
            2,
          );
      const chips =
        format === "story" ? ["Brincalhão", "Sociável", "Castrado"] : ["Brincalhão", "Castrado"];
      let chipX = 64;
      chips.forEach((chip) => {
        context.font = "500 17px Inter";
        const chipWidth = context.measureText(chip).width + 30;
        context.fillStyle = "#ffffff";
        context.strokeStyle = "#e7e5df";
        context.beginPath();
        context.roundRect(chipX, textEnd + 16, chipWidth, 38, 9);
        context.fill();
        context.stroke();
        context.fillStyle = "#3f3f46";
        context.fillText(chip, chipX + 15, textEnd + 41);
        chipX += chipWidth + 10;
      });
    }
    context.fillStyle = "#6b7280";
    context.font = "500 18px Inter";
    const footerY = format === "story" ? logicalHeight - 140 : logicalHeight - 72;
    context.fillText(new URL(url).pathname.replace(/^\//, "adotapet.app/"), 64, footerY);
    context.fillStyle = "#15181e";
    context.font = "600 20px Inter";
    context.fillText("Adote, não compre", logicalWidth - 270, footerY);
    const anchor = document.createElement("a");
    anchor.download = `${filePrefix}-${format}.png`;
    anchor.href = canvas.toDataURL("image/png");
    anchor.click();
  };
  const printPoster = () => {
    const previousTitle = document.title;
    document.title = `${filePrefix}-qr.pdf`;
    window.print();
    window.setTimeout(() => {
      document.title = previousTitle;
    }, 500);
  };
  const downloadQrPng = () => {
    const anchor = document.createElement("a");
    anchor.download = `${filePrefix}-qr.png`;
    anchor.href = qrRef.current?.toDataURL("image/png") || "";
    anchor.click();
  };
  const downloadQrSvg = () => {
    const svg = svgRef.current?.querySelector("svg");
    if (!svg) return;
    const blob = new Blob([new XMLSerializer().serializeToString(svg)], {
      type: "image/svg+xml;charset=utf-8",
    });
    const anchor = document.createElement("a");
    anchor.download = `${filePrefix}-qr.svg`;
    anchor.href = URL.createObjectURL(blob);
    anchor.click();
    URL.revokeObjectURL(anchor.href);
  };
  return (
    <>
      <article className="export-preview" aria-label="Prévia da peça de divulgação">
        {pet ? (
          <img src={pet.image} alt="" style={{ objectPosition: petObjectPosition(pet, "hero") }} />
        ) : (
          <div className="ong-export-logo">AP</div>
        )}
        <div>
          <span>Prévia da exportação</span>
          <h3>{displayName}</h3>
          <p>
            {pet ? `${pet.species} · ${pet.sex} · ${pet.size} · ${pet.age}` : "Conheça nossos pets"}
          </p>
          <QRCodeSVG
            value={url}
            size={92}
            includeMargin
            level="M"
            fgColor="#101010"
            bgColor="#ffffff"
          />
        </div>
      </article>
      <div className="qr-raw-controls">
        <label>
          <span>Tamanho do QR code</span>
          <select value={qrSize} onChange={(event) => setQrSize(Number(event.target.value))}>
            <option value={512}>512 pixels</option>
            <option value={1024}>1024 pixels</option>
            <option value={2048}>2048 pixels</option>
          </select>
        </label>
        <div className="qr-link-row">
          <code>{url}</code>
          <Button
            variant="ghost"
            icon={<Copy />}
            onClick={() => navigator.clipboard.writeText(url)}
          >
            Copiar link
          </Button>
        </div>
        <div className="qr-download-row">
          <Button variant="secondary" icon={<Download />} onClick={downloadQrPng}>
            Baixar PNG
          </Button>
          <Button variant="secondary" icon={<Download />} onClick={downloadQrSvg}>
            Baixar SVG
          </Button>
          <Button variant="secondary" icon={<Printer />} onClick={printPoster}>
            Imprimir cartaz
          </Button>
        </div>
      </div>
      <div className="qr-actions">
        <Button icon={<Download />} onClick={printPoster}>
          {pet ? "Baixar cartaz (PDF)" : "Baixar cartaz da ONG"}
        </Button>
        <Button variant="secondary" icon={<Download />} onClick={() => downloadPng("post")}>
          {pet ? "Baixar post (PNG)" : "Baixar post da ONG"}
        </Button>
        <Button variant="secondary" icon={<Download />} onClick={() => downloadPng("story")}>
          {pet ? "Baixar story (PNG)" : "Baixar story da ONG"}
        </Button>
      </div>
      <QRCodeCanvas
        ref={qrRef}
        className="export-qr-source"
        value={url}
        size={qrSize}
        includeMargin
        level="M"
        bgColor="#ffffff"
        fgColor="#101010"
      />
      <div ref={svgRef} className="export-qr-source">
        <QRCodeSVG
          value={url}
          size={qrSize}
          includeMargin
          level="M"
          bgColor="#ffffff"
          fgColor="#101010"
        />
      </div>
      <article className="print-poster">
        <header>
          <QrIcon /> <b>AdotaPet</b>
        </header>
        {pet ? (
          <>
            <img
              src={pet.image}
              alt=""
              style={{ objectPosition: petObjectPosition(pet, "hero") }}
            />
            <h1>{pet.name}</h1>
            <dl>
              <div>
                <dt>Espécie</dt>
                <dd>{pet.species}</dd>
              </div>
              <div>
                <dt>Sexo</dt>
                <dd>{pet.sex}</dd>
              </div>
              <div>
                <dt>Porte</dt>
                <dd>{pet.size}</dd>
              </div>
              <div>
                <dt>Idade</dt>
                <dd>{pet.age}</dd>
              </div>
            </dl>
          </>
        ) : (
          <>
            <div className="print-ong-logo">AP</div>
            <h1>{ongData!.name}</h1>
            <p>Conheça nossos pets disponíveis para adoção.</p>
          </>
        )}
        <QRCodeSVG value={url} size={220} includeMargin level="M" fgColor="#101010" />
        <footer>
          <span>{url}</span>
          <b>Adote, não compre</b>
        </footer>
      </article>
    </>
  );
}

export function PetMiniLink({ pet }: { pet: Pet }) {
  return (
    <Link className="pet-mini" to={`/pet/${pet.slug}`}>
      <img src={pet.image} alt="" style={{ objectPosition: petObjectPosition(pet) }} />
      <span>
        <b>{pet.name}</b>
        <small>
          {pet.species} · {pet.sex} · {pet.size} · {pet.age}
        </small>
        <StatusBadge status={pet.status} />
      </span>
      <ExternalLink size={17} />
    </Link>
  );
}
