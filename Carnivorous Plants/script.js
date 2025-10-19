// Carnivorous Plants 3D Collection Manager
class PlantCollectionManager3D {
    constructor() {
        this.currentScreen = 'main-menu';
        this.selectedSaveSlot = null;
        this.gameData = null;
        this.maxSaveSlots = 6;
        
        // Realistic 3D World System
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.worldPhysics = null;
        this.clock = new THREE.Clock();
        
        // World objects
        this.plants3D = [];
        this.interactables = [];
        this.npcs = [];
        this.stores = [];
        this.equipment = [];
        this.safetyEquipment = [];
        
        // In-game store system
        this.inGameStore = null;
        
        // Inventories
        this.storeInventory = [];
        this.equipmentInventory = [];
        this.playerInventory = {
            money: 250,
            coins: 0, // New coin system
            items: [],
            equipment: [],
            land_plots: 1, // Start with 1 greenhouse plot
            bank_account: 0
        };
        
        // Auto-earning system
        this.lastEarningTime = Date.now();
        this.earningRate = 0.01; // 1 cent every 0.1 seconds
        
        // Tutorial system
        this.tutorialActive = false; // Start with tutorial disabled for testing
        this.tutorialStep = 0;
        this.hasVisitedStore = false;
        this.hasThermostat = false;
        this.hasHumidityControl = false;
        this.hasFireExtinguisher = false;
        this.hasPhone = false;
        
        // Movement (support both WASD and arrow keys)
        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.canJump = false;
        this.velocity = new THREE.Vector3();
        this.isGrounded = false;
        
        // Interaction system
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.nearestInteractable = null;
        this.heldObject = null;
        
        // Real-world systems
        this.emergencyMode = false;
        this.powerOutage = false;
        this.currentLocation = 'greenhouse';
        
        // Performance monitoring
        this.fps = 60;
        this.lastTime = 0;
        
        // Make this accessible globally for physics system
        window.game = this;
        
        this.init();
    }
    
