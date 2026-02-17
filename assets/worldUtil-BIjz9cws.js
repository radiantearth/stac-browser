import{aB as l}from"./GeoJSON-BlyzYhKz.js";function p(r,s){const n=r.viewState.projection,t=s.getSource().getWrapX()&&n.canWrapX(),o=n.getExtent(),c=r.extent,e=t?l(o):null,a=t?Math.ceil((c[2]-o[2])/e)+1:1;return[t?Math.floor((c[0]-o[0])/e):0,a,e]}export{p as g};
//# sourceMappingURL=worldUtil-BIjz9cws.js.map
