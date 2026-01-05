// Constants
const KNIGHT_COST = 80;
const ARCHER_COST = 100;
const GIANT_COST = 140;
const GRID_WIDTH = 1920;
const GRID_HEIGHT = 1000;
const QUEEN_SPEED = 60;
const KNIGHT_SPEED = 100;
const CONTACT_RANGE = 5;
const QUEEN_RADIUS = 30;
const KNIGHT_RADIUS = 20;
const MAX_TOWER_HP = 800;
const QUEEN_TOWER_UP = 100;
const KNIGHT_TRAIN_TURNS = 4;
const ARCHER_TRAIN_TURNS = 7;
const GIANT_TRAIN_TURNS = 9;

// Enums
enum StructureType {
    NONE = "NONE",
    MINE = "MINE",
    TOWER = "TOWER",
    BARRACKS = "BARRACKS"
}

enum Owner {
    NONE = "NONE",
    FRIENDLY = "FRIENDLY",
    ENEMY = "ENEMY"
}

enum BarracksType {
    NONE = "NONE",
    KNIGHT = "KNIGHT",
    ARCHER = "ARCHER",
    GIANT = "GIANT"
}

enum UnitType {
    QUEEN = "QUEEN",
    KNIGHT = "KNIGHT",
    ARCHER = "ARCHER",
    GIANT = "GIANT"
}

// Helper function to convert IDs to enums
const StructureTypeFromId = (id: number): StructureType => {
    switch (id) {
        case -1: return StructureType.NONE;
        case 0: return StructureType.MINE;
        case 1: return StructureType.TOWER;
        case 2: return StructureType.BARRACKS;
        default: throw new Error("Unsupported structure type id");
    }
};

const OwnerFromId = (id: number): Owner => {
    switch (id) {
        case -1: return Owner.NONE;
        case 0: return Owner.FRIENDLY;
        case 1: return Owner.ENEMY;
        default: throw new Error("Unsupported owner id");
    }
};

const BarracksTypeFromId = (id: number): BarracksType => {
    switch (id) {
        case -1: return BarracksType.NONE;
        case 0: return BarracksType.KNIGHT;
        case 1: return BarracksType.ARCHER;
        case 2: return BarracksType.GIANT;
        default: throw new Error("Unsupported barracks type id");
    }
};

const UnitTypeFromId = (id: number): UnitType => {
    switch (id) {
        case -1: return UnitType.QUEEN;
        case 0: return UnitType.KNIGHT;
        case 1: return UnitType.ARCHER;
        case 2: return UnitType.GIANT;
        default: throw new Error("Unsupported unit type id");
    }
};

// Utility class
class Utils {
    static inContact(x1: number, y1: number, r1: number, x2: number, y2: number, r2: number): boolean {
        return Utils.dist(x1, y1, x2, y2) - r1 - r2 < CONTACT_RANGE;
    }

    static dist(x1: number, y1: number, x2: number, y2: number): number {
        return Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2));
    }

    static isProjectedPointOnLineSegment(x1: number, y1: number, x2: number, y2: number, x0: number, y0: number): boolean {
        const e1x = x2 - x1;
        const e1y = y2 - y1;
        const recArea = e1x * e1x + e1y * e1y;
        const e2x = x0 - x1;
        const e2y = y0 - y1;
        const val = e1x * e2x + e1y * e2y;
        return val > 0 && val < recArea;
    }

    static distLinePoint(x1: number, y1: number, x2: number, y2: number, x0: number, y0: number): number {
        return Math.abs((y2 - y1) * x0 - (x2 - x1) * y0 + x2 * y1 - y2 * x1) / 
               Math.sqrt((y2 - y1) * (y2 - y1) + (x2 - x1) * (x2 - x1));
    }

    static isObstackle(x1: number, y1: number, x2: number, y2: number, x0: number, y0: number, radius: number): boolean {
        return Utils.distLinePoint(x1, y1, x2, y2, x0, y0) < radius && 
               Utils.isProjectedPointOnLineSegment(x1, y1, x2, y2, x0, y0);
    }
}

// Data classes
class BuildingSiteStatic {
    constructor(
        public readonly id: number,
        public readonly x: number,
        public readonly y: number,
        public readonly radius: number
    ) {}

    static create(id: number, x: number, y: number, radius: number): BuildingSiteStatic {
        return new BuildingSiteStatic(id, x, y, radius);
    }
}

class BuildingSite {
    constructor(
        public readonly staticInfo: BuildingSiteStatic,
        public readonly structureType: StructureType,
        public readonly owner: Owner,
        public readonly untilTrain: number,
        public readonly gold: number | null,
        public readonly maxMineSize: number | null,
        public readonly towerHP: number,
        public readonly towerRange: number,
        public readonly incomeRate: number,
        public readonly barracksType: BarracksType
    ) {}

    static create(
        staticInfo: BuildingSiteStatic,
        structureType: StructureType,
        owner: Owner,
        untilTrain: number,
        gold: number | null,
        maxMineSize: number | null,
        towerHP: number,
        towerRange: number,
        incomeRate: number,
        barracksType: BarracksType
    ): BuildingSite {
        return new BuildingSite(
            staticInfo,
            structureType,
            owner,
            untilTrain,
            gold,
            maxMineSize,
            towerHP,
            towerRange,
            incomeRate,
            barracksType
        );
    }

    get id(): number { return this.staticInfo.id; }
    get x(): number { return this.staticInfo.x; }
    get y(): number { return this.staticInfo.y; }
    get radius(): number { return this.staticInfo.radius; }
}

class Unit {
    constructor(
        public readonly x: number,
        public readonly y: number,
        public readonly owner: Owner,
        public readonly unitType: UnitType,
        public readonly hp: number
    ) {}

    static create(x: number, y: number, owner: Owner, unitType: UnitType, hp: number): Unit {
        return new Unit(x, y, owner, unitType, hp);
    }
}

// Move and MoveBuilder
interface Move {
    x: number | null;
    y: number | null;
    siteId: number | null;
    structureType: StructureType | null;
    barracksType: BarracksType | null;
    trainInSites: number[];
}

