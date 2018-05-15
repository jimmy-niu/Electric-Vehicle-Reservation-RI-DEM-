let adminSocket = io.connect('http://localhost:8080/admin', {forceNew: true});

function toggleHidden(id){
    document.getElementById(id).classList.toggle('hidden');
}

function toggleTitle(object){
    let content = object.innerHTML;
    if(content.includes("▼")){
        object.innerHTML = content.replace("▼", "▲");
    } else {
        object.innerHTML = content.replace("▲", "▼");
    }
}

function clearForms(obj){
    obj.trigger("reset");
}

function getBooleanStr(aNumber){
    if(aNumber === 1){
        return "Yes";
    } else {
        return "No";
    }
}

function getBoolean(aNumber){
    return aNumber === 1;
}

/*
 * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 *  Functions below are not currently wired up.
 * ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
 */
function removeReport(id){
    adminSocket.emit('reportRemoved', id);
}

function changeUserStatus(email, admin){
    adminSocket.emit('userStatusChanged', email, admin);
}
