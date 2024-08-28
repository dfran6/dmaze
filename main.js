import * as THREE from 'three';
import "./style.css";
import gsap from 'gsap';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// Goal of the game
// Get to the end of the maze without touching the wall and before your timer runs out

// Scene creation
const scene = new THREE.Scene();

// Add camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1500);
camera.position.set(-90, 5.2, 5); 
camera.rotateY(180);
scene.add(camera);

// Load the GLtf model

const LM = new THREE.LoadingManager();
LM.onStart = function (url, itemsLoaded, itemsTotal) {
  document.getElementById('loadingP').style.display = 'block';
};
LM.onLoad = function () {
  document.getElementById('loadingP').style.display = 'none';
};


let cup;
const loader = new GLTFLoader(LM);
loader.load(
    '/glt/Dmaze.gltf',
    function (gltf) {
        const model = gltf.scene;
        scene.add(model);
        cup = model.getObjectByName('cup');
    },
    function (xhr) {
        console.log((xhr.loaded / xhr.total * 100) + '% loaded');
    },
    function (error) {
        console.error('An error occurred while loading the model', error);
    }
);

// Load background music and sound effects
const listener = new THREE.AudioListener();
camera.add(listener);

const backgroundMusic = new THREE.Audio(listener);
const winSound = new THREE.Audio(listener);
const loseSound = new THREE.Audio(listener);

const audioLoader = new THREE.AudioLoader();
audioLoader.load('/D-soundz/background_sBtVFsuS.mp3', function(buffer) {
    backgroundMusic.setBuffer(buffer);
    backgroundMusic.setLoop(true);
    backgroundMusic.setVolume(0.2);
});

audioLoader.load('/D-soundz/win.wav', function(buffer) {
    winSound.setBuffer(buffer);
    winSound.setVolume(1);
});

audioLoader.load('/D-soundz/lose.wav', function(buffer) {
    loseSound.setBuffer(buffer);
    loseSound.setVolume(1);
});

// Sizes
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight
};

// Lighting for day and night
const dayAmbientLight = new THREE.AmbientLight(0xADD8E6, 0.5);
scene.add(dayAmbientLight);

const nightAmbientLight = new THREE.AmbientLight(0x2F4F4F, 0.2);
scene.add(nightAmbientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff);
directionalLight.position.set(5, 5, 5).normalize();
scene.add(directionalLight);

// Function to switch between day and night
function switchToDay() {
    dayAmbientLight.intensity = 0.5;
    nightAmbientLight.intensity = 0;
}

function switchToNight() {
    dayAmbientLight.intensity = 0;
    nightAmbientLight.intensity = 0.2;
    
 //Night Sky Shader
const skyGeo = new THREE.SphereGeometry(500, 32, 32);
const skyMat = new THREE.ShaderMaterial({
  uniforms: {
    topColor: { value: new THREE.Color(0x030353) },
    bottomColor: { value: new THREE.Color(0x02022e) },
    offset: { value: 33 },
    exponent: { value: 0.6 }
  },
  vertexShader: `
    varying vec3 vWorldPosition;
    void main() {
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPosition.xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform vec3 topColor;
    uniform vec3 bottomColor;
    uniform float offset;
    uniform float exponent;
    varying vec3 vWorldPosition;
    void main() {
      float h = normalize(vWorldPosition + offset).y;
      gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
    }
  `,
  side: THREE.BackSide
});

const sky = new THREE.Mesh(skyGeo, skyMat);
scene.add(sky);
}

// Sky Shader
const skyGeo = new THREE.SphereGeometry(1000, 32, 32);
const skyMat = new THREE.ShaderMaterial({
  uniforms: {
    topColor: { value: new THREE.Color(0x0077ff) },
    bottomColor: { value: new THREE.Color(0xffffff) },
    offset: { value: 33 },
    exponent: { value: 0.6 }
  },
  vertexShader: `
    varying vec3 vWorldPosition;
    void main() {
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPosition.xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform vec3 topColor;
    uniform vec3 bottomColor;
    uniform float offset;
    uniform float exponent;
    varying vec3 vWorldPosition;
    void main() {
      float h = normalize(vWorldPosition + offset).y;
      gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
    }
  `,
  side: THREE.BackSide
});

const sky = new THREE.Mesh(skyGeo, skyMat);
scene.add(sky);

// Renderer
const canvas = document.querySelector('.webgl');
const renderer = new THREE.WebGLRenderer({ canvas });
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.render(scene, camera);

// Movement and look variables
const moveSpeed = 0.5;
const lookSpeed = 0.002;
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;

// Mouse rotation variables
let isDragging = false;
let previousMousePosition = {
  x: 0,
  y: 0
};