    init() {
        this.loadSaveSlots();
        this.setupEventListeners();
        this.showScreen('main-menu');
    }
    
    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            this.onKeyDown(e);
        });
        
        document.addEventListener('keyup', (e) => {
            this.onKeyUp(e);
        });
        
        document.addEventListener('click', (e) => {
            console.log('Click event:', e.target, 'currentScreen:', this.currentScreen);
            if (this.currentScreen === 'game-screen' && this.controls) {
                const canvas = document.getElementById('three-canvas');
                console.log('Canvas found:', canvas, 'target matches:', e.target === canvas);
                if (e.target === canvas || canvas.contains(e.target)) {
                    console.log('Requesting pointer lock...');
                    this.controls.lock();
                }
            }
        });
    }
    
    // Realistic 3D World Setup
    init3DEnvironment() {
        console.log('init3DEnvironment called');
        const canvas = document.getElementById('three-canvas');
        if (!canvas) {
            console.error('Canvas not found!');
            return;
        }
        console.log('Canvas found, initializing...');
        
        // Initialize realistic physics world
        console.log('Creating physics world...');
        this.worldPhysics = new RealisticWorldPhysics();
        
        // Scene setup with realistic sky
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(0x87CEEB, 20, 500);
        this.createRealisticSky();
        
        // Camera setup (human eye height)
        this.camera = new THREE.PerspectiveCamera(75, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
        this.camera.position.set(2, 1.75, 1); // Inside greenhouse, looking at plant stations
        this.camera.lookAt(-5, 1.5, -2); // Look toward the tiered plant benches
        
        // Renderer setup with realistic settings
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: canvas, 
            antialias: true,
            powerPreference: "high-performance"
        });
        this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
        this.renderer.setClearColor(0x87CEEB);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.physicallyCorrectLights = true;
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;
        
        // First-person controls
        this.controls = new THREE.PointerLockControls(this.camera, canvas);
        this.scene.add(this.controls.getObject());
        
        // Handle pointer lock events
        this.controls.addEventListener('lock', () => {
            console.log('✅ Pointer locked successfully!');
            const canvas = document.getElementById('three-canvas');
            if (canvas) {
                canvas.classList.add('mouse-locked');
                console.log('✅ Mouse-locked class added to canvas');
            }
        });
        
        this.controls.addEventListener('unlock', () => {
            console.log('❌ Pointer unlocked');
            const canvas = document.getElementById('three-canvas');
            if (canvas) {
                canvas.classList.remove('mouse-locked');
                console.log('❌ Mouse-locked class removed from canvas');
            }
        });
        
        // Player physics body
        this.setupPlayerPhysics();
        
        // Realistic lighting system
        this.setupRealisticLighting();
        
        // Create the realistic world
        this.createRealisticWorld();
        
        // Initialize equipment stores
        this.initializeEquipmentStores();
        
        // Create in-game plant store
        this.createInGameStore();
        
        // Start tutorial
        this.startTutorial();
        
        // Animation loop
        this.animate();
        
        // Interaction setup
        this.setupRealisticInteraction();
        
        // Resize handler
        window.addEventListener('resize', () => this.onWindowResize());
        
        console.log('3D Environment initialization completed successfully!');
    }
    
    createRealisticSky() {
        // Realistic sky dome
        const skyGeometry = new THREE.SphereGeometry(1000, 32, 15);
        const skyMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x87CEEB,
            side: THREE.BackSide,
            transparent: true,
            opacity: 0.8
        });
        const sky = new THREE.Mesh(skyGeometry, skyMaterial);
        this.scene.add(sky);
        
        // Clouds
        this.createClouds();
    }
    
    createClouds() {
        const cloudGeometry = new THREE.SphereGeometry(20, 8, 6);
        const cloudMaterial = new THREE.MeshLambertMaterial({ 
            color: 0xffffff,
            transparent: true,
            opacity: 0.7
        });
        
        for (let i = 0; i < 20; i++) {
            const cloud = new THREE.Mesh(cloudGeometry, cloudMaterial);
            cloud.position.set(
                (Math.random() - 0.5) * 800,
                50 + Math.random() * 50,
                (Math.random() - 0.5) * 800
            );
            cloud.scale.setScalar(0.5 + Math.random() * 1.5);
            this.scene.add(cloud);
        }
    }
    
    setupPlayerPhysics() {
        // Player collision body (capsule shape)
        const playerShape = new CANNON.Cylinder(0.5, 0.5, 1.8, 8);
        this.playerBody = new CANNON.Body({ mass: 70 }); // Average human weight
        this.playerBody.addShape(playerShape);
        this.playerBody.position.set(2, 1, 1); // Inside greenhouse, near center table
        this.playerBody.material = this.worldPhysics.materials.ground;
        this.worldPhysics.world.add(this.playerBody);
        
        // Lock rotation (prevent player from tipping over)
        this.playerBody.fixedRotation = true;
        this.playerBody.updateMassProperties();
    }
    
    setupLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
        this.scene.add(ambientLight);
        
        // Sun light
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(50, 50, 50);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 500;
        this.scene.add(directionalLight);
        
        // Point lights for interior
        const pointLight1 = new THREE.PointLight(0xffffff, 0.5, 30);
        pointLight1.position.set(10, 5, 10);
        this.scene.add(pointLight1);
        
        const pointLight2 = new THREE.PointLight(0xffffff, 0.5, 30);
        pointLight2.position.set(-10, 5, -10);
        this.scene.add(pointLight2);
    }
    
    createRealisticWorld() {
        // Massive world ground
        const groundGeometry = new THREE.PlaneGeometry(400, 400);
        const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x567d46 });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        
        // Physics ground body
        const groundShape = new CANNON.Plane();
        const groundBody = new CANNON.Body({ mass: 0 });
        groundBody.addShape(groundShape);
        groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
        this.worldPhysics.world.add(groundBody);
        this.scene.add(ground);
        
        // Starting greenhouse (empty) at spawn point
        this.createEmptyGreenhouse();
        
        // Main commercial street with stores
        this.createCommercialStreet();
        
        // Create all specialized stores
        this.createSpecializedStores();
        
        // Teleportation system
        this.createTeleportationSystem();
        
        // Interactive objects and NPCs
        this.createInteractables();
    }
    
    createTeleportationSystem() {
        // Teleport pads are created with each store
        // Main hub at greenhouse
        this.createTeleportPad(0, 10, "greenhouse");
    }
    
    createTeleportPad(x, z, destination) {
        // Glowing teleport pad like Roblox
        const padGeometry = new THREE.CylinderGeometry(2, 2, 0.2, 8);
        const padMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x00FFFF,
            transparent: true,
            opacity: 0.8
        });
        const pad = new THREE.Mesh(padGeometry, padMaterial);
        pad.position.set(x, 0.1, z);
        pad.userData = { 
            type: 'teleport_pad', 
            destination: destination,
            destinations: {
                greenhouse: { x: 0, y: 1.75, z: 5 },
                bank: { x: -80, y: 1.75, z: 35 },
                plant_store: { x: -40, y: 1.75, z: 35 },
                fly_attractor: { x: 0, y: 1.75, z: 35 },
                land_expansion: { x: 40, y: 1.75, z: 35 },
                emergency_store: { x: 80, y: 1.75, z: 35 },
                electronics: { x: -60, y: 1.75, z: 25 },
                advice_center: { x: -20, y: 1.75, z: 25 },
                equipment: { x: 20, y: 1.75, z: 25 },
                garden_center: { x: 60, y: 1.75, z: 25 }
            }
        };
        
        // Glowing effect
        const glowGeometry = new THREE.CylinderGeometry(2.5, 2.5, 0.1, 8);
        const glowMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x00FFFF,
            transparent: true,
            opacity: 0.3
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        glow.position.set(x, 0.15, z);
        this.scene.add(glow);
        
        // Animate glow
        const animateGlow = () => {
            glow.rotation.y += 0.01;
            glow.material.opacity = 0.2 + Math.sin(Date.now() * 0.005) * 0.1;
            requestAnimationFrame(animateGlow);
        };
        animateGlow();
        
        this.scene.add(pad);
        this.interactables.push(pad);
        
        // Physics body for teleport pad
        const padShape = new CANNON.Cylinder(2, 2, 0.2, 8);
        const padBody = new CANNON.Body({ mass: 0 });
        padBody.addShape(padShape);
        padBody.position.set(x, 0.1, z);
        this.worldPhysics.world.add(padBody);
    }
    
    createCentralTeleportHub() {
        // Central teleportation hub in the middle of the street
        const hubGeometry = new THREE.CylinderGeometry(5, 5, 1, 12);
        const hubMaterial = new THREE.MeshLambertMaterial({ 
            color: 0xFF00FF,
            transparent: true,
            opacity: 0.6
        });
        const hub = new THREE.Mesh(hubGeometry, hubMaterial);
        hub.position.set(0, 0.5, 40);
        hub.userData = { type: 'teleport_hub' };
        this.scene.add(hub);
        this.interactables.push(hub);
    }
    
    teleportPlayer(destination) {
        if (this.playerBody && this.nearestInteractable && this.nearestInteractable.userData.destinations) {
            const dest = this.nearestInteractable.userData.destinations[destination];
            if (dest) {
                // Teleport effect
                this.showNotification(`✨ Teleporting to ${destination}...`, 'info');
                
                // Move player
                this.playerBody.position.set(dest.x, dest.y, dest.z);
                this.controls.getObject().position.set(dest.x, dest.y + 0.8, dest.z);
                
                // Visual effect
                this.createTeleportEffect(dest);
            }
        }
    }
    
    createTeleportEffect(position) {
        // Particle effect for teleportation
        const effectGeometry = new THREE.SphereGeometry(0.1, 8, 8);
        const effectMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x00FFFF,
            transparent: true,
            opacity: 0.8
        });
        
        for (let i = 0; i < 20; i++) {
            const particle = new THREE.Mesh(effectGeometry, effectMaterial);
            particle.position.set(
                position.x + (Math.random() - 0.5) * 4,
                position.y + Math.random() * 3,
                position.z + (Math.random() - 0.5) * 4
            );
            this.scene.add(particle);
            
            // Remove particle after animation
            setTimeout(() => {
                this.scene.remove(particle);
            }, 1000);
        }
    }
    
    createCommercialStreet() {
        // Main commercial road
        const roadMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
        const mainRoad = new THREE.Mesh(new THREE.PlaneGeometry(200, 12), roadMaterial);
        mainRoad.rotation.x = -Math.PI / 2;
        mainRoad.position.set(0, 0.01, 40);
        this.scene.add(mainRoad);
        
        // Side road to greenhouse
        const sideRoad = new THREE.Mesh(new THREE.PlaneGeometry(8, 30), roadMaterial);
        sideRoad.rotation.x = -Math.PI / 2;
        sideRoad.position.set(0, 0.01, 20);
        this.scene.add(sideRoad);
        
        // Road markings and sidewalks
        this.createStreetDetails();
    }
    
    createStreetDetails() {
        // White lane markings
        const lineMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
        
        // Center line
        for (let x = -90; x <= 90; x += 8) {
            const dash = new THREE.Mesh(new THREE.PlaneGeometry(4, 0.3), lineMaterial);
            dash.rotation.x = -Math.PI / 2;
            dash.position.set(x, 0.02, 40);
            this.scene.add(dash);
        }
        
        // Sidewalks
        const sidewalkMaterial = new THREE.MeshLambertMaterial({ color: 0x888888 });
        
        // North sidewalk
        const northSidewalk = new THREE.Mesh(new THREE.PlaneGeometry(200, 4), sidewalkMaterial);
        northSidewalk.rotation.x = -Math.PI / 2;
        northSidewalk.position.set(0, 0.02, 48);
        this.scene.add(northSidewalk);
        
        // South sidewalk
        const southSidewalk = new THREE.Mesh(new THREE.PlaneGeometry(200, 4), sidewalkMaterial);
        southSidewalk.rotation.x = -Math.PI / 2;
        southSidewalk.position.set(0, 0.02, 32);
        this.scene.add(southSidewalk);
    }
    
    createEmptyGreenhouse() {
        console.log('🏡 Creating detailed greenhouse interior...');
        
        // FLOOR - Concrete greenhouse floor with drainage
        const floorGeometry = new THREE.PlaneGeometry(20, 16);
        const floorMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x8a8a8a,
            roughness: 0.8
        });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = 0;
        floor.receiveShadow = true;
        this.scene.add(floor);
        
        // GLASS WALLS with frame structure
        const glassMaterial = new THREE.MeshLambertMaterial({ 
            color: 0xe8f4fd, 
            transparent: true, 
            opacity: 0.3
        });
        const frameMaterial = new THREE.MeshLambertMaterial({ color: 0x2d5016 });
        
        // Back wall
        const backWall = new THREE.Mesh(new THREE.PlaneGeometry(20, 8), glassMaterial);
        backWall.position.set(0, 4, -8);
        this.scene.add(backWall);
        
        // Side walls  
        const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(16, 8), glassMaterial);
        leftWall.position.set(-10, 4, 0);
        leftWall.rotation.y = Math.PI / 2;
        this.scene.add(leftWall);
        
        const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(16, 8), glassMaterial);
        rightWall.position.set(10, 4, 0);
        rightWall.rotation.y = -Math.PI / 2;
        this.scene.add(rightWall);
        
        // Front walls with entrance
        const frontWallLeft = new THREE.Mesh(new THREE.PlaneGeometry(7, 8), glassMaterial);
        frontWallLeft.position.set(-6.5, 4, 8);
        this.scene.add(frontWallLeft);
        
        const frontWallRight = new THREE.Mesh(new THREE.PlaneGeometry(7, 8), glassMaterial);
        frontWallRight.position.set(6.5, 4, 8);
        this.scene.add(frontWallRight);
        
        // GLASS ROOF with supporting beams
        const roofMaterial = new THREE.MeshLambertMaterial({ 
            color: 0xe8f4fd, 
            transparent: true, 
            opacity: 0.2
        });
        
        // Multiple roof panels
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 3; j++) {
                const roofPanel = new THREE.Mesh(new THREE.PlaneGeometry(5, 5.3), roofMaterial);
                roofPanel.rotation.x = -Math.PI / 2;
                roofPanel.position.set(-7.5 + i * 5, 8, -6 + j * 5.3);
                this.scene.add(roofPanel);
            }
        }
        
        // Supporting frame beams
        this.createGreenhouseFrame();
        
        // PLANT STATIONS and detailed interior
        this.createDetailedPlantStations();
        
        // GREENHOUSE EQUIPMENT
        this.createGreenhouseEquipment();
        
        // LIGHTING SYSTEM
        this.createGreenhouseLighting();
        
        // ENTRANCE DOOR
        this.createGreenhouseDoor();
    }
    
    createDetailedPlantStations() {
        console.log('🌿 Creating detailed plant stations...');
        
        const benchMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
        const metalMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
        
        // LEFT SIDE - Tiered plant benches
        for (let tier = 0; tier < 3; tier++) {
            const bench = new THREE.Mesh(
                new THREE.BoxGeometry(18, 0.3, 2.5), 
                benchMaterial
            );
            bench.position.set(-8.5, 0.8 + tier * 1.2, -5 + tier * 2);
            bench.castShadow = true;
            this.scene.add(bench);
            
            // Metal support legs
            for (let i = 0; i < 4; i++) {
                const leg = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.1, 0.1, 0.8 + tier * 1.2),
                    metalMaterial
                );
                leg.position.set(
                    -8.5 + (-7 + i * 4.7),
                    (0.8 + tier * 1.2) / 2,
                    -5 + tier * 2
                );
                this.scene.add(leg);
            }
        }
        
        // RIGHT SIDE - Standard benches with storage underneath
        for (let i = 0; i < 3; i++) {
            const bench = new THREE.Mesh(
                new THREE.BoxGeometry(16, 0.3, 2), 
                benchMaterial
            );
            bench.position.set(7.5, 0.9, -4 + i * 3);
            bench.castShadow = true;
            this.scene.add(bench);
            
            // Storage shelves underneath
            const shelf = new THREE.Mesh(
                new THREE.BoxGeometry(15, 0.2, 1.5), 
                benchMaterial
            );
            shelf.position.set(7.5, 0.4, -4 + i * 3);
            this.scene.add(shelf);
        }
        
        // CENTER - Main potting table with tools
        const pottingTable = new THREE.Mesh(
            new THREE.BoxGeometry(6, 0.4, 3), 
            new THREE.MeshLambertMaterial({ color: 0x8B4513 })
        );
        pottingTable.position.set(0, 0.9, 4);
        pottingTable.castShadow = true;
        this.scene.add(pottingTable);
        
        // Add some plant pots and tools on tables
        this.addPottingSupplies();
    }
    
    createGreenhouseDoor() {
        const doorFrameMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
        const glassMaterial = new THREE.MeshLambertMaterial({ 
            color: 0xe8f4fd, 
            transparent: true, 
            opacity: 0.6
        });
        
        // Door frame
        const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(4, 7, 0.3), doorFrameMaterial);
        doorFrame.position.set(0, 3.5, 8.1);
        this.scene.add(doorFrame);
        
        // Glass door panels
        const leftDoor = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 6), glassMaterial);
        leftDoor.position.set(-0.9, 3.5, 8.05);
        this.scene.add(leftDoor);
        
        const rightDoor = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 6), glassMaterial);
        rightDoor.position.set(0.9, 3.5, 8.05);
        this.scene.add(rightDoor);
        
        // Door handles
        const handleMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
        const leftHandle = new THREE.Mesh(
            new THREE.CylinderGeometry(0.05, 0.05, 0.3),
            handleMaterial
        );
        leftHandle.rotation.z = Math.PI / 2;
        leftHandle.position.set(-0.5, 3.5, 8.2);
        this.scene.add(leftHandle);
        
        const rightHandle = new THREE.Mesh(
            new THREE.CylinderGeometry(0.05, 0.05, 0.3),
            handleMaterial
        );
        rightHandle.rotation.z = Math.PI / 2;
        rightHandle.position.set(0.5, 3.5, 8.2);
        this.scene.add(rightHandle);
    }
    
    createGreenhouseFrame() {
        console.log('🏭 Creating greenhouse frame structure...');
        const frameMaterial = new THREE.MeshLambertMaterial({ color: 0x2d5016 });
        
        // Vertical corner posts
        const cornerPositions = [
            [-10, 4, -8], [10, 4, -8], [-10, 4, 8], [10, 4, 8]
        ];
        
        cornerPositions.forEach(pos => {
            const post = new THREE.Mesh(
                new THREE.BoxGeometry(0.3, 8, 0.3),
                frameMaterial
            );
            post.position.set(pos[0], pos[1], pos[2]);
            post.castShadow = true;
            this.scene.add(post);
        });
        
        // Horizontal roof beams
        for (let i = 0; i <= 4; i++) {
            const beam = new THREE.Mesh(
                new THREE.BoxGeometry(0.2, 0.3, 16),
                frameMaterial
            );
            beam.position.set(-8 + i * 4, 8, 0);
            this.scene.add(beam);
        }
        
        for (let j = 0; j <= 3; j++) {
            const beam = new THREE.Mesh(
                new THREE.BoxGeometry(20, 0.3, 0.2),
                frameMaterial
            );
            beam.position.set(0, 8, -6 + j * 4);
            this.scene.add(beam);
        }
    }
    
    createGreenhouseEquipment() {
        console.log('🔧 Adding greenhouse equipment...');
        
        // Thermometer on wall
        const thermometer = new THREE.Mesh(
            new THREE.BoxGeometry(0.1, 0.8, 0.05),
            new THREE.MeshLambertMaterial({ color: 0xffffff })
        );
        thermometer.position.set(-9.8, 2, -2);
        this.scene.add(thermometer);
        
        // Watering can
        const wateringCan = new THREE.Mesh(
            new THREE.CylinderGeometry(0.3, 0.4, 0.6),
            new THREE.MeshLambertMaterial({ color: 0x228B22 })
        );
        wateringCan.position.set(2, 1.2, 4);
        this.scene.add(wateringCan);
        
        // Misting system pipes
        for (let i = 0; i < 5; i++) {
            const pipe = new THREE.Mesh(
                new THREE.CylinderGeometry(0.05, 0.05, 16),
                new THREE.MeshLambertMaterial({ color: 0x444444 })
            );
            pipe.rotation.z = Math.PI / 2;
            pipe.position.set(0, 7, -6 + i * 3);
            this.scene.add(pipe);
            
            // Misting nozzles
            for (let j = 0; j < 4; j++) {
                const nozzle = new THREE.Mesh(
                    new THREE.SphereGeometry(0.03),
                    new THREE.MeshLambertMaterial({ color: 0x666666 })
                );
                nozzle.position.set(-6 + j * 4, 7, -6 + i * 3);
                this.scene.add(nozzle);
            }
        }
        
        // Fans for air circulation
        const fan = new THREE.Mesh(
            new THREE.CylinderGeometry(0.8, 0.8, 0.2),
            new THREE.MeshLambertMaterial({ color: 0x333333 })
        );
        fan.position.set(0, 6, -7.5);
        this.scene.add(fan);
    }
    
    createGreenhouseLighting() {
        console.log('💡 Installing greenhouse lighting...');
        
        // Hanging grow lights
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 2; j++) {
                const lightFixture = new THREE.Mesh(
                    new THREE.BoxGeometry(2, 0.3, 1),
                    new THREE.MeshLambertMaterial({ color: 0xffffff })
                );
                lightFixture.position.set(-4 + j * 8, 6, -4 + i * 4);
                this.scene.add(lightFixture);
                
                // LED strips
                const ledStrip = new THREE.Mesh(
                    new THREE.BoxGeometry(1.8, 0.1, 0.8),
                    new THREE.MeshBasicMaterial({ color: 0xff00ff })
                );
                ledStrip.position.set(-4 + j * 8, 5.8, -4 + i * 4);
                this.scene.add(ledStrip);
                
                // Hanging chains
                const chain = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.02, 0.02, 2),
                    new THREE.MeshLambertMaterial({ color: 0x444444 })
                );
                chain.position.set(-4 + j * 8, 7, -4 + i * 4);
                this.scene.add(chain);
            }
        }
    }
    
    addPottingSupplies() {
        console.log('🩴 Adding potting supplies and tools...');
        
        // Terra cotta pots of various sizes
        const potSizes = [0.15, 0.2, 0.25, 0.3];
        const potMaterial = new THREE.MeshLambertMaterial({ color: 0xcd853f });
        
        for (let i = 0; i < 12; i++) {
            const size = potSizes[Math.floor(Math.random() * potSizes.length)];
            const pot = new THREE.Mesh(
                new THREE.CylinderGeometry(size, size * 0.8, size * 1.2),
                potMaterial
            );
            
            // Randomly place on benches
            const benchChoice = Math.floor(Math.random() * 3);
            let x, z;
            if (benchChoice === 0) { // Left tiered benches
                x = -8.5 + (Math.random() - 0.5) * 16;
                z = -5 + Math.floor(Math.random() * 3) * 2;
            } else if (benchChoice === 1) { // Right benches
                x = 7.5 + (Math.random() - 0.5) * 14;
                z = -4 + Math.floor(Math.random() * 3) * 3;
            } else { // Center table
                x = (Math.random() - 0.5) * 5;
                z = 4 + (Math.random() - 0.5) * 2;
            }
            
            pot.position.set(x, 1.1 + size * 0.6, z);
            pot.castShadow = true;
            this.scene.add(pot);
        }
        
        // Gardening tools
        const toolMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        
        // Trowel
        const trowel = new THREE.Mesh(
            new THREE.BoxGeometry(0.05, 0.4, 0.1),
            toolMaterial
        );
        trowel.position.set(1.5, 1.2, 4.5);
        trowel.rotation.z = Math.PI / 6;
        this.scene.add(trowel);
        
        // Pruning shears
        const shears = new THREE.Mesh(
            new THREE.BoxGeometry(0.03, 0.3, 0.03),
            new THREE.MeshLambertMaterial({ color: 0x444444 })
        );
        shears.position.set(-1.2, 1.2, 4.2);
        this.scene.add(shears);
        
        // Bags of soil
        for (let i = 0; i < 3; i++) {
            const soilBag = new THREE.Mesh(
                new THREE.BoxGeometry(0.8, 0.6, 0.4),
                new THREE.MeshLambertMaterial({ color: 0x654321 })
            );
            soilBag.position.set(7.5 + (i - 1) * 1.2, 0.6, 1);
            this.scene.add(soilBag);
        }
    }
    
    createRoadSystem() {
        const roadMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
        
        // Main road running east-west
        const mainRoad = new THREE.Mesh(new THREE.PlaneGeometry(120, 8), roadMaterial);
        mainRoad.rotation.x = -Math.PI / 2;
        mainRoad.position.set(0, 0.01, 25);
        this.scene.add(mainRoad);
        
        // Side road connecting greenhouse to main road
        const sideRoad = new THREE.Mesh(new THREE.PlaneGeometry(6, 20), roadMaterial);
        sideRoad.rotation.x = -Math.PI / 2;
        sideRoad.position.set(0, 0.01, 15);
        this.scene.add(sideRoad);
        
        // Road markings
        this.createRoadMarkings();
    }
    
    createRoadMarkings() {
        const lineMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
        
        // Center line dashes
        for (let x = -50; x <= 50; x += 10) {
            const dash = new THREE.Mesh(new THREE.PlaneGeometry(4, 0.3), lineMaterial);
            dash.rotation.x = -Math.PI / 2;
            dash.position.set(x, 0.02, 25);
            this.scene.add(dash);
        }
    }
    
    createSpecializedStores() {
        const storePositions = [
            { x: -80, z: 48, name: "bank", color: 0x4169E1, sign: "🏦 BANK" },
            { x: -40, z: 48, name: "plant_store", color: 0x228B22, sign: "🌿 PLANTS" },
            { x: 0, z: 48, name: "fly_attractor", color: 0x8B4513, sign: "🪰 FLY SHOP" },
            { x: 40, z: 48, name: "land_expansion", color: 0xDEB887, sign: "🏡 LAND" },
            { x: 80, z: 48, name: "emergency_store", color: 0xDC143C, sign: "🚨 EMERGENCY" },
            { x: -60, z: 32, name: "electronics", color: 0x4B0082, sign: "🔌 ELECTRONICS" },
            { x: -20, z: 32, name: "advice_center", color: 0xFF6347, sign: "👨‍🔬 ADVICE" },
            { x: 20, z: 32, name: "equipment", color: 0x2F4F4F, sign: "🛠️ EQUIPMENT" },
            { x: 60, z: 32, name: "garden_center", color: 0x32CD32, sign: "🌱 GARDEN" }
        ];
        
        storePositions.forEach(store => {
            this.createStoreBuilding(store.x, store.z, store.name, store.color, store.sign);
            this.createTeleportPad(store.x, store.z - 8, store.name);
        });
        
        // Central teleport hub
        this.createCentralTeleportHub();
    }
    
    createStoreBuilding(x, z, storeName, color, signText) {
        // Main building
        const buildingGeometry = new THREE.BoxGeometry(12, 8, 10);
        const buildingMaterial = new THREE.MeshLambertMaterial({ color: color });
        const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
        building.position.set(x, 4, z);
        building.castShadow = true;
        building.userData = { type: 'store_building', storeName: storeName };
        this.scene.add(building);
        
        // Store sign
        const signGeometry = new THREE.PlaneGeometry(10, 2);
        const signMaterial = new THREE.MeshLambertMaterial({ 
            color: 0xFFFFFF,
            transparent: true,
            opacity: 0.9
        });
        const sign = new THREE.Mesh(signGeometry, signMaterial);
        sign.position.set(x, 9, z + 5.1);
        this.scene.add(sign);
        
        // Add text to sign (simplified - in real implementation would use TextGeometry)
        const textHelper = document.createElement('div');
        textHelper.textContent = signText;
        
        // Store entrance
        const doorGeometry = new THREE.BoxGeometry(2, 6, 0.2);
        const doorMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
        const door = new THREE.Mesh(doorGeometry, doorMaterial);
        door.position.set(x, 3, z + 5);
        door.userData = { type: 'store_entrance', storeName: storeName };
        this.scene.add(door);
        this.interactables.push(door);
        
        // Store interior preview windows
        this.createStoreWindows(x, z, storeName);
        
        // Physics body for building
        const buildingShape = new CANNON.Box(new CANNON.Vec3(6, 4, 5));
        const buildingBody = new CANNON.Body({ mass: 0 });
        buildingBody.addShape(buildingShape);
        buildingBody.position.set(x, 4, z);
        this.worldPhysics.world.add(buildingBody);
    }
    
    createStoreWindows(x, z, storeName) {
        const windowMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x87CEEB,
            transparent: true,
            opacity: 0.7
        });
        
        // Front windows
        for (let i = -1; i <= 1; i += 2) {
            const window = new THREE.Mesh(new THREE.PlaneGeometry(2, 3), windowMaterial);
            window.position.set(x + i * 3, 5, z + 4.9);
            this.scene.add(window);
        }
        
        // Side windows
        for (let i = -1; i <= 1; i += 2) {
            const window = new THREE.Mesh(new THREE.PlaneGeometry(2, 3), windowMaterial);
            window.position.set(x + i * 5.9, 5, z);
            window.rotation.y = Math.PI / 2;
            this.scene.add(window);
        }
    }
    
    createPath() {
        const pathMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 });
        for (let i = 0; i < 10; i++) {
            const pathTile = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), pathMaterial);
            pathTile.rotation.x = -Math.PI / 2;
            pathTile.position.set(2 + i * 2, 0.01, 2);
            this.scene.add(pathTile);
        }
    }
    
    createInitialPlants() {
        // Create some default plants in the greenhouse
        if (this.gameData && this.gameData.plants.length > 0) {
            this.gameData.plants.forEach((plant, index) => {
                this.create3DPlant(plant, index);
            });
        } else {
            // Create a sample plant for demonstration
            this.createSamplePlant();
        }
    }
    
    createSamplePlant() {
        const plant = {
            id: 'sample-1',
            name: 'Sample Venus Flytrap',
            species: 'dionaea-muscipula',
            health: 85,
            age: 45
        };
        this.create3DPlant(plant, 0);
    }
    
    create3DPlant(plantData, index) {
        const plantGroup = new THREE.Group();
        
        // Pot
        const potGeometry = new THREE.CylinderGeometry(0.5, 0.3, 0.6, 8);
        const potMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        const pot = new THREE.Mesh(potGeometry, potMaterial);
        pot.castShadow = true;
        plantGroup.add(pot);
        
        // Plant based on species with growth stages
        // Add growth stage if not present
        if (!plantData.stage) {
            plantData.stage = Math.floor(plantData.age / 25); // Stage based on age
        }
        
        this.createPlantModel(plantGroup, plantData.species, plantData);
        
        // Position on bench
        const benchPositions = [
            { x: -6, y: 1.5, z: -3 }, { x: -6, y: 1.5, z: -1 }, { x: -6, y: 1.5, z: 1 }, { x: -6, y: 1.5, z: 3 },
            { x: 6, y: 1.5, z: -3 }, { x: 6, y: 1.5, z: -1 }, { x: 6, y: 1.5, z: 1 }, { x: 6, y: 1.5, z: 3 },
            { x: -1, y: 1.5, z: -6 }, { x: 1, y: 1.5, z: -6 }
        ];
        
        if (index < benchPositions.length) {
            const pos = benchPositions[index];
            plantGroup.position.set(pos.x, pos.y, pos.z);
        }
        
        plantGroup.userData = { type: 'plant', data: plantData };
        this.scene.add(plantGroup);
        this.plants3D.push(plantGroup);
        this.interactables.push(plantGroup);
    }
    
    createPlantModel(group, species, plantData) {
        // Use realistic plant models with growth stages
        if (window.RealisticPlantModels) {
            return window.RealisticPlantModels.createPlantModel(group, species, plantData);
        } else {
            // Fallback to basic models
            const healthColor = plantData.health > 80 ? 0x228B22 : plantData.health > 60 ? 0x90EE90 : plantData.health > 40 ? 0xFFFF00 : 0xFF6347;
            
            if (species === 'dionaea-muscipula') {
                this.createVenusFlytrap(group, healthColor);
            } else if (species.startsWith('nepenthes')) {
                this.createPitcherPlant(group, healthColor);
            } else if (species.startsWith('sarracenia')) {
                this.createSarracenia(group, healthColor);
            } else {
                this.createGenericPlant(group, healthColor);
            }
        }
    }
    
    createVenusFlytrap(group, color) {
        // Main plant body
        const bodyGeometry = new THREE.SphereGeometry(0.2, 8, 6);
        const bodyMaterial = new THREE.MeshLambertMaterial({ color: color });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.3;
        group.add(body);
        
        // Traps
        for (let i = 0; i < 4; i++) {
            const trapGeometry = new THREE.SphereGeometry(0.1, 6, 4);
            const trapMaterial = new THREE.MeshLambertMaterial({ color: 0xFF69B4 });
            const trap = new THREE.Mesh(trapGeometry, trapMaterial);
            
            const angle = (i / 4) * Math.PI * 2;
            trap.position.set(
                Math.cos(angle) * 0.3,
                0.4 + Math.random() * 0.2,
                Math.sin(angle) * 0.3
            );
            group.add(trap);
        }
    }
    
    createPitcherPlant(group, color) {
        // Vine
        const vineGeometry = new THREE.CylinderGeometry(0.02, 0.02, 1, 4);
        const vineMaterial = new THREE.MeshLambertMaterial({ color: color });
        const vine = new THREE.Mesh(vineGeometry, vineMaterial);
        vine.position.y = 0.8;
        group.add(vine);
        
        // Pitcher
        const pitcherGeometry = new THREE.CylinderGeometry(0.15, 0.1, 0.4, 8);
        const pitcherMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        const pitcher = new THREE.Mesh(pitcherGeometry, pitcherMaterial);
        pitcher.position.set(0.2, 1.2, 0);
        pitcher.rotation.z = 0.3;
        group.add(pitcher);
        
        // Lid
        const lidGeometry = new THREE.ConeGeometry(0.18, 0.1, 8);
        const lidMaterial = new THREE.MeshLambertMaterial({ color: 0xFF6347 });
        const lid = new THREE.Mesh(lidGeometry, lidMaterial);
        lid.position.set(0.25, 1.35, 0);
        lid.rotation.z = 0.3;
        group.add(lid);
    }
    
    createSarracenia(group, color) {
        // Pitcher tube
        const pitcherGeometry = new THREE.CylinderGeometry(0.08, 0.12, 0.8, 8);
        const pitcherMaterial = new THREE.MeshLambertMaterial({ color: color });
        const pitcher = new THREE.Mesh(pitcherGeometry, pitcherMaterial);
        pitcher.position.y = 0.7;
        pitcher.rotation.z = 0.1;
        group.add(pitcher);
        
        // Hood
        const hoodGeometry = new THREE.SphereGeometry(0.15, 8, 6);
        const hoodMaterial = new THREE.MeshLambertMaterial({ color: 0xFF6347 });
        const hood = new THREE.Mesh(hoodGeometry, hoodMaterial);
        hood.position.set(0.05, 1.1, 0);
        hood.scale.y = 0.5;
        group.add(hood);
    }
    
    createGenericPlant(group, color) {
        // Simple leafy plant
        const stemGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.5, 4);
        const stemMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 });
        const stem = new THREE.Mesh(stemGeometry, stemMaterial);
        stem.position.y = 0.5;
        group.add(stem);
        
        // Leaves
        for (let i = 0; i < 6; i++) {
            const leafGeometry = new THREE.SphereGeometry(0.1, 6, 4);
            const leafMaterial = new THREE.MeshLambertMaterial({ color: color });
            const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
            
            const angle = (i / 6) * Math.PI * 2;
            leaf.position.set(
                Math.cos(angle) * 0.2,
                0.6 + Math.random() * 0.3,
                Math.sin(angle) * 0.2
            );
            group.add(leaf);
        }
    }
    
    createInteractables() {
        // Store entrance trigger
        const storeEntranceGeometry = new THREE.BoxGeometry(3, 3, 1);
        const storeEntranceMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x00ff00, 
            transparent: true, 
            opacity: 0 
        });
        const storeEntrance = new THREE.Mesh(storeEntranceGeometry, storeEntranceMaterial);
        storeEntrance.position.set(25, 1.5, 2);
        storeEntrance.userData = { type: 'store_entrance' };
        this.scene.add(storeEntrance);
        this.interactables.push(storeEntrance);
        
        // Environmental controls (replace sliders with 3D objects)
        this.createEnvironmentalControls();
    }
    
    createEnvironmentalControls() {
        // Temperature control panel
        const tempControlGeometry = new THREE.BoxGeometry(1, 1.5, 0.2);
        const tempControlMaterial = new THREE.MeshLambertMaterial({ color: 0xff4444 });
        const tempControl = new THREE.Mesh(tempControlGeometry, tempControlMaterial);
        tempControl.position.set(-8, 2, -9);
        tempControl.userData = { type: 'temperature_control' };
        this.scene.add(tempControl);
        this.interactables.push(tempControl);
        
        // Humidity control panel
        const humidityControlGeometry = new THREE.BoxGeometry(1, 1.5, 0.2);
        const humidityControlMaterial = new THREE.MeshLambertMaterial({ color: 0x4444ff });
        const humidityControl = new THREE.Mesh(humidityControlGeometry, humidityControlMaterial);
        humidityControl.position.set(0, 2, -9);
        humidityControl.userData = { type: 'humidity_control' };
        this.scene.add(humidityControl);
        this.interactables.push(humidityControl);
        
        // Light control panel
        const lightControlGeometry = new THREE.BoxGeometry(1, 1.5, 0.2);
        const lightControlMaterial = new THREE.MeshLambertMaterial({ color: 0xffff44 });
        const lightControl = new THREE.Mesh(lightControlGeometry, lightControlMaterial);
        lightControl.position.set(8, 2, -9);
        lightControl.userData = { type: 'light_control' };
        this.scene.add(lightControl);
        this.interactables.push(lightControl);
    }
    
    setupInteraction() {
        this.raycaster = new THREE.Raycaster();
        this.raycaster.far = 3; // Interaction distance
    }
    
    checkInteractions() {
        if (!this.controls.isLocked) return;
        
        // Cast ray from camera center
        this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
        
        const intersects = this.raycaster.intersectObjects(this.interactables);
        const interactionPrompt = document.getElementById('interaction-prompt');
        
        if (intersects.length > 0) {
            const nearest = intersects[0].object;
            this.nearestInteractable = nearest;
            
            // Show interaction prompt
            interactionPrompt.style.display = 'block';
            interactionPrompt.textContent = this.getInteractionText(nearest.userData.type);
            
            // Update plant info panel
            if (nearest.userData.type === 'plant') {
                this.updatePlantInfo(nearest.userData.data);
            }
        } else {
            this.nearestInteractable = null;
            interactionPrompt.style.display = 'none';
            this.clearPlantInfo();
        }
    }
    
    getInteractionText(type) {
        switch (type) {
            case 'plant':
                return 'Press E to care for plant';
            case 'store_entrance':
                return 'Press E to enter store';
            case 'temperature_control':
                return 'Press E to adjust temperature';
            case 'humidity_control':
                return 'Press E to adjust humidity';
            case 'light_control':
                return 'Press E to adjust lighting';
            default:
                return 'Press E to interact';
        }
    }
    
    interact() {
        if (!this.nearestInteractable) return;
        
        const type = this.nearestInteractable.userData.type;
        const storeName = this.nearestInteractable.userData.storeName;
        
        switch (type) {
            case 'plant':
                this.showPlantCareMenu(this.nearestInteractable.userData.data);
                break;
            case 'store_entrance':
                this.enterSpecializedStore(storeName);
                break;
            case 'teleport_pad':
                this.showTeleportMenu();
                break;
            case 'teleport_hub':
                this.showTeleportMenu();
                break;
            case 'temperature_control':
                this.adjustTemperature();
                break;
            case 'humidity_control':
                this.adjustHumidity();
                break;
            case 'light_control':
                this.adjustLighting();
                break;
        }
    }
    
    enterSpecializedStore(storeName) {
        switch (storeName) {
            case 'bank':
                this.openBankInterface();
                break;
            case 'plant_store':
                this.openPlantStore();
                break;
            case 'fly_attractor':
                this.openFlyAttractorStore();
                break;
            case 'land_expansion':
                this.openLandExpansionStore();
                break;
            case 'emergency_store':
                this.openEmergencyStore();
                break;
            case 'electronics':
                this.openElectronicsStore();
                break;
            case 'advice_center':
                this.openAdviceCenter();
                break;
            case 'equipment':
                this.openEquipmentStore();
                break;
            case 'garden_center':
                this.openGardenCenter();
                break;
            default:
                this.showNotification(`Entering ${storeName}...`, 'info');
        }
    }
    
    showTeleportMenu() {
        const destinations = Object.keys(this.nearestInteractable.userData.destinations || {});
        if (destinations.length > 0) {
            const choice = prompt(`Choose destination:\n${destinations.join('\n')}`);
            if (choice && destinations.includes(choice)) {
                this.teleportPlayer(choice);
            }
        }
    }
    
    openBankInterface() {
        this.showNotification('🏦 Welcome to Carnivorous Plant Bank! Manage your finances here.', 'info');
        const action = prompt('Bank Services:\n1. Deposit Money\n2. Withdraw Money\n3. Check Balance\nEnter 1, 2, or 3:');
        
        switch (action) {
            case '1':
                const depositAmount = parseFloat(prompt('How much to deposit?'));
                if (depositAmount > 0 && depositAmount <= this.playerInventory.money) {
                    this.playerInventory.money -= depositAmount;
                    this.playerInventory.bank_account += depositAmount;
                    this.showNotification(`Deposited $${depositAmount.toFixed(2)}`, 'success');
                }
                break;
            case '2':
                const withdrawAmount = parseFloat(prompt('How much to withdraw?'));
                if (withdrawAmount > 0 && withdrawAmount <= this.playerInventory.bank_account) {
                    this.playerInventory.bank_account -= withdrawAmount;
                    this.playerInventory.money += withdrawAmount;
                    this.showNotification(`Withdrew $${withdrawAmount.toFixed(2)}`, 'success');
                }
                break;
            case '3':
                this.showNotification(`Bank Balance: $${this.playerInventory.bank_account.toFixed(2)}`, 'info');
                break;
        }
    }
    
    openPlantStore() {
        this.showScreen('store-screen');
        this.generateStoreInventory();
        this.populateStore();
        
        // Add advice person functionality
        this.addAdvicePersonToStore();
    }
    
    addAdvicePersonToStore() {
        const storeInterface = document.querySelector('.store-interface');
        if (storeInterface) {
            const adviceBanner = document.createElement('div');
            adviceBanner.style.cssText = `
                background: #ff6b35;
                color: white;
                padding: 15px;
                margin: 10px;
                border-radius: 8px;
                text-align: center;
                font-weight: bold;
            `;
            adviceBanner.innerHTML = `
                <h3>🧑‍🔬 Dr. Green - Plant Expert</h3>
                <p>Get professional plant diagnosis for 10 coins!</p>
                <button onclick="consultPlantExpert()" style="background: white; color: #ff6b35; border: none; padding: 8px 16px; border-radius: 4px; font-weight: bold; cursor: pointer;">
                    Consult Expert (10 🪙)
                </button>
            `;
            storeInterface.insertBefore(adviceBanner, storeInterface.children[1]);
        }
    }
    
    openFlyAttractorStore() {
        this.showNotification('🪰 Fly Attractor Store: UV lights, sticky traps, and fruit flies for feeding!', 'info');
        const items = [
            { name: 'UV Fly Light', price: 25.00, description: 'Attracts flying insects' },
            { name: 'Sticky Trap', price: 5.00, description: 'Catches small flies' },
            { name: 'Fruit Fly Culture', price: 15.00, description: 'Live fruit flies for feeding' },
            { name: 'Cricket Container', price: 35.00, description: 'Live crickets for large plants' }
        ];
        
        this.showSimpleStore('Fly Attractor Store', items);
    }
    
    openLandExpansionStore() {
        this.showNotification('🏡 Land Expansion: Buy more greenhouse plots!', 'info');
        const price = this.playerInventory.land_plots * 500; // Increasing price
        const buyLand = confirm(`Buy additional greenhouse plot for $${price}?`);
        
        if (buyLand && this.playerInventory.money >= price) {
            this.playerInventory.money -= price;
            this.playerInventory.land_plots++;
            this.showNotification(`Purchased new greenhouse plot! Total: ${this.playerInventory.land_plots}`, 'success');
        }
    }
    
    openEmergencyStore() {
        this.showNotification('🚨 Emergency Equipment Store: Safety first!', 'info');
        const items = [
            { name: 'Fire Extinguisher', price: 45.00, description: 'CO2 extinguisher for electrical fires' },
            { name: 'Emergency Phone', price: 25.00, description: 'Direct line to emergency services' },
            { name: 'First Aid Kit', price: 30.00, description: 'Complete medical emergency kit' },
            { name: 'Emergency Generator', price: 200.00, description: 'Backup power for equipment' }
        ];
        
        this.showSimpleStore('Emergency Equipment', items);
    }
    
    openElectronicsStore() {
        this.showNotification('🔌 Electronics Store: High-tech climate control!', 'info');
        const items = [
            { name: 'Smart Thermostat', price: 150.00, description: 'WiFi-enabled with app control' },
            { name: 'Advanced Humidifier', price: 89.00, description: 'Ultrasonic with timer' },
            { name: 'LED Grow Lights', price: 75.00, description: 'Full spectrum plant lighting' },
            { name: 'Environmental Monitor', price: 120.00, description: 'Real-time climate tracking' }
        ];
        
        this.showSimpleStore('Electronics Store', items);
    }
    
    openAdviceCenter() {
        this.showNotification('👨‍🔬 Advice Center: Expert plant consultation!', 'info');
        if (this.playerInventory.coins >= 10) {
            const consultation = confirm('Get plant advice from Dr. Martinez for 10 coins?');
            if (consultation) {
                this.playerInventory.coins -= 10;
                this.provideExpertAdvice();
            }
        } else {
            this.showNotification('Need 10 coins for consultation!', 'error');
        }
    }
    
    provideExpertAdvice() {
        if (this.gameData && this.gameData.plants.length > 0) {
            const plant = this.gameData.plants[0]; // Check first plant
            let advice = "Dr. Martinez says: ";
            
            if (plant.health < 50) {
                advice += "Your plant needs immediate attention! ";
                if (plant.lastWatered < Date.now() - 86400000) {
                    advice += "Water it now with distilled water! ";
                }
                advice += "Check humidity levels and ensure proper drainage.";
            } else if (plant.health < 70) {
                advice += "Your plant is struggling. Increase humidity and check for proper feeding schedule.";
            } else {
                advice += "Your plant looks healthy! Keep up the good care routine.";
            }
            
            this.showNotification(advice, 'info');
        } else {
            this.showNotification('Dr. Martinez: First, you need to buy some plants! Visit the plant store.', 'info');
        }
    }
    
    showSimpleStore(storeName, items) {
        let storeText = `${storeName}:\n\n`;
        items.forEach((item, index) => {
            storeText += `${index + 1}. ${item.name} - $${item.price} - ${item.description}\n`;
        });
        storeText += '\nEnter item number to purchase (or 0 to exit):';
        
        const choice = parseInt(prompt(storeText));
        if (choice > 0 && choice <= items.length) {
            const item = items[choice - 1];
            if (this.playerInventory.money >= item.price) {
                this.playerInventory.money -= item.price;
                this.playerInventory.items.push(item.name);
                this.showNotification(`Purchased ${item.name}!`, 'success');
            } else {
                this.showNotification('Not enough money!', 'error');
            }
        }
    }
    
    // Movement controls (WASD + Arrow Keys)
    onKeyDown(event) {
        console.log('Key pressed:', event.code, event.key);
        switch (event.code) {
            case 'ArrowUp':
            case 'KeyW':
                this.moveForward = true;
                break;
            case 'ArrowLeft':
            case 'KeyA':
                this.moveLeft = true;
                break;
            case 'ArrowDown':
            case 'KeyS':
                this.moveBackward = true;
                break;
            case 'ArrowRight':
                this.moveRight = true;
                break;
            case 'Space':
                event.preventDefault();
                if (this.canJump === true) this.velocity.y += 350;
                this.canJump = false;
                break;
            case 'KeyE':
                this.interact();
                break;
            case 'KeyD':
                console.log('D key pressed, tutorialActive:', this.tutorialActive);
                if (this.tutorialActive) {
                    this.disableTutorial();
                } else {
                    this.moveRight = true;
                }
                break;
            case 'KeyG':
                this.grabItem();
                break;
            case 'KeyH':
                this.toggleHelp();
                break;
            case 'KeyM':
                this.showMainMenu();
                break;
            case 'Escape':
                if (this.controls && this.controls.isLocked) {
                    this.controls.unlock();
                }
                break;
        }
    }
    
    onKeyUp(event) {
        switch (event.code) {
            case 'ArrowUp':
            case 'KeyW':
                this.moveForward = false;
                break;
            case 'ArrowLeft':
            case 'KeyA':
                this.moveLeft = false;
                break;
            case 'ArrowDown':
            case 'KeyS':
                this.moveBackward = false;
                break;
            case 'ArrowRight':
                this.moveRight = false;
                break;
            case 'KeyD':
                if (!this.tutorialActive) {
                    this.moveRight = false;
                }
                break;
        }
    }
    
    // Realistic Animation Loop with Physics
    animate() {
        if (!this.renderer || !this.scene || !this.camera) {
            console.log('⚠️ Animate loop stopped - missing:', {
                renderer: !!this.renderer,
                scene: !!this.scene,
                camera: !!this.camera
            });
            return;
        }
        
        requestAnimationFrame(() => this.animate());
        
        const deltaTime = this.clock.getDelta();
        const currentTime = performance.now();
        
        // Log first few frames to confirm animation is running
        if (!this.animateLogCount) this.animateLogCount = 0;
        if (this.animateLogCount < 3) {
            console.log('✅ Animation loop running, frame:', this.animateLogCount);
            this.animateLogCount++;
        }
        
        // Calculate FPS
        if (currentTime - this.lastTime >= 1000) {
            this.fps = Math.round(1000 / (currentTime - this.lastTime));
            this.lastTime = currentTime;
        }
        
        // Update physics world
        if (this.worldPhysics) {
            this.worldPhysics.step(deltaTime);
        }
        
        // Realistic movement with physics
        if (this.controls && this.controls.isLocked && this.playerBody) {
            this.updatePlayerMovement(deltaTime);
        }
        
        // Sync camera with physics body
        if (this.playerBody) {
            this.controls.getObject().position.copy(this.playerBody.position);
            this.controls.getObject().position.y += 0.8; // Eye level offset
        }
        
        // Check for interactions
        this.checkRealisticInteractions();
        
        // Update emergency systems
        this.updateEmergencySystems();
        
        // Auto-earning system
        this.updateAutoEarning();
        
        // Render with realistic effects
        this.renderer.render(this.scene, this.camera);
        
        // Update UI
        this.updateRealtimeUI();
    }
    
    updatePlayerMovement(deltaTime) {
        const moveSpeed = 5.0; // m/s
        const jumpForce = 300;
        
        // Debug movement state
        const anyMovement = this.moveForward || this.moveBackward || this.moveLeft || this.moveRight;
        if (anyMovement) {
            console.log('➡️ Movement detected:', {
                forward: this.moveForward,
                backward: this.moveBackward, 
                left: this.moveLeft,
                right: this.moveRight,
                isLocked: this.controls.isLocked
            });
        }
        
        // Check if player is on ground
        this.isGrounded = Math.abs(this.playerBody.velocity.y) < 0.1;
        
        // Movement direction
        const direction = new THREE.Vector3();
        
        if (this.moveForward) direction.z -= 1;
        if (this.moveBackward) direction.z += 1;
        if (this.moveLeft) direction.x -= 1;
        if (this.moveRight) direction.x += 1;
        
        direction.normalize();
        
        // Apply camera rotation to movement
        const euler = new THREE.Euler(0, 0, 0, 'YXZ');
        euler.setFromQuaternion(this.camera.quaternion);
        direction.applyEuler(euler);
        direction.y = 0; // No vertical movement from WASD
        
        // Apply movement to physics body
        this.playerBody.velocity.x = direction.x * moveSpeed;
        this.playerBody.velocity.z = direction.z * moveSpeed;
        
        if (anyMovement) {
            console.log('➡️ Applied velocity:', {
                x: this.playerBody.velocity.x,
                z: this.playerBody.velocity.z,
                position: {
                    x: this.playerBody.position.x,
                    y: this.playerBody.position.y,
                    z: this.playerBody.position.z
                }
            });
        }
        
        // Jumping (only when grounded)
        if (this.canJump && this.isGrounded) {
            this.playerBody.velocity.y = jumpForce;
            this.canJump = false;
        }
        
        // Apply drag for realistic movement
        this.playerBody.velocity.x *= 0.9;
        this.playerBody.velocity.z *= 0.9;
    }
    
    checkRealisticInteractions() {
        if (!this.controls.isLocked) return;
        
        // Cast ray from camera center
        this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
        
        const intersects = this.raycaster.intersectObjects(this.interactables);
        const interactionPrompt = document.getElementById('interaction-prompt');
        
        if (intersects.length > 0) {
            const nearest = intersects[0].object;
            const distance = intersects[0].distance;
            
            // Only interact with objects within realistic reach
            if (distance <= 3.0) {
                this.nearestInteractable = nearest;
                
                // Show appropriate interaction prompt
                interactionPrompt.style.display = 'block';
                interactionPrompt.textContent = this.getRealisticInteractionText(nearest.userData.type);
                
                // Update info panels
                if (nearest.userData.type === 'plant') {
                    this.updatePlantInfo(nearest.userData.data);
                } else if (nearest.userData.type === 'equipment') {
                    this.updateEquipmentInfo(nearest.userData.data);
                }
            } else {
                this.nearestInteractable = null;
                interactionPrompt.style.display = 'none';
            }
        } else {
            this.nearestInteractable = null;
            interactionPrompt.style.display = 'none';
            this.clearPlantInfo();
        }
    }
    
    getRealisticInteractionText(type) {
        switch (type) {
            case 'plant':
                return 'Press E to examine plant, G to carefully handle';
            case 'store_entrance':
                return 'Press E to enter store';
            case 'equipment_store':
                return 'Press E to browse climate control equipment';
            case 'advice_center':
                return 'Press E to consult with plant expert';
            case 'phone':
                return 'Press G to use phone (Emergency: call 911)';
            case 'fire_extinguisher':
                return 'Press G to grab fire extinguisher';
            case 'thermostat':
                return 'Press E to adjust temperature settings';
            case 'evaporative_mister':
                return 'Press E to control misting system';
            case 'water_tray':
                return 'Press E to check water level';
            case 'electrical_outlet':
                return 'Press E to plug in equipment (Check for water!)';
            case 'teleport_pad':
                return 'Press E to teleport (Roblox style!)';
            case 'teleport_hub':
                return 'Press E to choose teleport destination';
            case 'bank':
                return 'Press E to access your bank account';
            case 'fly_attractor':
                return 'Press E to buy fly attractors for your plants';
            case 'land_expansion':
                return 'Press E to buy more greenhouse space';
            case 'emergency_store':
                return 'Press E to buy emergency equipment';
            default:
                return 'Press E to interact, G to grab';
        }
    }
    
    updateEmergencySystems() {
        // Check for fire hazards
        if (this.worldPhysics.fireSystem.fires.some(f => f.active)) {
            this.emergencyMode = true;
            if (!this.hasFireExtinguisher) {
                this.showNotification('🔥 FIRE DETECTED! Find a fire extinguisher immediately!', 'error');
            }
        }
        
        // Check for electrical hazards
        if (this.worldPhysics.electricalSystem.shortCircuits.length > 0) {
            this.showNotification('⚡ Electrical hazard detected! Avoid water near outlets!', 'error');
        }
        
        // Weather warnings
        if (this.worldPhysics.weatherSystem.precipitation > 0.8) {
            this.showNotification('🌧️ Heavy rain detected - close greenhouse vents!', 'info');
        }
    }
    
    updateRealtimeUI() {
        // Update environmental displays
        if (this.worldPhysics) {
            const weather = this.worldPhysics.weatherSystem;
            
            const tempElement = document.getElementById('env-temp');
            const humidityElement = document.getElementById('env-humidity');
            const lightElement = document.getElementById('env-light');
            
            if (tempElement) tempElement.textContent = `${weather.temperature.toFixed(1)}°C`;
            if (humidityElement) humidityElement.textContent = `${weather.humidity.toFixed(0)}%`;
            if (lightElement) {
                const timeText = `${Math.floor(weather.timeOfDay)}:${String(Math.floor((weather.timeOfDay % 1) * 60)).padStart(2, '0')}`;
                lightElement.textContent = timeText;
            }
        }
        
        // Show FPS in development
        if (this.fps < 30) {
            console.warn(`Low FPS: ${this.fps}`);
        }
        
        // Update money displays
        this.updateMoneyDisplays();
    }
    
    updateAutoEarning() {
        const currentTime = Date.now();
        const timeDiff = currentTime - this.lastEarningTime;
        
        // Earn 1 cent every 100ms (0.1 seconds)
        if (timeDiff >= 100) {
            const earnings = Math.floor(timeDiff / 100) * this.earningRate;
            this.playerInventory.money += earnings;
            
            // Also earn coins (1 coin every 10 seconds)
            const coinEarnings = Math.floor(timeDiff / 10000);
            if (coinEarnings > 0) {
                this.playerInventory.coins += coinEarnings;
            }
            
            this.lastEarningTime = currentTime;
            
            // Update displays immediately
            this.updateMoneyDisplays();
        }
    }
    
    updateMoneyDisplays() {
        // Update all money displays in UI
        const moneyElements = document.querySelectorAll('#money-amount, #store-money');
        moneyElements.forEach(element => {
            if (element) {
                element.textContent = this.playerInventory.money.toFixed(2);
            }
        });
        
        // Update coins display if exists
        const coinsElement = document.getElementById('coins-amount');
        if (coinsElement) {
            coinsElement.textContent = this.playerInventory.coins;
        }
    }
    
    onWindowResize() {
        if (!this.renderer || !this.camera) return;
        
        const canvas = document.getElementById('three-canvas');
        this.camera.aspect = canvas.clientWidth / canvas.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    }
    
    // 3D Store functionality - now handled by InGameStore class
    createInGameStore() {
        if (window.InGameStore && this.scene && this.worldPhysics) {
            this.inGameStore = new window.InGameStore(this.scene, this.worldPhysics);
        }
    }
    
    goToStore() {
        console.log('goToStore called');
        console.log('playerBody:', this.playerBody);
        console.log('controls:', this.controls);
        
        // Teleport player to store entrance
        if (this.playerBody && this.controls) {
            this.playerBody.position.set(0, 1.75, -20); // Just outside store
            this.controls.getObject().position.copy(this.playerBody.position);
            this.showNotification('Welcome to Green Thumb Nursery! Walk inside to browse plants.', 'info');
            console.log('Teleported to store');
        } else {
            console.log('Cannot teleport - missing playerBody or controls');
            this.showNotification('Game not fully loaded yet. Try starting the game first!', 'error');
        }
    }
    
    generateStoreInventory() {
        const database = this.getPlantSpeciesDatabase();
        this.storeInventory = [];
        
        Object.keys(database).forEach(species => {
            const plant = database[species];
            const basePrice = plant.price.min + Math.random() * (plant.price.max - plant.price.min);
            
            // Generate 1-3 specimens per species
            const specimens = Math.floor(Math.random() * 3) + 1;
            
            for (let i = 0; i < specimens; i++) {
                this.storeInventory.push({
                    id: `${species}-${i}`,
                    species: species,
                    name: plant.name,
                    commonName: plant.commonName,
                    price: Math.round(basePrice * (0.8 + Math.random() * 0.4) * 100) / 100,
                    quality: this.generatePlantQuality(),
                    age: Math.floor(Math.random() * 365) + 30,
                    health: 70 + Math.random() * 25,
                    category: plant.category,
                    rarity: plant.rarity,
                    description: plant.description,
                    care: plant.care
                });
            }
        });
        
        this.storeInventory.sort((a, b) => a.price - b.price);
    }
    
    populateStore() {
        const showcase = document.getElementById('plant-showcase');
        if (!showcase) return;
        
        showcase.innerHTML = '';
        
        this.storeInventory.forEach(plant => {
            const plantCard = document.createElement('div');
            plantCard.className = 'plant-card';
            
            const rarityColor = {
                'common': '#28a745',
                'uncommon': '#ffc107',
                'rare': '#fd7e14',
                'legendary': '#dc3545'
            };
            
            const qualityStars = '★'.repeat(Math.max(1, Math.floor(plant.health / 20)));
            const canAfford = this.gameData && this.gameData.money >= plant.price;
            
            plantCard.innerHTML = `
                <div class="plant-card-header">
                    <h4>${plant.name}</h4>
                    <span class="plant-rarity" style="color: ${rarityColor[plant.rarity]}">${plant.rarity}</span>
                </div>
                <p class="plant-common-name">${plant.commonName}</p>
                <div class="plant-quality">
                    Quality: <span class="quality-${plant.quality}">${plant.quality}</span> ${qualityStars}
                </div>
                <div class="plant-age">Age: ${plant.age} days</div>
                <div class="plant-health">Health: ${Math.round(plant.health)}%</div>
                <p class="plant-description">${plant.description}</p>
                <div class="plant-price">$${plant.price.toFixed(2)}</div>
                <button onclick="purchasePlant('${plant.id}')" class="purchase-btn" 
                        ${!canAfford ? 'disabled' : ''}>
                    ${canAfford ? 'Purchase' : 'Too Expensive'}
                </button>
            `;
            
            // Styling handled by CSS
            
            showcase.appendChild(plantCard);
        });
    }
    
    purchasePlant(plantId) {
        if (!this.gameData) return;
        
        const plant = this.storeInventory.find(p => p.id === plantId);
        if (!plant) return;
        
        if (this.gameData.money < plant.price) {
            this.showNotification('Not enough money!', 'error');
            return;
        }
        
        // Purchase the plant
        this.gameData.money -= plant.price;
        
        // Add to collection
        const newPlant = {
            id: `plant_${Date.now()}`,
            name: plant.name,
            commonName: plant.commonName,
            species: plant.species,
            health: plant.health,
            age: plant.age,
            quality: plant.quality,
            purchaseDate: Date.now(),
            lastWatered: 0,
            lastFed: 0,
            needsWater: false,
            needsFood: false
        };
        
        this.gameData.plants.push(newPlant);
        
        // Update unique species count
        const uniqueSpecies = [...new Set(this.gameData.plants.map(p => p.species))];
        this.gameData.totalSpecies = uniqueSpecies.length;
        
        // Remove from store inventory
        this.storeInventory = this.storeInventory.filter(p => p.id !== plantId);
        
        // Update displays
        this.updateGameInterface();
        this.populateStore();
        
        // Create 3D model if in greenhouse
        if (this.currentScreen === 'game-screen') {
            this.create3DPlant(newPlant, this.gameData.plants.length - 1);
        }
        
        this.showNotification(`Purchased ${plant.name}!`, 'success');
        
        // Auto-save
        this.saveGame();
    }
    
    // Plant care actions
    showPlantCareMenu(plantData) {
        const actions = [];
        
        if (plantData.needsWater) actions.push('💧 Water');
        if (plantData.needsFood) actions.push('🪲 Feed');
        actions.push('💨 Mist');
        actions.push('🔍 Inspect');
        
        this.updateAvailableActions(actions);
    }
    
    updatePlantInfo(plantData) {
        const infoPanel = document.getElementById('selected-plant-info');
        if (!infoPanel) return;
        
        const healthColor = plantData.health > 80 ? '#28a745' : 
                           plantData.health > 60 ? '#ffc107' : 
                           plantData.health > 40 ? '#fd7e14' : '#dc3545';
        
        infoPanel.innerHTML = `
            <div class="plant-info-display">
                <h5>${plantData.name}</h5>
                <p><strong>Species:</strong> ${plantData.species}</p>
                <p><strong>Age:</strong> ${plantData.age} days</p>
                <p><strong>Health:</strong> <span style="color: ${healthColor}">${Math.round(plantData.health)}%</span></p>
                ${plantData.quality ? `<p><strong>Quality:</strong> ${plantData.quality}</p>` : ''}
            </div>
        `;
    }
    
    clearPlantInfo() {
        const infoPanel = document.getElementById('selected-plant-info');
        if (infoPanel) {
            infoPanel.innerHTML = '<p>Walk near a plant to see its information</p>';
        }
        this.updateAvailableActions([]);
    }
    
    updateAvailableActions(actions) {
        const actionsPanel = document.getElementById('available-actions');
        if (!actionsPanel) return;
        
        if (actions.length === 0) {
            actionsPanel.innerHTML = '<p>Approach plants or interactive objects to see available actions</p>';
        } else {
            actionsPanel.innerHTML = actions.map(action => 
                `<button class="action-btn" onclick="performAction('${action}')">${action}</button>`
            ).join('');
        }
    }
    
    // Tutorial System
    startTutorial() {
        this.tutorialActive = true;
        this.tutorialStep = 0;
        this.showTutorialMessage();
    }
    
    disableTutorial() {
        console.log('Disabling tutorial...');
        this.tutorialActive = false;
        const tutorialOverlay = document.getElementById('tutorial-overlay');
        if (tutorialOverlay) {
            tutorialOverlay.style.display = 'none';
            console.log('Tutorial overlay hidden');
        } else {
            console.log('Tutorial overlay not found!');
        }
        this.showNotification('Tutorial disabled! Welcome to the real world of carnivorous plants!', 'success');
    }
    
    showTutorialMessage() {
        const tutorialOverlay = document.getElementById('tutorial-overlay');
        const messageElement = document.getElementById('tutorial-message');
        
        if (!tutorialOverlay || !messageElement) return;
        
        const messages = [
            {
                title: "Welcome to Your Greenhouse!",
                content: `
                    <h4>🏠 You're Home!</h4>
                    <p>You're standing in your empty greenhouse. Time to start your carnivorous plant collection!</p>
                    <p><strong>Next:</strong> Go outside and visit the stores along the road to buy plants and equipment.</p>
                    <br>
                    <h4>🛍️ What You'll Need:</h4>
                    <p>• <strong>Plants</strong> from the Plant Store</p>
                    <p>• <strong>Thermostat</strong> for temperature control</p>
                    <p>• <strong>Humidity system</strong> (mister or trays)</p>
                    <p>• <strong>Safety equipment</strong> (fire extinguisher, phone)</p>
                `
            },
            {
                title: "Visit the Advice Center",
                content: `
                    <h4>👨‍🔬 Get Expert Help</h4>
                    <p>After buying your first plant, visit the Advice Center to talk to Dr. Martinez, our plant expert.</p>
                    <p>He'll guide you through setting up proper climate control and safety systems.</p>
                `
            }
        ];
        
        if (this.tutorialStep < messages.length) {
            const message = messages[this.tutorialStep];
            messageElement.innerHTML = `
                <h4>${message.title}</h4>
                ${message.content}
                <p class="tutorial-footer">Press <strong>D</strong> to disable tutorial, or continue exploring!</p>
            `;
        }
    }
    
    advanceTutorial() {
        this.tutorialStep++;
        if (this.tutorialStep < 2) {
            this.showTutorialMessage();
        } else {
            this.disableTutorial();
        }
    }
    
    // Control functions
    toggleHelp() {
        // Show comprehensive help
        this.showNotification('Controls: WASD/Arrows=Move, E=Interact, G=Grab, Space=Jump, D=Disable Tutorial', 'info');
    }
    
    grabItem() {
        if (this.nearestInteractable) {
            const obj = this.nearestInteractable;
            
            if (obj.userData.type === 'phone') {
                this.usePhone();
            } else if (obj.userData.type === 'fire_extinguisher') {
                this.grabFireExtinguisher();
            } else if (obj.userData.type === 'plant') {
                this.examineTask(obj.userData.data);
            } else if (obj.userData.type === 'store_plant') {
                this.handleStorePlant(obj);
            } else if (obj.userData.type === 'checkout') {
                this.processStoreCheckout();
            } else if (obj.userData.type === 'npc') {
                this.talkToNPC(obj);
            } else {
                this.pickupObject(obj);
            }
        } else {
            this.showNotification('Nothing to grab here', 'info');
        }
    }
    
    handleStorePlant(plantGroup) {
        if (this.inGameStore) {
            this.inGameStore.pickupPlant(plantGroup);
        }
    }
    
    processStoreCheckout() {
        if (this.inGameStore) {
            const cartSummary = this.inGameStore.getCartSummary();
            if (this.inGameStore.shoppingCart.length > 0) {
                const success = this.inGameStore.processCheckout();
                if (success) {
                    this.updateGameInterface();
                }
            } else {
                this.showNotification('Your cart is empty! Pick up some plants first.', 'info');
            }
        }
    }
    
    talkToNPC(npcGroup) {
        const npcData = npcGroup.userData;
        if (npcData.dialogue && npcData.dialogue.length > 0) {
            const randomDialogue = npcData.dialogue[Math.floor(Math.random() * npcData.dialogue.length)];
            this.showNotification(`${npcData.name}: "${randomDialogue}"`, 'info');
        }
    }
    
    usePhone() {
        if (this.emergencyMode) {
            this.showNotification('📱 Calling emergency services... Stay calm!', 'error');
        } else {
            this.showNotification('📱 Phone: Weather app shows sunny, 72°F. Plant care app loaded.', 'info');
        }
    }
    
    grabFireExtinguisher() {
        if (this.worldPhysics.fireSystem.fires.some(f => f.active)) {
            this.showNotification('🧯 Fire extinguisher ready! Aim at base of fire and squeeze.', 'info');
            this.heldObject = 'fire_extinguisher';
        } else {
            this.showNotification('🧯 Fire extinguisher checked - pressure good, ready for emergency.', 'success');
        }
    }
    
    pickupObject(obj) {
        if (obj.userData.type === 'lightweight') {
            this.heldObject = obj;
            this.showNotification(`Picked up ${obj.userData.name || 'object'}`, 'success');
        } else {
            this.showNotification('Too heavy to lift!', 'error');
        }
    }
    
    showMainMenu() {
        this.showScreen('main-menu');
        this.loadSaveSlots();
    }
    
    // Environmental controls
    adjustTemperature() {
        if (!this.gameData) return;
        
        const current = this.gameData.environment.temperature;
        const newTemp = prompt(`Current temperature: ${current}°C\nEnter new temperature (10-35):`, current);
        
        if (newTemp && !isNaN(newTemp)) {
            const temp = Math.max(10, Math.min(35, parseInt(newTemp)));
            this.gameData.environment.temperature = temp;
            this.updateEnvironmentDisplay();
            this.showNotification(`Temperature set to ${temp}°C`, 'success');
        }
    }
    
    adjustHumidity() {
        if (!this.gameData) return;
        
        const current = this.gameData.environment.humidity;
        const newHumidity = prompt(`Current humidity: ${current}%\nEnter new humidity (20-95):`, current);
        
        if (newHumidity && !isNaN(newHumidity)) {
            const humidity = Math.max(20, Math.min(95, parseInt(newHumidity)));
            this.gameData.environment.humidity = humidity;
            this.updateEnvironmentDisplay();
            this.showNotification(`Humidity set to ${humidity}%`, 'success');
        }
    }
    
    adjustLighting() {
        if (!this.gameData) return;
        
        const current = this.gameData.environment.light;
        const newLight = prompt(`Current light: ${current}%\nEnter new light intensity (0-100):`, current);
        
        if (newLight && !isNaN(newLight)) {
            const light = Math.max(0, Math.min(100, parseInt(newLight)));
            this.gameData.environment.light = light;
            this.updateEnvironmentDisplay();
            this.showNotification(`Light intensity set to ${light}%`, 'success');
        }
    }
    
    updateEnvironmentDisplay() {
        if (!this.gameData) return;
        
        const tempElement = document.getElementById('env-temp');
        const humidityElement = document.getElementById('env-humidity');
        const lightElement = document.getElementById('env-light');
        
        if (tempElement) tempElement.textContent = `${this.gameData.environment.temperature}°C`;
        if (humidityElement) humidityElement.textContent = `${this.gameData.environment.humidity}%`;
        if (lightElement) {
            const lightLevel = this.gameData.environment.light > 80 ? 'Very Bright' :
                              this.gameData.environment.light > 60 ? 'Bright' :
                              this.gameData.environment.light > 40 ? 'Medium' :
                              this.gameData.environment.light > 20 ? 'Dim' : 'Dark';
            lightElement.textContent = lightLevel;
        }
    }
    
    // Save game management (keeping existing functionality)
    loadSaveSlots() {
        const saveSlots = document.getElementById('save-slots');
        if (!saveSlots) return;
        
        saveSlots.innerHTML = '';
        
        for (let i = 0; i < this.maxSaveSlots; i++) {
            const saveData = localStorage.getItem(`cp_save_${i}`);
            const slot = document.createElement('div');
            slot.className = 'save-slot';
            slot.onclick = () => this.selectSaveSlot(i);
            
            if (saveData) {
                const data = JSON.parse(saveData);
                slot.innerHTML = `
                    <div class="save-slot-header">
                        <div class="save-slot-name">${data.collectionName}</div>
                        <div class="save-slot-date">${new Date(data.lastSaved).toLocaleDateString()}</div>
                    </div>
                    <div class="save-slot-stats">
                        Day ${data.gameDay} • $${data.money.toFixed(2)}
                    </div>
                    <div class="save-slot-plants">
                        ${data.plants.length} plants • ${data.totalSpecies || 0} species
                    </div>
                    <button class="delete-save" onclick="event.stopPropagation(); deleteSaveGame(${i})">&times;</button>
                `;
            } else {
                slot.className += ' empty';
                slot.innerHTML = '<p>Empty Save Slot</p>';
            }
            
            saveSlots.appendChild(slot);
        }
        
        this.updateLoadButton();
    }
    
    selectSaveSlot(slotIndex) {
        document.querySelectorAll('.save-slot').forEach(slot => 
            slot.classList.remove('selected'));
        
        const slots = document.querySelectorAll('.save-slot');
        if (slots[slotIndex]) {
            slots[slotIndex].classList.add('selected');
            this.selectedSaveSlot = slotIndex;
        }
        
        this.updateLoadButton();
    }
    
    updateLoadButton() {
        const loadBtn = document.getElementById('load-btn');
        if (!loadBtn) return;
        
        const hasSelection = this.selectedSaveSlot !== null;
        const saveExists = localStorage.getItem(`cp_save_${this.selectedSaveSlot}`);
        
        loadBtn.disabled = !hasSelection || !saveExists;
    }
    
    showScreen(screenName) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
            screen.classList.add('hidden');
        });
        
        // Manage body classes for scroll prevention
        if (screenName === 'game-screen') {
            document.body.classList.add('game-active');
        } else {
            document.body.classList.remove('game-active');
        }
        
        const targetScreen = document.getElementById(screenName);
        if (targetScreen) {
            targetScreen.classList.add('active');
            targetScreen.classList.remove('hidden');
            this.currentScreen = screenName;
            
            // Initialize 3D environment when entering game screen
            if (screenName === 'game-screen') {
                console.log('Entering game screen, initializing 3D environment...');
                setTimeout(() => {
                    if (!this.scene) {
                        console.log('Scene not found, creating 3D environment...');
                        this.init3DEnvironment();
                    } else {
                        console.log('Scene already exists');
                    }
                }, 200);
            }
        }
    }
    
    createNewGame(collectionName, startingMoney, difficulty) {
        let targetSlot = -1;
        for (let i = 0; i < this.maxSaveSlots; i++) {
            if (!localStorage.getItem(`cp_save_${i}`)) {
                targetSlot = i;
                break;
            }
        }
        
        if (targetSlot === -1) {
            if (!confirm('All save slots are full. Delete the oldest save game?')) {
                return;
            }
            targetSlot = this.findOldestSave();
        }
        
        const gameData = {
            collectionName: collectionName || `Game ${targetSlot + 1}`,
            money: parseFloat(startingMoney) || 250,
            difficulty: difficulty || 'normal',
            gameDay: 1,
            gameHour: 8,
            plants: [],
            environment: {
                temperature: 22,
                humidity: 65,
                light: 70
            },
            achievements: [],
            totalSpecies: 0,
            lastSaved: Date.now(),
            slotIndex: targetSlot
        };
        
        localStorage.setItem(`cp_save_${targetSlot}`, JSON.stringify(gameData));
        this.loadGame(targetSlot);
    }
    
    findOldestSave() {
        let oldestTime = Date.now();
        let oldestSlot = 0;
        
        for (let i = 0; i < this.maxSaveSlots; i++) {
            const saveData = localStorage.getItem(`cp_save_${i}`);
            if (saveData) {
                const data = JSON.parse(saveData);
                if (data.lastSaved < oldestTime) {
                    oldestTime = data.lastSaved;
                    oldestSlot = i;
                }
            }
        }
        
        return oldestSlot;
    }
    
    loadGame(slotIndex) {
        const saveData = localStorage.getItem(`cp_save_${slotIndex}`);
        if (!saveData) return;
        
        this.gameData = JSON.parse(saveData);
        this.gameData.slotIndex = slotIndex;
        
        // Initialize player inventory with loaded data
        this.playerInventory.money = this.gameData.money || 250;
        this.playerInventory.coins = this.gameData.coins || 0;
        this.lastEarningTime = Date.now(); // Start auto-earning
        
        console.log('Game loaded, money:', this.playerInventory.money);
        
        this.updateGameInterface();
        this.showScreen('game-screen');
    }
    
    updateGameInterface() {
        if (!this.gameData) return;
        
        // Update top bar
        const titleElement = document.getElementById('collection-title');
        const moneyElement = document.getElementById('money-amount');
        const storeMoneyElement = document.getElementById('store-money');
        const lastSavedElement = document.getElementById('last-saved');
        
        if (titleElement) titleElement.textContent = this.gameData.collectionName;
        if (moneyElement) moneyElement.textContent = this.gameData.money.toFixed(2);
        if (storeMoneyElement) storeMoneyElement.textContent = this.gameData.money.toFixed(2);
        if (lastSavedElement) {
            lastSavedElement.textContent = `Last saved: ${new Date(this.gameData.lastSaved).toLocaleString()}`;
        }
        
        this.updatePlantCollection();
        this.updateEnvironmentDisplay();
    }
    
    updatePlantCollection() {
        const plantList = document.getElementById('plant-list');
        if (!plantList) return;
        
        if (this.gameData.plants.length === 0) {
            plantList.innerHTML = `
                <div class="empty-collection">
                    <p>No plants yet!</p>
                    <button onclick="game.goToStore()" class="add-plant-btn">
                        🚶 Walk to Plant Store
                    </button>
                </div>
            `;
            return;
        }
        
        plantList.innerHTML = '';
        this.gameData.plants.forEach(plant => {
            const plantItem = document.createElement('div');
            plantItem.className = 'plant-item';
            
            const healthClass = this.getHealthClass(plant.health);
            const healthText = this.getHealthText(plant.health);
            
            plantItem.innerHTML = `
                <div class="plant-item-header">
                    <div class="plant-name">${plant.name}</div>
                    <div class="plant-health ${healthClass}">${healthText}</div>
                </div>
                <div class="plant-species">${plant.commonName}</div>
                <div class="plant-age">Age: ${plant.age} days</div>
            `;
            
            plantList.appendChild(plantItem);
        });
    }
    
    getHealthClass(health) {
        if (health >= 90) return 'health-excellent';
        if (health >= 70) return 'health-good';
        if (health >= 50) return 'health-poor';
        return 'health-critical';
    }
    
    getHealthText(health) {
        if (health >= 90) return 'Excellent';
        if (health >= 70) return 'Good';
        if (health >= 50) return 'Poor';
        return 'Critical';
    }
    
    generatePlantQuality() {
        const rand = Math.random();
        if (rand < 0.1) return 'poor';
        if (rand < 0.3) return 'fair';
        if (rand < 0.7) return 'good';
        if (rand < 0.9) return 'excellent';
        return 'perfect';
    }
    
    saveGame() {
        if (!this.gameData) return;
        
        this.gameData.lastSaved = Date.now();
        localStorage.setItem(`cp_save_${this.gameData.slotIndex}`, JSON.stringify(this.gameData));
        
        this.showNotification('Game saved successfully!', 'success');
    }
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#007bff'};
            color: white;
            border-radius: 8px;
            font-weight: bold;
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
    
    // Plant species database
    getPlantSpeciesDatabase() {
        return {
            'dionaea-muscipula': {
                name: 'Dionaea muscipula',
                commonName: 'Venus Flytrap',
                category: 'dionaea',
                price: { min: 15, max: 45 },
                rarity: 'common',
                description: 'Classic Venus flytrap with snapping traps',
                care: {
                    temperature: { min: 15, max: 30 },
                    humidity: { min: 50, max: 85 },
                    light: 'bright indirect',
                    water: 'distilled, tray method',
                    dormancy: true
                }
            },
            'dionaea-b52': {
                name: "Dionaea 'B52'",
                commonName: 'B52 Venus Flytrap',
                category: 'dionaea',
                price: { min: 25, max: 65 },
                rarity: 'uncommon',
                description: 'Giant trap cultivar with impressive size'
            },
            'nepenthes-alata': {
                name: 'Nepenthes alata',
                commonName: 'Winged Pitcher Plant',
                category: 'nepenthes',
                price: { min: 25, max: 55 },
                rarity: 'common',
                description: 'Easy beginner nepenthes with consistent pitchers'
            },
            'nepenthes-ventrata': {
                name: "Nepenthes 'Ventrata'",
                commonName: 'Ventrata Hybrid',
                category: 'nepenthes',
                price: { min: 45, max: 95 },
                rarity: 'uncommon',
                description: 'Hardy hybrid with large striped pitchers'
            },
            'sarracenia-purpurea': {
                name: 'Sarracenia purpurea',
                commonName: 'Purple Pitcher Plant',
                category: 'sarracenia',
                price: { min: 20, max: 50 },
                rarity: 'common',
                description: 'Hardy native with purple-veined pitchers'
            },
            'drosera-capensis': {
                name: 'Drosera capensis',
                commonName: 'Cape Sundew',
                category: 'sundews',
                price: { min: 8, max: 20 },
                rarity: 'common',
                description: 'Easy subtropical sundew with pink flowers'
            }
        };
    }
}

