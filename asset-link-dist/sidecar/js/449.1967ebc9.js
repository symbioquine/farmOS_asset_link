"use strict";(self["webpackChunkassetlink_sidecar"]=self["webpackChunkassetlink_sidecar"]||[]).push([[449],{6449:function(e,t,n){n.r(t),n.d(t,{NavigationFailureType:function(){return V},RouterLink:function(){return Je},RouterView:function(){return at},START_LOCATION:function(){return H},createMemoryHistory:function(){return I},createRouter:function(){return it},createRouterMatcher:function(){return ae},createWebHashHistory:function(){return K},createWebHistory:function(){return D},isNavigationFailure:function(){return z},loadRouteLocation:function(){return Xe},matchedRouteKey:function(){return Te},onBeforeRouteLeave:function(){return We},onBeforeRouteUpdate:function(){return Ve},parseQuery:function(){return Be},routeLocationKey:function(){return Ke},routerKey:function(){return Ie},routerViewLocationKey:function(){return Ue},stringifyQuery:function(){return _e},useLink:function(){return Ye},useRoute:function(){return ft},useRouter:function(){return lt},viewDepthKey:function(){return De}});var r=n(6686);
/*!
  * vue-router v4.1.3
  * (c) 2022 Eduardo San Martin Morote
  * @license MIT
  */const o="undefined"!==typeof window;function c(e){return e.__esModule||"Module"===e[Symbol.toStringTag]}const a=Object.assign;function i(e,t){const n={};for(const r in t){const o=t[r];n[r]=u(o)?o.map(e):e(o)}return n}const s=()=>{},u=Array.isArray;const l=/\/$/,f=e=>e.replace(l,"");function p(e,t,n="/"){let r,o={},c="",a="";const i=t.indexOf("#");let s=t.indexOf("?");return i<s&&i>=0&&(s=-1),s>-1&&(r=t.slice(0,s),c=t.slice(s+1,i>-1?i:t.length),o=e(c)),i>-1&&(r=r||t.slice(0,i),a=t.slice(i,t.length)),r=w(null!=r?r:t,n),{fullPath:r+(c&&"?")+c+a,path:r,query:o,hash:a}}function h(e,t){const n=t.query?e(t.query):"";return t.path+(n&&"?")+n+(t.hash||"")}function d(e,t){return t&&e.toLowerCase().startsWith(t.toLowerCase())?e.slice(t.length)||"/":e}function m(e,t,n){const r=t.matched.length-1,o=n.matched.length-1;return r>-1&&r===o&&g(t.matched[r],n.matched[o])&&v(t.params,n.params)&&e(t.query)===e(n.query)&&t.hash===n.hash}function g(e,t){return(e.aliasOf||e)===(t.aliasOf||t)}function v(e,t){if(Object.keys(e).length!==Object.keys(t).length)return!1;for(const n in e)if(!y(e[n],t[n]))return!1;return!0}function y(e,t){return u(e)?b(e,t):u(t)?b(t,e):e===t}function b(e,t){return u(t)?e.length===t.length&&e.every(((e,n)=>e===t[n])):1===e.length&&e[0]===t}function w(e,t){if(e.startsWith("/"))return e;if(!e)return t;const n=t.split("/"),r=e.split("/");let o,c,a=n.length-1;for(o=0;o<r.length;o++)if(c=r[o],"."!==c){if(".."!==c)break;a>1&&a--}return n.slice(0,a).join("/")+"/"+r.slice(o-(o===r.length?1:0)).join("/")}var E,R;(function(e){e["pop"]="pop",e["push"]="push"})(E||(E={})),function(e){e["back"]="back",e["forward"]="forward",e["unknown"]=""}(R||(R={}));const k="";function O(e){if(!e)if(o){const t=document.querySelector("base");e=t&&t.getAttribute("href")||"/",e=e.replace(/^\w+:\/\/[^\/]+/,"")}else e="/";return"/"!==e[0]&&"#"!==e[0]&&(e="/"+e),f(e)}const P=/^[^#]+#/;function C(e,t){return e.replace(P,"#")+t}function j(e,t){const n=document.documentElement.getBoundingClientRect(),r=e.getBoundingClientRect();return{behavior:t.behavior,left:r.left-n.left-(t.left||0),top:r.top-n.top-(t.top||0)}}const x=()=>({left:window.pageXOffset,top:window.pageYOffset});function $(e){let t;if("el"in e){const n=e.el,r="string"===typeof n&&n.startsWith("#");0;const o="string"===typeof n?r?document.getElementById(n.slice(1)):document.querySelector(n):n;if(!o)return;t=j(o,e)}else t=e;"scrollBehavior"in document.documentElement.style?window.scrollTo(t):window.scrollTo(null!=t.left?t.left:window.pageXOffset,null!=t.top?t.top:window.pageYOffset)}function S(e,t){const n=history.state?history.state.position-t:-1;return n+e}const A=new Map;function L(e,t){A.set(e,t)}function M(e){const t=A.get(e);return A.delete(e),t}let q=()=>location.protocol+"//"+location.host;function B(e,t){const{pathname:n,search:r,hash:o}=t,c=e.indexOf("#");if(c>-1){let t=o.includes(e.slice(c))?e.slice(c).length:1,n=o.slice(t);return"/"!==n[0]&&(n="/"+n),d(n,"")}const a=d(n,e);return a+r+o}function _(e,t,n,r){let o=[],c=[],i=null;const s=({state:c})=>{const a=B(e,location),s=n.value,u=t.value;let l=0;if(c){if(n.value=a,t.value=c,i&&i===s)return void(i=null);l=u?c.position-u.position:0}else r(a);o.forEach((e=>{e(n.value,s,{delta:l,type:E.pop,direction:l?l>0?R.forward:R.back:R.unknown})}))};function u(){i=n.value}function l(e){o.push(e);const t=()=>{const t=o.indexOf(e);t>-1&&o.splice(t,1)};return c.push(t),t}function f(){const{history:e}=window;e.state&&e.replaceState(a({},e.state,{scroll:x()}),"")}function p(){for(const e of c)e();c=[],window.removeEventListener("popstate",s),window.removeEventListener("beforeunload",f)}return window.addEventListener("popstate",s),window.addEventListener("beforeunload",f),{pauseListeners:u,listen:l,destroy:p}}function G(e,t,n,r=!1,o=!1){return{back:e,current:t,forward:n,replaced:r,position:window.history.length,scroll:o?x():null}}function T(e){const{history:t,location:n}=window,r={value:B(e,n)},o={value:t.state};function c(r,c,a){const i=e.indexOf("#"),s=i>-1?(n.host&&document.querySelector("base")?e:e.slice(i))+r:q()+e+r;try{t[a?"replaceState":"pushState"](c,"",s),o.value=c}catch(u){console.error(u),n[a?"replace":"assign"](s)}}function i(e,n){const i=a({},t.state,G(o.value.back,e,o.value.forward,!0),n,{position:o.value.position});c(e,i,!0),r.value=e}function s(e,n){const i=a({},o.value,t.state,{forward:e,scroll:x()});c(i.current,i,!0);const s=a({},G(r.value,e,null),{position:i.position+1},n);c(e,s,!1),r.value=e}return o.value||c(r.value,{back:null,current:r.value,forward:null,position:t.length-1,replaced:!0,scroll:null},!0),{location:r,state:o,push:s,replace:i}}function D(e){e=O(e);const t=T(e),n=_(e,t.state,t.location,t.replace);function r(e,t=!0){t||n.pauseListeners(),history.go(e)}const o=a({location:"",base:e,go:r,createHref:C.bind(null,e)},t,n);return Object.defineProperty(o,"location",{enumerable:!0,get:()=>t.location.value}),Object.defineProperty(o,"state",{enumerable:!0,get:()=>t.state.value}),o}function I(e=""){let t=[],n=[k],r=0;function o(e){r++,r===n.length||n.splice(r),n.push(e)}function c(e,n,{direction:r,delta:o}){const c={direction:r,delta:o,type:E.pop};for(const a of t)a(e,n,c)}e=O(e);const a={location:k,state:{},base:e,createHref:C.bind(null,e),replace(e){n.splice(r--,1),o(e)},push(e,t){o(e)},listen(e){return t.push(e),()=>{const n=t.indexOf(e);n>-1&&t.splice(n,1)}},destroy(){t=[],n=[k],r=0},go(e,t=!0){const o=this.location,a=e<0?R.back:R.forward;r=Math.max(0,Math.min(r+e,n.length-1)),t&&c(this.location,o,{direction:a,delta:e})}};return Object.defineProperty(a,"location",{enumerable:!0,get:()=>n[r]}),a}function K(e){return e=location.host?e||location.pathname+location.search:"",e.includes("#")||(e+="#"),D(e)}function U(e){return"string"===typeof e||e&&"object"===typeof e}function F(e){return"string"===typeof e||"symbol"===typeof e}const H={path:"/",name:void 0,params:{},query:{},hash:"",fullPath:"/",matched:[],meta:{},redirectedFrom:void 0},W=Symbol("");var V;(function(e){e[e["aborted"]=4]="aborted",e[e["cancelled"]=8]="cancelled",e[e["duplicated"]=16]="duplicated"})(V||(V={}));function N(e,t){return a(new Error,{type:e,[W]:!0},t)}function z(e,t){return e instanceof Error&&W in e&&(null==t||!!(e.type&t))}const Q="[^/]+?",X={sensitive:!1,strict:!1,start:!0,end:!0},Y=/[.+*?^${}()[\]/\\]/g;function Z(e,t){const n=a({},X,t),r=[];let o=n.start?"^":"";const c=[];for(const a of e){const e=a.length?[]:[90];n.strict&&!a.length&&(o+="/");for(let t=0;t<a.length;t++){const r=a[t];let i=40+(n.sensitive?.25:0);if(0===r.type)t||(o+="/"),o+=r.value.replace(Y,"\\$&"),i+=40;else if(1===r.type){const{value:e,repeatable:n,optional:s,regexp:u}=r;c.push({name:e,repeatable:n,optional:s});const l=u||Q;if(l!==Q){i+=10;try{new RegExp(`(${l})`)}catch(f){throw new Error(`Invalid custom RegExp for param "${e}" (${l}): `+f.message)}}let p=n?`((?:${l})(?:/(?:${l}))*)`:`(${l})`;t||(p=s&&a.length<2?`(?:/${p})`:"/"+p),s&&(p+="?"),o+=p,i+=20,s&&(i+=-8),n&&(i+=-20),".*"===l&&(i+=-50)}e.push(i)}r.push(e)}if(n.strict&&n.end){const e=r.length-1;r[e][r[e].length-1]+=.7000000000000001}n.strict||(o+="/?"),n.end?o+="$":n.strict&&(o+="(?:/|$)");const i=new RegExp(o,n.sensitive?"":"i");function s(e){const t=e.match(i),n={};if(!t)return null;for(let r=1;r<t.length;r++){const e=t[r]||"",o=c[r-1];n[o.name]=e&&o.repeatable?e.split("/"):e}return n}function l(t){let n="",r=!1;for(const o of e){r&&n.endsWith("/")||(n+="/"),r=!1;for(const e of o)if(0===e.type)n+=e.value;else if(1===e.type){const{value:c,repeatable:a,optional:i}=e,s=c in t?t[c]:"";if(u(s)&&!a)throw new Error(`Provided param "${c}" is an array but it is not repeatable (* or + modifiers)`);const l=u(s)?s.join("/"):s;if(!l){if(!i)throw new Error(`Missing required param "${c}"`);o.length<2&&(n.endsWith("/")?n=n.slice(0,-1):r=!0)}n+=l}}return n||"/"}return{re:i,score:r,keys:c,parse:s,stringify:l}}function J(e,t){let n=0;while(n<e.length&&n<t.length){const r=t[n]-e[n];if(r)return r;n++}return e.length<t.length?1===e.length&&80===e[0]?-1:1:e.length>t.length?1===t.length&&80===t[0]?1:-1:0}function ee(e,t){let n=0;const r=e.score,o=t.score;while(n<r.length&&n<o.length){const e=J(r[n],o[n]);if(e)return e;n++}if(1===Math.abs(o.length-r.length)){if(te(r))return 1;if(te(o))return-1}return o.length-r.length}function te(e){const t=e[e.length-1];return e.length>0&&t[t.length-1]<0}const ne={type:0,value:""},re=/[a-zA-Z0-9_]/;function oe(e){if(!e)return[[]];if("/"===e)return[[ne]];if(!e.startsWith("/"))throw new Error(`Invalid path "${e}"`);function t(e){throw new Error(`ERR (${n})/"${u}": ${e}`)}let n=0,r=n;const o=[];let c;function a(){c&&o.push(c),c=[]}let i,s=0,u="",l="";function f(){u&&(0===n?c.push({type:0,value:u}):1===n||2===n||3===n?(c.length>1&&("*"===i||"+"===i)&&t(`A repeatable param (${u}) must be alone in its segment. eg: '/:ids+.`),c.push({type:1,value:u,regexp:l,repeatable:"*"===i||"+"===i,optional:"*"===i||"?"===i})):t("Invalid state to consume buffer"),u="")}function p(){u+=i}while(s<e.length)if(i=e[s++],"\\"!==i||2===n)switch(n){case 0:"/"===i?(u&&f(),a()):":"===i?(f(),n=1):p();break;case 4:p(),n=r;break;case 1:"("===i?n=2:re.test(i)?p():(f(),n=0,"*"!==i&&"?"!==i&&"+"!==i&&s--);break;case 2:")"===i?"\\"==l[l.length-1]?l=l.slice(0,-1)+i:n=3:l+=i;break;case 3:f(),n=0,"*"!==i&&"?"!==i&&"+"!==i&&s--,l="";break;default:t("Unknown state");break}else r=n,n=4;return 2===n&&t(`Unfinished custom RegExp for param "${u}"`),f(),a(),o}function ce(e,t,n){const r=Z(oe(e.path),n);const o=a(r,{record:e,parent:t,children:[],alias:[]});return t&&!o.record.aliasOf===!t.record.aliasOf&&t.children.push(o),o}function ae(e,t){const n=[],r=new Map;function o(e){return r.get(e)}function c(e,n,r){const o=!r,u=se(e);u.aliasOf=r&&r.record;const f=pe(t,e),p=[u];if("alias"in e){const t="string"===typeof e.alias?[e.alias]:e.alias;for(const e of t)p.push(a({},u,{components:r?r.record.components:u.components,path:e,aliasOf:r?r.record:u}))}let h,d;for(const t of p){const{path:a}=t;if(n&&"/"!==a[0]){const e=n.record.path,r="/"===e[e.length-1]?"":"/";t.path=n.record.path+(a&&r+a)}if(h=ce(t,n,f),r?r.alias.push(h):(d=d||h,d!==h&&d.alias.push(h),o&&e.name&&!le(h)&&i(e.name)),u.children){const e=u.children;for(let t=0;t<e.length;t++)c(e[t],h,r&&r.children[t])}r=r||h,l(h)}return d?()=>{i(d)}:s}function i(e){if(F(e)){const t=r.get(e);t&&(r.delete(e),n.splice(n.indexOf(t),1),t.children.forEach(i),t.alias.forEach(i))}else{const t=n.indexOf(e);t>-1&&(n.splice(t,1),e.record.name&&r.delete(e.record.name),e.children.forEach(i),e.alias.forEach(i))}}function u(){return n}function l(e){let t=0;while(t<n.length&&ee(e,n[t])>=0&&(e.record.path!==n[t].record.path||!he(e,n[t])))t++;n.splice(t,0,e),e.record.name&&!le(e)&&r.set(e.record.name,e)}function f(e,t){let o,c,i,s={};if("name"in e&&e.name){if(o=r.get(e.name),!o)throw N(1,{location:e});i=o.record.name,s=a(ie(t.params,o.keys.filter((e=>!e.optional)).map((e=>e.name))),e.params),c=o.stringify(s)}else if("path"in e)c=e.path,o=n.find((e=>e.re.test(c))),o&&(s=o.parse(c),i=o.record.name);else{if(o=t.name?r.get(t.name):n.find((e=>e.re.test(t.path))),!o)throw N(1,{location:e,currentLocation:t});i=o.record.name,s=a({},t.params,e.params),c=o.stringify(s)}const u=[];let l=o;while(l)u.unshift(l.record),l=l.parent;return{name:i,path:c,params:s,matched:u,meta:fe(u)}}return t=pe({strict:!1,end:!0,sensitive:!1},t),e.forEach((e=>c(e))),{addRoute:c,resolve:f,removeRoute:i,getRoutes:u,getRecordMatcher:o}}function ie(e,t){const n={};for(const r of t)r in e&&(n[r]=e[r]);return n}function se(e){return{path:e.path,redirect:e.redirect,name:e.name,meta:e.meta||{},aliasOf:void 0,beforeEnter:e.beforeEnter,props:ue(e),children:e.children||[],instances:{},leaveGuards:new Set,updateGuards:new Set,enterCallbacks:{},components:"components"in e?e.components||null:e.component&&{default:e.component}}}function ue(e){const t={},n=e.props||!1;if("component"in e)t.default=n;else for(const r in e.components)t[r]="boolean"===typeof n?n:n[r];return t}function le(e){while(e){if(e.record.aliasOf)return!0;e=e.parent}return!1}function fe(e){return e.reduce(((e,t)=>a(e,t.meta)),{})}function pe(e,t){const n={};for(const r in e)n[r]=r in t?t[r]:e[r];return n}function he(e,t){return t.children.some((t=>t===e||he(e,t)))}const de=/#/g,me=/&/g,ge=/\//g,ve=/=/g,ye=/\?/g,be=/\+/g,we=/%5B/g,Ee=/%5D/g,Re=/%5E/g,ke=/%60/g,Oe=/%7B/g,Pe=/%7C/g,Ce=/%7D/g,je=/%20/g;function xe(e){return encodeURI(""+e).replace(Pe,"|").replace(we,"[").replace(Ee,"]")}function $e(e){return xe(e).replace(Oe,"{").replace(Ce,"}").replace(Re,"^")}function Se(e){return xe(e).replace(be,"%2B").replace(je,"+").replace(de,"%23").replace(me,"%26").replace(ke,"`").replace(Oe,"{").replace(Ce,"}").replace(Re,"^")}function Ae(e){return Se(e).replace(ve,"%3D")}function Le(e){return xe(e).replace(de,"%23").replace(ye,"%3F")}function Me(e){return null==e?"":Le(e).replace(ge,"%2F")}function qe(e){try{return decodeURIComponent(""+e)}catch(t){}return""+e}function Be(e){const t={};if(""===e||"?"===e)return t;const n="?"===e[0],r=(n?e.slice(1):e).split("&");for(let o=0;o<r.length;++o){const e=r[o].replace(be," "),n=e.indexOf("="),c=qe(n<0?e:e.slice(0,n)),a=n<0?null:qe(e.slice(n+1));if(c in t){let e=t[c];u(e)||(e=t[c]=[e]),e.push(a)}else t[c]=a}return t}function _e(e){let t="";for(let n in e){const r=e[n];if(n=Ae(n),null==r){void 0!==r&&(t+=(t.length?"&":"")+n);continue}const o=u(r)?r.map((e=>e&&Se(e))):[r&&Se(r)];o.forEach((e=>{void 0!==e&&(t+=(t.length?"&":"")+n,null!=e&&(t+="="+e))}))}return t}function Ge(e){const t={};for(const n in e){const r=e[n];void 0!==r&&(t[n]=u(r)?r.map((e=>null==e?null:""+e)):null==r?r:""+r)}return t}const Te=Symbol(""),De=Symbol(""),Ie=Symbol(""),Ke=Symbol(""),Ue=Symbol("");function Fe(){let e=[];function t(t){return e.push(t),()=>{const n=e.indexOf(t);n>-1&&e.splice(n,1)}}function n(){e=[]}return{add:t,list:()=>e,reset:n}}function He(e,t,n){const o=()=>{e[t].delete(n)};(0,r.onUnmounted)(o),(0,r.onDeactivated)(o),(0,r.onActivated)((()=>{e[t].add(n)})),e[t].add(n)}function We(e){const t=(0,r.inject)(Te,{}).value;t&&He(t,"leaveGuards",e)}function Ve(e){const t=(0,r.inject)(Te,{}).value;t&&He(t,"updateGuards",e)}function Ne(e,t,n,r,o){const c=r&&(r.enterCallbacks[o]=r.enterCallbacks[o]||[]);return()=>new Promise(((a,i)=>{const s=e=>{!1===e?i(N(4,{from:n,to:t})):e instanceof Error?i(e):U(e)?i(N(2,{from:t,to:e})):(c&&r.enterCallbacks[o]===c&&"function"===typeof e&&c.push(e),a())},u=e.call(r&&r.instances[o],t,n,s);let l=Promise.resolve(u);e.length<3&&(l=l.then(s)),l.catch((e=>i(e)))}))}function ze(e,t,n,r){const o=[];for(const a of e){0;for(const e in a.components){let i=a.components[e];if("beforeRouteEnter"===t||a.instances[e])if(Qe(i)){const c=i.__vccOpts||i,s=c[t];s&&o.push(Ne(s,n,r,a,e))}else{let s=i();0,o.push((()=>s.then((o=>{if(!o)return Promise.reject(new Error(`Couldn't resolve component "${e}" at "${a.path}"`));const i=c(o)?o.default:o;a.components[e]=i;const s=i.__vccOpts||i,u=s[t];return u&&Ne(u,n,r,a,e)()}))))}}}return o}function Qe(e){return"object"===typeof e||"displayName"in e||"props"in e||"__vccOpts"in e}function Xe(e){return e.matched.every((e=>e.redirect))?Promise.reject(new Error("Cannot load a route that redirects.")):Promise.all(e.matched.map((e=>e.components&&Promise.all(Object.keys(e.components).reduce(((t,n)=>{const r=e.components[n];return"function"!==typeof r||"displayName"in r||t.push(r().then((t=>{if(!t)return Promise.reject(new Error(`Couldn't resolve component "${n}" at "${e.path}". Ensure you passed a function that returns a promise.`));const r=c(t)?t.default:t;e.components[n]=r}))),t}),[]))))).then((()=>e))}function Ye(e){const t=(0,r.inject)(Ie),n=(0,r.inject)(Ke),o=(0,r.computed)((()=>t.resolve((0,r.unref)(e.to)))),c=(0,r.computed)((()=>{const{matched:e}=o.value,{length:t}=e,r=e[t-1],c=n.matched;if(!r||!c.length)return-1;const a=c.findIndex(g.bind(null,r));if(a>-1)return a;const i=nt(e[t-2]);return t>1&&nt(r)===i&&c[c.length-1].path!==i?c.findIndex(g.bind(null,e[t-2])):a})),a=(0,r.computed)((()=>c.value>-1&&tt(n.params,o.value.params))),i=(0,r.computed)((()=>c.value>-1&&c.value===n.matched.length-1&&v(n.params,o.value.params)));function u(n={}){return et(n)?t[(0,r.unref)(e.replace)?"replace":"push"]((0,r.unref)(e.to)).catch(s):Promise.resolve()}return{route:o,href:(0,r.computed)((()=>o.value.href)),isActive:a,isExactActive:i,navigate:u}}const Ze=(0,r.defineComponent)({name:"RouterLink",compatConfig:{MODE:3},props:{to:{type:[String,Object],required:!0},replace:Boolean,activeClass:String,exactActiveClass:String,custom:Boolean,ariaCurrentValue:{type:String,default:"page"}},useLink:Ye,setup(e,{slots:t}){const n=(0,r.reactive)(Ye(e)),{options:o}=(0,r.inject)(Ie),c=(0,r.computed)((()=>({[rt(e.activeClass,o.linkActiveClass,"router-link-active")]:n.isActive,[rt(e.exactActiveClass,o.linkExactActiveClass,"router-link-exact-active")]:n.isExactActive})));return()=>{const o=t.default&&t.default(n);return e.custom?o:(0,r.h)("a",{"aria-current":n.isExactActive?e.ariaCurrentValue:null,href:n.href,onClick:n.navigate,class:c.value},o)}}}),Je=Ze;function et(e){if(!(e.metaKey||e.altKey||e.ctrlKey||e.shiftKey)&&!e.defaultPrevented&&(void 0===e.button||0===e.button)){if(e.currentTarget&&e.currentTarget.getAttribute){const t=e.currentTarget.getAttribute("target");if(/\b_blank\b/i.test(t))return}return e.preventDefault&&e.preventDefault(),!0}}function tt(e,t){for(const n in t){const r=t[n],o=e[n];if("string"===typeof r){if(r!==o)return!1}else if(!u(o)||o.length!==r.length||r.some(((e,t)=>e!==o[t])))return!1}return!0}function nt(e){return e?e.aliasOf?e.aliasOf.path:e.path:""}const rt=(e,t,n)=>null!=e?e:null!=t?t:n,ot=(0,r.defineComponent)({name:"RouterView",inheritAttrs:!1,props:{name:{type:String,default:"default"},route:Object},compatConfig:{MODE:3},setup(e,{attrs:t,slots:n}){const o=(0,r.inject)(Ue),c=(0,r.computed)((()=>e.route||o.value)),i=(0,r.inject)(De,0),s=(0,r.computed)((()=>{let e=(0,r.unref)(i);const{matched:t}=c.value;let n;while((n=t[e])&&!n.components)e++;return e})),u=(0,r.computed)((()=>c.value.matched[s.value]));(0,r.provide)(De,(0,r.computed)((()=>s.value+1))),(0,r.provide)(Te,u),(0,r.provide)(Ue,c);const l=(0,r.ref)();return(0,r.watch)((()=>[l.value,u.value,e.name]),(([e,t,n],[r,o,c])=>{t&&(t.instances[n]=e,o&&o!==t&&e&&e===r&&(t.leaveGuards.size||(t.leaveGuards=o.leaveGuards),t.updateGuards.size||(t.updateGuards=o.updateGuards))),!e||!t||o&&g(t,o)&&r||(t.enterCallbacks[n]||[]).forEach((t=>t(e)))}),{flush:"post"}),()=>{const o=c.value,i=e.name,s=u.value,f=s&&s.components[i];if(!f)return ct(n.default,{Component:f,route:o});const p=s.props[i],h=p?!0===p?o.params:"function"===typeof p?p(o):p:null,d=e=>{e.component.isUnmounted&&(s.instances[i]=null)},m=(0,r.h)(f,a({},h,t,{onVnodeUnmounted:d,ref:l}));return ct(n.default,{Component:m,route:o})||m}}});function ct(e,t){if(!e)return null;const n=e(t);return 1===n.length?n[0]:n}const at=ot;function it(e){const t=ae(e.routes,e),n=e.parseQuery||Be,c=e.stringifyQuery||_e,l=e.history;const f=Fe(),d=Fe(),g=Fe(),v=(0,r.shallowRef)(H);let y=H;o&&e.scrollBehavior&&"scrollRestoration"in history&&(history.scrollRestoration="manual");const b=i.bind(null,(e=>""+e)),w=i.bind(null,Me),R=i.bind(null,qe);function k(e,n){let r,o;return F(e)?(r=t.getRecordMatcher(e),o=n):o=e,t.addRoute(o,r)}function O(e){const n=t.getRecordMatcher(e);n&&t.removeRoute(n)}function P(){return t.getRoutes().map((e=>e.record))}function C(e){return!!t.getRecordMatcher(e)}function j(e,r){if(r=a({},r||v.value),"string"===typeof e){const o=p(n,e,r.path),c=t.resolve({path:o.path},r),i=l.createHref(o.fullPath);return a(o,c,{params:R(c.params),hash:qe(o.hash),redirectedFrom:void 0,href:i})}let o;if("path"in e)o=a({},e,{path:p(n,e.path,r.path).path});else{const t=a({},e.params);for(const e in t)null==t[e]&&delete t[e];o=a({},e,{params:w(e.params)}),r.params=w(r.params)}const i=t.resolve(o,r),s=e.hash||"";i.params=b(R(i.params));const u=h(c,a({},e,{hash:$e(s),path:i.path})),f=l.createHref(u);return a({fullPath:u,hash:s,query:c===_e?Ge(e.query):e.query||{}},i,{redirectedFrom:void 0,href:f})}function A(e){return"string"===typeof e?p(n,e,v.value.path):a({},e)}function q(e,t){if(y!==e)return N(8,{from:t,to:e})}function B(e){return T(e)}function _(e){return B(a(A(e),{replace:!0}))}function G(e){const t=e.matched[e.matched.length-1];if(t&&t.redirect){const{redirect:n}=t;let r="function"===typeof n?n(e):n;return"string"===typeof r&&(r=r.includes("?")||r.includes("#")?r=A(r):{path:r},r.params={}),a({query:e.query,hash:e.hash,params:"path"in r?{}:e.params},r)}}function T(e,t){const n=y=j(e),r=v.value,o=e.state,i=e.force,s=!0===e.replace,u=G(n);if(u)return T(a(A(u),{state:o,force:i,replace:s}),t||n);const l=n;let f;return l.redirectedFrom=t,!i&&m(c,r,n)&&(f=N(16,{to:l,from:r}),te(r,r,!0,!1)),(f?Promise.resolve(f):I(l,r)).catch((e=>z(e)?z(e,2)?e:ee(e):Z(e,l,r))).then((e=>{if(e){if(z(e,2))return T(a({replace:s},A(e.to),{state:o,force:i}),t||l)}else e=U(l,r,!0,s,o);return K(l,r,e),e}))}function D(e,t){const n=q(e,t);return n?Promise.reject(n):Promise.resolve()}function I(e,t){let n;const[r,o,c]=ut(e,t);n=ze(r.reverse(),"beforeRouteLeave",e,t);for(const i of r)i.leaveGuards.forEach((r=>{n.push(Ne(r,e,t))}));const a=D.bind(null,e,t);return n.push(a),st(n).then((()=>{n=[];for(const r of f.list())n.push(Ne(r,e,t));return n.push(a),st(n)})).then((()=>{n=ze(o,"beforeRouteUpdate",e,t);for(const r of o)r.updateGuards.forEach((r=>{n.push(Ne(r,e,t))}));return n.push(a),st(n)})).then((()=>{n=[];for(const r of e.matched)if(r.beforeEnter&&!t.matched.includes(r))if(u(r.beforeEnter))for(const o of r.beforeEnter)n.push(Ne(o,e,t));else n.push(Ne(r.beforeEnter,e,t));return n.push(a),st(n)})).then((()=>(e.matched.forEach((e=>e.enterCallbacks={})),n=ze(c,"beforeRouteEnter",e,t),n.push(a),st(n)))).then((()=>{n=[];for(const r of d.list())n.push(Ne(r,e,t));return n.push(a),st(n)})).catch((e=>z(e,8)?e:Promise.reject(e)))}function K(e,t,n){for(const r of g.list())r(e,t,n)}function U(e,t,n,r,c){const i=q(e,t);if(i)return i;const s=t===H,u=o?history.state:{};n&&(r||s?l.replace(e.fullPath,a({scroll:s&&u&&u.scroll},c)):l.push(e.fullPath,c)),v.value=e,te(e,t,n,s),ee()}let W;function V(){W||(W=l.listen(((e,t,n)=>{if(!ce.listening)return;const r=j(e),c=G(r);if(c)return void T(a(c,{replace:!0}),r).catch(s);y=r;const i=v.value;o&&L(S(i.fullPath,n.delta),x()),I(r,i).catch((e=>z(e,12)?e:z(e,2)?(T(e.to,r).then((e=>{z(e,20)&&!n.delta&&n.type===E.pop&&l.go(-1,!1)})).catch(s),Promise.reject()):(n.delta&&l.go(-n.delta,!1),Z(e,r,i)))).then((e=>{e=e||U(r,i,!1),e&&(n.delta&&!z(e,8)?l.go(-n.delta,!1):n.type===E.pop&&z(e,20)&&l.go(-1,!1)),K(r,i,e)})).catch(s)})))}let Q,X=Fe(),Y=Fe();function Z(e,t,n){ee(e);const r=Y.list();return r.length?r.forEach((r=>r(e,t,n))):console.error(e),Promise.reject(e)}function J(){return Q&&v.value!==H?Promise.resolve():new Promise(((e,t)=>{X.add([e,t])}))}function ee(e){return Q||(Q=!e,V(),X.list().forEach((([t,n])=>e?n(e):t())),X.reset()),e}function te(t,n,c,a){const{scrollBehavior:i}=e;if(!o||!i)return Promise.resolve();const s=!c&&M(S(t.fullPath,0))||(a||!c)&&history.state&&history.state.scroll||null;return(0,r.nextTick)().then((()=>i(t,n,s))).then((e=>e&&$(e))).catch((e=>Z(e,t,n)))}const ne=e=>l.go(e);let re;const oe=new Set,ce={currentRoute:v,listening:!0,addRoute:k,removeRoute:O,hasRoute:C,getRoutes:P,resolve:j,options:e,push:B,replace:_,go:ne,back:()=>ne(-1),forward:()=>ne(1),beforeEach:f.add,beforeResolve:d.add,afterEach:g.add,onError:Y.add,isReady:J,install(e){const t=this;e.component("RouterLink",Je),e.component("RouterView",at),e.config.globalProperties.$router=t,Object.defineProperty(e.config.globalProperties,"$route",{enumerable:!0,get:()=>(0,r.unref)(v)}),o&&!re&&v.value===H&&(re=!0,B(l.location).catch((e=>{0})));const n={};for(const o in H)n[o]=(0,r.computed)((()=>v.value[o]));e.provide(Ie,t),e.provide(Ke,(0,r.reactive)(n)),e.provide(Ue,v);const c=e.unmount;oe.add(e),e.unmount=function(){oe.delete(e),oe.size<1&&(y=H,W&&W(),W=null,v.value=H,re=!1,Q=!1),c()}}};return ce}function st(e){return e.reduce(((e,t)=>e.then((()=>t()))),Promise.resolve())}function ut(e,t){const n=[],r=[],o=[],c=Math.max(t.matched.length,e.matched.length);for(let a=0;a<c;a++){const c=t.matched[a];c&&(e.matched.find((e=>g(e,c)))?r.push(c):n.push(c));const i=e.matched[a];i&&(t.matched.find((e=>g(e,i)))||o.push(i))}return[n,r,o]}function lt(){return(0,r.inject)(Ie)}function ft(){return(0,r.inject)(Ke)}}}]);
//# sourceMappingURL=449.1967ebc9.js.map