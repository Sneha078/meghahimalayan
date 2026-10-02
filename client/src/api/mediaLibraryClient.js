// Add these to your existing adminClient.js (same file that has
// getAdminProducts, updateProduct, etc.) — they reuse the same API_URL and
// handleResponse already defined there.

export const getMediaFolders = (path = '') =>
  fetch(`${API_URL}/admin/media/folders?path=${encodeURIComponent(path)}`, {
    credentials: 'include',
  }).then(handleResponse)

export const createMediaFolder = (path) =>
  fetch(`${API_URL}/admin/media/folders`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path }),
  }).then(handleResponse)

export const deleteMediaFolder = (path) =>
  fetch(`${API_URL}/admin/media/folders`, {
    method: 'DELETE',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path }),
  }).then(handleResponse)

export const getMediaAssets = (folder = '', cursor = '') => {
  const params = new URLSearchParams({ folder })
  if (cursor) params.set('cursor', cursor)
  return fetch(`${API_URL}/admin/media/assets?${params.toString()}`, {
    credentials: 'include',
  }).then(handleResponse)
}

export const uploadMediaAssets = (folder, images) =>
  fetch(`${API_URL}/admin/media/assets`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ folder, images }),
  }).then(handleResponse)

export const deleteMediaAsset = (publicId) =>
  fetch(`${API_URL}/admin/media/assets`, {
    method: 'DELETE',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ publicId }),
  }).then(handleResponse)

export const moveMediaAsset = (publicId, toFolder) =>
  fetch(`${API_URL}/admin/media/assets/move`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ publicId, toFolder }),
  }).then(handleResponse)