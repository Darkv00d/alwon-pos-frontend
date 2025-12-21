import { useEffect } from "react";
import { z } from "zod";
import { type Selectable } from "kysely";
import {
  type Departments,
  type Locations,
  type Positions,
} from "../helpers/schema";
import { useEmployeeMutation } from "../helpers/useEmployeeQueries";
import { type EmployeeWithRelations } from "../endpoints/employees_GET.schema";
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
  FormDescription,
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
import { Spinner } from "./Spinner";
import styles from "./EmployeeForm.module.css";

interface EmployeeFormProps {
  isOpen: boolean;
  onClose: () => void;
  employee?: EmployeeWithRelations | null;
  departments: Selectable<Departments>[];
  positions: Selectable<Positions>[];
  locations: Selectable<Locations>[];
}

const formSchema = z.object({
  fullName: z.string().min(1, "Full name is required."),
  email: z.string().email("Invalid email address.").optional().or(z.literal("")),
  phone: z.string().optional(),
  code: z.string().min(1, "Employee code is required."),
  pin: z.string().optional().refine(val => !val || /^\d{4,6}$/.test(val), {
    message: "PIN must be 4 to 6 digits.",
  }),
  status: z.enum(["active", "inactive"]),
  defaultLocationId: z.string().optional(),
  departmentId: z.string().optional(),
  positionId: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export const EmployeeForm = ({
  isOpen,
  onClose,
  employee,
  departments,
  positions,
  locations,
}: EmployeeFormProps) => {
  const isEditMode = !!employee;
  const mutation = useEmployeeMutation();

  const defaultValues = {
    fullName: "",
    email: "",
    phone: "",
    code: "",
    pin: "",
    status: "active" as const,
    defaultLocationId: "",
    departmentId: "",
    positionId: "",
  };

  const form = useForm({
    schema: formSchema,
    defaultValues,
  });

  useEffect(() => {
    if (isOpen) {
      if (employee) {
        form.setValues({
          fullName: employee.fullName,
          email: employee.email ?? "",
          phone: employee.phone ?? "",
          code: employee.code ?? "",
          pin: "", // PIN is write-only for security
          status: employee.status as "active" | "inactive",
          defaultLocationId: employee.defaultLocationId?.toString() ?? "",
          departmentId: employee.departmentId?.toString() ?? "",
          positionId: employee.positionId?.toString() ?? "",
        });
      } else {
        form.setValues(defaultValues);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employee, isOpen]);

  const onSubmit = (values: FormValues) => {
    const payload = {
      uuid: employee?.uuid,
      ...values,
      pin: values.pin || undefined, // Send undefined if empty
      defaultLocationId: values.defaultLocationId ? parseInt(values.defaultLocationId) : null,
      departmentId: values.departmentId ? parseInt(values.departmentId) : undefined,
      positionId: values.positionId ? parseInt(values.positionId) : undefined,
    };

    mutation.mutate(payload, {
      onSuccess: () => {
        form.setValues(defaultValues);
        onClose();
      },
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Edit Employee" : "Add New Employee"}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update the details for this employee."
              : "Fill in the details to add a new employee."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} id="employee-form" className={styles.formGrid}>
            <FormItem name="fullName">
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., Jane Doe"
                  value={form.values.fullName}
                  onChange={(e) => form.setValues((p) => ({ ...p, fullName: e.target.value }))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>

            <FormItem name="code">
              <FormLabel>Employee Code</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., JD001"
                  value={form.values.code}
                  onChange={(e) => form.setValues((p) => ({ ...p, code: e.target.value }))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>

            <FormItem name="email">
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="e.g., jane.doe@Alwon.com"
                  value={form.values.email}
                  onChange={(e) => form.setValues((p) => ({ ...p, email: e.target.value }))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>

            <FormItem name="phone">
              <FormLabel>Phone</FormLabel>
              <FormControl>
                <Input
                  type="tel"
                  placeholder="e.g., (555) 123-4567"
                  value={form.values.phone}
                  onChange={(e) => form.setValues((p) => ({ ...p, phone: e.target.value }))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>

            <FormItem name="pin">
              <FormLabel>PIN Code</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder={isEditMode ? "Leave blank to keep current PIN" : "4-6 digits"}
                  value={form.values.pin}
                  onChange={(e) => form.setValues((p) => ({ ...p, pin: e.target.value }))}
                />
              </FormControl>
              <FormDescription>For kiosk and time clock access.</FormDescription>
              <FormMessage />
            </FormItem>

            <FormItem name="status">
              <FormLabel>Status</FormLabel>
              <FormControl>
                <Select
                  value={form.values.status}
                  onValueChange={(value) => form.setValues((p) => ({ ...p, status: value as "active" | "inactive" }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>

            <FormItem name="departmentId">
              <FormLabel>Department</FormLabel>
              <FormControl>
                <Select
                  value={form.values.departmentId}
                  onValueChange={(value) => form.setValues((p) => ({ ...p, departmentId: value }))}
                >
                  <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                  <SelectContent>
                    {departments.map((d) => <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>

            <FormItem name="positionId">
              <FormLabel>Position</FormLabel>
              <FormControl>
                <Select
                  value={form.values.positionId}
                  onValueChange={(value) => form.setValues((p) => ({ ...p, positionId: value }))}
                >
                  <SelectTrigger><SelectValue placeholder="Select position" /></SelectTrigger>
                  <SelectContent>
                    {positions.map((p) => <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>

            <FormItem name="defaultLocationId" className={styles.fullWidth}>
              <FormLabel>Default Location</FormLabel>
              <FormControl>
                <Select
                  value={form.values.defaultLocationId}
                  onValueChange={(value) => form.setValues((p) => ({ ...p, defaultLocationId: value }))}
                >
                  <SelectTrigger><SelectValue placeholder="Select default location" /></SelectTrigger>
                  <SelectContent>
                    {locations.map((l) => <SelectItem key={l.id} value={l.id.toString()}>{l.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          </form>
        </Form>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button type="submit" form="employee-form" disabled={mutation.isPending}>
            {mutation.isPending ? <Spinner size="sm" /> : isEditMode ? "Save Changes" : "Create Employee"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};