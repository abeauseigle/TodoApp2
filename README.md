

TodoApp 
=====================
**TodoApp** is an HTML5 WebSql Application with CRUD (Create, Reach, Update, Delete). It uses the local SQLite database included in the browser (Chrome, Safari, and many mobile browsers). It uses only HTML5 and CSS for the UI. The form contains different types of field such as text, number, date (with a calendar), selectbox, checkbox and radio button. It uses an improved webSqlSync.js to automatically synchronize the local WebSql database (SQLite of the browser) with a php-MySQL server. My modified version of webSqlSync.js allows a bi-directional sync for multiple device browsers, not only one. The MySQL database is the pivot of all browsers WebSQL DB.
Thanks to Samuel for WebSqlSync.js (https://github.com/orbitaloop/WebSqlSync).

Installing
==========

- copy the files in a todoapp folder on your server.
- change the connexion data to your server (dbhost, dbname, dbuname, dbpass) in the php file in the connexion folder.
- change mywebsite.com or mydomain.com to your server name.
- index.html is the main file of the application. Start with it in your learning. It uses todoapp.js that is the controller of the app.
- Click on the Auth button to authenticate to your user account. In the included DB, use the username myusername with the password D3m0n.
- In the first time, we sync to get (download) the data from the server MySQL database using webSqlSync.js. 
- I modified the webSqlSync.js to treat the data from the server with a double id (tablename_ID for the server and id for the app). When the contact id is null in MySQL, it means that the record was created in MySQL first.
- The todo table is two way synced.
- The resource, category and user tables are one way sync (server to client). It's just to feed the options of the select box.

How it works
==========
I use 2 indexes (one for the client DB and one for the server DB). 
I modified webSqlSync.js to handle inserted records directly into MySQL that have a null client id value. I did a major changed in the code to be sure the sync is possible with many devices (many browsers in fact because a device may have many browsers). The first sync, the server sends a timestamp to create a BDBid (browser DataBase unique id). Here is the trick that was not easy to implement.
I added or changed many functions to webSqlSync.js to determine if we INSERT or UPDATE the webSQL DB from the ServerJson.
When I insert a record in webSQL (with the app.js code), I use -1 in the "server" ID to inform the server adapter that's a record newly created with the app. 
"-1" means to do an INSERT INTO MySQL. It records the BDBid creator to update the creator ID (to change it from -1 to the server one).

The Authentication page appears if the tables are empty to say to the user to authenticate and do a first sync to fill the tables from the server.

I hope it will help you to create your own webSql app. You are welcome to improve the code of the 2 ways sync.

## Limitations:

 - DELETE are not handled for now in the sync process.
 - There is a minimal error handling for the server side to the client via a msg field in the server answer Json. The app will open an alert to signify that the server was updated after the client last sync for a specific id. You're welcome to help me to improve it.
 - Still to do: Authentication encryption. Security improvement to avoid js injection. Gzip the JSON.
 - Your help will be appreciated.

Little hints to debug your app:
-	Run the php code to make sure you get a valid server answer json (bypass the authentication before as said in the php code).
-	Use the debug1 and debug2 fields in the server answer json.
-	Use the Chrome debug tool to see the console feedback from the yourapp.js

Have fun!