class MoveBuilder {
    x: number | null = null;
    y: number | null = null;
    siteId: number | null = null;
    structureType: StructureType | null = null;
    barracksType: BarracksType | null = null;
    trainInSites: number[] = [];

    setX(x: number): MoveBuilder {
        this.x = x;
        return this;
    }

    setY(y: number): MoveBuilder {
        this.y = y;
        return this;
    }

    setSiteId(siteId: number): MoveBuilder {
        this.siteId = siteId;
        return this;
    }

    setStructureType(structureType: StructureType): MoveBuilder {
        this.structureType = structureType;
        return this;
    }

    setBarracksType(barracksType: BarracksType): MoveBuilder {
        this.barracksType = barracksType;
        return this;
    }

    setTrainInSites(trainInSites: number[]): MoveBuilder {
        this.trainInSites = trainInSites;
        return this;
    }

    getTrainInSites(): number[] {
        return this.trainInSites;
    }

    createMove(): Move {
        return {
            x: this.x,
            y: this.y,
            siteId: this.siteId,
            structureType: this.structureType,
            barracksType: this.barracksType,
            trainInSites: this.trainInSites || []
        };
    }
}

// GameState
class GameState {
    private buildingSiteStatics: BuildingSiteStatic[];
    private buildingSiteStaticById: Map<number, BuildingSiteStatic>;
    private buildingSites: BuildingSite[] = [];
    private buildingSiteById: Map<number, BuildingSite> = new Map();
    private units: Unit[] = [];
    private goldLeft = 0;
    private touchedSite: BuildingSite | null = null;
    private myQueen: Unit | null = null;
    private enemyQueen: Unit | null = null;
    private myCornerX = -1;
    private myCornerY = -1;
    private overallIncome = 0;
    private enemyGold = 100;
    private incomeRate: Map<number, number> = new Map();
    private enemyOverallIncome = 0;

    constructor(buildingSiteStatics: BuildingSiteStatic[]) {
        this.buildingSiteStatics = buildingSiteStatics;
        this.buildingSiteStaticById = new Map(
            buildingSiteStatics.map(bs => [bs.id, bs])
        );
    }

    static create(buildingSiteStatics: BuildingSiteStatic[]): GameState {
        return new GameState(buildingSiteStatics);
    }

    getBuildingSiteStaticById(id: number): BuildingSiteStatic {
        const site = this.buildingSiteStaticById.get(id);
        if (!site) throw new Error(`Building site static ${id} not found`);
        return site;
    }

    initTurn(
        gold: number,
        touchedSite: number,
        buildingSites: BuildingSite[],
        units: Unit[]
    ): void {
        this.buildingSiteById = new Map(buildingSites.map(bs => [bs.id, bs]));
        this.goldLeft = gold;
        this.buildingSites = buildingSites;
        this.units = units;
        
        const myQueen = units.find(u => u.owner === Owner.FRIENDLY && u.unitType === UnitType.QUEEN);
        if (!myQueen) throw new Error("My queen not found");
        this.myQueen = myQueen;
        
        const enemyQueen = units.find(u => u.owner === Owner.ENEMY && u.unitType === UnitType.QUEEN);
        if (!enemyQueen) throw new Error("Enemy queen not found");
        const prevEnemyQueen = this.enemyQueen;
        this.enemyQueen = enemyQueen;

        if (touchedSite === -1) {
            this.touchedSite = null;
            for (const site of buildingSites) {
                if (Utils.dist(myQueen.x, myQueen.y, site.x, site.y) - site.radius - QUEEN_RADIUS < CONTACT_RANGE) {
                    this.touchedSite = site;
                }
            }
        } else {
            const site = this.buildingSiteById.get(touchedSite);
            if (!site) throw new Error(`Touched site ${touchedSite} not found`);
            this.touchedSite = site;
        }

        this.overallIncome = buildingSites.reduce((sum, site) => sum + site.incomeRate, 0);
        
        if (this.myCornerX === -1) {
            if (myQueen.x < GRID_WIDTH / 2) {
                this.myCornerX = 0;
                this.myCornerY = 0;
            } else {
                this.myCornerX = GRID_WIDTH;
                this.myCornerY = GRID_HEIGHT;
            }
        }

        this.updateEnemyGold(prevEnemyQueen, enemyQueen);
    }

    private updateEnemyGold(prevEnemyQueen: Unit | null, curEnemyQueen: Unit): void {
        this.enemyOverallIncome = 0;
        
        for (const site of this.buildingSites) {
            if (site.structureType === StructureType.MINE && site.owner === Owner.ENEMY) {
                const currentRate = this.incomeRate.get(site.id) || 0;
                if (currentRate === 0) {
                    this.incomeRate.set(site.id, 1);
                } else if (prevEnemyQueen && 
                           prevEnemyQueen.x === curEnemyQueen.x && 
                           prevEnemyQueen.y === curEnemyQueen.y &&
                           Utils.dist(curEnemyQueen.x, curEnemyQueen.y, site.x, site.y) - 
                           site.radius - QUEEN_RADIUS < CONTACT_RANGE) {
                    this.incomeRate.set(site.id, currentRate + 1);
                }
                const rate = this.incomeRate.get(site.id) || 0;
                this.enemyGold += rate;
                this.enemyOverallIncome += site.incomeRate;
            } else {
                this.incomeRate.set(site.id, 0);
            }

            if (site.structureType === StructureType.BARRACKS && site.owner === Owner.ENEMY) {
                switch (site.barracksType) {
                    case BarracksType.KNIGHT:
                        if (site.untilTrain === KNIGHT_TRAIN_TURNS) {
                            this.enemyGold -= KNIGHT_COST;
                        }
                        break;
                    case BarracksType.ARCHER:
                        if (site.untilTrain === ARCHER_TRAIN_TURNS) {
                            this.enemyGold -= ARCHER_COST;
                        }
                        break;
                    case BarracksType.GIANT:
                        if (site.untilTrain === GIANT_TRAIN_TURNS) {
                            this.enemyGold -= GIANT_COST;
                        }
                        break;
                    default:
                        throw new Error("Unknown barracks type");
                }
            }
            this.enemyGold = Math.max(this.enemyGold, 0);
        }
    }

