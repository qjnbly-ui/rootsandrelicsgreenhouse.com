export {};
interface PhotoNote { id: string; body: string; author: string; createdAt: string }
interface AlbumPhoto { id: string; filename: string; url: string; alt: string; notes: PhotoNote[] }
interface AlbumState { id: string; slug: string; title: string; revision: number; coverId: string | null; photos: AlbumPhoto[]; permissions: { canManage?: boolean; canNote?: boolean } }
const SITE='65c78021-2652-4e64-b025-485262709d8a';
const SERVICE='https://www.n3xra.com';
const endpoint=(slug:string)=>`${SERVICE}/api/website-gallery?${new URLSearchParams({website:SITE,album:slug})}`;
const publicImage=(url:string)=>url.startsWith(`https://vdbjlgmbpykjblprqnak.supabase.co/storage/v1/object/public/website-assets-public/${SITE}/`);
const main=document.querySelector<HTMLElement>('main[data-gallery-album]');
const slug=main?.dataset.galleryAlbum||'';
const grid=main?.querySelector<HTMLElement>('[data-gallery-grid]');
const edit=main?.querySelector<HTMLButtonElement>('[data-gallery-edit]');
const finish=main?.querySelector<HTMLButtonElement>('[data-gallery-finish]');
const status=main?.querySelector<HTMLElement>('[data-gallery-status]');
let grant='',state:AlbumState|null=null,busy=false;
const figures=new Map<string,HTMLElement>();
grid?.querySelectorAll<HTMLElement>('[data-gallery-filename]').forEach(photo=>figures.set(photo.dataset.galleryFilename||'',photo));
const message=(text:string)=>{if(status)status.textContent=text;};
async function request(action:string,payload:unknown={}):Promise<AlbumState|{url:string}>{
 const response=await fetch(endpoint(slug),{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${grant}`},body:JSON.stringify({action,payload}),signal:AbortSignal.timeout(20000)});
 const result=await response.json();if(!response.ok)throw Error(result.error||'The album could not be updated.');return result;
}
function button(label:string,action:string,asset:string):HTMLButtonElement{
 const item=document.createElement('button');item.type='button';item.textContent=label;item.dataset.galleryAction=action;item.dataset.asset=asset;return item;
}
function apply(next:AlbumState):void{
 if(!Array.isArray(next.photos))throw Error('Album data is unavailable.');
 const active=document.activeElement as HTMLElement|null;
 const focusedAction=active?.dataset.galleryAction,focusedAsset=active?.dataset.asset;
 state=next;const currentPhotos=next.photos.filter(p=>publicImage(p.url));
 if(!grid)return;
 main?.classList.toggle('gallery-is-editing',Boolean(grant));
 for(const item of figures.values())item.remove();
 for(const photo of currentPhotos){
  let figure=figures.get(photo.filename);
  if(!figure){
   figure=document.createElement('figure');figure.className='gallery-image is-visible';figure.dataset.galleryFilename=photo.filename;
   const open=document.createElement('button');open.type='button';open.dataset.galleryItem='';const image=document.createElement('img');image.loading='lazy';image.decoding='async';open.append(image);figure.append(open);figures.set(photo.filename,figure);
  }
  figure.dataset.asset=photo.id;const image=figure.querySelector('img')!;image.src=photo.url;image.dataset.fullSrc=photo.url;image.alt=photo.alt||next.title;
  const open=figure.querySelector<HTMLButtonElement>('[data-gallery-item]')!;open.setAttribute('aria-label',`Open photo: ${image.alt}`);
  let actions=figure.querySelector<HTMLElement>('figcaption');if(!actions){actions=document.createElement('figcaption');actions.className='gallery-photo-actions';figure.append(actions);}actions.replaceChildren();
  const download=document.createElement('a');download.href=endpoint(slug)+'&download=1&asset='+photo.id;download.textContent='Download image';actions.append(download);
  if(grant && next.permissions.canManage){
   actions.append(button(next.coverId===photo.id?'Album cover':'Use as cover','cover',photo.id),button('Move earlier','earlier',photo.id),button('Move later','later',photo.id),button('Remove photo','remove',photo.id),button('Download original','original',photo.id));
   const cover=actions.querySelector<HTMLButtonElement>('[data-gallery-action="cover"]');if(cover)cover.disabled=next.coverId===photo.id;
  }
  if(grant&&next.permissions.canNote)actions.append(button(`Private notes${photo.notes.length?' ('+photo.notes.length+')':''}`,'notes',photo.id));
  grid.append(figure);
 }
 const count=main?.querySelector('[data-gallery-count]');if(count)count.textContent=`${currentPhotos.length} photos`;
 const empty=main?.querySelector<HTMLElement>('[data-gallery-empty]');if(empty)empty.hidden=currentPhotos.length>0;
 const cover=currentPhotos.find(p=>p.id===next.coverId)||currentPhotos[0];const hero=main?.querySelector<HTMLImageElement>('.gallery-hero-image img');if(hero&&cover)hero.src=cover.url;
 const mix=main?.querySelector<HTMLButtonElement>('[data-gallery-shuffle]');if(mix){mix.hidden=Boolean(grant);mix.disabled=false;}
 if(edit){edit.hidden=Boolean(grant);edit.disabled=false;}if(finish)finish.hidden=!grant;
 document.dispatchEvent(new CustomEvent('gallery:updated'));
 if(focusedAction){
  const target=[...main!.querySelectorAll<HTMLButtonElement>('[data-gallery-action]')].find(b=>b.dataset.asset===focusedAsset && b.dataset.galleryAction===focusedAction && !b.disabled);
  (target||finish)?.focus({preventScroll:true});
 }
}
async function mutate(action:string,payload:Record<string,unknown>):Promise<void>{
 if(busy||!state)return;busy=true;
 main?.querySelectorAll<HTMLButtonElement>('[data-gallery-action]').forEach(b=>b.disabled=true);
 message('Saving…');
 try{apply(await request(action,{...payload,revision:state.revision}) as AlbumState);message(action==='remove'?'Photo removed. Its original remains stored for recovery.':action==='note'?'Private note saved.':'Album updated.');}
 catch(error){message(error instanceof Error?error.message:'The change could not be saved.');try{apply(await request('state') as AlbumState);}catch{grant='';if(state)apply({...state,permissions:{}});}}
 finally{busy=false;}
}
function openNotes(photo:AlbumPhoto):void{
 const dialog=document.createElement('dialog');dialog.className='gallery-notes-dialog';dialog.setAttribute('aria-label','Private photo notes');
 const heading=document.createElement('h2');heading.textContent='Private photo notes';const hint=document.createElement('p');hint.textContent='Visible only to website administrators. What worked well, or what would you improve next time?';
 const preview=document.createElement('img');preview.src=photo.url;preview.alt=photo.alt;
 const thread=document.createElement('div');
 for(const note of photo.notes){const entry=document.createElement('article'),author=document.createElement('small'),body=document.createElement('p');author.textContent=`${note.author} · ${new Date(note.createdAt).toLocaleString()}`;body.textContent=note.body;entry.append(author,body);thread.append(entry);}
 if(!photo.notes.length)thread.textContent='No notes yet.';
 const form=document.createElement('form'),label=document.createElement('label'),text=document.createElement('textarea');label.textContent='Your note';text.rows=4;text.required=true;text.maxLength=3000;label.append(text);
 const save=document.createElement('button');save.type='submit';save.textContent='Add private note';const close=document.createElement('button');close.type='button';close.textContent='Close';close.onclick=()=>dialog.close();
 const feedback=document.createElement('p');feedback.setAttribute('role','status');form.append(label,save,close);dialog.append(heading,hint,preview,thread,feedback,form);document.body.append(dialog);dialog.addEventListener('close',()=>dialog.remove(),{once:true});dialog.showModal();
 form.onsubmit=async event=>{event.preventDefault();if(busy)return;save.disabled=true;await mutate('note',{asset:photo.id,body:text.value.trim()});save.disabled=false;if(state?.photos.find(p=>p.id===photo.id)?.notes.length!==photo.notes.length)dialog.close();else feedback.textContent='The note was not saved. Your text is still here; please try again.';};
}
grid?.addEventListener('click',event=>{
 const target=(event.target as HTMLElement).closest<HTMLButtonElement>('[data-gallery-action]');if(!target||!state||busy)return;
 const photo=state.photos.find(p=>p.id===target.dataset.asset);if(!photo)return;
 const action=target.dataset.galleryAction;
 if(action==='notes'){openNotes(photo);return;}
 if(action==='original'){void request('original',{asset:photo.id}).then(result=>{if('url' in result)window.location.assign(result.url);}).catch(error=>message(error.message));return;}
 if(action==='remove'&&!window.confirm('Remove this photo from the album? The original remains stored for recovery.'))return;
 if(action==='earlier'||action==='later'){
  const order=[...grid.querySelectorAll<HTMLElement>('[data-gallery-filename]')].map(p=>p.dataset.asset!);const index=order.indexOf(photo.id),next=index+(action==='earlier'?-1:1);if(next<0||next>=order.length)return;
  [order[index],order[next]]=[order[next],order[index]];void mutate('order',{assets:order});return;
 }
 if(action==='cover'||action==='remove')void mutate(action,{asset:photo.id});
});
edit?.addEventListener('click',()=>{
 const nonce=Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,'0')).join('');sessionStorage.setItem('gallery-signin:'+slug,nonce);
 const query=new URLSearchParams({website:SITE,album:slug,audience:location.origin,nonce});window.location.assign(`${SERVICE}/client-portal/gallery-access/?${query}`);
});
finish?.addEventListener('click',()=>{void request('revoke').catch(()=>{});grant='';if(state)apply({...state,permissions:{}});message('Editing finished.');});
async function initialize():Promise<void>{
 if(main){
  const mix=main.querySelector<HTMLButtonElement>('[data-gallery-shuffle]');if(mix)mix.disabled=true;
  const fragment=new URLSearchParams(location.hash.slice(1)),token=fragment.get('gallery_grant'),nonce=fragment.get('nonce');
  if(token){history.replaceState(null,'',location.pathname+location.search);if(/^[a-f0-9]{64}$/.test(token)&&nonce===sessionStorage.getItem('gallery-signin:'+slug))grant=token;sessionStorage.removeItem('gallery-signin:'+slug);}
  try{
   const result=grant?await request('state'):await fetch(endpoint(slug),{cache:'no-store',signal:AbortSignal.timeout(10000)}).then(async r=>{if(!r.ok)throw Error('Album unavailable');return r.json();});
   apply(result as AlbumState);if(grant)message('You are editing this album. Changes are saved for everyone; photo notes stay private.');
  }catch{grant='';if(mix)mix.disabled=false;message('The current album could not be refreshed. Please reload to try again.');}
 }else{
  await Promise.all([...document.querySelectorAll<HTMLAnchorElement>('[data-gallery-album]')].map(async card=>{
   const response=await fetch(endpoint(card.dataset.galleryAlbum||''),{cache:'no-store',signal:AbortSignal.timeout(10000)});if(!response.ok)return;
   const album:AlbumState=await response.json();const photos=album.photos.filter(p=>publicImage(p.url));card.hidden=photos.length===0;
   const label=card.querySelector('[data-gallery-count]');if(label)label.textContent=`${photos.length} photos`;
   const cover=photos.find(p=>p.id===album.coverId)||photos[0],image=card.querySelector('img');if(image&&cover){image.src=cover.url;image.alt=cover.alt||album.title;}
  }));
 }
}
void initialize().catch(()=>{});
