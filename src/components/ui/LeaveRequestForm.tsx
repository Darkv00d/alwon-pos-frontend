import { useEffect } from "react";
import { z } from "zod";
import { type Selectable } from "kysely";
import { type Employees } from "../helpers/schema";
import { useLeaveRequestMutation } from "../helpers/useWorkforceQueries";
import { type LeaveRequestWithEmployee } from "../endpoints/leave-requests_GET.schema";
import { LEAVE_REQUEST_TYPES } from "../helpers/leaveConstants";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./Dialog";
import {
  Form,
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
  useForm,
} from "./Form";
import { Input } from "./Input";
import { Button } from "./Button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./Select";
import { Textarea } from "./Textarea";
import { Popover, PopoverTrigger, PopoverContent } from "./Popover";
import { Calendar } from "./Calendar";
import { Spinner } from "./Spinner";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import styles from "./LeaveRequestForm.module.css";
import { useAuth } from "../helpers/useAuth";

interface LeaveRequestFormProps {
  isOpen: boolean;
  onClose: () => void;
  leaveRequest?: LeaveRequestWithEmployee | null;
  employees: Selectable<Employees>[];
}

const formSchema = z.object({
  employeeUuid: z.string().uuid("An employee must be selected."),
  type: z.enum(LEAVE_REQUEST_TYPES),
  dateRange: z.object({
    from: z.date({ required_error: "A start date is required." }),
    to: z.date().optional(),
  }),
  notes: z.string().optional(),
}).refine(data => !data.dateRange.to || data.dateRange.to >= data.dateRange.from, {
  message: "End date cannot be before start date.",
  path: ["dateRange"],
});

type FormValues = z.infer<typeof formSchema>;

export const LeaveRequestForm = ({
  isOpen,
  onClose,
  leaveRequest,
  employees,
}: LeaveRequestFormProps) => {
  const isEditMode = !!leaveRequest;
  const mutation = useLeaveRequestMutation();
  const { authState } = useAuth();


  const defaultValues: FormValues = {
    employeeUuid: "",
    type: "vacation",
    dateRange: { from: new Date(), to: undefined },
    notes: "",
  };

  const form = useForm({
    schema: formSchema,
    defaultValues,
  });

  useEffect(() => {
    if (isOpen) {
      if (leaveRequest) {
        form.setValues({
          employeeUuid: leaveRequest.employeeUuid || "",
          type: leaveRequest.type as typeof LEAVE_REQUEST_TYPES[number],
          dateRange: {
            from: new Date(leaveRequest.startsAt),
            to: new Date(leaveRequest.endsAt),
          },
          notes: leaveRequest.notes ?? "",
        });
      } else {
        form.setValues(defaultValues);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leaveRequest, isOpen]);

  const onSubmit = (values: FormValues) => {
    const payload = {
      id: leaveRequest?.id,
      employeeUuid: values.employeeUuid,
      type: values.type,
      startsAt: values.dateRange.from,
      endsAt: values.dateRange.to || values.dateRange.from,
      notes: values.notes,
    };

    mutation.mutate(payload, {
      onSuccess: () => {
        onClose();
      },
    });
  };

  const isReadOnly = isEditMode && leaveRequest?.status !== 'pending';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditMode ? "View/Edit Leave Request" : "New Leave Request"}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Review or update the details for this leave request."
              : "Fill in the details to request time off."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} id="leave-request-form" className={styles.formGrid}>
            <FormItem name="employeeUuid" className={styles.fullWidth}>
              <FormLabel>Employee</FormLabel>
              <FormControl>
                <Select
                  value={form.values.employeeUuid}
                  onValueChange={(value) => form.setValues((p) => ({ ...p, employeeUuid: value }))}
                  disabled={isReadOnly}
                >
                  <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                  <SelectContent>
                    {employees.map((e) => <SelectItem key={e.uuid} value={e.uuid}>{e.fullName}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>

            <FormItem name="type">
              <FormLabel>Leave Type</FormLabel>
              <FormControl>
                <Select
                  value={form.values.type}
                  onValueChange={(value) => form.setValues((p) => ({ ...p, type: value as any }))}
                  disabled={isReadOnly}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LEAVE_REQUEST_TYPES.map(type => (
                      <SelectItem key={type} value={type} className={styles.capitalize}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>

            <FormItem name="dateRange">
              <FormLabel>Date Range</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button variant="outline" className={styles.datePickerButton} disabled={isReadOnly}>
                      <CalendarIcon size={16} />
                      {form.values.dateRange?.from ? (
                        form.values.dateRange.to ? (
                          <>
                            {format(form.values.dateRange.from, "LLL dd, y")} - {format(form.values.dateRange.to, "LLL dd, y")}
                          </>
                        ) : (
                          format(form.values.dateRange.from, "LLL dd, y")
                        )
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent align="start" removeBackgroundAndPadding>
                  <Calendar
                    mode="range"
                    selected={form.values.dateRange}
                    onSelect={(range) => {
                      if (range && range.from) {
                        // Explicit type narrowing to help TypeScript understand the types
                        const from: Date = range.from;
                        const to: Date | undefined = range.to;
                        form.setValues(p => ({...p, dateRange: { from, to }}));
                      }
                    }}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>

            <FormItem name="notes" className={styles.fullWidth}>
              <FormLabel>Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Reason for leave, contact information, etc."
                  value={form.values.notes}
                  onChange={(e) => form.setValues((p) => ({ ...p, notes: e.target.value }))}
                  disabled={isReadOnly}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          </form>
        </Form>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          {!isReadOnly && (
            <Button type="submit" form="leave-request-form" disabled={mutation.isPending}>
              {mutation.isPending ? <Spinner size="sm" /> : isEditMode ? "Save Changes" : "Submit Request"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};