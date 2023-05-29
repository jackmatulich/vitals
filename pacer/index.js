



var rows = 4;

window.onload = function () {
    console.log('loading.');

    ecg.style.backgroundColor = "#282a36";
    prepareDocument();
    resizeCanvas();
    drawWave();
}




let rate=70;
let Ao = 0; 
let As = 0; 
let At = 0; 
let Vo = 0; 
let Vs = 0; 
let Vt = 0; 
let PaceRateCountDown=6000/rate;
let APaceRead = 0; 
let VPaceRead = 0; 
let AVDelay=20;

document.getElementById("Rate").textContent = rate; 
document.getElementById("Aoutput").textContent = Ao; 
document.getElementById("Asense").textContent = As; 
document.getElementById("Voutput").textContent = Vo; 
document.getElementById("Vsense").textContent = Vs; 
document.getElementById("AThreshold").textContent = At; 
document.getElementById("VThreshold").textContent = Vt; 
function Rplus() { 
     rate=rate+5; 
     PaceRateCountDown=6000/rate;
     document.getElementById("Rate").textContent = rate; 

 } 
 function Rminus() { 
    rate=rate-5; 
    PaceRateCountDown=6000/rate;
     document.getElementById("Rate").textContent = rate; 

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

 function Atplus() { 
    At++; 
    document.getElementById("AThreshold").textContent = At; 
} 
function Atminus() { 
    At--; 
    document.getElementById("AThreshold").textContent = At; 
} 
function Vtplus() { 
    Vt++; 
    document.getElementById("VThreshold").textContent = Vt; 
} 
function Vtminus() { 
    Vt--; 
    document.getElementById("VThreshold").textContent = Vt; 
} 




var ecgwaveform = document.getElementById("ecg");
var ctx = ecgwaveform.getContext("2d");
var w = window.innerWidth *.8,
    h = (window.innerHeight * .9)/rows,
    speed = Math.ceil((window.innerWidth * .8)/1000),
    
    scanBarWidth = 30,
    i = 0,
    pacei=0,
    color = '#00ff00';
var px = 0;
var opx = 0;
var py = h / 2; /* should equal 50 if height 100px */
var opy = py; /* should equal 50 if height 100px */
var invert=0;
ctx.strokeStyle = color;
ctx.lineWidth = 2;
ctx.setTransform(1, 0, 0, -1, 0, h);
var data=[0.15,26.27,51.26,41.25,31.23,21.21,11.19,1.16,-8.87,-18.91,-28.95,-33.99,-37.03,-39.08,-38.12,-37.16,-34.21,-29.25,-19.30,-9.34,0.62,0.58,0.55,0.52,1.49,3.47,5.45,7.44,8.43,8.42,7.42,5.43,4.44,2.45,1.47,0.50,0.53,0.56,0.60,0.64,0.68,0.73,0.78,0.83,0.88,0.94,0.99,1.04,1.10,1.15,1.20,1.25,1.30,1.34,1.39,1.42,1.46,1.49,1.51,1.53,1.55,1.56,1.56,1.56,1.56,1.55,1.54,1.52,1.50,1.47,1.44,1.40,1.37,1.33,1.28,1.24,1.19,1.15,1.10,1.06,1.01,0.97,0.92,0.88,0.84,0.81,0.78,0.75,0.73,1.71,3.69,5.68,7.67,8.67,8.68,7.69,5.70,4.72,2.74,1.77,0.80,0.84,0.88,0.92,0.97,1.01,1.06,1.11,1.17,1.22,1.27,1.32,1.37,1.42,1.47,1.51,1.55,1.59,1.63,1.66,1.68,1.71,1.72,1.74,1.74,1.74,1.74,1.73,1.72,1.70,1.68,1.66,1.63,1.59,1.56,1.51,1.47,1.43,1.38,1.33,1.28,1.23,1.18,1.14,1.09,1.04,1.00,0.96,0.92,0.89,0.86,0.83,0.81,0.79,0.78,0.77,0.77,0.77,0.78,0.79,0.81,0.83,0.85,0.88,0.92,0.95,0.99,1.04,1.08,1.13,1.18,1.23,1.27,1.32,1.37,1.42,1.46,1.51,1.55,1.59,1.62,1.65,1.68,1.70,1.72,1.73,1.74,1.74,1.74,1.74,1.73,1.71,1.69,1.66,1.63,0.15,26.56,51.52,41.48,31.43,21.38,11.33,1.28,-8.77,-18.83,-28.88,-33.93,-36.98,-39.03,-38.07,-37.12,-34.16,-29.19,-19.22,-9.25,0.72,0.70,0.69,0.68,0.67,0.67,0.68,0.69,0.70,0.72,0.75,0.77,0.80,0.84,0.88,0.92,0.96,1.00,1.05,1.09,1.14,1.19,1.23,1.28,1.32,1.36,1.40,1.43,1.46,1.49,1.52,1.53,1.55,1.56,1.56,1.56,1.56,1.55,1.53,1.51,1.49,1.46,1.43,1.39,1.35,1.31,1.26,1.21,1.16,1.11,1.05,1.00,0.94,0.89,0.84,0.79,0.74,0.69,0.64,0.60,0.57,0.53,0.50,0.48,1.46,3.44,5.43,7.42,8.42,8.43,7.43,5.45,4.47,2.49,1.52,0.55,0.58,0.62,0.65,0.70,0.74,0.78,0.83,0.87,0.92,0.96,1.00,1.05,1.08,1.12,1.15,1.18,1.21,1.23,1.25,1.26,1.27,1.27,1.27,1.26,1.25,1.23,1.21,1.19,1.16,1.12,1.08,1.04,1.00,0.95,0.90,0.85,0.79,0.74,0.68,0.63,0.58,0.52,0.47,0.42,0.37,0.33,0.29,0.25,0.22,0.19,0.16,0.14,0.13,0.12,0.11,0.11,0.12,0.13,0.14,0.16,0.18,0.21,0.24,0.28,0.31,0.35,0.40,0.44,0.48,0.53,0.58,0.62,0.67,0.71,0.75,0.79,1.82,3.86,5.89,7.91,8.93,8.95,7.97,5.97,4.98,2.98,1.97,0.96,0.94,0.92,0.89,0.86,0.83,0.79,0.75,0.71,0.66,0.61,0.56,0.51,0.45,0.40,0.35,0.29,0.24,0.19,0.15,0.10,0.06,0.02,-0.02,-0.05,-0.07,-0.10,0.15,24.87,49.87,39.86,29.87,19.87,9.89,-0.10,-10.07,-20.05,-30.02,-34.99,-37.95,-39.91,-38.87,-37.82,-34.78,-29.73,-19.68,-9.63,0.41,0.46,0.51,0.55,0.59,0.63,0.66,0.69,0.72,0.74,0.76,0.78,0.79,0.79,0.79,0.79,0.78,0.76,0.74,0.72,0.69,0.66,0.63,0.59,0.54,0.50,0.45,0.40,0.35,0.30,0.25,0.20,0.15,0.10,0.06,0.01,-0.03,-0.07,-0.10,-0.14,-0.16,-0.19,-0.20,-0.22,-0.23,-0.23,-0.23,-0.22,-0.21,-0.20,-0.17,-0.15,-0.12,-0.09,-0.05,-0.01,0.04,0.08,0.13,0.18,0.23,0.28,0.33,0.38,0.43,0.48,0.52,0.57,0.61,0.64,0.68,0.71,0.73,0.76,0.77,0.78,0.79,0.79,0.79,0.78,0.77,0.75,0.73,0.71,0.68,0.64,0.61,0.57,0.53,0.48,0.44,0.39,0.34,0.29,0.25,0.20,0.16,0.11,0.07,0.03,0.00,-0.03,-0.06,-0.09,-0.11,-0.12,-0.13,0.86,2.86,4.87,6.88,7.89,7.91,6.94,4.97,4.00,2.04,1.08,0.12,0.17,0.22,0.27,0.32,0.37,0.43,0.48,0.53,0.59,0.64,0.68,0.73,0.77,0.81,0.85,0.88,0.91,0.93,0.95,0.96,0.97,0.98,0.98,0.97,0.96,0.94,0.92,0.90,0.87,0.84,0.81,0.77,0.73,0.69,0.64,0.60,0.55,0.51,0.46,0.42,0.37,0.33,0.29,0.26,0.23,0.20,0.17,0.15,0.13,0.12,0.11,0.11,0.12,0.12,0.14,0.15,1.27,1.27,1.26,1.25,1.23,1.21,1.19,0.15,26.13,51.09,41.05,31.01,20.97,10.92,0.88,-9.16,-19.21,-29.25,-34.30,-37.34,-39.38,-38.42,-37.45,-34.48,-29.51,-19.53,-9.55,0.44,0.43,0.42,0.42,0.43,0.44,0.45,0.47,0.50,0.53,0.56,0.60,0.64,0.68,0.73,0.78,0.83,0.88,0.94,0.99,1.04,1.10,1.15,1.20,1.25,1.30,1.34,1.39,1.42,1.46,1.49,1.51,1.53,1.55,1.56,2.56,4.56,6.56,8.55,9.54,9.52,8.50,6.47,5.44,3.40,2.37,1.33,1.28,1.24,1.19,1.15,1.10,1.06,1.01,0.97,0.92,0.88,0.84,0.81,0.78,0.75,0.73,0.71,0.69,0.68,0.67,0.67,0.68,0.69,0.70,0.72,0.74,0.77,0.80,0.84,0.88,0.92,0.97,1.01,1.06,1.11,1.17,1.22,1.27,1.32,1.37,1.42,1.47,1.51,1.55,1.59,2.63,4.66,6.68,8.71,9.72,9.74,8.74,6.74,5.74,3.73,2.72,1.70,1.68,1.66,1.63,1.59,1.56,1.51,1.47,1.43,1.38,1.33,1.28,1.23,1.18,1.14,1.09,1.04,1.00,0.96,0.92,0.89,0.86,0.83,0.81,0.79,0.78,0.77,0.77,0.77,0.78,0.79,0.81,0.83,0.85,0.88,0.92,0.95,0.99,1.04,1.08,1.13,1.18,1.23,1.27,1.32,1.37,1.42,1.46,1.51,1.55,1.59,1.62,1.65,1.68,1.70,1.72,1.73,1.74,1.74,1.74,1.74,1.73,1.71,1.69,1.66,1.63,1.60,1.56,0.15,26.48,51.43,41.38,31.33,21.28,11.23,1.17,-8.88,-18.93,-28.98,-34.03,-37.07,-39.12,-38.16,-37.19,-34.22,-29.25,-19.28,-9.30,0.69,0.68,0.67,0.67,0.68,0.69,0.70,0.72,0.75,0.77,0.80,0.84,0.88,0.92,1.96,4.00,6.05,8.09,9.14,9.19,8.23,6.28,5.32,3.36,2.40,1.43,1.46,1.49,1.52,1.53,1.55,1.56,1.56,1.56,1.56,1.55,1.53,1.51,1.49,1.46,1.43,1.39,1.35,1.31,1.26,1.21,1.16,1.11,1.05,1.00,0.94,0.89,0.84,0.79,0.74,0.69,0.64,0.60,0.57,0.53,0.50,0.48,0.46,0.44,0.43,0.42,0.42,0.43,0.43,0.45,0.47,0.49,0.52,0.55,0.58,0.62,0.65,0.70,0.74,0.78,0.83,0.87,0.92,0.96,1.00,1.05,1.08,1.12,1.15,1.18,1.21,2.23,4.25,6.26,8.27,9.27,9.27,8.26,6.25,5.23,3.21,2.19,1.16,1.12,1.08,1.04,1.00,0.95,0.90,0.85,0.79,0.74,0.68,0.63,0.58,0.52,0.47,0.42,0.37,0.33,0.29,0.25,0.22,0.19,0.16,0.14,0.13,0.12,0.11,0.11,0.12,0.13,0.14,0.16,0.18,0.21,0.24,0.28,0.31,0.35,0.40,0.44,0.48,0.53,0.58,0.62,0.67,0.71,0.75,0.79,0.82,0.86,0.89,0.91,0.93,0.95,0.97,0.97,0.98,0.98,0.97,0.96,0.94,0.92,0.89,0.86,0.83,0.79,0.75,0.71,0.66,0.61,0.56,0.51,0.45,0.15,25.35,50.29,40.24,30.19,20.15,10.10,0.06,-9.98,-20.02,-30.05,-35.07,-38.10,-40.11,-39.13,-38.13,-35.14,-30.13,-20.13,-10.11,-0.10,-0.07,-0.05,-0.02,0.01,0.05,0.09,0.13,0.18,0.22,0.27,0.32,0.37,0.41,0.46,0.51,0.55,0.59,0.63,0.66,0.69,0.72,0.74,0.76,0.78,0.79,0.79,0.79,0.79,0.78,0.76,0.74,0.72,0.69,0.66,0.63,0.59,0.54,0.50,0.45,0.40,0.35,0.30,0.25,0.20,0.15,0.10,0.06,0.01,-0.03,-0.07,-0.10,-0.14,-0.16,-0.19,-0.20,-0.22,0.77,2.77,4.77,6.78,7.79,7.80,6.83,4.85,3.88,1.91,0.95,-0.01,0.04,0.08,0.13,0.18,0.23,0.28,0.33,0.38,0.43,0.48,0.52,0.57,0.61,0.64,0.68,0.71,0.73,0.76,0.77,0.78,0.79,0.79,0.79,0.78,0.77,0.75,0.73,0.71,0.68,0.64,0.61,0.57,0.53,0.48,0.44,0.39,0.34,0.29,0.25,0.20,0.16,0.11,0.07,0.03,0.00,-0.03,-0.06,-0.09,-0.11,-0.12,-0.13,-0.14,-0.14,-0.13,-0.12,-0.11,-0.09,-0.06,-0.03,0.00,0.04,0.08,0.12,0.17,0.22,0.27,0.32,0.37,0.43,0.48,0.53,0.59,0.64,0.68,0.73,0.77,0.81,0.85,0.88,0.91,0.93,0.95,0.96,0.97,0.98,0.98,0.97,0.96,0.94,0.92,0.90,0.87,0.84,0.81,0.77,0.73,0.69,0.64,0.60,0.55,0.51,0.46,0.42,0.37,0.33,0.29,0.26,0.23,0.20,0.17,0.15,0.13,0.12,0.11,0.11,0.12,0.12,0.14,0.15,1.27,1.27,0.15,26.25,51.23,41.21,31.19,21.16,11.13,1.09,-8.95,-18.99,-29.03,-34.08,-37.12,-39.16,-38.21,-37.25,-34.30,-29.34,-19.38,-9.42,0.55,0.52,0.49,0.47,0.45,0.44,0.43,0.42,0.42,0.43,0.44,0.45,0.47,0.50,0.53,0.56,0.60,0.64,0.68,0.73,0.78,0.83,0.88,0.94,0.99,1.04,1.10,1.15,1.20,1.25,1.30,1.34,1.39,1.42,1.46,1.49,1.51,1.53,1.55,1.56,1.56,1.56,2.56,4.55,6.54,8.52,9.50,9.47,8.44,6.40,5.37,3.33,2.28,1.24,1.19,1.15,1.10,1.06,1.01,0.97,0.92,0.88,0.84,0.81,0.78,0.75,0.73,0.71,0.69,0.68,0.67,0.67,0.68,0.69,0.70,0.72,0.74,0.77,0.80,0.84,0.88,0.92,0.97,1.01,1.06,1.11,1.17,1.22,1.27,1.32,1.37,1.42,1.47,1.51,1.55,1.59,1.63,1.66,1.68,1.71,1.72,1.74,1.74,1.74,1.74,1.73,1.72,1.70,1.68,1.66,1.63,1.59,1.56,1.51,1.47,1.43,1.38,1.33,1.28,1.23,1.18,1.14,1.09,1.04,1.00,0.96,0.92,0.89,0.86,0.83,0.81,0.79,0.78,0.77,0.77,0.77,0.78,0.79,0.81,0.83,0.85,0.88,0.92,0.95,0.99,1.04,1.08,1.13,1.18,1.23,1.27,1.32,1.37,1.42,1.46,1.51,1.55,1.59,1.62,1.65,1.68,1.70,1.72,1.73,1.74,1.74,1.74,1.74,1.73,1.71,1.69,1.66,1.63,1.60,1.56,1.52,1.48,1.43,1.38,1.33,1.28,1.23,0.15,26.12,51.07,41.02,30.97,20.93,10.88,0.84,-9.19,-19.22,-29.25,-34.28,-37.30,-39.31,-38.32,-37.33,-34.33,-29.32,-19.31,-9.30,0.72,0.75,0.77,0.80,0.84,0.88,0.92,0.96,1.00,1.05,1.09,1.14,1.19,1.23,1.28,1.32,1.36,1.40,1.43,1.46,1.49,1.52,2.53,4.55,6.56,8.56,9.56,9.56,8.55,6.53,5.51,3.49,2.46,1.43,1.39,1.35,1.31,1.26,1.21,1.16,1.11,1.05,1.00,0.94,0.89,0.84,0.79,0.74,0.69,0.64,0.60,0.57,0.53,0.50,0.48,0.46,0.44,0.43,0.42,0.42,0.43,0.43,0.45,0.47,0.49,0.52,0.55,0.58,0.62,0.65,0.70,0.74,0.78,0.83,0.87,0.92,0.96,1.00,1.05,1.08,2.12,4.15,6.18,8.21,9.23,9.25,8.26,6.27,5.27,3.27,2.26,1.25,1.23,1.21,1.19,1.16,1.12,1.08,1.04,1.00,0.95,0.90,0.85,0.79,0.74,0.68,0.63,0.58,0.52,0.47,0.42,0.37,0.33,0.29,0.25,0.22,0.19,0.16,0.14,0.13,0.12,0.11,0.11,0.12,0.13,0.14,0.16,0.18,0.21,0.24,0.28,0.31,0.35,0.40,0.44,0.48,0.53,0.58,0.62,0.67,0.71,0.75,0.79,0.82,0.86,0.89,0.91,0.93,0.95,0.97,0.97,0.98,0.98,0.97,0.96,0.94,0.92,0.89,0.86,0.83,0.79,0.75,0.71,0.66,0.61,0.56,0.51,0.45,0.40,0.15,25.29,50.24,40.19,30.15,20.10,10.06,0.02,-10.02,-20.05,-30.07,-35.10,-38.11,-40.13,-39.13,-38.14,-35.13,-30.13,-20.11,-10.10,-0.07,-0.05,-0.02,0.01,0.05,0.09,0.13,0.18,1.22,3.27,5.32,7.37,8.41,8.46,7.51,5.55,4.59,2.63,1.66,0.69,0.72,0.74,0.76,0.78,0.79,0.79,0.79,0.79,0.78,0.76,0.74,0.72,0.69,0.66,0.63,1.59,3.54,5.50,7.45,8.4,8.35,7.3,5.25,4.2,2.15,1.10,0.06,0.01,-0.03,-0.07,-0.10,-0.14,-0.16,-0.19,-0.20,-0.22,-0.23,-0.23,-0.23,-0.22,-0.21,-0.20,-0.17,-0.15,-0.12,-0.09,-0.05,-0.01,0.04,0.08,0.13,0.18,0.23,0.28,0.33,0.38,0.43,0.48,0.52,0.57,0.61,0.64,0.68,0.71,0.73,0.76,0.77,0.78,0.79,0.79,0.79,0.78,0.77,0.75,0.73,0.71,0.68,0.64,0.61,0.57,0.53,0.48,0.44,0.39,0.34,0.29,0.25,0.20,0.16,0.11,0.07,0.03,0.00,-0.03,-0.06,-0.09,-0.11,-0.12,-0.13,-0.14,-0.14,-0.13,-0.12,-0.11,-0.09,-0.06,-0.03,0.00,0.04,0.08,0.12,0.17,0.22,0.27,0.32,0.37,0.43,0.48,0.53,0.59,0.64,0.68,0.73,0.77,0.81,0.85,0.88,0.91,0.93,0.95,0.96,0.97,0.98,0.98,0.97,0.96,0.94,0.92,0.90,0.87,0.84,0.81,0.77,0.73,0.69,0.64,0.60,0.55,0.51,0.46,0.42,0.37,0.33,0.29,0.26,0.15,25.20,50.17,40.15,30.13,20.12,10.11,0.11,-9.88,-19.88,-29.86,-34.85,-36.73,-38.73,-37.74,-36.75,-33.77,-28.79,-18.81,-8.84,1.13,1.09,1.05,1.01,0.97,0.92,0.88,0.84,0.79,0.75,0.70,0.66,0.62,0.58,0.55,0.52,0.49,0.47,0.45,0.44,0.43,0.42,0.42,0.43,0.44,0.45,0.47,0.50,0.53,0.56,0.60,0.64,0.68,0.73,0.78,0.83,0.88,0.94,0.99,1.04,1.10,1.15,1.20,1.25,1.30,1.34,1.39,1.42,1.46,1.49,1.51,1.53,1.55,1.56,1.56,1.56,1.56,1.55,1.54,1.52,1.50,1.47,1.44,1.40,1.37,1.33,1.28,1.24,1.19,1.15,1.10,1.06,1.01,0.97,1.92,3.88,5.84,7.81,8.78,8.75,7.73,5.71,4.69,2.68,1.67,0.67,0.68,0.69,0.70,0.72,0.74,0.77,0.80,0.84,0.88,0.92,0.97,1.01,1.06,1.11,1.17,1.22,1.27,1.32,1.37,1.42,1.47,1.51,1.55,1.59,1.63,1.66,1.68,2.71,4.72,6.74,8.74,9.74,9.74,8.73,6.72,5.70,3.68,2.66,1.63,1.59,1.56,1.51,1.47,1.43,1.38,1.33,1.28,1.23,1.18,1.14,1.09,1.04,1.00,0.96,0.92,0.89,0.86,0.83,0.81,0.79,0.78,0.77,0.77,0.77,0.78,0.79,0.81,0.83,0.85,0.88,0.92,0.95,0.99,1.04,1.08,1.13,1.18,1.23,1.27,1.32,1.37,1.42,1.46,1.51,1.55,1.59,1.62,1.65,1.68,1.70,1.72,1.73,1.74,1.74,1.74,1.74,1.73,1.71,1.69,1.66,1.63,1.60,1.56,1.52,0.15,26.43,51.38,41.33,31.28,21.23,11.17,1.12,-8.93,-18.98,-29.03,-34.07,-37.12,-39.16,-38.19,-37.22,-34.25,-29.28,-19.30,-9.31,0.68,0.67,0.67,0.68,0.69,0.70,0.72,0.75,0.77,0.80,0.84,0.88,0.92,0.96,1.00,1.05,1.09,1.14,1.19,1.23,1.28,1.32,1.36,1.40,1.43,1.46,1.49,1.52,1.53,1.55,1.56,1.56,1.56,1.56,1.55,1.53,1.51,1.49,1.46,2.43,4.39,6.35,8.31,9.26,9.21,8.16,6.11,5.05,3.00,1.94,0.89,0.84,0.79,0.74,0.69,0.64,0.60,0.57,0.53,0.50,0.48,0.46,0.44,0.43,0.42,0.42,0.43,0.43,0.45,0.47,0.49,0.52,0.55,0.58,0.62,0.65,0.70,0.74,0.78,0.83,0.87,0.92,0.96,1.00,1.05,1.08,1.12,1.15,1.18,1.21,1.23,1.25,1.26,1.27,1.27,1.27,1.26,1.25,1.23,1.21,1.19,1.16,1.12,2.08,4.04,6.00,7.95,8.90,8.85,7.79,5.74,4.68,2.63,1.58,0.52,0.47,0.42,0.37,0.33,0.29,0.25,0.22,0.19,0.16,0.14,0.13,0.12,0.11,0.11,0.12,0.13,0.14,0.16,0.18,0.21,0.24,0.28,0.31,0.35,0.40,0.44,0.48,0.53,0.58,0.62,0.67,0.71,0.75,0.79,0.82,0.86,0.89,0.91,0.93,0.95,0.97,0.97,0.98,0.98,0.97,0.96,0.94,0.92,0.89,0.86,0.83,0.79,0.75,0.71,0.66,0.61,0.56,0.51,0.45,0.40,0.35,0.29,0.24,0.19,0.15,0.10,0.06,0.15,24.98,49.95,39.93,29.90,19.89,9.87,-0.13,-10.14,-20.13,-30.13,-35.11,-38.10,-40.07,-39.05,-38.02,-34.99,-29.95,-19.91,-9.87,0.18,0.22,0.27,0.32,0.37,0.41,0.46,0.51,0.55,0.59,0.63,0.66,0.69,0.72,0.74,0.76,0.78,0.79,1.79,3.79,5.79,7.78,8.76,8.74,7.72,5.69,4.66,2.63,1.59,0.54,0.50,0.45,0.40,0.35,0.30,0.25,0.20,0.15,0.10,0.06,0.01,-0.03,-0.07,-0.10,-0.14,-0.16,-0.19,-0.20,-0.22,-0.23,-0.23,-0.23,-0.22,-0.21,-0.20,-0.17,-0.15,-0.12,-0.09,-0.05,-0.01,0.04,0.08,0.13,0.18,0.23,0.28,0.33,0.38,0.43,0.48,0.52,0.57,0.61,0.64,0.68,0.71,0.73,0.76,0.77,0.78,1.79,3.79,5.79,7.78,8.77,8.75,7.73,5.71,4.68,2.64,1.61,0.57,0.53,0.48,0.44,0.39,0.34,0.29,0.25,0.20,0.16,0.11,0.07,0.03,0.00,-0.03,-0.06,-0.09,-0.11,-0.12,-0.13,-0.14,-0.14,-0.13,-0.12,-0.11,-0.09,-0.06,-0.03,0.00,0.04,0.08,0.12,0.17,0.22,0.27,0.32,0.37,0.43,0.48,0.53,0.59,0.64,0.68,0.73,0.77,0.81,0.85,0.88,0.91,1.93,3.95,5.96,7.97,8.98,8.98,7.97,5.96,4.94,2.92,1.90,0.87,0.84,0.81,0.77,0.73,0.69,0.64,0.60,0.55,0.51,0.46,0.42,0.37,0.33,0.29,0.15,25.23,50.20,40.17,30.15,20.13,10.12,0.11,-9.89,-19.88,-29.88,-34.86,-37.85,-38.73,-37.73,-36.74,-33.75,-28.77,-18.79,-8.81,1.16,1.13,1.09,1.05,1.01,0.97,0.92,0.88,0.84,0.79,0.75,0.70,0.66,0.62,0.58,0.55,0.52,0.49,0.47,0.45,0.44,0.43,0.42,0.42,0.43,0.44,0.45,0.47,0.50,0.53,0.56,1.60,3.64,5.68,7.73,8.78,8.83,7.88,5.94,4.99,3.04,2.10,1.15,1.20,1.25,1.30,1.34,1.39,1.42,1.46,1.49,1.51,1.53,1.55,1.56,1.56,1.56,1.56,1.55,1.54,1.52,1.50,1.47,1.44,1.40,1.37,1.33,1.28,1.24,1.19,1.15,1.10,1.06,1.01,0.97,0.92,0.88,0.84,0.81,0.78,0.75,0.73,0.71,0.69,0.68,0.67,1.67,3.68,5.69,7.70,8.72,8.74,7.77,5.80,4.84,2.88,1.92,0.97,1.01,1.06,1.11,1.17,1.22,1.27,1.32,1.37,1.42,1.47,1.51,1.55,1.59,1.63,1.66,1.68,1.71,1.72,1.74,1.74,1.74,1.74,1.73,1.72,1.70,1.68,1.66,1.63,1.59,1.56,1.51,1.47,1.43,1.38,1.33,1.28,1.23,1.18,1.14,1.09,1.04,1.00,0.96,0.92,0.89,0.86,0.83,0.81,0.79,0.78,0.77,0.77,0.77,0.78,0.79,0.81,0.83,0.85,0.88,0.92,0.95,0.99,1.04,1.08,1.13,1.18,1.23,1.27,1.32,1.37,1.42,1.46,1.51,1.55,1.59,1.62,1.65,0.15,26.70,51.72,41.73,31.74,21.74,11.74,1.74,-8.27,-18.29,-28.31,-33.34,-36.37,-38.40,-37.44,-36.48,-33.52,-28.57,-18.62,-8.67,1.28,1.23,1.17,1.12,1.07,1.02,0.97,0.93,0.88,0.84,0.81,0.78,0.75,0.72,0.70,0.69,0.68,0.67,0.67,0.68,1.69,3.70,5.72,7.75,8.77,8.80,7.84,5.88,4.92,2.96,2.00,1.05,1.09,1.14,1.19,1.23,1.28,1.32,1.36,1.40,1.43,1.46,1.49,1.52,1.53,1.55,1.56,1.56,1.56,1.56,1.55,1.53,1.51,1.49,1.46,1.43,1.39,1.35,1.31,1.26,1.21,1.16,1.11,1.05,1.00,0.94,0.89,0.84,0.79,0.74,0.69,0.64,0.60,0.57,0.53,0.50,0.48,1.46,3.44,5.43,7.42,8.42,8.43,7.43,5.45,4.47,2.49,1.52,0.55,0.58,0.62,0.65,0.70,0.74,0.78,0.83,0.87,0.92,0.96,1.00,1.05,1.08,1.12,1.15,1.18,1.21,1.23,1.25,1.26,1.27,1.27,1.27,1.26,1.25,1.23,1.21,1.19,1.16,1.12,1.08,1.04,1.00,0.95,0.90,0.85,0.79,0.74,0.68,0.63,0.58,0.52,0.47,0.42,0.37,0.33,0.29,0.25,0.22,0.19,0.16,0.14,0.13,0.12,0.11,0.11,0.12,0.13,0.14,0.16,0.18,0.21,0.24,0.28,0.31,0.35,0.40,0.44,0.48,0.53,0.58,0.62,0.67,0.71,0.75,0.79,0.82,0.86,0.89,0.91,0.93,0.95,1.97,3.97,5.98,7.98,8.97,8.96,7.94,5.92,4.89,2.86,1.83,0.79,0.75,0.71,0.66,0.61,0.56,0.51,0.45,0.15,25.35,50.29,40.24,30.19,20.15,10.10,0.06,-9.98,-20.02,-30.05,-35.07,-38.10,-40.11,-39.13,-38.13,-35.14,-30.13,-20.13,-10.11,-0.10,-0.07,-0.05,-0.02,0.01,0.05,0.09,0.13,0.18,0.22,0.27,0.32,0.37,0.41,0.46,0.51,0.55,0.59,1.63,3.66,5.69,7.72,8.74,8.76,7.78,5.79,4.79,2.79,1.79,0.78,0.76,0.74,0.72,0.69,0.66,0.63,0.59,0.54,0.50,0.45,0.40,0.35,0.30,0.25,0.20,0.15,0.10,0.06,0.01,-0.03,-0.07,-0.10,-0.14,-0.16,-0.19,-0.20,-0.22,-0.23,-0.23,-0.23,-0.22,-0.21,-0.20,-0.17,-0.15,-0.12,-0.09,-0.05,-0.01,0.04,0.08,0.13,0.18,0.23,0.28,0.33,0.38,0.43,1.48,3.52,5.57,7.61,8.64,8.68,7.71,5.73,4.76,2.77,1.78,0.79,0.79,0.79,0.78,0.77,0.75,0.73,0.71,0.68,0.64,0.61,0.57,0.53,0.48,0.44,0.39,0.34,0.29,0.25,0.20,0.16,0.11,0.07,0.03,0.00,-0.03,-0.06,-0.09,-0.11,-0.12,-0.13,-0.14,-0.14,-0.13,-0.12,-0.11,-0.09,-0.06,-0.03,0.00,0.04,0.08,0.12,0.17,0.22,0.27,0.32,0.37,0.43,0.48,0.53,0.59,0.64,0.68,0.73,0.77,0.81,0.85,0.88,0.91,0.93,0.95,0.96,0.97,0.98,0.98,0.97,0.96,0.94,0.92,0.90,0.87,0.84,0.81,0.77,0.73,0.69,0.64,0.60,1.55,3.51,5.46,7.42,8.37,8.33,7.29,5.26,4.23,2.20,1.17,0.15,0.13,0.12,0.11,0.11,0.12,0.12,0.14,0.15];


var AtrialPacedSuccess=[0,0,20,1,0,0,1,2,2,1,0];
var VentriclePacedSuccess=[0,0,20,2,1,0,-1,-2,-3,-15,-30,-45,-50,-45,-30,-20,-15,-5,0,1,2,3,4,5,10,16,20,22,23,23,22,20,15,10,5,4,3,2,1,0];
var PaceFail=[0,20,1,0]

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
    
    if (PaceRateCountDown > 0 && Ao>At) { 
    /*  IM UP TO HERE*/


    };/* and */

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
    if (opx > w) { px = opx = -speed; };/* and */

     
    PaceRateCountDown=PaceRateCountDown-1;
  

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


