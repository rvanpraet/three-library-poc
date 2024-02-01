## 3D Bookshelf setup for JCB Relations Bookshelf

### Design

Figma link at the time, check in with the designer if this is still up to date or if it doesn't work:

[Figma File from 06-11-2023](https://www.figma.com/file/L1P0NzqLHbkp02ZqP6Ah6o/Intermediary-Sprints---JCBL?type=design&node-id=2272-11143&mode=dev)

### Current progress of this project

The app receives a list of mockdata containing the dimension scales for each book entry. These are divided into shelves which are separated in a z-direction. The user can scroll on his current shelf, select or unselect a book and navigate to the current visit page.

#### Model

The concept was made with a free OBJ model from the web. We ofcourse will want to use a model and texture tailered to our design.

#### Book metadata

This concept could be taken further by adding metadata to every book mock and showing it on the left as per design when selecting a book.

Made with THREE.JS

## Installation and Setup Instructions

Clone this repository. You will need `node` and `npm` installed globally on your machine.

Installation:

`npm install`

To Start Server:

`npm run dev`

To Visit App:

`http://localhost:5173/`

## Notable packages and handy links

Most THREE.JS topics are covered in this course, availabale to Fabrique Devs:

[ThreeJS Journey](https://threejs-journey.com/)

[THREE.JS Documentation](https://threejs.org/)

[GSAP](https://gsap.com/docs/v3/)

[Vite Documentation](https://vitejs.dev/) -- _Vite will not be necessary in JCB codebase_
