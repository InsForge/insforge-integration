import { Route, Routes } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { SignInPage, SignUpPage } from './pages/AuthPages';
import { DealsPage } from './pages/DealsPage';
import { RequireClerkAuth } from './routes/RequireClerkAuth';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/sign-in/*" element={<SignInPage />} />
      <Route path="/sign-up/*" element={<SignUpPage />} />
      <Route
        path="/app"
        element={
          <RequireClerkAuth>
            <DealsPage />
          </RequireClerkAuth>
        }
      />
    </Routes>
  );
}
