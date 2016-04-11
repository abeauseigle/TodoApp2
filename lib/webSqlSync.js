/*******************************************************************
 * Sync a local WebSQL DB (SQLite) with a server.
 * Thanks to Lee Barney and QuickConnect for his inspiration
 * Modified by Alain Beauseigle to be multi DB browser
 * AB+: Thanks to DMarko for authentication inspiration
 *
 * Rule: The tableNameID position must be = 0, the first colomn in the MySQL table
 *
 * ToDo: Check if last_sync_date in the server is modified after a sync (replaced for all records even though they are not modified in client)
 * ToDo: DELETE are not handled. But an easy workaround is to do a logic delete with an update (ex. UPDATE elm SET flag='DELETED')
 * ToDo: Rename in the table and in the code last_sync_date => rec_last_sync_date (and last_sync is for the json date) 
 ******************************************************************/
/*
 Copyright (c) 2012, Samuel Michelot,  MosaCrea Ltd
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

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(factory);
    } else {
        // Browser globals
        root.DBSYNC = factory();
    }
}(this, function () {

var DBSYNC = {
    serverUrl: null,
    db: null,
    tablesToSync: [],			//eg.  [{tableName : 'myDbTable', idName : 'myTable_id'},{tableName : 'stat'}]
    idNameFromTableName : {},	//map to get the idName with the tableName (key)
    syncInfo: {					//this object can have other useful info for the server ex. {deviceId : "XXXX", email : "fake@g.com"}
        lastSyncDate : null,	// attribute managed by webSqlSync
        BDBid : null,			// attribute managed by webSqlSync
        username : null,		// attribute managed by webSqlSync
        password : null			// attribute managed by webSqlSync
    },
    syncResult: null,
    firstSync: false,
    cbEndSync: null,
    clientData: null,
    serverData: null,
	username: null, // for encodeBase64 basic authentication support
	password: null, // for encodeBase64 basic authentication support

    /*************** PUBLIC FUNCTIONS ********************/
   /**
    * Initialize the synchronization (should be called before any call to syncNow)
    * (it will create automatically the necessary tables and triggers if needed)
    * @param {Object} theTablesToSync : ex : [{ tableName: 'card_stat', idName: 'card_id'}, {tableName: 'stat'}] //no need to precise id if the idName is "id".
    * @param {Object} dbObject : the WebSQL database object.
    * @param {Object} theSyncInfo : will be sent to the server (useful to store any ID or device info).
    * @param {Object} theServerUrl
    * @param {Object} callBack(firstInit) : called when init finished.
	* @param {Object} username : username for basic authentication support
	* @param {Object} password : password for basic authentication support
    */
	initSync: function(theTablesToSync, dbObject, theSyncInfo, theServerUrl, callBack, username, password) {	////for basic authentication support
	//initSync: function(theTablesToSync, dbObject, theSyncInfo, theServerUrl, callBack) {					 	//without authentication
        var self = this, i = 0;
        this.db = dbObject;
        this.serverUrl = theServerUrl;
        this.tablesToSync = theTablesToSync;
        this.syncInfo = theSyncInfo;
		this.username=username;	////for basic authentication support
		this.password=password;	////for basic authentication support
        //Handle optional id :
        for (i = 0; i < self.tablesToSync.length; i++) {
            if (typeof self.tablesToSync[i].idName === 'undefined') {
                self.tablesToSync[i].idName = 'id';//if not specified, the default name is 'id'
            }
            self.idNameFromTableName[self.tablesToSync[i].tableName] = self.tablesToSync[i].idName;
        }

        self.db.transaction(function(transaction) {
            //create new table to store modified or new elems
            self._executeSql('CREATE TABLE IF NOT EXISTS new_elem (table_name TEXT NOT NULL, id TEXT NOT NULL)', [], transaction);
            self._executeSql('CREATE INDEX IF NOT EXISTS index_tableName_newElem on new_elem (table_name)', [], transaction);
            self._executeSql('CREATE TABLE IF NOT EXISTS sync_info (last_sync TIMESTAMP, BDBid TEXT)', [], transaction); //AB+ BDBid field added

            //create triggers to automatically fill the new_elem table (this table will contains a pointer to all the modified data)
            for (i = 0; i < self.tablesToSync.length; i++) {
                var curr = self.tablesToSync[i];
                self._executeSql('CREATE TRIGGER IF NOT EXISTS update_' + curr.tableName + '  AFTER UPDATE ON ' + curr.tableName + ' ' +
                        'BEGIN INSERT INTO new_elem (table_name, id) VALUES ("' + curr.tableName + '", new.' + curr.idName + '); END;', [], transaction);

                self._executeSql('CREATE TRIGGER IF NOT EXISTS insert_' + curr.tableName + '  AFTER INSERT ON ' + curr.tableName + ' ' +
                        'BEGIN INSERT INTO new_elem (table_name, id) VALUES ("' + curr.tableName + '", new.' + curr.idName + '); END;', [], transaction);
                //TODO the DELETE is not handled. But it's not a pb if you do a logic delete (ex. update set state="DELETED")
            }
        });//end transaction

        self._selectSql('SELECT last_sync, BDBid FROM sync_info', null, null, function(res) {

            if (res.length === 0 || res[0] == 0) {//First sync (or data lost)
                self._executeSql('INSERT OR REPLACE INTO sync_info (last_sync) VALUES (0)', []);
                self.firstSync = true;
                self.syncInfo.lastSyncDate = 0;
                self.syncInfo.BDBid = 0;	///AB+
                callBack(true);
            } else {
                self.syncInfo.lastSyncDate = res[0].last_sync;
				///console.log("Line 119, syncInfo_lastSyncDate sent:", self.syncInfo.lastSyncDate);
                self.syncInfo.BDBid = res[0].BDBid;	///AB+ Est-ce à la bonne place
                ///self.syncInfo.username = "";	///AB+
                ///self.syncInfo.password = "";	///AB+
				///console.log("Line 123, syncInfo_BDBid sent:", self.syncInfo.BDBid);
                if (self.syncInfo.lastSyncDate === 0) {
                    self.firstSync = true;
                }
                callBack(false);
            }
        });
    },	//end initSync

   /**
    * @param {function} callBackProgress
	* @param {function} callBackUploadProgress 	// Added for the real progress feedback (ref: Thanks to Javier Castro) 
	* @param {function} callBackDownloadProgress	// Added for the real progress feedback (ref: https://github.com/jacargentina/WebSqlSync/commit/e5bde41854cb410974426bc178ebfd07dcc67ddc#diff-8470132640aa204e7bba5c3e2fe5846dR238 )
	* @param {function} callBackEndSync (result.syncOK, result.message).
	* @param {boolean} saveBandwidth (default false): if true, the client will not send a request to the server if there is no local changes. AB: Don't use it with this version.
    */
