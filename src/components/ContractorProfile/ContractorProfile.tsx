import React, { useState } from 'react';
import { format } from 'date-fns';
import {
  Card,
  Avatar,
  Badge,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Separator,
  Button
} from '@/components/ui';
import { ContractorProfile as IContractorProfile } from '@shared/contractorProfile';
import { User } from '@shared/schema';
import { View, Text, ScrollView } from 'react-native';

interface ContractorProfileProps {
  profile: IContractorProfile;
  contractor: User;
  isAdmin?: boolean;
  onModerate?: (decision: 'approved' | 'rejected' | 'suspended', notes?: string) => void;
  onVerifyCredential?: (certificationId: string, verified: boolean) => void;
  onVerifyInsurance?: (verified: boolean) => void;
}

export function ContractorProfile({
  profile,
  contractor,
  isAdmin = false,
  onModerate,
  onVerifyCredential,
  onVerifyInsurance
}: ContractorProfileProps) {
  const [activeTab, setActiveTab] = useState('specializations');

  return (
    <ScrollView style={{ maxWidth: 800, padding: 24 }}>
      {/* Header Section */}
      <View style={{ flexDirection: 'row', gap: 24, marginBottom: 32 }}>
        <Avatar
          size="xl"
          src={contractor.profileImageUrl || undefined}
          fallback={`${contractor.firstName?.[0]}${contractor.lastName?.[0]}`}
        />
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            <Text style={{ fontSize: 24, fontWeight: 'bold' }}>
              {contractor.firstName} {contractor.lastName}
            </Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {profile.badges.topRated && (
                <Badge variant="success">Top Rated</Badge>
              )}
              {profile.badges.verified && (
                <Badge variant="primary">Verified</Badge>
              )}
              {profile.badges.premiumContractor && (
                <Badge variant="premium">Premium</Badge>
              )}
              {profile.badges.backgroundChecked && (
                <Badge variant="info">Background Checked</Badge>
              )}
            </View>
          </View>
          <Text style={{ color: '#64748b', marginTop: 8 }}>{profile.bio}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ fontWeight: '500' }}>{profile.yearsOfExperience}</Text>
              <Text style={{ color: '#64748b' }}>Years Experience</Text>
            </View>
            <Separator orientation="vertical" style={{ height: 16 }} />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ fontWeight: '500' }}>{profile.specializations.length}</Text>
              <Text style={{ color: '#64748b' }}>Specializations</Text>
            </View>
          </View>
        </View>

        {/* Admin Actions */}
        {isAdmin && profile.profileStatus === 'pending' && onModerate && (
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Button
              variant="success"
              onPress={() => onModerate('approved')}
            >
              Approve
            </Button>
            <Button
              variant="destructive"
              onPress={() => onModerate('rejected')}
            >
              Reject
            </Button>
          </View>
        )}
      </View>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="specializations">Specializations</TabsTrigger>
          <TabsTrigger value="certifications">Certifications</TabsTrigger>
          <TabsTrigger value="experience">Experience</TabsTrigger>
          <TabsTrigger value="education">Education</TabsTrigger>
          {(isAdmin || profile.badges.verified) && (
            <TabsTrigger value="insurance">Insurance</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="specializations">
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
            {profile.specializations.map((specialization, index) => (
              <Card key={index} style={{ padding: 16, flex: 1, minWidth: '45%' }}>
                <Text style={{ fontWeight: '500' }}>{specialization}</Text>
              </Card>
            ))}
          </View>
        </TabsContent>

        <TabsContent value="certifications">
          <View style={{ gap: 16 }}>
            {profile.certifications.map((cert, index) => (
              <Card key={index} style={{ padding: 16 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <View>
                    <Text style={{ fontWeight: '500' }}>{cert.name}</Text>
                    <Text style={{ fontSize: 14, color: '#64748b' }}>
                      {cert.issuingBody}
                    </Text>
                    <Text style={{ fontSize: 14, marginTop: 8 }}>
                      Issued: {format(new Date(cert.issueDate), 'MMM yyyy')}
                      {cert.expiryDate && (
                        <> · Expires: {format(new Date(cert.expiryDate), 'MMM yyyy')}</>
                      )}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    {cert.verified ? (
                      <Badge variant="success">Verified</Badge>
                    ) : (
                      isAdmin && onVerifyCredential && (
                        <Button
                          variant="outline"
                          onPress={() => onVerifyCredential(cert.name, true)}
                        >
                          Verify
                        </Button>
                      )
                    )}
                  </View>
                </View>
              </Card>
            ))}
          </View>
        </TabsContent>

        <TabsContent value="experience">
          <View style={{ gap: 16 }}>
            {profile.experience.map((exp, index) => (
              <Card key={index} style={{ padding: 16 }}>
                <Text style={{ fontWeight: '500' }}>{exp.title}</Text>
                <Text style={{ fontSize: 14, color: '#64748b', marginTop: 4 }}>
                  {format(new Date(exp.startDate), 'MMM yyyy')} - 
                  {exp.current ? ' Present' : format(new Date(exp.endDate!), ' MMM yyyy')}
                </Text>
                <Text style={{ marginTop: 8 }}>{exp.description}</Text>
              </Card>
            ))}
          </View>
        </TabsContent>

        <TabsContent value="education">
          <View style={{ gap: 16 }}>
            {profile.education.map((edu, index) => (
              <Card key={index} style={{ padding: 16 }}>
                <Text style={{ fontWeight: '500' }}>{edu}</Text>
              </Card>
            ))}
          </View>
        </TabsContent>

        {(isAdmin || profile.badges.verified) && (
          <TabsContent value="insurance">
            {profile.insuranceInfo ? (
              <Card style={{ padding: 16 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <View>
                    <Text style={{ fontWeight: '500' }}>{profile.insuranceInfo.provider}</Text>
                    <Text style={{ fontSize: 14, color: '#64748b' }}>
                      Policy: {profile.insuranceInfo.policyNumber}
                    </Text>
                    <Text style={{ fontSize: 14, marginTop: 8 }}>
                      Coverage: ${profile.insuranceInfo.coverageAmount.toLocaleString()}
                    </Text>
                    <Text style={{ fontSize: 14 }}>
                      Expires: {format(new Date(profile.insuranceInfo.expiryDate), 'MMM dd, yyyy')}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    {profile.insuranceInfo.verified ? (
                      <Badge variant="success">Verified</Badge>
                    ) : (
                      isAdmin && onVerifyInsurance && (
                        <Button
                          variant="outline"
                          onPress={() => onVerifyInsurance(true)}
                        >
                          Verify Insurance
                        </Button>
                      )
                    )}
                  </View>
                </View>
              </Card>
            ) : (
              <Text style={{ color: '#64748b' }}>No insurance information provided.</Text>
            )}
          </TabsContent>
        )}
      </Tabs>
    </ScrollView>
  );
} 