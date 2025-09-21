import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { isAdmin } from '../../utils/auth'; // you said you created this

type Props = { children: React.ReactElement };

const RequireAdmin: React.FC<Props> = ({ children }) => {
  const location = useLocation();

  // if not admin, boot them back to the home/tournament list
  if (!isAdmin()) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  return children;
};

export default RequireAdmin;
