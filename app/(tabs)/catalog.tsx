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
  Alert,
} from 'react-native';
import { useCatalogStore } from '../../src/store/useCatalogStore';
import { ServiceItem } from '../../src/types/catalog';
import { Card } from '../../src/components/ui/Card';
import { Badge } from '../../src/components/ui/Badge';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import {
  Briefcase,
  Plus,
  Edit2,
  DollarSign,
  Clock,
  ExternalLink,
  CheckCircle2,
  Building2,
  Phone,
  Globe,
  Trash2,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

export default function CatalogScreen() {
  const {
    profile,
    services,
    updateProfile,
    addService,
    updateService,
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
      portfolioLinks: ['https://vanguardsolutions.io'],
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
          <Text style={styles.title}>Service & Product Catalog</Text>
          <Text style={styles.subtitle}>
            AI uses your active catalog to ground sales proposals & pricing
          </Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Business Profile Card */}
        <Card elevated style={styles.profileCard}>
          <View style={styles.profileTopRow}>
            <View style={styles.profileLeft}>
              <Building2 size={18} color="#3b82f6" />
              <Text style={styles.profileTitle}>Business Profile</Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setIsEditingProfile(!isEditingProfile)}
              style={styles.editBtn}
            >
              <Edit2 size={13} color="#a1a1aa" />
              <Text style={styles.editBtnText}>
                {isEditingProfile ? 'Cancel' : 'Edit'}
              </Text>
            </TouchableOpacity>
          </View>

          {isEditingProfile ? (
            <View style={styles.editForm}>
              <Input
                label="Company / Freelance Name"
                value={businessName}
                onChangeText={setBusinessName}
              />
              <Input
                label="Tagline & Core Value"
                value={tagline}
                onChangeText={setTagline}
              />
              <Input
                label="WhatsApp Phone Number"
                value={whatsappNumber}
                onChangeText={setWhatsappNumber}
              />
              <Input
                label="Custom Pitch Rules (Prompt Instructions for AI)"
                value={pitchGuidelines}
                onChangeText={setPitchGuidelines}
                multiline
                numberOfLines={3}
              />
              <Button size="sm" variant="primary" onPress={handleSaveProfile}>
                Save Profile
              </Button>
            </View>
          ) : (
            <View>
              <Text style={styles.companyName}>{profile.businessName}</Text>
              <Text style={styles.tagline}>{profile.tagline}</Text>

              <View style={styles.profileMetaRow}>
                <View style={styles.profileMetaItem}>
                  <Phone size={12} color="#71717a" />
                  <Text style={styles.profileMetaText}>{profile.whatsappNumber}</Text>
                </View>
                <View style={styles.profileMetaItem}>
                  <Globe size={12} color="#71717a" />
                  <Text style={styles.profileMetaText}>{profile.website}</Text>
                </View>
              </View>
            </View>
          )}
        </Card>

        {/* Services Section Header */}
        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={styles.sectionTitle}>Active Offerings ({services.length})</Text>
            <Text style={styles.sectionSub}>Matched during live radar intercepts</Text>
          </View>

          <Button
            size="sm"
            variant="secondary"
            icon={<Plus size={13} color="#f4f4f5" />}
            onPress={() => setIsAddingService(!isAddingService)}
          >
            {isAddingService ? 'Cancel' : 'Add Item'}
          </Button>
        </View>

        {/* Add Service Form */}
        {isAddingService && (
          <Card style={styles.addCard}>
            <Text style={styles.addCardTitle}>New Service / Product Offering</Text>
            <Input
              label="Service Title"
              placeholder="e.g. Mobile App MVP Sprint"
              value={newTitle}
              onChangeText={setNewTitle}
            />
            <Input
              label="Category"
              placeholder="e.g. Software & Mobile Dev"
              value={newCategory}
              onChangeText={setNewCategory}
            />
            <View style={styles.inputRow}>
              <View style={styles.flex1}>
                <Input
                  label="Price (USD)"
                  placeholder="2500"
                  keyboardType="numeric"
                  value={newPrice}
                  onChangeText={setNewPrice}
                />
              </View>
              <View style={styles.flex1}>
                <Input
                  label="Turnaround Time"
                  placeholder="10–14 Days"
                  value={newTurnaround}
                  onChangeText={setNewTurnaround}
                />
              </View>
            </View>
            <Input
              label="Description & Scope"
              placeholder="Summary of deliverables..."
              value={newDescription}
              onChangeText={setNewDescription}
              multiline
              numberOfLines={2}
            />
            <Button size="sm" variant="primary" onPress={handleCreateService}>
              Save to Catalog
            </Button>
          </Card>
        )}

        {/* Service Cards List */}
        {services.map((service) => (
          <Card key={service.id} style={styles.serviceCard}>
            <View style={styles.serviceTopRow}>
              <View style={styles.serviceLeft}>
                <Text style={styles.serviceTitle}>{service.title}</Text>
                <Text style={styles.serviceCategory}>{service.category}</Text>
              </View>
              <Switch
                value={service.isActive}
                onValueChange={() => toggleServiceActive(service.id)}
                trackColor={{ false: '#27272a', true: '#10b981' }}
                thumbColor="#f4f4f5"
              />
            </View>

            <Text style={styles.serviceDesc}>{service.description}</Text>

            <View style={styles.serviceMetaRow}>
              <View style={styles.metaBadge}>
                <DollarSign size={13} color="#10b981" />
                <Text style={styles.metaPrice}>
                  ${service.price.toLocaleString()}{' '}
                  <Text style={styles.metaModel}>({service.pricingModel})</Text>
                </Text>
              </View>

              <View style={styles.metaBadge}>
                <Clock size={13} color="#a1a1aa" />
                <Text style={styles.metaTurnaround}>{service.turnaroundTime}</Text>
              </View>
            </View>

            {/* Deliverables */}
            <View style={styles.deliverablesBox}>
              <Text style={styles.deliverablesHeader}>Deliverables Included:</Text>
              {service.keyDeliverables.map((item, idx) => (
                <View key={idx} style={styles.deliverableItem}>
                  <CheckCircle2 size={12} color="#10b981" />
                  <Text style={styles.deliverableText}>{item}</Text>
                </View>
              ))}
            </View>

            {/* Delete button */}
            <View style={styles.serviceActionsRow}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => deleteService(service.id)}
                style={styles.deleteBtn}
              >
                <Trash2 size={13} color="#71717a" />
                <Text style={styles.deleteBtnText}>Remove</Text>
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
    backgroundColor: '#09090b',
    paddingTop: Platform.OS === 'android' ? 30 : 0,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#18181b',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#f4f4f5',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 12,
    color: '#71717a',
    marginTop: 2,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  profileCard: {
    marginBottom: 20,
  },
  profileTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  profileLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  profileTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f4f4f5',
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#18181b',
  },
  editBtnText: {
    fontSize: 11,
    color: '#a1a1aa',
    fontWeight: '500',
  },
  companyName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f4f4f5',
    marginBottom: 4,
  },
  tagline: {
    fontSize: 13,
    color: '#a1a1aa',
    lineHeight: 18,
    marginBottom: 10,
  },
  profileMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#18181b',
  },
  profileMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  profileMetaText: {
    fontSize: 12,
    color: '#71717a',
  },
  editForm: {
    paddingTop: 6,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#f4f4f5',
  },
  sectionSub: {
    fontSize: 11,
    color: '#71717a',
    marginTop: 1,
  },
  addCard: {
    marginBottom: 16,
    borderColor: '#3b82f6',
  },
  addCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f4f4f5',
    marginBottom: 12,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
  },
  flex1: {
    flex: 1,
  },
  serviceCard: {
    marginBottom: 12,
  },
  serviceTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  serviceLeft: {
    flex: 1,
    marginRight: 10,
  },
  serviceTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#f4f4f5',
  },
  serviceCategory: {
    fontSize: 11,
    color: '#71717a',
    marginTop: 2,
  },
  serviceDesc: {
    fontSize: 12,
    color: '#a1a1aa',
    lineHeight: 16,
    marginBottom: 10,
  },
  serviceMetaRow: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#18181b',
    marginBottom: 10,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: '#10b981',
  },
  metaModel: {
    fontSize: 11,
    color: '#71717a',
    fontWeight: 'normal',
  },
  metaTurnaround: {
    fontSize: 12,
    color: '#a1a1aa',
  },
  deliverablesBox: {
    gap: 4,
    marginBottom: 10,
  },
  deliverablesHeader: {
    fontSize: 11,
    fontWeight: '600',
    color: '#71717a',
    marginBottom: 2,
  },
  deliverableItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  deliverableText: {
    fontSize: 12,
    color: '#d4d4d8',
  },
  serviceActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: 6,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  deleteBtnText: {
    fontSize: 11,
    color: '#71717a',
  },
});
