AccessMate - Indoor Navigation Prototype

Project Overview
AccessMate is a digital platform designed to enhance independent mobility for individuals with physical or visual impairments. This repository contains the High-Fidelity Alpha Prototype demonstrating the core navigation logic.

 Technical Implementation
This prototype was developed using standard web technologies to ensure lightweight deployment and broad compatibility.

1. Technology Stack
* Frontend: HTML5, CSS3
* Logic: Vanilla JavaScript (ES6+)
* Graphics: Scalable Vector Graphics (SVG)

2. Key APIs & Techniques
The solution integrates the following standard APIs to achieve accessible navigation:

* Web Speech API (`window.speechSynthesis`):
* Used to generate real-time, turn-by-turn voice instructions.
  * This removes the need for pre-recorded audio files, allowing dynamic text-to-speech synthesis for users with visual impairments.

* SVG Animation (DOM Manipulation):
    * The map is not a static image. It is rendered using SVG paths.
    * JavaScript manipulates the `stroke-dashoffset` CSS property to simulate the "drawing" of the path, creating a visual guide that mimics a walking speed of 1.2 m/s.

* Camera Follow Logic:
    * Implemented using the `requestAnimationFrame` method.
    * This dynamically updates the SVG `viewBox` coordinates to zoom in and follow the user's virtual position, reducing visual clutter and cognitive load.

 How to Run
1.  Download the files or clone this repository.
2.  Open `index.html` in any modern web browser (Chrome, Edge, Firefox).
3.  Click the "Start" button to begin the simulation.
