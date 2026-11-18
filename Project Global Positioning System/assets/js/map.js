/**
 * =====================================================================
 * SISTEM INFORMASI GEOGRAFIS & GPS LOKASI WISATA DAN KULINER DIY
 * Modul: Peta Digital Leaflet.js (map.js)
 * Menggunakan OpenStreetMap dan Custom CSS/Vector DivIcon (Tanpa Foto)
 * =====================================================================
 */

const MapModule = (function () {
  'use strict';

  let map = null;
  let markersLayer = null;
  let userGpsMarker = null;
  let userAccuracyCircle = null;
  let routeLayerGroup = null;
  let locationMarkersMap = new Map(); // id -> L.marker
  let selectedMarkerId = null;

  // Koordinat Pusat dan Batas Wilayah D.I. Yogyakarta
  const DIY_CENTER = [-7.875385, 110.426209];
  const DIY_DEFAULT_ZOOM = 10;
  const DIY_BOUNDS = [
    [-8.350000, 109.950000], // Barat Daya (Kulon Progo pesisir selatan)
    [-7.500000, 110.850000]  // Timur Laut (Gunung Merapi - Gunungkidul timur)
  ];

  /**
   * Membuat Custom DivIcon untuk Leaflet
   */
  function createMarkerIcon(category, isSelected = false) {
    if (isSelected) {
      return L.divIcon({
        className: 'custom-leaflet-marker',
        html: `
          <div class="marker-pin target">
            <i class="fa-solid fa-bullseye"></i>
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 34],
        popupAnchor: [0, -34]
      });
    }

    if (category === 'wisata') {
      return L.divIcon({
        className: 'custom-leaflet-marker',
        html: `
          <div class="marker-pin wisata">
            <i class="fa-solid fa-mountain-sun"></i>
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 34],
        popupAnchor: [0, -34]
      });
    } else {
      return L.divIcon({
        className: 'custom-leaflet-marker',
        html: `
          <div class="marker-pin kuliner">
            <i class="fa-solid fa-utensils"></i>
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 34],
        popupAnchor: [0, -34]
      });
    }
  }

  /**
   * Membuat Icon Khusus Lokasi GPS Perangkat Pengguna
   */
  function createUserGpsIcon() {
    return L.divIcon({
      className: 'user-gps-marker',
      html: `
        <div class="user-gps-pulse"></div>
        <div class="user-gps-core">
          <i class="fa-solid fa-location-crosshairs"></i>
        </div>
      `,
      iconSize: [44, 44],
      iconAnchor: [22, 22],
      popupAnchor: [0, -22]
    });
  }

  /**
   * Inisialisasi Peta Leaflet
   * @param {string} containerId ID elemen DOM container peta
   */
  function init(containerId = 'map') {
    if (map !== null) return map;

    map = L.map(containerId, {
      center: DIY_CENTER,
      zoom: DIY_DEFAULT_ZOOM,
      minZoom: 9,
      maxZoom: 18,
      zoomControl: false // Akan ditempatkan di posisi yang lebih rapi
    });

    // Kontrol Zoom di sudut kanan atas
    L.control.zoom({ position: 'topright' }).addTo(map);

    // OpenStreetMap Tile Layer Resmi
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors | Proyek GPS DIY'
    }).addTo(map);

    // Batasi panning hanya di sekitar D.I. Yogyakarta
    map.setMaxBounds(DIY_BOUNDS);

    // Buat layer group terpisah
    markersLayer = L.layerGroup().addTo(map);
    routeLayerGroup = L.layerGroup().addTo(map);

    return map;
  }

  /**
   * Menampilkan atau memperbarui posisi marker GPS pengguna
   * @param {number} lat
   * @param {number} lon
   * @param {number} accuracy Akurasi dalam meter
   */
  function setUserGpsMarker(lat, lon, accuracy = 0) {
    if (!map) return;

    const userLatLng = [lat, lon];

    if (!userGpsMarker) {
      userGpsMarker = L.marker(userLatLng, {
        icon: createUserGpsIcon(),
        zIndexOffset: 1000
      }).addTo(map);

      userGpsMarker.bindTooltip('<b>Lokasi GPS Anda</b><br>Titik awal perjalanan', {
        permanent: false,
        direction: 'top',
        offset: [0, -20]
      });
    } else {
      userGpsMarker.setLatLng(userLatLng);
    }

    // Tampilkan lingkaran estimasi akurasi jika akurasi > 15m
    if (accuracy > 15) {
      if (!userAccuracyCircle) {
        userAccuracyCircle = L.circle(userLatLng, {
          radius: Math.min(accuracy, 2000),
          color: '#10b981',
          fillColor: '#10b981',
          fillOpacity: 0.12,
          weight: 1
        }).addTo(map);
      } else {
        userAccuracyCircle.setLatLng(userLatLng);
        userAccuracyCircle.setRadius(Math.min(accuracy, 2000));
      }
    } else if (userAccuracyCircle) {
      map.removeLayer(userAccuracyCircle);
      userAccuracyCircle = null;
    }
  }

  /**
   * Memusatkan tampilan peta ke posisi GPS pengguna
   * @param {number} zoom
   */
  function centerToUserGps(zoom = 14) {
    if (userGpsMarker) {
      map.flyTo(userGpsMarker.getLatLng(), zoom, {
        animate: true,
        duration: 1.2
      });
    }
  }

  /**
   * Merender seluruh 40 marker lokasi ke peta
   * @param {Array} locations Array data lokasi dari database
   * @param {Function} onMarkerClick Callback saat marker diklik
   */
  function renderLocationMarkers(locations, onMarkerClick) {
    if (!markersLayer) return;

    markersLayer.clearLayers();
    locationMarkersMap.clear();

    locations.forEach(loc => {
      const latLng = [loc.latitude, loc.longitude];
      const icon = createMarkerIcon(loc.kategori, loc.id === selectedMarkerId);

      const marker = L.marker(latLng, {
        icon: icon,
        title: loc.nama
      });

      // Tooltip sederhana berbasis teks (tanpa gambar)
      const katLabel = loc.kategori === 'wisata' ? 'Wisata' : 'Kuliner';
      const tooltipContent = `
        <div style="font-family: inherit; font-size: 12px;">
          <strong style="color: #111827;">${loc.nama}</strong><br>
          <span style="color: #64748b;">${katLabel} &bull; ${loc.kabupaten_kota}</span>
        </div>
      `;
      marker.bindTooltip(tooltipContent, { direction: 'top', offset: [0, -30] });

      marker.on('click', () => {
        highlightMarker(loc.id, loc.kategori);
        if (typeof onMarkerClick === 'function') {
          onMarkerClick(loc);
        }
      });

      marker.locationData = loc;
      markersLayer.addLayer(marker);
      locationMarkersMap.set(loc.id, marker);
    });
  }

  /**
   * Menandai (highlight) marker terpilih dengan warna aksen merah
   * @param {number} id
   * @param {string} kategori
   */
  function highlightMarker(id, kategori) {
    // Kembalikan marker terpilih sebelumnya ke icon normal
    if (selectedMarkerId && locationMarkersMap.has(selectedMarkerId)) {
      const prevMarker = locationMarkersMap.get(selectedMarkerId);
      const prevKat = prevMarker.locationData.kategori;
      prevMarker.setIcon(createMarkerIcon(prevKat, false));
    }

    selectedMarkerId = id;

    // Ubah marker target ke icon merah
    if (locationMarkersMap.has(id)) {
      const currentMarker = locationMarkersMap.get(id);
      currentMarker.setIcon(createMarkerIcon(kategori || currentMarker.locationData.kategori, true));
      currentMarker.setZIndexOffset(900);
    }
  }

  /**
   * Menghilangkan highlight dari marker
   */
  function resetHighlight() {
    if (selectedMarkerId && locationMarkersMap.has(selectedMarkerId)) {
      const prevMarker = locationMarkersMap.get(selectedMarkerId);
      const prevKat = prevMarker.locationData.kategori;
      prevMarker.setIcon(createMarkerIcon(prevKat, false));
      prevMarker.setZIndexOffset(0);
    }
    selectedMarkerId = null;
  }

  /**
   * Memindahkan fokus peta ke lokasi tertentu
   * @param {number} lat
   * @param {number} lon
   * @param {number} zoom
   */
  function panToLocation(lat, lon, zoom = 14) {
    if (!map) return;
    map.flyTo([lat, lon], zoom, {
      animate: true,
      duration: 1.0
    });
  }

  /**
   * Menyesuaikan visibilitas marker berdasarkan hasil pencarian/filter
   * @param {Array<number>} visibleIds Array ID lokasi yang memenuhi kriteria
   */
  function filterMarkers(visibleIds) {
    const visibleSet = new Set(visibleIds.map(Number));
    locationMarkersMap.forEach((marker, id) => {
      if (visibleSet.has(Number(id))) {
        if (!markersLayer.hasLayer(marker)) {
          markersLayer.addLayer(marker);
        }
      } else {
        if (markersLayer.hasLayer(marker)) {
          markersLayer.removeLayer(marker);
        }
      }
    });
  }

  /**
   * Mengatur zoom dan pan peta agar seluruh batas koordinat terlihat rapi
   * @param {L.LatLngBounds} bounds
   */
  function fitBounds(bounds, padding = [50, 50]) {
    if (!map || !bounds) return;
    map.fitBounds(bounds, {
      padding: padding,
      maxZoom: 15,
      animate: true
    });
  }

  return {
    init,
    setUserGpsMarker,
    centerToUserGps,
    renderLocationMarkers,
    highlightMarker,
    resetHighlight,
    panToLocation,
    filterMarkers,
    fitBounds,
    getMap: () => map,
    getRouteLayerGroup: () => routeLayerGroup,
    getMarkerById: (id) => locationMarkersMap.get(id)
  };
})();
