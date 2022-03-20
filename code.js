
            
            var EcgData=[ "421.48,433.90,722.66,1043.59,1602.85,2277.06,2803.77,3466.47,4190.46,4859.54,5510.96,6334.97,6868.96,7608.16,8201.84,8870.40,9576.71,10283.03,10777.08,11313.14,11747.72,12181.45,12761.80,13366.61,14036.89,14752.20,15259.63,15827.27,16324.09,16749.28,17491.49,18300.37,18881.60,19754.37,20687.17,21259.19,21903.12,22522.29,22933.91,23293.82,23626.17,23926.67,24241.28,24535.98,24779.63,25032.95,25343.69,25682.77,25993.19,26307.40,26574.13,26820.85,26976.95,27057.98,27093.86,27100.17,27033.40,26887.93,26766.41,26686.11,26492.65,26272.21,26072.40,25806.00,25472.52,25222.99,24854.31,24511.27,24215.32,23837.58,23457.27,23205.42,22960.60,22618.68,22375.59,22095.93,21758.21,21434.15,21092.50,20795.57,20561.33,20369.85,20115.45,19975.72,19791.27,19576.36,19379.69,19234.13,19067.68,18917.81,18762.09,18610.39,18498.25,18434.09,18404.00,18474.79,18596.25,18713.42,18821.52,18915.99,18990.01,19051.12,19124.17,19215.17,19313.36,19405.25,19482.63,19520.79,19493.82,19431.62,19332.64,19194.15,19133.50,18967.57,18783.12,18597.52,18416.04,18141.61,17982.41,17805.41,17577.12,17306.09,16910.35,16560.65,16200.17,15873.39,15597.10,15424.10,15178.92,14947.10,14723.13,14486.82,14272.76,14084.03,13915.20,13750.64,13592.61,13413.72,13186.31,12966.53,12667.54,12333.07,11979.98,11674.06,11374.35,11126.10,10898.10,10714.75,10528.07,10305.28,10069.73,9872.75,9681.54,9485.82,9417.35,9239.29,9043.43,8811.02,8586.08,8270.00,8107.74,7924.61,7740.89,7549.21,7348.19,7162.15,7065.00,6864.31,6673.59,6469.65,6257.70,5998.13,5884.98,5751.07,5575.69,5407.07,5141.63,4875.12,4641.96,4468.27,4281.98,4175.90,4074.12,3982.30,3935.55,3801.42,3673.56,3529.49,3373.14,3188.69,3103.23,3014.08,2936.01,2856.27,2748.30,2603.49,2424.98,2240.53,2058.23,1890.24,1758.21,1661.47,1571.00,1485.03,1410.07,1333.64,147.00,132.00,129.00,125.00"
];
            var ecg_canvas = document.getElementById("ecg");/*SPECIFIC*/ 
            var ecg_ctx = ecg.getContext("2d");/*SPECIFIC*/ 
            var ecg_w = ecg.width,/*GENERIC*/ 
            ecg_h = ecg.height,/*SPECIFIC*/ 
            speed = 1,/*GENERIC*/ 
            scanBarWidth = 20,/*GENERIC*/ 
            ecg_i=0,/*GENERIC*/ 
            ecg_data = EcgData[0].split(','),/*SPECIFIC*/ 
            ecg_color='#00ff00';/*SPECIFIC*/ 
            var ecg_px = 0;/*GENERIC*/ 
            var ecg_opx = 0;/*GENERIC*/ 
            var ecg_py = ecg_h/2; /* should equal 50 if height 100px */ /*SPECIFIC*/ 
            var ecg_opy = ecg_py; /* should equal 50 if height 100px */ /*SPECIFIC*/ 
            ecg_ctx.strokeStyle = ecg_color;
            ecg_ctx.lineWidth = 3;/*SPECIFIC*/ 
            ecg_ctx.setTransform(1,0,0,-1,0,ecg_h);/*SPECIFIC*/ 

  var spo2_canvas = document.getElementById("spo2");
            var spo2_ctx = spo2.getContext("2d");
            var spo2_w = spo2.width,
            spo2_h = spo2.height,
            spo2_i=0,
            spo2_data = Spo2Data[0].split(','),
            spo2_color='#00ff00';
            var spo2_px = 0;
            var spo2_opx = 0;
            var spo2_py = spo2_h/2; /* should equal 50 if height 100px */ 
            var spo2_opy = spo2_py; /* should equal 50 if height 100px */ 
            spo2_ctx.strokeStyle = spo2_color;
            spo2_ctx.lineWidth = 3;
            spo2_ctx.setTransform(1,0,0,-1,0,spo2_h);
  var iabp_canvas = document.getElementById("iabp");
            var iabp_ctx = iabp.getContext("2d");
            var iabp_w = iabp.width,
            iabp_h = iabp.height,
            iabp_i=0,
            iabp_data = IabpData[0].split(','),
            iabp_color='#00ff00';
            var iabp_px = 0;
            var iabp_opx = 0;
            var iabp_py = iabp_h/2; /* should equal 50 if height 100px */ 
            var iabp_opy = iabp_py; /* should equal 50 if height 100px */ 
            iabp_ctx.strokeStyle = iabp_color;
            iabp_ctx.lineWidth = 3;
            iabp_ctx.setTransform(1,0,0,-1,0,iabp_h);
   var cvp_canvas = document.getElementById("cvp");
            var cvp_ctx = cvp.getContext("2d");
            var cvp_w = cvp.width,
            cvp_h = cvp.height,
            cvp_i=0,
            cvp_data = CvpData[0].split(','),
            cvp_color='#00ff00';
            var cvp_px = 0;
            var cvp_opx = 0;
            var cvp_py = cvp_h/2; /* should equal 50 if height 100px */ 
            var cvp_opy = cvp_py; /* should equal 50 if height 100px */ 
            cvp_ctx.strokeStyle = cvp_color;
            cvp_ctx.lineWidth = 3;
            cvp_ctx.setTransform(1,0,0,-1,0,cvp_h);
 
