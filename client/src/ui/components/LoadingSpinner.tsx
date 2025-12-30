export default function LoadingSpinner({ label }: { label?: string }) {
  return (
    <div className="spinWrap" aria-live="polite" aria-busy="true">
      <div className="spinSanta" aria-hidden>
        <div className="spinRing" />
        <div className="spinHat">
          <div className="spinHatTrim" />
          <div className="spinHatPom" />
        </div>
      </div>
      {label ? <div className="spinLabel">{label}</div> : null}
    </div>
  );
}
