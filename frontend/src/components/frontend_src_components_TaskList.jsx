import React from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';

function TaskList({ tasks, token, socket }) {
  const handleUpdate = async (taskId, updates) => {
    try {
      const response = await axios.put(`${process.env.REACT_APP_API_URL}/api/tasks/${taskId}`, updates, {
        headers: { Authorization: `Bearer ${token}` },
      });
      socket.emit('taskUpdate', response.data);
      toast.success('Task updated!');
    } catch (error) {
      toast.error('Error updating task');
    }
  };

  const handleDelete = async (taskId) => {
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/api/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      socket.emit('taskUpdate', { _id: taskId, deleted: true });
      toast.success('Task deleted!');
    } catch (error) {
      toast.error('Error deleting task');
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {tasks.map((task) => (
        <div key={task._id} className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold">{task.title}</h3>
          <p className="text-gray-600">{task.description}</p>
          <p className="text-sm">Priority: {task.priority}</p>
          <p className="text-sm">Status: {task.status}</p>
          <p className="text-sm">Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'}</p>
          <p className="text-sm">Shared with: {task.sharedWith.join(', ') || 'None'}</p>
          <div className="flex mt-4">
            <button
              onClick={() => handleUpdate(task._id, { status: task.status === 'In Progress' ? 'Completed' : 'In Progress' })}
              className="px-3 py-1 bg-yellow-500 text-white rounded mr-2 hover:bg-yellow-600"
            >
              Toggle Status
            </button>
            <button
              onClick={() => handleDelete(task._id)}
              className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default TaskList;