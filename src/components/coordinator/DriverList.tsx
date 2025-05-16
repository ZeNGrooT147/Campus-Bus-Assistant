import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Edit2, Phone } from 'lucide-react';
import { useCoordinatorBuses } from '@/hooks/useCoordinatorBuses';
import { Link } from 'react-router-dom';

const DriverList = () => {
  const { drivers } = useCoordinatorBuses();

  return (
    <div className="space-y-4">
      {drivers.map((driver) => (
        <Card key={driver.id} className="overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={driver.profile_photo_url || ''} alt={driver.name} />
                <AvatarFallback>{driver.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">{driver.name}</h3>
                  <div className="flex items-center gap-2">
                    <Link to={`/coordinator/drivers/${driver.id}/edit`}>
                      <Button variant="ghost" size="icon">
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  {driver.contact && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Phone className="h-3.5 w-3.5 mr-1" />
                      {driver.contact}
                    </div>
                  )}
                  <Badge variant={driver.status === 'available' ? 'default' : 'secondary'}>
                    {driver.status}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default DriverList; 