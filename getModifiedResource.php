<?php
// Name   : getModifiedResource.php - called by webSqlSyncAdapter.php
// Goal   : To communicate data from a MySQL query to a webSqlSync json format. 
// By (c) : Alain Beauseigle from AffairesUP inc.
// Version: 2016-03-10

//To test with http://www.mywebsite/todoapp/getModifiedResource.php
//$BDBid = 0;
//$CLnum_rows = 1; //To bypass loginCheck (for debug use)

if ($CLnum_rows){	// for authentication
	if ($BDBid == 0){	//If first sync
		$query = sprintf("SELECT DISTINCT Resource.ResourceID, Resource.ResourceName, Resource.ResourceIni, Resource.ResourceLastModifDateH AS last_sync_date
						FROM Resource 
						WHERE ResourceActive = 1 
						ORDER BY ResourceName ASC");
	}
	else{				//get updated records from the last sync date
		$query = sprintf("SELECT DISTINCT Resource.ResourceID, Resource.ResourceName, Resource.ResourceIni, Resource.ResourceLastModifDateH AS last_sync_date
						FROM Resource 
						WHERE ResourceActive = 1
						AND Resource.ResourceLastModifDateH > ' %s ' 
						ORDER BY ResourceName ASC", $clientLastSyncDate);
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
} //end if ($CLnum_rows) used for authentication
?>