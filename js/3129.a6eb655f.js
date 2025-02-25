"use strict";(self["webpackChunk_radiantearth_stac_browser"]=self["webpackChunk_radiantearth_stac_browser"]||[]).push([[3129],{33129:function(e,a,r){r.r(a),a["default"]=r(39816)},39816:function(e){e.exports=function(e){if(e&&e.length)for(const s of e){let e;switch(s.keyword){case"additionalItems":case"items":e="";var a=s.params.limit;e+="ne doit pas contenir plus de "+a+" élémént",1!=a&&(e+="s");break;case"additionalProperties":e="ne doit pas contenir de propriétés additionnelles";break;case"anyOf":e='doit correspondre à un schéma de "anyOf"';break;case"const":e="doit être égal à la constante";break;case"contains":e="doit contenir un élément valide";break;case"dependencies":case"dependentRequired":e="";a=s.params.depsCount;e+="doit avoir la propriété "+s.params.deps+" quand la propriété "+s.params.property+" est présente";break;case"discriminator":switch(s.params.error){case"tag":e='tag "'+s.params.tag+'" must be string';break;case"mapping":e='value of tag "'+s.params.tag+'" must be in oneOf';break;default:e='doit être valide selon le critère "'+s.keyword+'"'}break;case"enum":e="doit être égal à une des valeurs prédéfinies";break;case"false schema":e='le schema est "false"';break;case"format":e='doit correspondre au format "'+s.params.format+'"';break;case"formatMaximum":case"formatExclusiveMaximum":e="";var r=s.params.comparison+" "+s.params.limit;e+="doit être "+r;break;case"formatMinimum":case"formatExclusiveMinimum":e="";r=s.params.comparison+" "+s.params.limit;e+="doit être "+r;break;case"if":e='doit correspondre au schéma "'+s.params.failingKeyword+'"';break;case"maximum":case"exclusiveMaximum":e="";r=s.params.comparison+" "+s.params.limit;e+="doit être "+r;break;case"maxItems":e="";a=s.params.limit;e+="ne doit pas contenir plus de "+a+" élément",1!=a&&(e+="s");break;case"maxLength":e="";a=s.params.limit;e+="ne doit pas dépasser "+a+" caractère",1!=a&&(e+="s");break;case"maxProperties":e="";a=s.params.limit;e+="ne doit pas contenir plus de "+a+" propriété",1!=a&&(e+="s");break;case"minimum":case"exclusiveMinimum":e="";r=s.params.comparison+" "+s.params.limit;e+="doit être "+r;break;case"minItems":e="";a=s.params.limit;e+="ne doit pas contenir moins de "+a+" élément",1!=a&&(e+="s");break;case"minLength":e="";a=s.params.limit;e+="ne doit pas faire moins de "+a+" caractère",1!=a&&(e+="s");break;case"minProperties":e="";a=s.params.limit;e+="ne doit pas contenir moins de "+a+" propriété",1!=a&&(e+="s");break;case"multipleOf":e="doit être un multiple de "+s.params.multipleOf;break;case"not":e='est invalide selon le schéma "not"';break;case"oneOf":e='doit correspondre à exactement un schéma de "oneOf"';break;case"pattern":e='doit correspondre au format "'+s.params.pattern+'"';break;case"patternRequired":e='la propriété doit correspondre au format "'+s.params.missingPattern+'"';break;case"propertyNames":e="le nom de propriété est invalide";break;case"required":e="requiert la propriété "+s.params.missingProperty;break;case"type":e="doit être de type "+s.params.type;break;case"unevaluatedItems":e="";a=s.params.len;e+="must NOT have more than "+a+" item",1!=a&&(e+="s");break;case"unevaluatedProperties":e="must NOT have unevaluated properties";break;case"uniqueItems":e="ne doit pas contenir de doublons (les éléments ## "+s.params.j+" et "+s.params.i+" sont identiques)";break;default:e='doit être valide selon le critère "'+s.keyword+'"'}s.message=e}}}}]);
//# sourceMappingURL=3129.a6eb655f.js.map