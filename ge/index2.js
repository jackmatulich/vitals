let ecg;

window.onload=function(){
console.log('loading.');
ecg=document.getElementById("cnv");
ecg.style.backgroundColor="white";
prepareDocument();
resizeCanvas();

}
window.onresize=function(){
    console.log('resizing.');
    resizeCanvas();
}

function resizeCanvas(){
ecg.width= window.innerWidth *.8;
ecg.height= window.innerHeight *.19;

}
function prepareDocument(){
document.body.style.padding="0px";
document.body.style.margin="0px";
    
    }