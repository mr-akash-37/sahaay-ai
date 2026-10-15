"use client";

// Last-resort error page. It replaces the root layout, so it carries its own
// minimal inline styles and shows the message in all three languages.
export default function GlobalError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#FAFAF7",
          color: "#1A1A1A",
          fontFamily: "system-ui, sans-serif",
          padding: 16,
          textAlign: "center",
        }}
      >
        <title>Sahaay AI</title>
        <div style={{ maxWidth: 420 }}>
          <h1 style={{ fontSize: 24, marginBottom: 8 }}>Something went wrong</h1>
          <p lang="kn" style={{ margin: "4px 0" }}>ಏನೋ ತಪ್ಪಾಗಿದೆ</p>
          <p lang="hi" style={{ margin: "4px 0 24px" }}>कुछ गड़बड़ हो गई</p>
          <button
            type="button"
            onClick={() => retry()}
            style={{
              background: "#0F4C81",
              color: "#fff",
              border: 0,
              borderRadius: 12,
              padding: "12px 24px",
              fontSize: 16,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Try again · ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ · फिर से कोशिश करें
          </button>
        </div>
      </body>
    </html>
  );
}
