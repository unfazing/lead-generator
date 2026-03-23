type InfoTipProps = {
  content: string;
  label?: string;
};

export function InfoTip({ content, label = "More info" }: InfoTipProps) {
  return (
    <span className="info-tip">
      <button
        aria-label={label}
        className="info-tip-trigger"
        type="button"
      >
        i
      </button>
      <span className="info-tip-bubble" role="tooltip">
        {content}
      </span>
    </span>
  );
}
