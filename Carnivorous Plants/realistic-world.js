// Realistic 3D World Physics System
class RealisticWorldPhysics {
    constructor() {
        // Physics world
        this.world = new CANNON.World();
        this.world.gravity.set(0, -9.82, 0); // Real gravity
        this.world.broadphase = new CANNON.NaiveBroadphase();
        this.world.solver.iterations = 10;
        
        // Material properties
        this.materials = {
            ground: new CANNON.Material({ friction: 0.4, restitution: 0.3 }),
            metal: new CANNON.Material({ friction: 0.1, restitution: 0.8 }),
            wood: new CANNON.Material({ friction: 0.7, restitution: 0.2 }),
            glass: new CANNON.Material({ friction: 0.1, restitution: 0.1 }),
            plastic: new CANNON.Material({ friction: 0.6, restitution: 0.4 }),
            water: new CANNON.Material({ friction: 0.0, restitution: 0.0 })
        };
        
        // Contact materials for realistic interactions
        this.setupContactMaterials();
        
        // Dynamic objects tracking
        this.dynamicObjects = [];
        this.fireSystem = new FireSystem();
        this.electricalSystem = new ElectricalSystem();
        this.weatherSystem = new WeatherSystem();
    }
    
    setupContactMaterials() {
        // Ground contacts
        this.world.addContactMaterial(new CANNON.ContactMaterial(
            this.materials.ground, this.materials.metal,
            { friction: 0.3, restitution: 0.5 }
        ));
        
        // Glass breaking simulation
        this.world.addContactMaterial(new CANNON.ContactMaterial(
            this.materials.glass, this.materials.metal,
            { friction: 0.1, restitution: 0.0 }
        ));
        
        // Wood on ground
        this.world.addContactMaterial(new CANNON.ContactMaterial(
            this.materials.wood, this.materials.ground,
            { friction: 0.8, restitution: 0.1 }
        ));
    }
    
    step(deltaTime) {
        this.world.step(deltaTime);
        this.fireSystem.update(deltaTime);
        this.electricalSystem.update(deltaTime);
        this.weatherSystem.update(deltaTime);
        
        // Update all dynamic objects
        this.dynamicObjects.forEach(obj => {
            if (obj.mesh && obj.body) {
                obj.mesh.position.copy(obj.body.position);
                obj.mesh.quaternion.copy(obj.body.quaternion);
            }
        });
    }
    
    addDynamicObject(mesh, body, type = 'generic') {
        this.world.add(body);
        this.dynamicObjects.push({ mesh, body, type });
        return { mesh, body, type };
    }
}

// Fire and Safety System
class FireSystem {
    constructor() {
        this.fires = [];
        this.extinguishers = [];
        this.smokeParticles = [];
        this.electricalFires = [];
    }
    
    startFire(position, cause = 'electrical') {
        const fire = {
            position: position.clone(),
            intensity: 0.1,
            spread: 0,
            cause: cause,
            active: true,
            startTime: Date.now()
        };
        
        this.fires.push(fire);
        this.createFireVisuals(fire);
        return fire;
    }
    
    createFireVisuals(fire) {
        // Realistic fire particles
        const fireGeometry = new THREE.SphereGeometry(0.1, 8, 8);
        const fireMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xff4500,
            transparent: true,
            opacity: 0.8
        });
        
        fire.mesh = new THREE.Mesh(fireGeometry, fireMaterial);
        fire.mesh.position.copy(fire.position);
        
        // Smoke particles
        this.createSmokeEffect(fire);
    }
    
    createSmokeEffect(fire) {
        const smokeGeometry = new THREE.SphereGeometry(0.2, 8, 8);
        const smokeMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x555555,
            transparent: true,
            opacity: 0.3
        });
        
        for (let i = 0; i < 10; i++) {
            const smoke = new THREE.Mesh(smokeGeometry, smokeMaterial);
            smoke.position.set(
                fire.position.x + (Math.random() - 0.5) * 2,
                fire.position.y + Math.random() * 3,
                fire.position.z + (Math.random() - 0.5) * 2
            );
            this.smokeParticles.push(smoke);
        }
    }
    
    extinguishFire(fire, extinguisher) {
        if (fire.active && extinguisher.charge > 0) {
            fire.intensity -= 0.1;
            extinguisher.charge -= 0.05;
            
            if (fire.intensity <= 0) {
                fire.active = false;
                return true;
            }
        }
        return false;
    }
    
    update(deltaTime) {
        this.fires.forEach(fire => {
            if (fire.active) {
                // Fire spreads over time
                fire.intensity += deltaTime * 0.01;
                fire.spread += deltaTime * 0.02;
                
                // Update visual effects
                if (fire.mesh) {
                    fire.mesh.scale.setScalar(1 + fire.intensity);
                }
            }
        });
        
        // Animate smoke
        this.smokeParticles.forEach(smoke => {
            smoke.position.y += deltaTime * 2;
            smoke.material.opacity -= deltaTime * 0.1;
        });
    }
}

