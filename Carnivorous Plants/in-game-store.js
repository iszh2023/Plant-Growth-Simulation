// In-Game 3D Store System
class InGameStore {
    constructor(scene, worldPhysics) {
        this.scene = scene;
        this.worldPhysics = worldPhysics;
        this.storeBuilding = null;
        this.displayPlants = [];
        this.shoppingCart = [];
        this.checkoutCounter = null;
        this.cashierNPC = null;
        this.storeInventory = [];
        
        this.createStore();
        this.populateStore();
    }
    
    createStore() {
        // Store building structure
        this.storeBuilding = new THREE.Group();
        
        // Floor
        const floorGeometry = new THREE.PlaneGeometry(20, 15);
        const floorMaterial = new THREE.MeshLambertMaterial({ color: 0xf0f0f0 });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.position.set(0, 0, -30);
        this.storeBuilding.add(floor);
        
        // Walls
        this.createWalls();
        
        // Entrance
        this.createEntrance();
        
        // Display tables and shelves
        this.createDisplayAreas();
        
        // Checkout counter
        this.createCheckoutCounter();
        
        // Lighting
        this.createStoreLighting();
        
        // Signs
        this.createStoreSigns();
        
        this.scene.add(this.storeBuilding);
        
        // Add store physics
        this.addStorePhysics();
    }
    
    createWalls() {
        const wallMaterial = new THREE.MeshLambertMaterial({ color: 0xe8f5e8 });
        
        // Back wall
        const backWallGeometry = new THREE.PlaneGeometry(20, 4);
        const backWall = new THREE.Mesh(backWallGeometry, wallMaterial);
        backWall.position.set(0, 2, -37.5);
        this.storeBuilding.add(backWall);
        
        // Side walls
        const sideWallGeometry = new THREE.PlaneGeometry(15, 4);
        
        const leftWall = new THREE.Mesh(sideWallGeometry, wallMaterial);
        leftWall.rotation.y = Math.PI / 2;
        leftWall.position.set(-10, 2, -30);
        this.storeBuilding.add(leftWall);
        
        const rightWall = new THREE.Mesh(sideWallGeometry, wallMaterial);
        rightWall.rotation.y = -Math.PI / 2;
        rightWall.position.set(10, 2, -30);
        this.storeBuilding.add(rightWall);
        
        // Roof
        const roofGeometry = new THREE.PlaneGeometry(20, 15);
        const roofMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        const roof = new THREE.Mesh(roofGeometry, roofMaterial);
        roof.rotation.x = Math.PI / 2;
        roof.position.set(0, 4, -30);
        this.storeBuilding.add(roof);
    }
    
