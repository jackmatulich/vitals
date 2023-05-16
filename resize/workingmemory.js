var ctx = ecgwaveform.getContext("2d");
var w = ecg.width,
h = ecg.height,
speed = 1,
scanBarWidth = 20,
i=0,

color='#00ff00';
var px = 0;
var opx = 0;
var py = h/2; /* should equal 50 if height 100px */ 
var opy = py; /* should equal 50 if height 100px */ 
ctx.strokeStyle = color;
ctx.lineWidth = 3;
ctx.setTransform(1,0,0,-1,0,h);


drawWave();

function drawWave() {
   px += speed;  /* adds the value to the right to the variable on the left px(0)+speed (1)=0 */ 
        ctx.clearRect( px,0, scanBarWidth, h);/* (x coord of upper left, y coord of upper left, width in px, heigh in px) */ 
        ctx.beginPath();/* starts the line OR resets */ 
        ctx.moveTo( opx,  opy);/* moves point to XY */ 
        ctx.lineJoin= 'round';/* rounds the join */ 
        py=(data[++i>=data.length? i=0 : i++]/450+30); /* and */ 
        ctx.lineTo(px, py);/* and */ 
        ctx.stroke();/* and */ 
         opx = px;/* and */ 
        opy = py;/* and */ 
        if (opx > w) {px = opx = -speed;}/* and */ 


         requestAnimationFrame(drawWave);/* and */ 
}