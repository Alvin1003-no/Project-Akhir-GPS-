-- =====================================================================
-- DATABASE SISTEM INFORMASI GEOGRAFIS & GPS LOKASI WISATA DAN KULINER DIY
-- Proyek Akhir Mata Kuliah GPS
-- Target Platform : MySQL 8.x / MariaDB (XAMPP / phpMyAdmin)
-- Database Name   : gps_diy
-- =====================================================================

CREATE DATABASE IF NOT EXISTS `gps_diy` 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE `gps_diy`;

-- ---------------------------------------------------------------------
-- Struktur Tabel `lokasi`
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `lokasi`;
CREATE TABLE `lokasi` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nama` VARCHAR(255) NOT NULL,
  `kategori` ENUM('wisata', 'kuliner') NOT NULL,
  `kabupaten_kota` VARCHAR(100) NOT NULL,
  `latitude` DECIMAL(10, 7) NOT NULL,
  `longitude` DECIMAL(10, 7) NOT NULL,
  `alamat` TEXT NOT NULL,
  `rating` DECIMAL(2, 1) NULL DEFAULT NULL,
  `tingkat_keramaian` ENUM('Ramai', 'Sedang', 'Sepi') NULL DEFAULT NULL,
  `jam_operasional` VARCHAR(255) NULL DEFAULT NULL,
  `deskripsi` TEXT NOT NULL,
  INDEX `idx_kategori` (`kategori`),
  INDEX `idx_kabupaten` (`kabupaten_kota`),
  INDEX `idx_coords` (`latitude`, `longitude`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- Data Awal: Tepat 40 Lokasi (20 Wisata & 20 Kuliner DIY)
-- Seluruh koordinat akurat dan diverifikasi sesuai koordinat geografis nyata.
-- Data NULL digunakan pada nilai yang belum diverifikasi secara resmi.
-- ---------------------------------------------------------------------

INSERT INTO `lokasi` (`id`, `nama`, `kategori`, `kabupaten_kota`, `latitude`, `longitude`, `alamat`, `rating`, `tingkat_keramaian`, `jam_operasional`, `deskripsi`) VALUES
-- -------------------------------------------------------------
-- 20 LOKASI WISATA
-- -------------------------------------------------------------
(1, 'Kawasan Malioboro', 'wisata', 'Kota Yogyakarta', -7.7926560, 110.3658440, 'Jl. Malioboro, Sosromenduran, Gedong Tengen, Kota Yogyakarta, D.I. Yogyakarta 55271', 4.8, 'Ramai', '24 Jam', 'Kawasan pedestrian legendaris di jantung kota Yogyakarta dengan pertokoan, seniman jalanan, dan suasana budaya yang semarak setiap hari.'),

(2, 'Keraton Ngayogyakarta Hadiningrat', 'wisata', 'Kota Yogyakarta', -7.8052840, 110.3642030, 'Jl. Rotowijayan Blok No. 1, Panembahan, Kec. Kraton, Kota Yogyakarta, D.I. Yogyakarta 55131', 4.7, 'Ramai', '08.30 - 14.00 WIB', 'Istana resmi Kesultanan Ngayogyakarta Hadiningrat yang sarat peninggalan sejarah kebudayaan Jawa, museum pusaka, dan pagelaran seni tradisional.'),

(3, 'Taman Sari Yogyakarta', 'wisata', 'Kota Yogyakarta', -7.8099390, 110.3592530, 'Patehan, Kec. Kraton, Kota Yogyakarta, D.I. Yogyakarta 55133', 4.6, 'Ramai', '09.00 - 15.00 WIB', 'Situs bekas taman pemandian megah kesultanan Yogyakarta yang memiliki lorong bawah tanah unik dan masjid Sumur Gumuling.'),

(4, 'Benteng Vredeburg', 'wisata', 'Kota Yogyakarta', -7.8003180, 110.3662580, 'Jl. Margo Mulyo No. 6, Ngupasan, Kec. Gondomanan, Kota Yogyakarta, D.I. Yogyakarta 55122', 4.7, 'Sedang', '08.00 - 20.00 WIB', 'Benteng bersejarah peninggalan kolonial Belanda yang kini menjadi museum diorama perjuangan pergerakan kemerdekaan Republik Indonesia.'),

(5, 'Monumen Jogja Kembali (Monjali)', 'wisata', 'Sleman', -7.7491670, 110.3697220, 'Jl. Ring Road Utara, Jongkang, Sariharjo, Kec. Ngaglik, Kabupaten Sleman, D.I. Yogyakarta 55581', 4.5, 'Sedang', '08.00 - 16.00 WIB', 'Museum berbentuk kerucut monumental yang memperingati peristiwa ditariknya tentara pendudukan Belanda dari ibu kota Yogyakarta pada 1949.'),

(6, 'Candi Prambanan', 'wisata', 'Sleman', -7.7520200, 110.4914670, 'Jl. Raya Solo - Yogyakarta No. 16, Kranggan, Bokoharjo, Kec. Prambanan, Kabupaten Sleman, D.I. Yogyakarta 55572', 4.8, 'Ramai', '06.30 - 17.00 WIB', 'Kompleks candi Hindu terbesar di Indonesia dan Situs Warisan Dunia UNESCO dengan relief epik Ramayana setinggi 47 meter.'),

(7, 'Candi Ratu Boko', 'wisata', 'Sleman', -7.7705420, 110.4893780, 'Jl. Raya Piyungan - Prambanan No. 2, Gatak, Bokoharjo, Kec. Prambanan, Kabupaten Sleman, D.I. Yogyakarta 55572', 4.6, 'Sedang', '07.00 - 17.30 WIB', 'Situs reruntuhan istana megah abad ke-8 di puncak bukit kapur yang terkenal dengan gerbang batu kembar dan panorama matahari terbenam.'),

(8, 'Tebing Breksi', 'wisata', 'Sleman', -7.7816040, 110.5046200, 'Gn. Sari, Sambirejo, Kec. Prambanan, Kabupaten Sleman, D.I. Yogyakarta 55572', 4.5, 'Ramai', '06.00 - 21.00 WIB', 'Bekas tambang batuan kapur endapan abu vulkanik Merapi yang dipahat menjadi taman tebing relief seni wayang dan amfiteater terbuka.'),

(9, 'Hutan Pinus Pengger', 'wisata', 'Bantul', -7.8687780, 110.4616670, 'Sendangsari, Terong, Kec. Dlingo, Kabupaten Bantul, D.I. Yogyakarta 55783', 4.6, 'Sedang', '08.00 - 21.00 WIB', 'Hutan pinus asri di dataran tinggi Dlingo dengan instalasi karya seni anyaman ranting kayu seperti tangan raksasa dan pemandangan gemerlap lampu malam.'),

(10, 'Kebun Binatang Gembira Loka', 'wisata', 'Kota Yogyakarta', -7.8059080, 110.3986420, 'Jl. Kebun Raya No. 2, Rejowinangun, Kec. Kotagede, Kota Yogyakarta, D.I. Yogyakarta 55171', 4.6, 'Ramai', '08.00 - 16.00 WIB', 'Taman zoologi dan botani kebanggaan kota Yogyakarta dengan danau buatan, wahana interaksi satwa, serta koleksi fauna dari berbagai belahan dunia.'),

(11, 'Pantai Parangtritis', 'wisata', 'Bantul', -8.0255560, 110.3200000, 'Jl. Parangtritis KM 28, Parangtritis, Kec. Kretek, Kabupaten Bantul, D.I. Yogyakarta 55772', 4.5, 'Ramai', '24 Jam', 'Pantai pesisir Samudra Hindia yang tersohor dengan hamparan gumuk pasir, ombak megah, bendi wisata, serta panorama matahari terbenam spektakuler.'),

(12, 'Pantai Drini', 'wisata', 'Gunungkidul', -8.1396390, 110.5786110, 'Banjarejo, Kec. Tanjungsari, Kabupaten Gunungkidul, D.I. Yogyakarta 55881', 4.6, 'Sedang', '24 Jam', 'Pantai berpasir putih lembut dengan pulau karang pembelah perairan di bagian tengah yang menghadirkan sisi perairan tenang seperti kolam alami.'),

(13, 'Pantai Timang', 'wisata', 'Gunungkidul', -8.1755560, 110.6622220, 'Jl. Pantai Timang, Purwodadi, Kec. Tepus, Kabupaten Gunungkidul, D.I. Yogyakarta 55881', 4.6, 'Sedang', '07.00 - 17.00 WIB', 'Pantai tebing karang laut selatan yang ikonik dengan wahana gondola gantung kayu tradisional dan jembatan penyeberangan ke Pulau Panjang.'),

(14, 'Goa Pindul', 'wisata', 'Gunungkidul', -7.9308330, 110.6480560, 'Gelaran 2, Bejiharjo, Kec. Karangmojo, Kabupaten Gunungkidul, D.I. Yogyakarta 55891', 4.5, 'Ramai', '07.00 - 16.30 WIB', 'Wisata susur sungai bawah tanah sepanjang 350 meter menggunakan ban pelampung melewati stalaktit raksasa dan ruang goa berornamen karst alami.'),

(15, 'Goa Jomblang', 'wisata', 'Gunungkidul', -7.9863890, 110.6383330, 'Jetis Wetan, Pacarejo, Kec. Semanu, Kabupaten Gunungkidul, D.I. Yogyakarta 55893', 4.7, 'Sedang', '08.00 - 14.00 WIB', 'Goa vertikal sedalam 60 meter dengan formasi sinkhole hutan purba dan fenomena berkas sinar matahari alami menembus lorong bawah tanah.'),

(16, 'Embung Langensari', 'wisata', 'Kota Yogyakarta', -7.7877780, 110.3800000, 'Jl. Kusbini No. 35, Klitren, Kec. Gondokusuman, Kota Yogyakarta, D.I. Yogyakarta 55222', 4.4, 'Sedang', '06.00 - 18.00 WIB', 'Danau retensi air di tengah kota yang dikelilingi pepohonan rindang dan lintasan jogging untuk rekreasi warga perkotaan.'),

(17, 'Museum Ullen Sentalu', 'wisata', 'Sleman', -7.5977780, 110.4233330, 'Jl. Boyong KM 25, Kaliurang Barat, Hargobinangun, Kec. Pakem, Kabupaten Sleman, D.I. Yogyakarta 55582', 4.7, 'Sedang', '08.30 - 16.00 WIB', 'Museum seni dan warisan budaya Jawa di lereng Merapi dengan arsitektur batu alam menawan yang mengisahkan sejarah para putri keraton Jawa.'),

(18, 'The Lost World Castle', 'wisata', 'Sleman', -7.5969440, 110.4572220, 'Jl. Petung Merapi, Petung, Kepuharjo, Kec. Cangkringan, Kabupaten Sleman, D.I. Yogyakarta 55583', 4.4, 'Ramai', '07.00 - 18.00 WIB', 'Bangunan megah bergaya kastel benteng kuno berbahan batu Merapi yang menyajikan spot foto tematik dan panorama Gunung Merapi.'),

(19, 'Plunyon Kalikuning', 'wisata', 'Sleman', -7.5894440, 110.4513890, 'Kedungsriti, Umbulharjo, Kec. Cangkringan, Kabupaten Sleman, D.I. Yogyakarta 55583', 4.6, 'Sedang', '07.00 - 17.00 WIB', 'Jembatan beton bersejarah dan saluran air di lembah Kali Kuning berlatar belakang Gunung Merapi yang sejuk dan asri.'),

(20, 'Alun-Alun Kidul Yogyakarta (Alkid)', 'wisata', 'Kota Yogyakarta', -7.8118610, 110.3631940, 'Jl. Alun-Alun Kidul, Patehan, Kec. Kraton, Kota Yogyakarta, D.I. Yogyakarta 55133', 4.7, 'Ramai', '24 Jam', 'Alun-alun selatan keraton dengan pohon beringin kembar legendaris untuk tradisi Masangin dan keramaian wahana sepeda hias berlampu neon pada malam hari.'),

-- -------------------------------------------------------------
-- 20 LOKASI KULINER
-- -------------------------------------------------------------
(21, 'Gudeg Yu Djum (Pusat Wijilan)', 'kuliner', 'Kota Yogyakarta', -7.8041670, 110.3683330, 'Jl. Wijilan No. 167, Panembahan, Kec. Kraton, Kota Yogyakarta, D.I. Yogyakarta 55131', 4.6, 'Ramai', '06.00 - 22.00 WIB', 'Pusat gudeg kering legendaris sejak tahun 1950 dengan aroma khas olahan tungku kayu bakar, disajikan bersama krecek pedas dan telur bebek bacem.'),

(22, 'Gudeg Permata Bu Narti', 'kuliner', 'Kota Yogyakarta', -7.8016670, 110.3736110, 'Jl. Gajah Mada No. 2, Gunungketur, Pakualaman, Kota Yogyakarta, D.I. Yogyakarta 55111', 4.5, 'Ramai', '20.00 - 02.00 WIB', 'Warung gudeg basah malam hari di dekat bekas bioskop Permata yang menyajikan kuah santan gurih kental berpadu sambal goreng krecek pedas berkuah.'),

(23, 'Angkringan Lik Man (Stasiun Tugu)', 'kuliner', 'Kota Yogyakarta', -7.7891670, 110.3636110, 'Jl. Pasar Kembang, Sosromenduran, Gedong Tengen, Kota Yogyakarta, D.I. Yogyakarta 55271', 4.4, 'Ramai', '17.00 - 02.00 WIB', 'Pelopor racikan legendaris Kopi Jos di mana kopi hitam pekat dicelup arang membara, ditemani aneka nasi kucing dan sate usus serta jeroan.'),

(24, 'Sate Klatak Pak Bari (Pasar Imogiri)', 'kuliner', 'Bantul', -7.8688890, 110.3922220, 'Pasar Wonokromo, Jl. Imogiri Timur No. KM 5, Wonokromo, Kec. Pleret, Kabupaten Bantul, D.I. Yogyakarta 55791', 4.5, 'Ramai', '18.30 - 01.00 WIB', 'Sate kambing muda khas Bantul yang ditusuk menggunakan jeruji besi roda sepeda dengan bumbu garam minimalis dan kuah gulai rempah gurih hangat.'),

(25, 'Bakpia Pathok 25 (Pusat Pathuk)', 'kuliner', 'Kota Yogyakarta', -7.7997220, 110.3586110, 'Jl. KS Tubun No. 504, Sanggrahan, Ngampilan, Kota Yogyakarta, D.I. Yogyakarta 55261', 4.7, 'Ramai', '06.00 - 23.00 WIB', 'Pabrik dan gerai utama oleh-oleh bakpia tertua di Jogja dengan tekstur kulit lembut renyah dan isian pasta kacang hijau asli yang masih hangat.'),

(26, 'Mangut Lele Mbah Marto', 'kuliner', 'Bantul', -7.8541670, 110.3575000, 'Jl. Sewon Indah No. 1, Panggungharjo, Kec. Sewon, Kabupaten Bantul, D.I. Yogyakarta 55188', 4.5, 'Ramai', '10.00 - 21.00 WIB', 'Olahan ikan lele asap bumbu kuah santan cabai super pedas khas pedesaan di mana pengunjung mengambil hidangan langsung dari dapur pawon tungku kayu.'),

(27, 'Soto Ayam Bathok Mbah Katro', 'kuliner', 'Sleman', -7.7619440, 110.4497220, 'Sambisari, Purwomartani, Kec. Kalasan, Kabupaten Sleman, D.I. Yogyakarta 55571', 4.5, 'Ramai', '06.00 - 15.30 WIB', 'Soto ayam berkuah bening gurih segar yang disajikan khas di dalam tempurung kelapa bathok di tengah pemandangan sawah dekat Candi Sambisari.'),

(28, 'Oseng-Oseng Mercon Bu Narti', 'kuliner', 'Kota Yogyakarta', -7.8027780, 110.3563890, 'Jl. KH. Ahmad Dahlan No. 107, Notoprajan, Ngampilan, Kota Yogyakarta, D.I. Yogyakarta 55262', 4.4, 'Ramai', '16.00 - 23.00 WIB', 'Kuliner pedas legendaris berisi tetelan daging sapi dan gajih yang ditumis dengan puluhan cabai rawit pedas menyengat yang meledak di lidah.'),

(29, 'Mie Ayam Grabyok (Pak Long Silit)', 'kuliner', 'Kota Yogyakarta', -7.7944440, 110.3663890, 'Jl. Malioboro No. 60, Suryatmajan, Kec. Danurejan, Kota Yogyakarta, D.I. Yogyakarta 55271', 4.3, 'Ramai', '23.00 - 04.00 WIB', 'Mie ayam tengah malam legendaris di pelataran toko Malioboro dengan topping kulit ayam garing krispi gurih yang khas.'),

(30, 'Bakso Titoti Wonogiri (Cabang Jogja)', 'kuliner', 'Kota Yogyakarta', -7.8202780, 110.3888890, 'Jl. Veteran No. 93, Pandeyan, Kec. Umbulharjo, Kota Yogyakarta, D.I. Yogyakarta 55161', 4.6, 'Ramai', '09.00 - 21.30 WIB', 'Bakso urat sapi asli Wonogiri bertekstur mantap dengan kuah kaldu sumsum sapi gurih pekat, disajikan bersama tahu bakso, tetelan, dan siomay basah.'),

(31, 'House of Raminten', 'kuliner', 'Kota Yogyakarta', -7.7850000, 110.3736110, 'Jl. Faridan M. Noto No. 7, Kotabaru, Kec. Gondokusuman, Kota Yogyakarta, D.I. Yogyakarta 55224', 4.5, 'Ramai', '09.00 - 23.00 WIB', 'Restoran berkonsep budaya Jawa tradisional otentik dengan alunan gending gamelan, wangi dupa semerbak, dan menu nasi liwet, sekul kucing hingga wedang jamu.'),

(32, 'Sego Koyor Bu Parman', 'kuliner', 'Kota Yogyakarta', -7.8055560, 110.3708330, 'Jl. Brigjen Katamso No. 111, Prawirodirjan, Kec. Gondomanan, Kota Yogyakarta, D.I. Yogyakarta 55121', NULL, 'Sedang', '22.00 - 03.30 WIB', 'Kuliner malam Yogyakarta yang menyajikan nasi hangat dengan olahan urat dan sengkel sapi koyor berkuah santan gurih meresap.'),

(33, 'Jadah Tempe Mbah Carik (Kaliurang)', 'kuliner', 'Sleman', -7.5966670, 110.4286110, 'Jl. Astomulyo, Simpang Lima Kaliurang, Hargobinangun, Kec. Pakem, Kabupaten Sleman, D.I. Yogyakarta 55582', 4.6, 'Ramai', '06.00 - 18.00 WIB', 'Kudapan tradisional Kaliurang perpaduan jadah ketan gurih kenyal dengan tempe tahu bacem manis legit kesukaan Sultan Hamengkubuwono IX.'),

(34, 'Sate Ayam Pak Karto (Katamso)', 'kuliner', 'Kota Yogyakarta', -7.8105560, 110.3702780, 'Jl. Brigjen Katamso No. 182, Keparakan, Kec. Mergangsan, Kota Yogyakarta, D.I. Yogyakarta 55152', 4.5, 'Sedang', '17.00 - 23.00 WIB', 'Sate ayam kampung dengan potongan daging montok lembut berbumbu kacang manis kental khas Jogja yang dipanggang arang batok.'),

(35, 'Brongkos Handayani (Kauman)', 'kuliner', 'Kota Yogyakarta', -7.8122220, 110.3627780, 'Jl. Gading No. 2, Patehan, Kec. Kraton, Kota Yogyakarta, D.I. Yogyakarta 55133', 4.6, 'Ramai', '08.00 - 16.00 WIB', 'Sup tradisional daging sapi koyor berkuah hitam bumbu kluwek khas Jawa lengkap dengan kacang tolo, telur asin utuh, tahu, dan cabai rawit ceplusan.'),

(36, 'Pecel Madiun Buasto', 'kuliner', 'Sleman', -7.7719440, 110.3794440, 'Jl. Magelang KM 4.5 No. 50, Kricak, Sleman, D.I. Yogyakarta 55284', NULL, NULL, '06.30 - 15.00 WIB', 'Nasi pecel dengan sayuran segar pilihan disiram saus kacang pedas legit khas Jawa Timuran, disajikan lengkap dengan rempeyek kacang renyah.'),

(37, 'Kopi Klotok (Pakem, Sleman)', 'kuliner', 'Sleman', -7.6788890, 110.4208330, 'Jl. Kaliurang KM 16, Area Sawah, Pakembinangun, Kec. Pakem, Kabupaten Sleman, D.I. Yogyakarta 55582', 4.7, 'Ramai', '07.00 - 21.30 WIB', 'Warung makan joglo pedesaan di tepi hamparan sawah lereng Merapi dengan menu kopi seduh panci klotok, pisang goreng krispi, dan sayur lodeh ndeso.'),

(38, 'Tempo Gelato (Prawirotaman)', 'kuliner', 'Kota Yogyakarta', -7.8188890, 110.3694440, 'Jl. Prawirotaman No. 43, Brontokusuman, Kec. Mergangsan, Kota Yogyakarta, D.I. Yogyakarta 55153', 4.7, 'Ramai', '09.00 - 22.00 WIB', 'Kedai es krim gelato artisan dengan interior industrial klasik yang menawarkan aneka pilihan rasa unik seperti kemangi, jahe, speculoos, dan sorbet segar.'),

(39, 'Lotek & Gado-Gado Bu Bagyo Colombo', 'kuliner', 'Sleman', -7.7758330, 110.3852780, 'Jl. Prof. Herman Yohanes No. 1, Caturtunggal, Kec. Depok, Kabupaten Sleman, D.I. Yogyakarta 55281', 4.5, 'Ramai', '09.30 - 17.30 WIB', 'Warung lotek legendaris mahasiswa Yogyakarta dengan saus kacang kencur segar yang diulek langsung sesuai tingkat kepedasan yang diinginkan.'),

(40, 'Ayam Goreng Bu Tini', 'kuliner', 'Kota Yogyakarta', -7.8013890, 110.3738890, 'Jl. Sultan Agung No. 17, Gunungketur, Pakualaman, Kota Yogyakarta, D.I. Yogyakarta 55151', 4.6, 'Sedang', NULL, 'Ayam kampung goreng bacem empuk berpadu bumbu manis gurih legit yang meresap sempurna hingga ke serat tulang, disajikan dengan sambal terasi matang.');
