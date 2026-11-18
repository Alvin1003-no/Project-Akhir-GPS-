<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Jelajah Jogja</title>

  <link rel="icon"type="image/png"href="assets/Favicon Jelajah Jogja.png">

  <!-- Bootstrap 5 CSS CDN -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css">

  <!-- Font Awesome 6.5.1 CDN (Ikon Vektor) -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">

  <!-- Leaflet 1.9.4 CSS CDN -->
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin="">

  <!-- Custom CSS (100% Bebas Foto/Gambar, Palet Warna Biru #1664B0, Beige #EFE8DE, Merah #D21624) -->
  <link rel="stylesheet" href="assets/css/style.css">
</head>
<body>

  <!-- Backdrop untuk Sidebar Mobile -->
  <div id="sidebar-backdrop" class="sidebar-backdrop"></div>

  <!-- Container Utama Aplikasi -->
  <div id="app-container">

    <!-- Tombol Navigasi Mobile -->
    <button type="button" id="mobile-nav-toggle" class="mobile-nav-toggle" aria-label="Buka Menu Sidebar">
      <i class="fa-solid fa-bars"></i>
    </button>

    <!-- =================================================================
         SIDEBAR KIRI (Pencarian, Filter, Daftar Lokasi, dan Panel Rute)
         ================================================================= -->
    <aside id="sidebar">
      
      <!-- Header Branding -->
      <div class="sidebar-header">
        <div class="brand-badge">
          <i class="fa-solid fa-satellite-dish"></i> Project Akhir GPS - Jelajah Jogja
        </div>
        <h1 class="brand-title">Wisata & Kuliner DIY</h1>
        <p class="brand-subtitle">Pencarian Lokasi & Perencanaan Rute Digital Daerah Istimewa Yogyakarta</p>
      </div>

      <!-- Kartu Status GPS Perangkat Pengguna -->
      <div class="gps-status-card">
        <div class="gps-status-info">
          <div id="gps-indicator-dot" class="gps-indicator-dot searching"></div>
          <div style="overflow: hidden;">
            <div id="gps-status-text" class="gps-text-title">Menunggu izin GPS...</div>
            <div id="gps-coords-text" class="gps-text-coords">Mendeteksi posisi perangkat...</div>
          </div>
        </div>
        <button type="button" id="btn-refresh-gps" class="btn-refresh-gps" title="Perbarui Lokasi GPS">
          <i class="fa-solid fa-arrows-rotate"></i> Perbarui
        </button>
      </div>

      <!-- Kontrol Pencarian dan Filter -->
      <div class="sidebar-controls">
        
        <!-- Input Pencarian Nama -->
        <div class="search-input-group">
          <i class="fa-solid fa-magnifying-glass search-icon-left"></i>
          <input type="text" id="search-input" class="search-input" placeholder="Cari nama lokasi wisata atau kuliner..." autocomplete="off">
          <button type="button" id="search-clear-btn" class="search-clear-btn" title="Hapus pencarian">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <!-- Filter Kategori (Pill Buttons) -->
        <div class="filter-pills-row">
          <button type="button" class="filter-pill active" data-kategori="semua">
            <i class="fa-solid fa-layer-group"></i> Semua
          </button>
          <button type="button" class="filter-pill" data-kategori="wisata">
            <i class="fa-solid fa-mountain-sun"></i> Wisata
          </button>
          <button type="button" class="filter-pill" data-kategori="kuliner">
            <i class="fa-solid fa-utensils"></i> Kuliner
          </button>
        </div>

        <!-- Filter Wilayah DIY (Dropdown) -->
        <div class="region-select-wrapper">
          <i class="fa-solid fa-map-location-dot" style="color: var(--primary-blue); font-size: 0.85rem;"></i>
          <select id="region-select" class="region-select" aria-label="Filter Wilayah">
            <option value="semua">Seluruh Wilayah DIY</option>
            <option value="Kota Yogyakarta">Kota Yogyakarta</option>
            <option value="Sleman">Kabupaten Sleman</option>
            <option value="Bantul">Kabupaten Bantul</option>
            <option value="Gunungkidul">Kabupaten Gunungkidul</option>
            <option value="Kulon Progo">Kabupaten Kulon Progo</option>
          </select>
        </div>

      </div>

      <!-- Tab Navigasi: Daftar Lokasi vs Rute Saya -->
      <div class="sidebar-tabs">
        <button type="button" class="sidebar-tab-btn active" data-tab="locations">
          <i class="fa-solid fa-list-ul"></i>
          <span>Daftar Lokasi</span>
          <span id="tab-locations-count" class="tab-badge">40</span>
        </button>
        <button type="button" class="sidebar-tab-btn" data-tab="route">
          <i class="fa-solid fa-route"></i>
          <span>Rute Saya</span>
          <span id="tab-route-count" class="tab-badge">0</span>
        </button>
      </div>

      <!-- Wadah Konten Tab -->
      <div class="tab-pane-container">

        <!-- TAB 1: DAFTAR LOKASI -->
        <div id="tab-pane-locations" class="tab-pane active">
          <div class="locations-list-header">
            <span>Ditemukan <b id="locations-count-badge">40</b> lokasi</span>
            <span>Urut Jarak GPS</span>
          </div>
          <div id="locations-container">
            <!-- Kartu lokasi akan dimuat secara dinamis melalui JavaScript -->
            <div class="text-center py-4 text-muted">
              <i class="fa-solid fa-spinner fa-spin fa-2x mb-2"></i>
              <div>Memuat data destinasi DIY...</div>
            </div>
          </div>
        </div>

        <!-- TAB 2: PANEL RENCANA RUTE MULTI-DESTINASI -->
        <div id="tab-pane-route" class="tab-pane">
          
          <!-- Pemilih Moda Transportasi -->
          <div class="route-mode-selector">
            <button type="button" class="route-mode-btn" data-mode="motor" title="Sepeda Motor">
              <i class="fa-solid fa-motorcycle"></i> Motor
            </button>
            <button type="button" class="route-mode-btn active" data-mode="mobil" title="Mobil Pribadi">
              <i class="fa-solid fa-car"></i> Mobil
            </button>
            <button type="button" class="route-mode-btn" data-mode="jalan_kaki" title="Jalan Kaki">
              <i class="fa-solid fa-person-walking"></i> Jalan Kaki
            </button>
          </div>

          <!-- Daftar Waypoints (Titik Awal GPS + Tujuan) -->
          <div id="waypoints-list" class="waypoints-list">
            <!-- Waypoints akan dirender melalui routing.js -->
          </div>

          <!-- Ringkasan Rute Perjalanan -->
          <div id="route-summary-box" class="route-summary-card" style="display: none;">
            <div class="route-summary-title">
              <i class="fa-solid fa-flag-checkered" style="color: var(--accent-red);"></i>
              <span>Total Estimasi Perjalanan (Routing Engine)</span>
            </div>
            <div class="route-metrics-grid">
              <div class="route-metric-box">
                <div class="metric-label">Jarak Tempuh</div>
                <div id="route-total-distance" class="metric-value">-</div>
              </div>
              <div class="route-metric-box">
                <div class="metric-label">Estimasi Waktu</div>
                <div id="route-total-duration" class="metric-value duration">-</div>
              </div>
            </div>
          </div>

          <!-- Tombol Aksi Rute -->
          <div class="route-button-group">
            <button type="button" id="btn-clear-all-route" class="btn-route-action clear">
              <i class="fa-solid fa-trash-can"></i> Hapus Semua
            </button>
            <button type="button" id="btn-recalculate-route" class="btn-route-action recalculate">
              <i class="fa-solid fa-arrows-rotate"></i> Hitung Ulang
            </button>
          </div>

        </div>

      </div>

    </aside>

    <!-- =================================================================
         AREA UTAMA: PETA DIGITAL LEAFLET & OPENSTREETMAP
         ================================================================= -->
    <main id="map-wrapper">
      
      <!-- Elemen Peta Leaflet -->
      <div id="map"></div>

      <!-- Tombol Aksi Mengambang di Atas Peta -->
      <div class="map-floating-top">
        <button type="button" id="btn-center-gps" class="btn-map-floating" title="Pusatkan Peta ke Lokasi GPS Anda">
          <i class="fa-solid fa-crosshairs" style="color: var(--color-gps);"></i>
          <span>GPS Saya</span>
        </button>
        <button type="button" id="btn-trigger-recommendation" class="btn-map-floating recommendation-btn" title="Cari Destinasi Rekomendasi Terdekat">
          <i class="fa-solid fa-bullseye"></i>
          <span>Rekomendasi Terdekat</span>
        </button>
      </div>

      <!-- Kartu Legenda Peta Mengambang di Sudut Kiri Bawah -->
      <div class="map-legend-card">
        <div class="legend-title">
          <i class="fa-solid fa-layer-group" style="color: var(--primary-blue);"></i>
          <span>Legenda Simbol Peta</span>
        </div>
        <div class="legend-item">
          <span class="legend-symbol gps"><i class="fa-solid fa-crosshairs"></i></span>
          <span>Lokasi GPS Pengguna</span>
        </div>
        <div class="legend-item">
          <span class="legend-symbol wisata"><i class="fa-solid fa-mountain-sun"></i></span>
          <span>Destinasi Wisata</span>
        </div>
        <div class="legend-item">
          <span class="legend-symbol kuliner"><i class="fa-solid fa-utensils"></i></span>
          <span>Destinasi Kuliner</span>
        </div>
        <div class="legend-item">
          <span class="legend-symbol selected"><i class="fa-solid fa-bullseye"></i></span>
          <span>Tujuan Terpilih</span>
        </div>
      </div>

    </main>

    <!-- =================================================================
         PANEL DETAIL LOKASI (DRAWER / OFFCANVAS TANPA ELEMEN GAMBAR)
         ================================================================= -->
    <div id="location-detail-panel" role="dialog" aria-labelledby="detail-name">
      
      <div class="detail-panel-header">
        <div class="detail-header-text">
          <span id="detail-category" class="detail-category-badge wisata">
            <i class="fa-solid fa-mountain-sun"></i> Wisata
          </span>
          <h2 id="detail-name" class="detail-location-name">Nama Lokasi</h2>
          <div style="font-size: 0.78rem; color: #64748b;">
            <i class="fa-solid fa-map-pin"></i> <span id="detail-regency">Kabupaten</span>, D.I. Yogyakarta
          </div>
        </div>
        <button type="button" id="btn-close-detail" class="btn-close-detail" title="Tutup Detail" aria-label="Tutup Detail">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <div class="detail-panel-body">
        
        <!-- Alamat Lengkap -->
        <div class="detail-info-card">
          <div class="detail-info-row">
            <div class="detail-info-icon">
              <i class="fa-solid fa-location-dot"></i>
            </div>
            <div class="detail-info-content">
              <div class="detail-info-label">Alamat Lengkap</div>
              <div id="detail-address" class="detail-info-value">-</div>
            </div>
          </div>
        </div>

        <!-- Deskripsi Singkat -->
        <div class="detail-description-section">
          <div class="detail-desc-title">Deskripsi Lokasi</div>
          <p id="detail-description" style="margin: 0;">-</p>
        </div>

        <!-- Informasi Operasional & Rating -->
        <div class="detail-info-card">
          <div class="detail-info-row">
            <div class="detail-info-icon">
              <i class="fa-solid fa-star" style="color: #f59e0b;"></i>
            </div>
            <div class="detail-info-content">
              <div class="detail-info-label">Rating Pengunjung</div>
              <div id="detail-rating" class="detail-info-value">-</div>
            </div>
          </div>

          <div class="detail-info-row">
            <div class="detail-info-icon">
              <i class="fa-solid fa-users" style="color: var(--primary-blue);"></i>
            </div>
            <div class="detail-info-content">
              <div class="detail-info-label">Tingkat Keramaian</div>
              <div id="detail-crowd" class="detail-info-value">-</div>
            </div>
          </div>

          <div class="detail-info-row">
            <div class="detail-info-icon">
              <i class="fa-solid fa-clock" style="color: #6366f1;"></i>
            </div>
            <div class="detail-info-content">
              <div class="detail-info-label">Jam Operasional</div>
              <div id="detail-hours" class="detail-info-value">-</div>
            </div>
          </div>
        </div>

        <!-- Perbandingan Jarak Garis Lurus vs Jarak Jalan -->
        <div class="distance-comparison-box">
          <div class="distance-comparison-title">
            <i class="fa-solid fa-compass"></i>
            <span>Metrik Perjalanan dari GPS Anda</span>
          </div>
          <div class="distance-grid">
            <div class="distance-col">
              <div class="distance-col-label">Garis Lurus (Haversine)</div>
              <div id="detail-straight-distance" class="distance-col-val">-</div>
            </div>
            <div class="distance-col">
              <div class="distance-col-label">Jarak Jalan (Routing)</div>
              <div id="detail-road-distance" class="distance-col-val road">-</div>
            </div>
          </div>
          <div style="margin-top: 0.6rem; text-align: center; font-size: 0.78rem; color: #475569;">
            Estimasi waktu: <strong id="detail-duration" style="color: var(--accent-red);">-</strong>
          </div>
        </div>

      </div>

      <div class="detail-panel-footer">
        <button type="button" id="btn-detail-add-route" class="btn-detail-action add-route">
          <i class="fa-solid fa-plus"></i> Tambah ke Rute
        </button>
        <button type="button" id="btn-detail-view-route" class="btn-detail-action view-route">
          <i class="fa-solid fa-diamond-turn-right"></i> Lihat Rute
        </button>
      </div>

    </div>

  </div>

  <!-- =====================================================================
       POP-UP REKOMENDASI OTOMATIS & COUNTDOWN 10 DETIK (BEBAS GAMBAR)
       ===================================================================== -->
  <div id="recommendation-modal-backdrop" class="recommendation-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="rec-place-name">
    <div class="recommendation-modal-dialog">
      
      <!-- Progress Bar Countdown Menyusut -->
      <div class="countdown-progress-container">
        <div id="rec-progress-bar" class="countdown-progress-bar"></div>
      </div>

      <!-- Header Modal Rekomendasi -->
      <div class="modal-header-recommendation">
        <div class="rec-title-wrap">
          <div class="rec-pulse-icon">
            <i class="fa-solid fa-bullseye"></i>
          </div>
          <h3 class="rec-header-title">Rekomendasi Terdekat</h3>
        </div>
        <div class="rec-countdown-badge">
          <i class="fa-solid fa-stopwatch"></i>
          <span id="rec-countdown-seconds">10s</span>
        </div>
      </div>

      <!-- Body Modal Rekomendasi (Hanya Teks & Ikon) -->
      <div class="modal-body-recommendation">
        <div class="rec-card-hero">
          <h4 id="rec-place-name" class="rec-place-name">Nama Destinasi Terdekat</h4>
          <div class="rec-place-meta">
            <span id="rec-category-badge" class="card-category-badge wisata">
              <i class="fa-solid fa-mountain-sun"></i> Wisata
            </span>
            <span style="font-size: 0.78rem; color: #64748b;">
              <i class="fa-solid fa-location-dot"></i> <span id="rec-regency-badge">Kabupaten</span>, DIY
            </span>
          </div>

          <div class="rec-metrics-row">
            <div class="rec-metric-card straight">
              <div class="rec-metric-lbl">Garis Lurus (Haversine)</div>
              <div id="rec-straight-distance" class="rec-metric-val">-</div>
            </div>
            <div class="rec-metric-card road">
              <div class="rec-metric-lbl">Jarak Jalan Raya</div>
              <div id="rec-road-distance" class="rec-metric-val">-</div>
            </div>
            <div class="rec-metric-card duration">
              <div class="rec-metric-lbl">Estimasi Durasi</div>
              <div id="rec-duration" class="rec-metric-val">-</div>
            </div>
          </div>
        </div>

        <p style="font-size: 0.8rem; color: #64748b; margin: 0; line-height: 1.4;">
          <i class="fa-solid fa-circle-info" style="color: var(--primary-blue);"></i>
          Rekomendasi ini dihitung secara real-time dari posisi koordinat GPS perangkat Anda menggunakan rumus Haversine dan profil rute jalan OpenStreetMap.
        </p>
      </div>

      <!-- Tombol Aksi Rekomendasi -->
      <div class="modal-footer-recommendation">
        <button type="button" id="rec-btn-no" class="btn-rec-no">
          <i class="fa-solid fa-xmark"></i> TIDAK (10s)
        </button>
        <button type="button" id="rec-btn-route" class="btn-rec-route">
          <i class="fa-solid fa-diamond-turn-right"></i> RUTE KE SANA
        </button>
      </div>

    </div>
  </div>

  <!-- Container Toast Notifikasi Ringan -->
  <div id="toast-container"></div>

  <!-- Leaflet 1.9.4 JS CDN -->
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script>

  <!-- Modular Application Scripts -->
  <script src="assets/js/gps.js"></script>
  <script src="assets/js/map.js"></script>
  <script src="assets/js/routing.js"></script>
  <script src="assets/js/recommendation.js"></script>
  <script src="assets/js/app.js"></script>
</body>
</html>
