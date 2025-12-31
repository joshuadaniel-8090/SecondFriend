'use client';

import * as React from 'react';
import {
  collection,
  onSnapshot,
  query,
  where,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  writeBatch,
  setDoc,
} from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '@/lib/firebase/config';
import type { AppUser, College, Session, UserRole } from '@/lib/types';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useForm } from 'react-hook-form';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import {
  Building,
  Users,
  UserCheck,
  MessageCircle,
  CheckCircle,
  PlusCircle,
  MoreVertical,
  Trash2,
  Edit,
  X,
  Shield,
  UserPlus,
  Eye,
  EyeOff,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

// Main Admin Page Component
export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const [colleges, setColleges] = React.useState<College[]>([]);
  const [students, setStudents] = React.useState<AppUser[]>([]);
  const [counsellors, setCounsellors] = React.useState<AppUser[]>([]);
  const [admins, setAdmins] = React.useState<AppUser[]>([]);
  const [sessions, setSessions] = React.useState<Session[]>([]);
  const [loading, setLoading] = React.useState(true);
  const { toast } = useToast();

  React.useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    let mounted = true;

    const unsubscribes = [
      onSnapshot(collection(db, 'colleges'), (snapshot) => {
        if (mounted) setColleges(snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as College)))
      }),
      onSnapshot(
        query(collection(db, 'users'), where('role', '==', 'student')),
        (snapshot) => {
          if (mounted) setStudents(snapshot.docs.map((d) => d.data() as AppUser))
        }
      ),
      onSnapshot(
        query(collection(db, 'users'), where('role', '==', 'counsellor')),
        (snapshot) => {
           if (mounted) setCounsellors(snapshot.docs.map((d) => d.data() as AppUser))
        }
      ),
       onSnapshot(
        query(collection(db, 'users'), where('role', '==', 'admin')),
        (snapshot) => {
          if (mounted) setAdmins(snapshot.docs.map((d) => d.data() as AppUser))
        }
      ),
      onSnapshot(collection(db, 'sessions'), (snapshot) => {
         if (mounted) setSessions(snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Session)))
      }),
    ];

    Promise.all(unsubscribes).then(() => {
        if(mounted) setLoading(false);
    });

    return () => {
        mounted = false;
        unsubscribes.forEach((unsub) => unsub());
    }
  }, [user]);

  if (authLoading || loading) {
    return <div className="flex h-full w-full items-center justify-center"><LoadingSpinner /></div>;
  }
  
  const allUsers = [...students, ...counsellors, ...admins];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="font-headline text-3xl font-bold">Admin Panel</h1>
      </div>
      <Tabs defaultValue="dashboard">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="colleges">Colleges</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="counsellors">Counsellors</TabsTrigger>
          <TabsTrigger value="admins">Admins</TabsTrigger>
        </TabsList>
        <TabsContent value="dashboard" className="mt-6">
          <DashboardSection
            colleges={colleges}
            students={students}
            counsellors={counsellors}
            sessions={sessions}
          />
        </TabsContent>
        <TabsContent value="colleges" className="mt-6">
          <CollegeManagementSection
            colleges={colleges}
            users={allUsers}
            sessions={sessions}
            toast={toast}
          />
        </TabsContent>
        <TabsContent value="students" className="mt-6">
          <UserManagementSection
            role="student"
            users={students}
            colleges={colleges}
            sessions={sessions}
            toast={toast}
          />
        </TabsContent>
        <TabsContent value="counsellors" className="mt-6">
          <UserManagementSection
            role="counsellor"
            users={counsellors}
            colleges={colleges}
            sessions={sessions}
            toast={toast}
          />
        </TabsContent>
        <TabsContent value="admins" className="mt-6">
           <UserManagementSection
            role="admin"
            users={admins}
            colleges={colleges}
            sessions={sessions}
            toast={toast}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Sub-components for each tab

