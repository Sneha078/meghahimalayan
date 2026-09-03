const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'

async function handleResponse(res) {
    const data = await res.json().catch(() => ({}))
    if(!res.ok) throw new Error(data.message || 'Something went wrong')
        return data
}

export const getDashboardStats  = () =>
  fetch(`${API_URL}/admin/dashboard`, { credentials: 'include' }).then(handleResponse)

export const getAnalytics = () =>
  fetch(`${API_URL}/admin/analytics`, { credentials: 'include' }).then(handleResponse)

export const getTopCustomers    = () =>
  fetch(`${API_URL}/admin/customers/top`, { credentials: 'include' }).then(handleResponse)

export const getAllOrders = () =>
  fetch(`${API_URL}/admin/orders`, { credentials: 'include' }).then(handleResponse)

export const getAdminOrder = (id) =>
  fetch(`${API_URL}/admin/order/${id}`, { credentials: 'include' }).then(handleResponse)

export const updateOrderStatus = (id, status) =>
  fetch(`${API_URL}/admin/order/${id}`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  }).then(handleResponse)

export const deleteOrder = (id) =>
  fetch(`${API_URL}/admin/order/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  }).then(handleResponse)

export const getAdminProducts = () =>
  fetch(`${API_URL}/admin/products`, { credentials: 'include' }).then(handleResponse)

export const createProduct = (productData) =>
  fetch(`${API_URL}/admin/product/create`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(productData),
  }).then(handleResponse)
  
export const updateProduct = (id, productData) =>
    fetch(`${API_URL}/admin/product/${id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
    }).then(handleResponse)

export const deleteProduct = (id) =>
    fetch(`${API_URL}/admin/product/${id}`, {
        method: 'DELETE',
        credentials: 'include',
    }).then(handleResponse)

export const getUsers = () =>
    fetch(`${API_URL}/admin/users`,{credentials: 'include' }).then(handleResponse)

export const getSingleUser =(id) =>
    fetch(`${API_URL}/admin/user/${id}`, {credentials:'include'}).then(handleResponse)

export const updateUserRole = (id, role) =>
  fetch(`${API_URL}/admin/user/${id}`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role }),
  }).then(handleResponse)

export const deleteUser = (id) =>
  fetch(`${API_URL}/admin/user/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  }).then(handleResponse)

export const getCoupons = () =>
  fetch(`${API_URL}/admin/coupons`, { credentials: 'include' }).then(handleResponse)

export const createCoupon = (couponData) =>
  fetch(`${API_URL}/admin/coupons`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(couponData),
  }).then(handleResponse)

export const updateCoupon = (id, couponData) =>
  fetch(`${API_URL}/admin/coupon/${id}`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(couponData),
  }).then(handleResponse)

export const deleteCoupon = (id) =>
  fetch(`${API_URL}/admin/coupon/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  }).then(handleResponse)


export const getMessages = () =>
  fetch(`${API_URL}/admin/messages`, { credentials: 'include' }).then(handleResponse)

export const updateMessageStatus = (id, status) =>
  fetch(`${API_URL}/admin/message/${id}`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  }).then(handleResponse)

export const deleteMessage = (id) =>
  fetch(`${API_URL}/admin/message/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  }).then(handleResponse)