import { NavLink, Outlet, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

function navClass({ isActive }) {
  return `staff-nav-btn${isActive ? ' active' : ''}`;
}

export default function StaffAppLayout() {
  const { logout, staff } = useAuth();
  const navigate = useNavigate();
  const { courseCode } = useParams();

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  return (
    <div className="staff-layout">
      <aside className="staff-sidebar" aria-label="Staff navigation">
        <div className="staff-brand">
          <img src="/crunches_logo.png" alt="Staff Academy" className="staff-brand-logo" />
          <div className="staff-brand-text">
            <h1>Staff Academy</h1>
            <p>Staff training</p>
          </div>
        </div>
        <nav className="staff-nav">
          <ul>
            <li>
              <NavLink to="/app/courses" className={navClass} end>
                My courses
              </NavLink>
            </li>
            {courseCode ? (
              <li>
                <NavLink to={`/app/c/${courseCode}/topics`} className={navClass}>
                  Current course
                </NavLink>
              </li>
            ) : null}
            <li>
              <NavLink to="/app/profile" className={navClass}>
                Profile
              </NavLink>
            </li>
          </ul>
        </nav>
        <div className="staff-sidebar-footer">
          {staff?.fullName ? (
            <p className="staff-sidebar-user">{staff.fullName}</p>
          ) : staff?.staffId ? (
            <p className="staff-sidebar-user">ID: {staff.staffId}</p>
          ) : null}
          <button type="button" className="staff-nav-btn staff-nav-logout" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </aside>
      <main className="staff-main">
        <Outlet />
      </main>
    </div>
  );
}
