<?php
/*
 * Name  : setTodo.php	called by: webSqlSyncAdapter.php
 * Goal  : To INSERT or UPDATE the Todo table in the sync process with a JSON coming from the webSqlApp 
 * By (c): Alain Beauseigle from AffairesUP inc.
 * Date  : 2016-03-11
 * ToDebug: Use http://www.mywebsite.com/todoapp/setTodoTest.php
*/

//$CLnum_rows = 1;
if ($CLnum_rows){
	require_once('connections/connectDB.php');
	$currentDateTime =  date("Y-m-d H:i:s");				// usefull for the unit test of this function
	$clientData = $handler -> clientData;

	////$BDBid = $clientData['info']['BDBid'];	// Browser DB unique id (attributed at the First sync). Equal to the first sync DateTime in Unix format.
	//echo($BDBid);	//R: Good
	$clientLastSyncDateUnix= $clientData['info']['lastSyncDate']/1000;	// It gives a 10 digits Unix dateTime format
	$clientLastSyncDate= date('Y-m-d H:i:s', $clientLastSyncDateUnix);	// to show the date in YYYY-MM-DD HH:MM:SS format (MySQL datetime format). Result: 2007-12-20 14:00:00

	$debug1 = "Nothing to insert"; // Show the query in the Server answer for debugging purpose
	$debug2 = "Nothing to update";  // Show the info in the Server answer for debugging purpose
		
	$count = count($clientData['data']['Todo']);
	for ($i=0; $i < $count; $i++) {
		$clientRecLastSyncDate = $newrec['last_sync_date']; $clientRecLastSyncDate = mysql_real_escape_string($clientRecLastSyncDate);
		$newrec = $clientData['data']['Todo'][$i];  

		$TodoID 				= $newrec['TodoID']; 			$TodoID 			= mysql_real_escape_string($TodoID);
		$id 					= $newrec['id']; 				$id 				= mysql_real_escape_string($id);
		$TodoDesc 				= $newrec['TodoDesc']; 			$TodoDesc			= mysql_real_escape_string($TodoDesc);
		$TodoFollowup 			= $newrec['TodoFollowup']; 		$TodoFollowup		= mysql_real_escape_string($TodoFollowup);
		$TodoPrio 				= $newrec['TodoPrio']; 			$TodoPrio	 		= mysql_real_escape_string($TodoPrio);
		$TodoProgress			= $newrec['TodoProgress']; 		$TodoProgress 		= mysql_real_escape_string($TodoProgress);
		$CategoryID 			= $newrec['CategoryID']; 		$CategoryID 		= mysql_real_escape_string($CategoryID);
		$TodoResp1ID 			= $newrec['TodoResp1ID'];		$TodoResp1ID 		= mysql_real_escape_string($TodoResp1ID);
		$TodoResp2ID 			= $newrec['TodoResp2ID'];		$TodoResp2ID 		= mysql_real_escape_string($TodoResp1ID);
		$TodoDateInserted 		= $newrec['TodoDateInserted'];	$TodoDateInserted 	= mysql_real_escape_string($TodoDateInserted);
		$TodoDateDue 			= $newrec['TodoDateDue'];		$TodoDateDue 		= mysql_real_escape_string($TodoDateDue);
		$TodoDateDone  		   	= $newrec['TodoDateDone'];   	$TodoDateDone		= mysql_real_escape_string($TodoDateDone);
		$TodoActive 			= $newrec['TodoActive']; 		$TodoActive 		= mysql_real_escape_string($TodoActive);
		$clientRecLastSyncDate 	= $newrec['last_sync_date']; 	$clientRecLastSyncDate = mysql_real_escape_string($clientRecLastSyncDate);

		// Logic:
		//if (ID == -1 ) do an INSERT INTO MySQL
		//if (ID <> -1 AND last_sync_date < clientRecLastSyncDate) do an UPDATE INTO MySQL
		//if (ID <> -1 AND last_sync_date > clientRecLastSyncDate) do nothing because MySQL is more recent and send a feedback message
		if ($TodoID == -1) {
			$insert_value = "(" .$id. ", '".$TodoDesc."', '".$TodoFollowup."', '".$TodoPrio."', '".$TodoProgress."', '".$CategoryID."', '".$TodoResp1ID."', '".$TodoResp2ID."', '".$TodoDateInserted."', '".$TodoDateDue."', '".$TodoDateDone."', ".$TodoActive.", '".$currentDateTime."', ".$userUserID.", '".$currentDateTime."', '" .$BDBid. "')";

			$sqlInsert = "INSERT INTO Todo (id, TodoDesc, TodoFollowup, TodoPrio, TodoProgress, CategoryID, TodoResp1ID, TodoResp2ID, TodoDateInserted, TodoDateDue, TodoDateDone, TodoActive, TodoLastModifDateH, TodoLastModifUserID, last_sync_date, BDBid) VALUES ".$insert_value;

			$debug1 = "sqlInsert : ".$sqlInsert; // Show the query in the Server answer for debugging purpose
			$debug2 = "INSERT id : ".$id;  		// Show the info in the Server answer for debugging purpose

			$queryInsert = mysql_query($sqlInsert) or die('setTodo line 56. '.mysql_error());
			// Note: By changing last_sync_date to the currentDateTime, the getModifiedTodo.php SELECT query will force to update todoID in webSQL db  
	}
		if ($TodoID <> -1) {
			$moreRecentSQL = "SELECT TodoLastModifDateH, last_sync_date FROM Todo WHERE TodoID = ". $TodoID;
			//echo $moreRecentSQL, "<br>", "<br>";
			$moreRecentResult = mysql_query($moreRecentSQL) or die(mysql_error());
			$row_moreRecentResult = mysql_fetch_assoc($moreRecentResult);
			$serverRec_last_ModifDateH = $row_moreRecentResult['TodoLastModifDateH'];
			$serverRec_last_sync_date = $row_moreRecentResult['last_sync_date'];
			//echo "serverRec_last_sync_date = ", $serverRec_last_sync_date, "<br>";
			//echo "clientRecLastSyncDate   = ", $clientRecLastSyncDate, "<br>";
			//echo "if serverRec_last_sync_date:", $serverRec_last_sync_date, "< clientRecLastSyncDate: ", $clientRecLastSyncDate, "<br>", "<br>";
	
			if ($serverRec_last_ModifDateH <= $clientLastSyncDate){	// The App is more recent than server and last sync has been done with me
				//Ex: $sqlUpdate => UPDATE Todo SET id='15', TodoDesc='Do this', TodoFollowup='2000-00-00', TodoPrio='2', TodoProgress='75',  CategoryID='1', TodoResp1ID='1', TodoResp2ID='2', TodoDateInserted='2011-09-22', TodoDateDue='2011-09-22', TodoDateDone='2011-09-22', TodoActive='1', TodoLastModifDateH='2011-09-22 00:00:00',  last_sync_date='2014-01-22 18:20:21', TodoLastModifUserID='1', msgToApp='' WHERE TodoID=5
				$sqlUpdate = "UPDATE Todo SET id='". $id. "', TodoDesc='". $TodoDesc. "', TodoFollowup='". $TodoFollowup. "', TodoPrio='". $TodoPrio. "', TodoProgress='". $TodoProgress. "', CategoryID='". $CategoryID. "', TodoResp1ID='". $TodoResp1ID. "', TodoResp2ID='". $TodoResp2ID. "', TodoDateInserted='". $TodoDateInserted. "', TodoDateDue=".($TodoDateDue==''? 'NULL': "'$TodoDateDue'"). ", TodoDateDone=".($TodoDateDone==''? 'NULL': "'$TodoDateDone'"). ", TodoActive=" . $TodoActive . ", TodoLastModifDateH='". $currentDateTime . "', last_sync_date='". $currentDateTime ."', TodoLastModifUserID=". $userUserID. ", msgToApp='' WHERE TodoID=". $TodoID ;
// null Date problem in JSON, see: http://stackoverflow.com/questions/11343925/json-encode-for-mysql-query-returns-some-null-columns-of-some-rows-but-the-colu

				$debug1 = "sqlUpdate: ".$sqlUpdate; // Show the query in the Server answer for debugging purpose
				$debug2 = "TodoID : ".$TodoID;  	// Show the info in the Server answer for debugging purpose
				//echo  "Line 77 of setTodo.php, MySQL query: ",$sqlUpdate, "<br>", "<br>";
			} else {	// The server was modified during the interval (via the web or another App -> Don't update and get the server data.  
				// Don't update the data, because the server was modified in the interval and could be more recent than the app. 
				// Just update last_sync_date to put an indicator for getModifiedTodo.php to select this activity to be resent to client.
				// getModifiedTodo.php will send the more recent data to the app using last_sync_date indicator.
				// based on msgToApp, send a message to alert the app user such as The Todo wasn't updated to avoid conflicts. You received the server data.
				$sqlUpdate = "UPDATE Todo SET last_sync_date='" .$currentDateTime. "', msgToApp='CONFLICT' WHERE TodoID=". $TodoID ;
				$debug1 = "sqlUpdate: ".$sqlUpdate; // Show the query in the Server answer for debugging purpose
				$debug2 = "TodoID : ".$TodoID;  // Show the info in the Server answer for debugging purpose
			}
			$queryUpdate = mysql_query($sqlUpdate) or die('line 98. '.mysql_error());
		}
	}	//end for
}	//end if ($CLnum_rows)
?>