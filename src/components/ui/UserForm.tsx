import React, { useEffect } from 'react';
import { z } from 'zod';
import { useForm, Form, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from './Form';
import { Input } from './Input';
import { Button } from './Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './Select';
import { Checkbox } from './Checkbox';
import { Popover, PopoverTrigger, PopoverContent } from './Popover';
import { Calendar as CalendarIcon, Loader2, AlertCircle } from 'lucide-react';
import { Calendar } from './Calendar';
import { format } from 'date-fns';
import { UserWithRoles } from '../endpoints/admin/users-list_GET.schema';
import { baseUpsertUserSchema } from '../endpoints/admin/users/upsert_POST.schema';
import { useAdminRolesListQuery } from '../helpers/useAdminUserQueries';
import { IdentificationType } from '../helpers/User';
import styles from './UserForm.module.css';

// Extend the base upsert schema for the form to handle date objects and optional password confirmation
const formSchema = baseUpsertUserSchema.extend({
  dateOfBirth: z.date().optional().nullable(),
  confirmPassword: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.password && data.password !== data.confirmPassword) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Passwords don't match",
      path: ["confirmPassword"],
    });
  }
});

type FormValues = z.infer<typeof formSchema>;

const identificationTypes: IdentificationType[] = ["CC", "CE", "NIT", "PAS", "OTRO"];
const userStatuses = ["active", "inactive", "suspended", "pending"];

interface UserFormProps {
  user?: UserWithRoles | null;
  onSave: (data: z.infer<typeof baseUpsertUserSchema>) => void;
  onCancel: () => void;
  isSaving: boolean;
  className?: string;
}

