import React, { useState, useRef } from 'react';
import '../css/Profile.css';

const initialProfile = {
  displayName: 'User',
  weight: '70',
  goal: '2000',
  diet: 'Vegetarian',
  avatar: 'https://images.unsplash.com/photo-1728577740843-5f29c7586afe?q=80&w=880&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
};

const bookmarkFolders = [
  {
    name: 'Healthy Recipes',
    recipes: [
      { title: 'Avocado Toast', image: 'https://images.unsplash.com/photo-1704545229893-4f1bb5ef16a1?q=80&w=764&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
      { title: 'Quinoa Salad', image: 'https://images.unsplash.com/photo-1623428187969-5da2dcea5ebf?q=80&w=764&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
      { title: 'Berry Smoothie', image: 'https://images.unsplash.com/photo-1494315153767-9c231f2dfe79?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
    ],
  },
  {
    name: 'Quick Meals',
    recipes: [
      { title: 'Egg Sandwich', image: 'https://images.unsplash.com/photo-1687102624999-2615998b3ee5?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
      { title: 'Chicken Wrap', image: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?q=80&w=764&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
    ],
  },
];

export default function Profile() {
  const [profile, setProfile] = useState(initialProfile);
  const [editing, setEditing] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [message, setMessage] = useState('');
  const fileInputRef = useRef();

  const handleEdit = (field) => {
    setEditing(field);
    setInputValue(profile[field]);
  };

  const handleSave = (field) => {
    setProfile({ ...profile, [field]: inputValue });
    setEditing(null);
    setMessage('Profile updated!');
    setTimeout(() => setMessage(''), 1500);
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
            <div className="profile-avatar-name">{profile.displayName}</div>
            <div className="profile-avatar-hint">Click avatar to change</div>
          </div>
        </div>
        {['displayName', 'weight', 'goal', 'diet'].map((field) => (
          <div key={field} className="profile-field-row">
            <strong className="profile-field-label">
              {field === 'displayName' ? 'Name' : field}
            </strong>
            {editing === field ? (
              <>
                <input
                  className="profile-field-input"
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  autoFocus
                />
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
        {message && <div className="profile-message">{message}</div>}
      </div>

      <h3 className="bookmark-title">Bookmark Folders</h3>
      <div className="bookmark-list">
        {bookmarkFolders.map(folder => (
          <div
            key={folder.name}
            onClick={() => handleFolderClick(folder.name)}
            className="bookmark-folder"
          >
            <div>
              <div className="bookmark-folder-name">{folder.name}</div>
              <div className="bookmark-recipes">
                {folder.recipes.slice(0, 3).map(recipe => (
                  <div key={recipe.title} className="bookmark-recipe-preview">
                    <img
                      src={recipe.image}
                      alt={recipe.title}
                      className="bookmark-recipe-img"
                    />
                    <div className="bookmark-recipe-title">
                      {recipe.title}
                    </div>
                  </div>
                ))}
                {folder.recipes.length > 3 && (
                  <div className="bookmark-more">
                    +{folder.recipes.length - 3} more
                  </div>
                )}
              </div>
            </div>
            <div className="bookmark-count">{folder.recipes.length} recipes</div>
          </div>
        ))}
      </div>
    </div>
  );
}