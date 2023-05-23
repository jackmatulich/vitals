



var rows = 4;

window.onload = function () {
    console.log('loading.');

    ecg.style.backgroundColor = "#282a36";
    prepareDocument();
    resizeCanvas();
    drawWave();
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
ctx.strokeStyle = color;
ctx.lineWidth = 3;
ctx.setTransform(1, 0, 0, -1, 0, h);
var data = [30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,-30,-30,-30,-30,-30,-30,-30,-30,-30,-30,-30,-30,-30,-30,-30,-30,-30,-30,-30,-30,-30,-30,-30,-30,-30,-30,-30,-30,-30,-30,-30,-30,-30,-30,-30,-30,-30,-30,-30,-30,-30,-30,-30,-30,-30,-30,-30,-30,-30,-30]



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

    px += 1;  /* adds the value to the right to the variable on the left px(0)+speed (1)=0 */
    console.log('px=');
    console.log(px);
    ctx.clearRect(px, 0, scanBarWidth, h);/* (x coord of upper left, y coord of upper left, width in px, heigh in px) */
    ctx.beginPath();/* starts the line OR resets */
    ctx.moveTo(opx, opy);/* moves point to XY */
    ctx.lineJoin = 'round';/* rounds the join */
    py = (data[++i >= data.length ? i = 0 : i++] +(.5*h)); /* and */
    ctx.lineTo(px, py);/* and */
    ctx.stroke();/* and */
    opx = px;/* and */
    opy = py;/* and */
    if (opx > w) { px = opx = -speed; }/* and */

    setTimeout(() => {  requestAnimationFrame(drawWave); }, ( window.innerWidth *.8)/100);
   /* and */
}






window.onresize = function () {
    console.log('resizing.');
    w = window.innerWidth * .8;
    h = (window.innerHeight * .9)/rows;
    speed = Math.ceil((window.innerWidth * .8)/1000);
    i = 0;
    px = 0;
    opx = 0;

    py = h / 2; /* should equal 50 if height 100px */
    opy = py; /* should equal 50 if height 100px */
    resizeCanvas();
    drawWave();
}

function resizeCanvas() {
    ecg.width = window.innerWidth * .8;
    ecg.height = (window.innerHeight * .9) / rows;

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


