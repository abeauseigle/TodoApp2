<?php
// Name   : getModifiedCategory.php - called by webSqlSyncAdapter.php
// Goal   : To communicate data from a MySQL query to a webSqlSync json format. 
// By (c) : Alain Beauseigle from AffairesUP inc.
// Version: 2016-03-10

//To test with http://www.mywebsite.com/todoapp/getModifiedCategory.php
//$BDBid = 0;
//$CLnum_rows = 1; //To bypass loginCheck (for debug use)

if ($CLnum_rows){
	if ($BDBid == 0){	//If first sync
		$query = "SELECT CategoryID, CategoryName 
					FROM Category 
					WHERE CategoryActive = 1  
					ORDER BY CategoryID ASC";
	}
	else{				//get updated records from the last sync date
		$query = sprintf("SELECT CategoryID, CategoryName 
					FROM Category 
					WHERE CategoryActive = 1 AND CategoryLastModifDateH > ' %s ' 
					ORDER BY CategoryID ASC ", $clientLastSyncDate);
	}
//echo $query;

	$sql_result = array();
	$sql = mysql_query($query);
	if (mysql_num_rows($sql)>0) { //lp 20141024: to avoid error in case of empty table
		while($row = mysql_fetch_object($sql)){
			$sql_result[] = $row;
		}
	}
	return $sql_result;
} //end if ($CLnum_rows)
?>