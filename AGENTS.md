# SYSTEM CONTEXT & AGENT RULES

Project: FaceDNeRF 3D Viewer (Frontend Integrator)
Role Context: Senior Frontend Engineer & 3D Web Developer
Goal: Build a Next.js UI to interact with a FastAPI/FaceDNeRF backend, rendering dynamic `.ply` files.

## Next.js: ALWAYS read docs before coding

Before any Next.js work, find and read the relevant doc in `node_modules/next/dist/docs/`. Your training data is outdated — the docs are the source of truth.

## 1. TECH STACK

- Framework: Next.js (App Router), TypeScript.
- Styling: Tailwind CSS v4, shadcn/ui.
- 3D Engine: React Three Fiber (R3F), `@react-three/drei`, Three.js (`three-stdlib`).
- Data Fetching: Fetch API / TanStack Query (focused on polling mechanisms).

## 2. STRICT CODING CONVENTIONS

- Component Priority: STRICTLY prioritize using `shadcn/ui` components for all UI elements (e.g., buttons, inputs, cards, progress bars). Do NOT write manual Tailwind styling for base elements unless constructing layout wrappers or if a specific `shadcn/ui` component is entirely unavailable.
- Clean Code: Write highly readable, idiomatic code. Variable and function names MUST be self-explanatory.
- Commenting Rule: MINIMALIST. Absolutely NO comments on obvious logic.
- Allowed Comments: Use inline comments ONLY for complex 3D math, non-obvious workarounds, or critical API logic.
- Comment Language: ALL code comments MUST be strictly in English.
- External Explanations: If a script requires a detailed breakdown, output it OUTSIDE the code block using bulleted or numbered lists. Do not clutter the code block with tutorials.

## 3. R3F & THREE.JS IMPLEMENTATION RULES

- Container: Wrap all 3D scene elements inside `<Canvas>` and use React `Suspense` for loading states.
- PLY Loading: Use `useLoader(PLYLoader, url)` to dynamically load `.ply` URLs received from the API response.
- Geometry Fix: ALWAYS call `geometry.computeVertexNormals()` immediately after parsing `.ply`. FaceDNeRF mesh outputs often lack proper normals, causing broken shading.
- Material Strict Rule: Use `<meshStandardMaterial vertexColors={true} />`. FaceDNeRF outputs RGB data directly into vertices; it does NOT use external texture maps.
- Interactivity: Implement `<OrbitControls />`. Implement a dynamic `<pointLight />` whose position updates via `useFrame` based on normalized mouse coordinates (real-time relighting).

## 4. ARCHITECTURE & STATE PIPELINE

- UI Layout: Split-pane design. Left column: Input Form & Progress tracking. Right column: R3F Canvas.
- API Flow: `POST` user image & prompt -> Receive `job_id` -> Start interval polling `GET` status -> On `COMPLETED`, extract `.ply` URL -> Trigger R3F render.
- Resilience: Use Error Boundaries around the `<Canvas>` to handle WebGL context loss or corrupted `.ply` downloads without crashing the entire Next.js app.
- Fallback: Ensure components can handle mock API responses smoothly for parallel frontend-backend development.

## 5. AGENT BEHAVIOR & TOOL RESTRICTIONS

- Read STYLES.md to follow the design rules.
- Read WBS.md to follow the work breakdown structure.
- No Web Browsing Checker: STRICTLY PROHIBITED from using browser tools for testing, opening URLs, or fetching live websites to verify UI, but for read documentation is allowed.
- Token Efficiency: Rely completely on your internal knowledge of Next.js/Three.js and the local files provided in the workspace first, if its not enough, read and summarize relevant documentation only (max 3-4 pages for each tool usage).
- Testing Assumption: Assume all visual QA, browser testing, and WebGL rendering verifications will be executed manually by the human developer. Do not attempt to "see" the output.
