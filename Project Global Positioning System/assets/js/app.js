/**
 * =====================================================================
 * SISTEM INFORMASI GEOGRAFIS & GPS LOKASI WISATA DAN KULINER DIY
 * Modul Utama: Master Controller (app.js)
 * Mengintegrasikan GPS, Peta, Pencarian, Filter, Routing, & Rekomendasi
 * KETENTUAN: 100% BEBAS DARI ELEMEN FOTO/GAMBAR.
 * =====================================================================
 */

const App = (function () {
  'use strict';

  let allLocations = [];
  let filteredLocations = [];
  let currentSearchQuery = '';
  let activeCategoryFilter = 'semua';
  let activeRegionFilter = 'semua';
  let activeDetailLocation = null;

  // DOM Elements
  const searchInput = document.getElementById('search-input');
  const searchClearBtn = document.getElementById('search-clear-btn');
  const filterPills = document.querySelectorAll('.filter-pill');
  const regionSelect = document.getElementById('region-select');
  const locationsContainer = document.getElementById('locations-container');
  const locationsCountBadge = document.getElementById('locations-count-badge');
  const tabLocationCount = document.getElementById('tab-locations-count');
  const tabRouteCount = document.getElementById('tab-route-count');

  // GPS Elements
  const gpsIndicatorDot = document.getElementById('gps-indicator-dot');
  const gpsStatusText = document.getElementById('gps-status-text');
  const gpsCoordsText = document.getElementById('gps-coords-text');
  const btnRefreshGps = document.getElementById('btn-refresh-gps');
  const btnCenterGps = document.getElementById('btn-center-gps');
  const btnTriggerRecommendation = document.getElementById('btn-trigger-recommendation');

  // Detail Panel Elements
  const detailPanel = document.getElementById('location-detail-panel');
  const detailCloseBtn = document.getElementById('btn-close-detail');
  const detailName = document.getElementById('detail-name');
  const detailCategory = document.getElementById('detail-category');
  const detailRegency = document.getElementById('detail-regency');
  const detailAddress = document.getElementById('detail-address');
  const detailDescription = document.getElementById('detail-description');
  const detailRating = document.getElementById('detail-rating');
  const detailCrowd = document.getElementById('detail-crowd');
  const detailHours = document.getElementById('detail-hours');
  const detailStraightDist = document.getElementById('detail-straight-distance');
  const detailRoadDist = document.getElementById('detail-road-distance');
  const detailDuration = document.getElementById('detail-duration');
  const btnDetailAddRoute = document.getElementById('btn-detail-add-route');
  const btnDetailViewRoute = document.getElementById('btn-detail-view-route');

  // Route Planner Elements
  const waypointsListEl = document.getElementById('waypoints-list');
  const routeSummaryBox = document.getElementById('route-summary-box');
  const routeTotalDistance = document.getElementById('route-total-distance');
  const routeTotalDuration = document.getElementById('route-total-duration');
  const btnClearAllRoute = document.getElementById('btn-clear-all-route');
  const btnRecalculateRoute = document.getElementById('btn-recalculate-route');
  const routeModeButtons = document.querySelectorAll('.route-mode-btn');

  // Mobile elements
  const mobileNavToggle = document.getElementById('mobile-nav-toggle');
  const sidebarEl = document.getElementById('sidebar');
  const sidebarBackdrop = document.getElementById('sidebar-backdrop');

  /**
   * Tampilkan notifikasi toast ringan
   */
  function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `app-toast ${type}`;

    let iconClass = 'fa-circle-info';
    if (type === 'success') iconClass = 'fa-circle-check';
    if (type === 'error') iconClass = 'fa-circle-exclamation';
    if (type === 'warning') iconClass = 'fa-triangle-exclamation';

    toast.innerHTML = `
      <i class="fa-solid ${iconClass}" style="font-size: 1.1rem; flex-shrink: 0;"></i>
      <span style="flex: 1; line-height: 1.35;">${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(50px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  /**
   * Inisialisasi Aplikasi
   */
  async function init() {
    // 1. Inisialisasi Peta Leaflet
    MapModule.init('map');

    // 2. Inisialisasi Rekomendasi
    RecommendationModule.init();

    // 3. Setup Event Listeners
    setupEventListeners();

    // 4. Setup Listener GPS
    setupGpsListeners();

    // 5. Setup Listener Routing
    setupRoutingListeners();

    // 6. Muat data awal 40 lokasi dari API Backend
    await loadInitialLocations();

    // 7. Minta izin akses lokasi GPS perangkat pengguna
    requestUserGps();
  }

  /**
   * Mengambil data seluruh 40 lokasi dari database melalui backend PHP
   */
  async function loadInitialLocations() {
    try {
      const pos = GPSModule.getPosition();
      let url = 'api/locations.php';
      if (pos) {
        url += `?lat=${pos.latitude}&lon=${pos.longitude}`;
      }

      const res = await fetch(url);
      if (!res.ok) throw new Error('Gagal mengambil data dari server database');

      const result = await res.json();
      if (result.status === 'success') {
        allLocations = result.data;
        filteredLocations = [...allLocations];

        // Render marker di peta Leaflet
        MapModule.renderLocationMarkers(allLocations, handleLocationSelect);

        // Render daftar kartu lokasi di sidebar
        renderLocationCards();
      } else {
        throw new Error(result.message || 'Format data tidak sesuai');
      }
    } catch (err) {
      console.error('Error loading locations:', err);
      showToast('Gagal memuat data lokasi: ' + err.message, 'error');
      locationsContainer.innerHTML = `
        <div class="empty-state">
          <i class="fa-solid fa-triangle-exclamation empty-state-icon" style="color: #d21624;"></i>
          <div class="empty-state-title">Koneksi Database Gagal</div>
          <div class="empty-state-text">Pastikan Apache & MySQL di XAMPP aktif dan database "gps_diy" telah diimpor via phpMyAdmin.</div>
        </div>
      `;
    }
  }

  /**
   * Setup Listener Modul GPS
   */
  function setupGpsListeners() {
    GPSModule.on('onStatusChange', (status, message) => {
      if (gpsIndicatorDot) {
        gpsIndicatorDot.className = `gps-indicator-dot ${status}`;
      }
      if (gpsStatusText) {
        gpsStatusText.textContent = message;
      }
    });

    GPSModule.on('onSuccess', (coords) => {
      if (gpsCoordsText) {
        gpsCoordsText.textContent = `${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`;
      }

      // Perbarui marker GPS pengguna di peta
      MapModule.setUserGpsMarker(coords.latitude, coords.longitude, coords.accuracy);

      // Hitung ulang jarak garis lurus Haversine untuk seluruh 40 lokasi
      recalculateHaversineDistances(coords.latitude, coords.longitude);

      // Tampilkan notifikasi keberhasilan
      showToast('Lokasi GPS perangkat berhasil dideteksi.', 'success');

      // Tampilkan rekomendasi otomatis terdekat (dengan countdown 10 detik)
      RecommendationModule.fetchAndShowRecommendation(false);
    });

    GPSModule.on('onError', (errorMsg) => {
      showToast(errorMsg, 'error');
      if (gpsCoordsText) {
        gpsCoordsText.textContent = 'GPS tidak aktif';
      }
    });
  }

  /**
   * Minta lokasi GPS perangkat
   */
  function requestUserGps() {
    GPSModule.requestPosition().catch(err => {
      console.warn('GPS initial request rejected or failed:', err.message);
    });
  }

  /**
   * Menghitung ulang jarak Haversine di client side saat koordinat GPS diterima
   */
  function recalculateHaversineDistances(userLat, userLon) {
    function haversine(lat1, lon1, lat2, lon2) {
      const R = 6371000;
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    }

    allLocations.forEach(loc => {
      const m = haversine(userLat, userLon, loc.latitude, loc.longitude);
      loc.jarak_haversine_meter = Math.round(m);
      loc.jarak_haversine_teks = m < 1000 ? Math.round(m) + ' m' : (m / 1000).toFixed(2).replace('.', ',') + ' km';
    });

    applyFilters();
  }

  /**
   * Setup Listener Modul Routing
   */
  function setupRoutingListeners() {
    RoutingModule.on('onDestinationsChanged', (destinations) => {
      if (tabRouteCount) {
        tabRouteCount.textContent = destinations.length;
      }
      renderWaypointsUI(destinations);
    });

    RoutingModule.on('onRouteCalculated', (summary) => {
      if (routeSummaryBox) routeSummaryBox.style.display = 'block';
      if (routeTotalDistance) routeTotalDistance.textContent = summary.totalDistanceText;
      if (routeTotalDuration) routeTotalDuration.textContent = summary.totalDurationText;
      showToast(`Rute berhasil dihitung: ${summary.totalDistanceText} (${summary.totalDurationText})`, 'success');
    });

    RoutingModule.on('onRouteCleared', () => {
      if (routeSummaryBox) routeSummaryBox.style.display = 'none';
      if (routeTotalDistance) routeTotalDistance.textContent = '-';
      if (routeTotalDuration) routeTotalDuration.textContent = '-';
    });

    RoutingModule.on('onError', (errorMsg) => {
      showToast(errorMsg, 'error');
    });
  }

  /**
   * Setup Event Listeners Komponen UI
   */
  function setupEventListeners() {
    // Tombol Refresh GPS
    if (btnRefreshGps) {
      btnRefreshGps.addEventListener('click', () => {
        requestUserGps();
      });
    }

    // Tombol Pusatkan ke GPS Pengguna
    if (btnCenterGps) {
      btnCenterGps.addEventListener('click', () => {
        if (GPSModule.hasPosition()) {
          MapModule.centerToUserGps(15);
        } else {
          showToast('Lokasi GPS belum tersedia. Silakan klik tombol perbarui GPS.', 'warning');
          requestUserGps();
        }
      });
    }

    // Tombol Cari Rekomendasi Terdekat Manual
    if (btnTriggerRecommendation) {
      btnTriggerRecommendation.addEventListener('click', () => {
        RecommendationModule.fetchAndShowRecommendation(true);
      });
    }

    // Input Pencarian Nama
    let debounceTimer = null;
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        currentSearchQuery = e.target.value.trim().toLowerCase();
        if (searchClearBtn) {
          searchClearBtn.style.display = currentSearchQuery ? 'block' : 'none';
        }

        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          applyFilters();
        }, 250);
      });
    }

    if (searchClearBtn) {
      searchClearBtn.addEventListener('click', () => {
        searchInput.value = '';
        currentSearchQuery = '';
        searchClearBtn.style.display = 'none';
        applyFilters();
      });
    }

    // Filter Kategori (Pills)
    filterPills.forEach(pill => {
      pill.addEventListener('click', () => {
        filterPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        activeCategoryFilter = pill.getAttribute('data-kategori');
        applyFilters();
      });
    });

    // Filter Wilayah (Dropdown)
    if (regionSelect) {
      regionSelect.addEventListener('change', (e) => {
        activeRegionFilter = e.target.value;
        applyFilters();
      });
    }

    // Tab Navigasi Sidebar (Daftar Lokasi vs Rute Saya)
    const tabButtons = document.querySelectorAll('.sidebar-tab-btn');
    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetTab = btn.getAttribute('data-tab');
        switchSidebarTab(targetTab);
      });
    });

    // Detail Panel Actions
    if (detailCloseBtn) {
      detailCloseBtn.addEventListener('click', closeLocationDetail);
    }

    if (btnDetailAddRoute) {
      btnDetailAddRoute.addEventListener('click', () => {
        if (activeDetailLocation) {
          const added = RoutingModule.addDestination(activeDetailLocation, true);
          if (added) {
            showToast(`"${activeDetailLocation.nama}" ditambahkan ke rute.`, 'success');
          }
        }
      });
    }

    if (btnDetailViewRoute) {
      btnDetailViewRoute.addEventListener('click', () => {
        if (activeDetailLocation) {
          if (!GPSModule.hasPosition()) {
            showToast('GPS belum tersedia. Izinkan akses GPS untuk menghitung rute.', 'warning');
            requestUserGps();
            return;
          }
          // Bersihkan rute sebelumnya dan buat rute langsung ke lokasi ini
          RoutingModule.clearAllDestinations();
          RoutingModule.addDestination(activeDetailLocation, true);
          switchSidebarTab('route');
          closeLocationDetail();
        }
      });
    }

    // Routing Mode Buttons
    routeModeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        routeModeButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const mode = btn.getAttribute('data-mode');
        RoutingModule.setTransportMode(mode);
      });
    });

    // Routing Panel Action Buttons
    if (btnClearAllRoute) {
      btnClearAllRoute.addEventListener('click', () => {
        if (confirm('Hapus seluruh daftar tujuan rute perjalanan?')) {
          RoutingModule.clearAllDestinations();
          showToast('Daftar rute telah dibersihkan.', 'info');
        }
      });
    }

    if (btnRecalculateRoute) {
      btnRecalculateRoute.addEventListener('click', () => {
        RoutingModule.calculateMultiRoute().catch(() => {});
      });
    }

    // Mobile Navbar & Backdrop
    if (mobileNavToggle) {
      mobileNavToggle.addEventListener('click', () => {
        sidebarEl.classList.toggle('mobile-open');
        sidebarBackdrop.classList.toggle('active');
      });
    }

    if (sidebarBackdrop) {
      sidebarBackdrop.addEventListener('click', () => {
        sidebarEl.classList.remove('mobile-open');
        sidebarBackdrop.classList.remove('active');
      });
    }
  }

  /**
   * Berpindah tab pada sidebar ('locations' | 'route')
   */
  function switchSidebarTab(tabName) {
    const tabButtons = document.querySelectorAll('.sidebar-tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');

    tabButtons.forEach(btn => {
      if (btn.getAttribute('data-tab') === tabName) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    tabPanes.forEach(pane => {
      if (pane.id === `tab-pane-${tabName}`) {
        pane.classList.add('active');
      } else {
        pane.classList.remove('active');
      }
    });
  }

  /**
   * Menerapkan filter pencarian, kategori, dan wilayah secara dinamis
   */
  function applyFilters() {
    filteredLocations = allLocations.filter(loc => {
      // 1. Filter Nama & Alamat
      const matchesQuery = !currentSearchQuery ||
        loc.nama.toLowerCase().includes(currentSearchQuery) ||
        loc.alamat.toLowerCase().includes(currentSearchQuery) ||
        loc.deskripsi.toLowerCase().includes(currentSearchQuery);

      // 2. Filter Kategori
      const matchesCategory = activeCategoryFilter === 'semua' ||
        loc.kategori.toLowerCase() === activeCategoryFilter.toLowerCase();

      // 3. Filter Wilayah
      const matchesRegion = activeRegionFilter === 'semua' ||
        loc.kabupaten_kota.toLowerCase().includes(activeRegionFilter.toLowerCase());

      return matchesQuery && matchesCategory && matchesRegion;
    });

    // Urutkan berdasarkan jarak jika posisi GPS pengguna tersedia
    if (GPSModule.hasPosition()) {
      filteredLocations.sort((a, b) => (a.jarak_haversine_meter || 0) - (b.jarak_haversine_meter || 0));
    }

    // Render ulang kartu di sidebar
    renderLocationCards();

    // Sesuaikan marker peta dengan hasil filter
    const visibleIds = filteredLocations.map(l => l.id);
    MapModule.filterMarkers(visibleIds);
  }

  /**
   * Merender daftar kartu lokasi di sidebar (Bebas dari foto/gambar)
   */
  function renderLocationCards() {
    if (!locationsContainer) return;

    const count = filteredLocations.length;
    if (locationsCountBadge) locationsCountBadge.textContent = count;
    if (tabLocationCount) tabLocationCount.textContent = count;

    if (count === 0) {
      locationsContainer.innerHTML = `
        <div class="empty-state">
          <i class="fa-solid fa-magnifying-glass empty-state-icon"></i>
          <div class="empty-state-title">Tidak ada lokasi ditemukan</div>
          <div class="empty-state-text">Coba ubah kata kunci pencarian, kategori, atau filter wilayah DIY yang Anda pilih.</div>
        </div>
      `;
      return;
    }

    let html = '';
    filteredLocations.forEach(loc => {
      const isWisata = loc.kategori === 'wisata';
      const katClass = isWisata ? 'wisata' : 'kuliner';
      const katIcon = isWisata ? 'fa-mountain-sun' : 'fa-utensils';
      const katLabel = isWisata ? 'Wisata' : 'Kuliner';

      const ratingText = loc.rating !== null ? `${loc.rating} / 5` : 'Informasi belum tersedia';
      const distanceText = loc.jarak_haversine_teks ? loc.jarak_haversine_teks : '-';

      html += `
        <div class="location-card category-${katClass}" data-id="${loc.id}">
          <div class="card-top-row">
            <div class="card-title">${loc.nama}</div>
            <span class="card-category-badge ${katClass}">
              <i class="fa-solid ${katIcon}"></i> ${katLabel}
            </span>
          </div>

          <div class="card-region-row">
            <i class="fa-solid fa-location-dot" style="font-size: 0.75rem; color: #94a3b8;"></i>
            <span>${loc.kabupaten_kota}</span>
          </div>

          <div class="card-desc-snippet">${loc.deskripsi}</div>

          <div class="card-meta-row">
            <div class="card-meta-item rating">
              <i class="fa-solid fa-star"></i>
              <span>${ratingText}</span>
            </div>
            <div class="card-meta-item distance">
              <i class="fa-solid fa-ruler-horizontal"></i>
              <span>${distanceText}</span>
            </div>
          </div>

          <div class="card-actions-row">
            <button type="button" class="btn-card-action btn-card-detail" data-id="${loc.id}">
              <i class="fa-solid fa-circle-info"></i> Detail
            </button>
            <button type="button" class="btn-card-action primary btn-card-route" data-id="${loc.id}">
              <i class="fa-solid fa-plus"></i> Rute
            </button>
          </div>
        </div>
      `;
    });

    locationsContainer.innerHTML = html;

    // Attach event listeners ke kartu-kartu yang baru dibuat
    const cardEls = locationsContainer.querySelectorAll('.location-card');
    cardEls.forEach(card => {
      const id = parseInt(card.getAttribute('data-id'), 10);
      const loc = allLocations.find(l => l.id === id);

      card.addEventListener('click', (e) => {
        // Abaikan jika klik tombol action di dalam kartu
        if (e.target.closest('.btn-card-action')) return;
        handleLocationSelect(loc);
      });

      const btnDetail = card.querySelector('.btn-card-detail');
      if (btnDetail) {
        btnDetail.addEventListener('click', (e) => {
          e.stopPropagation();
          handleLocationSelect(loc);
        });
      }

      const btnRoute = card.querySelector('.btn-card-route');
      if (btnRoute) {
        btnRoute.addEventListener('click', (e) => {
          e.stopPropagation();
          const added = RoutingModule.addDestination(loc, true);
          if (added) {
            showToast(`"${loc.nama}" ditambahkan ke rute.`, 'success');
          }
        });
      }
    });
  }

  /**
   * Menangani pemilihan lokasi dari kartu atau marker peta
   */
  async function handleLocationSelect(loc) {
    if (!loc) return;
    activeDetailLocation = loc;

    // Highlight marker pada peta dan pindahkan pusat peta
    MapModule.highlightMarker(loc.id, loc.kategori);
    MapModule.panToLocation(loc.latitude, loc.longitude, 15);

    // Tampilkan panel detail lokasi
    openLocationDetail(loc);
  }

  /**
   * Membuka panel detail lokasi (offcanvas drawer)
   */
  async function openLocationDetail(loc) {
    if (!detailPanel) return;

    detailName.textContent = loc.nama;
    detailRegency.textContent = loc.kabupaten_kota;
    detailAddress.textContent = loc.alamat;
    detailDescription.textContent = loc.deskripsi;

    // Kategori
    if (loc.kategori === 'wisata') {
      detailCategory.className = 'detail-category-badge wisata';
      detailCategory.innerHTML = '<i class="fa-solid fa-mountain-sun"></i> Wisata';
    } else {
      detailCategory.className = 'detail-category-badge kuliner';
      detailCategory.innerHTML = '<i class="fa-solid fa-utensils"></i> Kuliner';
    }

    // Rating
    if (loc.rating !== null) {
      detailRating.className = 'detail-info-value';
      detailRating.innerHTML = `<i class="fa-solid fa-star" style="color: #f59e0b;"></i> ${loc.rating} / 5.0`;
    } else {
      detailRating.className = 'detail-info-value unverified';
      detailRating.textContent = 'Informasi belum tersedia';
    }

    // Tingkat Keramaian
    if (loc.tingkat_keramaian) {
      detailCrowd.className = 'detail-info-value';
      detailCrowd.textContent = loc.tingkat_keramaian;
    } else {
      detailCrowd.className = 'detail-info-value unverified';
      detailCrowd.textContent = 'Informasi belum tersedia';
    }

    // Jam Operasional
    if (loc.jam_operasional) {
      detailHours.className = 'detail-info-value';
      detailHours.textContent = loc.jam_operasional;
    } else {
      detailHours.className = 'detail-info-value unverified';
      detailHours.textContent = 'Informasi belum tersedia';
    }

    // Jarak Garis Lurus (Haversine)
    if (loc.jarak_haversine_teks) {
      detailStraightDist.textContent = loc.jarak_haversine_teks;
    } else {
      detailStraightDist.textContent = 'Perlu GPS';
    }

    // Jarak Jalan dan Estimasi Waktu dari Routing Engine
    detailRoadDist.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menghitung...';
    detailDuration.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menghitung...';

    detailPanel.classList.add('open');

    // Hitung rute jalan langsung jika GPS tersedia
    const userPos = GPSModule.getPosition();
    if (userPos) {
      try {
        const routeData = await RoutingModule.calculateSingleRoute(
          userPos,
          { latitude: loc.latitude, longitude: loc.longitude },
          RoutingModule.getMode()
        );
        detailRoadDist.textContent = routeData.distanceText;
        detailDuration.textContent = routeData.durationText;
      } catch (err) {
        detailRoadDist.textContent = 'Tidak tersedia';
        detailDuration.textContent = 'Tidak tersedia';
      }
    } else {
      detailRoadDist.textContent = 'Perlu GPS';
      detailDuration.textContent = 'Perlu GPS';
    }
  }

  /**
   * Menutup panel detail lokasi
   */
  function closeLocationDetail() {
    if (detailPanel) {
      detailPanel.classList.remove('open');
    }
    MapModule.resetHighlight();
    activeDetailLocation = null;
  }

  /**
   * Merender UI daftar waypoint pada tab Rute
   */
  function renderWaypointsUI(destinations) {
    if (!waypointsListEl) return;

    if (destinations.length === 0) {
      waypointsListEl.innerHTML = `
        <div class="empty-state" style="padding: 1.5rem 0.5rem;">
          <i class="fa-solid fa-route empty-state-icon" style="font-size: 1.8rem;"></i>
          <div class="empty-state-title">Belum Ada Destinasi Rute</div>
          <div class="empty-state-text">Klik tombol "+ Rute" pada kartu lokasi atau panel detail untuk merencanakan perjalanan Anda.</div>
        </div>
      `;
      return;
    }

    let html = '';

    // Waypoint 0: Titik Awal GPS Pengguna
    html += `
      <div class="waypoint-item start-point">
        <div class="waypoint-index-badge">
          <i class="fa-solid fa-location-crosshairs"></i>
        </div>
        <div class="waypoint-content">
          <div class="waypoint-name">Titik Awal: Lokasi GPS Anda</div>
          <div class="waypoint-type">Koordinat Real-time Perangkat</div>
        </div>
      </div>
    `;

    // Waypoints 1..N: Destinasi Terpilih
    destinations.forEach((dest, index) => {
      const num = index + 1;
      const isFirst = index === 0;
      const isLast = index === destinations.length - 1;

      html += `
        <div class="waypoint-item destination-point" data-index="${index}">
          <div class="waypoint-index-badge">${num}</div>
          <div class="waypoint-content">
            <div class="waypoint-name">${dest.nama}</div>
            <div class="waypoint-type">${dest.kabupaten_kota} &bull; ${dest.kategori}</div>
          </div>
          <div class="waypoint-actions">
            <button type="button" class="btn-waypoint-ctrl btn-wp-up" ${isFirst ? 'disabled style="opacity: 0.3; cursor: not-allowed;"' : ''} title="Geser ke Atas">
              <i class="fa-solid fa-chevron-up"></i>
            </button>
            <button type="button" class="btn-waypoint-ctrl btn-wp-down" ${isLast ? 'disabled style="opacity: 0.3; cursor: not-allowed;"' : ''} title="Geser ke Bawah">
              <i class="fa-solid fa-chevron-down"></i>
            </button>
            <button type="button" class="btn-waypoint-ctrl delete btn-wp-delete" title="Hapus dari Rute">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </div>
      `;
    });

    waypointsListEl.innerHTML = html;

    // Pasang handler event tombol kontrol waypoint
    const items = waypointsListEl.querySelectorAll('.waypoint-item.destination-point');
    items.forEach(item => {
      const idx = parseInt(item.getAttribute('data-index'), 10);

      const btnUp = item.querySelector('.btn-wp-up');
      if (btnUp) {
        btnUp.addEventListener('click', () => {
          RoutingModule.moveDestination(idx, idx - 1);
        });
      }

      const btnDown = item.querySelector('.btn-wp-down');
      if (btnDown) {
        btnDown.addEventListener('click', () => {
          RoutingModule.moveDestination(idx, idx + 1);
        });
      }

      const btnDel = item.querySelector('.btn-wp-delete');
      if (btnDel) {
        btnDel.addEventListener('click', () => {
          RoutingModule.removeDestination(idx);
        });
      }
    });
  }

  // Public API
  return {
    init,
    switchSidebarTab,
    showToast
  };
})();

// Jalankan aplikasi saat DOM siap
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
