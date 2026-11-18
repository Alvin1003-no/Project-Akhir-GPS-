<?php
/**
 * API: Routing Engine Proxy (Mendukung Sepeda Motor, Mobil, dan Jalan Kaki)
 * Method: GET
 * Query Params:
 *  - mode: 'motor' | 'mobil' | 'jalan_kaki'
 *  - coords: Format koordinat OSRM 'lon1,lat1;lon2,lat2;lon3,lat3...'
 */

require_once __DIR__ . '/../includes/functions.php';

$mode = isset($_GET['mode']) ? strtolower(trim($_GET['mode'])) : 'mobil';
$coords = isset($_GET['coords']) ? trim($_GET['coords']) : '';

if (empty($coords)) {
    sendJsonResponse([
        'status'  => 'error',
        'code'    => 400,
        'message' => 'Parameter koordinat rute (coords) wajib disertakan.'
    ], 400);
}

// Tentukan endpoint routing engine berdasarkan profil moda transportasi
// 1. Mobil: OSRM Driving Engine
// 2. Jalan Kaki: OSRM Routed Foot Engine
// 3. Sepeda Motor: OSRM Routed Bike / Driving Engine yang disesuaikan
switch ($mode) {
    case 'jalan_kaki':
    case 'walking':
    case 'foot':
        $url = "https://routing.openstreetmap.de/routed-foot/route/v1/driving/{$coords}?overview=full&geometries=geojson&steps=true";
        break;

    case 'motor':
    case 'motorcycle':
    case 'sepeda_motor':
    case 'bike':
        $url = "https://routing.openstreetmap.de/routed-bike/route/v1/driving/{$coords}?overview=full&geometries=geojson&steps=true";
        break;

    case 'mobil':
    case 'car':
    case 'driving':
    default:
        $url = "https://router.project-osrm.org/route/v1/driving/{$coords}?overview=full&geometries=geojson&steps=true";
        break;
}

$ch = curl_init();
curl_setopt_array($ch, [
    CURLOPT_URL            => $url,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_TIMEOUT        => 12,
    CURLOPT_USERAGENT      => 'GPS-Wisata-Kuliner-DIY/1.0 (Web GIS Educational Project)'
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

if ($response === false || $httpCode !== 200) {
    // Jika endpoint khusus sepeda motor/jalan kaki sibuk, coba fallback ke OSRM driving
    if ($mode === 'motor' || $mode === 'jalan_kaki') {
        $fallbackUrl = "https://router.project-osrm.org/route/v1/driving/{$coords}?overview=full&geometries=geojson&steps=true";
        $ch2 = curl_init();
        curl_setopt_array($ch2, [
            CURLOPT_URL            => $fallbackUrl,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_TIMEOUT        => 10,
            CURLOPT_USERAGENT      => 'GPS-Wisata-Kuliner-DIY/1.0'
        ]);
        $fallbackResponse = curl_exec($ch2);
        $fallbackCode = curl_getinfo($ch2, CURLINFO_HTTP_CODE);
        curl_close($ch2);

        if ($fallbackResponse !== false && $fallbackCode === 200) {
            $data = json_decode($fallbackResponse, true);
            // Sesuaikan durasi realistis berdasarkan moda transportasi jika menggunakan fallback jaringan
            if (isset($data['routes'][0])) {
                $distMeters = $data['routes'][0]['distance'];
                if ($mode === 'jalan_kaki') {
                    // Kecepatan jalan kaki rata-rata ~4.5 km/jam (1.25 m/s)
                    $data['routes'][0]['duration'] = round($distMeters / 1.25);
                } elseif ($mode === 'motor') {
                    // Kecepatan motor di DIY rata-rata ~35 km/jam (9.7 m/s)
                    $data['routes'][0]['duration'] = round($distMeters / 9.7);
                }
            }
            sendJsonResponse($data, 200);
        }
    }

    sendJsonResponse([
        'status'     => 'error',
        'code'       => 502,
        'message'    => 'Gagal menghubungi routing engine publik OpenStreetMap. Periksa koneksi internet Anda.',
        'curl_error' => $curlError
    ], 502);
}

$decoded = json_decode($response, true);
if (json_last_error() !== JSON_ERROR_NONE) {
    sendJsonResponse([
        'status'  => 'error',
        'code'    => 500,
        'message' => 'Respon dari routing server tidak valid.'
    ], 500);
}

sendJsonResponse($decoded, 200);
