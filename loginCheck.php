<?php
// Name   : loginCheck.php - called by webSqlSyncAdapter.php
// Goal   : To get the autorization to access data in MySQL
// Version: 2014-02-27
// To do  : Nothing
// To test: http://www.mywebsite.com/mywebsqlapp/loginCheck.php?username=myusername&password=mypassword

require_once('connections/connectDB.php');
$CLnum_rows = 0;
$strUname = "";
$strPword = "";
//echo "<p> line 7username : ", $username, " password : ", $password, "</p>";	//OK GOOD
$strUname = stripslashes($username);
$strPword = stripslashes($password);
//echo "<p> line 10 username is ", $strUname, " password is ", $strPword, "</p>";	//OK GOOD

//To test: use a hard coded ID and PW 
//$strUname = stripslashes('yourUserName');
//$strPword = stripslashes('yourPassWord'); 

//$strUname = (isset($_POST["username"])) ? $_POST["username"] : NULL;
//$strPword = (isset($_POST["password"])) ? $_POST["password"] : NULL;

//$strUname = $_POST['username'];
//$strPword = $_POST['password'];
//$strUname = htmlentities(   (  (get_magic_quotes_gpc()  ) ? $_POST['userID'] : addslashes($_POST['userID']))   , ENT_QUOTES);
//$strPword = htmlentities(   (  (get_magic_quotes_gpc()  ) ? $_POST['userPW'] : addslashes($_POST['userPW']))   , ENT_QUOTES);

//$strUname = htmlentities(   (  (get_magic_quotes_gpc()  ) ? $_REQUEST['username'] : addslashes($_REQUEST['username']))   , ENT_QUOTES);
//$strPword = htmlentities(   (  (get_magic_quotes_gpc()  ) ? $_REQUEST['password'] : addslashes($_REQUEST['password']))   , ENT_QUOTES);
//echo "<p>username is ", $strUname, " password is ", $strPword, "</p>";

// CL is for Check Login
$CLquery = "SELECT ResourceID, UserName, UserID FROM User"
				 	 ." WHERE UserActive = 1 AND UserName = '".$strUname."'"
					 ." AND UserPassword = PASSWORD('".$strPword."') "
					 ." ORDER BY UserID DESC";

//echo "CLquery: ", $CLquery; 
$CLresult = mysql_query($CLquery) or die(mysql_error());
$row_getLoginInfos = mysql_fetch_assoc($CLresult);

$userResourceID = $row_getLoginInfos['ResourceID'];
$userUserID = $row_getLoginInfos['UserID'];
$CLnum_rows = mysql_num_rows($CLresult);

//echo "Line 48 ResourceID: ", $userResourceID, " userUserID: ", $userUserID, " CLnum_rows: ", $CLnum_rows; 

?>


