import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building, Phone, MapPin, FileText, Handshake } from 'lucide-react';
import { CustomerData } from './CustomerCard';

interface EditCustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: CustomerData | null;
  onSave: (id: number, updatedCustomer: Partial<CustomerData>) => void;
}

const EditCustomerDialog: React.FC<EditCustomerDialogProps> = ({
  open,
  onOpenChange,
  customer,
  onSave
}) => {
  // Industry sectors to select from
  const industrySectors = [
    "Healthcare",
    "Pharmaceuticals",
    "Medical Devices",
    "Biotechnology",
    "Food & Beverage",
    "Chemical Manufacturing",
    "Research & Development",
    "Hospital & Clinics",
    "Retail Pharmacy",
    "Wholesale Distribution"
  ];
  
  const [editedCustomer, setEditedCustomer] = useState<Partial<CustomerData>>({});
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});
  
  // Update form when customer changes
  useEffect(() => {
    if (customer) {
      setEditedCustomer({ ...customer });
      setFormErrors({});
    }
  }, [customer]);
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditedCustomer(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field if it exists
    if (formErrors[name]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  // Handle sector change from dropdown
  const handleSectorChange = (value: string) => {
    setEditedCustomer(prev => ({ ...prev, sector: value }));
    
    // Clear error for this field if it exists
    if (formErrors.sector) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.sector;
        return newErrors;
      });
    }
  };
  
  // Validate form before submission
  const validateForm = (): boolean => {
    const errors: {[key: string]: string} = {};
    
    if (!editedCustomer.name?.trim()) {
      errors.name = 'Name is required';
    }
    
    if (!editedCustomer.company?.trim()) {
      errors.company = 'Company name is required';
    }
    
    if (!editedCustomer.email?.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(editedCustomer.email)) {
      errors.email = 'Email format is invalid';
    }
    
    if (!editedCustomer.phone?.trim()) {
      errors.phone = 'Phone number is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Handle save
  const handleSave = () => {
    if (!customer) return;
    
    if (validateForm()) {
      onSave(customer.id, editedCustomer);
    }
  };
  
  if (!customer) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
        <DialogHeader>
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Building className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-gray-900">Edit Customer Information</DialogTitle>
              <p className="text-sm text-gray-600 mt-1">Update comprehensive customer details and business relationship information</p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Customer Information Section */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
              <Building className="h-5 w-5 mr-2" />
              Customer Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-blue-700 font-medium">Customer Name *</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Full customer name"
                  value={editedCustomer.name || ''}
                  onChange={handleInputChange}
                  className={`border-blue-200 focus:ring-blue-500 ${formErrors.name ? "border-red-500" : ""}`}
                />
                {formErrors.name && (
                  <p className="text-sm text-red-500">{formErrors.name}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="position" className="text-blue-700 font-medium">Position/Title</Label>
                <Input
                  id="position"
                  name="position"
                  placeholder="Job title or position"
                  value={editedCustomer.position || ''}
                  onChange={handleInputChange}
                  className="border-blue-200 focus:ring-blue-500"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-blue-700">Customer Status</label>
                <select className="w-full px-3 py-2 border border-blue-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>Active Customer</option>
                  <option>Inactive Customer</option>
                  <option>Prospect</option>
                  <option>VIP Customer</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-blue-700">Customer Type</label>
                <select className="w-full px-3 py-2 border border-blue-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>Corporate Customer</option>
                  <option>Individual Customer</option>
                  <option>Government Entity</option>
                  <option>International Customer</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-blue-700">Customer Since</label>
                <Input 
                  type="date"
                  className="border-blue-200 focus:ring-blue-500"
                  defaultValue="2024-01-15"
                />
              </div>
            </div>
          </div>

          {/* Company Information Section */}
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center">
              <Building className="h-5 w-5 mr-2" />
              Company Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company" className="text-green-700 font-medium">Company Name *</Label>
                <Input
                  id="company"
                  name="company"
                  placeholder="Full company name"
                  value={editedCustomer.company || ''}
                  onChange={handleInputChange}
                  className={`border-green-200 focus:ring-green-500 ${formErrors.company ? "border-red-500" : ""}`}
                />
                {formErrors.company && (
                  <p className="text-sm text-red-500">{formErrors.company}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="sector" className="text-green-700 font-medium">Industry Sector</Label>
                <Select 
                  value={editedCustomer.sector} 
                  onValueChange={handleSectorChange}
                >
                  <SelectTrigger className="border-green-200 focus:ring-green-500">
                    <SelectValue placeholder="Select industry sector" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {industrySectors.map((sector) => (
                        <SelectItem key={sector} value={sector}>
                          {sector}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-green-700">Business Type</label>
                <select className="w-full px-3 py-2 border border-green-200 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500">
                  <option>Pharmaceutical Manufacturer</option>
                  <option>Healthcare Provider</option>
                  <option>Medical Device Company</option>
                  <option>Research Institution</option>
                  <option>Distributor</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-green-700">Company Size</label>
                <select className="w-full px-3 py-2 border border-green-200 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500">
                  <option>Small (1-50 employees)</option>
                  <option>Medium (51-250 employees)</option>
                  <option>Large (251-500 employees)</option>
                  <option>Enterprise (500+ employees)</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-green-700">Registration Number</label>
                <Input 
                  placeholder="Company registration number"
                  className="border-green-200 focus:ring-green-500"
                />
              </div>
            </div>
          </div>

          {/* Contact Information Section */}
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <h3 className="text-lg font-semibold text-purple-900 mb-4 flex items-center">
              <Phone className="h-5 w-5 mr-2" />
              Contact Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-purple-700 font-medium">Primary Email *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="customer@company.com"
                  value={editedCustomer.email || ''}
                  onChange={handleInputChange}
                  className={`border-purple-200 focus:ring-purple-500 ${formErrors.email ? "border-red-500" : ""}`}
                />
                {formErrors.email && (
                  <p className="text-sm text-red-500">{formErrors.email}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-purple-700 font-medium">Phone Number *</Label>
                <Input
                  id="phone"
                  name="phone"
                  placeholder="+20 2 1234 5678"
                  value={editedCustomer.phone || ''}
                  onChange={handleInputChange}
                  className={`border-purple-200 focus:ring-purple-500 ${formErrors.phone ? "border-red-500" : ""}`}
                />
                {formErrors.phone && (
                  <p className="text-sm text-red-500">{formErrors.phone}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-purple-700">Alternative Contact</label>
                <Input 
                  placeholder="Emergency or alternative contact"
                  className="border-purple-200 focus:ring-purple-500"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-purple-700">Preferred Contact Method</label>
                <select className="w-full px-3 py-2 border border-purple-200 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500">
                  <option>Email</option>
                  <option>Phone</option>
                  <option>WhatsApp</option>
                  <option>SMS</option>
                </select>
              </div>
            </div>
          </div>

          {/* Address Information Section */}
          <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
            <h3 className="text-lg font-semibold text-orange-900 mb-4 flex items-center">
              <MapPin className="h-5 w-5 mr-2" />
              Address & Location
            </h3>
            
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="address" className="text-orange-700 font-medium">Business Address</Label>
                <Textarea
                  id="address"
                  name="address"
                  placeholder="Complete business address"
                  value={editedCustomer.address || ''}
                  onChange={handleInputChange}
                  className="min-h-[100px] border-orange-200 focus:ring-orange-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-orange-700">City</label>
                <Input 
                  placeholder="City name"
                  className="border-orange-200 focus:ring-orange-500"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-orange-700">State/Province</label>
                <Input 
                  placeholder="State or province"
                  className="border-orange-200 focus:ring-orange-500"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-orange-700">Country</label>
                <select className="w-full px-3 py-2 border border-orange-200 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500">
                  <option>Egypt</option>
                  <option>United States</option>
                  <option>United Kingdom</option>
                  <option>Germany</option>
                  <option>Saudi Arabia</option>
                  <option>UAE</option>
                </select>
              </div>
            </div>
          </div>

          {/* Tax & Compliance Section */}
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <h3 className="text-lg font-semibold text-yellow-900 mb-4 flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Tax & Compliance
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-yellow-700">ETA Tax Number</label>
                <Input 
                  placeholder="Egyptian Tax Authority number"
                  className="border-yellow-200 focus:ring-yellow-500"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-yellow-700">VAT Registration</label>
                <Input 
                  placeholder="VAT registration number"
                  className="border-yellow-200 focus:ring-yellow-500"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-yellow-700">Tax Status</label>
                <select className="w-full px-3 py-2 border border-yellow-200 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500">
                  <option>Compliant</option>
                  <option>Under Review</option>
                  <option>Pending Documentation</option>
                  <option>Non-Compliant</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-yellow-700">Commercial Registration</label>
                <Input 
                  placeholder="Commercial registration number"
                  className="border-yellow-200 focus:ring-yellow-500"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-yellow-700">License Expiry Date</label>
                <Input 
                  type="date"
                  className="border-yellow-200 focus:ring-yellow-500"
                />
              </div>
            </div>
          </div>

          {/* Business Terms Section */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Handshake className="h-5 w-5 mr-2" />
              Business Terms & Preferences
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Payment Terms</label>
                <select className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500">
                  <option>Net 30 days</option>
                  <option>Net 15 days</option>
                  <option>2/10 Net 30</option>
                  <option>Cash on Delivery</option>
                  <option>Advance Payment</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Credit Limit</label>
                <Input 
                  type="number"
                  placeholder="25000"
                  className="border-gray-200 focus:ring-gray-500"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Currency Preference</label>
                <select className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500">
                  <option>EGP - Egyptian Pound</option>
                  <option>USD - US Dollar</option>
                  <option>EUR - Euro</option>
                  <option>GBP - British Pound</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Preferred Delivery Method</label>
                <select className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500">
                  <option>Standard Delivery</option>
                  <option>Express Delivery</option>
                  <option>Customer Pickup</option>
                  <option>Third-party Logistics</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Customer Tier</label>
                <select className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500">
                  <option>Standard Customer</option>
                  <option>Silver Customer</option>
                  <option>Gold Customer</option>
                  <option>Platinum Customer</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-3 pt-6 border-t">
          <DialogClose asChild>
            <Button 
              variant="outline" 
              type="button"
              className="border-gray-300 hover:bg-gray-50"
            >
              Cancel
            </Button>
          </DialogClose>
          <Button 
            type="button"
            variant="outline"
            className="border-blue-300 text-blue-600 hover:bg-blue-50"
          >
            <FileText className="h-4 w-4 mr-2" />
            Save as Draft
          </Button>
          <Button 
            type="button" 
            onClick={handleSave}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Building className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditCustomerDialog;