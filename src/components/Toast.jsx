export default function Toast({ toast }) {
  if (!toast) return null;

  return (
    <div style={{
      position: "fixed",
      top: 22,
      right: 22,
      zIndex: 9999,
      background: toast.type === "err" ? "var(--rose)" : "var(--ink)",
      color: "#fff",
      padding: "11px 20px",
      borderRadius: 10,
      fontSize: 14,
      fontWeight: 500,
      boxShadow: "var(--shadow-lg)",
      animation: "slideRight .3s ease"
    }}>
      {toast.type === "err" ? "⚠ " : "✓ "}{toast.msg}
    </div>
  );
}
