
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { users as allUsers } from "@/lib/data";
import { User } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function ManageUsersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    if (!user) {
      router.push("/login");
    } else if (user.role !== 'developer') {
      toast({ title: "Access Denied", description: "This page is for developers only.", variant: "destructive" });
      router.push("/");
    } else {
      setUsers(allUsers);
    }
  }, [user, router, toast]);

  if (!user || user.role !== 'developer') {
    return <div className="container text-center py-10">Redirecting...</div>;
  }

  return (
    <div className="container py-12">
      <Card>
        <CardHeader>
          <CardTitle>Manage Users</CardTitle>
          <CardDescription>View and manage all user accounts.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.name}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>{u.phone}</TableCell>
                  <TableCell>
                    <Badge variant={u.role === 'developer' ? 'destructive' : u.role === 'wholesaler' ? 'default' : 'secondary'}>
                      {u.role}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
