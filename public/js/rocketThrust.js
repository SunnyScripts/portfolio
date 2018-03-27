/**
 * Created by Ryan Berg on 4/22/17.
 * rberg2@hotmail.com
 */

if(!Detector.webgl)
    Detector.addGetWebGLMessage();

const degreesToRadiansMultiplier = 0.0174532925;

var uniforms, animator, backgroundTexture;

var containers = {
    "snow": {
        "renderer": null,
        "scene": null,
        "camera": null,
        "element": document.getElementById('snow')
    },
    "firework": {
        "renderer": null,
        "scene": null,
        "camera": null,
        "element": document.getElementById('firework')
    },
    "ship": {
        "renderer": null,
        "scene": null,
        "camera": null,
        "element": document.getElementById('ship')
    }
};

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

function init()
{
    for(let container in containers)
    {
        let scene = new THREE.Scene();

        let camera = new THREE.OrthographicCamera(0, containers[container].element.clientWidth, 0, containers[container].element.clientHeight, 1, 10);
        camera.position.z = 2;
        scene.add(camera);

        let renderer;
        if(container === "snow")
            renderer = new THREE.WebGLRenderer({alpha: true, antialias: false});
        else if(container === "firework")
            renderer = new THREE.WebGLRenderer({alpha: false, antialias: false});
        else
            renderer = new THREE.WebGLRenderer({alpha: false, antialias: true});

        renderer.setSize(containers[container].element.clientWidth, containers[container].element.clientHeight);
        renderer.setPixelRatio(window.devicePixelRatio);

        containers[container].element.appendChild(renderer.domElement);

        containers[container].camera = camera;
        containers[container].scene = scene;
        containers[container].renderer = renderer;
    }

    var textureLoader = new THREE.TextureLoader();
    var particleTexture = textureLoader.load( 'images/particle.png' );

    uniforms = {
        time: { value: 0.0},
        texture: { value: particleTexture}};

    var particleShaderMaterial = new THREE.RawShaderMaterial(
        {
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
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
        "color":{
          "initialHue":0,
          "endHue":0,
          "initialSaturation":1,
          "endSaturation":1,
          "initialLightness":.99,
          "endLightness":.99,
          "initialOpacity":1,
          "endOpacity":0
        },
        "position":{
            "minV":new THREE.Vector3(0,-10,0),
            "rangeV":new THREE.Vector3(containers.snow.element.clientWidth, 0, 0)
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
    containers.snow.scene.add(particleSystem);

    containers.firework.scene.add(new THREE.Points(createBufferGeometry({
        "particles": 1000,
        "lifetime":{
            "min":3,
            "range":0
        },
        "size":{
            "min":8,
            "range":5
        },
        "color":{
            "initialHue":50,
            "endHue":1,
            "initialSaturation":1,
            "endSaturation":1,
            "initialLightness":.75,
            "endLightness":.25,
            "initialOpacity":1,
            "endOpacity":1
        },
        "position":{
            "minV":new THREE.Vector3(firework.clientWidth*.5,firework.clientHeight*.5,0),
            "rangeV":new THREE.Vector3(0, 0, 0)
        },
        "speed":{
            "initialMin":90,
            "initialRange":40,
            "endMin":0,
            "endRange":0
        },
        "angle":{
            "initialMin":0,
            "initialRange":360,
            "endMinDelta":0,
            "endDeltaRange":0
        }
    }), particleShaderMaterial));

    var texture = new THREE.TextureLoader().load("images/ship_wobble.png");
    texture.flipY = false;
    texture.wrapS = THREE.RepeatWrapping;
    texture.repeat.x = - 1;
    animator = new AnimateSpritesheet(texture, new THREE.Vector2(4096, 4096), 400, 500, 10, 48, true);
    animator.nextFrame(0);

    var spriteMaterial = new THREE.SpriteMaterial( { map: texture});
    var sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(300, 300, 1);
    sprite.position.copy(new THREE.Vector3(250, 250, 1));

    backgroundTexture = new THREE.TextureLoader().load("images/darkBlueSpace512.jpg");
    backgroundTexture.flipY = false;
    backgroundTexture.wrapS = THREE.RepeatWrapping;
    // backgroundTexture.offset.x += .35;
    backgroundTexture.wrapT = THREE.RepeatWrapping;

    backgroundTexture.repeat.set(2,2);

    var backgroundSprite = new THREE.Sprite(new THREE.SpriteMaterial({map: backgroundTexture}));
    backgroundSprite.scale.set(containers.ship.element.clientWidth, containers.ship.element.clientHeight, 1);
    backgroundSprite.position.copy(new THREE.Vector3(containers.ship.element.clientWidth*.5, containers.ship.element.clientHeight*.5, 0));

    containers.ship.scene.add(backgroundSprite);
    containers.ship.scene.add(sprite);

    mainLoop();
}

function mainLoop()
{
    requestAnimationFrame(mainLoop);
    update(time.getDelta());

    for(let container in containers)
    {
        containers[container].renderer.render(containers[container].scene, containers[container].camera);
    }
}

var cumulativeTime = 4000;
var counter = 0;

function update(deltaTime)
{
    counter++;
    cumulativeTime += deltaTime*.001;
    uniforms.time.value = cumulativeTime;

    backgroundTexture.offset.x -= .00001 * deltaTime;

    if(counter % 3 == 0)
    {
        animator.nextFrame();
        counter = 0;
    }
}

function createBufferGeometry(system)
{
    var positionBuffer = [];
    var speedBuffer = [];
    var angleBuffer = [];
    var maxLifeBuffer = [];
    var particleSizeBuffer = [];

    //theses color buffers exist to introduce randomness when needed
    var hueBuffer = [];
    var saturationBuffer =[];
    var lightnessBuffer = [];
    var opacityBuffer = [];

    for(let i = 0, startValue; i < system.particles; i++)
    {
        maxLifeBuffer[i] = getPseudoRandom(system.lifetime.min, system.lifetime.range);
        positionBuffer.push(getPseudoRandom(system.position.minV.x, system.position.rangeV.x),  getPseudoRandom(system.position.minV.y, system.position.rangeV.y), getPseudoRandom(system.position.minV.z, system.position.rangeV.z));

        startValue = getPseudoRandom(system.speed.initialMin, system.speed.initialRange);

        //initial velocity, acceleration
        speedBuffer.push(startValue, (getPseudoRandom(system.speed.endMin, system.speed.endRange) - startValue) / maxLifeBuffer[i]);
        startValue = getPseudoRandom(system.angle.initialMin, system.angle.initialRange);
        angleBuffer.push(startValue * degreesToRadiansMultiplier, getPseudoRandom(startValue-system.angle.endMinDelta, system.angle.endDeltaRange) * degreesToRadiansMultiplier);

        hueBuffer.push(system.color.initialHue, system.color.endHue);
        saturationBuffer.push(system.color.initialSaturation, system.color.endSaturation);
        lightnessBuffer.push(system.color.initialLightness, system.color.endLightness);
        opacityBuffer.push(system.color.initialOpacity, system.color.endOpacity);

        //size distribution
        particleSizeBuffer[i] = 7 * Math.pow(.7, Math.random() * 10) + getPseudoRandom(system.size.min, system.size.range);
    }


    var bufferGeometry =  new THREE.BufferGeometry();
    bufferGeometry.addAttribute("position", new THREE.Float32BufferAttribute(positionBuffer, 3));
    bufferGeometry.addAttribute("speed", new THREE.Float32BufferAttribute(speedBuffer, 2));
    bufferGeometry.addAttribute("angle", new THREE.Float32BufferAttribute(angleBuffer, 2));
    bufferGeometry.addAttribute("maxLife", new THREE.Float32BufferAttribute(maxLifeBuffer, 1));
    bufferGeometry.addAttribute("size", new THREE.Float32BufferAttribute(particleSizeBuffer, 1));

    bufferGeometry.addAttribute("hue", new THREE.Float32BufferAttribute(hueBuffer, 2));
    bufferGeometry.addAttribute("saturation", new THREE.Float32BufferAttribute(saturationBuffer, 2));
    bufferGeometry.addAttribute("lightness", new THREE.Float32BufferAttribute(lightnessBuffer, 2));
    bufferGeometry.addAttribute("opacity", new THREE.Float32BufferAttribute(opacityBuffer, 2));

    return bufferGeometry;
}
function getPseudoRandom(minValue, range)
{
    return Math.random() * range + minValue;
    // return (value - (variance * .5)) + (Math.random() * variance);
}