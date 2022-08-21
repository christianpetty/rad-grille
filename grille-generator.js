// Add event listener for "submit" to handle them differently
document.getElementById("inputsForm").addEventListener('submit', handleForm);

// Initialize canvas
var plot = document.getElementById("plot");
var context = plot.getContext("2d");
context.translate(0.5, 0.5); // Correct some blurriness
var origin = {x: plot.width / 2, y: plot.height / 2}; // Set origin to the center of the square
  
// Define global variables
var holeDiameter;
var outerDiameter;
var initialPhase;
var phaseShift;
var colorPhaseShift;
var precision = 3;

// Set an input as a fixed float
function toFixedFloat(val) {
    return parseFloat(val).toFixed(precision);
  }
    
// Hole class
class Hole {
  constructor(n, dia, r, phi, x, y) {
    this.n = n;
    this.dia = dia;
    this.r = r;
    this.phi = phi; // Radians
    this.x = x;
    this.y = y;
  }
  phiDeg() {
    return this.phi * 180 / Math.PI;
  }
} 

// Circle functions
function Circle(params) {
  this.x = params.x || 0;
  this.y = params.y || 0;
  this.d = params.d || 0;
  this.fillStyle = params.fillStyle || "transparent";
  this.strokeStyle = params.strokeStyle || "#000000";
  this.lineWidth = params.lineWidth || 0;
  
}

Circle.prototype.draw = function () {
  if (this.fillStyle) {
    context.fillStyle = this.fillStyle;
    context.beginPath();
    context.arc(this.x, this.y, this.d / 2, 0, 2 * Math.PI);
    context.fill();
    }
  if (this.strokeStyle && this.lineWidth) {
    context.strokeStyle = this.strokeStyle;
    context.lineWidth = this.lineWidth;
    context.beginPath();
    context.arc(this.x, this.y, this.d / 2, 0, 2 * Math.PI);
    context.stroke();
  }
}

// Pattern class
class Pattern {
  constructor(d, D, phi_i, phi_shift) {
    this.d = d;
    this.D = D;
    this.phi_i = phi_i;
    this.phi_shift = phi_shift;
    this.holes = this.generateHoles();
    this.area = this.calcArea(this.holes.length, this.d);
    this.areaP = this.area / (Math.PI / 4 * this.D**2) * 100;
    this.n = this.holes.length;
  }
  generateHoles() {
    let holes = [];
    holes[0] = new Hole(1, this.d, 0.0, 0.0, 0.0, 0.0);
    let n = 1;
    let phi_n = this.phi_i;
    let rings = Math.floor((this.D - this.d) / (3 * this.d)); // Number of rings
    for (let i = 1; i <= rings; i++) {
      let R_i = 1.5 * i * this.d;
      let N_i = Math.floor(2 * Math.PI * i);
      let a_i = Math.PI * 2 / N_i;
      for (let j = 1; j <= N_i; j++) {
        let x = R_i * Math.cos(phi_n);
        let y = R_i * Math.sin(phi_n);
        holes[n] = new Hole(n + 1, this.d, R_i, phi_n, x, y);
        phi_n += a_i;
        n++;
      }
      phi_n += this.phi_shift;
    }
    return holes;
  }
  calcArea(n, d) {
    return toFixedFloat(n * d**2 * Math.PI / 4);
  }
}

// Generate pattern on canvas
function generateGraphics(holes) {  
  var patternScale = 0.95 * plot.width / outerDiameter / devicePixelRatio;
  var outerDiameterPx = outerDiameter * patternScale;
  var holeDiameterPx = holeDiameter * patternScale; 
  
  var graphics = [];
  // Draw outer circle
  graphics[0] = new Circle({
                    x: origin.x,
                    y: origin.y,
                    d: outerDiameterPx,
                    strokeStyle: "black",
                    lineWidth: 1,
                    fillStyle: "honeydew"
                    });
    
  for (let i = 0; i < holes.length; i++) {
    let stroke = "black";
	if ((i == 0 || holes[i].r != holes[i - 1].r) && colorPhaseShift) {
	  stroke = "red";
	}
	graphics[i + 1] = new Circle({
                          x: origin.x + holes[i].x * patternScale,
                          y: origin.y - holes[i].y * patternScale,
                          d: holes[i].dia * patternScale,
                          strokeStyle: stroke,
                          lineWidth: 1,
                          fillStyle: "white"});
  }
  return graphics;
}
    
// Draw pattern
function drawGraphics(graphics) {
    for (let g of graphics) {
        g.draw();
    }
}
    
function generateTables(pattern) {
  document.getElementById("totalHoles").innerHTML = pattern.n;
  document.getElementById("openAreaU2").innerHTML = toFixedFloat(pattern.area);
  document.getElementById("openAreaP").innerHTML = toFixedFloat(pattern.areaP);
}
  
function updateTextCoords(holes) {
  var listOfCoords = "";
  for (let h of holes) {
    listOfCoords += toFixedFloat(h.x) + "\t" + toFixedFloat(h.y) +"\n";
  }
  document.getElementById("textCoords").value = listOfCoords;
}

function validateInputs() {
  document.getElementById("holeDiameter").max = document.getElementById("outerDiameter").value;
}

function handleForm(event) {
  event.preventDefault();
  regenerate();
}
    
function regenerate() {
  // High DPI Stuff
  let rect = plot.getBoundingClientRect(); // get current size of the canvas
  plot.width = rect.width * devicePixelRatio; // increase true width of canvas
  plot.height = rect.height * devicePixelRatio; // increase true height of canvas
  context.scale(devicePixelRatio, devicePixelRatio); // scale future operations
  plot.style.width = rect.width + 'px'; // scale back down using CSS
  plot.style.height = rect.height + 'px'; // scale back down using CSS

  holeDiameter = document.getElementById("holeDiameter").value;
  outerDiameter = document.getElementById("outerDiameter").value;
  initialPhase = document.getElementById("initialPhase").value / 180 * Math.PI;
  phaseShift = document.getElementById("phaseShift").value / 180 * Math.PI;
  colorPhaseShift = document.getElementById("colorPhaseShift").checked;
    
  pattern = new Pattern(holeDiameter, outerDiameter, initialPhase, phaseShift);  
  graphics = generateGraphics(pattern.holes)
  drawGraphics(graphics);
  updateTextCoords(pattern.holes);
  generateTables(pattern);
}
  
// Copy history to clipboard
function copy2Clipboard() {
  document.getElementById("textCoords").select();
  document.execCommand('copy');
  console.log("Copied to clipboard!");
}

regenerate(); // Initial drawPattern on page load