export {};
const shop = 'roots-and-relics';
const storageKey = 'n3xra-cart-v1:' + shop;
const root = document.querySelector<HTMLElement>('[data-shop-catalog]')!;
const grid = root.querySelector<HTMLElement>('[data-items]')!;
const status = root.querySelector<HTMLElement>('[data-status]')!;
const empty = root.querySelector<HTMLElement>('[data-empty]')!;
const retry = root.querySelector<HTMLButtonElement>('[data-retry]')!;
const cartLink = root.querySelector<HTMLAnchorElement>('[data-cart]')!;
const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
interface Item { id: string; name: string; priceCents: number; available: boolean; photos?: {path: string; altText?: string}[] }
interface CartLine { itemId: string; quantity: number }
let cart: CartLine[] = [];
const returned = new URLSearchParams(location.search).get('checkout') === 'returned';
try {
  if (returned) sessionStorage.removeItem(storageKey);
  const saved = JSON.parse(sessionStorage.getItem(storageKey) || '[]');
  if (Array.isArray(saved) && saved.length <= 30 && saved.every(line => line && typeof line.itemId === 'string' && Number.isInteger(line.quantity) && line.quantity > 0 && line.quantity <= 1000)) cart = saved;
} catch { /* Cart links also work without local storage. */ }

function updateCartLink() {
  cartLink.href = '/checkout/#' + new URLSearchParams({cart: JSON.stringify(cart)});
  cartLink.textContent = 'View cart (' + cart.reduce((sum, line) => sum + line.quantity, 0) + ')';
}

function itemCard(item: Item, paymentsReady: boolean) {
  const card = document.createElement('article');
  const photo = item.photos?.[0];
  if (photo?.path) {
    const image = document.createElement('img');
    image.src = 'https://vdbjlgmbpykjblprqnak.supabase.co/storage/v1/object/public/website-assets-public/' + photo.path.split('/').map(encodeURIComponent).join('/');
    image.alt = photo.altText || item.name;
    image.loading = 'lazy';
    card.append(image);
  }
  const name = document.createElement('h3');
  name.textContent = item.name;
  const detail = document.createElement('p');
  detail.textContent = money.format(item.priceCents / 100) + (item.available ? ' · Local pickup' : ' · Sold out');
  card.append(name, detail);
  if (!item.available) return card;
  if (paymentsReady) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = 'Add to cart';
    button.addEventListener('click', () => {
      if (!cart.some(line => line.itemId === item.id)) {
        if (cart.length >= 30) { status.textContent = 'Your cart is full. Review it before adding another piece.'; return; }
        cart.push({ itemId: item.id, quantity: 1 });
      }
      try { sessionStorage.setItem(storageKey, JSON.stringify(cart)); } catch { /* The checkout link includes the cart. */ }
      updateCartLink();
      status.textContent = item.name + ' is in your cart.';
    });
    card.append(button);
  } else {
    const link = document.createElement('a');
    link.href = 'mailto:' + root.dataset.email + '?subject=' + encodeURIComponent('Pickup inquiry: ' + item.name);
    link.textContent = 'Ask about this piece';
    card.append(link);
  }
  return card;
}

async function load() {
  retry.hidden = empty.hidden = cartLink.hidden = true;
  status.textContent = 'Loading pieces…';
  grid.replaceChildren();
  try {
    const response = await fetch('https://www.n3xra.com/api/commerce-store-catalog?shop=' + shop, { credentials: 'omit', cache: 'no-store', signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw Error();
    const catalog = await response.json();
    if (catalog.organizationId !== '74b2226c-6d7d-4267-9f70-5fbe106a6816' || !Array.isArray(catalog.items)) throw Error();
    const paymentsReady = catalog.checkout?.enabled === true && catalog.checkout?.pickup === true;
    grid.replaceChildren(...catalog.items.map((item: Item) => itemCard(item, paymentsReady)));
    empty.hidden = catalog.items.length > 0;
    cartLink.hidden = !paymentsReady;
    updateCartLink();
    status.textContent = returned ? 'You have returned from checkout. Look for your payment confirmation.' : '';
  } catch {
    status.textContent = 'The shop could not load. Please try again.';
    retry.hidden = false;
  }
}
retry.addEventListener('click', load);
void load();
