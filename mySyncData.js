var SYNCDATA = {
    url: 'http://www.affairesup.com/todoapp',	// Set your server URL here	______
    database: 'TodoApp',	// webSQL database object (line 237 of indext.html)
    tableToSync: [
		{tableName: 'Todo'}, 
		{tableName: 'Resource'}
	],
        //idName: 'uniteId'
    sync_info:{//Example of user info
        userEmail: 'name@abc.com',//the user mail is not always here
        device_uuid: 'UNIQUE_DEVICE_ID_287CHBE873JB',//if no user mail, rely on the UUID
        BDBid: '0',
        username: '',
        password: '',
        lastSyncDate: '0',
		device_version: '0.0',
        device_name: 'test navigator',
		userAgent: navigator.userAgent,
        //app data
        appName: 'TodoApp',
        ExpertApp_version: '1.0',
        lng: 'fr'
    },
    _nullDataHandler: function(){

    },
    _errorHandler: function(transaction, error){
		console.error('Error mySyncData.js Line 31 : ' + error.message + ' (Code ' + error.code + ') Transaction.name = ' + transaction.name);
    }
};
