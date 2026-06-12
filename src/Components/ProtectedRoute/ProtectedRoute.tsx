import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { auth } from "../../Backend/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { LoadingScreen } from "../LoadingScreen/LoadingScreen";

interface Props {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: Props) {
  const [status, setStatus] = useState<'loading' | 'auth' | 'unauth'>('loading');

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, user => {
      setStatus(user ? 'auth' : 'unauth');
    });
    return unsub;
  }, []);

  if (status === 'loading') return <LoadingScreen />;
  if (status === 'unauth') return <Navigate to="/login" replace />;
  return <>{children}</>;
}
