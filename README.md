# FaceDNeRF vs TripoSR Viewer

Next.js workspace untuk:

1. membandingkan hasil FaceDNeRF dan TripoSR pada dua subjek melalui satu
   viewport aktif;
2. mengunggah foto dan menjalankan inferensi TripoSR melalui Modal;
3. menampilkan dan mengunduh hasil PLY.

## Menjalankan backend

Dari root repository:

```powershell
$env:PYTHONUTF8="1"
modal deploy modal_triposr.py
```

Endpoint deployment saat ini:

```text
https://endercreeper7590--triposr-backend-fastapi-app.modal.run
```

## Environment frontend

Isi `.env`:

```env
NEXT_PUBLIC_TRIPOSR_API_URL=https://endercreeper7590--triposr-backend-fastapi-app.modal.run
```

Jangan tambahkan `/api` pada URL. Frontend menambahkan `/api/generate` dan
`/api/status/{job_id}` secara otomatis.

## Menjalankan frontend

```powershell
npm install
npm run dev
```

Buka `http://localhost:3000`.

## Aset komparasi

Aset statis berada di:

```text
public/comparison/
├── subject-1/
│   ├── input.jpg
│   ├── facednerf.ply
│   └── triposr.ply
└── subject-2/
    ├── input.jpg
    ├── facednerf.ply
    └── triposr.ply
```

Viewer memakai PLY web-optimized sekitar 15.000 vertex. File PLY asli tetap
tersedia melalui tombol download di `public/comparison-original`.

Regenerasi aset ringan setelah mengganti file asli:

```powershell
npm run optimize:meshes
```

Notes:

- Jangan menaruh mesh mentah langsung di `public/comparison`; simpan di
  `public/comparison-original`, lalu jalankan optimizer.
- Optimizer memakai vertex clustering dan mempertahankan vertex color.
- Versi ringan dipakai untuk viewer saja. Evaluasi metrik geometri harus memakai
  file asli.
- Canvas memakai `frameloop="demand"`, DPR maksimal `1.5`, dan shadow dimatikan.
- Halaman comparison hanya memuat satu metode pada satu waktu untuk mengurangi
  parsing PLY dan penggunaan WebGL.
- Preview input diperkecil ke lebar 900 px; foto sumber tetap berada di folder
  `../img`.

## Catatan Windows/OneDrive

`npx tsc --noEmit` berhasil. Pada workspace OneDrive ini, `next build` dapat
gagal dengan `EPERM` ketika OneDrive mengunci rename file pada direktori
`.next`. Pause sinkronisasi OneDrive atau salin project ke folder non-OneDrive
sebelum menjalankan production build.

## Graphics Lab

Tab `Graphics Lab` menerima:

- empat mesh preset dari halaman comparison;
- hasil TripoSR yang dibuat pada sesi browser aktif;
- file PLY lokal melalui click-to-upload atau drag-and-drop.

Fitur:

- NPR: vertex color, toon shading, normal, depth, curvature heatmap, wireframe;
- vertex selection: raycasting, brush radius, highlight vertex, selected count;
- sculpting: grab, inflate, deflate, local smoothing;
- geometry processing: global Laplacian smoothing, normal displacement,
  simplification 20%, recompute normals;
- history: maksimal delapan snapshot untuk undo, reset ke mesh awal;
- export: PLY binary dengan posisi, normal, warna, dan face hasil edit.

Notes:

- Gunakan mesh sekitar 15K vertex. Mesh mentah 200K vertex akan membuat sculpting
  dan curvature calculation berat.
- `Select` membiarkan orbit camera aktif. Tool sculpt mengunci orbit saat dipakai.
- Curvature adalah visualisasi diskret berdasarkan perbedaan normal vertex dengan
  tetangganya, bukan estimasi kurvatur diferensial presisi tinggi.
- `Reduce 20%` mengubah topologi. Undo dapat mengembalikan snapshot sebelumnya.
- Hasil inferensi hanya tersimpan di library selama tab browser masih hidup.
- Export dilakukan di browser dan tidak mengubah file preset di server.
- Upload PLY lokal dibatasi 50 MB. File tidak diunggah ke server dan hanya
  diproses dalam browser pengguna.

## Deployment performance

Production deployment biasanya lebih lancar daripada `next dev` karena route,
React, dan Three.js sudah dikompilasi. Kualitas render dan geometri tidak berubah
selama file PLY serta pengaturan Canvas yang digunakan sama.

Rekomendasi:

- deploy dari folder non-OneDrive agar `next build` tidak terkena lock `EPERM`;
- gunakan Node.js 20 atau 22;
- pastikan platform mendukung file statis PLY sekitar 0,8 MB per preset;
- aset comparison memakai cache satu tahun dengan `immutable`;
- endpoint Modal harus tetap memakai HTTPS dan CORS;
- jangan mengaktifkan image/mesh compression yang mengubah isi PLY pada CDN.

Upload PLY pengguna tidak dipengaruhi CDN karena dibaca langsung melalui
`URL.createObjectURL()` di browser. Kecepatannya bergantung pada ukuran mesh dan
perangkat pengguna, bukan koneksi internet.
