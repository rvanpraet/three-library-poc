import gsap from 'gsap';
import * as dat from 'lil-gui';
import * as THREE from 'three';
import { InteractionManager } from 'three.interactive';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
// import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { mockBooksConfig, transitionColor } from './utils';

/**
 * Base constants
 */

// Duration
const COLOR_DURATION = .35
const ANIMATION_DURATION = .75;

const animationProps = {
    duration: ANIMATION_DURATION,
    ease: 'ease-in-out',
}

// Colors
const COLOR_AMERICANA = 0xFAF9F8
const COLOR_AMERICANA_PINK_LIGHT = 0xFFCCCB
const COLOR_AMERICANA_DARK = 0xEAF9F8

// Offsets
const BOOK_GROUP_OFFSET = -15

/**
 * Base
 */

let buttonAnimating = false
let currentNav = 0
let activeBook = null
let booksGroup = new THREE.Group();
const mouse = new THREE.Vector2()

// Debug
const gui = new dat.GUI()
const axesHelper = new THREE.AxesHelper()

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

scene.add(axesHelper)

/**
 * Loading Manager
 */
const onLoad = () => {
    // gui.add( object.children[0].material, 'shininess', 0, 100 );
    // gui.add( object.children[0].material, 'roughness', 0, 1 );

    // booksGroup.position.z = 2
    booksGroup.position.x = BOOK_GROUP_OFFSET

    scene.add( booksGroup );
    console.log('manager onload', scene)
}
const manager = new THREE.LoadingManager( onLoad )

/**
 * Texture loader
 */
const textureLoader = new THREE.TextureLoader( manager );
const texture = textureLoader.load( 'textures/OldBook001_tex.png' );
const colorTexture = textureLoader.load( 'textures/white_oak/color.png' );
const paintDisplace = textureLoader.load( 'textures/white_oak/displacement.png' );
const paintNormal = textureLoader.load( 'textures/white_oak/normal.png' );
const paintMetalness = textureLoader.load( 'textures/white_oak/metalness.png' );
const paintRoughness = textureLoader.load( 'textures/white_oak/roughness.png' );
const paintAO = textureLoader.load( 'textures/white_oak/ao.png' );

// colorTexture.wrapS = THREE.MirroredRepeatWrapping
// colorTexture.wrapT = THREE.MirroredRepeatWrapping

/**
 * OBJ Loader
 */
const objLoader = new OBJLoader( manager )
// objLoader.load(
//     'models/books/book_02.obj',
//     (object) => {
//         object.traverse(( child ) => {
//             if ( child.isMesh ) {
//                 // child.material = new THREE.MeshStandardMaterial()
//                 // child.material.color = new THREE.Color(0xffffff)
//                 // child.material.map = texture;
//                 // child.material.shininess = 0;
//                 // child.material.roughness = 1;
//             }
//         } );
//         object.position.set(0, 0, 0)

//         object.castShadow = true
//         object.rotation.y = Math.PI * 0.5

//         booksGroup.add( object )
//     }
// )

// Slice book data into multiple arrays
const entriesPerArray = 80;
const twoDimArray = [];

// Loop through the original array and create subarrays of the specified size
for (let i = 0; i < mockBooksConfig.length; i += entriesPerArray) {
    const subarray = mockBooksConfig.slice(i, i + entriesPerArray);
    twoDimArray.push(subarray);
}

