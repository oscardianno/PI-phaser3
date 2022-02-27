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
  scene: {
    preload: preload,
    create: create,
    update: update,
  },
};

var map;
var groundLayer;
var player;
var player2;
var stars;
var bombs;
var score = 0;
var gameOver = false;
var scoreText;
var audio;
var audioIsPlaying;

var cursors;

var keyA;
var keyS;
var keyD;
var keyW;

var keyP;

var game = new Phaser.Game(config);

function preload() {
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

function create() {
  //  A simple background for our game
  this.add.image(400, 300, "sky");

  // Add the map/level
  map = this.make.tilemap({ key: "map" });
  // Load the tiles for the ground layer
  var groundTiles = map.addTilesetImage("tiles");
  // Create the ground layer
  groundLayer = map.createDynamicLayer("World", groundTiles, 0, 0);
  // Make the player collide with this layer
  groundLayer.setCollisionByExclusion([-1]);

  // Set the boundaries of the game world
  this.physics.world.bounds.width = groundLayer.width;
  this.physics.world.bounds.height = groundLayer.height;

  // ===--- F I R S T   P L A Y E R ---===
  // The player and its settings
  player = this.physics.add.sprite(100, 450, "dude");

  //  Player physics properties. Give the little guy a slight bounce.
  player.setBounce(0.2);
  player.setCollideWorldBounds(true);

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
  cursors = this.input.keyboard.createCursorKeys();

  // ===--- S E C O N D   P L A Y E R ---===
  // The player and its settings
  player2 = this.physics.add.sprite(120, 450, "dude");

  //  Player physics properties. Give the little guy a slight bounce.
  player2.setBounce(0.2);
  player2.setCollideWorldBounds(true);

  //  Input Events
  keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
  keyS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
  keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
  keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);

  keyP = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.P);

  //  Some stars to collect, 12 in total, evenly spaced 70 pixels apart along the x axis
  stars = this.physics.add.group({
    key: "star",
    repeat: 11,
    setXY: { x: 12, y: 0, stepX: 70 },
  });

  stars.children.iterate(function (child) {
    //  Give each star a slightly different bounce
    child.setBounceY(Phaser.Math.FloatBetween(0.4, 0.8));
  });

  bombs = this.physics.add.group();

  //  The score
  scoreText = this.add.text(16, 16, "score: 0", {
    fontSize: "32px",
    fill: "#000",
  });

  //  Collide the players and the stars with the map
  this.physics.add.collider(player, groundLayer);
  this.physics.add.collider(player2, groundLayer);
  this.physics.add.collider(stars, groundLayer);
  this.physics.add.collider(bombs, groundLayer);

  //  Checks to see if the players overlaps with any of the stars, if he does call the collectStar function
  this.physics.add.overlap(player, stars, collectStar, null, this);
  this.physics.add.overlap(player2, stars, collectStar, null, this);

  this.physics.add.collider(player, bombs, hitBomb, null, this);
  this.physics.add.collider(player2, bombs, hitBomb, null, this);

  audio = this.sound.add("music", { loop: true });
  audio.play();
  audioIsPlaying = true;
}

function update() {
  if (gameOver) {
    return;
  }

  if (Phaser.Input.Keyboard.JustDown(keyP)) {
    if (audioIsPlaying) {
      audio.stop();
      audioIsPlaying = false;
    } else {
      audio.play();
      audioIsPlaying = true;
    }
  }

  // Player 1 inputs
  if (cursors.left.isDown) {
    player.setVelocityX(-160);

    player.anims.play("left", true);
  } else if (cursors.right.isDown) {
    player.setVelocityX(160);

    player.anims.play("right", true);
  } else {
    player.setVelocityX(0);

    player.anims.play("turn");
  }

  if (cursors.up.isDown && player.body.onFloor()) {
    player.setVelocityY(-360);
  }

  // Player 2 inputs
  if (keyA.isDown) {
    player2.setVelocityX(-160);

    player2.anims.play("left", true);
  } else if (keyD.isDown) {
    player2.setVelocityX(160);

    player2.anims.play("right", true);
  } else {
    player2.setVelocityX(0);

    player2.anims.play("turn");
  }

  if (keyW.isDown && player2.body.onFloor()) {
    player2.setVelocityY(-360);
  }
}

function collectStar(player, star) {
  star.disableBody(true, true);

  //  Add and update the score
  score += 10;
  scoreText.setText("Score: " + score);

  if (stars.countActive(true) === 0) {
    //  A new batch of stars to collect
    stars.children.iterate(function (child) {
      child.enableBody(true, child.x, 0, true, true);
    });

    var x =
      player.x < 400
        ? Phaser.Math.Between(400, 800)
        : Phaser.Math.Between(0, 400);

    var bomb = bombs.create(x, 16, "bomb");
    bomb.setBounce(1);
    bomb.setCollideWorldBounds(true);
    bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);
    bomb.allowGravity = false;
  }
}

function hitBomb(player, bomb) {
  this.physics.pause();

  player.setTint(0xff0000);

  player.anims.play("turn");

  gameOver = true;
}
