// Realistic Carnivorous Plant Models with Growth Stages
class RealisticPlantModels {
    static createPlantModel(group, species, plantData) {
        const { health, age, stage } = plantData;
        const healthColor = this.getHealthColor(health);
        
        // Clear existing plant model
        const existingPlant = group.children.find(child => child.userData?.type === 'plant');
        if (existingPlant) {
            group.remove(existingPlant);
        }
        
        // Create species-specific model
        let plantModel;
        switch (species) {
            case 'dionaea-muscipula':
                plantModel = this.createVenusFlytrap(healthColor, age, stage);
                break;
            case 'sarracenia-purpurea':
            case 'sarracenia-flava':
            case 'sarracenia-leucophylla':
                plantModel = this.createSarracenia(species, healthColor, age, stage);
                break;
            case 'nepenthes-ventrata':
            case 'nepenthes-alata':
            case 'nepenthes-miranda':
                plantModel = this.createNepenthes(species, healthColor, age, stage);
                break;
            case 'drosera-capensis':
            case 'drosera-aliciae':
                plantModel = this.createSundew(species, healthColor, age, stage);
                break;
            case 'cephalotus-follicularis':
                plantModel = this.createCephalotus(healthColor, age, stage);
                break;
            case 'darlingtonia-californica':
                plantModel = this.createDarlingtonia(healthColor, age, stage);
                break;
            default:
                plantModel = this.createGenericCarnivorous(healthColor, age, stage);
        }
        
        plantModel.userData = { type: 'plant', species, stage, age };
        group.add(plantModel);
        
        return plantModel;
    }
    
    static getHealthColor(health) {
        if (health > 90) return { primary: 0x228B22, secondary: 0x32CD32 }; // Deep green
        if (health > 70) return { primary: 0x90EE90, secondary: 0x98FB98 }; // Light green
        if (health > 50) return { primary: 0xFFFF00, secondary: 0xFFD700 }; // Yellow
        if (health > 30) return { primary: 0xFF8C00, secondary: 0xFFA500 }; // Orange
        return { primary: 0xFF6347, secondary: 0xFF4500 }; // Red
    }
    
    static createVenusFlytrap(healthColor, age, stage) {
        const plantGroup = new THREE.Group();
        
        // Growth stages: seedling, juvenile, mature, flowering
        const stageMultiplier = this.getStageMultiplier(stage);
        const trapCount = Math.floor(stage * 2 + 2); // 2-8 traps based on stage
        
        // Rhizome (underground stem)
        const rhizomeGeometry = new THREE.SphereGeometry(0.05 * stageMultiplier, 8, 6);
        const rhizomeMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        const rhizome = new THREE.Mesh(rhizomeGeometry, rhizomeMaterial);
        rhizome.position.y = 0.3;
        plantGroup.add(rhizome);
        
        // Create realistic traps
        for (let i = 0; i < trapCount; i++) {
            const trap = this.createVenusFlytrapTrap(healthColor, stageMultiplier, i, trapCount);
            plantGroup.add(trap);
        }
        
        // Add flower if mature and healthy
        if (stage >= 3 && age > 60 && Math.random() < 0.3) {
            const flower = this.createVenusFlytrapFlower(stageMultiplier);
            plantGroup.add(flower);
        }
        
        return plantGroup;
    }
    