// Iterate through
twoDimArray.forEach((subarray, index) => {
    const group = new THREE.Group()
    const gap = 0.02
    let currentX = 0

    subarray.forEach((bookConfig, index) => {
        objLoader.load(
            'models/books/book_1.obj',
            (object) => {
                object.traverse(( child ) => {
                    if ( child.isMesh ) {
                        child.material = new THREE.MeshStandardMaterial()
                        child.material.color = new THREE.Color(COLOR_AMERICANA)
                        // child.material.map = texture;
                        // child.material.shininess = 0;
                        // child.material.roughness = 1;
                    }
                } );

                // Rotate book in the right direction
                object.castShadow = true
                object.rotation.y = Math.PI * 0.5

                const mesh = object.children[0]

                // Scale and position according to config
                object.scale.z = bookConfig.scale.z
                object.scale.y = bookConfig.scale.y
                object.position.x = currentX

                // object.scale.set( bookConfig.scale.x * 0.1, bookConfig.scale.y * 0.1, object.scale.z * 0.1)

                const bbox = new THREE.Box3().setFromObject(object);
                const size = new THREE.Vector3();
                bbox.getSize(size);

                currentX += (size.x + gap)

                // Add interaction effect
                interactionManager.add( object )

                object.addEventListener('mouseover', (event) => {
                    if (object.parent.userData.index !== currentNav) return // Ignore mouseover if book is not in active shelf

                    document.body.style.cursor = 'pointer'

                    // Spotlight effect
                    gsap.to(bookSpot.position, { x: object.position.x + BOOK_GROUP_OFFSET, duration: ANIMATION_DURATION })

                    // Color hover
                    transitionColor(mesh, COLOR_AMERICANA_PINK_LIGHT, COLOR_DURATION)
                });

                object.addEventListener('mouseout', (event) => {
                    if (object.parent.userData.index !== currentNav || object === activeBook) return // Ignore mouseout if book is not in active shelf

                    document.body.style.cursor = 'default';

                    // // Color hovering
                    transitionColor(mesh, COLOR_AMERICANA, COLOR_DURATION)
                });

                object.addEventListener('click', (e) => {
                    if (object.parent.userData.index !== currentNav) return // Ignore mouse click event if book is not in active shelf

                    e.stopPropagation();

                    const x = object.position.x + 3 + BOOK_GROUP_OFFSET
                    // const y = object.position.y + 4
                    // const z = object.position.z + 8

                    // Reset previous rotation effect
                    if (activeBook) {
                        // Rotation effect
                        transitionColor(activeBook.children[0], COLOR_AMERICANA, COLOR_DURATION)
                        gsap.to(activeBook.rotation, { x: 0, duration: ANIMATION_DURATION })
                        gsap.to(activeBook.position, { y: 0, z: 0, duration: ANIMATION_DURATION })
                    }

                    if (activeBook === object) {
                        activeBook = null
                    } else {
                        // Rotation effect
                        gsap.to(object.rotation, { x: Math.PI * 0.1, duration: ANIMATION_DURATION })
                        gsap.to(object.position, { y: 0.5, z: 0.5, duration: ANIMATION_DURATION })
                        activeBook = object
                    }

                    gsap.to(camera.position, { x, duration: ANIMATION_DURATION })
                })

                // Add to booksheft group
                group.add( object );
            }
        )
    })

    // Shelf
    const shelf = new THREE.Mesh(
        new THREE.BoxGeometry(37.5, 1.6, 0.5),
        new THREE.MeshStandardMaterial({
            color: COLOR_AMERICANA,

            // map: colorTexture,
            // aoMap: paintAO,
            // aoMapIntensity: 1,
            // normalMap: paintNormal,
            // // normalScale: 1,
            // metalnessMap: paintMetalness,
            // roughnessMap: paintRoughness,

            metalness: 0,
            roughness: 1,
            side: THREE.DoubleSide
        })
    )
    shelf.receiveShadow = true
    shelf.position.x = 16.75
    shelf.position.y = -0.251
    shelf.position.z = -.1
    shelf.rotation.x = - Math.PI * 0.5

    // group.add(shelf)
    group.position.z = index * -8
    group.userData.index = index

    booksGroup.add( group )
})

/**
 * Background
 */
// scene.background = new THREE.Color(0x000000);
// scene.fog = new THREE.Fog( 0x000000, 5, 15 );

scene.background = new THREE.Color(COLOR_AMERICANA);
scene.fog = new THREE.Fog( COLOR_AMERICANA, 2, 15 );

/**
 * Lights
 */
const ambientLight = new THREE.AmbientLight(COLOR_AMERICANA, 0.6)
scene.add(ambientLight)

