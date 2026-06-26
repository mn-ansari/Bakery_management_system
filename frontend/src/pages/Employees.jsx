import React from 'react';
import { Card } from '../components/Card';
import { Table } from '../components/Table';
import { Button } from '../components/Button';
import { FormGroup, Input, Select } from '../components/Form';
import { EmployeeService } from '../services/employeeService';
import styles from './Employees.module.css';

const Employees = () => {
  const [employees, setEmployees] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [showForm, setShowForm] = React.useState(false);
  const [formData, setFormData] = React.useState({
    name: '',
    role: '',
    join_date: new Date().toISOString().split('T')[0],
    monthly_salary: '',
    cnic: '',
    contact: '',
    status: 'active'
  });

  React.useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const response = await EmployeeService.getEmployees();
      setEmployees(response.data || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEmployee = async (e) => {
    e.preventDefault();
    try {
      await EmployeeService.createEmployee(formData);
      setFormData({
        name: '',
        role: '',
        join_date: new Date().toISOString().split('T')[0],
        monthly_salary: '',
        cnic: '',
        contact: '',
        status: 'active'
      });
      setShowForm(false);
      fetchEmployees();
    } catch (error) {
      console.error('Error creating employee:', error);
    }
  };

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'role', label: 'Role' },
    { key: 'join_date', label: 'Join Date' },
    { key: 'monthly_salary', label: 'Salary', render: (value) => `Rs. ${value}` },
    { key: 'contact', label: 'Contact' },
    { key: 'status', label: 'Status', render: (value) => (
      <span style={{ 
        padding: '4px 8px', 
        borderRadius: '4px',
        backgroundColor: value === 'active' ? '#d4edda' : '#f8d7da',
        color: value === 'active' ? '#155724' : '#721c24'
      }}>
        {value}
      </span>
    )}
  ];

  return (
    <div className={styles.employees}>
      <h1>Employee Management</h1>

      <div className={styles.header}>
        <h2>Employees</h2>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Add Employee'}
        </Button>
      </div>

      {showForm && (
        <Card title="Add New Employee">
          <form onSubmit={handleCreateEmployee} className={styles.form}>
            <div className={styles.formRow}>
              <FormGroup label="Full Name">
                <Input 
                  type="text"
                  placeholder="Employee name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </FormGroup>

              <FormGroup label="Role">
                <Input 
                  type="text"
                  placeholder="Baker, Manager, etc."
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  required
                />
              </FormGroup>
            </div>

            <div className={styles.formRow}>
              <FormGroup label="Join Date">
                <Input 
                  type="date"
                  value={formData.join_date}
                  onChange={(e) => setFormData({...formData, join_date: e.target.value})}
                  required
                />
              </FormGroup>

              <FormGroup label="Monthly Salary">
                <Input 
                  type="number"
                  placeholder="Salary amount"
                  value={formData.monthly_salary}
                  onChange={(e) => setFormData({...formData, monthly_salary: e.target.value})}
                  required
                />
              </FormGroup>
            </div>

            <div className={styles.formRow}>
              <FormGroup label="CNIC">
                <Input 
                  type="text"
                  placeholder="12345-1234567-1"
                  value={formData.cnic}
                  onChange={(e) => setFormData({...formData, cnic: e.target.value})}
                />
              </FormGroup>

              <FormGroup label="Contact">
                <Input 
                  type="text"
                  placeholder="03001234567"
                  value={formData.contact}
                  onChange={(e) => setFormData({...formData, contact: e.target.value})}
                  required
                />
              </FormGroup>
            </div>

            <FormGroup label="Status">
              <Select 
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
                options={[
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'Inactive' },
                  { value: 'on-leave', label: 'On Leave' }
                ]}
              />
            </FormGroup>

            <Button type="submit" disabled={loading}>
              {loading ? 'Adding...' : 'Add Employee'}
            </Button>
          </form>
        </Card>
      )}

      <Card title={`Team Members (${employees.length})`}>
        {loading ? (
          <p>Loading...</p>
        ) : employees.length > 0 ? (
          <Table columns={columns} data={employees} />
        ) : (
          <p>No employees yet.</p>
        )}
      </Card>
    </div>
  );
};

export default Employees;
