"use strict";(self["webpackChunk_radiantearth_stac_browser"]=self["webpackChunk_radiantearth_stac_browser"]||[]).push([[4648],{34648:function(r,t,o){o.r(t),o.d(t,{default:function(){return i}});o(44114),o(64979);var e=o(44426),n=o(48907),c=o(2566);class i extends e.A{constructor(r,t,o){super(r,t,o)}getComponent(){return"Basic"}getComponentProps(){return{description:this.options.description}}getButtonTitle(){return n.Ay.t("authentication.button.title")}async logout(){return"logout"!==this.router.currentRoute.name&&this.router.push("/auth/logout"),!0}updateStore(r){return"string"===typeof r&&r.length>=3&&(r=`Basic ${btoa(r)}`),c.Ay.hasText(r)||(r=void 0),{header:{key:"Authorization",value:r}}}}},73506:function(r,t,o){var e=o(13925),n=String,c=TypeError;r.exports=function(r){if(e(r))return r;throw new c("Can't set "+n(r)+" as a prototype")}},55002:function(r){r.exports={IndexSizeError:{s:"INDEX_SIZE_ERR",c:1,m:1},DOMStringSizeError:{s:"DOMSTRING_SIZE_ERR",c:2,m:0},HierarchyRequestError:{s:"HIERARCHY_REQUEST_ERR",c:3,m:1},WrongDocumentError:{s:"WRONG_DOCUMENT_ERR",c:4,m:1},InvalidCharacterError:{s:"INVALID_CHARACTER_ERR",c:5,m:1},NoDataAllowedError:{s:"NO_DATA_ALLOWED_ERR",c:6,m:0},NoModificationAllowedError:{s:"NO_MODIFICATION_ALLOWED_ERR",c:7,m:1},NotFoundError:{s:"NOT_FOUND_ERR",c:8,m:1},NotSupportedError:{s:"NOT_SUPPORTED_ERR",c:9,m:1},InUseAttributeError:{s:"INUSE_ATTRIBUTE_ERR",c:10,m:1},InvalidStateError:{s:"INVALID_STATE_ERR",c:11,m:1},SyntaxError:{s:"SYNTAX_ERR",c:12,m:1},InvalidModificationError:{s:"INVALID_MODIFICATION_ERR",c:13,m:1},NamespaceError:{s:"NAMESPACE_ERR",c:14,m:1},InvalidAccessError:{s:"INVALID_ACCESS_ERR",c:15,m:1},ValidationError:{s:"VALIDATION_ERR",c:16,m:0},TypeMismatchError:{s:"TYPE_MISMATCH_ERR",c:17,m:1},SecurityError:{s:"SECURITY_ERR",c:18,m:1},NetworkError:{s:"NETWORK_ERR",c:19,m:1},AbortError:{s:"ABORT_ERR",c:20,m:1},URLMismatchError:{s:"URL_MISMATCH_ERR",c:21,m:1},QuotaExceededError:{s:"QUOTA_EXCEEDED_ERR",c:22,m:1},TimeoutError:{s:"TIMEOUT_ERR",c:23,m:1},InvalidNodeTypeError:{s:"INVALID_NODE_TYPE_ERR",c:24,m:1},DataCloneError:{s:"DATA_CLONE_ERR",c:25,m:1}}},16193:function(r,t,o){var e=o(79504),n=Error,c=e("".replace),i=function(r){return String(new n(r).stack)}("zxcasd"),s=/\n\s*at [^:]*:[^\n]*/,a=s.test(i);r.exports=function(r,t){if(a&&"string"==typeof r&&!n.prepareStackTrace)while(t--)r=c(r,s,"");return r}},46706:function(r,t,o){var e=o(79504),n=o(79306);r.exports=function(r,t,o){try{return e(n(Object.getOwnPropertyDescriptor(r,t)[o]))}catch(c){}}},23167:function(r,t,o){var e=o(94901),n=o(20034),c=o(52967);r.exports=function(r,t,o){var i,s;return c&&e(i=t.constructor)&&i!==o&&n(s=i.prototype)&&s!==o.prototype&&c(r,s),r}},13925:function(r,t,o){var e=o(20034);r.exports=function(r){return e(r)||null===r}},32603:function(r,t,o){var e=o(655);r.exports=function(r,t){return void 0===r?arguments.length<2?"":t:e(r)}},52967:function(r,t,o){var e=o(46706),n=o(20034),c=o(67750),i=o(73506);r.exports=Object.setPrototypeOf||("__proto__"in{}?function(){var r,t=!1,o={};try{r=e(Object.prototype,"__proto__","set"),r(o,[]),t=o instanceof Array}catch(s){}return function(o,e){return c(o),i(e),n(o)?(t?r(o,e):o.__proto__=e,o):o}}():void 0)},655:function(r,t,o){var e=o(36955),n=String;r.exports=function(r){if("Symbol"===e(r))throw new TypeError("Cannot convert a Symbol value to a string");return n(r)}},64979:function(r,t,o){var e=o(46518),n=o(44576),c=o(97751),i=o(6980),s=o(24913).f,a=o(39297),E=o(90679),u=o(23167),R=o(32603),_=o(55002),p=o(16193),f=o(43724),A=o(96395),m="DOMException",I=c("Error"),T=c(m),l=function(){E(this,d);var r=arguments.length,t=R(r<1?void 0:arguments[0]),o=R(r<2?void 0:arguments[1],"Error"),e=new T(t,o),n=new I(t);return n.name=m,s(e,"stack",i(1,p(n.stack,1))),u(e,this,l),e},d=l.prototype=T.prototype,O="stack"in new I(m),N="stack"in new T(1,2),v=T&&f&&Object.getOwnPropertyDescriptor(n,m),h=!!v&&!(v.writable&&v.configurable),y=O&&!h&&!N;e({global:!0,constructor:!0,forced:A||y},{DOMException:y?l:T});var D=c(m),S=D.prototype;if(S.constructor!==D)for(var C in A||s(S,"constructor",i(1,D)),_)if(a(_,C)){var g=_[C],w=g.s;a(D,w)||s(D,w,i(6,g.c))}}}]);
//# sourceMappingURL=4648.27991b24.js.map