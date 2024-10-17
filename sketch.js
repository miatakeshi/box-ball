// https://editor.p5js.org/jgong/sketches/HQUD_xUT9

let gl = null

const WEBGL_BIAS = {
  get X() {
    return -width / 2
  },

  get Y() {
    return -height / 2
  }
}

const gameLogic = {
  points: 0,
  hit() {
    this.points += 100
  },
  miss() {
    this.points -= 50
  }
}

const BALL_X = 0
const BALL_R = 14

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
    if (this.crashed) {
      this.particles.forEach(p => {
        p.render()
        p.move()
      })

      this.particles = this.particles.filter(p => !p.isFinished())
      if (this.particles.length === 0) {
        this.reset()
      }
    } else {
      push()
      stroke(166)
      fill(255)
      circle(this.x, this.y, this.radius * 2)
      pop()
    }
  }
  move() {
    if (this.x > width - BALL_R) {
      this.direction *= -1
      gameLogic.miss()
    }

    this.x += this.step * this.direction
    this.render()
  }
  reset() {
    const { x, y } = this.initBallPos()

    this.radius = BALL_R
    this.step = random(0.1, 1)
    this.x = x
    this.y = y
    this.particles = []
    this.crashed = false
    this.direction = 1
  }
  initBallPos() {
    const ballY = random(height)

    const x = BALL_X + BALL_R
    const y = constrain(
      ballY,
      BALL_R,
      height - BALL_R
    )

    return {
      x, y
    }
  }

  createParticles(x, y) {
    for (let i = 0; i < 30; i++) {
      this.particles.push(new Particle(x, y));
    }
  }

  crash() {
    this.crashed = true
    if (this.particles.length === 0) {
      this.createParticles(this.x, this.y)
      gameLogic.hit()
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

    stroke(166)
    fill(255)
    square(this.x, this.y, this.w)

    pop()
  }

  moveStep(x, y) {
    const boxBias = this.w

    this.x = constrain(
      this.x + x,
      0,
      width - boxBias
    )

    this.y = constrain(
      this.y + y,
      0,
      height - boxBias
    )
  }

  getCollider(x, y) {
    const colliderX = constrain(x, this.x, this.x + this.w)
    const colliderY = constrain(y, this.y, this.y + this.w)

    return { colliderX, colliderY }
  }

  reset() {
    const { x, y } = this.initBoxPos()

    this.w = BOX_W
    this.x = x
    this.y = y
  }

  initBoxPos() {
    const boxBias = BOX_W / 2

    const x = width / 2 - boxBias
    const y = height / 2 - boxBias

    return {
      x, y
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
    this.font = null
  }

  init() {
    createCanvas(400, 400, WEBGL)

    this.background = new BackGround()

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
    this.ball.crash()
  }

  loadFont() {
    this.font = loadFont("./Codystar-Regular-2.ttf")
  }

  text() {
    push()
    fill(0)
    textFont(this.font);
    textSize(36);
    text('Points ' + gameLogic.points, 10, 50);
    pop()
  }

  render() {
    if (!this.box || !this.ball) {
      return
    }

    push()

    translate(WEBGL_BIAS.X, WEBGL_BIAS.Y)

    noStroke()

    this.background.render(this.ball.crashed ? [this.ball.x, this.ball.y] : null)

    this.text()
    this.ball.move()
    this.box.render()

    pop()

    const { colliderX, colliderY } = this.box.getCollider(this.ball.x, this.ball.y)
    const distance = dist(colliderX, colliderY, this.ball.x, this.ball.y)

    if (distance < this.ball.radius) {
      this.hit()
    }
  }
}


class BackGround {
  get vertSrc() {
    return /*glsl*/`
precision mediump float;
attribute vec3 aPosition;
attribute vec2 aTexCoord;
varying vec2 vTexCoord;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;

void main() {
  vTexCoord = aTexCoord;
  gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aPosition, 1.0);
}
    `
  };
  get fragSrc() {
    return /*glsl*/`
precision mediump float;

uniform vec2 u_resolution;
varying vec2 vTexCoord;


uniform vec2 u_ballPos;  // ball position
uniform float u_time;     // Time to animate the ripple

void main() {
  // Normalize the texture coordinates
  vec2 st = vTexCoord * u_resolution;

  // Define the grid size
  float gridSize = 20.0;
  
  // Create the grid lines, keep the decimal part
  vec2 grid = fract(st / gridSize);

  // Define the line thickness
  float lineThickness = 0.04;

  // Create the grid effect, step is like "<", true = 1.0, false = 0.0
  float line = step(grid.x, lineThickness) + step(grid.y, lineThickness);
  float pixelColor = 0.88 - line;
  if (pixelColor < 0.0) {
    pixelColor = 0.8;
  }

  if (u_ballPos != vec2(0.0, 0.0)) {
    // Ripple effect
    vec2 rippleCenter = u_ballPos / u_resolution;
    float dist = distance(st / u_resolution, rippleCenter);
    
    // Calculate the ripple animation based on time and distance
    float ripple = sin(dist * 30.0 - u_time * 10.0) * exp(-dist * 10.0);
    
    // Mix ripple effect with grid color
    pixelColor += ripple * 0.5;
  
    // Output the color based on the grid lines and ripple effect
    vec3 color = vec3(pixelColor);
  }

  // Output the color based on the grid lines
  vec3 color = vec3(pixelColor);

  gl_FragColor = vec4(color, 1.0);
}

    `
  }
  constructor() {
    this.shader = createShader(this.vertSrc, this.fragSrc)
  }

  render(ballCrushPos) {
    gl && gl.disable(gl.DEPTH_TEST)

    push()
    shader(this.shader)
    this.shader.setUniform("u_resolution", [width, height])
    this.shader.setUniform("u_ballPos", ballCrushPos ?? [0, 0]);
    this.shader.setUniform("u_time", deltaTime * 0.001);

    rect(0, 0, width, height)
    resetShader()
    pop()

    gl && gl.enable(gl.DEPTH_TEST)
  }
}

class Particle {
  constructor(x, y) {
    this.x = x
    this.y = y
    this.vx = random(-8, 8)
    this.vy = random(-8, 8)
    this.alpha = 255
  }

  render() {
    push()
    noStroke()
    fill(255, 0, 0, this.alpha)
    ellipse(this.x, this.y, 8)
    pop()
  }

  move() {
    this.x += this.vx
    this.y += this.vy
    this.alpha -= 30
  }

  isFinished() {
    return this.alpha <= 0
  }
}

const scene = new Scene()
const keys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"]

function preload() {
  scene.loadFont()
}

function setup() {
  scene.init()
}

function draw() {
  gl = this._renderer.GL
  const arrows = [UP_ARROW, DOWN_ARROW, LEFT_ARROW, RIGHT_ARROW]

  scene.render()

  keys.forEach((k, i) => {
    if (keyIsDown(arrows[i])) {
      scene.control(k.replace("Arrow", ""))
    }
  })
}
