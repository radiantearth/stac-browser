import{cz as O}from"./index-D-0d7ZkT.js";import{a9 as L,ac as x,aZ as y,aY as S,ab as m,aX as b,aW as j,c8 as M,b1 as N,c9 as Z}from"./GeoJSON-D3ydzCqp.js";import{h as C,i as T,s as v,j as I,e as s,c as U,f as G,d as B,n as W,k as q,l as J,g as D,G as H,F as Y}from"./compileUtil-0JnFz3SY.js";function V(){return{"fill-color":"rgba(255,255,255,0.4)","stroke-color":"#3399CC","stroke-width":1.25,"circle-radius":5,"circle-fill-color":"rgba(255,255,255,0.4)","circle-stroke-width":1.25,"circle-stroke-color":"#3399CC"}}const A=.985;function lt(e){return e-X(e)}function X(e){return Math.fround(e)}const K=`
vec2 df_from(float value) {
  return vec2(value, 0.);
}

float df_float(vec2 df) {
  return df.x;
}

vec2 df_add(vec2 dfa, vec2 dfb) {
  vec2 dfc;
  float t1, t2, e;
  
  t1 = dfa.x * u_one + dfb.x * u_one;
  e = t1 * u_one - dfa.x * u_one;
  t2 = ((dfb.x - e) + (dfa.x - (t1 - e))) * u_one + dfa.y + dfb.y * u_one;
  
  dfc.x = t1 * u_one + t2 * u_one;
  dfc.y = t2 - (dfc.x - t1) * u_one;
  return dfc;
}

vec2 df_sub(vec2 dfa, vec2 dfb) {
  vec2 dfc;
  float e, t1, t2;
  
  t1 = dfa.x - dfb.x;
  e = t1 - dfa.x;
  t2 = ((-dfb.x - e) + (dfa.x - (t1 - e))) + dfa.y - dfb.y;
  
  dfc.x = t1 + t2;
  dfc.y = t2 - (dfc.x - t1);
  return dfc;
}

vec2 df_mul(vec2 dfa, vec2 dfb) {
  vec2 dfc;
  float c11, c21, c2, e, t1, t2;
  float a1, a2, b1, b2, cona, conb, split = 4097.;

  cona = dfa.x * split * u_one;
  conb = dfb.x * split * u_one;
  a1 = cona * u_one - (cona - dfa.x);
  b1 = conb * u_one - (conb - dfb.x);
  a2 = dfa.x * u_one - a1;
  b2 = dfb.x * u_one - b1 * u_one;

  c11 = dfa.x * u_one * dfb.x * u_one;
  c21 = a2 * b2 * u_one + (a2 * b1 + (a1 * b2 + (a1 * b1 - c11))) * u_one;

  c2 = dfa.x * dfb.y * u_one + dfa.y * dfb.x * u_one;

  t1 = c11 + c2 * u_one;
  e = t1 - c11 * u_one;
  t2 = dfa.y * dfb.y * u_one + ((c2 - e) + (c11 - (t1 - e))) + c21 * u_one;

  dfc.x = t1 * u_one + t2 * u_one;
  dfc.y = t2 - (dfc.x - t1) * u_one;

  return dfc;
}

vec2 df_div(vec2 dfa, vec2 dfb) {
  vec2 dfc;
  float c11, c21, c2, e, t1, t2, t11, t12, t21, t22;
  float a1, a2, b1, b2, cona, conb, split = 4097.;
  float s1, s2;
  
  s1 = dfa.x / dfb.x * u_one;
  cona = s1 * split * u_one;
  conb = dfb.x * split * u_one;
  a1 = cona - (cona - s1) * u_one;
  b1 = conb - (conb - dfb.x) * u_one;
  a2 = s1 - a1 * u_one;
  b2 = dfb.x - b1 * u_one;
  
  c11 = s1 * dfb.x * u_one;
  c21 = (((a1 * b1 - c11) + a1 * b2) + a2 * b1) + a2 * b2 * u_one;
  
  c2 = s1 * dfb.y * u_one;
  
  t1 = c11 + c2 * u_one;
  e  = t1 - c11 * u_one;
  t2 = ((c2 - e) + (c11 - (t1 - e))) + c21 * u_one;
  
  t12 = t1 + t2 * u_one;
  t22 = t2 - (t12 - t1) * u_one;
  
  t11 = dfa.x - t12 * u_one;
  e   = t11 - dfa.x * u_one;
  t21 = ((-t12 - e) + (dfa.x - (t11 - e))) + dfa.y - t22 * u_one;
  
  s2 = (t11 + t21) / dfb.x * u_one;
  
  dfc.x = s1 + s2 * u_one;
  dfc.y = s2 - (dfc.x - s1) * u_one;
  
  return dfc;
}

float df_mod(vec2 df, vec2 m) {
  vec2 q = df_div(df, m) * u_one;
  float qf = floor(q.x);
  float frac = q.x - qf + q.y * u_one;
  if (frac < 0.0) qf -= 1.0;
  if (frac >= 1.0) qf += 1.0;
  vec2 prod = df_mul(df_from(qf), m);
  vec2 rem = df_add(df_from(df.x), df_from(-prod.x)) * u_one;
  rem.y += df.y - prod.y;
  return rem.x + rem.y * u_one;
}
`,P=`#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform float u_one;
uniform mat4 u_projectionMatrix;
uniform mat4 u_invertProjectionMatrix;
uniform vec2 u_viewportSizePx;
uniform float u_pixelRatio;
uniform float u_globalAlpha;
uniform float u_time;
uniform float u_zoom;
uniform float u_resolution;
uniform float u_rotation;
uniform vec4 u_renderExtent;
uniform float u_depth;
uniform mediump int u_hitDetection;

// these 64-bits floats are split into high/low
uniform vec2 u_df_patternOriginX;
uniform vec2 u_df_patternOriginY;
uniform vec2 u_df_patternScaleRatio;

const float PI = 3.141592653589793238;
const float TWO_PI = 2.0 * PI;
float currentLineMetric = 0.; // an actual value will be used in the stroke shaders

vec2 pxToWorld(vec2 pxPos) {
  vec2 screenPos = 2.0 * pxPos / u_viewportSizePx - 1.0;
  return (u_invertProjectionMatrix * vec4(screenPos, 0.0, 1.0)).xy;
}

vec2 worldToPx(vec2 worldPos) {
  vec4 screenPos = u_projectionMatrix * vec4(worldPos, 0.0, 1.0);
  return (0.5 * screenPos.xy + 0.5) * u_viewportSizePx;
}
${I}
${K}
`,E=V();class Q{constructor(){this.uniforms_=[],this.attributes_=[],this.hasSymbol_=!1,this.symbolSizeExpression_=`vec2(${C(E["circle-radius"])} + ${C(E["circle-stroke-width"]*.5)})`,this.symbolRotationExpression_="0.0",this.symbolOffsetExpression_="vec2(0.0)",this.symbolColorExpression_=T(E["circle-fill-color"]),this.texCoordExpression_="vec4(0.0, 0.0, 1.0, 1.0)",this.fragmentDiscardExpression_=null,this.shapeDiscardExpression_=null,this.symbolRotateWithView_=!1,this.hasStroke_=!1,this.strokeWidthExpression_=C(E["stroke-width"]),this.strokeColorExpression_=T(E["stroke-color"]),this.strokeOffsetExpression_="0.",this.strokeCapExpression_=v("round"),this.strokeJoinExpression_=v("round"),this.strokeMiterLimitExpression_="10.",this.strokeDistanceFieldExpression_="-1000.",this.strokePatternLengthExpression_=null,this.hasFill_=!1,this.fillColorExpression_=T(E["fill-color"]),this.fillPatternSizeExpression_=null,this.vertexShaderFunctions_=[],this.fragmentShaderFunctions_=[]}addUniform(t,r){return this.uniforms_.push({name:t,type:r}),this}addAttribute(t,r,n,i){return this.attributes_.push({name:t,type:r,varyingName:t.replace(/^a_/,"v_"),varyingType:i??r,varyingExpression:n??t}),this}setSymbolSizeExpression(t){return this.hasSymbol_=!0,this.symbolSizeExpression_=t,this}getSymbolSizeExpression(){return this.symbolSizeExpression_}setSymbolRotationExpression(t){return this.symbolRotationExpression_=t,this}setSymbolOffsetExpression(t){return this.symbolOffsetExpression_=t,this}getSymbolOffsetExpression(){return this.symbolOffsetExpression_}setSymbolColorExpression(t){return this.hasSymbol_=!0,this.symbolColorExpression_=t,this}getSymbolColorExpression(){return this.symbolColorExpression_}setTextureCoordinateExpression(t){return this.texCoordExpression_=t,this}setFragmentDiscardExpression(t){return this.fragmentDiscardExpression_=t,this}getFragmentDiscardExpression(){return this.fragmentDiscardExpression_}setShapeDiscardExpression(t){return this.shapeDiscardExpression_=t,this}getShapeDiscardExpression(){return this.shapeDiscardExpression_}setSymbolRotateWithView(t){return this.symbolRotateWithView_=t,this}setStrokeWidthExpression(t){return this.hasStroke_=!0,this.strokeWidthExpression_=t,this}setStrokeColorExpression(t){return this.hasStroke_=!0,this.strokeColorExpression_=t,this}getStrokeColorExpression(){return this.strokeColorExpression_}setStrokeOffsetExpression(t){return this.strokeOffsetExpression_=t,this}setStrokeCapExpression(t){return this.strokeCapExpression_=t,this}setStrokeJoinExpression(t){return this.strokeJoinExpression_=t,this}setStrokeMiterLimitExpression(t){return this.strokeMiterLimitExpression_=t,this}setStrokeDistanceFieldExpression(t){return this.strokeDistanceFieldExpression_=t,this}setStrokePatternLengthExpression(t){return this.strokePatternLengthExpression_=t,this}getStrokePatternLengthExpression(){return this.strokePatternLengthExpression_}setFillColorExpression(t){return this.hasFill_=!0,this.fillColorExpression_=t,this}getFillColorExpression(){return this.fillColorExpression_}setFillPatternSizeExpression(t){return this.fillPatternSizeExpression_=t,this}getFillPatternSizeExpression(){return this.fillPatternSizeExpression_}addVertexShaderFunction(t){return this.vertexShaderFunctions_.includes(t)?this:(this.vertexShaderFunctions_.push(t),this)}addFragmentShaderFunction(t){return this.fragmentShaderFunctions_.includes(t)?this:(this.fragmentShaderFunctions_.push(t),this)}getSymbolVertexShader(){return this.hasSymbol_?`${P}
${this.uniforms_.map(t=>`uniform ${t.type} ${t.name};`).join(`
`)}
attribute vec2 a_position;
attribute vec2 a_localPosition;
attribute vec2 a_hitColor;

varying vec2 v_texCoord;
varying vec2 v_quadCoord;
varying vec4 v_hitColor;
varying vec2 v_centerPx;
varying float v_angle;
varying vec2 v_quadSizePx;

${this.attributes_.map(t=>`attribute ${t.type} ${t.name};
varying ${t.varyingType} ${t.varyingName};`).join(`
`)}
${this.vertexShaderFunctions_.join(`
`)}
vec2 pxToScreen(vec2 coordPx) {
  vec2 scaled = coordPx / u_viewportSizePx / 0.5;
  return scaled;
}

vec2 screenToPx(vec2 coordScreen) {
  return (coordScreen * 0.5 + 0.5) * u_viewportSizePx;
}

void main(void) {
  v_quadSizePx = ${this.symbolSizeExpression_};
  vec2 halfSizePx = v_quadSizePx * 0.5;
  vec2 centerOffsetPx = ${this.symbolOffsetExpression_};
  vec2 offsetPx = centerOffsetPx + a_localPosition * halfSizePx * vec2(1., -1.);
  float angle = ${this.symbolRotationExpression_}${this.symbolRotateWithView_?" + u_rotation":""};
  float c = cos(-angle);
  float s = sin(-angle);
  offsetPx = vec2(c * offsetPx.x - s * offsetPx.y, s * offsetPx.x + c * offsetPx.y);
  vec4 center = u_projectionMatrix * vec4(a_position, 0.0, 1.0);
  gl_Position = center + vec4(pxToScreen(offsetPx), u_depth, 0.);
  vec4 texCoord = ${this.texCoordExpression_};
  float u = mix(texCoord.s, texCoord.p, a_localPosition.x * 0.5 + 0.5);
  float v = mix(texCoord.t, texCoord.q, a_localPosition.y * 0.5 + 0.5);
  v_texCoord = vec2(u, v);
  v_hitColor = unpackColor(a_hitColor);
  v_angle = angle;
  c = cos(-v_angle);
  s = sin(-v_angle);
  centerOffsetPx = vec2(c * centerOffsetPx.x - s * centerOffsetPx.y, s * centerOffsetPx.x + c * centerOffsetPx.y);
  v_centerPx = screenToPx(center.xy) + centerOffsetPx;
${this.attributes_.map(t=>`  ${t.varyingName} = ${t.varyingExpression};`).join(`
`)}
${this.shapeDiscardExpression_?`  if (${this.shapeDiscardExpression_}) { gl_Position = vec4(2.0, 2.0, 0.0, 0.0); }`:""}
}`:null}getSymbolFragmentShader(){return this.hasSymbol_?`${P}
${this.uniforms_.map(t=>`uniform ${t.type} ${t.name};`).join(`
`)}
varying vec2 v_texCoord;
varying vec4 v_hitColor;
varying vec2 v_centerPx;
varying float v_angle;
varying vec2 v_quadSizePx;
${this.attributes_.map(t=>`varying ${t.varyingType} ${t.varyingName};`).join(`
`)}
${this.fragmentShaderFunctions_.join(`
`)}

void main(void) {
${this.attributes_.map(t=>`  ${t.varyingType} ${t.name} = ${t.varyingName}; // assign to original attribute name`).join(`
`)}
${this.fragmentDiscardExpression_?`  if (${this.fragmentDiscardExpression_}) { discard; }`:""}
  vec2 coordsPx = gl_FragCoord.xy / u_pixelRatio - v_centerPx; // relative to center
  float c = cos(v_angle);
  float s = sin(v_angle);
  coordsPx = vec2(c * coordsPx.x - s * coordsPx.y, s * coordsPx.x + c * coordsPx.y);
  gl_FragColor = ${this.symbolColorExpression_};
  gl_FragColor.rgb *= gl_FragColor.a;
  if (u_hitDetection > 0) {
    if (gl_FragColor.a < 0.05) { discard; };
    gl_FragColor = v_hitColor;
  }
}`:null}getStrokeVertexShader(){return this.hasStroke_?`${P}
${this.uniforms_.map(t=>`uniform ${t.type} ${t.name};`).join(`
`)}
attribute vec2 a_segmentStart;
attribute vec2 a_segmentEnd;
attribute vec2 a_localPosition;
attribute float a_measureStart;
attribute float a_measureEnd;
attribute float a_angleTangentSum;
attribute float a_distanceLow;
attribute float a_distanceHigh;
attribute vec2 a_joinAngles;
attribute vec2 a_hitColor;

varying vec2 v_segmentStartPx;
varying vec2 v_segmentEndPx;
varying float v_angleStart;
varying float v_angleEnd;
varying float v_width;
varying vec4 v_hitColor;
varying float v_distancePx;
varying float v_measureStart;
varying float v_measureEnd;

${this.attributes_.map(t=>`attribute ${t.type} ${t.name};
varying ${t.varyingType} ${t.varyingName};`).join(`
`)}
${this.vertexShaderFunctions_.join(`
`)}

vec4 pxToScreen(vec2 pxPos) {
  vec2 screenPos = 2.0 * pxPos / u_viewportSizePx - 1.0;
  return vec4(screenPos, u_depth, 1.0);
}

bool isCap(float joinAngle) {
  return joinAngle < -0.1;
}

vec2 getJoinOffsetDirection(vec2 normalPx, float joinAngle) {
  float halfAngle = joinAngle / 2.0;
  float c = cos(halfAngle);
  float s = sin(halfAngle);
  vec2 angleBisectorNormal = vec2(s * normalPx.x + c * normalPx.y, -c * normalPx.x + s * normalPx.y);
  float length = 1.0 / s;
  return angleBisectorNormal * length;
}

vec2 getOffsetPoint(vec2 point, vec2 normal, float joinAngle, float offsetPx) {
  // if on a cap or the join angle is too high, offset the line along the segment normal
  if (cos(joinAngle) > 0.998 || isCap(joinAngle)) {
    return point - normal * offsetPx;
  }
  // offset is applied along the inverted normal (positive offset goes "right" relative to line direction)
  return point - getJoinOffsetDirection(normal, joinAngle) * offsetPx;
}

void main(void) {
  v_angleStart = a_joinAngles.x;
  v_angleEnd = a_joinAngles.y;
  float startEndRatio = a_localPosition.x * 0.5 + 0.5;
  currentLineMetric = mix(a_measureStart, a_measureEnd, startEndRatio);
  // we're reading the fractional part while keeping the sign (so -4.12 gives -0.12, 3.45 gives 0.45)

  float lineWidth = ${this.strokeWidthExpression_};
  float lineOffsetPx = ${this.strokeOffsetExpression_};

  // compute segment start/end in px with offset
  vec2 segmentStartPx = worldToPx(a_segmentStart);
  vec2 segmentEndPx = worldToPx(a_segmentEnd);
  vec2 tangentPx = normalize(segmentEndPx - segmentStartPx);
  vec2 normalPx = vec2(-tangentPx.y, tangentPx.x);
  segmentStartPx = getOffsetPoint(segmentStartPx, normalPx, v_angleStart, lineOffsetPx),
  segmentEndPx = getOffsetPoint(segmentEndPx, normalPx, v_angleEnd, lineOffsetPx);

  // compute current vertex position
  float normalDir = -1. * a_localPosition.y;
  float tangentDir = -1. * a_localPosition.x;
  float angle = mix(v_angleStart, v_angleEnd, startEndRatio);
  vec2 joinDirection;
  vec2 positionPx = mix(segmentStartPx, segmentEndPx, startEndRatio);
  // if angle is too high, do not make a proper join
  if (cos(angle) > ${A} || isCap(angle)) {
    joinDirection = normalPx * normalDir - tangentPx * tangentDir;
  } else {
    joinDirection = getJoinOffsetDirection(normalPx * normalDir, angle);
  }
  positionPx = positionPx + joinDirection * (lineWidth * 0.5 + 1.); // adding 1 pixel for antialiasing
  gl_Position = pxToScreen(positionPx);

  v_segmentStartPx = segmentStartPx;
  v_segmentEndPx = segmentEndPx;
  v_width = lineWidth;
  v_hitColor = unpackColor(a_hitColor);

  v_distancePx = a_distanceLow / u_resolution - (lineOffsetPx * a_angleTangentSum);
  float distanceHighPx = a_distanceHigh / u_resolution;
  ${this.strokePatternLengthExpression_!==null?`v_distancePx = mod(v_distancePx, ${this.strokePatternLengthExpression_});
  distanceHighPx = mod(distanceHighPx, ${this.strokePatternLengthExpression_});
  `:""}v_distancePx += distanceHighPx;

  v_measureStart = a_measureStart;
  v_measureEnd = a_measureEnd;
${this.attributes_.map(t=>`  ${t.varyingName} = ${t.varyingExpression};`).join(`
`)}
${this.shapeDiscardExpression_?`  if (${this.shapeDiscardExpression_}) { gl_Position = vec4(2.0, 2.0, 0.0, 0.0); }`:""}
}`:null}getStrokeFragmentShader(){return this.hasStroke_?`${P}
${this.uniforms_.map(t=>`uniform ${t.type} ${t.name};`).join(`
`)}
varying vec2 v_segmentStartPx;
varying vec2 v_segmentEndPx;
varying float v_angleStart;
varying float v_angleEnd;
varying float v_width;
varying vec4 v_hitColor;
varying float v_distancePx;
varying float v_measureStart;
varying float v_measureEnd;
${this.attributes_.map(t=>`varying ${t.varyingType} ${t.varyingName};`).join(`
`)}
${this.fragmentShaderFunctions_.join(`
`)}

bool isCap(float joinAngle) {
  return joinAngle < -0.1;
}

float segmentDistanceField(vec2 point, vec2 start, vec2 end, float width) {
  vec2 tangent = normalize(end - start);
  vec2 normal = vec2(-tangent.y, tangent.x);
  vec2 startToPoint = point - start;
  return abs(dot(startToPoint, normal)) - width * 0.5;
}

float buttCapDistanceField(vec2 point, vec2 start, vec2 end) {
  vec2 startToPoint = point - start;
  vec2 tangent = normalize(end - start);
  return dot(startToPoint, -tangent);
}

float squareCapDistanceField(vec2 point, vec2 start, vec2 end, float width) {
  return buttCapDistanceField(point, start, end) - width * 0.5;
}

float roundCapDistanceField(vec2 point, vec2 start, vec2 end, float width) {
  float onSegment = max(0., 1000. * dot(point - start, end - start)); // this is very high when inside the segment
  return length(point - start) - width * 0.5 - onSegment;
}

float roundJoinDistanceField(vec2 point, vec2 start, vec2 end, float width) {
  return roundCapDistanceField(point, start, end, width);
}

float bevelJoinField(vec2 point, vec2 start, vec2 end, float width, float joinAngle) {
  vec2 startToPoint = point - start;
  vec2 tangent = normalize(end - start);
  float c = cos(joinAngle * 0.5);
  float s = sin(joinAngle * 0.5);
  float direction = -sign(sin(joinAngle));
  vec2 bisector = vec2(c * tangent.x - s * tangent.y, s * tangent.x + c * tangent.y);
  float radius = width * 0.5 * s;
  return dot(startToPoint, bisector * direction) - radius;
}

float miterJoinDistanceField(vec2 point, vec2 start, vec2 end, float width, float joinAngle) {
  if (cos(joinAngle) > ${A}) { // avoid risking a division by zero
    return bevelJoinField(point, start, end, width, joinAngle);
  }
  float miterLength = 1. / sin(joinAngle * 0.5);
  float miterLimit = ${this.strokeMiterLimitExpression_};
  if (miterLength > miterLimit) {
    return bevelJoinField(point, start, end, width, joinAngle);
  }
  return -1000.;
}

float capDistanceField(vec2 point, vec2 start, vec2 end, float width, float capType) {
   if (capType == ${v("butt")}) {
    return buttCapDistanceField(point, start, end);
  } else if (capType == ${v("square")}) {
    return squareCapDistanceField(point, start, end, width);
  }
  return roundCapDistanceField(point, start, end, width);
}

float joinDistanceField(vec2 point, vec2 start, vec2 end, float width, float joinAngle, float joinType) {
  if (joinType == ${v("bevel")}) {
    return bevelJoinField(point, start, end, width, joinAngle);
  } else if (joinType == ${v("miter")}) {
    return miterJoinDistanceField(point, start, end, width, joinAngle);
  }
  return roundJoinDistanceField(point, start, end, width);
}

float computeSegmentPointDistance(vec2 point, vec2 start, vec2 end, float width, float joinAngle, float capType, float joinType) {
  if (isCap(joinAngle)) {
    return capDistanceField(point, start, end, width, capType);
  }
  return joinDistanceField(point, start, end, width, joinAngle, joinType);
}

float distanceFromSegment(vec2 point, vec2 start, vec2 end) {
  vec2 tangent = end - start;
  vec2 startToPoint = point - start;
  // inspire by capsule fn in https://iquilezles.org/articles/distfunctions/
  float h = clamp(dot(startToPoint, tangent) / dot(tangent, tangent), 0.0, 1.0);
  return length(startToPoint - tangent * h);
}

void main(void) {
${this.attributes_.map(t=>`  ${t.varyingType} ${t.name} = ${t.varyingName}; // assign to original attribute name`).join(`
`)}

  vec2 currentPointPx = gl_FragCoord.xy / u_pixelRatio;
  vec2 worldPos = pxToWorld(currentPointPx);
  if (
    abs(u_renderExtent[0] - u_renderExtent[2]) > 0.0 && (
      worldPos[0] < u_renderExtent[0] ||
      worldPos[1] < u_renderExtent[1] ||
      worldPos[0] > u_renderExtent[2] ||
      worldPos[1] > u_renderExtent[3]
    )
  ) {
    discard;
  }

  float segmentLengthPx = length(v_segmentEndPx - v_segmentStartPx);
  segmentLengthPx = max(segmentLengthPx, 1.17549429e-38); // avoid divide by zero
  vec2 segmentTangent = (v_segmentEndPx - v_segmentStartPx) / segmentLengthPx;
  vec2 segmentNormal = vec2(-segmentTangent.y, segmentTangent.x);
  vec2 startToPointPx = currentPointPx - v_segmentStartPx;
  float lengthToPointPx = max(0., min(dot(segmentTangent, startToPointPx), segmentLengthPx));
  float currentLengthPx = lengthToPointPx + v_distancePx;
  float currentRadiusPx = distanceFromSegment(currentPointPx, v_segmentStartPx, v_segmentEndPx);
  float currentRadiusRatio = dot(segmentNormal, startToPointPx) * 2. / v_width;
  currentLineMetric = mix(v_measureStart, v_measureEnd, lengthToPointPx / segmentLengthPx);

${this.fragmentDiscardExpression_?`  if (${this.fragmentDiscardExpression_}) { discard; }`:""}

  float capType = ${this.strokeCapExpression_};
  float joinType = ${this.strokeJoinExpression_};
  float segmentStartDistance = computeSegmentPointDistance(currentPointPx, v_segmentStartPx, v_segmentEndPx, v_width, v_angleStart, capType, joinType);
  float segmentEndDistance = computeSegmentPointDistance(currentPointPx, v_segmentEndPx, v_segmentStartPx, v_width, v_angleEnd, capType, joinType);
  float distanceField = max(
    segmentDistanceField(currentPointPx, v_segmentStartPx, v_segmentEndPx, v_width),
    max(segmentStartDistance, segmentEndDistance)
  );
  distanceField = max(distanceField, ${this.strokeDistanceFieldExpression_});

  vec4 color = ${this.strokeColorExpression_};
  color.a *= smoothstep(0.5, -0.5, distanceField);
  gl_FragColor = color;
  gl_FragColor.a *= u_globalAlpha;
  gl_FragColor.rgb *= gl_FragColor.a;
  if (u_hitDetection > 0) {
    if (gl_FragColor.a < 0.1) { discard; };
    gl_FragColor = v_hitColor;
  }
}`:null}getFillVertexShader(){return this.hasFill_?`${P}
${this.uniforms_.map(t=>`uniform ${t.type} ${t.name};`).join(`
`)}
attribute vec2 a_position;
attribute vec2 a_hitColor;

varying vec4 v_hitColor;
varying vec2 v_patternOriginPx;
varying vec2 v_patternSizePx;

${this.attributes_.map(t=>`attribute ${t.type} ${t.name};
varying ${t.varyingType} ${t.varyingName};`).join(`
`)}
${this.vertexShaderFunctions_.join(`
`)}
void main(void) {
  gl_Position = u_projectionMatrix * vec4(a_position, u_depth, 1.0);
  v_hitColor = unpackColor(a_hitColor);
${this.fillPatternSizeExpression_!==null?`
  // this computes the pattern offset in screenspace using double-float arithmetics
  v_patternSizePx = ${this.fillPatternSizeExpression_};
  vec2 patternSizeScaledX = df_mul(df_from(v_patternSizePx.x), u_df_patternScaleRatio);
  vec2 patternSizeScaledY = df_mul(df_from(v_patternSizePx.y), u_df_patternScaleRatio);
  v_patternOriginPx = vec2(
    df_mod(u_df_patternOriginX, patternSizeScaledX),
    df_mod(u_df_patternOriginY, patternSizeScaledY)
  );

  // reapply rotation to the pattern origin
  v_patternOriginPx -= u_viewportSizePx / 2.; // translate to viewport center
  v_patternOriginPx = vec2(
    cos(-u_rotation) * v_patternOriginPx.x - sin(-u_rotation) * v_patternOriginPx.y,
    sin(-u_rotation) * v_patternOriginPx.x + cos(-u_rotation) * v_patternOriginPx.y
  );
  v_patternOriginPx += u_viewportSizePx / 2.; // translate back
`:"  v_patternOriginPx = vec2(0.);"}
${this.attributes_.map(t=>`  ${t.varyingName} = ${t.varyingExpression};`).join(`
`)}
${this.shapeDiscardExpression_?`  if (${this.shapeDiscardExpression_}) { gl_Position = vec4(2.0, 2.0, 0.0, 0.0); }`:""}
}`:null}getFillFragmentShader(){return this.hasFill_?`${P}
${this.uniforms_.map(t=>`uniform ${t.type} ${t.name};`).join(`
`)}
varying vec4 v_hitColor;
varying vec2 v_patternOriginPx;
varying vec2 v_patternSizePx;
${this.attributes_.map(t=>`varying ${t.varyingType} ${t.varyingName};`).join(`
`)}
${this.fragmentShaderFunctions_.join(`
`)}

void main(void) {
${this.attributes_.map(t=>`  ${t.varyingType} ${t.name} = ${t.varyingName}; // assign to original attribute name`).join(`
`)}
  vec2 pxPos = gl_FragCoord.xy / u_pixelRatio;
  vec2 worldPos = pxToWorld(pxPos);
  if (
    abs(u_renderExtent[0] - u_renderExtent[2]) > 0.0 && (
      worldPos[0] < u_renderExtent[0] ||
      worldPos[1] < u_renderExtent[1] ||
      worldPos[0] > u_renderExtent[2] ||
      worldPos[1] > u_renderExtent[3]
    )
  ) {
    discard;
  }
${this.fragmentDiscardExpression_?`  if (${this.fragmentDiscardExpression_}) { discard; }`:""}
  gl_FragColor = ${this.fillColorExpression_};
  gl_FragColor.a *= u_globalAlpha;
  gl_FragColor.rgb *= gl_FragColor.a;
  if (u_hitDetection > 0) {
    if (gl_FragColor.a < 0.1) { discard; };
    gl_FragColor = v_hitColor;
  }
}`:null}}function ct(){const e='function t(t,n,x=2){const o=n&&n.length,i=o?n[0]*x:t.length;let f=e(t,0,i,x,!0);const l=[];if(!f||f.next===f.prev)return l;let c,y,h;if(o&&(f=function(t,n,r,x){const o=[];for(let r=0,i=n.length;r<i;r++){const f=e(t,n[r]*x,r<i-1?n[r+1]*x:t.length,x,!1);f===f.next&&(f.steiner=!0),o.push(a(f))}o.sort(u);for(let t=0;t<o.length;t++)r=s(o[t],r);return r}(t,n,f,x)),t.length>80*x){c=t[0],y=t[1];let e=c,n=y;for(let r=x;r<i;r+=x){const x=t[r],o=t[r+1];x<c&&(c=x),o<y&&(y=o),x>e&&(e=x),o>n&&(n=o)}h=Math.max(e-c,n-y),h=0!==h?32767/h:0}return r(f,l,x,c,y,h,0),l}function e(t,e,n,r,x){let o;if(x===function(t,e,n,r){let x=0;for(let o=e,i=n-r;o<n;o+=r)x+=(t[i]-t[o])*(t[o+1]+t[i+1]),i=o;return x}(t,e,n,r)>0)for(let x=e;x<n;x+=r)o=d(x/r|0,t[x],t[x+1],o);else for(let x=n-r;x>=e;x-=r)o=d(x/r|0,t[x],t[x+1],o);return o&&b(o,o.next)&&(w(o),o=o.next),o}function n(t,e){if(!t)return t;e||(e=t);let n,r=t;do{if(n=!1,r.steiner||!b(r,r.next)&&0!==v(r.prev,r,r.next))r=r.next;else{if(w(r),r=e=r.prev,r===r.next)break;n=!0}}while(n||r!==e);return e}function r(t,e,u,s,l,a,y){if(!t)return;!y&&a&&function(t,e,n,r){let x=t;do{0===x.z&&(x.z=c(x.x,x.y,e,n,r)),x.prevZ=x.prev,x.nextZ=x.next,x=x.next}while(x!==t);x.prevZ.nextZ=null,x.prevZ=null,function(t){let e,n=1;do{let r,x=t;t=null;let o=null;for(e=0;x;){e++;let i=x,f=0;for(let t=0;t<n&&(f++,i=i.nextZ,i);t++);let u=n;for(;f>0||u>0&&i;)0!==f&&(0===u||!i||x.z<=i.z)?(r=x,x=x.nextZ,f--):(r=i,i=i.nextZ,u--),o?o.nextZ=r:t=r,r.prevZ=o,o=r;x=i}o.nextZ=null,n*=2}while(e>1)}(x)}(t,s,l,a);let h=t;for(;t.prev!==t.next;){const c=t.prev,p=t.next;if(a?o(t,s,l,a):x(t))e.push(c.i,t.i,p.i),w(t),t=p.next,h=p.next;else if((t=p)===h){y?1===y?r(t=i(n(t),e),e,u,s,l,a,2):2===y&&f(t,e,u,s,l,a):r(n(t),e,u,s,l,a,1);break}}}function x(t){const e=t.prev,n=t,r=t.next;if(v(e,n,r)>=0)return!1;const x=e.x,o=n.x,i=r.x,f=e.y,u=n.y,s=r.y,l=Math.min(x,o,i),c=Math.min(f,u,s),a=Math.max(x,o,i),y=Math.max(f,u,s);let p=r.next;for(;p!==e;){if(p.x>=l&&p.x<=a&&p.y>=c&&p.y<=y&&h(x,f,o,u,i,s,p.x,p.y)&&v(p.prev,p,p.next)>=0)return!1;p=p.next}return!0}function o(t,e,n,r){const x=t.prev,o=t,i=t.next;if(v(x,o,i)>=0)return!1;const f=x.x,u=o.x,s=i.x,l=x.y,a=o.y,y=i.y,p=Math.min(f,u,s),b=Math.min(l,a,y),M=Math.max(f,u,s),m=Math.max(l,a,y),A=c(p,b,e,n,r),g=c(M,m,e,n,r);let Z=t.prevZ,d=t.nextZ;for(;Z&&Z.z>=A&&d&&d.z<=g;){if(Z.x>=p&&Z.x<=M&&Z.y>=b&&Z.y<=m&&Z!==x&&Z!==i&&h(f,l,u,a,s,y,Z.x,Z.y)&&v(Z.prev,Z,Z.next)>=0)return!1;if(Z=Z.prevZ,d.x>=p&&d.x<=M&&d.y>=b&&d.y<=m&&d!==x&&d!==i&&h(f,l,u,a,s,y,d.x,d.y)&&v(d.prev,d,d.next)>=0)return!1;d=d.nextZ}for(;Z&&Z.z>=A;){if(Z.x>=p&&Z.x<=M&&Z.y>=b&&Z.y<=m&&Z!==x&&Z!==i&&h(f,l,u,a,s,y,Z.x,Z.y)&&v(Z.prev,Z,Z.next)>=0)return!1;Z=Z.prevZ}for(;d&&d.z<=g;){if(d.x>=p&&d.x<=M&&d.y>=b&&d.y<=m&&d!==x&&d!==i&&h(f,l,u,a,s,y,d.x,d.y)&&v(d.prev,d,d.next)>=0)return!1;d=d.nextZ}return!0}function i(t,e){let r=t;do{const n=r.prev,x=r.next.next;!b(n,x)&&M(n,r,r.next,x)&&g(n,x)&&g(x,n)&&(e.push(n.i,r.i,x.i),w(r),w(r.next),r=t=x),r=r.next}while(r!==t);return n(r)}function f(t,e,x,o,i,f){let u=t;do{let t=u.next.next;for(;t!==u.prev;){if(u.i!==t.i&&p(u,t)){let s=Z(u,t);return u=n(u,u.next),s=n(s,s.next),r(u,e,x,o,i,f,0),void r(s,e,x,o,i,f,0)}t=t.next}u=u.next}while(u!==t)}function u(t,e){let n=t.x-e.x;if(0===n&&(n=t.y-e.y,0===n)){n=(t.next.y-t.y)/(t.next.x-t.x)-(e.next.y-e.y)/(e.next.x-e.x)}return n}function s(t,e){const r=function(t,e){let n=e;const r=t.x,x=t.y;let o,i=-1/0;if(b(t,n))return n;do{if(b(t,n.next))return n.next;if(x<=n.y&&x>=n.next.y&&n.next.y!==n.y){const t=n.x+(x-n.y)*(n.next.x-n.x)/(n.next.y-n.y);if(t<=r&&t>i&&(i=t,o=n.x<n.next.x?n:n.next,t===r))return o}n=n.next}while(n!==e);if(!o)return null;const f=o,u=o.x,s=o.y;let c=1/0;n=o;do{if(r>=n.x&&n.x>=u&&r!==n.x&&y(x<s?r:i,x,u,s,x<s?i:r,x,n.x,n.y)){const e=Math.abs(x-n.y)/(r-n.x);g(n,t)&&(e<c||e===c&&(n.x>o.x||n.x===o.x&&l(o,n)))&&(o=n,c=e)}n=n.next}while(n!==f);return o}(t,e);if(!r)return e;const x=Z(r,t);return n(x,x.next),n(r,r.next)}function l(t,e){return v(t.prev,t,e.prev)<0&&v(e.next,t,t.next)<0}function c(t,e,n,r,x){return(t=1431655765&((t=858993459&((t=252645135&((t=16711935&((t=(t-n)*x|0)|t<<8))|t<<4))|t<<2))|t<<1))|(e=1431655765&((e=858993459&((e=252645135&((e=16711935&((e=(e-r)*x|0)|e<<8))|e<<4))|e<<2))|e<<1))<<1}function a(t){let e=t,n=t;do{(e.x<n.x||e.x===n.x&&e.y<n.y)&&(n=e),e=e.next}while(e!==t);return n}function y(t,e,n,r,x,o,i,f){return(x-i)*(e-f)>=(t-i)*(o-f)&&(t-i)*(r-f)>=(n-i)*(e-f)&&(n-i)*(o-f)>=(x-i)*(r-f)}function h(t,e,n,r,x,o,i,f){return!(t===i&&e===f)&&y(t,e,n,r,x,o,i,f)}function p(t,e){return t.next.i!==e.i&&t.prev.i!==e.i&&!function(t,e){let n=t;do{if(n.i!==t.i&&n.next.i!==t.i&&n.i!==e.i&&n.next.i!==e.i&&M(n,n.next,t,e))return!0;n=n.next}while(n!==t);return!1}(t,e)&&(g(t,e)&&g(e,t)&&function(t,e){let n=t,r=!1;const x=(t.x+e.x)/2,o=(t.y+e.y)/2;do{n.y>o!=n.next.y>o&&n.next.y!==n.y&&x<(n.next.x-n.x)*(o-n.y)/(n.next.y-n.y)+n.x&&(r=!r),n=n.next}while(n!==t);return r}(t,e)&&(v(t.prev,t,e.prev)||v(t,e.prev,e))||b(t,e)&&v(t.prev,t,t.next)>0&&v(e.prev,e,e.next)>0)}function v(t,e,n){return(e.y-t.y)*(n.x-e.x)-(e.x-t.x)*(n.y-e.y)}function b(t,e){return t.x===e.x&&t.y===e.y}function M(t,e,n,r){const x=A(v(t,e,n)),o=A(v(t,e,r)),i=A(v(n,r,t)),f=A(v(n,r,e));return x!==o&&i!==f||(!(0!==x||!m(t,n,e))||(!(0!==o||!m(t,r,e))||(!(0!==i||!m(n,t,r))||!(0!==f||!m(n,e,r)))))}function m(t,e,n){return e.x<=Math.max(t.x,n.x)&&e.x>=Math.min(t.x,n.x)&&e.y<=Math.max(t.y,n.y)&&e.y>=Math.min(t.y,n.y)}function A(t){return t>0?1:t<0?-1:0}function g(t,e){return v(t.prev,t,t.next)<0?v(t,e,t.next)>=0&&v(t,t.prev,e)>=0:v(t,e,t.prev)<0||v(t,t.next,e)<0}function Z(t,e){const n=F(t.i,t.x,t.y),r=F(e.i,e.x,e.y),x=t.next,o=e.prev;return t.next=e,e.prev=t,n.next=x,x.prev=n,r.next=n,n.prev=r,o.next=r,r.prev=o,r}function d(t,e,n,r){const x=F(t,e,n);return r?(x.next=r.next,x.prev=r,r.next.prev=x,r.next=x):(x.prev=x,x.next=x),x}function w(t){t.next.prev=t.prev,t.prev.next=t.next,t.prevZ&&(t.prevZ.nextZ=t.nextZ),t.nextZ&&(t.nextZ.prevZ=t.prevZ)}function F(t,e,n){return{i:t,x:e,y:n,prev:null,next:null,z:0,prevZ:null,nextZ:null,steiner:!1}}function E(t,e,n){const r=Math.sqrt((e[0]-t[0])*(e[0]-t[0])+(e[1]-t[1])*(e[1]-t[1])),x=[(e[0]-t[0])/r,(e[1]-t[1])/r],o=[-x[1],x[0]],i=Math.sqrt((n[0]-t[0])*(n[0]-t[0])+(n[1]-t[1])*(n[1]-t[1])),f=[(n[0]-t[0])/i,(n[1]-t[1])/i];let u=0===r||0===i?0:Math.acos((s=f[0]*x[0]+f[1]*x[1],l=-1,c=1,Math.min(Math.max(s,l),c)));var s,l,c;u=Math.max(u,1e-5);return f[0]*o[0]+f[1]*o[1]>0?u:2*Math.PI-u}function I(t,e){const n=e[0],r=e[1];return e[0]=t[0]*n+t[2]*r+t[4],e[1]=t[1]*n+t[3]*r+t[5],e}function z(t,e){const n=(r=e)[0]*r[3]-r[1]*r[2];var r;!function(t,e){if(!t)throw new Error(e)}(0!==n,"Transformation matrix cannot be inverted");const x=e[0],o=e[1],i=e[2],f=e[3],u=e[4],s=e[5];return t[0]=f/n,t[1]=-o/n,t[2]=-i/n,t[3]=x/n,t[4]=(i*s-f*u)/n,t[5]=-(x*s-o*u)/n,t}new Array(6);const B=[],P={vertexAttributesPosition:0,instanceAttributesPosition:0,indicesPosition:0};function N(t,e,n,r,x){const o=t[e++],i=t[e++],f=B;f.length=r;for(let n=0;n<f.length;n++)f[n]=t[e+n];let u=x?x.instanceAttributesPosition:0;return n[u++]=o,n[u++]=i,f.length&&(n.set(f,u),u+=f.length),P.instanceAttributesPosition=u,P}function R(t,e,n,r,x,o,i,f,u,s){const l=[t[e],t[e+1]],c=[t[n],t[n+1]],a=t[e+2],y=t[n+2],h=I(f,[...l]),p=I(f,[...c]);let v=-1,b=-1,M=s;const m=null!==x;if(null!==r){v=E(h,p,I(f,[...[t[r],t[r+1]]])),Math.cos(v)<=.985&&(M+=Math.tan((v-Math.PI)/2))}if(m){b=E(p,h,I(f,[...[t[x],t[x+1]]])),Math.cos(b)<=.985&&(M+=Math.tan((Math.PI-b)/2))}const A=Math.pow(2,24),g=u%A,Z=Math.floor(u/A)*A;return o.push(l[0],l[1],a,c[0],c[1],y,v,b,g,Z,s),o.push(...i),{length:u+Math.sqrt((p[0]-h[0])*(p[0]-h[0])+(p[1]-h[1])*(p[1]-h[1])),angle:M}}function S(e,n,r,x,o){const i=2+o;let f=n;const u=e.slice(f,f+o);f+=o;const s=e[f++];let l=0;const c=new Array(s-1);for(let t=0;t<s;t++)l+=e[f++],t<s-1&&(c[t]=l);const a=e.slice(f,f+2*l),y=t(a,c,2);for(let t=0;t<y.length;t++)x.push(y[t]+r.length/i);for(let t=0;t<a.length;t+=2)r.push(a[t],a[t+1],...u);return f+2*l}const T="GENERATE_POLYGON_BUFFERS",_="GENERATE_POINT_BUFFERS",O="GENERATE_LINE_STRING_BUFFERS",U=self;U.onmessage=t=>{const e=t.data;switch(e.type){case _:{const t=2,n=2,r=e.customAttributesSize,x=n+r,o=new Float32Array(e.renderInstructions),i=o.length/x*(t+r),f=Uint32Array.from([0,1,3,1,2,3]),u=Float32Array.from([-1,-1,1,-1,1,1,-1,1]),s=new Float32Array(i);let l;for(let t=0;t<o.length;t+=x)l=N(o,t,s,r,l);const c=Object.assign({indicesBuffer:f.buffer,vertexAttributesBuffer:u.buffer,instanceAttributesBuffer:s.buffer,renderInstructions:o.buffer},e);U.postMessage(c,[u.buffer,s.buffer,f.buffer,o.buffer]);break}case O:{const t=[],n=e.customAttributesSize,r=3,x=new Float32Array(e.renderInstructions);let o=0;const i=[1,0,0,1,0,0];let f,u;for(z(i,e.renderInstructionsTransform);o<x.length;){u=Array.from(x.slice(o,o+n)),o+=n,f=x[o++];const e=o,s=o+(f-1)*r,l=x[e]===x[s]&&x[e+1]===x[s+1];let c=0,a=0;for(let n=0;n<f-1;n++){let y=null;n>0?y=o+(n-1)*r:l&&(y=s-r);let h=null;n<f-2?h=o+(n+2)*r:l&&(h=e+r);const p=R(x,o+n*r,o+(n+1)*r,y,h,t,u,i,c,a);c=p.length,a=p.angle}o+=f*r}const s=Uint32Array.from([0,1,3,1,2,3]),l=Float32Array.from([-1,-1,1,-1,1,1,-1,1]),c=Float32Array.from(t),a=Object.assign({indicesBuffer:s.buffer,vertexAttributesBuffer:l.buffer,instanceAttributesBuffer:c.buffer,renderInstructions:x.buffer},e);U.postMessage(a,[l.buffer,c.buffer,s.buffer,x.buffer]);break}case T:{const t=[],n=[],r=e.customAttributesSize,x=new Float32Array(e.renderInstructions);let o=0;for(;o<x.length;)o=S(x,o,t,n,r);const i=Uint32Array.from(n),f=Float32Array.from(t),u=Float32Array.from([]),s=Object.assign({indicesBuffer:i.buffer,vertexAttributesBuffer:f.buffer,instanceAttributesBuffer:u.buffer,renderInstructions:x.buffer},e);U.postMessage(s,[f.buffer,u.buffer,i.buffer,x.buffer]);break}}};';return new Worker(typeof Blob>"u"?"data:application/javascript;base64,"+O.from(e,"binary").toString("base64"):URL.createObjectURL(new Blob([e],{type:"application/javascript"})))}const ft={GENERATE_POLYGON_BUFFERS:"GENERATE_POLYGON_BUFFERS",GENERATE_POINT_BUFFERS:"GENERATE_POINT_BUFFERS",GENERATE_LINE_STRING_BUFFERS:"GENERATE_LINE_STRING_BUFFERS"};function xt(e,t){t=t||[];const r=256,n=r-1,i=Math.floor(e/r/r/r)/n,o=Math.floor(e/r/r)%r/n,f=Math.floor(e/r)%r/n,c=e%r/n;return t[0]=i*256*255+o*255,t[1]=f*256*255+c*255,t}function ut(e){let t=0;const r=256,n=r-1;return t+=Math.round(e[0]*r*r*r*n),t+=Math.round(e[1]*r*r*n),t+=Math.round(e[2]*r*n),t+=Math.round(e[3]*n),t}function F(e){return(JSON.stringify(e).split("").reduce((r,n)=>(r<<5)-r+n.charCodeAt(0),0)>>>0).toString()}function k(e,t,r,n){if(`${n}radius`in e&&n!=="icon-"){let i=s(r,e[`${n}radius`],x);if(`${n}radius2`in e){const o=s(r,e[`${n}radius2`],x);i=`max(${i}, ${o})`}`${n}stroke-width`in e&&(i=`(${i} + ${s(r,e[`${n}stroke-width`],x)} * 0.5)`),t.setSymbolSizeExpression(`vec2(${i} * 2. + 0.5)`)}if(`${n}scale`in e){const i=s(r,e[`${n}scale`],y);t.setSymbolSizeExpression(`${t.getSymbolSizeExpression()} * ${i}`)}`${n}displacement`in e&&t.setSymbolOffsetExpression(s(r,e[`${n}displacement`],S)),`${n}rotation`in e&&t.setSymbolRotationExpression(s(r,e[`${n}rotation`],x)),`${n}rotate-with-view`in e&&t.setSymbolRotateWithView(!!e[`${n}rotate-with-view`])}function R(e,t,r,n,i){let o="vec4(0.)";if(t!==null&&(o=t),r!==null&&n!==null){const a=`smoothstep(-${n} + 0.63, -${n} - 0.58, ${e})`;o=`mix(${r}, ${o}, ${a})`}const f=`(1.0 - smoothstep(-0.63, 0.58, ${e}))`;let c=`${o} * vec4(1.0, 1.0, 1.0, ${f})`;return i!==null&&(c=`${c} * vec4(1.0, 1.0, 1.0, ${i})`),c}function w(e,t,r,n,i){const o=new Image;o.crossOrigin=e[`${n}cross-origin`]===void 0?"anonymous":e[`${n}cross-origin`],L(typeof e[`${n}src`]=="string",`WebGL layers do not support expressions for the ${n}src style property`),o.src=e[`${n}src`],r[`u_texture${i}_size`]=()=>o.complete?[o.width,o.height]:[0,0],t.addUniform(`u_texture${i}_size`,"vec2");const f=`u_texture${i}_size`;return r[`u_texture${i}`]=o,t.addUniform(`u_texture${i}`,"sampler2D"),f}function z(e,t,r,n,i){let o=s(r,e[`${t}offset`],y);if(`${t}offset-origin`in e)switch(e[`${t}offset-origin`]){case"top-right":o=`vec2(${n}.x, 0.) + ${i} * vec2(-1., 0.) + ${o} * vec2(-1., 1.)`;break;case"bottom-left":o=`vec2(0., ${n}.y) + ${i} * vec2(0., -1.) + ${o} * vec2(1., -1.)`;break;case"bottom-right":o=`${n} - ${i} - ${o}`;break}return o}function tt(e,t,r,n){n.functions.circleDistanceField=`float circleDistanceField(vec2 point, float radius) {
  return length(point) - radius;
}`,k(e,t,n,"circle-");let i=null;"circle-opacity"in e&&(i=s(n,e["circle-opacity"],x));let o="coordsPx";"circle-scale"in e&&(o=`coordsPx / ${s(n,e["circle-scale"],y)}`);let f=null;"circle-fill-color"in e&&(f=s(n,e["circle-fill-color"],m));let c=null;"circle-stroke-color"in e&&(c=s(n,e["circle-stroke-color"],m));let a=s(n,e["circle-radius"],x),l=null;"circle-stroke-width"in e&&(l=s(n,e["circle-stroke-width"],x),a=`(${a} + ${l} * 0.5)`);const u=`circleDistanceField(${o}, ${a})`,d=R(u,f,c,l,i);t.setSymbolColorExpression(d)}function et(e,t,r,n){n.functions.round=`float round(float v) {
  return sign(v) * floor(abs(v) + 0.5);
}`,n.functions.starDistanceField=`float starDistanceField(vec2 point, float numPoints, float radius, float radius2, float angle) {
  float startAngle = -PI * 0.5 + angle; // tip starts upwards and rotates clockwise with angle
  float c = cos(startAngle);
  float s = sin(startAngle);
  vec2 pointRotated = vec2(c * point.x - s * point.y, s * point.x + c * point.y);
  float alpha = TWO_PI / numPoints; // the angle of one sector
  float beta = atan(pointRotated.y, pointRotated.x);
  float gamma = round(beta / alpha) * alpha; // angle in sector
  c = cos(-gamma);
  s = sin(-gamma);
  vec2 inSector = vec2(c * pointRotated.x - s * pointRotated.y, abs(s * pointRotated.x + c * pointRotated.y));
  vec2 tipToPoint = inSector + vec2(-radius, 0.);
  vec2 edgeNormal = vec2(radius2 * sin(alpha * 0.5), -radius2 * cos(alpha * 0.5) + radius);
  return dot(normalize(edgeNormal), tipToPoint);
}`,n.functions.regularDistanceField=`float regularDistanceField(vec2 point, float numPoints, float radius, float angle) {
  float startAngle = -PI * 0.5 + angle; // tip starts upwards and rotates clockwise with angle
  float c = cos(startAngle);
  float s = sin(startAngle);
  vec2 pointRotated = vec2(c * point.x - s * point.y, s * point.x + c * point.y);
  float alpha = TWO_PI / numPoints; // the angle of one sector
  float radiusIn = radius * cos(PI / numPoints);
  float beta = atan(pointRotated.y, pointRotated.x);
  float gamma = round((beta - alpha * 0.5) / alpha) * alpha + alpha * 0.5; // angle in sector from mid
  c = cos(-gamma);
  s = sin(-gamma);
  vec2 inSector = vec2(c * pointRotated.x - s * pointRotated.y, abs(s * pointRotated.x + c * pointRotated.y));
  return inSector.x - radiusIn;
}`,k(e,t,n,"shape-");let i=null;"shape-opacity"in e&&(i=s(n,e["shape-opacity"],x));let o="coordsPx";"shape-scale"in e&&(o=`coordsPx / ${s(n,e["shape-scale"],y)}`);let f=null;"shape-fill-color"in e&&(f=s(n,e["shape-fill-color"],m));let c=null;"shape-stroke-color"in e&&(c=s(n,e["shape-stroke-color"],m));let a=null;"shape-stroke-width"in e&&(a=s(n,e["shape-stroke-width"],x));const l=s(n,e["shape-points"],x);let u="0.";"shape-angle"in e&&(u=s(n,e["shape-angle"],x));let d,g=s(n,e["shape-radius"],x);if(a!==null&&(g=`${g} + ${a} * 0.5`),"shape-radius2"in e){let p=s(n,e["shape-radius2"],x);a!==null&&(p=`${p} + ${a} * 0.5`),d=`starDistanceField(${o}, ${l}, ${g}, ${p}, ${u})`}else d=`regularDistanceField(${o}, ${l}, ${g}, ${u})`;const _=R(d,f,c,a,i);t.setSymbolColorExpression(_)}function nt(e,t,r,n){let i="vec4(1.0)";"icon-color"in e&&(i=s(n,e["icon-color"],m)),"icon-opacity"in e&&(i=`${i} * vec4(1.0, 1.0, 1.0, ${s(n,e["icon-opacity"],x)})`);const o=F(e["icon-src"]),f=w(e,t,r,"icon-",o);if(t.setSymbolColorExpression(`${i} * texture2D(u_texture${o}, v_texCoord)`).setSymbolSizeExpression(f),"icon-width"in e&&"icon-height"in e&&t.setSymbolSizeExpression(`vec2(${s(n,e["icon-width"],x)}, ${s(n,e["icon-height"],x)})`),"icon-offset"in e&&"icon-size"in e){const c=s(n,e["icon-size"],S),a=t.getSymbolSizeExpression();t.setSymbolSizeExpression(c);const l=z(e,"icon-",n,"v_quadSizePx",c);t.setTextureCoordinateExpression(`(vec4((${l}).xyxy) + vec4(0., 0., ${c})) / (${a}).xyxy`)}if(k(e,t,n,"icon-"),"icon-anchor"in e){const c=s(n,e["icon-anchor"],S);let a="1.0";"icon-scale"in e&&(a=s(n,e["icon-scale"],y));let l;e["icon-anchor-x-units"]==="pixels"&&e["icon-anchor-y-units"]==="pixels"?l=`${c} * ${a}`:e["icon-anchor-x-units"]==="pixels"?l=`${c} * vec2(vec2(${a}).x, v_quadSizePx.y)`:e["icon-anchor-y-units"]==="pixels"?l=`${c} * vec2(v_quadSizePx.x, vec2(${a}).x)`:l=`${c} * v_quadSizePx`;let u=`v_quadSizePx * vec2(0.5, -0.5) + ${l} * vec2(-1., 1.)`;if("icon-anchor-origin"in e)switch(e["icon-anchor-origin"]){case"top-right":u=`v_quadSizePx * -0.5 + ${l}`;break;case"bottom-left":u=`v_quadSizePx * 0.5 - ${l}`;break;case"bottom-right":u=`v_quadSizePx * vec2(-0.5, 0.5) + ${l} * vec2(1., -1.)`;break}t.setSymbolOffsetExpression(`${t.getSymbolOffsetExpression()} + ${u}`)}}function rt(e,t,r,n){if("stroke-color"in e&&t.setStrokeColorExpression(s(n,e["stroke-color"],m)),"stroke-pattern-src"in e){const i=F(e["stroke-pattern-src"]),o=w(e,t,r,"stroke-pattern-",i);let f=o,c="vec2(0.)";"stroke-pattern-offset"in e&&"stroke-pattern-size"in e&&(f=s(n,e["stroke-pattern-size"],S),c=z(e,"stroke-pattern-",n,o,f));let a="0.";"stroke-pattern-spacing"in e&&(a=s(n,e["stroke-pattern-spacing"],x));let l="0.";"stroke-pattern-start-offset"in e&&(l=s(n,e["stroke-pattern-start-offset"],x)),n.functions.sampleStrokePattern=`vec4 sampleStrokePattern(sampler2D texture, vec2 textureSize, vec2 textureOffset, vec2 sampleSize, float spacingPx, float startOffsetPx, float currentLengthPx, float currentRadiusRatio, float lineWidth) {
  float currentLengthScaled = (currentLengthPx - startOffsetPx) * sampleSize.y / lineWidth;
  float spacingScaled = spacingPx * sampleSize.y / lineWidth;
  float uCoordPx = mod(currentLengthScaled, (sampleSize.x + spacingScaled));
  float isInsideOfPattern = step(uCoordPx, sampleSize.x);
  float vCoordPx = (-currentRadiusRatio * 0.5 + 0.5) * sampleSize.y;
  // make sure that we're not sampling too close to the borders to avoid interpolation with outside pixels
  uCoordPx = clamp(uCoordPx, 0.5, sampleSize.x - 0.5);
  vCoordPx = clamp(vCoordPx, 0.5, sampleSize.y - 0.5);
  vec2 texCoord = (vec2(uCoordPx, vCoordPx) + textureOffset) / textureSize;
  return texture2D(texture, texCoord) * vec4(1.0, 1.0, 1.0, isInsideOfPattern);
}`;const u=`u_texture${i}`;let d="1.";"stroke-color"in e&&(d=t.getStrokeColorExpression()),t.setStrokeColorExpression(`${d} * sampleStrokePattern(${u}, ${o}, ${c}, ${f}, ${a}, ${l}, currentLengthPx, currentRadiusRatio, v_width)`),n.functions.computeStrokePatternLength=`float computeStrokePatternLength(vec2 sampleSize, float spacingPx, float lineWidth) {
  float patternLengthPx = sampleSize.x / sampleSize.y * lineWidth;
  return patternLengthPx + spacingPx;
}`,t.setStrokePatternLengthExpression(`computeStrokePatternLength(${f}, ${a}, v_width)`)}if("stroke-width"in e&&t.setStrokeWidthExpression(s(n,e["stroke-width"],x)),"stroke-offset"in e&&t.setStrokeOffsetExpression(s(n,e["stroke-offset"],x)),"stroke-line-cap"in e&&t.setStrokeCapExpression(s(n,e["stroke-line-cap"],b)),"stroke-line-join"in e&&t.setStrokeJoinExpression(s(n,e["stroke-line-join"],b)),"stroke-miter-limit"in e&&t.setStrokeMiterLimitExpression(s(n,e["stroke-miter-limit"],x)),"stroke-line-dash"in e){n.functions.getSingleDashDistance=`float getSingleDashDistance(float distance, float radius, float dashOffset, float dashLength, float dashLengthTotal, float capType, float lineWidth) {
  float localDistance = mod(distance, dashLengthTotal);
  float distanceSegment = abs(localDistance - dashOffset - dashLength * 0.5) - dashLength * 0.5;
  distanceSegment = min(distanceSegment, dashLengthTotal - localDistance);
  if (capType == ${v("square")}) {
    distanceSegment -= lineWidth * 0.5;
  } else if (capType == ${v("round")}) {
    distanceSegment = min(distanceSegment, sqrt(distanceSegment * distanceSegment + radius * radius) - lineWidth * 0.5);
  }
  return distanceSegment;
}`;let i=e["stroke-line-dash"].map(p=>s(n,p,x));i.length%2===1&&(i=[...i,...i]);let o="0.";"stroke-line-dash-offset"in e&&(o=s(n,e["stroke-line-dash-offset"],x));const c=`dashDistanceField_${F(e["stroke-line-dash"])}`,a=i.map((p,$)=>`float dashLength${$}`).join(", "),l=i.map((p,$)=>`dashLength${$}`).join(" + ");let u="0.",d=`getSingleDashDistance(distance, radius, ${u}, dashLength0, totalDashLength, capType, lineWidth)`;for(let p=2;p<i.length;p+=2)u=`${u} + dashLength${p-2} + dashLength${p-1}`,d=`min(${d}, getSingleDashDistance(distance, radius, ${u}, dashLength${p}, totalDashLength, capType, lineWidth))`;n.functions[c]=`float ${c}(float distance, float radius, float capType, float lineWidth, ${a}) {
  float totalDashLength = ${l};
  return ${d};
}`;const g=i.map((p,$)=>`${p}`).join(", ");t.setStrokeDistanceFieldExpression(`${c}(currentLengthPx + ${o}, currentRadiusPx, capType, v_width, ${g})`);let _=i.join(" + ");t.getStrokePatternLengthExpression()&&(n.functions.combinePatternLengths=`float combinePatternLengths(float patternLength1, float patternLength2) {
  return patternLength1 * patternLength2;
}`,_=`combinePatternLengths(${t.getStrokePatternLengthExpression()}, ${_})`),t.setStrokePatternLengthExpression(_)}}function it(e,t,r,n){if("fill-color"in e&&t.setFillColorExpression(s(n,e["fill-color"],m)),"fill-pattern-src"in e){const i=F(e["fill-pattern-src"]),o=w(e,t,r,"fill-pattern-",i);t.setFillPatternSizeExpression(o);let f="vec2(0.)";if("fill-pattern-offset"in e&&"fill-pattern-size"in e){const l=s(n,e["fill-pattern-size"],S);t.setFillPatternSizeExpression(l),f=z(e,"fill-pattern-",n,o,"v_patternSizePx")}n.functions.sampleFillPattern=`vec4 sampleFillPattern(sampler2D texture, vec2 textureSize, vec2 textureOffset, vec2 sampleSize, vec2 patternOriginPx, vec2 pxPosition, float sampleScaleRatio) {
  vec2 pxRelativePos = pxPosition - patternOriginPx;

  // rotate the relative position from origin by the current view rotation
  pxRelativePos = vec2(pxRelativePos.x * cos(u_rotation) - pxRelativePos.y * sin(u_rotation), pxRelativePos.x * sin(u_rotation) + pxRelativePos.y * cos(u_rotation));
  // sample position is computed according to the sample offset & size
  vec2 samplePos = mod(pxRelativePos / sampleScaleRatio, sampleSize);
  // also make sure that we're not sampling too close to the borders to avoid interpolation with outside pixels
  samplePos = clamp(samplePos, vec2(0.5), sampleSize - vec2(0.5));
  samplePos.y = sampleSize.y - samplePos.y; // invert y axis so that images appear upright
  return texture2D(texture, (samplePos + textureOffset) / textureSize);
}`;const c=`u_texture${i}`;let a="1.";"fill-color"in e&&(a=t.getFillColorExpression()),t.setFillColorExpression(`${a} * sampleFillPattern(${c}, ${o}, ${f}, v_patternSizePx, v_patternOriginPx, pxPos, df_float(u_df_patternScaleRatio))`)}}function pt(e,t,r){const n=W(),i=new Q,o={};if("icon-src"in e?nt(e,i,o,n):"shape-points"in e?et(e,i,o,n):"circle-radius"in e&&tt(e,i,o,n),rt(e,i,o,n),it(e,i,o,n),r){const a=N(),l=s(n,r,j,a);a.mCoordinate?i.setFragmentDiscardExpression(`!${l}`):i.setShapeDiscardExpression(`!${l}`)}const f={};function c(a,l,u,d){if(!n[a])return;const g=q(u),_=J(u);i.addAttribute(`a_${l}`,g),f[l]={size:_,callback:d}}return c("geometryType",H,b,a=>D(M(a.getGeometry()))),c("featureId",Y,b|x,a=>{const l=a.getId()??null;return typeof l=="string"?D(l):l}),U(i,n),{builder:i,attributes:{...f,...B(n)},uniforms:{...o,...G(n,t)}}}const h=new Uint8Array(4);class dt{constructor(t,r){this.helper_=t;const n=t.getGL();this.texture_=n.createTexture(),this.framebuffer_=n.createFramebuffer(),this.depthbuffer_=n.createRenderbuffer(),this.size_=r||[1,1],this.data_=new Uint8Array(0),this.dataCacheDirty_=!0,this.updateSize_()}setSize(t){Z(t,this.size_)||(this.size_[0]=t[0],this.size_[1]=t[1],this.updateSize_())}getSize(){return this.size_}clearCachedData(){this.dataCacheDirty_=!0}readAll(){if(this.dataCacheDirty_){const t=this.size_,r=this.helper_.getGL();r.bindFramebuffer(r.FRAMEBUFFER,this.framebuffer_),r.readPixels(0,0,t[0],t[1],r.RGBA,r.UNSIGNED_BYTE,this.data_),this.dataCacheDirty_=!1}return this.data_}readPixel(t,r){if(t<0||r<0||t>this.size_[0]||r>=this.size_[1])return h[0]=0,h[1]=0,h[2]=0,h[3]=0,h;this.readAll();const n=Math.floor(t)+(this.size_[1]-Math.floor(r)-1)*this.size_[0];return h[0]=this.data_[n*4],h[1]=this.data_[n*4+1],h[2]=this.data_[n*4+2],h[3]=this.data_[n*4+3],h}getTexture(){return this.texture_}getFramebuffer(){return this.framebuffer_}getDepthbuffer(){return this.depthbuffer_}updateSize_(){const t=this.size_,r=this.helper_.getGL();this.texture_=this.helper_.createTexture(t,null,this.texture_),r.bindFramebuffer(r.FRAMEBUFFER,this.framebuffer_),r.viewport(0,0,t[0],t[1]),r.framebufferTexture2D(r.FRAMEBUFFER,r.COLOR_ATTACHMENT0,r.TEXTURE_2D,this.texture_,0),r.bindRenderbuffer(r.RENDERBUFFER,this.depthbuffer_),r.renderbufferStorage(r.RENDERBUFFER,r.DEPTH_COMPONENT16,t[0],t[1]),r.framebufferRenderbuffer(r.FRAMEBUFFER,r.DEPTH_ATTACHMENT,r.RENDERBUFFER,this.depthbuffer_),this.data_=new Uint8Array(t[0]*t[1]*4)}}export{Q as S,dt as W,xt as a,ft as b,ut as c,ct as d,lt as e,X as g,pt as p};
//# sourceMappingURL=RenderTarget-CrNIjlIv.js.map
