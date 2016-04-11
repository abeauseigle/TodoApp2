<?php
// Name : connDbUP.php
// Pour la BD de ExpertUP et RDnet : ID = affaire_alainb PW = A77airesUp_D6+ prefix = EX_ pour ExpertUP et RN_ pour RDnet

// Prevent caching.
///header('Cache-Control: no-cache, must-revalidate');
///header('Expires: Mon, 01 Jan 1996 00:00:00 GMT');

// The JSON standard MIME header.
///header('Content-type: application/json');
//$id = $_GET['id'];	// usefull if we need a specific record

$dbhost = "localhost";
$dbname = "affaire_MyTodo";	//"affaire_MyTodo" pour le prod
$dbuname = "affaire_mobile";
$dbpass = "A77airesUp_D6+";
/*
	$dbhost  = "localhost";
	$dbname  = "__________";
	$dbuname = "__________";
	$dbpass  = "__________";
*/	
$connect = mysql_connect($dbhost, $dbuname, $dbpass) or die("Impossible de se connecter au serveur $server" + mysql_error()); 
//$connect = mysql_connect ($dbhost, $dbuname, $dbpass) or header("Location: ExpertUPDown.html"); //die(mysql_error());
$db= mysql_select_db($dbname) or die("Could not select database"+ mysql_error());

mysql_set_charset('utf8', $connect);		
?>