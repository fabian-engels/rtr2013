// Get the depth buffer value at this pixel.  
   float zOverW = tex2D(depthTexture, texCoord);  
// H is the viewport position at this pixel in the range -1 to 1.  
   float4 H = float4(texCoord.x * 2 - 1, (1 - texCoord.y) * 2 - 1, zOverW, 1);  
// Transform by the view-projection inverse.  
   float4 D = mul(H, g_ViewProjectionInverseMatrix);  
// Divide by w to get the world position.  
   float4 worldPos = D / D.w; 
   
// Current viewport position  
   float4 currentPos = H;  
// Use the world position, and transform by the previous view-  
// projection matrix.  
   float4 previousPos = mul(worldPos, g_previousViewProjectionMatrix);  
// Convert to nonhomogeneous points [-1,1] by dividing by w.  
	previousPos /= previousPos.w;  
// Use this frame's position and last frame's to compute the pixel velocity.  
   float2 velocity = (currentPos - previousPos)/2.f;  

// Get the initial color at this pixel.  
   float4 color = tex2D(sceneSampler, texCoord);
   texCoord += velocity;  
for(int i = 1; i < g_numSamples; ++i, texCoord += velocity)  
{  
  // Sample the color buffer along the velocity vector.  
   float4 currentColor = tex2D(sceneSampler, texCoord);  
  // Add the current color to our color sum.  
  color += currentColor;  
}  
// Average all of the samples to get the final blur color.  
   float4 finalColor = color / numSamples;  