syncNow: function(callBackProgress, callBackUploadProgress, callBackDownloadProgress, callBackEndSync, saveBandwidth) {
	var self = this;
        if (this.db === null) {
            throw 'You should call the initSync before (db is null)';
        }
        self.syncResult = {syncOK:false, codeStr:'noSync', message:'Line 138, No Sync yet', nbSent:0, nbUpdated:0};
        self.cbEndSync = function(){
            callBackProgress(self.syncResult.message, 100, self.syncResult.codeStr);
            /////callBackDownloadProgress(self.syncResult.message, 100, self.syncResult.codeStr);
            callBackEndSync(self.syncResult);
        };

        callBackProgress('Getting local data to backup', 0, 'getData');

        self._getDataToBackup(function(data) {
            self.clientData = data;
            if (saveBandwidth && self.syncResult.nbSent === 0) {
                self.syncResult.localDataUpdated = false;
                self.syncResult.syncOK = true;
                self.syncResult.codeStr = 'nothingToSend';
                self.syncResult.message = 'Line 152, No new data to send to the server';
                self.cbEndSync(self.syncResult);
                return
            } 

            callBackProgress('Sending ' + self.syncResult.nbSent + ' elements to the server', 5, 'sendData');

            self._sendDataToServer(data, callBackUploadProgress, callBackDownloadProgress, function(serverData) {
                callBackProgress('Updating local data', 90, 'updateData');
                self._updateLocalDb(serverData, function(sqlerror){
					self.syncResult.syncOK = false;
                    self.syncResult.codeStr = 'syncError';
                    self.syncResult.message = 'Error executing SQL transaction' + sqlerror;
                    self.syncResult.serverAnswer = serverData;//include the original server answer, just in case
                    self.cbEndSync(self.syncResult);
                    self.serverData = null;
                    self.clientData = null;
				}, function() {
                    self.syncResult.localDataUpdated = self.syncResult.nbUpdated > 0;
                    self.syncResult.syncOK = true;
                    self.syncResult.codeStr = 'syncOk';
                    self.syncResult.message = 'Data synchronized successfully. ('+self.syncResult.nbSent+
                        ' new/modified element saved, '+self.syncResult.nbUpdated+' updated)';
                    self.syncResult.serverAnswer = serverData;//include the original server answer, just in case
                    self.cbEndSync(self.syncResult);
                    self.serverData = null;
                    self.clientData = null;
                });
            });
        });
    },

    /* You can override the following methods to use your own log */
    log: function(message) {
        console.log(message);
    },
    error: function(message) {
        console.error(message);
    },
    getLastSyncDate : function() {
		console.log("this.syncInfo.lastSyncDate", this.syncInfo.lastSyncDate); //Line added by AB+
        return this.syncInfo.lastSyncDate;
    },
    // Usefull to tell the server to resend all the data from a particular Date (val = 1 : the server will send all his data)
    setSyncDate: function(val) {
        this.syncInfo.lastSyncDate = val;
        this._executeSql('UPDATE sync_info SET last_sync = "'+this.syncInfo.lastSyncDate+'"', []);
    },
    //Useful to tell the client to send all his data again (like the firstSync)
    setFirstSync: function() {
        this.firstSync = true;
        this.syncInfo.lastSyncDate = 0;
        this._executeSql('UPDATE sync_info SET last_sync = "'+this.syncInfo.lastSyncDate+'"', []);
    },
    /*************** PRIVATE FUNCTIONS ********************/

    _getDataToBackup: function(callBack) {
        var self = this, nbData = 0;
        self.log('wSS187 _getDataToBackup');
        var dataToSync = {
            info: self.syncInfo,
            data: {}
        };

        self.db.transaction(function(tx) {
            var i, counter = 0, nbTables = self.tablesToSync.length, currTable;

            self.tablesToSync.forEach(function(currTable) {//a simple for will not work here because we have an asynchronous call inside
                self._getDataToSave(currTable.tableName, currTable.idName, self.firstSync, tx, function(data) {
                    dataToSync.data[currTable.tableName] = data;
                    nbData += data.length;
                    counter++;
                    if (counter === nbTables) {//only call the callback at the last table
                        self.log('Data fetched from the local DB');
                        //dataToSync.info.nbDataToBackup = nbData;
                        self.syncResult.nbSent = nbData;
                        callBack(dataToSync);
                    }
                });
            });//end for each
        });//end tx transaction
    },

    _getDataToSave: function(tableName, idName, needAllData, tx, dataCallBack) {
        var self = this, sql = '';
        if (needAllData) {
            sql = 'SELECT * FROM ' + tableName;
        } else {
            sql = 'SELECT * FROM ' + tableName + ' WHERE ' + idName + ' IN (SELECT DISTINCT id FROM new_elem WHERE table_name="' + tableName + '")';
        }
        self._selectSql(sql, null, tx, dataCallBack);
    },


    _sendDataToServer: function(dataToSync, uploadProgressCallBack, downloadProgressCallBack, finishCallBack) {
        var self = this;

        var XHR = new window.XMLHttpRequest(),
        data = JSON.stringify(dataToSync);
        callBackProgress('Data stringified done', 10, 'updateData');

        console.log("Line 261 clientData:",data);
        XHR.overrideMimeType = 'application/json;	charset=UTF-8';

		// You must add listeners before calling open() on a request. If not, the progress events will not be started. Ref: https://developer.mozilla.org/fr/docs/Web/API/XMLHttpRequest/Utiliser_XMLHttpRequest
		XHR.addEventListener("progress", self._updateProgress, false);		//_updateProgress is a function
		XHR.addEventListener("load", self._transferComplete, false);
		XHR.addEventListener("error", self._transferFailed, false);
		XHR.addEventListener("abort", self._transferCanceled, false);

////Remove the next 2 lines and use the 7 lines next to it to have authentication 
		XHR.open("POST", self.serverUrl, true);
		//XHR.timeout = 5000;	//default: no timeout
		XHR.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
//		XHR.setRequestHeader("Accept-Encoding", "gzip, deflate");	//+jc	//It gives the following error: Refused to set unsafe header "Accept-Encoding"

/*
//START added for Auth Ref: https://github.com/dmarko484/WebSqlSync/commit/55d2e0764ed21356edb06470faae88216bcd859c
		if (self.username!=null && self.password!=null && self.username!=undefined && self.password!=undefined ){
        	XHR.open("POST", self.serverUrl, true);
            XHR.setRequestHeader("Authorization", "Basic " + self._encodeBase64(self.username + ':' + self.password));    
        } else {
            XHR.open("POST", self.serverUrl, true);
        }
        XHR.setRequestHeader("Content-type", "application/json; charset=utf-8");
//END added for Auth
*/
/*
		var updateDownloadProgress = function(event) {
			if(event.lengthComputable) {
				var progress = (event.loaded / event.total) * 100; 4
				...
			}
		}
*/
        XHR.upload.addEventListener("progress", uploadProgressCallBack, false);	// See matlus.com/html5-file-upload-with-progress/
		// XHR.addEventListener("progress", downloadProgressCallBack, false);		
		XHR.onreadystatechange = function() {
        callBackProgress('Ln297 onReadySC*********************************************************', 85, 'updateData');
            var serverAnswer="";
            if(4 === XHR.readyState) {
				try{
                    serverAnswer = JSON.parse(XHR.responseText);
					//console.log("Line 259 Server answered:",serverAnswer);	
                } catch(e) {
                    serverAnswer = XHR.responseText;
					//console.log('e.message: ',e.message); 
					//console.log("Line 263 Server answered:",serverAnswer);
                }

                self.log('Line 289 Server answered: ');
				self.log(serverAnswer);
                //I want only json/object as response
                if(XHR.status == 200 && serverAnswer instanceof Object) {
					finishCallBack(serverAnswer);	
                } else {
                    serverAnswer = {
                        result : 'ERROR',
                        status : XHR.status,
                        message : XHR.statusText
                    };
					finishCallBack(serverAnswer);
                }
            }
        };

        callBackProgress('Data ready to send', 15, 'updateData');
        XHR.send(data);
        callBackProgress('Data sent', 20, 'updateData');
    },

	// progress of transfer from server to client (download)
	_updateProgress: function(oEvent) {
		if (oEvent.lengthComputable) {
			var percentComplete = oEvent.loaded / oEvent.total *100;
			console.log('Total to transfer:  '+oEvent.total);	// It gives 25002
			console.log('Total loaded:  '+oEvent.loaded);	// It gives 1284, then 25002
			console.log('Percent completed:  '+percentComplete);	// It gives 1284, then 25002
			//document.getElementById("downloadProgressNumber").value = 90	//It works but fixed value
			document.getElementById("downloadProgressNumber").value = percentComplete;
			document.getElementById("currProgress").value = percentComplete;
			currProgress.innerHTML = percentComplete+"%";
	
/*			//TO TEST: http://learnhtml5today.blogspot.ca/p/progress-bar.html
			function progressing(al) {
				var pBar = document.getElementById('downloadProgressNumber');
				var pStatus = document.getElementById('currProgress');
				pStatus.innerHTML = al+"%";
				pBar.value = al;
				al++;
				
				var update = setTimeout("progressing("+al+")",250);
				if(al == 100){
					 pStatus.innerHTML = "100%";
					 pBar.value = 100;
					 clearTimeout(update);
					 var completeMessage = document.getElementById('comMes');
					 completeMessage.innerHTML = "Upload/Download is completed";
				}
			}
			var now = 0;
			progressing(now);
*/			

		} else {
			console.log ("Impossible to calculate the progression because the total size is unknown");	
		}
	},
	_transferComplete: function(evt) {
		//alert("The transfer is finished.");
	},
	_transferCanceled: function(evt) {
		alert("The transfer was cancelled by the user.");
	},
	_transferFailed: function(evt) {
		alert("An error appended during the file transfer.");
	},

    _updateLocalDb: function(serverData, cbTransactionError, cbTransactionSuccess) {
        var self = this;
        self.serverData = serverData;

        if (!serverData || serverData.result === 'ERROR') {
            self.syncResult.syncOK = false;
            self.syncResult.codeStr = 'Line 316 syncToServer';
            if (serverData) {
                self.syncResult.message = serverData.message;
            } else {
                self.syncResult.message = 'Line 387 No answer from the server';
            }
            self.cbEndSync(self.syncResult);
            return;
        }
        if (typeof serverData.data === 'undefined' || serverData.data.length === 0) {
            //nothing to update
            self.db.transaction(function(tx) {
                //We only use the server date to avoid dealing with wrong date from the client
				self._finishSync(serverData.syncDate, tx);
            }, cbTransactionError, cbTransactionSuccess);
            return;
        }
		self.db.transaction(function(tx) {
            var counterNbTable = 0, nbTables = self.tablesToSync.length;
            var counterNbElm = 0;
            self.tablesToSync.forEach(function(table) {
                var tableData = serverData.data[table.tableName];
                if (typeof tableData === "undefined") {	// removed 
				//if (!currData) {							// added see github.com/orbitaloop/WebSqlSync/commit/0708ffc7af26c3466424b5f84dd6830ea05e6e63#diff-8470132640aa204e7bba5c3e2fe5846dR282
                    //Should always be defined (even if 0 elements)
				////Must not be null (added see github.com/orbitaloop/WebSqlSync/commit/0708ffc7af26c3466424b5f84dd6830ea05e6e63#diff-8470132640aa204e7bba5c3e2fe5846dR282)
                    tableData = [];
                }
                var nb = tableData.length;
                counterNbElm += nb;
                self.log('There are ' + nb + ' new or modified elements in the table ' + table.tableName + ' to save in the local DB');

				// For each table to sync, we create a listIdToCheck
                var i = 0, listIdToCheck = [];
                for (i = 0; i < nb; i++) {
    	        	listIdToCheck.push(serverData.data[table.tableName][i][table.idName]);
                }
                //console.log('listIdToCheck: ', listIdToCheck);	//AB: from ",,,,,6,7" -> "6,7" with the added if(id != "" ou "-1")

				// For each table to sync, find IDs existing in WebDB to attribute a decision: INSERT, UPDATE with id, UPDATE without id (with ID)
				var currRecObjToSync = tableData[0]; 
				var members = self._getAttributesList(currRecObjToSync);
				var IDname = members[0];
                console.log('Line 426 currRecObjToSync: ', currRecObjToSync, ' IDname: ', IDname);

                var i = 0, IDsToCheck = [];
                for (i = 0; i < nb; i++) {
    	                IDsToCheck.push(serverData.data[table.tableName][i][IDname]);
                }
				console.log("Line 432 IDsToCheck: ", IDsToCheck);	// It gives ["37", "36", "5", ...] or [] if nothing to sync for a table
				self._IDsExistingInWebDB(currRecObjToSync, table.tableName, table.IDname, IDsToCheck, tx, function(IDsInDB) {	
                	console.log('Line 434 IDsInDB: ', IDsInDB);	//It gives [] or [Object] where Object: ContactID: "8", last_sync_date: 2013-11-04 19:45:35 or null
					console.log('Line 435 serverData.syncDate: ', serverData.syncDate);
					// For IDsInDB, do an UPDATE if Slsd>Clsd (depending on last_Sync_date). For others, do an INSERT if it's not my BDBid and do an UPDATE if it's my BDBid
					// When id = "", it was created in MySQL, do an insert in webSQL 
					// For each record to sync, we get information to decide which action to do: INSERT, UPDATE with id, UPDATE without id (with ID) and we do it.
					self._syncEachRec_withIDsInDB(tableData, table.tableName, IDname, nb, IDsInDB, serverData.syncDate, tx, function() {
						console.log('Line 440 after self._syncEachRec_withIDsInDB: All inserted or updated');
					});
					console.log("Line 442 before counterNbTable++ before _finishSync : ", counterNbTable); 
					counterNbTable++;
					if (counterNbTable === nbTables) {
						//TODO set counterNbElm to info
						self.syncResult.nbUpdated = counterNbElm;
						self._finishSync(serverData.syncDate, null);	
					}
                }); //end _IDsExistingInWebDB
	        });//end forEach table
	    }, cbTransactionError, cbTransactionSuccess);	//end tx
    },

    /** return the listIdToCheck curated from the id that doesn't exist in tableName and idName
     * (used in the DBSync class to know if we need to insert new elem or just update)
     * @param {Object} tableName : card_stat.
     * @param {Object} idName : ex. card_id.
     * @param {Object} listIdToCheck : ex. [10000, 10010].
     * @param {Object} dataCallBack(listIdsExistingInDb[id] === true).
     */
