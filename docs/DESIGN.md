# DESIGN.md — Takluk Design System

Aplikasi mobile video pembelajaran (VOD) micro-learning untuk mahasiswa. Dokumen ini adalah acuan visual dan interaksi untuk prototype Takluk.

**Prinsip:** modern, bersih, ramah, profesional. Setiap elemen interaktif harus bereaksi. Semua gerak halus dan tidak kaku. Materi dan pembayaran dapat dicapai maksimal 3 langkah.

---

## 1. Brand & Logo

- Logo: ikon topi wisuda + tombol play (ungu dan oranye) dengan teks "Takluk" berwarna ungu gelap.
- Dipakai di: splash, onboarding, login/daftar, header Beranda, Tentang.
- Jangan diubah warna, diregangkan, atau diberi efek. Beri ruang kosong di sekeliling logo minimal setinggi ikon topi.
- Di kode: isi konstanta `LOGO_SRC` dengan file logo asli.

## 2. Warna

| Token | Nama | Hex | Pemakaian |
|---|---|---|---|
| `primary` | Ungu | `#462B92` | Tombol utama, tab aktif, ikon, judul aksen |
| `accent` | Golden Orange | `#F89C05` | CTA sekunder, progress, bookmark aktif, badge, highlight |
| `surface` | Putih | `#FFFFFF` | Kartu, sheet, input |
| `ink` | Ungu gelap | `#2A1A5E` | Judul dan teks utama |
| `tint` | Ungu muda | `#EFEAFB` | Chip, tombol sekunder, latar segmented control |
| `tint-warm` | Krem oranye | `#FFF4DE` | Info/pengingat (hitung mundur UTS, bab aktif) |
| `bg` | Latar halaman | `#FAF9FD` | Background semua layar |
| `muted` | Abu teks | `#6B6B80` | Teks sekunder, metadata |
| `line` | Garis | `#E7E4F0` | Border, pemisah |
| `success` | Hijau | `#16A34A` | Pembayaran berhasil, jawaban benar |
| `error` | Merah | `#DC2626` | Validasi, jawaban salah, gagal |

**Gradien utama:** `linear-gradient(135deg, #462B92, #6B47C9)` untuk kartu langganan, profil, dan thumbnail video.

**Aturan:** ungu mendominasi, oranye hanya untuk titik fokus (maksimal 1–2 elemen oranye per layar). Teks di atas ungu/gradien selalu putih. Jangan mengandalkan warna saja untuk menyampaikan status; sertakan ikon atau teks.

## 3. Tipografi

Font: **Poppins** (400, 500, 600, 700). Fallback: `sans-serif`.

| Peran | Ukuran | Berat |
|---|---|---|
| Judul halaman | 20–24 px | 700 |
| Judul bagian | 16–18 px | 700 |
| Judul kartu/video | 14 px | 600 |
| Isi | 14–15 px | 400–500 |
| Tombol | 15 px | 600 |
| Metadata / caption | 11–12 px | 400–500 |

Ukuran isi minimal 14 px (kecuali metadata). Line-height rapat untuk judul (`leading-tight`), normal untuk isi. Bahasa UI: Indonesia, nada ramah, memakai "kamu".

## 4. Layout & Spacing

- Frame: **390 × 844** di desktop (bezel gelap, sudut 44 px); full-screen di mobile.
- Padding halaman: **20 px** (`p-5`). Jarak antar bagian: **20 px**. Jarak antar kartu dalam list: **8 px**.
- Skala spacing: 4 · 8 · 12 · 16 · 20 · 24.
- Area sentuh minimal **44 px**.
- Ruang bawah konten **112 px** agar tidak tertutup tab bar.

## 5. Bentuk, Radius & Bayangan

| Elemen | Radius |
|---|---|
| Kartu besar / hero | 24 px |
| Kartu, input, tombol | 16 px |
| Thumbnail, chip kecil | 12 px |
| Chip, badge, progress | penuh (pill) |
| Bottom sheet | 28 px (sudut atas) |

Bayangan: lembut dan tipis (`shadow-sm`); tombol utama memakai bayangan ungu transparan (`shadow-purple-900/20`). Hindari border tebal; gunakan bayangan dan perbedaan warna latar.

## 6. Ikon & Ilustrasi

- Ikon: **lucide-react**, ukuran 16–20 px (navigasi 20 px), stroke default, warna `primary` atau `muted`.
- Ilustrasi: bentuk geometri + gradien palet. Thumbnail video dibuat dari gradien ungu + simbol mata kuliah (`∫` Kalkulus, `σ` Statistika, `</>` Pemrograman).
- Tidak memakai foto stok atau placeholder gambar rusak.

## 7. Komponen

**Tombol (`B`)**
- Primer: latar ungu, teks putih, bayangan ungu.
- Aksen (`o`): latar oranye, teks putih.
- Sekunder (`s`): latar ungu muda, teks ungu.
- State: tekan → scale 0.96; hover → scale 1.01; disabled → opacity 40%; loading → label berubah ("Memproses…").

**Tombol ikon (`IB`)**: lingkaran 40 px, putih, bayangan tipis, ikon ungu; tekan → scale 0.85.

**Input (`In`)**: label 12 px semibold, border abu; fokus → border ungu + ring ungu 20%; error → border merah + pesan merah di bawah, disertai getar halus pada kasus tertentu (OTP).

**Chip**: pill; aktif = ungu + teks putih, tidak aktif = putih + teks ungu.

