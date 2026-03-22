import Phaser from 'phaser';
import { GAME } from '../constants.js';
import { drawBackground } from '../objects/Background.js';
import CastingBar from '../objects/CastingBar.js';
import FishingRod from '../objects/FishingRod.js';
import TensionBar from '../objects/TensionBar.js';
import { selectFish, generateFishInstance } from '../data/fish.js';

const STATES = {
  IDLE: 'idle',
  CASTING: 'casting',
  ANIMATING: 'animating',
  WAITING: 'waiting',     // Phase 2: waiting for bite
  BITE: 'bite',           // Phase 2: fish is biting, quick-time
  REELING: 'reeling',     // Phase 3: fight/reel mini-game
  RESULT: 'result'        // catch result or escape
};

export default class FishingScene extends Phaser.Scene {
  constructor() {
    super('FishingScene');
    this.state = STATES.IDLE;
    this.catchLog = [];
  }

  init(data) {
    if (data && data.catchLog) {
      this.catchLog = data.catchLog;
    }
  }

  create() {
    this.cameras.main.fadeIn(500);

    // Draw the environment
    drawBackground(this);

    // Create game objects
    this.castingBar = new CastingBar(this);
    this.fishingRod = new FishingRod(this);
    this.tensionBar = new TensionBar(this);

    // Phase 2: bite state tracking
    this.currentFish = null;
    this.biteTimer = null;
    this.hookWindow = null;
    this.bobberDipTween = null;
    this.isReeling = false;

    // HUD text elements
    this.promptText = this.add.text(GAME.WIDTH / 2, 30, 'Press SPACE to cast', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '18px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(20);

    this.ratingText = this.add.text(GAME.WIDTH / 2, GAME.HEIGHT / 2 - 60, '', {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontSize: '36px',
      fontStyle: 'bold',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5).setDepth(20).setVisible(false);

    this.distanceText = this.add.text(GAME.WIDTH / 2, GAME.HEIGHT / 2 - 20, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '16px',
      color: '#C2B280',
      stroke: '#000000',
      strokeThickness: 2
    }).setOrigin(0.5).setDepth(20).setVisible(false);

    // Catch counter HUD
    this.catchCountText = this.add.text(10, 10, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '13px',
      color: '#7777AA',
      stroke: '#000000',
      strokeThickness: 2
    }).setDepth(20);
    this.updateCatchCounter();

    // Blink prompt
    this.promptTween = this.tweens.add({
      targets: this.promptText,
      alpha: 0.4,
      duration: 800,
      yoyo: true,
      repeat: -1
    });

    // Input handling
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.input.keyboard.on('keydown-SPACE', () => this.handleInput());
    this.input.on('pointerdown', () => {
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

  updateCatchCounter() {
    const total = this.catchLog.length;
    const unique = new Set(this.catchLog.map(f => f.species)).size;
    this.catchCountText.setText(total > 0 ? `Catches: ${total} | Species: ${unique}/7` : '');
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
    this.showRating(result);

    this.time.delayedCall(300, () => {
      this.castingBar.hide();
    });

    this.promptText.setText('');

    this.fishingRod.playCastAnimation(result.accuracy, (distance) => {
      this.onCastComplete(distance, result);
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

    // Select a fish based on distance
    const species = selectFish(distance);
    if (!species) {
      this.showNoFish();
      return;
    }

    // Roll for bite
    const biteRoll = Math.random();
    if (biteRoll > species.biteChance) {
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

    // Random bite delay
    const [minDelay, maxDelay] = species.biteDelay;
    const delay = minDelay + Math.random() * (maxDelay - minDelay);

    // Bobber idle bob animation
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

    // No fish bites — after a while, show "no luck"
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

    // Bobber dip animation — sharp pull down
    const baseY = this.fishingRod.hookY;
    this.bobberDipTween = this.tweens.add({
      targets: this.fishingRod,
      hookY: baseY + 12,
      duration: 150,
      yoyo: true,
      repeat: 3,
      ease: 'Quad.easeInOut'
    });

    // Prompt — urgent!
    this.promptText.setText('BITE! Press SPACE now!');
    this.promptText.setColor('#FF4444');
    this.promptText.setScale(1.2);

    // Player has a limited window to hook
    const hookWindowMs = 1500;
    this.hookWindow = this.time.delayedCall(hookWindowMs, () => {
      this.missedBite();
    });
  }

  hookFish() {
    // Successfully hooked!
    if (this.hookWindow) this.hookWindow.destroy();
    if (this.bobberDipTween) this.bobberDipTween.destroy();

    this.promptText.setScale(1);

    // Show what we hooked
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

    // Transition to reeling after a brief moment
    this.time.delayedCall(1200, () => {
      this.ratingText.setVisible(false);
      this.startReeling();
    });
  }

  missedBite() {
    // Too slow
    this.state = STATES.RESULT;
    if (this.bobberDipTween) this.bobberDipTween.destroy();
    this.promptText.setScale(1);
    this.promptText.setText('Too slow! The fish got away. Press SPACE');
    this.promptText.setColor('#FF6644');
    this.currentFish = null;
  }

  // === PHASE 3: REELING ===

  startReeling() {
    this.state = STATES.REELING;
    this.isReeling = false;

    // Configure tension bar for this fish
    this.tensionBar.configure(this.currentFish);
    this.tensionBar.show();

    this.promptText.setText('Hold SPACE to reel! Keep tension in the green zone!');
    this.promptText.setColor('#44DDFF');
    this.promptText.setFontSize(15);
    this.distanceText.setVisible(false);
  }

  updateReeling(delta) {
    // Check if SPACE is held (or pointer down)
    const spaceHeld = this.spaceKey.isDown;
    const reeling = spaceHeld || this.isReeling;

    const result = this.tensionBar.update(delta, reeling);

    // Update bobber position to show fight
    if (this.fishingRod.bobberVisible) {
      const wobble = Math.sin(Date.now() * 0.008) * 3 * this.tensionBar.fishEnergy;
      this.fishingRod.hookX = this.fishingRod.hookX + (wobble - this.fishingRod.hookX) * 0.01;
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
    this.promptText.setFontSize(18);

    // Check for new weight record
    const existingRecords = this.catchLog.filter(f => f.species === this.currentFish.species);
    const isNewRecord = existingRecords.length === 0 ||
      this.currentFish.weight > Math.max(...existingRecords.map(f => f.weight));

    // Add to catch log
    this.catchLog.push({ ...this.currentFish });

    // Transition to catch scene
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('CatchScene', {
        fish: this.currentFish,
        catchLog: this.catchLog,
        isNewRecord
      });
    });
  }

  onLineSnapped() {
    this.state = STATES.RESULT;
    this.tensionBar.hide();
    this.promptText.setFontSize(18);

    // Line snap effect
    this.fishingRod.playLineSnap();

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
    this.promptText.setFontSize(18);
    this.promptText.setScale(1);

    this.updateCatchCounter();
  }

  update(time, delta) {
    if (this.state === STATES.CASTING) {
      this.castingBar.update(delta);
    }

    if (this.state === STATES.REELING) {
      this.updateReeling(delta);
    }

    // Continuously redraw the line when bobber is visible
    if (this.state === STATES.WAITING || this.state === STATES.BITE || this.state === STATES.RESULT) {
      if (this.fishingRod.bobberVisible) {
        this.fishingRod.drawLine();
      }
    }
  }
}
