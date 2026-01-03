/* cspell:disable */
/**
 * @file app/admin/projects.tsx
 * @description Project Registry Management System.
 * @version 14.0.0 - Full Restoration with Web-Safe Upload Logic
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
import Animated, { FadeInDown } from 'react-native-reanimated';

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
  github_url: string | null;
  live_url: string | null;
  tags: string[];
  display_order: number;
  created_at: string;
}

/**
 * --- CUSTOM HOOKS ---
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
  Alert.alert('SYSTEM_EXIT', 'Confirm session termination?', [
    { text: 'ABORT', style: 'cancel' },
    {
      text: 'SIGN_OUT',
      style: 'destructive',
      onPress: async () => {
        try {
          setLoading(true);
          // Standard Supabase sign out
          const { error } = await supabase.auth.signOut();
          if (error) console.error("Sign out error:", error.message);
          
          // Redirect strictly to the homepage (root)
          router.replace('/'); 
        } catch (e) {
          // Hard reset fallback for web browsers to ensure you hit the landing page
          if (Platform.OS === 'web') {
            window.location.href = '/'; 
          } else {
            router.replace('/');
          }
        } finally {
          setLoading(false);
        }
      },
    },
  ]);
};

  const handleReorder = async (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= projects.length) return;
    setSaving(true);
    const itemA = projects[index];
    const itemB = projects[targetIdx];
    try {
      await supabase
        .from('projects')
        .update({ display_order: itemB.display_order })
        .eq('id', itemA.id);
      await supabase
        .from('projects')
        .update({ display_order: itemA.display_order })
        .eq('id', itemB.id);
      const updatedSet = [...projects];
      [updatedSet[index], updatedSet[targetIdx]] = [
        updatedSet[targetIdx],
        updatedSet[index],
      ];
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setProjects(updatedSet);
    } catch (e: any) {
      fetchRegistry();
    } finally {
      setSaving(false);
    }
  };

  const deleteProject = async (id: number) => {
    try {
      const { error } = await supabase.from('projects').delete().eq('id', id);
      if (error) throw error;
      fetchRegistry();
    } catch (e: any) {
      Alert.alert('Deletion Error', 'Failed to remove record');
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

/**
 * --- MAIN COMPONENT ---
 */