// Event listeners for mouse movement
canvas.addEventListener('mousedown', (event) => {
  isDragging = true;
  previousMousePosition = {
    x: event.clientX,
    y: event.clientY
  };
});

canvas.addEventListener('mouseup', () => {
  isDragging = false;
});

canvas.addEventListener('mousemove', (event) => {
  if (isDragging) {
    const deltaMove = {
      x: event.clientX - previousMousePosition.x,
    };

    camera.rotation.y -= deltaMove.x * lookSpeed;

    previousMousePosition = {
      x: event.clientX,
      y: event.clientY
    };
  }
});

// Touch controls
canvas.addEventListener('touchstart', (event) => {
  if (event.touches.length === 1) {
    isDragging = true;
    previousMousePosition = {
      x: event.touches[0].clientX,
      y: event.touches[0].clientY
    };
  }
});

canvas.addEventListener('touchmove', (event) => {
  if (isDragging) {
    const deltaMove = {
      x: event.touches[0].clientX - previousMousePosition.x,
    };

    camera.rotation.y -= deltaMove.x * lookSpeed;

    previousMousePosition = {
      x: event.touches[0].clientX,
      y: event.touches[0].clientY
    };
  }
});

canvas.addEventListener('touchend', () => {
  isDragging = false;
});

// Prevent zooming and scaling
document.addEventListener('wheel', (event) => {
  event.preventDefault();
});

// Directional buttons
const forwardButton = document.getElementById('forward');
const backwardButton = document.getElementById('backward');
const leftButton = document.getElementById('left');
const rightButton = document.getElementById('right');

forwardButton.addEventListener('mousedown', () => { moveForward = true; });
forwardButton.addEventListener('mouseup', () => { moveForward = false; });
backwardButton.addEventListener('mousedown', () => { moveBackward = true; });
backwardButton.addEventListener('mouseup', () => { moveBackward = false; });
leftButton.addEventListener('mousedown', () => { moveLeft = true; });
leftButton.addEventListener('mouseup', () => { moveLeft = false; });
rightButton.addEventListener('mousedown', () => { moveRight = true; });
rightButton.addEventListener('mouseup', () => { moveRight = false; });

// Touch controls for movement
forwardButton.addEventListener('touchstart', () => { moveForward = true; });
forwardButton.addEventListener('touchend', () => { moveForward = false; });
backwardButton.addEventListener('touchstart', () => { moveBackward = true; });
backwardButton.addEventListener('touchend', () => { moveBackward = false; });
leftButton.addEventListener('touchstart', () => { moveLeft = true; });
leftButton.addEventListener('touchend', () => { moveLeft = false; });
rightButton.addEventListener('touchstart', () => { moveRight = true; });
rightButton.addEventListener('touchend', () => { moveRight = false; });

// Keyboard controls
document.addEventListener('keydown', (event) => {
  switch (event.code) {
    case 'KeyW':
    case 'ArrowUp':
      moveForward = true;
      break;
    case 'KeyS':
    case 'ArrowDown':
      moveBackward = true;
      break;
    case 'KeyA':
    case 'ArrowLeft':
      moveLeft = true;
      break;
    case 'KeyD':
    case 'ArrowRight':
      moveRight = true;
      break;
  }
});

document.addEventListener('keyup', (event) => {
  switch (event.code) {
    case 'KeyW':
    case 'ArrowUp':
      moveForward = false;
      break;
    case 'KeyS':
    case 'ArrowDown':
      moveBackward = false;
      break;
    case 'KeyA':
    case 'ArrowLeft':
      moveLeft = false;
      break;
    case 'KeyD':
    case 'ArrowRight':
      moveRight = false;
      break;
  }
});

// Raycasters for collision detection
const raycaster = new THREE.Raycaster();
const collisionDistance = 3.5;

const checkCollision = (direction) => {
  raycaster.set(camera.position, direction);
  const intersects = raycaster.intersectObjects(scene.children, true);
  return intersects.length > 0 && intersects[0].distance < collisionDistance;
};

// Resize handling
window.addEventListener('resize', () => {
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();
  renderer.setSize(sizes.width, sizes.height);
});

// Handle orientation change
window.addEventListener('orientationchange', () => {
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();
  renderer.setSize(sizes.width, sizes.height);
});

