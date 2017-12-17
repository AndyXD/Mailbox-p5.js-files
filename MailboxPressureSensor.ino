/* 
   Mail detector
   By Andy Boydston, 12/4/17
   
   This is a simple program that writes a pressure signal out via an Xbee. It is read by a corresponding 
   program that takes in those readings and performs various behaviors (mainly checking if mail was delivered
   or emptied). 
*/

// Library for using Xbee
#include <SoftwareSerial.h>

// this connects your program to your XBee module
// you must use pin 2 for TX and pin 3 for RX
// the XBee must be set to 9600 baud
 SoftwareSerial xbee(2, 3);

void setup() {
  xbee.begin(9600);
}

void loop() {
  int sensor = analogRead(A0); // pressure reading
  xbee.println(sensor); // sends pressure reading via xbee
  delay(800); // delays the amount of data being sent (play around with this to find optimal mail detection in other program). 
}


