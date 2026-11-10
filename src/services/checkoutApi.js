import apiClient from './apiClient';

const validateDiscount = async (courseId, code) => {
  const response = await apiClient.post('/checkout/validate-discount', {
    course_id: courseId,
    code: code.trim().toUpperCase(),
  });
  return response.data;
};

const initiatePayment = async (courseId, discountCode = '') => {
  const payload = {
    course_id: courseId,
  };
  if (discountCode && discountCode.trim() !== '') {
    payload.discount_code = discountCode.trim().toUpperCase();
  }

  const response = await apiClient.post('/checkout/pay', payload);
  const data = response.data || {};
  return {
    ...data,
    redirect_url: data.redirect_url || data.payment_url || '',
  };
};

export { initiatePayment, validateDiscount };
