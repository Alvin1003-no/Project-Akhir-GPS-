/**
 * =====================================================================
 * SISTEM INFORMASI GEOGRAFIS & GPS LOKASI WISATA DAN KULINER DIY
 * Modul: Rekomendasi Otomatis & Countdown 10 Detik (recommendation.js)
 * Bebas dari Elemen Foto / Gambar. Sepenuhnya Berbasis Teks & Ikon.
 * =====================================================================
 */

const RecommendationModule = (function () {
  'use strict';

  let hasAutoShown = false; // Memastikan pop-up hanya muncul otomatis 1 kali saat GPS didapat
  let countdownInterval = null;
  let remainingTimeMs = 10000; // 10 detik dalam milidetik
  const COUNTDOWN_TOTAL_MS = 10000;
  let currentCandidate = null;

  // Elemen DOM Modal
  let backdropEl = null;
  let progressBarEl = null;
  let countdownSecondsEl = null;
  let placeNameEl = null;
  let categoryBadgeEl = null;
  let regencyBadgeEl = null;
  let straightDistEl = null;
  let roadDistEl = null;
  let durationEl = null;
  let btnRouteEl = null;
  let btnNoEl = null;

  /**
   * Inisialisasi referensi elemen DOM
   */
  function initDOM() {
    backdropEl = document.getElementById('recommendation-modal-backdrop');
    progressBarEl = document.getElementById('rec-progress-bar');
    countdownSecondsEl = document.getElementById('rec-countdown-seconds');
    placeNameEl = document.getElementById('rec-place-name');
    categoryBadgeEl = document.getElementById('rec-category-badge');
    regencyBadgeEl = document.getElementById('rec-regency-badge');
    straightDistEl = document.getElementById('rec-straight-distance');
    roadDistEl = document.getElementById('rec-road-distance');
    durationEl = document.getElementById('rec-duration');
    btnRouteEl = document.getElementById('rec-btn-route');
    btnNoEl = document.getElementById('rec-btn-no');

    if (btnRouteEl) {
      btnRouteEl.addEventListener('click', handleRouteClick);
    }
    if (btnNoEl) {
      btnNoEl.addEventListener('click', handleNoClick);
    }
  }

  /**
   * Menghentikan timer countdown dan membersihkan interval
   */
  function stopCountdown() {
    if (countdownInterval !== null) {
      clearInterval(countdownInterval);
      countdownInterval = null;
    }
  }

  /**
   * Menutup pop-up rekomendasi dengan animasi
   */
  function closeModal() {
    stopCountdown();
    if (backdropEl) {
      backdropEl.classList.remove('show');
    }
  }

  /**
   * Memulai countdown 10 detik
   */
  function startCountdown() {
    stopCountdown(); // Pastikan tidak terjadi duplikasi interval

    remainingTimeMs = COUNTDOWN_TOTAL_MS;
    updateCountdownUI();

    const stepMs = 100; // Interval 100ms agar animasi progress bar mulus
    countdownInterval = setInterval(() => {
      remainingTimeMs -= stepMs;

      if (remainingTimeMs <= 0) {
        remainingTimeMs = 0;
        updateCountdownUI();
        stopCountdown();
        closeModal();
      } else {
        updateCountdownUI();
      }
    }, stepMs);
  }

  /**
   * Memperbarui angka countdown dan lebar progress bar
   */
  function updateCountdownUI() {
    const secondsLeft = Math.ceil(remainingTimeMs / 1000);
    const percent = (remainingTimeMs / COUNTDOWN_TOTAL_MS) * 100;

    if (countdownSecondsEl) {
      countdownSecondsEl.textContent = `${secondsLeft}s`;
    }
    if (progressBarEl) {
      progressBarEl.style.width = `${percent}%`;
    }
    if (btnNoEl) {
      btnNoEl.innerHTML = `<i class="fa-solid fa-xmark"></i> TIDAK (${secondsLeft}s)`;
    }
  }

  /**
   * Handler tombol RUTE
   */
  function handleRouteClick() {
    stopCountdown();
    closeModal();

    if (currentCandidate) {
      // 1. Masukkan lokasi rekomendasi ke panel rute
      // 2. Jadikan GPS sebagai titik awal dan hitung rute otomatis
      RoutingModule.addDestination(currentCandidate, true);

      // Berpindah ke tab Rute pada sidebar
      if (typeof window.App !== 'undefined' && window.App.switchSidebarTab) {
        window.App.switchSidebarTab('route');
      }

      // Highlight marker pada peta
      MapModule.highlightMarker(currentCandidate.id, currentCandidate.kategori);
    }
  }

  /**
   * Handler tombol TIDAK
   */
  function handleNoClick() {
    stopCountdown();
    closeModal();
    // Jangan munculkan otomatis lagi pada sesi ini
    hasAutoShown = true;
  }

  /**
   * Mengambil rekomendasi terdekat dan menampilkan modal
   * @param {boolean} isManualTrigger Apakah dipicu oleh tombol manual pengguna
   */
  async function fetchAndShowRecommendation(isManualTrigger = false) {
    if (!isManualTrigger && hasAutoShown) {
      return; // Cegah pemunculan otomatis berulang
    }

    const pos = GPSModule.getPosition();
    if (!pos) {
      if (isManualTrigger) {
        alert('Posisi GPS perangkat belum terdeteksi. Silakan aktifkan izin lokasi GPS terlebih dahulu.');
      }
      return;
    }

    try {
      if (!backdropEl) initDOM();

      // 1. Ambil data kandidat rekomendasi dari backend
      const res = await fetch(`api/recommendation.php?lat=${pos.latitude}&lon=${pos.longitude}&limit=3`);
      if (!res.ok) {
        throw new Error('Gagal mengambil data rekomendasi dari server');
      }
      const data = await res.json();
      if (data.status !== 'success' || !data.recommended) {
        throw new Error('Tidak ada lokasi rekomendasi yang tersedia');
      }

      const rec = data.recommended;
      currentCandidate = rec;

      // 2. Tampilkan informasi dasar di modal terlebih dahulu
      placeNameEl.textContent = rec.nama;
      regencyBadgeEl.textContent = rec.kabupaten_kota;
      straightDistEl.textContent = rec.jarak_haversine_teks;

      if (rec.kategori === 'wisata') {
        categoryBadgeEl.className = 'card-category-badge wisata';
        categoryBadgeEl.innerHTML = '<i class="fa-solid fa-mountain-sun"></i> Wisata';
      } else {
        categoryBadgeEl.className = 'card-category-badge kuliner';
        categoryBadgeEl.innerHTML = '<i class="fa-solid fa-utensils"></i> Kuliner';
      }

      roadDistEl.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menghitung...';
      durationEl.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menghitung...';

      // Buka modal
      backdropEl.classList.add('show');
      startCountdown();
      hasAutoShown = true;

      // 3. Hitung estimasi waktu dan jarak rute melalui jalan menggunakan Routing Engine asli
      try {
        const routeData = await RoutingModule.calculateSingleRoute(
          pos,
          { latitude: rec.latitude, longitude: rec.longitude },
          RoutingModule.getMode()
        );

        roadDistEl.textContent = routeData.distanceText;
        durationEl.textContent = routeData.durationText;
      } catch (routingErr) {
        console.warn('Gagal menghitung rute OSRM untuk rekomendasi:', routingErr.message);
        roadDistEl.textContent = 'Tidak tersedia';
        durationEl.textContent = 'Tidak tersedia';
      }

    } catch (err) {
      console.error('Recommendation error:', err);
      if (isManualTrigger) {
        alert('Gagal memuat rekomendasi: ' + err.message);
      }
    }
  }

  return {
    init: initDOM,
    fetchAndShowRecommendation,
    closeModal,
    hasAutoShown: () => hasAutoShown,
    resetAutoShown: () => { hasAutoShown = false; }
  };
})();
