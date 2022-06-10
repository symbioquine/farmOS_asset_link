"use strict";(self["webpackChunkalinkjs"]=self["webpackChunkalinkjs"]||[]).push([[64],{7251:function(e,t,i){i.d(t,{Z:function(){return ue}});var s=i(538),n=i(1833),r=i(407),o=i(3864),a=i(9849),c=i(4634),l=i(8898),u=i(3396),d=i(5480),h=(i(1703),i(7132));class p extends u.$H{constructor(e){super(e)}buildFilterParam(e){const t=[];return e.forEach(((e,i)=>{if("attribute"===e.kind&&"equal"===e.op){const i=e,s=this.serializeAttributeAsParam(void 0,i.attribute);t.push({[s]:i.value})}else if("attribute"===e.kind){const s=e,n=this.serializeAttributeAsParam(void 0,s.attribute);t.push({["client-"+n+"-"+i]:{path:n,operator:s.op,value:s.value}})}else if("relatedRecord"===e.kind){const i=e;Array.isArray(i.record)?t.push({[i.relation]:i.record.map((e=>e.id)).join(",")}):t.push({[i.relation]:i?.record?.id})}else{if("relatedRecords"!==e.kind)throw new h.gT(`Filter operation ${e.op} not recognized for JSONAPISource.`);{if("equal"!==e.op)throw new Error(`Operation "${e.op}" is not supported in JSONAPI for relatedRecords filtering`);const i=e;t.push({[i.relation]:i.records.map((e=>e.id)).join(",")})}}})),t}serializeAttributeAsParam(e,t){if(this.serializer)return this.serializer.resourceAttribute(e,t);{const i=this.serializerFor(u.pi.ResourceFieldParam);return i.serialize(t,{type:e})}}}class g extends u.ZP{constructor(e){const t=Object.assign({},e.defaultFetchSettings||{},{headers:{Accept:"application/vnd.api+json","Content-Type":"application/vnd.api+json"}});super(Object.assign({},e,{defaultFetchSettings:t,serializerSettingsFor:(0,d.yk)({sharedSettings:{inflectors:{drupal:(0,d.PH)({},(e=>e.replace("--","/")))}},settingsByType:{[u.pi.ResourceTypePath]:{serializationOptions:{inflectors:["drupal"]}}}}),URLBuilderClass:p}))}}var m=i(6051),f=i(793),w={findRecord:m.CN.findRecord,findRelatedRecord:m.CN.findRelatedRecord,findRecords(e,t,i){let s=t,n=e.getRecordsSync(s.records||s.type);return s.filter&&(n=_(n,s.filter)),s.sort&&(n=v(n,s.sort)),s.page&&(n=L(n,s.page)),n},findRelatedRecords(e,t,i){const s=t,{record:n,relationship:r}=s,o=e.getRelatedRecordsSync(n,r);if(!o||0===o.length){if(!e.getRecordSync(n)){if(i?.raiseNotFoundExceptions)throw new c.dR(n.type,n.id);return}return[]}let a=e.getRecordsSync(o);return s.filter&&(a=_(a,s.filter)),s.sort&&(a=v(a,s.sort)),s.page&&(a=L(a,s.page)),a}};function _(e,t){return e.filter((e=>{for(let i=0,s=t.length;i<s;i++)if(!y(e,t[i]))return!1;return!0}))}function y(e,t){if("attribute"===t.kind){let i=t.attribute.split("."),s=(0,f.In)(e,["attributes",...i]),n=t.value;switch(t.op){case"equal":case"=":return"string"===typeof s?s.toLowerCase()===n.toLowerCase():s===n;case"<>":return"string"===typeof s?s.toLowerCase()!==n.toLowerCase():s!==n;case">":return s>n;case">=":return s>=n;case"<":return s<n;case"<=":return s<=n;case"STARTS_WITH":return"string"===typeof s&&s.toLowerCase().startsWith(n.toLowerCase());case"CONTAINS":return"string"===typeof s&&s.toLowerCase().includes(n.toLowerCase());case"ENDS_WITH":return"string"===typeof s&&s.toLowerCase().endsWith(n.toLowerCase());case"IN":case"NOT IN":case"BETWEEN":case"NOT BETWEEN":throw new h.gT(`Filter operation ${t.op} is not yet implemented for Store.`);case"IS NULL":return void 0===s||null===s;case"IS NOT NULL":return void 0!==s&&null!==s;default:throw new h.gT(`Filter operation ${t.op} not recognized for Store.`)}}return m.CN.applyFilter(e,t)}function v(e,t){const i=new Map;e.forEach((e=>{i.set(e,t.map((t=>{if("attribute"===t.kind){let i=t.attribute.split(".");return(0,f.In)(e,["attributes",...i])}throw new h.gT("Sort specifier ${sortSpecifier.kind} not recognized for Store.")})))}));const s=t.map((e=>"descending"===e.order?-1:1));return e.sort(((e,n)=>{const r=i.get(e),o=i.get(n);for(let i=0;i<t.length;i++){if(r[i]<o[i])return-s[i];if(r[i]>o[i])return s[i];if((0,f.Wi)(r[i])&&!(0,f.Wi)(o[i]))return s[i];if((0,f.Wi)(o[i])&&!(0,f.Wi)(r[i]))return-s[i]}return 0}))}function L(e,t){if(void 0!==t.limit){let i=void 0===t.offset?0:t.offset,s=t.limit;return e.slice(i,i+s)}throw new h.gT("Pagination options not recognized for Store. Please specify `offset` and `limit`.")}var P=i(9483),b=i.n(P),S=i(4098),k=i.n(S),R=i(7056),x=i(4462),$=i(6619),F=i(7068),T=i(5934);class I{constructor(e){this._app=e}get c(){return{VBtn:R.Z,VListItem:x.Z,VListItemTitle:$.V9}}get dialog(){return{confirm:async e=>await this._app.$dialog.confirm({text:e,title:"Confirmation"}),promptText:async e=>await this._app.$dialog.prompt({text:e,title:"Input"}),custom:async(e,t)=>{const i=(0,T.Z)(),n=new s.Z({}),r=await new Promise((s=>{n.$on("submit",s),this._app.dialogs.push({id:i,context:n,componentFn:(i,n)=>n(F.Z,{props:{value:!0,fullscreen:!0},on:{input:()=>s(void 0)}},[n(e,{ref:"dialogComponent",...t})])})}));return this._app.dialogs=this._app.dialogs.filter((e=>e.id!==i)),r}}}}var O=i(3210),E=i(7441),C=i(5396),A=i.n(C),N=i(901),j=i.n(N);class M{get formatRFC3339(){return O.Z}get createDrupalUrl(){return E.Z}get geohash(){return A()}get haversine(){return j()}summarizeAssetNames(e){return e.length<=3?e.map((e=>e.attributes.name)).join(", "):`${e[0].attributes.name} (+${e.length-1} more)`}}var U=i(4752),W=i.n(U);const D=s.Z.extend({props:{fetcherDelegate:{type:Object,default:function(){return{fetch:k()}}}},data(){return{$_running:!1,$_barrier:new V,hasNetworkConnection:window.navigator.onLine,canReachFarmOS:void 0,isLoggedIn:void 0}},created(){window.addEventListener("offline",(()=>{this.hasNetworkConnection=!1,this.canReachFarmOS=!1})),window.addEventListener("online",(()=>{this.hasNetworkConnection=!0,this.$data.$_barrier.release()})),window.navigator&&window.navigator.connection&&window.navigator.connection.addEventListener("change",(()=>this.$data.$_barrier.release())),this.$_mainLoop()},computed:{isOnline(){return this.canReachFarmOS&&this.isLoggedIn}},beforeDestroy(){this.$data.$_running=!1,this.$data.$_barrier.release()},methods:{async fetch(e,t){const i=t||{};i.method||(i.method="GET");const s=new URL(e,window.location.origin+window.assetLinkDrupalBasePath),n=s.host===window.location.host&&s.pathname.startsWith(window.assetLinkDrupalBasePath);try{const t=await this.fetcherDelegate.fetch(e,i);return n&&403===t.status&&this.$data.$_barrier.release(),t}catch(r){throw n&&this.$data.$_barrier.release(),r}},async $_mainLoop(){this.$data.$_running=!0;const e=W()((()=>this.$_checkConnectionStatus()),1e3);while(this.$data.$_running)await e(),await this.$data.$_barrier.arrive(6e4)},async $_checkConnectionStatus(){if(!this.hasNetworkConnection)return;const e=(0,E.Z)(`api?cacheBust=${Z()}`);try{const t=await k()(e,{credentials:"same-origin",cache:"no-cache"});if(200!==t.status)return void(this.canReachFarmOS=!1);const i=await t.json(),s=i.meta?.farm?.version;if("2.x"!==s)return void(this.canReachFarmOS=!1);this.canReachFarmOS=!0;const n=i.meta?.links?.me?.href;this.isLoggedIn=void 0!==n}catch(t){this.canReachFarmOS=!1}}}});function B(e){return new Promise((t=>setTimeout(t,e)))}function Z(){return parseInt((new Date).getTime()/1e3)}class V{constructor(){this.waiting=[]}arrive(e){return Promise.race([B(e),new Promise((e=>this.waiting.push(e)))])}release(){const e=this.waiting.splice(0);e.forEach((e=>e()))}}var q=D;class z{constructor(e){this._delegate=e,this._next_iteration_result=void 0}async next(){if(void 0!==this._next_iteration_result){const e=this._next_iteration_result;return this._next_iteration_result=void 0,e}return await this._delegate.next()}async peek(){return void 0===this._next_iteration_result&&(this._next_iteration_result=await this._delegate.next()),this._next_iteration_result}}i(6314);function Q(){return parseInt((new Date).getTime()/1e3)}class K{constructor(){this._handlersByEventName={}}$on(e,t){Object.hasOwn(this._handlersByEventName,e)||(this._handlersByEventName[e]=[]),this._handlersByEventName[e].push(t)}async $emit(e,t){const i=this._handlersByEventName[e]||[],s=i.map((e=>e(t)));return Promise.all(s).then((()=>!0))}}class H extends Error{constructor(e,t){super(e,t)}}class J{constructor(e){this._store=e._store,this._vm=new s.Z({data:{lists:[]}}),this._eventBus=new K,this._pluginReferenceTracker=new G(this._eventBus),this._defaultPluginList=new X(e._store,(0,E.Z)("/alink/backend/default-plugins.repo.json"),this._pluginReferenceTracker,!0),this._localPluginList=new Y(e._store,this._pluginReferenceTracker),this._extraPluginLists=[],this._extraPluginListStoreKey="asset-link-extra-plugin-lists"}get vm(){return this._vm}get eventBus(){return this._eventBus}async boot(){const e=await this._getExtraPluginListUrls();this._extraPluginLists=e.map((e=>new X(this._store,e,this._pluginReferenceTracker,!1)));for(let t of[this._defaultPluginList,this._localPluginList,...this._extraPluginLists]){const e=await t.load();this._updatePluginListViewInViewModel(e)}}async addPluginToLocalList(e){const t=await this._localPluginList.addPlugin(e);this._updatePluginListViewInViewModel(t)}async removePluginFromLocalList(e){const t=await this._localPluginList.removePlugin(e);this._updatePluginListViewInViewModel(t)}async addExtraPluginList(e){this._modifyAndWriteStoredExtraPluginListUrls((t=>{const i=t.findIndex((t=>t===e));if(i>=0)return!1;t.push(e)}));const t=this._extraPluginLists.findIndex((t=>t._url===e));if(t>=0)return;const i=new X(this._store,e,this._pluginReferenceTracker,!1);this._extraPluginLists.push(i);const s=await i.load();this._updatePluginListViewInViewModel(s)}async removeExtraPluginList(e){this._modifyAndWriteStoredExtraPluginListUrls((t=>{const i=t.findIndex((t=>t===e));if(i<0)return!1;t.splice(i,1)}));const t=this._extraPluginLists.findIndex((t=>t._url===e));if(t<0)return;const i=this._extraPluginLists.splice(t,1)[0];await i.unload(),this._removePluginListViewFromViewModel(e)}async reloadPluginList(e){const t=[this._defaultPluginList,this._localPluginList,...this._extraPluginLists].find((t=>t._url===e));if(!t)return;const i=await t.reload();this._updatePluginListViewInViewModel(i)}async _getExtraPluginListUrls(){const e=await this._store.getItem(this._extraPluginListStoreKey);return e?e.value.map((e=>new URL(e))):[]}async _modifyAndWriteStoredExtraPluginListUrls(e){const t=await this._getExtraPluginListUrls(),i=!1!==e(t);return i&&await this._store.setItem(this._extraPluginListStoreKey,{key:this._extraPluginListStoreKey,timestamp:Q(),value:t}),t}_updatePluginListViewInViewModel(e){const t=this.vm,i=t.lists.findIndex((t=>t.sourceUrl===e.sourceUrl));i>=0?t.lists.splice(i,1,e):t.lists.push(e)}_removePluginListViewFromViewModel(e){const t=this.vm,i=t.lists.findIndex((t=>t.sourceUrl===e));i>=0&&t.lists.splice(i,1)}}class G{constructor(e){this._eventBus=e,this._pluginReferences={}}async ackPluginReference(e,t){console.log("ackPluginReference",e.toString(),t.toString());const i=Object.hasOwn(this._pluginReferences,e.toString());i||(this._pluginReferences[e.toString()]=[]);const s=this._pluginReferences[e.toString()],n=s.indexOf(t.toString());n<0&&s.push(t),i||await this._eventBus.$emit("add-plugin",e)}async freePluginReference(e,t){const i=this._pluginReferences[e.toString()];if(!i)return void console.log("freePluginReference unexpectedly found plugin missing from internal reference tracking",e.toString(),t.toString(),JSON.stringify(this._pluginReferences));const s=i.indexOf(t.toString());s>=0?i.splice(s,1):console.log("freePluginReference unexpectedly found plugin without expected reference",e.toString(),t.toString(),JSON.stringify(i)),i.length>0||await this._eventBus.$emit("remove-plugin",e)}}class X{constructor(e,t,i,s){this._store=e,this._storeKey=`asset-link-cached-plugin-list:${t}`,this._url=t,this._pluginReferenceTracker=i,this._isDefault=s,this._isLocal=!1,this._latestPluginListView=void 0}async load(e){return this._latestPluginListView=ee(await this._getHttpPluginList(e),this._isDefault,this._isLocal,this._url),await Promise.all(this._latestPluginListView.plugins.map((e=>this._pluginReferenceTracker.ackPluginReference(e.url,this._url)))),this._latestPluginListView}async unload(){this._latestPluginListView&&(await Promise.all(this._latestPluginListView.plugins.map((e=>this._pluginReferenceTracker.freePluginReference(e.url,this._url)))),await this._store.removeItem(this._storeKey))}async reload(){return await this.load(!0)}async _getHttpPluginList(e){const t=e?void 0:await this._store.getItem(this._storeKey),i=Q();if(t&&i-t.timestamp<900)return t.value;const s=await fetch(this._url);if(console.log(s),403===s.status)throw new H(`HTTP Error ${s.status}: ${s.statusText}`);if(!s.ok)throw new Error(`HTTP Error ${s.status}: ${s.statusText}`);const n=await s.json();return await this._store.setItem(this._storeKey,{key:this._storeKey,timestamp:i,value:n}),n}}class Y{constructor(e,t){this._store=e,this._storeKey="local-plugin-list.repo.json",this._url=new URL("indexeddb://asset-link/data/local-plugin-list.repo.json",window.location.origin),this._isDefault=!1,this._isLocal=!0,this._pluginReferenceTracker=t}async load(){const e=ee(await this._getLocalPluginList(),this._isDefault,this._isLocal,this._url);return await Promise.all(e.plugins.map((e=>this._pluginReferenceTracker.ackPluginReference(e.url,this._url)))),e}async reload(){return await this.load()}async addPlugin(e){const t=await this._modifyAndWriteStoredList((t=>{if(t.plugins.find((t=>t.url===e.toString())))return!1;t.plugins.push({url:e.toString()})}));return await this._pluginReferenceTracker.ackPluginReference(e,this._url),ee(t,this._isDefault,this._isLocal,this._url)}async removePlugin(e){const t=await this._modifyAndWriteStoredList((t=>{const i=t.plugins.findIndex((t=>t.url===e.toString()));if(i<0)return!1;t.plugins.splice(i,1)}));return await this._pluginReferenceTracker.freePluginReference(e,this._url),ee(t,this._isDefault,this._isLocal,this._url)}async _getLocalPluginList(){const e=await this._store.getItem(this._storeKey);return e?e.value:{plugins:[]}}async _modifyAndWriteStoredList(e){const t=await this._getLocalPluginList(),i=!1!==e(t);return i&&await this._store.setItem(this._storeKey,{key:this._storeKey,timestamp:Q(),value:t}),t}}const ee=(e,t,i,s)=>(e.isDefault=t,e.isLocal=i,e.sourceUrl=s,e.error||(e.error=void 0),e.plugins||(e.plugins=[]),e.plugins=e.plugins.map((t=>{const s=new URL(t.url,i?window.location.origin:e.sourceUrl);return{url:s}})),e);i(2801);var te=i(6482);class ie{constructor(e){this._assetLink=e,this._store=e._store,this._vm=new s.Z({data:{plugins:[]}})}get vm(){return this._vm}async boot(){}async loadPlugin(e,t){const n=t||{},r=performance.now();let o;try{let t=await this._fetchPlugin(e,n);if(e.pathname.endsWith("alink.js")){const e=(await import(t)).default;o=new e}else{if(!e.pathname.endsWith("alink.vue"))throw new Error(`Cannot load plugin ${e} with unsupported type. Path of url must end in '.alink.js' or '.alink.vue'`);{const n=new URL(e.toString());n.search="";const r=await i.e(244).then(i.bind(i,1244)),a={},c={};Object.entries(r).forEach((([e,t])=>{Object.prototype.hasOwnProperty.call(t,"component")?a[e]=t:["bind","inserted","update","componentUpdated","unbind"].find((e=>Object.prototype.hasOwnProperty.call(t,e)))&&(c[e]=t)}));let l=await fetch(t).then((e=>e.text()));const u=await i.e(725).then(i.t.bind(i,725,23)),d=new Set,h=new Set,p=u.parseComponent(l);if(p.errors.length>0)throw new Error(`Could not parse component plugin: ${p.errors.join("\n")}`);if(p.template){if(p.template.src)throw new Error("External component template content is not supported.");u.compile(p.template.content,{modules:[{postTransformNode:e=>{"directives"in e&&e.directives.forEach((({name:e})=>h.add(e))),d.add(e.tag)}}]})}const g=Array.from(d).map((e=>[ce(e),oe(re(e))])).filter((([e,t])=>e.startsWith("v-")&&Object.prototype.hasOwnProperty.call(a,t))).map((([e,t])=>[t,a[t]])),m=Array.from(h).map((e=>oe(re(e)))).filter((e=>Object.prototype.hasOwnProperty.call(c,e))).map((e=>[e,c[e]]));this.moduleCache||(this.moduleCache=Object.assign(Object.create(null),{vue:s.Z,"vuetify/lib":r,"vue-codemirror":Promise.all([i.e(631),i.e(55)]).then(i.t.bind(i,5055,23)),"codemirror/mode/javascript/javascript.js":Promise.all([i.e(631),i.e(876)]).then(i.t.bind(i,6876,23)),"codemirror/mode/vue/vue.js":Promise.all([i.e(631),i.e(876),i.e(426)]).then(i.t.bind(i,2426,23)),"codemirror/lib/codemirror.css":i.e(989).then(i.bind(i,4989)),"codemirror/theme/base16-dark.css":i.e(903).then(i.bind(i,3903))}));const f={moduleCache:this.moduleCache,compiledCache:{set:(e,t)=>this._store.setItem(`asset-link-cached-compiled-plugin:${e}`,t),get:e=>this._store.getItem(`asset-link-cached-compiled-plugin:${e}`)},async getFile(e){if(e===n)return l;throw new Error(`Secondary imports are not supported. url=${e}`)},addStyle(){}};o=await(0,te.$y)(n,f),o.name||(o.name=`unnamed-sfc-plugin-${(0,T.Z)()}`),g.length&&!o.components&&(o.components={}),g.filter((e=>!o.components[e[0]])).forEach((e=>o.components[e[0]]=e[1])),m.length&&!o.directives&&(o.directives={}),m.filter((e=>!o.directives[e[0]])).forEach((e=>o.directives[e[0]]=e[1])),s.Z.component(o.name,o)}}o.pluginUrl=e,this.registerPlugin(o)}catch(a){console.log(a),o={},o.pluginUrl=e,o.error=a,this.registerPlugin(o)}finally{const t=performance.now();console.log(`Loading plugin ${e} took ${t-r} milliseconds`)}}registerPlugin(e){if(e.definedRoutes={},e.definedSlots={},e.definedWidgetDecorators={},this.vm.plugins.push(e),"function"===typeof e.onLoad){const t=new se(e,this.vm);e.onLoad(t,this._assetLink)}}async unloadPlugin(e){const t=this.vm.plugins.findIndex((t=>t.pluginUrl.toString()===e.toString()));-1!==t&&this.vm.plugins.splice(t,1)}async reloadPlugin(e){await this.unloadPlugin(e),await this.loadPlugin(e,{skipCache:!0})}async _fetchPlugin(e,t){const i=t||{},s=i.skipCache||e.searchParams&&e.searchParams.get("skipCache"),n=`asset-link-cached-plugin-src:${e}`,r=await this._store.getItem(n),o=Q();if(!s&&r&&o-r.timestamp<900)return r.value;const a=await fetch(e);if(!a.ok)throw new Error(`HTTP Error ${a.status}: ${a.statusText}`);const c=await a.text(),l=`${c}\n//# sourceURL=asset-link-plugin:./${encodeURIComponent(e)}\n`,u="data:application/javascript;base64,"+btoa(l);return await this._store.setItem(n,{key:n,timestamp:o,value:u}),u}}class se{constructor(e,t){this._pluginInstance=e,this._vm=t}get thisPlugin(){return this._pluginInstance}defineRoute(e,t){const i={name:e},s={path(e){i.path=e},componentFn(e){i.componentFn=e}};t(s);const n=Object.entries({path:"string",componentFn:"function"}).filter((([e,t])=>typeof i[e]!==t));n.length?console.log(`Action '${e}' is invalid due to missing or mismatched types for fields: ${JSON.stringify(n)}`,i):(this._pluginInstance.definedRoutes[e]=i,this._vm.$emit("add-route",i))}defineSlot(e,t){const i={name:e},s={type(e){i.type=e},showIf(e){i.predicateFn=e},multiplexContext(e){i.contextMultiplexerFn=e},weight(e){i.weightFn=e},componentFn(e){i.componentFn=e}};t(s);let n=Object.entries({type:"string",predicateFn:"function",componentFn:"function"}).filter((([e,t])=>typeof i[e]!==t));if(["undefined","function"].includes(typeof i.contextMultiplexerFn)||n.push(["contextMultiplexerFn","function?"]),["undefined","function","number"].includes(typeof i.weightFn)||n.push(["weightFn","(function|number)?"]),n.length)return void console.log(`Slot '${e}' is invalid due to missing or mismatched types for fields: ${JSON.stringify(n)}`,i);const r=i.predicateFn;i.predicateFn=e=>e.type===i.type&&r(e);const o=i.weightFn;void 0===o?i.weightFn=()=>100:"number"===typeof o&&(i.weightFn=()=>o),this._pluginInstance.definedSlots[e]=i}defineWidgetDecorator(e,t){const i={name:e},s={targetWidgetName(e){i.targetWidgetName=e},appliesIf(e){i.predicateFn=e},weight(e){i.weightFn=e},componentFn(e){i.componentFn=e}};t(s);const n=Object.entries({targetWidgetName:"string",predicateFn:"function",componentFn:"function"}).filter((([e,t])=>typeof i[e]!==t));if(["undefined","function","number"].includes(typeof i.weightFn)||n.push(["weightFn","(function|number)?"]),n.length)return void console.log(`Widget decorator '${e}' is invalid due to missing or mismatched types for fields: ${JSON.stringify(n)}`,i);const r=i.predicateFn;i.predicateFn=e=>e.widgetName===i.targetWidgetName&&r(e);const o=i.weightFn;void 0===o?i.weightFn=()=>100:"number"===typeof o&&(i.weightFn=()=>o),this._pluginInstance.definedWidgetDecorators[e]=i}}const ne=/-(\w)/g,re=e=>e.replace(ne,((e,t)=>t?t.toUpperCase():"")),oe=e=>e.charAt(0).toUpperCase()+e.slice(1),ae=/\B([A-Z])/g,ce=e=>e.replace(ae,"-$1").toLowerCase(),le=(e,t)=>k()(e,t).then((e=>e.json()));class ue{constructor(e){this._app=e,this._viewModel=new s.Z({data:{booted:!1,bootProgress:0,bootText:"Starting",connectionStatus:new q,pendingUpdates:[],messages:[]}}),this._booted=new Promise((e=>{this._viewModel.$once("booted",(()=>{this._viewModel.booted=!0,e(!0)}))})),this._store=b().createInstance({name:"asset-link",storeName:"data"}),this._cores={},this._cores.pluginLists=new J(this),this._cores.pluginLoader=new ie(this),this._memory=void 0,this._remote=void 0,this._ui=new I(e),this._util=new M}get app(){return this._app}get viewModel(){return this._viewModel}get ui(){return this._ui}get util(){return this._util}get cores(){return this._cores}get entitySource(){return this._memory}get remoteEntitySource(){return this._remote}get plugins(){return this._cores.pluginLoader.vm.plugins}get booted(){return this._booted}async boot(){this.viewModel.bootText="Initializing storage",await this._store.ready(),this._cores.pluginLists.eventBus.$on("add-plugin",(async e=>{await this._cores.pluginLoader.loadPlugin(e)})),this._cores.pluginLists.eventBus.$on("remove-plugin",(async e=>{await this._cores.pluginLoader.unloadPlugin(e)})),this._cores.pluginLoader.vm.$on("add-route",(e=>{"function"===typeof this.app.addRoute&&this.app.addRoute(e)})),this._cores.pluginLoader.vm.$on("remove-route",(e=>{"function"===typeof this.app.removeRoute&&this.app.removeRoute(e)})),window.addEventListener("asset-link-plugin-changed",(async e=>{await this._cores.pluginLoader.reloadPlugin(new URL(e.detail.pluginUrl))})),await this._cores.pluginLoader.boot(),await this._cores.pluginLists.boot(),this.viewModel.bootText="Loading models...",this._models=await this._loadModels(),r.qZ.fetch=this._csrfAwareFetch.bind(this),this._schema=new c.DS({models:this._models});const e=new o.yt({namespace:"asset-link-orbitjs-bucket"});this._memory=new l.O5({schema:this._schema,cacheSettings:{queryOperators:w}}),this._remote=new g({schema:this._schema,name:"remote",host:(0,E.Z)("/api"),defaultFetchSettings:{timeout:1e4},bucket:e,requestQueueSettings:{autoProcess:this.viewModel.connectionStatus.isOnline||!1}});const t=()=>{this.viewModel.pendingUpdates=this._remote.requestQueue.entries.filter((e=>"update"===e.type))};this._remote.requestQueue.reified.then(t),this._remote.requestQueue.on("change",t),this._backup=new a.T6({schema:this._schema,name:"backup",namespace:"asset-link-orbitjs-entities",defaultTransformOptions:{useBuffer:!0}}),this._coordinator=new n.m1({sources:[this._memory,this._remote,this._backup]}),this._remoteQueryStrategy=new n.Q2({name:"remoteRequestStrategy",source:"memory",on:"beforeQuery",target:"remote",action:"query",blocking:!0}),this.viewModel.connectionStatus.isOnline&&this._coordinator.addStrategy(this._remoteQueryStrategy),this._coordinator.addStrategy(new n.Q2({source:"memory",on:"beforeUpdate",target:"remote",action:"update",blocking:!1})),this._coordinator.addStrategy(new n.xv({source:"remote",target:"memory",blocking:!1})),this._coordinator.addStrategy(new n.xv({source:"memory",target:"backup",blocking:!0}));const i=await this._backup.query((e=>e.findRecords()));return await this._memory.sync((e=>i.map((t=>e.addRecord(t))))),await this._coordinator.activate(),this.viewModel.bootProgress=100,this._memory.on("update",(e=>{console.log("_memory::update",e),"updateRecord"===e.operations.op&&e.operations.record.type.startsWith("asset--")&&this.viewModel.$emit("changed:asset",e.operations.record.type,e.operations.record.id)})),this.viewModel.connectionStatus.$watch("isOnline",(async e=>{this._remote.requestQueue.autoProcess=e,e&&!this._remote.requestQueue.empty&&this._remote.requestQueue.process(),await this._coordinator.deactivate(),e?this._coordinator.strategies.includes(this._remoteQueryStrategy)||this._coordinator.addStrategy(this._remoteQueryStrategy):this._coordinator.strategies.includes(this._remoteQueryStrategy)&&this._coordinator.removeStrategy(this._remoteQueryStrategy.name),await this._coordinator.activate()})),this.viewModel.$emit("booted"),this.viewModel.connectionStatus.isOnline&&this._precache(),!0}async getEntityModel(e){return await this._booted,this._models[e]}async _precache(){const e=window.location.href.match(/https?:\/\/.*\/asset\/(\d+)/);if(e&&e.length>=2){const t=await this.resolveAsset(e[1]);console.log("thisAsset=",t)}const t=Q(),i="asset-link-last-precache-time",s=await this._store.getItem(i);if(s&&t-s<900)return void console.log("Skipping Asset Link precaching because it was done recently...");const n=(await this.getAssetTypes()).map((e=>e.attributes.drupal_internal__id));await this._memory.query((e=>n.map((t=>e.findRecords(`asset--${t}`).sort("-changed").page({offset:0,limit:100}))))),await this._store.setItem(i,t)}async getAssetTypes(){const e=async e=>await e.query((e=>e.findRecords("asset_type--asset_type").sort("drupal_internal__id"))),t=await e(this._memory.cache);return t.length?t:await e(this._memory)}async resolveAsset(e){await this._booted;const t=(await this.getAssetTypes()).map((e=>e.attributes.drupal_internal__id)),i=/^-?\d+$/.test(e);let s={attribute:"id",value:e};i&&(s={attribute:"drupal_internal__id",value:parseInt(e)});const n=async e=>{const i=await e.query((e=>t.map((t=>e.findRecords(`asset--${t}`).filter(s).sort("drupal_internal__id"))))),n=i.flatMap((e=>e));return n.find((e=>e))},r=await n(this._memory.cache);return r||await n(this._memory)}searchAssets(e,t){console.log("searchAssets:",JSON.stringify(e),t);const i=this.plugins.filter((e=>"function"===typeof e.searchAssets)),s=[];for(let r=0;r<i.length;r+=1){const n=i[r],o=n.searchAssets(this,e,t);void 0!==o&&s.push(o)}async function*n(){console.log("coiterateSearchCursors: searchResultCursors =",s);const e=s.map((e=>new z(e)));while(e.length>0){let t,i;console.log("coiterateSearchCursors: peekableSearchResultCursors.length =",e.length,e);for(let n=0;n<e.length;n+=1){const s=e[n],r=await s.peek();void 0!==r.value&&((void 0===t||r.value.weight<(await t.peek()).value.weight)&&(t=s,i=r.done?n:void 0))}if(void 0===t)return;const s=await t.next();s.value&&(yield s.value),void 0!==i&&e.splice(i,1)}}return n()}getSlots(e){return this.getPluginDefinedComponents("definedSlots",e)}getWidgetDecorators(e){return this.getPluginDefinedComponents("definedWidgetDecorators",e)}getPluginDefinedComponents(e,t){const i=(e,t)=>e.weight<t.weight?-1:e.weight>t.weight?1:e.id<t.id?-1:e.id>t.id?1:0,s=t=>t[e]||{};return this.plugins.flatMap((e=>Object.values(s(e)))).filter((e=>e.predicateFn(t))).flatMap((e=>{let i=[t];return"function"===typeof e.contextMultiplexerFn&&(i=e.contextMultiplexerFn(t)),i.map(((t,s)=>({id:1===i.length?e.id:e.id+"."+s,componentFn:(i,s,n)=>e.componentFn(i,s,t,n),weight:e.weightFn(t)})))})).sort(i)}async _csrfAwareFetch(e,t){const i=t||{};i.method||(i.method="GET");const s=new URL(e,window.location.origin+window.assetLinkDrupalBasePath),n=s.host===window.location.host&&s.pathname.startsWith(window.assetLinkDrupalBasePath),r=!["HEAD","GET","OPTIONS","TRACE"].includes(i.method.toUpperCase()),o=n&&r;try{if(o){const e=await this.viewModel.connectionStatus.fetch((0,E.Z)("/session/token"));console.log("tokenResponse:",e);const t=await e.text();i.headers||(i.headers={}),i.headers["X-CSRF-Token"]=t}return await this.viewModel.connectionStatus.fetch(e,i)}catch(a){if(console.log("Error in _csrfAwareFetch",typeof a,a),"Network request failed"===a.message)return new Response(null,{status:503,statusText:"Service unavailable due to network error"});throw a}}async _loadModels(){const e="asset-link-cached-entity-models",t=await this._store.getItem(e);if(t)return t.value;const i=await this._loadModelsFromServer(),s=Q();return await this._store.setItem(e,{key:e,timestamp:s,value:i}),i}async _loadModelsFromServer(){this.viewModel.bootText="Loading server schema";const e=await le((0,E.Z)("/api/schema")),t=e.allOf.flatMap((e=>e.links||[])),i={};return await Promise.all(t.map((async e=>{const s=await le(e.targetSchema),n=await le(s.definitions.data.items.$ref),r=n.definitions.type["const"];i[r]={attributes:Object.fromEntries(Object.entries(n.definitions.attributes.properties).map((([e,t])=>("integer"===t.type&&(t.type="number"),"third_party_settings"===e&&(t.type="object"),[e,t])))),relationships:n.definitions?.relationships?.properties||{}},this.viewModel.bootProgress=(Object.keys(i).length/t.length*100).toFixed(1)}))),i}}},7441:function(e,t,i){function s(e){return new URL(e,window.location.origin+window.assetLinkDrupalBasePath)}i.d(t,{Z:function(){return s}})},8787:function(e,t,i){var s=i(538),n=i(3428);s.Z.use(n.Z),t["Z"]=new n.Z({})},5597:function(e,t,i){var s=i(5205);(0,s.z)("/__THIS_GETS_REPLACED_AT_RUNTIME_BY_THE_DRUPAL_CONTROLLER__/service-worker.js",{ready(){console.log("App is being served from cache by a service worker.\nFor more details, visit https://goo.gl/AFskqB")},registered(){console.log("Service worker has been registered.")},cached(){console.log("Content has been cached for offline use.")},updatefound(){console.log("New content is downloading.")},updated(){console.log("New content is available; please refresh.")},offline(){console.log("No internet connection found. App is running in offline mode.")},error(e){console.error("Error during service worker registration:",e)}})}}]);
//# sourceMappingURL=chunk-common.js.map