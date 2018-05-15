# cs132FinalProject
A Vehicle Reservation Webapp for Rhode Island DEM

<!-- ## Link to Actual Site:
https://jimmy-niu.github.io/cs132FinalProject/public/index.html -->

## How to run
- Clone the repository
- Run `npm install` to get all required packages and modules
- Run `node server.js` to start the server
- Navigate to `localhost:8080` in the browser

## Front end to Back end Connection with Socket.io
We are connecting the frontend and the backend using socket.io. There are two namespaces, user and admin to distinguish between events for the two different types of users. Below are listed all the handlers along with the file that contains the handler. The corresponding server or client side file contains the emitter for each handler.

Socket Handlers:
Regular User- Server.js

- Name: join
	- Parameters: user, callback
		- Purpose: Selects all reservations for given user and returns that data to the client by sending it as a parameter of the callback function. 

- Name: reservation
Parameters: reservationInfo (JSON object with fields- user, start, end, stops, override, justification, needsTrunk, needsOffRoad, needsRack), callback (function)
Purpose: Emitted by the user when a user inputs information to make a new reservation. Assigns a vehicle to the reservation based off user needs and time of reservation. Prioritizes use of EVs. Does not allow the user to make a reservation that overlaps with one they already have. Adds the id and new vehicle information to the reservation JSON object, as well as information about carpooling if possible. Sends back new reservation information to user. 

Name: addReservation
Parameters: reservationInfo (JSON object with fields- id, user, start, end, stops, override, justification, needsTrunk, needsOffRoad, needsRack), callback (function)
Purpose: Emitted by the user when they confirm the reservation and the vehicle (assigned or override). Adds the information about the new reservation to the database, adds the event to the user’s calendar, and send the new info to the admins. 

Name: edit
Parameters: reservationInfo (JSON object with fields- id, user, start, end, stops, justification), oldData (JSON object with old time and car info for the reservation before it was edited, needed to delete calendar event)
Purpose: Emitted by the user when a user inputs information to edit a reservation. Assigns a vehicle to the reservation based off user needs and time of reservation. Prioritizes use of EVs. Does not allow the user to make a reservation that overlaps with one they already have. Changes the id and new vehicle information in the reservation JSON object, as well as information about carpooling if possible. Sends back updated reservation information to user. 

Name: editReservation
Parameters: reservationInfo (JSON object with fields- id, user, start, end, stops, override, justification, needsTrunk, needsOffRoad, needsRack),  oldData (JSON object with old time and car info for the reservation before it was edited, needed to delete calendar event), callback (function)
Purpose: Emitted by the user when they confirm the edit to the reservation and the vehicle (fre-assigned or override). Updates the information about the reservation in the database, removes the old event from the user’s calendar, adds a new event to the user’s calendar with the updated info, and send the updated info to the admins. 

Name: cancel
Parameters: reservationID, user
Purpose: Allows the user to cancel the reservation of the given ID. Removes reservation from reservations table and the event from the user’s calendar. Returns the id of the cancelled reservation to the admin so it can be removed visually.

Name: reportAdded
Parameters: reservationID, report, needsService, needsCleaning, notCharging
Purpose: Emitted when the user submits a report. Adds the reservationID, report text, and other information about immediate needs to the reports table. Sends the new report to the admins, and emails one of the admins about it. 

Regular User- Main.js (/user/scripts)

Name: reservationChange
Parameters: reservations (data from sql query)
Purpose: Retrieve list of reservations for the current user, to display for them.

Name: newReservation
Parameters: vehicles, reservation, isEdit
Purpose: Retrieve the information of the reservation the user is currently making, with its newly assigned vehicle to display to the user. Also retrieves and stores the list of alternative vehicles. Sets the state of the client side to be not in editing mode.

Name: editReservation
Parameters: vehicles, reservation, oldData, isEdit
Purpose: Retrieve the information of the reservation the user is currently making, with its newly assigned vehicle to display to the user. Also retrieves and stores the list of alternative vehicles. Sets the state of the client side to be in editing mode.

Name: noVehicle
Parameters: none
Purpose: Pops up error modal alerting the user that there is no vehicle that meets the criteria they supplied. 

Name: isOverlap
Parameters: none
Purpose: Pops up error modal alerting the user that they have an existing reservation that overlaps with the time they gave for their new reservation.