function DashboardSection({
  colleges,
  students,
  counsellors,
  sessions,
}: {
  colleges: College[];
  students: AppUser[];
  counsellors: AppUser[];
  sessions: Session[];
}) {
  const stats = {
    totalColleges: colleges.length,
    totalStudents: students.length,
    totalCounsellors: counsellors.length,
    activeSessions: sessions.filter((s) => s.status === 'active').length,
    completedSessions: sessions.filter((s) => s.status === 'closed').length,
  };

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
      <StatCard
        title="Total Colleges"
        value={stats.totalColleges}
        icon={<Building />}
      />
      <StatCard
        title="Total Students"
        value={stats.totalStudents}
        icon={<Users />}
      />
      <StatCard
        title="Total Counsellors"
        value={stats.totalCounsellors}
        icon={<UserCheck />}
      />
      <StatCard
        title="Active Sessions"
        value={stats.activeSessions}
        icon={<MessageCircle />}
      />
      <StatCard
        title="Completed Sessions"
        value={stats.completedSessions}
        icon={<CheckCircle />}
      />
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

const collegeFormSchema = z.object({
  name: z.string().min(3, 'Name is too short'),
  domain: z
    .string()
    .min(4, 'Domain is too short')
    .refine((d) => d.includes('.'), 'Invalid domain format'),
  location: z.string().min(2, 'Location is too short'),
});

function CollegeManagementSection({
  colleges,
  users,
  sessions,
  toast,
}: {
  colleges: College[];
  users: AppUser[];
  sessions: Session[];
  toast: any;
}) {
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingCollege, setEditingCollege] = React.useState<College | null>(
    null
  );

  const handleAdd = () => {
    setEditingCollege(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (college: College) => {
    setEditingCollege(college);
    setIsDialogOpen(true);
  };

  const handleDelete = async (collegeId: string) => {
    try {
      const batch = writeBatch(db);

      // Delete the college
      batch.delete(doc(db, 'colleges', collegeId));

      // Find and delete users associated with the college
      const usersToDelete = users.filter((u) => u.collegeId === collegeId);
      usersToDelete.forEach((user) => {
        batch.delete(doc(db, 'users', user.uid));
      });

      // Find and delete sessions associated with the college
      const sessionsToDelete = sessions.filter(
        (s) => s.collegeId === collegeId
      );
      sessionsToDelete.forEach((session) => {
        batch.delete(doc(db, 'sessions', session.id));
      });

      await batch.commit();
      toast({
        title: 'Success',
        description: 'College and all associated data deleted.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Failed to delete college: ${error.message}`,
      });
    }
  };

  const handleStatusToggle = async (college: College) => {
    const newStatus = college.status === 'active' ? 'inactive' : 'active';
    try {
      await updateDoc(doc(db, 'colleges', college.id), { status: newStatus });
      toast({
        title: 'Success',
        description: `College status updated to ${newStatus}.`,
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Failed to update status: ${error.message}`,
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={handleAdd}>
          <PlusCircle className="mr-2" /> Add College
        </Button>
      </div>
      <CollegeFormDialog
        isOpen={isDialogOpen}
        setIsOpen={setIsDialogOpen}
        college={editingCollege}
        toast={toast}
      />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {colleges.map((college) => (
          <Card key={college.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="font-headline">{college.name}</CardTitle>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEdit(college)}>
                      <Edit className="mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleStatusToggle(college)}>
                      {college.status === 'active' ? (
                        <X className="mr-2" />
                      ) : (
                        <CheckCircle className="mr-2" />
                      )}
                      {college.status === 'active' ? 'Deactivate' : 'Activate'}
                    </DropdownMenuItem>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem
                          onSelect={(e) => e.preventDefault()}
                          className="text-red-500"
                        >
                          <Trash2 className="mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete the college, along with
                            all associated students, counsellors, and session
                            data. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(college.id)}
                            className="bg-destructive hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <CardDescription>{college.location}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm">
                <strong>Domain:</strong> {college.domain}
              </p>
              <div className="flex items-center">
                <Badge
                  variant={
                    college.status === 'active' ? 'default' : 'destructive'
                  }
                >
                  {college.status}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground pt-2">
                Created: {format(college.createdAt.toDate(), 'PPP')}
              </p>
            </CardContent>
            <CardFooter className="space-x-4">
              <p className="text-sm">
                <strong>Students:</strong>{' '}
                {
                  users.filter(
                    (u) => u.role === 'student' && u.collegeId === college.id
                  ).length
                }
              </p>
              <p className="text-sm">
                <strong>Counsellors:</strong>{' '}
                {
                  users.filter(
                    (u) => u.role === 'counsellor' && u.collegeId === college.id
                  ).length
                }
              </p>
            </CardFooter>
          </Card>
        ))}
      </div>
      {colleges.length === 0 && (
        <p className="text-center text-muted-foreground">
          No colleges found. Add one to get started.
        </p>
      )}
    </div>
  );
}

function CollegeFormDialog({
  isOpen,
  setIsOpen,
  college,
  toast,
}: {
  isOpen: boolean;
  setIsOpen: (o: boolean) => void;
  college: College | null;
  toast: any;
}) {
  const form = useForm<z.infer<typeof collegeFormSchema>>({
    resolver: zodResolver(collegeFormSchema),
  });

  React.useEffect(() => {
    if (college) {
      form.reset({
        name: college.name,
        domain: college.domain,
        location: college.location,
      });
    } else {
      form.reset({ name: '', domain: '', location: '' });
    }
  }, [college, form, isOpen]);

  const onSubmit = async (values: z.infer<typeof collegeFormSchema>) => {
    try {
      if (college) {
        await updateDoc(doc(db, 'colleges', college.id), values);
        toast({ title: 'Success', description: 'College updated successfully.' });
      } else {
        await addDoc(collection(db, 'colleges'), {
          ...values,
          status: 'active',
          createdAt: serverTimestamp(),
        });
        toast({ title: 'Success', description: 'College added successfully.' });
      }
      setIsOpen(false);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Failed to save college: ${error.message}`,
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-headline">
            {college ? 'Edit College' : 'Add New College'}
          </DialogTitle>
          <DialogDescription>
            Fill in the details for the college.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              name="name"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>College Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="domain"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Domain</FormLabel>
                  <FormControl>
                    <Input placeholder="example.edu" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="location"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function UserManagementSection({
  role,
  users,
  colleges,
  sessions,
  toast,
}: {
  role: 'student' | 'counsellor' | 'admin';
  users: AppUser[];
  colleges: College[];
  sessions: Session[];
  toast: any;
}) {
  const [filterCollege, setFilterCollege] = React.useState('all');
  const [isAddUserOpen, setIsAddUserOpen] = React.useState(false);
  const filteredUsers = users.filter(
    (user) => filterCollege === 'all' || user.collegeId === filterCollege
  );

  const handleStatusToggle = async (user: AppUser) => {
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    try {
      await updateDoc(doc(db, 'users', user.uid), { status: newStatus });
      toast({
        title: 'Success',
        description: `User status updated to ${newStatus}.`,
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Failed to update status: ${error.message}`,
      });
    }
  };

  const getCollegeName = (collegeId?: string) =>
    colleges.find((c) => c.id === collegeId)?.name || 'N/A';

  const title = role.charAt(0).toUpperCase() + role.slice(1) + 's';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        {role !== 'admin' ? (
            <Select value={filterCollege} onValueChange={setFilterCollege}>
                <SelectTrigger className="w-[280px]">
                    <SelectValue placeholder="Filter by college..." />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Colleges</SelectItem>
                    {colleges.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                        {c.name}
                    </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        ) : <div/>}
        <Button onClick={() => setIsAddUserOpen(true)}>
            <UserPlus className="mr-2"/> Add {role === 'student' ? 'Student' : role === 'counsellor' ? 'Counsellor' : 'Admin'}
        </Button>
      </div>
      <AddUserDialog isOpen={isAddUserOpen} setIsOpen={setIsAddUserOpen} toast={toast} colleges={colleges} defaultRole={role}/>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredUsers.map((user) => (
          <Card key={user.uid}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle>{user.name}</CardTitle>
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon"><MoreVertical /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleStatusToggle(user)}>
                          {user.status === 'active' ? <X className="mr-2"/> : <CheckCircle className="mr-2"/>}
                          {user.status === 'active' ? 'Deactivate' : 'Activate'}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <CardDescription>{user.email}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {role !== 'admin' && <p>
                <strong>College:</strong> {getCollegeName(user.collegeId)}
              </p>}
              {role === 'student' && user.department && (
                <p>
                  <strong>Department:</strong> {user.department}
                </p>
              )}
              {role === 'student' && user.year && (
                <p>
                  <strong>Year:</strong> {user.year}
                </p>
              )}
              {role === 'counsellor' && user.specialization && (
                <p>
                  <strong>Specialization:</strong> {user.specialization}
                </p>
              )}
              {role === 'counsellor' && user.experience && (
                <p>
                  <strong>Experience:</strong> {user.experience} years
                </p>
              )}
              <div className="flex items-center pt-2">
                <Badge
                  variant={user.status === 'active' ? 'default' : 'destructive'}
                >
                  {user.status || 'inactive'}
                </Badge>
              </div>
            </CardContent>
            {role !== 'admin' && <CardFooter>
              <p className="text-sm">
                <strong>Total Sessions:</strong>{' '}
                {role === 'student'
                  ? sessions.filter((s) => s.studentId === user.uid).length
                  : sessions.filter((s) => s.counsellorId === user.uid).length}
              </p>
            </CardFooter>}
          </Card>
        ))}
      </div>
      {filteredUsers.length === 0 && (
        <p className="text-center text-muted-foreground">
          No {role}s found for this filter.
        </p>
      )}
    </div>
  );
}

const userFormSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
  role: z.enum(['student', 'counsellor', 'admin']),
  collegeId: z.string().optional(),
}).refine(data => {
    if (data.role === 'student' || data.role === 'counsellor') {
        return !!data.collegeId;
    }
    return true;
}, {
    message: 'College is required for students and counsellors.',
    path: ['collegeId'],
});


function AddUserDialog({ isOpen, setIsOpen, toast, colleges, defaultRole }: { isOpen: boolean, setIsOpen: (o: boolean) => void, toast: any, colleges: College[], defaultRole: UserRole }) {
  const [showPassword, setShowPassword] = React.useState(false);
  const form = useForm<z.infer<typeof userFormSchema>>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
        name: '',
        email: '',
        password: '',
        role: defaultRole,
        collegeId: ''
    }
  });
  
  const role = form.watch('role');

  React.useEffect(() => {
    form.reset({
        name: '',
        email: '',
        password: '',
        role: defaultRole,
        collegeId: ''
    })
  }, [isOpen, defaultRole, form]);

  const onSubmit = async (values: z.infer<typeof userFormSchema>) => {
    try {
      // Create user in a temporary auth instance to avoid logging out admin.
      // This is a common pattern but requires careful handling.
      // For a robust solution, this would be a Firebase Function.
      const { user: newUser } = await createUserWithEmailAndPassword(auth, values.email, values.password);

      if (!newUser) {
          throw new Error("Could not create user account in Firebase Auth.");
      }
      
      const userDoc = {
        uid: newUser.uid,
        name: values.name,
        email: values.email,
        role: values.role,
        status: 'active' as 'active' | 'inactive',
        ...( (values.role === 'student' || values.role === 'counsellor') && { collegeId: values.collegeId || null })
      };


      await setDoc(doc(db, 'users', newUser.uid), userDoc);
      
      toast({
        title: 'User Created',
        description: `Successfully created ${values.role} account for ${values.name}.`,
      });
      setIsOpen(false);
      
      // IMPORTANT: In a real app you might need to re-authenticate the admin user here
      // as creating a user can sometimes change the auth state.
      // For this implementation, we assume the AuthProvider handles it.

    } catch (error: any) {
      let description = 'An unexpected error occurred.';
      if (error.code === 'auth/email-already-in-use') {
        description = 'This email address is already registered.';
      } else {
        description = error.message;
      }
      toast({
        variant: 'destructive',
        title: 'Creation Failed',
        description: description,
      });
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-headline">Create a New User</DialogTitle>
          <DialogDescription>Fill in the details to create a new account.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="name@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                         <div className="relative">
                          <Input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            {...field}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute inset-y-0 right-0 h-full px-3"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                            <span className="sr-only">
                              {showPassword ? 'Hide password' : 'Show password'}
                            </span>
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="student">Student</SelectItem>
                          <SelectItem value="counsellor">Counsellor</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {(role === 'student' || role === 'counsellor') && <FormField
                  control={form.control}
                  name="collegeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>College</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select a college"/></SelectTrigger></FormControl>
                        <SelectContent>
                          {colleges.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />}
            <DialogFooter>
                <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                <Button type="submit">Create User</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
