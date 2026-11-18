<?php
/**
 * API: Pencarian dan Filter Data Lokasi (Nama, Kategori, Wilayah)
 * Method: GET
 * Query Params:
 *  - q: Kata kunci pencarian nama tempat
 *  - kategori: 'semua' | 'wisata' | 'kuliner'
 *  - wilayah: 'semua' | 'Kota Yogyakarta' | 'Sleman' | 'Bantul' | 'Gunungkidul' | 'Kulon Progo'
 *  - lat: Latitude GPS pengguna (opsional)
 *  - lon: Longitude GPS pengguna (opsional)
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../includes/functions.php';

try {
    $keyword   = isset($_GET['q']) ? trim($_GET['q']) : '';
    $kategori  = isset($_GET['kategori']) ? trim($_GET['kategori']) : 'semua';
    $wilayah   = isset($_GET['wilayah']) ? trim($_GET['wilayah']) : 'semua';

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

    // Bangun query dinamis menggunakan Prepared Statements
    $sql = "SELECT * FROM `lokasi` WHERE 1=1";
    $params = [];

    // Filter Kata Kunci Nama
    if ($keyword !== '') {
        $sql .= " AND (`nama` LIKE :kw OR `deskripsi` LIKE :kw_desc OR `alamat` LIKE :kw_addr)";
        $params[':kw'] = '%' . $keyword . '%';
        $params[':kw_desc'] = '%' . $keyword . '%';
        $params[':kw_addr'] = '%' . $keyword . '%';
    }

    // Filter Kategori
    if ($kategori !== '' && strtolower($kategori) !== 'semua') {
        $sql .= " AND `kategori` = :kategori";
        $params[':kategori'] = strtolower($kategori);
    }

    // Filter Wilayah (Kabupaten/Kota)
    if ($wilayah !== '' && strtolower($wilayah) !== 'semua' && strtolower($wilayah) !== 'semua wilayah') {
        $sql .= " AND `kabupaten_kota` LIKE :wilayah";
        $params[':wilayah'] = '%' . $wilayah . '%';
    }

    $sql .= " ORDER BY `id` ASC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $locations = $stmt->fetchAll();

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

    // Urutkan berdasarkan jarak jika GPS tersedia
    if ($hasGps) {
        usort($results, function ($a, $b) {
            return ($a['jarak_haversine_meter'] <=> $b['jarak_haversine_meter']);
        });
    }

    sendJsonResponse([
        'status'  => 'success',
        'count'   => count($results),
        'filters' => [
            'keyword'  => $keyword,
            'kategori' => $kategori,
            'wilayah'  => $wilayah
        ],
        'has_gps' => $hasGps,
        'data'    => $results
    ]);

} catch (PDOException $e) {
    sendJsonResponse([
        'status'  => 'error',
        'code'    => 500,
        'message' => 'Terjadi kesalahan saat memfilter data dari database.'
    ], 500);
} catch (Exception $e) {
    sendJsonResponse([
        'status'  => 'error',
        'code'    => 500,
        'message' => 'Terjadi kesalahan internal server: ' . $e->getMessage()
    ], 500);
}
