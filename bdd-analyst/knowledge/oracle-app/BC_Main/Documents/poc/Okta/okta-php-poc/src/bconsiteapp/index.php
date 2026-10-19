<?php
session_start();

$ini = parse_ini_file('../settings/poc_app.ini.php');
$conn = oci_connect($ini['db_user'], 
          $ini['db_password'], 
          $ini['db_conn']);


if(isset($_GET['logout'])) {
  unset($_SESSION['username']);
  unset($_SESSION['sub']);
  header('Location: /');
  die();
}


$metadata = http($ini['metadata_url']);


if(!isset($_GET['code'])) {

  $_SESSION['state'] = bin2hex(random_bytes(5));
  $_SESSION['code_verifier'] = bin2hex(random_bytes(50));
  $code_challenge = base64_urlencode(hash('sha256', $_SESSION['code_verifier'], true));

  $authorize_url = $metadata->authorization_endpoint.'?'.http_build_query([
    'response_type' => 'code',
    'client_id' => $ini['onsite_client_id'],
    'redirect_uri' => $ini['onsite_redirect_uri'],
    'state' => $_SESSION['state'],
    'scope' => 'openid profile',
    'code_challenge' => $code_challenge,
    'code_challenge_method' => 'S256',
  ]);

  header("Location: $authorize_url");
  // echo '<p>Not logged in</p>';
  // echo '<p><a href="'.$authorize_url.'">Log In</a></p>';

} else {

  if($_SESSION['state'] != $_GET['state']) {
    die('Authorization server returned an invalid state parameter');
  }

  if(isset($_GET['error'])) {
    die('Authorization server returned an error: '.htmlspecialchars($_GET['error']));
  }

  $response = http($metadata->token_endpoint, [
    'grant_type' => 'authorization_code',
    'code' => $_GET['code'],
    'redirect_uri' => $ini['onsite_redirect_uri'],
    'client_id' => $ini['onsite_client_id'],
    'client_secret' => $ini['onsite_client_secret'],
    'code_verifier' => $_SESSION['code_verifier'],
  ]);

  if(!isset($response->access_token)) {
    die('Error fetching access token');
  }

  $userinfo = http($metadata->userinfo_endpoint, [
    'access_token' => $response->access_token,
  ]);



  if($userinfo->sub) {
    $evalue = $userinfo->preferred_username;
    $ename = uniqid();
    $sessionUrl = $ini['onsite_redirect_url'].$ename;
    $sql = 'INSERT INTO edi(ename, evalue) VALUES (:ename, :evalue)';
    if ($conn) {
      $compiled = oci_parse($conn, $sql);
      oci_bind_by_name($compiled, ':ename', $ename);
      oci_bind_by_name($compiled, ':evalue', $evalue);
      oci_execute($compiled);
    }
    unset($_SESSION['username']);
    unset($_SESSION['sub']);
    unset($_SESSION['state']);

    header("Location: $sessionUrl");
    die();
  }
}



// Base64-urlencoding is a simple variation on base64-encoding
// Instead of +/ we use -_, and the trailing = are removed.
function base64_urlencode($string) {
  return rtrim(strtr(base64_encode($string), '+/', '-_'), '=');
}


function http($url, $params=false) {
  $ch = curl_init($url);
  curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
  curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
  curl_setopt($ch, CURLOPT_IPRESOLVE, CURL_IPRESOLVE_V4);
  if($params)
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($params));
  
  return json_decode(curl_exec($ch));
}