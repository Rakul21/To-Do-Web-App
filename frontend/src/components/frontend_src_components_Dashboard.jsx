import React, { useState, useEffect } from 'react';
import TaskForm from './TaskForm';
import TaskList from './TaskList';
import FilterBar from './FilterBar';
import axios from 'axios';

function Dashboard({ token, socket }) {
  const [tasks, setTasks] = useState([]);
  const [filters, setFilters] = useState({ status: '', priority: '' });
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchTasks();
    socket.on('taskUpdate', (task) => {
      if (task.deleted) {
        setTasks((prev) => prev.filter((t) => t._id !== task._id));
      } else {
        setTasks((prev) => {
          const existing = prev.find((t) => t._id === task._id);
          if (existing) {
            return prev.map((t) => (t._id === task._id ? task : t));
          }
          return [task, ...prev];
        });
      }
    });
    return () => socket.off('taskUpdate');
  }, [socket, filters, page]);

  const fetchTasks = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/tasks`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { ...filters, page },
      });
      setTasks(response.data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Todo Dashboard</h1>
      <FilterBar filters={filters} setFilters={setFilters} />
      <TaskForm token={token} socket={socket} />
      <TaskList tasks={tasks} token={token} socket={socket} />
      <div className="flex justify-center mt-4">
        <button
          onClick={() => setPage((prev) => prev - 1)}
          disabled={page === 1}
          className="px-4 py-2 bg-blue-500 text-white rounded mr-2 disabled:bg-gray-300"
        >
          Previous
        </button>
        <button
          onClick={() => setPage((prev) => prev + 1)}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default Dashboard;