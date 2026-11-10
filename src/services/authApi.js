import apiClient from './apiClient';

const sendOtp = async (mobile) => {
  const response = await apiClient.post('/auth/otp/send', { mobile });
  return response.data;
};

const verifyOtp = async (mobile, code) => {
  const response = await apiClient.post('/auth/otp/verify', { mobile, code });
  return response.data;
};

const register = async (mobile, proof, password, fullName) => {
  const response = await apiClient.post('/auth/register', {
    mobile,
    verified_proof: proof,
    password,
    full_name: fullName,
  });
  return response.data;
};

const login = async (mobile, password) => {
  const response = await apiClient.post('/auth/login', { mobile, password });
  return response.data;
};

export { login, register, sendOtp, verifyOtp };
