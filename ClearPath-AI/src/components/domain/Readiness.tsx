export function Readiness({ value }: { value: number }) {
  return (
    <div className="readiness">
      <div className="readiness-track">
        <span style={{ width: `${value}%` }} />
      </div>
      <b>{value}%</b>
    </div>
  );
}
