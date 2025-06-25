import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/ChangePassword.css';

export default function ChangePassword() {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
  e.preventDefault();
  setMessage('');

  if (!oldPassword || !newPassword || !confirmPassword) {
    setMessage('Please fill in all fields.');
    return;
  }

  if (newPassword !== confirmPassword) {
    setMessage('New passwords do not match.');
    return;
  }

  try {
    const response = await fetch('http://localhost:3000/change-password', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        oldPassword,
        newPassword,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      setMessage(result.message || 'Failed to change password.');
      return;
    }

    setMessage('Password changed successfully!, redirecting to Chatbot...');
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');

    setTimeout(() => navigate('/Chatbot'), 2000);
  } catch (error) {
    console.error('Password change error:', error);
    setMessage('Network error. Please try again.');
  }
};


  return (
    <main className="form-signin text-center">
      <form onSubmit={handleSubmit}>
        <h1 className="title">RennyBot.co</h1>
        <h1 className="h3 mb-3 fw-normal">Change your password</h1>

        <div className="form-floating">
          <input
            type="password"
            className="form-control"
            id="oldPassword"
            placeholder="Old Password"
            value={oldPassword}
            onChange={e => setOldPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
          <label htmlFor="oldPassword">Old Password</label>
        </div>

        <div className="form-floating">
          <input
            type="password"
            className="form-control"
            id="newPassword"
            placeholder="New Password"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
          <label htmlFor="newPassword">New Password</label>
        </div>

        <div className="form-floating">
          <input
            type="password"
            className="form-control"
            id="confirmPassword"
            placeholder="Confirm New Password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
          <label htmlFor="confirmPassword">Confirm New Password</label>
        </div>

        {message && (
          <div style={{ color: "#e66a17", marginBottom: "1em" }}>{message}</div>
        )}

        <button className="btn btn-primary w-100 py-2" type="submit">
          Change Password
        </button>
      </form>
    </main>
  );
}