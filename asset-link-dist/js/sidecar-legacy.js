(function(){"use strict";var t={6906:function(t,e,n){n(6992),n(8674),n(9601),n(7727);var r=n(538),o=function(){var t=this,e=t.$createElement,n=t._self._c||e;return n("v-app",[n("v-navigation-drawer",{attrs:{stateless:"",permanent:"",floating:"",fixed:"",right:"",color:"transparent",width:"300px"}},[n("v-container",{attrs:{"fill-height":"",fluid:""}},[n("v-row",{attrs:{align:"center"}},[n("v-col",[n("v-container",[n("v-row",[n("v-col",{staticClass:"d-flex align-end flex-column"},[n("v-speed-dial",{attrs:{"open-on-hover":"",direction:"left",left:""},scopedSlots:t._u([{key:"activator",fn:function(){return[n("v-btn",{attrs:{fab:"",color:"orange darken-5",loading:t.assetLink.viewModel.bootProgress<100},scopedSlots:t._u([{key:"loader",fn:function(){return[n("v-progress-circular",{attrs:{rotate:-90,size:100,width:15,value:t.assetLink.viewModel.bootProgress,color:"yellow darken-2"}},[n("AssetLinkIcon")],1)]},proxy:!0}])},[n("AssetLinkIcon")],1)]},proxy:!0}])},[n("v-btn",{attrs:{fab:"",dark:"",href:t.assetLinkUrl}},[n("v-icon",[t._v("mdi-arrow-right-bold-hexagon-outline")])],1)],1)],1)],1)],1)],1)],1)],1)],1)],1)},i=[],a=(n(4916),n(4723),n(1539),n(9714),function(){var t=this,e=t.$createElement,n=t._self._c||e;return n("svg",t._g({attrs:{width:"24",height:"24",xmlns:"http://www.w3.org/2000/svg"}},t.$listeners),[n("g",{attrs:{stroke:"#fff","stroke-opacity":".999"}},[n("path",{attrs:{d:"M7.084 4.441l-2.262 12.01h1.044l.696-5.507h1.044l.696 5.507h1.044z",fill:"#fff","fill-rule":"evenodd","stroke-width":".979"}}),n("path",{attrs:{d:"M22.92 9.343v5.274l-4.079 7.911h-4.079l-2.719-5.274-2.719 5.274H5.245l-4.079-7.911V9.343l4.079-7.911h4.079l2.719 5.274 2.719-5.274h4.079z",fill:"none","stroke-width":"2.678"}}),n("path",{attrs:{d:"M15.75 4.411v12.06h3.683l-.155-3.359-2.12.363-.14-9.071z",fill:"#fff","fill-rule":"evenodd","stroke-width":"1.215"}})])])}),u=[],l=n(1001),s={},f=(0,l.Z)(s,a,u,!1,null,null,null),c=f.exports,d=n(7441),p=n(7251),h={components:{AssetLinkIcon:c},data:function(){return{assetLink:new p.Z(this),isOnline:window.navigator.onLine}},computed:{assetLinkUrl:function(){var t=window.location.href.match(/https?:\/\/.*\/asset\/(\d+)/);if(console.log(t),t&&!(t.length<2)){var e=t[1];return(0,d.Z)("/alink/asset/".concat(e)).toString()}}},created:function(){var t=this;window.addEventListener("offline",(function(){return t.isOnline=!1})),window.addEventListener("online",(function(){return t.isOnline=!0})),this.assetLink.boot()}},v=h,g=n(3453),w=n.n(g),m=n(8044),b=n(7056),k=n(2102),y=n(4228),_=n(6869),O=n(3142),L=n(2826),j=n(2877),E=n(9657),P=(0,l.Z)(v,o,i,!1,null,null,null),C=P.exports;w()(P,{VApp:m.Z,VBtn:b.Z,VCol:k.Z,VContainer:y.Z,VIcon:_.Z,VNavigationDrawer:O.Z,VProgressCircular:L.Z,VRow:j.Z,VSpeedDial:E.Z});var x,Z,S=n(8787),A=n(1955);n(5597);r.Z.config.productionTip=!1,window.assetLinkDrupalBasePath=A.Z.get("assetLinkDrupalBasePath"),!window.assetLinkDrupalBasePath&&null!==(x=window.drupalSettings)&&void 0!==x&&null!==(Z=x.path)&&void 0!==Z&&Z.baseUrl&&(window.assetLinkDrupalBasePath=window.drupalSettings.path.baseUrl,A.Z.set("assetLinkDrupalBasePath","window.assetLinkDrupalBasePath",{expires:365})),new r.Z({vuetify:S.Z,render:function(t){return t(C)}}).$mount("#asset-link-floating-sidebar")}},e={};function n(r){var o=e[r];if(void 0!==o)return o.exports;var i=e[r]={id:r,loaded:!1,exports:{}};return t[r].call(i.exports,i,i.exports,n),i.loaded=!0,i.exports}n.m=t,function(){var t=[];n.O=function(e,r,o,i){if(!r){var a=1/0;for(f=0;f<t.length;f++){r=t[f][0],o=t[f][1],i=t[f][2];for(var u=!0,l=0;l<r.length;l++)(!1&i||a>=i)&&Object.keys(n.O).every((function(t){return n.O[t](r[l])}))?r.splice(l--,1):(u=!1,i<a&&(a=i));if(u){t.splice(f--,1);var s=o();void 0!==s&&(e=s)}}return e}i=i||0;for(var f=t.length;f>0&&t[f-1][2]>i;f--)t[f]=t[f-1];t[f]=[r,o,i]}}(),function(){n.n=function(t){var e=t&&t.__esModule?function(){return t["default"]}:function(){return t};return n.d(e,{a:e}),e}}(),function(){var t,e=Object.getPrototypeOf?function(t){return Object.getPrototypeOf(t)}:function(t){return t.__proto__};n.t=function(r,o){if(1&o&&(r=this(r)),8&o)return r;if("object"===typeof r&&r){if(4&o&&r.__esModule)return r;if(16&o&&"function"===typeof r.then)return r}var i=Object.create(null);n.r(i);var a={};t=t||[null,e({}),e([]),e(e)];for(var u=2&o&&r;"object"==typeof u&&!~t.indexOf(u);u=e(u))Object.getOwnPropertyNames(u).forEach((function(t){a[t]=function(){return r[t]}}));return a["default"]=function(){return r},n.d(i,a),i}}(),function(){n.d=function(t,e){for(var r in e)n.o(e,r)&&!n.o(t,r)&&Object.defineProperty(t,r,{enumerable:!0,get:e[r]})}}(),function(){n.f={},n.e=function(t){return Promise.all(Object.keys(n.f).reduce((function(e,r){return n.f[r](t,e),e}),[]))}}(),function(){n.u=function(t){return"js/"+t+"-legacy.js"}}(),function(){n.miniCssF=function(t){return"css/"+t+".css"}}(),function(){n.g=function(){if("object"===typeof globalThis)return globalThis;try{return this||new Function("return this")()}catch(t){if("object"===typeof window)return window}}()}(),function(){n.o=function(t,e){return Object.prototype.hasOwnProperty.call(t,e)}}(),function(){var t={},e="alinkjs:";n.l=function(r,o,i,a){if(t[r])t[r].push(o);else{var u,l;if(void 0!==i)for(var s=document.getElementsByTagName("script"),f=0;f<s.length;f++){var c=s[f];if(c.getAttribute("src")==r||c.getAttribute("data-webpack")==e+i){u=c;break}}u||(l=!0,u=document.createElement("script"),u.charset="utf-8",u.timeout=120,n.nc&&u.setAttribute("nonce",n.nc),u.setAttribute("data-webpack",e+i),u.src=r),t[r]=[o];var d=function(e,n){u.onerror=u.onload=null,clearTimeout(p);var o=t[r];if(delete t[r],u.parentNode&&u.parentNode.removeChild(u),o&&o.forEach((function(t){return t(n)})),e)return e(n)},p=setTimeout(d.bind(null,void 0,{type:"timeout",target:u}),12e4);u.onerror=d.bind(null,u.onerror),u.onload=d.bind(null,u.onload),l&&document.head.appendChild(u)}}}(),function(){n.r=function(t){"undefined"!==typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(t,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(t,"__esModule",{value:!0})}}(),function(){n.nmd=function(t){return t.paths=[],t.children||(t.children=[]),t}}(),function(){n.j=502}(),function(){n.p="/__THIS_GETS_REPLACED_AT_RUNTIME_BY_THE_DRUPAL_CONTROLLER__/"}(),function(){var t=function(t,e,n,r){var o=document.createElement("link");o.rel="stylesheet",o.type="text/css";var i=function(i){if(o.onerror=o.onload=null,"load"===i.type)n();else{var a=i&&("load"===i.type?"missing":i.type),u=i&&i.target&&i.target.href||e,l=new Error("Loading CSS chunk "+t+" failed.\n("+u+")");l.code="CSS_CHUNK_LOAD_FAILED",l.type=a,l.request=u,o.parentNode.removeChild(o),r(l)}};return o.onerror=o.onload=i,o.href=e,document.head.appendChild(o),o},e=function(t,e){for(var n=document.getElementsByTagName("link"),r=0;r<n.length;r++){var o=n[r],i=o.getAttribute("data-href")||o.getAttribute("href");if("stylesheet"===o.rel&&(i===t||i===e))return o}var a=document.getElementsByTagName("style");for(r=0;r<a.length;r++){o=a[r],i=o.getAttribute("data-href");if(i===t||i===e)return o}},r=function(r){return new Promise((function(o,i){var a=n.miniCssF(r),u=n.p+a;if(e(a,u))return o();t(r,u,o,i)}))},o={502:0};n.f.miniCss=function(t,e){var n={244:1,903:1,989:1};o[t]?e.push(o[t]):0!==o[t]&&n[t]&&e.push(o[t]=r(t).then((function(){o[t]=0}),(function(e){throw delete o[t],e})))}}(),function(){var t={502:0};n.f.j=function(e,r){var o=n.o(t,e)?t[e]:void 0;if(0!==o)if(o)r.push(o[2]);else{var i=new Promise((function(n,r){o=t[e]=[n,r]}));r.push(o[2]=i);var a=n.p+n.u(e),u=new Error,l=function(r){if(n.o(t,e)&&(o=t[e],0!==o&&(t[e]=void 0),o)){var i=r&&("load"===r.type?"missing":r.type),a=r&&r.target&&r.target.src;u.message="Loading chunk "+e+" failed.\n("+i+": "+a+")",u.name="ChunkLoadError",u.type=i,u.request=a,o[1](u)}};n.l(a,l,"chunk-"+e,e)}},n.O.j=function(e){return 0===t[e]};var e=function(e,r){var o,i,a=r[0],u=r[1],l=r[2],s=0;if(a.some((function(e){return 0!==t[e]}))){for(o in u)n.o(u,o)&&(n.m[o]=u[o]);if(l)var f=l(n)}for(e&&e(r);s<a.length;s++)i=a[s],n.o(t,i)&&t[i]&&t[i][0](),t[i]=0;return n.O(f)},r=self["webpackChunkalinkjs"]=self["webpackChunkalinkjs"]||[];r.forEach(e.bind(null,0)),r.push=e.bind(null,r.push.bind(r))}();var r=n.O(void 0,[998,64],(function(){return n(6906)}));r=n.O(r)})();
//# sourceMappingURL=sidecar-legacy.js.map