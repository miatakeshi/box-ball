let gl = null

const WEBGL_BIAS = {
  get X() {
    return -width / 2
  },

  get Y() {
    return -height / 2
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
    push()
    fill(255)
    circle(this.x, this.y, this.radius * 2)
    pop()
  }
  move() {
    if (this.x > width - BALL_R) {
      this.x = 0
    }

    this.x += this.step
    this.render()
  }
  reset() {
    const { x, y } = this.initBallPos()

    this.radius = BALL_R
    this.step = random(0.1, 1)
    this.x = x
    this.y = y
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
    this.ball.reset()
  }

  render() {
    if (!this.box || !this.ball) {
      return
    }

    push()

    translate(WEBGL_BIAS.X, WEBGL_BIAS.Y)

    background(225)
    noStroke()
    this.ball.move()
    this.background.render()
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
#ifdef GL_ES
precision mediump float;
#endif
attribute vec3 aPosition;
attribute vec2 aTexCoord;
varying vec2 vTexCoord;

void main() {
  vTexCoord = aTexCoord;
  gl_Position = vec4(aPosition, 1.0);
}
    `
  };
  get fragSrc() {
    return /*glsl*/`
#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution;
varying vec2 vTexCoord;

void main() {
  // Normalize the texture coordinates
  vec2 st = vTexCoord * u_resolution;

  // Define the grid size
  float gridSize = 40.0;
  
  // Create the grid lines
  vec2 grid = fract(st / gridSize);

  // Define the line thickness
  float lineThickness = 0.05;

  // Create the grid effect
  float line = step(grid.x, lineThickness) + step(grid.y, lineThickness);

  // Output the color based on the grid lines
  vec3 color = vec3(1.0 - line);

  gl_FragColor = vec4(color, 1.0);
}

    `
  }
  constructor() {
    this.shader = createShader(this.vertSrc, this.fragSrc)
  }

  render() {
    gl && gl.disable(gl.DEPTH_TEST)

    push()
    shader(this.shader)
    this.shader.setUniform("u_resolution", [width, height])
    fill(225)
    rect(0, 0, width, height)
    resetShader()
    pop()

    gl && gl.enable(gl.DEPTH_TEST)
  }
}

const scene = new Scene()
const keys = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"]

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
