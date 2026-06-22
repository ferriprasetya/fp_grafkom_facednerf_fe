# FaceDNeRF 3D Interactive Viewer

Interactive web interface for visualizing and manipulating 3D face reconstructions based on text-guided Neural Radiance Fields (NeRF) in real-time. This frontend interacts with an external backend API to retrieve generated 3D assets (`.ply` or `.glb`) and renders them interactively using WebGL.

---

## 🚀 Getting Started

### 1. Prerequisites

Ensure you have the following installed:

- **Node.js** (v18 or higher) or **Bun** (v1.0 or higher)

### 2. Environment Setup

Create a `.env` file in the root of the project using `.env.example` as a template:

```bash
cp .env.example .env
```

Inside `.env`, configure the URL pointing to the external FaceDNeRF API:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 3. Installation

Install the frontend package dependencies:

```bash
# Using npm
npm install

# Using Bun
bun install
```

### 4. Running the Development Server

Start the Next.js development server locally:

```bash
# Using npm
npm run dev

# Using Bun
bun dev
```

Open [http://localhost:3000](http://localhost:3000) in your web browser to view the application workspace.

---

## 🔌 API Integration Contract

Since the backend processing pipeline resides in an external repository, the frontend communicates with it asynchronously using the following API endpoints:

### 1. Submit Reconstruction Job

Uploads the input face image along with a text prompt to initiate the 3D generation.

- **Endpoint:** `POST /generate`
- **Content-Type:** `multipart/form-data`
- **Request Parameters:**
  - `image`: Binary file (the target face image)
  - `prompt`: String (semantic textual description, e.g., "Smiling face", "Age 50")
- **Expected Success Response (`200 OK`):**
  ```json
  {
    "job_id": "c7a9f242-b918-4d56-a321-ee88274fda12"
  }
  ```

### 2. Poll Job Status

Retrieves the real-time processing status of the requested job. The frontend polls this endpoint every 2 seconds (`POLL_INTERVAL_MS = 2000`) until it receives either a `COMPLETED` or `FAILED` status.

- **Endpoint:** `GET /status/{job_id}`
- **Expected Success Response (`200 OK`):**
  ```json
  {
    "job_id": "c7a9f242-b918-4d56-a321-ee88274fda12",
    "status": "QUEUED | PROCESSING | COMPLETED | FAILED",
    "ply_url": "http://localhost:8000/outputs/result.ply", // Optional, present when COMPLETED
    "glb_url": "http://localhost:8000/outputs/result.glb", // Optional, present when COMPLETED
    "error": "Error details if processing failed", // Optional, present when FAILED
    "progress": 55, // Optional, integer 0-100
    "message": "Running NeRF inference..." // Optional progress details
  }
  ```

---

## 🛠️ Architecture & WBS Implementation

The application architecture maps directly to the project's **Work Breakdown Structure (WBS)** tasks, leveraging React Three Fiber (R3F) and modern React state patterns:

### 1. Workspace Layout (`app/page.tsx` — Task 2)

- Implements a responsive **Split-Pane Layout**.
- **Left Panel (Control Panel):** Coordinates image uploads, text-based modification prompts, job status trackers, gallery navigation, and viewport parameters.
- **Right Panel (Viewport Canvas):** Allocates full viewport space for WebGL rendering, centering focus on the 3D reconstructed face mesh.

### 2. Pipeline & Polling (`src/services/api.ts`, `src/hooks/useFaceReconstruction.ts` — Task 3)

- Handles the asynchronous generation lifecycle:
  1. `POST /generate` uploads the source image file and text prompt, obtaining a unique `job_id`.
  2. Polling loop queries `GET /status/{job_id}` at configured intervals (`POLL_INTERVAL_MS = 2000`).
  3. Seamless transitions between status states (`QUEUED` ➔ `PROCESSING` ➔ `COMPLETED`/`FAILED`), dynamically reporting progress percentage and status messages.

### 3. Dynamic Demo Gallery (`components/demo-gallery.tsx`, `src/hooks/useGallery.ts` — Task 4)

- Automatically captures completed jobs into a lightweight, local workspace gallery cache.
- Allows the user to select and instantly re-render previously reconstructed face models for quick visual comparisons.

### 4. 3D Canvas & Error Boundary (`components/scene-canvas.tsx`, `components/canvas-error-boundary.tsx` — Task 5 & 10)

- Configures `@react-three/fiber` `<Canvas>` with custom viewport defaults: `PerspectiveCamera` (FOV: 45, Position: [0, 0, 4]) and smooth camera orbital movement via `OrbitControls`.
- Implements `<CanvasErrorBoundary>` wrapping WebGL components to gracefully intercept runtime context losses or mesh decode exceptions without breaking the host application page structure.
- Dynamically routes files to separate loader/rendering nodes (`PLYMesh` or `GLBMesh`) depending on the format returned by the backend.

### 5. Mesh & Material Optimization (`components/ply-mesh.tsx` — Task 6 & 8)

- Loads 3D point cloud geometries asynchronously using Three.js `PLYLoader`.
- **Normals Computation:** Invokes `geometry.computeVertexNormals()` immediately after parsing the file to resolve flat shading artifacts caused by raw NeRF Marching Cubes outputs.
- **Scale Normalization:** Dynamically centers geometry coordinates and scales models to uniform sizes so they always fit perfectly within the default viewport.
- **Material Modes:**
  - _Vertex Colors (Original):_ Uses `MeshStandardMaterial` with `vertexColors={true}` to extract baked RGB color attributes directly from vertex metadata.
  - _Skin Tone:_ Switches to `MeshPhongMaterial` with a simulated skin base color (`#e8b89a`) and soft specular highlights to inspect details independent of texture colors.

### 6. Interactive Relighting (`components/mouse-point-light.tsx` — Task 7)

- Houses a dynamic `pointLight` within the scene.
- Hooks into `@react-three/fiber` `useFrame` to capture cursor movements in Normalized Device Coordinates (NDC) range `[-1, 1]`, dynamically repositioning the light source in 3D space to simulate live interactive relighting.

### 7. Post-Processing Outline (`components/scene-canvas.tsx` — Task 8 & 9)

- Integrates `@react-three/postprocessing` to compose real-time shader passes.
- Provides a **Wireframe** toggle mapping directly to material configuration.
- Provides an **Outline** shader effect (`<Outline>`) targeted at the active mesh bounding area, rendering crisp structural edges on demand without impacting base geometry pass performance.

---

