/**
 * Created by ryan berg on 4/25/2017.
 */

function AnimateSpritesheet(textureMap, textureDimensions, frameWidth, frameHeight, horizontalFrameCount, totalFrameCount, reverseOnEnd, stopEnabled)
{
    this.reverseOnEnd = reverseOnEnd || false;
    this.stopEnabled = stopEnabled || false;
    this.playheadDirection = 1;
    this.currentFrame = 1;
    this.tempFrame = 1;
    this.textureMap = textureMap;
    this.offsetWidth = frameWidth / textureDimensions.x;
    this.offsetHeight = frameHeight / textureDimensions.y;
    this.textureMap.repeat.x = frameWidth / textureDimensions.x;
    this.textureMap.repeat.y = frameHeight / textureDimensions.y;
    this.horizontalFrameCount = horizontalFrameCount;
    this.totalFrameCount = totalFrameCount;
}
AnimateSpritesheet.prototype.nextFrame = function(jumpToFrame)
{
    this.tempFrame = jumpToFrame || this.currentFrame + this.playheadDirection;

    if(this.tempFrame < 1 || this.tempFrame > this.totalFrameCount)
    {
        if(this.stopEnabled)
            return;

        if(this.reverseOnEnd)
        {
            this.playheadDirection *= -1;
            this.currentFrame += this.playheadDirection;
            this.currentFrame += this.playheadDirection;
        }
        else
        {
            this.currentFrame = 1;
        }
    }
    else{
        this.currentFrame = this.tempFrame;
    }

    let modMultiplier = this.currentFrame % this.horizontalFrameCount;
    if(modMultiplier === 0)
        modMultiplier = this.horizontalFrameCount;
    this.textureMap.offset.x = this.offsetWidth * (modMultiplier-1);
    this.textureMap.offset.y = this.offsetHeight * (Math.ceil(this.currentFrame / this.horizontalFrameCount)-1);
};



