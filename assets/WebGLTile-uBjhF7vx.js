import{aa as S,ab as b,ac as E}from"./GeoJSON-D3ydzCqp.js";import{W as $,e as g,u as x,U as r,P as I,A as p,n as C,g as N}from"./compileUtil-0JnFz3SY.js";import y from"./BaseTile-Bif3o0bK.js";import"./index-D-0d7ZkT.js";import"./utils-D2Kkhs6D.js";import"./_commonjsHelpers-CE1G-McA.js";import"./I18N-DlIXJTel.js";import"./BFormRadioGroup.vue_vue_type_script_setup_true_lang-DaMHx4U3-C3fEiMrv.js";import"./useStateClass-BGbSLWFN-BEbA4_Yj.js";import"./ConditionalWrapper.vue_vue_type_script_lang-IX_NpHH--CJCl1v5l.js";import"./mat4-CeypvY8Z.js";import"./DataTile-Qw0Oapwi.js";import"./Tile-ChXzKVRc.js";import"./Tile-B-XHU8_h.js";import"./common-DPRsMvOs.js";import"./TileRange-2Tc-Ry00.js";import"./LRUCache-BBunkso2.js";import"./tilecoord-CXtI4xvk.js";import"./TileProperty-BF4LcWSy.js";function v(s,e,t){const i=`
    attribute vec2 ${p.TEXTURE_COORD};
    uniform mat4 ${r.TILE_TRANSFORM};
    uniform float ${r.TEXTURE_PIXEL_WIDTH};
    uniform float ${r.TEXTURE_PIXEL_HEIGHT};
    uniform float ${r.TEXTURE_RESOLUTION};
    uniform float ${r.DEPTH};

    varying vec2 v_textureCoord;
    varying vec2 v_localMapCoord;

    void main() {
      v_textureCoord = ${p.TEXTURE_COORD};
      v_localMapCoord = vec2(
        ${r.TEXTURE_PIXEL_WIDTH} * ${r.TEXTURE_RESOLUTION} * v_textureCoord[0],
        -1. * ${r.TEXTURE_PIXEL_HEIGHT} * ${r.TEXTURE_RESOLUTION} * v_textureCoord[1]
      );
      gl_Position = ${r.TILE_TRANSFORM} * vec4(${p.TEXTURE_COORD}, ${r.DEPTH}, 1.0);
    }
  `,o={...C(),bandCount:e},a=[];if(s.color!==void 0){const n=g(o,s.color,b);a.push(`color = ${n};`)}if(s.contrast!==void 0){const n=g(o,s.contrast,E);a.push(`color.rgb = clamp((${n} + 1.0) * color.rgb - (${n} / 2.0), vec3(0.0, 0.0, 0.0), vec3(1.0, 1.0, 1.0));`)}if(s.exposure!==void 0){const n=g(o,s.exposure,E);a.push(`color.rgb = clamp((${n} + 1.0) * color.rgb, vec3(0.0, 0.0, 0.0), vec3(1.0, 1.0, 1.0));`)}if(s.saturation!==void 0){const n=g(o,s.saturation,E);a.push(`
      float saturation = ${n} + 1.0;
      float sr = (1.0 - saturation) * 0.2126;
      float sg = (1.0 - saturation) * 0.7152;
      float sb = (1.0 - saturation) * 0.0722;
      mat3 saturationMatrix = mat3(
        sr + saturation, sr, sr,
        sg, sg + saturation, sg,
        sb, sb, sb + saturation
      );
      color.rgb = clamp(saturationMatrix * color.rgb, vec3(0.0, 0.0, 0.0), vec3(1.0, 1.0, 1.0));
    `)}if(s.gamma!==void 0){const n=g(o,s.gamma,E);a.push(`color.rgb = pow(color.rgb, vec3(1.0 / ${n}));`)}if(s.brightness!==void 0){const n=g(o,s.brightness,E);a.push(`color.rgb = clamp(color.rgb + ${n}, vec3(0.0, 0.0, 0.0), vec3(1.0, 1.0, 1.0));`)}const d={},u=Object.keys(o.variables).length;if(u>1&&!s.variables)throw new Error(`Missing variables in style (expected ${o.variables})`);for(let n=0;n<u;++n){const c=o.variables[Object.keys(o.variables)[n]];if(!(c.name in s.variables))throw new Error(`Missing '${c.name}' in style variables`);const m=x(c.name);d[m]=function(){let l=s.variables[c.name];return typeof l=="string"&&(l=N(l)),l!==void 0?l:-9999999}}const f=Object.keys(d).map(function(n){return`uniform float ${n};`}),h=Math.ceil(e/4);if(f.push(`uniform sampler2D ${r.TILE_TEXTURE_ARRAY}[${h}];`),o.paletteTextures&&f.push(`uniform sampler2D ${I}[${o.paletteTextures.length}];`),t>0&&!("getBandValue"in o.functions)){let n="";for(let c=0;c<e;c++){const m=Math.floor(c/4);let l=c%4;c===e-1&&l===1&&(l=3);const R=`${r.TILE_TEXTURE_ARRAY}[${m}]`;n+=`  if (band == ${c+1}.0) {
    return texture2D(${R}, v_textureCoord + vec2(dx, dy))[${l}];
  }
`}o.functions.getBandValue=`float getBandValue(float band, float xOffset, float yOffset) {
  float dx = xOffset / ${r.TEXTURE_PIXEL_WIDTH};
  float dy = yOffset / ${r.TEXTURE_PIXEL_HEIGHT};
${n}
}`}const _=Object.keys(o.functions).map(function(n){return o.functions[n]}),T=`
    #ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
    #else
    precision mediump float;
    #endif

    varying vec2 v_textureCoord;
    varying vec2 v_localMapCoord;
    uniform vec4 ${r.RENDER_EXTENT};
    uniform float ${r.TRANSITION_ALPHA};
    uniform float ${r.TEXTURE_PIXEL_WIDTH};
    uniform float ${r.TEXTURE_PIXEL_HEIGHT};
    uniform float ${r.RESOLUTION};
    uniform float ${r.ZOOM};

    ${f.join(`
`)}

    ${_.join(`
`)}

    void main() {
      if (
        v_localMapCoord[0] < ${r.RENDER_EXTENT}[0] ||
        v_localMapCoord[1] < ${r.RENDER_EXTENT}[1] ||
        v_localMapCoord[0] > ${r.RENDER_EXTENT}[2] ||
        v_localMapCoord[1] > ${r.RENDER_EXTENT}[3]
      ) {
        discard;
      }

      vec4 color = texture2D(${r.TILE_TEXTURE_ARRAY}[0],  v_textureCoord);

      ${t?`if (getBandValue(${t}.0, 0.0, 0.0) == 0.0) { discard; }`:""}

      ${a.join(`
`)}

      gl_FragColor = color;
      gl_FragColor.rgb *= gl_FragColor.a;
      gl_FragColor *= ${r.TRANSITION_ALPHA};
    }`;return{vertexShader:i,fragmentShader:T,uniforms:d,paletteTextures:o.paletteTextures}}class X extends y{constructor(e){e=e?Object.assign({},e):{};const t=e.style||{};delete e.style,super(e),this.sources_=e.sources,this.renderedSource_=null,this.renderedResolution_=NaN,this.style_=t,this.styleVariables_=this.style_.variables||{},this.handleSourceUpdate_(),this.addChangeListener(S.SOURCE,this.handleSourceUpdate_)}getSources(e,t){const i=this.getSource();return this.sources_?typeof this.sources_=="function"?this.sources_(e,t):this.sources_:i?[i]:[]}getRenderSource(){return this.renderedSource_||this.getSource()}getSourceState(){const e=this.getRenderSource();return e?e.getState():"undefined"}handleSourceUpdate_(){this.hasRenderer()&&this.getRenderer().clearCache();const e=this.getSource();if(e)if(e.getState()==="loading"){const t=()=>{e.getState()==="ready"&&(e.removeEventListener("change",t),this.setStyle(this.style_))};e.addEventListener("change",t)}else this.setStyle(this.style_)}getSourceBandCount_(){const e=Number.MAX_SAFE_INTEGER,t=this.getSources([-e,-e,e,e],e);return t&&t.length&&"bandCount"in t[0]?t[0].bandCount:4}getSourceNodataBandIndex_(){const e=Number.MAX_SAFE_INTEGER,t=this.getSources([-e,-e,e,e],e);return t&&t.length&&"nodataBandIndex"in t[0]?t[0].nodataBandIndex:void 0}createRenderer(){const e=v(this.style_,this.getSourceBandCount_(),this.getSourceNodataBandIndex_());return new $(this,{vertexShader:e.vertexShader,fragmentShader:e.fragmentShader,uniforms:e.uniforms,cacheSize:this.getCacheSize(),paletteTextures:e.paletteTextures})}renderSources(e,t){const i=this.getRenderer();let o;for(let a=0,d=t.length;a<d;++a)this.renderedSource_=t[a],i.prepareFrame(e)&&(o=i.renderFrame(e));return o}render(e,t){this.rendered=!0;const i=e.viewState,o=this.getSources(e.extent,i.resolution);let a=!0;for(let u=0,f=o.length;u<f;++u){const h=o[u],_=h.getState();if(_=="loading"){const T=()=>{h.getState()=="ready"&&(h.removeEventListener("change",T),this.changed())};h.addEventListener("change",T)}a=a&&_=="ready"}const d=this.renderSources(e,o);if(this.getRenderer().renderComplete&&a)return this.renderedResolution_=i.resolution,d;if(this.renderedResolution_>.5*i.resolution){const u=this.getSources(e.extent,this.renderedResolution_).filter(f=>!o.includes(f));if(u.length>0)return this.renderSources(e,u)}return d}setStyle(e){if(this.styleVariables_=e.variables||{},this.style_=e,this.hasRenderer()){const t=v(this.style_,this.getSourceBandCount_(),this.getSourceNodataBandIndex_());this.getRenderer().reset({vertexShader:t.vertexShader,fragmentShader:t.fragmentShader,uniforms:t.uniforms,paletteTextures:t.paletteTextures}),this.changed()}}updateStyleVariables(e){Object.assign(this.styleVariables_,e),this.changed()}}X.prototype.dispose;export{X as default};
//# sourceMappingURL=WebGLTile-uBjhF7vx.js.map
