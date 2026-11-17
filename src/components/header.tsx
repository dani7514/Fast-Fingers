import { User } from 'firebase/auth';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { signInWithGoogle, signOut } from '../config/firebase.config';

export default function Header({ user }: { user?: User | null }) {
  const { pathname } = useLocation();
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <Link className="brand" to="/" aria-label="Fast Fingers home">
          <span className="brand-mark" aria-hidden="true">F<span>↗</span></span>
          <span>fast<span className="accent">fingers</span></span>
        </Link>
        <nav className="nav-tabs" aria-label="Typing modes">
          <NavLink to="/" end>Practice</NavLink>
          <NavLink to="/create" className={({ isActive }) =>
            isActive || /^\/(join|waiting|multiplayer)(\/|$)/.test(pathname) ? 'active' : undefined
          }>Multiplayer</NavLink>
        </nav>
        <div className="account">
          {user && <span className="account-avatar" aria-hidden="true">
            {user.photoURL ? <img src={user.photoURL} alt="" /> : (user.displayName || 'P')[0]}
          </span>}
          {user !== undefined && (
            <button type="button" className="button button-small" onClick={user ? signOut : signInWithGoogle}>
              {user ? 'Sign Out' : 'Sign in with Google'}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
