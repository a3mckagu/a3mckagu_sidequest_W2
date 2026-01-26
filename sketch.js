// Background image
let bgImage; // CHANGED: Declare background image variable

// Foreground images (overlay on top)
let fg1Image; // CHANGED: Bottom left foreground
let fg2Image; // CHANGED: Bottom right foreground

// Y-position of the floor (ground level)
let floorY3;

// Player character (soft, animated blob)
let blob3 = {
  // Position (centre of the blob)
  x: 80,
  y: 0,

  // Visual properties
  r: 26, // Base radius
  points: 48, // Number of points used to draw the blob
  wobble: 7, // Edge deformation amount
  wobbleFreq: 0.9,

  // Time values for breathing animation
  t: 0,
  tSpeed: 0.01,

  // Physics: velocity
  vx: 0, // Horizontal velocity
  vy: 0, // Vertical velocity

  // Movement tuning
  accel: 0.55, // Horizontal acceleration
  maxRun: 4.0, // Maximum horizontal speed
  gravity: 0.65, // Downward force
  jumpV: -13.75, // Initial jump impulse - CHANGED: Increased by 1.125x (was -11.0)

  // State
  onGround: false, // True when standing on a platform

  // Friction
  frictionAir: 0.995, // Light friction in air
  frictionGround: 0.88, // Stronger friction on ground
};

// List of solid platforms the blob can stand on
// Each platform is an axis-aligned rectangle (AABB)
let platforms = [];

function setup() {
  createCanvas(670, 670); // CHANGED: Square canvas 670x670
  bgImage = loadImage("assets/bg.png"); // CHANGED: Load background image
  fg1Image = loadImage("assets/fg1.png"); // CHANGED: Load bottom left foreground
  fg2Image = loadImage("assets/fg2.png"); // CHANGED: Load bottom right foreground

  // Define the floor height
  floorY3 = height - 36;

  noStroke();
  textFont("sans-serif");
  textSize(14);

  // Create platforms (floor + steps)
  platforms = [
    { x: 0, y: floorY3, w: width, h: height - floorY3 }, // floor
    { x: 120, y: floorY3 - 130, w: 120, h: 12 }, // low step - CHANGED: Raised 50px
    { x: 272, y: floorY3 - 230, w: 90, h: 12 }, // mid step - CHANGED: Raised 50px
    { x: 390, y: floorY3 - 130, w: 130, h: 12 }, // high step - CHANGED: Raised 50px
    { x: 450, y: floorY3 - 300, w: 90, h: 12 }, // return ramp - CHANGED: Raised 50px
  ];

  // Start the blob resting on the floor
  blob3.y = floorY3 - blob3.r - 1;
}

