import Phaser from '../lib/phaser.js'
import Carrot from '../game/Carrot.js'

export default class Game extends Phaser.Scene
{
    // define class properties

    /** @type {Phaser.Physics.Arcade.StaticGroup} */
    platforms

    /** @type {Phaser.Physics.Arcade.Group} */
    carrots

    /** @type {Phaser.Physics.Arcade.Sprite} */
    player

    /** @type {Phaser.Types.Input.Keyboard.CursorKeys} */
    cursors 

    /** @type {Phaser.GameObjects.Text} */
    carrotsCollectedText

    carrotsCollected = 0

    // define a unique key
    constructor()
    {
        super('game')
    }

    // set class properties
    init()
    {
        this.carrotsCollected = 0
    }

    // specify images, audio, or other assets to load 
    // before starting the Scene
    preload()
    {
        // load the background image
        this.load.image('background', 'assets/bg_layer1.png')

        // load the platform image
        this.load.image('platform', 'assets/ground_grass.png')

        // load the player
        this.load.image('bunny-stand', 'assets/bunny1_stand.png')
        this.load.image('bunny-jump', 'assets/bunny1_jump.png')

        // load carrots
        this.load.image('carrot', 'assets/carrot.png')

        // load audio files
        this.load.audio('jump', 'assets/sfx/phaseJump1.ogg')

        // allow input arrow keys
        this.cursors = this.input.keyboard.createCursorKeys()
    }

    // is called once all the assets for the Scene have been 
    // loaded. Trying to use an asset that has not been loaded 
    // will result in an error
    create()
    {
        this.createBackground()
        this.createPlatforms()
        this.createPlayer()
        this.createCarrots()
        this.createScore()
        this.setCameras()
    }

    createBackground()
    {
        // add a Background in the middle and keep it 
        // from Scrolling with the camera
        this.add.image(240, 320, 'background')
            .setScrollFactor(1, 0)
    }

    createPlatforms()
    {
        // create a StaticGroup for physics-enabled platforms
        this.platforms = this.physics.add.staticGroup()

        // create 5 platforms from the goup
        for (let i = 0; i < 5; ++i)
        {
            // random x position between 80 and 400
            const x = Phaser.Math.Between(80, 400)

            // y position that is 150 pixels apart.
            const y = 150 * i

            // create platform
            /** @type {Phaser.Physics.Arcade.Sprite} */
            const platform = this.platforms.create(x, y, 'platform')
            platform.scale = 0.5

            // refresh the physics body based on
            // any changes we made to the GameObject 
            // like position and scale
            /**@type {Phaser.Physics.Arcade.StaticBody} */
            const body = platform.body
            body.updateFromGameObject()
        }
    }

    createPlayer()
    {
        // create a bunny sprite
        this.player = this.physics.add.sprite(240, 320, 'bunny-stand')
            .setScale(0.5)

        // create a collider
        this.physics.add.collider(this.platforms, this.player)

        // only want collisions to happen for landing on platforms
        this.player.body.checkCollision.up = false
        this.player.body.checkCollision.right = false
        this.player.body.checkCollision.left = false
    }

    createCarrots()
    {
        this.carrots = this.physics.add.group({
            classType: Carrot
        })

        this.physics.add.collider(this.platforms, this.carrots)
        
        // use an overlap instead of a collider to collect carrots
        this.physics.add.overlap(
            this.player,
            this.carrots,
            this.handleCollectCarrot, // called on overlap
            undefined,
            this
        )
    }

    createScore()
    {
        // sets the color to black and size to 24 pixels
        const style = { color: '#000', fontSize: 24 }

        // place a text object it in the middle at 240 on the 
        // x-axis and 10 on the y-axis
        this.carrotsCollectedText = this.add.text(240, 10, 'Carrots: 0', style)
            .setScrollFactor(0) // disable scrolling
            .setOrigin(0.5, 0) // keep the text top-centered
    }

