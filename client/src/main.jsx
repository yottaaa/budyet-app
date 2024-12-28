import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import store from "./store.js";
import { Provider } from "react-redux";
import "bootstrap/dist/css/bootstrap.min.css";
import "./index.css";
import App from "./App.jsx";
import HomeScreen from "./screens/HomeScreen.jsx";
import LoginScreen from "./screens/LoginScreen.jsx";
import RegisterScreen from "./screens/RegisterScreen.jsx";
import PrivateRoute from "./components/PrivateRoute.jsx";
import IncomeScreen from "./screens/IncomeScreen.jsx";
import ExpenseScreen from "./screens/ExpenseScreen.jsx";
import UserProfileScreen from "./screens/UserProfileScreen.jsx";
import NotFoundScreen from "./screens/NotFoundScreen.jsx";

createRoot(document.getElementById("root")).render(
  <Provider store={store}>
    <StrictMode>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />}>
            <Route index path="/login" element={<LoginScreen />} />
            <Route path="/register" element={<RegisterScreen />} />
            {/* Private Routes */}
            <Route path="" element={<PrivateRoute />}>
              <Route index path="/" element={<HomeScreen />} />
              <Route path="/income" element={<IncomeScreen />} />
              <Route path="/expense" element={<ExpenseScreen />} />
              <Route path="/profile" element={<UserProfileScreen />} />
            </Route>
            <Route path="*" element={<NotFoundScreen />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </StrictMode>
  </Provider>
);