// Animation loop
let animationFrameId;
const animate = () => {
  let canMoveForward = true;
  let canMoveBackward = true;
  let canMoveLeft = true;
  let canMoveRight = true;

  if (moveForward) canMoveForward = !checkCollision(new THREE.Vector3(0, 0, -1));
  if (moveBackward) canMoveBackward = !checkCollision(new THREE.Vector3(0, 0, 1));
  if (moveLeft) canMoveLeft = !checkCollision(new THREE.Vector3(-1, 0, 0));
  if (moveRight) canMoveRight = !checkCollision(new THREE.Vector3(1, 0, 0));

  if (!canMoveForward || !canMoveBackward || !canMoveLeft || !canMoveRight) {
    gameOver('You hit a wall! Game over. ' + 'Play time: ' + (120 - timer) + ' seconds');
    return;
  }

  if (canMoveForward && moveForward) camera.translateZ(-moveSpeed);
  if (canMoveBackward && moveBackward) camera.translateZ(moveSpeed);
  if (canMoveLeft && moveLeft) camera.translateX(-moveSpeed);
  if (canMoveRight && moveRight) camera.translateX(moveSpeed);

  // Switch between day and night based on current time
  const currentTime = new Date().getHours();
  if (currentTime >= 6 && currentTime < 18) {
    switchToDay();
  } else {
    switchToNight();
  }

  renderer.render(scene, camera);
  animationFrameId = requestAnimationFrame(animate);
};

// Timer and game over functionality
let timer = 0;
let timerInterval;

const updateTimer = () => {
  timer--;
  document.getElementById('time').innerText = `${timer} sec`;
  if (timer <= 0) {
    gameOver('Time is up! Game over. ' + 'Play time: ' + (120 - timer) + ' seconds');
  }
};

const gameOver = (message) => {
  cancelAnimationFrame(animationFrameId);
  clearInterval(timerInterval);
  document.getElementById('gameOverMessage').innerText = message;
  document.getElementById('gameOver').style.display = 'block';
  loseSound.play();  // Play lose sound effect
};

// Raycaster for detecting clicks
const clickRaycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Event listener for mouse clicks
canvas.addEventListener('mousedown', (event) => {
  // Convert mouse position to normalized device coordinates
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
  
  // Set the raycaster from the camera and mouse position
  clickRaycaster.setFromCamera(mouse, camera);
  
  // Calculate objects intersecting the picking ray
  const intersects = clickRaycaster.intersectObjects(scene.children, true);
  
  if (intersects.length > 0 && intersects[0].object === cup) {
    winGame();
  }
});

// Start the game
const startGame = () => {
  document.getElementById('mybox').style.display = 'none';
  document.getElementById('gameOver').style.display = 'none';
  document.getElementById('winnerMessage').style.display = 'none';
  timer = 120;
  updateTimer();
  clearInterval(timerInterval);
  timerInterval = setInterval(updateTimer, 1000);
  camera.position.set(-90, 5.2, 5); 
  backgroundMusic.play();
  animate();
};

// Restart the game
const restartGame = () => {
  document.getElementById('mybox').style.display = 'block';
  document.getElementById('gameOver').style.display = 'none';
  document.getElementById('winnerMessage').style.display = 'none';
  startGame();
};

//game reload
const reloadGame = () =>{
  location.reload();
}

// Function to handle winning the game
const winGame = () => {
  cancelAnimationFrame(animationFrameId);
  document.getElementById('winnerMessage').style.display = 'block';
  document.getElementById('win').style.display = 'block';
  document.getElementById('time1').innerText= 'Play time: ' + (120 - timer) + ' seconds';
  clearInterval(timerInterval);
  winSound.play();  // Play win sound effect
};

// Event listeners for start and restart buttons
document.getElementById('start').addEventListener('click', startGame);
document.getElementById('restart').addEventListener('click', restartGame);
document.getElementById('reload').addEventListener('click', reloadGame);

document.getElementById('openInfobox').addEventListener('click', () => {
  document.querySelector('.infoBox').style.display = 'block';
  document.querySelector('.infoBox2').style.display = 'none';
});

document.getElementById('closeInfobox').addEventListener('click', () => {
  document.querySelector('.infoBox').style.display = 'none';
});

document.getElementById('openInfobox2').addEventListener('click', () => {
  document.querySelector('.infoBox2').style.display = 'block';
  document.querySelector('.infoBox').style.display = 'none';

});

document.getElementById('closeInfobox2').addEventListener('click', () => {
  document.querySelector('.infoBox2').style.display = 'none';
});

// gsap animation stuff
const tl = gsap.timeline({ defaults: { duration: 1 } });
const t2 = gsap.timeline({ defaults: { duration: 2 } });
const t3 = gsap.timeline({ defaults: { duration: 5 } });
const t4 = gsap.timeline({ defaults: { duration: 20 } });

t4.fromTo(".title", { opacity: 1 }, { opacity: 0 });
t2.fromTo("#controls", { opacity: 0.02 }, { opacity: 1 });
tl.fromTo("nav", { y: "-100%" }, { y: "0%" });
t2.fromTo("div.infoBox", { opacity: 0.1 }, { opacity: 1 });
t3.fromTo("div.infoBox", { y: "-100%" }, { y: "0%" });
t2.fromTo("canvas.webgl", { y: "100%" }, { y: "0%" });

//glory be to God!!