    static createVenusFlytrapTrap(healthColor, stageMultiplier, index, totalTraps) {
        const trapGroup = new THREE.Group();
        
        // Trap size varies with age and health
        const trapSize = (0.08 + Math.random() * 0.04) * stageMultiplier;
        const petioleLength = (0.3 + Math.random() * 0.2) * stageMultiplier;
        
        // Petiole (leaf stem) - flattened and wing-like
        const petioleGeometry = new THREE.BoxGeometry(0.02, petioleLength, 0.08);
        const petioleMaterial = new THREE.MeshLambertMaterial({ color: healthColor.primary });
        const petiole = new THREE.Mesh(petioleGeometry, petioleMaterial);
        
        // Position petiole radiating from center
        const angle = (index / totalTraps) * Math.PI * 2;
        petiole.position.set(
            Math.cos(angle) * 0.1,
            0.3 + petioleLength / 2,
            Math.sin(angle) * 0.1
        );
        petiole.rotation.z = angle;
        trapGroup.add(petiole);
        
        // Trap lobes (two halves)
        const lobeGeometry = new THREE.SphereGeometry(trapSize, 8, 6);
        lobeGeometry.scale(1, 0.3, 1.5); // Flatten and elongate
        
        const lobeMaterial = new THREE.MeshLambertMaterial({ color: healthColor.secondary });
        
        // First lobe
        const lobe1 = new THREE.Mesh(lobeGeometry, lobeMaterial);
        lobe1.position.set(
            Math.cos(angle) * (0.1 + petioleLength),
            0.3 + petioleLength,
            Math.sin(angle) * (0.1 + petioleLength)
        );
        trapGroup.add(lobe1);
        
        // Second lobe (slightly separated)
        const lobe2 = new THREE.Mesh(lobeGeometry, lobeMaterial);
        lobe2.position.copy(lobe1.position);
        lobe2.position.y += trapSize * 0.3;
        trapGroup.add(lobe2);
        
        // Trigger hairs inside trap
        for (let j = 0; j < 3; j++) {
            const hairGeometry = new THREE.CylinderGeometry(0.001, 0.001, trapSize * 0.8, 3);
            const hairMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
            const hair = new THREE.Mesh(hairGeometry, hairMaterial);
            hair.position.copy(lobe1.position);
            hair.position.x += (j - 1) * trapSize * 0.3;
            hair.position.y += trapSize * 0.1;
            trapGroup.add(hair);
        }
        
        // Teeth around trap margin
        for (let k = 0; k < 12; k++) {
            const toothGeometry = new THREE.ConeGeometry(0.002, trapSize * 0.2, 3);
            const toothMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
            const tooth = new THREE.Mesh(toothGeometry, toothMaterial);
            
            const toothAngle = (k / 12) * Math.PI * 2;
            tooth.position.copy(lobe1.position);
            tooth.position.x += Math.cos(toothAngle) * trapSize * 0.8;
            tooth.position.z += Math.sin(toothAngle) * trapSize * 1.2;
            tooth.rotation.z = toothAngle;
            trapGroup.add(tooth);
        }
        
        return trapGroup;
    }
    
    static createSarracenia(species, healthColor, age, stage) {
        const plantGroup = new THREE.Group();
        const stageMultiplier = this.getStageMultiplier(stage);
        const pitcherCount = Math.floor(stage + 1); // 1-4 pitchers
        
        // Species-specific characteristics
        const speciesTraits = this.getSarraceniaTraits(species);
        
        for (let i = 0; i < pitcherCount; i++) {
            const pitcher = this.createSarraceniaPitcher(
                healthColor, 
                stageMultiplier, 
                speciesTraits, 
                i, 
                pitcherCount
            );
            plantGroup.add(pitcher);
        }
        
        // Root crown
        const crownGeometry = new THREE.CylinderGeometry(0.08 * stageMultiplier, 0.06 * stageMultiplier, 0.04, 8);
        const crownMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        const crown = new THREE.Mesh(crownGeometry, crownMaterial);
        crown.position.y = 0.32;
        plantGroup.add(crown);
        
        return plantGroup;
    }
    