// Global functions for HTML onclick handlers
let game;

function init() {
    game = new PlantCollectionManager3D();
}

function showNewGameDialog() {
    document.getElementById('new-game-dialog').classList.remove('hidden');
    document.getElementById('collection-name').focus();
}

function closeNewGameDialog() {
    document.getElementById('new-game-dialog').classList.add('hidden');
    document.getElementById('collection-name').value = '';
}

function createNewGame() {
    const name = document.getElementById('collection-name').value || `Game ${Date.now()}`;
    const money = document.getElementById('starting-money').value;
    const difficulty = document.getElementById('difficulty').value;
    
    closeNewGameDialog();
    if (window.game) {
        window.game.createNewGame(name, money, difficulty);
    }
}

function showLoadGameDialog() {
    if (!window.game || window.game.selectedSaveSlot === null) return;
    window.game.loadGame(window.game.selectedSaveSlot);
}

function deleteSaveGame(slotIndex) {
    if (confirm('Are you sure you want to delete this save game?')) {
        localStorage.removeItem(`cp_save_${slotIndex}`);
        if (window.game) {
            window.game.loadSaveSlots();
        }
    }
}

function showMainMenuGlobal() {
    if (window.game) {
        window.game.showScreen('main-menu');
        window.game.loadSaveSlots();
    }
}

