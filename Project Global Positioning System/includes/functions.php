<?php
/**
 * Fungsi-Fungsi Pendukung Sistem GIS & GPS Wisata & Kuliner DIY
 */

/**
 * Mengirimkan respon standar JSON dengan HTTP Status Code yang tepat
 *
 * @param array $data
 * @param int $statusCode
 * @return void
 */
function sendJsonResponse(array $data, int $statusCode = 200): void {
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
    
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

/**
 * Menghitung jarak garis lurus (great-circle distance) antara dua titik koordinat
 * menggunakan rumus Haversine.
 *
 * @param float $lat1 Latitude titik 1 (derajat desimal)
 * @param float $lon1 Longitude titik 1 (derajat desimal)
 * @param float $lat2 Latitude titik 2 (derajat desimal)
 * @param float $lon2 Longitude titik 2 (derajat desimal)
 * @param float $earthRadius Radius bumi dalam meter (default: 6.371.000 meter)
 * @return float Jarak dalam meter
 */
function calculateHaversineDistance(float $lat1, float $lon1, float $lat2, float $lon2, float $earthRadius = 6371000): float {
    // Konversi derajat ke radian
    $phi1 = deg2rad($lat1);
    $phi2 = deg2rad($lat2);
    $deltaPhi = deg2rad($lat2 - $lat1);
    $deltaLambda = deg2rad($lon2 - $lon1);

    // Rumus Haversine:
    // a = sin²(Δφ/2) + cos(φ1) * cos(φ2) * sin²(Δλ/2)
    // c = 2 * atan2(√a, √(1-a))
    // d = R * c
    $a = sin($deltaPhi / 2) * sin($deltaPhi / 2) +
         cos($phi1) * cos($phi2) *
         sin($deltaLambda / 2) * sin($deltaLambda / 2);
         
    $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

    return $earthRadius * $c;
}

/**
 * Memformat jarak dalam meter ke satuan yang ramah pengguna:
 * - Meter jika jarak < 1.000 meter
 * - Kilometer jika jarak >= 1.000 meter
 *
 * @param float $meters
 * @return string
 */
function formatDistance(float $meters): string {
    if ($meters < 1000) {
        return round($meters) . ' m';
    }
    $km = $meters / 1000;
    return number_format($km, 2, ',', '.') . ' km';
}

/**
 * Memformat durasi detik ke dalam representasi jam dan menit
 *
 * @param float|int $seconds
 * @return string
 */
function formatDuration($seconds): string {
    $seconds = (int) round($seconds);
    if ($seconds < 60) {
        return $seconds . ' detik';
    }
    $minutes = (int) round($seconds / 60);
    if ($minutes < 60) {
        return $minutes . ' menit';
    }
    $hours = floor($minutes / 60);
    $remainingMinutes = $minutes % 60;
    
    if ($remainingMinutes === 0) {
        return $hours . ' jam';
    }
    return $hours . ' jam ' . $remainingMinutes . ' menit';
}

/**
 * Memvalidasi apakah koordinat latitude dan longitude berada dalam rentang valid
 *
 * @param mixed $lat
 * @param mixed $lon
 * @return bool
 */
function validateCoordinates($lat, $lon): bool {
    if (!is_numeric($lat) || !is_numeric($lon)) {
        return false;
    }
    $lat = (float) $lat;
    $lon = (float) $lon;
    
    // Latitude dunia: -90 s/d 90
    // Longitude dunia: -180 s/d 180
    return ($lat >= -90.0 && $lat <= 90.0 && $lon >= -180.0 && $lon <= 180.0);
}

/**
 * Memastikan nilai yang berpotensi NULL diformat dengan teks ramah pengguna
 * sesuai ketentuan proyek jika belum tersedia.
 *
 * @param mixed $val
 * @param string $suffix
 * @return string
 */
function formatNullableInfo($val, string $suffix = ''): string {
    if ($val === null || $val === '' || strtolower((string)$val) === 'null') {
        return 'Informasi belum tersedia';
    }
    return (string)$val . $suffix;
}
