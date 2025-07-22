import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

document.addEventListener('DOMContentLoaded', () => {
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x000000, 50, 300);

  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.z = 50;

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  const tooltip = document.getElementById("tooltip");
  const infoBox = document.getElementById("planetInfo");

  const sun = new THREE.Mesh(
    new THREE.SphereGeometry(4, 64, 64),
    new THREE.MeshBasicMaterial({ color: '#FFD700' })
  );
  scene.add(sun);

  scene.add(new THREE.AmbientLight(0x404040, 1.2));
  const light = new THREE.PointLight(0xffffff, 3, 10000);
  light.position.set(0, 0, 0);
  scene.add(light);

  const planetData = [
    { name: "Mercury", color: '#909090', size: 0.4, distance: 7, moons: 0, temp: "167°C" },
    { name: "Venus", color: '#D4AF37', size: 0.9, distance: 10, moons: 0, temp: "464°C" },
    { name: "Earth", color:'#1E90FF', size: 1, distance: 13, moons: 1, temp: "15°C" },
    { name: "Mars", color: '#B22222', size: 0.8, distance: 16, moons: 2, temp: "-65°C" },
    { name: "Jupiter", color: '#D2B48C', size: 2.5, distance: 20, moons: 79, temp: "-110°C" },
    { name: "Saturn", color: '#F5DEB3', size: 2.2, distance: 25, moons: 83, temp: "-140°C" },
    { name: "Uranus", color: '#40E0D0', size: 1.7, distance: 30, moons: 27, temp: "-195°C" },
    { name: "Neptune", color: '#000080', size: 1.6, distance: 35, moons: 14, temp: "-200°C" },
  ];

  const planets = [];
  const orbitSpeeds = {};

  planetData.forEach((planet, index) => {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(planet.size, 32, 32),
      new THREE.MeshPhongMaterial({ color: planet.color })
    );
    mesh.position.x = planet.distance;
    mesh.userData = planet;
    scene.add(mesh);

    const ring = new THREE.Mesh(
      new THREE.RingGeometry(planet.distance - 0.05, planet.distance + 0.05, 64),
      new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide })
    );
    ring.rotation.x = Math.PI / 2;
    scene.add(ring);

    planets.push({ mesh, distance: planet.distance });
    orbitSpeeds[planet.name] = 0.01 + index * 0.002;

    const sliderContainer = document.createElement("div");
    sliderContainer.className = "slider-container";

    const label = document.createElement("label");
    label.textContent = planet.name + " Speed";
    sliderContainer.appendChild(label);

    const input = document.createElement("input");
    input.type = "range";
    input.min = "0";
    input.max = "0.1";
    input.step = "0.001";
    input.value = orbitSpeeds[planet.name];
    input.addEventListener("input", () => {
      orbitSpeeds[planet.name] = parseFloat(input.value);
    });
    sliderContainer.appendChild(input);
    document.getElementById("sliders").appendChild(sliderContainer);
  });

  // Background stars
  const starsGeometry = new THREE.BufferGeometry();
  const starVertices = [];
  for (let i = 0; i < 3000; i++) {
    starVertices.push(
      (Math.random() - 0.5) * 800,
      (Math.random() - 0.5) * 800,
      (Math.random() - 0.5) * 800
    );
  }
  starsGeometry.setAttribute("position", new THREE.Float32BufferAttribute(starVertices, 3));
  const stars = new THREE.Points(starsGeometry, new THREE.PointsMaterial({ color: 0xffffff, size: 0.6 }));
  scene.add(stars);

  let isPaused = false;
  document.getElementById("toggleAnimation").addEventListener("click", () => {
    isPaused = !isPaused;
    document.getElementById("toggleAnimation").textContent = isPaused ? "Resume" : "Pause";
  });

  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  let mouseX = 0, mouseY = 0;

  window.addEventListener("mousemove", (event) => {
    mouseX = event.clientX;
    mouseY = event.clientY;
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  });

window.addEventListener("click", () => {
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(planets.map(p => p.mesh));

  if (intersects.length > 0) {
    const planet = intersects[0].object.userData;

    document.getElementById("planetName").textContent = planet.name;
    document.getElementById("planetTemp").textContent = planet.temp;
    document.getElementById("planetMoons").textContent = planet.moons;
    
    document.getElementById("planetInfo").classList.remove("hidden");
  }
});

document.getElementById("closeInfo").addEventListener("click", () => {
  document.getElementById("planetInfo").classList.add("hidden");
});



  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  function animate() {
    requestAnimationFrame(animate);

    if (!isPaused) {
      planets.forEach(({ mesh }, i) => {
        const name = planetData[i].name;
        const speed = orbitSpeeds[name];
        const angle = speed * Date.now() * 0.001;

        mesh.position.x = planetData[i].distance * Math.cos(angle);
        mesh.position.z = planetData[i].distance * Math.sin(angle);
      });
    }

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(planets.map(p => p.mesh));
    if (intersects.length > 0) {
      const intersect = intersects[0];
      tooltip.textContent = intersect.object.userData.name;
      tooltip.style.left = `${mouseX + 10}px`;
      tooltip.style.top = `${mouseY + 10}px`;
      tooltip.style.display = "block";
    } else {
      tooltip.style.display = "none";
    }

    controls.update();
    renderer.render(scene, camera);
  }

  animate();
});


