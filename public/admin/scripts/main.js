function toggle_next_row(object){
    if(object.innerHTML.includes("▼")){
        object.innerHTML = object.innerHTML.replace("▼", "▲");
        object.nextSibling.nextSibling.nextSibling.nextSibling.style.display = "none";
    } else {
        object.innerHTML = object.innerHTML.replace("▲", "▼");
        object.nextSibling.nextSibling.nextSibling.nextSibling.style.display = "inherit";
    }
    
}