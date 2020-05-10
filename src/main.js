import Phaser from './lib/phaser.js'

// import game scenes
import Game from './scenes/Game.js'
import GameOver from './scenes/GameOver.js'

// create a Phaser game
export default new Phaser.Game({
    // type of rendering
    type: Phaser.AUTO,

    // game size
    width: 480,
    height: 640,

    // game scenes
    scene: [Game, GameOver], 

    // enable Arcade Physics
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 200 },
            // see collision boxes
            debug: false
        }
    }
})