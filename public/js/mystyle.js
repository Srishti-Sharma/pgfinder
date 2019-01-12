let temp = document.querySelector(".navbar-nav");
temp.addEventListener('click',runEvent,true);
function runEvent(e){
    if(e.target.parentElement.classList.contains("nav-item")){
        e.target.parentElement.classList.add("active");
        console.log(e.target.parentElement.classList);
    }
}