import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCoordinatorBuses } from "@/hooks/useCoordinatorBuses";
import { toast } from "@/hooks/use-toast";
import { Loader } from "lucide-react";

const driverSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phoneNumber: z.string().min(10, "Phone number must be at least 10 digits"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  profilePhoto: z.any().optional(),
});

type DriverFormData = z.infer<typeof driverSchema>;

interface AddDriverFormProps {
  onSuccess?: () => void;
}

export default function AddDriverForm({ onSuccess }: AddDriverFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addDriver } = useCoordinatorBuses();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<DriverFormData>({
    resolver: zodResolver(driverSchema),
  });

  const onSubmit = async (data: DriverFormData) => {
    try {
      setIsSubmitting(true);
      const success = await addDriver(data);
      
      if (success) {
        toast.success("Driver added successfully");
        reset();
        onSuccess?.();
      }
    } catch (error) {
      console.error("Error adding driver:", error);
      toast.error("Failed to add driver");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="fullName">Full Name</Label>
        <Input
          id="fullName"
          placeholder="Enter driver's full name"
          {...register("fullName")}
        />
        {errors.fullName && (
          <p className="text-sm text-red-500">{errors.fullName.message?.toString()}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="Enter driver's email"
          {...register("email")}
        />
        {errors.email && (
          <p className="text-sm text-red-500">{errors.email.message?.toString()}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="phoneNumber">Phone Number</Label>
        <Input
          id="phoneNumber"
          type="tel"
          placeholder="Enter driver's phone number"
          {...register("phoneNumber")}
        />
        {errors.phoneNumber && (
          <p className="text-sm text-red-500">{errors.phoneNumber.message?.toString()}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="Enter temporary password"
          {...register("password")}
        />
        {errors.password && (
          <p className="text-sm text-red-500">{errors.password.message?.toString()}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="profilePhoto">Profile Photo (Optional)</Label>
        <Input
          id="profilePhoto"
          type="file"
          accept="image/*"
          {...register("profilePhoto")}
        />
        {errors.profilePhoto && (
          <p className="text-sm text-red-500">{errors.profilePhoto.message?.toString()}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader className="mr-2 h-4 w-4 animate-spin" />
            Adding Driver...
          </>
        ) : (
          "Add Driver"
        )}
      </Button>
    </form>
  );
}
