/*******************************************************************
 * Javascript for CRUD webSQL App supporting a Sync with a MySQL server via webSqlSync.js.
 * Thanks to ___ for his inspiration
 * Created by Alain Beauseigle to be a CRUD webSQL App
 * Rev.: 2016-03-10
 * ToDo: Data encryption avec base64 
 * ToDo: Password encryption 
 * ToDo: DELETE are not handled. But an easy workaround is to do a logic delete with an update (ex. UPDATE elm SET flag='DELETED')
 ******************************************************************/
/*
 Copyright (c) 2014-2016, Alain Beauseigle, AffairesUP inc.
 Permission is hereby granted, free of charge, to any person obtaining a
 copy of this software and associated documentation files (the "Software"),
 to deal in the Software without restriction, including without limitation the
 rights to use, copy, modify, merge, publish, distribute, sublicense,
 and/or sell copies of the Software, and to permit persons to whom the Software
 is furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be
 included in all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
 INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
 PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF
 CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE
 OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

window.onload = function() {
	if (!window.openDatabase) {
		err("WebSQL database is not supported by this browser, try with Chrome, Safari, Opera or Next");
		return;
	}

	window.myweb = {
		db: window.openDatabase("TodoApp", "1.0", "TodoApp", 2 * 1024 * 1024), // 2MB
		dataset: null,
		syncSuccess: false, //to define the syncSuccess for line 288
		dbAlreadyExist: 0,
		sqlSelectFilteredTodo: ''
	}

	document.getElementById("DateInsertedAdd").value = getCurrentDateISO(); // populate the HTML5 INPUT date of Add with today's date

	createTable();	// To create all tables for the web app and run initSync of webSyncSql.js to add the tables required for sync 

	var firstSyncDone = 0;
	alreadySynced(function(firstSyncDone) {
		if (firstSyncDone == 0) {
			console.log("line 51 firstSyncDone: ", firstSyncDone);	// It gives 0, there is data in webSQL table
			
			showHide('LoginParamEdit','List'); // Go to LoginParamEdit to enter ID & PW, then syncWithServer
		} else {
			//console.log("line 55 firstSyncDone: ", firstSyncDone);	// It gives 1, there is data in webSQL table

			//We must refill the SelectBox after a reload windows
			loadAllSelect();

			//We must refill the Auth view with ID & PW after a reload windows to avoid an incomplete sync on the client side. 
			loadLoginParam();
			loadFilterParam();
			
			showFilteredRecords(); 
			showHide('List','Filter');
			showHide('List','Add');
			showHide('List','Edit');
			showHide('List','LoginParamEdit');
		}
	});
};

//---- FUNCTIONS ----
function createTable() { 
	if (!window.openDatabase) {
		err("WebSQL database not supported");
		return;
	} else {
		myweb.dbAlreadyExist = 1;
	}
	myweb.db.transaction(function(tx) {
		tx.executeSql("CREATE TABLE IF NOT EXISTS Todo (id INTEGER PRIMARY KEY AUTOINCREMENT, TodoID INTEGER, TodoDesc TEXT, TodoFollowup TEXT, TodoPrio TEXT, TodoProgress TEXT, CategoryID INTEGER, TodoResp1ID INTEGER, TodoResp2ID INTEGER, TodoDateInserted TEXT, TodoDateDue TEXT, TodoDateDone TEXT, TodoActive TEXT, BDBid TEXT, last_sync_date TEXT, last_sync INTEGER, msgToApp TEXT)", []);
		tx.executeSql("CREATE TABLE IF NOT EXISTS Resource (id INTEGER PRIMARY KEY AUTOINCREMENT, ResourceID INTEGER, ResourceName TEXT, ResourceIni TEXT, BDBid TEXT, last_sync_date TEXT, last_sync INTEGER)", []);
		tx.executeSql("CREATE TABLE IF NOT EXISTS Category (id INTEGER PRIMARY KEY AUTOINCREMENT, CategoryID INTEGER, CategoryName TEXT, HotCat INTEGER, BDBid TEXT, last_sync_date TEXT, last_sync INTEGER)", []);
		tx.executeSql("CREATE TABLE IF NOT EXISTS FilterParam (id INTEGER PRIMARY KEY AUTOINCREMENT, DescFP TEXT, PrioFP INTEGER, CategoryIdFP INTEGER, Resp1IdFP INTEGER, Resp2IdFP INTEGER, Date1FP TEXT, Date2FP TEXT, ActiveFP INTEGER, RbActiveFP TEXT)", []); // Create FilterParam to record the parameters to filter the Todo
		tx.executeSql("CREATE TABLE IF NOT EXISTS UserParam (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT, password TEXT)", []); // Create UserParam to record the connection parameters to the Php-MySQL server
		tx.executeSql("INSERT INTO FilterParam (DescFP, PrioFP, CategoryIdFP, Resp1IdFP, Resp2IdFP, Date1FP, Date2FP, ActiveFP, RbActiveFP) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);", ['', '', '', '', '', '1901-01-01', '1901-01-01', '', '0']); //1901-01-01 is the NULL date in SQLite
		tx.executeSql("INSERT INTO UserParam (username, password) VALUES (?, ?)", ['', '']); 
	});	//end myweb.db.transaction

	tableToSync = [
		{tableName: 'Todo',     idName: 'id', tableNameID: 'TodoID'},
		{tableName: 'Resource', idName: 'id', tableNameID: 'ResourceID'},
		{tableName: 'Category', idName: 'id', tableNameID: 'CategoryID'}
	];
	mySyncURL = 'webSqlSyncAdapter.php';
	DBSYNC.initSync(tableToSync, myweb.db, SYNCDATA.sync_info, mySyncURL, callBackInitSync);	//Parameters are defined in mySyncData.js
	function callBackInitSync() {
		document.getElementById("downloadProgress").value="InitSync Done"; // 
	}
}

// This function ask if the user already did the first sync or not (if firstSyncDone = 0, hideShow(Auth, List), else show the list
function alreadySynced(callback) {
	var firstSyncDone = 0; //var BDBid = "";
	myweb.db.transaction(function (tx) {
		tx.executeSql('SELECT * FROM Todo LIMIT 1', [], function(tx, results) {
     		console.log('dataExist: '+results.rows.length + ' rows.');	//It gives tableExist: 0 rows before the first sync. And tableExist: 1 row after a relaod page. 
			firstSyncDone = results.rows.length;	
   			console.log('firstSyncDone : ' + firstSyncDone);	// It gives 1 at the second windows load. 
			callback(firstSyncDone);
		}); // for tx.executeSql
	});	//for myweb.db.transaction
}

function dropTables() {
	myweb.db.transaction(function(tx) {
		tx.executeSql("DROP TABLE Todo", []);
		tx.executeSql("DROP TABLE Resource", []);
		tx.executeSql("DROP TABLE Category", []);
		tx.executeSql("DROP TABLE FilterParam", []);
		tx.executeSql("DROP TABLE UserParam", []);
		tx.executeSql("DROP TABLE new_elem", []);
		tx.executeSql("DROP TABLE sync_info", []);
	});
	resetForm();
}

function NEXTsyncWithServer() {	//called by list button SYNC
	syncWithServer(function(syncSuccess){		// callback is used to wait the server query result.  The data is received from the server when syncSuccess is true.
		document.getElementById('syncImage').src="images/recycle-white.png";
		document.getElementById('syncButton').disabled = false;
		document.getElementById("downloadProgressNumber").value = 0;
	});
}

function syncWithServer(callback){	// First sync: It downloads server data (Todo, Category, Resource, etc.) 
	document.getElementById('syncButton').disabled = true;
	document.getElementById("downloadProgressNumber").value = 0;
	document.getElementById('syncImage').src="images/syncAnimated.gif";
	mySyncURL ='webSqlSyncAdapter.php';
	// Take username & password from LoginParamEdit form
	username = "";
	password = "";
	var username = document.getElementById("usernameEdit").value; 
	var password = document.getElementById("passwordEdit").value; 
	//console.log("Line 147 ID:", username, " PW:" , password);
	DBSYNC.syncInfo.username = username;
	DBSYNC.syncInfo.password = password;
	//console.log("Line 150 DBSYNC.syncInfo.username:", DBSYNC.syncInfo.username, " DBSYNC.syncInfo.password:" , DBSYNC.syncInfo.password);
	saveBandwidth = false; //optional 3e argument de syncNow dans la version 130808 de webSqlSync. Do not use because, we can not get the initial data of the server
	callBackUploadProgress = 0; //
	callBackDownloadProgress = 0; //

	DBSYNC.syncNow(callBackProgress, callBackUploadProgress, callBackDownloadProgress, function(result) {
		// DBSYNC.syncNow(callBackProgress, function(result) {	//Original line of the pseudo progress
		myweb.syncSuccess = true;	//response sent as a callback by syncNow if the sync is a success, see line 115 & 125 in webSqlSync.js 
		callback(myweb.syncSuccess);
		console.log("Line 159 syncSuccess after syncNow:", myweb.syncSuccess);
		////show_callBackDownloadProgress(message, percent, msgKey);
		//console.log("callBackDownloadProgress:", callBackDownloadProgress(evt)); // do ???
		if (result.syncOK === true) {
			myweb.syncSuccess = true;
		}
		else {
			alert("first SyncNow failed"); //Synchronized error
		}
		//We must refill the SelectBox after a 2nd sync
		loadAllSelect()
		showFilteredRecords();
	},saveBandwidth); // End syncNow
}

//Not used
function disabledFunc(id) {		//call the function with the button id:  disabledFunc('buttonId');
	var divObj = document.getElementById(id);
	divObj.disabled = false;
}

// message, percent and msgKey comes from syncNow of webSqlSync.js line 128 and 136
// Ex: message= "my message", percent= 20, msgKey= "sendData"  
function callBackProgress (message, percent, msgKey) {
	messageAndPercent = message + percent + "%";
	document.getElementById("downloadProgress").innerHTML = messageAndPercent;
}

function callBackDownloadProgress(evt) {
	if (evt.lengthComputable) {
		var percentComplete = Math.round(evt.loaded * 100 / evt.total);
		document.getElementById('downloadProgressNumber').innerHTML = percentComplete.toString() + '%';
		document.getElementById('downloadProgressNumber').value = percentComplete.toString() + '%';
	} else {
		document.getElementById('downloadProgressNumber').innerHTML = 'unable to compute';
	}
}

function loadAllSelect() {
	loadResourceSelect(function(ResourceArray) {	//the function is a callback to wait for the query result.
		var txt   = "";
		console.log(ResourceArray);
		for (i=0; i < ResourceArray.length; i++){
			txt=txt + "<option value=" + ResourceArray[i].ResourceID + ">" + ResourceArray[i].ResourceID + " - " + ResourceArray[i].ResourceName + "</option>";
		}
		var txtAdd    = "<option value='0'>--Choose a resource--</option>" + txt;
		var txtEdit   = "" + txt;
		var txtEditResp2   = "<option value='0'>--None--</option>" + txt;
		var txtFilter = "<option value='0'>--All resources--</option>" + txt;
		document.getElementById("Resp1SelectAdd").innerHTML = txtAdd;
		document.getElementById("Resp1SelectEdit").innerHTML = txtEdit;
		document.getElementById("Resp1SelectFilter").innerHTML = txtFilter;
			
		document.getElementById("Resp2SelectAdd").innerHTML = txtAdd;
		document.getElementById("Resp2SelectEdit").innerHTML = txtEditResp2;
		document.getElementById("Resp2SelectFilter").innerHTML = txtFilter;
	});
			
	//We must refill the SelectBox after a reload windows
	loadCategorySelect(function(CategoryArray) {	//the function is a callback to wait for the query result.
		var txt   = "";
		for (i=0; i < CategoryArray.length; i++){
			txt=txt + "<option value=" + CategoryArray[i].CategoryID + ">" + CategoryArray[i].CategoryID + " - " + CategoryArray[i].CategoryName + "</option>";
		}
		var txtAdd    = "<option value='0'>--Chose a category--</option>" + txt;
		var txtEdit   = "" + txt;
		var txtFilter = "<option value='0'>--All categories--</option>" + txt;
		document.getElementById("CategorySelectAdd").innerHTML = txtAdd;
		document.getElementById("CategorySelectEdit").innerHTML = txtEdit;
		document.getElementById("CategorySelectFilter").innerHTML = txtFilter;
	});
}
	
//Populate all Resource selectbox with Unites from webDB, use a callback to force waiting for the webDB result
function loadResourceSelect(callback) {
	myweb.db.transaction(function (tx) {
		tx.executeSql('SELECT * FROM Resource', [], function(tx, results) {
			ResourceArray = [];
			var dataset = results.rows; 
			var selectResp1 = document.getElementById('Resp1SelectAdd');
//			selectResp1.options.length = 0; // clear out existing items
			//console.log("length:", dataset.length);	//R: 
			for(var i = 0; i < dataset.length; i++){
				var element=new Object();
				element.ResourceID = dataset.item(i).ResourceID;
				element.ResourceName = dataset.item(i).ResourceName;
				ResourceArray[i]=element;
			}
			callback(ResourceArray);
		}); // for tx.executeSql
	});	//for myweb.db.transaction
}

//Populate all Category selectbox with Category from webDB, use a callback to force waiting for the webDB result
function loadCategorySelect(callback) {
	myweb.db.transaction(function (tx) {
		tx.executeSql('SELECT * FROM Category', [], function(tx, results) {
			CategoryArray = [];
			var dataset = results.rows; 
			var selectCategory = document.getElementById('CategorySelectAdd');
			//console.log("length:", dataset.length);	//R: 
			for(var i = 0; i < dataset.length; i++){
				var element = new Object();
				element.CategoryID = dataset.item(i).CategoryID;
				element.CategoryName = dataset.item(i).CategoryName;
				CategoryArray[i]=element;
			}
			//console.log(CategoryArray);
			callback(CategoryArray);
		}); // for tx.executeSql
	});	//for myweb.db.transaction
}
// end FUNCTIONS related to load select boxes

// begin FUNCTIONS related to SHOW FILTERED Todo
function loadFilterParam() {	//Utile ???
	myweb.db.transaction(function (tx) {
		tx.executeSql('SELECT * FROM FilterParam WHERE id=?', [1], function (tx, FPresult) {
			//tx.executeSql('SELECT TOP 1 FROM FilterParam', [], function (tx, FPresult) {
			var lenFParam = FPresult.rows.length;
			FPdataset = FPresult.rows;
			FPitem = FPdataset.item(0);
	
			if ((FPitem['Date1FP']!="" || FPitem['Date1FP']!="1901-01-01" ) || (FPitem['Date2FP']!="" || FPitem['Date2FP']!="1901-01-01" )){    // 1901-01-01 is to NOT filter on date
				Date1FilterString = FPitem['Date1FP']; //The yyyy-mm-dd (ISO 8601) date format is not supported in Safari and IE.
				Date2FilterString = FPitem['Date2FP']; //The yyyy-mm-dd (ISO 8601) date format is not supported in Safari and IE.
				Date1FilterParsed = parseDate(Date1FilterString); // 2012-12-31 -> Mon Dec 31 2012 00:00:00
				Date2FilterParsed = parseDate(Date2FilterString); // 2012-12-31 -> Mon Dec 31 2012 00:00:00
				Date1FilterISO = Date1FilterParsed.toISOString().substring(0, 10);  //Mon Dec 31 2012 00:00:00 -> console.log -> 2012-12-31
				Date2FilterISO = Date2FilterParsed.toISOString().substring(0, 10);  //Mon Dec 31 2012 00:00:00 -> console.log -> 2012-12-31
				document.getElementById("Date1Filter").value = Date1FilterISO;
				document.getElementById("Date2Filter").value = Date2FilterISO;
			} else { 
				document.getElementById("Date1Filter").value = "";
				document.getElementById("Date2Filter").value = "";
			}

			var idResp1SelectFilter = FPitem['Resp1IdFP'];	//ResourceID 
			// load the unit selectbox to search the found idResp1 in the option of the unit selectbox
			var resource = document.getElementById("Resp1SelectFilter");
			for(i=0;i<resource.options.length;i++){
				if(resource.options[i].value == idResp1SelectFilter){			
					resource.selectedIndex = i;
				}
			}
			
			var idResp2SelectFilter = FPitem['Resp2IdFP'];	//ResourceID 
			// load the unit selectbox to search the found idResp2 in the option of the unit selectbox
			var resource = document.getElementById("Resp2SelectFilter");
			for(i=0;i<resource.options.length;i++){
				if(resource.options[i].value == idResp2SelectFilter){			
					resource.selectedIndex = i;
				}
			}

			var idCategorySelectFilter = FPitem['CategoryIdFP'];
			// load the unit selectbox to search the found idCategory in the option of the unit selectbox
			var Category = document.getElementById("CategorySelectFilter");
			for(i=0;i<Category.options.length;i++){
				if(Category.options[i].value == idCategorySelectFilter){			
					Category.selectedIndex = i;
				}
			}
		
			PrioSelectFilter.value = FPitem['PrioFP'];
			DescFilter.value = FPitem['DescFP'];
			
			var rbActiveFilter = FPitem['RbActiveFP'];
			setRadioChecked('rbActiveFilter', rbActiveFilter);
	
			//document.getElementById('Filter').style.display='block';
			//document.getElementById('List').style.display='none';
		}) // for tx.executeSql
	}) // for myweb.db.transaction
}

// return the value of the radio button that is checked
function getRadioVal(radioName) {
  var rads = document.getElementsByName(radioName);
  for(var rad in rads) {
    if(rads[rad].checked)
      return rads[rad].value;
  }
  return null;
}

//Ref: http://www.somacon.com/p143.php
function setRadioChecked(radioName, newValue) {
	var radioObj = document.getElementsByName(radioName);
	if(!radioObj)
		return;
	var radioLength = radioObj.length;
	console.log("radioLength:", radioLength);	//R: 

	if(radioLength == undefined) {
		radioObj.checked = (radioObj.value == newValue.toString());
		return;
	}
	for(var i = 0; i < radioLength; i++) {
		radioObj[i].checked = false;
		if(radioObj[i].value == newValue.toString()) {
			radioObj[i].checked = true;
		}
	}
}

function updateFilterParam() {
	var Date1FilterNew = document.getElementById("Date1Filter").value; // It records the new date in string format like "2013-05-01"
	var Date2FilterNew = document.getElementById("Date2Filter").value; // It records the new date in string format like "2013-05-01"
	// If we erase the date to not filter on the date.
	if (document.getElementById("Date1Filter").value=="") {
		Date1FilterNew = "1901-01-01";
	} else {
		Date1FilterNew = document.getElementById("Date1Filter").value;
	}
	if (document.getElementById("Date2Filter").value=="") {
		Date2FilterNew = "1901-01-01";
	} else {
		Date2FilterNew = document.getElementById("Date2Filter").value;
	}

	var PrioFilter = document.getElementById("PrioSelectFilter").value;
	var rbActiveFilter = getRadioVal("rbActiveFilter");
	//console.log("rbTodoActiveFilter :", rbTodoActiveFilter); // It gives 0, 1 or 2 Good
	var Resp1IdFilter = document.getElementById("Resp1SelectFilter").value;
	var Resp2IdFilter = document.getElementById("Resp2SelectFilter").value;
	var CategoryIdFilter = document.getElementById("CategorySelectFilter").value;

	myweb.db.transaction(function(tx) {
		tx.executeSql("UPDATE FilterParam SET DescFP = ?, Date1FP = ?, Date2FP = ?, Resp1IdFP = ?, Resp2IdFP = ?, PrioFP = ?, RbActiveFP = ?, CategoryIdFP = ? WHERE id = 1",
			[DescFilter.value, Date1FilterNew, Date2FilterNew, Resp1IdFilter, Resp2IdFilter, PrioFilter, rbActiveFilter, CategoryIdFilter]);
	}); 
	showFilteredRecords(); 
	showHide('List','Filter');
	showHide('List','Add');
	showHide('List','Edit');
}

function showFilteredRecords() {	//Called by updateFilterParam and syncWithServer
	getFilterParam(function(myFilterParam) {
		//Concatenation of the App record filter usable for Filter, Add and Edit 
		//sqlSelectFilteredTodo = 'SELECT * FROM Todo WHERE 1 = 1';
		sqlSelectFilteredTodo = 'SELECT Todo.id, Todo.TodoID, Todo.TodoDateInserted, Todo.TodoDateDue, Todo.TodoDateDone, Todo.TodoResp1ID, Todo.TodoResp2ID, A.ResourceName AS TodoResp1Name, B.ResourceName AS TodoResp2Name, Todo.TodoDesc, Todo.TodoFollowup, Todo.TodoPrio, Todo.TodoActive, Todo.CategoryID, Category.CategoryName FROM Todo, Category LEFT OUTER JOIN Resource A ON A.ResourceID=Todo.TodoResp1ID LEFT OUTER JOIN Resource B ON B.ResourceID=Todo.TodoResp2ID WHERE Todo.CategoryID = Category.CategoryID';
		//console.log("Line 402 sqlSelectFilteredTodo:", sqlSelectFilteredTodo);	//

		if (myFilterParam['Date1FP']=="1901-01-01"){ sqlSelectFilteredTodo += " AND 1 = 1 ";}
		else{sqlSelectFilteredTodo += ' AND TodoDateDue > "' + myFilterParam['Date1FP'] +'"';}
		if (myFilterParam['Date2FP']=="1901-01-01"){ sqlSelectFilteredTodo += " AND 1 = 1 ";}
		else{sqlSelectFilteredTodo += ' AND TodoDateDue < "' + myFilterParam['Date2FP'] +'"';}

		if (myFilterParam['Resp1IdFP']==0 || myFilterParam['Resp1IdFP']=="" ){ sqlSelectFilteredTodo += " AND 1 = 1 ";}
		else{sqlSelectFilteredTodo += " AND Todo.TodoResp1ID = " + myFilterParam['Resp1IdFP'];}

		if (myFilterParam['Resp2IdFP']==0 || myFilterParam['Resp2IdFP']=="" ){ sqlSelectFilteredTodo += " AND 1 = 1 ";}
		else{sqlSelectFilteredTodo += " AND Todo.TodoResp2ID = " + myFilterParam['Resp2IdFP'];}

		if (myFilterParam['CategoryIdFP']==0 || myFilterParam['CategoryIdFP']=="" ){ sqlSelectFilteredTodo += " AND 1 = 1 ";}
		else{sqlSelectFilteredTodo += " AND Todo.CategoryID = " + myFilterParam['CategoryIdFP'];}	

		if (myFilterParam['PrioFP']==0 || myFilterParam['PrioFP']=="" ){ sqlSelectFilteredTodo += " AND 1 = 1 ";}
		else{sqlSelectFilteredTodo += " AND Todo.TodoPrio = " + myFilterParam['PrioFP'];}	

		console.log("Line 417 RbActiveFP:", myFilterParam['RbActiveFP']);	//R: 0, 1 or 2
		switch (myFilterParam['RbActiveFP']){
			case '0':	//All
				sqlSelectFilteredTodo += " AND 1 = 1 ";
				break;
			case '1':	//Active
				sqlSelectFilteredTodo += " AND Todo.TodoActive = 1 " ;	
				break;
			case '2':	//Completed
				sqlSelectFilteredTodo += " AND Todo.TodoActive = 0  " ;
				break;
		}

		if (myFilterParam['DescFP']==""){ sqlSelectFilteredTodo += " AND 1 = 1 ";}
		else{sqlSelectFilteredTodo += " AND TodoDesc LIKE '%" + myFilterParam['DescFP'] +"%'";}    //see http://www.tutorialspoint.com/sqlite/sqlite_like_clause.htm

		sqlSelectFilteredTodo += " ORDER BY TodoDateDue DESC ";	// To have the more recent at the top of the list

		console.log('Line 435 sqlSelectFilteredTodo :', sqlSelectFilteredTodo); // R: GOOD
/*		
SELECT Todo.id, Todo.TodoID, Todo.TodoDateInserted, Todo.TodoDateDue, Todo.TodoDateDone, Todo.TodoResp1ID, Todo.TodoResp2ID, A.ResourceName AS TodoResp1Name, B.ResourceName AS TodoResp2Name, Todo.TodoDesc, Todo.TodoFollowup, Todo.TodoPrio, Todo.TodoActive, Todo.CategoryID, Category.CategoryName FROM Todo, Category LEFT OUTER JOIN Resource A ON A.ResourceID=Todo.TodoResp1ID LEFT OUTER JOIN Resource B ON B.ResourceID=Todo.TodoResp2ID WHERE Todo.CategoryID = Category.CategoryID AND 1 = 1  AND 1 = 1  AND 1 = 1  AND 1 = 1  AND 1 = 1  AND 1 = 1  AND 1 = 1  AND 1 = 1  ORDER BY TodoDateDue DESC
*/		

		listItem.innerHTML = '';
		//console.log("sqlSelectFilteredTodo :", sqlSelectFilteredTodo);

		myweb.db.transaction(function(tx) {
			tx.executeSql(sqlSelectFilteredTodo, [], function(tx, result) {		//sqlSelectFilteredTodo = 'SELECT * FROM Todo WHERE 1 = 1' + ... from filterQuery()
				console.log("sqlSelectFilteredTodo result: ", result);
				myweb.dataset = result.rows;

				for (var i = 0, item = null; i < myweb.dataset.length; i++) {
					item = myweb.dataset.item(i);
					listItemHTMLstring = 
						'<table class="table">' 
							+ '<tr>'
								+ '<td class="cell editButton">' 
									+ '<button type="button" onclick="loadTodo(' + i + ');" ><img src="images/edit-white.png" alt="Edit"/></button>' 
								+ '</td>' 
								+ '<td>' 
									+ '<table class="doublerow">'
										+ '<tr class="row">' 
											+ '<td> <div style="width: 60px">' + item['TodoDateInserted'] + '</div> </td>' 
											+ '<td class="cell element2"><div class="divelement2">' + item['TodoResp1Name'] + '</b>' + ' helped by ' + item['TodoResp2Name']  + ' : ' + '<b>' +  item['CategoryName'] + '</b>' + '</td>'
											+ '<td class="cell element3">' + item['TodoID'] + '</td>' 
										+ '</tr>' 
										+ '<tr class="row">' 
											+ '<td> <div style="width: 60px">' + 'Priority: ' + item['TodoPrio'] + '</div> </td> ' ;
					if(item['TodoActive']==1){ listItemHTMLstring += '<td> <div class="divelement5">'       + item['TodoDesc']  + '</div> </td>' ;}
					else					  { listItemHTMLstring += '<td> <div class="divelement5strike">' + item['TodoDesc']  + '</div> </td>' ;}
					listItemHTMLstring += '</tr>' 
									+ '</table>'
								+ '</td>' 
							+ '</tr>'
						+ '</table>';
					listItem.innerHTML +=  listItemHTMLstring;
				}

			});	//tx.executeSql
			showHide('List','Filter');
			showHide('List','Add');
			showHide('List','Edit');
		});	//myweb.db.transaction
	});	//getFilterParam

	// Pour tester via SQLite Browser:
	//SELECT TodoID, TodoDate, Todo.ResourceID, Todo.MandatID, TodoDesc, Todo.CategoryID, TodoQte, Todo.UniteID, TodoNote FROM Todo WHERE 1 = 1  AND 1 = 1  AND 1 = 1  AND 1 = 1  AND Todo.MandatID = '507' AND 1 = 1  AND 1 = 1  ORDER BY TodoDate DESC
}