export default function ProjectsManagement() {
  const { width } = useWindowDimensions();
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

  const isDesktop = width > 1024;
  const isTablet = width > 768 && width <= 1024;
  const cardWidth = useMemo(
    () => (isDesktop ? '31.5%' : isTablet ? '48%' : '100%'),
    [isDesktop, isTablet]
  );

  const [modalVisible, setModalVisible] = useState(false);
  const [editingProject, setEditingProject] = useState<Partial<Project> | null>(
    null
  );
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
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
      base64: true, // Restore base64 for your working atob logic
    });

    if (!result.canceled && result.assets?.[0]) {
      setSaving(true);
      try {
        const asset = result.assets[0];
        setLocalPreview(asset.uri);

        const fileName = `public/projects/asset_${Date.now()}.jpg`;

        // Restoration of your "Perfect" Version 8.0.0 logic
        const raw = atob(asset.base64!);
        const uint8 = new Uint8Array(raw.length);
        for (let i = 0; i < raw.length; i++) uint8[i] = raw.charCodeAt(i);

        const { error: uploadError } = await supabase.storage
          .from('portfolio-images')
          .upload(fileName, uint8, {
            contentType: 'image/jpeg',
            upsert: true,
          });

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from('portfolio-images').getPublicUrl(fileName);

        setEditingProject((prev) => ({ ...prev!, image_url: publicUrl }));
      } catch (e: any) {
        Alert.alert('Upload Error', e.message);
      } finally {
        setSaving(false);
      }
    }
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
      const { error } = editingProject.id
        ? await supabase
            .from('projects')
            .update(payload)
            .eq('id', editingProject.id)
        : await supabase.from('projects').insert([payload]);

      if (error) throw error;
      setModalVisible(false);
      fetchRegistry();
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
        <Text style={styles.loadingLabel}>ACCESSING_REGISTRY...</Text>
      </View>
    );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={[styles.header, width <= 768 && styles.headerMobile]}>
        <View style={styles.headerInfo}>
          <View style={styles.iconContainer}>
            <Layers size={22} color={COLORS.primary} />
          </View>
          <View>
            <Text style={styles.title}>Work Registry</Text>
            <Text style={styles.subtitle}>
              {projects.length} System Records Active
            </Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => initiateProjectModal()}
            style={[styles.addBtn, width <= 768 && { flex: 1 }]}
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
        showsVerticalScrollIndicator={false}
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
        <View style={{ height: 120 }} />
      </ScrollView>

      <Modal visible={modalVisible} animationType="fade" transparent={true}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <GlassCard style={[styles.modalBox, isDesktop && { width: 680 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingProject?.id ? 'UPDATE' : 'NEW'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color="white" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View>
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
                    <View style={styles.fieldEmpty}>
                      <ImageIcon size={32} color={COLORS.textDim} />
                      <Text style={styles.fieldLabel}>Upload asset (16:9)</Text>
                    </View>
                  )}
                </TouchableOpacity>

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
                    style={[styles.input, styles.textArea]}
                    value={editingProject?.description}
                    onChangeText={(t) =>
                      setEditingProject({ ...editingProject!, description: t })
                    }
                    multiline
                    placeholder="Description"
                    placeholderTextColor="#444"
                  />
                  <View style={styles.row}>
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
                    style={[styles.commitBtn, saving && { opacity: 0.5 }]}
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
              </View>
            </ScrollView>
          </GlassCard>
        </KeyboardAvoidingView>
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
    marginTop: SPACING.m,
    fontSize: 12,
    fontWeight: 'bold',
  },
  scrollArea: { padding: SPACING.l },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.l,
    paddingBottom: SPACING.l,
    borderBottomWidth: 1,
    borderBottomColor: '#151515',
  },
  headerMobile: { flexDirection: 'column', alignItems: 'flex-start', gap: 24 },
  headerInfo: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(204,255,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(204,255,0,0.1)',
  },
  title: { color: COLORS.text, fontSize: 24, fontWeight: '800' },
  subtitle: { color: COLORS.textDim, fontSize: 10, fontWeight: '700' },
  headerActions: { flexDirection: 'row', gap: 12 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 16,
  },
  addBtnText: { color: 'black', fontWeight: '900', fontSize: 14 },
  logoutBtnSmall: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: 'rgba(255,50,50,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,50,50,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridItem: { padding: 8 },
  projectCard: {
    padding: 0,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#151515',
  },
  imageHost: {
    width: '100%',
    height: 180,
    backgroundColor: '#0d0d0d',
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
  cardContent: { padding: 22 },
  projectTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
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
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: '#151515',
  },
  utilBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#0d0d0d',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1a1a1a',
  },
  disabledBtn: { opacity: 0.3 },
  sep: { width: 1, height: 20, backgroundColor: '#222', marginHorizontal: 4 },
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
    padding: 20,
  },
  modalBox: {
    width: '100%',
    maxHeight: '90%',
    borderRadius: 32,
    padding: 28,
    borderWidth: 1,
    borderColor: '#1a1a1a',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 28,
  },
  modalTitle: { color: COLORS.text, fontSize: 20, fontWeight: '900' },
  imageField: {
    width: '100%',
    height: 180,
    borderRadius: 20,
    backgroundColor: '#0d0d0d',
    borderWidth: 1,
    borderColor: '#1a1a1a',
    borderStyle: 'dashed',
    overflow: 'hidden',
    marginBottom: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullPreview: { width: '100%', height: '100%' },
  fieldEmpty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  fieldLabel: { color: COLORS.textDim, fontSize: 12, fontWeight: '700' },
  formArea: { gap: 20 },
  row: { flexDirection: 'row', gap: 14 },
  input: {
    backgroundColor: '#0d0d0d',
    padding: 18,
    borderRadius: 18,
    color: COLORS.text,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#1a1a1a',
  },
  textArea: { height: 100, textAlignVertical: 'top' },
  commitBtn: {
    backgroundColor: COLORS.primary,
    height: 64,
    borderRadius: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 14,
    marginTop: 14,
  },
  commitText: { color: 'black', fontWeight: '900', fontSize: 16 },
});
