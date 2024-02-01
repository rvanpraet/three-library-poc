import gsap from "gsap";
import * as dat from "lil-gui";
import * as THREE from "three";
import { InteractionManager } from "three.interactive";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";
import { mockBooksConfig, transitionColor } from "./utils";

/**
 * Base constants
 */

// Duration
const COLOR_DURATION = 0.35;
const ANIMATION_DURATION = 0.75;

const animationProps = {
  duration: ANIMATION_DURATION,
  ease: "ease-in-out",
};

// Colors
const COLOR_AMERICANA = 0xfaf9f8;
const COLOR_AMERICANA_PINK_LIGHT = 0xffcccb;
const COLOR_AMERICANA_DARK = 0xeaf9f8;

// Offsets
const BOOK_GROUP_OFFSET = -15;

const MAX_RANGE = 50;
const MIN_RANGE = MAX_RANGE / 2;

/**
 * Base
 */

let isPageTransitioning = false; // To prevent anything from happening while page is transitioning
let isShelfTransitioning = false; // To prevent anything from happening while shelf is transitioning
let currentNav = 0; // Current active book shelf
let activeBook = null; // Current active book
let booksGroup = new THREE.Group();

// Debug
const config = {
  visit: onVisitClick,
  numParticles: 30000,
};
const gui = new dat.GUI();
const axesHelper = new THREE.AxesHelper();
gui.add(config, "visit");

// Canvas
const canvas = document.querySelector("canvas.webgl");

// Scene
const scene = new THREE.Scene();

scene.add(axesHelper);

/**
 * Loading Manager
 */
const onLoad = () => {
  // gui.add( object.children[0].material, 'shininess', 0, 100 );
  // gui.add( object.children[0].material, 'roughness', 0, 1 );

  // booksGroup.position.z = 2
  booksGroup.position.x = BOOK_GROUP_OFFSET;

  scene.add(booksGroup);
  console.log("manager onload", scene);
};
const manager = new THREE.LoadingManager(onLoad);

/**
 * Texture loader
 */
const textureLoader = new THREE.TextureLoader(manager);
const texture = textureLoader.load("textures/OldBook001_tex.png"); // Can be used to replace the texture on each book

/**
 * OBJ Loader
 */
const objLoader = new OBJLoader(manager);

/**
 * Creating the shelves
 *
 * To create the shelves, we need to create subarrays of the original data array
 */
const booksPerShelf = 80;
const bookShelves = [];

// Loop through the original array and create subarrays of the specified size
for (let i = 0; i < mockBooksConfig.length; i += booksPerShelf) {
  const subarray = mockBooksConfig.slice(i, i + booksPerShelf);
  bookShelves.push(subarray);
}