function saveGame() {
    if (window.game) {
        window.game.saveGame();
    }
}

function openStore() {
    if (window.game) {
        window.game.enterStore();
    }
}

function closeStore() {
    if (window.game) {
        window.game.showScreen('game-screen');
    }
}

function purchasePlant(plantId) {
    if (window.game) {
        window.game.purchasePlant(plantId);
    }
}

function showCategory(category) {
    document.querySelectorAll('.category-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    const filtered = category === 'all' ? game.storeInventory : 
                    game.storeInventory.filter(plant => plant.category === category);
    
    // Repopulate with filtered inventory
    const showcase = document.getElementById('plant-showcase');
    showcase.innerHTML = '';
    
    filtered.forEach(plant => {
        const plantCard = document.createElement('div');
        plantCard.className = 'plant-card';
        
        const rarityColor = {
            'common': '#28a745',
            'uncommon': '#ffc107',
            'rare': '#fd7e14',
            'legendary': '#dc3545'
        };
        
        const qualityStars = '★'.repeat(Math.max(1, Math.floor(plant.health / 20)));
        const canAfford = game.gameData && game.gameData.money >= plant.price;
        
        plantCard.innerHTML = `
            <div class="plant-card-header">
                <h4>${plant.name}</h4>
                <span class="plant-rarity" style="color: ${rarityColor[plant.rarity]}">${plant.rarity}</span>
            </div>
            <p class="plant-common-name">${plant.commonName}</p>
            <div class="plant-quality">
                Quality: <span class="quality-${plant.quality}">${plant.quality}</span> ${qualityStars}
            </div>
            <div class="plant-age">Age: ${plant.age} days</div>
            <div class="plant-health">Health: ${Math.round(plant.health)}%</div>
            <p class="plant-description">${plant.description}</p>
            <div class="plant-price">$${plant.price.toFixed(2)}</div>
            <button onclick="purchasePlant('${plant.id}')" class="purchase-btn" 
                    ${!canAfford ? 'disabled' : ''}>
                ${canAfford ? 'Purchase' : 'Too Expensive'}
            </button>
        `;
        
        // Styling handled by CSS
        
        showcase.appendChild(plantCard);
    });
}

function performAction(action) {
    if (window.game) {
        window.game.showNotification(`${action} - Feature coming soon!`, 'info');
    }
}

function consultPlantExpert() {
    if (window.game) {
        if (window.game.playerInventory.coins >= 10) {
            window.game.playerInventory.coins -= 10;
            window.game.provideExpertAdvice();
        } else {
            window.game.showNotification('Need 10 coins for consultation!', 'error');
        }
    }
}

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.error('Error attempting to enable fullscreen:', err);
        });
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
}

