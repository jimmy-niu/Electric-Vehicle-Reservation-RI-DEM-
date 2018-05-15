$(document).ready(function() {
    adminSocket.emit('updatePage', function(){
    });

    adminSocket.on('vehicleChange', function(vehicles){
        $('#current_fleet').empty();
        for(let i = 0; i < vehicles.rowCount; i++){
            new Vehicle(vehicles.rows[i]);
        }
    });

    bindClickHandlers();
    setUploader();
});

/**
  * Binds several click events to javascript functions.
  */
function bindClickHandlers(){
    $('#export-vehicles').click(function(e){
        e.preventDefault();
        window.location.href = 'download/vehicles';
    });

    $("#fleet_title").bind("click", function(){
        toggleHidden('fleet_header');
        toggleHidden('current_fleet');
        toggleTitle(this);
    });
}

/**
  * addVehicle reads the value of the add vehicle form, which
  * shows up when adding a new vehicle is clicked. This is bound to the 
  * submit of said form. 
  *
  * Once the data is read, a websocket connection is sent to the 
  * server and the vehicles sql table is updated. 
  */
function addVehicle(){
    let id = $('#vinField').val();
    let license = $('#licenseField').val();
    let model = $('#modelField').val();
    let color = $('#colorField').val();
    let miles = $('#milesField').val();
    let status  = ($('#carStatusField').val() === "service");
    let carType = ($('#evStatusField').val() === 'ev');
    let trunk = $('#extraTrunkChoice').is(':checked');
    let offRoad = $('#offRoadChoice').is(':checked');
    let equipmentRack = $('#equipChoice').is(':checked');
    let image = $('#imageFileName').val();

    if(id !== '' && license !== '' && model !== '' && color !== ''){
        let vehicle = {id: id, license: license, model: model, color: color, miles: miles, status: status,
                       isEv: carType, trunk: trunk, offRoad: offRoad, equipmentRack: equipmentRack, image: image};
        adminSocket.emit("vehicleAdded", vehicle, function(){
        });
    }

    clearForms($("#carSpecs"));
    clearForms($("#carCaps"));
    clearForms($("#frmUploader"));
}

/**
  * Takes in the file path to an image and appends said image
  * to the DOM element associated with the given id. 
  *
  * @params
  * id: The id of the dom element. 
  * imgSrc: The file path to the image. 
  */
function insertVehicleImage(id, imgSrc){
    let img = `<img src = "${imgSrc}"`;
    $(`#${id}`).append();
}

/**
  * Deletes a vehicle from the database based on license number.
  *
  * @params
  * license: The license of the vehicle to remove. 
  */
function deleteVehicle(license){
    adminSocket.emit("vehicleRemoved", license, function(){
        //Callback
    });
    $('.'+license).remove();
}

/**
  * Updates the vehicle status. 
  *
  * @params
  * license: The license of the vehicle to update.
  * status: The new status of the vehicle.
  */
function updateVehicleStatus(license, status){
    adminSocket.emit('vehicleStatusUpdated', license, status, function(){
    });
}

function fillInEditModal(vehicleData){
    console.log("are are in fillineditmodal");
    console.log(vehicleData);
    $('#vinField-edit').val(vehicleData.id);
    $('#licenseField-edit').val(vehicleData.license);
    $('#modelField-edit').val(vehicleData.model);
    $('#colorField-edit').val(vehicleData.color);
    $('#milesField-edit').val(vehicleData.miles);
    $('#imageFileName-edit').val(vehicleData.image);
    
    document.getElementById('vehicle-edit-submit').removeAttribute('onClick');
    
    if(vehicleData.inService == 0){
        $('#carStatusField-edit').val("ready");
        $('#vehicle-edit-submit').click(function(e){
            console.log('reached1');
            e.preventDefault();
            editVehicle(false); //Edit vehicle with oldStatus false if the vehicle was not being serviced.
        });
    } else {
        $('#carStatusField-edit').val("service");
        $('#vehicle-edit-submit').click(function(e){
            console.log('reached2');
            e.preventDefault();
            editVehicle(true); //Edit vehicle with oldStatus true if the vehicle was being serviced.
        });
    }

    if(vehicleData.isEV == 1){
        $('#evStatusField-edit').val("ev");
    } else {
        $('#evStatusField-edit').val("gas");
    }

    if(vehicleData.extraTrunk == 1){
        $('#extraTrunkChoice-edit').prop("checked", true);
    } else {
        $('#extraTrunkChoice-edit').prop("checked", false);
    }

    if(vehicleData.offRoad == 1){
        $('#offRoadChoice-edit').prop("checked", true);
    } else {
        $('#offRoadChoice-edit').prop("checked", false);
    }

    if(vehicleData.equipmentRack == 1){
        $('#equipChoice-edit').prop("checked", true);
    } else {
        $('#equipChoice-edit').prop("checked", false);
    }

}

