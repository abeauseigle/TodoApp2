<?php
/**
 * Name   : webSqlSyncHandler.php for WebSqlSync.js code
 * Creator: sg4r3z 20/05/2013
 * modified by Alain Beauseigle 2013-10-08 to add the tableName in the JSON and to get debug1 and debug2 feedback
 * This class allow to manage the json flow sended by the client (with the WebSqlSync script by orbitaloop), and make a reply.
 * ToDo: Nothing
*/
	 
final class SqlSyncHandler{
	public $clientData;
	private $jsonData;
	// well formatted Answer for WebSqlSync.js Script
	private $serverAnswer = array("result"=> '',"message" => '', "debug1" => '', "debug2" => '', "syncDate" => '',"data" => array());
		
	/*
	 * __construct 
	 * Capture the input stream and creates 
	 * an array with the same structure
	 */
/*
	public function __construct($dataFlow = NULL){					
		if($dataFlow == NULL)
			{$this -> jsonData = file_get_contents('php://input');}	// json file => string 
		else 
			{$this -> jsonData = file_get_contents($dataFlow);}		// json file => string. On failure, file_get_contents() will return FALSE.
		//$this -> clientData = json_decode($this -> jsonData);		 
		$clientData = json_decode($this -> jsonData);		// string => array 
	}
*/
	public function __construct(){					
		$this -> jsonData = file_get_contents('php://input');		// json file => string 
		$this -> clientData = json_decode($this -> jsonData,true);	// json string => array, $this -> clientData is used by the Adapter, then by setContact.php 
	}
	/*
	 * reply (Server -> JSON  -> Client)
	 * This method create a well-structred reply for Client in JSON
	 * This method accept status,message,data
	 * STATUS = boolean value (TRUE for OK, FALSE for ERROR)
	 * MESSAGE = string value for message
	 * DATA = array of data for client
	 */
// $data come from the query getAllServerData() from sqlSyncHandlerTest.php
	public function reply($replyStatus,$message,$debug1,$debug2,$serverData){
		if($replyStatus){
			$this -> serverAnswer['result'] = 'OK';
		}else{
			$this -> serverAnswer['result'] = 'ERROR';
		}
		$this -> serverAnswer['message'] = $message;
		$this -> serverAnswer['data'] 	 = $serverData;
		//$this -> serverAnswer['syncDate'] = strtotime("now")*1000;		// return sync_date: "1234567890000", (gives only seconds, not milliseconds)
		$this -> serverAnswer['syncDate'] = round(microtime(true) * 1000);	// return sync_date: "1234567890123", microtime() returns the Unix timestamp, with microseconds. This function is only available on server supporting the function gettimeofday().
		$this -> serverAnswer['debug1'] = $debug1;
		$this -> serverAnswer['debug2'] = $debug2;
//		echo $serverAnswer;
		//echo json_encode("R");

//		ob_start('ob_gzhandler'); // To send a gziped json. Turn on output buffering with the gzhandler. Ref: not tested geekality.net/2011/10/31/php-simple-compression-of-json-data/
		echo json_encode($this -> serverAnswer);
//		ob_end_flush();	// Turn off output buffering.

//ex:		$myObject = '{"result":"OK","message":"this is a positive reply","syncDate":"1371753757","data":[{"UnitID":"0","UnitSymbol":"h"},{"UnitID":"1","UnitSymbol":"km"},{"UnitID":"2","UnitSymbol":"$"},{"UnitID":"3","UnitSymbol":"U$"},{"UnitID":"4","UnitSymbol":"\u20ac"},{"UnitID":"5","UnitSymbol":"$P"}]}';
//		echo $myObject;
	}

	/*
	* call 
	* This method allows class to call an
	* external functon to make a custom job
	*/
	public function call($function,SqlSyncHandler $param = NULL){
		call_user_func($function,$param);
	}
		
	/*
	* getter clientData 
	* get a clientData property
	*/
	public function get_clientData(){
		return $this -> clientData;
	}
		
	/*
	* get serverAnswer 
	* get a serverAnswer property
	*/
	public function get_serverAnswer(){
		return $this -> serverAnswer;
	}
		
	/*
	* get jsonData
	* get a jsonData property
	*/
	public function get_jsonData(){
		return $this -> jsonData;
	}

}
?>
