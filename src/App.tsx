import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useEffect } from "react";
import { AuthProvider, useAuth } from "./lib/AuthContext";
import { PresenceProvider } from "./lib/PresenceContext";
import { ShellLayout } from "./components/Shell";
import { Landing } from "./pages/Landing";
import { AuthPage } from "./pages/Auth";
import { Hub } from "./pages/Hub";
import { Friends } from "./pages/Friends";
import { Play } from "./pages/Play";
import { ProfilePage } from "./pages/Profile";
import { ChatPage } from "./pages/Chat";
import { PartyLobby, PartyRoomPage } from "./pages/Party";

function HomeGate() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/hub" replace />;
  return <Landing />;
}

/** Après logout : redirect SPA dans la même fenêtre (pas de reload). */
function SignOutRedirector() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  useEffect(() => {
    if (loading) return;
    if (!user && location.pathname !== "/" && location.pathname !== "/auth") {
      navigate("/", { replace: true });
    }
  }, [user, loading, navigate, location.pathname]);
  return null;
}

export default function App() {
  return (
    <AuthProvider>
      <PresenceProvider>
        <BrowserRouter>
          <div className="app-shell">
            <SignOutRedirector />
            <Routes>
              <Route element={<ShellLayout />}>
                <Route path="/" element={<HomeGate />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/hub" element={<Hub />} />
                <Route path="/friends" element={<Friends />} />
                <Route path="/chat" element={<ChatPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/party" element={<PartyLobby />} />
                <Route path="/party/:roomId" element={<PartyRoomPage />} />
                <Route path="/play/:gameId" element={<Play />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </div>
        </BrowserRouter>
      </PresenceProvider>
    </AuthProvider>
  );
}
