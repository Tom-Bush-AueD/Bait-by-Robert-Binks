import Phaser from 'phaser';
import { GAME } from './constants.js';
import BootScene from './scenes/BootScene.js';
import FishingScene from './scenes/FishingScene.js';

export default {
  type: Phaser.AUTO,
  width: GAME.WIDTH,
  height: GAME.HEIGHT,
  parent: 'game-container',
  backgroundColor: '#1a1a2e',
  scene: [BootScene, FishingScene]
};
