import React from 'react';

function FilterBar({ filters, setFilters }) {
  return (
    <div className="flex flex-col md:flex-row mb-6">
      <select
        value={filters.status}
        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
        className="p-2 border rounded mb-2 md:mb-0 md:mr-2"
      >
        <option value="">All Status</option>
        <option value="In Progress">In Progress</option>
        <option value="Completed">Completed</option>  
      </select>
      <select
        value={filters.priority}
        onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
        className="p-2 border rounded"
      >
        <option value="">All Priorities</option>
        <option value="Low">Low</option>
        <option value="Medium">Medium</option>
        <option value="High">High</option>
      </select>
    </div>
  );
}

export default FilterBar;