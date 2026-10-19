<?php
    error_reporting(E_ALL);
    ini_set('display_errors', '1');
	$headers = apache_request_headers();
	$ini = parse_ini_file('../bcagentapp.ini.php');
	$conn = oci_connect($ini['db_user'], 
						$ini['db_password'], 
						$ini['db_conn']);
	// Get EdiPnId and UniqueId from request headers
	foreach ($headers as $header => $value) {
		if ($header == $ini['map_edi']) {
			$ediPinId = $value;
		}
		if ($header == $ini['map_unique']) {
			$uniqueId = $value;
		}
	}
	// read unique ID only if edi Pin Id is empty.
	$evalue = empty($ediPinId) ? $uniqueId : $ediPinId;
	$ename = uniqid();
	$sessionUrl = $ini['app_redirect_url'].$ename;
	$sql = 'INSERT INTO edi(ename, evalue) VALUES (:ename, :evalue)';
	if ($conn) {
		$compiled = oci_parse($conn, $sql);
		oci_bind_by_name($compiled, ':ename', $ename);
		oci_bind_by_name($compiled, ':evalue', $evalue);
		oci_execute($compiled);
	}
	// add unique session id to redirect url
	header("Location: $sessionUrl");
?>