
var units=1;
var mls=Math.floor(units*17.85714);
var red=Math.floor(units*17.85714);
var green=Math.floor(units*5.357143);
var water=Math.floor(units*217.85714);
var dettol=Math.floor(units*8.928571);
var xantham=units;






function minus() {


 units=units-1;
 mls=Math.floor(units*17.85714);
 red=Math.floor(units*17.85714);
 green=Math.floor(units*5.357143);
 water=Math.floor(units*217.85714);
 dettol=Math.floor(units*8.928571);
 xantham=units;

    document.getElementById("units").innerHTML = units;
    document.getElementById("mls").innerHTML = mls;
    document.getElementById("red").innerHTML = red;
    document.getElementById("green").innerHTML = green;
    document.getElementById("water").innerHTML = water;
    document.getElementById("dettol").innerHTML = dettol;
    document.getElementById("xanthan").innerHTML = xantham;


    
  }

  function plus() {


    units=units+1;
    mls=Math.floor(units*17.85714);
    red=Math.floor(units*17.85714);
    green=Math.floor(units*5.357143);
    water=Math.floor(units*217.85714);
    dettol=Math.floor(units*8.928571);
    xantham=units;
   
       document.getElementById("units").innerHTML = units;
       document.getElementById("mls").innerHTML = mls;
       document.getElementById("red").innerHTML = red;
       document.getElementById("green").innerHTML = green;
       document.getElementById("water").innerHTML = water;
       document.getElementById("dettol").innerHTML = dettol;
       document.getElementById("xanthan").innerHTML = xantham;
   
   
       
     }




