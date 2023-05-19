
var rows = 4;
var ecgwaveform = document.getElementById("ecg");
var ctx = ecgwaveform.getContext("2d");
var w = ecgwaveform.width,
    h = ecgwaveform.height,
    speed = 1,
    scanBarWidth = 20,
    i = 0,

    color = '#00ff00';
var px = 0;
var opx = 0;
var py = h / 2; /* should equal 50 if height 100px */
var opy = py; /* should equal 50 if height 100px */
ctx.strokeStyle = color;
ctx.lineWidth = 3;
ctx.setTransform(1, 0, 0, -1, 0, h);
var data = [-20, -20, -20, -20, -20, -20, -20, -20,-20, -20, -20, -20, -20, -20, -20, -20,-20, -20, -20, -20, -20, -20, -20, -20, 20, 20, 20, 20, 20, 20,20, 20, 20, 20, 20, 20,20, 20, 20, 20, 20, 20]


drawWave();

function drawWave() {
    px += speed;  /* adds the value to the right to the variable on the left px(0)+speed (1)=0 */
    ctx.clearRect(px, 0, scanBarWidth, h);/* (x coord of upper left, y coord of upper left, width in px, heigh in px) */
    ctx.beginPath();/* starts the line OR resets */
    ctx.moveTo(opx, opy);/* moves point to XY */
    ctx.lineJoin = 'round';/* rounds the join */
    py = (data[++i >= data.length ? i = 0 : i++] +(0.0*h)); /* and */
    ctx.lineTo(px, py);/* and */
    ctx.stroke();/* and */
    opx = px;/* and */
    opy = py;/* and */
    if (opx > w) { px = opx = -speed; }/* and */


    requestAnimationFrame(drawWave);/* and */
}






window.onload = function () {
    console.log('loading.');

    ecg.style.backgroundColor = "#282a36";
    prepareDocument();
    resizeCanvas();

}
window.onresize = function () {
    console.log('resizing.');
    resizeCanvas();
    drawWave();
}

function resizeCanvas() {
    ecg.width = window.innerWidth * .8;
    ecg.height = (window.innerHeight * .9) / rows;

}
function prepareDocument() {
    document.body.style.padding = "0px";
    document.body.style.margin = "0px";

}
function rowchange() {
    rows = document.getElementById("mySubmit").value;
    document.getElementById("rowval").innerHTML = rows;
    resizeCanvas();

}