function editVehicle(oldStatus){
    let id = $('#vinField-edit').val();
    let license = $('#licenseField-edit').val();
    let model = $('#modelField-edit').val();
    let color = $('#colorField-edit').val();
    let miles = $('#milesField-edit').val();
    let status  = ($('#carStatusField-edit').val() === "service");
    let carType = ($('#evStatusField-edit').val() === 'ev');
    let trunk = $('#extraTrunkChoice-edit').is(':checked');
    let offRoad = $('#offRoadChoice-edit').is(':checked');
    let equipmentRack = $('#equipChoice-edit').is(':checked');
    let image = $('#imageFileName-edit').val();

    if(id !== '' && license !== '' && model !== '' && color !== ''){
        let vehicle = {id: id, license: license, model: model, color: color, miles: miles, inService: status,
                       isEV: carType, extraTrunk: trunk, offRoad: offRoad, equipRack: equipmentRack, image: image};
        adminSocket.emit('vehicleEdited', vehicle, oldStatus);
    }
}

function deleteVehicle(license){
    adminSocket.emit("vehicleRemoved", license, function(){
    });
    // This works on just deleting the vehicle dom obj btw.
    $('.'+license).remove();
}

function updateVehicleStatus(license, status){
    adminSocket.emit('vehicleStatusUpdated', license, status, function(){
    });
}

//======Classes for new DOM elements======//
class Vehicle {
    constructor(vehicleData){
        this.addToDOM(vehicleData);
    }

    addToDOM(v){
        let carType = "Gas";
        if(v.isEV){
            carType = "Electric Vehicle";
        }
        let data = JSON.stringify(v);
        let DOMobject = `<div class = "col-entry ${v.license}">${v.license}</div>` + `<div class = "col-entry ${v.license}">${v.color} ${v.model}</div>`
        + `<div class = "col-entry ${v.license}">${v.miles} miles</div>`
        + `<div class = "col-entry ${v.license}">${carType}</div>`
        + `<div class = "col-entry ${v.license}"><span class="dropdown">`
        + `<button class="btn btn-primary dropdown-toggle" type="button" data-toggle="dropdown">Change Status</button>`
        + `<ul class="dropdown-menu">`
        + `<a href="#editVehicle" data-toggle="modal" data-target="#editVehicleModal" onclick = 'fillInEditModal(${data});'> <li><i class="fa fa-wrench"></i> Edit Car</li></a>`
        + `<div onclick = 'deleteVehicle("${v.license}")'><li><i class="fa fa-archive"></i> Retire</li></div>`
        + `</ul></span></div>`;
        $('#current_fleet').append(DOMobject);
    }
}

//======Image Uploading======//
function setUploader(){
    // bind to the form's submit event
    let upload1 = document.getElementById("frmUploader");
    let upload2 = document.getElementById("frmUploader-edit");
    $([upload1, upload2]).unbind("submit").bind("submit", function(e){
        e.preventDefault();
        let license = "";
        if($("#licenseField").val() !== undefined && $("#licenseField").val() !== ""){
            license = $("#licenseField").val();
        } else {
            license = $("#licenseField-edit").val();
        }
        
        if(license === "" || license === undefined){
            window.alert("Please enter a license plate number before uploading the vehicle.")
        } else {
            let options = {
                data: {license: ""},
                success: finishedUpload,
                error: uploadError
            };
            options.data.license = license;
            $(this).ajaxSubmit(options);
        }
        return false;
    });
    
    // $('#frmUploader-edit').unbind("submit").bind("submit", function(e){
        // e.preventDefault();
        // let license = $("#licenseField-edit").val();
        
        // if(license === "" || license === undefined){
            // window.alert("Please enter a license plate number before uploading the vehicle.")
        // } else {
            // let options = {
                // data: {license: ""},
                // success: finishedUpload,
                // error: uploadError
            // };
            // options.data.license = license;
            // $(this).ajaxSubmit(options);
        // }
        // return false;
    // });
}

function uploadError(data){
    window.alert("The file type you are uploading is not supported.");
}
function finishedUpload(data){
    $('#imageFileName').val(data);
    $('#imageFileName-edit').val(data);
    window.alert("Image uploaded successfully.");
}
