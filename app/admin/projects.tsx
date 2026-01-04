/* cspell:disable */
/**
 * @file app/admin/projects.tsx
 * @description Fully Restored Senior Registry Management System.
 * Fixes: Centered Desktop Modal, Smooth Reordering, and Full Feature Integrity.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
  ActivityIndicator,
  Platform,
  useWindowDimensions,
  RefreshControl,
  LayoutAnimation,
  UIManager,
  Modal,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { Image } from 'expo-image';
import { Stack, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import Animated, { FadeInDown, FadeIn, FadeOut } from 'react-native-reanimated';

/**
 * --- ICONOGRAPHY MODULE ---
 */
import {
  Plus,
  Layers,
  Trash2,
  Edit3,
  X,
  Save,
  ChevronUp,
  ChevronDown,
  ArrowUpRight,
  Image as ImageIcon,
  LogOut,
  Github,
  ExternalLink,
  CheckCircle,
} from 'lucide-react-native';

// --- SYSTEM CORE ---
import { supabase } from '../../lib/supabase';
import { COLORS, SPACING } from '../../constants/Theme';
import { GlassCard } from '../../components/GlassCard';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface Project {
  id: number;
  title: string;
  description: string;
  image_url: string | null;
  additional_images: string[];
  github_url: string | null;
  live_url: string | null;
  tags: string[];
  display_order: number;
  created_at: string;
}

/**
 * --- DATA ORCHESTRATION HOOK ---
 */
const useProjects = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const router = useRouter();

  const fetchRegistry = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('display_order', { ascending: true });
      if (error) throw error;
      setProjects(data || []);
    } catch (e: any) {
      console.error('[REGISTRY_SYNC_FAIL]:', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const handleLogout = async () => {
    const confirmed = Platform.OS === 'web' ? window.confirm('SIGNOUT') : true;
    if (confirmed) {
      try {
        setLoading(true);
        await supabase.auth.signOut();
        router.replace('/');
      } catch (e) {
        if (Platform.OS === 'web') window.location.href = '/';
        else router.replace('/');
      } finally {
        setLoading(false);
      }
    }
  };

  /**
   * REORDER LOGIC: Optimistic UI Update for Smooth Transitions
   */
  const handleReorder = async (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= projects.length) return;

    // 1. Prepare optimistic swap
    const updatedProjects = [...projects];
    const itemA = { ...updatedProjects[index] };
    const itemB = { ...updatedProjects[targetIdx] };

    // Swap display orders
    const tempOrder = itemA.display_order;
    itemA.display_order = itemB.display_order;
    itemB.display_order = tempOrder;

    updatedProjects[index] = itemB;
    updatedProjects[targetIdx] = itemA;

    // 2. Update local UI immediately
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setProjects(updatedProjects);

    // 3. Sync with Database
    try {
      await Promise.all([
        supabase
          .from('projects')
          .update({ display_order: itemA.display_order })
          .eq('id', itemA.id),
        supabase
          .from('projects')
          .update({ display_order: itemB.display_order })
          .eq('id', itemB.id),
      ]);
    } catch (e: any) {
      console.error('Reorder Sync Failed:', e.message);
      fetchRegistry(); // Rollback to DB truth
    }
  };

  const deleteProject = async (id: number) => {
    const confirmed =
      Platform.OS === 'web'
        ? window.confirm('CRITICAL_ACTION: Delete project permanently?')
        : true;

    if (confirmed) {
      try {
        const { error } = await supabase.from('projects').delete().eq('id', id);
        if (error) throw error;
        await fetchRegistry();
      } catch (e: any) {
        Alert.alert('Deletion Error', 'System failed to remove record');
      }
    }
  };

  useEffect(() => {
    fetchRegistry();
  }, [fetchRegistry]);

  return {
    loading,
    refreshing,
    saving,
    setSaving,
    projects,
    fetchRegistry,
    handleLogout,
    handleReorder,
    deleteProject,
  };
};

