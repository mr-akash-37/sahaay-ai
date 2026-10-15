import { ImageResponse } from "next/og";
import { BRAND_BLUE, HANDSHAKE_PATHS } from "@/components/layout/logo-paths";

const SIZES = [192, 512] as const;

export function generateStaticParams() {
  return SIZES.map((size) => ({ size: String(size) }));
}

/**
 * PNG app icons for the PWA manifest: the Sahaay handshake on brand blue.
 * Full-bleed with the mark inside the central 60%, so it also works as "maskable".
 */
export async function GET(_request: Request, { params }: { params: Promise<{ size: string }> }) {
  const requested = Number((await params).size);
  const size = (SIZES as readonly number[]).includes(requested) ? requested : 192;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: BRAND_BLUE,
        }}
      >
        <svg
          width={size * 0.58}
          height={size * 0.58}
          viewBox="0 0 24 24"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {HANDSHAKE_PATHS.map((d) => (
            <path key={d} d={d} />
          ))}
        </svg>
      </div>
    ),
    { width: size, height: size },
  );
}
