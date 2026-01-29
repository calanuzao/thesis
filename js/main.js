// Import Three.js (Add this to index.html)
// <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>

document.addEventListener('DOMContentLoaded', () => {
        // --- 3D HEXAGON RENDERER ---
        (function renderHexagon3D() {
            const container = document.getElementById('hexagon-3d-viewer');
            if (!container) return;
            function getBannerDims() {
                // Use container's width for banner
                const width = container.clientWidth;
                const height = container.parentElement ? container.parentElement.clientHeight : 340;
                return { width, height };
            }
            let { width, height } = getBannerDims();
            const scene = new THREE.Scene();
            scene.background = new THREE.Color(0xFAF3E8);
            const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
            camera.position.set(0, 0, 13);
            camera.lookAt(0, 0, 0);
            // Center honeycomb group after creation
            function centerHoneycombGroup() {
                if (!honeycombGroup) return;
                // Compute bounding box
                const box = new THREE.Box3().setFromObject(honeycombGroup);
                const center = new THREE.Vector3();
                box.getCenter(center);
                honeycombGroup.position.x -= center.x;
                honeycombGroup.position.y -= center.y;
            }
            const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
            renderer.setSize(width, height);
            container.appendChild(renderer.domElement);
            // Lighting
            const ambient = new THREE.AmbientLight(0xffffff, 0.7);
            scene.add(ambient);
            const dir = new THREE.DirectionalLight(0xffffff, 0.7);
            dir.position.set(2, 2, 2);
            scene.add(dir);
            // Create hexagon geometry (with morphable vertices)
            const radius = 1.5;
            const shape = new THREE.Shape();
            for (let i = 0; i < 6; i++) {
                const angle = (i / 6) * Math.PI * 2;
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;
                if (i === 0) shape.moveTo(x, y);
                else shape.lineTo(x, y);
            }
            shape.closePath();
            const extrudeSettings = { depth: 0.5, bevelEnabled: true, bevelThickness: 0.1, bevelSize: 0.08, bevelSegments: 2 };
            const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
            // Store original positions for morphing
            const origPositions = geometry.attributes.position.array.slice();
            // Color material
            const material = new THREE.MeshPhysicalMaterial({ color: 0xD4A373, metalness: 0.5, roughness: 0.3, clearcoat: 0.2 });
            const hexMesh = new THREE.Mesh(geometry, material);
            scene.add(hexMesh);
            // Responsive honeycomb banner
            let honeycombGroup = new THREE.Group();
            function createHoneycombBanner() {
                if (honeycombGroup) scene.remove(honeycombGroup);
                honeycombGroup = new THREE.Group();
                // Calculate number of rows/cols based on width
                const hexRadius = 0.7;
                const margin = 0.5;
                const { width, height } = getBannerDims();
                const cols = Math.ceil((width / 50));
                const rows = Math.ceil((height / 40));
                const hexCenters = [];
                for (let row = 0; row < rows; row++) {
                    for (let col = 0; col < cols; col++) {
                        const x = (col - cols/2) * hexRadius * 1.75 + ((row%2) * hexRadius * 0.87);
                        const y = (row - rows/2) * hexRadius * 1.5;
                        hexCenters.push([x, y]);
                        // Draw hex cell
                        const hexShape = new THREE.Shape();
                        for (let i = 0; i < 6; i++) {
                            const angle = (i / 6) * Math.PI * 2;
                            const hx = Math.cos(angle) * hexRadius;
                            const hy = Math.sin(angle) * hexRadius;
                            if (i === 0) hexShape.moveTo(hx, hy);
                            else hexShape.lineTo(hx, hy);
                        }
                        hexShape.closePath();
                        const hexGeom = new THREE.ExtrudeGeometry(hexShape, { depth: 0.08, bevelEnabled: false });
                        const hexMat = new THREE.MeshPhysicalMaterial({ color: 0xD4A373, metalness: 0.6, roughness: 0.25, clearcoat: 0.3 });
                        const hexMesh = new THREE.Mesh(hexGeom, hexMat);
                        hexMesh.position.set(x, y, 0);
                        honeycombGroup.add(hexMesh);
                    }
                }
                // Add dynamic connections (lines) between centers
                const lineMat = new THREE.LineBasicMaterial({ color: 0x6B8CC8, linewidth: 2 });
                for (let i = 0; i < hexCenters.length; i++) {
                    for (let j = i+1; j < hexCenters.length; j++) {
                        const [x1, y1] = hexCenters[i];
                        const [x2, y2] = hexCenters[j];
                        if (Math.abs(Math.hypot(x1-x2, y1-y2) - hexRadius*1.75) < 0.2) {
                            const points = [new THREE.Vector3(x1, y1, 0.05), new THREE.Vector3(x2, y2, 0.05)];
                            const geom = new THREE.BufferGeometry().setFromPoints(points);
                            const line = new THREE.Line(geom, lineMat.clone());
                            honeycombGroup.add(line);
                        }
                    }
                }
                centerHoneycombGroup();
                scene.add(honeycombGroup);
            }
            createHoneycombBanner();
            // No OrbitControls: no user interaction, no auto-rotation
            // Animate honeycomb: wave morphing and dynamic line color
            function animateHoneycomb(time) {
                // Animate each hex cell with a breathing/wave effect
                honeycombGroup.children.forEach((obj, idx) => {
                    if (obj.type === 'Mesh') {
                        // No rotation at all
                        const scale = 1 + 0.22 * Math.sin(time * 0.001 + idx * 0.5) * Math.cos(time * 0.0012 + idx);
                        obj.scale.set(scale, scale, 1.0 + 0.2 * Math.sin(time * 0.0015 + idx));
                        obj.rotation.z = 0;
                        // Animate color
                        const hue = 0.08 + 0.18 * Math.sin(time * 0.0007 + idx) + 0.08 * Math.cos(time * 0.0009 + idx * 0.7);
                        obj.material.color.setHSL(hue, 0.55, 0.65);
                        obj.material.emissive.setHSL(hue + 0.1, 0.5, 0.25);
                    } else if (obj.type === 'Line') {
                        // Animate line color
                        const hue = 0.6 + 0.3 * Math.sin(time * 0.001 + idx);
                        obj.material.color.setHSL(hue, 0.7, 0.6);
                    }
                });
                renderer.render(scene, camera);
                requestAnimationFrame(animateHoneycomb);
            }
            animateHoneycomb(performance.now());
            // Responsive resize for banner
            window.addEventListener('resize', () => {
                const { width, height } = getBannerDims();
                camera.aspect = width / height;
                camera.updateProjectionMatrix();
                renderer.setSize(width, height);
                createHoneycombBanner();
            });
            // Responsive resize
            window.addEventListener('resize', () => {
                const w = container.clientWidth || 400;
                const h = container.clientHeight || 400;
                camera.aspect = w / h;
                camera.updateProjectionMatrix();
                renderer.setSize(w, h);
            });
        })();
    // Scene setup for hearing aid model (only if container exists)
    const haContainer = document.getElementById('hearing-aid-model');
    if (haContainer) {
        // --- Hearing Aid Acoustics Model Simulation ---
        const containerWidth = haContainer.clientWidth;
        const containerHeight = haContainer.clientHeight;
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0xFFF9F2);
        const camera = new THREE.PerspectiveCamera(75, containerWidth / containerHeight, 0.1, 1000);
        camera.position.set(0, 4, 0); // Move camera closer for zoomed-in bird's-eye view
        camera.up.set(0, 0, -1); // Set the up direction so z-axis is down the screen
        camera.lookAt(0, 0, 0); // Look at the center of the scene
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(containerWidth, containerHeight);
        haContainer.appendChild(renderer.domElement);
        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        const mainLight = new THREE.DirectionalLight(0xffffff, 1);
        mainLight.position.set(1, 1, 1);
        scene.add(mainLight);
        // Color palette
        const colors = {
            base: new THREE.Color(0x6B8CC8),    // Blue base
            active: new THREE.Color(0xE67E22),   // Orange active
            ripple: new THREE.Color(0x2ECC71),   // Green ripple
            wave1: new THREE.Color(0x3498db),    // Light blue
            wave2: new THREE.Color(0x9b59b6)     // Purple
        };
        // Particle system
        const particles = new THREE.Group();
        const particleCount = 40;
        const particleGeometry = new THREE.SphereGeometry(0.02, 8, 8);
        const particleMaterials = [
            new THREE.MeshPhysicalMaterial({
                color: colors.base,
                transparent: true,
                opacity: 0.8,
                metalness: 0.3,
                roughness: 0.4,
                emissive: colors.base,
                emissiveIntensity: 0.2
            })
        ];
        for (let x = -particleCount/2; x < particleCount/2; x++) {
            for (let z = -particleCount/2; z < particleCount/2; z++) {
                const particle = new THREE.Mesh(
                    particleGeometry,
                    particleMaterials[0].clone()
                );
                particle.position.set(
                    x * 0.2 + (Math.random() - 0.5) * 0.1,
                    (Math.random() - 0.5) * 0.1,
                    z * 0.2 + (Math.random() - 0.5) * 0.1
                );
                particle.userData = {
                    originalPos: particle.position.clone(),
                    phase: Math.random() * Math.PI * 2,
                    speed: 0.5 + Math.random() * 0.5,
                    amplitude: 0.1 + Math.random() * 0.1,
                    atomicMotion: {
                        angle: Math.random() * Math.PI * 2,
                        speed: 0.5 + Math.random() * 0.5,
                        radius: 0.02 + Math.random() * 0.02
                    }
                };
                particles.add(particle);
            }
        }
        scene.add(particles);
        // Ripple system
        class Ripple {
            constructor(x, z) {
                this.position = new THREE.Vector2(x, z);
                this.radius = 0.5;
                this.maxRadius = 10;
                this.speed = 3;
                this.strength = 1;
                this.life = 1;
                // Metallic grey colors
                const metalGrey = {
                    main: 0x8C8C8C,
                    light: 0xB0B0B0,
                    dark: 0x4A4A4A
                };
                // Create main ring
                const geometry = new THREE.RingGeometry(0.1, 0.12, 32);
                const material = new THREE.MeshPhongMaterial({
                    color: metalGrey.main,
                    transparent: true,
                    opacity: 0.2,
                    side: THREE.DoubleSide,
                    shininess: 60,
                    depthTest: false,
                    depthWrite: false
                });
                this.mesh = new THREE.Mesh(geometry, material);
                this.mesh.position.set(x, 0, z);
                scene.add(this.mesh);
            }
            update(dt) {
                this.radius += this.speed * dt;
                this.life -= dt * 0.25;
                this.mesh.scale.set(this.radius, this.radius, 1);
                this.mesh.material.opacity = 0.2 * this.life;
                if (this.radius > this.maxRadius || this.life <= 0) {
                    scene.remove(this.mesh);
                    return false;
                }
                return true;
            }
            influence(pos) {
                const dist = Math.sqrt((pos.x - this.position.x) ** 2 + (pos.z - this.position.y) ** 2);
                if (dist > this.radius + 0.2 || dist < this.radius - 0.2) return 0;
                return this.strength * Math.exp(-dist * 0.5) * (1 - Math.abs(dist - this.radius) / 0.2);
            }
        }
        const ripples = [];
        // Add automatic ripple creation
        setInterval(() => {
            const x = (Math.random() - 0.5) * 5;
            const z = (Math.random() - 0.5) * 5;
            ripples.push(new Ripple(x, z));
        }, 1000);
        // Animation helpers
        let time = 0;
        let lastTime = performance.now();
        const tmpVector = new THREE.Vector3();
        const tmpColor = new THREE.Color();
        function updateParticle(particle, deltaTime) {
            const data = particle.userData;
            const pos = data.originalPos;
            let totalHeight = Math.sin(time * data.speed + data.phase) * data.amplitude;
            let maxRippleInfluence = 0;
            ripples.forEach(ripple => {
                const influence = ripple.influence(pos);
                totalHeight += influence;
                maxRippleInfluence = Math.max(maxRippleInfluence, Math.abs(influence));
            });
            data.atomicMotion.angle += data.atomicMotion.speed * deltaTime;
            tmpVector.set(
                Math.cos(data.atomicMotion.angle) * data.atomicMotion.radius,
                0,
                Math.sin(data.atomicMotion.angle) * data.atomicMotion.radius
            );
            particle.position.copy(pos).add(tmpVector);
            particle.position.y += totalHeight;
            const energyFactor = Math.abs(totalHeight) * 2;
            const rippleFactor = maxRippleInfluence;
            tmpColor.copy(colors.base)
                .lerp(colors.active, energyFactor)
                .lerp(colors.ripple, rippleFactor);
            particle.material.color.lerp(tmpColor, deltaTime * 5);
            particle.material.emissiveIntensity = 0.2 + energyFactor * 0.3 + rippleFactor * 0.5;
            const scale = 1 + (energyFactor + rippleFactor) * 0.5;
            particle.scale.setScalar(scale);
        }
        function animate() {
            requestAnimationFrame(animate);
            const currentTime = performance.now();
            const deltaTime = Math.min((currentTime - lastTime) / 1000, 0.1);
            lastTime = currentTime;
            time += deltaTime;
            for (let i = ripples.length - 1; i >= 0; i--) {
                if (!ripples[i].update(deltaTime)) {
                    ripples.splice(i, 1);
                }
            }
            particles.children.forEach(particle => updateParticle(particle, deltaTime));
            renderer.render(scene, camera);
        }
        animate();
    }

    // Color palette
    const colors = {
        base: new THREE.Color(0x6B8CC8),    // Blue base
        active: new THREE.Color(0xE67E22),   // Orange active
        ripple: new THREE.Color(0x2ECC71),   // Green ripple
        wave1: new THREE.Color(0x3498db),    // Light blue
        wave2: new THREE.Color(0x9b59b6)     // Purple
    };

    // Optimized particle creation
    const particles = new THREE.Group();
    const particleCount = 40; // Balanced number for performance
    const particleGeometry = new THREE.SphereGeometry(0.02, 8, 8);
    const particleMaterials = [
        new THREE.MeshPhysicalMaterial({
            color: colors.base,
            transparent: true,
            opacity: 0.8,
            metalness: 0.3,
            roughness: 0.4,
            emissive: colors.base,
            emissiveIntensity: 0.2
        })
    ];

    // Create particle grid with optimized materials
    for (let x = -particleCount/2; x < particleCount/2; x++) {
        for (let z = -particleCount/2; z < particleCount/2; z++) {
            // Reuse materials instead of creating new ones
            const particle = new THREE.Mesh(
                particleGeometry,
                particleMaterials[0].clone()
            );

            particle.position.set(
                x * 0.2 + (Math.random() - 0.5) * 0.1,
                (Math.random() - 0.5) * 0.1,
                z * 0.2 + (Math.random() - 0.5) * 0.1
            );

            particle.userData = {
                originalPos: particle.position.clone(),
                phase: Math.random() * Math.PI * 2,
                speed: 0.5 + Math.random() * 0.5,
                amplitude: 0.1 + Math.random() * 0.1,
                atomicMotion: {
                    angle: Math.random() * Math.PI * 2,
                    speed: 0.5 + Math.random() * 0.5,
                    radius: 0.02 + Math.random() * 0.02
                }
            };

            particles.add(particle);
        }
    }
    scene.add(particles);

    // Ripple system
    class Ripple {
        constructor(x, z) {
            this.position = new THREE.Vector2(x, z);
            this.radius = 0.5;
            this.maxRadius = 10;
            this.speed = 3;
            this.strength = 1;
            this.life = 1;
            
            // Metallic grey colors
            const metalGrey = {
                main: 0x8C8C8C,    // Medium metallic grey
                light: 0xB0B0B0,   // Lighter silver
                dark: 0x4A4A4A     // Darker gunmetal
            };
            
            // Create main ring with subtle appearance
            const geometry = new THREE.RingGeometry(0.1, 0.12, 32);
            const material = new THREE.MeshPhongMaterial({
                color: metalGrey.main,
                transparent: true,
                opacity: 0.2,
                side: THREE.DoubleSide,
                shininess: 60,
                depthTest: false,
                depthWrite: false
            });
            
            this.mesh = new THREE.Mesh(geometry, material);
            this.mesh.rotation.x = -Math.PI / 2;
            this.mesh.position.set(x, 0.01, z);
            scene.add(this.mesh);

            // Create concentric rings
            this.rings = [];
            for (let i = 0; i < 2; i++) {
                const ringGeo = new THREE.RingGeometry(0.1, 0.12, 32);
                const ringMat = new THREE.MeshPhongMaterial({
                    color: i === 0 ? metalGrey.light : metalGrey.dark,
                    transparent: true,
                    opacity: 0.15 - i * 0.05,
                    side: THREE.DoubleSide,
                    shininess: 50 - i * 15,
                    depthTest: false,
                    depthWrite: false
                });
                const ring = new THREE.Mesh(ringGeo, ringMat);
                ring.rotation.x = -Math.PI / 2;
                ring.position.set(x, 0.01 + i * 0.001, z);
                this.rings.push(ring);
                scene.add(ring);
            }
        }

        update(deltaTime) {
            this.radius += deltaTime * this.speed;
            this.life -= deltaTime * 0.2;

            // Update main ring with lower opacity
            const scale = this.radius;
            this.mesh.scale.set(scale, scale, 1);
            this.mesh.material.opacity = this.life * 0.2; // Reduced from 0.3

            // Update concentric rings with lower opacity
            this.rings.forEach((ring, i) => {
                const waveOffset = Math.sin(this.radius * 2 + i * Math.PI) * 0.2;
                const ringScale = scale * (1 + waveOffset);
                ring.scale.set(ringScale, ringScale, 1);
                ring.material.opacity = this.life * (0.1 - i * 0.03); // Reduced opacity
                ring.position.y = 0.01 + Math.sin(this.radius * 3 + i * Math.PI) * 0.05;
            });

            if (this.life <= 0 || this.radius >= this.maxRadius) {
                scene.remove(this.mesh);
                this.rings.forEach(ring => scene.remove(ring));
                return false;
            }
            return true;
        }

        influence(point) {
            const distance = new THREE.Vector2(point.x, point.z)
                .distanceTo(this.position);
            const rippleWidth = 0.8;
            
            if (Math.abs(distance - this.radius) < rippleWidth) {
                // Create wave motion that affects particles
                const wave = Math.sin((distance - this.radius) * 4) * 
                            Math.cos((this.radius * 2)) * 
                            this.strength * 
                            this.life;
                return wave * 0.2; // Reduced influence
            }
            return 0;
        }
    }

    const ripples = [];

    // Interaction
    const mouse = new THREE.Vector2();
    const raycaster = new THREE.Raycaster();
    let isPressed = false;

    container.addEventListener('mousedown', () => isPressed = true);
    container.addEventListener('mouseup', () => isPressed = false);
    container.addEventListener('mousemove', (event) => {
        if (!isPressed) return;
        
        const rect = container.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersectPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        const intersection = new THREE.Vector3();
        raycaster.ray.intersectPlane(intersectPlane, intersection);

        // Create ripples more frequently
        if (!this.lastRippleTime || performance.now() - this.lastRippleTime > 50) {
            ripples.push(new Ripple(intersection.x, intersection.z));
            this.lastRippleTime = performance.now();
        }
    });

    // Add double-click for explosion ripples
    container.addEventListener('dblclick', (event) => {
        const rect = container.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersectPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
        const intersection = new THREE.Vector3();
        raycaster.ray.intersectPlane(intersectPlane, intersection);

        // Create multiple ripples for explosion effect
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                const ripple = new Ripple(intersection.x, intersection.z);
                ripple.speed *= (1 + i * 0.2);
                ripple.strength *= (1 - i * 0.2);
                ripples.push(ripple);
            }, i * 100);
        }
    });

    // Add automatic ripple creation for testing
    setInterval(() => {
        const x = (Math.random() - 0.5) * 5;
        const z = (Math.random() - 0.5) * 5;
        ripples.push(new Ripple(x, z));
    }, 1000);

    // Controls
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 3;
    controls.maxDistance = 15;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.5;

    // Optimized animation
    let time = 0;
    let lastTime = performance.now();
    const tmpVector = new THREE.Vector3();
    const tmpColor = new THREE.Color();

    function updateParticle(particle, deltaTime) {
        const data = particle.userData;
        const pos = data.originalPos;

        // Calculate wave and ripple influence
        let totalHeight = Math.sin(time * data.speed + data.phase) * data.amplitude;
        let maxRippleInfluence = 0;

        ripples.forEach(ripple => {
            const influence = ripple.influence(pos);
            totalHeight += influence;
            maxRippleInfluence = Math.max(maxRippleInfluence, Math.abs(influence));
        });

        // Enhanced particle movement
        data.atomicMotion.angle += data.atomicMotion.speed * deltaTime;
        tmpVector.set(
            Math.cos(data.atomicMotion.angle) * data.atomicMotion.radius,
            0,
            Math.sin(data.atomicMotion.angle) * data.atomicMotion.radius
        );

        // Apply position with enhanced vertical movement
        particle.position.copy(pos).add(tmpVector);
        particle.position.y += totalHeight;

        // Dynamic color based on height and ripple influence
        const energyFactor = Math.abs(totalHeight) * 2;
        const rippleFactor = maxRippleInfluence;
        
        tmpColor.copy(colors.base)
            .lerp(colors.active, energyFactor)
            .lerp(colors.ripple, rippleFactor);
        
        particle.material.color.lerp(tmpColor, deltaTime * 5);
        particle.material.emissiveIntensity = 0.2 + energyFactor * 0.3 + rippleFactor * 0.5;
        
        // Scale particles based on energy
        const scale = 1 + (energyFactor + rippleFactor) * 0.5;
        particle.scale.setScalar(scale);
    }

    function animate() {
        requestAnimationFrame(animate);
        
        const currentTime = performance.now();
        const deltaTime = Math.min((currentTime - lastTime) / 1000, 0.1);
        lastTime = currentTime;
        time += deltaTime;

        // Update ripples
        for (let i = ripples.length - 1; i >= 0; i--) {
            if (!ripples[i].update(deltaTime)) {
                ripples.splice(i, 1);
            }
        }

        // Update particles with optimized calculations
        particles.children.forEach(particle => updateParticle(particle, deltaTime));

        controls.update();
        renderer.render(scene, camera);
    }

    // Handle window resize
    window.addEventListener('resize', () => {
        const width = container.clientWidth;
        const height = container.clientHeight;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
    });

    animate();

    // Add this function for the waveform loader
    function initWaveformLoader() {
        const canvas = document.getElementById('waveform-visualizer');
        const ctx = canvas.getContext('2d');
        let time = 0;

        // Set canvas size
        function resizeCanvas() {
            canvas.width = canvas.parentElement.clientWidth;
            canvas.height = 100;
        }
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        // Animation function
        function drawWaveform() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Wave parameters
            const amplitude = 15;
            const frequency = 0.02;
            const speed = 0.05;
            
            // Style
            ctx.strokeStyle = '#4A4A4A';
            ctx.lineWidth = 2;
            
            // Draw main wave
            ctx.beginPath();
            for (let x = 0; x < canvas.width; x++) {
                const y = amplitude * Math.sin(x * frequency + time) + canvas.height / 2;
                if (x === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.stroke();
            
            // Draw loading progress
            const progress = (time * speed) % 1;
            const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
            gradient.addColorStop(0, 'rgba(250, 243, 232, 0)');
            gradient.addColorStop(progress, 'rgba(250, 243, 232, 0)');
            gradient.addColorStop(Math.min(progress + 0.1, 1), 'rgba(250, 243, 232, 0.95)');
            gradient.addColorStop(1, 'rgba(250, 243, 232, 0.95)');
            
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            time += speed;
            requestAnimationFrame(drawWaveform);
        }

        drawWaveform();
    }

    // Call the loader when the document is ready
    initWaveformLoader();
}); 