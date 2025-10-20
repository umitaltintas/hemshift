import React from 'react';
import { LoginForm } from '../components/Auth';

const Login: React.FC = () => {
  return (
    <div className="flex justify-center items-center min-h-screen">
      <LoginForm />
    </div>
  );
};

export default Login;