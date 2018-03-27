precision lowp float;

uniform sampler2D texture;

varying float vMaxLife;
varying float vTime;

varying vec2 vHue;
varying vec2 vSaturation;
varying vec2 vLightness;
varying vec2 vOpacity;

float easeInOutQuad(float point)
{
	if(point < 0.5)
	{
		return 2. * point * point;
	}
	else
	{
		return (-2. * point * point) + (4. * point) - 1.;
	}
}

vec3 hslToRgb(float hue, float saturation, float lightness)
{
//derived from https://en.wikipedia.org/wiki/HSL_and_HSV#Converting_to_RGB

    vec3 rgb, tempValue;

    tempValue.y = (1. - abs(2. * lightness - 1.)) * saturation;
    hue *= .0166666666;// divide by 60 degrees

    tempValue.x = tempValue.y * (1. - abs((mod(hue, 2.)) - 1.));
    tempValue.z = 0.;

    //no switch in glsl 1.0, added in 1.3
    lowp int huePrime = int(ceil(hue));

    if(huePrime == 1)
        rgb = tempValue.yxz;
    else if(huePrime == 2)
        rgb = tempValue.xyz;
    else if(huePrime == 3)
        rgb = tempValue.zyx;
    else if(huePrime == 4)
        rgb = tempValue.zxy;
    else if(huePrime == 5)
        rgb = tempValue.xzy;
    else if(huePrime == 6)
        rgb = tempValue.yzx;
    else
        rgb = vec3(0, 0, 0);


    return rgb + (lightness - tempValue.y * .5);
}

void main()
{
    float timePercent = vTime/vMaxLife;

//    gl_FragColor = vec4(1., 1., 1., abs((.7 * timePercent) -.7)) * texture2D( texture, gl_PointCoord );

    gl_FragColor = vec4(hslToRgb(abs(((vHue.x-vHue.y) * timePercent) - vHue.x), vSaturation.x, easeInOutQuad(abs(((vLightness.x-vLightness.y) * timePercent) - vLightness.x))), easeInOutQuad(abs(((vOpacity.x-vOpacity.y) * timePercent) - vOpacity.x))) * texture2D(texture, gl_PointCoord);

//    gl_FragColor = vec4(hslToRgb(50.*(1.-timePercent), 1., easeInOutQuad(1. - timePercent)), 1. - timePercent) * texture2D( texture, gl_PointCoord );
}