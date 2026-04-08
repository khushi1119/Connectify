import React from "react";
import { Link, useNavigate } from "react-router-dom";
export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="landingPageContainer">
      <nav>
        <div className="navHeader">
          <h2>Connectify</h2>
        </div>

        <div className="navList">
          <p
            onClick={() =>
              navigate(`/meeting/${Math.random().toString(36).substring(7)}`)
            }
          >
            Join as Guest
          </p>
          <p
            onClick={() => {
              navigate("/auth");
            }}
          >
            Register
          </p>

          <div
            onClick={() => {
              navigate("/auth");
            }}
            role="button"
          >
            <p>Login</p>
          </div>
        </div>
      </nav>

      <div className="landingMainContainer">
        <div>
          <h1>
            <span style={{ color: "#FF9839" }}>Connect</span> with your loved
            Ones
          </h1>

          <p>Cover a distance by Connectify</p>

          <div role="button">
            <Link to="/auth">Get Started</Link>
          </div>
        </div>

        <div>
          <img src="/mobile.png" alt="mobile preview" />
        </div>
      </div>
    </div>
  );
}