/**
 * --- SUB-COMPONENTS ---
 */
const ProjectCard = React.memo(
  ({
    project,
    index,
    isFirst,
    isLast,
    onReorder,
    onEdit,
    onDelete,
    cardWidth,
  }: any) => (
    <Animated.View
      entering={FadeInDown.delay(index * 100)}
      style={[styles.gridItem, { width: cardWidth }]}
    >
      <GlassCard style={styles.projectCard}>
        <View style={styles.imageHost}>
          {project.image_url ? (
            <Image
              source={{ uri: project.image_url }}
              style={styles.projectImage}
              contentFit="cover"
              transition={500}
            />
          ) : (
            <View style={styles.placeholderBox}>
              <ImageIcon color="#222" size={32} />
            </View>
          )}
          <View style={styles.orderTag}>
            <Text style={styles.orderLabel}>
              PROJECT {String(project.display_order).padStart(2, '0')}
            </Text>
          </View>
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.projectTitle} numberOfLines={1}>
            {project.title}
          </Text>
          <Text style={styles.projectDesc} numberOfLines={2}>
            {project.description}
          </Text>
          <View style={styles.tagStrip}>
            {project.tags?.slice(0, 3).map((tag: string, i: number) => (
              <View key={i} style={styles.tag}>
                <Text style={styles.tagText}>{tag.toUpperCase()}</Text>
              </View>
            ))}
          </View>
          <View style={styles.controlsRow}>
            <TouchableOpacity
              onPress={() => onReorder(index, 'up')}
              disabled={isFirst}
              style={[styles.utilBtn, isFirst && styles.disabledBtn]}
            >
              <ChevronUp size={16} color={isFirst ? '#333' : 'white'} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onReorder(index, 'down')}
              disabled={isLast}
              style={[styles.utilBtn, isLast && styles.disabledBtn]}
            >
              <ChevronDown size={16} color={isLast ? '#333' : 'white'} />
            </TouchableOpacity>
            <View style={styles.sep} />
            <TouchableOpacity
              onPress={() => onEdit(project)}
              style={styles.utilBtn}
            >
              <Edit3 size={16} color={COLORS.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onDelete(project.id)}
              style={styles.utilBtn}
            >
              <Trash2 size={16} color={COLORS.error} />
            </TouchableOpacity>
            <View style={{ flex: 1 }} />
            <View style={styles.externalBtn}>
              <ArrowUpRight size={14} color="black" />
            </View>
          </View>
        </View>
      </GlassCard>
    </Animated.View>
  )
);

ProjectCard.displayName = 'ProjectCard';

/**
 * --- MAIN COMPONENT ---
 */