function getFilterParam(callback) {
	myweb.db.transaction(function (tx) {
		tx.executeSql('SELECT * FROM FilterParam WHERE id=?', [1], function (tx, results) {
			var dataset = results.rows;
			var filterParam = dataset.item(0);
			console.log("filterParam: ", filterParam);
			callback(filterParam);	// callback to pass the filterParam even though it's async.
		}, null); // for tx.executeSql
	}, null, null); // for myweb.db.transac
}
// end FUNCTIONS related to SHOW FILTERED CONTACTS

// begin FUNCTIONS related to insertContat()
function insertTodo() {
	var dateInsertedStringAdd  = document.getElementById("DateInsertedAdd").value;
	var dateDueStringAdd = document.getElementById("DateDueAdd").value;
	var Resp1IdAdd = document.getElementById("Resp1SelectAdd").value;
	var Resp2IdAdd = document.getElementById("Resp2SelectAdd").value;
	var CategoryIdAdd = document.getElementById("CategorySelectAdd").value;
	var DescAdd    = document.getElementById('DescAdd').value;  
	var PrioAdd  = document.getElementById('PrioSelectAdd').value;  

	//To make sure all * fields are filled
	// Note: "required" of HTML5 works only with a submit
	if ((DescAdd == '')){
		alert("Please enter a description.");
		document.getElementById('TodoDescAdd').focus();
		return false;}
	else if ((Resp1IdAdd == '0')){	
		alert("Please enter a responsible."); 
		document.getElementById('Resp1SelectAdd').focus();
		return false;}
	else if ((CategoryIdAdd == '0')){
		alert("Please enter a category.");
		document.getElementById('CategorySelectAdd').focus();
		return false;}
	else if ((dateInsertedStringAdd == '')){
		alert("Please enter a date.");
		document.getElementById('DateInsertedAdd').focus();
		return false;}

	var HotCatDate = getCurrentDateISO(); //today's date

	myweb.db.transaction(function(tx) {
		tx.executeSql("INSERT INTO Todo (TodoID, TodoDesc, TodoDateInserted, TodoDateDue, TodoPrio, TodoProgress, TodoResp1ID, TodoResp2ID, CategoryID, TodoActive) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", 
			['-1', DescAdd, dateInsertedStringAdd, dateDueStringAdd, PrioAdd, "0", Resp1IdAdd, Resp2IdAdd, CategoryIdAdd, "1"], resetFormAndShow, onError);
		tx.executeSql("UPDATE Category SET HotCat = ? WHERE id = ?", [HotCatDate, CategoryIdAdd]);

		loadCategorySelect(function(CategoryArray) {	//the function is a callback to wait for the query result.
			var txt   = "";
			for (i=0; i < CategoryArray.length; i++){
				txt=txt + "<option value=" + CategoryArray[i].CategoryID + ">" + CategoryArray[i].CategoryName + "</option>"; // BUG: option 0 is not selected for Add and Filter
			}
			var txtAdd    = "<option value='0'>--Choose a category--</option>" + txt;
			var txtEdit   = "" + txt;
			var txtFilter = "<option value='0'>--All categories--</option>" + txt;
			document.getElementById("CategorySelectAdd").innerHTML = txtAdd;
		});

	});
}

