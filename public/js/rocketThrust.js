/**
 * Created by Ryan Berg on 4/22/17.
 * rberg2@hotmail.com
 */

if(!Detector.webgl)
    Detector.addGetWebGLMessage();

const degreesToRadiansMultiplier = 0.0174532925;

var cameraSnow, cameraFirework, sceneSnow;
var sceneFirework, rendererSnow, rendererFirework;

var uniforms;


var fireBox = document.getElementById('fireBox');
var firework = document.getElementById('firework');

var time =
    {
        _deltaTime: Date.now(),
        _tempTime: null,
        getDelta: function()
        {
            this.tempTime = Date.now() - this.deltaTime;
            this.deltaTime = Date.now();
            return this.tempTime;
        }
    };
time.getDelta();

var text = document.getElementById("text");
var back = document.getElementById("back");


var shaders = {
    particleVS: null,
    particleFS: null
};

var loader = new THREE.FileLoader();

loader.load("shaders/particle.vert", function(data)
{
    shaders.particleVS = data;
    if(shaders.particleVS && shaders.particleFS)
        init();
});
loader.load("shaders/particle.frag", function(data)
{
    shaders.particleFS = data;
    if(shaders.particleVS && shaders.particleFS)
        init();
});



var sprite;

function init()
{
    cameraSnow = new THREE.OrthographicCamera(0, fireBox.clientWidth, 0, fireBox.clientHeight, 1, 10);
    cameraSnow.position.z = 2;

    cameraFirework = new THREE.OrthographicCamera(0, fireBox.clientWidth, 0, fireBox.clientHeight, 1, 10);
    cameraFirework.position.z = 2;

    sceneSnow = new THREE.Scene();
    sceneFirework = new THREE.Scene();
    sceneSnow.add(cameraSnow);
    sceneFirework.add(cameraFirework);

    var textureLoader = new THREE.TextureLoader();
    var particleTexture = textureLoader.load( 'images/particle.png' );

    uniforms = {
        time: { value: 0.0},
        texture: { value: particleTexture}};

    var particleShaderMaterial = new THREE.RawShaderMaterial(
        {
            transparent: true,
            depthWrite: false,
            blending: THREE.NormalBlending,
            uniforms: uniforms,
            vertexShader: shaders.particleVS,
            fragmentShader: shaders.particleFS,
            // vertexColors: true
        }
    );

    var particleSystem = new THREE.Points(createBufferGeometry({
        "particles": 3000,
        "lifetime":{
            "min":12,
            "range":.5
        },
        "size":{
            "min":2,
            "range":2
        },
        "position":{
            "minV":new THREE.Vector3(0,-10,0),
            "rangeV":new THREE.Vector3(fireBox.clientWidth, 0, 0)
        },
        "speed":{
            "initialMin":25,
            "initialRange":5,
            "endMin":30,
            "endRange":4
        },
        "angle":{
            "initialMin":80,
            "initialRange":20,
            "endMinDelta":10,
            "endDeltaRange":20
        }
    }), particleShaderMaterial);

    //if particle system goes out of camera bounds, particles will still be drawn
    particleSystem.frustumCulled = false;

    // var particleSystem2 = new THREE.Points(bufferGeometry, particleShaderMaterial);

    sceneSnow.add(particleSystem);
    sceneFirework.add(new THREE.Points(createBufferGeometry({
        "particles": 1000,
        "lifetime":{
            "min":3,
            "range":.5
        },
        "size":{
            "min":6,
            "range":3
        },
        "position":{
            "minV":new THREE.Vector3(750,350,0),
            "rangeV":new THREE.Vector3(0, 0, 0)
        },
        "speed":{
            "initialMin":25,
            "initialRange":5,
            "endMin":30,
            "endRange":4
        },
        "angle":{
            "initialMin":0,
            "initialRange":360,
            "endMinDelta":0,
            "endDeltaRange":0
        }
    }), particleShaderMaterial));

    // var texture = new THREE.TextureLoader().load("images/ship_wobble.png");
    // texture.flipY = false;
    // animator = new AnimateSpritesheet(texture, new THREE.Vector2(4096, 4096), 400, 500, 10, 48, true);
    // animator.nextFrame(0);

    // var spriteMaterial = new THREE.SpriteMaterial( { map: texture});
    // sprite = new THREE.Sprite(spriteMaterial);
    // sprite.scale.set(300, 300, 1);
    // sprite.position.copy(new THREE.Vector3(fireBox.clientWidth*.5+450, 300, 0));
    // sprite.visible = false;
    //

    // sceneSnow.add(sprite);
    //


    rendererSnow = new THREE.WebGLRenderer({alpha: true, antialias: false});
    rendererSnow.setSize(fireBox.clientWidth, fireBox.clientHeight);
    rendererSnow.setPixelRatio(window.devicePixelRatio);
    fireBox.appendChild(document.createElement( 'div' ).appendChild(rendererSnow.domElement));

    rendererFirework = new THREE.WebGLRenderer({alpha: false, antialias: false});
    rendererFirework.setSize(firework.clientWidth, firework.clientHeight);
    rendererFirework.setPixelRatio(window.devicePixelRatio);
    firework.appendChild(rendererFirework.domElement);

    mainLoop();
}


