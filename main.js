import * as THREE from 'three';
import "./style.css";
import gsap from 'gsap';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';



//goal of the game
//get to the end of the maze without touching the wall and before your timer runs out

// Scene creation
const scene = new THREE.Scene();

// Add camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1500);
camera.position.set(-100, 5.2, 5); // Adjust height to simulate eye level
camera.rotateY(180)
scene.add(camera);

// Load the GLB model
const loader = new GLTFLoader();
loader.load(
    '/glt/Dmaze.gltf',
    function (gltf) {
        const model = gltf.scene;
        scene.add(model);
    },
    function (xhr) {
        console.log((xhr.loaded / xhr.total * 100) + '% loaded');
    },
    function (error) {
        console.error('An error occurred while loading the model', error);
    }
);

// Sizes
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight
};

// Lighting
const ambientLight = new THREE.AmbientLight(0xa0000);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff);
directionalLight.position.set(5, 5, 5).normalize();
scene.add(directionalLight);


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
    gameOver('You hit a wall! Game over.');
    return;
  }

  if (canMoveForward && moveForward) camera.translateZ(-moveSpeed);
  if (canMoveBackward && moveBackward) camera.translateZ(moveSpeed);
  if (canMoveLeft && moveLeft) camera.translateX(-moveSpeed);
  if (canMoveRight && moveRight) camera.translateX(moveSpeed);

 


  renderer.render(scene, camera);
  animationFrameId = requestAnimationFrame(animate);
};

// Timer and game over functionality
let timer = 0;
let timerInterval;

const updateTimer = () => {
  timer--;
  document.getElementById('time').innerText = timer;
  if (timer <= 0) {
    gameOver('Time is up! Game over.');
  }
};

const gameOver = (message) => {
  cancelAnimationFrame(animationFrameId);
  clearInterval(timerInterval);
  document.getElementById('gameOverMessage').innerText = message;
  document.getElementById('gameOver').style.display = 'block';
};


// Start the game
const startGame = () => {
  document.getElementById('mybox').style.display = 'none';
  document.getElementById('gameOver').style.display = 'none';
  timer = 120;
  updateTimer();
  clearInterval(timerInterval);
  timerInterval = setInterval(updateTimer, 1000);
  
  animate();
};


// Restart the game
const restartGame = () => {
  document.getElementById('mybox').style.display = 'flex';
  document.getElementById('gameOver').style.display = 'none';
  location.reload();
  startGame();
};

// Event listeners for start and restart buttons
document.getElementById('start').addEventListener('click', startGame);
document.getElementById('restart').addEventListener('click', restartGame);


/// gsap animation stuff
const tl = gsap.timeline({ defaults: { duration: 1 } });
const t2 = gsap.timeline({ defaults: { duration: 2 } });
const t3 = gsap.timeline({ defaults: { duration: 5 } });
const t4 = gsap.timeline({ defaults: { duration: 10 } });
// Assuming you have a mesh to animate
// t2.fromTo(camera.position, { z: 0, x: 0, y: 0 }, { z: 1, x: 1, y: 1 });
t4.fromTo(".title", { opacity: 1 }, { opacity: 0 });
t2.fromTo("#controls", { opacity: 0.02 }, { opacity: 1 });
tl.fromTo("nav", { y: "-100%" }, { y: "0%" });
t1.fromTo(".infoBox", { opacity:0.1 }, { opacity: 1 });




// //my ideas
// function game() {
//   let timeOutput = document.getElementById('time');
//   let timegiven = 121;
//   let x=0
//   while (x < 121) {

//     timegiven-= 1;
//     timeOutput.innerHTML= timegiven;

//     x++
//     }
//   }

// game()

// idea2
// if (colision <0){
//   end game and output a game over display
//   containing 
//   1.time spent
//   2. restart button 
// }