function resetFormAndShow() {
	resetForm();
	showFilteredRecords();
}

function resetForm() {
	document.getElementById("DateInsertedAdd").value = getCurrentDateISO(); // populate the HTML5 INPUT date of Add with the today's date
	document.getElementById("DateDueAdd").value = getCurrentDateISO(); // populate the HTML5 INPUT date of Add with the today's date
	document.getElementById("Resp1SelectAdd").options[0].selected = true; 
	document.getElementById("Resp2SelectAdd").options[0].selected = true; 
	document.getElementById("CategorySelectAdd").options[0].selected = true; 
	//document.getElementById('PrioAdd').value = '9';  
	//document.getElementById('DescAdd').value = '';  
	DescAdd.value = '';
}
// end FUNCTIONS related to insertContat()

//Function for Safari to read a date from the DB, because Safari doesn't accept the format aaaa-mm-jj , nether aaaa/mm/jj
//parseDate('2011-12-31'); // '2011-12-31' -> Mon Dec 31 2011 00:00:00
function parseDate(input) {
	if (input == '') {
		input == '1901-01-01';	//Put a null date (1901-01-01 as javascript) if the field stay empty
	}
	var parts = input.match(/(\d+)/g);
	return new Date(parts[0], parts[1]-1, parts[2]);
}

