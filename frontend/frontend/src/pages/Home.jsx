import React from 'react';

const Home = ({ user }) => {
  return (
    <div className="home-container">
      <div className="welcome-banner">
        <h1>Welcome to ShopKart</h1>
        <p>Logged in as {user?.fullName}</p>
      </div>

      <div className="profile-card">
        <h2>Customer Profile</h2>
        <div className="profile-info">
          <p><strong>Full Name:</strong> {user?.fullName}</p>
          <p><strong>Email:</strong> {user?.email}</p>
          <p><strong>Phone Number:</strong> {user?.phone}</p>
        </div>
      </div>
    </div>
  );
};

export default Home;