    // Getters
    getBuildingSites(): BuildingSite[] { return this.buildingSites; }
    getUnits(): Unit[] { return this.units; }
    getGoldLeft(): number { return this.goldLeft; }
    getTouchedSite(): BuildingSite | null { return this.touchedSite; }
    getMyQueen(): Unit { 
        if (!this.myQueen) throw new Error("My queen not initialized");
        return this.myQueen;
    }
    getEnemyQueen(): Unit { 
        if (!this.enemyQueen) throw new Error("Enemy queen not initialized");
        return this.enemyQueen;
    }
    getMyCornerX(): number { return this.myCornerX; }
    getMyCornerY(): number { return this.myCornerY; }
    getOverallIncome(): number { return this.overallIncome; }
    getEnemyGold(): number { return this.enemyGold; }
    getEnemyOverallIncome(): number { return this.enemyOverallIncome; }
}

// Rules
interface Rule {
    makeMove(gameState: GameState): MoveBuilder | null;
    priority(): number;
}

class RunFromKnightsRule implements Rule {
    private static readonly PANIC_MODE_DIST = 300;

    static isPanicMode(gameState: GameState): boolean {
        const myQueen = gameState.getMyQueen();
        for (const unit of gameState.getUnits()) {
            if (unit.owner !== Owner.ENEMY || unit.unitType !== UnitType.KNIGHT) continue;
            if (Utils.dist(myQueen.x, myQueen.y, unit.x, unit.y) < RunFromKnightsRule.PANIC_MODE_DIST) {
                return true;
            }
        }
        return false;
    }

    makeMove(gameState: GameState): MoveBuilder | null {
        if (!RunFromKnightsRule.isPanicMode(gameState)) {
            return null;
        }

        let enemiesCount = 0;
        let sumX = 0;
        let sumY = 0;
        const myQueen = gameState.getMyQueen();
        
        for (const unit of gameState.getUnits()) {
            if (unit.owner !== Owner.ENEMY || unit.unitType !== UnitType.KNIGHT) continue;
            if (Utils.dist(myQueen.x, myQueen.y, unit.x, unit.y) < RunFromKnightsRule.PANIC_MODE_DIST) {
                enemiesCount++;
                sumX += unit.x;
                sumY += unit.y;
            }
        }

        const enemyCenterX = sumX / enemiesCount;
        const enemyCenterY = sumY / enemiesCount;

        let maxDist = Number.MIN_SAFE_INTEGER;
        let targetTower: BuildingSite | null = null;
        
        const enemyOrigin = BuildStructureRule.closestToStructure(
            StructureType.BARRACKS,
            BarracksType.KNIGHT,
            Owner.ENEMY,
            myQueen.x,
            myQueen.y,
            gameState
        );
        
        const enemyQueen = gameState.getEnemyQueen();
        
        for (const site of gameState.getBuildingSites()) {
            const isMyTower = site.owner === Owner.FRIENDLY && site.structureType === StructureType.TOWER;
            let isVacantCoveredByTower = false;
            
            if (site.structureType === StructureType.NONE) {
                for (const siteB of gameState.getBuildingSites()) {
                    if (siteB.owner === Owner.FRIENDLY && siteB.structureType === StructureType.TOWER &&
                        Utils.dist(siteB.x, siteB.y, site.x, site.y) <= siteB.towerRange) {
                        isVacantCoveredByTower = true;
                        break;
                    }
                }
            }
            
            if (!isMyTower && !isVacantCoveredByTower) continue;

            const dist = Utils.dist(
                enemyOrigin ? enemyOrigin.x : enemyQueen.x,
                enemyOrigin ? enemyOrigin.y : enemyQueen.y,
                site.x,
                site.y
            );
            
            if (maxDist < dist) {
                maxDist = dist;
                targetTower = site;
            }
        }

        if (!targetTower) return null;

        const path = GoToNewSiteRule.findPath(
            myQueen.x,
            myQueen.y,
            targetTower,
            null,
            gameState
        );

        if (path.goingRound) {
            return new MoveBuilder().setX(path.stepX).setY(path.stepY);
        }

        const targetTowerX = targetTower.x;
        const targetTowerY = targetTower.y;
        let queenX = myQueen.x - targetTowerX;
        let queenY = myQueen.y - targetTowerY;
        const k = (targetTower.radius + QUEEN_RADIUS) / Utils.dist(0, 0, queenX, queenY);
        queenX *= k;
        queenY *= k;
        
        const enemyCenterXAdjusted = enemyCenterX - targetTowerX;
        const enemyCenterYAdjusted = enemyCenterY - targetTowerY;
        
        let targetX: number;
        let targetY: number;
        
        if (Utils.dist(-queenY, queenX, enemyCenterXAdjusted, enemyCenterYAdjusted) > 
            Utils.dist(queenY, -queenX, enemyCenterXAdjusted, enemyCenterYAdjusted)) {
            targetX = -queenY;
            targetY = queenX;
        } else {
            targetX = queenY;
            targetY = -queenX;
        }
        
        targetX += targetTowerX;
        targetY += targetTowerY;
        
        return new MoveBuilder().setX(Math.round(targetX)).setY(Math.round(targetY));
    }

    priority(): number {
        return 2;
    }
}

// Path class for GoToNewSiteRule
class GoToNewSitePath {
    constructor(
        public readonly dist: number,
        public readonly stepX: number,
        public readonly stepY: number,
        public readonly goingRound: boolean
    ) {}
}

class GoToNewSiteRule implements Rule {
    private static readonly ENEMY_TERRITORY = 450;
    private static readonly MAX_DIST_TO_SITE = 800;

