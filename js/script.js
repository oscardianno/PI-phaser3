
//--------------------------------------- ESCENA CREDITOS-----------------------------------------------------------------------

class Credits extends Phaser.Scene {


  constructor() {
    super({ key: 'creditos' });
  }

  preload() {
    this.load.image("creditos", "assets/Credits.png");
    this.load.image('nosotros', 'assets/nosotros.png');
    this.load.spritesheet('back', 'assets/back.png', { frameWidth: 3500, frameHeight: 1500 });
  }

  create() {
    //  A simple background for our game
    this.add.image(400, 300, "creditos").setScale(1.2);
    this.add.image(400, 250, "nosotros").setScale(1);
    this.backButton = this.add.sprite(650, 520, 'back').setScale(.4).setInteractive();

    this.backButton.on('pointerdown', () => {
  
      this.scene.start('inicio')
    });
  
  }
}

//-------------------------------------------------------TERMINA CREDITOS-----------------------------------------------

//---------------------------------------ESCENA INICIO-----------------------------------------------------------------------

class Inicio extends Phaser.Scene {


  constructor() {
    super({ key: 'inicio' });
  }

  preload() {
    this.load.image("start", "assets/background.png");
    this.load.image('titulo', 'assets/manuel.png');
    this.load.spritesheet('button', 'assets/start-button.png', { frameWidth: 813, frameHeight: 390 });
    this.load.spritesheet('credit', 'assets/credit.png', { frameWidth: 3500, frameHeight: 1500 });
  }

  create() {
    this.add.image(400, 300, 'start').setScale(.28);
    this.add.image(400, 150, 'titulo').setScale(.6);
    this.startButton = this.add.sprite(400, 270, 'button').setScale(.3).setInteractive();
    this.creditButton = this.add.sprite(400, 370, 'credit').setScale(.06).setInteractive();
    this.startButton.on('pointerdown', () => {
      this.scene.start('game')
    });
  
    this.creditButton.on('pointerdown', () => {
      this.scene.start('creditos')
    });
  
  }
}

//-------------------------------------------------------TERMINA INICIO-----------------------------------------------

//-------------------------------------------------------ESCENA GAME ------------------------------------------------------
class Game extends Phaser.Scene {

  map;
  groundLayer;
  player;
  player2;
  stars;
  bombs;
  cursors;
  audio;
  audioIsPlaying;

  keyA;
  keyS;
  keyD;
  keyW;
  scoreText;
  score = 0;
  gameOver = false;

  constructor() {
      super({ key: 'game' });
  }
  
  preload() {
      this.load.audio("music", "assets/music.mp3");
      this.load.image("sky", "assets/sky.png");
      this.load.image("star", "assets/star.png");
      this.load.image("bomb", "assets/bomb.png");
      this.load.spritesheet("dude", "assets/dude.png", {
          frameWidth: 32,
          frameHeight: 48,
      });
      this.load.spritesheet("tiles", "assets/tiles.png", {
        frameWidth: 70,
        frameHeight: 70,
      });
      // Load the map made with Tiled in JSON format
      this.load.tilemapTiledJSON("map", "assets/levels/map.json");
  }

  create() {

      //  A simple background for our game: scrollFactor(0) makes it static.
      this.add.image(400, 300, "sky").setScrollFactor(0);
       // Add the map/level
      this.map = this.make.tilemap({ key: "map" });
      // Load the tiles for the ground layer
      this.groundTiles = this.map.addTilesetImage("tiles");
      // Create the ground layer
      this.groundLayer = this.map.createDynamicLayer("World", this.groundTiles, 0, 0);
      // Make the player collide with this layer
      this.groundLayer.setCollisionByExclusion([-1]);

      // Set the boundaries of the game world
      this.physics.world.bounds.width = this.groundLayer.width;
      this.physics.world.bounds.height = this.groundLayer.height;




      // ===--- F I R S T   P L A Y E R ---===
      // The player and its settings
      this.player = this.physics.add.sprite(100, 450, "dude");

      //  Player physics properties. Give the little guy a slight bounce.
      this.player.setBounce(0.2);
      this.player.setCollideWorldBounds(true);

      //  Our player animations, turning, walking left and walking right.
      this.anims.create({
          key: "left",
          frames: this.anims.generateFrameNumbers("dude", { start: 0, end: 3 }),
          frameRate: 10,
          repeat: -1,
      });

      this.anims.create({
          key: "turn",
          frames: [{ key: "dude", frame: 4 }],
          frameRate: 20,
      });

      this.anims.create({
          key: "right",
          frames: this.anims.generateFrameNumbers("dude", { start: 5, end: 8 }),
          frameRate: 10,
          repeat: -1,
      });

      //  Input Events
      this.cursors = this.input.keyboard.createCursorKeys();

      // ===--- S E C O N D   P L A Y E R ---===
      // The player and its settings
      this.player2 = this.physics.add.sprite(120, 450, "dude");

      //  Player physics properties. Give the little guy a slight bounce.
      this.player2.setBounce(0.2);
      this.player2.setCollideWorldBounds(true);

      //  Input Events
      this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
      this.keyS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
      this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
      this.keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
      this.keyP = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);

