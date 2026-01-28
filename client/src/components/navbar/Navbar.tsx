import { Link } from '@tanstack/react-router';
import './Navbar.css';

const Navbar = () => {
  return (
    <nav>
      <div className="navbar-left">
        <a href="/" className="logo">
          FireWISE Watersheds 
        </a>
      </div>
      <div className="navbar-right">
        <ul>
          <li>
            <Link to="/" activeProps={{ style: { color: 'cyan' } }}>
              Home
            </Link>
          </li>
          <li>
            <Link to="/team" activeProps={{ style: { color: 'cyan' } }}>
              Team
            </Link>
          </li>
          <li>
            <Link to="/about" activeProps={{ style: { color: 'cyan' } }}>
              About
            </Link>
          </li>
          <li>
            <Link to="/login" activeProps={{ style: { color: 'cyan' } }}>
              Login
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;