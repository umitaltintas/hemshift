
import React from 'react';
import { useForm } from 'react-hook-form';

const LoginForm: React.FC = () => {
  const { register, handleSubmit } = useForm();

  const onSubmit = (data: any) => {
    console.log(data);
    // Will be implemented later
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-4">
      <h3 className="text-xl font-bold">Giriş Yap</h3>
      <div className="mt-2">
        <input
          {...register('email')}
          type="email"
          placeholder="Email"
          className="p-2 border rounded"
        />
      </div>
      <div className="mt-2">
        <input
          {...register('password')}
          type="password"
          placeholder="Parola"
          className="p-2 border rounded"
        />
      </div>
      <button type="submit" className="mt-2 px-4 py-2 bg-blue-500 text-white rounded">
        Giriş
      </button>
    </form>
  );
};

export default LoginForm;