var co2_canvas = document.getElementById("co2");
            var co2_ctx = co2.getContext("2d");
            var co2_w = co2.width,
            co2_h = co2.height,
            co2_i=0,
            co2_data = Co2Data[0].split(','),
            co2_color='#00ff00';
            var co2_px = 0;
            var co2_opx = 0;
            var co2_py = co2_h/2; /* should equal 50 if height 100px */ 
            var co2_opy = co2_py; /* should equal 50 if height 100px */ 
            co2_ctx.strokeStyle = co2_color;
            co2_ctx.lineWidth = 3;
            co2_ctx.setTransform(1,0,0,-1,0,co2_h);


         
            drawWave();

            function drawWave() {
               px += speed;  /* adds the value to the right to the variable on the left px(0)+speed (1)=0 */ /*GENERIC*/ 
                    ctx.clearRect( px,0, scanBarWidth, h);/* (x coord of upper left, y coord of upper left, width in px, heigh in px) */ /*SPECIFIC*/ 
                    ctx.beginPath();/* starts the line OR resets */ /*SPECIFIC*/ 
                    ctx.moveTo( opx,  opy);/* moves point to XY */ /*SPECIFIC*/ 
                    ctx.lineJoin= 'round';/* rounds the join */ /*SPECIFIC*/ 
                    py=(data[++i>=data.length? i=0 : i++]/450+30); /*SPECIFIC*/ 
                    ctx.lineTo(px, py);/* and */ 
                    ctx.stroke();/* and */ 
                     opx = px;/* and */ 
                    opy = py;/* and */ 
                    if (opx > w) {px = opx = -speed;}/* and */ 


                     requestAnimationFrame(drawWave);/* and */ 
            }

