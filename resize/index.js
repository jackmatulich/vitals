let ecg;
var rows=4;

window.onload=function(){
console.log('loading.');
ecg=document.getElementById("ecg");
ecg.style.backgroundColor="#282a36";
prepareDocument();
resizeCanvas();

}
window.onresize=function(){
    console.log('resizing.');
    resizeCanvas();
}

function resizeCanvas(){
ecg.width= window.innerWidth *.8;
ecg.height= (window.innerHeight*.95)/rows;

}
function prepareDocument(){
document.body.style.padding="0px";
document.body.style.margin="0px";
    
    }