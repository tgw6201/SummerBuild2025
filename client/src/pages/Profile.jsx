import React, { useState, useEffect } from 'react';
import '../css/Profile.css';

const initialProfile = {
  name: '',
  phone_number: '',
  gender: '',
  weight: '',
  height: '',
  date_of_birth: '',
  goal: '',
  diet: '',
  profile_image: 'https://images.unsplash.com/photo-1728577740843-5f29c7586afe?q=80&w=880&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
};

export default function Profile() {
  const [profile, setProfile] = useState(initialProfile);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Helper function to format date for display (DD/MM/YYYY)
  const formatDateForDisplay = (dateString) => {
    if (!dateString) return 'Not set';
    
    try {
      const date = new Date(dateString);
      // Check if date is valid
      if (isNaN(date.getTime())) return dateString;
      
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      
      return `${day}/${month}/${year}`;
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString;
    }
  };

  // Helper function to format date for input (YYYY-MM-DD)
  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      
      return date.toISOString().split('T')[0];
    } catch (error) {
      console.error('Error formatting date for input:', error);
      return '';
    }
  };

  // Fetch profile data when component mounts
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError('');
        
        const response = await fetch('http://localhost:3000/profile', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          console.log('Profile data fetched successfully');
          // Parse the response data
          console.log('Response status:', response.status);
          console.log('Response headers:', response.headers);

          const profileData = await response.json();

          console.log('Response body:', profileData);
          
          // Convert profile_image byte array to data URL if it exists and is a byte array
          if (
            profileData.profile_image &&
            typeof profileData.profile_image === 'object' &&
            Array.isArray(profileData.profile_image.data) &&
            profileData.profile_image.data.length > 0 &&
            profileData.profile_image.contentType
          ) {
            const byteArray = new Uint8Array(profileData.profile_image.data);
            const blob = new Blob([byteArray], { type: profileData.profile_image.contentType });
            const url = URL.createObjectURL(blob);
            profileData.profile_image = url;
          } else {
            profileData.profile_image = initialProfile.profile_image;
          }
          console.log('Fetched profile image:', profileData.profile_image);
          
          setProfile(profileData);
        } else if (response.status === 401) {
          setError('Please log in to view your profile');
        } else {
          setError('Failed to load profile data');
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        setError('Network error. Please check your connection.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (field, value) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Helper function to get field display name
  const getFieldDisplayName = (field) => {
    const fieldNames = {
      name: 'Name',
      phone_number: 'Phone Number',
      gender: 'Gender',
      weight: 'Weight (kg)',
      height: 'Height (cm)',
      date_of_birth: 'Date of Birth',
      daily_calorie_goal: 'Daily Calorie Goal',
      dietary_preference: 'Diet Preference',
      allergies: 'Allergies'
    };
    return fieldNames[field] || field;
  };

  // Helper function to render input based on field type
  const renderInput = (field) => {
    if (field === 'gender') {
      return (
        <select
          className="profile-field-input"
          value={profile[field] || ''}
          onChange={e => handleChange(field, e.target.value)}
        >
          <option value="Male">Male</option>
          <option value="Female">Female</option>
        </select>
      );
    } else if (field === 'date_of_birth') {
      return (
        <input
          type="date"
          className="profile-field-input"
          value={formatDateForInput(profile[field])}
          onChange={e => handleChange(field, e.target.value)}
        />
      );
    } else if (field === 'phone_number') {
      return (
        <input
          type="tel"
          className="profile-field-input"
          value={profile[field] || ''}
          onChange={e => handleChange(field, e.target.value)}
          placeholder="e.g., +65 9123 4567"
        />
      );
    } else if (field === 'weight' || field === 'height' || field === 'daily_calorie_goal') {
      return (
        <input
          type="number"
          className="profile-field-input"
          value={profile[field] || ''}
          onChange={e => handleChange(field, e.target.value)}
          min="0"
        />
      );
    } else {
      return (
        <input
          type="text"
          className="profile-field-input"
          value={profile[field] || ''}
          onChange={e => handleChange(field, e.target.value)}
        />
      );
    }
  };

  const handleSaveAll = async () => {
    try {
      setMessage('Saving...');
      
      // Prepare the profile data to send
      const profileToSend = { ...profile };
      
      // If avatar is a data URL, convert it to byte array
      if (profile.profile_image && profile.profile_image.startsWith('data:')) {
        const response = await fetch(profile.profile_image);
        const blob = await response.blob();
        const arrayBuffer = await blob.arrayBuffer();
        const byteArray = new Uint8Array(arrayBuffer);

        profileToSend.profile_image = {
          data: Array.from(byteArray), // Convert to regular array for JSON
          contentType: blob.type
        };
      }
      
      const response = await fetch('http://localhost:3000/profile', {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileToSend),
      });

      console.log('Profile data to send:', profileToSend);
      if (response.ok) {
        setMessage('Profile saved successfully!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        const errorData = await response.json();
        setMessage(errorData.message || 'Failed to save profile');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      setMessage('Network error. Please try again.');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const reader = new FileReader();
        reader.onload = (ev) => {
          setProfile(prev => ({ ...prev, profile_image: ev.target.result }));
          setMessage('Profile picture updated!');
          setTimeout(() => setMessage(''), 1500);
        };
        reader.readAsDataURL(file);
      } catch (error) {
        console.error('Error processing image:', error);
        setMessage('Error updating profile picture');
        setTimeout(() => setMessage(''), 3000);
      }
    }
  };

// Add this input element somewhere in your JSX (hidden file input)
<input
  type="file"
  accept="image/*"
  id="avatar-upload"
  style={{ display: 'none' }}
  onChange={handleAvatarChange}
/>

  // Show loading state
  if (loading) {
    return (
      <div className="profile-container">
        <div className="profile-loading">
          <h2>Loading profile...</h2>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="profile-container">
        <div className="profile-error">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <h2 className="profile-title">Profile</h2>
      <div className="profile-card">
        <div className="profile-avatar-row">
          <div className="profile-avatar-wrapper">
            <label htmlFor="avatar-upload">
              <img
                src={profile.profile_image}
                alt="Avatar"
                className="profile-avatar"
                style={{ cursor: 'pointer' }}
              />
            </label>
            <input
              type="file"
              accept="image/*"
              id="avatar-upload"
              style={{ display: 'none' }}
              onChange={handleAvatarChange}
            />
          </div>
          <div>
            <div className="profile-avatar-name">{profile.name}</div>
            <div className="profile-avatar-hint">Click avatar to change</div>
          </div>
        </div>
        
        {/* Personal Information Section */}
        <div className="profile-section">
          <h3 className="profile-section-title">Personal Information</h3>
          {['name', 'phone_number', 'gender', 'date_of_birth'].map((field) => (
            <div key={field} className="profile-field-row">
              <strong className="profile-field-label">
                {getFieldDisplayName(field)}
              </strong>
              {renderInput(field)}
            </div>
          ))}
        </div>

        {/* Health & Fitness Section */}
        <div className="profile-section">
          <h3 className="profile-section-title">Health & Fitness</h3>
          {['weight', 'height', 'daily_calorie_goal', 'dietary_preference', 'allergies'].map((field) => (
            <div key={field} className="profile-field-row">
              <strong className="profile-field-label">
                {getFieldDisplayName(field)}
              </strong>
              {renderInput(field)}
            </div>
          ))}
        </div>

        <div className="profile-save-all-container">
          <button 
            onClick={handleSaveAll}
            className="profile-save-all-btn"
            disabled={Object.keys(profile).length === 0}
          >
            Save All Changes
          </button>
        </div>

        {message && <div className="profile-message">{message}</div>}
      </div>
    </div>
  );
}