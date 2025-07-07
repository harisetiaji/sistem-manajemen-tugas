<?php
require_once 'config.php';

// Ambil provider dari session untuk mengetahui siapa yang merespons
$providerName = $_SESSION['provider'] ?? '';

if (empty($_GET['state']) || ($_GET['state'] !== $_SESSION['oauth2state'])) {
    unset($_SESSION['oauth2state']);
    exit('Invalid state');
}

if ($providerName === 'google') {
    $provider = new League\OAuth2\Client\Provider\Google([
        'clientId'     => GOOGLE_CLIENT_ID,
        'clientSecret' => GOOGLE_CLIENT_SECRET,
        'redirectUri'  => REDIRECT_URL,
    ]);
} elseif ($providerName === 'github') {
    $provider = new League\OAuth2\Client\Provider\Github([
        'clientId'     => GITHUB_CLIENT_ID,
        'clientSecret' => GITHUB_CLIENT_SECRET,
        'redirectUri'  => REDIRECT_URL,
    ]);
} else {
    die('Provider tidak valid dari callback.');
}

try {
    // Dapatkan access token dari provider menggunakan authorization code
    $token = $provider->getAccessToken('authorization_code', [
        'code' => $_GET['code']
    ]);

    // Dapatkan detail pengguna dari provider
    $oauthUser = $provider->getResourceOwner($token);

    // Cek apakah pengguna sudah ada di database kita
    $stmt = $pdo->prepare("SELECT * FROM users WHERE oauth_provider = ? AND oauth_uid = ?");
    $stmt->execute([$providerName, $oauthUser->getId()]);
    $user = $stmt->fetch();

    if (!$user) {
        // Jika pengguna belum ada, daftarkan (INSERT)
        $email = $oauthUser->getEmail();
        // GitHub mungkin tidak menyediakan email publik, perlu penanganan khusus
        if (empty($email) && $providerName === 'github') {
            // Anda bisa mencoba mengambil email non-publik jika scope mengizinkan
            // Untuk sekarang kita biarkan null jika tidak ada
            $email = null;
        }

        $stmt = $pdo->prepare("INSERT INTO users (oauth_provider, oauth_uid, nama, email) VALUES (?, ?, ?, ?)");
        $stmt->execute([$providerName, $oauthUser->getId(), $oauthUser->getName(), $email]);
        
        $userId = $pdo->lastInsertId();
    } else {
        // Jika pengguna sudah ada, gunakan ID yang ada
        $userId = $user['id'];
    }

    // Buat sesi untuk pengguna
    $_SESSION['user_id'] = $userId;
    $_SESSION['user_nama'] = $oauthUser->getName();

    // Redirect kembali ke halaman utama
    header('Location: index.php');
    exit;

} catch (Exception $e) {
    die('Terjadi kesalahan: ' . $e->getMessage());
}
?>