/**
 * =====================================================================
 * SISTEM INFORMASI GEOGRAFIS & GPS LOKASI WISATA DAN KULINER DIY
 * Modul: GPS Perangkat (gps.js)
 * Menggunakan Browser Geolocation API (navigator.geolocation)
 * =====================================================================
 */

const GPSModule = (function () {
  'use strict';

  let currentPosition = null; // { latitude, longitude, accuracy, timestamp }
  let watchId = null;
  let isRequesting = false;
  let listeners = {
    onSuccess: [],
    onError: [],
    onStatusChange: []
  };

  /**
   * Opsi geolokasi berakurasi tinggi
   */
  const geoOptions = {
    enableHighAccuracy: true,
    timeout: 15000,
    maximumAge: 0
  };

  /**
   * Mengirim event perubahan status internal
   * @param {string} status 'init' | 'searching' | 'active' | 'error'
   * @param {string} message
   */
  function notifyStatus(status, message) {
    listeners.onStatusChange.forEach(fn => fn(status, message));
  }

  /**
   * Meminta koordinat GPS perangkat pengguna
   * @returns {Promise<Object>} koordinat { latitude, longitude, accuracy }
   */
  function requestPosition() {
    return new Promise((resolve, reject) => {
      if (!('geolocation' in navigator)) {
        const errorMsg = 'Browser Anda tidak mendukung Geolocation API. Silakan gunakan browser modern seperti Chrome, Firefox, atau Edge.';
        notifyStatus('error', errorMsg);
        listeners.onError.forEach(fn => fn(errorMsg, 'NOT_SUPPORTED'));
        return reject(new Error(errorMsg));
      }

      isRequesting = true;
      notifyStatus('searching', 'Mencari sinyal GPS perangkat...');

      navigator.geolocation.getCurrentPosition(
        (position) => {
          isRequesting = false;
          const coords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp
          };

          currentPosition = coords;
          notifyStatus('active', 'Lokasi GPS berhasil diperoleh');
          listeners.onSuccess.forEach(fn => fn(coords));
          resolve(coords);
        },
        (error) => {
          isRequesting = false;
          let userMessage = '';

          switch (error.code) {
            case error.PERMISSION_DENIED:
              userMessage = 'Izin akses lokasi ditolak oleh pengguna. Silakan aktifkan izin lokasi di pengaturan browser Anda.';
              break;
            case error.POSITION_UNAVAILABLE:
              userMessage = 'Sinyal GPS perangkat tidak dapat dideteksi atau dinonaktifkan. Pastikan GPS/Location perangkat telah dinyalakan.';
              break;
            case error.TIMEOUT:
              userMessage = 'Waktu permintaan lokasi GPS habis (timeout). Silakan periksa koneksi atau coba tombol perbarui lokasi.';
              break;
            default:
              userMessage = 'Terjadi kesalahan saat mendeteksi lokasi GPS: ' + (error.message || 'Unknown error');
              break;
          }

          notifyStatus('error', userMessage);
          listeners.onError.forEach(fn => fn(userMessage, error.code));
          reject(new Error(userMessage));
        },
        geoOptions
      );
    });
  }

  /**
   * Mulai memantau pergerakan lokasi GPS (watchPosition)
   */
  function startWatch() {
    if (!('geolocation' in navigator) || watchId !== null) return;

    watchId = navigator.geolocation.watchPosition(
      (position) => {
        const coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        };
        currentPosition = coords;
        notifyStatus('active', 'Lokasi GPS diperbarui');
        listeners.onSuccess.forEach(fn => fn(coords));
      },
      (error) => {
        // Abaikan transient error saat watch jika sudah memiliki posisi awal
        console.warn('GPS Watch warning:', error.message);
      },
      geoOptions
    );
  }

  /**
   * Hentikan pemantauan GPS
   */
  function stopWatch() {
    if (watchId !== null && 'geolocation' in navigator) {
      navigator.geolocation.clearWatch(watchId);
      watchId = null;
    }
  }

  /**
   * Mendaftarkan event listener
   */
  function on(eventName, callback) {
    if (listeners[eventName] && typeof callback === 'function') {
      listeners[eventName].push(callback);
    }
  }

  return {
    requestPosition,
    startWatch,
    stopWatch,
    on,
    getPosition: () => currentPosition,
    hasPosition: () => currentPosition !== null,
    isSearching: () => isRequesting
  };
})();
