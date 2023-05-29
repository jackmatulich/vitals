



var rows = 4;

window.onload = function () {
    console.log('loading.');

    ecg.style.backgroundColor = "#282a36";
    prepareDocument();
    resizeCanvas();
    drawWave();
}




let rate=30;
let Ao = 0; 
let As = 0; 
let Vo = 0; 
let Vs = 0; 
let PACE=false;
document.getElementById("Rate").textContent = Rate; 
document.getElementById("Aoutput").textContent = Ao; 
document.getElementById("Asense").textContent = As; 
document.getElementById("Voutput").textContent = Vo; 
document.getElementById("Vsense").textContent = Vs; 

function Rplus() { 
     Rate=Rate+5; 
     document.getElementById("Rate").textContent = Rate; 

 } 
 function Rminus() { 
    Rate=Rate-5; 
     document.getElementById("Rate").textContent = Rate; 

 } 


 function Aoplus() { 
     Ao++; 
     document.getElementById("Aoutput").textContent = Ao; 

 } 
 function Aominus() { 
     Ao--; 
     document.getElementById("Aoutput").textContent = Ao; 
 } 

 function Asplus() { 
     As++; 
     document.getElementById("Asense").textContent = As; 
 } 
 function Asminus() { 
     As--; 
     document.getElementById("Asense").textContent = As; 
 } 
 function Voplus() { 
     Vo++; 
     document.getElementById("Voutput").textContent = Vo; 
 } 
 function Vominus() { 
     Vo--; 
     document.getElementById("Voutput").textContent = Vo; 
 } 

 function Vsplus() { 
     Vs++; 
     document.getElementById("Vsense").textContent = Vs; 
 } 
 function Vsminus() { 
     Vs--; 
     document.getElementById("Vsense").textContent = Vs; 
 } 



var ecgwaveform = document.getElementById("ecg");
var ctx = ecgwaveform.getContext("2d");
var w = window.innerWidth *.8,
    h = (window.innerHeight * .9)/rows,
    speed = Math.ceil((window.innerWidth * .8)/1000),
    
    scanBarWidth = 30,
    i = 0,
    color = '#00ff00';
var px = 0;
var opx = 0;
var py = h / 2; /* should equal 50 if height 100px */
var opy = py; /* should equal 50 if height 100px */
var invert=0;
ctx.strokeStyle = color;
ctx.lineWidth = 2;
ctx.setTransform(1, 0, 0, -1, 0, h);
var data = [1,3,6,9,11,12,11,10,8,5,3,1,0,0,1,1,1,0,0,0,0,0,0,0,0,0,-5,50,-5,-4,-3,-2,-1,0,1,2,3,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,17,18,18,17,15,12,10,8,5,4,3,2,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
var AtrialPacedSuccess=[0,0,20,1,0,0,1,2,2,1,0];
var VentriclePacedSuccess=[0,0,20,2,1,0,-1,-2,-3,-15,-30,-45,-50,-45,-30,-20,-15,-5,0,1,2,3,4,5,10,16,20,22,23,23,22,20,15,10,5,4,3,2,1,0];

function drawWave() {
    ctx.strokeStyle = color;

    ctx.lineWidth = 3;
    console.log('array length:');
    console.log( data.length);
    console.log('inner width:');
    console.log( window.innerWidth *.8);
   
    console.log('canvas scroll width:');
    console.log(ecgwaveform.scrollWidth);
    console.log('step width=');
    console.log(speed);

    px += speed;  /* adds the value to the right to the variable on the left px(0)+speed (1)=0 */
    console.log('px=');
    console.log(px);
    ctx.clearRect(px, 0, scanBarWidth, h);/* (x coord of upper left, y coord of upper left, width in px, heigh in px) */
    ctx.beginPath();/* starts the line OR resets */
    ctx.moveTo(opx, opy);/* moves point to XY */
    ctx.lineJoin = 'round';/* rounds the join */
    invert = (data[++i >= data.length ? i = 0 : i++] ); /* and */
    py =(invert-invert-invert)+(.6*h);
    ctx.lineTo(px, py);/* and */
    ctx.stroke();/* and */
    opx = px;/* and */
    opy = py;/* and */
    if (opx > w) { px = opx = -speed; }/* and */

  

    setTimeout(function(){ requestAnimationFrame(drawWave); }, speed*(10000/(window.innerWidth *.8)));
   /* and */
}






window.onresize = function () {
    console.log('resizing.');
 
    resizeCanvas();
  
}

function resizeCanvas() {
    ecg.width = window.innerWidth * .8;
    ecg.height = (window.innerHeight * .9) / rows;
    w = window.innerWidth * .8;
    h = (window.innerHeight * .9)/rows;
    speed = Math.ceil((window.innerWidth * .8)/1000);
    i = 0;
    px = 0;
    opx = 0;

    py = h / 2; /* should equal 50 if height 100px */
    opy = py; /* should equal 50 if height 100px */

}
function prepareDocument() {
   /* document.body.style.padding = "0px"; */
   /*  document.body.style.margin = "0px"; */

}
function rowchange() {
    rows = document.getElementById("mySubmit").value;
    document.getElementById("rowval").innerHTML = rows;
    resizeCanvas();

}


