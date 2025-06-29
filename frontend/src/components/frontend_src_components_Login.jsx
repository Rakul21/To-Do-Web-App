import React from 'react';

function Login({ login }) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold mb-6 text-center">Todo App</h1>
        <button
          onClick={() => window.location.href = `${process.env.REACT_APP_API_URL}/auth/google`}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 w-full"
        >
          Sign in with Google
        </button>
      </div>
    </div>
  );
}

export default Login;