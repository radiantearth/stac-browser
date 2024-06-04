(self["webpackChunk_radiantearth_stac_browser"]=self["webpackChunk_radiantearth_stac_browser"]||[]).push([[5027],{55027:function(e,t,n){"use strict";n.r(t),n.d(t,{default:function(){return zu}});var r={};n.r(r),n.d(r,{ACCESS_TOKEN_STORAGE_KEY:function(){return Te},CACHE_STORAGE_NAME:function(){return me},DEFAULT_CACHE_DURATION:function(){return fe},DEFAULT_CODE_CHALLENGE_METHOD:function(){return Pe},DEFAULT_MAX_CLOCK_SKEW:function(){return pe},DEFAULT_POLLING_DELAY:function(){return he},IDX_API_VERSION:function(){return xe},IDX_RESPONSE_STORAGE_NAME:function(){return be},ID_TOKEN_STORAGE_KEY:function(){return Se},MAX_VERIFIER_LENGTH:function(){return Ee},MIN_VERIFIER_LENGTH:function(){return Ae},ORIGINAL_URI_STORAGE_NAME:function(){return ke},PKCE_STORAGE_NAME:function(){return ve},REFERRER_PATH_STORAGE_KEY:function(){return _e},REFRESH_TOKEN_STORAGE_KEY:function(){return Oe},SHARED_TRANSACTION_STORAGE_NAME:function(){return we},STATE_TOKEN_KEY_NAME:function(){return de},TOKEN_STORAGE_NAME:function(){return ge},TRANSACTION_STORAGE_NAME:function(){return ye}});var o={};n.r(o),n.d(o,{AuthenticatorEnrollmentData:function(){return $n},AuthenticatorVerificationData:function(){return Kn},ChallengeAuthenticator:function(){return Cn},ChallengePoll:function(){return jn},EnrollAuthenticator:function(){return An},EnrollPoll:function(){return En},EnrollProfile:function(){return In},EnrollmentChannelData:function(){return xn},GenericRemediator:function(){return qt},Identify:function(){return Mn},ReEnrollAuthenticator:function(){return Dn},ReEnrollAuthenticatorWarning:function(){return Un},RedirectIdp:function(){return Nn},Remediator:function(){return Ft},ResetAuthenticator:function(){return Rn},SelectAuthenticatorAuthenticate:function(){return Fn},SelectAuthenticatorEnroll:function(){return Hn},SelectAuthenticatorUnlockAccount:function(){return qn},SelectEnrollProfile:function(){return Bn},SelectEnrollmentChannel:function(){return Pn},Skip:function(){return Wn}});var s={};n.r(s),n.d(s,{getUserAgent:function(){return Rr},hasTextEncoder:function(){return Nr},isBrowser:function(){return Cr},isDPoPSupported:function(){return qr},isFingerprintSupported:function(){return Ir},isHTTPS:function(){return Fr},isIE11OrLess:function(){return jr},isLocalhost:function(){return Hr},isPKCESupported:function(){return Lr},isPopupPostMessageSupported:function(){return Mr},isTokenVerifySupported:function(){return Ur}});var i={};n.r(i),n.d(i,{atob:function(){return Ar},base64ToBase64Url:function(){return Gr},base64UrlDecode:function(){return Xr},base64UrlToBase64:function(){return Jr},base64UrlToBuffer:function(){return Zr},base64UrlToString:function(){return Qr},btoa:function(){return Er},bufferToBase64Url:function(){return eo},getOidcHash:function(){return to},stringToBase64Url:function(){return zr},stringToBuffer:function(){return Yr},verifyToken:function(){return no},webcrypto:function(){return Pr}});var a={};n.r(a),n.d(a,{buildCredentialCreationOptions:function(){return rc},buildCredentialRequestOptions:function(){return oc},getAssertion:function(){return ic},getAttestation:function(){return sc}});var c={};n.r(c),n.d(c,{addEmail:function(){return ru},addPhone:function(){return du},deleteEmail:function(){return ou},deletePassword:function(){return wu},deletePhone:function(){return hu},enrollPassword:function(){return vu},getEmail:function(){return nu},getEmailChallenge:function(){return iu},getEmails:function(){return tu},getPassword:function(){return mu},getPhone:function(){return lu},getPhones:function(){return uu},getProfile:function(){return Jc},getProfileSchema:function(){return Yc},sendEmailChallenge:function(){return su},sendPhoneChallenge:function(){return pu},updatePassword:function(){return yu},updateProfile:function(){return Qc},verifyEmailChallenge:function(){return au},verifyPhoneChallenge:function(){return fu}});var u,l,d,h=n(48907),p=n(44426),f=n(91250);function g(e){return e&&(e.key||e.id)}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
function m(){return"undefined"!==typeof window?window.console:"undefined"!==typeof console?console:void 0}function v(){var e=m();return e&&e.log?e:{log:function(){},warn:function(){},group:function(){},groupEnd:function(){}}}function y(e){v().warn("[okta-auth-sdk] WARN: "+e)}function w(e){var t={};for(var n in e)if(Object.prototype.hasOwnProperty.call(e,n)){var r=e[n];null!==r&&void 0!==r&&(t[n]=r)}return t}function k(e){if(e){var t=JSON.stringify(e);if(t)return JSON.parse(t)}return e}function b(e,...t){var n={};for(var r in e)Object.prototype.hasOwnProperty.call(e,r)&&-1==t.indexOf(r)&&(n[r]=e[r]);return k(n)}function T(e,t){var n=e.length;while(n--){var r=e[n],o=!0;for(var s in t)if(Object.prototype.hasOwnProperty.call(t,s)&&r[s]!==t[s]){o=!1;break}if(o)return r}}function S(e,t,n){if(e&&e._links){var r=k(e._links[t]);return r&&r.name&&n?r.name===n?r:void 0:r}}(function(e){e["SUCCESS"]="SUCCESS",e["PENDING"]="PENDING",e["FAILURE"]="FAILURE",e["TERMINAL"]="TERMINAL",e["CANCELED"]="CANCELED"})(u||(u={})),function(e){e["OKTA_PASSWORD"]="okta_password",e["OKTA_EMAIL"]="okta_email",e["PHONE_NUMBER"]="phone_number",e["GOOGLE_AUTHENTICATOR"]="google_otp",e["SECURITY_QUESTION"]="security_question",e["OKTA_VERIFY"]="okta_verify",e["WEBAUTHN"]="webauthn"}(l||(l={})),function(e){e["PASSWORD_RECOVERY"]="recover-password",e["REGISTRATION"]="enroll-profile",e["SOCIAL_IDP"]="redirect-idp",e["ACCOUNT_UNLOCK"]="unlock-account"}(d||(d={}));
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
class O extends Error{constructor(e){super(e),Object.setPrototypeOf(this,new.target.prototype)}}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
function _(e){return"[object String]"===Object.prototype.toString.call(e)}function A(e){return"[object Object]"===Object.prototype.toString.call(e)}function E(e){return"[object Number]"===Object.prototype.toString.call(e)}function P(e){return!!e&&"[object Function]"==={}.toString.call(e)}function x(e){return e&&e.finally&&"function"===typeof e.finally}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
class C extends O{constructor(e,t,n){var r;super(null!==(r=t.error)&&void 0!==r?r:C.UNKNOWN_ERROR),this.name="WWWAuthError",this.resp=null,this.scheme=e,this.parameters=t,n&&(this.resp=n)}get error(){return this.parameters.error}get errorCode(){return this.error}get error_description(){return this.parameters.error_description}get errorDescription(){return this.error_description}get errorSummary(){return this.errorDescription}get realm(){return this.parameters.realm}static parseHeader(e){var t;if(!e)return null;const n=/(?:,|, )?([a-zA-Z0-9!#$%&'*+\-.^_`|~]+)=(?:"([a-zA-Z0-9!#$%&'*+\-.,^_`|~ /:]+)"|([a-zA-Z0-9!#$%&'*+\-.^_`|~/:]+))/g,r=e.indexOf(" "),o=e.slice(0,r),s=e.slice(r+1),i={};let a;while(null!==(a=n.exec(s)))i[a[1]]=null!==(t=a[2])&&void 0!==t?t:a[3];return new C(o,i)}static getWWWAuthenticateHeader(e={}){var t;return P(null===e||void 0===e?void 0:e.get)?e.get("WWW-Authenticate"):null!==(t=e["www-authenticate"])&&void 0!==t?t:e["WWW-Authenticate"]}}function j(e){for(var t="abcdefghijklnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",n="",r=0,o=t.length;r<e;++r)n+=t[Math.floor(Math.random()*o)];return n}function R(e){return new Promise((function(t){setTimeout(t,e)}))}function I(e,t){const n=e.split(t);return[n[0],n.splice(1,n.length).join(t)]}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
function M(e){return/^[a-z][a-z0-9+.-]*:/i.test(e)}function D(e="",t){return M(e)?e:(t=N(t),"/"===e[0]?`${t}${e}`:`${t}/${e}`)}function U(e){var t=[];if(null!==e)for(var n in e)Object.prototype.hasOwnProperty.call(e,n)&&void 0!==e[n]&&null!==e[n]&&t.push(n+"="+encodeURIComponent(e[n]));return t.length?"?"+t.join("&"):""}function N(e){if(e){var t=e.replace(/^\s+|\s+$/gm,"");return t=t.replace(/\/+$/,""),t}}C.UNKNOWN_ERROR="UNKNOWN_WWW_AUTH_ERROR";
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
class L extends O{constructor(e,t){super(e),this.name="AuthSdkError",this.errorCode="INTERNAL",this.errorSummary=e,this.errorLink="INTERNAL",this.errorId="INTERNAL",this.errorCauses=[],t&&(this.xhr=t)}}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
function F(){return j(64)}function H(){return j(64)}function q(e,t={}){const n=N(t.issuer)||e.options.issuer;return n}function B(e,t={}){const n=q(e,t),r=n.indexOf("/oauth2")>0?n:n+"/oauth2";return r}function V(e,t={}){const n=q(e,t),r=n.split("/oauth2")[0];return r}function K(e,t){if(arguments.length>2)throw new L('As of version 3.0, "getOAuthUrls" takes only a single set of options');t=t||{};var n=N(t.authorizeUrl)||e.options.authorizeUrl,r=q(e,t),o=N(t.userinfoUrl)||e.options.userinfoUrl,s=N(t.tokenUrl)||e.options.tokenUrl,i=N(t.logoutUrl)||e.options.logoutUrl,a=N(t.revokeUrl)||e.options.revokeUrl,c=B(e,t);return n=n||c+"/v1/authorize",o=o||c+"/v1/userinfo",s=s||c+"/v1/token",a=a||c+"/v1/revoke",i=i||c+"/v1/logout",{issuer:r,authorizeUrl:n,userinfoUrl:o,tokenUrl:s,revokeUrl:a,logoutUrl:i}}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
function $(e,t){const n=e.options.issuer,r=K(e,t),o={issuer:n,urls:r,clientId:t.clientId,redirectUri:t.redirectUri,responseType:t.responseType,responseMode:t.responseMode,scopes:t.scopes,state:t.state,nonce:t.nonce,ignoreSignature:t.ignoreSignature,acrValues:t.acrValues};if(!1===t.pkce)return o;const s=Object.assign(Object.assign({},o),{codeVerifier:t.codeVerifier,codeChallengeMethod:t.codeChallengeMethod,codeChallenge:t.codeChallenge});return s}var W=n(51504);
/*! js-cookie v3.0.5 | MIT */
function z(e){for(var t=1;t<arguments.length;t++){var n=arguments[t];for(var r in n)e[r]=n[r]}return e}var G={read:function(e){return'"'===e[0]&&(e=e.slice(1,-1)),e.replace(/(%[\dA-F]{2})+/gi,decodeURIComponent)},write:function(e){return encodeURIComponent(e).replace(/%(2[346BF]|3[AC-F]|40|5[BDE]|60|7[BCD])/g,decodeURIComponent)}};function J(e,t){function n(n,r,o){if("undefined"!==typeof document){o=z({},t,o),"number"===typeof o.expires&&(o.expires=new Date(Date.now()+864e5*o.expires)),o.expires&&(o.expires=o.expires.toUTCString()),n=encodeURIComponent(n).replace(/%(2[346B]|5E|60|7C)/g,decodeURIComponent).replace(/[()]/g,escape);var s="";for(var i in o)o[i]&&(s+="; "+i,!0!==o[i]&&(s+="="+o[i].split(";")[0]));return document.cookie=n+"="+e.write(r,n)+s}}function r(t){if("undefined"!==typeof document&&(!arguments.length||t)){for(var n=document.cookie?document.cookie.split("; "):[],r={},o=0;o<n.length;o++){var s=n[o].split("="),i=s.slice(1).join("=");try{var a=decodeURIComponent(s[0]);if(r[a]=e.read(i,a),t===a)break}catch(c){}}return t?r[t]:r}}return Object.create({set:n,get:r,remove:function(e,t){n(e,"",z({},t,{expires:-1}))},withAttributes:function(e){return J(this.converter,z({},this.attributes,e))},withConverter:function(e){return J(z({},this.converter,e),this.attributes)}},{attributes:{value:Object.freeze(t)},converter:{value:Object.freeze(e)}})}var Q,Y=J(G,{path:"/"}),X=n(74945);function Z(e){return e&&e.accessToken}function ee(e){return e&&e.idToken}function te(e){return e&&e.refreshToken}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
async function ne(e,t={}){const n=await e.token.prepareTokenParams(t),r=$(e,n);let{flow:o="default",withCredentials:s=!0,activationToken:i,recoveryToken:a,maxAge:c,acrValues:u}=Object.assign(Object.assign({},e.options),t);const l=Object.assign(Object.assign({},r),{flow:o,withCredentials:s,activationToken:i,recoveryToken:a,maxAge:c,acrValues:u});return l}function re(e,t){const n=oe(e,t);return!!(null===n||void 0===n?void 0:n.interactionHandle)}function oe(e,t){let n;t=w(t),t=Object.assign(Object.assign({},e.options),t);try{n=e.transactionManager.load(t)}catch(r){}if(n)return ce(n,t)?n:void y("Saved transaction meta does not match the current configuration. This may indicate that two apps are sharing a storage key.")}async function se(e,t){t=w(t),t=Object.assign(Object.assign({},e.options),t);const n=oe(e,t);return n||ne(e,t)}function ie(e,t){e.transactionManager.save(t,{muteWarning:!0})}function ae(e){e.transactionManager.clear()}function ce(e,t={}){const n=["issuer","clientId","redirectUri","state","codeChallenge","codeChallengeMethod","activationToken","recoveryToken"];if(!1===le(e,t,n))return!1;const{flow:r}=t;return!1!==ue(e,r)}function ue(e,t){const n=t&&"default"!==t&&"proceed"!==t;return!n||t===e.flow}function le(e,t,n){const r=n.some((n=>{const r=t[n];if(r&&r!==e[n])return!0}));return!r}(function(e){e["ACCESS"]="accessToken",e["ID"]="idToken",e["REFRESH"]="refreshToken"})(Q||(Q={}));
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
const de="oktaStateToken",he=500,pe=300,fe=86400,ge="okta-token-storage",me="okta-cache-storage",ve="okta-pkce-storage",ye="okta-transaction-storage",we="okta-shared-transaction-storage",ke="okta-original-uri-storage",be="okta-idx-response-storage",Te="accessToken",Se="idToken",Oe="refreshToken",_e="referrerPath",Ae=43,Ee=128,Pe="S256",xe="1.0.0";
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
class Ce extends O{constructor(e,t,n){const r=e.errorSummary;super(r),this.name="AuthApiError",this.errorSummary=e.errorSummary,this.errorCode=e.errorCode,this.errorLink=e.errorLink,this.errorId=e.errorId,this.errorCauses=e.errorCauses,t&&(this.xhr=t),n&&(this.meta=n)}}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
class je extends O{constructor(e,t,n){super(t),this.resp=null,this.name="OAuthError",this.errorCode=e,this.errorSummary=t,this.error=e,this.error_description=t,n&&(this.resp=n)}}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
const Re=(e,t)=>{var n;if(t instanceof Error)return new Ce({errorSummary:t.message});let r,o=t,s={};if(o.responseText&&_(o.responseText))try{s=JSON.parse(o.responseText)}catch(a){s={errorSummary:"Unknown error"}}o.status>=500&&(s.errorSummary="Unknown error"),e.options.transformErrorXHR&&(o=e.options.transformErrorXHR(k(o)));const i=null!==(n=C.getWWWAuthenticateHeader(null===o||void 0===o?void 0:o.headers))&&void 0!==n?n:"";if(r=s.error&&s.error_description?new je(s.error,s.error_description,o):new Ce(s,o,{wwwAuthHeader:i}),i&&(null===o||void 0===o?void 0:o.status)>=400&&(null===o||void 0===o?void 0:o.status)<500){const e=C.parseHeader(i);if(403===o.status&&"insufficient_authentication_context"===(null===e||void 0===e?void 0:e.error)){const{max_age:t,acr_values:n}=e.parameters;r=new Ce({errorSummary:e.error,errorCauses:[{errorSummary:e.errorDescription}]},o,Object.assign({max_age:+t},n&&{acr_values:n}))}else"DPoP"===(null===e||void 0===e?void 0:e.scheme)&&(r=e)}return r};function Ie(e,t){if(t=t||{},e.options.httpRequestInterceptors)for(const y of e.options.httpRequestInterceptors)y(t);var n=t.url,r=t.method,o=t.args,s=t.saveAuthnState,i=t.accessToken,a=!0===t.withCredentials,c=e.options.storageUtil,u=c.storage,l=e.storageManager.getHttpCache(e.options.cookies);if(t.cacheResponse){var d=l.getStorage(),h=d[n];if(h&&Date.now()/1e3<h.expiresAt)return Promise.resolve(h.response)}var p=e._oktaUserAgent.getHttpHeader(),f=Object.assign({Accept:"application/json","Content-Type":"application/json"},p);Object.assign(f,e.options.headers,t.headers),f=w(f),i&&_(i)&&(f["Authorization"]="Bearer "+i);var g,m,v={headers:f,data:o||void 0,withCredentials:a};return e.options.httpRequestClient(r,n,v).then((function(r){return m=r.responseText,m&&_(m)&&(m=JSON.parse(m),m&&"object"===typeof m&&!m.headers&&(Array.isArray(m)?m.forEach((e=>{e.headers=r.headers})):m.headers=r.headers)),s&&(m.stateToken||u.delete(de)),m&&m.stateToken&&m.expiresAt&&u.set(de,m.stateToken,m.expiresAt,e.options.cookies),m&&t.cacheResponse&&l.updateStorage(n,{expiresAt:Math.floor(Date.now()/1e3)+fe,response:m}),m})).catch((function(t){throw g=Re(e,t),"E0000011"===g.errorCode&&u.delete(de),g}))}function Me(e,t,n){t=M(t)?t:e.getIssuerOrigin()+t;var r={url:t,method:"GET"};return Object.assign(r,n),Ie(e,r)}function De(e,t,n,r){t=M(t)?t:e.getIssuerOrigin()+t;var o={url:t,method:"POST",args:n,saveAuthnState:!0};return Object.assign(o,r),Ie(e,o)}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
function Ue(e){return{meta:e,interactionHandle:e.interactionHandle,state:e.state}}async function Ne(e,t={}){t=w(t);let n=oe(e,t);if(null===n||void 0===n?void 0:n.interactionHandle)return Ue(n);n=await ne(e,Object.assign(Object.assign({},n),t));const r=B(e);let{clientId:o,redirectUri:s,state:i,scopes:a,withCredentials:c,codeChallenge:u,codeChallengeMethod:l,activationToken:d,recoveryToken:h,maxAge:p,acrValues:f,nonce:g}=n;const m=t.clientSecret||e.options.clientSecret;c=null===c||void 0===c||c;const v=`${r}/v1/interact`,y=Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({client_id:o,scope:a.join(" "),redirect_uri:s,code_challenge:u,code_challenge_method:l,state:i},d&&{activation_token:d}),h&&{recovery_token:h}),m&&{client_secret:m}),p&&{max_age:p}),f&&{acr_values:f}),g&&{nonce:g}),k={"Content-Type":"application/x-www-form-urlencoded"},b=await Ie(e,{method:"POST",url:v,headers:k,withCredentials:c,args:y}),T=b.interaction_handle,S=Object.assign(Object.assign({},n),{interactionHandle:T,withCredentials:c,state:i,scopes:a,recoveryToken:h,activationToken:d});return ie(e,S),Ue(S)}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
/*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */
function Le(e,t){var n={};for(var r in e)Object.prototype.hasOwnProperty.call(e,r)&&t.indexOf(r)<0&&(n[r]=e[r]);if(null!=e&&"function"===typeof Object.getOwnPropertySymbols){var o=0;for(r=Object.getOwnPropertySymbols(e);o<r.length;o++)t.indexOf(r[o])<0&&Object.prototype.propertyIsEnumerable.call(e,r[o])&&(n[r[o]]=e[r[o]])}return n}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
const Fe=function(e){return!1!==e.mutable},He=function(e){var t,n;const r={},o=[],s={};if(!e.value)return o.push(e),{defaultParamsForAction:r,neededParamsForAction:o,immutableParamsForAction:s};for(let i of e.value)Fe(i)?(o.push(i),null!==(t=i.value)&&void 0!==t&&t&&(r[i.name]=i.value)):s[i.name]=null!==(n=i.value)&&void 0!==n?n:"";return{defaultParamsForAction:r,neededParamsForAction:o,immutableParamsForAction:s}},qe=function(e){e=Array.isArray(e)?e:[e];const t=[],n={},r={};for(let o of e){const{defaultParamsForAction:e,neededParamsForAction:s,immutableParamsForAction:i}=He(o);t.push(s),n[o.name]=e,r[o.name]=i}return{defaultParams:n,neededParams:t,immutableParams:r}},Be=function(e,{actionDefinition:t,defaultParamsForAction:n={},immutableParamsForAction:r={},toPersist:o={}}){const s=t.href;return async function(i={}){var a;const c={"Content-Type":"application/json",Accept:t.accepts||"application/ion+json"},u=JSON.stringify(Object.assign(Object.assign(Object.assign({},n),i),r));try{const n=await Ie(e,{url:s,method:t.method,headers:c,args:u,withCredentials:null===(a=null===o||void 0===o?void 0:o.withCredentials)||void 0===a||a});return e.idx.makeIdxResponse(Object.assign({},n),o,!0)}catch(l){if(!(l instanceof Ce)||!(null===l||void 0===l?void 0:l.xhr))throw l;const t=l.xhr,n=t.responseJSON||JSON.parse(t.responseText),r=t.headers["WWW-Authenticate"]||t.headers["www-authenticate"],s=e.idx.makeIdxResponse(Object.assign({},n),o,!1);return 401===t.status&&'Oktadevicejwt realm="Okta Device"'===r&&(s.stepUp=!0),s}}},Ve=function(e,t,n){const r=Be,{defaultParams:o,neededParams:s,immutableParams:i}=qe(t),a=r(e,{actionDefinition:t,defaultParamsForAction:o[t.name],immutableParamsForAction:i[t.name],toPersist:n});return a.neededParams=s,a},Ke=function(e,t,n={}){return t.reduce(((t,r)=>Object.assign(Object.assign({},t),{[r.name]:Ve(e,r,n)})),{})};function $e(e){return $e="function"===typeof Symbol&&"symbol"===typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"===typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e},$e(e)}function We(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}function ze(e,t){if("function"!==typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function");e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,writable:!0,configurable:!0}}),t&&Je(e,t)}function Ge(e){return Ge=Object.setPrototypeOf?Object.getPrototypeOf:function(e){return e.__proto__||Object.getPrototypeOf(e)},Ge(e)}function Je(e,t){return Je=Object.setPrototypeOf||function(e,t){return e.__proto__=t,e},Je(e,t)}function Qe(){if("undefined"===typeof Reflect||!Reflect.construct)return!1;if(Reflect.construct.sham)return!1;if("function"===typeof Proxy)return!0;try{return Boolean.prototype.valueOf.call(Reflect.construct(Boolean,[],(function(){}))),!0}catch(e){return!1}}function Ye(e,t,n){return Ye=Qe()?Reflect.construct:function(e,t,n){var r=[null];r.push.apply(r,t);var o=Function.bind.apply(e,r),s=new o;return n&&Je(s,n.prototype),s},Ye.apply(null,arguments)}function Xe(e){return-1!==Function.toString.call(e).indexOf("[native code]")}function Ze(e){var t="function"===typeof Map?new Map:void 0;return Ze=function(e){if(null===e||!Xe(e))return e;if("function"!==typeof e)throw new TypeError("Super expression must either be null or a function");if("undefined"!==typeof t){if(t.has(e))return t.get(e);t.set(e,n)}function n(){return Ye(e,arguments,Ge(this).constructor)}return n.prototype=Object.create(e.prototype,{constructor:{value:n,enumerable:!1,writable:!0,configurable:!0}}),Je(n,e)},Ze(e)}function et(e){if(void 0===e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return e}function tt(e,t){return!t||"object"!==typeof t&&"function"!==typeof t?et(e):t}function nt(e){var t=Qe();return function(){var n,r=Ge(e);if(t){var o=Ge(this).constructor;n=Reflect.construct(r,arguments,o)}else n=r.apply(this,arguments);return tt(this,n)}}function rt(e){return ot(e)||st(e)||it(e)||ct()}function ot(e){if(Array.isArray(e))return at(e)}function st(e){if("undefined"!==typeof Symbol&&null!=e[Symbol.iterator]||null!=e["@@iterator"])return Array.from(e)}function it(e,t){if(e){if("string"===typeof e)return at(e,t);var n=Object.prototype.toString.call(e).slice(8,-1);return"Object"===n&&e.constructor&&(n=e.constructor.name),"Map"===n||"Set"===n?Array.from(e):"Arguments"===n||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)?at(e,t):void 0}}function at(e,t){(null==t||t>e.length)&&(t=e.length);for(var n=0,r=new Array(t);n<t;n++)r[n]=e[n];return r}function ct(){throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}function ut(e,t){var n="undefined"!==typeof Symbol&&e[Symbol.iterator]||e["@@iterator"];if(!n){if(Array.isArray(e)||(n=it(e))||t&&e&&"number"===typeof e.length){n&&(e=n);var r=0,o=function(){};return{s:o,n:function(){return r>=e.length?{done:!0}:{done:!1,value:e[r++]}},e:function(e){throw e},f:o}}throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}var s,i=!0,a=!1;return{s:function(){n=n.call(e)},n:function(){var e=n.next();return i=e.done,e},e:function(e){a=!0,s=e},f:function(){try{i||null==n.return||n.return()}finally{if(a)throw s}}}}var lt=Object.prototype.hasOwnProperty;function dt(e,t){return e=e.slice(),e.push(t),e}function ht(e,t){return t=t.slice(),t.unshift(e),t}var pt=function(e){ze(n,e);var t=nt(n);function n(e){var r;return We(this,n),r=t.call(this,'JSONPath should not be called with "new" (it prevents return of (unwrapped) scalar values)'),r.avoidNew=!0,r.value=e,r.name="NewError",r}return n}(Ze(Error));function ft(e,t,n,r,o){if(!(this instanceof ft))try{return new ft(e,t,n,r,o)}catch(c){if(!c.avoidNew)throw c;return c.value}"string"===typeof e&&(o=r,r=n,n=t,t=e,e=null);var s=e&&"object"===$e(e);if(e=e||{},this.json=e.json||n,this.path=e.path||t,this.resultType=e.resultType||"value",this.flatten=e.flatten||!1,this.wrap=!lt.call(e,"wrap")||e.wrap,this.sandbox=e.sandbox||{},this.preventEval=e.preventEval||!1,this.parent=e.parent||null,this.parentProperty=e.parentProperty||null,this.callback=e.callback||r||null,this.otherTypeCallback=e.otherTypeCallback||o||function(){throw new TypeError("You must supply an otherTypeCallback callback option with the @other() operator.")},!1!==e.autostart){var i={path:s?e.path:t};s?"json"in e&&(i.json=e.json):i.json=n;var a=this.evaluate(i);if(!a||"object"!==$e(a))throw new pt(a);return a}}ft.prototype.evaluate=function(e,t,n,r){var o=this,s=this.parent,i=this.parentProperty,a=this.flatten,c=this.wrap;if(this.currResultType=this.resultType,this.currPreventEval=this.preventEval,this.currSandbox=this.sandbox,n=n||this.callback,this.currOtherTypeCallback=r||this.otherTypeCallback,t=t||this.json,e=e||this.path,e&&"object"===$e(e)&&!Array.isArray(e)){if(!e.path&&""!==e.path)throw new TypeError('You must supply a "path" property when providing an object argument to JSONPath.evaluate().');if(!lt.call(e,"json"))throw new TypeError('You must supply a "json" property when providing an object argument to JSONPath.evaluate().');var u=e;t=u.json,a=lt.call(e,"flatten")?e.flatten:a,this.currResultType=lt.call(e,"resultType")?e.resultType:this.currResultType,this.currSandbox=lt.call(e,"sandbox")?e.sandbox:this.currSandbox,c=lt.call(e,"wrap")?e.wrap:c,this.currPreventEval=lt.call(e,"preventEval")?e.preventEval:this.currPreventEval,n=lt.call(e,"callback")?e.callback:n,this.currOtherTypeCallback=lt.call(e,"otherTypeCallback")?e.otherTypeCallback:this.currOtherTypeCallback,s=lt.call(e,"parent")?e.parent:s,i=lt.call(e,"parentProperty")?e.parentProperty:i,e=e.path}if(s=s||null,i=i||null,Array.isArray(e)&&(e=ft.toPathString(e)),(e||""===e)&&t){var l=ft.toPathArray(e);"$"===l[0]&&l.length>1&&l.shift(),this._hasParentSelector=null;var d=this._trace(l,t,["$"],s,i,n).filter((function(e){return e&&!e.isParentSelector}));return d.length?c||1!==d.length||d[0].hasArrExpr?d.reduce((function(e,t){var n=o._getPreferredOutput(t);return a&&Array.isArray(n)?e=e.concat(n):e.push(n),e}),[]):this._getPreferredOutput(d[0]):c?[]:void 0}},ft.prototype._getPreferredOutput=function(e){var t=this.currResultType;switch(t){case"all":var n=Array.isArray(e.path)?e.path:ft.toPathArray(e.path);return e.pointer=ft.toPointer(n),e.path="string"===typeof e.path?e.path:ft.toPathString(e.path),e;case"value":case"parent":case"parentProperty":return e[t];case"path":return ft.toPathString(e[t]);case"pointer":return ft.toPointer(e.path);default:throw new TypeError("Unknown result type")}},ft.prototype._handleCallback=function(e,t,n){if(t){var r=this._getPreferredOutput(e);e.path="string"===typeof e.path?e.path:ft.toPathString(e.path),t(r,n,e)}},ft.prototype._trace=function(e,t,n,r,o,s,i,a){var c,u=this;if(!e.length)return c={path:n,value:t,parent:r,parentProperty:o,hasArrExpr:i},this._handleCallback(c,s,"value"),c;var l=e[0],d=e.slice(1),h=[];function p(e){Array.isArray(e)?e.forEach((function(e){h.push(e)})):h.push(e)}if(("string"!==typeof l||a)&&t&&lt.call(t,l))p(this._trace(d,t[l],dt(n,l),t,l,s,i));else if("*"===l)this._walk(l,d,t,n,r,o,s,(function(e,t,n,r,o,s,i,a){p(u._trace(ht(e,n),r,o,s,i,a,!0,!0))}));else if(".."===l)p(this._trace(d,t,n,r,o,s,i)),this._walk(l,d,t,n,r,o,s,(function(e,t,n,r,o,s,i,a){"object"===$e(r[e])&&p(u._trace(ht(t,n),r[e],dt(o,e),r,e,a,!0))}));else{if("^"===l)return this._hasParentSelector=!0,{path:n.slice(0,-1),expr:d,isParentSelector:!0};if("~"===l)return c={path:dt(n,l),value:o,parent:r,parentProperty:null},this._handleCallback(c,s,"property"),c;if("$"===l)p(this._trace(d,t,n,null,null,s,i));else if(/^(\x2D?[0-9]*):(\x2D?[0-9]*):?([0-9]*)$/.test(l))p(this._slice(l,d,t,n,r,o,s));else if(0===l.indexOf("?(")){if(this.currPreventEval)throw new Error("Eval [?(expr)] prevented in JSONPath expression.");this._walk(l,d,t,n,r,o,s,(function(e,t,n,r,o,s,i,a){u._eval(t.replace(/^\?\(((?:[\0-\t\x0B\f\x0E-\u2027\u202A-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF])*?)\)$/,"$1"),r[e],e,o,s,i)&&p(u._trace(ht(e,n),r,o,s,i,a,!0))}))}else if("("===l[0]){if(this.currPreventEval)throw new Error("Eval [(expr)] prevented in JSONPath expression.");p(this._trace(ht(this._eval(l,t,n[n.length-1],n.slice(0,-1),r,o),d),t,n,r,o,s,i))}else if("@"===l[0]){var f=!1,g=l.slice(1,-2);switch(g){case"scalar":t&&["object","function"].includes($e(t))||(f=!0);break;case"boolean":case"string":case"undefined":case"function":$e(t)===g&&(f=!0);break;case"integer":!Number.isFinite(t)||t%1||(f=!0);break;case"number":Number.isFinite(t)&&(f=!0);break;case"nonFinite":"number"!==typeof t||Number.isFinite(t)||(f=!0);break;case"object":t&&$e(t)===g&&(f=!0);break;case"array":Array.isArray(t)&&(f=!0);break;case"other":f=this.currOtherTypeCallback(t,n,r,o);break;case"null":null===t&&(f=!0);break;default:throw new TypeError("Unknown value type "+g)}if(f)return c={path:n,value:t,parent:r,parentProperty:o},this._handleCallback(c,s,"value"),c}else if("`"===l[0]&&t&&lt.call(t,l.slice(1))){var m=l.slice(1);p(this._trace(d,t[m],dt(n,m),t,m,s,i,!0))}else if(l.includes(",")){var v,y=l.split(","),w=ut(y);try{for(w.s();!(v=w.n()).done;){var k=v.value;p(this._trace(ht(k,d),t,n,r,o,s,!0))}}catch(A){w.e(A)}finally{w.f()}}else!a&&t&&lt.call(t,l)&&p(this._trace(d,t[l],dt(n,l),t,l,s,i,!0))}if(this._hasParentSelector)for(var b=0;b<h.length;b++){var T=h[b];if(T&&T.isParentSelector){var S=this._trace(T.expr,t,T.path,r,o,s,i);if(Array.isArray(S)){h[b]=S[0];for(var O=S.length,_=1;_<O;_++)b++,h.splice(b,0,S[_])}else h[b]=S}}return h},ft.prototype._walk=function(e,t,n,r,o,s,i,a){if(Array.isArray(n))for(var c=n.length,u=0;u<c;u++)a(u,e,t,n,r,o,s,i);else n&&"object"===$e(n)&&Object.keys(n).forEach((function(c){a(c,e,t,n,r,o,s,i)}))},ft.prototype._slice=function(e,t,n,r,o,s,i){if(Array.isArray(n)){var a=n.length,c=e.split(":"),u=c[2]&&Number.parseInt(c[2])||1,l=c[0]&&Number.parseInt(c[0])||0,d=c[1]&&Number.parseInt(c[1])||a;l=l<0?Math.max(0,l+a):Math.min(a,l),d=d<0?Math.max(0,d+a):Math.min(a,d);for(var h=[],p=l;p<d;p+=u){var f=this._trace(ht(p,t),n,r,o,s,i,!0);f.forEach((function(e){h.push(e)}))}return h}},ft.prototype._eval=function(e,t,n,r,o,s){e.includes("@parentProperty")&&(this.currSandbox._$_parentProperty=s,e=e.replace(/@parentProperty/g,"_$_parentProperty")),e.includes("@parent")&&(this.currSandbox._$_parent=o,e=e.replace(/@parent/g,"_$_parent")),e.includes("@property")&&(this.currSandbox._$_property=n,e=e.replace(/@property/g,"_$_property")),e.includes("@path")&&(this.currSandbox._$_path=ft.toPathString(r.concat([n])),e=e.replace(/@path/g,"_$_path")),e.includes("@root")&&(this.currSandbox._$_root=this.json,e=e.replace(/@root/g,"_$_root")),/@([\t-\r \)\.\[\xA0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000\uFEFF])/.test(e)&&(this.currSandbox._$_v=t,e=e.replace(/@([\t-\r \)\.\[\xA0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000\uFEFF])/g,"_$_v$1"));try{return this.vm.runInNewContext(e,this.currSandbox)}catch(i){throw console.log(i),new Error("jsonPath: "+i.message+": "+e)}},ft.cache={},ft.toPathString=function(e){for(var t=e,n=t.length,r="$",o=1;o<n;o++)/^(~|\^|@(?:[\0-\t\x0B\f\x0E-\u2027\u202A-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF])*?\(\))$/.test(t[o])||(r+=/^[\*0-9]+$/.test(t[o])?"["+t[o]+"]":"['"+t[o]+"']");return r},ft.toPointer=function(e){for(var t=e,n=t.length,r="",o=1;o<n;o++)/^(~|\^|@(?:[\0-\t\x0B\f\x0E-\u2027\u202A-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF])*?\(\))$/.test(t[o])||(r+="/"+t[o].toString().replace(/~/g,"~0").replace(/\//g,"~1"));return r},ft.toPathArray=function(e){var t=ft.cache;if(t[e])return t[e].concat();var n=[],r=e.replace(/@(?:null|boolean|number|string|integer|undefined|nonFinite|scalar|array|object|function|other)\(\)/g,";$&;").replace(/['\[](\??\((?:[\0-\t\x0B\f\x0E-\u2027\u202A-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF])*?\))['\]]/g,(function(e,t){return"[#"+(n.push(t)-1)+"]"})).replace(/\[["']((?:(?!['\]])[\s\S])*)["']\]/g,(function(e,t){return"['"+t.replace(/\./g,"%@%").replace(/~/g,"%%@@%%")+"']"})).replace(/~/g,";~;").replace(/["']?\.["']?(?!(?:(?!\[)[\s\S])*\])|\[["']?/g,";").replace(/%@%/g,".").replace(/%%@@%%/g,"~").replace(/(?:;)?(\^+)(?:;)?/g,(function(e,t){return";"+t.split("").join(";")+";"})).replace(/;;;|;;/g,";..;").replace(/;$|'?\]|'$/g,""),o=r.split(";").map((function(e){var t=e.match(/#([0-9]+)/);return t&&t[1]?n[t[1]]:e}));return t[e]=o,t[e].concat()};var gt=function(e,t,n){for(var r=e.length,o=0;o<r;o++){var s=e[o];n(s)&&t.push(e.splice(o--,1)[0])}};
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
function mt(e){return ft(Object.assign({preventEval:!0},e))}ft.prototype.vm={runInNewContext:function(e,t){var n=Object.keys(t),r=[];gt(n,r,(function(e){return"function"===typeof t[e]}));var o=n.map((function(e,n){return t[e]})),s=r.reduce((function(e,n){var r=t[n].toString();return/function/.test(r)||(r="function "+r),"var "+n+"="+r+";"+e}),"");e=s+e,/(["'])use strict\1/.test(e)||n.includes("arguments")||(e="var arguments = undefined;"+e),e=e.replace(/;[\t-\r \xA0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000\uFEFF]*$/,"");var i=e.lastIndexOf(";"),a=i>-1?e.slice(0,i+1)+" return "+e.slice(i+1):" return "+e;return Ye(Function,rt(n).concat([a])).apply(void 0,rt(o))}};
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
const vt={remediation:!0,context:!0},yt=function(e,t,n={}){const r={},o={};return Object.keys(t).filter((e=>!vt[e])).forEach((s=>{const i="object"===typeof t[s]&&!!t[s];if(!i)return void(o[s]=t[s]);if(t[s].rel)return void(r[t[s].name]=Ve(e,t[s],n));const a=t[s],{value:c,type:u}=a,l=Le(a,["value","type"]);o[s]=Object.assign({type:u},l),"object"===u?(o[s].value={},Object.entries(c).forEach((([t,i])=>{i.rel?r[`${s}-${t.name||t}`]=Ve(e,i,n):o[s].value[t]=i}))):o[s].value=c})),{context:o,actions:r}},wt=(e,t)=>{Object.keys(t).forEach((n=>{if("relatesTo"===n){const r=Array.isArray(t[n])?t[n][0]:t[n];if("string"===typeof r){const o=mt({path:r,json:e})[0];if(o)return void(t[n]=o);throw new L(`Cannot resolve relatesTo: ${r}`)}}Array.isArray(t[n])&&t[n].forEach((t=>wt(e,t)))}))},kt=(e,t,n)=>{if(t.rel){const r=Ke(e,[t],n),o=r[t.name];return Object.assign(Object.assign({},t),{action:o})}return t},bt=function(e,t,n={}){var r;const o=(null===(r=t.remediation)||void 0===r?void 0:r.value)||[];o.forEach((e=>{var n;if("launch-authenticator"!==e.name||"authenticatorChallenge"!==(null===(n=null===e||void 0===e?void 0:e.relatesTo)||void 0===n?void 0:n[0])||(null===t||void 0===t?void 0:t.authenticatorChallenge))return wt(t,e);delete e.relatesTo}));const s=o.map((t=>kt(e,t,n))),{context:i,actions:a}=yt(e,t,n);return{remediations:s,context:i,actions:a}};
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
function Tt(e,t,n,r){var o,s,i;const a=t,{remediations:c,context:u,actions:l}=bt(e,t,n),d=[...c],h=async function(e,t={}){const n=c.find((t=>t.name===e));if(!n)return Promise.reject(`Unknown remediation choice: [${e}]`);const r=n.action;return"function"!==typeof r?Promise.reject(`Current remediation cannot make form submit action: [${e}]`):n.action(t)},p=e=>"interaction_code"===e.name,f=null===(i=null===(s=null===(o=a.successWithInteractionCode)||void 0===o?void 0:o.value)||void 0===s?void 0:s.find(p))||void 0===i?void 0:i.value;return{proceed:h,neededToProceed:d,actions:l,context:u,rawIdxState:a,interactionCode:f,toPersist:n,requestDidSucceed:r}}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
var St={makeIdxState:Tt};
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
const Ot=function(e){switch(e){case"1.0.0":return St;case void 0:case null:throw new Error("Api version is required");default:throw new Error(`Unknown api version: ${e}.  Use an exact semver version.`)}};function _t(e){if(!e)throw new Error("version is required");const t=(null!==e&&void 0!==e?e:"").replace(/[^0-9a-zA-Z._-]/,"");if(t!==e||!e)throw new Error("invalid version supplied - version is required and uses semver syntax");Ot(e)}function At(e,t,n,r){var o;const s=null!==(o=null===t||void 0===t?void 0:t.version)&&void 0!==o?o:xe;_t(s);const{makeIdxState:i}=Ot(s);return i(e,t,n,r)}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
function Et(e){return e&&e.version}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
function Pt(e){return e instanceof Ce}function xt(e){return e instanceof je}function Ct(e){return e instanceof C}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
async function jt(e,t={}){var n;let r,o;const s=e.transactionManager.loadIdxResponse(t);if(s&&(r=s.rawIdxResponse,o=s.requestDidSucceed),!r){const s=t.version||xe,i=V(e),{interactionHandle:c,stateHandle:u}=t,l=null===(n=t.withCredentials)||void 0===n||n;try{o=!0,_t(s);const t=`${i}/idp/idx/introspect`,n=u?{stateToken:u}:{interactionHandle:c},a={"Content-Type":`application/ion+json; okta-version=${s}`,Accept:`application/ion+json; okta-version=${s}`};r=await Ie(e,{method:"POST",url:t,headers:a,withCredentials:l,args:n})}catch(a){if(!(Pt(a)&&a.xhr&&Et(a.xhr.responseJSON)))throw a;r=a.xhr.responseJSON,o=!1}}const{withCredentials:i}=t;return At(e,r,{withCredentials:i},o)}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
function Rt(e){var t;return null===(t=e.value)||void 0===t?void 0:t.map((e=>e.name))}function It(e){var t;return null===(t=e.value)||void 0===t?void 0:t.reduce(((e,t)=>(t.required&&e.push(t.name),e)),[])}function Mt(e){return e.charAt(0).toUpperCase()+e.substring(1)}function Dt(e){return e.value.find((({name:e})=>"authenticator"===e))}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
function Ut(e){let t;if(g(e))t=e;else{if("string"!==typeof e)throw new Error("Invalid format for authenticator");t={key:e}}return t}function Nt(e,t){return!(!e||!t)&&(e.id&&t.id?e.id===t.id:!(!e.key||!t.key)&&e.key===t.key)}function Lt(e,t){let n;for(let r of e)if(n=t.find((({relatesTo:e})=>e.key&&e.key===r.key)),n)break;return n}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
class Ft{constructor(e,t={},n={}){this.values=Object.assign({},t),this.options=Object.assign({},n),this.formatAuthenticators(),this.remediation=e}formatAuthenticators(){if(this.values.authenticators=this.values.authenticators||[],this.values.authenticators=this.values.authenticators.map((e=>Ut(e))),this.values.authenticator){const e=Ut(this.values.authenticator),t=this.values.authenticators.some((t=>Nt(e,t)));t||this.values.authenticators.push(e)}this.values.authenticatorsData=this.values.authenticators.reduce(((e,t)=>("object"===typeof t&&Object.keys(t).length>1&&e.push(t),e)),this.values.authenticatorsData||[])}getName(){return this.remediation.name}canRemediate(e){const t=It(this.remediation),n=t.find((e=>!this.hasData(e)));return!n}getData(e){if(!e){let e=Rt(this.remediation),t=e.reduce(((e,t)=>(e[t]=this.getData(t),e)),{});return t}if("function"===typeof this[`map${Mt(e)}`]){const t=this[`map${Mt(e)}`](this.remediation.value.find((({name:t})=>t===e)));if(t)return t}if(this.map&&this.map[e]){const t=this.map[e];for(let e=0;e<t.length;e++){let n=this.values[t[e]];if(n)return n}}return this.values[e]}hasData(e){return!!this.getData(e)}getNextStep(e,t){const n=this.getName(),r=this.getInputs(),o=this.getAuthenticator(),s=null===o||void 0===o?void 0:o.type;return Object.assign(Object.assign({name:n,inputs:r},s&&{type:s}),o&&{authenticator:o})}getInputs(){const e=[],t=this.remediation.value||[];return t.forEach((t=>{let n,{name:r,type:o,visible:s,messages:i}=t;if(!1!==s){if("function"===typeof this[`getInput${Mt(r)}`])n=this[`getInput${Mt(r)}`](t);else if("object"!==o){let e;const o=(this.map?this.map[r]:null)||[];e=1===o.length?o[0]:o.find((e=>Object.keys(this.values).includes(e))),e&&(n=Object.assign(Object.assign({},t),{name:e}))}n||(n=t),Array.isArray(n)?n.forEach((t=>e.push(t))):(i&&(n.messages=i),e.push(n))}})),e}static getMessages(e){var t,n;if(e.value)return null===(n=null===(t=e.value[0])||void 0===t?void 0:t.form)||void 0===n?void 0:n.value.reduce(((e,t)=>(t.messages&&(e=[...e,...t.messages.value]),e)),[])}getValuesAfterProceed(){const e=this.remediation.value||[],t=this.getInputs(),n=[...e,...t];for(const r of n)delete this.values[r.name];return this.values}getAuthenticator(){var e,t;const n=null===(e=this.remediation.relatesTo)||void 0===e?void 0:e.value;if(!n)return;const r=Dt(this.remediation);if(!r)return n;const o=r.form.value.find((({name:e})=>"id"===e)).value,s=null===(t=r.form.value.find((({name:e})=>"enrollmentId"===e)))||void 0===t?void 0:t.value;return Object.assign(Object.assign({},n),{id:o,enrollmentId:s})}}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
function Ht(e){if(Array.isArray(e))return e.map((e=>"string"===typeof e||"number"===typeof e||"boolean"===typeof e?e:Ht(e)));const t={};for(const[n,r]of Object.entries(e))if(null!==r&&"undefined"!==typeof r)if("object"===typeof r){const e=Object.keys(r);if(["value","form"].includes(n)&&1===e.length&&["value","form"].includes(e[0])){const e=Ht(r);Object.entries(e).forEach((([e,n])=>{t[e]=n}))}else t[n]=Ht(r)}else t[n]=r;return t}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
class qt extends Ft{canRemediate(){return"function"===typeof this.remediation.action&&(!("poll"!==this.remediation.name&&!this.remediation.name.endsWith("-poll"))||!!this.options.step)}getData(){const e=this.getInputs().reduce(((e,{name:t})=>(e[t]=this.values[t],e)),{});return e}getNextStep(e,t){const n=this.getName(),r=this.getInputs(),o=this.remediation,{href:s,method:i,rel:a,accepts:c,produces:u,value:l,action:d}=o,h=Le(o,["href","method","rel","accepts","produces","value","action"]);return d?Object.assign(Object.assign(Object.assign({},h),!!r.length&&{inputs:r}),{action:async t=>e.idx.proceed(Object.assign({step:n},t))}):Object.assign({},this.remediation)}getInputs(){return(this.remediation.value||[]).filter((({name:e})=>"stateHandle"!==e)).map(Ht).map((e=>(e.type=e.type||"string",e)))}}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
const Bt={remediators:{},getFlowSpecification:function(e,t="default"){return{remediators:{}}}};function Vt(e){Object.assign(Bt,e)}function Kt(e,t="default"){return Bt.getFlowSpecification(e,t)}function $t(e){const{neededToProceed:t,interactionCode:n}=e;return!t.length&&!n}function Wt(e){return e.neededToProceed.some((({name:e})=>"skip"===e))}function zt(e){return Object.keys(e.actions).some((e=>e.includes("resend")))}function Gt(e){if(e&&Array.isArray(e))return e.reduce(((e,t)=>{if(t.messages&&(e=[...e,...t.messages.value]),t.form){const n=Gt(t.form.value)||[];e=[...e,...n]}if(t.options){let n=[];t.options.forEach((e=>{e.value&&"string"!==typeof e.value&&(n=[...n,e.value])}));const r=Gt(n)||[];e=[...e,...r]}return e}),[])}function Jt(e,t){var n;let r=[];const{rawIdxState:o,neededToProceed:s}=e,i=null===(n=o.messages)||void 0===n?void 0:n.value.map((e=>e));if(i&&(r=[...r,...i]),!t.useGenericRemediator)for(let c of s){const e=Gt(c.value);e&&(r=[...r,...e])}const a={};return r=r.reduce(((e,t)=>{var n;const r=null===(n=t.i18n)||void 0===n?void 0:n.key;return r&&a[r]&&t.message===a[r].message||(a[r]=t,e=[...e,t]),e}),[]),r}function Qt(e){const t=[],{actions:n,neededToProceed:r}=e;return n["currentAuthenticator-recover"]&&t.push(d.PASSWORD_RECOVERY),r.some((({name:e})=>"select-enroll-profile"===e))&&t.push(d.REGISTRATION),r.some((({name:e})=>"redirect-idp"===e))&&t.push(d.SOCIAL_IDP),r.some((({name:e})=>"unlock-account"===e))&&t.push(d.ACCOUNT_UNLOCK),t}function Yt(e,t,n){var r;const o=[],s=Object.values(Bt.remediators).reduce(((e,t)=>(t.remediationName&&(e[t.remediationName]=t),e)),{});for(let i of t.neededToProceed){const r=Zt(i,{useGenericRemediator:n,remediators:s});if(r){const n=new r(i);o.push(n.getNextStep(e,t.context))}}for(const[i]of Object.entries(t.actions||{})){let n={name:i,action:async t=>e.idx.proceed({actions:[{name:i,params:t}]})};if(i.startsWith("currentAuthenticator")){const[e,o]=I(i,"-"),s=t.rawIdxState[e].value[o],a=Le(s,["href","method","rel","accepts","produces"]),c=null===(r=s.value)||void 0===r?void 0:r.filter((e=>"stateHandle"!==e.name));n=Object.assign(Object.assign(Object.assign({},a),c&&{value:c}),n)}o.push(n)}return o}function Xt(e,t,n){const r=e.neededToProceed||[],o=r.find((e=>e.name===t));if(!o)return y(`filterValuesForRemediation: "${t}" did not match any remediations`),n;const s=o.value.reduce(((e,t)=>{const{name:r,value:o}=t;return e[r]="stateHandle"===r?o:n[r],e}),{});return s}function Zt(e,t){const{useGenericRemediator:n,remediators:r}=t;if(e)return n?qt:r[e.name]}function en(e,t,n){const r=n.remediators,o=n.useGenericRemediator,{neededToProceed:s,context:i}=e;let a;if(n.step){const e=s.find((({name:e})=>e===n.step));if(e){const r=Zt(e,n);return r?new r(e,t,n):void 0}return void y(`step "${n.step}" did not match any remediations`)}const c=[];if(o)c.push(new qt(s[0],t,n));else for(let u of s){const e=Object.keys(r).includes(u.name);if(!e)continue;const o=Zt(u,n);if(a=new o(u,t,n),a.canRemediate(i))return a;c.push(a)}return c[0]}function tn(e,t,n){const r=t.getNextStep(e,n.context),o=Wt(n),s=zt(n);return Object.assign(Object.assign(Object.assign({},r),o&&{canSkip:o}),s&&{canResend:s})}function nn(e,t,n={}){const r=$t(t),o=Jt(t,n);if(r)return{idxResponse:t,terminal:r,messages:o};{const r=en(t,{},n),s=r&&tn(e,r,t);return Object.assign({idxResponse:t,messages:o},s&&{nextStep:s})}}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
function rn(e,t){return Object.keys(t.actions).find((t=>!!e.resend&&t.includes("-resend")))}function on(e){return Object.assign(Object.assign({},e),{resend:void 0})}function sn(e,t){let n=e.actions||[];return n=n.filter((e=>"string"===typeof e?e!==t:e.name!==t)),Object.assign(Object.assign({},e),{actions:n})}async function an(e,t,n,r){let{neededToProceed:o,interactionCode:s}=t;const{flow:i}=r;if(s)return{idxResponse:t};const a=en(t,n,r),c=rn(n,t),u=r.actions||[],l=[...u,...c&&[c]||[]];if(l)for(let f of l){let s={};"string"!==typeof f&&(s=f.params||{},f=f.name);let i=on(n),a=sn(r,f);if("function"===typeof t.actions[f])return t=await t.actions[f](s),!1===t.requestDidSucceed?nn(e,t,r):"cancel"===f?{idxResponse:t,canceled:!0}:an(e,t,i,a);const c=o.find((({name:e})=>e===f));if(c)return t=await t.proceed(f,s),!1===t.requestDidSucceed?nn(e,t,r):an(e,t,n,a)}const d=$t(t);if(d)return{idxResponse:t,terminal:d};if(!a){if(r.step)return n=Xt(t,r.step,n),t=await t.proceed(r.step,n),!1===t.requestDidSucceed?nn(e,t,r):{idxResponse:t};if("default"===i)return{idxResponse:t};throw new L(`\n      No remediation can match current flow, check policy settings in your org.\n      Remediations: [${o.reduce(((e,t)=>e?e+" ,"+t.name:t.name),"")}]\n    `)}if(!a.canRemediate()){const n=tn(e,a,t);return{idxResponse:t,nextStep:n}}const h=a.getName(),p=a.getData();if(t=await t.proceed(h,p),!1===t.requestDidSucceed)return nn(e,t,r);if(n=a.getValuesAfterProceed(),r=Object.assign(Object.assign({},r),{step:void 0}),r.useGenericRemediator&&!t.interactionCode&&!$t(t)){const o=en(t,n,r),s=tn(e,o,t);return{idxResponse:t,nextStep:s}}return an(e,t,n,r)}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
function cn(e){const t=["flow","remediators","actions","withCredentials","step","useGenericRemediator","exchangeCodeForTokens"],n=Object.assign({},e);return t.forEach((e=>{delete n[e]})),n}function un(e,t){var n,r,o,s;let{options:i}=t;i=Object.assign(Object.assign({},e.options.idx),i);let{flow:a,withCredentials:c,remediators:l,actions:d}=i;const h=u.PENDING;if(a=a||(null===(r=(n=e.idx).getFlow)||void 0===r?void 0:r.call(n))||"default",a){null===(s=(o=e.idx).setFlow)||void 0===s||s.call(o,a);const t=Kt(e,a);c="undefined"!==typeof c?c:t.withCredentials,l=l||t.remediators,d=d||t.actions}return Object.assign(Object.assign({},t),{options:Object.assign(Object.assign({},i),{flow:a,withCredentials:c,remediators:l,actions:d}),status:h})}async function ln(e,t){const{options:n}=t,{stateHandle:r,withCredentials:o,version:s,state:i,scopes:a,recoveryToken:c,activationToken:u,maxAge:l,acrValues:d,nonce:h,useGenericRemediator:p}=n;let f,g=oe(e,{state:i,recoveryToken:c,activationToken:u});if(r)f=await jt(e,{withCredentials:o,version:s,stateHandle:r,useGenericRemediator:p});else{let t=null===g||void 0===g?void 0:g.interactionHandle;if(!t){e.transactionManager.clear();const n=await Ne(e,{withCredentials:o,state:i,scopes:a,activationToken:u,recoveryToken:c,maxAge:l,acrValues:d,nonce:h});t=n.interactionHandle,g=n.meta}f=await jt(e,{withCredentials:o,version:s,interactionHandle:t,useGenericRemediator:p})}return Object.assign(Object.assign({},t),{idxResponse:f,meta:g})}async function dn(e,t){let{idxResponse:n,options:r,values:o}=t;const{autoRemediate:s,remediators:i,actions:a,flow:c,step:u,useGenericRemediator:l}=r,d=!1!==s&&(i||a||u);if(!d)return t;o=Object.assign(Object.assign({},o),{stateHandle:n.rawIdxState.stateHandle});const{idxResponse:h,nextStep:p,canceled:f}=await an(e,n,o,{remediators:i,actions:a,flow:c,step:u,useGenericRemediator:l});return n=h,Object.assign(Object.assign({},t),{idxResponse:n,nextStep:p,canceled:f})}async function hn(e,t){let{meta:n,idxResponse:r}=t;const{interactionCode:o}=r,{clientId:s,codeVerifier:i,ignoreSignature:a,redirectUri:c,urls:u,scopes:l}=n,d=await e.token.exchangeCodeForTokens({interactionCode:o,clientId:s,codeVerifier:i,ignoreSignature:a,redirectUri:c,scopes:l},u);return d.tokens}async function pn(e,t){let{options:n,idxResponse:r,canceled:o,status:s}=t;const{exchangeCodeForTokens:i}=n;let a,c,l,d,h,p,f=!1,g=!1,m=!0;if(r&&(f=!(!r.requestDidSucceed&&!r.stepUp),l=Qt(r),d=Yt(e,r,n.useGenericRemediator),h=Jt(r,n),p=$t(r)),p){s=u.TERMINAL;const e=Object.keys(r.actions).length>0,t=!!h.find((e=>"ERROR"===e.class)),n=!e&&!t&&!0===r.requestDidSucceed;n?g=!0:f=!!e,m=!1}else o?(s=u.CANCELED,g=!0):(null===r||void 0===r?void 0:r.interactionCode)&&(a=r.interactionCode,!1===i?(s=u.SUCCESS,g=!1):(c=await hn(e,t),s=u.SUCCESS,g=!0));return Object.assign(Object.assign({},t),{status:s,interactionCode:a,tokens:c,shouldSaveResponse:f,shouldClearTransaction:g,clearSharedStorage:m,enabledFeatures:l,availableSteps:d,messages:h,terminal:p})}async function fn(e,t={}){var n;let r={options:t,values:cn(t)};r=un(e,r),r=await ln(e,r),r=await dn(e,r),r=await pn(e,r);const{idxResponse:o,meta:s,shouldSaveResponse:i,shouldClearTransaction:a,clearSharedStorage:c,status:u,enabledFeatures:l,availableSteps:d,tokens:h,nextStep:p,messages:f,error:g,interactionCode:m}=r;if(a)e.transactionManager.clear({clearSharedStorage:c});else if(ie(e,Object.assign({},s)),i){const{rawIdxState:t,requestDidSucceed:r}=o;e.transactionManager.saveIdxResponse({rawIdxResponse:t,requestDidSucceed:r,stateHandle:null===(n=o.context)||void 0===n?void 0:n.stateHandle,interactionHandle:null===s||void 0===s?void 0:s.interactionHandle})}const{actions:v,context:y,neededToProceed:w,proceed:k,rawIdxState:b,requestDidSucceed:T,stepUp:S}=o||{};return Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({status:u},s&&{meta:s}),l&&{enabledFeatures:l}),d&&{availableSteps:d}),h&&{tokens:h}),p&&{nextStep:p}),f&&f.length&&{messages:f}),g&&{error:g}),S&&{stepUp:S}),{interactionCode:m,actions:v,context:y,neededToProceed:w,proceed:k,rawIdxState:b,requestDidSucceed:T})}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
async function gn(e,t={}){return t.password&&!t.authenticator&&(t.authenticator=l.OKTA_PASSWORD),fn(e,Object.assign(Object.assign({},t),{flow:"authenticate"}))}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
class mn{constructor(e){this.meta=e}}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
class vn extends mn{canVerify(e){return!!(e.credentials||e.verificationCode||e.otp)}mapCredentials(e){const{credentials:t,verificationCode:n,otp:r}=e;if(t||n||r)return t||{passcode:n||r}}getInputs(e){var t;return Object.assign(Object.assign({},null===(t=e.form)||void 0===t?void 0:t.value[0]),{name:"verificationCode",type:"string",required:e.required})}}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
class yn extends vn{mapCredentials(e){const{verificationCode:t}=e;if(t)return{totp:t}}}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
class wn extends mn{canVerify(e){return!!(e.credentials||e.password||e.passcode)}mapCredentials(e){const{credentials:t,password:n,passcode:r,revokeSessions:o}=e;if(t||n||r)return t||{passcode:r||n,revokeSessions:o}}getInputs(e){var t,n;const r=[Object.assign(Object.assign({},null===(t=e.form)||void 0===t?void 0:t.value[0]),{name:"password",type:"string",required:e.required})],o=null===(n=e.form)||void 0===n?void 0:n.value.find((e=>"revokeSessions"===e.name));return o&&r.push({name:"revokeSessions",type:"boolean",label:"Sign me out of all other devices",required:!1}),r}}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
class kn extends mn{canVerify(e){const{credentials:t}=e;if(t&&t.questionKey&&t.answer)return!0;const{questionKey:n,question:r,answer:o}=e;return!(!n||!o)||!(!r||!o)}mapCredentials(e){const{questionKey:t,question:n,answer:r}=e;if(r&&(t||n))return{questionKey:n?"custom":t,question:n,answer:r}}getInputs(){return[{name:"questionKey",type:"string",required:!0},{name:"question",type:"string",label:"Create a security question"},{name:"answer",type:"string",label:"Answer",required:!0}]}}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
class bn extends mn{canVerify(e){const{credentials:t}=e;if(t&&t.answer)return!0;const{answer:n}=e;return!!n}mapCredentials(e){const{answer:t}=e;if(t)return{questionKey:this.meta.contextualData.enrolledQuestion.questionKey,answer:t}}getInputs(){return[{name:"answer",type:"string",label:"Answer",required:!0}]}}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
class Tn extends mn{canVerify(e){const{credentials:t}=e,n=t||e,{clientData:r,attestation:o}=n;return!(!r||!o)}mapCredentials(e){const{credentials:t,clientData:n,attestation:r}=e;if(t||n||r)return t||{clientData:n,attestation:r}}getInputs(){return[{name:"clientData",type:"string",required:!0,visible:!1,label:"Client Data"},{name:"attestation",type:"string",required:!0,visible:!1,label:"Attestation"}]}}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
class Sn extends mn{canVerify(e){const{credentials:t}=e,n=t||e,{clientData:r,authenticatorData:o,signatureData:s}=n;return!!(r&&o&&s)}mapCredentials(e){const{credentials:t,authenticatorData:n,clientData:r,signatureData:o}=e;if(t||n||r||o)return t||{authenticatorData:n,clientData:r,signatureData:o}}getInputs(){return[{name:"authenticatorData",type:"string",label:"Authenticator Data",required:!0,visible:!1},{name:"clientData",type:"string",label:"Client Data",required:!0,visible:!1},{name:"signatureData",type:"string",label:"Signature Data",required:!0,visible:!1}]}}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
function On(e){var t,n;const r=e.relatesTo,o=(null===r||void 0===r?void 0:r.value)||{};switch(o.key){case l.OKTA_PASSWORD:return new wn(o);case l.SECURITY_QUESTION:return(null===(t=o.contextualData)||void 0===t?void 0:t.enrolledQuestion)?new bn(o):new kn(o);case l.OKTA_VERIFY:return new yn(o);case l.WEBAUTHN:return(null===(n=o.contextualData)||void 0===n?void 0:n.challengeData)?new Sn(o):new Tn(o);default:return new vn(o)}}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
class _n extends Ft{constructor(e,t={}){super(e,t),this.authenticator=On(e)}getNextStep(e,t){var n;const r=super.getNextStep(e,t),o=null===(n=null===t||void 0===t?void 0:t.authenticatorEnrollments)||void 0===n?void 0:n.value;return Object.assign(Object.assign({},r),{authenticatorEnrollments:o})}canRemediate(){return this.authenticator.canVerify(this.values)}mapCredentials(){return this.authenticator.mapCredentials(this.values)}getInputCredentials(e){return this.authenticator.getInputs(e)}getValuesAfterProceed(){this.values=super.getValuesAfterProceed();let e=Object.keys(this.values).filter((e=>"credentials"!==e));return e.reduce(((e,t)=>Object.assign(Object.assign({},e),{[t]:this.values[t]})),{})}}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
class An extends _n{}An.remediationName="enroll-authenticator";
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
class En extends Ft{canRemediate(){return!!this.values.startPolling||"enroll-poll"===this.options.step}getNextStep(e,t){const n=super.getNextStep(e,t);let r=this.getAuthenticator();return!r&&(null===t||void 0===t?void 0:t.currentAuthenticator)&&(r=t.currentAuthenticator.value),Object.assign(Object.assign({},n),{authenticator:r,poll:{required:!0,refresh:this.remediation.refresh}})}getValuesAfterProceed(){let e=Object.keys(this.values).filter((e=>"startPolling"!==e));return e.reduce(((e,t)=>Object.assign(Object.assign({},e),{[t]:this.values[t]})),{})}}En.remediationName="enroll-poll";
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
class Pn extends Ft{canRemediate(){if(this.values.channel)return!0;if(this.values.authenticator){const{id:e,channel:t}=this.values.authenticator;if(e&&t)return!0}return!1}getNextStep(e,t){const n=super.getNextStep(e,t),r=t.currentAuthenticator.value;return Object.assign(Object.assign({},n),{authenticator:r})}getData(){var e;const t=this.remediation.value[0].value;return{authenticator:{id:t.form.value[0].value,channel:(null===(e=this.values.authenticator)||void 0===e?void 0:e.channel)||this.values.channel},stateHandle:this.values.stateHandle}}getValuesAfterProceed(){this.values=super.getValuesAfterProceed(),delete this.values.authenticators;const e=this.values.channel?"channel":"authenticator";let t=Object.keys(this.values).filter((t=>t!==e));return t.reduce(((e,t)=>Object.assign(Object.assign({},e),{[t]:this.values[t]})),{})}}Pn.remediationName="select-enrollment-channel";
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
class xn extends Ft{getInputEmail(){return[{name:"email",type:"string",required:!0,label:"Email"}]}getInputPhoneNumber(){return[{name:"phoneNumber",type:"string",required:!0,label:"Phone Number"}]}canRemediate(){return Boolean(this.values.email||this.values.phoneNumber)}getNextStep(e,t){const n=super.getNextStep(e,t),r=t.currentAuthenticator.value;return Object.assign(Object.assign({},n),{authenticator:r})}getData(){return{stateHandle:this.values.stateHandle,email:this.values.email,phoneNumber:this.values.phoneNumber}}getValuesAfterProceed(){let e=Object.keys(this.values).filter((e=>!["email","phoneNumber"].includes(e)));return e.reduce(((e,t)=>Object.assign(Object.assign({},e),{[t]:this.values[t]})),{})}}xn.remediationName="enrollment-channel-data";
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
class Cn extends _n{}Cn.remediationName="challenge-authenticator";
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
class jn extends En{canRemediate(){return!!this.values.startPolling||"challenge-poll"===this.options.step}}jn.remediationName="challenge-poll";
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
class Rn extends _n{}Rn.remediationName="reset-authenticator";
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
class In extends Ft{constructor(e,t={},n={}){super(e,t,n),this.authenticator=null;const r=this.getCredentialsFromRemediation();r&&(this.authenticator=this.authenticator=new wn({}))}canRemediate(){if(this.authenticator&&!this.authenticator.canVerify(this.values))return!1;const e=this.getData().userProfile;if(!e)return!1;const t=this.remediation.value.find((({name:e})=>"userProfile"===e));return t.form.value.reduce(((t,n)=>(n.required&&(t=t&&!!e[n.name]),t)),!0)}getCredentialsFromRemediation(){return this.remediation.value.find((({name:e})=>"credentials"===e))}mapUserProfile({form:{value:e}}){const t=e.map((({name:e})=>e)),n=t.reduce(((e,t)=>this.values[t]?Object.assign(Object.assign({},e),{[t]:this.values[t]}):e),{});if(0!==Object.keys(n).length)return n}mapCredentials(){const e=this.authenticator&&this.authenticator.mapCredentials(this.values);if(e)return e}getInputUserProfile(e){return[...e.form.value]}getInputCredentials(e){return[...e.form.value]}getErrorMessages(e){return e.value[0].form.value.reduce(((e,t)=>(t.messages&&e.push(t.messages.value[0].message),e)),[])}}In.remediationName="enroll-profile";
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
class Mn extends Ft{constructor(){super(...arguments),this.map={identifier:["username"]}}canRemediate(){const{identifier:e}=this.getData();return!!e}mapCredentials(){const{credentials:e,password:t}=this.values;if(e||t)return e||{passcode:t}}getInputCredentials(e){return Object.assign(Object.assign({},e.form.value[0]),{name:"password",required:e.required})}}Mn.remediationName="identify";
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
class Dn extends Ft{mapCredentials(){const{newPassword:e}=this.values;if(e)return{passcode:e}}getInputCredentials(e){const t=this.getAuthenticator().type,n="password"===t?"newPassword":"verificationCode";return Object.assign(Object.assign({},e.form.value[0]),{name:n})}}Dn.remediationName="reenroll-authenticator";
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
class Un extends Dn{}Un.remediationName="reenroll-authenticator-warning";
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
class Nn extends Ft{canRemediate(){return!1}getNextStep(){const{name:e,type:t,idp:n,href:r}=this.remediation;return{name:e,type:t,idp:n,href:r}}}Nn.remediationName="redirect-idp";
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
class Ln extends Ft{findMatchedOption(e,t){let n;for(let r of e)if(n=t.find((({relatesTo:e})=>e.key&&e.key===r.key)),n)break;return n}canRemediate(e){var t,n;const{authenticators:r,authenticator:o}=this.values,s=Dt(this.remediation),{options:i}=s;if(!r||!r.length)return!1;if(g(o)&&o.id)return!0;const a=this.findMatchedOption(r,i);if(a){const r=(null===e||void 0===e?void 0:e.currentAuthenticator)&&(null===e||void 0===e?void 0:e.currentAuthenticator.value.id)===(null===(t=a.relatesTo)||void 0===t?void 0:t.id),o=(null===e||void 0===e?void 0:e.currentAuthenticatorEnrollment)&&(null===e||void 0===e?void 0:e.currentAuthenticatorEnrollment.value.id)===(null===(n=a.relatesTo)||void 0===n?void 0:n.id);return!r&&!o}return!1}mapAuthenticator(e){const{authenticators:t,authenticator:n}=this.values;if(g(n)&&n.id)return this.selectedAuthenticator=n,n;const{options:r}=e,o=Lt(t,r);return this.selectedAuthenticator=o.relatesTo,this.selectedOption=o,{id:null===o||void 0===o?void 0:o.value.form.value.find((({name:e})=>"id"===e)).value}}getInputAuthenticator(e){const t=e.options.map((({label:e,relatesTo:t})=>({label:e,value:t.key})));return{name:"authenticator",type:"string",options:t}}getValuesAfterProceed(){this.values=super.getValuesAfterProceed();const e=this.values.authenticators.filter((e=>!0!==Nt(e,this.selectedAuthenticator)));return Object.assign(Object.assign({},this.values),{authenticators:e})}}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
class Fn extends Ln{constructor(e,t={},n={}){var r;super(e,t,n);const o="recoverPassword"===this.options.flow,s=null===(r=Dt(e).options)||void 0===r?void 0:r.some((({relatesTo:e})=>(null===e||void 0===e?void 0:e.key)===l.OKTA_PASSWORD));s&&(o||this.values.password)&&(this.values.authenticators=[...this.values.authenticators||[],{key:l.OKTA_PASSWORD}])}}Fn.remediationName="select-authenticator-authenticate";
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
class Hn extends Ln{}Hn.remediationName="select-authenticator-enroll";
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
class qn extends Ln{constructor(){super(...arguments),this.map={identifier:["username"]}}canRemediate(){const e=this.getData("identifier");return!!e&&super.canRemediate()}mapAuthenticator(e){var t,n,r;const o=super.mapAuthenticator(e),s=null===(t=this.selectedOption)||void 0===t?void 0:t.value.form.value.find((({name:e})=>"methodType"===e)),i=this.values.methodType||(null===s||void 0===s?void 0:s.value)||(null===(r=null===(n=null===s||void 0===s?void 0:s.options)||void 0===n?void 0:n[0])||void 0===r?void 0:r.value);return i?Object.assign(Object.assign({},o),{methodType:i}):o}getInputUsername(){return{name:"username",type:"string"}}}qn.remediationName="select-authenticator-unlock-account";
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
class Bn extends Ft{canRemediate(){return!0}}Bn.remediationName="select-enroll-profile";
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
class Vn extends Ft{constructor(e,t={}){super(e,t),this.authenticator=this.getAuthenticator(),this.formatAuthenticatorData()}formatAuthenticatorData(){const e=this.getAuthenticatorData();if(e)this.values.authenticatorsData=this.values.authenticatorsData.map((e=>Nt(this.authenticator,e)?this.mapAuthenticatorDataFromValues(e):e));else{const e=this.mapAuthenticatorDataFromValues();e&&this.values.authenticatorsData.push(e)}}getAuthenticatorData(){return this.values.authenticatorsData.find((e=>Nt(this.authenticator,e)))}canRemediate(){return this.values.authenticatorsData.some((e=>Nt(this.authenticator,e)))}mapAuthenticatorDataFromValues(e){let{methodType:t,authenticator:n}=this.values;!t&&g(n)&&(t=null===n||void 0===n?void 0:n.methodType);const{id:r,enrollmentId:o}=this.authenticator,s=Object.assign(Object.assign({id:r,enrollmentId:o},e&&e),t&&{methodType:t});return s.methodType?s:null}getAuthenticatorFromRemediation(){const e=this.remediation.value.find((({name:e})=>"authenticator"===e));return e}getValuesAfterProceed(){this.values=super.getValuesAfterProceed();const e=this.values.authenticatorsData.filter((e=>!0!==Nt(this.authenticator,e)));return Object.assign(Object.assign({},this.values),{authenticatorsData:e})}}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
class Kn extends Vn{mapAuthenticator(){return this.getAuthenticatorData()}getInputAuthenticator(){const e=this.getAuthenticatorFromRemediation(),t=e.form.value.find((({name:e})=>"methodType"===e));if(t&&t.options)return{name:"methodType",type:"string",required:!0,options:t.options};const n=[...e.form.value];return n}getValuesAfterProceed(){this.values=super.getValuesAfterProceed();let e=Object.keys(this.values).filter((e=>"authenticator"!==e));return e.reduce(((e,t)=>Object.assign(Object.assign({},e),{[t]:this.values[t]})),{})}}Kn.remediationName="authenticator-verification-data";
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
class $n extends Vn{mapAuthenticator(){const e=this.getAuthenticatorData(),t=Dt(this.remediation);return{id:t.form.value.find((({name:e})=>"id"===e)).value,methodType:e.methodType,phoneNumber:e.phoneNumber}}getInputAuthenticator(e){return[{name:"methodType",type:"string"},{name:"phoneNumber",label:"Phone Number",type:"string"}].map((t=>{const n=e.form.value.find((e=>e.name===t.name));return Object.assign(Object.assign({},n),t)}))}mapAuthenticatorDataFromValues(e){e=super.mapAuthenticatorDataFromValues(e);const{phoneNumber:t}=this.values;if(e||t)return Object.assign(Object.assign({},e&&e),t&&{phoneNumber:t})}}$n.remediationName="authenticator-enrollment-data";
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
class Wn extends Ft{canRemediate(){return!!this.values.skip||"skip"===this.options.step}}Wn.remediationName="skip";
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
const zn={identify:Mn,"select-authenticator-authenticate":Fn,"select-authenticator-enroll":Hn,"authenticator-enrollment-data":$n,"authenticator-verification-data":Kn,"enroll-authenticator":An,"challenge-authenticator":Cn,"challenge-poll":jn,"reenroll-authenticator":Dn,"reenroll-authenticator-warning":Un,"enroll-poll":En,"select-enrollment-channel":Pn,"enrollment-channel-data":xn,"redirect-idp":Nn,skip:Wn},Gn={identify:Mn,"identify-recovery":Mn,"select-authenticator-authenticate":Fn,"select-authenticator-enroll":Hn,"challenge-authenticator":Cn,"authenticator-verification-data":Kn,"authenticator-enrollment-data":$n,"reset-authenticator":Rn,"reenroll-authenticator":Dn,"reenroll-authenticator-warning":Un,"enroll-poll":En},Jn={"select-enroll-profile":Bn,"enroll-profile":In,"authenticator-enrollment-data":$n,"select-authenticator-enroll":Hn,"enroll-poll":En,"select-enrollment-channel":Pn,"enrollment-channel-data":xn,"enroll-authenticator":An,skip:Wn},Qn={identify:Mn,"select-authenticator-unlock-account":qn,"select-authenticator-authenticate":Fn,"challenge-authenticator":Cn,"challenge-poll":jn,"authenticator-verification-data":Kn,"reenroll-authenticator-warning":Un};
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
function Yn(e,t="default"){let n,r,o=!0;switch(t){case"register":case"signup":case"enrollProfile":n=Jn,o=!1;break;case"recoverPassword":case"resetPassword":n=Gn,r=["currentAuthenticator-recover","currentAuthenticatorEnrollment-recover"],o=!1;break;case"unlockAccount":n=Qn,o=!1,r=["unlock-account"];break;case"authenticate":case"login":case"signin":n=zn;break;default:n=zn;break}return{flow:t,remediators:n,actions:r,withCredentials:o}}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
async function Xn(e,t){const n=e.transactionManager.load(),r=Yn(e,n.flow);return fn(e,Object.assign(Object.assign(Object.assign({},t),r),{actions:["cancel"]}))}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
function Zn(e){var t=/\+/g,n=/([^&=]+)=?([^&]*)/g,r=e||"";"#"===r.charAt(0)&&"/"===r.charAt(1)&&(r=r.substring(2)),"#"!==r.charAt(0)&&"?"!==r.charAt(0)||(r=r.substring(1));var o,s={};while(1){if(o=n.exec(r),!o)break;var i=o[1],a=o[2];s[i]="id_token"===i||"access_token"===i||"code"===i?a:decodeURIComponent(a.replace(t," "))}return s}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
class er extends O{constructor(e,t){super(`Enter the OTP code in the originating client: ${t}`),this.name="EmailVerifyCallbackError",this.state=e,this.otp=t}}function tr(e){return"EmailVerifyCallbackError"===e.name}function nr(e){return/(otp=)/i.test(e)&&/(state=)/i.test(e)}function rr(e){return Zn(e)}async function or(e,t){if(nr(t)){const{state:n,otp:r}=rr(t);if(e.idx.canProceed({state:n}))return await e.idx.proceed({state:n,otp:r});throw new er(n,r)}}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
function sr(e,t={}){const n=oe(e,t);return!(!n&&!t.stateHandle)}async function ir(e,t={}){if(!sr(e,t))throw new L("Unable to proceed: saved transaction could not be loaded");let{flow:n,state:r}=t;if(!n){const t=oe(e,{state:r});n=null===t||void 0===t?void 0:t.flow}return fn(e,Object.assign(Object.assign({},t),{flow:n}))}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
async function ar(e,t={}){var n;let r=await ir(e,{startPolling:!0});const o=oe(e);let s=null===(n=null===o||void 0===o?void 0:o.remediations)||void 0===n?void 0:n.find((e=>e.includes("poll")));return(null===s||void 0===s?void 0:s.length)||y("No polling remediations available at the current IDX flow stage"),Number.isInteger(t.refresh)?new Promise((function(n,o){setTimeout((async function(){var t,s;try{const o=null===(s=null===(t=r.nextStep)||void 0===t?void 0:t.poll)||void 0===s?void 0:s.refresh;n(o?ar(e,{refresh:o}):r)}catch(i){o(i)}}),t.refresh)})):r}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
async function cr(e,t={}){return e.transactionManager.clear(),fn(e,Object.assign({exchangeCodeForTokens:!1},t))}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
async function ur(e,t={}){if(!re(e)){const{enabledFeatures:n}=await cr(e,Object.assign(Object.assign({},t),{flow:"register",autoRemediate:!1}));if(!t.activationToken&&n&&!n.includes(d.REGISTRATION))throw new L("Registration is not supported based on your current org configuration.")}return fn(e,Object.assign(Object.assign({},t),{flow:"register"}))}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
async function lr(e,t={}){const n=Yn(e,"recoverPassword");return fn(e,Object.assign(Object.assign({},t),n))}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
async function dr(e,t){const n=e.transactionManager.load();if(!n)throw new L("No transaction data was found in storage");const{codeVerifier:r,state:o}=n,{searchParams:s}=new URL(t),i=s.get("state"),a=s.get("interaction_code"),c=s.get("error");if(c)throw new je(c,s.get("error_description"));if(i!==o)throw new L("State in redirect uri does not match with transaction state");if(!a)throw new L("Unable to parse interaction_code from the url");const{tokens:u}=await e.token.exchangeCodeForTokens({interactionCode:a,codeVerifier:r});e.tokenManager.setTokens(u)}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
async function hr(e,t={}){if(t.flow="unlockAccount",!re(e)){const{enabledFeatures:n}=await cr(e,Object.assign(Object.assign({},t),{autoRemediate:!1}));if(n&&!n.includes(d.ACCOUNT_UNLOCK))throw new L("Self Service Account Unlock is not supported based on your current org configuration.")}return fn(e,Object.assign({},t))}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
function pr(e){if("OAuthError"!==e.name)return!1;const t=e;return"interaction_required"===t.errorCode}function fr(e){return xt(e)&&"invalid_grant"===e.errorCode&&"The refresh token is invalid or expired."===e.errorSummary}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
function gr(e){return/((id|access)_token=)/i.test(e)}function mr(e){return/(code=)/i.test(e)}function vr(e){return/(interaction_code=)/i.test(e)}function yr(e){return/(error=)/i.test(e)||/(error_description)/i.test(e)}function wr(e,t){var n=t.options;return!(!e||!n.redirectUri)&&0===e.indexOf(n.redirectUri)}function kr(e){return e.pkce||"code"===e.responseType||"query"===e.responseMode}function br(e,t){let n=!1;return n=Array.isArray(t.responseType)&&t.responseType.length?t.responseType.indexOf(e)>=0:t.responseType===e,n}function Tr(e){var t=kr(e),n=t&&"fragment"!==e.responseMode;return n?window.location.search:window.location.hash}function Sr(e){if(!wr(window.location.href,e))return!1;var t=kr(e.options),n=Tr(e.options);if(yr(n))return!0;if(t){var r=mr(n)||vr(n);return r}return gr(window.location.hash)}function Or(e,t){if(!t){if(!Sr(e))return!1;t=Tr(e.options)}return/(error=interaction_required)/i.test(t)}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
function _r(e){Vt({remediators:o,getFlowSpecification:Yn});const t=cr.bind(null,e),n={interact:Ne.bind(null,e),introspect:jt.bind(null,e),makeIdxResponse:At.bind(null,e),authenticate:gn.bind(null,e),register:ur.bind(null,e),start:t,startTransaction:t,poll:ar.bind(null,e),proceed:ir.bind(null,e),cancel:Xn.bind(null,e),recoverPassword:lr.bind(null,e),handleInteractionCodeRedirect:dr.bind(null,e),isInteractionRequired:Or.bind(null,e),isInteractionRequiredError:pr,handleEmailVerifyCallback:or.bind(null,e),isEmailVerifyCallback:nr,parseEmailVerifyCallback:rr,isEmailVerifyCallbackError:tr,getSavedTransactionMeta:oe.bind(null,e),createTransactionMeta:ne.bind(null,e),getTransactionMeta:se.bind(null,e),saveTransactionMeta:ie.bind(null,e),clearTransactionMeta:ae.bind(null,e),isTransactionMetaValid:ce,setFlow:t=>{e.options.flow=t},getFlow:()=>e.options.flow,canProceed:sr.bind(null,e),unlockAccount:hr.bind(null,e)};return n}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
const Ar=function(e){return atob(e)},Er=function(e){return btoa(e)},Pr="undefined"===typeof crypto?null:crypto,xr=/windows phone|iemobile|wpdesktop/i;function Cr(){return"undefined"!==typeof document&&"undefined"!==typeof window}function jr(){if(!Cr())return!1;const e=document.documentMode;return!!e&&e<=11}function Rr(){return navigator.userAgent}function Ir(){const e=Rr();return e&&!xr.test(e)}function Mr(){if(!Cr())return!1;const e=document.documentMode;var t=e&&e<10;return"undefined"!==typeof window.postMessage&&!t}function Dr(){return"undefined"!==typeof Pr&&null!==Pr&&"undefined"!==typeof Pr.subtle&&"undefined"!==typeof Uint8Array}function Ur(){return Dr()}function Nr(){return"undefined"!==typeof TextEncoder}function Lr(){return Ur()&&Nr()}function Fr(){return!!Cr()&&"https:"===window.location.protocol}function Hr(){return Cr()&&"localhost"===window.location.hostname}function qr(){return!jr()&&"undefined"!==typeof window.indexedDB&&Nr()&&Dr()}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
function Br(e){class t{constructor(...t){const n=new e(t.length&&t[0]||{});this.options=w(n),this.emitter=new W,this.features=s}}return t.features=s,t.constants=r,t.features=t.prototype.features=s,Object.assign(t,{constants:r}),t}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
function Vr(e,t){return class extends e{constructor(...e){super(...e);const{storageManager:n,cookies:r,storageUtil:o}=this.options;this.storageManager=new t(n,r,o)}clearStorage(){}}}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
class Kr{constructor(){this.environments=["okta-auth-js/7.7.0"],this.maybeAddNodeEnvironment()}addEnvironment(e){this.environments.push(e)}getHttpHeader(){return{"X-Okta-User-Agent-Extended":this.environments.join(" ")}}getVersion(){return"7.7.0"}maybeAddNodeEnvironment(){if(Cr()||!process||!process.versions)return;const{node:e}=process.versions;this.environments.push(`nodejs/${e}`)}}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
function $r(e,t,n){e.options.headers=e.options.headers||{},e.options.headers[t]=n}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
function Wr(e){return class extends e{constructor(...e){super(...e),this._oktaUserAgent=new Kr,this.http={setRequestHeader:$r.bind(null,this)}}setHeaders(e){this.options.headers=Object.assign({},this.options.headers,e)}getIssuerOrigin(){return this.options.issuer.split("/oauth2/")[0]}webfinger(e){var t="/.well-known/webfinger"+U(e),n={headers:{Accept:"application/jrd+json"}};return Me(this,t,n)}}}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
function zr(e){var t=Er(e);return Gr(t)}function Gr(e){return e.replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"")}function Jr(e){return e.replace(/-/g,"+").replace(/_/g,"/")}function Qr(e){var t=Jr(e);switch(t.length%4){case 0:break;case 2:t+="==";break;case 3:t+="=";break;default:throw new L("Not a valid Base64Url")}var n=Ar(t);try{return decodeURIComponent(escape(n))}catch(r){return n}}function Yr(e){for(var t=new Uint8Array(e.length),n=0;n<e.length;n++)t[n]=e.charCodeAt(n);return t}function Xr(e){return Ar(Jr(e))}function Zr(e){return Uint8Array.from(Xr(e),(e=>e.charCodeAt(0)))}function eo(e){return Er(new Uint8Array(e).reduce(((e,t)=>e+String.fromCharCode(t)),""))}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
function to(e){var t=(new TextEncoder).encode(e);return Pr.subtle.digest("SHA-256",t).then((function(e){var t=new Uint8Array(e),n=t.slice(0,16),r=String.fromCharCode.apply(null,n),o=zr(r);return o}))}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
function no(e,t){t=k(t);var n="jwk",r={name:"RSASSA-PKCS1-v1_5",hash:{name:"SHA-256"}},o=!0,s=["verify"];return delete t.use,Pr.subtle.importKey(n,t,r,o,s).then((function(t){var n=e.split("."),o=Yr(n[0]+"."+n[1]),s=Xr(n[2]),i=Yr(s);return Pr.subtle.verify(r,t,i,o)}))}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
class ro{constructor(e={quiet:!1}){this.queue=[],this.running=!1,this.options=e}push(e,t,...n){return new Promise(((r,o)=>{this.queue.length>0&&!1!==this.options.quiet&&y("Async method is being called but another async method is already running. The new method will be delayed until the previous method completes."),this.queue.push({method:e,thisObject:t,args:n,resolve:r,reject:o}),this.run()}))}run(){if(!this.running&&0!==this.queue.length){this.running=!0;var e=this.queue.shift(),t=e.method.apply(e.thisObject,e.args);x(t)?t.then(e.resolve,e.reject).finally((()=>{this.running=!1,this.run()})):(e.resolve(t),this.running=!1,this.run())}}}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
function oo(e){return("0"+e.toString(16)).substr(-2)}function so(e){var t=new Uint8Array(Math.ceil(e/2));Pr.getRandomValues(t);var n=Array.from(t,oo).join("");return n.slice(0,e)}function io(e){var t=e||"";return t.length<Ae&&(t+=so(Ae-t.length)),encodeURIComponent(t).slice(0,Ee)}function ao(e){var t=(new TextEncoder).encode(e);return Pr.subtle.digest("SHA-256",t).then((function(e){var t=String.fromCharCode.apply(null,new Uint8Array(e)),n=zr(t);return n}))}var co={DEFAULT_CODE_CHALLENGE_METHOD:Pe,generateVerifier:io,computeChallenge:ao};
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
function uo(e){var t,n=e.split(".");try{t={header:JSON.parse(Qr(n[0])),payload:JSON.parse(Qr(n[1])),signature:n[2]}}catch(r){throw new L("Malformed token")}return t}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
function lo(e){const{pkce:t,clientId:n,redirectUri:r,responseType:o,responseMode:s,scopes:i,acrValues:a,maxAge:c,state:u,ignoreSignature:l,dpop:d}=e.options,h=Cr()?window.location.href:void 0;return w({pkce:t,clientId:n,redirectUri:r||h,responseType:o||["token","id_token"],responseMode:s,state:u||F(),nonce:H(),scopes:i||["openid","email"],acrValues:a,maxAge:c,ignoreSignature:l,dpop:d})}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
const ho="OktaAuthJs",po="DPoPKeys";function fo(e){return(xt(e)||Ct(e))&&"use_dpop_nonce"===e.errorCode}async function go(e,t,n){const r=zr(JSON.stringify(e)),o=zr(JSON.stringify(t)),s=await Pr.subtle.sign({name:n.algorithm.name},n,Yr(`${r}.${o}`));return`${r}.${o}.${Gr(eo(s))}`}function mo(e=32){return[...Pr.getRandomValues(new Uint8Array(e))].map((e=>e.toString(16))).join("")}async function vo(){const e={name:"RSASSA-PKCS1-v1_5",hash:"SHA-256",modulusLength:2048,publicExponent:new Uint8Array([1,0,1])};return Pr.subtle.generateKey(e,!1,["sign","verify"])}async function yo(e){const t=(new TextEncoder).encode(e),n=await Pr.subtle.digest("SHA-256",t);return Er(String.fromCharCode.apply(null,new Uint8Array(n))).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"")}function wo(){return new Promise(((e,t)=>{try{const n=window.indexedDB,r=n.open(ho,1);r.onerror=function(){t(r.error)},r.onupgradeneeded=function(){const e=r.result;e.createObjectStore(po)},r.onsuccess=function(){const n=r.result,o=n.transaction(po,"readwrite");o.onerror=function(){t(o.error)};const s=o.objectStore(po);e(s),o.oncomplete=function(){n.close()}}}catch(n){t(n)}}))}async function ko(e,...t){const n=await wo();return new Promise(((r,o)=>{const s=n[e](...t);s.onsuccess=function(){r(s)},s.onerror=function(){o(s.error)}}))}async function bo(e,t){return await ko("add",t,e),t}async function To(e){if(e){const t=await ko("get",e);if(t.result)return t.result}throw new L("Unable to locate dpop key pair required for refresh"+(e?` (${e})`:""))}async function So(e){await ko("delete",e)}async function Oo(){await ko("clear")}async function _o(){const e=mo(4),t=await vo();return await bo(e,t),{keyPair:t,keyPairId:e}}async function Ao(e,t){var n;let r=!1;const{accessToken:o,refreshToken:s}=t;"access"===e&&o&&"DPoP"===o.tokenType&&!s&&(r=!0),"refresh"===e&&s&&!o&&(r=!0);const i=null!==(n=null===o||void 0===o?void 0:o.dpopPairId)&&void 0!==n?n:null===s||void 0===s?void 0:s.dpopPairId;r&&i&&await So(i)}async function Eo({keyPair:e,url:t,method:n,nonce:r,accessToken:o}){const{kty:s,crv:i,e:a,n:c,x:u,y:l}=await Pr.subtle.exportKey("jwk",e.publicKey),d={alg:"RS256",typ:"dpop+jwt",jwk:{kty:s,crv:i,e:a,n:c,x:u,y:l}},h={htm:n,htu:t,iat:Math.floor(Date.now()/1e3),jti:mo()};return r&&(h.nonce=r),o&&(h.ath=await yo(o)),go(d,h,e.privateKey)}async function Po({keyPair:e,url:t,method:n,nonce:r}){const o={keyPair:e,url:t,method:n};return r&&(o.nonce=r),Eo(o)}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
function xo(e){if(!e.clientId)throw new L("A clientId must be specified in the OktaAuth constructor to get a token");if(!e.redirectUri)throw new L("The redirectUri passed to /authorize must also be passed to /token");if(!e.authorizationCode&&!e.interactionCode)throw new L("An authorization code (returned from /authorize) must be passed to /token");if(!e.codeVerifier)throw new L('The "codeVerifier" (generated and saved by your app) must be passed to /token')}function Co(e,t){var n=w({client_id:t.clientId,redirect_uri:t.redirectUri,grant_type:t.interactionCode?"interaction_code":"authorization_code",code_verifier:t.codeVerifier});t.interactionCode?n["interaction_code"]=t.interactionCode:t.authorizationCode&&(n.code=t.authorizationCode);const{clientSecret:r}=e.options;return r&&(n["client_secret"]=r),U(n).slice(1)}async function jo(e,{url:t,data:n,nonce:r,dpopKeyPair:o}){var s,i;const a="POST",c={"Content-Type":"application/x-www-form-urlencoded"};if(e.options.dpop){if(!o)throw new L("DPoP is configured but no key pair was provided");const e=await Po({url:t,method:a,nonce:r,keyPair:o});c.DPoP=e}try{const r=await Ie(e,{url:t,method:a,args:n,headers:c});return r}catch(u){if(fo(u)&&!r){const r=null===(s=u.resp)||void 0===s?void 0:s.headers["dpop-nonce"];if(!r)throw new Ce({errorSummary:"No `dpop-nonce` header found when required"},null!==(i=u.resp)&&void 0!==i?i:void 0);return jo(e,{url:t,data:n,dpopKeyPair:o,nonce:r})}throw u}}async function Ro(e,t,n){xo(t);var r=Co(e,t);const o={url:n.tokenUrl,data:r,dpopKeyPair:null===t||void 0===t?void 0:t.dpopKeyPair};return jo(e,o)}async function Io(e,t,n){const r=Object.entries({client_id:t.clientId,grant_type:"refresh_token",scope:n.scopes.join(" "),refresh_token:n.refreshToken}).map((function([e,t]){return e+"="+encodeURIComponent(t)})).join("&"),o={url:n.tokenUrl,data:r,dpopKeyPair:null===t||void 0===t?void 0:t.dpopKeyPair};return jo(e,o)}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
function Mo(e,t){var n=t||e.options.issuer;return Me(e,n+"/.well-known/openid-configuration",{cacheResponse:!0})}function Do(e,t,n){var r=e.storageManager.getHttpCache(e.options.cookies);return Mo(e,t).then((function(t){var o=t["jwks_uri"],s=r.getStorage(),i=s[o];if(i&&Date.now()/1e3<i.expiresAt){var a=T(i.response.keys,{kid:n});if(a)return a}return r.clearStorage(o),Me(e,o,{cacheResponse:!0}).then((function(e){var t=T(e.keys,{kid:n});if(t)return t;throw new L("The key id, "+n+", was not found in the server's keys")}))}))}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
function Uo(e,t,n){const r=n.clientId,o=n.issuer,s=n.nonce,i=n.acrValues;if(!t||!o||!r)throw new L("The jwt, iss, and aud arguments are all required");if(s&&t.nonce!==s)throw new L("OAuth flow response nonce doesn't match request nonce");const a=Math.floor(Date.now()/1e3);if(t.iss!==o)throw new L("The issuer ["+t.iss+"] does not match ["+o+"]");if(Array.isArray(t.aud)&&t.aud.indexOf(r)<0||!Array.isArray(t.aud)&&t.aud!==r)throw new L("The audience ["+t.aud+"] does not match ["+r+"]");if(i&&t.acr!==i)throw new L("The acr ["+t.acr+"] does not match acr_values ["+i+"]");if(t.iat>t.exp)throw new L("The JWT expired before it was issued");if(!e.options.ignoreLifetime){if(a-e.options.maxClockSkew>t.exp)throw new L("The JWT expired and is no longer valid");if(t.iat>a+e.options.maxClockSkew)throw new L("The JWT was issued in the future")}}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
async function No(e,t,n){if(!t||!t.idToken)throw new L("Only idTokens may be verified");const r=uo(t.idToken),o=(null===n||void 0===n?void 0:n.issuer)||e.options.issuer,{issuer:s}=await Mo(e,o),i=Object.assign({clientId:e.options.clientId,ignoreSignature:e.options.ignoreSignature},n,{issuer:s});if(Uo(e,r.payload,i),1==i.ignoreSignature||!e.features.isTokenVerifySupported())return t;const a=await Do(e,t.issuer,r.header.kid),c=await no(t.idToken,a);if(!c)throw new L("The token signature is not valid");if(n&&n.accessToken&&t.claims.at_hash){const e=await to(n.accessToken);if(e!==t.claims.at_hash)throw new L("Token hash verification failed")}return t}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
function Lo(e,t){if(e["error"]&&e["error_description"])throw new je(e["error"],e["error_description"]);if(e.state!==t.state)throw new L("OAuth flow response state doesn't match request state");if(t.dpop&&"DPoP"!==e.token_type)throw new L('Unable to parse OAuth flow response: DPoP was configured but "token_type" was not DPoP')}async function Fo(e,t,n,r){const o=!1!==e.options.pkce;if(o&&(n.code||n.interaction_code))return e.token.exchangeCodeForTokens(Object.assign({},t,{authorizationCode:n.code,interactionCode:n.interaction_code}),r);t=t||lo(e),r=r||K(e,t);let s,i=t.responseType||[];Array.isArray(i)||"none"===i||(i=[i]),s=n.scope?n.scope.split(" "):k(t.scopes);const a=t.clientId||e.options.clientId;Lo(n,t);const c={},u=n.expires_in,l=n.token_type,d=n.access_token,h=n.id_token,p=n.refresh_token,f=Math.floor(Date.now()/1e3);if(d){const n=e.token.decode(d);c.accessToken={accessToken:d,claims:n.payload,expiresAt:Number(u)+f,tokenType:l,scopes:s,authorizeUrl:r.authorizeUrl,userinfoUrl:r.userinfoUrl},t.dpopPairId&&(c.accessToken.dpopPairId=t.dpopPairId)}if(p&&(c.refreshToken={refreshToken:p,expiresAt:Number(u)+f,scopes:s,tokenUrl:r.tokenUrl,authorizeUrl:r.authorizeUrl,issuer:r.issuer},t.dpopPairId&&(c.refreshToken.dpopPairId=t.dpopPairId)),h){const n=e.token.decode(h),o={idToken:h,claims:n.payload,expiresAt:n.payload.exp-n.payload.iat+f,scopes:s,authorizeUrl:r.authorizeUrl,issuer:r.issuer,clientId:a},i={clientId:a,issuer:r.issuer,nonce:t.nonce,accessToken:d,acrValues:t.acrValues};void 0!==t.ignoreSignature&&(i.ignoreSignature=t.ignoreSignature),await No(e,o,i),c.idToken=o}if(-1!==i.indexOf("token")&&!c.accessToken)throw new L('Unable to parse OAuth flow response: response type "token" was requested but "access_token" was not returned.');if(-1!==i.indexOf("id_token")&&!c.idToken)throw new L('Unable to parse OAuth flow response: response type "id_token" was requested but "id_token" was not returned.');return{tokens:c,state:n.state,code:n.code,responseType:i}}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
async function Ho(e,t,n){n=n||K(e,t),t=Object.assign({},lo(e),k(t));const{authorizationCode:r,interactionCode:o,codeVerifier:s,clientId:i,redirectUri:a,scopes:c,ignoreSignature:u,state:l,acrValues:d,dpop:h,dpopPairId:p}=t,f={clientId:i,redirectUri:a,authorizationCode:r,interactionCode:o,codeVerifier:s,dpop:h},g=["token"];-1!==c.indexOf("openid")&&g.push("id_token");const m={clientId:i,redirectUri:a,scopes:c,responseType:g,ignoreSignature:u,acrValues:d};try{if(h)if(p){const e=await To(p);f.dpopKeyPair=e,m.dpop=h,m.dpopPairId=p}else{const{keyPair:e,keyPairId:t}=await _o();f.dpopKeyPair=e,m.dpop=h,m.dpopPairId=t}const t=await Ro(e,f,n),o=await Fo(e,m,t,n);return o.code=r,o.state=l,o}finally{e.transactionManager.clear()}}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
async function qo(e,t,n){if(t||(t=(await e.tokenManager.getTokens()).accessToken),n||(n=(await e.tokenManager.getTokens()).idToken),!t||!Z(t))return Promise.reject(new L("getUserInfo requires an access token object"));if(!n||!ee(n))return Promise.reject(new L("getUserInfo requires an ID token object"));const r={url:t.userinfoUrl,method:"GET",accessToken:t.accessToken};if(e.options.dpop){const n=await e.getDPoPAuthorizationHeaders(Object.assign(Object.assign({},r),{accessToken:t}));r.headers=n,delete r.accessToken}return Ie(e,r).then((e=>e.sub===n.claims.sub?e:Promise.reject(new L("getUserInfo request was rejected due to token mismatch")))).catch((function(t){var n;if(t instanceof C&&!e.options.dpop){const{error:e,errorDescription:n}=t;throw new je(e,n)}if(!e.options.dpop){let e=t;if(t instanceof Ce&&(null===(n=null===t||void 0===t?void 0:t.meta)||void 0===n?void 0:n.wwwAuthHeader)&&(e=C.parseHeader(t.meta.wwwAuthHeader)),e instanceof C){const{error:t,errorDescription:n}=e;throw new je(t,n)}}throw t}))}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
function Bo(e,t,n){e.addEventListener?e.addEventListener(t,n):e.attachEvent("on"+t,n)}function Vo(e,t,n){e.removeEventListener?e.removeEventListener(t,n):e.detachEvent("on"+t,n)}function Ko(e){var t=document.createElement("iframe");return t.style.display="none",t.src=e,document.body.appendChild(t)}function $o(e,t){var n=t.popupTitle||"External Identity Provider User Authentication",r="toolbar=no, scrollbars=yes, resizable=yes, top=100, left=500, width=600, height=600";return window.open(e,n,r)}function Wo(e,t,n){var r,o,s=new Promise((function(s,i){r=function(t){if(t.data&&t.data.state===n)return t.origin!==e.getIssuerOrigin()?i(new L("The request does not match client configuration")):void s(t.data)},Bo(window,"message",r),o=setTimeout((function(){i(new L("OAuth flow timed out"))}),t||12e4)}));return s.finally((function(){clearTimeout(o),Vo(window,"message",r)}))}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
function zo(e){if(!e.features.isPKCESupported()){var t="PKCE requires a modern browser with encryption support running in a secure context.";throw e.features.isHTTPS()||(t+="\nThe current page is not being served with HTTPS protocol. PKCE requires secure HTTPS protocol."),e.features.hasTextEncoder()||(t+='\n"TextEncoder" is not defined. To use PKCE, you may need to include a polyfill/shim for this browser.'),new L(t)}}async function Go(e,t){t=t||e.options.codeChallengeMethod||Pe;const n=await Mo(e);var r=n["code_challenge_methods_supported"]||[];if(-1===r.indexOf(t))throw new L("Invalid code_challenge_method");return t}async function Jo(e,t){let{codeVerifier:n,codeChallenge:r,codeChallengeMethod:o}=t;return r=r||e.options.codeChallenge,r||(zo(e),n=n||co.generateVerifier(),r=await co.computeChallenge(n)),o=await Go(e,o),t=Object.assign(Object.assign({},t),{responseType:"code",codeVerifier:n,codeChallenge:r,codeChallengeMethod:o}),t}async function Qo(e,t={}){const n=lo(e);if(t=Object.assign(Object.assign({},n),t),t.dpop&&!e.features.isDPoPSupported())throw new L("DPoP has been configured, but is not supported by browser");return!1===t.pkce?t:Jo(e,t)}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
function Yo(e){if(!e.clientId)throw new L("A clientId must be specified in the OktaAuth constructor to get a token");if(_(e.responseType)&&-1!==e.responseType.indexOf(" "))throw new L("Multiple OAuth responseTypes must be defined as an array");var t={client_id:e.clientId,code_challenge:e.codeChallenge,code_challenge_method:e.codeChallengeMethod,display:e.display,idp:e.idp,idp_scope:e.idpScope,login_hint:e.loginHint,max_age:e.maxAge,nonce:e.nonce,prompt:e.prompt,redirect_uri:e.redirectUri,response_mode:e.responseMode,response_type:e.responseType,sessionToken:e.sessionToken,state:e.state,acr_values:e.acrValues,enroll_amr_values:e.enrollAmrValues};if(t=w(t),["idp_scope","response_type","enroll_amr_values"].forEach((function(e){Array.isArray(t[e])&&(t[e]=t[e].join(" "))})),-1!==e.responseType.indexOf("id_token")&&-1===e.scopes.indexOf("openid"))throw new L("openid scope must be specified in the scopes argument when requesting an id_token");return e.scopes&&(t.scope=e.scopes.join(" ")),t}function Xo(e){var t=Yo(e);return U(Object.assign(Object.assign({},t),e.extraParams&&Object.assign({},e.extraParams)))}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
function Zo(e,t){if(arguments.length>2)return Promise.reject(new L('As of version 3.0, "getToken" takes only a single set of options'));t=t||{};const n=t.popupWindow;return t.popupWindow=void 0,Qo(e,t).then((function(r){var o,s,i,a,c={prompt:"none",responseMode:"okta_post_message",display:null},u={display:"popup"};switch(t.sessionToken?Object.assign(r,c):t.idp&&Object.assign(r,u),i=K(e,r),s=t.codeVerifier?i.tokenUrl:i.authorizeUrl,o=s+Xo(r),a=r.sessionToken||null===r.display?"IFRAME":"popup"===r.display?"POPUP":"IMPLICIT",a){case"IFRAME":var l=Wo(e,t.timeout,r.state),d=Ko(o);return l.then((function(t){return Fo(e,r,t,i)})).finally((function(){var e;document.body.contains(d)&&(null===(e=d.parentElement)||void 0===e||e.removeChild(d))}));case"POPUP":var h;if("okta_post_message"===r.responseMode){if(!e.features.isPopupPostMessageSupported())throw new L("This browser doesn't have full postMessage support");h=Wo(e,t.timeout,r.state)}n&&n.location.assign(o);var p=new Promise((function(e,t){var r=setInterval((function(){n&&!n.closed||(clearInterval(r),t(new L("Unable to parse OAuth flow response")))}),100);h.then((function(t){clearInterval(r),e(t)})).catch((function(e){clearInterval(r),t(e)}))}));return p.then((function(t){return Fo(e,r,t,i)})).finally((function(){n&&!n.closed&&n.close()}));default:throw new L("The full page redirect flow is not supported")}}))}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
function es(e,t){return arguments.length>2?Promise.reject(new L('As of version 3.0, "getWithoutPrompt" takes only a single set of options')):(t=k(t)||{},Object.assign(t,{prompt:"none",responseMode:"okta_post_message",display:null}),Zo(e,t))}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
function ts(e,t){if(arguments.length>2)return Promise.reject(new L('As of version 3.0, "getWithPopup" takes only a single set of options'));const n=$o("/",t);return t=k(t)||{},Object.assign(t,{display:"popup",responseMode:"okta_post_message",popupWindow:n}),Zo(e,t)}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
async function ns(e,t){if(arguments.length>2)return Promise.reject(new L('As of version 3.0, "getWithRedirect" takes only a single set of options'));t=k(t)||{};const n=await Qo(e,t),r=$(e,n),o=r.urls.authorizeUrl+Xo(n);e.transactionManager.save(r),e.options.setLocation?e.options.setLocation(o):window.location.assign(o)}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
function rs(e){var t=e.token.parseFromUrl._getHistory(),n=e.token.parseFromUrl._getDocument(),r=e.token.parseFromUrl._getLocation();t&&t.replaceState?t.replaceState(null,n.title,r.pathname+r.search):r.hash=""}function os(e){var t=e.token.parseFromUrl._getHistory(),n=e.token.parseFromUrl._getDocument(),r=e.token.parseFromUrl._getLocation();t&&t.replaceState?t.replaceState(null,n.title,r.pathname+r.hash):r.search=""}function ss(e){var t=e.options.pkce?"query":"fragment",n=e.options.responseMode||t;return n}function is(e,t){t=t||{},_(t)&&(t={url:t});var n,r=t.url,o=t.responseMode||ss(e),s=e.token.parseFromUrl._getLocation();if(n="query"===o?r?r.substring(r.indexOf("?")):s.search:r?r.substring(r.indexOf("#")):s.hash,!n)throw new L("Unable to parse a token from the url");return Zn(n)}function as(e,t){const n=t.responseMode||ss(e);"query"===n?os(e):rs(e)}async function cs(e,t){t=t||{},_(t)&&(t={url:t});const n=is(e,t),r=n.state,o=e.transactionManager.load({state:r});if(!o){if(e.options.pkce)throw new L("Could not load PKCE codeVerifier from storage. This may indicate the auth flow has already completed or multiple auth flows are executing concurrently.",void 0);throw new L("Unable to retrieve OAuth redirect params from storage")}const s=o.urls;return delete o.urls,t.url||as(e,t),Fo(e,o,n,s).catch((t=>{throw pr(t)||e.transactionManager.clear({state:r}),t})).then((t=>(e.transactionManager.clear({state:r}),t)))}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
function us(e,t){return e.refreshToken===t.refreshToken}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
async function ls(e,t,n){const{clientId:r,dpop:o}=e.options;if(!r)throw new L("A clientId must be specified in the OktaAuth constructor to renew tokens");try{const s=Object.assign({},t,{clientId:r}),i=Object.assign({},s);if(o){const e=await To(null===n||void 0===n?void 0:n.dpopPairId);i.dpopKeyPair=e,s.dpop=o,s.dpopPairId=n.dpopPairId}const a=await Io(e,i,n),c=K(e,t),{tokens:u}=await Fo(e,s,a,c),{refreshToken:l}=u;return l&&!us(l,n)&&e.tokenManager.updateRefreshToken(l),u}catch(s){throw fr(s)&&e.tokenManager.removeRefreshToken(),s}}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
function ds(){throw new L("Renew must be passed a token with an array of scopes and an accessToken or idToken")}function hs(e,t){return ee(e)?t.idToken:Z(e)?t.accessToken:void ds()}async function ps(e,t){ee(t)||Z(t)||ds();let n=e.tokenManager.getTokensSync();if(n.refreshToken)return n=await ls(e,{scopes:t.scopes},n.refreshToken),hs(t,n);var r;r=e.options.pkce?"code":Z(t)?"token":"id_token";const{scopes:o,authorizeUrl:s,userinfoUrl:i,issuer:a,dpopPairId:c}=t;return es(e,{responseType:r,scopes:o,authorizeUrl:s,userinfoUrl:i,issuer:a,dpopPairId:c}).then((function(e){return hs(t,e.tokens)}))}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
async function fs(e,t){var n;const r=null!==(n=null===t||void 0===t?void 0:t.tokens)&&void 0!==n?n:e.tokenManager.getTokensSync();if(r.refreshToken)return ls(e,t||{},r.refreshToken);if(!r.accessToken&&!r.idToken)throw new L("renewTokens() was called but there is no existing token");const o=r.accessToken||{},s=r.idToken||{},i=o.scopes||s.scopes;if(!i)throw new L("renewTokens: invalid tokens: could not read scopes");const a=o.authorizeUrl||s.authorizeUrl;if(!a)throw new L("renewTokens: invalid tokens: could not read authorizeUrl");const c=o.userinfoUrl||e.options.userinfoUrl,u=s.issuer||e.options.issuer,l=null===o||void 0===o?void 0:o.dpopPairId;if(t=Object.assign({scopes:i,authorizeUrl:a,userinfoUrl:c,issuer:u,dpopPairId:l},t),e.options.pkce)t.responseType="code";else{const{responseType:n}=lo(e);t.responseType=n}return es(e,t).then((e=>e.tokens))}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
async function gs(e,t){let n="",r="";if(t&&(n=t.accessToken,r=t.refreshToken),!n&&!r)throw new L("A valid access or refresh token object is required");var o=e.options.clientId,s=e.options.clientSecret;if(!o)throw new L("A clientId must be specified in the OktaAuth constructor to revoke a token");var i=K(e).revokeUrl,a=U({token_type_hint:r?"refresh_token":"access_token",token:r||n}).slice(1),c=Er(s?`${o}:${s}`:o);return De(e,i,a,{headers:{"Content-Type":"application/x-www-form-urlencoded",Authorization:"Basic "+c}})}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
const ms={accessToken:"access_token",idToken:"id_token",refreshToken:"refresh_token"};async function vs(e,t,n){var r;let o,s=e.options.clientId,i=e.options.clientSecret;if(n||(n=e.tokenManager.getTokens()[t]),!n)throw new L(`unable to find ${t} in storage or fn params`);if(o=t!==Q.ACCESS?null===n||void 0===n?void 0:n.issuer:null===(r=null===n||void 0===n?void 0:n.claims)||void 0===r?void 0:r.iss,o=o||e.options.issuer,!s)throw new L("A clientId must be specified in the OktaAuth constructor to introspect a token");if(!o)throw new L("Unable to find issuer");const{introspection_endpoint:a}=await Mo(e,o),c=Er(i?`${s}:${i}`:s),u=U({token_type_hint:ms[t],token:n[t]}).slice(1);return De(e,a,u,{headers:{"Content-Type":"application/x-www-form-urlencoded",Authorization:"Basic "+c}})}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
function ys(e,t){const n=e.options.issuer,r=K(e,t),o={issuer:n,urls:r,clientId:t.clientId,redirectUri:t.redirectUri,responseType:t.responseType,responseMode:t.responseMode,state:t.state,acrValues:t.acrValues,enrollAmrValues:t.enrollAmrValues};return o}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
function ws(e){const{clientId:t,redirectUri:n,responseMode:r,state:o}=e.options,s=Cr()?window.location.href:void 0;return w({clientId:t,redirectUri:n||s,responseMode:r,state:o||F(),responseType:"none",prompt:"enroll_authenticator"})}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
function ks(e){if(e=Object.assign(Object.assign({},e),{responseType:"none",prompt:"enroll_authenticator",maxAge:0}),!e.enrollAmrValues)throw new L("enroll_amr_values must be specified");if(!e.acrValues)throw new L("acr_values must be specified");return delete e.scopes,delete e.nonce,e}function bs(e,t){return ks(Object.assign(Object.assign({},ws(e)),t))}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
function Ts(e,t){t=k(t)||{};const n=bs(e,t),r=ys(e,n),o=r.urls.authorizeUrl+Xo(n);e.transactionManager.save(r),e.options.setLocation?e.options.setLocation(o):window.location.assign(o)}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
function Ss(e,t){const n=e=>ro.prototype.push.bind(t,e,null),r=n(ns.bind(null,e)),o=n(cs.bind(null,e)),s=Object.assign(o,{_getHistory:function(){return window.history},_getLocation:function(){return window.location},_getDocument:function(){return window.document}}),i={prepareTokenParams:Qo.bind(null,e),exchangeCodeForTokens:Ho.bind(null,e),getWithoutPrompt:es.bind(null,e),getWithPopup:ts.bind(null,e),getWithRedirect:r,parseFromUrl:s,decode:uo,revoke:gs.bind(null,e),renew:ps.bind(null,e),renewTokensWithRefresh:ls.bind(null,e),renewTokens:fs.bind(null,e),getUserInfo:(t,n)=>qo(e,t,n),verify:No.bind(null,e),isLoginRedirect:Sr.bind(null,e),introspect:vs.bind(null,e)},a=["getWithoutPrompt","getWithPopup","revoke","renew","renewTokensWithRefresh","renewTokens"];return a.forEach((e=>{i[e]=n(i[e])})),i}function Os(e){return{authorize:{enrollAuthenticator:Ts.bind(null,e)}}}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
function _s(e,t){if(!ee(e)&&!Z(e)&&!te(e))throw new L("Token must be an Object with scopes, expiresAt, and one of: an idToken, accessToken, or refreshToken property");if("accessToken"===t&&!Z(e))throw new L("invalid accessToken");if("idToken"===t&&!ee(e))throw new L("invalid idToken");if("refreshToken"===t&&!te(e))throw new L("invalid refreshToken")}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
class As{constructor(e){this.localOffset=parseInt(e||0)}static create(){var e=0;return new As(e)}now(){var e=(Date.now()+this.localOffset)/1e3;return e}}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
const Es="expired",Ps="renewed",xs="added",Cs="removed",js="error",Rs="set_storage",Is={autoRenew:!0,autoRemove:!0,syncStorage:!0,clearPendingRemoveTokens:!0,storage:void 0,expireEarlySeconds:30,storageKey:ge};function Ms(){return{expireTimeouts:{},renewPromise:null}}class Ds{constructor(e,t={}){if(this.sdk=e,this.emitter=e.emitter,!this.emitter)throw new L("Emitter should be initialized before TokenManager");t=Object.assign({},Is,w(t)),Hr()||(t.expireEarlySeconds=Is.expireEarlySeconds),this.options=t;const n=w({storageKey:t.storageKey,secure:t.secure});"object"===typeof t.storage?n.storageProvider=t.storage:t.storage&&(n.storageType=t.storage),this.storage=e.storageManager.getTokenStorage(Object.assign(Object.assign({},n),{useSeparateCookies:!0})),this.clock=As.create(),this.state=Ms()}on(e,t,n){n?this.emitter.on(e,t,n):this.emitter.on(e,t)}off(e,t){t?this.emitter.off(e,t):this.emitter.off(e)}start(){this.options.clearPendingRemoveTokens&&this.clearPendingRemoveTokens(),this.setExpireEventTimeoutAll(),this.state.started=!0}stop(){this.clearExpireEventTimeoutAll(),this.state.started=!1}isStarted(){return!!this.state.started}getOptions(){return k(this.options)}getExpireTime(e){const t=this.options.expireEarlySeconds||0;var n=e.expiresAt-t;return n}hasExpired(e){var t=this.getExpireTime(e);return t<=this.clock.now()}emitExpired(e,t){this.emitter.emit(Es,e,t)}emitRenewed(e,t,n){this.emitter.emit(Ps,e,t,n)}emitAdded(e,t){this.emitter.emit(xs,e,t)}emitRemoved(e,t){this.emitter.emit(Cs,e,t)}emitError(e){this.emitter.emit(js,e)}clearExpireEventTimeout(e){clearTimeout(this.state.expireTimeouts[e]),delete this.state.expireTimeouts[e],this.state.renewPromise=null}clearExpireEventTimeoutAll(){var e=this.state.expireTimeouts;for(var t in e)Object.prototype.hasOwnProperty.call(e,t)&&this.clearExpireEventTimeout(t)}setExpireEventTimeout(e,t){if(!te(t)){var n=this.getExpireTime(t),r=1e3*Math.max(n-this.clock.now(),0);this.clearExpireEventTimeout(e);var o=setTimeout((()=>{this.emitExpired(e,t)}),r);this.state.expireTimeouts[e]=o}}setExpireEventTimeoutAll(){var e=this.storage.getStorage();for(var t in e)if(Object.prototype.hasOwnProperty.call(e,t)){var n=e[t];this.setExpireEventTimeout(t,n)}}resetExpireEventTimeoutAll(){this.clearExpireEventTimeoutAll(),this.setExpireEventTimeoutAll()}add(e,t){var n=this.storage.getStorage();_s(t),n[e]=t,this.storage.setStorage(n),this.emitSetStorageEvent(),this.emitAdded(e,t),this.setExpireEventTimeout(e,t)}getSync(e){var t=this.storage.getStorage();return t[e]}async get(e){return this.getSync(e)}getTokensSync(){const e={},t=this.storage.getStorage();return Object.keys(t).forEach((n=>{const r=t[n];Z(r)?e.accessToken=r:ee(r)?e.idToken=r:te(r)&&(e.refreshToken=r)})),e}async getTokens(){return this.getTokensSync()}getStorageKeyByType(e){const t=this.storage.getStorage(),n=Object.keys(t).filter((n=>{const r=t[n];return Z(r)&&"accessToken"===e||ee(r)&&"idToken"===e||te(r)&&"refreshToken"===e}))[0];return n}getTokenType(e){if(Z(e))return"accessToken";if(ee(e))return"idToken";if(te(e))return"refreshToken";throw new L("Unknown token type")}emitSetStorageEvent(){if(jr()){const e=this.storage.getStorage();this.emitter.emit(Rs,e)}}getStorage(){return this.storage}setTokens(e,t,n,r){const o=(e,o)=>{const s=this.getTokenType(o);"accessToken"===s?t&&t(e,o):"idToken"===s?n&&n(e,o):"refreshToken"===s&&r&&r(e,o)},s=(e,t)=>{this.emitAdded(e,t),this.setExpireEventTimeout(e,t),o(e,t)},i=(e,t,n)=>{this.emitRenewed(e,t,n),this.clearExpireEventTimeout(e),this.setExpireEventTimeout(e,t),o(e,t)},a=(e,t)=>{this.clearExpireEventTimeout(e),this.emitRemoved(e,t),o(e,t)},c=["idToken","accessToken","refreshToken"],u=this.getTokensSync();c.forEach((t=>{const n=e[t];n&&_s(n,t)}));const l=c.reduce(((t,n)=>{const r=e[n];if(r){const e=this.getStorageKeyByType(n)||n;t[e]=r}return t}),{});this.storage.setStorage(l),this.emitSetStorageEvent(),c.forEach((t=>{const n=e[t],r=u[t],o=this.getStorageKeyByType(t)||t;n&&r?(a(o,r),s(o,n),i(o,n,r)):n?s(o,n):r&&a(o,r)}))}remove(e){this.clearExpireEventTimeout(e);var t=this.storage.getStorage(),n=t[e];delete t[e],this.storage.setStorage(t),this.emitSetStorageEvent(),this.emitRemoved(e,n)}async renewToken(e){var t;return null===(t=this.sdk.token)||void 0===t?void 0:t.renew(e)}validateToken(e){return _s(e)}renew(e){if(this.state.renewPromise)return this.state.renewPromise;try{var t=this.getSync(e);let n=void 0!==t;if(!t&&"accessToken"===e){const e=this.getStorageKeyByType("refreshToken"),t=this.getSync(e);n=void 0!==t}if(!n)throw new L("The tokenManager has no token for the key: "+e)}catch(r){return this.emitError(r),Promise.reject(r)}this.clearExpireEventTimeout(e);const n=this.state.renewPromise=this.sdk.token.renewTokens().then((n=>{if(this.setTokens(n),!t&&"accessToken"===e){const t=n["accessToken"];return this.emitRenewed(e,t,null),t}const r=this.getTokenType(t);return n[r]})).catch((t=>{throw this.remove(e),t.tokenKey=e,this.emitError(t),t})).finally((()=>{this.state.renewPromise=null}));return n}clear(){const e=this.getTokensSync();this.clearExpireEventTimeoutAll(),this.storage.clearStorage(),this.emitSetStorageEvent(),Object.keys(e).forEach((t=>{this.emitRemoved(t,e[t])}))}clearPendingRemoveTokens(){const e=this.storage.getStorage(),t={};Object.keys(e).forEach((n=>{e[n].pendingRemove&&(t[n]=e[n],delete e[n])})),this.storage.setStorage(e),this.emitSetStorageEvent(),Object.keys(t).forEach((e=>{this.clearExpireEventTimeout(e),this.emitRemoved(e,t[e])}))}updateRefreshToken(e){const t=this.getStorageKeyByType("refreshToken")||Oe;var n=this.storage.getStorage();_s(e),n[t]=e,this.storage.setStorage(n),this.emitSetStorageEvent()}removeRefreshToken(){const e=this.getStorageKeyByType("refreshToken")||Oe;this.remove(e)}addPendingRemoveFlags(){const e=this.getTokensSync();Object.keys(e).forEach((t=>{e[t].pendingRemove=!0})),this.setTokens(e)}}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
var Us={browserHasLocalStorage:function(){try{var e=this.getLocalStorage();return this.testStorage(e)}catch(t){return!1}},browserHasSessionStorage:function(){try{var e=this.getSessionStorage();return this.testStorage(e)}catch(t){return!1}},testStorageType:function(e){var t=!1;switch(e){case"sessionStorage":t=this.browserHasSessionStorage();break;case"localStorage":t=this.browserHasLocalStorage();break;case"cookie":case"memory":t=!0;break;default:t=!1;break}return t},getStorageByType:function(e,t){let n;switch(e){case"sessionStorage":n=this.getSessionStorage();break;case"localStorage":n=this.getLocalStorage();break;case"cookie":n=this.getCookieStorage(t);break;case"memory":n=this.getInMemoryStorage();break;default:throw new L(`Unrecognized storage option: ${e}`)}return n},findStorageType:function(e){let t,n;return e=e.slice(),t=e.shift(),n=e.length?e[0]:null,n?this.testStorageType(t)?t:(y(`This browser doesn't support ${t}. Switching to ${n}.`),this.findStorageType(e)):t},getLocalStorage:function(){return jr()&&!window.onstorage&&(window.onstorage=function(){}),localStorage},getSessionStorage:function(){return sessionStorage},getCookieStorage:function(e){const t=e.secure,n=e.sameSite,r=e.sessionCookie;if("undefined"===typeof t||"undefined"===typeof n)throw new L('getCookieStorage: "secure" and "sameSite" options must be provided');const o={getItem:this.storage.get,setItem:(e,o,s="2200-01-01T00:00:00.000Z")=>{s=r?null:s,this.storage.set(e,o,s,{secure:t,sameSite:n})},removeItem:e=>{this.storage.delete(e)}};return e.useSeparateCookies?{getItem:function(e){var t=o.getItem(),n={};return Object.keys(t).forEach((r=>{0===r.indexOf(e)&&(n[r.replace(`${e}_`,"")]=JSON.parse(t[r]))})),JSON.stringify(n)},setItem:function(e,t){var n=JSON.parse(this.getItem(e));t=JSON.parse(t),Object.keys(t).forEach((r=>{var s=e+"_"+r,i=JSON.stringify(t[r]);o.setItem(s,i),delete n[r]})),Object.keys(n).forEach((t=>{o.removeItem(e+"_"+t)}))},removeItem:function(e){var t=JSON.parse(this.getItem(e));Object.keys(t).forEach((t=>{o.removeItem(e+"_"+t)}))}}:o},inMemoryStore:{},getInMemoryStorage:function(){return{getItem:e=>this.inMemoryStore[e],setItem:(e,t)=>{this.inMemoryStore[e]=t}}},testStorage:function(e){var t="okta-test-storage";try{return e.setItem(t,t),e.removeItem(t),!0}catch(n){return!1}},storage:{set:function(e,t,n,r){const{sameSite:o,secure:s}=r;if("undefined"===typeof s||"undefined"===typeof o)throw new L('storage.set: "secure" and "sameSite" options must be provided');var i={path:r.path||"/",secure:s,sameSite:o};return Date.parse(n)&&(i.expires=new Date(n)),Y.set(e,t,i),this.get(e)},get:function(e){return arguments.length?Y.get(e):Y.get()},delete:function(e){return Y.remove(e,{path:"/"})}}};
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
function Ns(e){return class extends e{setOriginalUri(e,t){const n=Us.getSessionStorage();if(n.setItem(_e,e),t=t||this.options.state,t){const n=this.storageManager.getOriginalUriStorage();n.setItem(t,e)}}getOriginalUri(e){if(e=e||this.options.state,e){const t=this.storageManager.getOriginalUriStorage(),n=t.getItem(e);if(n)return n}const t=Us.getSessionStorage();return t&&t.getItem(_e)||void 0}removeOriginalUri(e){const t=Us.getSessionStorage();if(t.removeItem(_e),e=e||this.options.state,e){const t=this.storageManager.getOriginalUriStorage();t.removeItem&&t.removeItem(e)}}}}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
function Ls(e,t){var n;const r=Ns(e);return n=class extends r{constructor(...e){super(...e),this.transactionManager=new t(Object.assign({storageManager:this.storageManager},this.options.transactionManager)),this.pkce={DEFAULT_CODE_CHALLENGE_METHOD:co.DEFAULT_CODE_CHALLENGE_METHOD,generateVerifier:co.generateVerifier,computeChallenge:co.computeChallenge},this._pending={handleLogin:!1},this._tokenQueue=new ro,this.token=Ss(this,this._tokenQueue),this.tokenManager=new Ds(this,this.options.tokenManager),this.endpoints=Os(this)}clearStorage(){super.clearStorage(),this.tokenManager.clear()}async isAuthenticated(e={}){const{autoRenew:t,autoRemove:r}=this.tokenManager.getOptions(),o=e.onExpiredToken?"renew"===e.onExpiredToken:t,s=e.onExpiredToken?"remove"===e.onExpiredToken:r;let{accessToken:i}=this.tokenManager.getTokensSync();if(i&&this.tokenManager.hasExpired(i))if(i=void 0,o)try{i=await this.tokenManager.renew("accessToken")}catch(n){}else s&&this.tokenManager.remove("accessToken");let{idToken:a}=this.tokenManager.getTokensSync();if(a&&this.tokenManager.hasExpired(a))if(a=void 0,o)try{a=await this.tokenManager.renew("idToken")}catch(c){}else s&&this.tokenManager.remove("idToken");return!(!i||!a)}async signInWithRedirect(e={}){const{originalUri:t}=e,n=Le(e,["originalUri"]);if(!this._pending.handleLogin){this._pending.handleLogin=!0;try{t&&this.setOriginalUri(t);const e=Object.assign({scopes:this.options.scopes||["openid","email","profile"]},n);await this.token.getWithRedirect(e)}finally{this._pending.handleLogin=!1}}}async getUser(){const{idToken:e,accessToken:t}=this.tokenManager.getTokensSync();return this.token.getUserInfo(t,e)}getIdToken(){const{idToken:e}=this.tokenManager.getTokensSync();return e?e.idToken:void 0}getAccessToken(){const{accessToken:e}=this.tokenManager.getTokensSync();return e?e.accessToken:void 0}getRefreshToken(){const{refreshToken:e}=this.tokenManager.getTokensSync();return e?e.refreshToken:void 0}async getOrRenewAccessToken(){var e;const{accessToken:t}=this.tokenManager.getTokensSync();if(t&&!this.tokenManager.hasExpired(t))return t.accessToken;try{const t=this.tokenManager.getStorageKeyByType("accessToken"),n=await this.tokenManager.renew(null!==t&&void 0!==t?t:"accessToken");return null!==(e=null===n||void 0===n?void 0:n.accessToken)&&void 0!==e?e:null}catch(n){return this.emitter.emit("error",n),null}}async storeTokensFromRedirect(){const{tokens:e,responseType:t}=await this.token.parseFromUrl();"none"!==t&&this.tokenManager.setTokens(e)}isLoginRedirect(){return Sr(this)}isPKCE(){return!!this.options.pkce}hasResponseType(e){return br(e,this.options)}isAuthorizationCodeFlow(){return this.hasResponseType("code")}async invokeApiMethod(e){if(!e.accessToken){const t=(await this.tokenManager.getTokens()).accessToken;e.accessToken=null===t||void 0===t?void 0:t.accessToken}return Ie(this,e)}async revokeAccessToken(e){if(!e){const t=await this.tokenManager.getTokens();e=t.accessToken;const n=this.tokenManager.getStorageKeyByType("accessToken");this.tokenManager.remove(n),this.options.dpop&&await Ao("access",t)}return e?this.token.revoke(e):Promise.resolve(null)}async revokeRefreshToken(e){if(!e){const t=await this.tokenManager.getTokens();e=t.refreshToken;const n=this.tokenManager.getStorageKeyByType("refreshToken");this.tokenManager.remove(n),this.options.dpop&&await Ao("refresh",t)}return e?this.token.revoke(e):Promise.resolve(null)}getSignOutRedirectUrl(e={}){let{idToken:t,postLogoutRedirectUri:n,state:r}=e;if(t||(t=this.tokenManager.getTokensSync().idToken),!t)return"";void 0===n&&(n=this.options.postLogoutRedirectUri);const o=K(this).logoutUrl,s=t.idToken;let i=o+"?id_token_hint="+encodeURIComponent(s);return n&&(i+="&post_logout_redirect_uri="+encodeURIComponent(n)),r&&(i+="&state="+encodeURIComponent(r)),i}async signOut(e){var t;e=Object.assign({},e);const n=window.location.origin,r=window.location.href,o=null===e.postLogoutRedirectUri?null:e.postLogoutRedirectUri||this.options.postLogoutRedirectUri||n,s=null===e||void 0===e?void 0:e.state;let i=e.accessToken,a=e.refreshToken;const c=!1!==e.revokeAccessToken,u=!1!==e.revokeRefreshToken;u&&"undefined"===typeof a&&(a=this.tokenManager.getTokensSync().refreshToken),c&&"undefined"===typeof i&&(i=this.tokenManager.getTokensSync().accessToken),e.idToken||(e.idToken=this.tokenManager.getTokensSync().idToken),u&&a&&await this.revokeRefreshToken(a),c&&i&&await this.revokeAccessToken(i);const l=null!==(t=null===i||void 0===i?void 0:i.dpopPairId)&&void 0!==t?t:null===a||void 0===a?void 0:a.dpopPairId;this.options.dpop&&l&&await So(l);const d=this.getSignOutRedirectUrl(Object.assign(Object.assign({},e),{postLogoutRedirectUri:o}));if(d)return e.clearTokensBeforeRedirect?this.tokenManager.clear():this.tokenManager.addPendingRemoveFlags(),window.location.assign(d),!0;{const e=await this.closeSession(),t=new URL(o||n);return s&&t.searchParams.append("state",s),o===r?window.location.href=t.href:window.location.assign(t.href),e}}async getDPoPAuthorizationHeaders(e){if(!this.options.dpop)throw new L("DPoP is not configured for this client instance");let{accessToken:t}=e;if(t||(t=this.tokenManager.getTokensSync().accessToken),!t)throw new L("AccessToken is required to generate a DPoP Proof");const n=await To(null===t||void 0===t?void 0:t.dpopPairId),r=await Eo(Object.assign(Object.assign({},e),{keyPair:n,accessToken:t.accessToken}));return{Authorization:`DPoP ${t.accessToken}`,Dpop:r}}async clearDPoPStorage(e=!1){var t,n;if(e)return Oo();const r=await this.tokenManager.getTokens(),o=(null===(t=r.accessToken)||void 0===t?void 0:t.dpopPairId)||(null===(n=r.refreshToken)||void 0===n?void 0:n.dpopPairId);o&&await So(o)}parseUseDPoPNonceError(e){var t;const n=C.getWWWAuthenticateHeader(e),r=C.parseHeader(null!==n&&void 0!==n?n:"");if(fo(r)){let n=null;return P(null===e||void 0===e?void 0:e.get)&&(n=e.get("DPoP-Nonce")),n=null!==(t=null!==n&&void 0!==n?n:e["dpop-nonce"])&&void 0!==t?t:e["DPoP-Nonce"],n}return null}},n.crypto=i,n}var Fs=n(37724);
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
const Hs=null,qs={updateAuthStatePromise:null,canceledTimes:0},Bs="authStateChange",Vs=10,Ks=(e,t)=>!!e&&(e.isAuthenticated===t.isAuthenticated&&JSON.stringify(e.idToken)===JSON.stringify(t.idToken)&&JSON.stringify(e.accessToken)===JSON.stringify(t.accessToken)&&e.error===t.error);class $s{constructor(e){if(!e.emitter)throw new L("Emitter should be initialized before AuthStateManager");this._sdk=e,this._pending=Object.assign({},qs),this._authState=Hs,this._logOptions={},this._prevAuthState=null,this._transformQueue=new ro({quiet:!0}),e.tokenManager.on(xs,((e,t)=>{this._setLogOptions({event:xs,key:e,token:t}),this.updateAuthState()})),e.tokenManager.on(Cs,((e,t)=>{this._setLogOptions({event:Cs,key:e,token:t}),this.updateAuthState()}))}_setLogOptions(e){this._logOptions=e}getAuthState(){return this._authState}getPreviousAuthState(){return this._prevAuthState}async updateAuthState(){const{transformAuthState:e,devMode:t}=this._sdk.options,n=e=>{const{event:t,key:n,token:r}=this._logOptions;v().group(`OKTA-AUTH-JS:updateAuthState: Event:${t} Status:${e}`),v().log(n,r),v().log("Current authState",this._authState),v().groupEnd(),this._logOptions={}},r=e=>{Ks(this._authState,e)?t&&n("unchanged"):(this._prevAuthState=this._authState,this._authState=e,this._sdk.emitter.emit(Bs,Object.assign({},e)),t&&n("emitted"))},o=e=>this._pending.updateAuthStatePromise.then((()=>{const t=this._pending.updateAuthStatePromise;return t&&t!==e?o(t):this.getAuthState()}));if(this._pending.updateAuthStatePromise){if(this._pending.canceledTimes>=Vs)return t&&n("terminated"),o(this._pending.updateAuthStatePromise);this._pending.updateAuthStatePromise.cancel()}const s=new Fs(((o,i,a)=>{a.shouldReject=!1,a((()=>{this._pending.updateAuthStatePromise=null,this._pending.canceledTimes=this._pending.canceledTimes+1,t&&n("canceled")}));const c=e=>{s.isCanceled?o():(r(e),o(),this._pending=Object.assign({},qs))};this._sdk.isAuthenticated().then((()=>{if(s.isCanceled)return void o();const{accessToken:t,idToken:n,refreshToken:r}=this._sdk.tokenManager.getTokensSync(),i={accessToken:t,idToken:n,refreshToken:r,isAuthenticated:!(!t||!n)},a=e?this._transformQueue.push(e,null,this._sdk,i):Promise.resolve(i);a.then((e=>c(e))).catch((e=>c({accessToken:t,idToken:n,refreshToken:r,isAuthenticated:!1,error:e})))}))}));return this._pending.updateAuthStatePromise=s,o(s)}subscribe(e){this._sdk.emitter.on(Bs,e)}unsubscribe(e){this._sdk.emitter.off(Bs,e)}}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
class Ws{constructor(e,t={}){this.started=!1,this.tokenManager=e,this.options=t,this.renewTimeQueue=[],this.onTokenExpiredHandler=this.onTokenExpiredHandler.bind(this)}shouldThrottleRenew(){let e=!1;if(this.renewTimeQueue.push(Date.now()),this.renewTimeQueue.length>=10){const t=this.renewTimeQueue.shift(),n=this.renewTimeQueue[this.renewTimeQueue.length-1];e=n-t<3e4}return e}requiresLeadership(){return!!this.options.syncStorage&&Cr()}processExpiredTokens(){const e=this.tokenManager.getStorage(),t=e.getStorage();Object.keys(t).forEach((e=>{const n=t[e];!te(n)&&this.tokenManager.hasExpired(n)&&this.onTokenExpiredHandler(e)}))}onTokenExpiredHandler(e){if(this.options.autoRenew)if(this.shouldThrottleRenew()){const e=new L("Too many token renew requests");this.tokenManager.emitError(e)}else this.tokenManager.renew(e).catch((()=>{}));else this.options.autoRemove&&this.tokenManager.remove(e)}canStart(){return(!!this.options.autoRenew||!!this.options.autoRemove)&&!this.started}async start(){this.canStart()&&(this.tokenManager.on(Es,this.onTokenExpiredHandler),this.tokenManager.isStarted()&&this.processExpiredTokens(),this.started=!0)}async stop(){this.started&&(this.tokenManager.off(Es,this.onTokenExpiredHandler),this.renewTimeQueue=[],this.started=!1)}isStarted(){return this.started}}function zs(e){return e&&"function"===typeof e.then}Promise.resolve(!1);var Gs=Promise.resolve(!0),Js=Promise.resolve();function Qs(e,t){return e||(e=0),new Promise((function(n){return setTimeout((function(){return n(t)}),e)}))}function Ys(e,t){return Math.floor(Math.random()*(t-e+1)+e)}function Xs(){return Math.random().toString(36).substring(2)}var Zs=0,ei=0;function ti(){var e=(new Date).getTime();return e===Zs?(ei++,1e3*e+ei):(Zs=e,ei=0,1e3*e)}function ni(){return"undefined"!==typeof navigator&&"undefined"!==typeof navigator.locks&&"function"===typeof navigator.locks.request}var ri=ti,oi="native";function si(e){var t={messagesCallback:null,bc:new BroadcastChannel(e),subFns:[]};return t.bc.onmessage=function(e){t.messagesCallback&&t.messagesCallback(e.data)},t}function ii(e){e.bc.close(),e.subFns=[]}function ai(e,t){try{return e.bc.postMessage(t,!1),Js}catch(n){return Promise.reject(n)}}function ci(e,t){e.messagesCallback=t}function ui(){if("undefined"===typeof window&&"undefined"===typeof self||"function"!==typeof BroadcastChannel)return!1;if(BroadcastChannel._pubkey)throw new Error("BroadcastChannel: Do not overwrite window.BroadcastChannel with this module, this is not a polyfill");return!0}function li(){return 150}var di={create:si,close:ii,onMessage:ci,postMessage:ai,canBeUsed:ui,type:oi,averageResponseTime:li,microSeconds:ri},hi=function(){function e(e){this.ttl=e,this.map=new Map,this._to=!1}return e.prototype.has=function(e){return this.map.has(e)},e.prototype.add=function(e){var t=this;this.map.set(e,fi()),this._to||(this._to=!0,setTimeout((function(){t._to=!1,pi(t)}),0))},e.prototype.clear=function(){this.map.clear()},e}();function pi(e){var t=fi()-e.ttl,n=e.map[Symbol.iterator]();while(1){var r=n.next().value;if(!r)return;var o=r[0],s=r[1];if(!(s<t))return;e.map.delete(o)}}function fi(){return(new Date).getTime()}function gi(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{},t=JSON.parse(JSON.stringify(e));return"undefined"===typeof t.webWorkerSupport&&(t.webWorkerSupport=!0),t.idb||(t.idb={}),t.idb.ttl||(t.idb.ttl=45e3),t.idb.fallbackInterval||(t.idb.fallbackInterval=150),e.idb&&"function"===typeof e.idb.onclose&&(t.idb.onclose=e.idb.onclose),t.localstorage||(t.localstorage={}),t.localstorage.removeTimeout||(t.localstorage.removeTimeout=6e4),e.methods&&(t.methods=e.methods),t.node||(t.node={}),t.node.ttl||(t.node.ttl=12e4),t.node.maxParallelWrites||(t.node.maxParallelWrites=2048),"undefined"===typeof t.node.useFastPath&&(t.node.useFastPath=!0),t}var mi=ti,vi="pubkey.broadcast-channel-0-",yi="messages",wi={durability:"relaxed"},ki="idb";function bi(){if("undefined"!==typeof indexedDB)return indexedDB;if("undefined"!==typeof window){if("undefined"!==typeof window.mozIndexedDB)return window.mozIndexedDB;if("undefined"!==typeof window.webkitIndexedDB)return window.webkitIndexedDB;if("undefined"!==typeof window.msIndexedDB)return window.msIndexedDB}return!1}function Ti(e){e.commit&&e.commit()}function Si(e){var t=bi(),n=vi+e,r=t.open(n);return r.onupgradeneeded=function(e){var t=e.target.result;t.createObjectStore(yi,{keyPath:"id",autoIncrement:!0})},new Promise((function(e,t){r.onerror=function(e){return t(e)},r.onsuccess=function(){e(r.result)}}))}function Oi(e,t,n){var r=(new Date).getTime(),o={uuid:t,time:r,data:n},s=e.transaction([yi],"readwrite",wi);return new Promise((function(e,t){s.oncomplete=function(){return e()},s.onerror=function(e){return t(e)};var n=s.objectStore(yi);n.add(o),Ti(s)}))}function _i(e,t){var n=e.transaction(yi,"readonly",wi),r=n.objectStore(yi),o=[],s=IDBKeyRange.bound(t+1,1/0);if(r.getAll){var i=r.getAll(s);return new Promise((function(e,t){i.onerror=function(e){return t(e)},i.onsuccess=function(t){e(t.target.result)}}))}function a(){try{return s=IDBKeyRange.bound(t+1,1/0),r.openCursor(s)}catch(e){return r.openCursor()}}return new Promise((function(e,r){var s=a();s.onerror=function(e){return r(e)},s.onsuccess=function(r){var s=r.target.result;s?s.value.id<t+1?s["continue"](t+1):(o.push(s.value),s["continue"]()):(Ti(n),e(o))}}))}function Ai(e,t){if(e.closed)return Promise.resolve([]);var n=e.db.transaction(yi,"readwrite",wi),r=n.objectStore(yi);return Promise.all(t.map((function(e){var t=r["delete"](e);return new Promise((function(e){t.onsuccess=function(){return e()}}))})))}function Ei(e,t){var n=(new Date).getTime()-t,r=e.transaction(yi,"readonly",wi),o=r.objectStore(yi),s=[];return new Promise((function(e){o.openCursor().onsuccess=function(t){var o=t.target.result;if(o){var i=o.value;i.time<n?(s.push(i),o["continue"]()):(Ti(r),e(s))}else e(s)}}))}function Pi(e){return Ei(e.db,e.options.idb.ttl).then((function(t){return Ai(e,t.map((function(e){return e.id})))}))}function xi(e,t){return t=gi(t),Si(e).then((function(n){var r={closed:!1,lastCursorId:0,channelName:e,options:t,uuid:Xs(),eMIs:new hi(2*t.idb.ttl),writeBlockPromise:Js,messagesCallback:null,readQueuePromises:[],db:n};return n.onclose=function(){r.closed=!0,t.idb.onclose&&t.idb.onclose()},Ci(r),r}))}function Ci(e){e.closed||Ri(e).then((function(){return Qs(e.options.idb.fallbackInterval)})).then((function(){return Ci(e)}))}function ji(e,t){return e.uuid!==t.uuid&&(!t.eMIs.has(e.id)&&!(e.data.time<t.messagesCallbackTime))}function Ri(e){return e.closed?Js:e.messagesCallback?_i(e.db,e.lastCursorId).then((function(t){var n=t.filter((function(e){return!!e})).map((function(t){return t.id>e.lastCursorId&&(e.lastCursorId=t.id),t})).filter((function(t){return ji(t,e)})).sort((function(e,t){return e.time-t.time}));return n.forEach((function(t){e.messagesCallback&&(e.eMIs.add(t.id),e.messagesCallback(t.data))})),Js})):Js}function Ii(e){e.closed=!0,e.db.close()}function Mi(e,t){return e.writeBlockPromise=e.writeBlockPromise.then((function(){return Oi(e.db,e.uuid,t)})).then((function(){0===Ys(0,10)&&Pi(e)})),e.writeBlockPromise}function Di(e,t,n){e.messagesCallbackTime=n,e.messagesCallback=t,Ri(e)}function Ui(){return!!bi()}function Ni(e){return 2*e.idb.fallbackInterval}var Li={create:xi,close:Ii,onMessage:Di,postMessage:Mi,canBeUsed:Ui,type:ki,averageResponseTime:Ni,microSeconds:mi},Fi=ti,Hi="pubkey.broadcastChannel-",qi="localstorage";function Bi(){var e;if("undefined"===typeof window)return null;try{e=window.localStorage,e=window["ie8-eventlistener/storage"]||window.localStorage}catch(t){}return e}function Vi(e){return Hi+e}function Ki(e,t){return new Promise((function(n){Qs().then((function(){var r=Vi(e.channelName),o={token:Xs(),time:(new Date).getTime(),data:t,uuid:e.uuid},s=JSON.stringify(o);Bi().setItem(r,s);var i=document.createEvent("Event");i.initEvent("storage",!0,!0),i.key=r,i.newValue=s,window.dispatchEvent(i),n()}))}))}function $i(e,t){var n=Vi(e),r=function(e){e.key===n&&t(JSON.parse(e.newValue))};return window.addEventListener("storage",r),r}function Wi(e){window.removeEventListener("storage",e)}function zi(e,t){if(t=gi(t),!Qi())throw new Error("BroadcastChannel: localstorage cannot be used");var n=Xs(),r=new hi(t.localstorage.removeTimeout),o={channelName:e,uuid:n,eMIs:r};return o.listener=$i(e,(function(e){o.messagesCallback&&e.uuid!==n&&e.token&&!r.has(e.token)&&(e.data.time&&e.data.time<o.messagesCallbackTime||(r.add(e.token),o.messagesCallback(e.data)))})),o}function Gi(e){Wi(e.listener)}function Ji(e,t,n){e.messagesCallbackTime=n,e.messagesCallback=t}function Qi(){var e=Bi();if(!e)return!1;try{var t="__broadcastchannel_check";e.setItem(t,"works"),e.removeItem(t)}catch(n){return!1}return!0}function Yi(){var e=120,t=navigator.userAgent.toLowerCase();return t.includes("safari")&&!t.includes("chrome")?2*e:e}var Xi={create:zi,close:Gi,onMessage:Ji,postMessage:Ki,canBeUsed:Qi,type:qi,averageResponseTime:Yi,microSeconds:Fi},Zi=ti,ea="simulate",ta=new Set;function na(e){var t={name:e,messagesCallback:null};return ta.add(t),t}function ra(e){ta["delete"](e)}function oa(e,t){return new Promise((function(n){return setTimeout((function(){var r=Array.from(ta);r.filter((function(t){return t.name===e.name})).filter((function(t){return t!==e})).filter((function(e){return!!e.messagesCallback})).forEach((function(e){return e.messagesCallback(t)})),n()}),5)}))}function sa(e,t){e.messagesCallback=t}function ia(){return!0}function aa(){return 5}var ca={create:na,close:ra,onMessage:sa,postMessage:oa,canBeUsed:ia,type:ea,averageResponseTime:aa,microSeconds:Zi},ua=[di,Li,Xi];function la(e){var t=[].concat(e.methods,ua).filter(Boolean);if(e.type){if("simulate"===e.type)return ca;var n=t.find((function(t){return t.type===e.type}));if(n)return n;throw new Error("method-type "+e.type+" not found")}e.webWorkerSupport||(t=t.filter((function(e){return"idb"!==e.type})));var r=t.find((function(e){return e.canBeUsed()}));if(r)return r;throw new Error("No usable method found in "+JSON.stringify(ua.map((function(e){return e.type}))))}var da,ha=new Set,pa=0,fa=function(e,t){this.id=pa++,ha.add(this),this.name=e,da&&(t=da),this.options=gi(t),this.method=la(this.options),this._iL=!1,this._onML=null,this._addEL={message:[],internal:[]},this._uMP=new Set,this._befC=[],this._prepP=null,ma(this)};function ga(e,t,n){var r=e.method.microSeconds(),o={time:r,type:t,data:n},s=e._prepP?e._prepP:Js;return s.then((function(){var t=e.method.postMessage(e._state,o);return e._uMP.add(t),t["catch"]().then((function(){return e._uMP["delete"](t)})),t}))}function ma(e){var t=e.method.create(e.name,e.options);zs(t)?(e._prepP=t,t.then((function(t){e._state=t}))):e._state=t}function va(e){return e._addEL.message.length>0||e._addEL.internal.length>0}function ya(e,t,n){e._addEL[t].push(n),ka(e)}function wa(e,t,n){e._addEL[t]=e._addEL[t].filter((function(e){return e!==n})),ba(e)}function ka(e){if(!e._iL&&va(e)){var t=function(t){e._addEL[t.type].forEach((function(e){var n=1e5,r=e.time-n;t.time>=r&&e.fn(t.data)}))},n=e.method.microSeconds();e._prepP?e._prepP.then((function(){e._iL=!0,e.method.onMessage(e._state,t,n)})):(e._iL=!0,e.method.onMessage(e._state,t,n))}}function ba(e){if(e._iL&&!va(e)){e._iL=!1;var t=e.method.microSeconds();e.method.onMessage(e._state,null,t)}}function Ta(e){if("function"===typeof WorkerGlobalScope&&self instanceof WorkerGlobalScope){var t=self.close.bind(self);self.close=function(){return e(),t()}}else{if("function"!==typeof window.addEventListener)return;window.addEventListener("beforeunload",(function(){e()}),!0),window.addEventListener("unload",(function(){e()}),!0)}}function Sa(e){process.on("exit",(function(){return e()})),process.on("beforeExit",(function(){return e().then((function(){return process.exit()}))})),process.on("SIGINT",(function(){return e().then((function(){return process.exit()}))})),process.on("uncaughtException",(function(t){return e().then((function(){console.trace(t),process.exit(101)}))}))}fa._pubkey=!0,fa.prototype={postMessage:function(e){if(this.closed)throw new Error("BroadcastChannel.postMessage(): Cannot post message after channel has closed "+JSON.stringify(e));return ga(this,"message",e)},postInternal:function(e){return ga(this,"internal",e)},set onmessage(e){var t=this.method.microSeconds(),n={time:t,fn:e};wa(this,"message",this._onML),e&&"function"===typeof e?(this._onML=n,ya(this,"message",n)):this._onML=null},addEventListener:function(e,t){var n=this.method.microSeconds(),r={time:n,fn:t};ya(this,e,r)},removeEventListener:function(e,t){var n=this._addEL[e].find((function(e){return e.fn===t}));wa(this,e,n)},close:function(){var e=this;if(!this.closed){ha["delete"](this),this.closed=!0;var t=this._prepP?this._prepP:Js;return this._onML=null,this._addEL.message=[],t.then((function(){return Promise.all(Array.from(e._uMP))})).then((function(){return Promise.all(e._befC.map((function(e){return e()})))})).then((function(){return e.method.close(e._state)}))}},get type(){return this.method.type},get isClosed(){return this.closed}};var Oa="[object process]"===Object.prototype.toString.call("undefined"!==typeof process?process:0),_a=Oa?Sa:Ta,Aa=new Set,Ea=!1;function Pa(){Ea||(Ea=!0,_a(Ca))}function xa(e){if(Pa(),"function"!==typeof e)throw new Error("Listener is no function");Aa.add(e);var t={remove:function(){return Aa["delete"](e)},run:function(){return Aa["delete"](e),e()}};return t}function Ca(){var e=[];return Aa.forEach((function(t){e.push(t()),Aa["delete"](t)})),Promise.all(e)}function ja(e,t){var n={context:"leader",action:t,token:e.token};return e.broadcastChannel.postInternal(n)}function Ra(e){e.isLeader=!0,e._hasLeader=!0;var t=xa((function(){return e.die()}));e._unl.push(t);var n=function(t){"leader"===t.context&&"apply"===t.action&&ja(e,"tell"),"leader"!==t.context||"tell"!==t.action||e._dpLC||(e._dpLC=!0,e._dpL(),ja(e,"tell"))};return e.broadcastChannel.addEventListener("internal",n),e._lstns.push(n),ja(e,"tell")}var Ia=function(e,t){var n=this;this.broadcastChannel=e,e._befC.push((function(){return n.die()})),this._options=t,this.isLeader=!1,this.isDead=!1,this.token=Xs(),this._lstns=[],this._unl=[],this._dpL=function(){},this._dpLC=!1,this._wKMC={},this.lN="pubkey-bc||"+e.method.type+"||"+e.name};Ia.prototype={hasLeader:function(){var e=this;return navigator.locks.query().then((function(t){var n=t.held?t.held.filter((function(t){return t.name===e.lN})):[];return!!(n&&n.length>0)}))},awaitLeadership:function(){var e=this;if(!this._wLMP){this._wKMC.c=new AbortController;var t=new Promise((function(t,n){e._wKMC.res=t,e._wKMC.rej=n}));this._wLMP=new Promise((function(n){navigator.locks.request(e.lN,{signal:e._wKMC.c.signal},(function(){return e._wKMC.c=void 0,Ra(e),n(),t}))["catch"]((function(){}))}))}return this._wLMP},set onduplicate(e){},die:function(){var e=this;return this._lstns.forEach((function(t){return e.broadcastChannel.removeEventListener("internal",t)})),this._lstns=[],this._unl.forEach((function(e){return e.remove()})),this._unl=[],this.isLeader&&(this.isLeader=!1),this.isDead=!0,this._wKMC.res&&this._wKMC.res(),this._wKMC.c&&this._wKMC.c.abort("LeaderElectionWebLock.die() called"),ja(this,"death")}};var Ma=function(e,t){var n=this;this.broadcastChannel=e,this._options=t,this.isLeader=!1,this._hasLeader=!1,this.isDead=!1,this.token=Xs(),this._aplQ=Js,this._aplQC=0,this._unl=[],this._lstns=[],this._dpL=function(){},this._dpLC=!1;var r=function(e){"leader"===e.context&&("death"===e.action&&(n._hasLeader=!1),"tell"===e.action&&(n._hasLeader=!0))};this.broadcastChannel.addEventListener("internal",r),this._lstns.push(r)};function Da(e){return e.isLeader?Js:new Promise((function(t){var n=!1;function r(){n||(n=!0,e.broadcastChannel.removeEventListener("internal",s),t(!0))}e.applyOnce().then((function(){e.isLeader&&r()}));var o=function t(){return Qs(e._options.fallbackInterval).then((function(){if(!e.isDead&&!n)return e.isLeader?void r():e.applyOnce(!0).then((function(){e.isLeader?r():t()}))}))};o();var s=function(t){"leader"===t.context&&"death"===t.action&&(e._hasLeader=!1,e.applyOnce().then((function(){e.isLeader&&r()})))};e.broadcastChannel.addEventListener("internal",s),e._lstns.push(s)}))}function Ua(e,t){return e||(e={}),e=JSON.parse(JSON.stringify(e)),e.fallbackInterval||(e.fallbackInterval=3e3),e.responseTime||(e.responseTime=t.method.averageResponseTime(t.options)),e}function Na(e,t){if(e._leaderElector)throw new Error("BroadcastChannel already has a leader-elector");t=Ua(t,e);var n=ni()?new Ia(e,t):new Ma(e,t);return e._befC.push((function(){return n.die()})),e._leaderElector=n,n}Ma.prototype={hasLeader:function(){return Promise.resolve(this._hasLeader)},applyOnce:function(e){var t=this;if(this.isLeader)return Qs(0,!0);if(this.isDead)return Qs(0,!1);if(this._aplQC>1)return this._aplQ;var n=function(){if(t.isLeader)return Gs;var n,r=!1,o=new Promise((function(e){n=function(){r=!0,e()}})),s=function(e){"leader"===e.context&&e.token!=t.token&&("apply"===e.action&&e.token>t.token&&n(),"tell"===e.action&&(n(),t._hasLeader=!0))};t.broadcastChannel.addEventListener("internal",s);var i=e?4*t._options.responseTime:t._options.responseTime;return ja(t,"apply").then((function(){return Promise.race([Qs(i),o.then((function(){return Promise.reject(new Error)}))])})).then((function(){return ja(t,"apply")})).then((function(){return Promise.race([Qs(i),o.then((function(){return Promise.reject(new Error)}))])}))["catch"]((function(){})).then((function(){return t.broadcastChannel.removeEventListener("internal",s),!r&&Ra(t).then((function(){return!0}))}))};return this._aplQC=this._aplQC+1,this._aplQ=this._aplQ.then((function(){return n()})).then((function(){t._aplQC=t._aplQC-1})),this._aplQ.then((function(){return t.isLeader}))},awaitLeadership:function(){return this._aLP||(this._aLP=Da(this)),this._aLP},set onduplicate(e){this._dpL=e},die:function(){var e=this;return this._lstns.forEach((function(t){return e.broadcastChannel.removeEventListener("internal",t)})),this._lstns=[],this._unl.forEach((function(e){return e.remove()})),this._unl=[],this.isLeader&&(this._hasLeader=!1,this.isLeader=!1),this.isDead=!0,ja(this,"death")}};
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
class La{constructor(e,t={}){this.started=!1,this.enablePostMessage=!0,this.tokenManager=e,this.options=t,this.onTokenAddedHandler=this.onTokenAddedHandler.bind(this),this.onTokenRemovedHandler=this.onTokenRemovedHandler.bind(this),this.onTokenRenewedHandler=this.onTokenRenewedHandler.bind(this),this.onSetStorageHandler=this.onSetStorageHandler.bind(this),this.onSyncMessageHandler=this.onSyncMessageHandler.bind(this)}requiresLeadership(){return!1}isStarted(){return this.started}canStart(){return!!this.options.syncStorage&&Cr()&&!this.started}async start(){if(!this.canStart())return;const{syncChannelName:e}=this.options;try{this.channel=new fa(e)}catch(t){throw new L("SyncStorageService is not supported in current browser.")}this.tokenManager.on(xs,this.onTokenAddedHandler),this.tokenManager.on(Cs,this.onTokenRemovedHandler),this.tokenManager.on(Ps,this.onTokenRenewedHandler),this.tokenManager.on(Rs,this.onSetStorageHandler),this.channel.addEventListener("message",this.onSyncMessageHandler),this.started=!0}async stop(){var e,t;this.started&&(this.tokenManager.off(xs,this.onTokenAddedHandler),this.tokenManager.off(Cs,this.onTokenRemovedHandler),this.tokenManager.off(Ps,this.onTokenRenewedHandler),this.tokenManager.off(Rs,this.onSetStorageHandler),null===(e=this.channel)||void 0===e||e.removeEventListener("message",this.onSyncMessageHandler),await(null===(t=this.channel)||void 0===t?void 0:t.close()),this.channel=void 0,this.started=!1)}onTokenAddedHandler(e,t){var n;this.enablePostMessage&&(null===(n=this.channel)||void 0===n||n.postMessage({type:xs,key:e,token:t}))}onTokenRemovedHandler(e,t){var n;this.enablePostMessage&&(null===(n=this.channel)||void 0===n||n.postMessage({type:Cs,key:e,token:t}))}onTokenRenewedHandler(e,t,n){var r;this.enablePostMessage&&(null===(r=this.channel)||void 0===r||r.postMessage({type:Ps,key:e,token:t,oldToken:n}))}onSetStorageHandler(e){var t;null===(t=this.channel)||void 0===t||t.postMessage({type:Rs,storage:e})}onSyncMessageHandler(e){switch(this.enablePostMessage=!1,e.type){case Rs:this.tokenManager.getStorage().setStorage(e.storage);break;case xs:this.tokenManager.emitAdded(e.key,e.token),this.tokenManager.setExpireEventTimeout(e.key,e.token);break;case Cs:this.tokenManager.clearExpireEventTimeout(e.key),this.tokenManager.emitRemoved(e.key,e.token);break;case Ps:this.tokenManager.emitRenewed(e.key,e.token,e.oldToken);break}this.enablePostMessage=!0}}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
class Fa{constructor(e={}){this.started=!1,this.options=e,this.onLeaderDuplicate=this.onLeaderDuplicate.bind(this),this.onLeader=this.onLeader.bind(this)}onLeaderDuplicate(){}async onLeader(){var e,t;await(null===(t=(e=this.options).onLeader)||void 0===t?void 0:t.call(e))}isLeader(){var e;return!!(null===(e=this.elector)||void 0===e?void 0:e.isLeader)}hasLeader(){var e;return!!(null===(e=this.elector)||void 0===e?void 0:e.hasLeader)}async start(){if(this.canStart()){const{electionChannelName:e}=this.options;this.channel=new fa(e),this.elector=Na(this.channel),this.elector.onduplicate=this.onLeaderDuplicate,this.elector.awaitLeadership().then(this.onLeader),this.started=!0}}async stop(){this.started&&(this.elector&&(await this.elector.die(),this.elector=void 0),this.channel&&(this.channel.postInternal=()=>Promise.resolve(),await this.channel.close(),this.channel=void 0),this.started=!1)}requiresLeadership(){return!1}isStarted(){return this.started}canStart(){return Cr()&&!this.started}}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
const Ha=()=>Math.floor(Date.now()/1e3);class qa{constructor(e,t={}){this.started=!1,this.lastHidden=-1,this.tokenManager=e,this.options=t,this.onPageVisbilityChange=this._onPageVisbilityChange.bind(this)}_onPageVisbilityChange(){if(document.hidden)this.lastHidden=Ha();else if(this.lastHidden>0&&Ha()-this.lastHidden>=this.options.tabInactivityDuration){const{accessToken:e,idToken:t}=this.tokenManager.getTokensSync();if(e&&this.tokenManager.hasExpired(e)){const e=this.tokenManager.getStorageKeyByType("accessToken");this.tokenManager.renew(e).catch((()=>{}))}else if(t&&this.tokenManager.hasExpired(t)){const e=this.tokenManager.getStorageKeyByType("idToken");this.tokenManager.renew(e).catch((()=>{}))}}}async start(){this.canStart()&&document&&(document.addEventListener("visibilitychange",this.onPageVisbilityChange),this.started=!0)}async stop(){document&&(document.removeEventListener("visibilitychange",this.onPageVisbilityChange),this.started=!1)}canStart(){return Cr()&&!!this.options.autoRenew&&!!this.options.renewOnTabActivation&&!this.started}requiresLeadership(){return!1}isStarted(){return this.started}}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
const Ba="autoRenew",Va="syncStorage",Ka="leaderElection",$a="renewOnTabActivation";class Wa{constructor(e,t={}){this.sdk=e,this.onLeader=this.onLeader.bind(this);const{autoRenew:n,autoRemove:r,syncStorage:o}=e.tokenManager.getOptions();t.electionChannelName=t.electionChannelName||t.broadcastChannelName,this.options=Object.assign({},Wa.defaultOptions,{autoRenew:n,autoRemove:r,syncStorage:o},{electionChannelName:`${e.options.clientId}-election`,syncChannelName:`${e.options.clientId}-sync`},w(t)),this.started=!1,this.services=new Map,Wa.knownServices.forEach((e=>{const t=this.createService(e);t&&this.services.set(e,t)}))}async onLeader(){this.started&&await this.startServices()}isLeader(){var e;return null===(e=this.getService(Ka))||void 0===e?void 0:e.isLeader()}isLeaderRequired(){return[...this.services.values()].some((e=>e.canStart()&&e.requiresLeadership()))}async start(){this.started||(await this.startServices(),this.started=!0)}async stop(){await this.stopServices(),this.started=!1}getService(e){return this.services.get(e)}async startServices(){for(const[e,t]of this.services.entries())this.canStartService(e,t)&&await t.start()}async stopServices(){for(const e of this.services.values())await e.stop()}canStartService(e,t){let n=t.canStart()&&!t.isStarted();return e===Ka?n&&(n=this.isLeaderRequired()):t.requiresLeadership()&&n&&(n=this.isLeader()),n}createService(e){const t=this.sdk.tokenManager;let n;switch(e){case Ka:n=new Fa(Object.assign(Object.assign({},this.options),{onLeader:this.onLeader}));break;case Ba:n=new Ws(t,Object.assign({},this.options));break;case Va:n=new La(t,Object.assign({},this.options));break;case $a:n=new qa(t,Object.assign({},this.options));break;default:throw new Error(`Unknown service ${e}`)}return n}}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
function za(e){return class extends e{constructor(...e){super(...e),this.authStateManager=new $s(this),this.serviceManager=new Wa(this,this.options.services)}async start(){await this.serviceManager.start(),this.tokenManager.start(),this.token.isLoginRedirect()||await this.authStateManager.updateAuthState()}async stop(){this.tokenManager.stop(),await this.serviceManager.stop()}async handleRedirect(e){await this.handleLoginRedirect(void 0,e)}async handleLoginRedirect(e,t){let n=this.options.state;if(e)this.tokenManager.setTokens(e),t=t||this.getOriginalUri(this.options.state);else{if(!this.isLoginRedirect())return;try{const e=await is(this,{});n=e.state,t=t||this.getOriginalUri(n),await this.storeTokensFromRedirect()}catch(o){throw await this.authStateManager.updateAuthState(),o}}await this.authStateManager.updateAuthState(),this.removeOriginalUri(n);const{restoreOriginalUri:r}=this.options;r?await r(this,t):t&&window.location.replace(t)}}}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
function Ga(e){return e.session.get().then((function(e){return"ACTIVE"===e.status})).catch((function(){return!1}))}function Ja(e){return Me(e,"/api/v1/sessions/me",{withCredentials:!0}).then((function(t){var n=b(t,"_links");return n.refresh=function(){return De(e,S(t,"refresh").href,{},{withCredentials:!0})},n.user=function(){return Me(e,S(t,"user").href,{withCredentials:!0})},n})).catch((function(){return{status:"INACTIVE"}}))}function Qa(e){return Ie(e,{url:e.getIssuerOrigin()+"/api/v1/sessions/me",method:"DELETE",withCredentials:!0})}function Ya(e){return De(e,"/api/v1/sessions/me/lifecycle/refresh",{},{withCredentials:!0})}function Xa(e,t,n){n=n||window.location.href,window.location.assign(e.getIssuerOrigin()+"/login/sessionCookieRedirect"+U({checkAccountSetupComplete:!0,token:t,redirectUrl:n}))}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
function Za(e){const t={close:Qa.bind(null,e),exists:Ga.bind(null,e),get:Ja.bind(null,e),refresh:Ya.bind(null,e),setCookieAndRedirect:Xa.bind(null,e)};return t}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
function ec(e){return class extends e{constructor(...e){super(...e),this.session=Za(this)}closeSession(){return this.session.close().then((async()=>(this.clearStorage(),!0))).catch((function(e){if("AuthApiError"===e.name&&"E0000007"===e.errorCode)return!1;throw e}))}}}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
function tc(e,t,n){const r=Br(t),o=Vr(r,e),s=Wr(o),i=ec(s),a=Ls(i,n),c=za(a);return c}Wa.knownServices=[Ba,Va,Ka,$a],Wa.defaultOptions={autoRenew:!0,autoRemove:!0,syncStorage:!0,renewOnTabActivation:!0,tabInactivityDuration:1800};
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
const nc=(e=[])=>{const t=[];return e.forEach((e=>{"webauthn"===e.key&&t.push({type:"public-key",id:Zr(e.credentialId)})})),t},rc=(e,t)=>({publicKey:{rp:e.rp,user:{id:Zr(e.user.id),name:e.user.name,displayName:e.user.displayName},challenge:Zr(e.challenge),pubKeyCredParams:e.pubKeyCredParams,attestation:e.attestation,authenticatorSelection:e.authenticatorSelection,excludeCredentials:nc(t)}}),oc=(e,t)=>({publicKey:{challenge:Zr(e.challenge),userVerification:e.userVerification,allowCredentials:nc(t)}}),sc=e=>{const t=e.response,n=e.id,r=eo(t.clientDataJSON),o=eo(t.attestationObject);return{id:n,clientData:r,attestation:o}},ic=e=>{const t=e.response,n=e.id,r=eo(t.clientDataJSON),o=eo(t.authenticatorData),s=eo(t.signature);return{id:n,clientData:r,authenticatorData:o,signatureData:s}};
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
function ac(e){var t;return t=class extends e{constructor(...e){super(...e),this.idx=_r(this)}},t.webauthn=a,t}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
function cc(e,t,n){const r=tc(e,t,n),o=ac(r);return o}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
function uc(){return class{constructor(e){this.devMode=!!e.devMode}}}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
function lc(){const e=Object.assign({},Us,{inMemoryStore:{}});return e}const dc={token:{storageTypes:["localStorage","sessionStorage","cookie"]},cache:{storageTypes:["localStorage","sessionStorage","cookie"]},transaction:{storageTypes:["sessionStorage","localStorage","cookie"]},"shared-transaction":{storageTypes:["localStorage"]},"original-uri":{storageTypes:["localStorage"]}};function hc(e={},t){var n=e.cookies||{};return"undefined"===typeof n.secure&&(n.secure=t),"undefined"===typeof n.sameSite&&(n.sameSite=n.secure?"none":"lax"),n.secure&&!t&&(y('The current page is not being served with the HTTPS protocol.\nFor security reasons, we strongly recommend using HTTPS.\nIf you cannot use HTTPS, set "cookies.secure" option to false.'),n.secure=!1),"none"!==n.sameSite||n.secure||(n.sameSite="lax"),n}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
function pc(){const e=uc();return class extends e{constructor(e){super(e),this.cookies=hc(e,Fr()),this.storageUtil=e.storageUtil||lc(),this.storageManager=Object.assign(Object.assign({},dc),e.storageManager)}}}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
const fc=/application\/\w*\+?json/;function gc(e){return e.headers.get("Content-Type")&&e.headers.get("Content-Type").toLowerCase().indexOf("application/json")>=0?e.json().catch((e=>({error:e,errorSummary:"Could not parse server response"}))):e.text()}function mc(e,t,n){const r="object"===typeof t,o={};for(const i of n.headers.entries())o[i[0]]=i[1];const s={responseText:r?JSON.stringify(t):t,status:e,headers:o};return r&&(s.responseType="json",s.responseJSON=t),s}function vc(e,t,n){var r=n.data,o=n.headers||{},s=o["Content-Type"]||o["content-type"]||"";r&&"string"!==typeof r&&(fc.test(s)?r=JSON.stringify(r):"application/x-www-form-urlencoded"===s&&(r=Object.entries(r).map((([e,t])=>`${e}=${encodeURIComponent(t)}`)).join("&")));var i=window.fetch||X,a=i(t,{method:e,headers:n.headers,body:r,credentials:n.withCredentials?"include":"omit"});return a.finally||(a=Promise.resolve(a)),a.then((function(e){var t=!e.ok,n=e.status;return gc(e).then((t=>mc(n,t,e))).then((e=>{var n;if(t||(null===(n=e.responseJSON)||void 0===n?void 0:n.error))throw e;return e}))}))}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
function yc(){const e=pc();return class extends e{constructor(e){super(e),this.issuer=e.issuer,this.transformErrorXHR=e.transformErrorXHR,this.headers=e.headers,this.httpRequestClient=e.httpRequestClient||vc,this.httpRequestInterceptors=e.httpRequestInterceptors}}}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
const wc=!0;
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
function kc(e){e=e||{};var t=e.scopes;if(t&&!Array.isArray(t))throw new L('scopes must be a array of strings. Required usage: new OktaAuth({scopes: ["openid", "email"]})');var n=e.issuer;if(!n)throw new L('No issuer passed to constructor. Required usage: new OktaAuth({issuer: "https://{yourOktaDomain}.com/oauth2/{authServerId}"})');var r=new RegExp("^http?s?://.+");if(!r.test(n))throw new L('Issuer must be a valid URL. Required usage: new OktaAuth({issuer: "https://{yourOktaDomain}.com/oauth2/{authServerId}"})');if(-1!==n.indexOf("-admin.okta"))throw new L('Issuer URL passed to constructor contains "-admin" in subdomain. Required usage: new OktaAuth({issuer: "https://{yourOktaDomain}.com})')}function bc(){const e=yc();return class extends e{constructor(e){super(e),kc(e),this.issuer=N(e.issuer),this.tokenUrl=N(e.tokenUrl),this.authorizeUrl=N(e.authorizeUrl),this.userinfoUrl=N(e.userinfoUrl),this.revokeUrl=N(e.revokeUrl),this.logoutUrl=N(e.logoutUrl),this.pkce=!1!==e.pkce,this.clientId=e.clientId,this.redirectUri=e.redirectUri,Cr()&&(this.redirectUri=D(e.redirectUri,window.location.origin)),this.responseType=e.responseType,this.responseMode=e.responseMode,this.state=e.state,this.scopes=e.scopes,this.ignoreSignature=!!e.ignoreSignature,this.codeChallenge=e.codeChallenge,this.codeChallengeMethod=e.codeChallengeMethod,this.acrValues=e.acrValues,this.maxAge=e.maxAge,this.dpop=!0===e.dpop,this.tokenManager=e.tokenManager,this.postLogoutRedirectUri=e.postLogoutRedirectUri,this.restoreOriginalUri=e.restoreOriginalUri,this.transactionManager=Object.assign({enableSharedStorage:wc},e.transactionManager),this.clientSecret=e.clientSecret,this.setLocation=e.setLocation,this.ignoreLifetime=!!e.ignoreLifetime,e.maxClockSkew||0===e.maxClockSkew?this.maxClockSkew=e.maxClockSkew:this.maxClockSkew=pe}}}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
function Tc(){const e=bc();return class extends e{constructor(e){super(e),this.services=e.services,this.transformAuthState=e.transformAuthState}}}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
function Sc(){const e=Tc();return class extends e{constructor(e){super(e),this.flow=e.flow,this.activationToken=e.activationToken,this.recoveryToken=e.recoveryToken,this.idx=e.idx}}}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
class Oc{constructor(e,t){if(!e)throw new L('"storage" is required');if("string"!==typeof t||!t.length)throw new L('"storageName" is required');this.storageName=t,this.storageProvider=e}getItem(e){return this.getStorage()[e]}setItem(e,t){return this.updateStorage(e,t)}removeItem(e){return this.clearStorage(e)}getStorage(){var e=this.storageProvider.getItem(this.storageName);e=e||"{}";try{return JSON.parse(e)}catch(t){throw new L("Unable to parse storage string: "+this.storageName)}}setStorage(e){try{var t=e?JSON.stringify(e):"{}";this.storageProvider.setItem(this.storageName,t)}catch(n){throw new L("Unable to set storage: "+this.storageName)}}clearStorage(e){if(e){var t=this.getStorage();delete t[e],this.setStorage(t)}else this.storageProvider.removeItem?this.storageProvider.removeItem(this.storageName):this.setStorage()}updateStorage(e,t){var n=this.getStorage();n[e]=t,this.setStorage(n)}}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
function _c(e){Cr()||e.storageProvider||e.storageKey||y("Memory storage can only support simple single user use case on server side, please provide custom storageProvider or storageKey if advanced scenarios need to be supported.")}class Ac{constructor(e,t,n){this.storageManagerOptions=e,this.cookieOptions=t,this.storageUtil=n}getOptionsForSection(e,t){return Object.assign({},this.storageManagerOptions[e],t)}getStorage(e){if(e=Object.assign({},this.cookieOptions,e),e.storageProvider)return e.storageProvider;let{storageType:t,storageTypes:n}=e;if("sessionStorage"===t&&(e.sessionCookie=!0),t&&n){const e=n.indexOf(t);e>=0&&(n=n.slice(e),t=void 0)}return t||(t=this.storageUtil.findStorageType(n)),this.storageUtil.getStorageByType(t,e)}getTokenStorage(e){e=this.getOptionsForSection("token",e),_c(e);const t=this.getStorage(e),n=e.storageKey||ge;return new Oc(t,n)}getHttpCache(e){e=this.getOptionsForSection("cache",e);const t=this.getStorage(e),n=e.storageKey||me;return new Oc(t,n)}}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
function Ec(){return class extends Ac{constructor(e,t,n){super(e,t,n)}getTransactionStorage(e){e=this.getOptionsForSection("transaction",e),_c(e);const t=this.getStorage(e),n=e.storageKey||ye;return new Oc(t,n)}getSharedTansactionStorage(e){e=this.getOptionsForSection("shared-transaction",e),_c(e);const t=this.getStorage(e),n=e.storageKey||we;return new Oc(t,n)}getOriginalUriStorage(e){e=this.getOptionsForSection("original-uri",e),_c(e);const t=this.getStorage(e),n=e.storageKey||ke;return new Oc(t,n)}}}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
function Pc(){return Ec()}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
function xc(){const e=Pc();return class extends e{constructor(e,t,n){super(e,t,n)}getIdxResponseStorage(e){let t;if(Cr())try{t=this.storageUtil.getStorageByType("memory",e)}catch(n){y("No response storage found, you may want to provide custom implementation for intermediate idx responses to optimize the network traffic")}else{const n=this.getTransactionStorage(e);n&&(t={getItem:e=>{const t=n.getStorage();return t&&t[e]?t[e]:null},setItem:(e,t)=>{const r=n.getStorage();if(!r)throw new L("Transaction has been cleared, failed to save idxState");r[e]=t,n.setStorage(r)},removeItem:e=>{const t=n.getStorage();t&&(delete t[e],n.setStorage(t))}})}return t?new Oc(t,be):null}}}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
function Cc(e){return!(!e||"object"!==typeof e||0===Object.values(e).length)}function jc(e){return!!Cc(e)&&(!!e.redirectUri||!!e.responseType)}function Rc(e){if(!Cc(e))return!1;const t=void 0===Object.values(e).find((e=>"string"!==typeof e));return t}function Ic(e){return!(!jc(e)&&!Rc(e))}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
const Mc=18e5;function Dc(e){const t=e.getSharedTansactionStorage(),n=t.getStorage();Object.keys(n).forEach((e=>{const t=n[e],r=Date.now()-t.dateCreated;r>Mc&&delete n[e]})),t.setStorage(n)}function Uc(e,t,n){const r=e.getSharedTansactionStorage(),o=r.getStorage();o[t]={dateCreated:Date.now(),transaction:n},r.setStorage(o)}function Nc(e,t){const n=e.getSharedTansactionStorage(),r=n.getStorage(),o=r[t];return o&&o.transaction&&Ic(o.transaction)?o.transaction:null}function Lc(e,t){const n=e.getSharedTansactionStorage(),r=n.getStorage();delete r[t],n.setStorage(r)}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
function Fc(){return class{constructor(e){this.storageManager=e.storageManager,this.enableSharedStorage=!1!==e.enableSharedStorage,this.saveLastResponse=!1!==e.saveLastResponse,this.options=e}clear(e={}){const t=this.storageManager.getTransactionStorage(),n=t.getStorage();if(t.clearStorage(),this.enableSharedStorage&&!1!==e.clearSharedStorage){const t=e.state||(null===n||void 0===n?void 0:n.state);t&&Lc(this.storageManager,t)}}save(e,t={}){let n=this.storageManager.getTransactionStorage();const r=n.getStorage();Ic(r)&&!t.muteWarning&&y("a saved auth transaction exists in storage. This may indicate another auth flow is already in progress."),n.setStorage(e),this.enableSharedStorage&&e.state&&Uc(this.storageManager,e.state,e)}exists(e={}){try{const t=this.load(e);return!!t}catch(t){return!1}}load(e={}){let t;if(this.enableSharedStorage&&e.state&&(Dc(this.storageManager),t=Nc(this.storageManager,e.state),Ic(t)))return t;let n=this.storageManager.getTransactionStorage();return t=n.getStorage(),Ic(t)?t:null}}}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
function Hc(){const e=Fc();return class extends e{constructor(e){super(e)}clear(e={}){super.clear(e),!1!==e.clearIdxResponse&&this.clearIdxResponse()}saveIdxResponse(e){if(!this.saveLastResponse)return;const t=this.storageManager.getIdxResponseStorage();t&&t.setStorage(e)}loadIdxResponse(e){if(!this.saveLastResponse)return null;const t=this.storageManager.getIdxResponseStorage();if(!t)return null;const n=t.getStorage();if(!n||!Et(n.rawIdxResponse))return null;if(e){const{stateHandle:t,interactionHandle:r}=e;if(!e.useGenericRemediator&&t&&n.stateHandle!==t)return null;if(r&&n.interactionHandle!==r)return null}return n}clearIdxResponse(){if(!this.saveLastResponse)return;const e=this.storageManager.getIdxResponseStorage();null===e||void 0===e||e.clearStorage()}}}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
class qc{constructor(e,t){const{res:n}=t,{headers:r}=n,o=Le(n,["headers"]);r&&(this.headers=r),Object.keys(o).forEach((e=>{"_links"!==e&&(this[e]=o[e])}))}}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
async function Bc(e,t,n=qc){const{accessToken:r}=e.tokenManager.getTokensSync(),o=t.accessToken||(null===r||void 0===r?void 0:r.accessToken),s=e.getIssuerOrigin(),{url:i,method:a,payload:c}=t,u=i.startsWith(s)?i:`${s}${i}`;if(!o)throw new L("AccessToken is required to request MyAccount API endpoints.");const l=await Ie(e,Object.assign({headers:{Accept:"*/*;okta-version=1.0.0"},accessToken:o,url:u,method:a},c&&{args:c}));let d;return d=Array.isArray(l)?l.map((t=>new n(e,{res:t,accessToken:o}))):new n(e,{res:l,accessToken:o}),d}function Vc({oktaAuth:e,accessToken:t,methodName:n,links:r},o=qc){for(const i of["GET","POST","PUT","DELETE"])if(i.toLowerCase()===n){const n=r.self;return async r=>Bc(e,{accessToken:t,url:n.href,method:i,payload:r},o)}const s=r[n];if(!s)throw new L(`No link is found with methodName: ${n}`);return async n=>Bc(e,{accessToken:t,url:s.href,method:s.hints.allow[0],payload:n},o)}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
class Kc extends qc{constructor(e,t){super(e,t);const{createdAt:n,modifiedAt:r,profile:o}=t.res;this.createdAt=n,this.modifiedAt=r,this.profile=o}}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
class $c extends qc{constructor(e,t){super(e,t),this.properties=t.res.properties}}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
var Wc,zc,Gc;(function(e){e["PRIMARY"]="PRIMARY",e["SECONDARY"]="SECONDARY"})(Wc||(Wc={})),function(e){e["VERIFIED"]="VERIFIED",e["UNVERIFIED"]="UNVERIFIED"}(zc||(zc={})),function(e){e["NOT_ENROLLED"]="NOT_ENROLLED",e["ACTIVE"]="ACTIVE"}(Gc||(Gc={}));
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
const Jc=async(e,t)=>{const n=await Bc(e,{url:"/idp/myaccount/profile",method:"GET",accessToken:null===t||void 0===t?void 0:t.accessToken},Kc);return n},Qc=async(e,t)=>{const{payload:n,accessToken:r}=t,o=await Bc(e,{url:"/idp/myaccount/profile",method:"PUT",payload:n,accessToken:r},Kc);return o},Yc=async(e,t)=>{const n=await Bc(e,{url:"/idp/myaccount/profile/schema",method:"GET",accessToken:null===t||void 0===t?void 0:t.accessToken},$c);return n};
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
class Xc extends qc{constructor(e,t){super(e,t);const{res:n}=t,{id:r,profile:o,expiresAt:s,status:i}=n;this.id=r,this.expiresAt=s,this.profile=o,this.status=i}}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
class Zc extends qc{constructor(e,t){super(e,t);const{accessToken:n,res:r}=t,{id:o,expiresAt:s,profile:i,status:a,_links:c}=r;this.id=o,this.expiresAt=s,this.profile=i,this.status=a,this.poll=async()=>{const t=Vc({oktaAuth:e,accessToken:n,methodName:"poll",links:c},Xc);return await t()},this.verify=async t=>{const r=Vc({oktaAuth:e,accessToken:n,methodName:"verify",links:c},Zc);return await r(t)}}}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
class eu extends qc{constructor(e,t){super(e,t);const{accessToken:n,res:r}=t,{id:o,profile:s,roles:i,status:a,_links:c}=r;this.id=o,this.profile=s,this.roles=i,this.status=a,this.get=async()=>{const t=Vc({oktaAuth:e,accessToken:n,methodName:"get",links:c},eu);return await t()},this.delete=async()=>{const t=Vc({oktaAuth:e,accessToken:n,methodName:"delete",links:c});return await t()},this.challenge=async()=>{const t=Vc({oktaAuth:e,accessToken:n,methodName:"challenge",links:c},Zc);return await t()},c.poll&&(this.poll=async()=>{const t=Vc({oktaAuth:e,accessToken:n,methodName:"poll",links:c},Xc);return await t()}),c.verify&&(this.verify=async t=>{const r=Vc({oktaAuth:e,accessToken:n,methodName:"verify",links:c});return await r(t)})}}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
const tu=async(e,t)=>{const n=await Bc(e,{url:"/idp/myaccount/emails",method:"GET",accessToken:null===t||void 0===t?void 0:t.accessToken},eu);return n},nu=async(e,t)=>{const{id:n,accessToken:r}=t,o=await Bc(e,{url:`/idp/myaccount/emails/${n}`,method:"GET",accessToken:r},eu);return o},ru=async(e,t)=>{const{accessToken:n,payload:r}=t,o=await Bc(e,{url:"/idp/myaccount/emails",method:"POST",payload:r,accessToken:n},eu);return o},ou=async(e,t)=>{const{id:n,accessToken:r}=t,o=await Bc(e,{url:`/idp/myaccount/emails/${n}`,method:"DELETE",accessToken:r});return o},su=async(e,t)=>{const{id:n,accessToken:r}=t,o=await Bc(e,{url:`/idp/myaccount/emails/${n}/challenge`,method:"POST",accessToken:r},Zc);return o},iu=async(e,t)=>{const{emailId:n,challengeId:r,accessToken:o}=t,s=await Bc(e,{url:`/idp/myaccount/emails/${n}/challenge/${r}`,method:"POST",accessToken:o},Zc);return s},au=async(e,t)=>{const{emailId:n,challengeId:r,payload:o,accessToken:s}=t,i=await Bc(e,{url:`/idp/myaccount/emails/${n}/challenge/${r}/verify`,method:"POST",payload:o,accessToken:s});return i};
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
class cu extends qc{constructor(e,t){super(e,t);const{res:n,accessToken:r}=t,{id:o,profile:s,status:i,_links:a}=n;this.id=o,this.profile=s,this.status=i,this.get=async()=>{const t=Vc({oktaAuth:e,accessToken:r,methodName:"get",links:a},cu);return await t()},this.delete=async()=>{const t=Vc({oktaAuth:e,accessToken:r,methodName:"delete",links:a});return await t()},this.challenge=async t=>{const n=Vc({oktaAuth:e,accessToken:r,methodName:"challenge",links:a});return await n(t)},a.verify&&(this.verify=async t=>{const n=Vc({oktaAuth:e,accessToken:r,methodName:"verify",links:a});return await n(t)})}}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
const uu=async(e,t)=>{const n=await Bc(e,{url:"/idp/myaccount/phones",method:"GET",accessToken:null===t||void 0===t?void 0:t.accessToken},cu);return n},lu=async(e,t)=>{const{accessToken:n,id:r}=t,o=await Bc(e,{url:`/idp/myaccount/phones/${r}`,method:"GET",accessToken:n},cu);return o},du=async(e,t)=>{const{accessToken:n,payload:r}=t,o=await Bc(e,{url:"/idp/myaccount/phones",method:"POST",payload:r,accessToken:n},cu);return o},hu=async(e,t)=>{const{id:n,accessToken:r}=t,o=await Bc(e,{url:`/idp/myaccount/phones/${n}`,method:"DELETE",accessToken:r});return o},pu=async(e,t)=>{const{accessToken:n,id:r,payload:o}=t,s=await Bc(e,{url:`/idp/myaccount/phones/${r}/challenge`,method:"POST",payload:o,accessToken:n});return s},fu=async(e,t)=>{const{id:n,payload:r,accessToken:o}=t,s=await Bc(e,{url:`/idp/myaccount/phones/${n}/verify`,method:"POST",payload:r,accessToken:o});return s};
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
class gu extends qc{constructor(e,t){super(e,t);const{res:n,accessToken:r}=t,{id:o,status:s,created:i,lastUpdated:a,_links:c}=n;this.id=o,this.status=s,this.created=i,this.lastUpdated=a,this.status==Gc.NOT_ENROLLED?this.enroll=async t=>{const n=Vc({oktaAuth:e,accessToken:r,methodName:"enroll",links:c},gu);return await n(t)}:(this.get=async()=>{const t=Vc({oktaAuth:e,accessToken:r,methodName:"get",links:c},gu);return await t()},this.update=async t=>{const n=Vc({oktaAuth:e,accessToken:r,methodName:"put",links:c},gu);return await n(t)},this.delete=async()=>{const t=Vc({oktaAuth:e,accessToken:r,methodName:"delete",links:c});return await t()})}}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
const mu=async(e,t)=>{const n=await Bc(e,{url:"/idp/myaccount/password",method:"GET",accessToken:null===t||void 0===t?void 0:t.accessToken},gu);return n},vu=async(e,t)=>{const{accessToken:n,payload:r}=t,o=await Bc(e,{url:"/idp/myaccount/password",method:"POST",payload:r,accessToken:n},gu);return o},yu=async(e,t)=>{const{accessToken:n,payload:r}=t,o=await Bc(e,{url:"/idp/myaccount/password",method:"PUT",payload:r,accessToken:n},gu);return o},wu=async(e,t)=>{const n=await Bc(e,{url:"/idp/myaccount/password",method:"DELETE",accessToken:null===t||void 0===t?void 0:t.accessToken});return n};
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
function ku(e){return class extends e{constructor(...e){super(...e),this.myaccount=Object.entries(c).filter((([e])=>"default"!==e)).reduce(((e,[t,n])=>(e[t]=n.bind(null,this),e)),{})}}}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
function bu(e,t){var n={};return Object.assign(n,t),!n.stateToken&&e.stateToken&&(n.stateToken=e.stateToken),n}function Tu(e){return bu(e)}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
function Su(e,t){return t=bu(e,t),De(e,e.getIssuerOrigin()+"/api/v1/authn",t,{withCredentials:!0})}function Ou(e,t,n){if(!n||!n.stateToken){var r=xu(e);if(!r)return Promise.reject(new L("No transaction to resume"));n={stateToken:r}}return Su(e,n).then((function(e){return t.createTransaction(e)}))}function _u(e,t,n){if(!n||!n.stateToken){var r=xu(e);if(!r)return Promise.reject(new L("No transaction to evaluate"));n={stateToken:r}}return Au(e,n).then((function(e){return t.createTransaction(e)}))}function Au(e,t){return t=bu(e,t),De(e,e.getIssuerOrigin()+"/api/v1/authn/introspect",t,{withCredentials:!0})}function Eu(e){return!!xu(e)}function Pu(e,t,n,r,o){return o=Object.assign({withCredentials:!0},o),De(e,n,r,o).then((function(e){return t.createTransaction(e)}))}function xu(e){const t=e.options.storageUtil.storage;return t.get(de)}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
function Cu(e,t,n,r,o,s){if(Array.isArray(o))return function(i,a){if(!i)throw new L("Must provide a link name");var c=T(o,{name:i});if(!c)throw new L("No link found for that name");return Cu(e,t,n,r,c,s)(a)};if(o.hints&&o.hints.allow&&1===o.hints.allow.length){var i=o.hints.allow[0];switch(i){case"GET":return function(){return Me(e,o.href,{withCredentials:!0})};case"POST":return function(i){s&&s.isPolling&&(s.isPolling=!1);var a=bu(n,i);"MFA_ENROLL"!==n.status&&"FACTOR_ENROLL"!==n.status||Object.assign(a,{factorType:r.factorType,provider:r.provider});var c={},u=a.autoPush;if(void 0!==u){if("function"===typeof u)try{c.autoPush=!!u()}catch(h){return Promise.reject(new L("AutoPush resulted in an error."))}else null!==u&&(c.autoPush=!!u);a=b(a,"autoPush")}var l=a.rememberDevice;if(void 0!==l){if("function"===typeof l)try{c.rememberDevice=!!l()}catch(h){return Promise.reject(new L("RememberDevice resulted in an error."))}else null!==l&&(c.rememberDevice=!!l);a=b(a,"rememberDevice")}else a.profile&&void 0!==a.profile.updatePhone&&(a.profile.updatePhone&&(c.updatePhone=!0),a.profile=b(a.profile,"updatePhone"));var d=o.href+U(c);return Pu(e,t,d,a)}}}}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
class ju extends O{constructor(){const e="The poll was stopped by the sdk";super(e)}}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
function Ru(e,t,n){return function(r){var o,s,i,a;E(r)?o=r:A(r)&&(o=r.delay,s=r.rememberDevice,i=r.autoPush,a=r.transactionCallBack),o||0===o||(o=he);var c=S(t,"next","poll");function u(){var n={};if("function"===typeof i)try{n.autoPush=!!i()}catch(o){return Promise.reject(new L("AutoPush resulted in an error."))}else void 0!==i&&null!==i&&(n.autoPush=!!i);if("function"===typeof s)try{n.rememberDevice=!!s()}catch(o){return Promise.reject(new L("RememberDevice resulted in an error."))}else void 0!==s&&null!==s&&(n.rememberDevice=!!s);var r=c.href+U(n);return De(e,r,Tu(t),{saveAuthnState:!1,withCredentials:!0})}n.isPolling=!0;var l=0,d=function(){return n.isPolling?u().then((function(t){if(l=0,t.factorResult&&"WAITING"===t.factorResult){if(!n.isPolling)throw new ju;return"function"===typeof a&&a(t),R(o).then(d)}return n.isPolling=!1,e.tx.createTransaction(t)})).catch((function(e){if(e.xhr&&(0===e.xhr.status||429===e.xhr.status)&&l<=4){var t=1e3*Math.pow(2,l);return l++,R(t).then(d)}throw e})):Promise.reject(new ju)};return d().catch((function(e){throw n.isPolling=!1,e}))}}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
function Iu(e,t,n,r,o){var s={};for(var i in r._links)if(Object.prototype.hasOwnProperty.call(r._links,i)){var a=r._links[i];if("next"===i&&(i=a.name),a.type)s[i]=a;else switch(i){case"poll":s.poll=Ru(e,n,o);break;default:var c=Cu(e,t,n,r,a,o);c&&(s[i]=c)}}return s}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
function Mu(e,t,n,r,o){if(r=r||n,r=k(r),Array.isArray(r)){for(var s=[],i=0,a=r.length;i<a;i++)s.push(Mu(e,t,n,r[i],o));return s}var c=r._embedded||{};for(var u in c)Object.prototype.hasOwnProperty.call(c,u)&&(A(c[u])||Array.isArray(c[u]))&&(c[u]=Mu(e,t,n,c[u],o));var l=Iu(e,t,n,r,o);return Object.assign(c,l),r=b(r,"_embedded","_links"),Object.assign(r,c),r}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
class Du{constructor(e,t,n=null){this.data=void 0,this.status=void 0,n&&(this.data=n,Object.assign(this,Mu(e,t,n,n,{})),delete this.stateToken,"RECOVERY_CHALLENGE"!==n.status||n._links||(this.cancel=function(){return Promise.resolve(t.createTransaction())}))}}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
function Uu(e){const t={status:Su.bind(null,e),resume(n){return Ou(e,t,n)},exists:Eu.bind(null,e),introspect(n){return _u(e,t,n)},createTransaction:n=>new Du(e,t,n),postToTransaction:(n,r,o)=>Pu(e,t,n,r,o)};return t}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
function Nu(e,t){if(t=t||{},!Ir())return Promise.reject(new L("Fingerprinting is not supported on this device"));var n,r,o,s=new Promise((function(s,i){r=document.createElement("iframe"),r.style.display="none",o=function(t){if(t&&t.data&&t.origin===e.getIssuerOrigin()){try{var n=JSON.parse(t.data)}catch(r){return}if(n)return"FingerprintAvailable"===n.type?s(n.fingerprint):void("FingerprintServiceReady"===n.type&&t.source.postMessage(JSON.stringify({type:"GetFingerprint"}),t.origin))}},Bo(window,"message",o),r.src=e.getIssuerOrigin()+"/auth/services/devicefingerprint",document.body.appendChild(r),n=setTimeout((function(){i(new L("Fingerprinting timed out"))}),(null===t||void 0===t?void 0:t.timeout)||15e3)}));return s.finally((function(){clearTimeout(n),Vo(window,"message",o),document.body.contains(r)&&r.parentElement.removeChild(r)}))}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
function Lu(e){return class extends e{constructor(...e){super(...e),this.authn=this.tx=Uu(this),this.fingerprint=Nu.bind(null,this)}async signIn(e){e=k(e||{});const t=t=>(delete e.sendFingerprint,this.tx.postToTransaction("/api/v1/authn",e,t));return e.sendFingerprint?this.fingerprint().then((function(e){return t({headers:{"X-Device-Fingerprint":e}})})):t()}async signInWithCredentials(e){return this.signIn(e)}forgotPassword(e){return this.tx.postToTransaction("/api/v1/authn/recovery/password",e)}unlockAccount(e){return this.tx.postToTransaction("/api/v1/authn/recovery/unlock",e)}verifyRecoveryToken(e){return this.tx.postToTransaction("/api/v1/authn/recovery/token",e)}}}
/*!
 * Copyright (c) 2015-present, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * 
 * See the License for the specific language governing permissions and limitations under the License.
 */
