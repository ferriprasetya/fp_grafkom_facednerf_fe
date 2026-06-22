# WORK BREAKDOWN STRUCTURE: FRONTEND 3D FACE RECONSTRUCTION

**Tujuan:** Membangun antarmuka Next.js interaktif dengan alur pemrosesan dinamis (API integration) untuk demonstrasi model FaceDNeRF tanpa komponen overengineering.

- **Task 1: Setup Proyek Next.js & UI Core Component**
  Inisialisasi repositori dengan Next.js App Router dan konfigurasi Tailwind CSS v4. Pasang komponen esensial dari shadcn/ui (Button, Input, Progress, Card, Toast) sebagai fondasi elemen antarmuka untuk mempercepat penulisan komponen UI layout.

- **Task 2: Pembuatan Layout Split-Pane Workspace**
  Susun tata letak halaman utama (`app/page.tsx`) menjadi dua kolom responsif. Kolom kiri dirancang sebagai panel kontrol (form upload foto wajah, input text prompt, dan tombol trigger), sedangkan kolom kanan dialokasikan penuh sebagai kontainer untuk injeksi viewport 3D canvas.

- **Task 3: Integrasi API Client & Flow Pipeline FastAPI**
  Membangun service handler (`src/services/api.ts`) untuk mengimplementasikan alur integrasi asli: fungsi `POST` untuk mengirim gambar beserta prompt ke FastAPI untuk mendapatkan `job_id`, dan fungsi polling `GET` secara berkala untuk melacak status pemrosesan model hingga selesai.

- **Task 4: Pembuatan Dynamic Demo Gallery Component**
  Rancang komponen galeri yang dikondisikan untuk mengonsumsi data dari endpoint API. Galeri disiapkan secara dinamis untuk membaca payload response, mengekstrak URL file `.ply` hasil generasi, dan langsung mengirimkannya sebagai parameter input ke dalam komponen 3D viewer.

- **Task 5: Integrasi React Three Fiber (R3F) Canvas**
  Instalasi paket `@react-three/fiber` dan `@react-three/drei`. Implementasikan komponen `<Canvas>` di dalam workspace sebelah kanan, dikonfigurasi dengan `PerspectiveCamera` untuk sudut pandang ideal dan `OrbitControls` untuk fitur interaksi rotasi, zoom, serta pemutaran objek wajah.

- **Task 6: Implementasi PLYLoader & Optimalisasi Material**
  Buat sub-komponen mesh yang memanfaatkan hook `useLoader(PLYLoader, url)` untuk memuat file `.ply` dinamis dari API. Eksekusi `geometry.computeVertexNormals()` secara otomatis pasca-load untuk memperbaiki kalkulasi shading, serta aktifkan opsi `vertexColors: true` pada `MeshStandardMaterial`.

- **Task 7: Interaktivitas Real-time Relighting**
  Tambahkan komponen pencahayaan dinamis `PointLight` ke dalam scene R3F. Gunakan hook `useFrame` untuk menangkap koordinat kursor mouse yang telah dinormalisasi di dalam viewport, lalu petakan posisi koordinat lampu mengikuti gerakan mouse secara instan untuk efek shading wajah yang hidup.

- **Task 8: State Management, Polling Simulation & Env Switch**
  Kelola sinkronisasi state UI (Form Input -> Progress Bar -> 3D Render View). Sediakan skrip simulasi mocking status menggunakan `setTimeout` untuk kebutuhan paralel development, dan konfigurasi variabel `process.env.NEXT_PUBLIC_API_URL` agar transisi ke FastAPI asli hanya memerlukan perubahan satu baris environment variable.
