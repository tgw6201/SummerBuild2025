import React, { useState, useRef, useEffect } from 'react';
import '../css/Profile.css';

const initialProfile = {
  name: 'User',
  phone_number: '61234567',
  gender: 'Male',
  weight: '70',
  height: '170',
  date_of_birth: '7/8/2000',
  goal: '2000',
  diet: 'Vegetarian',
  avatar: 'https://images.unsplash.com/photo-1728577740843-5f29c7586afe?q=80&w=880&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
};

export default function Profile() {
  const [profile, setProfile] = useState(initialProfile);
  const [editing, setEditing] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const fileInputRef = useRef();

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
          credentials: 'include', // Include cookies for authentication
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const profileData = await response.json();
          console.log('Profile data:', profileData);
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
  }, []); // Empty dependency array means this runs once when component mounts

  const handleEdit = (field) => {
    setEditing(field);
    if (field === 'date_of_birth') {
      setInputValue(formatDateForInput(profile[field]));
    } else {
      setInputValue(profile[field]);
    }
  };

  const handleSave = async (field) => {
    try {
      // Optional: Send update to server
      const response = await fetch('http://localhost:3000/profile', {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          [field]: inputValue
        }),
      });

      if (response.ok) {
        setProfile({ ...profile, [field]: inputValue });
        setEditing(null);
        setMessage('Profile updated!');
        setTimeout(() => setMessage(''), 1500);
      } else {
        setMessage('Failed to update profile');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage('Network error. Changes not saved.');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current.click();
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setProfile(prev => ({ ...prev, avatar: ev.target.result }));
        setMessage('Profile picture updated!');
        setTimeout(() => setMessage(''), 1500);
      };
      reader.readAsDataURL(file);
    }
  };

  // Simulate navigation (replace with your router logic)
  const handleFolderClick = (folderName) => {
    alert(`Navigate to folder: ${folderName}`);
    // e.g. navigate(`/bookmarks/${folderName}`)
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
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          autoFocus
        >
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Non-binary">Non-binary</option>
          <option value="Prefer not to say">Prefer not to say</option>
        </select>
      );
    } else if (field === 'date_of_birth') {
      return (
        <input
          type="date"
          className="profile-field-input"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          autoFocus
        />
      );
    } else if (field === 'phone_number') {
      return (
        <input
          type="tel"
          className="profile-field-input"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          placeholder="e.g., +65 9123 4567"
          autoFocus
        />
      );
    } else if (field === 'weight' || field === 'height' || field === 'goal') {
      return (
        <input
          type="number"
          className="profile-field-input"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          min="0"
          autoFocus
        />
      );
    } else {
      return (
        <input
          type="text"
          className="profile-field-input"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          autoFocus
        />
      );
    }
  };

  // Helper function to display field value
  const getDisplayValue = (field, value) => {
    if (field === 'date_of_birth') {
      return formatDateForDisplay(value);
    }
    return value || 'Not set';
  };

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
            <img
              src={profile.avatar}
              alt="Avatar"
              className="profile-avatar"
              onClick={handleAvatarClick}
              title="Click to change profile picture"
            />
            <button
              type="button"
              className="profile-edit-avatar-btn"
              onClick={handleAvatarClick}
              title="Edit profile picture"
            >
              ✏️
            </button>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
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
              {editing === field ? (
                <>
                  {renderInput(field)}
                  <button onClick={() => handleSave(field)} className="profile-action-btn">💾</button>
                  <button onClick={() => setEditing(null)} className="profile-action-btn">✖️</button>
                </>
              ) : (
                <>
                  <span style={{ flex: 1 }}>
                    {getDisplayValue(field, profile[field])}
                  </span>
                  <button
                    onClick={() => handleEdit(field)}
                    className="profile-edit-btn"
                    title="Edit"
                  >
                    ✏️
                  </button>
                </>
              )}
            </div>
          ))}
        </div>

        {/* Health & Fitness Section */}
        <div className="profile-section">
          <h3 className="profile-section-title">Health & Fitness</h3>
          {['weight', 'height', 'daily_calorie_goal', 'dietary_preference','allergies'].map((field) => (
            <div key={field} className="profile-field-row">
              <strong className="profile-field-label">
                {getFieldDisplayName(field)}
              </strong>
              {editing === field ? (
                <>
                  {renderInput(field)}
                  <button onClick={() => handleSave(field)} className="profile-action-btn">💾</button>
                  <button onClick={() => setEditing(null)} className="profile-action-btn">✖️</button>
                </>
              ) : (
                <>
                  <span style={{ flex: 1 }}>{profile[field]}</span>
                  <button
                    onClick={() => handleEdit(field)}
                    className="profile-edit-btn"
                    title="Edit"
                  >
                    ✏️
                  </button>
                </>
              )}
            </div>
          ))}
        </div>

        {message && <div className="profile-message">{message}</div>}
      </div>
    </div>
  );
}