function fullscreenGameWindow() {
    const gameCanvas = document.getElementById('three-canvas');
    if (gameCanvas) {
        if (!document.fullscreenElement) {
            gameCanvas.requestFullscreen().catch(err => {
                console.error('Error attempting to fullscreen game canvas:', err);
            });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    }
}

function startQuickGame() {
    // Use the working game function
    startWorkingGame();
}

// Working 3D Game with all controls
function startWorkingGame() {
    console.log('🎮 Starting enhanced 3D game...');
    
    try {
        // Show game screen
        document.querySelectorAll('.screen').forEach(s => s.style.display = 'none');
        document.getElementById('game-screen').style.display = 'block';
        
        // Close tutorial
        const tutorial = document.getElementById('tutorial-overlay');
        if (tutorial) tutorial.style.display = 'none';
        
        // Create complete 3D scene
        const canvas = document.getElementById('three-canvas');
        
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x87CEEB); // Sky blue
        scene.fog = new THREE.Fog(0x87CEEB, 10, 50);
        
        const camera = new THREE.PerspectiveCamera(75, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
        camera.position.set(0, 1.75, 3);
        
        const renderer = new THREE.WebGLRenderer({ canvas: canvas });
        renderer.setSize(canvas.clientWidth, canvas.clientHeight);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // Setup physics world
        const physicsWorld = setupPhysicsWorld();
        
        // Enhanced lighting system
        setupEnhancedLighting(scene);
        
        // Create detailed greenhouse interior
        createDetailedGreenhouseInterior(scene, physicsWorld);
        
        // Setup enhanced controls with all features
        setupEnhancedControls(scene, camera, canvas, renderer, physicsWorld);
        
        console.log('✅ Enhanced 3D game started! Click screen to lock mouse, use WASD/Shift/C/G/Q');
        
    } catch (error) {
        console.error('❌ Enhanced game failed:', error);
    }
}

function setupPhysicsWorld() {
    console.log('🔬 Setting up physics world...');
    
    // Create physics world
    const world = new CANNON.World();
    world.gravity.set(0, -9.82, 0); // Earth gravity
    world.broadphase = new CANNON.NaiveBroadphase();
    world.solver.iterations = 10;
    
    // Materials
    const groundMaterial = new CANNON.Material({ friction: 0.4, restitution: 0.3 });
    const potMaterial = new CANNON.Material({ friction: 0.6, restitution: 0.4 });
    const tableMaterial = new CANNON.Material({ friction: 0.8, restitution: 0.1 });
    
    // Contact materials
    world.addContactMaterial(new CANNON.ContactMaterial(
        groundMaterial, potMaterial,
        { friction: 0.4, restitution: 0.3 }
    ));
    
    // Ground plane
    const groundShape = new CANNON.Plane();
    const groundBody = new CANNON.Body({ mass: 0 });
    groundBody.addShape(groundShape);
    groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
    world.add(groundBody);
    
    // Dynamic objects tracking
    const dynamicObjects = [];
    
    // Physics world wrapper with helper functions
    const physicsWorld = {
        world,
        materials: { 
            ground: groundMaterial, 
            plastic: potMaterial, 
            wood: tableMaterial 
        },
        dynamicObjects,
        
        // Add dynamic object to physics world
        addDynamicObject(mesh, body, type) {
            this.dynamicObjects.push({ mesh, body, type });
            return { mesh, body, type };
        },
        
        // Step physics simulation
        step(deltaTime) {
            this.world.step(deltaTime);
            
            // Sync all dynamic objects
            this.dynamicObjects.forEach(obj => {
                if (obj.mesh && obj.body) {
                    obj.mesh.position.copy(obj.body.position);
                    obj.mesh.quaternion.copy(obj.body.quaternion);
                }
            });
        }
    };
    
    // Add collision event listener for knockdown effects
    world.addEventListener('beginContact', function(event) {
        const bodyA = event.bodyA;
        const bodyB = event.bodyB;
        
        // Check if player collided with a dynamic object
        if (bodyA.mass === 80 || bodyB.mass === 80) { // Player body mass
            const otherBody = bodyA.mass === 80 ? bodyB : bodyA;
            
            // If the other body is a pot, knock it over
            if (otherBody.mass > 0 && otherBody.mass < 10) { // Light objects like pots
                console.log('💥 Player knocked into object!');
                
                // Apply knockdown force
                const force = new CANNON.Vec3(
                    (Math.random() - 0.5) * 50,
                    10,
                    (Math.random() - 0.5) * 50
                );
                otherBody.applyImpulse(force, otherBody.position);
            }
        }
    });
    
    console.log('✅ Physics world setup complete with collision detection');
    return physicsWorld;
}

function setupEnhancedLighting(scene) {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);
    
    // Directional light (sun)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    scene.add(directionalLight);
    
    // Interior grow lights
    for (let i = 0; i < 3; i++) {
        const growLight = new THREE.PointLight(0xff00ff, 0.4, 10);
        growLight.position.set(-4 + i * 4, 5, -2);
        growLight.castShadow = true;
        scene.add(growLight);
    }
    
    // Warm ambient greenhouse lighting
    const warmLight = new THREE.PointLight(0xffddaa, 0.3, 15);
    warmLight.position.set(0, 6, 0);
    scene.add(warmLight);
}