    createEntrance() {
        // Store entrance with double doors
        const doorGeometry = new THREE.PlaneGeometry(1.5, 3);
        const doorMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x8B4513,
            transparent: true,
            opacity: 0.8
        });
        
        const leftDoor = new THREE.Mesh(doorGeometry, doorMaterial);
        leftDoor.position.set(-1, 1.5, -22.5);
        this.storeBuilding.add(leftDoor);
        
        const rightDoor = new THREE.Mesh(doorGeometry, doorMaterial);
        rightDoor.position.set(1, 1.5, -22.5);
        this.storeBuilding.add(rightDoor);
        
        // Door handles
        const handleGeometry = new THREE.SphereGeometry(0.05, 8, 8);
        const handleMaterial = new THREE.MeshLambertMaterial({ color: 0xffd700 });
        
        const leftHandle = new THREE.Mesh(handleGeometry, handleMaterial);
        leftHandle.position.set(-0.3, 1.5, -22.4);
        this.storeBuilding.add(leftHandle);
        
        const rightHandle = new THREE.Mesh(handleGeometry, handleMaterial);
        rightHandle.position.set(1.3, 1.5, -22.4);
        this.storeBuilding.add(rightHandle);
    }
    
    createDisplayAreas() {
        // Create multiple display tables
        this.displayTables = [];
        
        // Center display island
        const centerTable = this.createDisplayTable(0, 0.4, -30, 4, 2);
        this.displayTables.push(centerTable);
        
        // Wall display shelves
        const leftShelf = this.createDisplayShelf(-8, 0.8, -35, 6, 'left');
        const rightShelf = this.createDisplayShelf(8, 0.8, -35, 6, 'right');
        const backShelf = this.createDisplayShelf(0, 0.8, -36, 8, 'back');
        
        this.displayTables.push(leftShelf, rightShelf, backShelf);
    }
    
    createDisplayTable(x, y, z, width, depth) {
        const tableGroup = new THREE.Group();
        
        // Table top
        const topGeometry = new THREE.BoxGeometry(width, 0.1, depth);
        const topMaterial = new THREE.MeshLambertMaterial({ color: 0xDEB887 });
        const top = new THREE.Mesh(topGeometry, topMaterial);
        top.position.set(x, y, z);
        tableGroup.add(top);
        
        // Table legs
        const legGeometry = new THREE.CylinderGeometry(0.05, 0.05, y, 8);
        const legMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        
        const positions = [
            [-width/2 + 0.2, y/2, -depth/2 + 0.2],
            [width/2 - 0.2, y/2, -depth/2 + 0.2],
            [-width/2 + 0.2, y/2, depth/2 - 0.2],
            [width/2 - 0.2, y/2, depth/2 - 0.2]
        ];
        
        positions.forEach(pos => {
            const leg = new THREE.Mesh(legGeometry, legMaterial);
            leg.position.set(x + pos[0], pos[1], z + pos[2]);
            tableGroup.add(leg);
        });
        
        this.storeBuilding.add(tableGroup);
        return tableGroup;
    }
    
    createDisplayShelf(x, y, z, width, side) {
        const shelfGroup = new THREE.Group();
        
        // Shelf structure
        const shelfGeometry = new THREE.BoxGeometry(width, 0.05, 0.8);
        const shelfMaterial = new THREE.MeshLambertMaterial({ color: 0xDEB887 });
        
        // Multiple shelf levels
        for (let i = 0; i < 3; i++) {
            const shelf = new THREE.Mesh(shelfGeometry, shelfMaterial);
            shelf.position.set(x, y + i * 0.6, z);
            shelfGroup.add(shelf);
        }
        
        // Back panel
        const backGeometry = new THREE.BoxGeometry(width, 2, 0.1);
        const backMaterial = new THREE.MeshLambertMaterial({ color: 0xF5F5DC });
        const back = new THREE.Mesh(backGeometry, backMaterial);
        back.position.set(x, y + 0.6, z - 0.4);
        shelfGroup.add(back);
        
        this.storeBuilding.add(shelfGroup);
        return shelfGroup;
    }
    
    createCheckoutCounter() {
        this.checkoutCounter = new THREE.Group();
        
        // Counter surface
        const counterGeometry = new THREE.BoxGeometry(3, 0.1, 1.5);
        const counterMaterial = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
        const counter = new THREE.Mesh(counterGeometry, counterMaterial);
        counter.position.set(7, 1, -25);
        this.checkoutCounter.add(counter);
        
        // Cash register
        const registerGeometry = new THREE.BoxGeometry(0.4, 0.3, 0.3);
        const registerMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
        const register = new THREE.Mesh(registerGeometry, registerMaterial);
        register.position.set(6.5, 1.2, -25);
        this.checkoutCounter.add(register);
        
        // Screen
        const screenGeometry = new THREE.PlaneGeometry(0.2, 0.15);
        const screenMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        const screen = new THREE.Mesh(screenGeometry, screenMaterial);
        screen.position.set(6.5, 1.35, -24.8);
        this.checkoutCounter.add(screen);
        
        // Create cashier NPC
        this.createCashierNPC();
        
        this.storeBuilding.add(this.checkoutCounter);
        
        // Add interaction zone
        this.checkoutCounter.userData = {
            type: 'checkout',
            interactable: true,
            action: 'purchase'
        };
    }
    
    createCashierNPC() {
        this.cashierNPC = new THREE.Group();
        
        // Body
        const bodyGeometry = new THREE.CylinderGeometry(0.3, 0.3, 1.2, 8);
        const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x4169E1 });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.set(7, 1.6, -26);
        this.cashierNPC.add(body);
        
        // Head
        const headGeometry = new THREE.SphereGeometry(0.2, 8, 8);
        const headMaterial = new THREE.MeshLambertMaterial({ color: 0xFFDBAC });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.set(7, 2.3, -26);
        this.cashierNPC.add(head);
        
        // Name tag
        const tagGeometry = new THREE.PlaneGeometry(0.3, 0.1);
        const tagMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
        const tag = new THREE.Mesh(tagGeometry, tagMaterial);
        tag.position.set(7, 1.8, -25.7);
        this.cashierNPC.add(tag);
        
        this.storeBuilding.add(this.cashierNPC);
        
        // Add interaction
        this.cashierNPC.userData = {
            type: 'npc',
            name: 'Alex - Store Manager',
            interactable: true,
            dialogue: [
                "Welcome to Green Thumb Nursery!",
                "Pick up any plants you'd like to examine.",
                "Bring them to the checkout when you're ready!"
            ]
        };
    }
    
    createStoreLighting() {
        // Ambient store lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.storeBuilding.add(ambientLight);
        
        // Overhead lights
        for (let x = -6; x <= 6; x += 4) {
            for (let z = -35; z <= -25; z += 5) {
                const light = new THREE.PointLight(0xffffff, 0.8, 10);
                light.position.set(x, 3.5, z);
                this.storeBuilding.add(light);
                
                // Light fixture
                const fixtureGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.1, 8);
                const fixtureMaterial = new THREE.MeshLambertMaterial({ color: 0x888888 });
                const fixture = new THREE.Mesh(fixtureGeometry, fixtureMaterial);
                fixture.position.set(x, 3.8, z);
                this.storeBuilding.add(fixture);
            }
        }
    }
    
    createStoreSigns() {
        // Store name sign
        const signGeometry = new THREE.PlaneGeometry(4, 0.8);
        const signMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 });
        const sign = new THREE.Mesh(signGeometry, signMaterial);
        sign.position.set(0, 3.5, -22);
        this.storeBuilding.add(sign);
        
        // Category signs
        const categories = [
            { text: "Venus Flytraps", pos: [-6, 2, -35] },
            { text: "Pitcher Plants", pos: [0, 2, -36] },
            { text: "Sundews", pos: [6, 2, -35] }
        ];
        
        categories.forEach(cat => {
            const catSignGeometry = new THREE.PlaneGeometry(2, 0.3);
            const catSignMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
            const catSign = new THREE.Mesh(catSignGeometry, catSignMaterial);
            catSign.position.set(cat.pos[0], cat.pos[1], cat.pos[2]);
            this.storeBuilding.add(catSign);
        });
    }
    
    addStorePhysics() {
        // Add collision for floor
        const floorShape = new CANNON.Plane();
        const floorBody = new CANNON.Body({ mass: 0 });
        floorBody.addShape(floorShape);
        floorBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
        floorBody.position.set(0, 0, -30);
        this.worldPhysics.world.add(floorBody);
        
        // Add wall collision boxes
        this.addWallCollision(-10, 2, -30, 0.1, 4, 15); // Left wall
        this.addWallCollision(10, 2, -30, 0.1, 4, 15); // Right wall
        this.addWallCollision(0, 2, -37.5, 20, 4, 0.1); // Back wall
    }
    
    addWallCollision(x, y, z, w, h, d) {
        const wallShape = new CANNON.Box(new CANNON.Vec3(w/2, h/2, d/2));
        const wallBody = new CANNON.Body({ mass: 0 });
        wallBody.addShape(wallShape);
        wallBody.position.set(x, y, z);
        this.worldPhysics.world.add(wallBody);
    }
    
    populateStore() {
        // Generate plant inventory for the store
        this.storeInventory = this.generateStoreInventory();
        
        // Place plants on display tables
        this.placePlantsOnDisplay();
    }
    
    generateStoreInventory() {
        const plantTypes = [
            {
                species: 'dionaea-muscipula',
                name: 'Venus Flytrap',
                basePrice: 25,
                category: 'flytraps'
            },
            {
                species: 'sarracenia-purpurea',
                name: 'Purple Pitcher Plant',
                basePrice: 35,
                category: 'pitchers'
            },
            {
                species: 'nepenthes-ventrata',
                name: 'Nepenthes Ventrata',
                basePrice: 45,
                category: 'tropical'
            },
            {
                species: 'drosera-capensis',
                name: 'Cape Sundew',
                basePrice: 20,
                category: 'sundews'
            },
            {
                species: 'sarracenia-flava',
                name: 'Yellow Pitcher Plant',
                basePrice: 40,
                category: 'pitchers'
            }
        ];
        
        const inventory = [];
        
        plantTypes.forEach((plantType, typeIndex) => {
            // Create 3-5 specimens of each type with variations
            const specimenCount = 3 + Math.floor(Math.random() * 3);
            
            for (let i = 0; i < specimenCount; i++) {
                const specimen = {
                    id: `${plantType.species}_${i}`,
                    species: plantType.species,
                    name: `${plantType.name} #${i + 1}`,
                    commonName: plantType.name,
                    price: plantType.basePrice + (Math.random() - 0.5) * 10,
                    health: 70 + Math.random() * 25,
                    age: 30 + Math.random() * 40,
                    stage: Math.floor(Math.random() * 3) + 1,
                    quality: this.generateQuality(),
                    category: plantType.category,
                    description: this.generateDescription(plantType.species),
                    position: null, // Will be set when placed
                    mesh: null,     // Will be created when placed
                    pickupable: true
                };
                
                inventory.push(specimen);
            }
        });
        
        return inventory;
    }
    
    generateQuality() {
        const rand = Math.random();
        if (rand < 0.1) return 'poor';
        if (rand < 0.3) return 'fair';
        if (rand < 0.7) return 'good';
        if (rand < 0.9) return 'excellent';
        return 'perfect';
    }
    
    generateDescription(species) {
        const descriptions = {
            'dionaea-muscipula': 'Classic Venus flytrap with snapping traps',
            'sarracenia-purpurea': 'Stocky purple pitcher with distinctive hood',
            'nepenthes-ventrata': 'Elegant hanging pitcher with red peristome',
            'drosera-capensis': 'Delicate sundew with dewdrop tentacles',
            'sarracenia-flava': 'Tall yellow trumpet pitcher'
        };
        return descriptions[species] || 'Beautiful carnivorous plant specimen';
    }
    
    placePlantsOnDisplay() {
        let plantIndex = 0;
        
        // Place plants on center table (4x2 grid)
        for (let x = -1.5; x <= 1.5; x += 1) {
            for (let z = -0.5; z <= 0.5; z += 1) {
                if (plantIndex < this.storeInventory.length) {
                    this.placePlant(this.storeInventory[plantIndex], x, 0.5, -30 + z);
                    plantIndex++;
                }
            }
        }
        
        // Place plants on shelves
        const shelfPositions = [
            // Left shelf
            { x: -8, y: 0.85, z: -35 }, { x: -7, y: 0.85, z: -35 }, { x: -6, y: 0.85, z: -35 },
            { x: -8, y: 1.45, z: -35 }, { x: -7, y: 1.45, z: -35 }, { x: -6, y: 1.45, z: -35 },
            // Right shelf  
            { x: 6, y: 0.85, z: -35 }, { x: 7, y: 0.85, z: -35 }, { x: 8, y: 0.85, z: -35 },
            { x: 6, y: 1.45, z: -35 }, { x: 7, y: 1.45, z: -35 }, { x: 8, y: 1.45, z: -35 },
            // Back shelf
            { x: -2, y: 0.85, z: -36 }, { x: 0, y: 0.85, z: -36 }, { x: 2, y: 0.85, z: -36 }
        ];
        
        shelfPositions.forEach((pos, index) => {
            if (plantIndex + index < this.storeInventory.length) {
                this.placePlant(this.storeInventory[plantIndex + index], pos.x, pos.y, pos.z);
            }
        });
    }
    
    placePlant(plantData, x, y, z) {
        // Create plant group with pot
        const plantGroup = new THREE.Group();
        
        // Small store pot
        const potGeometry = new THREE.CylinderGeometry(0.15, 0.12, 0.2, 8);
        const potMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        const pot = new THREE.Mesh(potGeometry, potMaterial);
        plantGroup.add(pot);
        
        // Create plant model using realistic plant system
        if (window.RealisticPlantModels) {
            const plantModel = window.RealisticPlantModels.createPlantModel(plantGroup, plantData.species, plantData);
            if (plantModel) {
                plantModel.scale.setScalar(0.3); // Smaller for store display
            }
        }
        
        // Position in store
        plantGroup.position.set(x, y, z);
        plantData.position = { x, y, z };
        plantData.mesh = plantGroup;
        
        // Add interaction data
        plantGroup.userData = {
            type: 'store_plant',
            plantData: plantData,
            interactable: true,
            pickupable: true,
            originalPosition: { x, y, z }
        };
        
        // Add physics for pickup
        const plantShape = new CANNON.Cylinder(0.15, 0.15, 0.3, 8);
        const plantBody = new CANNON.Body({ mass: 0.5 });
        plantBody.addShape(plantShape);
        plantBody.position.set(x, y + 0.15, z);
        this.worldPhysics.addDynamicObject(plantGroup, plantBody, 'store_plant');
        
        this.storeBuilding.add(plantGroup);
        this.displayPlants.push({ plant: plantData, group: plantGroup, body: plantBody });
    }
    
    // Store interaction methods
    pickupPlant(plantGroup) {
        const plantData = plantGroup.userData.plantData;
        if (plantData && plantData.pickupable) {
            // Add to shopping cart
            this.addToCart(plantData);
            
            // Show plant info
            this.showPlantInfo(plantData);
            
            return true;
        }
        return false;
    }
    
    addToCart(plantData) {
        if (!this.shoppingCart.find(item => item.id === plantData.id)) {
            this.shoppingCart.push(plantData);
            
            // Visual feedback
            if (window.game) {
                window.game.showNotification(`Added ${plantData.name} to cart ($${plantData.price.toFixed(2)})`, 'success');
            }
        }
    }
    
    showPlantInfo(plantData) {
        const infoText = `
            ${plantData.name}
            Health: ${Math.round(plantData.health)}%
            Age: ${Math.round(plantData.age)} days
            Quality: ${plantData.quality}
            Price: $${plantData.price.toFixed(2)}
            
            ${plantData.description}
        `;
        
        if (window.game) {
            window.game.showNotification(infoText, 'info');
        }
    }
    
    processCheckout() {
        if (this.shoppingCart.length === 0) {
            if (window.game) {
                window.game.showNotification('Your cart is empty! Pick up some plants first.', 'error');
            }
            return false;
        }
        
        const total = this.shoppingCart.reduce((sum, item) => sum + item.price, 0);
        
        if (window.game && window.game.playerInventory.money >= total) {
            // Process purchase
            window.game.playerInventory.money -= total;
            
            // Add plants to player collection
            this.shoppingCart.forEach(plantData => {
                const newPlant = {
                    id: Date.now() + Math.random(),
                    name: plantData.name,
                    species: plantData.species,
                    commonName: plantData.commonName,
                    health: plantData.health,
                    age: plantData.age,
                    stage: plantData.stage,
                    quality: plantData.quality
                };
                
                if (window.game.gameData) {
                    window.game.gameData.plants.push(newPlant);
                }
            });
            
            // Clear cart
            this.shoppingCart = [];
            
            window.game.showNotification(`Purchase complete! Total: $${total.toFixed(2)}`, 'success');
            window.game.updateMoneyDisplays();
            
            return true;
        } else {
            if (window.game) {
                window.game.showNotification(`Not enough money! Need $${total.toFixed(2)}`, 'error');
            }
            return false;
        }
    }
    
    getCartTotal() {
        return this.shoppingCart.reduce((sum, item) => sum + item.price, 0);
    }
    
    getCartSummary() {
        if (this.shoppingCart.length === 0) {
            return "Cart is empty";
        }
        
        const total = this.getCartTotal();
        return `${this.shoppingCart.length} items - $${total.toFixed(2)}`;
    }
}

// Export for use in main game
if (typeof window !== 'undefined') {
    window.InGameStore = InGameStore;
}