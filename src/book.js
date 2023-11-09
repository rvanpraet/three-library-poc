import gsap from 'gsap';
import * as THREE from 'three';
import { ANIMATION_DURATION, BOOK_GROUP_OFFSET, COLOR_AMERICANA, COLOR_AMERICANA_PINK_LIGHT, COLOR_DURATION } from './constants';

class Book extends THREE.Object3D {
    constructor(obj, group, currentNav, { bookConfig, position, color, interactionManager }) {
        super()

        // this = {...obj}
        // this.instance = obj
        // let object = new THREE.Object3D();
        const object = obj

        // console.log(object)

        object.traverse(( child ) => {
            if ( child.isMesh ) {
                child.material = new THREE.MeshStandardMaterial()
                child.material.color = new THREE.Color(color)
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
        object.position.x = position.x

        // object.scale.set( bookConfig.scale.x * 0.1, bookConfig.scale.y * 0.1, object.scale.z * 0.1)

        const bbox = new THREE.Box3().setFromObject(object);
        this.size = new THREE.Vector3();
        bbox.getSize(this.size);

        // Add interaction effect
        interactionManager.add( object )

        object.addEventListener('mouseover', (event) => {
            if (group.userData.index !== currentNav) return // Ignore mouseover if book is not in active shelf

            document.body.style.cursor = 'pointer'

            // Spotlight effect
            gsap.to(bookSpot.position, { x: object.position.x + BOOK_GROUP_OFFSET, duration: ANIMATION_DURATION })

            // Color hover
            transitionColor(mesh, COLOR_AMERICANA_PINK_LIGHT, COLOR_DURATION)
        });

        object.addEventListener('mouseout', (event) => {
            if (group.userData.index !== currentNav || object === activeBook) return // Ignore mouseout if book is not in active shelf

            document.body.style.cursor = 'default';

            // // Color hovering
            transitionColor(mesh, COLOR_AMERICANA, COLOR_DURATION)
        });

        object.addEventListener('click', () => {
            if (group.userData.index !== currentNav) return // Ignore mouse click event if book is not in active shelf

            const x = object.position.x + 3 + BOOK_GROUP_OFFSET

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
    }
}

export { Book };