    static findPath(
        curX: number,
        curY: number,
        firstSite: BuildingSite,
        secondSite: BuildingSite | null,
        gameState: GameState
    ): GoToNewSitePath {
        // Search for obstacles in straight line path
        let obstDist = Number.MAX_SAFE_INTEGER;
        let obstSite: BuildingSite | null = null;
        
        for (const site of gameState.getBuildingSites()) {
            if (site.id === firstSite.id) continue;
            
            const dist = Utils.dist(curX, curY, site.x, site.y);
            if (Utils.isObstackle(curX, curY, firstSite.x, firstSite.y, site.x, site.y, site.radius + QUEEN_RADIUS) && 
                obstDist > dist) {
                obstDist = dist;
                obstSite = site;
            }
        }

        if (obstSite) {
            let centCurX = curX - obstSite.x;
            let centCurY = curY - obstSite.y;
            const k = (obstSite.radius + QUEEN_RADIUS) / obstDist;
            centCurX *= k;
            centCurY *= k;

            let newX: number;
            let newY: number;
            
            if (Utils.dist(-centCurY, centCurX, firstSite.x - obstSite.x, firstSite.y - obstSite.y) > 
                Utils.dist(centCurY, -centCurX, firstSite.x - obstSite.x, firstSite.y - obstSite.y)) {
                newX = Math.round(centCurY + obstSite.x);
                newY = Math.round(-centCurX + obstSite.y);
            } else {
                newX = Math.round(-centCurY + obstSite.x);
                newY = Math.round(centCurX + obstSite.y);
            }
            
            const path = GoToNewSiteRule.findPath(newX, newY, firstSite, secondSite, gameState);
            return new GoToNewSitePath(
                path.dist + Utils.dist(curX, curY, newX, newY),
                newX,
                newY,
                true
            );
        }

        // Find if it is possible to approach in one turn
        let bestFuture = Number.MAX_SAFE_INTEGER;
        let moveX = -1;
        let moveY = -1;
        
        for (let x1 = -QUEEN_SPEED; x1 <= QUEEN_SPEED; x1++) {
            for (let y1 = -QUEEN_SPEED; y1 <= QUEEN_SPEED; y1++) {
                const newX = curX + x1;
                const newY = curY + y1;
                
                if (newX < 0 || newX > GRID_WIDTH || newY < 0 || newY > GRID_HEIGHT) continue;
                
                const d = Utils.dist(curX, curY, newX, newY);
                if (d > QUEEN_SPEED) continue;
                
                if (!Utils.inContact(newX, newY, QUEEN_RADIUS, firstSite.x, firstSite.y, firstSite.radius)) {
                    continue;
                }

                const secondDist = Utils.dist(
                    newX,
                    newY,
                    secondSite ? secondSite.x : gameState.getMyCornerX(),
                    secondSite ? secondSite.y : gameState.getMyCornerY()
                ) - (secondSite ? secondSite.radius : 0) - QUEEN_RADIUS - CONTACT_RANGE;

                if (secondDist < bestFuture) {
                    bestFuture = secondDist;
                    moveX = newX;
                    moveY = newY;
                }
            }
        }

        if (moveX !== -1) {
            return new GoToNewSitePath(QUEEN_SPEED + bestFuture, moveX, moveY, false);
        }

        if (!secondSite) {
            return new GoToNewSitePath(
                Utils.dist(curX, curY, firstSite.x, firstSite.y) - firstSite.radius - QUEEN_RADIUS - CONTACT_RANGE,
                firstSite.x,
                firstSite.y,
                false
            );
        }

        // If first site is on the way to second
        if (Utils.isObstackle(
            curX, curY,
            secondSite.x, secondSite.y,
            firstSite.x, firstSite.y,
            firstSite.radius + QUEEN_RADIUS
        )) {
            return GoToNewSiteRule.findPath(curX, curY, secondSite, null, gameState);
        }

        let turnX = secondSite.x - firstSite.x;
        let turnY = secondSite.y - firstSite.y;
        const k2 = (firstSite.radius + QUEEN_RADIUS) / Utils.dist(secondSite.x, secondSite.y, firstSite.x, firstSite.y);
        turnX = (turnX * k2) + firstSite.x;
        turnY = (turnY * k2) + firstSite.y;

        return new GoToNewSitePath(
            Utils.dist(curX, curY, turnX, turnY) + 
            Utils.dist(turnX, turnY, secondSite.x, secondSite.y) - 
            secondSite.radius - QUEEN_RADIUS - CONTACT_RANGE,
            Math.round(turnX),
            Math.round(turnY),
            false
        );
    }