      // Camera: Set bounds so it won't go outside the game world
      this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
      // Make the camera follow the first player
      this.cameras.main.startFollow(this.player);


      //  Some stars to collect, 12 in total, evenly spaced 70 pixels apart along the x axis
      this.stars = this.physics.add.group({
          key: "star",
          repeat: 11,
          setXY: { x: 12, y: 0, stepX: 70 },
      });

      this.stars.children.iterate(function (child) {
          //  Give each star a slightly different bounce
          child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
      });

      this.bombs = this.physics.add.group();

      //  The score
      this.scoreText = this.add.text(16, 16, "score: 0", {
          fontSize: "32px",
          fill: "#000",
        })
        .setScrollFactor(0);


      //  Collide the players and the stars with the map
      this.physics.add.collider(this.player, this.groundLayer);
      this.physics.add.collider(this.player2, this.groundLayer);
      this.physics.add.collider(this.stars, this.groundLayer);
      this.physics.add.collider(this.bombs, this.groundLayer);


      //  Checks to see if the players overlaps with any of the stars, if he does call the collectStar function
      this.physics.add.overlap(this.player, this.stars, this.collectStar, null, this);
      this.physics.add.overlap(this.player2, this.stars, this.collectStar, null, this);

      this.physics.add.collider(this.player, this.bombs, this.hitBomb, null, this);
      this.physics.add.collider(this.player2, this.bombs, this.hitBomb, null, this);

      this.audio = this.sound.add("music", { loop: true });
      this.audio.play();
      this.audioIsPlaying = true;
  }

  update() {

      if (this.gameOver) {
          return;
      }

      if (Phaser.Input.Keyboard.JustDown(this.keyP)) {
        if (this.audioIsPlaying) {
          this.audio.stop();
          this.audioIsPlaying = false;
        } else {
          this.audio.play();
          this.audioIsPlaying = true;
        }
      }
    

      // Player 1 inputs
      if (this.cursors.left.isDown) {
          this.player.setVelocityX(-160);

          this.player.anims.play("left", true);
      } else if (this.cursors.right.isDown) {
          this.player.setVelocityX(160);

          this.player.anims.play("right", true);
      } else {
          this.player.setVelocityX(0);

          this.player.anims.play("turn");
      }

      if (this.cursors.up.isDown && this.player.body.onFloor()) {
        this.player.setVelocityY(-360);
      }

      // Player 2 inputs
      if (this.keyA.isDown) {
          this.player2.setVelocityX(-160);

          this.player2.anims.play("left", true);
      } else if (this.keyD.isDown) {
          this.player2.setVelocityX(160);

          this.player2.anims.play("right", true);
      } else {
          this.player2.setVelocityX(0);

          this.player2.anims.play("turn");
      }

      if (this.keyW.isDown && this.player2.body.onFloor()) {
        this.player2.setVelocityY(-360);
      }
  }

  collectStar(player, star) {
      star.disableBody(true, true);

      //  Add and update the score
      this.score += 10;
      this.scoreText.setText("Score: " + this.score);

      if (this.stars.countActive(true) === 0) {
          //  A new batch of stars to collect
          this.stars.children.iterate(function (child) {
              child.enableBody(true, child.x, 0, true, true);
          });

          var x =
          player.x < 400
                  ? Phaser.Math.Between(400, 800)
                  : Phaser.Math.Between(0, 400);

          var bomb = this.bombs.create(x, 16, "bomb");
          bomb.setBounce(1);
          bomb.setCollideWorldBounds(true);
          bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);
          bomb.allowGravity = false;
      }
  }

  hitBomb(player, bomb) {
      this.physics.pause();

      player.setTint(0xff0000);

      player.anims.play("turn");

      this.gameOver = true;
  }
}

//--------------------------------------------------------TERMINA GAME--------------------------------------------------

var config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 300 },
      debug: false,
    },
  },
  scene: [Inicio, Game, Credits],
};




var game = new Phaser.Game(config);