    /**
     * @param {Phaser.GameObjects.Sprite} sprite
     */
    addCarrotAbove(sprite)
    {
        // put a Carrot above the given sprite
        const y = sprite.y - sprite.displayHeight

        /** @type {Phaser.Physics.Arcade.Sprite} */
        const carrot = this.carrots.get(sprite.x, y, 'carrot')

        // set active and visible
        carrot.setActive(true)
        carrot.setVisible(true)

        this.add.existing(carrot)

        // update the physics body size
        carrot.body.setSize(carrot.width, carrot.height)

        // make sure body is enabled in the physiscs world
        this.physics.world.enable(carrot)

        return carrot
    }

    /**
     * @param {Phaser.Physics.Arcade.Sprite} player
     * @param {Carrot} carrot
     */
    handleCollectCarrot(player, carrot)
    {
        // hide from display
        this.carrots.killAndHide(carrot)

        // disable from physical world
        this.physics.world.disableBody(carrot.body)

        this.carrotsCollected++

        // update score
        const value = `Carrots: ${this.carrotsCollected}`
        this.carrotsCollectedText.text = value
    }

    setCameras()
    {
        // follow the bunny as it jumps up
        this.cameras.main.startFollow(this.player)

        // stop the camera from scrolling horizontally with 
        // a wide dead zone
        this.cameras.main.setDeadzone(this.scale.width * 1.5)
    }

    update(t,dt)
    {
        this.scrollPlatforms()
        
        // jump if landed on a platform
        const touchingDown = this.player.body.touching.down

        if (touchingDown)
        {
            this.player.setVelocityY(-300)

            // switch to using this jump texture
            this.player.setTexture('bunny-jump')

            // play jump sound
            this.sound.play('jump')
        } 
        
        // switch back to stand when is not falling
        const vy = this.player.body.velocity.y
        if (vy > 0 && this.player.texture.key !== 'bunny-stand')
        {
            this.player.setTexture('bunny-stand')
        }

        this.checkInput(touchingDown)

        this.horizontalWrap(this.player)

        this.checkGameOverCondition()
    }

    scrollPlatforms()
    {
        // Infinite scrolling platforms. Takes platforms from 
        // the bottom of the screen and moves them to the top
        this.platforms.children.iterate(child => {
            /** @type {Phaser.Physics.Arcade.Sprite} */
            const platform = child

            const scrollY = this.cameras.main.scrollY
            if (platform.y >= scrollY + this.scale.height)
            {
                platform.y = scrollY - Phaser.Math.Between(50, 100)
                platform.body.updateFromGameObject()

                // create a carrot above the platform being reused
                this.addCarrotAbove(platform)
            }
        })
    }

    findBottomMostPlatform()
    {
        const platforms = this.platforms.getChildren()
        let bottomPlatform = platforms[0]

        for (let i = 1; i < platforms.length; ++i)
        {
            const platform = platforms[i]

            // discard any platforms that are above current
            if (platform.y < bottomPlatform.y)
            {
                continue
            }

            bottomPlatform = platform
        }

        return bottomPlatform

    }

    checkInput(touching)
    {
        // check when the arrow keys are pressed and 
        // change the player’s velocity
        if (this.cursors.left.isDown && !touching)
        {
            this.player.setVelocityX(-200)
        }
        else if (this.cursors.right.isDown && !touching)
        {
            this.player.setVelocityX(200)
        }
        else
        {
            // stop movement if not left or right
            this.player.setVelocityX(0)
        }
    }

    // have the player wrap around the screen when they
    // go past the left and right sides
    /**
     * @param {Phaser.GameObjects.Sprite} sprite
     */
    horizontalWrap(sprite)
    {
        const halfwidth = sprite.displayWidth * 0.5
        const gameWidth = this.scale.width

        if (sprite.x < -halfwidth)
        {
            sprite.x = gameWidth + halfwidth
        }
        else if (sprite.x > gameWidth + halfwidth)
        {
            sprite.x = -halfwidth
        }
    }

    checkGameOverCondition()
    {
        const bottomPlatform = this.findBottomMostPlatform()
        if (this.player.y > bottomPlatform.y + 200)
        {
            this.scene.start('game-over')
        }
    }
}