    makeMove(gameState: GameState): MoveBuilder | null {
        const vacantSitesFirst: Array<{site: BuildingSite, value: number}> = [];
        const vacantSitesSecond: Array<{site: BuildingSite, value: number}> = [];
        const myQueen = gameState.getMyQueen();
        const touchedSite = gameState.getTouchedSite();

        outer_loop:
        for (const site of gameState.getBuildingSites()) {
            if (touchedSite && touchedSite.id === site.id) continue;
            
            const distToQueen = Utils.dist(myQueen.x, myQueen.y, site.x, site.y);
            if (Math.abs(site.x - (GRID_WIDTH - gameState.getMyCornerX())) <= GoToNewSiteRule.ENEMY_TERRITORY ||
                distToQueen > GoToNewSiteRule.MAX_DIST_TO_SITE) {
                continue;
            }

            let inEnemyTowerRange = false;
            for (const siteB of gameState.getBuildingSites()) {
                if (siteB.owner !== Owner.ENEMY || siteB.structureType !== StructureType.TOWER) continue;
                
                if (Utils.dist(site.x, site.y, siteB.x, siteB.y) + 
                    (gameState.getEnemyQueen().hp > myQueen.hp ? siteB.radius : 0) <= siteB.towerRange) {
                    inEnemyTowerRange = true;
                    break;
                }
            }
            if (inEnemyTowerRange) continue;

            for (const unit of gameState.getUnits()) {
                if (unit.owner !== Owner.ENEMY || unit.unitType !== UnitType.KNIGHT) continue;
                
                const dist = Utils.dist(unit.x, unit.y, site.x, site.y);
                if (dist / KNIGHT_SPEED <= distToQueen / QUEEN_SPEED) {
                    continue outer_loop;
                }
            }

            const buildingDecisionFirst = BuildStructureRule.buildingDecision(site, gameState, false);
            if (!buildingDecisionFirst) continue;
            
            const buildingDecisionSecond = BuildStructureRule.buildingDecision(site, gameState, true);
            
            vacantSitesFirst.push({site, value: buildingDecisionFirst.distBonus});
            if (buildingDecisionSecond) {
                vacantSitesSecond.push({site, value: buildingDecisionSecond.distBonus});
            }
        }

        vacantSitesFirst.sort((a, b) => 
            Utils.dist(myQueen.x, myQueen.y, a.site.x, a.site.y) - a.value - 
            (Utils.dist(myQueen.x, myQueen.y, b.site.x, b.site.y) - b.value)
        );
        
        vacantSitesSecond.sort((a, b) =>
            Utils.dist(myQueen.x, myQueen.y, a.site.x, a.site.y) - a.value -
            (Utils.dist(myQueen.x, myQueen.y, b.site.x, b.site.y) - b.value)
        );

        if (vacantSitesFirst.length === 0) return null;

        let minDist = Number.MAX_SAFE_INTEGER;
        let moveX = 0;
        let moveY = 0;
        
        for (let i = 0; i < Math.min(vacantSitesFirst.length, 1); i++) {
            for (let h = i + 1; h < Math.min(vacantSitesSecond.length, 5); h++) {
                if (vacantSitesFirst[i].site.id === vacantSitesSecond[h].site.id) continue;
                
                const path = GoToNewSiteRule.findPath(
                    myQueen.x,
                    myQueen.y,
                    vacantSitesFirst[i].site,
                    vacantSitesSecond[h].site,
                    gameState
                );
                
                const totalDist = path.dist - vacantSitesFirst[i].value - vacantSitesSecond[h].value;
                if (totalDist < minDist) {
                    minDist = totalDist;
                    moveX = path.stepX;
                    moveY = path.stepY;
                }
            }
        }

        if (minDist === Number.MAX_SAFE_INTEGER) {
            const path = GoToNewSiteRule.findPath(
                myQueen.x,
                myQueen.y,
                vacantSitesFirst[0].site,
                null,
                gameState
            );
            return new MoveBuilder().setX(path.stepX).setY(path.stepY);
        }
        
        return new MoveBuilder().setX(moveX).setY(moveY);
    }

    priority(): number {
        return 0;
    }
}

// BuildingDecision class for BuildStructureRule
class BuildingDecision {
    constructor(
        public readonly structureType: StructureType,
        public readonly barracksType: BarracksType | null,
        public readonly distBonus: number
    ) {}
}

class BuildStructureRule implements Rule {
    private static readonly BARRACKS_REPLACEMENT_THRESHOLD_DIST = 400;
    private static readonly SURROUNDING_THRESHOLD = 400;
    private static readonly COMFORT_TOWERS_NUMBER = 2;

