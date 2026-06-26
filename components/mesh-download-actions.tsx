"use client";

import { useState } from "react";
import { Camera, Download, FileArchive } from "lucide-react";
import { Mesh, MeshStandardMaterial } from "three";
import { Button, buttonVariants } from "@/components/ui/button";
import { loadPlyGeometry } from "@/lib/mesh-analysis";
import { getModelFormat } from "@/lib/model-url";
import { cn } from "@/lib/utils";

interface MeshDownloadActionsProps {
  modelUrl: string;
  filenameStem: string;
  getCanvas?: () => HTMLCanvasElement | null;
}

export function MeshDownloadActions({
  modelUrl,
  filenameStem,
  getCanvas,
}: MeshDownloadActionsProps) {
  const [busy, setBusy] = useState<"obj" | "glb" | null>(null);
  const canExport = getModelFormat(modelUrl) === "ply";

  async function exportObj() {
    if (!canExport) return;
    setBusy("obj");
    try {
      const [{ OBJExporter }, { geometry }] = await Promise.all([
        import("three/examples/jsm/exporters/OBJExporter.js"),
        loadPlyGeometry(modelUrl),
      ]);
      geometry.computeVertexNormals();
      const mesh = new Mesh(
        geometry,
        new MeshStandardMaterial({ vertexColors: geometry.hasAttribute("color") }),
      );
      const text = new OBJExporter().parse(mesh);
      downloadBlob(text, `${filenameStem}.obj`, "text/plain");
      geometry.dispose();
    } finally {
      setBusy(null);
    }
  }

  async function exportGlb() {
    if (!canExport) return;
    setBusy("glb");
    try {
      const [{ GLTFExporter }, { geometry }] = await Promise.all([
        import("three/examples/jsm/exporters/GLTFExporter.js"),
        loadPlyGeometry(modelUrl),
      ]);
      geometry.computeVertexNormals();
      const mesh = new Mesh(
        geometry,
        new MeshStandardMaterial({ vertexColors: geometry.hasAttribute("color") }),
      );
      const exporter = new GLTFExporter();
      const result = await new Promise<ArrayBuffer>((resolve, reject) => {
        exporter.parse(
          mesh,
          (payload) => {
            if (payload instanceof ArrayBuffer) resolve(payload);
            else resolve(new TextEncoder().encode(JSON.stringify(payload)).buffer);
          },
          reject,
          { binary: true },
        );
      });
      downloadBlob(result, `${filenameStem}.glb`, "model/gltf-binary");
      geometry.dispose();
    } finally {
      setBusy(null);
    }
  }

  function screenshot() {
    const canvas = getCanvas?.();
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${filenameStem}.png`;
    anchor.click();
  }

  return (
    <div className='flex flex-wrap gap-1.5'>
      <a
        className={cn(buttonVariants({ size: "sm", variant: "outline" }))}
        href={modelUrl}
        download
      >
        <Download />
        PLY
      </a>
      <Button size='sm' variant='outline' disabled={!canExport || busy !== null} onClick={exportObj}>
        <FileArchive />
        {busy === "obj" ? "OBJ..." : "OBJ"}
      </Button>
      <Button size='sm' variant='outline' disabled={!canExport || busy !== null} onClick={exportGlb}>
        <FileArchive />
        {busy === "glb" ? "GLB..." : "GLB"}
      </Button>
      <Button size='sm' variant='outline' onClick={screenshot}>
        <Camera />
        PNG
      </Button>
    </div>
  );
}

function downloadBlob(
  data: BlobPart,
  filename: string,
  type: string,
) {
  const blob = new Blob([data], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
