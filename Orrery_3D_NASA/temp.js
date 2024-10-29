import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.110.0/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.110.0/examples/jsm/controls/OrbitControls.js';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);

const video = document.createElement('video');
video.src = 'movingspace.mp4';
video.loop = true;
video.muted = true;
video.playsInline = true; 
video.autoplay = true;
video.play(); 

const videoTexture = new THREE.VideoTexture(video);
videoTexture.minFilter = THREE.LinearFilter;
videoTexture.magFilter = THREE.LinearFilter;
videoTexture.format = THREE.RGBFormat;
scene.background = videoTexture;

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
camera.position.set(0, 10, 30);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let sunMesh; // To store the Sun mesh

// Speed variable initialized
let speed = 1; 

// Slider event listener to adjust the speed
document.getElementById('speed').addEventListener('input', function(event) {
    speed = parseFloat(event.target.value);
    document.getElementById('speed-value').innerText = speed + 'x';
});

fetch('data.json')
    .then(response => response.json())
    .then(planets => {
        planets.forEach(planetData => {
            if (planetData.center == "Sun") {
                const eccentricity = planetData.eccentricity;
                const orbitRadiusX = planetData.orbitRadiusX;
                const orbitRadiusY = orbitRadiusX * Math.sqrt(1 - Math.pow(eccentricity, 2));

                const orbitCurve = new THREE.EllipseCurve(
                    0, 0,         
                    orbitRadiusX, orbitRadiusY, 
                    0, 2 * Math.PI,  
                    false      
                );

                if (planetData.name != "Sun") {
                    const points = orbitCurve.getPoints(100);
                    const orbitGeometry = new THREE.BufferGeometry().setFromPoints(points);
                    const orbitMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
                    const orbit = new THREE.Line(orbitGeometry, orbitMaterial);
                    orbit.rotation.x = Math.PI / 2;
                    scene.add(orbit);
                }

                const planetGeometry = new THREE.SphereGeometry(planetData.sphereRadius, 32, 32);
                const planetTexture = new THREE.TextureLoader().load(planetData.path);
                const planetMaterial = new THREE.MeshBasicMaterial({ map: planetTexture });
                const planet = new THREE.Mesh(planetGeometry, planetMaterial);

                if (planetData.name === 'Sun') {
                    sunMesh = planet; // Store Sun mesh for raycasting
                }
                scene.add(planet);

                let angle = planetData.angle;

                function animate() {
                    requestAnimationFrame(animate);
                    controls.update();

                    // Adjust speed based on the slider input
                    planet.rotation.y += planetData.rotationSpeed * 0.01 * speed;
                    angle += planetData.revolutionSpeed * 0.01 * speed;

                    const x = orbitRadiusX * Math.cos(angle);
                    const y = orbitRadiusY * Math.sin(angle);
                    planet.position.set(x, 0, y);

                    renderer.render(scene, camera);
                }
                animate();
            }
        });
    })
    .catch(err => console.error('Error loading data file', err));

// Add an event listener to handle mouse clicks
window.addEventListener('click', onClick, false);

// Handle clicks
function onClick(event) {
    // Calculate mouse position in normalized device coordinates (-1 to +1 range)
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Update the raycaster with the camera and mouse position
    raycaster.setFromCamera(mouse, camera);

    // Check for intersections with Sun
    const intersects = raycaster.intersectObject(sunMesh);

    if (intersects.length > 0) {
        displayPopup(); // Display the popup when the Sun is clicked
    }
}

// Function to display the popup
function displayPopup() {
    const popup = document.getElementById('popup');
    popup.style.display = 'block'; // Show the popup
}

// Function to close the popup
function closePopup() {
    const popup = document.getElementById('popup');
    popup.style.display = 'none'; // Hide the popup
}

window.addEventListener("resize", () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
});
