<?php
/**
 * API: Rekomendasi Lokasi Terdekat Berdasarkan GPS Perangkat Pengguna
 * Method: GET
 * Query Params:
 *  - lat: (Wajib) Latitude posisi perangkat pengguna
 *  - lon: (Wajib) Longitude posisi perangkat pengguna
 *  - kategori: (Opsional) 'semua' | 'wisata' | 'kuliner'
 *  - limit: (Opsional) Jumlah kandidat teratas (default: 5)
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/functions.php';

try {
    if (!isset($_GET['lat']) || !isset($_GET['lon'])) {
        sendJsonResponse([
            'status'  => 'error',
            'code'    => 400,
            'message' => 'Parameter posisi GPS perangkat (lat dan lon) wajib disertakan.'
        ], 400);
    }

    $rawLat = $_GET['lat'];
    $rawLon = $_GET['lon'];

    if (!validateCoordinates($rawLat, $rawLon)) {
        sendJsonResponse([
            'status'  => 'error',
            'code'    => 400,
            'message' => 'Nilai koordinat GPS tidak valid. Pastikan latitude (-90 s/d 90) dan longitude (-180 s/d 180).'
        ], 400);
    }

    $userLat = (float) $rawLat;
    $userLon = (float) $rawLon;
    $kategori = isset($_GET['kategori']) ? trim($_GET['kategori']) : 'semua';
    $limit = isset($_GET['limit']) ? max(1, min(20, (int) $_GET['limit'])) : 5;

    $sql = "SELECT * FROM `lokasi`";
    $params = [];

    if ($kategori !== '' && strtolower($kategori) !== 'semua') {
        $sql .= " WHERE `kategori` = :kategori";
        $params[':kategori'] = strtolower($kategori);
    }

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $locations = $stmt->fetchAll();

    if (!$locations) {
        sendJsonResponse([
            'status'  => 'error',
            'code'    => 404,
            'message' => 'Tidak ditemukan data lokasi untuk dilakukan rekomendasi.'
        ], 404);
    }

    // Hitung jarak garis lurus Haversine untuk seluruh lokasi
    $candidates = [];
    foreach ($locations as $loc) {
        $distMeters = calculateHaversineDistance(
            $userLat,
            $userLon,
            (float) $loc['latitude'],
            (float) $loc['longitude']
        );

        $candidates[] = [
            'id'                     => (int) $loc['id'],
            'nama'                   => $loc['nama'],
            'kategori'               => $loc['kategori'],
            'kabupaten_kota'         => $loc['kabupaten_kota'],
            'latitude'               => (float) $loc['latitude'],
            'longitude'              => (float) $loc['longitude'],
            'alamat'                 => $loc['alamat'],
            'rating'                 => $loc['rating'] !== null ? (float) $loc['rating'] : null,
            'tingkat_keramaian'      => $loc['tingkat_keramaian'],
            'jam_operasional'        => $loc['jam_operasional'],
            'deskripsi'              => $loc['deskripsi'],
            'jarak_haversine_meter'  => round($distMeters, 1),
            'jarak_haversine_teks'   => formatDistance($distMeters)
        ];
    }

    // Urutkan berdasarkan jarak Haversine terdekat
    usort($candidates, function ($a, $b) {
        return ($a['jarak_haversine_meter'] <=> $b['jarak_haversine_meter']);
    });

    // Ambil rekomendasi terbaik (paling dekat) dan beberapa alternatif teratas
    $recommended = $candidates[0];
    $topCandidates = array_slice($candidates, 0, $limit);

    sendJsonResponse([
        'status'         => 'success',
        'user_pos'       => [
            'latitude'  => $userLat,
            'longitude' => $userLon
        ],
        'total_analyzed' => count($candidates),
        'recommended'    => $recommended,
        'candidates'     => $topCandidates
    ]);

} catch (PDOException $e) {
    sendJsonResponse([
        'status'  => 'error',
        'code'    => 500,
        'message' => 'Terjadi kesalahan basis data saat menghitung rekomendasi.'
    ], 500);
} catch (Exception $e) {
    sendJsonResponse([
        'status'  => 'error',
        'code'    => 500,
        'message' => 'Terjadi kesalahan sistem: ' . $e->getMessage()
    ], 500);
}
