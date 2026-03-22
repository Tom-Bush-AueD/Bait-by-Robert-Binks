import Phaser from 'phaser';
import { GAME } from './constants.js';
import BootScene from './scenes/BootScene.js';
import TutorialScene from './scenes/TutorialScene.js';
import FishingScene from './scenes/FishingScene.js';
import CatchScene from './scenes/CatchScene.js';
import ShopScene from './scenes/ShopScene.js';
import LogbookScene from './scenes/LogbookScene.js';

export default {
  type: Phaser.AUTO,
  width: GAME.WIDTH,
  height: GAME.HEIGHT,
  parent: 'game-container',
  backgroundColor: '#1a1a2e',
  antialias: true,
  roundPixels: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [BootScene, TutorialScene, FishingScene, CatchScene, ShopScene, LogbookScene]
};
