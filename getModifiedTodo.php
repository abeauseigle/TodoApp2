<?php
// Name   : getModifiedTodo.php - called by webSqlSyncAdapter.php
// Goal   : To communicate data from a MySQL query to a webSqlSync json format. 
// By (c) : Alain Beauseigle from AffairesUP inc.
// Version: 2016-03-10

// To test: http://www.mywebsite.com/todoapp/getModifiedTodo.php
// $BDBid = 0;
// $CLnum_rows = 1; //To bypass loginCheck (for debug use)

if ($CLnum_rows){
	if ($BDBid == 0){	//If first sync
		$query = "SELECT DISTINCT Todo.TodoID, Todo.id, Todo.TodoDesc, Todo.TodoFollowup, Todo.TodoPrio, Todo.TodoProgress, Todo.CategoryID, Todo.TodoResp1ID, Todo.TodoResp2ID, IFNULL(Todo.TodoDateInserted,'')AS TodoDateInserted,  IFNULL(Todo.TodoDateDue,'')AS TodoDateDue, IFNULL(Todo.TodoDateDone,'')AS TodoDateDone, Todo.TodoActive, Todo.TodoLastModifDateH AS last_sync_date, Todo.BDBid, Todo.msgToApp 
					FROM Todo 
					ORDER BY Todo.TodoID DESC";

					
	}else{	//get updated records from the last sync date
		$query = "SELECT DISTINCT Todo.TodoID, Todo.id, Todo.TodoDesc, Todo.TodoFollowup, Todo.TodoPrio, Todo.TodoProgress, Todo.CategoryID, Todo.TodoResp1ID, Todo.TodoResp2ID, IFNULL(Todo.TodoDateInserted,'')AS TodoDateInserted, IFNULL(Todo.TodoDateDue,'')AS TodoDateDue, IFNULL(Todo.TodoDateDone,'')AS TodoDateDone, Todo.TodoActive, Todo.TodoLastModifDateH AS last_sync_date, Todo.BDBid, Todo.msgToApp 
					FROM Todo 
					WHERE 1 = 1
						AND Todo.TodoLastModifDateH > '" .$clientLastSyncDate. "' 
					ORDER BY TodoID DESC";
	}
//echo $query; //To help debugging, see in console log in the server answer

	$sql_result = array();
	mysql_query('SET CHARACTER SET utf8');	// It should remove the null returned in the JSON for TodoNote. Useful ???
	$sql = mysql_query($query);
	if (mysql_num_rows($sql)>0) { //lp 20141024: to avoid error in case of empty table
		while($row = mysql_fetch_object($sql)){
			$sql_result[] = $row;
		}
	}
	//echo "<br>", "Todo_QueryResult: ", date("Y-m-d H:i:s"), "<br>";
	//print_r ($sql_result);
	return $sql_result;
	//echo $sql_result;
} //end if ($CLnum_rows) used for authentication
?>