// Electrical System with real hazards
class ElectricalSystem {
    constructor() {
        this.circuits = [];
        this.outlets = [];
        this.devices = [];
        this.shortCircuits = [];
    }
    
    createOutlet(position, voltage = 120) {
        const outlet = {
            position: position.clone(),
            voltage: voltage,
            connected: [],
            grounded: true,
            active: true,
            lastInspection: Date.now()
        };
        
        this.outlets.push(outlet);
        this.createOutletMesh(outlet);
        return outlet;
    }
    
    createOutletMesh(outlet) {
        const outletGeometry = new THREE.BoxGeometry(0.1, 0.15, 0.05);
        const outletMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
        outlet.mesh = new THREE.Mesh(outletGeometry, outletMaterial);
        outlet.mesh.position.copy(outlet.position);
    }
    
    connectDevice(device, outlet) {
        if (outlet.connected.length < 2) {
            outlet.connected.push(device);
            device.outlet = outlet;
            device.powered = true;
            
            // Check for electrical hazards
            this.checkElectricalSafety(outlet);
        }
    }
    
    checkElectricalSafety(outlet) {
        let totalLoad = 0;
        outlet.connected.forEach(device => {
            totalLoad += device.powerDraw || 0;
        });
        
        // Overload check
        if (totalLoad > outlet.voltage * 0.8) {
            this.createShortCircuit(outlet);
        }
        
        // Water hazard check
        if (this.nearWater(outlet.position)) {
            this.createElectricalHazard(outlet);
        }
    }
    
    createShortCircuit(outlet) {
        const shortCircuit = {
            outlet: outlet,
            sparks: true,
            fireRisk: 0.7,
            startTime: Date.now()
        };
        
        this.shortCircuits.push(shortCircuit);
        
        // 70% chance to start electrical fire
        if (Math.random() < shortCircuit.fireRisk) {
            // Fire system integration
            window.game.worldPhysics.fireSystem.startFire(outlet.position, 'electrical');
        }
    }
    
    nearWater(position) {
        // Check for water sources nearby
        return window.game.worldPhysics.dynamicObjects.some(obj => {
            return obj.type === 'water' && 
                   obj.mesh.position.distanceTo(position) < 2.0;
        });
    }
    
    update(deltaTime) {
        // Update electrical systems
        this.shortCircuits.forEach(sc => {
            if (sc.sparks) {
                this.createSparkEffect(sc.outlet.position);
            }
        });
    }
    
    createSparkEffect(position) {
        // Visual spark effects for electrical problems
        const sparkGeometry = new THREE.SphereGeometry(0.02, 4, 4);
        const sparkMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xffff00,
            transparent: true,
            opacity: 0.9
        });
        
        for (let i = 0; i < 5; i++) {
            const spark = new THREE.Mesh(sparkGeometry, sparkMaterial);
            spark.position.set(
                position.x + (Math.random() - 0.5) * 0.5,
                position.y + (Math.random() - 0.5) * 0.5,
                position.z + (Math.random() - 0.5) * 0.5
            );
            // Sparks disappear quickly
            setTimeout(() => {
                if (spark.parent) spark.parent.remove(spark);
            }, 100);
        }
    }
}

// Weather and Environmental System
class WeatherSystem {
    constructor() {
        this.temperature = 22; // Celsius
        this.humidity = 60; // Percentage
        this.windSpeed = 0;
        this.precipitation = 0;
        this.cloudCover = 0.3;
        this.timeOfDay = 12; // 24-hour format
        
        this.rainDrops = [];
        this.windEffect = new THREE.Vector3();
    }
    
