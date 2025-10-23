import { useState } from "react";
import { BrowserRouter } from "react-router";
import { AuthRoutes } from "./routes/AuthRoutes";
import { AppRoutes } from "./routes/AppRoutes";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  return <>{isAuthenticated ? <AppRoutes /> : <AuthRoutes />}</>;
}

export default App;
