import { useEffect, useState } from 'react';
import { dashboardApi } from '../../api/dashboardApi';
import { PageHeader } from '../../components/layout/PageHeader';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { FileText, Users, CheckSquare, ShoppingCart, Receipt, DownloadCloud } from 'lucide-react';

export default function ActivityLogPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi.getAllActivity().then(data => {
      setLogs(data);
      setLoading(false);
    });
  }, []);

  const handleExport = () => {
    if (logs.length === 0) return;
    
    let csv = "Action,Entity Type,Entity ID,User,Date\n";
    logs.forEach(log => {
      csv += `"${log.action}","${log.entityType}","${log.entityId}","${log.user?.fullName || log.userId}","${new Date(log.createdAt).toLocaleString()}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `activity_logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <div className="p-8">Loading logs...</div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader 
        title="System Activity Logs" 
        description="Audit trail of all procurement operations."
        actions={
          <Button onClick={handleExport} variant="outline">
            <DownloadCloud className="mr-2 h-4 w-4" /> Export Audit Log
          </Button>
        }
      />

      <Card className="shadow-soft">
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {logs.map((log) => (
              <div key={log.id} className="p-6 flex items-start space-x-4 hover:bg-secondary/30 transition-colors">
                <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center shrink-0 border border-border">
                  <ActivityIcon action={log.action} />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-primary">{log.user?.fullName || 'System'}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(log.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <p className="text-sm">
                    <span className="text-muted-foreground">{formatAction(log.action)} </span> 
                    <span className="font-medium">{log.entityType.toUpperCase()} {log.entityId}</span>
                  </p>
                  <p className="text-xs text-muted-foreground font-mono mt-2">Log ID: {log.id}</p>
                </div>
              </div>
            ))}
            
            {logs.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">No activity recorded yet.</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ActivityIcon({ action }: { action: string }) {
  if (action.includes('RFQ')) return <FileText className="h-5 w-5 text-primary" />;
  if (action.includes('QUOTE')) return <FileText className="h-5 w-5 text-primary" />;
  if (action.includes('APPROV')) return <CheckSquare className="h-5 w-5 text-primary" />;
  if (action.includes('PO')) return <ShoppingCart className="h-5 w-5 text-primary" />;
  if (action.includes('INVOICE')) return <Receipt className="h-5 w-5 text-primary" />;
  return <Users className="h-5 w-5 text-primary" />;
}

function formatAction(action: string) {
  return action.toLowerCase().replace(/_/g, ' ');
}
