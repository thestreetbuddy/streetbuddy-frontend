import { useEffect, useState } from 'react';
import { getAdminProfile, updateAdminProfile } from '../api/adminApi';
import { UserIcon } from '../components/AdminIcons.jsx';
import '../styles/profile.css';

const emptyForm = {
  name: '',
  email: '',
  password: '',
  profile_image: null,
};

function getProfileFromResponse(response) {
  return response.data.data.data;
}

function AdminProfile() {
  const [formData, setFormData] = useState(emptyForm);
  const [previewImage, setPreviewImage] = useState('');
  const [toast, setToast] = useState({ message: '', type: '' });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await getAdminProfile();
        const profile = getProfileFromResponse(response);

        setFormData({
          name: profile.name || '',
          email: profile.email || '',
          password: '',
          profile_image: null,
        });

        setPreviewImage(profile.profile_image || '');

        localStorage.setItem(
          'adminProfile',
          JSON.stringify({
            name: profile.name || 'Admin',
            email: profile.email || 'admin@example.com',
            profile_image: profile.profile_image || '',
          })
        );
      } catch (apiError) {
        setToast({
          message: apiError.response?.data?.message || 'Unable to load admin profile.',
          type: 'error',
        });
      }
    };

    loadProfile();
  }, []);

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
    const { name, value, checked, type, files } = event.target;

    if (name === 'profile_image') {
      const file = files[0];

      setFormData({ ...formData, profile_image: file });

      if (file) {
        setPreviewImage(URL.createObjectURL(file));
      }

      return;
    }

    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  // const buildProfileFormData = () => {
  //   const data = new FormData();

  //   data.append('name', formData.name);
  //   data.append('email', formData.email);
  //   data.append('show_password', formData.show_password);
  //   data.append('is_active', formData.is_active ? '1' : '0');

  //   if (formData.password) {
  //     data.append('password', formData.password);
  //   }

  //   if (formData.profile_image) {
  //     data.append('profile_image', formData.profile_image);
  //   }

  //   return data;
  // };

  const buildProfileFormData = () => {
    const data = new FormData();

    data.append('name', formData.name);
    data.append('email', formData.email);

    if (formData.password) {
      data.append('password', formData.password);
    }

    if (formData.profile_image) {
      data.append('profile_image', formData.profile_image);
    }

    return data;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setToast({ message: '', type: '' });

    try {
      const response = await updateAdminProfile(buildProfileFormData());
      const profile = getProfileFromResponse(response);

      localStorage.setItem(
        'adminProfile',
        JSON.stringify({
          name: profile.name || formData.name,
          email: profile.email || formData.email,
          profile_image: profile.profile_image || previewImage,
        })
      );

      setFormData({
        ...formData,
        password: '',
        profile_image: null,
      });
      setToast({ message: 'Profile updated successfully.', type: 'success' });
    } catch (apiError) {
      const backendMessage = apiError.response?.data?.message;
      const message = Array.isArray(backendMessage) ? backendMessage.join(', ') : backendMessage;

      setToast({
        message: message || 'Unable to update profile.',
        type: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="profile-page">
      {toast.message && <div className={`profile-toast ${toast.type}`}>{toast.message}</div>}

      <div className="profile-hero">
        <div className="profile-photo">
          {previewImage ? <img src={previewImage} alt="Admin profile" /> : <UserIcon />}
        </div>
        <div>
          <span>Admin Account</span>
          <h2>{formData.name || 'Admin Profile'}</h2>
          <p>{formData.email || 'Update profile details, password, and account image.'}</p>
        </div>
      </div>

      <form className="profile-form-card" onSubmit={handleSubmit}>
        <div className="profile-section-title">
          <h3>Profile Details</h3>
          <p>These details match your admins table fields.</p>
        </div>

        <div className="profile-form-grid">
          <label>
            Admin Name
            <input type="text" name="name" value={formData.name} onChange={handleChange} required />
          </label>

          <label>
            Email Address
            <input type="email" name="email" value={formData.email} onChange={handleChange} required />
          </label>

          <label>
            Profile Image
            <input type="file" name="profile_image" accept="image/*" onChange={handleChange} />
          </label>

        </div>

        <div className="profile-actions">
          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Update Profile'}
          </button>
        </div>
      </form>
    </section>
  );
}


export default AdminProfile;