// begin FUNCTIONS related to edit Todo
function loadTodo(iTodo) {
	//	var itemSel = dataset.item(idToEdit); 
	var itemSel = myweb.dataset.item(iTodo); 
	//console.log("dataset.item(i): ", itemSel);	//Good
	//console.log("itemSel['CategoryID']: ", itemSel['CategoryID']);	//
	//console.log("itemSel['CategoryName']: ", itemSel['CategoryName']);	//
	//	idTodoEdit = idToEdit+1;	//
	//idTodoEdit = itemSel['id'];	//Undefined
	//console.log("idTodoEdit: ", idTodoEdit);	//Undefined
	idToEdit = itemSel['id'];	//format '2011-12-31' accepted by Chrome, but Safari accept only the 2011/12/31. The yyyy-mm-dd (ISO 8601) date format is not supported in Safari.
	console.log("idToEdit: ", idToEdit);	//Good

	DateInsertedEditString = itemSel['TodoDateInserted'];	//'2011-12-31' format accepted by Chrome, but Safari only accept the format 2011/12/31. The yyyy-mm-dd (ISO 8601) date format is not supported in Safari and IE.
	if(typeof DateInsertedEditString != 'string') {
		document.getElementById("DateInsertedEdit").value = ""; // 
	} else {
		if (DateInsertedEditString == '') {
			DateInsertedEditString == '1901-01-01';	//Mettre une date nulle (1901-01-01 selon javascript) si le champ est ou reste vide
		} else {
			DateInsertedEditParsed = parseDate(DateInsertedEditString); // 2012-12-31 -> Mon Dec 31 2012 00:00:00
			DateInsertedEditISO = DateInsertedEditParsed.toISOString().substring(0, 10);	//Mon Dec 31 2012 00:00:00 -> console.log -> 2012-12-31
			document.getElementById("DateInsertedEdit").value = DateInsertedEditISO; // 
		}
	}

	DateDueEditString = itemSel['TodoDateDue'];	
	if(typeof DateDueEditString != 'string') {
		document.getElementById("DateDueEdit").value = ""; // 
	} else {
		if (DateDueEditString == '') {
			DateDueEditString == '1901-01-01';	//Put a null date (1901-01-01 for javascript) if the field is empty
		} else {
			DateDueEditParsed = parseDate(DateDueEditString); // 2012-12-31 -> Mon Dec 31 2012 00:00:00
			DateDueEditISO = DateDueEditParsed.toISOString().substring(0, 10);	//Mon Dec 31 2012 00:00:00 -> console.log -> 2012-12-31
			document.getElementById("DateDueEdit").value = DateDueEditISO; // 
		}
	}

	DateDoneEditString = itemSel['TodoDateDone'];	
	if (typeof DateDoneEditString != 'string') {
		document.getElementById("DateDoneEdit").value = ""; // 
	} else {
		if (DateDoneEditString == '') {
			DateDoneEditString == '1901-01-01';
		} else {
			DateDoneEditParsed = parseDate(DateDoneEditString); // 2012-12-31 -> Mon Dec 31 2012 00:00:00
			DateDoneEditISO = DateDoneEditParsed.toISOString().substring(0, 10);	//Mon Dec 31 2012 00:00:00 -> console.log -> 2012-12-31
			document.getElementById("DateDoneEdit").value = DateDoneEditISO; // 
		}
	}

	var idResp1SelectEdit = itemSel['TodoResp1ID'];	//ResourceID 
	// load the Resp1 selectbox to search the found idResp1 in the option of the Resp1 selectbox
	var resource = document.getElementById("Resp1SelectEdit");
	for(i=0;i<resource.options.length;i++){
		if(resource.options[i].value == idResp1SelectEdit){			
			resource.selectedIndex = i;
		}
	}

	var idResp2SelectEdit = itemSel['TodoResp2ID'];	//ResourceID 
	var resource = document.getElementById("Resp2SelectEdit");
	for(i=0;i<resource.options.length;i++){
		if(resource.options[i].value == idResp2SelectEdit){			
			resource.selectedIndex = i;
		}
	}

	var idCategorySelectEdit = itemSel['CategoryID'];
	// load the category selectbox to search the found idCategory in the option of the category selectbox
	var TodoCategory = document.getElementById("CategorySelectEdit");
	for(i=0;i<TodoCategory.options.length;i++){
		if(TodoCategory.options[i].value == idCategorySelectEdit){			
			TodoCategory.selectedIndex = i;
		}
	}

	PrioSelectEdit.value = itemSel['TodoPrio'];
	DescEdit.value = itemSel['TodoDesc'];
	FollowupEdit.value = itemSel['TodoFollowup'];
	var ActiveEdit = itemSel['TodoActive'];
	
	var chkBoxActiveEdit = document.getElementById('cbActiveEdit');
//	console.log("chkBoxActiveEdit: ", chkBoxActiveEdit); // it gives null
//	if(cbActiveEdit=="1"){ document.getElementById("cbActiveEdit").checked=true; document.getElementById("cbActiveEdit").checkboxradio('refresh');}
//	else{ document.getElementById("cbActiveEdit").checked=false; document.getElementById("cbActiveEdit").checkboxradio('refresh');}
//	console.log("ActiveEdit: ", ActiveEdit); // it gives 1 or null
	if(ActiveEdit == "1"){ 
		document.getElementById("cbActiveEdit").checked=false;
	}else{ 
		document.getElementById("cbActiveEdit").checked=true; 
	}
	//console.log("cbActiveEdit: ", document.getElementById("cbActiveEdit").checked); // it gives true or false

	showHide('Edit','List');
}