// Iterate through the bookShelves array and create the shelves
bookShelves.forEach((bookShelf, index) => {
  const shelfGroup = new THREE.Group();
  const gap = 0.02; // The gap between each book
  let currentX = 0; // The current x position of the book, this is where the left bound of the next book will be placed

  // Iterate through the bookShelf array and create the books based on their given configuration
  bookShelf.forEach((bookConfig, index) => {
    // Load the book model -- This is currently a placeholder model
    objLoader.load("models/books/book_1.obj", (object) => {
      object.traverse((child) => {
        if (child.isMesh) {
          child.material = new THREE.MeshStandardMaterial({
            transparent: true,
          });
          child.material.color = new THREE.Color(COLOR_AMERICANA);

          // // Uncomment this to use the mock texture
          // child.material.map = texture;
          // child.material.shininess = 0;
          // child.material.roughness = 1;
        }
      });

      // Rotate book in the right direction
      object.castShadow = true;
      object.rotation.y = Math.PI * 0.5;

      // The mesh is tucked away in the children array of the object, retrieve it
      const mesh = object.children[0];

      // Scale and position according to config
      object.scale.z = bookConfig.scale.z;
      object.scale.y = bookConfig.scale.y;
      object.position.x = currentX;

      // Calculate the size of the book from it's bounding box
      const bbox = new THREE.Box3().setFromObject(object);
      const size = new THREE.Vector3();
      bbox.getSize(size);

      // Calculate the position of the next book by adding the x-size of the current book and the gap
      currentX += size.x + gap;

      /**
       * Book interaction
       */
      interactionManager.add(object);

      // Mouse over
      object.addEventListener("mouseover", (event) => {
        // Ignore mouseover if book is not in active shelf
        if (object.parent.userData.index !== currentNav) return;

        document.body.style.cursor = "pointer";

        // Spotlight effect
        gsap.to(bookSpot.position, {
          x: object.position.x + BOOK_GROUP_OFFSET,
          duration: ANIMATION_DURATION,
        });

        // Color hover
        transitionColor(mesh, COLOR_AMERICANA_PINK_LIGHT, COLOR_DURATION);
      });

      // Mouse out
      object.addEventListener("mouseout", (event) => {
        // Ignore mouseout if book is not in active shelf
        if (
          object.parent.userData.index !== currentNav ||
          object === activeBook
        )
          return;

        document.body.style.cursor = "default";

        transitionColor(mesh, COLOR_AMERICANA, COLOR_DURATION);
      });

      object.addEventListener("click", (e) => {
        // Ignore mouse click event if book is not in active shelf
        if (object.parent.userData.index !== currentNav) return;

        e.stopPropagation(); // Stops raycaster clicks after first clicked mesh

        // Reset previous active book if there is one
        if (activeBook) {
          // Rotation effect
          transitionColor(
            activeBook.children[0],
            COLOR_AMERICANA,
            COLOR_DURATION
          );
          gsap.to(activeBook.rotation, { x: 0, duration: ANIMATION_DURATION });
          gsap.to(activeBook.position, {
            y: 0,
            z: 0,
            duration: ANIMATION_DURATION,
          });
        }

        // If clicking on the active book, no more book is active0
        if (activeBook === object) {
          activeBook = null;
        }

        // Clicking on an active book sets it to active state
        else {
          // Rotation effect
          gsap.to(object.rotation, {
            x: Math.PI * 0.1,
            duration: ANIMATION_DURATION,
          });
          gsap.to(object.position, {
            y: 0.5,
            z: 0.5,
            duration: ANIMATION_DURATION,
          });

          activeBook = object;
        }

        // Update camera position to focus the active book
        const xCam = object.position.x + 3 + BOOK_GROUP_OFFSET;
        gsap.to(camera.position, { x: xCam, duration: ANIMATION_DURATION });
      });

      // Add metadata
      object.userData.type = "bookModel";

      // Add to booksheft group
      shelfGroup.add(object);
    });
  });

  // Create shelf
  const shelf = new THREE.Mesh(
    new THREE.BoxGeometry(37.5, 1.6, 0.5),
    new THREE.MeshStandardMaterial({
      color: COLOR_AMERICANA,
      side: THREE.DoubleSide,
    })
  );
  shelf.receiveShadow = true;
  shelf.position.x = 16.75;
  shelf.position.y = -0.251;
  shelf.position.z = -0.1;
  shelf.rotation.x = -Math.PI * 0.5;

  // // Add shelf to shelf group
  // shelfGroup.add(shelf);

  shelfGroup.position.z = index * -8;
  shelfGroup.userData.index = index;

  booksGroup.add(shelfGroup);
});

/**
 * Background
 */
scene.background = new THREE.Color(COLOR_AMERICANA);
scene.fog = new THREE.Fog(COLOR_AMERICANA, 3, 10);

/**
 * Lights
 */
const ambientLight = new THREE.AmbientLight(COLOR_AMERICANA, 0.6);
scene.add(ambientLight);

// PointLight
const bookSpot = new THREE.PointLight(COLOR_AMERICANA_PINK_LIGHT, 0.6, 6, 2);
bookSpot.position.set(0, 2, 6);
bookSpot.rotation.x = Math.PI / 2;
scene.add(bookSpot);

// // Bookspot helper, uncomment to show the helper
// const bookSpotHelper = new THREE.PointLightHelper(bookSpot);
// scene.add( bookSpotHelper )

// Directional light
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.25);
const directionalHelper = new THREE.DirectionalLightHelper(directionalLight);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.set(1024, 1024);
directionalLight.shadow.camera.far = 15;
directionalLight.shadow.camera.left = -7;
directionalLight.shadow.camera.top = 7;
directionalLight.shadow.camera.right = 7;
directionalLight.shadow.camera.bottom = -7;
directionalLight.position.set(-10, 10, 10);
scene.add(directionalLight);
// scene.add( directionalHelper )

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
};

window.addEventListener("resize", () => {
  // Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;

  // Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  // Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

/**
 * Scrolling behavior
 */

// Scroll speed
const cameraSpeed = 0.01;

// Event listener for scroll
window.addEventListener("wheel", (event) => {
  const x = camera.position.x + event.deltaY * cameraSpeed;

  gsap.to(camera.position, { x, ...animationProps });
});

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(
  60,
  sizes.width / sizes.height,
  0.1,
  100
);
const cameraTarget = new THREE.Object3D();
camera.position.set(3, 4, 6);
cameraTarget.position.set(0, 1, 0); // Heighten the look at position to avoid looking at the bottom of the books
camera.lookAt(cameraTarget.position);
scene.add(camera);

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
});
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

