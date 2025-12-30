export default function LoadingSpinner({ label, size = 54 }: { label?: string; size?: number }) {
  return (
    <div className="spinWrap" aria-live="polite" aria-busy="true">
      <div className="spinRingOnly" style={{ width: size, height: size }} aria-hidden />
      {label ? <div className="spinLabel">{label}</div> : null}
    </div>
  );
}