function updateTodo() {
	var DateInsertedEdit  = document.getElementById("DateInsertedEdit").value; // It records the new date in format string "2013-05-02"
	var DateDueEdit  = document.getElementById("DateDueEdit").value; // It records the new date in format string "2013-05-02"
	var DateDoneEdit  = document.getElementById("DateDoneEdit").value; // It records the new date in format string "2013-05-02"
	var Resp1IdEdit = document.getElementById("Resp1SelectEdit").value;
	var PrioEdit = document.getElementById("PrioSelectEdit").value;
	var Resp2IdEdit = document.getElementById("Resp2SelectEdit").value;
	var CategoryIdEdit = document.getElementById("CategorySelectEdit").value;
	if(document.getElementById("cbActiveEdit").checked){cbActiveEdit="0";} else {cbActiveEdit="1";} // It records 0 if completed (checked true) and  1 if not completed/active (checked false) in the DB.

	//To make sure that all * fields are filled
	// Note: "required" of HTML5 works only with a submit
	if ((DescEdit.value == '')){
		alert("Please, enter a description.");
		document.getElementById('DescEdit').focus();
		return false;}
	else if ((DateInsertedEdit == '')){
		alert("Please, enter an insert date.");
		document.getElementById('DateInsertedEdit').focus();
		return false;}

	myweb.db.transaction(function(tx) {
		tx.executeSql("UPDATE Todo SET TodoDesc = ?, TodoFollowup = ?, TodoDateInserted = ?, TodoDateDue = ?, TodoDateDone = ?, TodoPrio = ?, TodoResp1ID = ?, TodoResp2ID = ?, CategoryID = ? , TodoActive = ? WHERE id = ?", [DescEdit.value, FollowupEdit.value, DateInsertedEdit, DateDueEdit, DateDoneEdit, PrioEdit,  Resp1IdEdit,  Resp2IdEdit, CategoryIdEdit, cbActiveEdit, idToEdit], resetFormAndShow, onError);

	}); 
}
// end FUNCTIONS related to edit Todo

