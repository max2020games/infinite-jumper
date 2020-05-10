import Phaser from '../lib/phaser.js'

export default class GameOver extends Phaser.Scene
{
    constructor()
    {
        // give the scene a unique key
        super('game-over')
    }

    create()
    {
        // add a simple “Game Over” message
        const width = this.scale.width
        const height = this.scale.height

        this.add.text(width * 0.5, height * 0.5, 'Game Over', {
            fontSize: 48
        })
        .setOrigin(0.5)

        // restart the game when space key is pressed
        this.input.keyboard.once('keydown_SPACE', () => {
            this.scene.start('game')
        })
    }
}