import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const withAuth = (WrappedComponent) => {
  const AuthComponent = (props) => {
    const navigate = useNavigate();

    const isAuthenticated = () => {
      return !!localStorage.getItem("token");
    };

    useEffect(() => {
      const urlParams = new URLSearchParams(window.location.search);
      const queryToken = urlParams.get("token");
      
      if (queryToken) {
        localStorage.setItem("token", queryToken);
        // Clear the token from the URL for security and cleanliness
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      if (!localStorage.getItem("token")) {
        navigate("/auth");
      }
    }, [navigate]);

    if (!isAuthenticated()) {
      return null;
    }

    return <WrappedComponent {...props} />;
  };

  return AuthComponent;
};

export default withAuth;