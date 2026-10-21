const CalculatorDisplay = ({ expression, displayValue }) => (
  <div className="mb-3 flex h-28 w-full min-w-0 flex-col items-end justify-end gap-2 pr-2">
    <div
      className="max-w-full overflow-x-auto whitespace-nowrap text-sm text-white/60"
      aria-label="Expression"
    >
      {expression || "\u00a0"}
    </div>
    <output
      aria-live="polite"
      aria-label="Result"
      title={displayValue}
      className="max-w-full overflow-x-auto whitespace-nowrap font-light leading-none tracking-tight text-white tabular-nums"
      style={{
        fontSize: displayValue.length > 12 ? "1.8rem" : displayValue.length > 8 ? "2.5rem" : "4rem",
      }}
    >
      {displayValue}
    </output>
  </div>
);
export default CalculatorDisplay;
