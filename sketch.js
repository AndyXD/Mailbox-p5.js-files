/*
Andrew Boydston 12/3/2017 - Smart Mail

This program detects when an envelope lands in a mailbox. It will display the
# of deliveries and the date and time the mail was delivered.

How it works: 
A pressure sensor connected to an arduino sends pressure data wirelessesly (via Xbee) 
to p5.js serial library. 

Serial Library created by Shawn Van Every, with contributions from Jen Kagan and Tom Igoe.
Snippets of code borrowed from "Serial read and animate example":
https://github.com/vanevery/p5.serialport/tree/master/examples/readAndAnimate
*/

const CANVAS_WIDTH = 1300;
const CANVAS_HEIGHT = 800;

// coordinates for objects to be somewhat centered
const X1 = CANVAS_WIDTH / 2;
const Y1 = CANVAS_HEIGHT / 5;

// display settings
const BOARD_X_ORIGIN = CANVAS_WIDTH / 2.5;
const BOARD_Y_ORIGIN = 100;
const ELEMENT_WIDTH = 200;
const ELEMENT_HEIGHT = 50;
const TEXT_STROKE = 1;
const TEXT_SIZE = ELEMENT_HEIGHT / 2;
const TABLE_Y_AXIS = 400; // how far table is from mailbox

// mailbox configurations
const MW = 75; // mailbox width
const MH = 220; // mailbox height
const MSIDEH = 40; // controls angel of the 3d box and how much 3d width shows
const SPACEM = 100; // where the top part of the box will be placed
const XSPACE = -10; // controls  where the box will be placed on the x-axis

var serial; // Declare a "SerialPort" object
var portName = "/dev/cu.usbserial-AL00FSTQ"; // fill in the name of your serial port here:

var mailAnimation = false; // determine when to run mail animation
var lw = 55; // the letter width (animation)
var lh = 100; // the letter height (animation)
var yspace = -100; // how far the letter is from the mail box
var mailArray = []; // storing the mail #, time, date

// because the sensor is finiky, these are extra checks to make it perform more consistent
var runFirstTime = true; // run only when starting (used for initializing oldPressure);
var oldPressure = 0; // used to compare new data vs old data
var countCheck = -1; // used to figure out how much data has come in
var checkMail = false; // an extra check to determine if mail is delivered
var reset = false; // an extra check to reset the mail 

function preload() {
  soundFormats('mp3', 'ogg'); // from p5.sound.js library
  mySound = loadSound('youGotmail.mp3'); // for when mail is detected
  myFont = loadFont('OpenSans-Regular.ttf'); // font
}


function setup() {
  createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);

  // custom font
  textFont(myFont);

  // make an instance of the SerialPort object
  serial = new p5.SerialPort();

  // Get a list the ports available
  // You should have a callback defined to see the results. See gotList, below:
  serial.list();

  // Assuming our Arduino is connected,  open the connection to it
  serial.open(portName);

  // When you get a list of serial ports that are available
  serial.on('list', gotList);

  // When you some data from the serial port
  serial.on('data', gotData);
}


// Got the list of ports
function gotList(thelist) {
  println("List of Serial Ports:");
  // theList is an array of their names
  for (var i = 0; i < thelist.length; i++) {
    // Display in the console
    println(i + " " + thelist[i]);
  }
}

