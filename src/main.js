import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

//Creating the scene and camera
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

  // used to display the scene
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  const tooltip = document.getElementById("tooltip");
  const infoBox = document.getElementById("planetInfo");

  // Sun
  const sun = new THREE.Mesh(
    new THREE.SphereGeometry(4, 64, 64),
    new THREE.MeshBasicMaterial({ color: '#FFD700' })
  );
  scene.add(sun);

  // Lights
  scene.add(new THREE.AmbientLight(0xffffff, 2));
  const light = new THREE.PointLight(0xffffff, 6, 10000);
  light.position.set(0, 0, 0);
  scene.add(light);

  // Planet information which is to be displayed in the info box
  const planetData = [
    { name: "Mercury", color: '#909090', size: 0.4, distance: 7, moons: 0, temp: "167°C", diameter: 4879, rotationPeriod: "58.6 days" },
    { name: "Venus", color: '#a8941fff', size: 0.9, distance: 10, moons: 0, temp: "464°C", diameter: 12104, rotationPeriod: "243 days" },
    { name: "Earth", color:'#1E90FF', size: 1, distance: 13, moons: 1, temp: "15°C", diameter: 12742, rotationPeriod: "24 hours" },
    { name: "Mars", color: '#B22222', size: 0.8, distance: 16, moons: 2, temp: "-65°C", diameter: 6779, rotationPeriod: "24.6 hours" },
    { name: "Jupiter", color: '#D2B48C', size: 2.5, distance: 20, moons: 79, temp: "-110°C", diameter: 139820, rotationPeriod: "9.9 hours" },
    { name: "Saturn", color: '#F5DEB3', size: 2.2, distance: 25, moons: 83, temp: "-140°C", diameter: 116460, rotationPeriod: "10.7 hours" },
    { name: "Uranus", color: '#40E0D0', size: 1.7, distance: 30, moons: 27, temp: "-195°C", diameter: 50724, rotationPeriod: "17.2 hours" },
    { name: "Neptune", color: '#000080', size: 1.6, distance: 35, moons: 14, temp: "-200°C", diameter: 49244, rotationPeriod: "16.1 hours"},
  ];

  const planets = [];
  const orbitSpeeds = {};

  // Create planets and their orbits
  planetData.forEach((planet, index) => {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(planet.size, 32, 32),
      new THREE.MeshPhongMaterial({ color: planet.color })
    );
    mesh.position.x = planet.distance;
    mesh.userData = planet;
    scene.add(mesh);

    // Orbit ring around the sun
    const orbitRing = new THREE.Mesh(
      new THREE.RingGeometry(planet.distance - 0.05, planet.distance + 0.05, 64),
      new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide })
    );
    orbitRing.rotation.x = Math.PI / 2;
    scene.add(orbitRing);

    // Saturn's visible ring
    if (planet.name === "Saturn") {
      const saturnRingGeometry = new THREE.RingGeometry(
        planet.size * 1.3,
        planet.size * 2.2,
        64
      );
      const saturnRingMaterial = new THREE.MeshBasicMaterial({
        color: 0xcccccc,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.6
      });
      const saturnRing = new THREE.Mesh(saturnRingGeometry, saturnRingMaterial);
      saturnRing.rotation.x = Math.PI / 2;
      mesh.add(saturnRing);
    }

    orbitSpeeds[planet.name] = 0.01 + index * 0.002;

    // Speed slider for each planet
    planets.push({ mesh, distance: planet.distance, angle: 0 });

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
      (Math.random() - 0.5) * 700,
      (Math.random() - 0.5) * 700,
      (Math.random() - 0.5) * 700
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
      document.getElementById("planetDiameter").textContent = planet.diameter + " km";
      document.getElementById("planetRotation").textContent = planet.rotationPeriod;

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
      planets.forEach(({ mesh, distance }, i) => {
        const name = planetData[i].name;
        const speed = orbitSpeeds[name];
        // Increment angle based on speed
        planets[i].angle += speed;

        if (planets[i].angle > Math.PI * 2) {
          planets[i].angle -= Math.PI * 2;
        }

        // Update position based on incremental angle
        mesh.position.x = distance * Math.cos(planets[i].angle);
        mesh.position.z = distance * Math.sin(planets[i].angle);
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