function createDetailedGreenhouseInterior(scene, physicsWorld) {
    console.log('🏠 Creating enhanced greenhouse interior...');
    
    // Floor with texture variation
    const floorGeometry = new THREE.PlaneGeometry(20, 20);
    const floorMaterial = new THREE.MeshLambertMaterial({ color: 0x567d46 });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);
    
    // Concrete pathways
    const pathMaterial = new THREE.MeshLambertMaterial({ color: 0x888888 });
    const mainPath = new THREE.Mesh(new THREE.PlaneGeometry(2, 16), pathMaterial);
    mainPath.rotation.x = -Math.PI / 2;
    mainPath.position.set(0, 0.01, 0);
    scene.add(mainPath);
    
    // Glass greenhouse walls with frame
    const glassMaterial = new THREE.MeshLambertMaterial({ 
        color: 0xccffcc, 
        transparent: true, 
        opacity: 0.3 
    });
    
    const frameMaterial = new THREE.MeshLambertMaterial({ color: 0x2d5016 });
    
    // Back wall with frame
    const backWall = new THREE.Mesh(new THREE.PlaneGeometry(20, 8), glassMaterial);
    backWall.position.set(0, 4, -10);
    scene.add(backWall);
    
    // Frame posts
    for (let i = 0; i <= 4; i++) {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.2, 8, 0.2), frameMaterial);
        post.position.set(-8 + i * 4, 4, -10);
        post.castShadow = true;
        scene.add(post);
    }
    
    // Side walls
    const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(20, 8), glassMaterial);
    leftWall.position.set(-10, 4, 0);
    leftWall.rotation.y = Math.PI / 2;
    scene.add(leftWall);
    
    const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(20, 8), glassMaterial);
    rightWall.position.set(10, 4, 0);
    rightWall.rotation.y = -Math.PI / 2;
    scene.add(rightWall);
    
    // Detailed plant stations with physics
    createEnhancedPlantStations(scene, physicsWorld);
    
    // Add interactive objects with physics
    addInteractiveObjects(scene, physicsWorld);
    
    // Invisible boundary walls
    addInvisibleBoundaries(scene);
}

