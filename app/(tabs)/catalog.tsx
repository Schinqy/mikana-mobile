import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Switch,
  Platform,
} from 'react-native';
import { useCatalogStore } from '../../src/store/useCatalogStore';
import { Card } from '../../src/components/ui/Card';
import { Badge } from '../../src/components/ui/Badge';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { colors } from '../../src/theme/colors';
import {
  Briefcase,
  Plus,
  Edit2,
  DollarSign,
  Clock,
  CheckCircle2,
  Building2,
  Phone,
  Trash2,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

export default function CatalogScreen() {
  const {
    profile,
    services,
    updateProfile,
    addService,
    deleteService,
    toggleServiceActive,
  } = useCatalogStore();

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [businessName, setBusinessName] = useState(profile.businessName);
  const [tagline, setTagline] = useState(profile.tagline);
  const [whatsappNumber, setWhatsappNumber] = useState(profile.whatsappNumber);
  const [pitchGuidelines, setPitchGuidelines] = useState(profile.customPitchGuidelines);

  const [isAddingService, setIsAddingService] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newTurnaround, setNewTurnaround] = useState('');
  const [newDescription, setNewDescription] = useState('');

  const handleSaveProfile = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    updateProfile({
      businessName,
      tagline,
      whatsappNumber,
      customPitchGuidelines: pitchGuidelines,
    });
    setIsEditingProfile(false);
  };

  const handleCreateService = () => {
    if (!newTitle.trim() || !newPrice.trim()) {
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addService({
      title: newTitle.trim(),
      category: newCategory.trim() || 'General Services',
      description: newDescription.trim() || 'Professional execution with delivery guarantee.',
      pricingModel: 'fixed',
      price: parseInt(newPrice.replace(/[^\d]/g, '') || '1000', 10),
      currency: 'USD',
      turnaroundTime: newTurnaround.trim() || '3–5 Days',
      keyDeliverables: ['Standard Scope Deliverables', 'Quality Inspection & Handover'],
      portfolioLinks: [],
      isActive: true,
    });

    setNewTitle('');
    setNewCategory('');
    setNewPrice('');
    setNewTurnaround('');
    setNewDescription('');
    setIsAddingService(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Service & Pricing Catalog</Text>
          <Text style={styles.subtitle}>
            Your products and rates used by AI to generate grounded quotes
          </Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Business Profile Card */}
        <Card style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.profileTitleRow}>
              <Building2 size={16} color={colors.brandNavy} />
              <Text style={styles.profileBusinessName}>{profile.businessName}</Text>
            </View>
            <TouchableOpacity
              onPress={() => setIsEditingProfile(!isEditingProfile)}
              style={styles.editIconBtn}
            >
              <Edit2 size={13} color={colors.brandNavy} />
              <Text style={styles.editBtnText}>{isEditingProfile ? 'Cancel' : 'Edit'}</Text>
            </TouchableOpacity>
          </View>

          {isEditingProfile ? (
            <View style={styles.profileForm}>
              <Input
                label="BUSINESS NAME"
                value={businessName}
                onChangeText={setBusinessName}
                placeholder="e.g. Apex Engineering & Print"
              />
              <Input
                label="TAGLINE & SPECIALTY"
                value={tagline}
                onChangeText={setTagline}
                placeholder="e.g. Precision apparel and corporate gifts"
              />
              <Input
                label="WHATSAPP NUMBER"
                value={whatsappNumber}
                onChangeText={setWhatsappNumber}
                keyboardType="phone-pad"
                placeholder="+27..."
              />
              <Input
                label="CUSTOM PITCH GUIDELINES"
                value={pitchGuidelines}
                onChangeText={setPitchGuidelines}
                placeholder="e.g. Always mention free Sandton delivery"
              />
              <Button size="sm" variant="primary" onPress={handleSaveProfile} style={styles.saveBtn}>
                Save Profile Changes
              </Button>
            </View>
          ) : (
            <View style={styles.profileSummary}>
              <Text style={styles.taglineText}>{profile.tagline}</Text>
              <View style={styles.phoneRow}>
                <Phone size={12} color={colors.textMuted} />
                <Text style={styles.phoneText}>{profile.whatsappNumber}</Text>
              </View>
            </View>
          )}
        </Card>

        {/* Services List Header */}
        <View style={styles.servicesHeader}>
          <View style={styles.servicesTitleRow}>
            <Briefcase size={15} color={colors.brandNavy} />
            <Text style={styles.servicesTitle}>Active Offerings ({services.length})</Text>
          </View>
          <Button
            size="sm"
            variant="primary"
            icon={<Plus size={13} color={colors.textInverse} />}
            onPress={() => setIsAddingService(!isAddingService)}
          >
            Add Offering
          </Button>
        </View>

        {/* Add Offering Form */}
        {isAddingService && (
          <Card style={styles.addServiceCard}>
            <Text style={styles.addCardTitle}>New Service / Product Offering</Text>
            <Input
              label="SERVICE / PRODUCT TITLE"
              value={newTitle}
              onChangeText={setNewTitle}
              placeholder="e.g. 50x Custom Branded Hoodies"
            />
            <Input
              label="CATEGORY"
              value={newCategory}
              onChangeText={setNewCategory}
              placeholder="e.g. Apparel & Merchandise"
            />
            <Input
              label="STANDARD PRICE (USD / ZAR)"
              value={newPrice}
              onChangeText={setNewPrice}
              keyboardType="numeric"
              placeholder="e.g. 450"
            />
            <Input
              label="TYPICAL TURNAROUND"
              value={newTurnaround}
              onChangeText={setNewTurnaround}
              placeholder="e.g. 3–5 Business Days"
            />
            <Input
              label="DESCRIPTION / DELIVERABLES"
              value={newDescription}
              onChangeText={setNewDescription}
              placeholder="Includes embroidery, proofing, and delivery"
            />
            <View style={styles.addBtnRow}>
              <Button size="sm" variant="outline" onPress={() => setIsAddingService(false)} style={{ flex: 1 }}>
                Cancel
              </Button>
              <Button size="sm" variant="primary" onPress={handleCreateService} style={{ flex: 1 }}>
                Save Offering
              </Button>
            </View>
          </Card>
        )}

        {/* Service Cards */}
        {services.map((item: ServiceItem) => (
          <Card key={item.id} style={styles.serviceCard}>
            <View style={styles.serviceTop}>
              <View style={styles.serviceTitleGroup}>
                <Text style={styles.serviceTitleText}>{item.title}</Text>
                <Badge variant="default">{item.category}</Badge>
              </View>
              <Switch
                value={item.isActive}
                onValueChange={() => toggleServiceActive(item.id)}
                trackColor={{ false: colors.borderStrong, true: colors.emerald }}
                thumbColor="#FFFFFF"
              />
            </View>

            <Text style={styles.serviceDescText}>{item.description}</Text>

            <View style={styles.serviceMetaRow}>
              <View style={styles.pricePill}>
                <DollarSign size={13} color={colors.emerald} />
                <Text style={styles.pricePillText}>${item.price.toLocaleString()}</Text>
              </View>
              <View style={styles.turnaroundPill}>
                <Clock size={12} color={colors.textSecondary} />
                <Text style={styles.turnaroundPillText}>{item.turnaroundTime}</Text>
              </View>
              <TouchableOpacity onPress={() => deleteService(item.id)} style={styles.deleteBtn}>
                <Trash2 size={14} color={colors.rose} />
              </TouchableOpacity>
            </View>
          </Card>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.canvas,
    paddingTop: Platform.OS === 'android' ? 30 : 0,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  profileCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    marginBottom: 20,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  profileTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  profileBusinessName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  editIconBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: colors.surfaceElevated,
  },
  editBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.brandNavy,
  },
  profileSummary: {
    gap: 4,
  },
  taglineText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  phoneText: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '500',
  },
  profileForm: {
    marginTop: 10,
  },
  saveBtn: {
    marginTop: 6,
  },
  servicesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  servicesTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  servicesTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  addServiceCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    marginBottom: 16,
  },
  addCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  addBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  serviceCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    marginBottom: 12,
  },
  serviceTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  serviceTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  serviceTitleText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  serviceDescText: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
    marginBottom: 10,
  },
  serviceMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pricePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: colors.emeraldBg,
    borderColor: colors.emeraldBorder,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  pricePillText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.emerald,
  },
  turnaroundPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  turnaroundPillText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  deleteBtn: {
    marginLeft: 'auto',
    padding: 6,
  },
});
