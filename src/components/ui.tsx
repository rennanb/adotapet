import {
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { Check, ChevronLeft, LoaderCircle, PawPrint, Upload, X } from "lucide-react";
import { Link } from "react-router";

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className="brand" aria-label="AdotaPet, início">
      <span>
        <PawPrint size={compact ? 18 : 22} />
      </span>
      {!compact && "AdotaPet"}
    </Link>
  );
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  loading?: boolean;
  icon?: ReactNode;
};
export function Button({
  variant = "primary",
  loading,
  icon,
  children,
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button className={`button button-${variant} ${className}`} {...props}>
      {loading ? <LoaderCircle className="spin" size={19} /> : icon}
      {children}
    </button>
  );
}

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
  error?: string;
  icon?: ReactNode;
};
export function TextField({ label, hint, error, icon, className = "", ...props }: FieldProps) {
  return (
    <label className={`field ${error ? "has-error" : ""} ${className}`}>
      <span className="field-label">{label}</span>
      <span className="input-wrap">
        {icon}
        <input
          aria-invalid={!!error}
          aria-describedby={error ? `${props.name}-error` : undefined}
          {...props}
        />
      </span>
      {error ? (
        <span id={`${props.name}-error`} className="field-error" aria-live="polite">
          <X size={14} />
          {error}
        </span>
      ) : (
        hint && <span className="field-hint">{hint}</span>
      )}
    </label>
  );
}

export function TextArea({
  label,
  maxLength = 280,
  hint,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; hint?: string }) {
  const count = String(props.value ?? "").length;
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <textarea maxLength={maxLength} {...props} />
      <span className="field-hint row-between">
        <span>{hint}</span>
        <span>
          {count}/{maxLength}
        </span>
      </span>
    </label>
  );
}

export function Select({
  label,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { label: string; children: ReactNode }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <select {...props}>{children}</select>
    </label>
  );
}

export function CheckField({
  children,
  checked,
  onChange,
  disabled,
}: {
  children: ReactNode;
  checked?: boolean;
  onChange?: () => void;
  disabled?: boolean;
}) {
  return (
    <label className={`check-row ${disabled ? "disabled" : ""}`}>
      <input type="checkbox" checked={checked} onChange={onChange} disabled={disabled} />
      <span className="check-box">{checked && <Check size={16} />}</span>
      <span>{children}</span>
    </label>
  );
}

export function RadioCards({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value?: string;
  onChange?: (v: string) => void;
}) {
  return (
    <fieldset className="field">
      <legend className="field-label">{label}</legend>
      <div className="radio-grid">
        {options.map((o) => (
          <label key={o} className={`radio-card ${value === o ? "selected" : ""}`}>
            <input type="radio" name={label} checked={value === o} onChange={() => onChange?.(o)} />
            <span>{o}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function Switch({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked?: boolean;
  onChange?: () => void;
}) {
  return (
    <label className="switch-row">
      <span>{label}</span>
      <input type="checkbox" checked={checked} onChange={onChange} />
      <span className="switch">
        <i />
      </span>
    </label>
  );
}

export function FileUpload({
  circular = false,
  multiple = false,
}: {
  circular?: boolean;
  multiple?: boolean;
}) {
  return (
    <label className={`file-upload ${circular ? "circular" : ""}`}>
      <input type="file" accept="image/*" multiple={multiple} />
      <Upload size={22} />
      <strong>{multiple ? "Inclua até 5 fotos" : "Incluir logo"}</strong>
      <span>JPG ou PNG · até 5 MB</span>
    </label>
  );
}

export function Badge({
  children,
  tone = "amber",
}: {
  children: ReactNode;
  tone?: "amber" | "green" | "gray" | "red" | "blue";
}) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

export function StatusBadge({ status }: { status: string }) {
  if (status === "adotado") {
    return (
      <span className="status-pill status-adopted">
        <Check size={12} aria-hidden="true" />
        Adotado
      </span>
    );
  }
  const tone =
    status === "disponível" || status === "nova"
      ? "green"
      : status === "em análise" || status === "em processo"
        ? "amber"
        : status.includes("recusada")
          ? "red"
          : "gray";
  const label = status.charAt(0).toUpperCase() + status.slice(1);
  return (
    <span className={`status-pill status-${tone}`}>
      <span className="status-dot" aria-hidden="true" />
      {label}
    </span>
  );
}

export function TagCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`tag-card ${className}`}>{children}</div>;
}

export function Stepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <div className="stepper" aria-label={`Etapa ${current} de ${steps.length}`}>
      <div className="step-dots">
        {steps.map((s, i) => (
          <span
            key={s}
            className={i + 1 < current ? "completed" : i + 1 === current ? "current" : "future"}
          >
            {i + 1 < current ? <Check size={13} /> : i + 1}
          </span>
        ))}
      </div>
    </div>
  );
}

export function BackLink({ to, label = "Voltar" }: { to: string; label?: string }) {
  return (
    <Link to={to} className="back-link" aria-label={label || "Voltar"}>
      <ChevronLeft size={20} />
      {label}
    </Link>
  );
}

export function EmptyState({
  title,
  text,
  action,
  to,
}: {
  title: string;
  text: string;
  action: string;
  to: string;
}) {
  return (
    <div className="empty">
      <span className="empty-icon">
        <PawPrint />
      </span>
      <h3>{title}</h3>
      <p>{text}</p>
      <Link className="button button-primary" to={to}>
        {action}
      </Link>
    </div>
  );
}

export function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="list-skeleton" aria-label="Carregando conteúdo" aria-busy="true">
      {Array.from({ length: count }, (_, index) => (
        <div key={index}>
          <span />
          <p>
            <i />
            <i />
          </p>
        </div>
      ))}
    </div>
  );
}

export function ErrorState({
  title = "Não foi possível carregar",
  text = "Tente novamente. Seus dados não foram alterados.",
}: {
  title?: string;
  text?: string;
}) {
  return (
    <div className="empty error-state" role="alert">
      <span className="empty-icon">
        <X />
      </span>
      <h3>{title}</h3>
      <p>{text}</p>
      <Button variant="secondary" onClick={() => window.location.reload()}>
        Tentar novamente
      </Button>
    </div>
  );
}

export function SectionCard({
  title,
  action,
  children,
  className = "",
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`section-card ${className}`}>
      {title && (
        <div className="section-title">
          <h3>{title}</h3>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
