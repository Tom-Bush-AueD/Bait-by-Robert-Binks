import Phaser from 'phaser';
import { GAME } from '../constants.js';
import { drawBackground } from '../objects/Background.js';
import CastingBar from '../objects/CastingBar.js';
import FishingRod from '../objects/FishingRod.js';
import TensionBar from '../objects/TensionBar.js';
import WeatherEffects from '../objects/WeatherEffects.js';
import AchievementPopup from '../objects/AchievementPopup.js';
import { selectFish, generateFishInstance } from '../data/fish.js';
import { getGearById, getFishSellPrice } from '../data/gear.js';
import { getActiveCrewBonus } from '../data/crew.js';
import { GameClock, WeatherSystem } from '../data/weather.js';
import { loadGame, saveGame } from '../data/save.js';
import { checkAchievements } from '../data/achievements.js';
import { audio } from '../objects/AudioManager.js';

const STATES = {
  IDLE: 'idle',
  CASTING: 'casting',
  ANIMATING: 'animating',
  WAITING: 'waiting',
  BITE: 'bite',
  REELING: 'reeling',
  RESULT: 'result'
};

export default class FishingScene extends Phaser.Scene {
  constructor() {
    super('FishingScene');
    this.state = STATES.IDLE;
  }

  init(data) {
    // Load save data
    if (data && data.saveData) {
      this.saveData = data.saveData;
    } else {
      this.saveData = loadGame();
    }
    // Initialize hints tracking
    if (!this.saveData.hintsShown) {
      this.saveData.hintsShown = {};
    }
  }

  create() {
    this.cameras.main.fadeIn(500);

    // Initialize audio
    audio.init();
    audio.startAmbient();

    // Initialize systems
    this.gameClock = new GameClock(6);
    this.weatherSystem = new WeatherSystem();
    this.achievementPopup = new AchievementPopup(this);

    // Draw the environment
    drawBackground(this);

    // Weather effects overlay
    this.weatherEffects = new WeatherEffects(this);
    this.weatherEffects.setWeather(this.weatherSystem.current);

    // Create game objects
    this.castingBar = new CastingBar(this);
    this.fishingRod = new FishingRod(this);
    this.tensionBar = new TensionBar(this);

    // State tracking
    this.currentFish = null;
    this.biteTimer = null;
    this.hookWindow = null;
    this.bobberDipTween = null;
    this.isReeling = false;
    this.fightStartTime = 0;

    // Hint text (for contextual tips)
    this.hintText = this.add.text(GAME.WIDTH / 2, GAME.HEIGHT / 2 + 40, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '16px',
      fontStyle: 'italic',
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 3,
      align: 'center'
    }).setOrigin(0.5).setDepth(20).setVisible(false).setAlpha(0);

    // === HUD ===

    // Main prompt
    this.promptText = this.add.text(GAME.WIDTH / 2, 30, 'Press SPACE to cast', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '22px',
      fontStyle: 'bold',
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5).setDepth(20);

    // Rating text (center)
    this.ratingText = this.add.text(GAME.WIDTH / 2, GAME.HEIGHT / 2 - 60, '', {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '40px',
      fontStyle: 'bold',
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 5
    }).setOrigin(0.5).setDepth(20).setVisible(false);

    // Distance text
    this.distanceText = this.add.text(GAME.WIDTH / 2, GAME.HEIGHT / 2 - 20, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '18px',
      fontStyle: 'bold',
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(20).setVisible(false);

    // Top-left: catch counter + money
    this.catchCountText = this.add.text(10, 10, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '15px',
      fontStyle: 'bold',
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 3
    }).setDepth(20);