// Called when there is data available from the serial port
function gotData() {

  var pressure = serial.readLine(); // read the incoming data
  
  trim(pressure); // trim off trailing whitespace
  if (!pressure) return; // if the incoming string is empty, do no more
  
  // runs only once on initiation
  if (runFirstTime) {
    oldPressure = pressure; // Intialize oldPressure so it can be used in subsequent runs
    runFirstTime = false; 
  }
  
  countCheck++; // running count of cycles
  console.log(pressure);
  
  // First check for mail being dropped in : must pass threshold below 430, and also there must be
  // a difference between oldPressure and new pressure that is > 40. 
  if ((pressure < 430) && (oldPressure - pressure) > 40) {
    checkMail = true;
    reset = false;
    countCheck = 0;
  }

  // Final check for mail being dropped in, sensor has calmed down and there's less than a 15 difference
  if (checkMail && abs(pressure - oldPressure) < 15) {
    addMail(); // used for updating mail info and animation
    print("Mail has been added"); // console debugging
    checkMail = false;
    reset = false;
    countCheck = 0;
  }

  // First check for no mail (resetting the box to 0) : must pass threshold above 400, and also there 
  // must be a difference between pressurea and old pressure that is > 30.
  if ((pressure > 400) && (pressure - oldPressure) > 30) {
    reset = true;
    checkMail = false;
    countCheck = -1; // needs 1 extra cycle for oldPressure to be updated and accurate
  }

  // Second check for no mail (resetting the box to 0); 
  if (reset && abs(pressure - oldPressure) < 30) {
		resetMail();
    print("I'm resetting"); // console debugging
    reset = false;
    checkMail = false;
    countCheck = 0;
  }

  // Counts the cycle of data reads (used to see if subsequent pressure is normal or not);
  if (countCheck > 2) {
    reset = false;
    checkMail = false;
    countCheck = 0;
  }
  
  // consle dubugging
  print("reset : " + reset);
  print("mail : " + checkMail);

  oldPressure = pressure;
}


// mimicking functionality with the keyboard if you don't have the
// equipment or if bug testing
function keyTyped() {

  // this function is called by the system whenever a key is typed
  var theKey = key;
  
  // PRESS 'a' to add mail
  if (theKey == 'a') {
		addMail();
  } 
  
  // PRESS 'r' to reset mail
  if (theKey == 'r') {
		resetMail();
  }
}


// resets the mail
function resetMail() {
  mailArray = new Array(); // resets the mailArray;
}


// when mail is detected
function addMail() {
  mailAnimation = true;
  mySound.play(); // plays "you got mail"
  
  // getting the time
  var d = day();
  var m = month();
  var y = year();
  var h = hour();
  var mi = minute();

  // formatting the minutes
  if (mi < 10) {
    mi = "0" + mi;
  }

  // formatting the date and time 
  var dateStamp = (m + "/" + d + "/" + y);
  var timeStamp = (h + ":" + mi);

  // adding to the mailArray 
  append(mailArray, [dateStamp, timeStamp])
}