export const UserForm: React.FC<UserFormProps> = ({ user, onSave, onCancel, isSaving, className }) => {
  const isEditMode = !!user;

  // Fetch roles dynamically
  const { 
    data: rolesData, 
    isLoading: isLoadingRoles, 
    isError: isRolesError,
    error: rolesError 
  } = useAdminRolesListQuery();

  const form = useForm({
    schema: formSchema,
    defaultValues: {
      uuid: user?.uuid,
      email: user?.email ?? '',
      fullName: user?.fullName ?? '',
      displayName: user?.displayName ?? '',
      isActive: user?.isActive ?? true,
      identificationType: user?.identificationType as IdentificationType | undefined,
      identificationNumber: user?.identificationNumber ?? '',
      phone: user?.phone ?? '',
      address: user?.address ?? '',
      position: user?.position ?? '',
      status: user?.status ?? 'active',
      dateOfBirth: user?.dateOfBirth ? new Date(user.dateOfBirth) : undefined,
      roleNames: user?.roleNames ?? [],
      password: '',
      confirmPassword: '',
    },
  });

  const { setValues, values } = form;

  useEffect(() => {
    if (user) {
      setValues({
        uuid: user.uuid,
        email: user.email ?? '',
        fullName: user.fullName ?? '',
        displayName: user.displayName ?? '',
        isActive: user.isActive ?? true,
        identificationType: user.identificationType as IdentificationType | undefined,
        identificationNumber: user.identificationNumber ?? '',
        phone: user.phone ?? '',
        address: user.address ?? '',
        position: user.position ?? '',
        status: user.status ?? 'active',
        dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth) : undefined,
        roleNames: user.roleNames ?? [],
        password: '',
        confirmPassword: '',
      });
    }
  }, [user, setValues]);

  const handleSubmit = (data: FormValues) => {
    const { confirmPassword, dateOfBirth, ...submissionData } = data;
    
    // Don't submit empty password string on edit
    if (isEditMode && !submissionData.password) {
      delete submissionData.password;
    }

    onSave({
      ...submissionData,
      // The DB expects a string for date, but the endpoint will handle it.
      // For now, we omit it as it's not in the upsert schema.
      // A more robust solution would be to add it to the upsert endpoint.
    });
  };

  // Handle roles loading and error states
  if (isLoadingRoles) {
    return (
      <div className={`${styles.formContainer} ${className || ''}`}>
        <h2 className={styles.formTitle}>{isEditMode ? 'Edit User' : 'Create New User'}</h2>
        <div className={styles.loadingState}>
          <Loader2 size={24} className={styles.spinner} />
          <p>Loading user roles...</p>
        </div>
      </div>
    );
  }

  if (isRolesError) {
    return (
      <div className={`${styles.formContainer} ${className || ''}`}>
        <h2 className={styles.formTitle}>{isEditMode ? 'Edit User' : 'Create New User'}</h2>
        <div className={styles.errorState}>
          <AlertCircle size={24} className={styles.errorIcon} />
          <p>Failed to load user roles: {rolesError instanceof Error ? rolesError.message : 'Unknown error'}</p>
          <Button onClick={() => window.location.reload()} variant="outline">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const availableRoles = rolesData?.roles || [];

  return (
    <div className={`${styles.formContainer} ${className || ''}`}>
      <h2 className={styles.formTitle}>{isEditMode ? 'Edit User' : 'Create New User'}</h2>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className={styles.form}>
          <div className={styles.grid}>
            <FormItem name="email">
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="user@example.com"
                  value={values.email}
                  onChange={(e) => setValues((prev: FormValues) => ({ ...prev, email: e.target.value }))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>

            <FormItem name="fullName">
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="John Doe"
                  value={values.fullName ?? ''}
                  onChange={(e) => setValues((prev: FormValues) => ({ ...prev, fullName: e.target.value }))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>

            <FormItem name="displayName">
              <FormLabel>Display Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="Johnny"
                  value={values.displayName ?? ''}
                  onChange={(e) => setValues((prev: FormValues) => ({ ...prev, displayName: e.target.value }))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>

            <FormItem name="position">
              <FormLabel>Position</FormLabel>
              <FormControl>
                <Input
                  placeholder="Cashier"
                  value={values.position ?? ''}
                  onChange={(e) => setValues((prev: FormValues) => ({ ...prev, position: e.target.value }))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>

            <FormItem name="identificationType">
              <FormLabel>Identification Type</FormLabel>
              <Select
                value={values.identificationType ?? ''}
                onValueChange={(value) => setValues((prev: FormValues) => ({ ...prev, identificationType: value as IdentificationType }))}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {identificationTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>

            <FormItem name="identificationNumber">
              <FormLabel>Identification Number</FormLabel>
              <FormControl>
                <Input
                  placeholder="123456789"
                  value={values.identificationNumber ?? ''}
                  onChange={(e) => setValues((prev: FormValues) => ({ ...prev, identificationNumber: e.target.value }))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>

            <FormItem name="phone">
              <FormLabel>Phone</FormLabel>
              <FormControl>
                <Input
                  placeholder="+1 555-123-4567"
                  value={values.phone ?? ''}
                  onChange={(e) => setValues((prev: FormValues) => ({ ...prev, phone: e.target.value }))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>

            <FormItem name="address">
              <FormLabel>Address</FormLabel>
              <FormControl>
                <Input
                  placeholder="123 Main St, Anytown"
                  value={values.address ?? ''}
                  onChange={(e) => setValues((prev: FormValues) => ({ ...prev, address: e.target.value }))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>

            <FormItem name="dateOfBirth">
              <FormLabel>Date of Birth</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button variant="outline" className={styles.datePickerButton}>
                      {values.dateOfBirth ? format(values.dateOfBirth, 'PPP') : <span>Pick a date</span>}
                      <CalendarIcon size={16} />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent removeBackgroundAndPadding>
                  <Calendar
                    mode="single"
                    selected={values.dateOfBirth ?? undefined}
                    onSelect={(date) => setValues((prev: FormValues) => ({ ...prev, dateOfBirth: date ?? null }))}
                    disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>

            <FormItem name="status">
              <FormLabel>Status</FormLabel>
              <Select
                value={values.status ?? 'active'}
                onValueChange={(value) => setValues((prev: FormValues) => ({ ...prev, status: value }))}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {userStatuses.map(status => (
                    <SelectItem key={status} value={status} className={styles.statusSelectItem}>
                      <span className={`${styles.statusDot} ${styles.statusDot}`} data-status={status}></span>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          </div>

          <div className={styles.grid}>
            <FormItem name="password">
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder={isEditMode ? "Leave blank to keep current" : "••••••••"}
                  value={values.password ?? ''}
                  onChange={(e) => setValues((prev: FormValues) => ({ ...prev, password: e.target.value }))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>

            <FormItem name="confirmPassword">
              <FormLabel>Confirm Password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={values.confirmPassword ?? ''}
                  onChange={(e) => setValues((prev: FormValues) => ({ ...prev, confirmPassword: e.target.value }))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          </div>

          <FormItem name="roleNames">
            <FormLabel>Roles</FormLabel>
            <FormDescription>
              Select one or more roles for this user. Roles determine what parts of the system the user can access.
            </FormDescription>
            <div className={styles.rolesGrid}>
              {availableRoles.map(role => (
                <div key={role.id} className={styles.roleItem}>
                  <FormControl>
                    <Checkbox
                      id={`role-${role.id}`}
                      checked={values.roleNames.includes(role.name)}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setValues((prev: FormValues) => ({
                          ...prev,
                          roleNames: checked
                            ? [...prev.roleNames, role.name]
                            : prev.roleNames.filter(r => r !== role.name)
                        }));
                      }}
                    />
                  </FormControl>
                  <label htmlFor={`role-${role.id}`} className={styles.roleLabel}>
                    <span className={styles.roleName}>{role.name}</span>
                    {role.description && (
                      <span className={styles.roleDescription}>{role.description}</span>
                    )}
                  </label>
                </div>
              ))}
            </div>
            {availableRoles.length === 0 && (
              <p className={styles.noRoles}>No roles available. Please contact an administrator.</p>
            )}
            <FormMessage />
          </FormItem>

          <div className={styles.actions}>
            <Button type="button" variant="ghost" onClick={onCancel} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader2 size={16} className={styles.spinner} />}
              {isEditMode ? 'Save Changes' : 'Create User'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};