    static buildingDecision(
        site: BuildingSite,
        gameState: GameState,
        second: boolean
    ): BuildingDecision | null {
        if (site.owner === Owner.ENEMY && site.structureType === StructureType.TOWER) {
            return null;
        }

        const myQueen = gameState.getMyQueen();
        const enemyQueen = gameState.getEnemyQueen();
        
        let myBarracksCount = 0;
        let myGiantCount = 0;
        let enemyBarracksCount = 0;
        let myMinesCount = 0;
        let myTowersCount = 0;
        let emptySurroundings = 0;
        
        let closestEnemyBarracksDist = Number.MAX_SAFE_INTEGER;
        let closestMyBarracksDist = Number.MAX_SAFE_INTEGER;
        let closestEnemyBarracks: BuildingSite | null = null;
        let closestMyBarracks: BuildingSite | null = null;

        for (const s of gameState.getBuildingSites()) {
            if (s.structureType === StructureType.BARRACKS && 
                s.barracksType === BarracksType.KNIGHT && 
                s.owner === Owner.FRIENDLY) {
                myBarracksCount++;
                const dist = Utils.dist(enemyQueen.x, enemyQueen.y, s.x, s.y);
                if (dist < closestMyBarracksDist) {
                    closestMyBarracksDist = dist;
                    closestMyBarracks = s;
                }
            } else if (s.structureType === StructureType.BARRACKS && 
                       s.barracksType === BarracksType.KNIGHT && 
                       s.owner === Owner.ENEMY) {
                enemyBarracksCount++;
                const dist = Utils.dist(myQueen.x, myQueen.y, s.x, s.y);
                if (dist < closestEnemyBarracksDist) {
                    closestEnemyBarracksDist = dist;
                    closestEnemyBarracks = s;
                }
            } else if (s.structureType === StructureType.BARRACKS && 
                       s.barracksType === BarracksType.GIANT && 
                       s.owner === Owner.FRIENDLY) {
                myGiantCount++;
            } else if (s.structureType === StructureType.MINE && s.owner === Owner.FRIENDLY) {
                myMinesCount++;
            } else if (s.structureType === StructureType.TOWER && s.owner === Owner.FRIENDLY) {
                myTowersCount++;
            } else if (s.structureType === StructureType.NONE) {
                if (Utils.dist(s.x, s.y, site.x, site.y) < BuildStructureRule.SURROUNDING_THRESHOLD) {
                    emptySurroundings++;
                }
            }
        }

        const distToEnemyQueen = Utils.dist(enemyQueen.x, enemyQueen.y, site.x, site.y);
        const maxDistToEnemyQueen = Utils.dist(
            gameState.getMyCornerX(),
            gameState.getMyCornerY(),
            enemyQueen.x,
            enemyQueen.y
        );
        
        const myBarracksDistToEnemyQueen = closestMyBarracks ? 
            Utils.dist(closestMyBarracks.x, closestMyBarracks.y, enemyQueen.x, enemyQueen.y) : null;

        let enemyKnightsBonus = Number.MAX_SAFE_INTEGER;
        let closestEnemyKnight: Unit | null = null;
        let applyKnightBonus = false;

        for (const unit of gameState.getUnits()) {
            if (unit.unitType !== UnitType.KNIGHT || unit.owner !== Owner.ENEMY) continue;
            
            const bonus = Utils.dist(unit.x, unit.y, site.x, site.y) / KNIGHT_SPEED * QUEEN_SPEED;
            if (enemyKnightsBonus > bonus) {
                enemyKnightsBonus = bonus;
                closestEnemyKnight = unit;
                applyKnightBonus = true;
            }
        }

        if (!applyKnightBonus) {
            enemyKnightsBonus = 0;
        }

        if (site.structureType === StructureType.MINE) {
            const towersOnPathVal = BuildStructureRule.towersOnPath(
                gameState,
                gameState.getMyQueen().x,
                gameState.getMyQueen().y,
                closestEnemyBarracks ? closestEnemyBarracks.x : (closestEnemyKnight ? closestEnemyKnight.x : 0),
                closestEnemyBarracks ? closestEnemyBarracks.y : (closestEnemyKnight ? closestEnemyKnight.y : 0),
                null
            );
            
            if (applyKnightBonus && towersOnPathVal < BuildStructureRule.comfortTowersNumber(gameState)) {
                return new BuildingDecision(
                    StructureType.TOWER,
                    null,
                    -(site.incomeRate + 1) * 2 * QUEEN_SPEED + emptySurroundings * QUEEN_SPEED + enemyKnightsBonus
                );
            } else if (myBarracksCount > 0 && myGiantCount === 0 &&
                       gameState.getGoldLeft() > GIANT_COST + KNIGHT_COST / 2 && !second) {
                return new BuildingDecision(
                    StructureType.BARRACKS,
                    BarracksType.GIANT,
                    (maxDistToEnemyQueen - distToEnemyQueen) / 2 + enemyKnightsBonus
                );
            }
        }

        const uselessTower = site.structureType === StructureType.TOWER && 
            closestEnemyBarracks && !applyKnightBonus &&
            BuildStructureRule.towersOnPath(
                gameState,
                myQueen.x, myQueen.y,
                closestEnemyBarracks.x, closestEnemyBarracks.y,
                site
            ) >= BuildStructureRule.comfortTowersNumber(gameState) &&
            BuildStructureRule.towersOnPath(
                gameState,
                site.x, site.y,
                closestEnemyBarracks.x, closestEnemyBarracks.y,
                site
            ) >= BuildStructureRule.comfortTowersNumber(gameState) &&
            (site.gold || 1) > 0;

        if (site.structureType === StructureType.TOWER) {
            if ((MAX_TOWER_HP - site.towerHP) / QUEEN_TOWER_UP > 2 && !uselessTower) {
                return new BuildingDecision(
                    StructureType.TOWER,
                    null,
                    -QUEEN_SPEED + enemyKnightsBonus
                );
            }
        }

        const uselessBarracks = site.structureType === StructureType.BARRACKS &&
            site.barracksType === BarracksType.KNIGHT &&
            myBarracksCount > 1 &&
            closestMyBarracks && closestMyBarracks.id !== site.id;

        if (site.structureType === StructureType.NONE || uselessBarracks || uselessTower) {
            if (myBarracksCount === 0 && (myMinesCount >= 2 || enemyBarracksCount !== 0) && !second) {
                return new BuildingDecision(
                    StructureType.BARRACKS,
                    BarracksType.KNIGHT,
                    (maxDistToEnemyQueen - distToEnemyQueen) / 2 + enemyKnightsBonus
                );
            } else if (myBarracksCount > 0 && myMinesCount >= 2 && myTowersCount === 0 && !second) {
                return new BuildingDecision(
                    StructureType.TOWER,
                    null,
                    emptySurroundings * QUEEN_SPEED + enemyKnightsBonus
                );
            } else if (myBarracksCount > 0 && myBarracksDistToEnemyQueen !== null &&
                       myBarracksDistToEnemyQueen - distToEnemyQueen >= BuildStructureRule.BARRACKS_REPLACEMENT_THRESHOLD_DIST) {
                return new BuildingDecision(
                    StructureType.BARRACKS,
                    BarracksType.KNIGHT,
                    0 + enemyKnightsBonus
                );
            } else if ((enemyBarracksCount > 0 || applyKnightBonus) && closestEnemyBarracks &&
                       BuildStructureRule.towersOnPath(
                           gameState,
                           myQueen.x, myQueen.y,
                           closestEnemyBarracks.x, closestEnemyBarracks.y,
                           null
                       ) < BuildStructureRule.comfortTowersNumber(gameState)) {
                return new BuildingDecision(
                    StructureType.TOWER,
                    null,
                    emptySurroundings * QUEEN_SPEED + enemyKnightsBonus
                );
            } else if (RunFromKnightsRule.isPanicMode(gameState)) {
                return new BuildingDecision(
                    StructureType.TOWER,
                    null,
                    0 + enemyKnightsBonus
                );
            } else if (myBarracksCount > 0 && myGiantCount === 0 &&
                       gameState.getGoldLeft() > GIANT_COST + KNIGHT_COST / 2 && !second) {
                return new BuildingDecision(
                    StructureType.BARRACKS,
                    BarracksType.GIANT,
                    (maxDistToEnemyQueen - distToEnemyQueen) / 2 + enemyKnightsBonus
                );
            } else if (myBarracksCount > 0 && myBarracksDistToEnemyQueen !== null &&
                       myBarracksDistToEnemyQueen - distToEnemyQueen >= BuildStructureRule.BARRACKS_REPLACEMENT_THRESHOLD_DIST) {
                return new BuildingDecision(
                    StructureType.BARRACKS,
                    BarracksType.KNIGHT,
                    (maxDistToEnemyQueen - distToEnemyQueen) / 2 + enemyKnightsBonus
                );
            } else if ((site.gold || 1) > 0) {
                return new BuildingDecision(
                    StructureType.MINE,
                    null,
                    ((site.maxMineSize || 1) - 1) * QUEEN_SPEED + enemyKnightsBonus
                );
            } else {
                return new BuildingDecision(
                    StructureType.TOWER,
                    null,
                    emptySurroundings + enemyKnightsBonus
                );
            }
        }
        
        return null;
    }

