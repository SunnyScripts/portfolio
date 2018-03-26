/**
 * Created by Ryan Berg on 4/22/17.
 * rberg2@hotmail.com
 */

if(!Detector.webgl)
    Detector.addGetWebGLMessage();

const degreesToRadiansMultiplier = 0.0174532925;
var container;
var camera, scene, renderer, emitter, animator, starfield, backgroundTexture, planetMesh;
// var explosion;
//
var particleSystem, uniforms;//, geometryBufferVolume;

var boidArray = [];

var fireBox = document.getElementById('fireBox');

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

var mousePosition = new THREE.Vector3();
var verticalMoveDirection = 0;
var text = document.getElementById("text");
var back = document.getElementById("back");

// window.addEventListener("mousemove", function(event)
// {
//
//     back.style.transform = "translate(" + -10 * (((event.clientX/window.innerWidth)*2) + -1) + "px, 0px)";
//     // fireBox.style.transform = "translate(" + 25 * (((event.clientX/window.innerWidth)*2) + -1) + "px, 0px)";
//     text.style.transform = "translate(" + 50 * (((event.clientX/window.innerWidth)*2) + -1) + "px, 0px)";
//
//
//
//     // mousePosition.copy(new THREE.Vector3(event.offsetX, event.offsetY, 0));
// });

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