function mainLoop()
{
    requestAnimationFrame(mainLoop);
    update(time.getDelta());

    rendererSnow.render(sceneSnow, cameraSnow);
    rendererFirework.render(sceneFirework, cameraFirework);

}

var cumulativeTime = 4000;

function update(deltaTime)
{
    cumulativeTime += deltaTime*.001;
    uniforms.time.value = cumulativeTime;


    // sprite.position.y += .1 * deltaTime * verticalMoveDirection;

    // animator.nextFrame();
}

function createBufferGeometry(system)
{
    var positionBuffer = [];
    var speedBuffer = [];
    var angleBuffer = [];
    var maxLifeBuffer = [];
    //colorBuffer
    var particleSizeBuffer = [];

    for(let i = 0, startValue; i < system.particles; i++)
    {
        maxLifeBuffer[i] = getPseudoRandom(system.lifetime.min, system.lifetime.range);
        positionBuffer.push(getPseudoRandom(system.position.minV.x, system.position.rangeV.x),  getPseudoRandom(system.position.minV.y, system.position.rangeV.y), getPseudoRandom(system.position.minV.z, system.position.rangeV.z));

        startValue = getPseudoRandom(system.speed.initialMin, system.speed.initialRange);

        //initial velocity, acceleration
        speedBuffer.push(startValue, (getPseudoRandom(system.speed.endMin, system.speed.endRange) - startValue) / maxLifeBuffer[i]);
        startValue = getPseudoRandom(system.angle.initialMin, system.angle.initialRange);
        angleBuffer.push(startValue * degreesToRadiansMultiplier, getPseudoRandom(startValue-system.angle.endMinDelta, system.angle.endDeltaRange) * degreesToRadiansMultiplier);

        // colorBuffer.push(230, 28);

        //size distribution
        particleSizeBuffer[i] = 7 * Math.pow(.7, Math.random() * 10) + getPseudoRandom(system.size.min, system.size.range);
    }

    var bufferGeometry =  new THREE.BufferGeometry();
    bufferGeometry.addAttribute("position", new THREE.Float32BufferAttribute(positionBuffer, 3));
    bufferGeometry.addAttribute("speed", new THREE.Float32BufferAttribute(speedBuffer, 2));
    bufferGeometry.addAttribute("angle", new THREE.Float32BufferAttribute(angleBuffer, 2));
    bufferGeometry.addAttribute("maxLife", new THREE.Float32BufferAttribute(maxLifeBuffer, 1));
    // bufferGeometry.addAttribute("color", new THREE.Float32BufferAttribute(colorBuffer, 2));
    bufferGeometry.addAttribute("size", new THREE.Float32BufferAttribute(particleSizeBuffer, 1));

    return bufferGeometry;
}
function getPseudoRandom(minValue, range)
{
    return Math.random() * range + minValue;
    // return (value - (variance * .5)) + (Math.random() * variance);
}