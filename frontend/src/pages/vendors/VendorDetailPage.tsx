import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { vendorApi } from '../../api/vendorApi';
import { Vendor } from '../../types';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Button } from '../../components/ui/Button';

export default function VendorDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      vendorApi.getById(id).then(data => {
        setVendor(data);
        setLoading(false);
      }).catch(() => {
        navigate('/vendors');
      });
    }
  }, [id, navigate]);

  if (loading || !vendor) return <div className="p-8">Loading vendor profile...</div>;

  return (
    <div className="space-y-6">
      <PageHeader 
        title={vendor.companyName} 
        description="Vendor Profile Details"
        actions={
          <>
            <Button variant="outline" onClick={() => navigate('/vendors')}>Back</Button>
            <Button>Edit Profile</Button>
          </>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="col-span-1 shadow-soft">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <div className="mt-1"><StatusBadge status={vendor.status} /></div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Category</p>
              <p className="font-medium">{vendor.category || 'Uncategorized'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Rating</p>
              <p className="font-medium">{vendor.rating ? `${vendor.rating} / 5.0` : 'Not rated'}</p>
            </div>
            <div className="pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground mb-1">Contact Information</p>
              <p className="font-medium">{vendor.contactName}</p>
              <p className="text-sm mt-1">{vendor.phone}</p>
              <p className="text-sm text-muted-foreground mt-2">{vendor.address}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1 md:col-span-2 shadow-soft">
          <CardHeader>
            <CardTitle>Performance & History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center border border-dashed border-border rounded-md bg-secondary/30">
              <p className="text-muted-foreground">Performance charts will appear here</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
