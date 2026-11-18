/**
 * =====================================================================
 * SISTEM INFORMASI GEOGRAFIS & GPS LOKASI WISATA DAN KULINER DIY
 * Modul: Routing Engine & Multi-Destination Planner (routing.js)
 * Mendukung Moda Transportasi: Sepeda Motor, Mobil, dan Jalan Kaki
 * =====================================================================
 */

const RoutingModule = (function () {
  'use strict';

  let currentMode = 'mobil'; // 'motor' | 'mobil' | 'jalan_kaki'
  let destinations = []; // Array of destination objects: [{ id, nama, kategori, latitude, longitude, ... }]
  let currentPolyline = null;
  let waypointMarkers = [];
  let isCalculating = false;

  let listeners = {
    onRouteCalculated: [],
    onRouteCleared: [],
    onDestinationsChanged: [],
    onError: []
  };

  /**
   * Format jarak (meter / kilometer)
   */
  function formatDistance(meters) {
    if (meters < 1000) {
      return Math.round(meters) + ' m';
    }
    return (meters / 1000).toFixed(2).replace('.', ',') + ' km';
  }

  /**
   * Format durasi detik ke jam dan menit
   */
  function formatDuration(seconds) {
    const totalMinutes = Math.round(seconds / 60);
    if (totalMinutes < 60) {
      return totalMinutes + ' menit';
    }
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (minutes === 0) {
      return hours + ' jam';
    }
    return `${hours} jam ${minutes} mnt`;
  }

  /**
   * Mendapatkan URL routing engine berdasarkan moda transportasi
   * @param {string} mode
   * @param {string} coordsStr 'lon1,lat1;lon2,lat2;...'
   */
  function getDirectRoutingUrl(mode, coordsStr) {
    switch (mode) {
      case 'jalan_kaki':
        return `https://routing.openstreetmap.de/routed-foot/route/v1/driving/${coordsStr}?overview=full&geometries=geojson&steps=true`;
      case 'motor':
        return `https://routing.openstreetmap.de/routed-bike/route/v1/driving/${coordsStr}?overview=full&geometries=geojson&steps=true`;
      case 'mobil':
      default:
        return `https://router.project-osrm.org/route/v1/driving/${coordsStr}?overview=full&geometries=geojson&steps=true`;
    }
  }

  /**
   * Melakukan request rute ke routing engine dengan mekanisme fallback ke API backend proxy
   */
  async function fetchRouteFromEngine(mode, coordsStr) {
    const directUrl = getDirectRoutingUrl(mode, coordsStr);

    try {
      // 1. Coba request langsung ke OpenStreetMap / OSRM server publik
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 9000);

      const response = await fetch(directUrl, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
          return data.routes[0];
        }
      }
      throw new Error('Direct engine returned non-ok status');
    } catch (err) {
      console.warn('Direct routing request failed, falling back to local backend proxy:', err.message);

      // 2. Fallback ke API backend proxy PHP (api/route.php)
      const proxyUrl = `api/route.php?mode=${encodeURIComponent(mode)}&coords=${encodeURIComponent(coordsStr)}`;
      const proxyRes = await fetch(proxyUrl);
      if (!proxyRes.ok) {
        const errJson = await proxyRes.json().catch(() => ({}));
        throw new Error(errJson.message || 'Routing server tidak dapat dihubungi. Periksa koneksi internet.');
      }

      const proxyData = await proxyRes.json();
      if (proxyData.code === 'Ok' && proxyData.routes && proxyData.routes.length > 0) {
        return proxyData.routes[0];
      }
      throw new Error(proxyData.message || 'Rute jalan raya tidak ditemukan antara titik-titik tersebut.');
    }
  }

  /**
   * Menghitung rute tunggal antara 2 koordinat (digunakan untuk pop-up rekomendasi & panel detail)
   * @param {Object} startCoords { latitude, longitude }
   * @param {Object} destCoords { latitude, longitude }
   * @param {string} mode 'motor' | 'mobil' | 'jalan_kaki'
   */
  async function calculateSingleRoute(startCoords, destCoords, mode = currentMode) {
    if (!startCoords || !destCoords) {
      throw new Error('Koordinat awal dan tujuan harus lengkap');
    }

    const coordsStr = `${startCoords.longitude},${startCoords.latitude};${destCoords.longitude},${destCoords.latitude}`;
    const route = await fetchRouteFromEngine(mode, coordsStr);

    return {
      distanceMeters: route.distance,
      distanceText: formatDistance(route.distance),
      durationSeconds: route.duration,
      durationText: formatDuration(route.duration),
      geometry: route.geometry
    };
  }

  /**
   * Menghitung dan menggambar seluruh rute multi-destinasi
   */
  async function calculateMultiRoute() {
    const userPos = GPSModule.getPosition();
    if (!userPos) {
      const msg = 'Lokasi GPS perangkat belum tersedia. Izinkan akses GPS untuk memulai rute perjalanan.';
      listeners.onError.forEach(fn => fn(msg));
      throw new Error(msg);
    }

    if (destinations.length === 0) {
      clearRouteVisuals();
      listeners.onRouteCleared.forEach(fn => fn());
      return null;
    }

    isCalculating = true;

    try {
      // Susun string koordinat OSRM: Titik awal GPS + seluruh destinasi berurutan
      const waypoints = [
        `${userPos.longitude},${userPos.latitude}`,
        ...destinations.map(d => `${d.longitude},${d.latitude}`)
      ];
      const coordsStr = waypoints.join(';');

      const route = await fetchRouteFromEngine(currentMode, coordsStr);
      drawRouteOnMap(route);

      const summary = {
        mode: currentMode,
        destinationsCount: destinations.length,
        totalDistanceMeters: route.distance,
        totalDistanceText: formatDistance(route.distance),
        totalDurationSeconds: route.duration,
        totalDurationText: formatDuration(route.duration),
        destinations: [...destinations]
      };

      listeners.onRouteCalculated.forEach(fn => fn(summary));
      isCalculating = false;
      return summary;

    } catch (err) {
      isCalculating = false;
      clearRouteVisuals();
      listeners.onError.forEach(fn => fn(err.message));
      throw err;
    }
  }

  /**
   * Menggambar garis polyline rute pada peta Leaflet
   */
  function drawRouteOnMap(route) {
    const routeLayerGroup = MapModule.getRouteLayerGroup();
    if (!routeLayerGroup) return;

    clearRouteVisuals();

    // Buat koordinat Leaflet [lat, lon] dari GeoJSON Linestring [lon, lat]
    const latLngs = route.geometry.coordinates.map(coord => [coord[1], coord[0]]);

    // Garis polyline utama
    currentPolyline = L.polyline(latLngs, {
      color: '#1664b0',
      weight: 5,
      opacity: 0.85,
      lineCap: 'round',
      lineJoin: 'round'
    });

    routeLayerGroup.addLayer(currentPolyline);

    // Marker urutan waypoint (1, 2, 3...)
    destinations.forEach((dest, idx) => {
      const num = idx + 1;
      const markerIcon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: `
          <div style="
            width: 26px; height: 26px; border-radius: 50%;
            background-color: #d21624; color: #ffffff;
            display: flex; align-items: center; justify-content: center;
            font-size: 11px; font-weight: 800; border: 2px solid #ffffff;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          ">${num}</div>
        `,
        iconSize: [26, 26],
        iconAnchor: [13, 13]
      });

      const wpMarker = L.marker([dest.latitude, dest.longitude], {
        icon: markerIcon,
        zIndexOffset: 800
      });
      wpMarker.bindTooltip(`Tujuan ${num}: ${dest.nama}`, { direction: 'top' });

      routeLayerGroup.addLayer(wpMarker);
      waypointMarkers.push(wpMarker);
    });

    // Posisikan peta agar seluruh rute terlihat utuh
    MapModule.fitBounds(currentPolyline.getBounds(), [60, 60]);
  }

  /**
   * Membersihkan visual rute dari peta
   */
  function clearRouteVisuals() {
    const routeLayerGroup = MapModule.getRouteLayerGroup();
    if (routeLayerGroup) {
      routeLayerGroup.clearLayers();
    }
    currentPolyline = null;
    waypointMarkers = [];
  }

  /**
   * Menambahkan destinasi ke daftar rencana rute
   * @param {Object} location
   * @param {boolean} autoCalculate
   */
  function addDestination(location, autoCalculate = true) {
    // Cek apakah lokasi sudah ada di daftar rute
    const exists = destinations.some(d => d.id === location.id);
    if (exists) {
      listeners.onError.forEach(fn => fn(`"${location.nama}" sudah ada dalam daftar rute.`));
      return false;
    }

    destinations.push(location);
    listeners.onDestinationsChanged.forEach(fn => fn([...destinations]));

    if (autoCalculate && GPSModule.hasPosition()) {
      calculateMultiRoute().catch(() => {});
    }
    return true;
  }

  /**
   * Menghapus destinasi berdasarkan index
   * @param {number} index
   */
  function removeDestination(index) {
    if (index >= 0 && index < destinations.length) {
      destinations.splice(index, 1);
      listeners.onDestinationsChanged.forEach(fn => fn([...destinations]));

      if (destinations.length > 0 && GPSModule.hasPosition()) {
        calculateMultiRoute().catch(() => {});
      } else {
        clearRouteVisuals();
        listeners.onRouteCleared.forEach(fn => fn());
      }
    }
  }

  /**
   * Memindahkan posisi destinasi dalam urutan (Move Up / Down)
   */
  function moveDestination(fromIndex, toIndex) {
    if (fromIndex < 0 || fromIndex >= destinations.length ||
        toIndex < 0 || toIndex >= destinations.length) {
      return;
    }
    const [moved] = destinations.splice(fromIndex, 1);
    destinations.splice(toIndex, 0, moved);

    listeners.onDestinationsChanged.forEach(fn => fn([...destinations]));

    if (GPSModule.hasPosition()) {
      calculateMultiRoute().catch(() => {});
    }
  }

  /**
   * Menghapus seluruh daftar destinasi rute
   */
  function clearAllDestinations() {
    destinations = [];
    clearRouteVisuals();
    listeners.onDestinationsChanged.forEach(fn => fn([]));
    listeners.onRouteCleared.forEach(fn => fn());
  }

  /**
   * Mengganti moda transportasi ('motor' | 'mobil' | 'jalan_kaki')
   */
  function setTransportMode(mode) {
    if (mode === currentMode) return;
    currentMode = mode;

    if (destinations.length > 0 && GPSModule.hasPosition()) {
      calculateMultiRoute().catch(() => {});
    }
  }

  function on(eventName, callback) {
    if (listeners[eventName] && typeof callback === 'function') {
      listeners[eventName].push(callback);
    }
  }

  return {
    init: () => {},
    addDestination,
    removeDestination,
    moveDestination,
    clearAllDestinations,
    setTransportMode,
    calculateMultiRoute,
    calculateSingleRoute,
    getMode: () => currentMode,
    getDestinations: () => [...destinations],
    isCalculating: () => isCalculating,
    on
  };
})();
