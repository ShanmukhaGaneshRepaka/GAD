
import apiClient from '../../services/apiClient';

const clearUserData = () => {
  try {
    localStorage.removeItem('jwtToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('userType');
  } catch (error) {
    console.error('Error clearing user data:', error);
  }
};

const clearJWTToken = async () => {
  try {
    await apiClient.post('/applicant/applicantsignOut');
    clearUserData();
  } catch (error) {
    console.error('Error logging out:', error);
    throw new Error('Logout failed');
  }
};

export default clearJWTToken;