function draw() {
  clear(); //clear previous work
  // CHANGED: Draw background image scaled to fill canvas
  if (bgImage) {
    const imgAspect = bgImage.width / bgImage.height; // CHANGED: Calculate image aspect ratio
    const canvasAspect = width / height; // CHANGED: Calculate canvas aspect ratio
    let imgWidth, imgHeight;

    if (imgAspect > canvasAspect) {
      // Image is wider than canvas, fit to height
      imgHeight = height; // CHANGED: Fill height
      imgWidth = height * imgAspect; // CHANGED: Scale width proportionally
    } else {
      // Image is taller than canvas, fit to width
      imgWidth = width; // CHANGED: Fill width
      imgHeight = width / imgAspect; // CHANGED: Scale height proportionally
    }

    image(
      bgImage,
      (width - imgWidth) / 2,
      (height - imgHeight) / 2,
      imgWidth,
      imgHeight,
    ); // CHANGED: Draw centered image
  }

  // --- Draw all platforms ---
  fill(64, 43, 60); //I adjusted the fill myself
  for (const p of platforms) {
    rect(p.x, p.y, p.w, p.h);
  }

  // --- Input: left/right movement ---
  let move = 0;
  if (keyIsDown(65) || keyIsDown(LEFT_ARROW)) move -= 1; // A or ←
  if (keyIsDown(68) || keyIsDown(RIGHT_ARROW)) move += 1; // D or →
  blob3.vx += blob3.accel * move;

  // --- Apply friction and clamp speed ---
  blob3.vx *= blob3.onGround ? blob3.frictionGround : blob3.frictionAir;
  blob3.vx = constrain(blob3.vx, -blob3.maxRun, blob3.maxRun);

  // --- Apply gravity ---
  blob3.vy += blob3.gravity;

  // --- Collision representation ---
  // We collide using a rectangle (AABB),
  // even though the blob is drawn as a circle
  let box = {
    x: blob3.x - blob3.r,
    y: blob3.y - blob3.r,
    w: blob3.r * 2,
    h: blob3.r * 2,
  };

  // --- STEP 1: Move horizontally, then resolve X collisions ---
  box.x += blob3.vx;
  for (const s of platforms) {
    if (overlap(box, s)) {
      if (blob3.vx > 0) {
        // Moving right → hit the left side of a platform
        box.x = s.x - box.w;
      } else if (blob3.vx < 0) {
        // Moving left → hit the right side of a platform
        box.x = s.x + s.w;
      }
      blob3.vx = 0;
    }
  }

  // --- STEP 2: Move vertically, then resolve Y collisions ---
  box.y += blob3.vy;
  blob3.onGround = false;

  for (const s of platforms) {
    if (overlap(box, s)) {
      if (blob3.vy > 0) {
        // Falling → land on top of a platform
        box.y = s.y - box.h;
        blob3.vy = 0;
        blob3.onGround = true;
      } else if (blob3.vy < 0) {
        // Rising → hit the underside of a platform
        box.y = s.y + s.h;
        blob3.vy = 0;
      }
    }
  }

  // --- Convert collision box back to blob centre ---
  blob3.x = box.x + box.w / 2;
  blob3.y = box.y + box.h / 2;

  // Keep blob inside the canvas horizontally
  blob3.x = constrain(blob3.x, blob3.r, width - blob3.r);

  // --- Draw the animated blob ---
  blob3.t += blob3.tSpeed;
  drawBlobCircle(blob3);

  // --- HUD ---
  fill(255); // I adjusted the HUD fill for readability
  textFont("Indie Flower"); // CHANGED: Reset to default font for normal HUD text
  textSize(15); // CHANGED: Reset to default size
  textAlign(CENTER); // CHANGED: Center align for controls text below indie flower
  text(
    "Move: A/D or ←/→  •  Jump: Space/W/↑  •  Land on Platforms  •  No Prize",
    width / 2,
    647,
  ); // CHANGED: Moved below indie flower text

  // CHANGED: Narrative text - centered, larger, custom font
  textFont("Indie Flower"); // CHANGED: Set to Indie Flower font
  textSize(28); // CHANGED: Increased 1.25x from 14
  textAlign(CENTER, TOP); // CHANGED: Center horizontally, align to top for consistent padding
  fill(255); // CHANGED: White color
  text(
    "Retreat behind the trees... or confront your fear and reach the moon",
    width / 10, // CHANGED: Centered on X-axis (middle of canvas)
    185, // CHANGED: 20px top padding
    550, // CHANGED: Max width to constrain text within canvas with margins
  );

  // CHANGED: Draw foreground images as topmost layer (z-index effect)
  const fgHeight = 200; // CHANGED: Foreground height 200px
  const fgYPos = height - 35 - fgHeight; // CHANGED: 20px from bottom

  // CHANGED: Draw fg1 in bottom left corner
  if (fg1Image) {
    const fg1Width = fgHeight * (fg1Image.width / fg1Image.height); // CHANGED: Maintain aspect ratio
    image(fg1Image, -22, fgYPos, fg1Width, fgHeight); // CHANGED: 20px from left
  }

  // CHANGED: Draw fg2 in bottom right corner
  if (fg2Image) {
    const fg2Width = fgHeight * (fg2Image.width / fg2Image.height); // CHANGED: Maintain aspect ratio
    image(fg2Image, width + 10 - fg2Width, fgYPos, fg2Width, fgHeight); // CHANGED: 20px from right
  }
}

// Axis-Aligned Bounding Box (AABB) overlap test
// Returns true if rectangles a and b intersect
function overlap(a, b) {
  return (
    a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
  );
}

// Draws the blob using Perlin noise for a soft, breathing effect
function drawBlobCircle(b) {
  stroke(0); // CHANGED: Black stroke for scribble effect
  strokeWeight(2); // CHANGED: Thicker line for visibility
  noFill(); // CHANGED: No fill - just outline

  // CHANGED: Calculate spiral count based on distance from top (lower y = closer to top = more spirals)
  const distanceFromTop = floorY3 - b.y; // CHANGED: Distance blob moved up from floor
  const spiralCount = 15 + Math.floor(distanceFromTop / 50) * 6; // CHANGED: +10 spirals per 50px toward top

  // Draw multiple spiral loops for noisy, nervous effect
  for (let spiral = 0; spiral < spiralCount; spiral++) {
    // CHANGED: Dynamic spiral count based on blob's Y position
    beginShape();

    for (let i = 0; i < b.points; i++) {
      const a = (i / b.points) * TAU;

      // Noise-based radius offset with added spiral noise
      const n = noise(
        cos(a) * b.wobbleFreq + 100,
        sin(a) * b.wobbleFreq + 100,
        b.t + spiral * 0.3, // CHANGED: Different noise offset per spiral layer
      );

      // Extra random noise for jittery, nervous feeling
      const jitter = noise(b.t * 2 + spiral, a * 3) * 6; // CHANGED: High-freq jitter for tension

      // Spiral inward slightly based on spiral layer
      const spiralShrink = (spiral / 4) * 8; // CHANGED: Creates inward spiral effect - Andreea edited the depthness of the spiral

      // Combine base radius, wobble, jitter, and spiral shrink
      const r = b.r + map(n, 0, 1, -b.wobble, b.wobble) + jitter - spiralShrink; // CHANGED: Layered radius calculation

      vertex(b.x + cos(a) * r, b.y + sin(a) * r);
    }

    endShape(CLOSE);
  }
}

// Jump input (only allowed when grounded)
function keyPressed() {
  if (
    (key === " " || key === "W" || key === "w" || keyCode === UP_ARROW) &&
    blob3.onGround
  ) {
    blob3.vy = blob3.jumpV;
    blob3.onGround = false;
  }
}

/* In-class tweaks for experimentation:
   • Add a new platform:
     platforms.push({ x: 220, y: floorY3 - 150, w: 80, h: 12 });

   • “Ice” feel → frictionGround = 0.95
   • “Sand” feel → frictionGround = 0.80
*/
