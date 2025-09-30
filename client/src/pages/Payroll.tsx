import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription 
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Users, 
  DollarSign, 
  Calendar, 
  TrendingUp, 
  Search, 
  Filter,
  Download,
  Upload,
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  Calculator,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  SortAsc,
  RefreshCw,
  Settings,
  Plus,
  Edit,
  X,
  ArrowLeft
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

interface Employee {
  id: number;
  employeeId: string;
  name: string;
  email: string;
  department: string;
  position: string;
  hireDate: string;
  salary: number;
  payrollType: 'monthly' | 'hourly';
  status: 'active' | 'inactive';
  bankAccount: string;
  taxId: string;
}

interface PayrollRecord {
  id: number;
  employeeId: number;
  employeeName: string;
  payPeriod: string;
  basicSalary: number;
  overtime: number;
  bonuses: number;
  deductions: number;
  taxes: number;
  netPay: number;
  status: 'draft' | 'approved' | 'paid';
  payDate: string;
}

interface Attendance {
  id: number;
  employeeId: number;
  employeeName: string;
  date: string;
  checkIn: string;
  checkOut: string;
  hoursWorked: number;
  overtime: number;
  status: 'present' | 'absent' | 'late' | 'half-day';
}

const Payroll = () => {
  const [activeTab, setActiveTab] = useState('employees');
  const [isEmployeeDialogOpen, setIsEmployeeDialogOpen] = useState(false);
  const [isPayrollDialogOpen, setIsPayrollDialogOpen] = useState(false);
  const [isAttendanceDialogOpen, setIsAttendanceDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedPayroll, setSelectedPayroll] = useState<PayrollRecord | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [isConfigEmployeesDialogOpen, setIsConfigEmployeesDialogOpen] = useState(false);
  const [isConfigPayrollDialogOpen, setIsConfigPayrollDialogOpen] = useState(false);
  const [isConfigAttendanceDialogOpen, setIsConfigAttendanceDialogOpen] = useState(false);
  const [isGeneralSettingsDialogOpen, setIsGeneralSettingsDialogOpen] = useState(false);
  
  // Department management state
  const [departments, setDepartments] = useState([
    'Production',
    'Quality Control', 
    'Sales',
    'Accounting'
  ]);
  const [newDepartment, setNewDepartment] = useState('');
  const [editingDepartment, setEditingDepartment] = useState<number | null>(null);
  const [editDepartmentValue, setEditDepartmentValue] = useState('');

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Department management functions
  const addDepartment = () => {
    if (newDepartment.trim() && !departments.includes(newDepartment.trim())) {
      setDepartments([...departments, newDepartment.trim()]);
      setNewDepartment('');
      toast({
        title: "Department Added",
        description: `${newDepartment.trim()} has been added to the departments list.`,
      });
    }
  };

  const startEditDepartment = (index: number) => {
    setEditingDepartment(index);
    setEditDepartmentValue(departments[index]);
  };

  const saveEditDepartment = () => {
    if (editingDepartment !== null && editDepartmentValue.trim()) {
      const updatedDepartments = [...departments];
      updatedDepartments[editingDepartment] = editDepartmentValue.trim();
      setDepartments(updatedDepartments);
      setEditingDepartment(null);
      setEditDepartmentValue('');
      toast({
        title: "Department Updated",
        description: "Department name has been updated successfully.",
      });
    }
  };

  const cancelEditDepartment = () => {
    setEditingDepartment(null);
    setEditDepartmentValue('');
  };

  const removeDepartment = (index: number) => {
    const departmentName = departments[index];
    const updatedDepartments = departments.filter((_, i) => i !== index);
    setDepartments(updatedDepartments);
    toast({
      title: "Department Removed",
      description: `${departmentName} has been removed from the departments list.`,
    });
  };

  // Mock data - in real implementation, this would come from API
  const employees: Employee[] = [
    {
      id: 1,
      employeeId: 'EMP001',
      name: 'Ahmed Hassan',
      email: 'ahmed.hassan@pharma.com',
      department: 'Production',
      position: 'Chemical Engineer',
      hireDate: '2023-01-15',
      salary: 8500,
      payrollType: 'monthly',
      status: 'active',
      bankAccount: '12345678901234',
      taxId: '123-45-6789'
    },
    {
      id: 2,
      employeeId: 'EMP002',
      name: 'Fatima Al-Zahra',
      email: 'fatima.alzahra@pharma.com',
      department: 'Quality Control',
      position: 'Lab Technician',
      hireDate: '2023-03-20',
      salary: 6500,
      payrollType: 'monthly',
      status: 'active',
      bankAccount: '98765432109876',
      taxId: '987-65-4321'
    },
    {
      id: 3,
      employeeId: 'EMP003',
      name: 'Omar Mahmoud',
      email: 'omar.mahmoud@pharma.com',
      department: 'Sales',
      position: 'Sales Manager',
      hireDate: '2022-11-10',
      salary: 12000,
      payrollType: 'monthly',
      status: 'active',
      bankAccount: '11223344556677',
      taxId: '111-22-3344'
    },
    {
      id: 4,
      employeeId: 'EMP004',
      name: 'Nour Abdel Rahman',
      email: 'nour.abdel@pharma.com',
      department: 'Accounting',
      position: 'Financial Analyst',
      hireDate: '2023-05-01',
      salary: 7500,
      payrollType: 'monthly',
      status: 'active',
      bankAccount: '55667788990011',
      taxId: '555-66-7788'
    }
  ];

  const payrollRecords: PayrollRecord[] = [
    {
      id: 1,
      employeeId: 1,
      employeeName: 'Ahmed Hassan',
      payPeriod: '2024-01',
      basicSalary: 8500,
      overtime: 450,
      bonuses: 1000,
      deductions: 200,
      taxes: 1275,
      netPay: 8475,
      status: 'paid',
      payDate: '2024-01-31'
    },
    {
      id: 2,
      employeeId: 2,
      employeeName: 'Fatima Al-Zahra',
      payPeriod: '2024-01',
      basicSalary: 6500,
      overtime: 0,
      bonuses: 500,
      deductions: 150,
      taxes: 975,
      netPay: 5875,
      status: 'paid',
      payDate: '2024-01-31'
    },
    {
      id: 3,
      employeeId: 3,
      employeeName: 'Omar Mahmoud',
      payPeriod: '2024-01',
      basicSalary: 12000,
      overtime: 600,
      bonuses: 2000,
      deductions: 300,
      taxes: 1800,
      netPay: 12500,
      status: 'approved',
      payDate: '2024-02-01'
    },
    {
      id: 4,
      employeeId: 4,
      employeeName: 'Nour Abdel Rahman',
      payPeriod: '2024-01',
      basicSalary: 7500,
      overtime: 200,
      bonuses: 750,
      deductions: 100,
      taxes: 1125,
      netPay: 7225,
      status: 'draft',
      payDate: ''
    }
  ];

  const attendanceRecords: Attendance[] = [
    {
      id: 1,
      employeeId: 1,
      employeeName: 'Ahmed Hassan',
      date: '2024-01-15',
      checkIn: '08:00',
      checkOut: '17:30',
      hoursWorked: 8.5,
      overtime: 0.5,
      status: 'present'
    },
    {
      id: 2,
      employeeId: 2,
      employeeName: 'Fatima Al-Zahra',
      date: '2024-01-15',
      checkIn: '08:15',
      checkOut: '17:00',
      hoursWorked: 8,
      overtime: 0,
      status: 'late'
    },
    {
      id: 3,
      employeeId: 3,
      employeeName: 'Omar Mahmoud',
      date: '2024-01-15',
      checkIn: '09:00',
      checkOut: '18:00',
      hoursWorked: 8,
      overtime: 0,
      status: 'present'
    }
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-EG', {
      style: 'currency',
      currency: 'EGP'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-EG');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'paid':
      case 'present':
        return 'bg-green-100 text-green-800';
      case 'approved':
      case 'late':
        return 'bg-yellow-100 text-yellow-800';
      case 'draft':
      case 'inactive':
      case 'absent':
        return 'bg-gray-100 text-gray-800';
      case 'half-day':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleAddEmployee = () => {
    setSelectedEmployee(null);
    setIsEmployeeDialogOpen(true);
  };

  const handleEditEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsEmployeeDialogOpen(true);
  };

  const handleProcessPayroll = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsPayrollDialogOpen(true);
  };

  const handleViewPayroll = (payroll: PayrollRecord) => {
    setSelectedPayroll(payroll);
    setIsPayrollDialogOpen(true);
  };

  const handleConfigureEmployees = () => {
    setIsConfigEmployeesDialogOpen(true);
  };

  const handleConfigurePayroll = () => {
    setIsConfigPayrollDialogOpen(true);
  };

  const handleConfigureAttendance = () => {
    setIsConfigAttendanceDialogOpen(true);
  };

  const handleGeneralSettings = () => {
    setIsGeneralSettingsDialogOpen(true);
  };

  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.department.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || employee.status === filterStatus;
    const matchesDepartment = filterDepartment === 'all' || employee.department === filterDepartment;
    
    return matchesSearch && matchesStatus && matchesDepartment;
  });

  const totalSalaryExpense = payrollRecords.reduce((sum, record) => sum + record.netPay, 0);
  const totalEmployees = employees.length;
  const activeEmployees = employees.filter(emp => emp.status === 'active').length;
  const pendingPayrolls = payrollRecords.filter(record => record.status === 'draft').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="absolute inset-0 bg-grid-pattern opacity-40"></div>
      
      <div className="relative p-6 space-y-6">
        {/* Back Button */}
        <div className="mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.history.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Payroll Management</h1>
            <p className="text-gray-600 mt-1">Comprehensive employee payroll and attendance tracking</p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              onClick={handleAddEmployee}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Employee
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <Settings className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleConfigureEmployees}>
                  <Users className="h-4 w-4 mr-2" />
                  Configure Employees
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleConfigurePayroll}>
                  <Calculator className="h-4 w-4 mr-2" />
                  Configure Payroll Records
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleConfigureAttendance}>
                  <Clock className="h-4 w-4 mr-2" />
                  Configure Attendance Pages
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleGeneralSettings}>
                  <Settings className="h-4 w-4 mr-2" />
                  General Settings
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Upload className="h-4 w-4 mr-2" />
                  Import Employees
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Calculator className="h-4 w-4 mr-2" />
                  Bulk Payroll
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Reports
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Calendar className="h-4 w-4 mr-2" />
                  Payroll Calendar
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Filter className="h-4 w-4 mr-2" />
                  Advanced Filters
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="glass-card border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Employees</p>
                  <p className="text-2xl font-bold text-gray-900">{totalEmployees}</p>
                  <p className="text-xs text-green-600 mt-1">{activeEmployees} active</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Monthly Payroll</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalSalaryExpense)}</p>
                  <p className="text-xs text-green-600 mt-1">+12% from last month</p>
                </div>
                <div className="bg-green-100 p-3 rounded-lg">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Payrolls</p>
                  <p className="text-2xl font-bold text-gray-900">{pendingPayrolls}</p>
                  <p className="text-xs text-orange-600 mt-1">Requires processing</p>
                </div>
                <div className="bg-orange-100 p-3 rounded-lg">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Attendance Rate</p>
                  <p className="text-2xl font-bold text-gray-900">98.5%</p>
                  <p className="text-xs text-green-600 mt-1">Excellent performance</p>
                </div>
                <div className="bg-purple-100 p-3 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Card className="glass-card border-0 shadow-lg">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <CardHeader>
              <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:grid-cols-3">
                <TabsTrigger value="employees">Employees</TabsTrigger>
                <TabsTrigger value="payroll">Payroll Records</TabsTrigger>
                <TabsTrigger value="attendance">Attendance</TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent>
              {/* Filters */}
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search employees, ID, or department..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Filter by department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    <SelectItem value="Production">Production</SelectItem>
                    <SelectItem value="Quality Control">Quality Control</SelectItem>
                    <SelectItem value="Sales">Sales</SelectItem>
                    <SelectItem value="Accounting">Accounting</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Employees Tab */}
              <TabsContent value="employees">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50">
                        <th className="px-4 py-3 text-left font-medium text-gray-500">Employee</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-500">ID</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-500">Department</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-500">Position</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-500">Salary</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-500">Status</th>
                        <th className="px-4 py-3 text-right font-medium text-gray-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEmployees.map((employee) => (
                        <tr key={employee.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div>
                              <div className="font-medium text-gray-900">{employee.name}</div>
                              <div className="text-gray-500 text-xs">{employee.email}</div>
                            </div>
                          </td>
                          <td className="px-4 py-3 font-mono text-xs">{employee.employeeId}</td>
                          <td className="px-4 py-3">{employee.department}</td>
                          <td className="px-4 py-3">{employee.position}</td>
                          <td className="px-4 py-3 font-medium">{formatCurrency(employee.salary)}</td>
                          <td className="px-4 py-3">
                            <Badge className={getStatusColor(employee.status)}>
                              {employee.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditEmployee(employee)}>
                                  <Pencil className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleProcessPayroll(employee)}>
                                  <Calculator className="h-4 w-4 mr-2" />
                                  Process Payroll
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-600">
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TabsContent>

              {/* Payroll Records Tab */}
              <TabsContent value="payroll">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50">
                        <th className="px-4 py-3 text-left font-medium text-gray-500">Employee</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-500">Pay Period</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-500">Basic Salary</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-500">Overtime</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-500">Bonuses</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-500">Deductions</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-500">Net Pay</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-500">Status</th>
                        <th className="px-4 py-3 text-right font-medium text-gray-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payrollRecords.map((record) => (
                        <tr key={record.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium">{record.employeeName}</td>
                          <td className="px-4 py-3">{record.payPeriod}</td>
                          <td className="px-4 py-3">{formatCurrency(record.basicSalary)}</td>
                          <td className="px-4 py-3">{formatCurrency(record.overtime)}</td>
                          <td className="px-4 py-3">{formatCurrency(record.bonuses)}</td>
                          <td className="px-4 py-3">{formatCurrency(record.deductions)}</td>
                          <td className="px-4 py-3 font-bold text-green-600">{formatCurrency(record.netPay)}</td>
                          <td className="px-4 py-3">
                            <Badge className={getStatusColor(record.status)}>
                              {record.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleViewPayroll(record)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <FileText className="h-4 w-4 mr-2" />
                                  Generate Slip
                                </DropdownMenuItem>
                                {record.status === 'draft' && (
                                  <DropdownMenuItem>
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Approve
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TabsContent>

              {/* Attendance Tab */}
              <TabsContent value="attendance">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50">
                        <th className="px-4 py-3 text-left font-medium text-gray-500">Employee</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-500">Date</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-500">Check In</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-500">Check Out</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-500">Hours Worked</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-500">Overtime</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-500">Status</th>
                        <th className="px-4 py-3 text-right font-medium text-gray-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendanceRecords.map((record) => (
                        <tr key={record.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium">{record.employeeName}</td>
                          <td className="px-4 py-3">{formatDate(record.date)}</td>
                          <td className="px-4 py-3">{record.checkIn}</td>
                          <td className="px-4 py-3">{record.checkOut}</td>
                          <td className="px-4 py-3">{record.hoursWorked}h</td>
                          <td className="px-4 py-3">{record.overtime}h</td>
                          <td className="px-4 py-3">
                            <Badge className={getStatusColor(record.status)}>
                              {record.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button variant="ghost" size="icon">
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>

      {/* Employee Dialog */}
      <Dialog open={isEmployeeDialogOpen} onOpenChange={setIsEmployeeDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedEmployee ? 'Edit Employee' : 'Add New Employee'}
            </DialogTitle>
            <DialogDescription>
              {selectedEmployee ? 'Update employee information' : 'Enter employee details to add them to the payroll system'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="employee-id">Employee ID</Label>
                <Input id="employee-id" placeholder="EMP001" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" placeholder="John Doe" />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="john.doe@company.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="production">Production</SelectItem>
                    <SelectItem value="quality">Quality Control</SelectItem>
                    <SelectItem value="sales">Sales</SelectItem>
                    <SelectItem value="accounting">Accounting</SelectItem>
                    <SelectItem value="hr">Human Resources</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="position">Position</Label>
                <Input id="position" placeholder="Position title" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hire-date">Hire Date</Label>
                <Input id="hire-date" type="date" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="salary">Monthly Salary (EGP)</Label>
                <Input id="salary" type="number" placeholder="0" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="payroll-type">Payroll Type</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="hourly">Hourly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bank-account">Bank Account</Label>
                <Input id="bank-account" placeholder="Bank account number" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tax-id">Tax ID</Label>
                <Input id="tax-id" placeholder="Tax identification number" />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEmployeeDialogOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700">
              {selectedEmployee ? 'Update Employee' : 'Add Employee'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payroll Dialog */}
      <Dialog open={isPayrollDialogOpen} onOpenChange={setIsPayrollDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Process Payroll</DialogTitle>
            <DialogDescription>
              Calculate and process payroll for the selected employee
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">Employee Information</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Name: {selectedEmployee?.name}</div>
                <div>ID: {selectedEmployee?.employeeId}</div>
                <div>Department: {selectedEmployee?.department}</div>
                <div>Position: {selectedEmployee?.position}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pay-period">Pay Period</Label>
                <Input id="pay-period" type="month" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="basic-salary">Basic Salary</Label>
                <Input id="basic-salary" type="number" value={selectedEmployee?.salary || 0} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="overtime">Overtime Pay</Label>
                <Input id="overtime" type="number" placeholder="0" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bonuses">Bonuses</Label>
                <Input id="bonuses" type="number" placeholder="0" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="deductions">Deductions</Label>
                <Input id="deductions" type="number" placeholder="0" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="taxes">Taxes</Label>
                <Input id="taxes" type="number" placeholder="0" />
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium text-green-900">Net Pay:</span>
                <span className="text-xl font-bold text-green-900">{formatCurrency(selectedEmployee?.salary || 0)}</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPayrollDialogOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-green-600 hover:bg-green-700">
              Process Payroll
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Configure Employees Dialog */}
      <Dialog open={isConfigEmployeesDialogOpen} onOpenChange={setIsConfigEmployeesDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configure Employee Settings</DialogTitle>
            <DialogDescription>
              Configure employee-related settings and preferences
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-6 py-4">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Employee Fields Configuration</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Required Fields</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="req-name" defaultChecked />
                      <Label htmlFor="req-name">Full Name</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="req-email" defaultChecked />
                      <Label htmlFor="req-email">Email Address</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="req-dept" defaultChecked />
                      <Label htmlFor="req-dept">Department</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="req-salary" defaultChecked />
                      <Label htmlFor="req-salary">Salary Information</Label>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Optional Fields</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="opt-bank" />
                      <Label htmlFor="opt-bank">Bank Account</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="opt-tax" />
                      <Label htmlFor="opt-tax">Tax ID</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="opt-phone" />
                      <Label htmlFor="opt-phone">Phone Number</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="opt-address" />
                      <Label htmlFor="opt-address">Address</Label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Department Configuration</h3>
              <div className="space-y-3">
                <Label htmlFor="departments">Available Departments</Label>
                
                {/* Existing Departments List */}
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {departments.map((dept, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 border rounded-md bg-gray-50">
                      {editingDepartment === index ? (
                        <>
                          <Input 
                            value={editDepartmentValue}
                            onChange={(e) => setEditDepartmentValue(e.target.value)}
                            className="flex-1"
                            onKeyPress={(e) => e.key === 'Enter' && saveEditDepartment()}
                          />
                          <Button size="sm" onClick={saveEditDepartment} className="px-2">
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={cancelEditDepartment} className="px-2">
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <span className="flex-1 text-sm font-medium">{dept}</span>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => startEditDepartment(index)}
                            className="px-2"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => removeDepartment(index)}
                            className="px-2 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  ))}
                </div>

                {/* Add New Department */}
                <div className="flex gap-2">
                  <Input 
                    placeholder="Enter new department name"
                    value={newDepartment}
                    onChange={(e) => setNewDepartment(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addDepartment()}
                    className="flex-1"
                  />
                  <Button onClick={addDepartment} variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add
                  </Button>
                </div>

                {/* Department Selection Preview */}
                <div className="mt-4">
                  <Label className="text-sm text-gray-600">Department Dropdown Preview:</Label>
                  <Select>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept, index) => (
                        <SelectItem key={index} value={dept.toLowerCase().replace(/\s+/g, '-')}>
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfigEmployeesDialogOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700">
              Save Configuration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Configure Payroll Records Dialog */}
      <Dialog open={isConfigPayrollDialogOpen} onOpenChange={setIsConfigPayrollDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configure Payroll Settings</DialogTitle>
            <DialogDescription>
              Configure payroll calculation rules and settings
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-6 py-4">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Payroll Calculation Rules</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="overtime-rate">Overtime Rate (%)</Label>
                  <Input id="overtime-rate" type="number" placeholder="150" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tax-rate">Default Tax Rate (%)</Label>
                  <Input id="tax-rate" type="number" placeholder="14" />
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Deductions Configuration</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="auto-insurance" defaultChecked />
                  <Label htmlFor="auto-insurance">Automatic Insurance Deduction</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="auto-pension" defaultChecked />
                  <Label htmlFor="auto-pension">Automatic Pension Contribution</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="auto-social" defaultChecked />
                  <Label htmlFor="auto-social">Social Security Deduction</Label>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Pay Period Settings</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pay-frequency">Pay Frequency</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="bi-weekly">Bi-weekly</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pay-day">Pay Day</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select day" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="last-day">Last Day of Month</SelectItem>
                      <SelectItem value="first-day">First Day of Month</SelectItem>
                      <SelectItem value="15th">15th of Month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfigPayrollDialogOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-green-600 hover:bg-green-700">
              Save Configuration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Configure Attendance Dialog */}
      <Dialog open={isConfigAttendanceDialogOpen} onOpenChange={setIsConfigAttendanceDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configure Attendance Settings</DialogTitle>
            <DialogDescription>
              Configure attendance tracking and time management settings
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-6 py-4">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Working Hours</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start-time">Standard Start Time</Label>
                  <Input id="start-time" type="time" defaultValue="08:00" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-time">Standard End Time</Label>
                  <Input id="end-time" type="time" defaultValue="17:00" />
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Attendance Rules</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="late-threshold">Late Threshold (minutes)</Label>
                  <Input id="late-threshold" type="number" placeholder="15" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="break-duration">Break Duration (minutes)</Label>
                  <Input id="break-duration" type="number" placeholder="60" />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Overtime Settings</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="auto-overtime" defaultChecked />
                  <Label htmlFor="auto-overtime">Automatic Overtime Calculation</Label>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="overtime-start">Overtime Starts After (hours)</Label>
                    <Input id="overtime-start" type="number" placeholder="8" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="weekend-rate">Weekend Rate Multiplier</Label>
                    <Input id="weekend-rate" type="number" placeholder="2.0" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfigAttendanceDialogOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-purple-600 hover:bg-purple-700">
              Save Configuration
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* General Settings Dialog */}
      <Dialog open={isGeneralSettingsDialogOpen} onOpenChange={setIsGeneralSettingsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>General Settings</DialogTitle>
            <DialogDescription>
              Configure general payroll system settings and preferences
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-6 py-4">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">System Configuration</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currency">Default Currency</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EGP">Egyptian Pound (EGP)</SelectItem>
                      <SelectItem value="USD">US Dollar (USD)</SelectItem>
                      <SelectItem value="EUR">Euro (EUR)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date-format">Date Format</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dd/mm/yyyy">DD/MM/YYYY</SelectItem>
                      <SelectItem value="mm/dd/yyyy">MM/DD/YYYY</SelectItem>
                      <SelectItem value="yyyy-mm-dd">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Notifications</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="email-notifications" defaultChecked />
                  <Label htmlFor="email-notifications">Email Notifications</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="payroll-reminders" defaultChecked />
                  <Label htmlFor="payroll-reminders">Payroll Processing Reminders</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="late-alerts" />
                  <Label htmlFor="late-alerts">Late Attendance Alerts</Label>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Security Settings</h3>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="require-approval" defaultChecked />
                  <Label htmlFor="require-approval">Require Approval for Payroll Processing</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="audit-trail" defaultChecked />
                  <Label htmlFor="audit-trail">Enable Audit Trail</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="backup-auto" defaultChecked />
                  <Label htmlFor="backup-auto">Automatic Data Backup</Label>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsGeneralSettingsDialogOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-gray-600 hover:bg-gray-700">
              Save Settings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Payroll;