function createEnhancedPlantStations(scene, physicsWorld) {
    const benchMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    
    // Tiered plant benches (left side)
    for (let tier = 0; tier < 3; tier++) {
        const bench = new THREE.Mesh(new THREE.BoxGeometry(16, 0.3, 2), benchMaterial);
        bench.position.set(-6, 0.9 + tier * 0.5, -6 + tier * 2);
        bench.castShadow = true;
        bench.receiveShadow = true;
        scene.add(bench);
        
        // Support legs
        for (let i = 0; i < 3; i++) {
            const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.9 + tier * 0.5), benchMaterial);
            leg.position.set(-6 + (-6 + i * 6), (0.9 + tier * 0.5) / 2, -6 + tier * 2);
            scene.add(leg);
        }
    }
    
    // Standard benches (right side)
    for (let i = 0; i < 3; i++) {
        const bench = new THREE.Mesh(new THREE.BoxGeometry(14, 0.3, 2), benchMaterial);
        bench.position.set(6, 0.9, -5 + i * 3);
        bench.castShadow = true;
        bench.receiveShadow = true;
        scene.add(bench);
        
        // Shelf underneath
        const shelf = new THREE.Mesh(new THREE.BoxGeometry(13, 0.2, 1.5), benchMaterial);
        shelf.position.set(6, 0.4, -5 + i * 3);
        scene.add(shelf);
    }
    
    // Central potting table (climbable)
    const pottingTable = new THREE.Mesh(new THREE.BoxGeometry(6, 0.4, 3), benchMaterial);
    pottingTable.position.set(0, 0.9, 5);
    pottingTable.castShadow = true;
    pottingTable.receiveShadow = true;
    
    // Create physics body for table (static - can be climbed on)
    const tableShape = new CANNON.Box(new CANNON.Vec3(3, 0.2, 1.5));
    const tableBody = new CANNON.Body({ mass: 0 }); // Static body - won't move
    tableBody.addShape(tableShape);
    tableBody.position.set(0, 0.9, 5);
    tableBody.material = physicsWorld.materials.wood;
    physicsWorld.world.addBody(tableBody);
    
    pottingTable.userData = { 
        type: 'table', 
        climbable: true, 
        physicsBody: tableBody 
    };
    scene.add(pottingTable);
    
    console.log('📋 Added climbable potting table with physics');
}

function addInteractiveObjects(scene, physicsWorld) {
    // Enhanced plant pots with more variety
    const potTypes = [
        { color: 0xff4444, size: 0.2, type: 'terra_cotta' },
        { color: 0x44ff44, size: 0.25, type: 'ceramic' },
        { color: 0x4444ff, size: 0.18, type: 'plastic' },
        { color: 0xffff44, size: 0.22, type: 'glazed' },
        { color: 0xff44ff, size: 0.3, type: 'decorative' },
        { color: 0x44ffff, size: 0.15, type: 'seedling' }
    ];
    
    // Place pots on benches - simplified positions for easier access
    const potPositions = [
        // Central table area (easy to reach)
        { x: -2, y: 1.3, z: 5 },
        { x: -1, y: 1.3, z: 5 },
        { x: 0, y: 1.3, z: 5 },
        { x: 1, y: 1.3, z: 5 },
        { x: 2, y: 1.3, z: 5 },
        // Near spawn area
        { x: -1, y: 1.2, z: 2 },
        { x: 1, y: 1.2, z: 2 },
        { x: 0, y: 1.2, z: 1 },
        // Left bench
        { x: -4, y: 1.2, z: -2 },
        { x: -6, y: 1.2, z: -2 },
        // Right bench  
        { x: 4, y: 1.2, z: -2 },
        { x: 6, y: 1.2, z: -2 }
    ];
    
    for (let i = 0; i < potPositions.length; i++) {
        const potType = potTypes[i % potTypes.length];
        const pos = potPositions[i];
        
        // Create visual pot
        const pot = new THREE.Mesh(
            new THREE.CylinderGeometry(potType.size, potType.size * 0.8, potType.size * 1.2),
            new THREE.MeshLambertMaterial({ color: potType.color })
        );
        
        pot.position.set(pos.x, pos.y, pos.z);
        
        // Create physics body for pot
        const potShape = new CANNON.Cylinder(potType.size, potType.size * 0.8, potType.size * 1.2, 8);
        const potBody = new CANNON.Body({ mass: 2 }); // 2kg pot
        potBody.addShape(potShape);
        potBody.position.set(pos.x, pos.y, pos.z);
        potBody.material = physicsWorld.materials.plastic;
        
        // Add to physics world
        physicsWorld.world.addBody(potBody);
        physicsWorld.addDynamicObject(pot, potBody, 'plant_pot');
        
        pot.userData = { 
            type: 'plant_pot',
            potType: potType.type,
            originalColor: potType.color,
            interactable: true,
            value: Math.floor(potType.size * 100),
            physicsBody: potBody
        };
        pot.castShadow = true;
        scene.add(pot);
        
        console.log(`🪴 Added physics-enabled pot ${i} at position ${pos.x}, ${pos.y}, ${pos.z}`);
        
        // Add a small glowing sphere above each pot to make them easy to see
        const marker = new THREE.Mesh(
            new THREE.SphereGeometry(0.05),
            new THREE.MeshBasicMaterial({ color: 0x00ff00 })
        );
        marker.position.set(pos.x, pos.y + potType.size * 1.5, pos.z);
        scene.add(marker);
    }
    
    // Gardening tools
    addGardeningTools(scene);
    
    // Equipment
    addGreenhouseEquipment(scene);
}

