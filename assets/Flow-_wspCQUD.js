import{ai as P,aj as S}from"./GeoJSON-BoRJWQIG.js";import{D as E,W as x,a as f,b as m,S as R,e as v,U as a,A as d,n as C,g,u as N}from"./compileUtil-Qcsrcrcg.js";import $ from"./BaseTile-DfxohS-w.js";import"./index-B3F0456b.js";import"./utils-BXWzvTjY.js";import"./_commonjsHelpers-CE1G-McA.js";import"./I18N-DlIXJTel.js";import"./BFormRadioGroup.vue_vue_type_script_setup_true_lang-DaMHx4U3-DO3czC2y.js";import"./useStateClass-BGbSLWFN-eI-Q6wqs.js";import"./ConditionalWrapper.vue_vue_type_script_lang-IX_NpHH--5aly-L7g.js";import"./mat4-CeypvY8Z.js";import"./DataTile-B4Zfc0sf.js";import"./Tile-Dd8tR1PC.js";import"./Tile-Bg7ozswn.js";import"./common-CLWpeXJR.js";import"./TileRange-2Tc-Ry00.js";import"./LRUCache-Cy7VNIXe.js";import"./tilecoord-DBpIeO-O.js";import"./TileProperty-BF4LcWSy.js";const e={TEXTURE:"u_texture",VELOCITY_TEXTURE:"u_velocityTexture",POSITION_TEXTURE:"u_positionTexture",PARTICLE_COUNT_SQRT:"u_particleCountSqrt",MAX_SPEED:"u_maxSpeed",RANDOM_SEED:"u_randomSeed",SPEED_FACTOR:"u_speedFactor",DROP_RATE:"u_dropRate",DROP_RATE_BUMP:"u_dropRateBump",OPACITY:"u_opacity",ROTATION:E.ROTATION,VIEWPORT_SIZE_PX:E.VIEWPORT_SIZE_PX},T={POSITION:"a_position",INDEX:"a_index"},c={POSITION:"v_position"};class A extends x{constructor(r,t){super(r,{vertexShader:t.tileVertexShader,fragmentShader:t.tileFragmentShader,cacheSize:t.cacheSize,postProcesses:[{}],uniforms:{[e.MAX_SPEED]:t.maxSpeed}}),this.particleColorFragmentShader_=t.particleColorFragmentShader,this.velocityTexture_=null,this.particleCountSqrt_=t.particles?Math.ceil(Math.sqrt(t.particles)):256,this.particleIndexBuffer_,this.quadBuffer_,this.particlePositionProgram_,this.particlePositionVertexShader_=t.particlePositionVertexShader,this.particlePositionFragmentShader_=t.particlePositionFragmentShader,this.previousPositionTexture_,this.nextPositionTexture_,this.particleColorProgram_,this.particleColorVertexShader_=t.particleColorVertexShader,this.particleColorFragmentShader_=t.particleColorFragmentShader,this.textureProgram_,this.textureVertexShader_=t.textureVertexShader,this.textureFragmentShader_=t.textureFragmentShader,this.previousTrailsTexture_,this.nextTrailsTexture_,this.fadeOpacity_=.996,this.maxSpeed_=t.maxSpeed,this.speedFactor_=t.speedFactor||.001,this.dropRate_=.003,this.dropRateBump_=.01,this.tempVec2_=[0,0],this.renderedWidth_=0,this.renderedHeight_=0}afterHelperCreated(){super.afterHelperCreated();const r=this.helper,t=r.getGL();this.framebuffer_=t.createFramebuffer();const i=this.particleCountSqrt_*this.particleCountSqrt_,o=new Float32Array(i);for(let _=0;_<i;++_)o[_]=_;const s=new f(m,R);s.setArray(o),r.flushBufferData(s),this.particleIndexBuffer_=s;const l=new Float32Array([0,0,1,0,0,1,0,1,1,0,1,1]),h=new f(m,R);h.setArray(l),r.flushBufferData(h),this.quadBuffer_=h;const n=new Uint8Array(i*4);for(let _=0;_<n.length;++_)n[_]=Math.floor(Math.random()*256);this.previousPositionTexture_=r.createTexture([this.particleCountSqrt_,this.particleCountSqrt_],n,null,!0),this.nextPositionTexture_=r.createTexture([this.particleCountSqrt_,this.particleCountSqrt_],n,null,!0),this.particlePositionProgram_=r.getProgram(this.particlePositionFragmentShader_,this.particlePositionVertexShader_),this.particleColorProgram_=r.getProgram(this.particleColorFragmentShader_,this.particleColorVertexShader_),this.textureProgram_=r.getProgram(this.textureFragmentShader_,this.textureVertexShader_)}createSizeDependentTextures_(){const r=this.helper,t=r.getGL(),i=r.getCanvas(),o=i.width,s=i.height,l=new Uint8Array(o*s*4);this.nextTrailsTexture_&&t.deleteTexture(this.nextTrailsTexture_),this.nextTrailsTexture_=r.createTexture([o,s],l,null,!0),this.previousTrailsTexture_&&t.deleteTexture(this.previousTrailsTexture_),this.previousTrailsTexture_=r.createTexture([o,s],l,null,!0)}beforeFinalize(r){const t=this.helper,i=t.getGL(),o=t.getCanvas(),s=o.width,l=o.height;(this.renderedWidth_!=s||this.renderedHeight_!=l)&&this.createSizeDependentTextures_();const h=[s,l];this.velocityTexture_=t.createTexture(h,null,this.velocityTexture_),i.copyTexImage2D(i.TEXTURE_2D,0,i.RGBA,0,0,s,l,0),this.drawParticleTrails_(r),this.updateParticlePositions_(r),r.animate=!0,this.renderedWidth_=s,this.renderedHeight_=l}drawParticleTrails_(r){const t=this.helper,i=t.getGL();t.bindFrameBuffer(this.framebuffer_,this.nextTrailsTexture_),this.drawTexture_(this.previousTrailsTexture_,this.fadeOpacity_),this.drawParticleColor_(r),t.bindInitialFrameBuffer(),i.clearColor(0,0,0,0),i.clear(i.COLOR_BUFFER_BIT),i.enable(i.BLEND),i.blendFunc(i.SRC_ALPHA,i.ONE_MINUS_SRC_ALPHA),this.drawTexture_(this.nextTrailsTexture_,1),i.disable(i.BLEND);const o=this.nextTrailsTexture_;this.nextTrailsTexture_=this.previousTrailsTexture_,this.previousTrailsTexture_=o}drawTexture_(r,t){const i=this.helper,o=i.getGL();i.useProgram(this.textureProgram_),i.bindTexture(r,0,e.TEXTURE),i.bindAttribute(this.quadBuffer_,T.POSITION,2),this.helper.setUniformFloatValue(e.OPACITY,t),o.drawArrays(o.TRIANGLES,0,6)}drawParticleColor_(r){const t=this.helper,i=t.getGL();t.useProgram(this.particleColorProgram_);const o=this.particleCountSqrt_*this.particleCountSqrt_;t.bindAttribute(this.particleIndexBuffer_,T.INDEX,1),t.bindTexture(this.previousPositionTexture_,0,e.POSITION_TEXTURE),t.bindTexture(this.velocityTexture_,1,e.VELOCITY_TEXTURE),this.helper.setUniformFloatValue(e.PARTICLE_COUNT_SQRT,this.particleCountSqrt_);const s=this.tempVec2_;s[0]=Math.cos(-r.viewState.rotation),s[1]=Math.sin(-r.viewState.rotation),this.helper.setUniformFloatVec2(e.ROTATION,s),this.helper.setUniformFloatValue(e.MAX_SPEED,this.maxSpeed_),i.drawArrays(i.POINTS,0,o)}updateParticlePositions_(r){const t=this.helper,i=t.getGL();t.useProgram(this.particlePositionProgram_),i.viewport(0,0,this.particleCountSqrt_,this.particleCountSqrt_),t.bindFrameBuffer(this.framebuffer_,this.nextPositionTexture_),t.bindTexture(this.previousPositionTexture_,0,e.POSITION_TEXTURE),t.bindTexture(this.velocityTexture_,1,e.VELOCITY_TEXTURE),t.bindAttribute(this.quadBuffer_,T.POSITION,2),t.setUniformFloatValue(e.RANDOM_SEED,Math.random()),t.setUniformFloatValue(e.SPEED_FACTOR,this.speedFactor_),t.setUniformFloatValue(e.DROP_RATE,this.dropRate_),t.setUniformFloatValue(e.DROP_RATE_BUMP,this.dropRateBump_);const o=this.tempVec2_;o[0]=Math.cos(-r.viewState.rotation),o[1]=Math.sin(-r.viewState.rotation),this.helper.setUniformFloatVec2(e.ROTATION,o);const s=r.size;this.helper.setUniformFloatVec2(e.VIEWPORT_SIZE_PX,[s[0],s[1]]),i.drawArrays(i.TRIANGLES,0,6);const l=this.nextPositionTexture_;this.nextPositionTexture_=this.previousPositionTexture_,this.previousPositionTexture_=l}}const y=`
  attribute vec2 ${d.TEXTURE_COORD};
  uniform mat4 ${a.TILE_TRANSFORM};
  uniform float ${a.TEXTURE_PIXEL_WIDTH};
  uniform float ${a.TEXTURE_PIXEL_HEIGHT};
  uniform float ${a.TEXTURE_RESOLUTION};
  uniform float ${a.TEXTURE_ORIGIN_X};
  uniform float ${a.TEXTURE_ORIGIN_Y};
  uniform float ${a.DEPTH};

  varying vec2 v_textureCoord;
  varying vec2 v_mapCoord;

  void main() {
    v_textureCoord = ${d.TEXTURE_COORD};
    v_mapCoord = vec2(
      ${a.TEXTURE_ORIGIN_X} + ${a.TEXTURE_RESOLUTION} * ${a.TEXTURE_PIXEL_WIDTH} * v_textureCoord[0],
      ${a.TEXTURE_ORIGIN_Y} - ${a.TEXTURE_RESOLUTION} * ${a.TEXTURE_PIXEL_HEIGHT} * v_textureCoord[1]
    );
    gl_Position = ${a.TILE_TRANSFORM} * vec4(${d.TEXTURE_COORD}, ${a.DEPTH}, 1.0);
  }
`,D=`
  #ifdef GL_FRAGMENT_PRECISION_HIGH
  precision highp float;
  #else
  precision mediump float;
  #endif

  uniform vec4 ${a.RENDER_EXTENT};
  uniform float ${e.MAX_SPEED};
  uniform sampler2D ${a.TILE_TEXTURE_ARRAY}[1];

  varying vec2 v_textureCoord;
  varying vec2 v_mapCoord;

  void main() {
    if (
      v_mapCoord[0] < ${a.RENDER_EXTENT}[0] ||
      v_mapCoord[1] < ${a.RENDER_EXTENT}[1] ||
      v_mapCoord[0] > ${a.RENDER_EXTENT}[2] ||
      v_mapCoord[1] > ${a.RENDER_EXTENT}[3]
    ) {
      discard;
    }

    vec4 velocity = texture2D(${a.TILE_TEXTURE_ARRAY}[0],  v_textureCoord);
    gl_FragColor = vec4((velocity.xy + ${e.MAX_SPEED}) / (2.0 * ${e.MAX_SPEED}), 0, 1);
  }
`,O=`
  #ifdef GL_FRAGMENT_PRECISION_HIGH
  precision highp float;
  #else
  precision mediump float;
  #endif

  attribute vec2 ${T.POSITION};

  varying vec2 ${c.POSITION};

  void main() {
    ${c.POSITION} = ${T.POSITION};
    gl_Position = vec4(1.0 - 2.0 * ${T.POSITION}, 0, 1);
  }
`,U=`
  #ifdef GL_FRAGMENT_PRECISION_HIGH
  precision highp float;
  #else
  precision mediump float;
  #endif

  uniform sampler2D ${e.TEXTURE};
  uniform float ${e.OPACITY};

  varying vec2 ${c.POSITION};

  void main() {
    vec4 color = texture2D(${e.TEXTURE}, 1.0 - ${c.POSITION});
    gl_FragColor = vec4(floor(255.0 * color * ${e.OPACITY}) / 255.0);
  }
`,X=`
  #ifdef GL_FRAGMENT_PRECISION_HIGH
  precision highp float;
  #else
  precision mediump float;
  #endif

  uniform sampler2D ${e.POSITION_TEXTURE};
  uniform sampler2D ${e.VELOCITY_TEXTURE};
  uniform float ${e.RANDOM_SEED};
  uniform float ${e.SPEED_FACTOR};
  uniform float ${e.DROP_RATE};
  uniform float ${e.DROP_RATE_BUMP};
  uniform vec2 ${e.ROTATION};
  uniform vec2 ${e.VIEWPORT_SIZE_PX};

  varying vec2 ${c.POSITION};

  // pseudo-random generator
  const vec3 randConstants = vec3(12.9898, 78.233, 4375.85453);

  float rand(const vec2 co) {
    float t = dot(randConstants.xy, co);
    return fract(sin(t) * (randConstants.z + t));
  }

  void main() {
    vec4 positionColor = texture2D(${e.POSITION_TEXTURE}, ${c.POSITION});

    // decode particle position from pixel RGBA
    vec2 particlePosition = vec2(
      positionColor.r / 255.0 + positionColor.b,
      positionColor.g / 255.0 + positionColor.a
    );

    vec4 velocityColor = texture2D(${e.VELOCITY_TEXTURE}, particlePosition);
    if (velocityColor.a == 0.0) {
      discard;
    }

    float vx = 2.0 * velocityColor.r - 1.0;
    float vy = 2.0 * velocityColor.g - 1.0;

    // normalized veloicty (magnitude 0 - 1)
    vec2 velocity = vec2(
      vx * ${e.ROTATION}.x - vy * ${e.ROTATION}.y,
      vx * ${e.ROTATION}.y + vy * ${e.ROTATION}.x
    );

    // account for aspect ratio (square particle position texture, non-square map)
    float aspectRatio = ${e.VIEWPORT_SIZE_PX}.x / ${e.VIEWPORT_SIZE_PX}.y;
    vec2 offset = vec2(velocity.x / aspectRatio, velocity.y) * ${e.SPEED_FACTOR};

    // update particle position, wrapping around the edge
    particlePosition = fract(1.0 + particlePosition + offset);

    // a random seed to use for the particle drop
    vec2 seed = (particlePosition + ${c.POSITION}) * ${e.RANDOM_SEED};

    // drop rate is a chance a particle will restart at random position, to avoid degeneration
    float dropRate = ${e.DROP_RATE} + length(velocity) * ${e.DROP_RATE_BUMP};
    float drop = step(1.0 - dropRate, rand(seed));

    vec2 randomPosition = vec2(rand(seed + 1.3), rand(seed + 2.1));
    particlePosition = mix(particlePosition, randomPosition, drop);

    // encode the new particle position back into RGBA
    gl_FragColor = vec4(
      fract(particlePosition * 255.0),
      floor(particlePosition * 255.0) / 255.0
    );
  }
`,F=`
  #ifdef GL_FRAGMENT_PRECISION_HIGH
  precision highp float;
  #else
  precision mediump float;
  #endif

  attribute float ${T.INDEX};

  uniform sampler2D ${e.POSITION_TEXTURE};
  uniform float ${e.PARTICLE_COUNT_SQRT};

  varying vec2 ${c.POSITION};

  void main() {
    vec4 color = texture2D(
      ${e.POSITION_TEXTURE},
      vec2(
        fract(${T.INDEX} / ${e.PARTICLE_COUNT_SQRT}),
        floor(${T.INDEX} / ${e.PARTICLE_COUNT_SQRT}) / ${e.PARTICLE_COUNT_SQRT}
      )
    );

    ${c.POSITION} = vec2(
      color.r / 255.0 + color.b,
      color.g / 255.0 + color.a
    );

    gl_PointSize = 1.0;
    gl_Position = vec4(
      2.0 * ${c.POSITION}.x - 1.0,
      2.0 * ${c.POSITION}.y - 1.0,
      0,
      1
    );
  }
`;function b(u){const r=C(),t=[];if(u.color!==void 0){const n=v(r,u.color,S);t.push(`color = ${n};`)}const i=Object.keys(r.variables);if(i.length>1&&!u.variables)throw new Error(`Missing variables in style (expected ${r.variables})`);const o={};for(const n of i){if(!(n in u.variables))throw new Error(`Missing '${n}' in style variables`);const _=N(n);o[_]=function(){let p=u.variables[n];return typeof p=="string"&&(p=g(p)),p!==void 0?p:-9999999}}const s=Object.keys(o).map(function(n){return`uniform float ${n};`}),l=Object.keys(r.functions).map(function(n){return r.functions[n]}),h=`
    #ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
    #else
    precision mediump float;
    #endif

    uniform sampler2D ${e.VELOCITY_TEXTURE};
    uniform float ${e.MAX_SPEED};
    uniform vec2 ${e.ROTATION};

    ${s.join(`
`)}

    varying vec2 ${c.POSITION};
    
    ${l.join(`
`)}

    void main() {
      vec4 velocityColor = texture2D(${e.VELOCITY_TEXTURE}, ${c.POSITION});

      float vx = mix(-${e.MAX_SPEED}, ${e.MAX_SPEED}, velocityColor.r);
      float vy = mix(-${e.MAX_SPEED}, ${e.MAX_SPEED}, velocityColor.g);

      vec2 velocity = vec2(
        vx * ${e.ROTATION}.x - vy * ${e.ROTATION}.y,
        vx * ${e.ROTATION}.y + vy * ${e.ROTATION}.x
      );

      float a_prop_speed = length(velocity);

      vec4 color;

      ${t.join(`
`)}

      if (color.a == 0.0) {
        discard;
      }

      gl_FragColor = color;
    }
  `;return{tileVertexShader:y,tileFragmentShader:D,particleColorVertexShader:F,particleColorFragmentShader:h,particlePositionVertexShader:O,particlePositionFragmentShader:X,textureVertexShader:O,textureFragmentShader:U}}const I=[];class L extends ${constructor(r){const t=Object.assign({},r);if(delete t.maxSpeed,delete t.speedFactor,delete t.particles,super(t),this.style_=r.style||{},!(r.maxSpeed>0))throw new Error("maxSpeed is required");this.maxSpeed_=r.maxSpeed,this.speedFactor_=r.speedFactor,this.particles_=r.particles,this.styleVariables_=this.style_.variables||{},this.addChangeListener(P.SOURCE,this.handleSourceUpdate_)}handleSourceUpdate_(){this.hasRenderer()&&this.getRenderer().clearCache()}updateStyleVariables(r){Object.assign(this.styleVariables_,r),this.changed()}getSources(r,t){const i=this.getSource();return I[0]=i,I}createRenderer(){const r=b(this.style_);return new A(this,{...r,cacheSize:this.getCacheSize(),maxSpeed:this.maxSpeed_,speedFactor:this.speedFactor_,particles:this.particles_})}}L.prototype.dispose;export{L as default};
//# sourceMappingURL=Flow-_wspCQUD.js.map
