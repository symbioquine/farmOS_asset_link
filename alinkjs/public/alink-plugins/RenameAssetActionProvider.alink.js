export default class RenameAssetActionProvider{onLoad(t,e){const a=e.ui.c.VBtn;t.defineSlot("net.symbioquine.farmos_asset_link.actions.v0.rename",(t=>{t.type("asset-action"),t.showIf((({asset:t})=>"archived"!==t.attributes.status));const n=async t=>{const a=await e.ui.dialog.promptText(`What should "${t.attributes.name}" be renamed to?`);if(!a)return;const n=await e.getEntityModel(t.type);console.log(n);let s={name:a};if("undefined"!==typeof n.attributes.nickname){const e=t.attributes.nickname||[];s.nickname=[t.attributes.name,...e]}await e.entitySource.update((e=>e.updateRecord({type:t.type,id:t.id,attributes:s})),{label:`Rename asset: "${t.attributes.name}" to "${a}"`})};t.componentFn(((t,e,{asset:s})=>e(a,{props:{block:!0,color:"secondary"},on:{click:()=>n(s)},class:"text-none"},"Rename")))}))}}