function init() {

    container = document.createElement( 'div' );
    fireBox.appendChild(container);

    camera = new THREE.OrthographicCamera(0, fireBox.clientWidth, 0, fireBox.clientHeight, 1, 10);
    camera.position.z = 2;

    scene = new THREE.Scene();
    scene.add(camera);

    var systemSize = 1000;

    var positionBuffer = [];
    // var colorBuffer = [];
    var speedBuffer = [];
    var angleBuffer = [];
    var maxLifeBuffer = [];
    var particleSizeBuffer = [];

    // var startPosition = new THREE.Vector3(fireBox.clientWidth, 0, 0);
    // var startColor = new THREE.Vector4(0.0, .5, 1.0, .3);

    for(let i = 0, startValue, pos; i < systemSize; i++)
    {
        maxLifeBuffer[i] = getPseudoRandom(15, .5);

        positionBuffer.push(getPseudoRandom(0, fireBox.clientWidth), -14, 0);

        startValue = getPseudoRandom(30, 5);
        //initial velocity, acceleration
        speedBuffer.push(startValue, (getPseudoRandom(30, 5) - startValue) / maxLifeBuffer[i]);
        startValue = getPseudoRandom(80, 20);
        angleBuffer.push(startValue * degreesToRadiansMultiplier, getPseudoRandom(startValue-10, 10) * degreesToRadiansMultiplier);

        // colorBuffer.push(230, 28);

        particleSizeBuffer[i] = 7 * Math.pow(.7, Math.random() * 10) + getPseudoRandom(2, 2);
    }

    var bufferGeometry =  new THREE.BufferGeometry();
    bufferGeometry.addAttribute("position", new THREE.Float32BufferAttribute(positionBuffer, 3));
    bufferGeometry.addAttribute("speed", new THREE.Float32BufferAttribute(speedBuffer, 2));
    bufferGeometry.addAttribute("angle", new THREE.Float32BufferAttribute(angleBuffer, 2));
    bufferGeometry.addAttribute("maxLife", new THREE.Float32BufferAttribute(maxLifeBuffer, 1));
    // bufferGeometry.addAttribute("color", new THREE.Float32BufferAttribute(colorBuffer, 2));
    bufferGeometry.addAttribute("size", new THREE.Float32BufferAttribute(particleSizeBuffer, 1));

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

    particleSystem = new THREE.Points(bufferGeometry, particleShaderMaterial);
    //if particle system goes out of camera bounds, particles will still be drawn
    particleSystem.frustumCulled = false;
    // particleSystem.material.vertexColors.dynamic = true;
    particleSystem.name = "ps";

    scene.add(particleSystem);

    // backgroundTexture = new THREE.TextureLoader().load("images/clouds3.png");
    // backgroundTexture.flipY = false;
    // backgroundTexture.wrapS = THREE.RepeatWrapping;
    // backgroundTexture.offset.x += .35;
    // backgroundTexture.wrapT = THREE.RepeatWrapping;
    //
    // backgroundTexture.repeat.set(0,1024);
    //
    // var backgroundSprite = new THREE.Sprite(new THREE.SpriteMaterial({map: backgroundTexture}));
    // backgroundSprite.scale.set(fireBox.clientWidth, fireBox.clientHeight, 1);
    // backgroundSprite.position.copy(new THREE.Vector3(fireBox.clientWidth*.5, fireBox.clientHeight*.5, 1));
    //
    //
    // var texture = new THREE.TextureLoader().load("images/ship_wobble.png");
    // texture.flipY = false;
    // animator = new AnimateSpritesheet(texture, new THREE.Vector2(4096, 4096), 400, 500, 10, 48, true);
    // animator.nextFrame(0);
    // var boid;
    // for(var i = 0; i < 15; i++)
    // {
    //     boid = new Boid(texture);
    //     boid.material.color.set(0xFFFFFF);
    //     boid.scale.set(75, 75, 1);
    //     boid.position.copy(new THREE.Vector3(getPseudoRandom(300, 300), getPseudoRandom(300, 300), 0));
    //     boidArray.push(boid);
    //     scene.add(boid);
    // }
    //
    //
    //
    // var spriteMaterial = new THREE.SpriteMaterial( { map: texture});
    // sprite = new THREE.Sprite(spriteMaterial);
    // sprite.scale.set(300, 300, 1);
    // sprite.position.copy(new THREE.Vector3(fireBox.clientWidth*.5+450, 300, 0));
    // sprite.visible = false;
    //
    //TODO keep track of 3d object by id or name
    //TODO particle size
    //TODO make emit rate frame rate independent
    //TODO emitter color variance
    //TODO pre-calculate particle system a few frames so it is full on first render
    //TODO viewport resize on window resize
    //              Emitter(particleTexture,     position,                                 numberOfParticles, emitRate, particleLifetime,     particleAngleInDegrees,         particleSpeed,                                                      particleStartPosition, particleOpacity,                                           particleColor)
    // emitter = new Emitter("images/particle.png", new THREE.Vector3(fireBox.clientWidth*.5+125, 300, 0), 300, 1, new ParticleVariable(1400, 25), new ParticleVariable(180, 8), new ParticleVariable(.005, .001, .35, .05, new THREE.Vector4(0, 0, 1, 1)), null, new ParticleVariable(1, 0, 0, 0, new THREE.Vector4(.54,0, .9,2)));
    // emitter = new Emitter(
    //     {
    //         "texture": "images/particle.png",
    //         "position": new THREE.Vector3(fireBox.clientWidth*.5, 300, 0),
    //         "particlesPerSecond": 400,
    //         //TODO particle system runtime
    //         "runtimeInSeconds": 30,
    //         //TODO make blend mode a variable
    //         "blendMode": THREE.AdditiveBlending,
    //
    //         //ParticleVariable(startValue, startVariance, endValue, endVariance, cubicBezierPointsVector4)
    //         "particleLifetimeInSeconds": new ParticleVariable(1000, 1),
    //         "particleHeadingInDegrees": new ParticleVariable(274, 6),
    //         "particleSpeedInPixelsPerSecond": new ParticleVariable(.05, .01, .2, .1),
    //         "particleStartPositionVector": new ParticleVariable(new THREE.Vector3(fireBox.clientWidth*.5, -5, 0), new THREE.Vector3(fireBox.clientWidth, 5, 0)),
    //         "particleColor": new ParticleVariable(new THREE.Color(0xffffff), 0, new THREE.Color(0xffffff), 0),
    //         "particleOpacity": new ParticleVariable(.9, .1, .1, .1, new THREE.Vector4(.54,0, .9,2))
    //     });
    // starfield = new Emitter("images/particle.png", new THREE.Vector3(-30, fireBox.clientHeight*.5, 0), 1000, 1, new ParticleVariable(550000), new ParticleVariable(180), new ParticleVariable(.01, 0, .01, 0), new ParticleVariable(new THREE.Vector3(), new THREE.Vector3(0, fireBox.clientHeight, 0)), new ParticleVariable(1,0,1,0));
    // scene.add(backgroundSprite);
    // scene.add(starfield);
    // scene.add(emitter);
    // scene.add(sprite);
    //
    // explosion = new Emitter("images/particle.png", new THREE.Vector3(40, 40, 0), 300, 2, new ParticleVariable(1400, 25), new ParticleVariable(0, 360), new ParticleVariable(.005, .001, .35, .05, new THREE.Vector4(0, 0, 1, 1)), null, new ParticleVariable(1, 0, 0, 0, new THREE.Vector4(.54,0, .9,2)));
    // scene.add(explosion);
    //
    // var light = new THREE.PointLight( 0xffe5ce, 35, 3000, 2);
    // light.position.set( fireBox.clientWidth*.5-200, 0, -20 );
    // scene.add(light);
    //
    // var planetGeometry = new THREE.SphereGeometry(1, 32, 32);
    // var planetMaterial = new THREE.MeshPhongMaterial();
    // var planetTexture = new THREE.TextureLoader().load("images/venus_surface.jpg");
    // // planetTexture.wrapS = THREE.RepeatWrapping;
    // var planetBumpmap = new THREE.TextureLoader().load('images/venus_bumpmap.jpg');
    // planetMaterial.map = planetTexture;
    // planetMaterial.bumpMap = planetBumpmap;
    // planetMaterial.bumpScale = 0.05;
    // planetMesh = new THREE.Mesh(planetGeometry, planetMaterial);
    //
    // planetMesh.position.copy(new THREE.Vector3(fireBox.clientWidth*.5, fireBox.clientHeight+900, 1));
    // planetMesh.scale.set(fireBox.clientWidth*.75, fireBox.clientWidth*.75, 1);
    // planetMesh.geometry.computeVertexNormals();
    //
    // scene.add(planetMesh);
    //
    //
    // boid.add(emitter);
    // scene.add(boid);
    //
    // uniforms =
    //     {
    //         texture: {value: new THREE.TextureLoader().load("images/particle.png")}
    //     };
    //
    // var shaderMaterial = new THREE.ShaderMaterial(
    //     {
    //         uniforms: uniforms,
    //         vertexShader:   document.getElementById('vertexshader').textContent,
    //         fragmentShader: document.getElementById('fragmentshader').textContent,
    //         blending:       THREE.AdditiveBlending,
    //         depthTest:      false,
    //         transparent:    true,
    //         vertexColors:   true
    //     }
    // );

    renderer = new THREE.WebGLRenderer({alpha: true, antialias: false});
    renderer.setSize(fireBox.clientWidth, fireBox.clientHeight);
    container.appendChild(renderer.domElement);

    mainLoop();
}


