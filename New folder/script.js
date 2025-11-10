let menuicon=document.getElementById("menu-icon");

let navbar= document.getElementById("navbar");

menuicon.onclick=()=>{

//    navbar.style.right="-250px";

   if(navbar.style.right=="-250px"){
    navbar.style.right="0px";
   }
   else{
    navbar.style.right="-250px";
   }
}