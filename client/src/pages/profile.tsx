import { useState } from "react";
import { useRequireAuth } from "@/lib/auth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import MainLayout from "@/components/layout/MainLayout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { getInitials } from "@/lib/utils";
import type { User } from "@shared/schema";

export default function Profile() {
  const { user, isReady } = useRequireAuth();
  const { toast } = useToast();
  
  // Profile form state
  const [formData, setFormData] = useState<Partial<User>>({});
  
  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: Partial<User>) => {
      const res = await apiRequest("PATCH", `/api/users/${user?.id}`, data);
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/session'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      const res = await apiRequest("POST", `/api/auth/change-password`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Password changed",
        description: "Your password has been changed successfully.",
      });
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to change password. Please check your current password and try again.",
        variant: "destructive",
      });
    }
  });
  
  // Password form state
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  
  if (!isReady || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  
  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(formData);
  };
  
  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "New password and confirm password must match.",
        variant: "destructive",
      });
      return;
    }
    
    changePasswordMutation.mutate({
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword,
    });
  };
  
  return (
    <MainLayout title="Profile">
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">My Profile</h1>
          
          <div className="bg-white p-6 rounded-lg shadow-sm mb-6 flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={user.profileImage} />
              <AvatarFallback className="bg-primary-100 text-primary-700 text-3xl">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            
            <div className="text-center sm:text-left flex-1">
              <h2 className="text-xl font-bold">{user.name}</h2>
              <p className="text-gray-500 mb-2">{user.email}</p>
              <div className="inline-block px-2 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-medium">
                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </div>
              
              <p className="text-gray-700 mt-4">
                {user.bio || 'No bio added yet.'}
              </p>
            </div>
          </div>
          
          <Tabs defaultValue="personal">
            <TabsList className="mb-6">
              <TabsTrigger value="personal">Personal Information</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              {user.role === 'contractor' && (
                <TabsTrigger value="professional">Professional Info</TabsTrigger>
              )}
            </TabsList>
            
            <TabsContent value="personal">
              <Card>
                <form onSubmit={handleProfileSubmit}>
                  <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          name="name"
                          defaultValue={user.name}
                          onChange={handleProfileChange}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="username">Username</Label>
                        <Input
                          id="username"
                          value={user.username}
                          disabled
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        defaultValue={user.email}
                        onChange={handleProfileChange}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        defaultValue={user.phone || ''}
                        onChange={handleProfileChange}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          name="city"
                          defaultValue={user.city || ''}
                          onChange={handleProfileChange}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="state">State</Label>
                        <Input
                          id="state"
                          name="state"
                          defaultValue={user.state || ''}
                          onChange={handleProfileChange}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="zip">ZIP Code</Label>
                        <Input
                          id="zip"
                          name="zip"
                          defaultValue={user.zip || ''}
                          onChange={handleProfileChange}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="address">Address</Label>
                      <Input
                        id="address"
                        name="address"
                        defaultValue={user.address || ''}
                        onChange={handleProfileChange}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        name="bio"
                        rows={4}
                        defaultValue={user.bio || ''}
                        onChange={handleProfileChange}
                        placeholder="Tell us a bit about yourself..."
                      />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button type="submit" disabled={updateProfileMutation.isPending}>
                      {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </TabsContent>
            
            <TabsContent value="security">
              <Card>
                <form onSubmit={handlePasswordSubmit}>
                  <CardHeader>
                    <CardTitle>Change Password</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <Input
                        id="currentPassword"
                        name="currentPassword"
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input
                        id="newPassword"
                        name="newPassword"
                        type="password"
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChange}
                        required
                      />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button type="submit" disabled={changePasswordMutation.isPending}>
                      {changePasswordMutation.isPending ? "Updating..." : "Change Password"}
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </TabsContent>
            
            {user.role === 'contractor' && (
              <TabsContent value="professional">
                <Card>
                  <CardHeader>
                    <CardTitle>Professional Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Trade Specializations</Label>
                      <div className="bg-gray-50 p-4 rounded-md">
                        {user.tradeSpecializations && user.tradeSpecializations.length > 0 ? (
                          <ul className="space-y-2">
                            {user.tradeSpecializations.map((trade, index) => (
                              <li key={index} className="flex justify-between items-center">
                                <span>{trade.name}</span>
                                <span className="text-sm bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">
                                  {trade.yearsExperience} {trade.yearsExperience === 1 ? 'year' : 'years'}
                                </span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-gray-500 text-center">No trade specializations added yet.</p>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-2">
                        To update your trade specializations, please contact support.
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="experience">Years of Experience</Label>
                      <Input
                        id="experience"
                        name="experience"
                        type="number"
                        min="0"
                        defaultValue={user.yearsOfExperience || ''}
                        onChange={handleProfileChange}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="professionalBio">Professional Bio</Label>
                      <Textarea
                        id="professionalBio"
                        name="professionalBio"
                        rows={4}
                        defaultValue={user.professionalBio || ''}
                        onChange={handleProfileChange}
                        placeholder="Describe your professional experience and services..."
                      />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button type="button" onClick={handleProfileSubmit} disabled={updateProfileMutation.isPending}>
                      {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>
    </MainLayout>
  );
}
