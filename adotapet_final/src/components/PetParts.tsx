import { useRef, useState } from "react";
import { Copy, Download, ExternalLink, Printer, QrCode as QrIcon } from "lucide-react";
import { Link } from "react-router";
import { QRCodeCanvas, QRCodeSVG } from "qrcode.react";
import { petObjectPosition, photos, type Pet } from "../mocks";
import { Badge, Button, StatusBadge, TagCard } from "./ui";

export function PetCard({
  pet,
  compact = false,
  nota,
}: {
  pet: Pet;
  compact?: boolean;
  nota?: string;
}) {
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
        {nota && <small className="pet-card-nota">{nota}</small>}
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
  | {
      context: "ong";
      ong: {
        name: string;
        slug: string;
        city?: string | null;
        uf?: string | null;
        about?: string | null;
        logo?: string | null;
        cover?: string | null;
        pets?: number | null;
      };
      url: string;
    };

export function QrActions(props: QrActionProps) {
  const { url } = props;
  const pet = props.context === "pet" ? props.pet : null;
  const ongData = props.context === "ong" ? props.ong : null;
  const displayName = pet?.name || ongData!.name;
  const ongLocal = [ongData?.city, ongData?.uf].filter(Boolean).join(" · ");
  const ongResumo =
    ongData && ongData.pets != null
      ? `${ongData.pets} ${ongData.pets === 1 ? "pet disponível" : "pets disponíveis"}${
          ongLocal ? ` · ${ongLocal}` : ""
        }`
      : ongLocal || "Conheça nossos pets disponíveis";
  const filePrefix = pet ? `adotapet-${pet.name.toLowerCase()}` : `adotapet-ong-${ongData!.slug}`;
  const qrRef = useRef<HTMLCanvasElement>(null);
  const svgRef = useRef<HTMLDivElement>(null);
  const [qrSize, setQrSize] = useState(1024);
  const [aviso, setAviso] = useState<string | null>(null);
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
  const tracoArredondado = (
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
  ) => {
    const r = Math.min(radius, width / 2, height / 2);
    context.beginPath();
    context.moveTo(x + r, y);
    context.lineTo(x + width - r, y);
    context.quadraticCurveTo(x + width, y, x + width, y + r);
    context.lineTo(x + width, y + height - r);
    context.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    context.lineTo(x + r, y + height);
    context.quadraticCurveTo(x, y + height, x, y + height - r);
    context.lineTo(x, y + r);
    context.quadraticCurveTo(x, y, x + r, y);
    context.closePath();
  };
  const carregarImagem = (src: string) =>
    new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.crossOrigin = "anonymous";
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error(`Falha ao carregar a imagem: ${src}`));
      image.src = src;
    });
  const salvarImagem = async (canvas: HTMLCanvasElement, nome: string) => {
    try {
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((resultado) => resolve(resultado), "image/png"),
      );
      if (!blob) throw new Error("Imagem vazia");
      const arquivo = new File([blob], nome, { type: "image/png" });
      const podeCompartilhar =
        typeof navigator.canShare === "function" && navigator.canShare({ files: [arquivo] });
      if (podeCompartilhar) {
        await navigator.share({ files: [arquivo], title: nome });
        setAviso(null);
        return;
      }
      const endereco = URL.createObjectURL(blob);
      const ehIOS =
        /iP(hone|ad|od)/.test(navigator.userAgent) ||
        (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
      if (ehIOS) {
        // O Safari do iPhone ignora o atributo download: abrimos a imagem para salvar pela galeria.
        const janela = window.open(endereco, "_blank");
        setAviso(
          janela
            ? "A imagem abriu em outra aba. Toque e segure para salvar na galeria."
            : "Permita janelas pop-up para abrir a imagem e salvá-la na galeria.",
        );
        return;
      }
      const link = document.createElement("a");
      link.href = endereco;
      link.download = nome;
      link.rel = "noopener";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(endereco), 15000);
      setAviso(null);
    } catch (erro) {
      const cancelado = erro instanceof Error && erro.name === "AbortError";
      if (!cancelado) {
        setAviso("Não foi possível salvar automaticamente neste navegador. Toque e segure a imagem para salvar.");
      }
    }
  };
  const downloadPng = async (format: "post" | "story") => {
    try {
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
      const photoHeight = format === "post" ? 500 : 1080;
      if (pet) {
        const image = await carregarImagem(
          pet.image.replace("auto=format", "fm=webp").replace(/w=\d+/, "w=800"),
        );
        context.save();
        tracoArredondado(context, 56, photoY, logicalWidth - 112, photoHeight, 30);
        context.clip();
        drawCover(context, image, 56, photoY, logicalWidth - 112, photoHeight);
        context.restore();
      } else if (ongData?.cover || photos.caramelo) {
        const cover = await carregarImagem(ongData?.cover ?? photos.caramelo);
        context.save();
        tracoArredondado(context, 56, photoY, logicalWidth - 112, photoHeight, 30);
        context.clip();
        drawCover(context, cover, 56, photoY, logicalWidth - 112, photoHeight);
        const degrad = context.createLinearGradient(0, photoY, 0, photoY + photoHeight);
        degrad.addColorStop(0, "rgba(10, 12, 16, 0.05)");
        degrad.addColorStop(1, "rgba(10, 12, 16, 0.55)");
        context.fillStyle = degrad;
        context.fillRect(56, photoY, logicalWidth - 112, photoHeight);
        context.restore();
      } else {
        context.fillStyle = "#fdf1d6";
        tracoArredondado(context, 56, photoY, logicalWidth - 112, photoHeight, 30);
        context.fill();
        context.fillStyle = "#f59e0b";
        context.font = "700 120px Poppins";
        context.fillText("AdotaPet", 120, photoY + photoHeight / 2);
      }

      if (!pet && ongData) {
        if (ongData.logo) {
          const logo = await carregarImagem(ongData.logo);
          context.save();
          context.beginPath();
          context.arc(150, photoY + photoHeight - 96, 62, 0, Math.PI * 2);
          context.closePath();
          context.clip();
          context.fillStyle = "#ffffff";
          context.fillRect(88, photoY + photoHeight - 158, 124, 124);
          context.drawImage(logo, 88, photoY + photoHeight - 158, 124, 124);
          context.restore();
          context.beginPath();
          context.arc(150, photoY + photoHeight - 96, 62, 0, Math.PI * 2);
          context.strokeStyle = "#ffffff";
          context.lineWidth = 5;
          context.stroke();
        }
      }
      const contentY = photoY + photoHeight + (format === "story" ? 120 : 82);
      context.fillStyle = "#15181e";
      context.font = "700 48px Poppins";
      context.fillText(displayName, 64, contentY);
      context.font = "500 22px Inter";
      context.fillText(
        pet ? `${pet.species} · ${pet.sex} · ${pet.size} · ${pet.age}` : ongResumo,
        64,
        contentY + 46,
      );
      const qr = qrRef.current;
      const qrLado = format === "story" ? 210 : 170;
      if (qr) context.drawImage(qr, logicalWidth - 64 - qrLado, contentY - 46, qrLado, qrLado);
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
              620,
              format === "story" ? 34 : 27,
              format === "story" ? 4 : 2,
            )
          : drawWrappedText(
              context,
              `${pet.species}, ${pet.sex}, porte ${pet.size.toLowerCase()}, ${pet.age}.`,
              64,
              contentY + 134,
              620,
              format === "story" ? 38 : 30,
              2,
            );
        const chips = (pet.temperament ?? []).slice(0, format === "story" ? 3 : 2);
        let chipX = 64;
        let chipY = textEnd + 22;
        chips.forEach((chip) => {
          context.font = "600 18px Inter";
          const chipWidth = Math.min(context.measureText(chip).width + 42, 320);
          if (chipX + chipWidth > logicalWidth - 64) {
            chipX = 64;
            chipY += 56;
          }
          context.fillStyle = "#f1f2f4";
          tracoArredondado(context, chipX, chipY, chipWidth, 44, 22);
          context.fill();
          context.fillStyle = "#3f3f46";
          context.fillText(chip, chipX + 21, chipY + 29);
          chipX += chipWidth + 12;
        });
      } else {
        const sobre = (ongData?.about || "").trim();
        context.fillStyle = "#15181e";
        context.font = `600 ${format === "story" ? 26 : 20}px Inter`;
        context.fillText(sobre ? "Sobre a ONG" : "Adote com responsabilidade", 64, contentY + 96);
        context.fillStyle = "#3f3f46";
        context.font = `400 ${format === "story" ? 25 : 19}px Inter`;
        const fimTexto = drawWrappedText(
          context,
          sobre ||
            "Somos uma ONG de proteção animal. Escaneie o QR para conhecer todos os pets disponíveis e iniciar uma adoção responsável.",
          64,
          contentY + 134,
          620,
          format === "story" ? 33 : 26,
          format === "story" ? 4 : 3,
        );
        const chipsOng = [
          ongData?.city || "Proteção animal",
          ongData?.pets != null
            ? `${ongData.pets} ${ongData.pets === 1 ? "pet" : "pets"}`
            : "Adoção responsável",
        ];
        let chipX = 64;
        let chipY = fimTexto + 22;
        chipsOng.forEach((chip) => {
          context.font = "600 18px Inter";
          const largura = Math.min(context.measureText(chip).width + 42, 320);
          if (chipX + largura > logicalWidth - 64) {
            chipX = 64;
            chipY += 56;
          }
          context.fillStyle = "#f1f2f4";
          tracoArredondado(context, chipX, chipY, largura, 44, 22);
          context.fill();
          context.fillStyle = "#3f3f46";
          context.fillText(chip, chipX + 21, chipY + 29);
          chipX += largura + 12;
        });
      }
      context.fillStyle = "#6b7280";
      context.font = "500 18px Inter";
      const footerY = format === "story" ? logicalHeight - 140 : logicalHeight - 72;
      const printedUrl = (() => {
        try {
          const parsed = new URL(url);
          return `${parsed.host}${parsed.pathname}`;
        } catch {
          return url.replace(/^https?:\/\//, "");
        }
      })();
      context.fillText(printedUrl, 64, footerY);
      context.fillStyle = "#15181e";
      context.font = "600 20px Inter";
      context.fillText("Adote, não compre", logicalWidth - 270, footerY);
      await salvarImagem(canvas, `${filePrefix}-${format}.png`);
    } catch (erro) {
      console.error(erro);
      setAviso("Não foi possível gerar a imagem agora. Tente novamente em instantes.");
    }
  };
  const printPoster = () => {
    const previousTitle = document.title;
    document.title = `${filePrefix}-qr.pdf`;
    window.print();
    window.setTimeout(() => {
      document.title = previousTitle;
    }, 500);
  };
  const downloadQrPng = async () => {
    const canvas = qrRef.current;
    if (!canvas) return;
    await salvarImagem(canvas, `${filePrefix}-qr.png`);
  };
  const downloadQrSvg = () => {
    const svg = svgRef.current?.querySelector("svg");
    if (!svg) return;
    const blob = new Blob([new XMLSerializer().serializeToString(svg)], {
      type: "image/svg+xml;charset=utf-8",
    });
    const endereco = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.download = `${filePrefix}-qr.svg`;
    anchor.href = endereco;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(endereco), 15000);
  };
  return (
    <>
      <article
        className={`export-preview${pet ? "" : " ong-preview"}`}
        aria-label="Prévia da peça de divulgação"
      >
        {pet ? (
          <img src={pet.image} alt="" style={{ objectPosition: petObjectPosition(pet, "hero") }} />
        ) : (
          <div className="ong-export-logo ong-preview-empty">
            {ongData?.cover ? <img src={ongData.cover} alt="" /> : (
              <>
                <QrIcon />
                <span>AdotaPet</span>
              </>
            )}
            {ongData?.logo && <img className="ong-preview-avatar" src={ongData.logo} alt="" />}
          </div>
        )}
        <div>
          <span>Prévia da exportação</span>
          <h3>{displayName}</h3>
          <p>{pet ? `${pet.species} · ${pet.sex} · ${pet.size} · ${pet.age}` : ongResumo}</p>

        </div>
      </article>
      <details className="qr-more">
        <summary>Mais opções do QR (PNG, SVG e tamanho)</summary>
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
      </details>
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
      {aviso && (
        <p className="export-aviso" role="status">
          {aviso}
        </p>
      )}
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
            <div className="print-title">
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
            </div>
            {(pet.description || (pet.temperament && pet.temperament.length > 0)) && (
              <div className="print-extra">
                {pet.description && <p>{pet.description}</p>}
                {pet.temperament && pet.temperament.length > 0 && (
                  <div className="print-chips">
                    {pet.temperament.slice(0, 5).map((marca) => (
                      <span key={marca}>{marca}</span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <>
            {ongData?.cover && <img src={ongData.cover} alt="" />}
            <div className="print-ong-logo">
              {ongData?.logo ? <img src={ongData.logo} alt="" /> : "AP"}
            </div>
            <div className="print-ong-info">
              <h1>{ongData!.name}</h1>
              <p>{ongResumo}</p>
              {ongData?.about && <p className="print-ong-about">{ongData.about}</p>}
            </div>
          </>
        )}
        <div className="print-qr">
          <QRCodeSVG value={url} size={170} includeMargin level="M" fgColor="#101010" />
        </div>
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
