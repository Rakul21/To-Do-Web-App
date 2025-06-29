import React, { useState } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';

function TaskForm({ token, socket }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'Low',
    status: 'In Progress',
    dueDate: '',
    shareEmail: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/tasks`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      socket.emit('taskUpdate', response.data);
      toast.success('Task created!');
      setFormData({ title: '', description: '', priority: 'Low', status: 'In Progress', dueDate: '', shareEmail: '' });
    } catch (error) {
      toast.error('Error creating task');
    }
  };

  const handleShare = async () => {
    try {
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/tasks/${tasks[0]?._id}/share`,
        { email: formData.shareEmail },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Task shared!');
      setFormData({ ...formData, shareEmail: '' });
    } catch (error) {
      toast.error('Error sharing task');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-lg mb-6">
      <h2 className="text-xl font-semibold mb-4">Create Task</h2>
      <input
        type="text"
        placeholder="Title"
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        className="w-full p-2 mb-4 border rounded"
        required
      />
      <textarea
        placeholder="Description"
        value={formData.description}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        className="w-full p-2 mb-4 border rounded"
      />
      <select
        value={formData.priority}
        onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
        className="w-full p-2 mb-4 border rounded"
      >
        <option value="Low">Low</option>
        <option value="Medium">Medium</option>
        <option value="High">High</option>
      </select>
      <select
        value={formData.status}
        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
        className="w-full p-2 mb-4 border rounded"
      >
        <option value="In Progress">In Progress</option>
        <option value="Completed">Completed</option>
      </select>
      <input
        type="date"
        value={formData.dueDate}
        onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
        className="w-full p-2 mb-4 border rounded"
      />
      <div className="flex mb-4">
        <input
          type="email"
          placeholder="Share with (email)"
          value={formData.shareEmail}
          onChange={(e) => setFormData({ ...formData, shareEmail: e.target.value })}
          className="w-full p-2 border rounded mr-2"
        />
        <button
          type="button"
          onClick={handleShare}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Share
        </button>
      </div>
      <button type="submit" className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600">
        Create Task
      </button>
    </form>
  );
}

export default TaskForm;