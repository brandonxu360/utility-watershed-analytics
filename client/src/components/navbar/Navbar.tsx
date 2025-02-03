import './Navbar.css';
import { Link } from '@tanstack/react-router';

const Navbar = () => {
  return (
    <nav>
      <div className="navbar-left">
        <a href="/" className="logo">
          Utility Watershed Analytics
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
            <Link to="/about" activeProps={{ style: { color: 'cyan' } }}>
              About
            </Link>
          </li>
          <li>
            <Link to="/faq" activeProps={{ style: { color: 'cyan' } }}>
              FAQ
            </Link>
          </li>
          <li>
            <Link to="/documentation" activeProps={{ style: { color: 'cyan' } }}>
              Documentation
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