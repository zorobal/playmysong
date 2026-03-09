export default function PlaylistItem({ item, onSelect }) {
  return (
    <li style={{ padding: 10, borderBottom: "1px solid #eee", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div>
        <div style={{ fontWeight: 600 }}>{item.title}</div>
        <div style={{ fontSize: 13, color: "#666" }}>{item.artist}</div>
      </div>
      <div>
        <button onClick={onSelect}>Choisir</button>
      </div>
    </li>
  );
}
