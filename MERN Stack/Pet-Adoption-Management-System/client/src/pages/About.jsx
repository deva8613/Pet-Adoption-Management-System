import React from 'react';

const About = () => {
  return (
    <div className="about-page section-padding">
      <div className="container max-w-lg text-center">
        <h1 className="mb-3">About PawHomes</h1>
        <p className="hero-description text-muted mb-5">
          PawHomes is a dedicated pet adoption management platform designed to connect verified animal shelters with loving adopters.
        </p>
      </div>

      <div className="container">
        <div className="grid grid-2 items-center mb-5">
          <div>
            <h2>Our Mission</h2>
            <p className="mt-3">
              We believe every pet deserves a safe, caring, and lifelong home. Our goal is to streamline the adoption workflow, removing barriers between animal rescues and compassionate pet parents.
            </p>
            <p className="mt-2">
              Through PawHomes, shelters manage pet profiles and application statuses effortlessly, while adopters can find healthy companions with transparency.
            </p>
          </div>
          <div>
            <img 
              src="https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=800&q=80" 
              alt="Shelter pets" 
              className="rounded-lg shadow"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
