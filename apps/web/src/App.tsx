import React, { useState, useEffect } from "react";
import { SpotList } from "./components/SpotList";
import { LoginForm } from "./components/LoginForm";
import { RegisterForm } from "./components/RegisterForm";

const App: React.FC = () => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [showRegister, setShowRegister] = useState(false);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    if (storedToken && storedUser) {
      setToken(storedToken);
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      console.log("App - Loaded user from localStorage:", parsedUser);

      // Optionally refresh user data from server to ensure role is up to date
      fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${storedToken}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.user) {
            console.log("App - Refreshed user from server:", data.user);
            setUser(data.user);
            localStorage.setItem("user", JSON.stringify(data.user));
          }
        })
        .catch((err) => {
          console.error("Failed to refresh user data:", err);
        });
    }
  }, []);

  const handleLogin = (newToken: string, newUser: any) => {
    setToken(newToken);
    setUser(newUser);
    setShowRegister(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    console.log('teste git')
  };

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", padding: "1.5rem", maxWidth: "1400px", margin: "0 auto" }}>
      <header style={{ marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", marginBottom: "0.25rem" }}>
            Tourism & Travel Explorer
          </h1>
          <p style={{ color: "#555" }}>
            Browse tourist spots powered by a Bun/Hono/Drizzle/Mongo/Redis stack.
          </p>
        </div>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          {user && (
            <span style={{ color: "#666" }}>
              Welcome, {user.login} ({user.role})
            </span>
          )}
          {token ? (
            <button
              onClick={handleLogout}
              style={{
                padding: "0.5rem 1rem",
                backgroundColor: "#d32f2f",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Logout
            </button>
          ) : (
            <button
              onClick={() => setShowRegister(!showRegister)}
              style={{
                padding: "0.5rem 1rem",
                backgroundColor: "#1976d2",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              {showRegister ? "Login" : "Register"}
            </button>
          )}
        </div>
      </header>

      {!token && (
        <div>
          {showRegister ? (
            <RegisterForm onRegister={handleLogin} onSwitchToLogin={() => setShowRegister(false)} />
          ) : (
            <LoginForm onLogin={handleLogin} onSwitchToRegister={() => setShowRegister(true)} />
          )}
        </div>
      )}

      {token && (
        <main>
          <SpotList token={token} user={user} />
        </main>
      )}
    </div>
  );
};

export default App;


