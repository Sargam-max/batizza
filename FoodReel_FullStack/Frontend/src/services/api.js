import axios from 'axios';

const api = axios.create({ baseURL: '/api', withCredentials: true });

// Auth
export const registerUser = (data) => api.post('/auth/user/register', data);
export const loginUser = (data) => api.post('/auth/user/login', data);
export const logoutUser = () => api.get('/auth/user/logout');
export const registerPartner = (data) => api.post('/auth/food-partner/register', data);
export const loginPartner = (data) => api.post('/auth/food-partner/login', data);
export const logoutPartner = () => api.get('/auth/food-partner/logout');

// Food
export const getFoodItems = () => api.get('/food');
export const createFood = (formData) => api.post('/food', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const getPartnerFoods = () => api.get('/food/partner');
export const toggleFoodAvailability = (foodId) => api.patch(`/food/partner/${foodId}/toggle`);

// Orders
export const placeOrder = (data) => api.post('/orders', data);
export const getUserOrders = () => api.get('/orders');
export const cancelOrder = (orderId) => api.delete(`/orders/${orderId}/cancel`);
export const validateCoupon = (data) => api.post('/orders/validate-coupon', data);
export const getActiveCoupons = () => api.get('/orders/coupons');
export const getPartnerOrders = (status) => api.get('/orders/partner', { params: status ? { status } : {} });
export const updateOrderStatus = (orderId, status) => api.patch(`/orders/partner/${orderId}/status`, { status });
export const createCoupon = (data) => api.post('/orders/partner/coupon', data);

// Payment (Razorpay)
export const createRazorpayOrder = (data) => api.post('/payment/razorpay/create', data);
export const verifyRazorpayPayment = (data) => api.post('/payment/razorpay/verify', data);

// Social
export const toggleLike = (foodId) => api.post(`/social/like/${foodId}`);
export const getBulkLikeStatus = (foodIds) => api.post('/social/likes/bulk', { foodIds });
export const postComment = (foodId, text) => api.post(`/social/comment/${foodId}`, { text });
export const getComments = (foodId, page = 1) => api.get(`/social/comment/${foodId}?page=${page}`);
export const deleteComment = (commentId) => api.delete(`/social/comment/${commentId}`);

// Stores
export const getAllStores = () => api.get('/stores');
export const getStore = (partnerId) => api.get(`/stores/${partnerId}`);

export default api;