    update(deltaTime) {
        // Realistic day/night cycle
        this.timeOfDay += deltaTime / 3600; // 1 real second = 1 game hour
        if (this.timeOfDay >= 24) this.timeOfDay = 0;
        
        // Weather changes
        this.updateWeatherConditions(deltaTime);
        
        // Environmental effects
        this.updateLighting();
        this.updatePrecipitation(deltaTime);
        this.updateWind(deltaTime);
    }
    
    updateWeatherConditions(deltaTime) {
        // Random weather changes
        if (Math.random() < 0.001) { // Small chance each frame
            this.cloudCover += (Math.random() - 0.5) * 0.1;
            this.cloudCover = Math.max(0, Math.min(1, this.cloudCover));
        }
        
        // Rain probability based on cloud cover
        if (this.cloudCover > 0.7 && Math.random() < 0.005) {
            this.precipitation = Math.min(1, this.precipitation + 0.1);
        } else if (this.precipitation > 0) {
            this.precipitation = Math.max(0, this.precipitation - 0.01);
        }
        
        // Temperature varies with time of day
        const baseTemp = 20 + Math.sin((this.timeOfDay - 6) * Math.PI / 12) * 8;
        this.temperature = baseTemp + (Math.random() - 0.5) * 2;
        
        // Humidity affected by rain
        this.humidity = 40 + this.precipitation * 40 + Math.sin(this.timeOfDay * Math.PI / 12) * 20;
    }
    
    updateLighting() {
        if (!window.game || !window.game.scene) return;
        
        // Find directional light (sun)
        const sun = window.game.scene.children.find(child => 
            child.type === 'DirectionalLight'
        );
        
        if (sun) {
            // Day/night lighting
            const sunIntensity = Math.max(0, Math.sin((this.timeOfDay - 6) * Math.PI / 12));
            sun.intensity = sunIntensity * (1 - this.cloudCover * 0.5);
            
            // Sun color changes throughout day
            if (this.timeOfDay < 6 || this.timeOfDay > 18) {
                sun.color.setHex(0x404080); // Night blue
            } else if (this.timeOfDay < 8 || this.timeOfDay > 16) {
                sun.color.setHex(0xff8844); // Sunrise/sunset orange
            } else {
                sun.color.setHex(0xffffff); // Midday white
            }
        }
    }
    
    updatePrecipitation(deltaTime) {
        if (this.precipitation > 0.1) {
            this.createRainDrops();
        }
        
        // Update existing raindrops
        this.rainDrops.forEach(drop => {
            drop.position.y -= 10 * deltaTime;
            if (drop.position.y < 0) {
                drop.position.y = 20;
                drop.position.x += (Math.random() - 0.5) * 100;
                drop.position.z += (Math.random() - 0.5) * 100;
            }
        });
    }
    
    createRainDrops() {
        if (this.rainDrops.length < 1000) {
            const dropGeometry = new THREE.SphereGeometry(0.02, 3, 3);
            const dropMaterial = new THREE.MeshBasicMaterial({ 
                color: 0x4488ff,
                transparent: true,
                opacity: 0.6
            });
            
            for (let i = 0; i < 50; i++) {
                const drop = new THREE.Mesh(dropGeometry, dropMaterial);
                drop.position.set(
                    (Math.random() - 0.5) * 200,
                    Math.random() * 20 + 10,
                    (Math.random() - 0.5) * 200
                );
                this.rainDrops.push(drop);
                
                if (window.game && window.game.scene) {
                    window.game.scene.add(drop);
                }
            }
        }
    }
    
    updateWind(deltaTime) {
        // Wind affects particles and loose objects
        this.windEffect.set(
            Math.sin(Date.now() * 0.001) * this.windSpeed,
            0,
            Math.cos(Date.now() * 0.001) * this.windSpeed
        );
        
        // Apply wind to dynamic objects
        if (window.game && window.game.worldPhysics) {
            window.game.worldPhysics.dynamicObjects.forEach(obj => {
                if (obj.type === 'lightweight' && obj.body) {
                    obj.body.velocity.x += this.windEffect.x * deltaTime;
                    obj.body.velocity.z += this.windEffect.z * deltaTime;
                }
            });
        }
    }
}

