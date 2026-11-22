# PIKIRKALA STUDIO 1.0

PWA lokal untuk mengelola proyek dokumenter, naskah, adegan, prompt batch Google Flow Agent, dan status QC.

## Fitur versi 1.0
- Dashboard dan beberapa proyek.
- Penyimpanan lokal browser (`localStorage`).
- Input naskah dan daftar adegan (satu baris satu adegan).
- Penomoran SHOT_001, SHOT_002, dan seterusnya.
- Edit deskripsi dan status adegan.
- Pembagian batch 10 atau 20 adegan.
- Penyusun instruksi Google Flow Agent per batch.
- Salin instruksi, ekspor/impor JSON.
- PWA dengan service worker untuk penggunaan setelah pernah dibuka online.

## Cara menjalankan lokal
Buka `index.html` di browser. Untuk fitur PWA/service worker, jalankan melalui HTTPS atau localhost.

## Deploy gratis ke GitHub Pages
1. Buat repository GitHub baru, misalnya `pikirkala-studio`.
2. Unggah seluruh isi folder ini ke root repository.
3. Buka Settings → Pages.
4. Pada Build and deployment, pilih Deploy from a branch.
5. Pilih branch `main` dan folder `/ (root)`, lalu Save.
6. Buka URL Pages yang diberikan GitHub. Di Android Chrome/Opera, gunakan menu browser → Add to Home screen / Install app jika tersedia.

## Catatan penting
- Aplikasi tidak mengirim prompt langsung ke Google Flow. Salin instruksi dari Batch Flow lalu tempel ke Flow Agent secara manual.
- Aplikasi tidak mengunduh atau mengimpor gambar Flow secara otomatis pada versi ini.
- Data tersimpan di browser/perangkat yang sama. Ekspor JSON secara berkala untuk cadangan.
- Font Google mungkin membutuhkan koneksi internet; aplikasi tetap berfungsi jika font tidak termuat.