function mainLoop()
{
    requestAnimationFrame(mainLoop);
    update(time.getDelta());
    renderer.render(scene, camera);
    // setTimeout(function()
    // {
    //
    // }, 16.66666666);
}

var cumulativeTime = 4000;

function update(deltaTime)
{
    cumulativeTime += deltaTime*.001;
    uniforms.time.value = cumulativeTime;

    // geometry.attributes.size.needsUpdate = true;
    //
    // for(var i = 0; i < boidArray.length; i++)
    // {
    //     boidArray[i].update(time);
    // }
    //
    // sineGrowth += .001 * time;
    // backgroundTexture.offset.x+= .00001 * deltaTime;
    // planetMesh.rotation.z  += .0000075 * time;
    //
    // emitter.position.copy(new THREE.Vector3(((Math.sin(sineGrowth) + 1) * 300), emitter.position.y, 0));
    //
    // sprite.position.y += .1 * deltaTime * verticalMoveDirection;
    // emitter.position.y = sprite.position.y;
    // emitter.updateParticleSystem(deltaTime);
    // animator.nextFrame();
    // explosion.updateParticleSystem(deltaTime);
}

function getPseudoRandom(minValue, range)
{
    return Math.random() * range + minValue;
    // return (value - (variance * .5)) + (Math.random() * variance);
}