function draw() {
  background("#EDEDED");
  strokeWeight(0.4);

   // top face of mail box
  fill('#C7B09D');
  quad(X1 - MW - MW / 2 + XSPACE, Y1 + SPACEM - MSIDEH, X1 + MW / 2 + XSPACE, 
       Y1 + SPACEM - MSIDEH, X1 + MW + XSPACE, Y1 + SPACEM, X1 - MW + XSPACE, Y1 + SPACEM)

  // letter animation (letter goes down until it hits box, then the the top of the letter shrinks
  // making it seem like the letter is dissapearing). 
  if (mailAnimation) {
    if (Y1 + yspace + lh <= Y1 + SPACEM - MSIDEH + 1 / 4 * MSIDEH) {
      yspace = yspace + 3;
    }

    if (lh > 0 && !(Y1 + yspace + lh <= Y1 + SPACEM - MSIDEH + 1 / 4 * MSIDEH)) {
      lh = lh - 3;
    }
    
    // letter body
    fill('white');
    rect(X1 - MW - MW / 2 + XSPACE + 2 / 4 * MW + 1/2*((X1 + MW / 2 + XSPACE - 1 / 4 * MW) - 
    (X1 - MW - MW / 2 + XSPACE + 2 / 4 * MW)) -1/2*lw, 
    Y1 + yspace, lw, lh);
      
    // postage stamp
    fill('#CF847B');
    rect(X1 - MW - MW / 2 + XSPACE + 2 / 4 * MW + 1/2*((X1 + MW / 2 + XSPACE - 1 / 4 * MW) - 
    (X1 - MW - MW / 2 + XSPACE + 2 / 4 * MW)) + 1/5*lw, 
    Y1 + yspace + lh / 9, lw / 4, lh / 6);
  }

  // reset letter animation and variables
  if (lh <= 0) {
    mailAnimation = false;
    lw = 55;
    lh = 100;
    yspace = -100;
  }

  
  // Rest of the Mail Box
  
  // top box hole
  fill('#7A7676');
  quad(X1 - MW - MW / 2 + XSPACE + 2 / 4 * MW, 
       Y1 + SPACEM - MSIDEH + 1 / 4 * MSIDEH, X1 + MW / 2 + XSPACE - 1 / 4 * MW, 
       Y1 + SPACEM - MSIDEH + 1 / 4 * MSIDEH, X1 + MW + XSPACE - 2 / 4 * MW, 
       Y1 + SPACEM - 1 / 4 * MSIDEH, X1 - MW + XSPACE + 1 / 4 * MW, Y1 + SPACEM - 1 / 4 * MSIDEH);
  
  // side face
  fill('#A89585');
  quad(X1 - MW - MW / 2 + XSPACE, Y1 + SPACEM - MSIDEH, 
       X1 - MW + XSPACE, Y1 + SPACEM, X1 - MW + XSPACE, Y1 + MH + SPACEM, 
       X1 - MW - MW / 2 + XSPACE, Y1 + SPACEM + MH - MSIDEH);
  
  // front face
  fill('#C7B09D');
  quad(X1 - MW + XSPACE, Y1 + SPACEM, X1 + MW + XSPACE, Y1 + SPACEM, X1 + MW + XSPACE, 
       Y1 + MH + SPACEM, X1 - MW + XSPACE, Y1 + MH + SPACEM);

  // number of mail text
  fill('#EDEDED');
  textSize(70);
  textAlign(CENTER, CENTER);
  text(mailArray.length, X1 - MW + XSPACE + MW, Y1 + SPACEM + 1 / 3 * MH);

  // number of deliveries text
  textSize(15);
  text("# of deliveries", X1 - MW + XSPACE + MW, Y1 + SPACEM + 1 / 3 * MH + 1 / 3 * MH);
  
  // draws the table of mail information
  drawTable(mailArray, BOARD_X_ORIGIN, Y1, ELEMENT_WIDTH, ELEMENT_HEIGHT);
}

function drawTable(array, xOrigin, yOrigin, elementWidth, elementHeight) {
  textAlign(CENTER, CENTER);
  textSize(TEXT_SIZE);
  strokeWeight(TEXT_STROKE);
  
  // table labels
  fill('#7A7676');
  text("Delivery #", xOrigin + elementWidth / 2 - elementWidth, Y1 - elementHeight / 2 + TABLE_Y_AXIS);
  text("Date", xOrigin + elementWidth / 2, Y1 - elementHeight / 2 + TABLE_Y_AXIS);
  text("Time", xOrigin + elementWidth / 2 + elementWidth, Y1 - elementHeight / 2 + TABLE_Y_AXIS);
  
  // draws the table
  for (i = 0; i < mailArray.length; i++) {
    // boxes around the array elements
    fill("#EDEDED");
    rect(xOrigin - elementWidth, Y1 + elementHeight * i + TABLE_Y_AXIS, elementWidth, elementHeight);
    rect(xOrigin, Y1 + elementHeight * i + TABLE_Y_AXIS, elementWidth, elementHeight);
    rect(xOrigin + elementWidth, Y1 + elementHeight * i + TABLE_Y_AXIS, elementWidth, elementHeight);
    // Array Indices
    fill('#7A7676');
    text(i + 1, xOrigin - elementWidth / 2, Y1 + elementHeight * i + elementHeight / 2 + TABLE_Y_AXIS);
    // Array Contents
    text(array[i][0], xOrigin + elementWidth / 2, Y1 + elementHeight * i + elementHeight / 2 + TABLE_Y_AXIS);
    text(array[i][1], xOrigin + elementWidth / 2 + elementWidth, Y1 + elementHeight * i + elementHeight / 2 + TABLE_Y_AXIS);
  }
}