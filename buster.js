
window.addEventListener("load", canvasApp, false);

function canvasApp ()
{
    var i;
    var backgroundCanvas = document.getElementById("background");
    var backContext = backgroundCanvas.getContext("2d");
    var foregroundCanvas = document.getElementById("foreground");
    var foreContext = foregroundCanvas.getContext("2d");
//    context.font = "40px _sans";

    var jgl;
    var explSprite;
    var spriteList;

    var bullet = [], NUM_BULLETS = 20;
    for (i = 0; i < NUM_BULLETS; i++) {
        bullet.push({
            image: new Image(),
            audio: new Audio('audio/laser.mp3'),
            active: false
        });
        bullet[i].image.src = "images/bullet.png";
    }

    var crash = new Audio('audio/jetcrash.mp3');

    var bomb = { falling: false };
    var bombImage = new Image();
    bombImage.src = "images/bomb.png";

    var blastImage = new Image();
    blastImage.src = "images/blast.png";

    var mtnCanvas = document.createElement('canvas');
    mtnCanvas.width  = 1920;
    mtnCanvas.height = 435;
    var mtnContext = mtnCanvas.getContext('2d');
    mtnContext.fillStyle = 'argb(221, 242, 254, 255)';
    mtnContext.fillRect(0,0,1920,480);
    var mtn = new Image();
    mtn.onload = function() {
        mtnContext.drawImage(mtn, 0, 0);
    };
    mtn.src = "images/mountains.png";

    var mtnPos = 1920 - 640;

    var jet = new Image();
    jet.src = "images/plane.png";
    jetX = 480;
    jetY = 220;
    jetAccelX = 0;
    jetAccelY = 0;

    var KEYSTATE = [];
    var KEY = {LEFT: 37, RIGHT: 39, UP: 38, DOWN: 40, ENTER: 13, SPACE: 32, X: 88, Z: 90 };

    var missile = new Array();

    document.addEventListener("keydown", processKeyDown);
    document.addEventListener("keyup", processKeyUp);

    function processKeyDown(ev) {
        //console.log("Key: "+ev.keyCode);
        KEYSTATE[ev.keyCode] = true;

        switch (ev.keyCode)
        {
            case KEY.SPACE:
                //launchMissile();
                break;

            case KEY.Z:
                dropBomb();
                break;
        }
    }

    function processKeyUp(ev) {
        console.log("Key: "+ev.keyCode);
        KEYSTATE[ev.keyCode] = false;
    }

    function dropBomb() {
        if (!bomb.falling) {
            bomb = {
                falling: true,
                x: jetX + 40,
                y: jetY + 17,
                accelX: .25,
                accelY: 2
            };
            if (jetAccelY > 2) {
                bomb.accelY = jetAccelY + 1;
            }
        }
    }

    function updateBomb() {
        if (bomb.falling) {
            bomb.y += bomb.accelY; bomb.accelY += .02;
            bomb.x += bomb.accelX; bomb.accelX += .01;
            foreContext.drawImage(bombImage, parseInt(bomb.x), bomb.y);

            checkBombCollision();

            if (bomb.y > 420) {
                bomb.falling = false;
            }
        }
    }

    function checkBombCollision() {
        var offset;

        if (bomb.falling) {
            var data = mtnContext.getImageData(parseInt(mtnPos + bomb.x + 2) , parseInt(bomb.y + 6), 7, 1);
            for (offset = 0; offset < 28; offset+= 4) {
                if (data.data[offset] < 221) {
                    console.log("BOMB HIT! - "+data.data[offset]);
                    explodeBomb(parseInt(bomb.x), parseInt(bomb.y));
                    return true;
                }
            }
        }

        return false;
    }

    function explodeBomb(x, y) {
        bomb.falling = false;

        crash.play();
        explSprite.setRotation(jgl.random(360));
        explSprite.setAnimActions(true);
        explSprite.setPosition(x, y);
        explSprite.setCurrentFrame(0);
//        explSprite.setAnimFrameCallback(10, function() { dynamiteAftermath(row, col); });
        explSprite.show();

        x = x + mtnPos - 10;
        y = y + 2;

        mtnContext.drawImage(blastImage, x, y);
        if (x < 640) {
            mtnContext.drawImage(blastImage, x + 1280, y);
        } else
        if (x >= 1280) {
            mtnContext.drawImage(blastImage, x - 1280, y);
        }

        var rotation = Math.random() * 360;
        var radians = rotation*Math.PI/180;

        mtnContext.save();
        mtnContext.translate(x + 10, y + 10);
        mtnContext.rotate(radians);
        mtnContext.drawImage(blastImage, -10, -8);
        mtnContext.restore();

        if (x < 640) {
            mtnContext.save();
            mtnContext.translate(x + 10 + 1280, y + 10);
            mtnContext.rotate(radians);
            mtnContext.drawImage(blastImage, -10, -8);
            mtnContext.restore();
        } else
        if (x >= 1280) {
            mtnContext.save();
            mtnContext.translate(x + 10 - 1280, y + 10);
            mtnContext.rotate(radians);
            mtnContext.drawImage(blastImage, -10, -8);
            mtnContext.restore();
        }
    }

    function launchMissile() {
        var i;
        for (i = 0; i < NUM_BULLETS; i++) {
            var b = bullet[i];
            if (!b.active) {
                b.active = true;
                b.audio.play();
                b.x = parseInt(jetX + 14);
                b.y = parseInt(jetY + 16);
                break;
            }
        }
    }

    var missileThrottle = 4;

    function updateMissiles() {


        if (KEYSTATE[KEY.SPACE]) {
            if (++missileThrottle > 4) {
                launchMissile();
                missileThrottle = 0;
            }
        } else {
            missileThrottle = 4;
        }

        for(var i = 0; i < NUM_BULLETS; i++) {
            var b = bullet[i];
            if (b.active) {
                foreContext.drawImage(b.image, b.x, b.y);
                if (checkMissileCollision(b.x, b.y)) {
                    b.active = false;
                } else {
                    b.x = b.x - 6;
                    if(b.x < 0) {
                        b.active = false;
                    }
                }
            }
        }
    }

    function checkMissileCollision(x,y) {
        var offset,  hitAt;

        var data = mtnContext.getImageData(mtnPos + x ,y, 6, 1);
        for (offset = 5; offset >= 0; offset--) {
            if (data.data[offset*4] != 221) {
                hitAt = mtnPos + x + offset;
                break;
            }
        }

        if (hitAt) {
            data = mtnContext.getImageData(hitAt - 1 , y - 1, 3, 3);
            data.data[20] = 221;
            data.data[21] = 255;
            data.data[22] = 255;
            for (var p = 0; p < 36; p+=4) {
                if (Math.random() < .4) {
                    data.data[p] = 221;
                    data.data[p + 1] = 255;
                    data.data[p + 2] = 255;
                }
            }

            mtnContext.putImageData(data, hitAt - 1 ,y - 1);
            if (hitAt < 640) {
                mtnContext.putImageData(data, hitAt - 1 + 1280 ,y - 1);
            } else if (hitAt >= 1280) {
                mtnContext.putImageData(data, hitAt - 1 - 1280 ,y - 1);
            }

            return true;
        }

        return false;
    }

    function checkJetCollision(x,y) {
        var offset;

        var data = mtnContext.getImageData(mtnPos + x + 23 , y + 20, 40, 1).data;
        for (offset = 0; offset < 160; offset+= 4) {
            if (data[offset] != 221) {
                console.log("HIT!");
                return true;
            }
        }
        return false;
    }

    function updateJet () {
        if(KEYSTATE[KEY.UP])
        {
            if(jetAccelY>-4) {
                jetAccelY-=.2;
            }
        }
        else
        if(KEYSTATE[KEY.DOWN])
        {
            if(jetAccelY<4) {
                jetAccelY+=.2;
            }
        }
        else
        {
            if (jetAccelY > 0)
                jetAccelY-=.2;
            else
            if (jetAccelY < 0)
                jetAccelY+=.2;
        }

        if (jetAccelY > -.2 && jetAccelY < 0) {
            jetAccelY = 0;
        }
        if (jetAccelY < .2 && jetAccelY > 0) {
            jetAccelY = 0;
        }

        jetY+=jetAccelY;
        if (jetY < 0) {
            jetY = 0;
        }

        if(KEYSTATE[KEY.LEFT])
        {
            if (jetX > 360) {
                if(jetAccelX>-2)
                    jetAccelX-=.1;
            } else {
                jetAccelX = 0;
            }
        }
        else
        if(KEYSTATE[KEY.RIGHT])
        {
            if (jetX < 560) {
                if(jetAccelX<2)
                    jetAccelX+=.1;
            } else {
                jetAccelX = 0;
            }
        }
        else
        {
            if (jetAccelX > 0.1)
                jetAccelX-=.1;
            else
            if (jetAccelX < 0.1)
                jetAccelX+=.1;

            if(jetX<475)
                jetX+=1.5;
            if(jetX>485)
                jetX-=.5;
        }

        if (jetAccelX > -.1 && jetAccelX < 0) {
            jetAccelX = 0;
        }
        if (jetAccelX < .1 && jetAccelX > 0) {
            jetAccelX = 0;
        }

        jetX+=jetAccelX;

        var rotation = -jetAccelY * 3;
        foreContext.save();
        foreContext.translate(jetX+23, jetY+7);
        var radians = rotation*Math.PI/180;
        foreContext.rotate(radians);
        foreContext.drawImage(jet, 0, 0);
        foreContext.restore();

        if (checkJetCollision(jetX, jetY)) {
            crash.play();
        }
    }

    function gameLoop() {
        window.requestAnimationFrame(gameLoop);

        mtnPos-=2; if(mtnPos <0) mtnPos = 1920 - 640;
        backContext.drawImage(mtnCanvas, mtnPos, 0, 640, 435, 0, 0, 640, 435);

        foreContext.clearRect(0,0,640,435);
        updateMissiles();
        updateBomb();
        updateJet();
        if (explSprite && explSprite.active) {
            explSprite.x += 2;
        }
        spriteList.drawSprites(foreContext);
    }

    function init() {
        // Initialize the amazing JGL and create a new sprite list
        jgl = new Jgl;
        spriteList = jgl.newSpriteList();

        var explosionImg = jgl.newImage("./images/explosion.png", function() {
            // EXPLOSION sprite
            explSprite = spriteList.newSprite({
                id: 'explosion',
                width: 88, height: 90,
                image: explosionImg,
                animate: true,
                autoLoop: false,
                autoDeactivate: true,
                currentFrame: 0,
                startFrame: 0,
                endFrame: 39,
                active: false
            });

            // Define animation frames
            for (var frame = 0; frame < 40; frame++) {
                explSprite.setAnimFrame(frame, explosionImg, frame * 88, 0, 88, 90);
            }
            explSprite.setHotSpot(44, 44);
        });

    }
    init();
    gameLoop();
}



