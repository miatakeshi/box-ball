const BALL_X = 0
const BALL_R = 28

class Ball {
  constructor() {
    describe(
      "There is a circle moving smoothly from left to right of the screen (position x)," +
      "with random initial horizontal speed and direction," +
      "and random initial vertical position (position y). " +
      "These random values (for x and y) stay the same until a collision happens." +
      "Size of the circle should be relatively small (size of a typical icon on a computer)."
    )
    this.reset()
  }
  render() {
    push()
    fill(255)
    circle(this.x, this.y, this.radius)
    pop()
  }
  move() {
    if(this.x > width) {
      this.x = 0
    }
    
    this.x += this.step
    this.render()
  }
  reset() {
    const {x, y} = this.initBallPos()
    
    this.radius = BALL_R
    this.step = random()
    this.x = x
    this.y = y 
  }
  initBallPos() {
    const x = BALL_X
    const y = random(height - BALL_R * 2) + BALL_R
    return {
      x,y 
    }
  }
}

const BOX_W = 28

class Box {
  constructor() {
    describe(
      "There is square on the screen," + 
      "with position controlled by the arrow keys." +
      "Size of the square should be relatively small (size of a typical icon on a computer)."
    )
    
    this.reset()
  }
  
  render() {
    push()
    
    fill(255)
    square(this.x, this.y, this.w)
    
    pop()
  }
  
  moveStep(x, y) {
    this.x = constrain(this.x + x, 0, width - BOX_W)
    this.y = constrain(this.y + y, 0, height - BOX_W)
  }
  
  getCollider(x, y) {
    const colliderX = constrain(x, this.x, this.x + this.w)
    const colliderY = constrain(y, this.y, this.y + this.w)

    return { colliderX, colliderY }
  }
  
  reset() {
    const { x,y } = this.initBoxPos()
    
    this.w = BOX_W
    this.x = x
    this.y = y
  }

  initBoxPos() {
    return {
      x: width/2 - BOX_W / 2,
      y: height/2 - BOX_W / 2
    }
  }
}

class Scene {
  constructor() {
    this.directions = {
        "Up": [0, -1],
        "Down": [0, 1],
        "Left": [-1, 0],
        "Right": [1, 0]
    }
    this.ball = null
    this.box = null
  }
  
  init() {
    createCanvas(400, 400, WEBGL)
    this.ball = new Ball()
    this.ball.render()
    
    this.box = new Box()
    this.box.render()
  }
  
  control(d) {
    const [xStep, yStep] = this.directions[d]
    this.box.moveStep(xStep, yStep)
    redraw()
  }
  
  hit() {
    this.box.reset()
    this.ball.reset()
  }
  
  render() {
    if (!this.box || !this.ball) {
        return
    }
    
    background(225)
    this.ball.move()
    this.box.render()
      
    const { colliderX, colliderY } = this.box.getCollider(this.ball.x, this.ball.y)
    const distance = dist(colliderX, colliderY, this.ball.x, this.ball.y)
      
    if (distance < this.ball.radius) {
        this.hit()
    }
  }
}

const scene = new Scene()
const keys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"]

function setup() {
  scene.init()
}

function draw() {
  const arrows = [UP_ARROW, DOWN_ARROW, LEFT_ARROW, RIGHT_ARROW]
  
  scene.render()  

  keys.forEach((k, i) => {
   if ( keyIsDown(arrows[i])) {
     scene.control(k.replace("Arrow", ""))
   }
  })
}
