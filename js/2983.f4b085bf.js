"use strict";(self["webpackChunk_radiantearth_stac_browser"]=self["webpackChunk_radiantearth_stac_browser"]||[]).push([[2983],{18237:function(t,e,r){var l=r(46518),n=r(72652),i=r(79306),a=r(28551),s=r(1767),o=TypeError;l({target:"Iterator",proto:!0,real:!0},{reduce:function(t){a(this),i(t);var e=s(this),r=arguments.length<2,l=r?void 0:arguments[1],c=0;if(n(e,(function(e){r?(r=!1,l=e):l=t(l,e,c),c++}),{IS_RECORD:!0}),r)throw new o("Reduce of empty iterator with no initial value");return l}})},73931:function(t,e,r){r.r(e),r.d(e,{default:function(){return T}});var l=function(){var t=this,e=t._self._c;return e("section",{staticClass:"links mb-4"},[t.title?e("h2",[t._v(t._s(t.title))]):t._e(),t.hasGroups?t._l(t.groups,(function(r){return e("div",{key:r.rel,staticClass:"group"},[r.rel?e("h4",[t._v(t._s(r.label))]):t._e(),e("ul",t._l(r.links,(function(r,l){return e("Link",{key:l,attrs:{link:r,context:t.context,fallbackTitle:()=>t.fallbackTitle(r)}})})),1)])})):e("ul",t._l(t.links,(function(r,l){return e("Link",{key:l,attrs:{link:r,context:t.context,fallbackTitle:()=>t.fallbackTitle(r)}})})),1)],2)},n=[],i=(r(44114),r(18111),r(18237),r(13579),function(){var t=this,e=t._self._c;return e("li",{staticClass:"link"},[e("StacLink",{staticClass:"pr-1",attrs:{id:t.popoverId,data:t.link,fallbackTitle:t.fallbackTitle}}),e("b-popover",{attrs:{target:t.popoverId,triggers:"hover",placement:"right",container:"#stac-browser","custom-class":"link-more"}},[t.link.description?e("Description",{attrs:{description:t.link.description,compact:""}}):t._e(),e("section",{staticClass:"link-actions"},[e("h3",{staticClass:"first"},[t._v(t._s(t.$t("additionalActions")))]),e("HrefActions",{attrs:{vertical:"",data:t.link,size:"sm"}})],1),e("Metadata",{attrs:{data:t.link,type:"Link",headerTag:"h3",ignoreFields:t.ignore}})],1)],1)}),a=[],s=r(55123),o=r(58581),c=r(30278);let u=0;var p={name:"Link",components:{BPopover:c.u,HrefActions:s.A,StacLink:o["default"],Description:()=>Promise.resolve().then(r.bind(r,41526)),Metadata:()=>r.e(5528).then(r.bind(r,73147))},props:{link:{type:Object,required:!0},fallbackTitle:{type:Function,required:!0},context:{type:Object,default:null}},data(){return{ignore:["href","type","rel","title","description"]}},computed:{popoverId(){return"popover-link-"+u}},beforeCreate(){u++}},k=p,f=r(81656),d=(0,f.A)(k,i,a,!1,null,null,null),h=d.exports,b=r(74870),g=r(55288),_=r(59203),m=r(2566),v=r(48907),y=r(95353),L={name:"Links",components:{Link:h},props:{title:{type:String,default:null},links:{type:Array,default:()=>[]},context:{type:Object,default:null}},computed:{...(0,y.aH)(["uiLanguage"]),groups(){let t=this.links.reduce(((t,e)=>{let r="string"===typeof e.rel?e.rel.toLowerCase():"";return r in t?t[r].links.push(e):t[r]={rel:r,label:this.formatRel(r),links:[e]},t}),{});const e=new Intl.Collator(this.uiLanguage);return Object.values(t).sort(((t,r)=>e.compare(t.label,r.label)))},hasGroups(){return this.groups.some((t=>t.rel.length>0&&t.links.length>=2))}},methods:{formatRel(t){let e="string"===typeof t?t.toLowerCase():"";return e in b.Fields.links.rel.mapping?(0,v._)(b.Fields.links.rel.mapping[e]):(t.startsWith(_.dL)&&(t=t.substr(_.dL.length)),(0,g.formatKey)(t))},fallbackTitle(t){let e=m.Ay.titleForHref(t.href);if(this.hasGroups)return e;{let r=this.formatRel(t.rel);return`${r}: ${e}`}}}},C=L,w=(0,f.A)(C,l,n,!1,null,null,null),T=w.exports}}]);
//# sourceMappingURL=2983.f4b085bf.js.map