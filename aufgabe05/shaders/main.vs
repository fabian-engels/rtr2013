

attribute vec2 position;
attribute vec2 texCoord;

uniform mat4 viewProjectionInverse;
uniform mat4 previousViewProjection;

varying vec2 v_texCoord;

void main() {
  gl_Position = vec4(position, 0, 1);
  // Y-Flip the plane so texture orientation is okay.
  gl_Position.y *= -1.0; 
  v_texCoord = texCoord;
 
}