    static comfortTowersNumber(gameState: GameState): number {
        if (gameState.getEnemyGold() < KNIGHT_COST && gameState.getEnemyOverallIncome() === 0) {
            return 0;
        } else {
            return BuildStructureRule.COMFORT_TOWERS_NUMBER;
        }
    }

    static closestToStructure(
        type: StructureType,
        barracksType: BarracksType,
        owner: Owner,
        x: number,
        y: number,
        gameState: GameState
    ): BuildingSite | null {
        let minDist = Number.MAX_SAFE_INTEGER;
        let closest: BuildingSite | null = null;
        
        for (const site of gameState.getBuildingSites()) {
            if (site.structureType !== type || site.barracksType !== barracksType || site.owner !== owner) continue;
            
            const dist = Utils.dist(x, y, site.x, site.y);
            if (dist < minDist) {
                minDist = dist;
                closest = site;
            }
        }
        
        return closest;
    }

    static towersOnPath(
        gameState: GameState,
        x1: number, y1: number,
        x2: number, y2: number,
        ignoreTower: BuildingSite | null
    ): number {
        let count = 0;
        
        for (const site of gameState.getBuildingSites()) {
            if (site.structureType !== StructureType.TOWER || 
                site.owner !== Owner.FRIENDLY || 
                (ignoreTower && site.id === ignoreTower.id)) {
                continue;
            }
            
            if (Utils.dist(x1, y1, site.x, site.y) <= site.towerRange ||
                Utils.dist(x2, y2, site.x, site.y) <= site.towerRange ||
                Utils.isObstackle(x1, y1, x2, y2, site.x, site.y, site.towerRange)) {
                count++;
            }
        }
        
        return count;
    }

    makeMove(gameState: GameState): MoveBuilder | null {
        const touchSite = gameState.getTouchedSite();
        if (!touchSite) return null;

        const decision = BuildStructureRule.buildingDecision(touchSite, gameState, false);
        
        if (!decision || decision.structureType === touchSite.structureType) {
            if (touchSite.owner === Owner.FRIENDLY && 
                touchSite.structureType === StructureType.MINE &&
                (touchSite.maxMineSize || 0) > touchSite.incomeRate &&
                !RunFromKnightsRule.isPanicMode(gameState)) {
                return new MoveBuilder()
                    .setSiteId(touchSite.id)
                    .setStructureType(StructureType.MINE);
            }
            
            if (touchSite.owner === Owner.FRIENDLY &&
                touchSite.structureType === StructureType.TOWER &&
                MAX_TOWER_HP - touchSite.towerHP >= QUEEN_TOWER_UP / 2 &&
                !RunFromKnightsRule.isPanicMode(gameState)) {
                return new MoveBuilder()
                    .setSiteId(touchSite.id)
                    .setStructureType(StructureType.TOWER);
            }
            
            return null;
        }

        const moveBuilder = new MoveBuilder()
            .setStructureType(decision.structureType)
            .setSiteId(touchSite.id);
            
        if (decision.barracksType) {
            moveBuilder.setBarracksType(decision.barracksType);
        }
        
        return moveBuilder;
    }

    priority(): number {
        return 3;
    }
}

class GiveWayToKnightRule {
    private static readonly STEP_CHUNKS = 5;

    private static isInWay(knight: Unit, queen: Unit, nextX: number, nextY: number, steps: number): boolean {
        let result = false;
        for (let step = 1; step <= steps; step++) {
            const mod = KNIGHT_SPEED * step * 1.0 / GiveWayToKnightRule.STEP_CHUNKS / 
                       Utils.dist(queen.x, queen.y, knight.x, knight.y);
            const kNextX = knight.x + Math.round(mod * (queen.x - knight.x));
            const kNextY = knight.y + Math.round(mod * (queen.y - knight.y));
            result = result || (Utils.dist(kNextX, kNextY, nextX, nextY) < KNIGHT_RADIUS + QUEEN_RADIUS);
        }
        return result;
    }

    makeMove(preferredMove: Move, gameState: GameState): MoveBuilder | null {
        if (preferredMove.x === null) return null;
        
        const myQueen = gameState.getMyQueen();
        const enemyQueen = gameState.getEnemyQueen();
        
        const k = QUEEN_SPEED / Utils.dist(myQueen.x, myQueen.y, preferredMove.x, preferredMove.y!);
        const preferredX = myQueen.x + Math.round((preferredMove.x - myQueen.x) * k);
        const preferredY = myQueen.y + Math.round((preferredMove.y! - myQueen.y) * k);

        for (const unit of gameState.getUnits()) {
            if (unit.owner !== Owner.FRIENDLY || unit.unitType !== UnitType.KNIGHT) continue;

            if (GiveWayToKnightRule.isInWay(unit, enemyQueen, preferredX, preferredY, 5)) {
                let minDist = Number.MAX_SAFE_INTEGER;
                let bestNextX = 0;
                let bestNextY = 0;
                
                for (let x1 = -QUEEN_SPEED; x1 <= QUEEN_SPEED; x1++) {
                    for (let y1 = -QUEEN_SPEED; y1 <= QUEEN_SPEED; y1++) {
                        const newX = myQueen.x + x1;
                        const newY = myQueen.y + y1;
                        
                        if (newX < 0 || newX > GRID_WIDTH || newY < 0 || newY > GRID_HEIGHT ||
                            Utils.dist(myQueen.x, myQueen.y, newX, newY) > QUEEN_SPEED) {
                            continue;
                        }
                        
                        if (GiveWayToKnightRule.isInWay(unit, enemyQueen, newX, newY, 5)) {
                            continue;
                        }
                        
                        const dist = Utils.dist(newX, newY, preferredX, preferredY);
                        if (minDist > dist) {
                            minDist = dist;
                            bestNextX = newX;
                            bestNextY = newY;
                        }
                    }
                }
                
                if (minDist !== Number.MAX_SAFE_INTEGER) {
                    return new MoveBuilder().setX(bestNextX).setY(bestNextY);
                }
            }
        }
        
        return null;
    }
}

