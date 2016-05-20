<?php
// Name   : webSqlSyncAdapter.php - called by the webSqlApp (index.html)
// Goal   : To communicate data from a MySQL query using myJob to a webSqlSync json format. Result: It works one way. All server table data to Client.
// Version: 2016-03-08
// It uses: webSqlSyncHandler.php, and loginCheck.php that uses connections/connDbUP.php;
// To do  : Get the username and the password from client side and implement a secured auth with base64

//header('content-type: application/json; charset=utf-8');	//To have a json with accent

session_start();
//echo "<br>", "Adapter Start: ", date("Y-m-d H:i:s"), "<br>";

include("webSqlSyncHandler.php");
$handler = new SqlSyncHandler();	// to initialize the json handler from 'php://input'. It put it in $clientData
$handler -> call('myJob',$handler);	// call a custom function which will make a job with parsed data
	
function myJob($handler){
	$currentDateTime =  date("Y-m-d H:i:s");
	$clientLastSyncDate = $handler -> clientData['info']['lastSyncDate']/1000;	// It gives a 10 digits unix date time

// To test with http://www.mywebsite.com/todoapp/webSqlSyncAdapter.php
/*
$BDBid == 0;
$username = "______"; // Desactivate lines 27,28 29
$password = "______"; 
*/
	$BDBid = $handler -> clientData['info']['BDBid'];	// Browser DB unique id (attributed at the First sync). Equal to the first sync DateTime in Unix format.
	$username = $handler -> clientData['info']['username'];
	$password = $handler -> clientData['info']['password'];

	include ("loginCheck.php");
	session_write_close();	// close the session Ref: http://konrness.com/php5/how-to-prevent-blocking-php-requests/

	//echo "Line 34 ResourceID: ", $userResourceID, " userUserID: ", $userUserID, " CLnum_rows: ", $CLnum_rows; 

	//$CLnum_rows = 1; //To bypass loginCheck (for debug use)
	//$CLnum_rows = 1; //To bypass loginCheck (for debug use)
	if ($CLnum_rows){	// if $CLnum_rows = 1, we have the OK to get the server data
		include_once("setTodo.php");	// With the JSON, it does many INSERTs or UPDATEs to MySQL following some conditions
//echo "Line 33 "; 
	
		// My job is to get all the table data from the server and send a json to client
		$handler -> reply(true,"this is a positive reply",$debug1,$debug2,getServerData($clientLastSyncDate, $currentDateTime, $userUserID, $strUname, $userResourceID, $CLnum_rows, $BDBid));	// with a dynamic array coming from a MySQL query //function reply($status,$message,$data)
		// It return $serverAnswer from SqlSyncHandler.php such as:	{"result":"OK","message":"this is a positive reply","syncDate":1327075596000,"data":{"Units":[{"UnitID":"0","UnitSymbol":"h"},{"UnitID":"1","UnitSymbol":"km"},{"UnitID":"2","UnitSymbol":"$"},{"UnitID":"3","UnitSymbol":"U$"},{"UnitID":"4","UnitSymbol":"\u20ac"},{"UnitID":"5","UnitSymbol":"$P"}]}} 
	
		// a error reply example
		//$handler -> reply(false,"this is a error reply",array('browser' => 'firefox'));
	} else {
		echo "Your're not authorized to get the data from this server."; 
	}
	//echo "<br>", "End: ", date("Y-m-d H:i:s"), "<br>";

	// remove all session variables
	session_unset(); 
	// destroy the session 
	session_destroy(); 
}

function getServerData($clientLastSyncDate, $currentDateTime, $userUserID, $strUname, $userResourceID, $CLnum_rows, $BDBid){		
//get the modified data from the server using an associative array
/*field explanation in relation to the example:
	$clientLastSyncDate: MANDATORY, sync operations are based on this
	$userUserID: parameter example specific 
	$strUname: parameter example specific 
	$userRessourceID: parameter example specific 
	$CLnum_rows: OPTIONAL, MANDATORY if LOGIN CHECK is required (=if authorisation is enabled)
	$BDBid: MANDATORY, it pass the single client unique identifier
*/

	// Define here the tables to sync Server side param1 is the webSql table name and param2 is the MySQL table name
	$tablesToSync = array(
		array( "tableNameWebSql" => 'Todo',	    "getQueryFile" => 'getModifiedTodo.php'),
		array( "tableNameWebSql" => 'Resource',	"getQueryFile" => 'getModifiedResource.php'),
		array( "tableNameWebSql" => 'Category',	"getQueryFile" => 'getModifiedCategory.php'),
	);

	$serverDataArr = array();
	require_once('connections/connectDB.php');
	foreach($tablesToSync as $value){
		include_once($value['getQueryFile']);	//remove to debug
		$serverDataArr[$value['tableNameWebSql']] = $sql_result;
	}
	return $serverDataArr;
}
?>
