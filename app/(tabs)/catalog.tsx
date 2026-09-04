import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Package,
  Plus,
  Trash2,
  Check,
  DollarSign,
  Clock,
  X,
  Sparkles,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useCatalogStore } from '../../src/store/useCatalogStore';
import { ServiceItem } from '../../src/types/catalog';

export default function CatalogScreen() {
  const router = useRouter();
  const {
    services,
    addService,
    deleteService,
    toggleServiceActive,
  } = useCatalogStore();

  const [isAddingService, setIsAddingService] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newTurnaround, setNewTurnaround] = useState('');
  const [newDescription, setNewDescription] = useState('');

  const handleCreateService = () => {
    if (!newTitle.trim()) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const parsedPrice = parseInt(newPrice.replace(/[^\d]/g, '') || '0', 10);

    addService({
      title: newTitle.trim(),
      category: newCategory.trim() || 'General Offerings',
      description: newDescription.trim() || 'Quality-assured trade offering with delivery guarantee.',
      pricingModel: 'fixed',
      price: parsedPrice,
      currency: 'USD',
      turnaroundTime: newTurnaround.trim() || '1–3 Days',
      keyDeliverables: [newTitle.trim(), 'Quality inspection', 'Customer handover'],
      portfolioLinks: [],
      isActive: true,
    });

    setNewTitle('');
    setNewCategory('');
    setNewPrice('');
    setNewTurnaround('');
    setNewDescription('');
    setIsAddingService(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleDelete = (id: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    deleteService(id);
  };

  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['top', 'bottom']}>
      {/* ── 1. Top Bar with Back Button ─────────────────────────────────────── */}
      <View className="px-6 py-3 border-b border-border bg-canvas flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          <Pressable
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/(tabs)/business');
              }
            }}
            className="w-8 h-8 -ml-1 items-center justify-center rounded-lg active:bg-surface-elevated"
            hitSlop={8}
          >
            <ArrowLeft size={20} color="#486581" strokeWidth={1.75} />
          </Pressable>

          <View>
            <Text className="font-geist-medium text-xs text-content-muted tracking-wide">
              Business · Offerings
            </Text>
            <Text className="font-geist-bold text-base text-content-heading">
              Products & Services
            </Text>
          </View>
        </View>

        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setIsAddingService(!isAddingService);
          }}
          className="flex-row items-center gap-1 bg-brand-navy px-3 py-1.5 rounded-lg active:opacity-90 shadow-xs"
        >
          {isAddingService ? (
            <>
              <X size={13} color="#FFFFFF" strokeWidth={2} />
              <Text className="font-geist-semibold text-xs text-white">Cancel</Text>
            </>
          ) : (
            <>
              <Plus size={13} color="#FFFFFF" strokeWidth={2.5} />
              <Text className="font-geist-semibold text-xs text-white">Add</Text>
            </>
          )}
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-6 pt-4 pb-24"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── 2. Screen Header & Description ──────────────────────────────────── */}
        <View className="mb-4">
          <Text className="font-geist-bold text-2xl leading-8 text-content-heading tracking-tight mb-1">
            Catalog & Rates
          </Text>
          <Text className="font-inter text-xs leading-5 text-content-secondary">
            Your products and capabilities used by AI to draft grounded quotes when buyers post inquiries in your trade groups.
          </Text>
        </View>

        {/* ── 3. Add Offering Form ────────────────────────────────────────────── */}
        {isAddingService && (
          <View className="bg-surface border border-brand-blue rounded-2xl p-4 mb-4 shadow-sm">
            <View className="flex-row items-center justify-between pb-2.5 mb-3 border-b border-border">
              <Text className="font-geist-bold text-sm text-brand-navy">
                New Product or Service
              </Text>
              <Pressable onPress={() => setIsAddingService(false)}>
                <X size={16} color="#829AB1" strokeWidth={2} />
              </Pressable>
            </View>

            <View className="gap-3">
              <View>
                <Text className="font-geist-medium text-xs text-content-secondary mb-1">
                  Title / Name *
                </Text>
                <TextInput
                  value={newTitle}
                  onChangeText={setNewTitle}
                  placeholder="e.g. 50kVA Perkins Generator Service"
                  placeholderTextColor="#829AB1"
                  className="font-inter text-xs text-content-primary bg-surface-elevated border border-border rounded-xl px-3 py-2"
                />
              </View>

              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Text className="font-geist-medium text-xs text-content-secondary mb-1">
                    Category
                  </Text>
                  <TextInput
                    value={newCategory}
                    onChangeText={setNewCategory}
                    placeholder="e.g. Industrial Equipment"
                    placeholderTextColor="#829AB1"
                    className="font-inter text-xs text-content-primary bg-surface-elevated border border-border rounded-xl px-3 py-2"
                  />
                </View>

                <View className="flex-1">
                  <Text className="font-geist-medium text-xs text-content-secondary mb-1">
                    Price (USD)
                  </Text>
                  <TextInput
                    value={newPrice}
                    onChangeText={setNewPrice}
                    placeholder="e.g. 450 (or 0 for quote)"
                    placeholderTextColor="#829AB1"
                    keyboardType="numeric"
                    className="font-inter text-xs text-content-primary bg-surface-elevated border border-border rounded-xl px-3 py-2"
                  />
                </View>
              </View>

              <View>
                <Text className="font-geist-medium text-xs text-content-secondary mb-1">
                  Turnaround / Availability
                </Text>
                <TextInput
                  value={newTurnaround}
                  onChangeText={setNewTurnaround}
                  placeholder="e.g. In Stock / 1–3 Business Days"
                  placeholderTextColor="#829AB1"
                  className="font-inter text-xs text-content-primary bg-surface-elevated border border-border rounded-xl px-3 py-2"
                />
              </View>

              <View>
                <Text className="font-geist-medium text-xs text-content-secondary mb-1">
                  Description / Deliverables
                </Text>
                <TextInput
                  value={newDescription}
                  onChangeText={setNewDescription}
                  placeholder="e.g. Full mechanical inspection, oil filter change, load test"
                  placeholderTextColor="#829AB1"
                  multiline
                  className="font-inter text-xs text-content-primary bg-surface-elevated border border-border rounded-xl px-3 py-2"
                />
              </View>

              <View className="flex-row gap-2 mt-1">
                <Pressable
                  onPress={() => setIsAddingService(false)}
                  className="flex-1 py-2.5 rounded-xl bg-surface-elevated border border-border items-center justify-center"
                >
                  <Text className="font-geist-semibold text-xs text-content-secondary">
                    Cancel
                  </Text>
                </Pressable>

                <Pressable
                  onPress={handleCreateService}
                  className="flex-1 py-2.5 rounded-xl bg-brand-navy items-center justify-center active:opacity-95"
                >
                  <Text className="font-geist-semibold text-xs text-white">
                    Save Offering
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}

        {/* ── 4. Offerings List ───────────────────────────────────────────────── */}
        {services.length === 0 ? (
          <View className="bg-surface border border-border rounded-2xl p-8 items-center justify-center my-6">
            <View className="w-12 h-12 rounded-2xl bg-surface-elevated border border-border items-center justify-center mb-3">
              <Package size={22} color="#486581" strokeWidth={1.75} />
            </View>
            <Text className="font-geist-bold text-base text-content-heading text-center mb-1">
              No Offerings in Catalog
            </Text>
            <Text className="font-inter text-xs text-content-secondary text-center leading-5 mb-4 max-w-[260px]">
              Add your trade products and services so Mikana's AI can ground quotes to your inventory.
            </Text>
            <Pressable
              onPress={() => setIsAddingService(true)}
              className="flex-row items-center gap-1.5 bg-brand-navy px-4 py-2.5 rounded-xl active:opacity-90 shadow-xs"
            >
              <Plus size={14} color="#FFFFFF" strokeWidth={2.5} />
              <Text className="font-geist-semibold text-xs text-white">
                Add First Offering
              </Text>
            </Pressable>
          </View>
        ) : (
          <View className="gap-2.5">
            <View className="flex-row items-center justify-between pb-1">
              <Text className="font-geist-semibold text-xs text-content-heading uppercase tracking-wider">
                Active Offerings ({services.length})
              </Text>
              <Text className="font-inter text-[11px] text-content-muted">
                Toggled ON = Monitored for RFQs
              </Text>
            </View>

            {services.map((item: ServiceItem) => (
              <View
                key={item.id}
                className="bg-surface border border-border rounded-2xl p-4 shadow-xs"
              >
                <View className="flex-row items-start justify-between mb-2">
                  <View className="flex-1 mr-3">
                    <Text className="font-geist-semibold text-sm text-content-heading leading-5 mb-1">
                      {item.title}
                    </Text>
                    <View className="flex-row items-center gap-1.5">
                      <View className="bg-surface-elevated border border-border px-2 py-0.5 rounded">
                        <Text className="font-geist-medium text-[10px] text-content-secondary">
                          {item.category}
                        </Text>
                      </View>
                      {item.isActive && (
                        <View className="bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                          <Text className="font-geist-semibold text-[10px] text-emerald-700">
                            Active
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>

                  <Switch
                    value={item.isActive}
                    onValueChange={() => {
                      Haptics.selectionAsync();
                      toggleServiceActive(item.id);
                    }}
                    trackColor={{ false: '#CBD5E1', true: '#1E56A0' }}
                    thumbColor="#FFFFFF"
                  />
                </View>

                {item.description ? (
                  <Text className="font-inter text-xs text-content-secondary leading-4 mb-3">
                    {item.description}
                  </Text>
                ) : null}

                <View className="flex-row items-center justify-between pt-2.5 border-t border-border">
                  <View className="flex-row items-center gap-3">
                    <View className="flex-row items-center gap-1 bg-surface-elevated px-2 py-1 rounded-lg">
                      <DollarSign size={12} color="#1E56A0" strokeWidth={2} />
                      <Text className="font-geist-semibold text-xs text-brand-navy">
                        {item.price > 0 ? `$${item.price.toLocaleString()}` : 'Custom Quote'}
                      </Text>
                    </View>

                    {item.turnaroundTime ? (
                      <View className="flex-row items-center gap-1">
                        <Clock size={11} color="#829AB1" strokeWidth={1.75} />
                        <Text className="font-inter text-[11px] text-content-muted">
                          {item.turnaroundTime}
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  <Pressable
                    onPress={() => handleDelete(item.id)}
                    className="p-1.5 rounded-lg active:bg-rose-50"
                    hitSlop={8}
                  >
                    <Trash2 size={14} color="#E02424" strokeWidth={1.75} />
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
