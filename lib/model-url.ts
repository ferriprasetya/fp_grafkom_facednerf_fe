export type ModelFormat = "ply" | "glb" | "unknown";

export function getModelFormat(url: string | null | undefined): ModelFormat {
  if (!url) return "unknown";
  const cleanUrl = url.split("?")[0].split("#")[0];
  const ext = cleanUrl.split(".").pop()?.toLowerCase();
  if (ext === "ply") return "ply";
  if (ext === "glb" || ext === "gltf") return "glb";
  return "unknown";
}
