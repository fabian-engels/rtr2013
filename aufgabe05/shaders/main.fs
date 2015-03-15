precision mediump float;

uniform sampler2D texture;
uniform sampler2D depthTexture;

uniform mat4 previousViewProjection;
uniform mat4 viewProjectionInverse;
uniform float velocityScale;
uniform float samples;

varying vec2 v_texCoord;

// http://www.gamerendering.com/2008/10/11/gaussian-blur-filter-shader/
// http://http.developer.nvidia.com/GPUGems3/gpugems3_ch27.html
// http://www.phasersonkill.com/?p=585
void main() {
  // Get the depth buffer value at this pixel.

  float zOverW = texture2D(depthTexture, v_texCoord).z;

  // H is the viewport position at this pixel in the range -1 to 1.
  vec4 H = vec4((v_texCoord.x * 2.0) - 1.0, (v_texCoord.y * 2.0) - 1.0, zOverW, 1.0);

  // Transform by the view projection inverse.
  // goes to black
  vec4 D = H * viewProjectionInverse;

  // Divide by w to get the world position.
  vec4 worldPos = D / D.w;

  // GPU Gems 3 Example 27-2. Adaptation

  // Current viewport position
  vec4 currentPos = H;

  // Use the world position, and transform by the previous viewprojecton matrix.
  vec4 previousPos = worldPos * previousViewProjection;

  // Convert to nonhomogeneous points [-1,1] by dividing by w.
  previousPos /= previousPos.w;

  // Use this fram's position and last frames to compute the pixel velocity.
  vec2 velocity = ((currentPos - previousPos) / velocityScale).xy;

  // GPU Gems 3 Example 27.3 Adaptation

  // Get the inital color at this pixel.
  vec4 color = texture2D(texture, v_texCoord);
  
  vec2 texCoord = v_texCoord + velocity;
  
  for(int i = 1; i < 21; ++i) {
  	if(i >= int(samples))
  		break;
    texCoord += velocity;
    // Add the current color to our color sum.  
  	color += texture2D(texture, texCoord);
  }

  // Average all of the samples to get the final blur color.  
  gl_FragColor = color / samples; 
}