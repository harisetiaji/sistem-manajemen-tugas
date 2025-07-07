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
    $authUrl = $provider->getAuthorizationUrl([
        'scope' => [
            'email', // Scope untuk Google
            'user:email' // Scope untuk GitHub
        ]
    ]);
    $_SESSION['oauth2state'] = $provider->getState();
    header('Location: ' . $authUrl);
    exit;
} else {
    // Nanti akan ditangani di callback.php
    header('Location: index.php');
    exit;
}
?>