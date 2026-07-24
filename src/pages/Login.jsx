import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginAdmin } from '../api/authApi';
import { Eye, EyeOff, MapPin, Compass, Camera, Send } from 'lucide-react';
import '../styles/login.css';

function getErrorMessage(apiError) {
  const backendMessage = apiError.response?.data?.message;

  if (Array.isArray(backendMessage)) {
    return backendMessage.join(', ');
  }

  if (typeof backendMessage === 'string') {
    return backendMessage;
  }

  if (backendMessage && typeof backendMessage === 'object') {
    return JSON.stringify(backendMessage);
  }

  return 'Something went wrong. Please try again.';
}

function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [toast, setToast] = useState({
    message: '',
    type: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!toast.message) {
      return;
    }

    const timer = setTimeout(() => {
      setToast({ message: '', type: '' });
    }, 5000);

    return () => clearTimeout(timer);
  }, [toast.message]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setToast({ message: '', type: '' });
    setIsLoading(true);

    try {
      const response = await loginAdmin(formData);
      const token =
        response.data.token ||
        response.data.accessToken ||
        response.data.access_token ||
        response.data.data?.token ||
        response.data.data?.accessToken;

      if (!token) {
        setToast({
          message: 'Login successful, but no token was returned.',
          type: 'error',
        });
        return;
      }

      localStorage.setItem('token', token);
      setToast({
        message: 'Login successful.',
        type: 'success',
      });

      navigate('/dashboard'); // Ab direct aur turant navigate hoga
    } catch (apiError) {
      console.log('LOGIN ERROR', apiError);
      console.log('RESPONSE', apiError.response);
      console.log('DATA', apiError.response?.data);

      setToast({
        message: getErrorMessage(apiError),
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      {toast.message && <div className={`toast-message ${toast.type}`}>{toast.message}</div>}

      <div className="login-bg-animations">
        <span className="bg-icon icon-1"><MapPin /></span>
        <span className="bg-icon icon-2"><Compass /></span>
        <span className="bg-icon icon-3"><Camera /></span>
        <span className="bg-icon icon-4"><Send /></span>
        <span className="bg-icon icon-5"><MapPin /></span>
        <div className="travel-route route-1"></div>
        <div className="travel-route route-2"></div>
        <div className="travel-route route-3"></div>
      </div>

      <div className="login-hero-content">
        <div className="login-logo">
          <span className="login-logo-mark">SB</span>
          <span>Street Buddy</span>
        </div>
        <h2>
          Discover <span>Every Corner</span> of the City
        </h2>
        <p>Manage cities, categories, and places from one powerful dashboard. Keep local discoveries organized, accurate, and accessible.</p>
      </div>

      <div className="login-form-container">
        <form className="login-form-card" onSubmit={handleSubmit}>

          <div className="login-form-panel">
            <div className="login-heading">
              <span className="login-logo-mark small">SB</span>
              <div>
                <h1>Street Buddy Admin</h1>
                <p>Login to manage cities, categories, and places.</p>
              </div>
            </div>
            <label>
              Email Address
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="admin@example.com"
                required
              />
            </label>

            <label>
              Password
              <div className="password-field">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter password"
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((currentValue) => !currentValue)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >{showPassword ? <EyeOff /> : <Eye />}</button>
              </div>
            </label>

            <button className="login-submit-button" type="submit" disabled={isLoading}>
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login;
