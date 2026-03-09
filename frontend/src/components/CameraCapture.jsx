import { useRef, useState } from "react";

export default function CameraCapture({ onCapture }) {
  const fileRef = useRef();
  const [preview, setPreview] = useState(null);

  function handleFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setPreview(URL.createObjectURL(f));
    onCapture(f);
  }

  return (
    <div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFile}
        style={{ display: "none" }}
      />
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <button onClick={() => fileRef.current?.click()}>Ajouter un selfie</button>
        {preview && <img src={preview} alt="preview" style={{ width: "100%", borderRadius: 6 }} />}
      </div>
    </div>
  );
}
