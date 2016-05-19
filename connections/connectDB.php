<?php
// Name : connnectDB.php

$dbhost  = "localhost";
$dbname  = "dbName_MyTodoDB";
$dbuname = "myDbUserName";
$dbpass  = "myPassWord";

$connect = mysql_connect($dbhost, $dbuname, $dbpass) or die("Could not connect to server $server" + mysql_error()); 
$db= mysql_select_db($dbname) or die("Could not select database"+ mysql_error());

mysql_set_charset('utf8', $connect);		
?>