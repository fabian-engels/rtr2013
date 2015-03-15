
// Sphere FragmentShader of TDL example

#ifdef GL_ES
precision highp float;
#endif
uniform vec4 lightColor;
varying vec4 v_position;
varying vec2 v_texCoord;
varying vec3 v_normal;
varying vec3 v_surfaceToLight;
varying vec3 v_surfaceToView;

uniform sampler2D diffuseSampler;
uniform vec4 specular;
uniform sampler2D bumpSampler;
uniform float shininess;
uniform float specularFactor;

vec4 lit(float l ,float h, float m) {
  return vec4(1.0,
              max(l, 0.0),
              (l > 0.0) ? pow(max(0.0, h), m) : 0.0,
              1.0);
}
void main() {
  vec4 diffuse = texture2D(diffuseSampler, v_texCoord);
  vec3 normal = normalize(v_normal);
  vec3 surfaceToLight = normalize(v_surfaceToLight);
  vec3 surfaceToView = normalize(v_surfaceToView);
  vec3 halfVector = normalize(surfaceToLight + surfaceToView);
  vec4 litR = lit(dot(normal, surfaceToLight),
                    dot(normal, halfVector), shininess);
  gl_FragColor = vec4((
  lightColor * (diffuse * litR.y
                        + specular * litR.z * specularFactor)).rgb,
      diffuse.a);
}