    this.moneyText = this.add.text(10, 30, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '15px',
      fontStyle: 'bold',
      color: '#FFE44D',
      stroke: '#000000',
      strokeThickness: 3
    }).setDepth(20);

    // Top-right: time & weather HUD
    this.timeText = this.add.text(GAME.WIDTH - 10, 10, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '16px',
      fontStyle: 'bold',
      color: '#FFFFFF',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(1, 0).setDepth(20);

    this.weatherText = this.add.text(GAME.WIDTH - 10, 30, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#DDEEFF',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(1, 0).setDepth(20);

    this.dayText = this.add.text(GAME.WIDTH - 10, 48, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#CCDDEE',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(1, 0).setDepth(20);

    // Gear info (bottom-left)
    this.gearText = this.add.text(10, GAME.HEIGHT - 18, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      color: '#CCCCDD',
      stroke: '#000000',
      strokeThickness: 3
    }).setDepth(20);

    this.updateHUD();

    // Blink prompt
    this.promptTween = this.tweens.add({
      targets: this.promptText,
      alpha: 0.4,
      duration: 800,
      yoyo: true,
      repeat: -1
    });

    // Menu buttons (bottom)
    this.createMenuButton(GAME.WIDTH - 60, GAME.HEIGHT - 15, 'Shop', () => {
      if (this.state !== STATES.IDLE && this.state !== STATES.RESULT) return;
      saveGame(this.saveData);
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('ShopScene', { saveData: this.saveData });
      });
    });

    this.createMenuButton(GAME.WIDTH - 120, GAME.HEIGHT - 15, 'Log', () => {
      if (this.state !== STATES.IDLE && this.state !== STATES.RESULT) return;
      saveGame(this.saveData);
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('LogbookScene', { saveData: this.saveData });
      });
    });

    // Input handling
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.input.keyboard.on('keydown-SPACE', () => this.handleInput());
    this.input.on('pointerdown', (pointer) => {
      // Ignore clicks on menu buttons area
      if (pointer.y > GAME.HEIGHT - 30 && pointer.x > GAME.WIDTH - 140) return;
      if (this.state === STATES.REELING) {
        this.isReeling = true;
      } else {
        this.handleInput();
      }
    });
    this.input.on('pointerup', () => {
      if (this.state === STATES.REELING) {
        this.isReeling = false;
      }
    });

    this.state = STATES.IDLE;

    // Show first-time cast hint
    this.showHintIfNew('first_cast', 'Tip: Aim for the green zone\non the power bar for a perfect cast!', 4000);
  }

  createMenuButton(x, y, label, callback) {
    const btn = this.add.text(x, y, `[${label}]`, {
      fontFamily: 'Arial, sans-serif',
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#BBBBDD',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(25).setInteractive({ useHandCursor: true });

    btn.on('pointerdown', callback);
    btn.on('pointerover', () => btn.setColor('#FFFFFF'));
    btn.on('pointerout', () => btn.setColor('#BBBBDD'));
    return btn;
  }

  // === CONTEXTUAL HINTS ===

  showHintIfNew(hintId, text, duration = 3500) {
    if (this.saveData.hintsShown[hintId]) return;
    this.saveData.hintsShown[hintId] = true;

    this.hintText.setText(text);
    this.hintText.setVisible(true);
    this.tweens.add({
      targets: this.hintText,
      alpha: 1,
      duration: 400,
      onComplete: () => {
        this.time.delayedCall(duration, () => {
          this.tweens.add({
            targets: this.hintText,
            alpha: 0,
            duration: 600,
            onComplete: () => this.hintText.setVisible(false)
          });
        });
      }
    });
  }

  handleInput() {
    switch (this.state) {
      case STATES.IDLE:
        this.startCasting();
        break;
      case STATES.CASTING:
        this.stopCasting();
        break;
      case STATES.BITE:
        this.hookFish();
        break;
      case STATES.RESULT:
        this.resetToIdle();
        break;
    }
  }

  // === HUD ===

  updateHUD() {
    // Catch counter
    const total = this.saveData.catchLog.length;
    const unique = new Set(this.saveData.catchLog.map(f => f.species)).size;
    this.catchCountText.setText(total > 0 ? `Catches: ${total} | Species: ${unique}/7` : '');

    // Money
    this.moneyText.setText(`${this.saveData.money} coins`);

    // Time
    this.timeText.setText(this.gameClock.getTimeString());
    this.dayText.setText(this.gameClock.getDayString());

    // Weather
    const weather = this.weatherSystem.current;
    const forecast = this.weatherSystem.getForecastStrings();
    this.weatherText.setText(`${weather.name} | Next: ${forecast[0]}`);

    // Gear
    const rod = getGearById(this.saveData.inventory.rod);
    const bait = getGearById(this.saveData.inventory.bait);
    const line = getGearById(this.saveData.inventory.line);
    const parts = [];
    if (rod) parts.push(rod.name);
    if (line) parts.push(line.name);
    if (bait) parts.push(bait.name);
    this.gearText.setText(parts.join(' | '));
  }

  // === GEAR BONUSES ===

  getGearBonuses() {
    const inv = this.saveData.inventory;
    const rod = getGearById(inv.rod) || {};
    const line = getGearById(inv.line) || {};
    const bait = getGearById(inv.bait) || {};
    const tackle = inv.tackle ? getGearById(inv.tackle) || {} : {};
    const crew = getActiveCrewBonus(this.saveData);

    return {
      castBonus: rod.castBonus || 0,
      reelSpeed: rod.reelSpeed || 1,
      tensionRange: rod.tensionRange || 1,
      lineStrength: line.strengthBonus || 0,
      snapThreshold: line.snapThreshold || 0.95,
      biteBonus: (line.biteBonus || 0) + (bait.biteBonus || 0) + (crew.biteBonus || 0),
      rarityBonus: (bait.rarityBonus || 0) + (crew.rarityBonus || 0),
      reelBonus: crew.reelBonus || 0,
      castDistBonus: tackle.castDistBonus || 0,
      tensionStability: tackle.tensionStability || 0,
      biteSpeedBonus: tackle.biteSpeedBonus || 0
    };
  }

  // === PHASE 1: CASTING ===

  startCasting() {
    this.state = STATES.CASTING;
    this.promptText.setText('Press SPACE to stop!');
    this.promptText.setColor('#FFFF00');
    this.ratingText.setVisible(false);
    this.distanceText.setVisible(false);
    this.castingBar.start();
  }

  stopCasting() {
    this.state = STATES.ANIMATING;
    const result = this.castingBar.stop();

    // Track stats
    this.saveData.stats.totalCasts = (this.saveData.stats.totalCasts || 0) + 1;
    if (result.rating === 'perfect') {
      this.saveData.stats.perfectCasts = (this.saveData.stats.perfectCasts || 0) + 1;
    }

    this.showRating(result);

    this.time.delayedCall(300, () => {
      this.castingBar.hide();
    });

    this.promptText.setText('');

    // Apply gear cast bonus
    const bonuses = this.getGearBonuses();
    const boostedAccuracy = Math.min(1, result.accuracy + bonuses.castBonus);

    audio.playCast();

    this.fishingRod.playCastAnimation(boostedAccuracy, (distance) => {
      // Apply cast distance bonus from tackle
      const finalDistance = Math.min(450, distance + bonuses.castDistBonus);
      this.onCastComplete(finalDistance, result);
    });
  }

  showRating(result) {
    const ratingConfig = {
      perfect: { text: 'Perfect!', color: '#44FF44' },
      good: { text: 'Good', color: '#FFDD44' },
      poor: { text: 'Poor', color: '#FF6644' }
    };

    const config = ratingConfig[result.rating];
    this.ratingText.setText(config.text);
    this.ratingText.setColor(config.color);
    this.ratingText.setVisible(true);
    this.ratingText.setAlpha(1);
    this.ratingText.setScale(1.5);

    this.tweens.add({
      targets: this.ratingText,
      scale: 1,
      duration: 300,
      ease: 'Back.easeOut'
    });

    this.time.delayedCall(1500, () => {
      this.tweens.add({
        targets: this.ratingText,
        alpha: 0,
        duration: 500
      });
    });
  }

  // === PHASE 2: WAITING & HOOKING ===

  onCastComplete(distance, result) {
    this.castDistance = distance;
    const bonuses = this.getGearBonuses();
    const weather = this.weatherSystem.current;
    const timePeriod = this.gameClock.getTimePeriod();

    // Select a fish based on distance + rarity modifiers
    const species = selectFish(distance, bonuses.rarityBonus + (weather.rarityModifier - 1) + (timePeriod.rarityModifier - 1));
    if (!species) {
      this.showNoFish();
      return;
    }

    // Roll for bite with bonuses
    const effectiveBiteChance = Math.min(1, species.biteChance
      + bonuses.biteBonus
      + (weather.biteModifier - 1) * 0.3
      + (timePeriod.biteModifier - 1) * 0.3
    );
    const biteRoll = Math.random();
    if (biteRoll > effectiveBiteChance) {
      this.showNoBite(distance);
      return;
    }

    // Generate the fish instance
    this.currentFish = generateFishInstance(species);

    // Enter waiting state
    this.state = STATES.WAITING;
    this.promptText.setText('Waiting for a bite...');
    this.promptText.setColor('#88AACC');

    this.distanceText.setText(`Cast: ${Math.round(distance / 10)}m`);
    this.distanceText.setVisible(true);

    // Random bite delay (reduced by tackle)
    const [minDelay, maxDelay] = species.biteDelay;
    const speedMult = 1 - bonuses.biteSpeedBonus;
    const delay = (minDelay + Math.random() * (maxDelay - minDelay)) * speedMult;

    this.startBobberIdleBob();

    this.biteTimer = this.time.delayedCall(delay, () => {
      this.triggerBite();
    });
  }

  startBobberIdleBob() {
    if (this.bobberIdleTween) this.bobberIdleTween.destroy();

    const baseY = this.fishingRod.hookY;
    this.bobberIdleTween = this.tweens.add({
      targets: this.fishingRod,
      hookY: baseY + 3,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  stopBobberIdleBob() {
    if (this.bobberIdleTween) {
      this.bobberIdleTween.destroy();
      this.bobberIdleTween = null;
    }
  }

  showNoFish() {
    this.state = STATES.RESULT;
    this.promptText.setText('Nothing here... Press SPACE to try again');
    this.promptText.setColor('#FF6644');
  }

  showNoBite(distance) {
    this.state = STATES.WAITING;
    this.distanceText.setText(`Cast: ${Math.round(distance / 10)}m`);
    this.distanceText.setVisible(true);
    this.promptText.setText('Waiting for a bite...');
    this.promptText.setColor('#88AACC');

    this.startBobberIdleBob();

    this.biteTimer = this.time.delayedCall(5000 + Math.random() * 3000, () => {
      this.stopBobberIdleBob();
      this.state = STATES.RESULT;
      this.promptText.setText('No luck this time. Press SPACE to recast');
      this.promptText.setColor('#FF6644');
    });
  }

  triggerBite() {
    this.state = STATES.BITE;
    this.stopBobberIdleBob();

    const baseY = this.fishingRod.hookY;
    this.bobberDipTween = this.tweens.add({
      targets: this.fishingRod,
      hookY: baseY + 12,
      duration: 150,
      yoyo: true,
      repeat: 3,
      ease: 'Quad.easeInOut'
    });

    audio.playBite();

    this.promptText.setText('BITE! Press SPACE now!');
    this.promptText.setColor('#FF4444');
    this.promptText.setScale(1.2);

    // Show bite hint
    this.showHintIfNew('first_bite', 'Quick! Press SPACE to hook the fish!', 1400);

    const hookWindowMs = 1500;
    this.hookWindow = this.time.delayedCall(hookWindowMs, () => {
      this.missedBite();
    });
  }

  hookFish() {
    if (this.hookWindow) this.hookWindow.destroy();
    if (this.bobberDipTween) this.bobberDipTween.destroy();

    audio.playHook();

    this.promptText.setScale(1);

    this.ratingText.setText(`Hooked: ${this.currentFish.species}!`);
    this.ratingText.setColor('#44DDFF');
    this.ratingText.setVisible(true);
    this.ratingText.setAlpha(1);
    this.ratingText.setScale(1.3);

    this.tweens.add({
      targets: this.ratingText,
      scale: 1,
      duration: 300,
      ease: 'Back.easeOut'
    });

    this.time.delayedCall(1200, () => {
      this.ratingText.setVisible(false);
      this.startReeling();
    });
  }

  missedBite() {
    this.state = STATES.RESULT;
    if (this.bobberDipTween) this.bobberDipTween.destroy();
    this.promptText.setScale(1);
    this.promptText.setText('Too slow! The fish got away. Press SPACE');
    this.promptText.setColor('#FF6644');
    this.saveData.stats.totalFishLost = (this.saveData.stats.totalFishLost || 0) + 1;
    this.currentFish = null;
  }

  // === PHASE 3: REELING ===

  startReeling() {
    this.state = STATES.REELING;
    this.isReeling = false;
    this.fightStartTime = Date.now();

    // Configure tension bar with gear bonuses
    const bonuses = this.getGearBonuses();
    this.tensionBar.configure(this.currentFish, bonuses);
    this.tensionBar.show();

    // Setup visible fighting fish
    this.fishingRod.setupFightingFish(this.currentFish);

    this.promptText.setText('Hold SPACE to reel! Keep tension in the green zone!');
    this.promptText.setColor('#44DDFF');
    this.promptText.setFontSize(16);
    this.distanceText.setVisible(false);

    // Show reel hint
    this.showHintIfNew('first_reel', 'Keep the marker in the green center.\nToo high = line snaps! Too low = fish escapes!', 4000);
  }

  updateReeling(delta) {
    const spaceHeld = this.spaceKey.isDown;
    const reeling = spaceHeld || this.isReeling;

    const result = this.tensionBar.update(delta, reeling);

    // Update the fighting fish visual
    this.fishingRod.updateFightingFish(
      this.tensionBar.pullDirection,
      this.tensionBar.fishEnergy,
      this.tensionBar.reelProgress,
      delta
    );

    // Update bobber wobble based on fish pull
    if (this.fishingRod.bobberVisible) {
      const wobble = Math.sin(Date.now() * 0.008) * 4 * this.tensionBar.fishEnergy;
      const vertWobble = Math.cos(Date.now() * 0.006) * 2 * this.tensionBar.fishEnergy;
      this.fishingRod.hookX += (wobble * 0.3);
      this.fishingRod.hookY += (vertWobble * 0.1);
    }

    this.fishingRod.drawLine();

    if (result === 'caught') {
      this.onFishCaught();
    } else if (result === 'snapped') {
      this.onLineSnapped();
    }
  }

  onFishCaught() {
    this.tensionBar.hide();
    this.fishingRod.hideFightingFish();
    this.promptText.setFontSize(20);

    // Track fight duration
    const fightDuration = (Date.now() - this.fightStartTime) / 1000;
    if (fightDuration > (this.saveData.stats.longestFight || 0)) {
      this.saveData.stats.longestFight = Math.round(fightDuration * 10) / 10;
    }

    // Track biggest fish
    if (this.currentFish.weight > (this.saveData.stats.biggestFish || 0)) {
      this.saveData.stats.biggestFish = this.currentFish.weight;
    }

    // Track weather/time catches
    const weather = this.weatherSystem.current;
    const timePeriod = this.gameClock.getTimePeriod();
    if (weather.id === 'stormy') {
      this.saveData.stats.stormCatches = (this.saveData.stats.stormCatches || 0) + 1;
    }
    if (timePeriod.id === 'night') {
      this.saveData.stats.nightCatches = (this.saveData.stats.nightCatches || 0) + 1;
    }

    // Update stats
    this.saveData.stats.totalCatches = (this.saveData.stats.totalCatches || 0) + 1;

    // Update encyclopedia
    if (!this.saveData.encyclopedia[this.currentFish.species]) {
      this.saveData.encyclopedia[this.currentFish.species] = { seen: true, caught: true, count: 0, bestWeight: 0 };
    }
    const enc = this.saveData.encyclopedia[this.currentFish.species];
    enc.caught = true;
    enc.count++;
    if (this.currentFish.weight > enc.bestWeight) {
      enc.bestWeight = this.currentFish.weight;
    }

    // Add to logbook
    this.saveData.logbook.push({
      species: this.currentFish.species,
      weight: this.currentFish.weight,
      rarity: this.currentFish.rarity,
      weather: weather.name,
      time: this.gameClock.getTimeString(),
      day: this.gameClock.getDayString()
    });

    // Check for weight record
    const existingRecords = this.saveData.catchLog.filter(f => f.species === this.currentFish.species);
    const isNewRecord = existingRecords.length === 0 ||
      this.currentFish.weight > Math.max(...existingRecords.map(f => f.weight));

    // Add to catch log
    this.saveData.catchLog.push({ ...this.currentFish });

    audio.playCatch();

    // Check achievements — only show the top 1 as popup, pass rest to CatchScene
    const newAchievements = checkAchievements(this.saveData);
    const extraAchievements = [];
    newAchievements.forEach((ach, i) => {
      this.saveData.achievements.push(ach.id);
      if (i === 0) {
        // Show only the most important achievement as a popup
        this.achievementPopup.show(ach);
        audio.playAchievement();
      } else {
        extraAchievements.push(ach);
      }
    });

    // Auto-save
    saveGame(this.saveData);

    // Transition to catch scene
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('CatchScene', {
        fish: this.currentFish,
        saveData: this.saveData,
        isNewRecord,
        extraAchievements
      });
    });
  }

  onLineSnapped() {
    this.state = STATES.RESULT;
    this.tensionBar.hide();
    this.fishingRod.hideFightingFish();
    this.promptText.setFontSize(20);

    this.saveData.stats.totalLineSnaps = (this.saveData.stats.totalLineSnaps || 0) + 1;
    this.saveData.stats.totalFishLost = (this.saveData.stats.totalFishLost || 0) + 1;

    this.fishingRod.playLineSnap();
    audio.playSnap();

    this.ratingText.setText('Line snapped!');
    this.ratingText.setColor('#FF4444');
    this.ratingText.setVisible(true);
    this.ratingText.setAlpha(1);
    this.ratingText.setScale(1.3);

    this.tweens.add({
      targets: this.ratingText,
      scale: 1,
      alpha: 0,
      duration: 2000,
      ease: 'Quad.easeOut'
    });

    this.promptText.setText('The line snapped! Press SPACE to try again');
    this.promptText.setColor('#FF6644');
    this.currentFish = null;

    saveGame(this.saveData);
  }

  // === COMMON ===

  resetToIdle() {
    this.state = STATES.IDLE;

    if (this.biteTimer) { this.biteTimer.destroy(); this.biteTimer = null; }
    if (this.hookWindow) { this.hookWindow.destroy(); this.hookWindow = null; }
    this.stopBobberIdleBob();

    this.fishingRod.reset();
    this.castingBar.reset();
    this.tensionBar.hide();
    this.currentFish = null;
    this.isReeling = false;

    this.ratingText.setVisible(false);
    this.distanceText.setVisible(false);
    this.promptText.setText('Press SPACE to cast');
    this.promptText.setColor('#ffffff');
    this.promptText.setFontSize(20);
    this.promptText.setScale(1);

    this.updateHUD();
  }

  update(time, delta) {
    // Update game clock
    this.gameClock.update(delta / 1000);

    // Update weather
    const prevWeather = this.weatherSystem.current;
    this.weatherSystem.update(delta);
    if (this.weatherSystem.current !== prevWeather) {
      this.weatherEffects.setWeather(this.weatherSystem.current);
    }

    // Update time-of-day tint
    const timePeriod = this.gameClock.getTimePeriod();
    this.weatherEffects.setTimeTint(timePeriod.skyColor, timePeriod.skyAlpha);

    // Update weather effects
    this.weatherEffects.update(delta);

    // Update time/weather HUD
    this.timeText.setText(this.gameClock.getTimeString());
    this.dayText.setText(this.gameClock.getDayString());
    this.weatherText.setText(`${this.weatherSystem.current.name} | Next: ${this.weatherSystem.getForecastStrings()[0]}`);

    // State-specific updates
    if (this.state === STATES.CASTING) {
      this.castingBar.update(delta);
    }

    if (this.state === STATES.REELING) {
      this.updateReeling(delta);
    }

    if (this.state === STATES.WAITING || this.state === STATES.BITE || this.state === STATES.RESULT) {
      if (this.fishingRod.bobberVisible) {
        this.fishingRod.drawLine();
      }
    }
  }
}