// Realistic Object Factory
class RealisticObjectFactory {
    static createPhone(position) {
        // Smartphone with realistic properties
        const phoneGeometry = new THREE.BoxGeometry(0.08, 0.15, 0.01);
        const phoneMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 });
        const phoneMesh = new THREE.Mesh(phoneGeometry, phoneMaterial);
        
        // Screen
        const screenGeometry = new THREE.PlaneGeometry(0.06, 0.12);
        const screenMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x0088ff,
            transparent: true,
            opacity: 0.8
        });
        const screen = new THREE.Mesh(screenGeometry, screenMaterial);
        screen.position.z = 0.006;
        phoneMesh.add(screen);
        
        // Physics body
        const phoneShape = new CANNON.Box(new CANNON.Vec3(0.04, 0.075, 0.005));
        const phoneBody = new CANNON.Body({ mass: 0.2 });
        phoneBody.addShape(phoneShape);
        phoneBody.position.copy(position);
        
        const phoneObject = {
            mesh: phoneMesh,
            body: phoneBody,
            type: 'phone',
            properties: {
                battery: 100,
                screen_on: false,
                apps: ['emergency', 'weather', 'plant_guide'],
                waterproof: false
            }
        };
        
        return phoneObject;
    }
    
    static createFireExtinguisher(position) {
        // Realistic fire extinguisher
        const extinguisherGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.4, 8);
        const extinguisherMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 });
        const extinguisherMesh = new THREE.Mesh(extinguisherGeometry, extinguisherMaterial);
        
        // Handle
        const handleGeometry = new THREE.TorusGeometry(0.05, 0.01, 4, 8);
        const handleMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
        const handle = new THREE.Mesh(handleGeometry, handleMaterial);
        handle.position.y = 0.15;
        handle.rotation.x = Math.PI / 2;
        extinguisherMesh.add(handle);
        
        // Nozzle
        const nozzleGeometry = new THREE.CylinderGeometry(0.01, 0.01, 0.1, 6);
        const nozzle = new THREE.Mesh(nozzleGeometry, handleMaterial);
        nozzle.position.set(0.1, 0.1, 0);
        nozzle.rotation.z = Math.PI / 2;
        extinguisherMesh.add(nozzle);
        
        // Physics body
        const extinguisherShape = new CANNON.Cylinder(0.08, 0.08, 0.4, 8);
        const extinguisherBody = new CANNON.Body({ mass: 5.0 });
        extinguisherBody.addShape(extinguisherShape);
        extinguisherBody.position.copy(position);
        
        return {
            mesh: extinguisherMesh,
            body: extinguisherBody,
            type: 'fire_extinguisher',
            properties: {
                charge: 100,
                type: 'CO2',
                pressure: 850, // PSI
                lastInspection: Date.now(),
                effective_against: ['electrical', 'chemical', 'grease']
            }
        };
    }
    
    static createThermostat(position) {
        // Digital thermostat
        const thermostatGeometry = new THREE.BoxGeometry(0.12, 0.08, 0.03);
        const thermostatMaterial = new THREE.MeshLambertMaterial({ color: 0xf0f0f0 });
        const thermostatMesh = new THREE.Mesh(thermostatGeometry, thermostatMaterial);
        
        // Digital display
        const displayGeometry = new THREE.PlaneGeometry(0.08, 0.04);
        const displayMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x00ff00,
            transparent: true,
            opacity: 0.9
        });
        const display = new THREE.Mesh(displayGeometry, displayMaterial);
        display.position.z = 0.016;
        thermostatMesh.add(display);
        
        return {
            mesh: thermostatMesh,
            body: null, // Wall mounted
            type: 'thermostat',
            properties: {
                current_temp: 22,
                target_temp: 24,
                humidity_control: false,
                wifi_enabled: true,
                power_consumption: 3, // watts
                brand: 'Smart-Climate Pro'
            }
        };
    }
    
    static createAdvancedThermostat(position) {
        // Expensive thermostat with humidity control
        const thermostat = this.createThermostat(position);
        thermostat.properties.humidity_control = true;
        thermostat.properties.current_humidity = 60;
        thermostat.properties.target_humidity = 65;
        thermostat.properties.brand = 'Premium Climate Master';
        thermostat.properties.price = 299;
        
        // Enhanced display
        const humidityDisplay = new THREE.PlaneGeometry(0.06, 0.02);
        const humidityMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x00aaff,
            transparent: true,
            opacity: 0.9
        });
        const humDisplay = new THREE.Mesh(humidityDisplay, humidityMaterial);
        humDisplay.position.set(0, -0.025, 0.016);
        thermostat.mesh.add(humDisplay);
        
        return thermostat;
    }
    
    static createEvaporativeMister(position) {
        // Ultrasonic misting system
        const misterGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.3, 8);
        const misterMaterial = new THREE.MeshLambertMaterial({ color: 0x4444aa });
        const misterMesh = new THREE.Mesh(misterGeometry, misterMaterial);
        
        // Water tank
        const tankGeometry = new THREE.CylinderGeometry(0.12, 0.12, 0.25, 8);
        const tankMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x88ccff,
            transparent: true,
            opacity: 0.6
        });
        const tank = new THREE.Mesh(tankGeometry, tankMaterial);
        tank.position.y = -0.05;
        misterMesh.add(tank);
        
        // Mist nozzles
        for (let i = 0; i < 4; i++) {
            const nozzleGeometry = new THREE.SphereGeometry(0.01, 6, 6);
            const nozzleMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
            const nozzle = new THREE.Mesh(nozzleGeometry, nozzleMaterial);
            const angle = (i / 4) * Math.PI * 2;
            nozzle.position.set(
                Math.cos(angle) * 0.12,
                0.1,
                Math.sin(angle) * 0.12
            );
            misterMesh.add(nozzle);
        }
        
        // Physics body
        const misterShape = new CANNON.Cylinder(0.15, 0.15, 0.3, 8);
        const misterBody = new CANNON.Body({ mass: 8.0 });
        misterBody.addShape(misterShape);
        misterBody.position.copy(position);
        
        return {
            mesh: misterMesh,
            body: misterBody,
            type: 'evaporative_mister',
            properties: {
                water_level: 100,
                mist_rate: 50, // ml/hour
                coverage_area: 25, // square meters
                ultrasonic: true,
                timer_enabled: true,
                power_consumption: 25 // watts
            }
        };
    }
    
    static createWaterTray(position) {
        // Humidity tray method
        const trayGeometry = new THREE.CylinderGeometry(0.25, 0.25, 0.05, 12);
        const trayMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        const trayMesh = new THREE.Mesh(trayGeometry, trayMaterial);
        
        // Water surface
        const waterGeometry = new THREE.CylinderGeometry(0.23, 0.23, 0.02, 12);
        const waterMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x4488ff,
            transparent: true,
            opacity: 0.7
        });
        const water = new THREE.Mesh(waterGeometry, waterMaterial);
        water.position.y = 0.015;
        trayMesh.add(water);
        
        // Pebbles for decoration and function
        for (let i = 0; i < 20; i++) {
            const pebbleGeometry = new THREE.SphereGeometry(0.01 + Math.random() * 0.02, 6, 6);
            const pebbleMaterial = new THREE.MeshLambertMaterial({ 
                color: new THREE.Color().setHSL(0.1, 0.3, 0.3 + Math.random() * 0.4)
            });
            const pebble = new THREE.Mesh(pebbleGeometry, pebbleMaterial);
            pebble.position.set(
                (Math.random() - 0.5) * 0.4,
                0.01,
                (Math.random() - 0.5) * 0.4
            );
            trayMesh.add(pebble);
        }
        
        // Physics body
        const trayShape = new CANNON.Cylinder(0.25, 0.25, 0.05, 12);
        const trayBody = new CANNON.Body({ mass: 2.0 });
        trayBody.addShape(trayShape);
        trayBody.position.copy(position);
        
        return {
            mesh: trayMesh,
            body: trayBody,
            type: 'water_tray',
            properties: {
                water_level: 80,
                evaporation_rate: 2, // % per day
                humidity_increase: 15, // % in local area
                maintenance_required: false
            }
        };
    }
}

// Export for use in main game
if (typeof window !== 'undefined') {
    window.RealisticWorldPhysics = RealisticWorldPhysics;
    window.FireSystem = FireSystem;
    window.ElectricalSystem = ElectricalSystem;
    window.WeatherSystem = WeatherSystem;
    window.RealisticObjectFactory = RealisticObjectFactory;
}