const Fu=Sc(),Hu=xc(),qu=Hc(),Bu=cc(Hu,Fu,qu),Vu=ku(Bu),Ku=Lu(Vu);class $u extends Ku{constructor(e){super(e)}}var Wu=n(2566);class zu extends p.A{constructor(e,t,n){super(e,(e=>{var n;return t(e.isAuthenticated,null===e||void 0===e||null===(n=e.accessToken)||void 0===n?void 0:n.accessToken)})),this.router=n,this.initialized=!1}async httpRequest(e,t,n={}){let r=Object.assign({},n.headers);delete r["X-Okta-User-Agent-Extended"];let o={method:e,url:t,headers:r,data:n.data,withCredentials:n.withCredentials},s=await(0,f.A)(o);return null===s||void 0===s?void 0:s.request}async restoreOriginalUri(e){this.router&&this.router.replace(e)}getRedirectUri(e){let t=this.router.options.base,n=this.router.resolve(e).href;return t.endsWith("/")&&n.startsWith("/")&&(t=t.substring(0,t.length-1)),window.location.origin+t+n}async init(){if(this.initialized)return;let e={};if(this.options.openIdConnectUrl){Object.assign(e,{issuer:this.options.openIdConnectUrl.replace(/\/\.well-known\/openid-configuration\/?$/,""),clientId:"stac-browser",redirectUri:this.getRedirectUri("/auth"),logoutRedirectUri:this.getRedirectUri("/auth/logout")},this.options.oidcOptions);try{let t=await(0,f.A)(this.options.openIdConnectUrl);Wu.Ay.isObject(t.data)&&(e.authorizeUrl||(e.authorizeUrl=t.data.authorization_endpoint),e.userinfoUrl||(e.userinfoUrl=t.data.userinfo_endpoint),e.tokenUrl||(e.tokenUrl=t.data.token_endpoint),e.logoutUrl||(e.logoutUrl=t.data.end_session_endpoint),e.revokeUrl||(e.revokeUrl=t.data.revocation_endpoint))}catch(t){console.error(t)}}e.restoreOriginalUri=(e,t)=>this.restoreOriginalUri(t),e.httpRequestClient=this.httpRequest.bind(this),this.okta=new $u(e),this.okta.authStateManager.subscribe(this.changeListener),await this.okta.start(),this.initialized=!0}async close(){await this.okta.stop(),this.okta.authStateManager.unsubscribe(this.changeListener)}getType(){return"oidc"}getUnauthorizedLabel(){return h.Ay.t("authentication.button.login")}getAuthorizedLabel(){return h.Ay.t("authentication.button.logout")}async login(){var e,t;return this.okta.setOriginalUri((null===(e=this.router)||void 0===e||null===(t=e.currentRoute)||void 0===t?void 0:t.fullPath)||window.location.href),await this.okta.signInWithRedirect(),null}async logout(){return await this.okta.signOut(),!1}async loginCallback(){this.okta.isLoginRedirect()&&await this.okta.handleRedirect()}}},74945:function(e,t){var n="undefined"!==typeof self?self:this,r=function(){function e(){this.fetch=!1,this.DOMException=n.DOMException}return e.prototype=n,new e}();(function(e){(function(t){var n={searchParams:"URLSearchParams"in e,iterable:"Symbol"in e&&"iterator"in Symbol,blob:"FileReader"in e&&"Blob"in e&&function(){try{return new Blob,!0}catch(e){return!1}}(),formData:"FormData"in e,arrayBuffer:"ArrayBuffer"in e};function r(e){return e&&DataView.prototype.isPrototypeOf(e)}if(n.arrayBuffer)var o=["[object Int8Array]","[object Uint8Array]","[object Uint8ClampedArray]","[object Int16Array]","[object Uint16Array]","[object Int32Array]","[object Uint32Array]","[object Float32Array]","[object Float64Array]"],s=ArrayBuffer.isView||function(e){return e&&o.indexOf(Object.prototype.toString.call(e))>-1};function i(e){if("string"!==typeof e&&(e=String(e)),/[^a-z0-9\-#$%&'*+.^_`|~]/i.test(e))throw new TypeError("Invalid character in header field name");return e.toLowerCase()}function a(e){return"string"!==typeof e&&(e=String(e)),e}function c(e){var t={next:function(){var t=e.shift();return{done:void 0===t,value:t}}};return n.iterable&&(t[Symbol.iterator]=function(){return t}),t}function u(e){this.map={},e instanceof u?e.forEach((function(e,t){this.append(t,e)}),this):Array.isArray(e)?e.forEach((function(e){this.append(e[0],e[1])}),this):e&&Object.getOwnPropertyNames(e).forEach((function(t){this.append(t,e[t])}),this)}function l(e){if(e.bodyUsed)return Promise.reject(new TypeError("Already read"));e.bodyUsed=!0}function d(e){return new Promise((function(t,n){e.onload=function(){t(e.result)},e.onerror=function(){n(e.error)}}))}function h(e){var t=new FileReader,n=d(t);return t.readAsArrayBuffer(e),n}function p(e){var t=new FileReader,n=d(t);return t.readAsText(e),n}function f(e){for(var t=new Uint8Array(e),n=new Array(t.length),r=0;r<t.length;r++)n[r]=String.fromCharCode(t[r]);return n.join("")}function g(e){if(e.slice)return e.slice(0);var t=new Uint8Array(e.byteLength);return t.set(new Uint8Array(e)),t.buffer}function m(){return this.bodyUsed=!1,this._initBody=function(e){this._bodyInit=e,e?"string"===typeof e?this._bodyText=e:n.blob&&Blob.prototype.isPrototypeOf(e)?this._bodyBlob=e:n.formData&&FormData.prototype.isPrototypeOf(e)?this._bodyFormData=e:n.searchParams&&URLSearchParams.prototype.isPrototypeOf(e)?this._bodyText=e.toString():n.arrayBuffer&&n.blob&&r(e)?(this._bodyArrayBuffer=g(e.buffer),this._bodyInit=new Blob([this._bodyArrayBuffer])):n.arrayBuffer&&(ArrayBuffer.prototype.isPrototypeOf(e)||s(e))?this._bodyArrayBuffer=g(e):this._bodyText=e=Object.prototype.toString.call(e):this._bodyText="",this.headers.get("content-type")||("string"===typeof e?this.headers.set("content-type","text/plain;charset=UTF-8"):this._bodyBlob&&this._bodyBlob.type?this.headers.set("content-type",this._bodyBlob.type):n.searchParams&&URLSearchParams.prototype.isPrototypeOf(e)&&this.headers.set("content-type","application/x-www-form-urlencoded;charset=UTF-8"))},n.blob&&(this.blob=function(){var e=l(this);if(e)return e;if(this._bodyBlob)return Promise.resolve(this._bodyBlob);if(this._bodyArrayBuffer)return Promise.resolve(new Blob([this._bodyArrayBuffer]));if(this._bodyFormData)throw new Error("could not read FormData body as blob");return Promise.resolve(new Blob([this._bodyText]))},this.arrayBuffer=function(){return this._bodyArrayBuffer?l(this)||Promise.resolve(this._bodyArrayBuffer):this.blob().then(h)}),this.text=function(){var e=l(this);if(e)return e;if(this._bodyBlob)return p(this._bodyBlob);if(this._bodyArrayBuffer)return Promise.resolve(f(this._bodyArrayBuffer));if(this._bodyFormData)throw new Error("could not read FormData body as text");return Promise.resolve(this._bodyText)},n.formData&&(this.formData=function(){return this.text().then(k)}),this.json=function(){return this.text().then(JSON.parse)},this}u.prototype.append=function(e,t){e=i(e),t=a(t);var n=this.map[e];this.map[e]=n?n+", "+t:t},u.prototype["delete"]=function(e){delete this.map[i(e)]},u.prototype.get=function(e){return e=i(e),this.has(e)?this.map[e]:null},u.prototype.has=function(e){return this.map.hasOwnProperty(i(e))},u.prototype.set=function(e,t){this.map[i(e)]=a(t)},u.prototype.forEach=function(e,t){for(var n in this.map)this.map.hasOwnProperty(n)&&e.call(t,this.map[n],n,this)},u.prototype.keys=function(){var e=[];return this.forEach((function(t,n){e.push(n)})),c(e)},u.prototype.values=function(){var e=[];return this.forEach((function(t){e.push(t)})),c(e)},u.prototype.entries=function(){var e=[];return this.forEach((function(t,n){e.push([n,t])})),c(e)},n.iterable&&(u.prototype[Symbol.iterator]=u.prototype.entries);var v=["DELETE","GET","HEAD","OPTIONS","POST","PUT"];function y(e){var t=e.toUpperCase();return v.indexOf(t)>-1?t:e}function w(e,t){t=t||{};var n=t.body;if(e instanceof w){if(e.bodyUsed)throw new TypeError("Already read");this.url=e.url,this.credentials=e.credentials,t.headers||(this.headers=new u(e.headers)),this.method=e.method,this.mode=e.mode,this.signal=e.signal,n||null==e._bodyInit||(n=e._bodyInit,e.bodyUsed=!0)}else this.url=String(e);if(this.credentials=t.credentials||this.credentials||"same-origin",!t.headers&&this.headers||(this.headers=new u(t.headers)),this.method=y(t.method||this.method||"GET"),this.mode=t.mode||this.mode||null,this.signal=t.signal||this.signal,this.referrer=null,("GET"===this.method||"HEAD"===this.method)&&n)throw new TypeError("Body not allowed for GET or HEAD requests");this._initBody(n)}function k(e){var t=new FormData;return e.trim().split("&").forEach((function(e){if(e){var n=e.split("="),r=n.shift().replace(/\+/g," "),o=n.join("=").replace(/\+/g," ");t.append(decodeURIComponent(r),decodeURIComponent(o))}})),t}function b(e){var t=new u,n=e.replace(/\r?\n[\t ]+/g," ");return n.split(/\r?\n/).forEach((function(e){var n=e.split(":"),r=n.shift().trim();if(r){var o=n.join(":").trim();t.append(r,o)}})),t}function T(e,t){t||(t={}),this.type="default",this.status=void 0===t.status?200:t.status,this.ok=this.status>=200&&this.status<300,this.statusText="statusText"in t?t.statusText:"OK",this.headers=new u(t.headers),this.url=t.url||"",this._initBody(e)}w.prototype.clone=function(){return new w(this,{body:this._bodyInit})},m.call(w.prototype),m.call(T.prototype),T.prototype.clone=function(){return new T(this._bodyInit,{status:this.status,statusText:this.statusText,headers:new u(this.headers),url:this.url})},T.error=function(){var e=new T(null,{status:0,statusText:""});return e.type="error",e};var S=[301,302,303,307,308];T.redirect=function(e,t){if(-1===S.indexOf(t))throw new RangeError("Invalid status code");return new T(null,{status:t,headers:{location:e}})},t.DOMException=e.DOMException;try{new t.DOMException}catch(_){t.DOMException=function(e,t){this.message=e,this.name=t;var n=Error(e);this.stack=n.stack},t.DOMException.prototype=Object.create(Error.prototype),t.DOMException.prototype.constructor=t.DOMException}function O(e,r){return new Promise((function(o,s){var i=new w(e,r);if(i.signal&&i.signal.aborted)return s(new t.DOMException("Aborted","AbortError"));var a=new XMLHttpRequest;function c(){a.abort()}a.onload=function(){var e={status:a.status,statusText:a.statusText,headers:b(a.getAllResponseHeaders()||"")};e.url="responseURL"in a?a.responseURL:e.headers.get("X-Request-URL");var t="response"in a?a.response:a.responseText;o(new T(t,e))},a.onerror=function(){s(new TypeError("Network request failed"))},a.ontimeout=function(){s(new TypeError("Network request failed"))},a.onabort=function(){s(new t.DOMException("Aborted","AbortError"))},a.open(i.method,i.url,!0),"include"===i.credentials?a.withCredentials=!0:"omit"===i.credentials&&(a.withCredentials=!1),"responseType"in a&&n.blob&&(a.responseType="blob"),i.headers.forEach((function(e,t){a.setRequestHeader(t,e)})),i.signal&&(i.signal.addEventListener("abort",c),a.onreadystatechange=function(){4===a.readyState&&i.signal.removeEventListener("abort",c)}),a.send("undefined"===typeof i._bodyInit?null:i._bodyInit)}))}O.polyfill=!0,e.fetch||(e.fetch=O,e.Headers=u,e.Request=w,e.Response=T),t.Headers=u,t.Request=w,t.Response=T,t.fetch=O,Object.defineProperty(t,"__esModule",{value:!0})})({})})(r),r.fetch.ponyfill=!0,delete r.fetch.polyfill;var o=r;t=o.fetch,t["default"]=o.fetch,t.fetch=o.fetch,t.Headers=o.Headers,t.Request=o.Request,t.Response=o.Response,e.exports=t},37724:function(e){"use strict";class t extends Error{constructor(e){super(e||"Promise was canceled"),this.name="CancelError"}get isCanceled(){return!0}}class n{static fn(e){return(...t)=>new n(((n,r,o)=>{t.push(o),e(...t).then(n,r)}))}constructor(e){this._cancelHandlers=[],this._isPending=!0,this._isCanceled=!1,this._rejectOnCancel=!0,this._promise=new Promise(((t,n)=>{this._reject=n;const r=e=>{this._isCanceled&&s.shouldReject||(this._isPending=!1,t(e))},o=e=>{this._isPending=!1,n(e)},s=e=>{if(!this._isPending)throw new Error("The `onCancel` handler was attached after the promise settled.");this._cancelHandlers.push(e)};return Object.defineProperties(s,{shouldReject:{get:()=>this._rejectOnCancel,set:e=>{this._rejectOnCancel=e}}}),e(r,o,s)}))}then(e,t){return this._promise.then(e,t)}catch(e){return this._promise.catch(e)}finally(e){return this._promise.finally(e)}cancel(e){if(this._isPending&&!this._isCanceled){if(this._isCanceled=!0,this._cancelHandlers.length>0)try{for(const e of this._cancelHandlers)e()}catch(n){return void this._reject(n)}this._rejectOnCancel&&this._reject(new t(e))}}get isCanceled(){return this._isCanceled}}Object.setPrototypeOf(n.prototype,Promise.prototype),e.exports=n,e.exports.CancelError=t},51504:function(e){function t(){}t.prototype={on:function(e,t,n){var r=this.e||(this.e={});return(r[e]||(r[e]=[])).push({fn:t,ctx:n}),this},once:function(e,t,n){var r=this;function o(){r.off(e,o),t.apply(n,arguments)}return o._=t,this.on(e,o,n)},emit:function(e){var t=[].slice.call(arguments,1),n=((this.e||(this.e={}))[e]||[]).slice(),r=0,o=n.length;for(r;r<o;r++)n[r].fn.apply(n[r].ctx,t);return this},off:function(e,t){var n=this.e||(this.e={}),r=n[e],o=[];if(r&&t)for(var s=0,i=r.length;s<i;s++)r[s].fn!==t&&r[s].fn._!==t&&o.push(r[s]);return o.length?n[e]=o:delete n[e],this}},e.exports=t}}]);
//# sourceMappingURL=5027.9eb6a9de.js.map