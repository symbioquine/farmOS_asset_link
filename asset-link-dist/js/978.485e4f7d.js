"use strict";(self["webpackChunkassetlink_pwa"]=self["webpackChunkassetlink_pwa"]||[]).push([[978,616],{9978:function(o,e,n){n.r(e),n.d(e,{default:function(){return Z}});n(7120);var t=n(2221),l=n(9833),a=n(9804),r=n(8055),s=n(9501),c=n(4333),u=n(4492),i=n(6053),p=n(6153),d=n(3584),m=n(3856),v=n(6597),f=n(6809),h=n(728),g=(0,m.L)({name:"DialogPlugin",props:{...v.S,title:String,message:String,prompt:Object,options:Object,progress:[Boolean,Object],html:Boolean,ok:{type:[String,Object,Boolean],default:!0},cancel:[String,Object,Boolean],focus:{type:String,default:"ok",validator:o=>["ok","cancel","none"].includes(o)},stackButtons:Boolean,color:String,cardClass:[String,Array,Object],cardStyle:[String,Array,Object]},emits:["ok","hide"],setup(o,{emit:e}){const{proxy:n}=(0,t.getCurrentInstance)(),{$q:m}=n,g=(0,v.Z)(o,m),k=(0,t.ref)(null),b=(0,t.ref)(void 0!==o.prompt?o.prompt.model:void 0!==o.options?o.options.model:void 0),y=(0,t.computed)((()=>"q-dialog-plugin"+(!0===g.value?" q-dialog-plugin--dark q-dark":"")+(!1!==o.progress?" q-dialog-plugin--progress":""))),_=(0,t.computed)((()=>o.color||(!0===g.value?"amber":"primary"))),Z=(0,t.computed)((()=>!1===o.progress?null:!0===(0,h.Kn)(o.progress)?{component:o.progress.spinner||d.Z,props:{color:o.progress.color||_.value}}:{component:d.Z,props:{color:_.value}})),S=(0,t.computed)((()=>void 0!==o.prompt||void 0!==o.options)),O=(0,t.computed)((()=>{if(!0!==S.value)return{};const{model:e,isValid:n,items:t,...l}=void 0!==o.prompt?o.prompt:o.options;return l})),q=(0,t.computed)((()=>!0===(0,h.Kn)(o.ok)||!0===o.ok?m.lang.label.ok:o.ok)),j=(0,t.computed)((()=>!0===(0,h.Kn)(o.cancel)||!0===o.cancel?m.lang.label.cancel:o.cancel)),w=(0,t.computed)((()=>void 0!==o.prompt?void 0!==o.prompt.isValid&&!0!==o.prompt.isValid(b.value):void 0!==o.options&&(void 0!==o.options.isValid&&!0!==o.options.isValid(b.value)))),x=(0,t.computed)((()=>({color:_.value,label:q.value,ripple:!1,disable:w.value,...!0===(0,h.Kn)(o.ok)?o.ok:{flat:!0},"data-autofocus":"ok"===o.focus&&!0!==S.value||void 0,onClick:V}))),C=(0,t.computed)((()=>({color:_.value,label:j.value,ripple:!1,...!0===(0,h.Kn)(o.cancel)?o.cancel:{flat:!0},"data-autofocus":"cancel"===o.focus&&!0!==S.value||void 0,onClick:K})));function B(){k.value.show()}function T(){k.value.hide()}function V(){e("ok",(0,t.toRaw)(b.value)),T()}function K(){T()}function $(){e("hide")}function D(o){b.value=o}function L(e){!0!==w.value&&"textarea"!==o.prompt.type&&!0===(0,f.So)(e,13)&&V()}function A(e,n){return!0===o.html?(0,t.h)(s.Z,{class:e,innerHTML:n}):(0,t.h)(s.Z,{class:e},(()=>n))}function H(){return[(0,t.h)(i.Z,{modelValue:b.value,...O.value,color:_.value,dense:!0,autofocus:!0,dark:g.value,"onUpdate:modelValue":D,onKeyup:L})]}function U(){return[(0,t.h)(p.Z,{modelValue:b.value,...O.value,color:_.value,options:o.options.items,dark:g.value,"onUpdate:modelValue":D})]}function E(){const e=[];return o.cancel&&e.push((0,t.h)(a.Z,C.value)),o.ok&&e.push((0,t.h)(a.Z,x.value)),(0,t.h)(c.Z,{class:!0===o.stackButtons?"items-end":"",vertical:o.stackButtons,align:"right"},(()=>e))}function I(){const e=[];return o.title&&e.push(A("q-dialog__title",o.title)),!1!==o.progress&&e.push((0,t.h)(s.Z,{class:"q-dialog__progress"},(()=>(0,t.h)(Z.value.component,Z.value.props)))),o.message&&e.push(A("q-dialog__message",o.message)),void 0!==o.prompt?e.push((0,t.h)(s.Z,{class:"scroll q-dialog-plugin__form"},H)):void 0!==o.options&&e.push((0,t.h)(u.Z,{dark:g.value}),(0,t.h)(s.Z,{class:"scroll q-dialog-plugin__form"},U),(0,t.h)(u.Z,{dark:g.value})),(o.ok||o.cancel)&&e.push(E()),e}function P(){return[(0,t.h)(r.Z,{class:[y.value,o.cardClass],style:o.cardStyle,dark:g.value},I)]}return(0,t.watch)((()=>o.prompt&&o.prompt.model),D),(0,t.watch)((()=>o.options&&o.options.model),D),Object.assign(n,{show:B,hide:T}),()=>(0,t.h)(l.Z,{ref:k,onHide:$},P)}}),k=n(8004),b=n(3205);function y(o,e){for(const n in e)"spinner"!==n&&Object(e[n])===e[n]?(o[n]=Object(o[n])!==o[n]?{}:{...o[n]},y(o[n],e[n])):o[n]=e[n]}function _(o,e,n){return l=>{let a,r;const s=!0===e&&void 0!==l.component;if(!0===s){const{component:o,componentProps:e}=l;a="string"===typeof o?n.component(o):o,r=e}else{const{class:e,style:n,...t}=l;a=o,r=t,void 0!==e&&(t.cardClass=e),void 0!==n&&(t.cardStyle=n)}let c,u=!1;const i=(0,t.ref)(null),p=(0,b.q_)(),d=o=>{if(null!==i.value&&void 0!==i.value[o])return void i.value[o]();const e=c.$.subTree;if(e&&e.component){if(e.component.proxy&&e.component.proxy[o])return void e.component.proxy[o]();if(e.component.subTree&&e.component.subTree.component&&e.component.subTree.component.proxy&&e.component.subTree.component.proxy[o])return void e.component.subTree.component.proxy[o]()}console.error("[Quasar] Incorrectly defined Dialog component")},m=[],v=[],f={onOk(o){return m.push(o),f},onCancel(o){return v.push(o),f},onDismiss(o){return m.push(o),v.push(o),f},hide(){return d("hide"),f},update(o){if(null!==c){if(!0===s)Object.assign(r,o);else{const{class:e,style:n,...t}=o;void 0!==e&&(t.cardClass=e),void 0!==n&&(t.cardStyle=n),y(r,t)}c.$forceUpdate()}return f}},h=o=>{u=!0,m.forEach((e=>{e(o)}))},g=()=>{_.unmount(p),(0,b.pB)(p),_=null,c=null,!0!==u&&v.forEach((o=>{o()}))};let _=(0,k.$)({name:"QGlobalDialog",setup:()=>()=>(0,t.h)(a,{...r,ref:i,onOk:h,onHide:g})},n);function Z(){d("show")}return c=_.mount(p),"function"===typeof a.__asyncLoader?a.__asyncLoader().then((()=>{(0,t.nextTick)(Z)})):(0,t.nextTick)(Z),f}}var Z={install({$q:o,parentApp:e}){o.dialog=_(g,!0,e),!0!==this.__installed&&(this.create=o.dialog)}}}}]);
//# sourceMappingURL=978.485e4f7d.js.map