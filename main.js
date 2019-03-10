var cubeRotation = 0.0;


//
// Start here
//

var c;
var tracks;

function main() {
  
  
  const canvas = document.querySelector('#glcanvas');
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  
  global_timestamp = 0;
  track_length = 2.0;
  edge_length = 1.0;
  track_depth = 30.0;
  sneaker_lim = 0;
  var jump_limit = 1;
  var rightPressed = false;
  var leftPressed = false;
  var duck = false;
  var start_duck = false;
  var keep_jumping = false;
  var spacePressed = false;
  toggle_it = false;
  
  wall_img = 'walls.jpg';
  track_img = 'track.jpg'
  player_img = 'player.png'
  coin_img = 'coin1.png';
  sneaker_img = 'sneakers.jpeg';
  jetpack_img = 'jetpack.jpeg';
  pole_img = 'pole.jpg';
  center_img = 'center.jpg';
  wall_height = 10;
  last_jetpack = 0;
  wall_depth = 35;
  pole_ht = 3 * edge_length / 4;

  // 40, 70, 60, 10, 140, 160

  duck_obs = [{ left_pole : new cube(gl, [-track_length / 2, pole_ht / 2, -10], [0.2, pole_ht, 0.2], pole_img, 1),
  right_pole : new cube(gl, [track_length / 2, pole_ht / 2, -10], [0.2, pole_ht, 0.2], pole_img, 1), 
  center: new cube(gl, [0, pole_ht + 0.2, -10], [track_length, 0.4, 0.2], center_img, 1)}, 
  { left_pole : new cube(gl, [-3 * track_length / 2 + 0.2, pole_ht / 2, -70], [0.2, pole_ht, 0.2], pole_img, 1),
    right_pole : new cube(gl, [-track_length / 2 + 0.2, pole_ht / 2, -70], [0.2, pole_ht, 0.2], pole_img, 1), 
    center: new cube(gl, [-track_length + 0.2, pole_ht + 0.2, -70], [track_length, 0.4, 0.2], center_img, 1)}];

  jump_obs = [new cube(gl, [track_length, pole_ht / 2, -140], [track_length, pole_ht, 0.2], center_img, 1), 
  new cube(gl, [0, pole_ht / 2, -160], [track_length, pole_ht, 0.2], center_img, 1)];

  walls = [new cube(gl, [-3 * track_length / 2, wall_height / 2, -wall_depth / 2], [0.2, wall_height, wall_depth], wall_img, 1),
  new cube(gl, [+3 * track_length / 2, wall_height / 2, -wall_depth / 2], [0.2, wall_height, wall_depth], wall_img, 1)];
  c = new cube(gl, [0, edge_length / 2, -3], [edge_length, edge_length, 0.0001], player_img, 1);
  tracks = [new cube(gl, [0.0, -0.2, -track_depth / 2], [track_length, 0.2, track_depth], track_img, 1), 
  new cube(gl, [-track_length, -0.2, -track_depth / 2], [track_length, 0.2, track_depth], track_img, 1), 
  new cube(gl, [track_length, -0.2, -track_depth / 2], [track_length, 0.2, track_depth], track_img, 1)];
  coins = [];
  for(i = 0; i < 20; i++)
  {
    coins[coins.length] = new cube(gl, [0, 0.1, -10 - 0.45 * i], [0.2, 0.2, 0.2], coin_img, 1);
  }
  sneaker = new cube(gl, [-track_length, 0.2, -70], [0.4, 0.4, 0.4], sneaker_img, 1);
  jetpacks = [new cube(gl, [track_length, 0.2, -40], [0.4, 0.4, 0.4], jetpack_img, 1), 
  new cube(gl, [0, 0.2, -100], [0.4, 0.4, 0.4], jetpack_img, 1)];
  // If we don't have a GL context, give up now
  
  if (!gl) {
    alert('Unable to initialize WebGL. Your browser or machine may not support it.');
    return;
  }
  
  // Vertex shader program
  
  const vsSource = `
  attribute vec4 aVertexPosition;
  attribute vec2 aTextureCoord;
  uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;
    varying highp vec2 vTextureCoord;
    void main(void) {
      gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
      vTextureCoord = aTextureCoord;
    }
    `;
    
  // Fragment shader program
  
  const fsSource = `
    varying highp vec2 vTextureCoord;
    uniform sampler2D uSampler;
    void main(void) {
      gl_FragColor = texture2D(uSampler, vTextureCoord);
    }
  `;

  const fsSource_flash_normal = `
    // varying lowp vec4 vColor;

    varying mediump vec2 vTextureCoord;
    uniform sampler2D uSampler;
    precision mediump float;

    void main(void) {
      // gl_FragColor = vColor;
      vec4 color = texture2D(uSampler, vTextureCoord);
      color += vec4(0.1, 0.1, 0.1, 0);
      gl_FragColor = vec4(vec3(color), 1.0);
    }
  `;

  const fsSource_flash_grayscale = `
    // varying lowp vec4 vColor;

    varying mediump vec2 vTextureCoord;
    uniform sampler2D uSampler;
    precision mediump float;

    void main(void) {
      // gl_FragColor = vColor;
      vec4 color = texture2D(uSampler, vTextureCoord);
      color += vec4(0.2, 0.2, 0.2, 0);
      float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
      gl_FragColor = vec4(vec3(gray), 1.0);
    }
  `;

  const fsSource_grayscale = `
    // varying lowp vec4 vColor;

    varying mediump vec2 vTextureCoord;
    uniform sampler2D uSampler;
    precision mediump float;

    void main(void) {
      // gl_FragColor = vColor;
      vec4 color = texture2D(uSampler, vTextureCoord);
      float gray = dot(color.rgb, vec3(0.299, 0.587, 0.114));
      gl_FragColor = vec4(vec3(gray), 1.0);
    }
  `;


  
  // Initialize a shader program; this is where all the lighting
  // for the vertices and so forth is established.
  const shaderProgram = initShaderProgram(gl, vsSource, fsSource);
  
  // Collect all the info needed to use the shader program.
  // Look up which attributes our shader program is using
  // for aVertexPosition, aVevrtexColor and also
  // look up uniform locations.
  const programInfo = {
    program: shaderProgram,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
      textureCoord: gl.getAttribLocation(shaderProgram, 'aTextureCoord'),
    },
    uniformLocations: {
      projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
      modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
      uSampler: gl.getUniformLocation(shaderProgram, 'uSampler'),
    },
  };


  const shaderProgram_grayscale = initShaderProgram(gl, vsSource, fsSource_grayscale);

  const programInfo_grayscale = {
    program: shaderProgram_grayscale,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgram_grayscale, 'aVertexPosition'),
      // vertexColor: gl.getAttribLocation(shaderProgram_grayscale, 'aVertexColor'),
      
      textureCoord: gl.getAttribLocation(shaderProgram_grayscale, 'aTextureCoord'),
    },
    uniformLocations: {
      projectionMatrix: gl.getUniformLocation(shaderProgram_grayscale, 'uProjectionMatrix'),
      modelViewMatrix: gl.getUniformLocation(shaderProgram_grayscale, 'uModelViewMatrix'),
      
      uSampler: gl.getUniformLocation(shaderProgram_grayscale, 'uSampler'),
    },
  };

  const shaderProgram_flash_normal = initShaderProgram(gl, vsSource, fsSource_flash_normal);
  
  // Collect all the info needed to use the shader program.
  // Look up which attributes our shader program is using
  // for aVertexPosition, aVevrtexColor and also
  // look up uniform locations.
  const programInfo_flash_normal = {
    program: shaderProgram_flash_normal,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgram_flash_normal, 'aVertexPosition'),
      textureCoord: gl.getAttribLocation(shaderProgram_flash_normal, 'aTextureCoord'),
    },
    uniformLocations: {
      projectionMatrix: gl.getUniformLocation(shaderProgram_flash_normal, 'uProjectionMatrix'),
      modelViewMatrix: gl.getUniformLocation(shaderProgram_flash_normal, 'uModelViewMatrix'),
      uSampler: gl.getUniformLocation(shaderProgram_flash_normal, 'uSampler'),
    },
  };

  const shaderProgram_flash_grayscale = initShaderProgram(gl, vsSource, fsSource_flash_grayscale);

  const programInfo_flash_grayscale = {
    program: shaderProgram_flash_grayscale,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgram_flash_grayscale, 'aVertexPosition'),
      // vertexColor: gl.getAttribLocation(shaderProgram_flash_grayscale, 'aVertexColor'),
      
      textureCoord: gl.getAttribLocation(shaderProgram_flash_grayscale, 'aTextureCoord'),
    },
    uniformLocations: {
      projectionMatrix: gl.getUniformLocation(shaderProgram_flash_grayscale, 'uProjectionMatrix'),
      modelViewMatrix: gl.getUniformLocation(shaderProgram_flash_grayscale, 'uModelViewMatrix'),
      
      uSampler: gl.getUniformLocation(shaderProgram_flash_grayscale, 'uSampler'),
    },
  };
  

  function detect_collision(a, b)
  {
    return (2 * Math.abs(a.pos[0] - b.pos[0]) < a.dim[0] + b.dim[0] &&
     2 * Math.abs(a.pos[1] - b.pos[1]) < a.dim[1] + b.dim[1] && 
     2 * Math.abs(a.pos[2] - b.pos[2]) < a.dim[2] + b.dim[2]);
  }

  function coins_gen()
  {
    for(i = 0; i < coins.length; i++)
    {
      coins[i].isdraw = true;
      coins[i].pos[1] = c.pos[1] + 1;
      coins[i].pos[2] = c.pos[2] - 5 - 0.45 * i;
    }
  }
  // Here's where we call the routine that builds all the
  // objects we'll be drawing.
  //const buffers
  var then = 0;
  // Draw the scene repeatedly
  function render(now) {
    global_timestamp += 1;
    global_timestamp %= 40;
    c.score += 1;
    for(i = 0; i < 3; i++)
      tracks[i].pos[2] -= 0.05;
    c.pos[2] -= 0.05;
    //wall movement
    if(c.pos[2] - wall_depth / 2 - 2 < walls[0].pos[2] - wall_depth / 2)
    {
      for(i = 0; i < 2; i++)
        walls[i].pos[2] -= wall_depth / 4;
    }
    
    // console.log(c.pos)
    now *= 0.001;  // convert to seconds
    const deltaTime = now - then;
    then = now;
    // console.log(deltaTime);

    // sneaker
    if(detect_collision(sneaker, c) === true)
    {
      sneaker.isdraw = false;
      jump_limit = 2;
      sneaker_lim = 0;
    }
    sneaker_lim += 1;
    if(sneaker_lim == 600 && jump_limit == 2)
    {
      jump_limit = 1;
    }

    //jetpack logic
    for(i = 0; i < 2; i++)
    {
      if(detect_collision(jetpacks[i], c))
      {
        last_jetpack = jetpacks[i].pos[2];
        jetpacks[i].isdraw = false;
        coins_gen();
        c.ay = 0;
        break;
      }
    }
    // console.log(c.pos[1]);
    if(last_jetpack < 0 && Math.abs(c.pos[1] - edge_length / 2) < 1)
    {
      c.pos[1] += 0.05;
    }
    if(last_jetpack - c.pos[2] > 25 && last_jetpack < 0)
    {
      c.ay = 10;
      last_jetpack = +0;
    }
    // console.log(c.ay);
    if(!toggle_it)
    {
      drawScene(gl, programInfo, programInfo_flash_normal, deltaTime);
    }
    else
    {
      drawScene(gl, programInfo_grayscale, programInfo_flash_grayscale, deltaTime);
    }
    document.addEventListener('keyup', keyUpHandler, false);
    document.addEventListener('keydown', keyDownHandler, false);
    if(rightPressed && c.pos[0] < track_length)
      c.pos[0] += 0.05;
    if(leftPressed && c.pos[0] > -track_length)
      c.pos[0] -= 0.05;
    if(duck && !start_duck && last_jetpack > -1)
    {
      if(Math.abs(c.pos[1] - edge_length / 2) < 0.000001)
      {
        start_duck = true;
        c.scaling[1] = 0.5;
        c.pos[1] -= edge_length / 4;
      }
      if(c.ay < 20)
        c.ay += 20;
    }
    else if(!duck && start_duck)
    {
      start_duck = false;
      c.scaling[1] = 1;
      c.pos[1] += edge_length / 4;
      if(c.ay > 20)
        c.ay -= 20;
    }

    if(spacePressed)
    {
      if(c.ay > 20)
        c.ay -= 20;
      if(Math.abs(c.pos[1] - edge_length / 2) < 0.000001)
        c.vy = Math.sqrt(2 * c.ay * jump_limit);
    }
    if(c.ay != 0)
    {
      var final = c.vy - c.ay / 60;
      var disp = (c.vy * c.vy - final * final) / (2 * c.ay);
      c.pos[1] += disp;
      c.vy = final;
    }
    if(c.pos[1] < edge_length / 2)
      c.pos[1] = edge_length / 2;

    for(i = 0; i < coins.length; i++)
      if(detect_collision(coins[i], c))
      {
        coins[i].isdraw = false;
        c.score += 1000;
      }
    document.getElementById('score').innerHTML = c.score;
    function keyDownHandler(event) {
      if(event.keyCode == 39) {
        rightPressed = true;
      }
      else if(event.keyCode == 37) {
        leftPressed = true;
      }
      if (event.keyCode == 32) {
        spacePressed = true;
      }
      if (event.keyCode == 40) {
        duck = true;
      }
      if(event.keyCode == 71)
      {
        toggle_it = true;
      }
    }
    function keyUpHandler(event) {
      if(event.keyCode == 39) {
        rightPressed = false;
      }
      else if(event.keyCode == 37) {
        leftPressed = false;
      }
      if (event.keyCode == 32) {
        spacePressed = false;
      }
      if (event.keyCode == 40) {
        duck = false;
      }
      if(event.keyCode == 71)
      {
        toggle_it = false;
      }
    }
    
    requestAnimationFrame(render);
    
  }
  requestAnimationFrame(render);
}