    static createSarraceniaPitcher(healthColor, stageMultiplier, traits, index, totalPitchers) {
        const pitcherGroup = new THREE.Group();
        
        // Pitcher dimensions based on species and growth
        const height = (traits.height + Math.random() * 0.2) * stageMultiplier;
        const topRadius = traits.topRadius * stageMultiplier;
        const bottomRadius = traits.bottomRadius * stageMultiplier;
        
        // Main pitcher tube
        const pitcherGeometry = new THREE.CylinderGeometry(topRadius, bottomRadius, height, 12);
        const pitcherMaterial = new THREE.MeshLambertMaterial({ 
            color: healthColor.primary,
            transparent: true,
            opacity: 0.9
        });
        const pitcher = new THREE.Mesh(pitcherGeometry, pitcherMaterial);
        
        // Position pitchers in a cluster
        const angle = (index / totalPitchers) * Math.PI * 2;
        pitcher.position.set(
            Math.cos(angle) * 0.08,
            0.3 + height / 2,
            Math.sin(angle) * 0.08
        );
        pitcher.rotation.z = (Math.random() - 0.5) * 0.3; // Natural lean
        pitcherGroup.add(pitcher);
        
        // Hood (operculim)
        const hoodGeometry = new THREE.SphereGeometry(topRadius * 1.2, 8, 6);
        hoodGeometry.scale(1, 0.4, 1);
        const hoodMaterial = new THREE.MeshLambertMaterial({ color: traits.hoodColor });
        const hood = new THREE.Mesh(hoodGeometry, hoodMaterial);
        hood.position.copy(pitcher.position);
        hood.position.y += height / 2 + topRadius * 0.3;
        hood.rotation.x = -0.3; // Angled over opening
        pitcherGroup.add(hood);
        
        // Wing (if species has them)
        if (traits.hasWing) {
            const wingGeometry = new THREE.PlaneGeometry(0.02, height * 0.8);
            const wingMaterial = new THREE.MeshLambertMaterial({ 
                color: healthColor.secondary,
                side: THREE.DoubleSide
            });
            const wing = new THREE.Mesh(wingGeometry, wingMaterial);
            wing.position.copy(pitcher.position);
            wing.position.x += topRadius * 1.1;
            pitcherGroup.add(wing);
        }
        
        // Venation (decorative veins)
        for (let i = 0; i < 5; i++) {
            const veinGeometry = new THREE.CylinderGeometry(0.001, 0.001, height * 0.8, 3);
            const veinMaterial = new THREE.MeshBasicMaterial({ color: traits.veinColor });
            const vein = new THREE.Mesh(veinGeometry, veinMaterial);
            vein.position.copy(pitcher.position);
            vein.position.x += Math.cos(i / 5 * Math.PI * 2) * topRadius * 0.9;
            vein.position.z += Math.sin(i / 5 * Math.PI * 2) * topRadius * 0.9;
            pitcherGroup.add(vein);
        }
        
        // Digestive fluid
        const fluidGeometry = new THREE.CylinderGeometry(bottomRadius * 0.8, bottomRadius * 0.8, 0.02, 8);
        const fluidMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x444444,
            transparent: true,
            opacity: 0.7
        });
        const fluid = new THREE.Mesh(fluidGeometry, fluidMaterial);
        fluid.position.copy(pitcher.position);
        fluid.position.y = pitcher.position.y - height / 2 + 0.05;
        pitcherGroup.add(fluid);
        
        return pitcherGroup;
    }
    
    static createNepenthes(species, healthColor, age, stage) {
        const plantGroup = new THREE.Group();
        const stageMultiplier = this.getStageMultiplier(stage);
        
        // Main vine
        const vineGeometry = new THREE.CylinderGeometry(0.01, 0.02, 1.2 * stageMultiplier, 6);
        const vineMaterial = new THREE.MeshLambertMaterial({ color: healthColor.primary });
        const vine = new THREE.Mesh(vineGeometry, vineMaterial);
        vine.position.y = 0.9;
        plantGroup.add(vine);
        
        // Leaves and pitchers
        const pitcherCount = Math.floor(stage * 1.5 + 1);
        
        for (let i = 0; i < pitcherCount; i++) {
            const leafHeight = (0.3 + i * 0.2) * stageMultiplier;
            
            // Leaf
            const leafGeometry = new THREE.PlaneGeometry(0.15, 0.25);
            const leafMaterial = new THREE.MeshLambertMaterial({ 
                color: healthColor.primary,
                side: THREE.DoubleSide
            });
            const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
            leaf.position.set(0, leafHeight, 0);
            leaf.rotation.y = (i / pitcherCount) * Math.PI * 2;
            plantGroup.add(leaf);
            
            // Tendril
            const tendrilGeometry = new THREE.CylinderGeometry(0.002, 0.002, 0.15, 4);
            const tendril = new THREE.Mesh(tendrilGeometry, vineMaterial);
            tendril.position.set(
                Math.cos(leaf.rotation.y) * 0.15,
                leafHeight,
                Math.sin(leaf.rotation.y) * 0.15
            );
            tendril.rotation.z = Math.PI / 4;
            plantGroup.add(tendril);
            
            // Pitcher
            const pitcher = this.createNepenthesPitcher(healthColor, stageMultiplier * 0.7, i);
            pitcher.position.set(
                Math.cos(leaf.rotation.y) * 0.25,
                leafHeight - 0.1,
                Math.sin(leaf.rotation.y) * 0.25
            );
            plantGroup.add(pitcher);
        }
        
        return plantGroup;
    }
    
    static createNepenthesPitcher(healthColor, scale, index) {
        const pitcherGroup = new THREE.Group();
        
        // Main pitcher body
        const bodyGeometry = new THREE.CylinderGeometry(0.04 * scale, 0.06 * scale, 0.12 * scale, 8);
        const bodyMaterial = new THREE.MeshLambertMaterial({ 
            color: healthColor.secondary,
            transparent: true,
            opacity: 0.9
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        pitcherGroup.add(body);
        
        // Peristome (rim)
        const rimGeometry = new THREE.TorusGeometry(0.045 * scale, 0.008 * scale, 6, 12);
        const rimMaterial = new THREE.MeshLambertMaterial({ color: 0x8B0000 });
        const rim = new THREE.Mesh(rimGeometry, rimMaterial);
        rim.position.y = 0.06 * scale;
        pitcherGroup.add(rim);
        
        // Lid
        const lidGeometry = new THREE.SphereGeometry(0.05 * scale, 8, 6);
        lidGeometry.scale(1, 0.3, 1);
        const lidMaterial = new THREE.MeshLambertMaterial({ color: healthColor.primary });
        const lid = new THREE.Mesh(lidGeometry, lidMaterial);
        lid.position.y = 0.08 * scale;
        lid.rotation.x = -0.2;
        pitcherGroup.add(lid);
        
        return pitcherGroup;
    }
    
    static getSarraceniaTraits(species) {
        const traits = {
            'sarracenia-purpurea': {
                height: 0.6,
                topRadius: 0.08,
                bottomRadius: 0.12,
                hoodColor: 0x800080,
                veinColor: 0x4B0082,
                hasWing: false
            },
            'sarracenia-flava': {
                height: 1.0,
                topRadius: 0.06,
                bottomRadius: 0.08,
                hoodColor: 0xFFFF00,
                veinColor: 0x228B22,
                hasWing: true
            },
            'sarracenia-leucophylla': {
                height: 0.8,
                topRadius: 0.07,
                bottomRadius: 0.09,
                hoodColor: 0xFFFFFF,
                veinColor: 0xFF0000,
                hasWing: true
            }
        };
        
        return traits[species] || traits['sarracenia-purpurea'];
    }
    
    static getStageMultiplier(stage) {
        // stage 0 = seedling, 1 = juvenile, 2 = adult, 3 = mature, 4 = old
        const multipliers = [0.3, 0.5, 0.8, 1.0, 1.1];
        return multipliers[Math.min(stage, 4)] || 1.0;
    }
    
    static createVenusFlytrapFlower(stageMultiplier) {
        const flowerGroup = new THREE.Group();
        
        // Flower stalk
        const stalkGeometry = new THREE.CylinderGeometry(0.01, 0.01, 0.3 * stageMultiplier, 6);
        const stalkMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 });
        const stalk = new THREE.Mesh(stalkGeometry, stalkMaterial);
        stalk.position.y = 0.5 + 0.15 * stageMultiplier;
        flowerGroup.add(stalk);
        
        // White flowers
        for (let i = 0; i < 3; i++) {
            const flowerGeometry = new THREE.SphereGeometry(0.02 * stageMultiplier, 6, 4);
            const flowerMaterial = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
            const flower = new THREE.Mesh(flowerGeometry, flowerMaterial);
            flower.position.set(
                (Math.random() - 0.5) * 0.1,
                0.5 + 0.25 * stageMultiplier + i * 0.05,
                (Math.random() - 0.5) * 0.1
            );
            flowerGroup.add(flower);
        }
        
        return flowerGroup;
    }
    
    // Growth progression system
    static updatePlantGrowth(plantData, deltaTime) {
        // Age increases over time
        plantData.age += deltaTime * 0.01; // 1 day per 100 real seconds
        
        // Determine growth stage based on age
        const previousStage = plantData.stage || 0;
        
        if (plantData.age < 10) {
            plantData.stage = 0; // seedling
        } else if (plantData.age < 30) {
            plantData.stage = 1; // juvenile
        } else if (plantData.age < 60) {
            plantData.stage = 2; // adult
        } else if (plantData.age < 100) {
            plantData.stage = 3; // mature
        } else {
            plantData.stage = 4; // old
        }
        
        // Health affects growth rate
        const healthMultiplier = plantData.health / 100;
        plantData.age *= (0.5 + healthMultiplier * 0.5);
        
        // Return true if stage changed (needs visual update)
        return plantData.stage !== previousStage;
    }
}

// Export for use in main game
if (typeof window !== 'undefined') {
    window.RealisticPlantModels = RealisticPlantModels;
}