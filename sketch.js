
let myData;
let trees = [];
let c;
let branches = [];
let test = 300;

let genreColors = {
  Fantasy: "#7F77DD",
  Adventure: "#ef9f27",
  Romance: "#d4537e",
  Historical: "#000280",
  "Non-Fiction": "#378add",
  Thriller: "#5f5e5a",
  Fiction: "#1d9e75"
};

// making each genre's color a variable so I can use it in the stemColor function

async function setup() {
  createCanvas(800, 900);
  myData = await loadJSON("bookData.json");
  console.log(myData);

  buildTrees();
}

function draw() {
  background("white");

  for (let t of trees) {
    t.update();
    t.show();
  }
}

function stemColor(genre) {
  let hex = genreColors[genre] || "#888888";
  return color(hex);
  // it either uses the color from the genreColors object or a default gray if the genre is not found
}

function spice(Spice) {
  if (Spice === "yes") {
    return color("red");
  } else if (Spice === "no") {
    return color("green");
  }
}

function gradientColor(colors, t) {
  if (colors.length === 1) {
    return colors[0];
  }

  let scaled = constrain(t, 0, 0.999) * (colors.length - 1);
  let i = floor(scaled);

  return lerpColor(colors[i], colors[i + 1], scaled - i);
}

// This function takes an array of colors and a value t between 0 and 1,
// and returns a color that is a linear interpolation between the colors in the array based on the value of t.
// If there is only one color in the array, it simply returns that color.

class Branch {
  constructor(parentIndex, relAngle, len, depth) {
    this.parent = parentIndex;
    this.rel = relAngle;
    this.len = len;
    this.depth = depth;
    this.grow = 0;
    this.spawned = false;
    this.x0 = 0;
    this.y0 = 0;
    this.x1 = 0;
    this.y1 = 0;
    this.abs = 0;
    this.kids = 0;
  }
}

class Tree {
  constructor(book, x, baseY) {
    this.title = book.Title;
    this.budget = book.Pages;
    this.colors = book.Genre.split(",").map(genre => stemColor(genre.trim()));
    this.spicy = book.Spice === "yes";
    this.feeling = book.Feeling;
    this.x = x;
    this.baseY = baseY;

    this.branches = [new Branch(-1, 0, 28, 0)];
    this.branches[0].col = this.colorAtDepth(1);

    this.done = false;
    this.fade = 0;
  }

  // This class represents a tree structure for a book, with properties for the book's title, page budget, position, and an array of branches.

  update() {
    let B = this.branches;
    let count = B.length;

    for (let i = 0; i < count; i++) {
      let b = B[i];

      if (b.grow < 1) b.grow = min(1, b.grow + 0.05);

      if (b.parent < 0) {
        b.x0 = this.x;
        b.y0 = this.baseY;
        b.abs = b.rel;
      } else {
        let p = B[b.parent];
        b.x0 = p.x1;
        b.y0 = p.y1;
        b.abs = p.abs + b.rel;
      }

      b.x1 = b.x0 + sin(b.abs) * b.len * b.grow;
      b.y1 = b.y0 - cos(b.abs) * b.len * b.grow;

      if (b.grow >= 1 && !b.spawned) {
        b.spawned = true;

        let remaining = this.budget - B.length;

        if (remaining > 0 && b.len > 5) {
          let n = min(remaining, random() < 0.35 ? 3 : 2);

          for (let k = 0; k < n; k++) {
            let childLen = random(b.len * 0.74, b.len * 0.9);
            let child = new Branch(i, random(-0.5, 0.5), childLen, b.depth + 1);
            B.push(child);
          }

          b.kids = n;
        }
      }
    }

    if (!this.done && B.every(b => b.grow >= 1 && b.spawned)) {
      this.done = true;
    }

    if (this.done && this.fade < 1) {
      this.fade = min(1, this.fade + 0.03);
    }
  }

  // This method updates the position and growth of each branch based on its parent.

  show(){
  for (let b of this.branches){
    stroke(this.colorAtDepth(b.depth));
    strokeWeight(max(0.6, 3.5 * pow(0.78, b.depth)));
    line(b.x0, b.y0, b.x1, b.y1);

    // Draw the feeling shape at the end of each branch
    if (b.kids === 0 && b.grow >= 1){
      drawFeeling(this.feeling, b.x1, b.y1, 2.8 * this.fade, this.colorAtDepth(b.depth));
    }
  }

  noStroke();
  fill(60);
  textAlign(CENTER);
  textSize(12);
  text(this.title, this.x, this.baseY + 22);
}

  // This method draws the branches of the tree using genre colors.

  colorAtDepth(depth) {
    let t = constrain(depth / 10, 0, 1);
    let c = gradientColor(this.colors, t);

    if (this.spicy) {
      c = lerpColor(c, color("#e24b4a"), 0.5 * t);
    }

    return c;
  }
}

function buildTrees() {
  let COLS = 4;
  let ROWS = ceil(myData.length / COLS);
  let cellW = width / COLS;
  let cellH = height / ROWS;

  for (let i = 0; i < myData.length; i++) {
    let col = i % COLS;
    let row = floor(i / COLS);
    let x = col * cellW + cellW / 2;
    let baseY = row * cellH + cellH - 45;

    trees.push(new Tree(myData[i], x, baseY));
  }
}

// This function creates a grid of trees based on my data.

function drawFeeling(feeling, x, y, s, c) {
  push();
  translate(x, y);
  fill(c);
  noStroke();
  rectMode(CENTER);

  if (feeling === "fulfilled") {
    beginShape();

    for (let i = 0; i < 10; i++) {
      let r = i % 2 === 0 ? s : s * 0.45;
      let a = -HALF_PI + i * (PI / 5);
      vertex(cos(a) * r, sin(a) * r);
    }

    endShape(CLOSE);

  } else if (feeling === "angry") {
    triangle(0, -s, s, s * 0.8, -s, s * 0.8);

  } else if (feeling === "need more") {
    stroke(c);
    strokeWeight(1.2);
    line(-s * 0.8, -s * 0.8, s * 0.8, s * 0.8);
    line(s * 0.8, -s * 0.8, -s * 0.8, s * 0.8);

  } else if (feeling === "sad") {
    arc(0, 0, s * 2, s * 2, 0, PI, CHORD);

  } else {
    circle(0, 0, s * 1.8);
  }

  pop();
}
