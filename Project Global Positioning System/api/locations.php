<?php
/**
 * API: Mengambil Seluruh Data Lokasi (Wisata & Kuliner)
 * Method: GET
 * Optional Query Params:
 *  - lat: Latitude GPS pengguna (untuk menghitung jarak garis lurus Haversine)
 *  - lon: Longitude GPS pengguna
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/functions.php';

try {
    $hasGps = false;
    $userLat = null;
    $userLon = null;

    if (isset($_GET['lat']) && isset($_GET['lon'])) {
        $rawLat = $_GET['lat'];
        $rawLon = $_GET['lon'];
        if (validateCoordinates($rawLat, $rawLon)) {
            $hasGps = true;
            $userLat = (float) $rawLat;
            $userLon = (float) $rawLon;
        }
    }

    $stmt = $pdo->prepare("SELECT * FROM `lokasi` ORDER BY `id` ASC");
    $stmt->execute();
    $locations = $stmt->fetchAll();

    if (!$locations) {
        sendJsonResponse([
            'status'  => 'success',
            'count'   => 0,
            'message' => 'Belum ada data lokasi pada database.',
            'data'    => []
        ]);
    }

    $results = [];
    foreach ($locations as $loc) {
        $item = [
            'id'                => (int) $loc['id'],
            'nama'              => $loc['nama'],
            'kategori'          => $loc['kategori'],
            'kabupaten_kota'    => $loc['kabupaten_kota'],
            'latitude'          => (float) $loc['latitude'],
            'longitude'         => (float) $loc['longitude'],
            'alamat'            => $loc['alamat'],
            'rating'            => $loc['rating'] !== null ? (float) $loc['rating'] : null,
            'tingkat_keramaian' => $loc['tingkat_keramaian'],
            'jam_operasional'   => $loc['jam_operasional'],
            'deskripsi'         => $loc['deskripsi']
        ];

        // Jika posisi GPS pengguna dikirimkan, hitung jarak garis lurus Haversine
        if ($hasGps) {
            $distMeters = calculateHaversineDistance(
                $userLat,
                $userLon,
                (float) $loc['latitude'],
                (float) $loc['longitude']
            );
            $item['jarak_haversine_meter'] = round($distMeters, 1);
            $item['jarak_haversine_teks']  = formatDistance($distMeters);
        } else {
            $item['jarak_haversine_meter'] = null;
            $item['jarak_haversine_teks']  = null;
        }

        $results[] = $item;
    }

    // Jika ada GPS, urutkan lokasi dari yang terdekat
    if ($hasGps) {
        usort($results, function ($a, $b) {
            return ($a['jarak_haversine_meter'] <=> $b['jarak_haversine_meter']);
        });
    }

    sendJsonResponse([
        'status'  => 'success',
        'count'   => count($results),
        'has_gps' => $hasGps,
        'user_pos'=> $hasGps ? ['lat' => $userLat, 'lon' => $userLon] : null,
        'data'    => $results
    ]);

} catch (PDOException $e) {
    sendJsonResponse([
        'status'  => 'error',
        'code'    => 500,
        'message' => 'Terjadi kesalahan saat mengambil data lokasi dari database.'
    ], 500);
} catch (Exception $e) {
    sendJsonResponse([
        'status'  => 'error',
        'code'    => 500,
        'message' => 'Terjadi kesalahan internal server: ' . $e->getMessage()
    ], 500);
}
