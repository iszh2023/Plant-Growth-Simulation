// Simple 3D Game with Working Mouse Lock and Movement
class Simple3DGame {
    constructor() {
        console.log('🎮 Creating Simple3DGame...');
        
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        
        // Movement state
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        
        // Player position
        this.playerPosition = new THREE.Vector3(0, 1.75, 5);
        this.velocity = new THREE.Vector3();
        
        this.clock = new THREE.Clock();
        this.isMouseLocked = false;
        
        this.init();
    }
    
    init() {
        console.log('🔧 Initializing 3D scene...');
        
        // Get canvas
        const canvas = document.getElementById('three-canvas');
        if (!canvas) {
            console.error('❌ Canvas not found!');
            return;
        }
        
        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB);
        this.scene.fog = new THREE.Fog(0x87CEEB, 10, 50);
        
        // Camera
        this.camera = new THREE.PerspectiveCamera(75, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
        this.camera.position.copy(this.playerPosition);
        
        // Renderer
        this.renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
        this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // Lighting
        this.setupLighting();
        
        // Create greenhouse
        this.createGreenhouseInterior();
        
        // Setup controls
        this.setupControls();
        
        // Start animation
        this.animate();
        
        console.log('✅ 3D scene initialized successfully!');
    }
    
    setupLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambientLight);
        
        // Directional light (sun)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 10, 5);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        this.scene.add(directionalLight);
        
        // Point lights inside greenhouse
        const pointLight1 = new THREE.PointLight(0xffffff, 0.5, 20);
        pointLight1.position.set(0, 6, 0);
        this.scene.add(pointLight1);
        
        const pointLight2 = new THREE.PointLight(0xff88ff, 0.3, 15);
        pointLight2.position.set(-5, 4, -3);
        this.scene.add(pointLight2);
    }
    
    createGreenhouseInterior() {
        console.log('🏠 Creating greenhouse interior...');
        
        // Floor
        const floorGeometry = new THREE.PlaneGeometry(20, 16);
        const floorMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        this.scene.add(floor);
        
        // Walls
        const wallMaterial = new THREE.MeshLambertMaterial({ 
            color: 0xccffcc, 
            transparent: true, 
            opacity: 0.4 
        });
        
        // Back wall
        const backWall = new THREE.Mesh(new THREE.PlaneGeometry(20, 8), wallMaterial);
        backWall.position.set(0, 4, -8);
        this.scene.add(backWall);
        
        // Side walls
        const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(16, 8), wallMaterial);
        leftWall.position.set(-10, 4, 0);
        leftWall.rotation.y = Math.PI / 2;
        this.scene.add(leftWall);
        
        const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(16, 8), wallMaterial);
        rightWall.position.set(10, 4, 0);
        rightWall.rotation.y = -Math.PI / 2;
        this.scene.add(rightWall);
        
        // Plant benches
        const benchMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        
        // Left bench
        const leftBench = new THREE.Mesh(new THREE.BoxGeometry(15, 0.3, 2), benchMaterial);
        leftBench.position.set(-6, 0.9, -3);
        leftBench.castShadow = true;
        this.scene.add(leftBench);
        
        // Right bench
        const rightBench = new THREE.Mesh(new THREE.BoxGeometry(15, 0.3, 2), benchMaterial);
        rightBench.position.set(6, 0.9, -3);
        rightBench.castShadow = true;
        this.scene.add(rightBench);
        
        // Center table
        const centerTable = new THREE.Mesh(new THREE.BoxGeometry(6, 0.3, 3), benchMaterial);
        centerTable.position.set(0, 0.9, 3);
        centerTable.castShadow = true;
        this.scene.add(centerTable);
        
        // Add some colorful objects to make it interesting
        this.addColorfulObjects();
    }
    
    addColorfulObjects() {
        // Colorful plant pots
        const colors = [0xff4444, 0x44ff44, 0x4444ff, 0xffff44, 0xff44ff, 0x44ffff];
        
        for (let i = 0; i < 12; i++) {
            const potGeometry = new THREE.CylinderGeometry(0.3, 0.25, 0.4);
            const potMaterial = new THREE.MeshLambertMaterial({ 
                color: colors[i % colors.length] 
            });
            const pot = new THREE.Mesh(potGeometry, potMaterial);
            
            // Place on benches
            if (i < 4) {
                pot.position.set(-8 + i * 2, 1.2, -3);
            } else if (i < 8) {
                pot.position.set(4 + (i-4) * 2, 1.2, -3);
            } else {
                pot.position.set(-3 + (i-8) * 1.5, 1.2, 3);
            }
            
            pot.castShadow = true;
            this.scene.add(pot);
        }
        
        // Add some tall plants
        for (let i = 0; i < 6; i++) {
            const stemGeometry = new THREE.CylinderGeometry(0.05, 0.05, 1.5);
            const stemMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 });
            const stem = new THREE.Mesh(stemGeometry, stemMaterial);
            
            const leafGeometry = new THREE.SphereGeometry(0.3);
            const leafMaterial = new THREE.MeshLambertMaterial({ color: 0x32CD32 });
            const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
            leaf.position.y = 1.5;
            stem.add(leaf);
            
            stem.position.set(-6 + i * 2.4, 1.65, -3);
            this.scene.add(stem);
        }\n    }\n    \n    setupControls() {\n        console.log('🎮 Setting up controls...');\n        \n        // Mouse lock controls\n        this.controls = new THREE.PointerLockControls(this.camera, document.body);\n        this.scene.add(this.controls.getObject());\n        \n        // Mouse lock events\n        this.controls.addEventListener('lock', () => {\n            console.log('✅ Mouse locked!');\n            this.isMouseLocked = true;\n            const canvas = document.getElementById('three-canvas');\n            if (canvas) canvas.style.cursor = 'none';\n        });\n        \n        this.controls.addEventListener('unlock', () => {\n            console.log('❌ Mouse unlocked');\n            this.isMouseLocked = false;\n            const canvas = document.getElementById('three-canvas');\n            if (canvas) canvas.style.cursor = 'crosshair';\n        });\n        \n        // Click to lock mouse\n        const canvas = document.getElementById('three-canvas');\n        canvas.addEventListener('click', () => {\n            console.log('🖱️ Canvas clicked, requesting pointer lock...');\n            this.controls.lock();\n        });\n        \n        // Keyboard events\n        document.addEventListener('keydown', (event) => this.onKeyDown(event));\n        document.addEventListener('keyup', (event) => this.onKeyUp(event));\n        \n        console.log('✅ Controls setup complete!');\n    }\n    \n    onKeyDown(event) {\n        console.log('⌨️ Key down:', event.code);\n        \n        switch (event.code) {\n            case 'KeyW':\n            case 'ArrowUp':\n                this.moveForward = true;\n                break;\n            case 'KeyS':\n            case 'ArrowDown':\n                this.moveBackward = true;\n                break;\n            case 'KeyA':\n            case 'ArrowLeft':\n                this.moveLeft = true;\n                break;\n            case 'KeyD':\n            case 'ArrowRight':\n                this.moveRight = true;\n                break;\n            case 'Escape':\n                if (this.isMouseLocked) {\n                    this.controls.unlock();\n                }\n                break;\n        }\n    }\n    \n    onKeyUp(event) {\n        switch (event.code) {\n            case 'KeyW':\n            case 'ArrowUp':\n                this.moveForward = false;\n                break;\n            case 'KeyS':\n            case 'ArrowDown':\n                this.moveBackward = false;\n                break;\n            case 'KeyA':\n            case 'ArrowLeft':\n                this.moveLeft = false;\n                break;\n            case 'KeyD':\n            case 'ArrowRight':\n                this.moveRight = false;\n                break;\n        }\n    }\n    \n    updateMovement(deltaTime) {\n        if (!this.isMouseLocked) return;\n        \n        const moveSpeed = 8.0; // units per second\n        \n        // Reset velocity\n        this.velocity.set(0, 0, 0);\n        \n        // Calculate movement direction\n        if (this.moveForward) this.velocity.z -= moveSpeed;\n        if (this.moveBackward) this.velocity.z += moveSpeed;\n        if (this.moveLeft) this.velocity.x -= moveSpeed;\n        if (this.moveRight) this.velocity.x += moveSpeed;\n        \n        // Apply movement if any keys are pressed\n        if (this.velocity.length() > 0) {\n            console.log('🏃 Moving:', this.velocity);\n            \n            // Apply camera rotation to movement direction\n            this.velocity.multiplyScalar(deltaTime);\n            this.controls.moveRight(this.velocity.x);\n            this.controls.moveForward(-this.velocity.z);\n        }\n    }\n    \n    animate() {\n        requestAnimationFrame(() => this.animate());\n        \n        const deltaTime = this.clock.getDelta();\n        \n        // Update movement\n        this.updateMovement(deltaTime);\n        \n        // Render scene\n        this.renderer.render(this.scene, this.camera);\n    }\n    \n    // Handle window resize\n    onWindowResize() {\n        const canvas = document.getElementById('three-canvas');\n        if (canvas && this.camera && this.renderer) {\n            this.camera.aspect = canvas.clientWidth / canvas.clientHeight;\n            this.camera.updateProjectionMatrix();\n            this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);\n        }\n    }\n}\n\n// Global function to start the simple game\nfunction startSimpleGame() {\n    console.log('🚀 Starting Simple 3D Game...');\n    \n    // Close tutorial if open\n    const tutorialOverlay = document.getElementById('tutorial-overlay');\n    if (tutorialOverlay) {\n        tutorialOverlay.style.display = 'none';\n    }\n    \n    // Show game screen\n    document.querySelectorAll('.screen').forEach(screen => {\n        screen.classList.remove('active');\n        screen.classList.add('hidden');\n    });\n    \n    const gameScreen = document.getElementById('game-screen');\n    if (gameScreen) {\n        gameScreen.classList.add('active');\n        gameScreen.classList.remove('hidden');\n    }\n    \n    // Wait a moment for the screen to show, then create the game\n    setTimeout(() => {\n        window.simpleGame = new Simple3DGame();\n        console.log('✅ Simple game created!');\n    }, 100);\n}\n\n// Export for global access\nif (typeof window !== 'undefined') {\n    window.Simple3DGame = Simple3DGame;\n    window.startSimpleGame = startSimpleGame;\n}"