/**
 * Interaction Manager
 */
const interactionManager = new InteractionManager(
  renderer,
  camera,
  renderer.domElement
);

/**
 * Animate
 */
const clock = new THREE.Clock();
let previousTime = 0;

const tick = () => {
  const elapsedTime = clock.getElapsedTime();
  const deltaTime = elapsedTime - previousTime;
  previousTime = elapsedTime;

  // Update IM
  interactionManager.update();

  // Render
  renderer.render(scene, camera);

  // Call tick again on the next frame
  window.requestAnimationFrame(tick);
};

tick();

/**
 * Button event listeners
 */

// Navigation function
const onNavClick = (direction) => {
  if (
    isShelfTransitioning ||
    (direction < 0 && currentNav <= 0) ||
    (direction > 0 && currentNav >= bookShelves.length - 1)
  )
    return;

  isShelfTransitioning = true;

  // Reset all transformations on the current active book shelf
  booksGroup.children[currentNav].children.forEach((book) => {
    if (book.isGroup) {
      transitionColor(book.children[0], COLOR_AMERICANA, COLOR_DURATION);
    }
    gsap.to(book.rotation, { x: 0, duration: ANIMATION_DURATION });
    gsap.to(book.position, { y: 0, z: 0, duration: ANIMATION_DURATION });
  });

  activeBook = null;
  currentNav += direction;

  gsap.to(camera.position, {
    z: currentNav * -8 + 6,
    onComplete: () => {
      isShelfTransitioning = false;
    },
    ...animationProps,
  });
};

// Previous shelf
const prevBtn = document.querySelector(".nav-previous");
prevBtn.addEventListener("click", () => {
  onNavClick(-1);
});

// Next shelf
const nextBtn = document.querySelector(".nav-next");
nextBtn.addEventListener("click", () => {
  onNavClick(1);
});

// Visit the selected book, this will trigger an animation and then redirect to the book page
function onVisitClick() {
  if (!activeBook || isShelfTransitioning || isPageTransitioning) return;

  isPageTransitioning = true;

  // Rotate book to correct position
  transitionColor(activeBook.children[0], COLOR_AMERICANA, COLOR_DURATION); // Reset color state of active book

  // Rotate the book
  // Move camera in front of the book
  gsap.to(activeBook.rotation, { x: 0, y: 0, duration: ANIMATION_DURATION });
  gsap.to(activeBook.position, { y: 0, duration: ANIMATION_DURATION });
  gsap.to(camera.position, {
    x: camera.position.x - 3,
    y: 1.5,
    duration: ANIMATION_DURATION,
  });
  gsap.to(camera.rotation, { x: 0, y: 0, z: 0, duration: ANIMATION_DURATION });

  // Only redirect on animation completion
  const onComplete = () => {
    window.location.href =
      "https://americana.jcblibrary.org/search/object/jcbcap-991004232549706966/";
  };

  // Move camera 'into' the book
  gsap.to(camera.position, {
    z: camera.position.z - 4,
    duration: ANIMATION_DURATION,
    delay: ANIMATION_DURATION * 0.8,
    onComplete,
  });
  gsap.to(activeBook.children[0].material, {
    opacity: 0,
    duration: ANIMATION_DURATION,
    delay: ANIMATION_DURATION * 1.5,
  });

  // Fade away all other books
  // Possible to optimize this by only fading away the books that are not in the current shelf
  const fadeChildren = (object = scene, exceptionArray = []) => {
    // Skip active book
    if (object.uuid === activeBook.uuid) {
      return;
    }

    // Found model group
    if (object.userData.type !== "bookModel" && object.children.length) {
      object.children.forEach((childObj) => {
        fadeChildren(childObj);
      });
    }

    // Look for model group
    else if (object.isGroup) {
      const mesh = object.children[0];

      const deltaX = object.position.x - activeBook.position.x;
      gsap.to(object.position, {
        x: object.position.x + deltaX * 3,
        duration: ANIMATION_DURATION,
      });
      gsap.to(mesh.material, {
        opacity: 0,
        duration: ANIMATION_DURATION,
        delay: ANIMATION_DURATION * 0.4,
      });
    }
  };

  fadeChildren(scene);
}

// Add visit listener
const visitBtn = document.querySelector(".visit-button");
visitBtn.addEventListener("click", onVisitClick);