//
// Draw the scene.
//
function drawScene(gl, programInfo, programInfo_flash, deltaTime) {
  gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
  gl.clearDepth(1.0);                 // Clear everything
  gl.enable(gl.DEPTH_TEST);           // Enable depth testing
  gl.depthFunc(gl.LEQUAL);            // Near things obscure far things
  
  // Clear the canvas before we start drawing on it.
  
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  
  // Create a perspective matrix, a special matrix that is
  // used to simulate the distortion of perspective in a camera.
  // Our field of view is 45 degrees, with a width/height
  // ratio that matches the display size of the canvas
  // and we only want to see objects between 0.1 units
  // and 100 units away from the camera.
  
  const fieldOfView = 45 * Math.PI / 180;   // in radians
  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  const zNear = 0.1;
  const zFar = 100.0;
  const projectionMatrix = mat4.create();
  
  // note: glmatrix.js always has the first argument
  // as the destination to receive the result.
  mat4.perspective(projectionMatrix,
                   fieldOfView,
                   aspect,
                   zNear,
                   zFar);
                   
  // Set the drawing position to the "identity" point, which is
  // the center of the scene.
  var cameraMatrix = mat4.create();
    mat4.translate(cameraMatrix, cameraMatrix, [0, edge_length / 2 + 3, c.pos[2] + 5]);
    var cameraPosition = [
      cameraMatrix[12],
      cameraMatrix[13],
      cameraMatrix[14],
    ];

    var up = [0, 1, 0];
    
    mat4.lookAt(cameraMatrix, cameraPosition, [0, edge_length / 2, c.pos[2]], up);
    
    var viewMatrix = cameraMatrix;//mat4.create();
    
    //mat4.invert(viewMatrix, cameraMatrix);
    
    var viewProjectionMatrix = mat4.create();
    
    mat4.multiply(viewProjectionMatrix, projectionMatrix, viewMatrix);
    
  c.drawCube(gl, viewProjectionMatrix, programInfo, deltaTime);
  for(i = 0; i < 3; i++) {
    tracks[i].drawCube(gl, viewProjectionMatrix, programInfo, deltaTime);
  }
  for(i = 0; i < coins.length; i++) 
    if(coins[i].isdraw)
      coins[i].drawCube(gl, viewProjectionMatrix, programInfo, deltaTime);
  for(i = 0; i < 2; i++)
    if(jetpacks[i].isdraw)
      jetpacks[i].drawCube(gl, viewProjectionMatrix, programInfo, deltaTime);
  if(sneaker.isdraw)
    sneaker.drawCube(gl, viewProjectionMatrix, programInfo, deltaTime);
  for(i = 0; i < duck_obs.length; i++)
  {
      duck_obs[i].left_pole.drawCube(gl, viewProjectionMatrix, programInfo, deltaTime);
      duck_obs[i].right_pole.drawCube(gl, viewProjectionMatrix, programInfo, deltaTime);
      duck_obs[i].center.drawCube(gl, viewProjectionMatrix, programInfo, deltaTime);
  }
  if(global_timestamp < 20)
  {
      for(i = 0; i < 2; i++)
        walls[i].drawCube(gl, viewProjectionMatrix, programInfo, deltaTime);
  }
  else
  {
      for(i = 0; i < 2; i++)
        walls[i].drawCube(gl, viewProjectionMatrix, programInfo_flash, deltaTime);
  }
  for(i = 0; i < jump_obs.length; i++)
    jump_obs[i].drawCube(gl, viewProjectionMatrix, programInfo, deltaTime);
  //tracks.drawCube(gl, projectionMatrix, programInfo, deltaTime);

}

//
// Initialize a shader program, so WebGL knows how to draw our data
//
function initShaderProgram(gl, vsSource, fsSource) {
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);
  
  // Create the shader program
  
  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);
  
  // If creating the shader program failed, alert
  
  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
    return null;
  }
  
  return shaderProgram;
}

//
// creates a shader of the given type, uploads the source and
// compiles it.
//
function loadShader(gl, type, source) {
  const shader = gl.createShader(type);
  
  // Send the source to the shader object
  
  gl.shaderSource(shader, source);
  
  // Compile the shader program
  
  gl.compileShader(shader);
  
  // See if it compiled successfully
  
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

main();