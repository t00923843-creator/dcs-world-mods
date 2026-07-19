export function VerifiedBadge({ size = 16 }: { size?: number }) {
  return (
    <span
      title="Verified Developer"
      aria-label="Verified Developer"
      className="inline-flex shrink-0 items-center"
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M12 1.5l2.6 2.2 3.4-.4 1 3.3 3 1.7-1.4 3.1L22 14.5l-2.8 2 .2 3.4-3.4.5-1.9 2.9L12 21.9l-2.1 1.4-1.9-2.9-3.4-.5.2-3.4-2.8-2 1.4-3.1L2 8.3l3-1.7 1-3.3 3.4.4L12 1.5z"
          fill="#3b82f6"
        />
        <path
          d="M8.5 12.2l2.3 2.3 4.7-4.8"
          stroke="#fff"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
