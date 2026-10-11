// lib/cartStorage.js
export function getCartKey(clientName) {
  return `cart_${clientName}`;
}

export function getAllCartItems(clientName) {
  if (!clientName) return [];
  const data = localStorage.getItem(getCartKey(clientName));
  return data ? JSON.parse(data) : [];
}

export function getCartItemById(clientName, itemId) {
  const allItems = getAllCartItems(clientName);
  return allItems.find(item => item.id === itemId);
}

export function saveCartItems(clientName, items) {
  if (!clientName) return;
  localStorage.setItem(getCartKey(clientName), JSON.stringify(items));
}

export function addToCart(clientName, item) {
  const currentItems = getAllCartItems(clientName);
  const existing = currentItems.find(i => i.id === item.id);
  if (existing) {
    existing.quantity += item.quantity;
  } else {
    currentItems.push(item);
  }
  saveCartItems(clientName, currentItems);
}

export function updateCartItemQuantity(clientName, itemId, delta) {
  const items = getAllCartItems(clientName).map(item =>
    item.id === itemId ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
  );
  saveCartItems(clientName, items);
}

export function removeCartItem(clientName, itemId) {
  const items = getAllCartItems(clientName).filter(item => item.id !== itemId);
  saveCartItems(clientName, items);
}

export function getCartCount(clientName) {
  return getAllCartItems(clientName).reduce((acc, item) => acc + item.quantity, 0);
}