// PointLight
const bookSpot = new THREE.PointLight(COLOR_AMERICANA_PINK_LIGHT, 0.6, 6, 2)
const bookSpotHelper = new THREE.PointLightHelper( bookSpot )
bookSpot.position.set(0, 2, 6)
bookSpot.rotation.x = Math.PI / 2
scene.add( bookSpot )
// scene.add( bookSpotHelper )

// Directional light
const directionalLight = new THREE.DirectionalLight(COLOR_AMERICANA_DARK, 0.35)
const directionalHelper = new THREE.DirectionalLightHelper( directionalLight )
directionalLight.castShadow = true
directionalLight.shadow.mapSize.set(1024, 1024)
directionalLight.shadow.camera.far = 15
directionalLight.shadow.camera.left = - 7
directionalLight.shadow.camera.top = 7
directionalLight.shadow.camera.right = 7
directionalLight.shadow.camera.bottom = - 7
// directionalLight.position.set(-5, 5, 5)
directionalLight.position.set(-10, 10, 10)
scene.add(directionalLight)
// scene.add( directionalHelper )

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * User scroll and movement behaviour
 */

// Keep track of mouse x and y coordinates
function onDocumentMouseMove(event) {
    event.preventDefault();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}
document.addEventListener('mousemove', onDocumentMouseMove, false);


// Define the threshold for scroll intensity
// Initialize the variable to store the previous scroll position
const threshold = 25;
let previousScrollY = 0;

// Event listener for scroll
window.addEventListener('wheel', (event) => {
    const scrollDistance = previousScrollY + event.deltaY;

    if (Math.abs(scrollDistance) >= threshold) {
        // Your custom logic here
        // Update the position, rotation, or any other property of your 3D objects
        if (scrollDistance > 0) nextBtn.click()
        if (scrollDistance < 0) prevBtn.click()

        previousScrollY = scrollY;
    }
});

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(60, sizes.width / sizes.height, 0.1, 100)
const cameraTarget = new THREE.Object3D()
camera.position.set(3, 4, 6)
cameraTarget.position.set(0, 1, 0)
camera.lookAt(cameraTarget.position)
scene.add(camera)

// Controls
// const controls = new OrbitControls(camera, canvas)
// controls.target.set(0, 0.75, 0)
// controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

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
const clock = new THREE.Clock()
let previousTime = 0

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()
    const deltaTime = elapsedTime - previousTime
    previousTime = elapsedTime

    // Cursor moving shelf position
    if (!buttonAnimating) {
        if (mouse.x > 0.25 && mouse.y < -0.25) {
            camera.position.x -= (mouse.y - mouse.x) * 0.05
        }
        // Top left case
        if (mouse.x < -0.25 && mouse.y > 0.1) {
            camera.position.x += (mouse.x - mouse.y) * 0.075
        }
    }


    // Update IM
    interactionManager.update();

    // Update controls
    // controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()

// Button listeners
const onNavClick = (direction) => {
    if (
        buttonAnimating ||
        (direction < 0 && currentNav <= 0) ||
        (direction > 0 && currentNav >= twoDimArray.length -1)
    ) return

    buttonAnimating = true

    // Reset all transformations on the current active book shelf
    booksGroup.children[currentNav].children.forEach(book => {
        if (book.isGroup) {
            transitionColor(book.children[0], COLOR_AMERICANA, COLOR_DURATION)
        }
        gsap.to(book.rotation, { x: 0, duration: ANIMATION_DURATION })
        gsap.to(book.position, { y: 0, z: 0, duration: ANIMATION_DURATION })
    })

    activeBook = null
    currentNav += direction

    gsap.to(camera.position, { z: currentNav * -8 + 6, onComplete: () => { buttonAnimating = false }, ...animationProps })
}

const prevBtn = document.querySelector('.nav-previous')
prevBtn.addEventListener('click', () => { onNavClick(-1) })

const nextBtn = document.querySelector('.nav-next')
nextBtn.addEventListener('click', () => { onNavClick(1) })