//AB: Not used anymore. Replaced by _IDsExistingInWebDB
	_getIdExistingInDB: function(tableName, idName, listIdToCheck, tx, dataCallBack) {
		// listIdToCheck come from ln 418	
        if (listIdToCheck.length === 0) {
            dataCallBack([]);
            return;
        }
        var self = this;
		// SELECT id FROM Contacts WHERE id IN listIdToCheck
        var SQL = 'SELECT ' + idName + ' FROM ' + tableName + ' WHERE ' + idName + ' IN ("' + self._arrayToString(listIdToCheck, '","') + '")';
        self._selectSql(SQL, null, tx, function(ids) {
            var idsInDb = [];
            for (var i = 0; i < ids.length; ++i) {
                idsInDb[ids[i][idName]] = true;
            }
            dataCallBack(idsInDb);
        });
    },

    _IDsExistingInWebDB: function(currRecObjToSync, tableName, IDname, IDlistToCheck, tx, dataCallBack) {
		if(IDlistToCheck.length != 0){
			var self = this;
			var members = self._getAttributesList(currRecObjToSync);
			var IDname = members[0];	//R: It gives ContactID or UniteID or undefined if there is nothing to sync for a table
			// SELECT tableNameID, last_sync_date FROM Contacts WHERE tableNameID IN IDlistToCheck
			var SQL = 'SELECT ' + IDname + ' , last_sync_date FROM ' + tableName + ' WHERE ' + IDname + ' IN ("' + self._arrayToString(IDlistToCheck, '","') + '")';
			self._selectSql(SQL, [], tx, function(IDs) {
				var IDsInDB = [];
				console.log('Line 489 IDs: ', IDs);	
				for (var i = 0; i < IDs.length; ++i) {
					IDsInDB[i] = IDs[i];	//It gives [Object, Object, ...] where Object: ContactID: "8", last_sync_date: 2013-11-04 19:45:35
					//X//IDsInDB[i] = IDs[i][IDname]; //It gives [5,45,34] for example
				}
				console.log('Line 494 IDsInDB in _IDsExistingInWebDB function: ', IDsInDB);	//It gives [] or [Object] where Object: ContactID: "8", last_sync_date: 2013-11-04 19:45:35 or null
				//console.log('Line 495 IDsInDB in _IDsExistingInWebDB function: ', IDsInDB);	//It gives [] or [5,45,34] where Object: ContactID: "8", last_sync_date: 2013-11-04 19:45:35 or null
				dataCallBack(IDsInDB);
			});
    	}else{
			var IDsInDB = [];
			dataCallBack(IDsInDB);
		}
    },

	// Sync each record for each table
	_syncEachRec_withIDsInDB: function(tableData, tableName, IDname, nb, IDsInDB, syncDate, tx, callBack) {
		// For each record to sync, we use IDsInDB, record BDBid, client myBDBid, Clsd and Slsd to decide 
		// which action to do: INSERT, UPDATE with id, UPDATE without id (with ID) and we do it.
        var self = this;
		var currRec = null, sql = null;

        var i=0, counter = 0, nbRecs = tableData.length;
     	console.log("Line 512 nbRecs : ", nbRecs);	// R: It gives the number of records in the current table
		
		tableData.forEach(function(record){	//A simple for will not work here because we have an asynchronous call inside. 
			console.log("Line 515 syncDate : ", syncDate);	
			myBDBid = DBSYNC.syncInfo.BDBid;
            currRec = tableData[i]; 
			currBDBidValue = currRec["BDBid"];	 
			Slsd = currRec["last_sync_date"];	
			msgCode = "";
			msgCode = currRec["msgToApp"];

			currIDvalue = self._getIDvalue(currRec);	// It returns the currID value of the current record. ex: For ContactID, it returns "37".
     		console.log("Line 524 syncEachRec: currIDvalue: ", currIDvalue);	
     		console.log("Line 525 syncEachRec: currRec BDBid : ", currBDBidValue, " my mobile BDBid : ", myBDBid);
     		//console.log("Line 526 Slsd: ", Slsd);	// R: It gives the last_sync_date value of the current record
	     	//console.log("Line 527 syncEachRec: tableName  : ", tableName, " idName : ", tableIdName);	// tableName of the curr table R:  Contacts

			//console.log("Line 529 currRec idValue : ", currRec.[tableIdName], "currRec IDvalue : ", currIDvalue);	// If currIDvalue = -1, there is no ID in the table
			console.log("Line 530 currRec idValue : ", currIDvalue);	// If currIDvalue = -1, there is no ID in the table
			console.log("Line 531 currIDvalue : ", currIDvalue, "IDsInDB : ", IDsInDB); // It returns an array object: [ContactID: "43", last_sync_date: "2014-01-23 20:16:11"], [...],...
//			console.log("Line 532 currIDvalue isInArray IDsInDB: ", self._isInArray(currIDvalue, IDsInDB)); // It returns true (is in) or false (not in)
     		console.log("Line 533 syncDate : ", syncDate);	// R: It gives ____
			//if (currIDvalue is not in IDsinDB array){	// ID is NOT in DB

			var res_executeSql = [];
//			if (self._inArray(currIDvalue, IDsInDB)){
     		console.log("Line 538 IDname : ", IDname);	// R: It gives ActiviteID for example
			if (self._isInArray(currIDvalue, IDsInDB, IDname) == false){
				// ID is NOT in webSQL
     			console.log("Line 542 syncDate : ", syncDate);
     			console.log("Line 543 syncEachRec: currRec BDBid : ", currBDBidValue, " client browser myBDBid : ", myBDBid);
				if ((currBDBidValue==myBDBid)&&(currBDBidValue!=0)) {
					// Case 2 (B): This record was created on the client browser myBDB and it was waiting for an ID (attributed by the server), then UPDATE with id
					// Update the ID of my created record (ID=-1 changed to the ID attributed by the server). Change all field values but not the id field value of the Client.
					// ex: sqlB = "UPDATE " + table.tableName + " SET ClientID=ServerID, Client.field=Server.field, Client.BDBDid=Server.BDBid WHERE id = values[1]"
					console.log("Line 549 IDinWebDB : ", IDsInDB, " curr BDBidValue: ", currBDBidValue);	// -1 et =myBDBid
					sqlB = self._buildUpdateSQLwith_id(tableName, currRec, syncDate);
					console.log("Line 550 sqlSyncB : ", sqlB);
					self._executeSql(sqlB, [], tx);	// Retrait de : , res_executeSql
				} else { 
					// ID is NOT in webSQL, because this record was created on the server and has only an ID or an id from an other browser (don't use it).   
					// Case 1 (A,D1,E1,F1): First sync for this record. Insert with all members and values without the id autoincremented member
					// ex: sqlA = "INSERT INTO " + table.tableName + " (Client.ID, Client.fields, BDBid) VALUES (ServerAnswerRec.ID, ServerAnswerRec.field, ServerAnswerRec.BDBid)"
					var attList = self._getAttributesList(currRec);
					console.log("Line 557 curr BDBidValue: ", currBDBidValue);
					//console.log("Line 558 IDinWebDB : ", IDinWebDB, " curr BDBidValue: ", currBDBidValue);	// -1 et 0	Ça passe ici OK
					var sqlA = self._buildInsertSQLWithIdNull(tableName,currRec, syncDate);			// it returns an SQL with ?,?,?, ... without values
					var attValues = self._getMembersValueForIdNull(currRec, attList, syncDate);	// it returns the values to complete the SQL with ?,?,?, ... without values
					
					//ex: sqlA = "INSERT INTO Activites (ActiviteID,ActiviteDesc,ActiviteNote,ActiviteDate,ActiviteQte,MandatID,RessourceID,CategorieID,UniteID,last_sync_date,BDBid,last_sync) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)"
					//attValues = ["2754", "Entrevue", "", "2014-03-27", "7.00", "957", "2", "3", "0", "2014-03-27 12:08:35", "1395925221000", 1396181829000]
//					sqlA = "INSERT INTO Activites (ActiviteID,ActiviteDesc) VALUES(?,?)"
//					attValues = ["2754", "Entrevue"]
					console.log("sqlSyncAD1E1F1 line 566 sqlA: ", sqlA);
					console.log("sqlSyncAD1E1F1 line 567 attValues: ", attValues);
					console.log("sqlSyncAD1E1F1 line 568 tx: ", tx);
					//self._executeSql(sqlA, attValues, tx, res_executeSql);	// Bug with Chrome and Opera but not with Safari and Next
					self._executeSql(sqlA, attValues, tx);	// It works with all browser supporting webSQL
					//console.log("line 571 insert of _syncEachRec done");	// it passed here in the good sequence
				}
			} else {	// ID is in webSQL, do an update if the server is more up to date.
     			console.log("Line 574 syncDate : ", syncDate);	
				Clsd = IDsInDB[0].last_sync_date;		
				AppLSunix = IDsInDB[0].last_sync;		
				//AppSD = self._convertUnixTime(1420092061);	// App sync_date
				//AppSD = self._convertUnixTime(1422035353907);	// App sync_date
				AppLS = self._convertUnixTime(AppLSunix);	// App sync_date
				console.log("Line 580 from _IDsinWebDB Slsd: ", Slsd, "IDsInDB[Clsd] : ", Clsd, " AppSDunix = IDsInDB[0].sync_date : ", AppLSunix, " AppSD: ", AppLS); 
				if (Slsd>=Clsd) {
					// Case 3 (B3,C1,C3,D2,E2,F2,F3): The server is more up to date. Update all members and values
					// ex: sqlC = "UPDATE " + table.tableName + " SET ClientID=ServerID, Client.field=Server.field, Client.BDBDid=Server.BDBid (but not id) WHERE ID = values[0]"
     				console.log("Line 584 syncDate : ", syncDate);	// R: It gives ____
					sqlC = self._buildUpdateSQLwithID(tableName, currRec, syncDate);
					//console.log("Line 486 sqlSyncC_B3C1C3D2E2F2F3 : ", sqlC); 
					//self._executeSql(sqlC, [], tx, res_executeSql);	// Bog: mismatch error on 2nd callback
					self._executeSql(sqlC, [], tx);
				}
				if (msgCode=="CONFLICT"){
					// Case X: This record was changed in parallel. On both client and server between 2 sync.
					MessageX = "CONFLICT: The activity # "+ currIDvalue +" was modified on both client and server in the sync interval. The Serveur data has priority over the App data. Sync more often to avoid this situation."
					// Alert box to give the information on the conflict.
					alert(MessageX);
					console.log("Line 505 sqlX (BxCxCxDxExFx): ", MessageX, currRec, "server currRec IDvalue : ", currIDvalue);
				}
			}
			callBack();
			i++;
		});	//end of forEach Line 514
	}, 

    _convertUnixTime: function(unix_timestamp_string){	//Ex: 1234567890123 => aaaa-mm-jj hh:mm:ss
		var js_timestamp = Number(unix_timestamp_string);	// js needs it in milliseconds unix_timestamp*1000 => js
		var d = new Date(js_timestamp);	//var d = new Date("July 21, 1983 01:15:00"); selon http://www.w3schools.com/jsref/jsref_getfullyear.asp
		
		var year    = d.getFullYear();
		var months  = "0" + (d.getMonth()+1);
		var dates   = "0" + d.getDate();
		var hours   = "0" + d.getHours();
		var minutes = "0" + d.getMinutes();
		var seconds = "0" + d.getSeconds();
	
		var formattedDateTime = year + '-' + months.substr(months.length-2) + '-' + dates.substr(dates.length-2) + ' ' + hours.substr(hours.length-2) + ':' + minutes.substr(minutes.length-2) + ':' + seconds.substr(seconds.length-2);	// will display time in 10:30:23 format
		return formattedDateTime;
	},
	
    _isInArray: function(IDvalue, myArray, IDname) {
		var nb = myArray.length;
		var IDvalueNumber = IDvalue.toString();
        for (var i = 0; i < nb; i++) {
			console.log("Line 631 IDvalue: ", IDvalue, "IDvalueNumber: ", IDvalueNumber, " myArray[i][IDname] : ", myArray[i][IDname] );
			if (myArray[i][IDname] == IDvalue) {return true;} 
		}
		return false;
	},

    _finishSync: function(syncDate, tx) {
        var self = this, tableName, idsToDelete, idName, i, idValue, idsString;

		// To have a multi-device, multi-browser app. Required for id-ID mapping of INSERTs done first on a offline device
		if (this.firstSync == true) {
	        this._executeSql('UPDATE sync_info SET BDBid = "' + syncDate + '"', [], tx);	// BDBid = unique WebSQL DB identifier (the server last sync date of the first sync) 
			this.syncInfo.BDBid = syncDate;	//It allows to put BDBid in var DBSYNC at line 45, then it can be put in the clientJSON
		}

        this.firstSync = false;
        this.syncInfo.lastSyncDate = syncDate;
		console.log("Line 638 syncDate in _finishSync: ", syncDate);
        this._executeSql('UPDATE sync_info SET last_sync = "' + syncDate + '"', [], tx);

        // This 1st for removes the elems sent to the server from new_elem
        for (tableName in self.clientData.data) {
		//console.log("Line 643 in _finishSync 1st for");
            idsToDelete = new Array();
            idName =  self.idNameFromTableName[tableName];
            for (i=0; i < self.clientData.data[tableName].length; i++) {
                idValue = self.clientData.data[tableName][i][idName];
                idsToDelete.push('"'+idValue+'"');
            }
            if (idsToDelete.length > 0) {
                idsString = self._arrayToString(idsToDelete, ',');	//It gives "5","4","3","2","1"
            	//var new_elemDelSql1= 'DELETE FROM new_elem WHERE table_name = "'+tableName+'" AND id IN ('+idsString+')';	// => DELETE FROM new_elem WHERE table_name = 'Contacts' AND id IN ... idsString
				//console.log("Line 653 new_elemDelSql1: ", new_elemDelSql1);
                self._executeSql('DELETE FROM new_elem WHERE table_name = "'+tableName+'" AND id IN ('+idsString+')', [], tx);
            }
        }
		
        // This 2nd for removes the elems received from the server that were triggered by the SQL TRIGGERS, to avoid to send it again to the server and create a loop
		for (tableName in self.serverData.data) {
			console.log("Line 660 in _finishSync 2nd for");
            idName =  self.idNameFromTableName[tableName];
            var new_elemDelSql2= "DELETE FROM new_elem WHERE table_name = '"+tableName+ "' AND (SELECT id FROM " +tableName+ " WHERE last_sync = " +syncDate+ ")";	// => DELETE FROM new_elem WHERE table_name = 'Contacts' AND (SELECT id FROM Contacts WHERE last_sync = 1391726775000)
			//console.log("Line 663 new_elemDelSql2: ", new_elemDelSql2);
			self._executeSql(new_elemDelSql2, [], tx);
        }	// end 2nd for
	},

