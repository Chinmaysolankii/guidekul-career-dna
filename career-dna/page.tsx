export const metadata = {
  title: "Guidekul Career DNA",
  description:
    "Explore careers for Indian students with Guidekul's Career DNA tool.",
};

/**
 * Embeds the standalone Career DNA tool (served as a static file from
 * /public/tools) in a full-viewport, borderless iframe. The tool talks to the
 * Gemini-backed /api/ai route on its own.
 */
export default function CareerDnaPage() {
  return (
    <iframe
      src="/tools/career-desert-mvp2.html"
      title="Guidekul Career DNA"
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        border: "none",
      }}
    />
  );
}
