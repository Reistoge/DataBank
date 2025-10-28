import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';


import { AuthProvider } from './contexts/auth.context';
import { CARD_ROUTES, ROUTES as CONSTANT_ROUTES } from './utils/constants';
import ProtectedRoute from './components/protectedRoute.component';
import AddAccount from './pages/AddAccount';
import AddCard from './pages/AddCard';
import Dashboard from './pages/Dashboard';
import DeleteAccount from './pages/DeleteAccount';
import DeleteCard from './pages/DeleteCard';
import Login from './pages/Login';
import Register from './pages/Register';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Default route  */}
            <Route
              path="/"
              element={<Navigate to={CONSTANT_ROUTES.REGISTER} replace />}
            />
            <Route path={CONSTANT_ROUTES.LOGIN} element={<Login />} />
            <Route path={CONSTANT_ROUTES.REGISTER} element={<Register />} />
            <Route
              path={CONSTANT_ROUTES.DASHBOARD}
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path={CONSTANT_ROUTES.ADD_ACCOUNT}
              element={
                <ProtectedRoute>
                  <AddAccount />
                </ProtectedRoute>
              }
            />
            <Route
              path={CONSTANT_ROUTES.DELETE_ACCOUNT}
              element={
                <ProtectedRoute>
                  <DeleteAccount />
                </ProtectedRoute>
              }
            />
            <Route
              path={CONSTANT_ROUTES.ADD_CARD}
              element={
                <ProtectedRoute>
                  <AddCard />
                </ProtectedRoute>
              }
            />
            <Route
              path={CONSTANT_ROUTES.DELETE_CARD}
              element={
                <ProtectedRoute>
                  <DeleteCard />
                </ProtectedRoute>
              }
            />

            <Route
              path="*"
              element={<Navigate to={CONSTANT_ROUTES.REGISTER} replace />}
            />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
