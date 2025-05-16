import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, MessageSquare } from 'lucide-react';
import { ComplaintType } from '@/hooks/useComplaints';
import { toast } from '@/components/ui/use-toast';

const formSchema = z.object({
  type: z.string().min(1, 'Please select a complaint type'),
  description: z.string()
    .min(10, 'Please provide more details about your complaint')
    .max(500, 'Description too long (max 500 characters)'),
  busId: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface Bus {
  id: string;
  number: string;
  name: string;
}

interface SubmitComplaintDialogProps {
  onSubmit: (data: {
    type: ComplaintType;
    description: string;
    busId?: string;
  }) => Promise<boolean>;
  isSubmitting: boolean;
  buses?: Bus[];
}

export function SubmitComplaintDialog({ onSubmit, isSubmitting, buses = [] }: SubmitComplaintDialogProps) {
  const [open, setOpen] = useState(false);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: '',
      description: '',
      busId: undefined,
    },
  });

  useEffect(() => {
    if (!isSubmitting) {
      form.reset();
    }
  }, [isSubmitting, form]);

  const handleSubmit = async (data: FormValues) => {
    try {
      const success = await onSubmit({
        type: data.type as ComplaintType,
        description: data.description,
        busId: data.busId,
      });
      // Immediately close the dialog regardless of success; feedback is shown via toast
      setOpen(false);
      form.reset();
      if (success) {
        toast({
          title: "Success",
          description: "Your complaint has been submitted successfully.",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to submit complaint. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error submitting complaint:', error);
      setOpen(false);
      toast({
        title: "Error",
        description: "Failed to submit complaint. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog 
      open={open} 
      onOpenChange={(newOpen) => {
        setOpen(newOpen);
        if (!newOpen) {
          form.reset();
        }
      }}
      modal
    >
      <DialogTrigger asChild>
        <Button 
          onClick={() => setOpen(true)}
          className="shrink-0 relative overflow-hidden group"
        >
          <MessageSquare className="mr-2 h-4 w-4" />
          <span className="relative z-10">Submit New Complaint</span>
          <span className="absolute inset-0 bg-primary-foreground/10 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
        </Button>
      </DialogTrigger>
      <DialogContent onInteractOutside={(e) => {
        if (isSubmitting) {
          e.preventDefault();
        }
      }}>
        <DialogHeader>
          <DialogTitle>Submit a Complaint</DialogTitle>
          <DialogDescription>
            Please provide details about your concern. Your feedback helps us improve our services.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Complaint Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select complaint type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="delay">Bus Delay</SelectItem>
                      <SelectItem value="cleanliness">Cleanliness Issue</SelectItem>
                      <SelectItem value="behavior">Staff Behavior</SelectItem>
                      <SelectItem value="safety">Safety Concern</SelectItem>
                      <SelectItem value="other">Other Issue</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {buses.length > 0 && (
              <FormField
                control={form.control}
                name="busId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Related Bus (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select bus (if applicable)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {buses.map(bus => (
                          <SelectItem key={bus.id} value={bus.id}>
                            {bus.number} - {bus.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Please describe your issue in detail" 
                      className="min-h-[120px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex items-start p-3 bg-yellow-50 rounded-md">
              <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5 mr-2 flex-shrink-0" />
              <p className="text-yellow-700">
                All complaints are reviewed by our coordinators. You will be notified when your complaint is processed.
              </p>
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setOpen(false)} 
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Complaint'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
