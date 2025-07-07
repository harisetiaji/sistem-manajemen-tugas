<?php
require_once 'config.php';

$providerName = $_GET['provider'] ?? '';

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
    die('Provider tidak didukung.');
}

if (!isset($_GET['code'])) {
    // Jika belum ada authorization code, maka redirect
    if ($providerName === 'google') {
        $authUrl = $provider->getAuthorizationUrl([
            'scope' => ['email', 'profile']
        ]);
    } elseif ($providerName === 'github') {
        $authUrl = $provider->getAuthorizationUrl([
            'scope' => ['user:email']
        ]);
    } else {
        // Default or error handling if provider is not recognized
        die('Provider tidak didukung atau scope tidak didefinisikan.');
    }
    $_SESSION['oauth2state'] = $provider->getState();
    $_SESSION['provider'] = $providerName; // Tambahkan baris ini
    header('Location: ' . $authUrl);
    exit;
} else {
    // Nanti akan ditangani di callback.php
    header('Location: index.html');
    exit;
}
?>