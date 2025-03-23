import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { tipSources } from "@shared/schema";

interface TipFormProps {
  initialData?: {
    amount: string;
    source: string;
    date: string;
    notes?: string;
  };
}

export function TipForm({ initialData }: TipFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const tipFormSchema = z.object({
    amount: z.string().min(1, "Amount is required").refine(
      (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
      "Amount must be a positive number"
    ),
    source: z.enum(tipSources, {
      errorMap: () => ({ message: "Please select a source" }),
    }),
    date: z.string().min(1, "Date is required"),
    notes: z.string().optional(),
  });

  type TipFormValues = z.infer<typeof tipFormSchema>;

  const defaultValues: TipFormValues = initialData || {
    amount: "",
    source: "cash",
    date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    notes: "",
  };

  const form = useForm<TipFormValues>({
    resolver: zodResolver(tipFormSchema),
    defaultValues,
  });

  const onSubmit = async (data: TipFormValues) => {
    setIsSubmitting(true);
    try {
      await apiRequest("POST", "/api/tips", {
        amount: parseFloat(data.amount),
        source: data.source,
        date: new Date(data.date).toISOString(),
        notes: data.notes || undefined,
        userId: 1 // Using demo user ID as specified in server/routes.ts
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/tips'] });
      
      toast({
        title: "Success",
        description: "Your tip has been saved!",
      });
      
      navigate("/");
    } catch (error: any) {
      console.error("Error saving tip:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save your tip. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium text-gray-800">Add New Tip</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount ($)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="source"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tip Source</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                    disabled={isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a source" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="venmo">Venmo</SelectItem>
                      <SelectItem value="credit_card">Credit Card</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <Input
                      type="datetime-local"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any additional details about this tip"
                      className="resize-none"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90"
              disabled={isSubmitting}
            >
              Save Tip
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
