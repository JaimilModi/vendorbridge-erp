import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card, CardContent } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { vendorApi } from '../../api/vendorApi';

const vendorSchema = z.object({
  companyName: z.string().min(2, 'Company name is required'),
  contactName: z.string().min(2, 'Contact name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().min(5, 'Phone number is required'),
  category: z.string().min(2, 'Category is required'),
  address: z.string().min(5, 'Address is required'),
  gstNumber: z.string().optional(),
});

type VendorFormValues = z.infer<typeof vendorSchema>;

export default function VendorFormPage() {
  const navigate = useNavigate();
  
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<VendorFormValues>({
    resolver: zodResolver(vendorSchema)
  });

  const onSubmit = async (data: VendorFormValues) => {
    // Clean up data for Zod validation: convert empty strings to undefined
    const cleanedData = { ...data };
    if (cleanedData.email === "") cleanedData.email = undefined as any;
    if (cleanedData.phone === "") cleanedData.phone = undefined as any;
    
    try {
      await vendorApi.create(cleanedData);
      navigate('/vendors');
    } catch (error) {
      console.error('Failed to create vendor', error);
      // In a real app, show error toast here
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <PageHeader 
        title="Add New Vendor" 
        description="Register a new supplier in the system."
      />

      <Card className="shadow-soft">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="font-medium text-lg border-b border-border pb-2">Company Details</h3>
                <Input label="Company Name" {...register('companyName')} error={errors.companyName?.message} />
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Category" {...register('category')} error={errors.category?.message} />
                  <Input label="GST Number" {...register('gstNumber')} error={errors.gstNumber?.message} />
                </div>
                <Input label="Business Address" {...register('address')} error={errors.address?.message} />
              </div>
              
              <div className="space-y-4">
                <h3 className="font-medium text-lg border-b border-border pb-2">Primary Contact</h3>
                <Input label="Contact Name" {...register('contactName')} error={errors.contactName?.message} />
                <Input label="Email Address" type="email" {...register('email')} error={errors.email?.message} />
                <Input label="Phone Number" {...register('phone')} error={errors.phone?.message} />
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-6 border-t border-border">
              <Button type="button" variant="outline" onClick={() => navigate('/vendors')}>Cancel</Button>
              <Button type="submit" isLoading={isSubmitting}>Register Vendor</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
