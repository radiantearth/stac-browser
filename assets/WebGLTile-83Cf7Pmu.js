import{ai as R,aj as v,ak as m}from"./GeoJSON-BlyzYhKz.js";import{W as S,e as d,u as b,U as r,P as $,A as g,n as C,g as x}from"./compileUtil-l9W4qAYP.js";import I from"./BaseTile-UnyspG_X.js";import"./index-4V-ffF_e.js";import"./utils-BXWzvTjY.js";import"./_commonjsHelpers-CE1G-McA.js";import"./I18N-DlIXJTel.js";import"./BFormRadioGroup.vue_vue_type_script_setup_true_lang-DaMHx4U3-CVtNDUBO.js";import"./useStateClass-BGbSLWFN-lMazZNQ7.js";import"./ConditionalWrapper.vue_vue_type_script_lang-IX_NpHH--B1-KiooU.js";import"./mat4-CeypvY8Z.js";import"./DataTile-uej8eNh4.js";import"./Tile-lMrQctYw.js";import"./Tile-BrHfHitc.js";import"./common-0gNrjJbx.js";import"./TileRange-2Tc-Ry00.js";import"./LRUCache-CwUIRQIv.js";import"./tilecoord-DYaQ6NdW.js";import"./TileProperty-BF4LcWSy.js";function T(s,e){const n=`
    attribute vec2 ${g.TEXTURE_COORD};
    uniform mat4 ${r.TILE_TRANSFORM};
    uniform float ${r.TEXTURE_PIXEL_WIDTH};
    uniform float ${r.TEXTURE_PIXEL_HEIGHT};
    uniform float ${r.TEXTURE_RESOLUTION};
    uniform float ${r.TEXTURE_ORIGIN_X};
    uniform float ${r.TEXTURE_ORIGIN_Y};
    uniform float ${r.DEPTH};

    varying vec2 v_textureCoord;
    varying vec2 v_mapCoord;

    void main() {
      v_textureCoord = ${g.TEXTURE_COORD};
      v_mapCoord = vec2(
        ${r.TEXTURE_ORIGIN_X} + ${r.TEXTURE_RESOLUTION} * ${r.TEXTURE_PIXEL_WIDTH} * v_textureCoord[0],
        ${r.TEXTURE_ORIGIN_Y} - ${r.TEXTURE_RESOLUTION} * ${r.TEXTURE_PIXEL_HEIGHT} * v_textureCoord[1]
      );
      gl_Position = ${r.TILE_TRANSFORM} * vec4(${g.TEXTURE_COORD}, ${r.DEPTH}, 1.0);
    }
  `,t={...C(),bandCount:e},i=[];if(s.color!==void 0){const o=d(t,s.color,v);i.push(`color = ${o};`)}if(s.contrast!==void 0){const o=d(t,s.contrast,m);i.push(`color.rgb = clamp((${o} + 1.0) * color.rgb - (${o} / 2.0), vec3(0.0, 0.0, 0.0), vec3(1.0, 1.0, 1.0));`)}if(s.exposure!==void 0){const o=d(t,s.exposure,m);i.push(`color.rgb = clamp((${o} + 1.0) * color.rgb, vec3(0.0, 0.0, 0.0), vec3(1.0, 1.0, 1.0));`)}if(s.saturation!==void 0){const o=d(t,s.saturation,m);i.push(`
      float saturation = ${o} + 1.0;
      float sr = (1.0 - saturation) * 0.2126;
      float sg = (1.0 - saturation) * 0.7152;
      float sb = (1.0 - saturation) * 0.0722;
      mat3 saturationMatrix = mat3(
        sr + saturation, sr, sr,
        sg, sg + saturation, sg,
        sb, sb, sb + saturation
      );
      color.rgb = clamp(saturationMatrix * color.rgb, vec3(0.0, 0.0, 0.0), vec3(1.0, 1.0, 1.0));
    `)}if(s.gamma!==void 0){const o=d(t,s.gamma,m);i.push(`color.rgb = pow(color.rgb, vec3(1.0 / ${o}));`)}if(s.brightness!==void 0){const o=d(t,s.brightness,m);i.push(`color.rgb = clamp(color.rgb + ${o}, vec3(0.0, 0.0, 0.0), vec3(1.0, 1.0, 1.0));`)}const a={},c=Object.keys(t.variables).length;if(c>1&&!s.variables)throw new Error(`Missing variables in style (expected ${t.variables})`);for(let o=0;o<c;++o){const _=t.variables[Object.keys(t.variables)[o]];if(!(_.name in s.variables))throw new Error(`Missing '${_.name}' in style variables`);const p=b(_.name);a[p]=function(){let f=s.variables[_.name];return typeof f=="string"&&(f=x(f)),f!==void 0?f:-9999999}}const u=Object.keys(a).map(function(o){return`uniform float ${o};`}),h=Math.ceil(e/4);u.push(`uniform sampler2D ${r.TILE_TEXTURE_ARRAY}[${h}];`),t.paletteTextures&&u.push(`uniform sampler2D ${$}[${t.paletteTextures.length}];`);const l=Object.keys(t.functions).map(function(o){return t.functions[o]}),E=`
    #ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
    #else
    precision mediump float;
    #endif

    varying vec2 v_textureCoord;
    varying vec2 v_mapCoord;
    uniform vec4 ${r.RENDER_EXTENT};
    uniform float ${r.TRANSITION_ALPHA};
    uniform float ${r.TEXTURE_PIXEL_WIDTH};
    uniform float ${r.TEXTURE_PIXEL_HEIGHT};
    uniform float ${r.RESOLUTION};
    uniform float ${r.ZOOM};

    ${u.join(`
`)}

    ${l.join(`
`)}

    void main() {
      if (
        v_mapCoord[0] < ${r.RENDER_EXTENT}[0] ||
        v_mapCoord[1] < ${r.RENDER_EXTENT}[1] ||
        v_mapCoord[0] > ${r.RENDER_EXTENT}[2] ||
        v_mapCoord[1] > ${r.RENDER_EXTENT}[3]
      ) {
        discard;
      }

      vec4 color = texture2D(${r.TILE_TEXTURE_ARRAY}[0],  v_textureCoord);

      ${i.join(`
`)}

      gl_FragColor = color;
      gl_FragColor.rgb *= gl_FragColor.a;
      gl_FragColor *= ${r.TRANSITION_ALPHA};
    }`;return{vertexShader:n,fragmentShader:E,uniforms:a,paletteTextures:t.paletteTextures}}class N extends I{constructor(e){e=e?Object.assign({},e):{};const n=e.style||{};delete e.style,super(e),this.sources_=e.sources,this.renderedSource_=null,this.renderedResolution_=NaN,this.style_=n,this.styleVariables_=this.style_.variables||{},this.handleSourceUpdate_(),this.addChangeListener(R.SOURCE,this.handleSourceUpdate_)}getSources(e,n){const t=this.getSource();return this.sources_?typeof this.sources_=="function"?this.sources_(e,n):this.sources_:t?[t]:[]}getRenderSource(){return this.renderedSource_||this.getSource()}getSourceState(){const e=this.getRenderSource();return e?e.getState():"undefined"}handleSourceUpdate_(){this.hasRenderer()&&this.getRenderer().clearCache();const e=this.getSource();if(e)if(e.getState()==="loading"){const n=()=>{e.getState()==="ready"&&(e.removeEventListener("change",n),this.setStyle(this.style_))};e.addEventListener("change",n)}else this.setStyle(this.style_)}getSourceBandCount_(){const e=Number.MAX_SAFE_INTEGER,n=this.getSources([-e,-e,e,e],e);return n&&n.length&&"bandCount"in n[0]?n[0].bandCount:4}createRenderer(){const e=T(this.style_,this.getSourceBandCount_());return new S(this,{vertexShader:e.vertexShader,fragmentShader:e.fragmentShader,uniforms:e.uniforms,cacheSize:this.getCacheSize(),paletteTextures:e.paletteTextures})}renderSources(e,n){const t=this.getRenderer();let i;for(let a=0,c=n.length;a<c;++a)this.renderedSource_=n[a],t.prepareFrame(e)&&(i=t.renderFrame(e));return i}render(e,n){this.rendered=!0;const t=e.viewState,i=this.getSources(e.extent,t.resolution);let a=!0;for(let u=0,h=i.length;u<h;++u){const l=i[u],E=l.getState();if(E=="loading"){const o=()=>{l.getState()=="ready"&&(l.removeEventListener("change",o),this.changed())};l.addEventListener("change",o)}a=a&&E=="ready"}const c=this.renderSources(e,i);if(this.getRenderer().renderComplete&&a)return this.renderedResolution_=t.resolution,c;if(this.renderedResolution_>.5*t.resolution){const u=this.getSources(e.extent,this.renderedResolution_).filter(h=>!i.includes(h));if(u.length>0)return this.renderSources(e,u)}return c}setStyle(e){if(this.styleVariables_=e.variables||{},this.style_=e,this.hasRenderer()){const n=T(this.style_,this.getSourceBandCount_());this.getRenderer().reset({vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,uniforms:n.uniforms,paletteTextures:n.paletteTextures}),this.changed()}}updateStyleVariables(e){Object.assign(this.styleVariables_,e),this.changed()}}N.prototype.dispose;export{N as default};
//# sourceMappingURL=WebGLTile-83Cf7Pmu.js.map