function getBDBid(callback) {	//called by _______ line ______
	var BDBid = "";
	myweb.db.transaction(function (tx) {
		tx.executeSql('SELECT BDBid FROM sync_info WHERE id=?', [1], function (tx, sync_infoResult) {
			syncInfoDataset = sync_infoResult.rows;
			syncInfoRow0 = syncInfoDataset.item(0);
			BDBid = syncInfoRow0['BDBid'];
			console.log("Line 601, BDBid fct: ", BDBid);	// Without callback, the result arrives to late
			callback(BDBid);	// callback to pass the filterParam eventhough it's async.
		}); // for tx.executeSql
	}); // for myweb.db.transac
	//return BDBid;
}

// begin FUNCTIONS related to edit loginParam
function loadLoginParam() {	//called by List form button PARAMETER
	myweb.db.transaction(function (tx) {
		tx.executeSql('SELECT * FROM UserParam WHERE id=?', [1], function (tx, UPresult) {
			//console.log("UPresult.rows.length", UPresult.rows.length);
			myweb.dataset = UPresult.rows;
			loginParam = myweb.dataset.item(0);
			usernameEdit.value = loginParam['username'];
			passwordEdit.value = loginParam['password'];
		}); // for tx.executeSql
	}); // for myweb.db.transac
	showHide('LoginParamEdit','List');
}

function updateLoginParam() {	//called by loginParam form button MODIFY
	myweb.db.transaction(function(tx) {
		tx.executeSql("UPDATE UserParam SET username = ?, password = ?  WHERE id = 1", [usernameEdit.value, passwordEdit.value]);
	});
	syncWithServer(function(syncSuccess){		// callback is used to wait the server query result.  The data is received from the server when syncSuccess is true.
		if(syncSuccess == true) {
			loadAllSelect()
		}
		document.getElementById('syncImage').src="images/recycle-white.png";
		document.getElementById('syncButton').disabled = false;
		document.getElementById("downloadProgressNumber").value = 0;
	});
	showHide('List','LoginParamEdit');
}
// end FUNCTIONS related to edit loginParam

function showHide(shown, hidden) {
	document.getElementById(shown).style.display='block';
	document.getElementById(hidden).style.display='none';
	return false;
}

// converts a Date object into a string, using the ISO-8601 and the format is: YYYY-MM-DDTHH:mm:ss.sssZ
function getCurrentDateISO() {
	return new Date().toISOString().substring(0, 10);
}

function onError(tx, error) {
	err(error.message);
}

function err(message) {
	alert(message);
}