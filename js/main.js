// Import Three.js (Add this to index.html)
// <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>

document.addEventListener('DOMContentLoaded', () => {
    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xFFF9F2);

    // Get container dimensions
    const container = document.getElementById('hearing-aid-model');
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(75, containerWidth / containerHeight, 0.1, 1000);
    camera.position.set(0, 3, 5);

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        alpha: true 
    });
    renderer.setSize(containerWidth, containerHeight);
    container.appendChild(renderer.domElement);

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