/***************** DB  util ****************/
    _selectSql: function(sql, params, optionalTransaction, callBack) {
        var self = this;
        self._executeSql(sql, params, optionalTransaction, function(tx, rs) {
			//console.log("Line 672 before _transformRs: ", rs); 
			callBack(self._transformRs(rs));	//if empty, rs = elms => []
        }, self._errorHandler);
    },

    _transformRs: function(rs) {
        var elms = [];
		//console.log("Line 679 _transformRs before typeof ");
        if (typeof(rs.rows) === 'undefined') {
			//console.log("Line 681 _transformRs: ", elms);
            return elms;
        }

        for (var i = 0; i < rs.rows.length; ++i) {
            elms.push(rs.rows.item(i));
        }
        return elms;
    },

    _executeSql: function(sql, params, optionalTransaction, optionalCallBack) {
        var self = this;
		//console.log('_executeSql Line 693: ' + sql + ' with param ' + params + ' with optTr: ' + optionalTransaction + ' optCB: ' + optionalCallBack );
		console.log('_executeSql Line 694: ' + sql + ' with param: ' + params  );	// Good query like: SELECT * FROM Contacts WHERE ContactID = 5
		console.log('Line 695 param typeof: ', typeof params );	// Like: SELECT * FROM Contacts WHERE ContactID = 5
		console.log('Line 696 optionalTransaction param typeof: ', typeof optionalTransaction );	// Like: SELECT * FROM Contacts WHERE ContactID = 5
        if (!optionalCallBack) {
            optionalCallBack = self._defaultCallBack;
        }
        if (optionalTransaction) {
            self._executeSqlBridge(optionalTransaction, sql, params, optionalCallBack, self._errorHandler);
        } else {
			console.log('Line 703 param typeof: ', typeof params, 'optionalTransaction typeof: ', typeof optionalTransaction);	
            self.db.transaction(function(tx) {
                self._executeSqlBridge(tx, sql, params, optionalCallBack, self._errorHandler);
            });
        }
    },

    _executeSqlBridge: function(tx, sql, params, dataHandler, errorHandler) {	//dataHandler = optionalCallBack
        var self = this;
    	tx.executeSql(sql, params, dataHandler, errorHandler);
    },

    _defaultCallBack: function(transaction, results) {
        //DBSYNC.log('SQL Query executed. insertId: '+results.insertId+' rows.length '+results.rows.length);
    },

    _errorHandler: function(transaction, error) {
        DBSYNC.error('Error : ' + error.message + ' (Code ' + error.code + ') Line 674or701or705 _errorHandler, Transaction.sql = ' + transaction.sql);
    },

	//Not used anymore
    _buildInsertSQL: function(tableName, objToInsert) {
        var members = this._getAttributesList(objToInsert);
        if (members.length === 0) {
            throw 'Line 727 buildInsertSQL : Error, try to insert an empty object in the table ' + tableName;
        }
        //build INSERT INTO myTable (attName1, attName2) VALUES (?, ?) -> need to pass the values in parameters
        var sql = 'INSERT INTO ' + tableName + ' (';
        sql += this._arrayToString(members, ',');
        sql += ') VALUES (';
        sql += this._getNbValString(members.length, '?', ',');
        sql += ')';

        return sql;
    },

	_buildInsertSQLWithIdNull: function(tableName, objToInsert, syncDate) {		// where objToInsert = curr = serverData.data[table.tableName][i]
		//Ex: INSERT INTO Contacts (ContactID, firstName, lastName, qte, MaJdate, cbFait, rbABC, UniteId, last_sync) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);", ['1', 'Alain', 'Alarie', '1', '2013-01-01', '1', 'A', '1', 1234567890123]
        var members = this._getAttributesList(objToInsert);
		//console.log('Line 742 members.length: ', members.length);	// It gives for ex: 10 records 
        if (members.length === 0) {
            throw 'buildInsertSQLWithIdNull : Error, try to insert an empty object in the table ' + tableName;
        }
		//If id=""(a record created in MySQL) we should remove the id field from the query to allow webSQL to do its autoincrement
		//console.log("Line 747 ServerAnswerRec.BDBid: ", serverData.data[table.tableName][i][table.idName]);	
		var values = this._getMembersValue(objToInsert, members);	// bug if we use self. instead of using this.
		console.log("Line 749 values: ", values);		// It gives ["5", "$P", "2014-02-03 22:00:38", 1391705435000]

//AB: It works with the following code but I don't know why. What is strange is: Before I do the push, my member is already there.
		var valuesPLUSsync_date = values;	
		valuesPLUSsync_date=valuesPLUSsync_date.push(syncDate);
		console.log("Line 754 syncDate: ", syncDate, "typeof:", typeof syncDate);	// It gives something like 1391705435000 (a number?)
		console.log("Line 755 values: ", values, "typeof:", typeof values);		// It gives ["5", "$P", "2014-02-03 22:00:38", 1391705435000]
		console.log("Line 756 valuesPLUSsync_date: ", valuesPLUSsync_date, "typeof:", typeof valuesPLUSsync_date);	// 

		var membersPLUSsync_date = members;	
		membersPLUSlast_sync_date=membersPLUSsync_date.push("last_sync");
		console.log("Line 760 members: ", members);		// It gives ["UniteID", "UniteSymbol", "last_sync_date", "last_sync"] => Good but why ????
		console.log("Line 761 membersPLUSsync_date: ", membersPLUSsync_date, "typeof:", typeof membersPLUSsync_date);	// It gives ["UniteID", "UniteSymbol", "last_sync_date", "last_sync"] => the push seems doing nothing.
	
		var sqlWithIdNull = 'INSERT INTO ' + tableName + ' (';
        var sqlMembers = '';
        var sqlQmark   = '';
        var nb = members.length;
        for (var i = 0; i < nb; i++) {
			//console.log('Line 768 member i: ', members[i]);	// R: Give the colomn name of the table Ex: ContactID, id, firstName, lastName, ... 
			//console.log('Line 769 value  i: ', values[i]);	// R: Give the value for each colomn of each record Ex: 3, "", Victor, Villeneuve, ... 
			if(members[i] != 'id'){	//if id, we dont include the id in the INSERT query to force webSQL to do its autoincrement on id
					sqlMembers += members[i];
        			sqlQmark  += '?';
				if (i < nb - 1) {
					sqlMembers += ',';
        			sqlQmark  += ',';
				}
			}
        }
		sqlWithIdNull += sqlMembers +') VALUES('+ sqlQmark +')';
		console.log("Line 780 _buildInsertSQLWithIdNull: ", sqlWithIdNull);
        return sqlWithIdNull;
    },

    _getMembersValueForIdNull: function(obj, members, syncDate) {
        var valuesArray = [];
        for (var i = 0; i < members.length; i++) {
			if(members[i] != 'id'){	//if id, we dont include the value in the INSERT query to force webSQL to do its autoincrement on id
				valuesArray.push(obj[members[i]]);
        	}
        }
        valuesArray.push(syncDate);
		return valuesArray;
    },

	// Update for records NOT created by myBDBid
	// Case #2 of the 2-way sync
	// If (ServerAnswerRec.id<>"" AND ServerAnswerRec.BDBid<>0 AND ServerAnswerRec.BDBid = Client.BDBid)
	// UPDATE tableName SET = Client.field=Server.field, Client.BDBDid=Server.BDBid WHERE Client.ID = ServerAnswerRec.ID

    _buildUpdateSQLwithID: function(tableName, objToUpdate, syncDate) {
        /*ex UPDATE "tableName" SET colomn 1 = [value 1], colomn 2 = [value 2] WHERE {condition}*/
        var self = this;
        var sql = 'UPDATE ' + tableName + ' SET ';
        var members = self._getAttributesList(objToUpdate);
        if (members.length === 0) {
            throw 'buildUpdateSQLwithoutId : Error, try to insert an empty object in the table ' + tableName;
        }
        var values = self._getMembersValue(objToUpdate, members);
        var nb = members.length;
        for (var i = 0; i < nb; i++) {
            if (i != 0) {	// To bypass the id member
	            sql += '"' + members[i] + '" = "' + values[i] + '"';
            }
            if ((i < nb - 1)&&(i!=0)) {
                sql += ', ';
            }
        }
        sql += ', "last_sync" = "' + syncDate + '" WHERE ' + members[0] + ' = "' + values[0] + '"';	//currIDvalue
        return sql;
    },

	// Update for records created by myBDBid that were waiting for the ID attributed by the server
    _buildUpdateSQLwith_id: function(tableName, objToUpdate, syncDate) {
        // ex UPDATE "tableName" SET colomn 1 = [value 1], colomn 2 = [value 2] WHERE tableNameID = tableNameIDvalue
        var self = this;
        var sql = 'UPDATE ' + tableName + ' SET ';
        var members = self._getAttributesList(objToUpdate);
        if (members.length === 0) {
            throw 'buildUpdateSQLwithoutId : Error, try to insert an empty object in the table ' + tableName;
        }
        var values = self._getMembersValue(objToUpdate, members);
        var nb = members.length;
        for (var i = 0; i < nb; i++) {
            if (i != 1) {	// To bypass the id member (id must be the first member)
	            sql += '"' + members[i] + '" = "' + values[i] + '"';
            }
            if ((i < nb - 1)&&(i!=1)) {
                sql += ', ';
            }
        }
        sql += ', "last_sync" = "' + syncDate + '" WHERE ' + members[1] + ' = "' + values[1] + '"';	//currIDvalue
		return sql;
    },

    _getIDvalue: function(objToSync) {	// objToSync = curr
        var self = this;
		//Rule: The ID position must be = 0, the first colomn in the MySQL table
        var members = self._getAttributesList(objToSync);
        if (members.length === 0) {
            throw 'getIDvalue : Error, you try to sync an empty object in the table ';
        }
        var IDvalues = self._getMembersValue(objToSync, members);
 		var IDval = IDvalues[0];
	    //console.log("Line 854 IDvalue: ", IDval);	
        return IDval;	// It returns the currID value of the current record. ex: For ContactID, it returns "37".
    },

    _getMembersValue: function(obj, members) {
        var membersValueArray = [];
        for (var i = 0; i < members.length; i++) {
            membersValueArray.push(obj[members[i]]);
        }
        return membersValueArray;
    },

    _getAttributesList: function(obj, check) {	//Should be renamed _getMembersNameList
        var membersArray = [];
        for (var elm in obj) {
            if (check && typeof this[elm] === 'function' && !obj.hasOwnProperty(elm)) {
                continue;
            }
            membersArray.push(elm);
        }
        return membersArray;
    },

    _getNbValString: function(nb, val, separator) {
        var result = '';
        for (var i = 0; i < nb; i++) {
            result += val;
            if (i < nb - 1) {
                result += separator;
            }
        }
        return result;
    },

    _getMembersValueString: function(obj, members, separator) {
        var result = '';
        for (var i = 0; i < members.length; i++) {
            result += '"' + obj[members[i]] + '"';
            if (i < members.length - 1) {
                result += separator;
            }
        }
        return result;
    },
    _arrayToString: function(array, separator) {
        var result = '';
        for (var i = 0; i < array.length; i++) {
            result += array[i];
            if (i < array.length - 1) {
                result += separator;
            }
        }
        return result;
//    }	//For auth, remove this line
//};		//For auth, remove this line

		////For auth, add the following line
    },//
    
    _keyStr : "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
    
        // public method for encoding
        _encodeBase64: function (input) {
                var output = "";
                var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
                var i = 0;
 
                input = this._utf8_encode(input);
 
                while (i < input.length) {
 
                        chr1 = input.charCodeAt(i++);
                        chr2 = input.charCodeAt(i++);
                        chr3 = input.charCodeAt(i++);
 
                        enc1 = chr1 >> 2;
                        enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
                        enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
                        enc4 = chr3 & 63;
 
                        if (isNaN(chr2)) {
                                enc3 = enc4 = 64;
                        } else if (isNaN(chr3)) {
                                enc4 = 64;
                        }
 
                        output = output +
                        this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) +
                        this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4);
 
                }
 
                return output;
        },
        
        _utf8_encode : function (string) {
                string = string.replace(/\r\n/g,"\n");
                var utftext = "";
 
                for (var n = 0; n < string.length; n++) {
 
                        var c = string.charCodeAt(n);
 
                        if (c < 128) {
                                utftext += String.fromCharCode(c);
                        }
                        else if((c > 127) && (c < 2048)) {
                                utftext += String.fromCharCode((c >> 6) | 192);
                                utftext += String.fromCharCode((c & 63) | 128);
                        }
                        else {
                                utftext += String.fromCharCode((c >> 12) | 224);
                                utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                                utftext += String.fromCharCode((c & 63) | 128);
                        }
                }
                return utftext;
        }
};
////

return DBSYNC;

}));