**Segmented control**: latar ungu muda, penanda aktif ungu bergerak dengan `layoutId` (login/daftar, tab di player).

**Kartu video (`VRow`)**: thumbnail 96×64 + judul + metadata + ikon bookmark. Ikon gembok di thumbnail jika terkunci. Bookmark aktif: oranye terisi dengan efek "pop".

**Bottom sheet**: muncul dengan spring, handle di atas, bisa di-drag turun untuk menutup, backdrop fade. Maksimal tinggi 80%.

**Toast**: kapsul ungu gelap, 2,2 detik, muncul dari bawah di atas tab bar.

**Tab bar**: 5 tab (Beranda, Jelajah, Arsip, Tersimpan, Profil), ikon + label 11 px. Tab aktif memakai pill ungu muda yang bergerak antar tab.

**Header halaman push**: tombol kembali (IB) + judul 18 px bold.

## 8. Pola Halaman

| Layar | Isi utama |
|---|---|
| Splash | Logo di tengah, 3 cincin berdenyut, 4 titik melayang, progress oranye "Memuat" |
| Onboarding | 3 slide, dot memanjang, tombol Lewati / Lanjut / Mulai |
| Auth | Segmented Masuk/Daftar, form tervalidasi, OTP, akun demo |
| Beranda | Sapaan, search, kartu langganan, hitung mundur UTS, lanjut menonton, mata kuliah, bedah soal populer, banner referral |
| Jelajah | Search, filter chip (mata kuliah, jenis), daftar video, empty state |
| Arsip | Per mata kuliah: soal UTS/UAS + tombol Latihan Soal |
| Tersimpan | Daftar bookmark, empty state dengan CTA |
| Player | Video 16:9 + overlay kontrol, watermark, info, aksi cepat, tab Bab/Catatan |
| Pembayaran | Ringkasan + voucher → QRIS + timer → verifikasi → sukses |
| Profil | Kartu profil + daftar menu (langganan, riwayat, referral, perangkat, bantuan, demo, keluar) |

## 9. Motion

Library: `motion/react`. Gerak harus halus; hanya animasikan `transform` dan `opacity`.

| Situasi | Aturan |
|---|---|
| Transisi halaman push | Masuk dari kanan, spring (stiffness 300, damping 32) |
| Ganti tab | Fade + translate Y 10 px, 200 ms |
| Muncul list/kartu | Stagger 40–70 ms per item |
| Bottom sheet | Spring (stiffness 300, damping 30), drag-to-dismiss |
| Tombol | Tap scale 0.96 |
| Indikator tab/segmented | Shared layout (`layoutId`) |
| Progress | Lebar beranimasi dari 0 |
| Bookmark | Scale 1 → 1.3 → 1 |
| Splash | Cincin pulse 2 detik berurutan, titik melayang 3–5 detik, loop |
| Pembayaran sukses | Centang digambar (`pathLength`), confetti jatuh 2–3 detik |
| Loading konten | Skeleton `animate-pulse`, lalu fade-in |

Durasi umum 200–450 ms. Easing/spring lembut, tanpa gerak memantul berlebihan. Hormati `prefers-reduced-motion` (kurangi animasi) bila ditambahkan lebih lanjut.

## 10. Aturan Interaksi

1. Tidak ada elemen yang tampak bisa diklik tetapi mati. Fitur di luar cakupan prototype tetap memberi respons (toast atau sheet simulasi).
2. Semua form divalidasi dan punya state loading.
3. Tombol kembali selalu berfungsi.
4. Daftar punya empty state dengan aksi.
5. State bersifat global: bookmark, progres, langganan, dan notifikasi tercermin di semua halaman.
6. Jangan memakai localStorage/sessionStorage; cukup state memori. Mode Demo menyediakan reset data.

## 11. Keamanan Konten (tampil di UI)

- Badge "Dilindungi" di player.
- Watermark dinamis berisi Nama • NIM • No. HP, berpindah posisi tiap ±4 detik, opacity rendah.
- Simulasi rekam layar/screenshot: layar hitam + pesan "Perekaman layar terdeteksi & diblokir".
- Device binding: 1 akun = 1 perangkat aktif; pengelolaan di Profil → Perangkat Aktif.
- Video tidak ada tombol unduh.

## 12. Aksesibilitas

- Kontras teks memenuhi standar baca (teks gelap di latar terang, putih di ungu).
- Fokus input terlihat (ring ungu).
- Area sentuh minimal 44 px, status tidak hanya mengandalkan warna.
- Disarankan menambah `aria-label` pada tombol ikon dan mendukung reduced motion pada pengembangan lanjutan.

## 13. Konten & Data Dummy

- Mata kuliah: Kalkulus, Statistika, Pemrograman (semester 1–4).
- Jenis video: Bedah Soal UTS, Bedah Soal UAS, Materi. Durasi 5–10 menit. Satu video gratis per mata kuliah.
- Harga: Rp49.000/bulan. Voucher dummy: `PANAM10` (−Rp10.000), `UINSUSKA` (−Rp5.000). OTP dummy: `123456`.
- Kampus target: UNRI, UIN Suska, PCR, UIR (kawasan Panam, Pekanbaru).
- Pengguna demo: Aisyah Putri • NIM 12250312345 • UIN Suska • Semester 3.

## 14. Ruang Pengembangan Berikutnya

Pull-to-refresh, edit profil, statistik belajar (grafik), grup belajar WhatsApp/Telegram, riwayat pencarian, subtitle, dan mode gelap.
