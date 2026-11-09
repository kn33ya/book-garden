let myData;
let trees = [];
let c;
let branches = [];
let test = 300;

let genreColors = {
  Fantasy: "#7F77DD",
  Adventure: "#ef9f27",
  Romance: "#d4537e",
  Historical:"#ba7517",
  "Non-Fiction":"#378add",
  Thriller:"#5f5e5a",
  Fiction:"#1d9e75"
}; //making each genre's color a variable so I can use it in the stemColor function



async function setup() {
  createCanvas(800, 900);
  myData = await loadJSON("bookData.json");
  console.log(myData);

  buildTrees();

}

function draw() {
  background("white");
  let count = branches.length;

  for (let t of trees){
    t.update();
    t.show();
  } // update and show each tree in the trees array

  // for (let i = 0; i < myData.length; i++){
  //   let c = myData[i].Genre.split(",").map(genre => stemColor(genre.trim()));
  //   for (let j = 0; j < width; j+= 2){
  //     stroke(gradientColor(c, j / width));
  //     line(j, i * 30 + 10, j, i * 30 + 30);
  //   }
  // }
 
  for( let i = 0; i < count; i++){
    let b = branches[i];

    if (b.grow < 1) b.grow = min(1, b.grow + 0.05);// increase the growth factor of the branch until it reaches 1

    if (b.parent < 0){
      b.x0 = width / 2;
      b.y0 = height - 60;
      b.abs = b.rel;
    } else {
      let p = branches[b.parent];
      b.x0 = p.x1;
      b.y0 = p.y1;
      b.abs = p.abs + b.rel;
    }
    b.x1 = b.x0 + sin(b.abs) * b.len * b.grow;
    b.y1 = b.y0 - cos(b.abs) * b.len * b.grow;

    if (b.grow >= 1 && !b.spawned){
      b.spawned = true;
      let remaining = test - branches.length;
      if (remaining > 0 && b.len >5){
        let n = min(remaining, random() < 0.35 ? 3 : 2); // decide how many child branches to spawn based on the remaining budget and a random chance
        for (let i = 0; i < n; i ++){
          let childLen = random(b.len * 0.74, b.len * 0.9);
          branches.push(new Branch(i, random(-0.5, 0.5), childLen, b.depth + 1));
        }
      }
    }
  } // this loop calculates the position of each branch based on its parent and its growth factor
  

  stroke(30);
  for ( let b of branches){
    strokeWeight(max(0.6, 3.5 * pow(0.78, b.depth)));
    line(b.x0, b.y0, b.x1, b.y1);
  }
}

function stemColor(genre){
  let hex = genreColors[genre] || "#888888"; 
  return color(hex);
  // it either uses the color from the genreColors object or a default gray if the genre is not found
}

function spice(Spice){
  if (Spice === "yes"){
    return color("red");
  } else if (Spice === "no"){
    return color("green");
  }
}

function gradientColor(colors, t){
  if (colors.length === 1) {
    return colors[0];
  }
    let scaled = constrain(t,0,0.999) * (colors.length - 1);
    let i = floor(scaled);
    return lerpColor(colors[i], colors[i + 1], scaled - i); 
} // This function takes an array of colors and a value t between 0 and 1, 
// and returns a color that is a linear interpolation between the colors in the array based on the value of t.
//  If there is only one color in the array, it simply returns that color.

class Branch{
  constructor(parentIndex, relAngle, len, depth){
    this.parent = parentIndex; // index of the parent branch in the branches array
    this.rel = relAngle; // the angle compared to the parent branch
    this.len = len; // the length of the branch
    this.depth = depth; // the depth of the branch in the tree structure
    this.grow = 0; // the growth factor of the branch, starts at 0 and will increase over time
    this.spawned = false; // a boolean to check if the branch has spawned child branches
    this.x0 = 0; // the starting x position of the branch
    this.y0 = 0; // the starting y position of the branch
    this.x1 = 0; // the ending x position of the branch
    this.y1 = 0; // the ending y position of the branch 
    this.abs = 0; // the absolute angle of the branch, 
    // will be calculated based on the parent's angle and the relative angle
    this.kids = 0; // the number of child branches spawned by this branch
  }
}

class Tree {
  constructor(book, x, baseY){
    this.branches[0].col = this.colorAtDepth(1);
    this.title = book.Title;
    this.budget = book.Pages;
    this.colors = book.Genre.split(",").map(genre => stemColor(genre.trim()));
    this.spicy = book.Spice === "yes";
    this.feeling = book.Feeling;
    this.x = x;
    this.baseY = baseY;
    this.branches = [new Branch(-1, 0, 28, 0)]; // create the first branch with no parent, angle 0, length 100, and depth 0
    this.done = false;
    this.fade = 0;
  } // This class represents a tree structure for a book, with properties for the book's title, page budget, position, and an array of branches.


  update(){
  let B = this.branches;
  let count = B.length;

  for (let i = 0; i < count; i++){
    let b = B[i];

    if (b.grow < 1) b.grow = min(1, b.grow + 0.05);

    if (b.parent < 0){
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

    if (b.grow >= 1 && !b.spawned){
      b.spawned = true;
      let remaining = this.budget - B.length;
      if (remaining > 0 && b.len > 5){
        let n = min(remaining, random() < 0.35 ? 3 : 2);
        for (let k = 0; k < n; k++){
          let childLen = random(b.len * 0.74, b.len * 0.9);
          let child = new Branch(i, random(-0.5, 0.5), childLen, b.depth + 1);
          B.push(child);
        }
        if(!this.done && B.every(b => b.grow >= 1 && b.spawned)){
          this.done = true;
        }
        if (this.done && this.fade < 1){
          this.fade += 0.03;
        }
        b.kids = n;
      }
    }
  }
} // This method updates the position and growth of each branch in the tree.

  show(){
    stroke(b.col);
    for (let b of this.branches){
      strokeWeight(max(0.6, 3.5 * pow(0.78, b.depth)));
      line(b.x0, b.y0, b.x1, b.y1);
    }
    noStroke();
      fill(60);
      textAlign(CENTER);
      textSize(12);
      text(this.title, this.x, this.baseY + 22); 
  } // This method draws the branches of the tree on the canvas. 
  // It iterates through each branch in the branches array, 
  // sets the stroke weight based on the depth of the branch, 
  // and draws a line from the starting point (x0, y0) to the ending point (x1, y1) of each branch.

  colorAtDepth(depth){
    let t = constrain(depth / 10, 0, 1);
    let c = gradientColor(this.colors, t);
    if (this.spicy){
      c = lerpColor(c, color("#e24b4a"), 0.5 * t);
      return c;
    }
  }
}

function buildTrees(){

  let COLS = 4;
  let ROWS = ceil(myData.length / COLS);
  let cellW = width / COLS;
  let cellH = height / ROWS;

  for (let i = 0; i < myData.length; i++){
    let col = i % COLS;
    let row = floor(i / COLS);
    let x = col * cellW + cellW / 2;
    let baseY = row * cellH + cellH - 45;
    trees.push(new Tree(myData[i], x, baseY));
  }
}// This function creates a grid of trees based on my data

function drawFeeling(feeling, x, y, s, c){
  push();
  translate(x,y);
  fill(c);
  noStroke();
  rectMode(CENTER);

  if ( feeling === "fulfilled"){
     beginShape();
     for (let i = 0; i < 10; i++){
      let r = i % 2 === 0 ? s : s * 0.45;
      let a = -HALF_PI + i * (PI/5);
      vertex(cos(a) * r, sin(a) * r);
     }
     endShape(CLOSE);
  }

}