function addGardeningTools(scene) {
    const toolMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    
    // Watering can
    const wateringCan = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 0.4), new THREE.MeshLambertMaterial({ color: 0x228B22 }));
    wateringCan.position.set(2, 1.3, 5);
    wateringCan.userData = { type: 'watering_can', interactable: true, tool: true };
    scene.add(wateringCan);
    
    // Trowel
    const trowel = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.3, 0.08), toolMaterial);
    trowel.position.set(-1.5, 1.3, 5.2);
    trowel.rotation.z = Math.PI / 6;
    trowel.userData = { type: 'trowel', interactable: true, tool: true };
    scene.add(trowel);
    
    // Pruning shears
    const shears = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.25, 0.02), new THREE.MeshLambertMaterial({ color: 0x444444 }));
    shears.position.set(1, 1.3, 4.8);
    shears.userData = { type: 'pruning_shears', interactable: true, tool: true };
    scene.add(shears);
}

function addGreenhouseEquipment(scene) {
    // Thermometer
    const thermometer = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.6, 0.03), new THREE.MeshLambertMaterial({ color: 0xffffff }));
    thermometer.position.set(-9.8, 2, -2);
    thermometer.userData = { type: 'thermometer', interactable: true };
    scene.add(thermometer);
    
    // Misting system
    for (let i = 0; i < 4; i++) {
        const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 18), new THREE.MeshLambertMaterial({ color: 0x444444 }));
        pipe.rotation.z = Math.PI / 2;
        pipe.position.set(0, 6, -6 + i * 4);
        scene.add(pipe);
        
        // Nozzles
        for (let j = 0; j < 3; j++) {
            const nozzle = new THREE.Mesh(new THREE.SphereGeometry(0.02), new THREE.MeshLambertMaterial({ color: 0x666666 }));
            nozzle.position.set(-6 + j * 6, 6, -6 + i * 4);
            scene.add(nozzle);
        }
    }
}

function addInvisibleBoundaries(scene) {
    // Create visible red walls for debugging first
    const wallMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xff0000,
        transparent: true,
        opacity: 0.3
    });
    
    // Boundary walls - smaller area to make sure they work
    const boundaries = [
        { size: [20, 10, 1], pos: [0, 5, -12] },  // North
        { size: [20, 10, 1], pos: [0, 5, 12] },   // South  
        { size: [1, 10, 24], pos: [12, 5, 0] },   // East
        { size: [1, 10, 24], pos: [-12, 5, 0] }   // West
    ];
    
    boundaries.forEach((boundary, index) => {
        const wall = new THREE.Mesh(new THREE.BoxGeometry(...boundary.size), wallMaterial);
        wall.position.set(...boundary.pos);
        wall.userData = { type: 'boundary_wall', id: index };
        scene.add(wall);
        console.log('🚧 Added boundary wall', index, 'at position', boundary.pos);
    });
    
    console.log('🚧 Visible boundary walls added for testing');
}

function setupEnhancedControls(scene, camera, canvas, renderer, physicsWorld) {
    console.log('🎮 Setting up enhanced controls with physics...');
    
    // Movement state
    let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false;
    let isCrouching = false, isSprinting = false, isJumping = false;
    let isLocked = false;
    
    // Player physics body for collision
    const playerShape = new CANNON.Sphere(0.5);
    const playerBody = new CANNON.Body({ mass: 80 }); // 80kg player
    playerBody.addShape(playerShape);
    playerBody.position.set(0, 2, 3);
    playerBody.material = physicsWorld.materials.ground;
    physicsWorld.world.addBody(playerBody);
    
    // Jump parameters
    let jumpCooldown = false;
    const jumpForce = 400;
    
    // Mouse lock controls
    const controls = new THREE.PointerLockControls(camera, document.body);
    scene.add(controls.getObject());
    
    controls.addEventListener('lock', () => {
        console.log('✅ Mouse locked!');
        isLocked = true;
        canvas.style.cursor = 'none';
    });
    
    controls.addEventListener('unlock', () => {
        console.log('❌ Mouse unlocked');
        isLocked = false;
        canvas.style.cursor = 'crosshair';
    });
    
    // Click to lock
    canvas.addEventListener('click', () => {
        console.log('🖱️ Requesting pointer lock...');
        controls.lock();
    });
    
    // Enhanced keyboard controls with physics
    document.addEventListener('keydown', (e) => {
        if (!isLocked) return; // Only respond when mouse is locked
        
        switch(e.code) {
            case 'KeyW': case 'ArrowUp': 
                moveForward = true; 
                break;
            case 'KeyS': case 'ArrowDown': 
                moveBackward = true; 
                break;
            case 'KeyA': case 'ArrowLeft': 
                moveLeft = true; 
                break;
            case 'KeyD': case 'ArrowRight': 
                moveRight = true; 
                break;
            case 'KeyG':
                if (!e.repeat) {
                    handleGrabAction(camera, scene, physicsWorld);
                }
                break;
            case 'KeyC':
                if (!e.repeat) { // Only on initial press, not when held
                    isCrouching = !isCrouching;
                    handleCrouchToggle(camera, isCrouching);
                }
                break;
            case 'KeyQ':
                if (!e.repeat) {
                    handleSwipeAction(camera, scene, physicsWorld);
                }
                break;
            case 'Space':
                e.preventDefault(); // Prevent page scroll
                if (!e.repeat && !jumpCooldown) { // Only on initial press and not on cooldown
                    handleJump(playerBody);
                    jumpCooldown = true;
                    setTimeout(() => { jumpCooldown = false; }, 500); // 0.5 second cooldown
                }
                break;
            case 'ShiftLeft': case 'ShiftRight':
                if (!isSprinting) {
                    console.log('🏃‍♂️ Sprinting!');
                    isSprinting = true;
                }
                break;
            case 'Escape': 
                if (isLocked) controls.unlock(); 
                break;
        }
    });
    
    document.addEventListener('keyup', (e) => {
        switch(e.code) {
            case 'KeyW': case 'ArrowUp': moveForward = false; break;
            case 'KeyS': case 'ArrowDown': moveBackward = false; break;
            case 'KeyA': case 'ArrowLeft': moveLeft = false; break;
            case 'KeyD': case 'ArrowRight': moveRight = false; break;
            case 'ShiftLeft': case 'ShiftRight':
                console.log('🚶‍♂️ Stopped sprinting');
                isSprinting = false;
                break;
        }
    });
    
    // Jump function with physics
    function handleJump(playerBody) {
        // Check if player is on ground (y velocity near 0 and position low enough)
        if (Math.abs(playerBody.velocity.y) < 1 && playerBody.position.y < 3) {
            console.log('🦘 Jump! Applied force:', jumpForce);
            playerBody.velocity.y = jumpForce / playerBody.mass; // Apply jump force
            isJumping = true;
            
            // Reset jumping flag after landing
            setTimeout(() => { 
                isJumping = false; 
            }, 1000);
        } else {
            console.log('❌ Cannot jump - not on ground or already jumping');
        }
    }
    
    // Enhanced animation loop with physics integration
    function animate() {
        requestAnimationFrame(animate);
        
        // Step physics simulation
        physicsWorld.step(1/60);
        
        if (isLocked) {
            // Store previous position for collision recovery
            const prevPosition = camera.position.clone();
            
            // Dynamic movement speeds based on state
            let speed = 0.1; // Base speed
            
            if (isCrouching) {
                speed = 0.05; // Slower when crouching
            } else if (isSprinting) {
                speed = 0.2; // Faster when sprinting
            }
            
            // Apply movement to physics body
            const moveVector = new THREE.Vector3();
            
            if (moveForward) moveVector.z -= speed;
            if (moveBackward) moveVector.z += speed;
            if (moveLeft) moveVector.x -= speed;
            if (moveRight) moveVector.x += speed;
            
            // Apply camera rotation to movement
            if (moveVector.length() > 0) {
                moveVector.applyQuaternion(camera.quaternion);
                moveVector.y = 0; // Don't apply vertical movement from camera
                
                // Apply movement to physics body
                playerBody.velocity.x = moveVector.x * 50;
                playerBody.velocity.z = moveVector.z * 50;
            } else {
                // Apply friction when not moving
                playerBody.velocity.x *= 0.8;
                playerBody.velocity.z *= 0.8;
            }
            
            // Sync camera position with physics body
            camera.position.x = playerBody.position.x;
            camera.position.z = playerBody.position.z;
            
            // Adjust camera height based on state
            if (isCrouching) {
                camera.position.y = playerBody.position.y - 0.3;
            } else {
                camera.position.y = playerBody.position.y + 0.5;
            }
            
            // Prevent falling through floor
            if (playerBody.position.y < 0.5) {
                playerBody.position.y = 0.5;
                playerBody.velocity.y = 0;
            }
        }
        
        renderer.render(scene, camera);
    }
    
    animate();
    
    // Store references globally for debugging
    window.gameScene = { scene, camera, renderer, controls, playerBody, physicsWorld };
    console.log('✅ Enhanced controls with physics setup complete!');
}

function handleGrabAction(camera, scene, physicsWorld) {
    console.log('🤏 G key pressed - Grab/Interact!');
    console.log('🧭 Player position:', camera.position.x.toFixed(2), camera.position.y.toFixed(2), camera.position.z.toFixed(2));
    
    // Debug: list all interactable objects and their distances
    const allInteractables = [];
    scene.children.forEach(child => {
        if (child.userData?.interactable) {
            const distance = camera.position.distanceTo(child.position);
            allInteractables.push({
                type: child.userData.type,
                distance: distance.toFixed(2),
                position: `${child.position.x.toFixed(1)}, ${child.position.y.toFixed(1)}, ${child.position.z.toFixed(1)}`
            });
        }
    });
    
    console.log('🔍 All interactable objects:', allInteractables);
    
    const nearestObject = findNearestInteractable(camera.position, scene);
    
    if (nearestObject) {
        console.log('📦 Grabbing:', nearestObject.userData?.type || 'object');
        console.log('📏 Distance:', camera.position.distanceTo(nearestObject.position).toFixed(2), 'units');
        
        // Enhanced grab effects
        nearestObject.material.color.setHex(0xffffff);
        
        // Add value/info display
        if (nearestObject.userData?.value) {
            console.log('💰 Value:', nearestObject.userData.value, 'coins');
        }
        
        setTimeout(() => {
            nearestObject.material.color.setHex(nearestObject.userData.originalColor);
        }, 500);
    } else {
        console.log('❌ No objects nearby to grab (within 4 units)');
    }
}

function handleCrouchToggle(camera, isCrouching) {
    if (isCrouching) {
        console.log('🦆 Crouching down');
        camera.position.y = 1.2;
    } else {
        console.log('🧍 Standing up');
        camera.position.y = 1.75;
    }
}

function handleSwipeAction(camera, scene, physicsWorld) {
    console.log('🗡️ Swipe attack with stick hand!');
    
    // Create visual stick hand that extends from camera
    const stickGeometry = new THREE.CylinderGeometry(0.02, 0.02, 1.5, 8);
    const stickMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    const stickHand = new THREE.Mesh(stickGeometry, stickMaterial);
    
    // Position stick in front of camera
    const stickDirection = new THREE.Vector3(0, 0, -1);
    stickDirection.applyQuaternion(camera.quaternion);
    
    stickHand.position.copy(camera.position);
    stickHand.position.add(stickDirection.clone().multiplyScalar(0.8));
    stickHand.lookAt(camera.position.clone().add(stickDirection.clone().multiplyScalar(2)));
    stickHand.rotateX(Math.PI / 2);
    
    scene.add(stickHand);
    console.log('🦾 Stick hand extended!');
    
    // Find nearby objects to swipe
    const nearbyObjects = [];
    const swipeRange = 2.5;
    
    scene.children.forEach(child => {
        if (child.userData?.interactable) {
            const distance = camera.position.distanceTo(child.position);
            if (distance < swipeRange) {
                nearbyObjects.push(child);
            }
        }
    });
    
    if (nearbyObjects.length > 0) {
        console.log('💥 Swiped', nearbyObjects.length, 'objects!');
        nearbyObjects.forEach(obj => {
            // Enhanced swipe effects
            obj.material.color.setHex(0xff0000);
            
            // Apply physics force if object has physics body
            if (obj.userData?.physicsBody) {
                const forceDirection = new THREE.Vector3();
                forceDirection.subVectors(obj.position, camera.position).normalize();
                
                // Apply a strong horizontal force to knock off table
                const force = new CANNON.Vec3(
                    forceDirection.x * 100,
                    20, // Slight upward force
                    forceDirection.z * 100
                );
                
                obj.userData.physicsBody.applyImpulse(force, obj.userData.physicsBody.position);
                console.log('💪 Applied physics force to', obj.userData.type);
            }
            
            // Visual feedback
            setTimeout(() => {
                if (obj.userData?.originalColor) {
                    obj.material.color.setHex(obj.userData.originalColor);
                }
            }, 300);
        });
    } else {
        console.log('🌬️ Swipe missed - no objects nearby');
    }
    
    // Remove stick hand after short delay
    setTimeout(() => {
        scene.remove(stickHand);
        console.log('🦾 Stick hand retracted');
    }, 500);
}

function findNearestInteractable(playerPos, scene) {
    let nearest = null;
    let minDistance = 4; // Increased grab distance
    
    scene.children.forEach(child => {
        if (child.userData?.interactable) {
            const distance = playerPos.distanceTo(child.position);
            if (distance < minDistance) {
                minDistance = distance;
                nearest = child;
            }
        }
    });
    
    return nearest;
}

function closeTutorialManually() {
    console.log('Manual tutorial close clicked');
    if (window.game) {
        window.game.disableTutorial();
    } else {
        console.log('Game not initialized, hiding tutorial manually');
        const tutorialOverlay = document.getElementById('tutorial-overlay');
        if (tutorialOverlay) {
            tutorialOverlay.style.display = 'none';
        }
    }
}

// Initialize game when page loads
function init() {
    console.log('Initializing game...');
    if (typeof PlantCollectionManager3D !== 'undefined') {
        window.game = new PlantCollectionManager3D();
        console.log('Game initialized successfully');
    } else {
        console.error('PlantCollectionManager3D not found');
    }
}

// Initialization handled by HTML script tag