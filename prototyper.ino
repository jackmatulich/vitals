#include <AFMotor.h>

AF_DCMotor motor(1, MOTOR12_64KHZ); // create motor #2, 64KHz pwm
AF_DCMotor solenoid(2, MOTOR12_64KHZ);

const int potPin1 = A1;
const int potPin2 = A2; 
const int potPin3 = A3; 
const int potPin4 = A4;  

int RateValue;
int SpeedValue;
int HoldValue;
int NotchValue;

int RR;


int Rate;
int Speed;
int Hold;
int Notch;
int EndPause;

void setup() {
  Serial.begin(9600);           // set up Serial library at 9600 bps

pinMode(potPin1,INPUT);
pinMode(potPin2,INPUT);
pinMode(potPin3,INPUT);
pinMode(potPin4,INPUT);

}

void loop() {

RateValue=analogRead(A1);
SpeedValue=analogRead(A2);
HoldValue=analogRead(A3);
NotchValue=analogRead(A4);




Rate=map(RateValue,0,1024,0,250);
RR=map(RateValue,0,1024,3000,0);
Speed=map(SpeedValue,0,1024,0,255);
Hold=(map(HoldValue,0,1024,0,200)/100)*RR;
Notch=(RR-Hold)*(map(NotchValue,0,1024,0,100)/100);
EndPause=RR-Hold-Notch-250;

motor.setSpeed(Speed); 
motor.run(FORWARD);      // turn it on going forward
delay(Hold);
motor.run(RELEASE); 
Delay(Notch);
motor.setSpeed(255); 
motor.run(FORWARD); 
Delay(250);
motor.run(RELEASE); 
delay(EndPause);
}