class TrainUnitsRule implements Rule {
    makeMove(gameState: GameState): MoveBuilder | null {
        const trainSites: number[] = [];
        let gold = gameState.getGoldLeft();

        const knightBarracks = gameState.getBuildingSites()
            .filter(x => x.owner === Owner.FRIENDLY && x.barracksType === BarracksType.KNIGHT)
            .sort((a, b) => 
                Utils.dist(a.x, a.y, gameState.getEnemyQueen().x, gameState.getEnemyQueen().y) -
                Utils.dist(b.x, b.y, gameState.getEnemyQueen().x, gameState.getEnemyQueen().y)
            );

        for (const site of knightBarracks) {
            if (gold >= KNIGHT_COST) {
                gold -= KNIGHT_COST;
                trainSites.push(site.id);
            }
        }

        for (const site of gameState.getBuildingSites()) {
            if (site.owner !== Owner.FRIENDLY || site.barracksType !== BarracksType.GIANT) continue;
            
            if (gold >= GIANT_COST) {
                gold -= GIANT_COST;
                trainSites.push(site.id);
            }
        }

        if (trainSites.length > 0) {
            return new MoveBuilder().setTrainInSites(trainSites);
        }
        
        return null;
    }

    priority(): number {
        return 0;
    }
}

// Turn Engine
class TurnEngine {
    private static giveWayToKnightRule = new GiveWayToKnightRule();
    private static queenRules: Rule[] = [
        new GoToNewSiteRule(),
        new BuildStructureRule(),
        new RunFromKnightsRule()
    ];

    private static bestPriorityMove(gameState: GameState, rules: Rule[]): MoveBuilder | null {
        let currentPriority = Number.MIN_SAFE_INTEGER;
        let moveBuilder: MoveBuilder | null = null;
        
        for (const rule of rules) {
            if (currentPriority > rule.priority()) continue;
            
            const move = rule.makeMove(gameState);
            if (move) {
                currentPriority = rule.priority();
                moveBuilder = move;
            }
        }
        
        return moveBuilder;
    }

    static findMove(gameState: GameState): Move {
        let queenMove: MoveBuilder | null = TurnEngine.bestPriorityMove(gameState, TurnEngine.queenRules);
        
        if (queenMove) {
            const subMove = TurnEngine.giveWayToKnightRule.makeMove(queenMove.createMove(), gameState);
            if (subMove) {
                queenMove = subMove;
            }
        }

        const structureRules: Rule[] = [new TrainUnitsRule()];
        const structureMove = TurnEngine.bestPriorityMove(gameState, structureRules);
        
        const finalMove = queenMove || new MoveBuilder();
        if (structureMove) {
            finalMove.setTrainInSites(structureMove.getTrainInSites());
        }
        
        return finalMove.createMove();
    }
}


function moveToString(move: Move): string {
    let result = "";
    
    if (move.x === null && move.structureType === null) {
        result = "WAIT";
    } else if (move.x !== null) {
        result = `MOVE ${move.x} ${move.y}`;
    } else {
        result = `BUILD ${move.siteId} ${move.structureType}`;
        if (move.structureType === StructureType.BARRACKS && move.barracksType) {
            result += `-${move.barracksType}`;
        }
    }
    
    result += "\nTRAIN";
    if (move.trainInSites.length > 0) {
        result += " " + move.trainInSites.join(" ");
    }
    
    return result;
}

function main() {
    // Read initial data
    const numSites = parseInt(readline());
    const buildingSiteStatics: BuildingSiteStatic[] = [];
    
    for (let i = 0; i < numSites; i++) {
        const [siteId, x, y, radius] = readline().split(' ').map(Number);
        buildingSiteStatics.push(BuildingSiteStatic.create(siteId, x, y, radius));
    }
    
    const gameState = GameState.create(buildingSiteStatics);
    
    while (true) {
        const [gold, touchedSite] = readline().split(' ').map(Number);
        const buildingSites: BuildingSite[] = [];
        
        for (let i = 0; i < numSites; i++) {
            const inputs = readline().split(' ');
            const siteId = parseInt(inputs[0]);
            const mineGold = parseInt(inputs[1]);
            const maxMineSize = parseInt(inputs[2]);
            const structureType = parseInt(inputs[3]);
            const owner = parseInt(inputs[4]);
            const param1 = parseInt(inputs[5]);
            const param2 = parseInt(inputs[6]);
            
            const stType = StructureTypeFromId(structureType);
            buildingSites.push(BuildingSite.create(
                gameState.getBuildingSiteStaticById(siteId),
                stType,
                OwnerFromId(owner),
                stType === StructureType.BARRACKS ? param1 : 0,
                mineGold === -1 ? null : mineGold,
                maxMineSize === -1 ? null : maxMineSize,
                stType === StructureType.TOWER ? param1 : 0,
                stType === StructureType.TOWER ? param2 : 0,
                stType === StructureType.MINE ? param1 : 0,
                stType === StructureType.BARRACKS ? BarracksTypeFromId(param2) : BarracksType.NONE
            ));
        }
        
        const numUnits = parseInt(readline());
        const units: Unit[] = [];
        
        for (let i = 0; i < numUnits; i++) {
            const [x, y, owner, unitType, health] = readline().split(' ').map(Number);
            units.push(Unit.create(x, y, OwnerFromId(owner), UnitTypeFromId(unitType), health));
        }
        
        gameState.initTurn(gold, touchedSite, buildingSites, units);
        const move = TurnEngine.findMove(gameState);
        console.log(moveToString(move));
    }
}

// Code Royale readline helper
declare function readline(): string;

main();