export default function ProjectsManagement() {
  const { width, height: screenHeight } = useWindowDimensions();
  const {
    loading,
    refreshing,
    projects,
    fetchRegistry,
    handleLogout,
    handleReorder,
    deleteProject,
    saving,
    setSaving,
  } = useProjects();
  const router = useRouter();

  const isDesktop = width > 1024;
  const isMobile = width <= 768;
  const cardWidth = useMemo(
    () => (isDesktop ? '31.5%' : width > 768 ? '48%' : '100%'),
    [isDesktop, width]
  );

  const [modalVisible, setModalVisible] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [editingProject, setEditingProject] = useState<Partial<Project> | null>(
    null
  );
  useState<Partial<Project> | null>(null);
  const [tempTags, setTempTags] = useState<string>('');
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const initiateProjectModal = useCallback(
    (project: Project | null = null) => {
      if (project) {
        setEditingProject(project);
        setTempTags(project.tags ? project.tags.join(', ') : '');
        setLocalPreview(project.image_url);
      } else {
        setEditingProject({
          title: '',
          description: '',
          github_url: '',
          live_url: '',
          tags: [],
          additional_images: [],
          display_order: projects.length + 1,
        });
        setTempTags('');
        setLocalPreview(null);
      }
      setModalVisible(true);
    },
    [projects]
  );

  const handleAssetPipeline = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      base64: true,
    });
    if (!result.canceled && result.assets?.[0]) {
      setSaving(true);
      try {
        const asset = result.assets[0];
        setLocalPreview(asset.uri);
        const fileName = `public/projects/asset_${Date.now()}.jpg`;
        const raw = atob(asset.base64!);
        const uint8 = new Uint8Array(raw.length);
        for (let i = 0; i < raw.length; i++) uint8[i] = raw.charCodeAt(i);
        await supabase.storage
          .from('portfolio-images')
          .upload(fileName, uint8, { contentType: 'image/jpeg', upsert: true });
        const {
          data: { publicUrl },
        } = supabase.storage.from('portfolio-images').getPublicUrl(fileName);
        setEditingProject((prev) => ({ ...prev!, image_url: publicUrl }));
      } catch (e: any) {
        Alert.alert('Error', e.message);
      } finally {
        setSaving(false);
      }
    }
  };

  const handleGalleryUpload = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      base64: true,
    });
    if (!result.canceled && result.assets?.[0]) {
      setSaving(true);
      try {
        const asset = result.assets[0];
        const fileName = `public/projects/gallery/asset_${Date.now()}.jpg`;
        const raw = atob(asset.base64!);
        const uint8 = new Uint8Array(raw.length);
        for (let i = 0; i < raw.length; i++) uint8[i] = raw.charCodeAt(i);
        await supabase.storage
          .from('portfolio-images')
          .upload(fileName, uint8, { contentType: 'image/jpeg', upsert: true });
        const {
          data: { publicUrl },
        } = supabase.storage.from('portfolio-images').getPublicUrl(fileName);
        setEditingProject((prev) => ({
          ...prev!,
          additional_images: [...(prev?.additional_images || []), publicUrl],
        }));
      } catch (e: any) {
        Alert.alert('Error', e.message);
      } finally {
        setSaving(false);
      }
    }
  };

  const removeGalleryImage = (url: string) => {
    setEditingProject((prev) => ({
      ...prev!,
      additional_images: (prev?.additional_images || []).filter(
        (item) => item !== url
      ),
    }));
  };

  const commitProjectToCloud = async () => {
    if (!editingProject?.title || !editingProject?.description) {
      Alert.alert('Validation Error', 'Fields are mandatory.');
      return;
    }
    setSaving(true);
    const tagsArray = tempTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    const payload = { ...editingProject, tags: tagsArray };

    try {
      if (editingProject.id)
        await supabase
          .from('projects')
          .update(payload)
          .eq('id', editingProject.id);
      else await supabase.from('projects').insert([payload]);

      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setModalVisible(false);
        fetchRegistry();
      }, 1200);
    } catch (e: any) {
      Alert.alert('Sync Error', e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingLabel}>LOADING_REGISTRY...</Text>
      </View>
    );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={[styles.header, isMobile && styles.headerMobile]}>
        <View style={styles.headerInfo}>
          <Layers size={22} color={COLORS.primary} />
          <Text style={styles.title}>PROJECTS</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => initiateProjectModal()}
            style={styles.addBtn}
          >
            <Plus size={18} color="black" />
            <Text style={styles.addBtnText}>New Project</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleLogout}
            style={styles.logoutBtnSmall}
          >
            <LogOut size={18} color={COLORS.error} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollArea}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={fetchRegistry}
            tintColor={COLORS.primary}
          />
        }
      >
        <View style={styles.gridContainer}>
          {projects.map((item, index) => (
            <ProjectCard
              key={item.id}
              project={item}
              index={index}
              isFirst={index === 0}
              isLast={index === projects.length - 1}
              onReorder={handleReorder}
              onEdit={initiateProjectModal}
              onDelete={deleteProject}
              cardWidth={cardWidth}
            />
          ))}
        </View>
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          {/* FIX: Centering logic for desktop/mobile popup */}
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{
              width: '100%',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {showSuccess && (
              <Animated.View
                entering={FadeIn}
                exiting={FadeOut}
                style={styles.successOverlay}
              >
                <CheckCircle size={64} color={COLORS.primary} />
                <Text style={styles.successText}>SYSTEM SYNC SUCCESS</Text>
              </Animated.View>
            )}
            <View
              style={[
                styles.modalBox,
                {
                  maxHeight: screenHeight * 0.85,
                  width: isDesktop ? 680 : '100%',
                },
              ]}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>NEW PROJECT</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <X size={24} color="white" />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={{ flex: 1 }}
                showsVerticalScrollIndicator
                contentContainerStyle={{ paddingBottom: 40 }}
              >
                <TouchableOpacity
                  onPress={handleAssetPipeline}
                  style={styles.imageField}
                >
                  {localPreview ? (
                    <Image
                      source={{ uri: localPreview }}
                      style={styles.fullPreview}
                      contentFit="cover"
                    />
                  ) : (
                    <ImageIcon size={32} color="#444" />
                  )}
                </TouchableOpacity>

                <Text style={styles.sectionLabel}>Gallery Assets</Text>
                <View style={styles.galleryContainer}>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.galleryScrollContent}
                  >
                    <TouchableOpacity
                      onPress={handleGalleryUpload}
                      style={styles.galleryAddBtn}
                    >
                      <Plus size={20} color={COLORS.primary} />
                    </TouchableOpacity>
                    {(editingProject?.additional_images || []).map(
                      (url, idx) => (
                        <View key={idx} style={styles.galleryItem}>
                          <Image
                            source={{ uri: url }}
                            style={styles.galleryThumb}
                          />
                          <TouchableOpacity
                            onPress={() => removeGalleryImage(url)}
                            style={styles.galleryRemove}
                          >
                            <X size={10} color="white" />
                          </TouchableOpacity>
                        </View>
                      )
                    )}
                  </ScrollView>
                </View>

                <View style={styles.formArea}>
                  <TextInput
                    style={styles.input}
                    value={editingProject?.title}
                    onChangeText={(t) =>
                      setEditingProject({ ...editingProject!, title: t })
                    }
                    placeholder="Title"
                    placeholderTextColor="#444"
                  />
                  <TextInput
                    style={[
                      styles.input,
                      { height: 120, textAlignVertical: 'top' },
                    ]}
                    value={editingProject?.description}
                    onChangeText={(t) =>
                      setEditingProject({ ...editingProject!, description: t })
                    }
                    multiline
                    placeholder="Description"
                    placeholderTextColor="#444"
                  />

                  {/* DISPLAY ORDER & TAGS ROW */}
                  <View style={styles.formRow}>
                    <TextInput
                      style={[styles.input, { flex: 1 }]}
                      value={String(editingProject?.display_order || '')}
                      keyboardType="numeric"
                      onChangeText={(t) =>
                        setEditingProject({
                          ...editingProject!,
                          display_order: parseInt(t) || 0,
                        })
                      }
                      placeholder="Order"
                    />
                    <TextInput
                      style={[styles.input, { flex: 2 }]}
                      value={tempTags}
                      onChangeText={setTempTags}
                      placeholder="Tags (CSV)"
                      placeholderTextColor="#444"
                    />
                  </View>

                  <TextInput
                    style={styles.input}
                    value={editingProject?.github_url || ''}
                    onChangeText={(t) =>
                      setEditingProject({ ...editingProject!, github_url: t })
                    }
                    placeholder="GitHub URL"
                    placeholderTextColor="#444"
                  />

                  {/* RESTORED: LIVE URL FIELD */}
                  <TextInput
                    style={styles.input}
                    value={editingProject?.live_url || ''}
                    onChangeText={(t) =>
                      setEditingProject({ ...editingProject!, live_url: t })
                    }
                    placeholder="Live URL"
                    placeholderTextColor="#444"
                  />

                  <TouchableOpacity
                    onPress={commitProjectToCloud}
                    disabled={saving}
                    style={styles.commitBtn}
                  >
                    {saving ? (
                      <ActivityIndicator color="black" />
                    ) : (
                      <>
                        <Save size={20} color="black" />
                        <Text style={styles.commitText}>SAVE_CHANGES</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
  },
  center: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingLabel: {
    color: COLORS.textDim,
    marginTop: 20,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
  },
  scrollArea: { padding: SPACING.l },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: 15,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#151515',
  },
  headerMobile: { flexDirection: 'column', gap: 15 },
  headerInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: { color: 'white', fontSize: 22, fontWeight: '900' },
  headerActions: { flexDirection: 'row', gap: 10 },
  addBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addBtnText: { color: 'black', fontWeight: '900', fontSize: 12 },
  logoutBtnSmall: {
    padding: 10,
    backgroundColor: '#0d0d0d',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#151515',
  },
  gridItem: { padding: 4 },
  projectCard: {
    padding: 15,
    borderRadius: 20,
    backgroundColor: '#080808',
    borderWidth: 1,
    borderColor: '#151515',
  },
  imageHost: {
    width: '100%',
    height: 160,
    backgroundColor: '#0d0d0d',
    borderRadius: 15,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  projectImage: { width: '100%', height: '100%' },
  placeholderBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  orderTag: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#222',
  },
  orderLabel: { color: COLORS.primary, fontSize: 9, fontWeight: '900' },
  cardContent: { marginTop: 15 },
  projectTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 12,
  },
  projectDesc: {
    color: COLORS.textDim,
    fontSize: 13,
    lineHeight: 22,
    marginBottom: 18,
  },
  tagStrip: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 20,
  },
  tag: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1a1a1a',
  },
  tagText: { color: COLORS.textDim, fontSize: 9, fontWeight: '700' },
  controlsRow: { flexDirection: 'row', gap: 8 },
  utilBtn: {
    width: 36,
    height: 36,
    backgroundColor: '#0d0d0d',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1a1a1a',
  },
  disabledBtn: { opacity: 0.3 },
  sep: { width: 1, height: 20, backgroundColor: '#222', marginHorizontal: 2 },
  externalBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 15,
  },
  modalBox: {
    backgroundColor: '#080808',
    borderRadius: 30,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1a1a1a',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: { color: 'white', fontWeight: '900', fontSize: 18 },
  imageField: {
    width: '100%',
    height: 180,
    backgroundColor: '#0d0d0d',
    borderRadius: 20,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    overflow: 'hidden',
  },
  fullPreview: { width: '100%', height: '100%' },
  sectionLabel: {
    color: 'white',
    fontWeight: '800',
    fontSize: 12,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  galleryContainer: { marginBottom: 20, height: 100 },
  galleryScrollContent: { gap: 12, alignItems: 'center' },
  galleryAddBtn: {
    width: 60,
    height: 60,
    backgroundColor: '#0d0d0d',
    borderRadius: 12,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  galleryItem: {
    width: 60,
    height: 60,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 10,
  },
  galleryThumb: { width: '100%', height: '100%' },
  galleryRemove: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: COLORS.error,
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  formArea: { gap: 12 },
  formRow: { flexDirection: 'row', gap: 10 },
  input: {
    backgroundColor: '#0d0d0d',
    padding: 15,
    borderRadius: 14,
    color: 'white',
    borderWidth: 1,
    borderColor: '#1a1a1a',
  },
  commitBtn: {
    backgroundColor: COLORS.primary,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  successOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.8)',
    zIndex: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successText: {
    color: COLORS.primary,
    fontWeight: '900',
    marginTop: 16,
    letterSpacing: 2,
  },
  commitText: { color: 'black', fontWeight: '900' },
});
